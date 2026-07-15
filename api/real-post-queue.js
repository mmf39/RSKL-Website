const {
  assertAutomationSecret,
  assertCommish,
  assertCronSecret,
  fetchQueue,
  queueRealAnnouncement,
  updateAnnouncementStatus,
} = require("../lib/real-post-queue");

const https = require("https");

const C2S4_SCHEDULE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=507537612&single=true&output=csv";

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

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const raw = await readBody(req);
  try {
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    const error = new Error("Request body must be valid JSON.");
    error.status = 400;
    throw error;
  }
}

function isCronRequest(req) {
  const cronSecret = String(process.env.CRON_SECRET || "").trim();
  const authHeader = String(req.headers.authorization || "").trim();
  return Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);
}

function fetchText(urlString) {
  return new Promise((resolve, reject) => {
    https
      .get(urlString, (response) => {
        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          const status = response.statusCode || 200;
          if (status >= 400) {
            reject(new Error(`Schedule fetch failed (${status}).`));
            return;
          }
          resolve(data);
        });
      })
      .on("error", reject);
  });
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
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
      if (char === "\r" && next === "\n") i += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
      continue;
    }
    value += char;
  }
  if (value.length || row.length) {
    row.push(value.trim());
    if (row.some(Boolean)) rows.push(row);
  }
  return rows;
}

function getEasternLeagueDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const year = String(lookup.year || "").padStart(4, "0");
  const month = String(lookup.month || "").padStart(2, "0");
  const day = String(lookup.day || "").padStart(2, "0");
  return {
    iso: `${year}-${month}-${day}`,
    token: `${Number(month)}/${Number(day)}`,
    label: `${Number(month)}/${Number(day)}/${year}`,
  };
}

function parseScheduleRows(rows) {
  return rows
    .filter((row) => {
      const date = String(row[0] || "").trim();
      const home = String(row[1] || "").trim();
      const away = String(row[2] || "").trim();
      return /^\d{1,2}\/\d{1,2}$/.test(date) && home && away;
    })
    .map((row) => ({
      date: String(row[0] || "").trim(),
      home: String(row[1] || "").trim(),
      away: String(row[2] || "").trim(),
      winner: String(row[3] || "").trim(),
      gameType: String(row[4] || "").trim(),
    }));
}

function chooseGameOfTheDay(games) {
  return games[0] || null;
}

function buildGotdAnnouncement(game, leagueDate) {
  return {
    announcementType: "game_of_the_day",
    title: "Game of the Day",
    message: [
      "🏆 GAME OF THE DAY",
      "",
      `${game.away} at ${game.home}`,
      `Date: ${leagueDate.label}`,
      game.gameType ? `Type: ${game.gameType}` : "",
      "",
      "Make sure your lineup is ready.",
    ]
      .filter((line) => line !== "")
      .join("\n"),
    eventKey: `gotd-${leagueDate.iso}`,
    createdBy: "vercel-cron",
  };
}

async function queueGameOfTheDay() {
  const leagueDate = getEasternLeagueDate();
  const rows = parseCSV(await fetchText(C2S4_SCHEDULE_URL));
  const games = parseScheduleRows(rows).filter((game) => game.date === leagueDate.token);
  const gotd = chooseGameOfTheDay(games);
  if (!gotd) {
    return {
      queued: false,
      message: `No scheduled C2S4 games found for ${leagueDate.token}.`,
    };
  }
  const result = await queueRealAnnouncement(buildGotdAnnouncement(gotd, leagueDate));
  return {
    queued: result.inserted,
    duplicate: result.duplicate,
    announcement: result.announcement,
  };
}

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      if (isCronRequest(req)) {
        assertCronSecret(req);
        const result = await queueGameOfTheDay();
        sendJson(res, 200, { ok: true, ...result });
        return;
      }
      await assertCommish(req);
      const status = String(req.query?.status || new URL(req.url, "http://local").searchParams.get("status") || "pending");
      sendJson(res, 200, { ok: true, announcements: await fetchQueue(status) });
      return;
    }

    if (req.method === "POST") {
      assertAutomationSecret(req);
      const payload = await readJsonBody(req);
      const result = await queueRealAnnouncement(payload);
      sendJson(res, result.duplicate ? 200 : 201, {
        ok: true,
        duplicate: result.duplicate,
        announcement: result.announcement,
      });
      return;
    }

    if (req.method === "PATCH") {
      await assertCommish(req);
      const payload = await readJsonBody(req);
      const announcement = await updateAnnouncementStatus(payload.id, payload.status);
      sendJson(res, 200, { ok: true, announcement });
      return;
    }

    sendJson(res, 405, { ok: false, message: "Method not allowed." });
  } catch (error) {
    sendJson(res, error.status || 500, { ok: false, message: error.message || "Queue request failed." });
  }
};
