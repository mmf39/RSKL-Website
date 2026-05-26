const fs = require("fs");
const https = require("https");
const path = require("path");

const FILE_PATH = path.join(process.cwd(), "assets", "data", "badge-overrides.json");
const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

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
            reject(new Error(`Request failed (${status})`));
            return;
          }
          try {
            resolve(data ? JSON.parse(data) : null);
          } catch (_) {
            resolve(null);
          }
        });
      }
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function assertCommish(req) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase server configuration.");
  }
  const authHeader = String(req.headers.authorization || "").trim();
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    const error = new Error("Commissioner authorization required.");
    error.status = 401;
    throw error;
  }

  const user = await requestJson("GET", `${SUPABASE_URL}/auth/v1/user?apikey=${encodeURIComponent(SUPABASE_ANON_KEY)}`, {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
  });
  const userId = String(user?.id || "").trim();
  if (!userId) {
    const error = new Error("Invalid commissioner session.");
    error.status = 401;
    throw error;
  }

  const rows = await requestJson(
    "GET",
    `${SUPABASE_URL}/rest/v1/gm_assignments?select=user_id,role,is_commish&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
    {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    }
  );
  const row = Array.isArray(rows) ? rows[0] : null;
  const role = String(row?.role || "").trim().toLowerCase();
  const isCommish = row?.is_commish === true || role === "commish" || role === "commissioner" || role === "admin";
  if (!isCommish) {
    const error = new Error("Only the commissioner can access this page.");
    error.status = 403;
    throw error;
  }
}

function readBadgeOverrides() {
  return JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
}

function writeBadgeOverrides(data) {
  fs.writeFileSync(FILE_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

module.exports = async (req, res) => {
  try {
    await assertCommish(req);
  } catch (error) {
    sendJson(res, error.status || 403, { ok: false, message: error.message });
    return;
  }

  if (req.method === "GET") {
    try {
      sendJson(res, 200, readBadgeOverrides());
    } catch (error) {
      sendJson(res, 500, { ok: false, message: error.message });
    }
    return;
  }

  if (req.method === "POST") {
    try {
      let payload = req.body;
      if (!payload || typeof payload !== "object") {
        payload = JSON.parse((await readBody(req)) || "{}");
      }
      writeBadgeOverrides(payload);
      sendJson(res, 200, { ok: true, data: readBadgeOverrides() });
    } catch (error) {
      sendJson(res, 500, { ok: false, message: error.message });
    }
    return;
  }

  sendJson(res, 405, { ok: false, message: "Method not allowed." });
};
