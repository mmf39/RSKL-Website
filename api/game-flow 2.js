const https = require("https");
const {
  normalizeTeamName,
} = require("../game-flow-shared");

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
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

module.exports = async (req, res) => {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      sendJson(res, 500, { ok: false, message: "Missing Supabase server configuration." });
      return;
    }

    const url = new URL(req.url, "http://localhost");
    const gameKey = String(url.searchParams.get("gameKey") || "").trim();
    const seasonKey = String(url.searchParams.get("season") || "").trim();
    if (!gameKey) {
      sendJson(res, 400, { ok: false, message: "Missing gameKey." });
      return;
    }

    const params = new URLSearchParams();
    params.set("select", "game_key,season_key,game_date,team1,team2,team1_score,team2_score,snapshot_minute,snapshot_label,created_at");
    params.set("game_key", `eq.${gameKey}`);
    if (seasonKey) {
      params.set("season_key", `eq.${seasonKey}`);
    }
    params.set("order", "snapshot_minute.asc");

    const rows = await requestJson(
      "GET",
      `${SUPABASE_URL}/rest/v1/game_flow_snapshots?${params.toString()}`,
      {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Accept: "application/json",
      }
    );

    const snapshots = Array.isArray(rows)
      ? rows.map((row) => ({
          ...row,
          team1: row.team1,
          team2: row.team2,
          team1_key: normalizeTeamName(row.team1),
          team2_key: normalizeTeamName(row.team2),
        }))
      : [];

    sendJson(res, 200, { ok: true, snapshots });
  } catch (error) {
    sendJson(res, 500, { ok: false, message: error.message });
  }
};
