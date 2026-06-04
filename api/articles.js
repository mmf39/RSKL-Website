const https = require("https");

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const ARTICLES_TABLE = "news_articles";

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

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...extra,
  };
}

function sanitizeArticle(row) {
  return {
    id: row?.id || "",
    title: String(row?.title || "").trim(),
    summary: String(row?.summary || "").trim(),
    body: String(row?.body || "").trim(),
    author: String(row?.author || "Commissioner").trim(),
    status: String(row?.status || "published").trim(),
    created_at: row?.created_at || "",
    updated_at: row?.updated_at || "",
  };
}

function validateArticle(payload) {
  const title = String(payload?.title || "").trim();
  const summary = String(payload?.summary || "").trim();
  const body = String(payload?.body || "").trim();
  const author = String(payload?.author || "Commissioner").trim() || "Commissioner";
  if (!title || !body) {
    const error = new Error("Headline and article text are required.");
    error.status = 400;
    throw error;
  }
  return {
    title: title.slice(0, 120),
    summary: summary.slice(0, 260),
    body,
    author: author.slice(0, 60),
    status: "published",
  };
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
    supabaseHeaders({ Accept: "application/json" })
  );
  const row = Array.isArray(rows) ? rows[0] : null;
  const role = String(row?.role || "").trim().toLowerCase();
  const isCommish = row?.is_commish === true || role === "commish" || role === "commissioner" || role === "admin";
  if (!isCommish) {
    const error = new Error("Only the commissioner can publish articles.");
    error.status = 403;
    throw error;
  }
}

async function fetchArticles(limit = 12) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  const rows = await requestJson(
    "GET",
    `${SUPABASE_URL}/rest/v1/${ARTICLES_TABLE}?select=id,title,summary,body,author,status,created_at,updated_at&status=eq.published&order=created_at.desc&limit=${limit}`,
    supabaseHeaders({ Accept: "application/json" })
  );
  return Array.isArray(rows) ? rows.map(sanitizeArticle) : [];
}

module.exports = async (req, res) => {
  if (req.method === "GET") {
    try {
      const articles = await fetchArticles(12);
      sendJson(res, 200, { ok: true, articles });
    } catch (error) {
      sendJson(res, 500, { ok: false, message: error.message, articles: [] });
    }
    return;
  }

  if (req.method === "POST") {
    try {
      await assertCommish(req);
      let payload = req.body;
      if (!payload || typeof payload !== "object") {
        payload = JSON.parse((await readBody(req)) || "{}");
      }
      const article = validateArticle(payload);
      await requestJson(
        "POST",
        `${SUPABASE_URL}/rest/v1/${ARTICLES_TABLE}`,
        supabaseHeaders({ Prefer: "return=representation" }),
        JSON.stringify([article])
      );
      const articles = await fetchArticles(12);
      sendJson(res, 200, { ok: true, articles });
    } catch (error) {
      sendJson(res, error.status || 500, { ok: false, message: error.message });
    }
    return;
  }

  sendJson(res, 405, { ok: false, message: "Method not allowed." });
};
