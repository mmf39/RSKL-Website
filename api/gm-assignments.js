const https = require("https");

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const ASSIGNMENTS_TABLE = "gm_assignments";

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", () => resolve(""));
  });
}

function requestJson(method, urlString, headers = {}, body = "") {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const req = https.request(
      {
        method,
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        headers: {
          ...headers,
          ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          const status = res.statusCode || 200;
          if (status >= 400) {
            reject(new Error(`Supabase error ${status}: ${data.slice(0, 240)}`));
            return;
          }
          try {
            resolve(data ? JSON.parse(data) : []);
          } catch (_) {
            resolve([]);
          }
        });
      }
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function serviceHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...extra,
  };
}

function roleFlags(role) {
  const cleanRole = String(role || "").trim().toLowerCase();
  const isCommish = ["commish", "commissioner", "admin"].includes(cleanRole);
  return {
    role: cleanRole || "gm",
    is_gm: cleanRole === "gm" || isCommish,
    is_commish: isCommish,
  };
}

async function findUserIdByEmail(email) {
  const target = String(email || "").trim().toLowerCase();
  if (!target) return "";
  const payload = await requestJson(
    "GET",
    `${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`,
    serviceHeaders({ Accept: "application/json" })
  );
  const users = Array.isArray(payload?.users) ? payload.users : Array.isArray(payload) ? payload : [];
  const match = users.find((user) => String(user?.email || "").trim().toLowerCase() === target);
  return String(match?.id || "").trim();
}

async function assertCommish(req) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    const error = new Error("Missing Supabase server configuration.");
    error.status = 500;
    throw error;
  }
  const authHeader = String(req.headers.authorization || "").trim();
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    const error = new Error("Commissioner authorization required.");
    error.status = 401;
    throw error;
  }

  const user = await requestJson(
    "GET",
    `${SUPABASE_URL}/auth/v1/user?apikey=${encodeURIComponent(SUPABASE_ANON_KEY)}`,
    {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    }
  );
  const userId = String(user?.id || "").trim();
  if (!userId) {
    const error = new Error("Invalid commissioner session.");
    error.status = 401;
    throw error;
  }

  const rows = await requestJson(
    "GET",
    `${SUPABASE_URL}/rest/v1/${ASSIGNMENTS_TABLE}?select=user_id,role,is_commish&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
    serviceHeaders({ Accept: "application/json" })
  );
  const row = Array.isArray(rows) ? rows[0] : null;
  const role = String(row?.role || "").trim().toLowerCase();
  const isCommish =
    row?.is_commish === true ||
    role === "commish" ||
    role === "commissioner" ||
    role === "admin";
  if (!isCommish) {
    const error = new Error("Only the commissioner can update user roles.");
    error.status = 403;
    throw error;
  }
}

function normalizeAssignment(row) {
  const role = String(row?.role || "").trim().toLowerCase();
  return {
    user_id: String(row?.user_id || "").trim(),
    team: String(row?.team || "").trim(),
    role,
    is_gm: row?.is_gm === true,
    is_commish: row?.is_commish === true || ["commish", "commissioner", "admin"].includes(role),
  };
}

async function fetchAssignments() {
  const rows = await requestJson(
    "GET",
    `${SUPABASE_URL}/rest/v1/${ASSIGNMENTS_TABLE}?select=user_id,team,role,is_gm,is_commish&order=role.asc`,
    serviceHeaders({ Accept: "application/json" })
  );
  return (Array.isArray(rows) ? rows : []).map(normalizeAssignment);
}

async function upsertAssignment(payload) {
  const userInput = String(payload?.user_id || payload?.email || "").trim();
  const userId = userInput.includes("@") ? await findUserIdByEmail(userInput) : userInput;
  const team = String(payload?.team || "").trim();
  const flags = roleFlags(payload?.role || "gm");
  if (!userId) {
    const error = new Error(userInput.includes("@") ? "No Supabase user found with that email." : "User ID is required.");
    error.status = 400;
    throw error;
  }
  const rows = await requestJson(
    "POST",
    `${SUPABASE_URL}/rest/v1/${ASSIGNMENTS_TABLE}?on_conflict=user_id`,
    serviceHeaders({ Prefer: "resolution=merge-duplicates,return=representation" }),
    JSON.stringify([
      {
        user_id: userId,
        team,
        ...flags,
      },
    ])
  );
  return normalizeAssignment(Array.isArray(rows) ? rows[0] : null);
}

module.exports = async (req, res) => {
  try {
    await assertCommish(req);
    if (req.method === "GET") {
      sendJson(res, 200, { ok: true, assignments: await fetchAssignments() });
      return;
    }
    if (req.method === "POST") {
      let payload = req.body;
      if (!payload || typeof payload !== "object") {
        payload = JSON.parse((await readBody(req)) || "{}");
      }
      const assignment = await upsertAssignment(payload);
      sendJson(res, 200, { ok: true, assignment, assignments: await fetchAssignments() });
      return;
    }
    sendJson(res, 405, { ok: false, message: "Method not allowed." });
  } catch (error) {
    sendJson(res, error.status || 500, { ok: false, message: error.message });
  }
};
