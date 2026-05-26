const https = require("https");
const {
  LIVE_SCORING_URL,
  parseCSV,
  buildLiveGameSnapshotPayloads,
  getEasternSnapshotBucket,
} = require("../game-flow-shared");

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const CRON_SECRET = process.env.CRON_SECRET || process.env.GAME_FLOW_CAPTURE_SECRET || "";

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function requestText(urlString) {
  return new Promise((resolve, reject) => {
    https
      .get(
        urlString,
        {
          headers: {
            Accept: "text/csv,*/*",
            "User-Agent": "RSKL Game Flow Capture/1.0",
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
            reject(new Error(`Request failed (${status}): ${data.slice(0, 300)}`));
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

function isAuthorized(req) {
  if (!CRON_SECRET) {
    return true;
  }
  const authHeader = String(req.headers.authorization || "").trim();
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const url = new URL(req.url, "http://localhost");
  const querySecret = String(url.searchParams.get("secret") || "").trim();
  return bearer === CRON_SECRET || querySecret === CRON_SECRET;
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "GET" && req.method !== "POST") {
      sendJson(res, 405, { ok: false, message: "Method not allowed." });
      return;
    }
    if (!isAuthorized(req)) {
      sendJson(res, 401, { ok: false, message: "Unauthorized capture request." });
      return;
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      sendJson(res, 500, { ok: false, message: "Missing Supabase server configuration." });
      return;
    }

    const url = new URL(req.url, "http://localhost");
    const seasonKey = String(url.searchParams.get("season") || "c2s3-regular").trim();
    const source = String(url.searchParams.get("source") || "auto").trim() || "auto";
    const csvText = await requestText(LIVE_SCORING_URL);
    const rows = parseCSV(csvText);
    const bucket = getEasternSnapshotBucket();
    const payload = buildLiveGameSnapshotPayloads(rows, seasonKey, bucket).map((entry) => ({
      ...entry,
      source,
    }));

    if (!payload.length) {
      sendJson(res, 200, { ok: true, captured: 0, snapshots: [] });
      return;
    }

    const saved = await requestJson(
      "POST",
      `${SUPABASE_URL}/rest/v1/game_flow_snapshots?on_conflict=game_key,snapshot_minute`,
      {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      JSON.stringify(payload)
    );

    sendJson(res, 200, {
      ok: true,
      captured: Array.isArray(saved) ? saved.length : payload.length,
      snapshotMinute: bucket.minuteOfDay,
      snapshotLabel: bucket.label,
      snapshots: Array.isArray(saved) ? saved : payload,
    });
  } catch (error) {
    sendJson(res, 500, { ok: false, message: error.message });
  }
};
