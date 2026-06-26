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
    content_type: String(row?.content_type || "article").trim(),
    game_key: String(row?.game_key || "").trim(),
    season: String(row?.season || "").trim(),
    date_token: String(row?.date_token || "").trim(),
    team1: String(row?.team1 || "").trim(),
    team2: String(row?.team2 || "").trim(),
    status: String(row?.status || "published").trim(),
    created_at: row?.created_at || "",
    updated_at: row?.updated_at || "",
  };
}

function validateArticle(payload) {
  const allowedTypes = new Set(["article", "game_preview", "game_summary"]);
  const contentType = allowedTypes.has(String(payload?.content_type || "").trim())
    ? String(payload.content_type).trim()
    : "article";
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
    content_type: contentType,
    game_key: String(payload?.game_key || "").trim(),
    season: String(payload?.season || "").trim(),
    date_token: String(payload?.date_token || "").trim(),
    team1: String(payload?.team1 || "").trim(),
    team2: String(payload?.team2 || "").trim(),
    status: "published",
  };
}

function getSeasonQueryValues(season) {
  const clean = String(season || "").trim();
  if (!clean) return [];
  const baseMatch = clean.match(/^(c\d+s\d+)(?:-(regular|playoffs|post))?$/i);
  if (!baseMatch) return [clean];
  const base = baseMatch[1].toLowerCase();
  return Array.from(new Set([clean, base, `${base}-regular`, `${base}-playoffs`, `${base}-post`]));
}

async function assertArticleWriter(req) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    const error = new Error("Missing Supabase server configuration.");
    error.status = 500;
    throw error;
  }
  const authHeader = String(req.headers.authorization || "").trim();
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    const error = new Error("Reporter authorization required.");
    error.status = 401;
    throw error;
  }

  const user = await requestJson("GET", `${SUPABASE_URL}/auth/v1/user?apikey=${encodeURIComponent(SUPABASE_ANON_KEY)}`, {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
  });
  const userId = String(user?.id || "").trim();
  if (!userId) {
    const error = new Error("Invalid reporter session.");
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
  const isReporter = role === "reporter" || role === "media" || role === "writer";
  if (!isCommish && !isReporter) {
    const error = new Error("Only commissioners and reporters can publish articles.");
    error.status = 403;
    throw error;
  }
}

async function fetchArticles(options = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  const limit = Number(options.limit || 12);
  const contentType = String(options.contentType || "article").trim();
  const season = String(options.season || "").trim();
  const gameKey = String(options.gameKey || "").trim();
  const id = String(options.id || "").trim();
  const params = new URLSearchParams();
  params.set("select", "id,title,summary,body,author,content_type,game_key,season,date_token,team1,team2,status,created_at,updated_at");
  params.set("status", "eq.published");
  if (id) {
    params.set("id", `eq.${id}`);
  } else {
    params.set("content_type", `eq.${contentType}`);
  }
  if (season) {
    const seasonValues = getSeasonQueryValues(season);
    params.set("season", seasonValues.length > 1 ? `in.(${seasonValues.join(",")})` : `eq.${season}`);
  }
  if (gameKey) params.set("game_key", `eq.${gameKey}`);
  params.set("order", "created_at.desc");
  params.set("limit", String(limit));
  const rows = await requestJson(
    "GET",
    `${SUPABASE_URL}/rest/v1/${ARTICLES_TABLE}?${params.toString()}`,
    supabaseHeaders({ Accept: "application/json" })
  );
  return Array.isArray(rows) ? rows.map(sanitizeArticle) : [];
}

async function fetchLegacyArticles(limit = 12) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  const params = new URLSearchParams();
  params.set("select", "id,title,summary,body,author,status,created_at,updated_at");
  params.set("status", "eq.published");
  params.set("order", "created_at.desc");
  params.set("limit", String(Number(limit || 12)));
  const rows = await requestJson(
    "GET",
    `${SUPABASE_URL}/rest/v1/${ARTICLES_TABLE}?${params.toString()}`,
    supabaseHeaders({ Accept: "application/json" })
  );
  return Array.isArray(rows) ? rows.map(sanitizeArticle) : [];
}

module.exports = async (req, res) => {
  if (req.method === "GET") {
    try {
      const parsedUrl = new URL(req.url || "/api/articles", "http://localhost");
      const query = { ...Object.fromEntries(parsedUrl.searchParams.entries()), ...(req.query || {}) };
      const contentType =
        query.type === "game_preview" || query.type === "game_summary"
          ? query.type
          : query.content === "game"
          ? "game_preview"
          : "article";
      let articles = [];
      try {
        articles = await fetchArticles({
          limit: query.content === "game" ? 200 : 12,
          contentType,
          season: query.season || "",
          gameKey: query.game_key || "",
          id: query.id || "",
        });
      } catch (error) {
        if (query.content === "game") throw error;
        articles = await fetchLegacyArticles(12);
      }
      if (!articles.length && query.content !== "game") {
        articles = await fetchLegacyArticles(12).catch(() => []);
      }
      if (query.content === "game") {
        const summaries = await fetchArticles({
          limit: 200,
          contentType: "game_summary",
          season: query.season || "",
          gameKey: query.game_key || "",
        });
        sendJson(res, 200, { ok: true, articles: [...articles, ...summaries] });
        return;
      }
      sendJson(res, 200, { ok: true, articles });
    } catch (error) {
      sendJson(res, 500, { ok: false, message: error.message, articles: [] });
    }
    return;
  }

  if (req.method === "POST") {
    try {
      await assertArticleWriter(req);
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
      const articles = await fetchArticles({ limit: 12, contentType: article.content_type });
      sendJson(res, 200, { ok: true, articles });
    } catch (error) {
      sendJson(res, error.status || 500, { ok: false, message: error.message });
    }
    return;
  }

  sendJson(res, 405, { ok: false, message: "Method not allowed." });
};
