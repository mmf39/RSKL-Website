const https = require("https");

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
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
    req.on("end", () => {
      resolve(body);
    });
    req.on("error", () => resolve(""));
  });
}

function requestSupabase(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}${path}`);
    const payload = body ? JSON.stringify(body) : "";
    const req = https.request(
      {
        method,
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
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
    req.on("error", reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function patchTableByTag(table, oldTag, nextFields) {
  const path = `/rest/v1/${table}?player_tag=eq.${encodeURIComponent(oldTag)}`;
  const rows = await requestSupabase("PATCH", path, nextFields);
  return Array.isArray(rows) ? rows.length : 0;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, message: "Method not allowed." });
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    sendJson(res, 500, {
      ok: false,
      message: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    });
    return;
  }

  let payload = req.body;
  if (!payload || typeof payload !== "object") {
    try {
      payload = JSON.parse(await readBody(req));
    } catch (_) {
      payload = {};
    }
  }

  const oldTag = String(payload.oldTag || "").trim();
  const newTag = String(payload.newTag || "").trim();
  const newDisplay = String(payload.newDisplay || newTag || "").trim();

  if (!oldTag || !newTag) {
    sendJson(res, 400, {
      ok: false,
      message: "Missing oldTag or newTag.",
    });
    return;
  }

  try {
    const playersUpdated = await patchTableByTag("players", oldTag, {
      player_tag: newTag,
      display_name: newDisplay,
    }).catch(() => 0);

    const playerProfilesUpdated = await patchTableByTag("player_profiles", oldTag, {
      player_tag: newTag,
    }).catch(() => 0);

    sendJson(res, 200, {
      ok: true,
      playersUpdated,
      playerProfilesUpdated,
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      message: error.message || "Unable to sync player rename to Supabase.",
    });
  }
};
