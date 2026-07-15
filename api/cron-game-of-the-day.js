const https = require("https");
const { assertCronSecret, queueRealAnnouncement } = require("./_real-post-queue");

const C2S4_SCHEDULE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=507537612&single=true&output=csv";

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function fetchText(urlString) {
  return new Promise((resolve, reject) => {
    https
      .get(urlString, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          const status = res.statusCode || 200;
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
    .map((row, index) => ({
      date: String(row[0] || "").trim(),
      home: String(row[1] || "").trim(),
      away: String(row[2] || "").trim(),
      winner: String(row[3] || "").trim(),
      gameType: String(row[4] || "").trim(),
      index,
    }));
}

function chooseGameOfTheDay(games) {
  // Placeholder: currently choose the first scheduled game for the league date.
  // Replace this with league-specific GOTD logic if you track featured games elsewhere.
  return games[0] || null;
}

function buildGotdAnnouncement(game, leagueDate) {
  const title = "Game of the Day";
  const message = [
    "🏆 GAME OF THE DAY",
    "",
    `${game.away} at ${game.home}`,
    `Date: ${leagueDate.label}`,
    game.gameType ? `Type: ${game.gameType}` : "",
    "",
    "Make sure your lineup is ready.",
  ]
    .filter((line) => line !== "")
    .join("\n");
  return {
    announcementType: "game_of_the_day",
    title,
    message,
    eventKey: `gotd-${leagueDate.iso}`,
    createdBy: "vercel-cron",
  };
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "GET") {
      sendJson(res, 405, { ok: false, message: "Method not allowed." });
      return;
    }
    assertCronSecret(req);
    const leagueDate = getEasternLeagueDate();
    const rows = parseCSV(await fetchText(C2S4_SCHEDULE_URL));
    const games = parseScheduleRows(rows).filter((game) => game.date === leagueDate.token);
    const gotd = chooseGameOfTheDay(games);
    if (!gotd) {
      sendJson(res, 200, {
        ok: true,
        queued: false,
        message: `No scheduled C2S4 games found for ${leagueDate.token}.`,
      });
      return;
    }
    const result = await queueRealAnnouncement(buildGotdAnnouncement(gotd, leagueDate));
    sendJson(res, 200, {
      ok: true,
      queued: result.inserted,
      duplicate: result.duplicate,
      announcement: result.announcement,
    });
  } catch (error) {
    sendJson(res, error.status || 500, { ok: false, message: error.message || "GOTD cron failed." });
  }
};

module.exports.chooseGameOfTheDay = chooseGameOfTheDay;
module.exports.getEasternLeagueDate = getEasternLeagueDate;
