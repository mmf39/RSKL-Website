const https = require("https");

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const TABLE = "bracket_challenge_entries";

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
          } catch (_error) {
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

function requireSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    const error = new Error("Missing Supabase server config.");
    error.status = 500;
    throw error;
  }
}

function normalizeHandle(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.startsWith("@") ? raw.slice(0, 40) : `@${raw.slice(0, 39)}`;
}

function sanitizeEntry(row) {
  const picks = row?.picks && typeof row.picks === "object" ? row.picks : {};
  return {
    id: row?.id || "",
    season: String(row?.season || "c2s3-playoffs").trim(),
    handle: normalizeHandle(row?.handle || row?.user_handle),
    picks,
    champion: String(row?.champion || picks.championship || "").trim(),
    score: Number(row?.score || 0),
    created_at: row?.created_at || "",
    updated_at: row?.updated_at || "",
  };
}

function dedupeEntries(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = `${entry.season}:${entry.handle}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function validatePayload(payload) {
  const handle = normalizeHandle(payload?.handle || payload?.user_handle);
  const picks = payload?.picks && typeof payload.picks === "object" ? payload.picks : {};
  const required = ["northWildCard", "lockedWildCard", "northFinal", "lockedFinal", "championship"];
  if (!handle) {
    const error = new Error("Handle is required.");
    error.status = 400;
    throw error;
  }
  required.forEach((key) => {
    if (!String(picks[key] || "").trim()) {
      const error = new Error("Every bracket pick is required.");
      error.status = 400;
      throw error;
    }
  });
  return {
    season: "c2s3-playoffs",
    handle,
    picks,
    champion: String(payload?.champion || picks.championship || "").trim(),
    score: 0,
    updated_at: new Date().toISOString(),
  };
}

async function fetchEntries() {
  requireSupabase();
  const rows = await requestJson(
    "GET",
    `${SUPABASE_URL}/rest/v1/${TABLE}?select=id,season,handle,picks,champion,score,created_at,updated_at&season=eq.c2s3-playoffs&order=created_at.desc&limit=100`,
    supabaseHeaders({ Accept: "application/json" })
  );
  return Array.isArray(rows) ? dedupeEntries(rows.map(sanitizeEntry)) : [];
}

async function fetchExistingEntry(entry) {
  const rows = await requestJson(
    "GET",
    `${SUPABASE_URL}/rest/v1/${TABLE}?select=id&season=eq.${encodeURIComponent(entry.season)}&handle=eq.${encodeURIComponent(entry.handle)}&order=created_at.desc&limit=1`,
    supabaseHeaders({ Accept: "application/json" })
  );
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function saveEntry(entry) {
  const existing = await fetchExistingEntry(entry);
  if (existing?.id) {
    await requestJson(
      "PATCH",
      `${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${encodeURIComponent(existing.id)}`,
      supabaseHeaders({ Prefer: "return=representation" }),
      JSON.stringify({
        picks: entry.picks,
        champion: entry.champion,
        score: entry.score,
        updated_at: entry.updated_at,
      })
    );
    return;
  }
  await requestJson(
    "POST",
    `${SUPABASE_URL}/rest/v1/${TABLE}`,
    supabaseHeaders({ Prefer: "return=representation" }),
    JSON.stringify([entry])
  );
}

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const entries = await fetchEntries();
      sendJson(res, 200, { ok: true, entries });
      return;
    }

    if (req.method !== "POST") {
      sendJson(res, 405, { ok: false, message: "Method not allowed." });
      return;
    }

    requireSupabase();
    const raw = await readBody(req);
    const payload = raw ? JSON.parse(raw) : {};
    const entry = validatePayload(payload);
    await saveEntry(entry);
    const entries = await fetchEntries();
    sendJson(res, 200, { ok: true, entries });
  } catch (error) {
    sendJson(res, error.status || 500, {
      ok: false,
      message: error.message || "Bracket challenge unavailable.",
      entries: [],
    });
  }
};
