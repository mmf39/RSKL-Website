const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const {
  LIVE_SCORING_URL,
  parseCSV: parseSharedCsv,
  normalizeTeamName,
  buildLiveGameSnapshotPayloads,
  getEasternSnapshotBucket,
} = require("./game-flow-shared");

const PORT = process.env.PORT || 5173;
const ROOT = __dirname;

const STANDINGS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=2115060088&single=true&output=csv";
const TEAMS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=847666124&single=true&output=csv";
const DRAFT_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=894447035&single=true&output=csv";
const TRANSACTIONS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=1782609175&single=true&output=csv";
const C2S2_REGULAR_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5rm7eqJcdWIX78vETTfsf40lMpXzvJCSdG8dGdkFBbXXC2zEzidcpGTLUzqcZQPTTVquYuLCeXoPL/pub?gid=346158705&single=true&output=csv";
const C2S3_STATS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5rm7eqJcdWIX78vETTfsf40lMpXzvJCSdG8dGdkFBbXXC2zEzidcpGTLUzqcZQPTTVquYuLCeXoPL/pub?gid=1201938197&single=true&output=csv";
const C2S3_PLAYOFF_PLAYER_STATS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=2091759853&single=true&output=csv";
const C2S3_PLAYOFF_BOXSCORE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=321367914&single=true&output=csv";
const LIVE_ROSTER_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=0&single=true&output=csv";
const PLAYER_PROFILE_SCRIPT_URL =
  process.env.PLAYER_PROFILE_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbwLH2qYcWceJucuI559OzLNjk9Bh8WjQgBKZJttcrBwS13gTY1GtnJi9T5eAb0jJeSwbA/exec";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const BADGE_OVERRIDES_PATH = path.join(ROOT, "assets", "data", "badge-overrides.json");
const DEFAULT_BADGE_OVERRIDES = {
  risingStars: [],
  rookie: {},
  allStar: {},
};
const SHEETS = {
  archive:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5rm7eqJcdWIX78vETTfsf40lMpXzvJCSdG8dGdkFBbXXC2zEzidcpGTLUzqcZQPTTVquYuLCeXoPL/pub?gid=1077518539&single=true&output=csv",
  "c2s2-regular": C2S2_REGULAR_URL,
  awards:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5rm7eqJcdWIX78vETTfsf40lMpXzvJCSdG8dGdkFBbXXC2zEzidcpGTLUzqcZQPTTVquYuLCeXoPL/pub?gid=1527593475&single=true&output=csv",
  contracts:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTr6cIsrgXTBa6ndhiGle_qOOUWgzH3KDUgPTANYDG2O_9u3_zdhOUGdzgz9yzMnqs1dgv54qg0TudU/pub?gid=959105096&single=true&output=csv",
  boxscore: C2S3_STATS_URL,
  "boxscore-playoffs": C2S3_PLAYOFF_BOXSCORE_URL,
  "c2s3-draft": C2S3_STATS_URL,
  "c2s4-draft": DRAFT_URL,
  draft: DRAFT_URL,
  "draft-capital":
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=1378560378&single=true&output=csv",
  "live-scoring":
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=1486072019&single=true&output=csv",
  "player-stats": C2S3_STATS_URL,
  "player-stats-playoffs": C2S3_PLAYOFF_PLAYER_STATS_URL,
  roster: TEAMS_URL,
  schedule:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=507537612&single=true&output=csv",
  standings:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRKB1A8VvkamcBPMWAh7vVqAlOkx1UlINThkHhfMFEfSKEfpSnbbmq5d6w0KUdUju8x47pPrCAQUtFg/pub?gid=1102670617&single=true&output=csv",
  "standings-dashboard": STANDINGS_URL,
  teams: TEAMS_URL,
  transactions: TRANSACTIONS_URL,
};

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}

function readBadgeOverrides() {
  return JSON.parse(fs.readFileSync(BADGE_OVERRIDES_PATH, "utf8"));
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

function requestJsonWithHeaders(method, urlString, headers = {}, body = "") {
  return new Promise((resolve, reject) => {
    const target = new URL(urlString);
    const request = https.request(
      {
        method,
        hostname: target.hostname,
        path: `${target.pathname}${target.search}`,
        headers: {
          ...headers,
          ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}),
        },
      },
      (response) => {
        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          const status = response.statusCode || 200;
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
    request.on("error", reject);
    if (body) request.write(body);
    request.end();
  });
}

async function assertCommishRequest(req) {
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
  const user = await requestJsonWithHeaders(
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
  const rows = await requestJsonWithHeaders(
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

async function assertArticleWriterRequest(req) {
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
  const user = await requestJsonWithHeaders(
    "GET",
    `${SUPABASE_URL}/auth/v1/user?apikey=${encodeURIComponent(SUPABASE_ANON_KEY)}`,
    {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    }
  );
  const userId = String(user?.id || "").trim();
  if (!userId) {
    const error = new Error("Invalid reporter session.");
    error.status = 401;
    throw error;
  }
  const rows = await requestJsonWithHeaders(
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
  const isReporter = role === "reporter" || role === "media" || role === "writer";
  if (!isCommish && !isReporter) {
    const error = new Error("Only commissioners and reporters can publish articles.");
    error.status = 403;
    throw error;
  }
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, "Not found");
      return;
    }
    const ext = path.extname(filePath);
    send(res, 200, data, MIME[ext] || "application/octet-stream");
  });
}

function proxyCsv(res, url, depth = 0, options = {}) {
  if (depth > 3) {
    send(res, 508, "Too many redirects");
    return;
  }
  https
    .get(url, (proxyRes) => {
      const status = proxyRes.statusCode || 200;
      const location = proxyRes.headers.location;
      if (status >= 300 && status < 400 && location) {
        proxyRes.resume();
        proxyCsv(res, location, depth + 1, options);
        return;
      }
      let data = "";
      proxyRes.on("data", (chunk) => (data += chunk));
      proxyRes.on("end", () => {
        if (status >= 400) {
          send(res, status, `Upstream error ${status}`);
          return;
        }
        const body = options.transform ? options.transform(data) : data;
        send(res, 200, body, "text/csv; charset=utf-8");
      });
    })
    .on("error", (err) => {
      send(res, 500, `Proxy error: ${err.message}`);
    });
}

function formatCSV(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, "\"\"")}"` : value;
        })
        .join(",")
    )
    .join("\n");
}

function trimTrailingBlankRows(rows) {
  let last = rows.length - 1;
  while (last > 0 && rows[last].every((cell) => !String(cell || "").trim())) {
    last -= 1;
  }
  return rows.slice(0, last + 1);
}

function sliceC2S3PlayerStats(text) {
  const rows = parseCSV(text)
    .slice(0, 951)
    .map((row) => row.slice(7, 13));
  return `${formatCSV(trimTrailingBlankRows(rows))}\n`;
}

function sliceC2S3BoxScores(text) {
  const rows = parseCSV(text)
    .slice(0, 1000)
    .map((row) => row.slice(14, 40));
  return `${formatCSV(trimTrailingBlankRows(rows))}\n`;
}

function sliceC2S3Draft(text) {
  const rows = parseCSV(text)
    .slice(0, 22)
    .map((row) => row.slice(0, 3));
  return `${formatCSV(trimTrailingBlankRows(rows))}\n`;
}

function sliceC2S4Draft(text) {
  const rows = parseCSV(text)
    .slice(0, 24)
    .map((row) => row.slice(0, 3));
  return `${formatCSV(trimTrailingBlankRows(rows))}\n`;
}

const SHEET_TRANSFORMS = {
  boxscore: sliceC2S3BoxScores,
  "c2s3-draft": sliceC2S3Draft,
  "c2s4-draft": sliceC2S4Draft,
  "player-stats": sliceC2S3PlayerStats,
};

function normalizeName(value) {
  return String(value || "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\*/g, "")
    .trim()
    .toLowerCase();
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        value += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value.trim());
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(value.trim());
      if (row.length > 1 || row[0] !== "") {
        rows.push(row);
      }
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  if (value.length || row.length) {
    row.push(value.trim());
    rows.push(row);
  }

  return rows;
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            Accept: "text/csv,application/json,*/*",
            "User-Agent": "RSKL Player Profile Proxy/1.0",
          },
        },
        (response) => {
          let data = "";
          response.on("data", (chunk) => {
            data += chunk;
          });
          response.on("end", () => {
            const status = response.statusCode || 200;
            if (status >= 400) {
              reject(new Error(`Upstream error ${status}`));
              return;
            }
            resolve(data);
          });
        }
      )
      .on("error", reject);
  });
}

function findRosterRecord(rows, params) {
  if (!rows.length) return null;
  const header = rows[0].map((cell) => String(cell || "").trim().toLowerCase());
  const userAtIdx = header.findIndex((cell) => cell === "user @" || cell === "user@" || cell === "player");
  const userIdIdx = header.findIndex((cell) => cell === "user id" || cell === "userid" || cell === "player id");
  const imageIdx = header.findIndex((cell) =>
    ["photo", "photo url", "profile picture", "profile picture url", "avatar", "image", "headshot"].includes(cell)
  );
  const targets = [normalizeName(params.player), normalizeName(params.displayName)].filter(Boolean);

  for (const row of rows.slice(1)) {
    const handle = String(row[userAtIdx >= 0 ? userAtIdx : 0] || "").trim();
    if (!targets.includes(normalizeName(handle))) continue;
    return {
      handle,
      userId: String(row[userIdIdx >= 0 ? userIdIdx : 1] || "").trim(),
      imageUrl: imageIdx >= 0 ? String(row[imageIdx] || "").trim() : "",
    };
  }
  return null;
}

function fetchProfileFromScript(params) {
  return new Promise((resolve, reject) => {
    const target = new URL(PLAYER_PROFILE_SCRIPT_URL);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        target.searchParams.set(key, String(value));
      }
    });

    https
      .get(
        target,
        {
          headers: {
            Accept: "application/json,*/*",
            "User-Agent": "RSKL Player Profile Proxy/1.0",
          },
        },
        (response) => {
          let data = "";
          response.on("data", (chunk) => {
            data += chunk;
          });
          response.on("end", () => {
            const status = response.statusCode || 200;
            if (status >= 400) {
              reject(new Error(`Profile API error ${status}`));
              return;
            }
            try {
              resolve(JSON.parse(data));
            } catch (_error) {
              reject(new Error("Expected JSON response from player profile API."));
            }
          });
        }
      )
      .on("error", reject);
  });
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (_) {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

function supabaseRequest(method, pathName, payload, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const target = new URL(`${SUPABASE_URL}${pathName}`);
    const body = payload ? JSON.stringify(payload) : "";
    const request = https.request(
      {
        method,
        hostname: target.hostname,
        path: target.pathname + target.search,
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
          ...extraHeaders,
          ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}),
        },
      },
      (response) => {
        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          const status = response.statusCode || 200;
          if (status >= 400) {
            reject(new Error(`Supabase error ${status}: ${data.slice(0, 300)}`));
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
    request.on("error", reject);
    if (body) {
      request.write(body);
    }
    request.end();
  });
}

async function readBadgeOverridesFromSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  const rows = await supabaseRequest("GET", "/rest/v1/badge_overrides?select=data&id=eq.global&limit=1");
  const row = Array.isArray(rows) ? rows[0] : null;
  return row?.data ? sanitizeBadgeOverrides(row.data) : null;
}

function rookieRowsToBadgeOverrides(rows) {
  const rookie = {};
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const season = String(row?.season || "").trim();
    const handle = String(row?.player_handle || row?.player_name || "").trim();
    if (!season || !handle) return;
    if (!rookie[season]) rookie[season] = [];
    rookie[season].push(handle);
  });
  return { rookie };
}

async function readRookiePlayersFromSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  const rows = await supabaseRequest(
    "GET",
    "/rest/v1/rookie_players?select=season,player_handle,player_name&order=season.asc,created_at.asc"
  );
  return rookieRowsToBadgeOverrides(rows);
}

async function writeBadgeOverrides(data) {
  const safeData = sanitizeBadgeOverrides(data);
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    const rows = await supabaseRequest(
      "POST",
      "/rest/v1/badge_overrides?on_conflict=id",
      [
        {
          id: "global",
          data: safeData,
        },
      ],
      { Prefer: "resolution=merge-duplicates,return=representation" }
    );
    const row = Array.isArray(rows) ? rows[0] : null;
    return sanitizeBadgeOverrides(row?.data || safeData);
  }
  fs.writeFileSync(BADGE_OVERRIDES_PATH, `${JSON.stringify(safeData, null, 2)}\n`, "utf8");
  return safeData;
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

function validateArticlePayload(payload) {
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

async function fetchNewsArticles(options = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  const params = new URLSearchParams();
  params.set("select", "id,title,summary,body,author,content_type,game_key,season,date_token,team1,team2,status,created_at,updated_at");
  params.set("status", "eq.published");
  if (options.id) {
    params.set("id", `eq.${String(options.id).trim()}`);
  } else {
    params.set("content_type", `eq.${String(options.contentType || "article").trim()}`);
  }
  if (options.season) params.set("season", `eq.${String(options.season).trim()}`);
  if (options.gameKey) params.set("game_key", `eq.${String(options.gameKey).trim()}`);
  params.set("order", "created_at.desc");
  params.set("limit", String(Number(options.limit || 12)));
  const rows = await supabaseRequest(
    "GET",
    `/rest/v1/news_articles?${params.toString()}`
  );
  return Array.isArray(rows) ? rows.map(sanitizeArticle) : [];
}

async function fetchLegacyNewsArticles(limit = 12) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  const params = new URLSearchParams();
  params.set("select", "id,title,summary,body,author,status,created_at,updated_at");
  params.set("status", "eq.published");
  params.set("order", "created_at.desc");
  params.set("limit", String(Number(limit || 12)));
  const rows = await supabaseRequest("GET", `/rest/v1/news_articles?${params.toString()}`);
  return Array.isArray(rows) ? rows.map(sanitizeArticle) : [];
}

async function patchSupabasePlayerTag(table, oldTag, payload) {
  const rows = await supabaseRequest(
    "PATCH",
    `/rest/v1/${table}?player_tag=eq.${encodeURIComponent(oldTag)}`,
    payload
  );
  return Array.isArray(rows) ? rows.length : 0;
}

async function patchSupabaseRookiePlayerHandle(oldTag, payload) {
  const cleanOld = String(oldTag || "").trim();
  if (!cleanOld) return 0;
  const variants = Array.from(new Set([cleanOld, cleanOld.replace(/^@/, "")])).filter(Boolean);
  let updated = 0;
  for (const value of variants) {
    const rows = await supabaseRequest(
      "PATCH",
      `/rest/v1/rookie_players?player_handle=eq.${encodeURIComponent(value)}`,
      payload
    );
    updated += Array.isArray(rows) ? rows.length : 0;
  }
  return updated;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/player-profile") {
    const params = Object.fromEntries(url.searchParams.entries());
    const player = String(params.player || "").trim();
    if (!player) {
      send(res, 400, JSON.stringify({ ok: false, message: "Missing player parameter." }), "application/json; charset=utf-8");
      return;
    }

    (async () => {
      try {
        const profile = await fetchProfileFromScript(params);
        send(res, 200, JSON.stringify(profile), "application/json; charset=utf-8");
      } catch (error) {
        send(res, 500, JSON.stringify({ ok: false, message: error.message }), "application/json; charset=utf-8");
      }
    })();
    return;
  }

  if (url.pathname === "/api/articles") {
    if (req.method === "GET") {
      (async () => {
        try {
          const content = String(url.searchParams.get("content") || "").trim();
          const type = String(url.searchParams.get("type") || "").trim();
          const season = String(url.searchParams.get("season") || "").trim();
          const gameKey = String(url.searchParams.get("game_key") || "").trim();
          const id = String(url.searchParams.get("id") || "").trim();
          const contentType =
            type === "game_preview" || type === "game_summary"
              ? type
              : content === "game"
              ? "game_preview"
              : "article";
          let articles = [];
          try {
            articles = await fetchNewsArticles({
              limit: content === "game" ? 200 : 12,
              contentType,
              season,
              gameKey,
              id,
            });
          } catch (error) {
            if (content === "game") throw error;
            articles = await fetchLegacyNewsArticles(12);
          }
          if (!articles.length && content !== "game") {
            articles = await fetchLegacyNewsArticles(12).catch(() => []);
          }
          if (content === "game") {
            const summaries = await fetchNewsArticles({
              limit: 200,
              contentType: "game_summary",
              season,
              gameKey,
            });
            send(res, 200, JSON.stringify({ ok: true, articles: [...articles, ...summaries] }), "application/json; charset=utf-8");
            return;
          }
          send(res, 200, JSON.stringify({ ok: true, articles }), "application/json; charset=utf-8");
        } catch (error) {
          send(res, 500, JSON.stringify({ ok: false, message: error.message, articles: [] }), "application/json; charset=utf-8");
        }
      })();
      return;
    }
    if (req.method === "POST") {
      (async () => {
        try {
          await assertArticleWriterRequest(req);
          const payload = await readJsonBody(req);
          const article = validateArticlePayload(payload);
          await supabaseRequest("POST", "/rest/v1/news_articles", [article], {
            Prefer: "return=representation",
          });
          const articles = await fetchNewsArticles({ limit: 12, contentType: article.content_type });
          send(res, 200, JSON.stringify({ ok: true, articles }), "application/json; charset=utf-8");
        } catch (error) {
          send(
            res,
            error.status || 500,
            JSON.stringify({ ok: false, message: error.message }),
            "application/json; charset=utf-8"
          );
        }
      })();
      return;
    }
    send(res, 405, JSON.stringify({ ok: false, message: "Method not allowed." }), "application/json; charset=utf-8");
    return;
  }

  if (url.pathname === "/api/player-rename-sync") {
    if (req.method !== "POST") {
      send(
        res,
        405,
        JSON.stringify({ ok: false, message: "Method not allowed." }),
        "application/json; charset=utf-8"
      );
      return;
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      send(
        res,
        500,
        JSON.stringify({ ok: false, message: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." }),
        "application/json; charset=utf-8"
      );
      return;
    }
    (async () => {
      try {
        const payload = await readJsonBody(req);
        const oldTag = String(payload.oldTag || "").trim();
        const newTag = String(payload.newTag || "").trim();
        const newDisplay = String(payload.newDisplay || newTag || "").trim();
        if (!oldTag || !newTag) {
          send(
            res,
            400,
            JSON.stringify({ ok: false, message: "Missing oldTag or newTag." }),
            "application/json; charset=utf-8"
          );
          return;
        }
        const playersUpdated = await patchSupabasePlayerTag("players", oldTag, {
          player_tag: newTag,
          display_name: newDisplay,
        }).catch(() => 0);
        const playerProfilesUpdated = await patchSupabasePlayerTag("player_profiles", oldTag, {
          player_tag: newTag,
        }).catch(() => 0);
        const rookiePlayersUpdated = await patchSupabaseRookiePlayerHandle(oldTag, {
          player_handle: newTag,
          player_name: newDisplay,
          updated_at: new Date().toISOString(),
        }).catch(() => 0);
        send(
          res,
          200,
          JSON.stringify({ ok: true, playersUpdated, playerProfilesUpdated, rookiePlayersUpdated }),
          "application/json; charset=utf-8"
        );
      } catch (error) {
        send(
          res,
          500,
          JSON.stringify({ ok: false, message: error.message }),
          "application/json; charset=utf-8"
        );
      }
    })();
    return;
  }

  if (url.pathname === "/api/game-flow") {
    if (req.method !== "GET") {
      send(res, 405, JSON.stringify({ ok: false, message: "Method not allowed." }), "application/json; charset=utf-8");
      return;
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      send(
        res,
        500,
        JSON.stringify({ ok: false, message: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." }),
        "application/json; charset=utf-8"
      );
      return;
    }
    (async () => {
      try {
        const gameKey = String(url.searchParams.get("gameKey") || "").trim();
        const seasonKey = String(url.searchParams.get("season") || "").trim();
        if (!gameKey) {
          send(res, 400, JSON.stringify({ ok: false, message: "Missing gameKey." }), "application/json; charset=utf-8");
          return;
        }
        const params = new URLSearchParams();
        params.set(
          "select",
          "game_key,season_key,game_date,team1,team2,team1_score,team2_score,snapshot_minute,snapshot_label,created_at"
        );
        params.set("game_key", `eq.${gameKey}`);
        if (seasonKey) {
          params.set("season_key", `eq.${seasonKey}`);
        }
        params.set("order", "snapshot_minute.asc");
        const rows = await requestJsonWithHeaders(
          "GET",
          `${SUPABASE_URL}/rest/v1/game_flow_snapshots?${params.toString()}`,
          {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          }
        );
        const snapshots = Array.isArray(rows)
          ? rows.map((row) => ({
              ...row,
              team1_key: normalizeTeamName(row.team1),
              team2_key: normalizeTeamName(row.team2),
            }))
          : [];
        send(res, 200, JSON.stringify({ ok: true, snapshots }), "application/json; charset=utf-8");
      } catch (error) {
        send(res, 500, JSON.stringify({ ok: false, message: error.message }), "application/json; charset=utf-8");
      }
    })();
    return;
  }

  if (url.pathname === "/api/game-flow-capture") {
    if (req.method !== "GET" && req.method !== "POST") {
      send(res, 405, JSON.stringify({ ok: false, message: "Method not allowed." }), "application/json; charset=utf-8");
      return;
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      send(
        res,
        500,
        JSON.stringify({ ok: false, message: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." }),
        "application/json; charset=utf-8"
      );
      return;
    }
    (async () => {
      try {
        const seasonKey = String(url.searchParams.get("season") || "c2s3-regular").trim();
        const source = String(url.searchParams.get("source") || "auto").trim() || "auto";
        const csvText = await fetchText(LIVE_SCORING_URL);
        const rows = parseSharedCsv(csvText);
        const bucket = getEasternSnapshotBucket();
        const payload = buildLiveGameSnapshotPayloads(rows, seasonKey, bucket).map((entry) => ({
          ...entry,
          source,
        }));
        if (!payload.length) {
          send(res, 200, JSON.stringify({ ok: true, captured: 0, snapshots: [] }), "application/json; charset=utf-8");
          return;
        }
        const saved = await supabaseRequest(
          "POST",
          "/rest/v1/game_flow_snapshots?on_conflict=game_key,snapshot_minute",
          payload,
          { Prefer: "resolution=merge-duplicates,return=representation" }
        );
        send(
          res,
          200,
          JSON.stringify({
            ok: true,
            captured: Array.isArray(saved) ? saved.length : payload.length,
            snapshotMinute: bucket.minuteOfDay,
            snapshotLabel: bucket.label,
            snapshots: Array.isArray(saved) ? saved : payload,
          }),
          "application/json; charset=utf-8"
        );
      } catch (error) {
        send(res, 500, JSON.stringify({ ok: false, message: error.message }), "application/json; charset=utf-8");
      }
    })();
    return;
  }

  if (url.pathname === "/api/badge-overrides") {
    if (req.method === "GET") {
      (async () => {
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
          const data = mergeBadgeLists(mergeBadgeLists(localData, supabaseData || {}), rookieTableData || {});
          send(res, 200, JSON.stringify(sanitizeBadgeOverrides(data)), "application/json; charset=utf-8");
        } catch (error) {
          send(
            res,
            error.status || 500,
            JSON.stringify({ ok: false, message: error.message }),
            "application/json; charset=utf-8"
          );
        }
      })();
      return;
    }

    if (req.method === "POST") {
      (async () => {
        try {
          await assertCommishRequest(req);
          const payload = await readJsonBody(req);
          const saved = await writeBadgeOverrides(payload);
          send(
            res,
            200,
            JSON.stringify({ ok: true, data: saved }),
            "application/json; charset=utf-8"
          );
        } catch (error) {
          send(
            res,
            error.status || 500,
            JSON.stringify({ ok: false, message: error.message }),
            "application/json; charset=utf-8"
          );
        }
      })();
      return;
    }

    send(res, 405, JSON.stringify({ ok: false, message: "Method not allowed." }), "application/json; charset=utf-8");
    return;
  }

  if (url.pathname === "/api/gm-assignments") {
    const handler = require("./api/gm-assignments");
    handler(req, res);
    return;
  }

  if (url.pathname === "/api/sheet-update") {
    const handler = require("./api/sheet-update");
    handler(req, res);
    return;
  }

  if (url.pathname === "/api/supabase-config") {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      send(
        res,
        500,
        JSON.stringify({ ok: false, message: "Missing SUPABASE_URL or SUPABASE_ANON_KEY" }),
        "application/json; charset=utf-8"
      );
      return;
    }
    send(
      res,
      200,
      JSON.stringify({ ok: true, url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY }),
      "application/json; charset=utf-8"
    );
    return;
  }

  if (url.pathname === "/api/standings") {
    proxyCsv(res, STANDINGS_URL);
    return;
  }

  if (url.pathname === "/api/teams") {
    proxyCsv(res, TEAMS_URL);
    return;
  }

  if (url.pathname === "/api/draft") {
    proxyCsv(res, DRAFT_URL);
    return;
  }

  if (url.pathname === "/api/transactions") {
    proxyCsv(res, TRANSACTIONS_URL);
    return;
  }

  if (url.pathname === "/api/sheet") {
    const name = String(url.searchParams.get("name") || "");
    const target = SHEETS[name];
    if (!target) {
      send(res, 400, "Invalid sheet name");
      return;
    }
    proxyCsv(res, target, 0, SHEET_TRANSFORMS[name] ? { transform: SHEET_TRANSFORMS[name] } : undefined);
    return;
  }

  const filePath = url.pathname === "/" ? "/index.html" : url.pathname;
  const resolved = path.join(ROOT, filePath);

  if (!resolved.startsWith(ROOT)) {
    send(res, 403, "Forbidden");
    return;
  }

  serveFile(res, resolved);
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
