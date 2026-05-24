const https = require("https");
const { URL } = require("url");

const LIVE_ROSTER_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=0&single=true&output=csv";
const PLAYER_PROFILE_SCRIPT_URL =
  process.env.PLAYER_PROFILE_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbwLH2qYcWceJucuI559OzLNjk9Bh8WjQgBKZJttcrBwS13gTY1GtnJi9T5eAb0jJeSwbA/exec";

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function parseQueryFromReq(req) {
  if (req && req.query && typeof req.query === "object") {
    return { ...req.query };
  }
  try {
    const url = new URL(req.url, "http://localhost");
    return Object.fromEntries(url.searchParams.entries());
  } catch (_) {
    return {};
  }
}

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
  if (!rows.length) {
    return null;
  }
  const header = rows[0].map((cell) => String(cell || "").trim().toLowerCase());
  const userAtIdx = header.findIndex((cell) => cell === "user @" || cell === "user@" || cell === "player");
  const userIdIdx = header.findIndex((cell) => cell === "user id" || cell === "userid" || cell === "player id");
  const imageIdx = header.findIndex((cell) =>
    ["photo", "photo url", "profile picture", "profile picture url", "avatar", "image", "headshot"].includes(cell)
  );
  const targets = [
    normalizeName(params.player),
    normalizeName(params.displayName),
  ].filter(Boolean);

  for (const row of rows.slice(1)) {
    const handle = String(row[userAtIdx >= 0 ? userAtIdx : 0] || "").trim();
    if (!targets.includes(normalizeName(handle))) {
      continue;
    }
    return {
      handle,
      userId: String(row[userIdIdx >= 0 ? userIdIdx : 1] || "").trim(),
      imageUrl: imageIdx >= 0 ? String(row[imageIdx] || "").trim() : "",
    };
  }
  return null;
}

function fetchProfileFromScript(params, rosterRecord) {
  return new Promise((resolve, reject) => {
    const target = new URL(PLAYER_PROFILE_SCRIPT_URL);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        target.searchParams.set(key, String(value));
      }
    });
    if (rosterRecord && rosterRecord.userId) {
      target.searchParams.set("userId", rosterRecord.userId);
      target.searchParams.set("playerId", rosterRecord.userId);
    }
    if (rosterRecord && rosterRecord.handle) {
      target.searchParams.set("userTag", rosterRecord.handle);
    }

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

module.exports = async (req, res) => {
  const params = parseQueryFromReq(req);
  const player = String(params.player || "").trim();
  if (!player) {
    sendJson(res, 400, { ok: false, message: "Missing player parameter." });
    return;
  }

  try {
    const rosterCsv = await fetchText(LIVE_ROSTER_URL);
    const rosterRows = parseCSV(rosterCsv);
    const rosterRecord = findRosterRecord(rosterRows, params);

    if (rosterRecord && rosterRecord.imageUrl) {
      sendJson(res, 200, {
        ok: true,
        player,
        userId: rosterRecord.userId,
        userTag: rosterRecord.handle,
        photoUrl: rosterRecord.imageUrl,
      });
      return;
    }

    if (!PLAYER_PROFILE_SCRIPT_URL) {
      sendJson(res, 200, {
        ok: true,
        player,
        userId: rosterRecord ? rosterRecord.userId : "",
        userTag: rosterRecord ? rosterRecord.handle : "",
      });
      return;
    }

    const profile = await fetchProfileFromScript(params, rosterRecord);
    const expectedUserId = rosterRecord ? String(rosterRecord.userId || "").trim() : "";
    const returnedUserId = String(profile.userId || profile.playerId || "").trim();
    const safeProfile =
      !expectedUserId || !returnedUserId || expectedUserId === returnedUserId
        ? profile
        : { ok: false, player, userId: expectedUserId, userTag: rosterRecord ? rosterRecord.handle : "" };
    sendJson(res, 200, {
      ok: true,
      player,
      userId: rosterRecord ? rosterRecord.userId : "",
      userTag: rosterRecord ? rosterRecord.handle : "",
      ...safeProfile,
    });
  } catch (error) {
    sendJson(res, 500, { ok: false, message: error.message });
  }
};
