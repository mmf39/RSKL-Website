const fs = require("fs");
const https = require("https");
const path = require("path");

const FILE_PATH = path.join(process.cwd(), "assets", "data", "badge-overrides.json");
const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DEFAULT_BADGE_OVERRIDES = {
  risingStars: [],
  rookie: {},
  allStar: {},
};

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

function withSupabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...extra,
  };
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

function sanitizeBadgeOverrides(data) {
  return {
    risingStars: Array.isArray(data?.risingStars) ? data.risingStars : [],
    rookie: data?.rookie && typeof data.rookie === "object" ? data.rookie : {},
    allStar: data?.allStar && typeof data.allStar === "object" ? data.allStar : {},
  };
}

function mergeBadgeLists(base = DEFAULT_BADGE_OVERRIDES, override = {}) {
  const safeBase = sanitizeBadgeOverrides(base);
  const safeOverride = sanitizeBadgeOverrides(override);
  const mergeArray = (left, right) => Array.from(new Set([...(left || []), ...(right || [])]));
  const mergeSeasonMap = (left, right) => {
    const output = { ...left };
    Object.keys(right || {}).forEach((seasonKey) => {
      output[seasonKey] = mergeArray(output[seasonKey], right[seasonKey]);
    });
    return output;
  };

  return {
    risingStars: mergeArray(safeBase.risingStars, safeOverride.risingStars),
    rookie: mergeSeasonMap(safeBase.rookie, safeOverride.rookie),
    allStar: mergeSeasonMap(safeBase.allStar, safeOverride.allStar),
  };
}

async function readBadgeOverridesFromSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  const rows = await requestJson(
    "GET",
    `${SUPABASE_URL}/rest/v1/badge_overrides?select=data&id=eq.global&limit=1`,
    withSupabaseHeaders({ Accept: "application/json" })
  );
  const row = Array.isArray(rows) ? rows[0] : null;
  return row?.data ? sanitizeBadgeOverrides(row.data) : null;
}

function rookieRowsToBadgeOverrides(rows) {
  const rookie = {};
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const rawSeason = String(row?.season || "").trim().toLowerCase();
    const season = /^c\d+s\d+$/.test(rawSeason) ? `${rawSeason}-regular` : rawSeason;
    const handle = String(row?.player_handle || row?.player_name || "").trim();
    if (!season || !handle) return;
    if (!rookie[season]) rookie[season] = [];
    rookie[season].push(handle);
  });
  return { rookie };
}

function seasonPlayerRowsToBadgeMap(rows, key) {
  const output = {};
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const rawSeason = String(row?.season || "").trim().toLowerCase();
    const season = /^c\d+s\d+$/.test(rawSeason) ? `${rawSeason}-regular` : rawSeason;
    const handle = String(row?.player_handle || row?.player_name || "").trim();
    if (!season || !handle) return;
    if (!output[season]) output[season] = [];
    output[season].push(handle);
  });
  return { [key]: output };
}

function playerRowsToRisingStars(rows) {
  return {
    risingStars: (Array.isArray(rows) ? rows : [])
      .map((row) => String(row?.player_handle || row?.player_name || "").trim())
      .filter(Boolean),
  };
}

async function readRookiePlayersFromSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  const rows = await requestJson(
    "GET",
    `${SUPABASE_URL}/rest/v1/rookie_players?select=season,player_handle,player_name&order=season.asc,created_at.asc`,
    withSupabaseHeaders({ Accept: "application/json" })
  );
  return rookieRowsToBadgeOverrides(rows);
}

async function readAllStarPlayersFromSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  const rows = await requestJson(
    "GET",
    `${SUPABASE_URL}/rest/v1/all_star_players?select=season,player_handle,player_name&order=season.asc,created_at.asc`,
    withSupabaseHeaders({ Accept: "application/json" })
  );
  return seasonPlayerRowsToBadgeMap(rows, "allStar");
}

async function readRisingStarsPlayersFromSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  const rows = await requestJson(
    "GET",
    `${SUPABASE_URL}/rest/v1/rising_stars_players?select=season,player_handle,player_name&order=season.asc,created_at.asc`,
    withSupabaseHeaders({ Accept: "application/json" })
  );
  return playerRowsToRisingStars(rows);
}

async function writeBadgeOverrides(data) {
  const safeData = sanitizeBadgeOverrides(data);
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    const rows = await requestJson(
      "POST",
      `${SUPABASE_URL}/rest/v1/badge_overrides?on_conflict=id`,
      withSupabaseHeaders({ Prefer: "resolution=merge-duplicates,return=representation" }),
      JSON.stringify([{ id: "global", data: safeData }])
    );
    const row = Array.isArray(rows) ? rows[0] : null;
    return sanitizeBadgeOverrides(row?.data || safeData);
  }
  fs.writeFileSync(FILE_PATH, `${JSON.stringify(safeData, null, 2)}\n`, "utf8");
  return safeData;
}

module.exports = async (req, res) => {
  if (req.method === "GET") {
    try {
      const localData = readBadgeOverrides() || DEFAULT_BADGE_OVERRIDES;
      let supabaseData = null;
      try {
        supabaseData = await readBadgeOverridesFromSupabase();
      } catch (_) {
        supabaseData = null;
      }
      let rookieTableData = null;
      try {
        rookieTableData = await readRookiePlayersFromSupabase();
      } catch (_) {
        rookieTableData = null;
      }
      let allStarTableData = null;
      try {
        allStarTableData = await readAllStarPlayersFromSupabase();
      } catch (_) {
        allStarTableData = null;
      }
      let risingStarsTableData = null;
      try {
        risingStarsTableData = await readRisingStarsPlayersFromSupabase();
      } catch (_) {
        risingStarsTableData = null;
      }
      const data = [supabaseData, rookieTableData, allStarTableData, risingStarsTableData].reduce(
        (merged, next) => mergeBadgeLists(merged, next || {}),
        localData
      );
      sendJson(res, 200, sanitizeBadgeOverrides(data));
    } catch (error) {
      sendJson(res, 500, { ok: false, message: error.message });
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
      const saved = await writeBadgeOverrides(payload);
      sendJson(res, 200, { ok: true, data: saved });
    } catch (error) {
      sendJson(res, error.status || 500, { ok: false, message: error.message });
    }
    return;
  }

  sendJson(res, 405, { ok: false, message: "Method not allowed." });
};
