const LIVE_SCORING_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=1486072019&single=true&output=csv";

const KNOWN_LIVE_TEAMS = new Set(
  [
    "turkeys",
    "gus n em",
    "storm",
    "cheerios",
    "scorpions",
    "illegals",
    "the lions",
    "dream team",
    "the snipers",
    "the phantoms",
    "karma avengers",
    "the currents",
    "the bolts",
    "wranglers",
  ].map((value) => normalizeTeamName(value))
);

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
      if (row.length > 1 || row[0] !== "") rows.push(row);
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

function displayTeamName(value) {
  const name = String(value || "").trim();
  if (name === "Bullets") return "Storm";
  if (name === "Yetis") return "Scorpions";
  if (name === "The Future") return "Dream Team";
  if (name === "Avengers") return "Karma Avengers";
  if (name === "Currents") return "The Currents";
  if (name === "Bolts") return "The Bolts";
  if (name === "Doggy N em") return "Doggy N Em";
  if (name === "Wrangler") return "Wranglers";
  return name;
}

function normalizeTeamName(value) {
  return displayTeamName(String(value || ""))
    .replace(/\([^)]*\)/g, "")
    .replace(/[:*]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\*/g, "")
    .trim()
    .replace(/^bullets$/i, "storm")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function buildGameKey(dateToken, team1, team2) {
  return `${String(dateToken || "").trim()}|${normalizeTeamName(team1)}|${normalizeTeamName(team2)}`;
}

function parseTeamHeader(value) {
  const text = String(value || "").trim();
  if (!text) return { name: "", score: "" };
  const match = text.match(/^(.*?)(?:\(([-+]?\d+)\))?\s*$/);
  const name = displayTeamName((match ? match[1] : text).trim());
  const score = match && match[2] ? String(match[2]).trim() : "";
  return { name, score };
}

function getRightNameCol(row) {
  const rightF = String(row?.[5] || "").trim();
  const rightE = String(row?.[4] || "").trim();
  if (rightF) return 5;
  if (rightE) return 4;
  return 5;
}

function extractLeagueDay(rows) {
  const hit = rows.find(
    (row) =>
      String(row[0] || "").includes("League Day") ||
      String(row[1] || "").includes("League Day")
  );
  if (!hit) return "";
  const raw = String(hit[0] || hit[1] || "");
  const parts = raw.split(":");
  const value = parts.length > 1 ? parts[1].trim() : raw.trim();
  const match = value.match(/(\d{1,2}\/\d{1,2})(?:\/\d{2,4})?/);
  return match ? match[1] : value;
}

function isPlayerCell(value) {
  const text = String(value || "").trim();
  if (!text) return false;
  return text.startsWith("@") || /\bmember\d+/i.test(text);
}

function isLikelyLiveHeader(left, right) {
  const leftText = String(left || "").trim();
  const rightText = String(right || "").trim();
  if (!leftText || !rightText) return false;
  if (isPlayerCell(leftText) || isPlayerCell(rightText)) return false;

  const leftParsed = parseTeamHeader(leftText);
  const rightParsed = parseTeamHeader(rightText);
  const leftName = normalizeTeamName(leftParsed.name);
  const rightName = normalizeTeamName(rightParsed.name);
  if (!leftName || !rightName || leftName === rightName) return false;

  const blocked = new Set(["player", "points", "point", "pts", "rank", "score"]);
  if (blocked.has(leftName) || blocked.has(rightName)) return false;

  return (
    /\(\s*-?\d+\s*\)/.test(leftText) ||
    /\(\s*-?\d+\s*\)/.test(rightText) ||
    (KNOWN_LIVE_TEAMS.has(leftName) && KNOWN_LIVE_TEAMS.has(rightName)) ||
    /^[a-z0-9 '.&-]+$/i.test(leftParsed.name) ||
    /^[a-z0-9 '.&-]+$/i.test(rightParsed.name)
  );
}

function getEasternSnapshotBucket(date = new Date()) {
  const formatter24 = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const formatter12 = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const parts = formatter24.formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
  const minuteRaw = Number(parts.find((part) => part.type === "minute")?.value || 0);
  const minute = Math.floor(minuteRaw / 15) * 15;
  const bucketDate = new Date(date.getTime());
  bucketDate.setUTCMinutes(bucketDate.getUTCMinutes() - (minuteRaw - minute));
  const minuteOfDay = hour * 60 + minute;
  const paddedMinute = String(minute).padStart(2, "0");
  const label = formatter12.format(new Date(`2000-01-01T${String(hour).padStart(2, "0")}:${paddedMinute}:00Z`));
  return {
    minuteOfDay,
    label,
  };
}

function buildLiveGameSnapshotPayloads(rows, seasonKey, snapshotInfo = getEasternSnapshotBucket()) {
  const mapDay = extractLeagueDay(rows);
  if (!mapDay) return [];
  const startIndex = rows.findIndex(
    (row) =>
      String(row[0] || "").includes("League Day") ||
      String(row[1] || "").includes("League Day")
  );
  const dataRows = rows.slice(startIndex >= 0 ? startIndex + 1 : 0);
  const games = [];
  let current = null;
  dataRows.forEach((row) => {
    const left = String(row[0] || "").trim();
    const right = String(row[getRightNameCol(row)] || "").trim();
    if (isLikelyLiveHeader(left, right)) {
      current = row;
      games.push(current);
    }
  });

  return games
    .map((header) => {
      const left = String(header[0] || "").trim();
      const right = String(header[getRightNameCol(header)] || "").trim();
      const team1 = parseTeamHeader(left);
      const team2 = parseTeamHeader(right);
      if (!team1.name || !team2.name) return null;
      return {
        season_key: seasonKey,
        game_key: buildGameKey(mapDay, team1.name, team2.name),
        game_date: mapDay,
        team1: team1.name,
        team2: team2.name,
        team1_score: Number(team1.score || 0),
        team2_score: Number(team2.score || 0),
        snapshot_minute: snapshotInfo.minuteOfDay,
        snapshot_label: snapshotInfo.label,
        source: "auto",
      };
    })
    .filter(Boolean);
}

module.exports = {
  LIVE_SCORING_URL,
  parseCSV,
  displayTeamName,
  normalizeTeamName,
  buildGameKey,
  parseTeamHeader,
  getRightNameCol,
  extractLeagueDay,
  buildLiveGameSnapshotPayloads,
  getEasternSnapshotBucket,
};
