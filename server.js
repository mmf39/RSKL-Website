const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

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
const LIVE_ROSTER_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=0&single=true&output=csv";
const PLAYER_PROFILE_SCRIPT_URL = process.env.PLAYER_PROFILE_SCRIPT_URL || "";
const SHEETS = {
  archive:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5rm7eqJcdWIX78vETTfsf40lMpXzvJCSdG8dGdkFBbXXC2zEzidcpGTLUzqcZQPTTVquYuLCeXoPL/pub?gid=1077518539&single=true&output=csv",
  "c2s2-regular": C2S2_REGULAR_URL,
  awards:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5rm7eqJcdWIX78vETTfsf40lMpXzvJCSdG8dGdkFBbXXC2zEzidcpGTLUzqcZQPTTVquYuLCeXoPL/pub?gid=1527593475&single=true&output=csv",
  contracts:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTr6cIsrgXTBa6ndhiGle_qOOUWgzH3KDUgPTANYDG2O_9u3_zdhOUGdzgz9yzMnqs1dgv54qg0TudU/pub?gid=959105096&single=true&output=csv",
  boxscore:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=321367914&single=true&output=csv",
  draft: DRAFT_URL,
  "live-scoring":
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=1486072019&single=true&output=csv",
  "player-stats":
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=2091759853&single=true&output=csv",
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

function proxyCsv(res, url) {
  https
    .get(url, (proxyRes) => {
      let data = "";
      proxyRes.on("data", (chunk) => (data += chunk));
      proxyRes.on("end", () => {
        if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
          send(res, proxyRes.statusCode, `Upstream error ${proxyRes.statusCode}`);
          return;
        }
        send(res, 200, data, "text/csv; charset=utf-8");
      });
    })
    .on("error", (err) => {
      send(res, 500, `Proxy error: ${err.message}`);
    });
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
        const rosterCsv = await fetchText(LIVE_ROSTER_URL);
        const rosterRows = parseCSV(rosterCsv);
        const rosterRecord = findRosterRecord(rosterRows, params);

        if (rosterRecord && rosterRecord.imageUrl) {
          send(
            res,
            200,
            JSON.stringify({
              ok: true,
              player,
              userId: rosterRecord.userId,
              userTag: rosterRecord.handle,
              photoUrl: rosterRecord.imageUrl,
            }),
            "application/json; charset=utf-8"
          );
          return;
        }

        if (!PLAYER_PROFILE_SCRIPT_URL) {
          send(
            res,
            200,
            JSON.stringify({
              ok: true,
              player,
              userId: rosterRecord ? rosterRecord.userId : "",
              userTag: rosterRecord ? rosterRecord.handle : "",
            }),
            "application/json; charset=utf-8"
          );
          return;
        }

        const profile = await fetchProfileFromScript(params, rosterRecord);
        send(
          res,
          200,
          JSON.stringify({
            ok: true,
            player,
            userId: rosterRecord ? rosterRecord.userId : "",
            userTag: rosterRecord ? rosterRecord.handle : "",
            ...profile,
          }),
          "application/json; charset=utf-8"
        );
      } catch (error) {
        send(res, 500, JSON.stringify({ ok: false, message: error.message }), "application/json; charset=utf-8");
      }
    })();
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
    proxyCsv(res, target);
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
