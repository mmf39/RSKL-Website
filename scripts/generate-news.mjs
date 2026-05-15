import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const NEWS_FILE = path.join(ROOT, "assets", "data", "news.json");
const TIMEZONE = "America/New_York";

const SOURCES = {
  standingsDashboard:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=2115060088&single=true&output=csv",
  schedule:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=507537612&single=true&output=csv",
  boxscore:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=321367914&single=true&output=csv",
  playerStats:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=2091759853&single=true&output=csv",
  transactions:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=1782609175&single=true&output=csv",
};

const TRANSACTION_RANGES = {
  trade: "A3:E81",
  retirement: "G3:J70",
  cut: "L3:O81",
  signing: "Q3:T81",
};

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

function colToIndex(letter) {
  return letter.toUpperCase().charCodeAt(0) - 65;
}

function parseRange(range) {
  const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
  if (!match) return null;
  const [, startCol, startRow, endCol, endRow] = match;
  return {
    startCol: colToIndex(startCol),
    endCol: colToIndex(endCol),
    startRow: Number(startRow) - 1,
    endRow: Number(endRow) - 1,
  };
}

function sliceRange(rows, range) {
  const parsed = parseRange(range);
  if (!parsed) return [];
  return rows
    .slice(parsed.startRow, parsed.endRow + 1)
    .map((row) => row.slice(parsed.startCol, parsed.endCol + 1));
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
    .trim()
    .replace(/^bullets$/i, "storm")
    .toLowerCase();
}

function canonicalTeamName(value) {
  const clean = displayTeamName(String(value || "").replace(/\([^)]*\)/g, "").trim());
  const lower = clean.toLowerCase();
  if (lower === "lions" || lower === "the lions") return "The Lions";
  if (lower === "future" || lower === "the future") return "Dream Team";
  if (lower === "snipers" || lower === "the snipers") return "The Snipers";
  if (lower === "phantoms" || lower === "the phantoms") return "The Phantoms";
  if (lower === "avengers" || lower === "karma avengers") return "Karma Avengers";
  if (lower === "currents" || lower === "the currents") return "The Currents";
  if (lower === "turkey" || lower === "turkeys") return "Turkeys";
  return clean;
}

function normalizeDateToken(value) {
  const text = String(value || "").trim();
  const match = text.match(/(\d{1,2}\/\d{1,2})(?:\/\d{2,4})?/);
  return match ? match[1] : "";
}

function parseNumeric(value) {
  const num = Number(String(value || "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(num) ? num : null;
}

function parseDateValue(value) {
  const text = String(value || "").trim();
  if (!text) return Number.NEGATIVE_INFINITY;
  const mdy = text.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (mdy) {
    const month = Number(mdy[1]) - 1;
    const day = Number(mdy[2]);
    let year = mdy[3] ? Number(mdy[3]) : new Date().getFullYear();
    if (year < 100) year += 2000;
    return new Date(year, month, day).getTime();
  }
  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

function getEtDateParts(baseDate = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter.formatToParts(baseDate);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return { year, month, day };
}

function getDateTokenFromIso(isoDate) {
  const parsed = new Date(`${isoDate}T12:00:00Z`);
  const { month, day } = getEtDateParts(parsed);
  return `${month}/${day}`;
}

function getTodayIsoEt() {
  const { year, month, day } = getEtDateParts(new Date());
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function shiftIsoDate(isoDate, deltaDays) {
  const base = new Date(`${isoDate}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + deltaDays);
  const year = base.getUTCFullYear();
  const month = base.getUTCMonth() + 1;
  const day = base.getUTCDate();
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildPublishedAt(isoDate, hour, minute) {
  return `${isoDate}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-04:00`;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchCsv(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Fetch failed for ${url}: ${response.status}`);
  }
  return parseCSV(await response.text());
}

async function readNewsFeed() {
  try {
    const raw = await fs.readFile(NEWS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return {
      updatedAt: parsed.updatedAt || "",
      timezone: parsed.timezone || TIMEZONE,
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch (error) {
    return { updatedAt: "", timezone: TIMEZONE, items: [] };
  }
}

async function writeNewsFeed(feed) {
  await fs.writeFile(NEWS_FILE, `${JSON.stringify(feed, null, 2)}\n`, "utf8");
}

function prepareScheduleRows(rows) {
  const headerRowIndex = rows.findIndex((row) => {
    const header = row.map((value) => String(value || "").trim().toLowerCase());
    return (
      header.some((value) => value === "date" || value.includes("date")) &&
      header.some((value) => value.includes("team 1") || value.includes("team1") || value.includes("away")) &&
      header.some((value) => value.includes("team 2") || value.includes("team2") || value.includes("home"))
    );
  });
  return headerRowIndex >= 0 ? rows.slice(headerRowIndex) : rows;
}

function detectScheduleIndexes(rows) {
  const header = (rows[0] || []).map((cell) => String(cell || "").trim().toLowerCase());
  const findIdx = (checks) => header.findIndex((value) => checks.some((check) => value.includes(check)));
  return {
    date: findIdx(["date"]),
    team1: findIdx(["team 1", "team1", "away"]),
    team2: findIdx(["team 2", "team2", "home"]),
    gameType: findIdx(["game type", "type"]),
  };
}

function buildScheduleGames(rows) {
  const indexes = detectScheduleIndexes(rows);
  return rows
    .slice(1)
    .filter((row) => row.some((cell) => String(cell || "").trim() !== ""))
    .map((row) => {
      const rawDate = String(row[indexes.date] || "").trim();
      const dateToken = normalizeDateToken(rawDate);
      const team1 = displayTeamName(String(row[indexes.team1] || "").trim());
      const team2 = displayTeamName(String(row[indexes.team2] || "").trim());
      const gameType = String(row[indexes.gameType] || "").trim();
      if (!dateToken || !team1 || !team2) return null;
      return { rawDate, dateToken, team1, team2, gameType };
    })
    .filter(Boolean);
}

function buildStandingsMap(rows) {
  const map = new Map();
  let activeIndexes = null;

  rows.forEach((row) => {
    const normalized = row.map((cell) => String(cell || "").trim().toLowerCase());
    const teamIdx = normalized.findIndex((cell) => cell === "team");
    const winsIdx = normalized.findIndex((cell) => cell === "wins" || cell === "win");
    const lossesIdx = normalized.findIndex((cell) => cell === "loss" || cell === "losses" || cell === "l");
    const gbIdx = normalized.findIndex((cell) => cell === "gb");
    const pctIdx = normalized.findIndex((cell) => cell === "win %" || cell === "win%" || cell === "pct");

    if (teamIdx >= 0 && winsIdx >= 0 && lossesIdx >= 0 && gbIdx >= 0 && pctIdx >= 0) {
      activeIndexes = { teamIdx, winsIdx, lossesIdx, gbIdx, pctIdx };
      return;
    }

    if (!activeIndexes) return;
    const team = displayTeamName(row[activeIndexes.teamIdx] || "");
    if (!team) return;
    map.set(team, {
      team,
      wins: parseNumeric(row[activeIndexes.winsIdx]) ?? 0,
      losses: parseNumeric(row[activeIndexes.lossesIdx]) ?? 0,
      gb: parseNumeric(row[activeIndexes.gbIdx]) ?? 0,
      winPct: parseNumeric(row[activeIndexes.pctIdx]) ?? 0,
    });
  });

  return map;
}

function getRightNameCol(row) {
  const rightF = String(row?.[5] || "").trim();
  const rightE = String(row?.[4] || "").trim();
  if (rightF) return 5;
  if (rightE) return 4;
  return 5;
}

function getRightPointsCol(row) {
  return getRightNameCol(row) + 1;
}

function getRightRankCol(row) {
  return getRightNameCol(row) + 2;
}

function parseTeamHeader(value) {
  const text = String(value || "").trim();
  if (!text) return { name: "", score: "" };
  const match = text.match(/^(.*?)(?:\(([-+]?\d+)\))?\s*$/);
  return {
    name: displayTeamName(String(match ? match[1] : text).trim()),
    score: match && match[2] ? String(match[2]).trim() : "",
  };
}

function normalizePlayerCell(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^c$/i.test(raw)) return "";
  return raw.replace(/\s+\(?c\)?$/i, "").replace(/\s+/g, " ").trim();
}

function isPlayerCell(value) {
  return normalizePlayerCell(value).startsWith("@");
}

function buildPlayerEntry(value, points, rank) {
  return {
    player: normalizePlayerCell(value),
    points: String(points || "").trim(),
    rank: String(rank || "").trim(),
  };
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
  return parts.length > 1 ? parts[1].trim() : raw.trim();
}

function buildGameKey(dateToken, team1, team2) {
  return `${String(dateToken || "").trim()}|${normalizeTeamName(team1)}|${normalizeTeamName(team2)}`;
}

function buildCompletedGameMap(rows) {
  const map = new Map();
  let day = "";

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const a = String(row[0] || "").trim();
    const b = String(row[1] || "").trim();
    if (a.includes("League Day") || b.includes("League Day")) {
      day = extractLeagueDay([row]) || day;
      continue;
    }

    const left = String(row[0] || "").trim();
    const rightCol = getRightNameCol(row);
    const right = String(row[rightCol] || "").trim();
    if (!day || !left || !right) continue;
    if (isPlayerCell(left) || isPlayerCell(right)) continue;

    const team1 = parseTeamHeader(left);
    const team2 = parseTeamHeader(right);
    if (!team1.name || !team2.name || !team1.score || !team2.score) continue;

    const team1Players = [];
    const team2Players = [];
    for (let j = i + 1; j < rows.length; j += 1) {
      const next = rows[j];
      const nextLeft = String(next[0] || "").trim();
      const nextRightCol = getRightNameCol(next);
      const nextRight = String(next[nextRightCol] || "").trim();
      if (
        String(next[0] || "").includes("League Day") ||
        String(next[1] || "").includes("League Day")
      ) {
        break;
      }
      if (nextLeft && nextRight && !isPlayerCell(nextLeft) && !isPlayerCell(nextRight)) {
        break;
      }
      if (isPlayerCell(next[0])) {
        team1Players.push(buildPlayerEntry(next[0], next[1], next[2]));
      }
      if (isPlayerCell(next[nextRightCol])) {
        team2Players.push(
          buildPlayerEntry(next[nextRightCol], next[getRightPointsCol(next)], next[getRightRankCol(next)])
        );
      }
    }

    const payload = {
      dateToken: day,
      team1: team1.name,
      team2: team2.name,
      team1Score: parseNumeric(team1.score) ?? 0,
      team2Score: parseNumeric(team2.score) ?? 0,
      team1Players,
      team2Players,
    };
    map.set(buildGameKey(day, team1.name, team2.name), payload);
    map.set(buildGameKey(day, team2.name, team1.name), {
      ...payload,
      team1: team2.name,
      team2: team1.name,
      team1Score: payload.team2Score,
      team2Score: payload.team1Score,
      team1Players: team2Players,
      team2Players: team1Players,
    });
  }

  return map;
}

function computeTeamLeaders(rows) {
  const preparedRows = rows.slice(1);
  const byDate = new Map();
  preparedRows.forEach((row) => {
    const date = normalizeDateToken(row[0]);
    const score = parseNumeric(row[3]);
    if (!date || score === null) return;
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push(score);
  });

  const medianByDate = new Map();
  byDate.forEach((scores, date) => {
    const sorted = [...scores].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    medianByDate.set(date, sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2);
  });

  const teamPlayer = new Map();
  preparedRows.forEach((row) => {
    const team = displayTeamName(String(row[1] || "").trim());
    const player = String(row[2] || "").trim();
    const date = normalizeDateToken(row[0]);
    const score = parseNumeric(row[3]);
    if (!team || !player || score === null) return;
    const median = medianByDate.get(date) || 0;
    const key = `${team}|${player}`;
    const current = teamPlayer.get(key) || { team, player, gp: 0, total: 0, relTotal: 0, war: 0 };
    current.gp += 1;
    current.total += score;
    current.relTotal += median > 0 ? score / median : 0;
    current.war += median > 0 ? (score - 0.9 * median) / (0.92 * median) : 0;
    teamPlayer.set(key, current);
  });

  const byTeam = new Map();
  teamPlayer.forEach((entry) => {
    const item = {
      player: entry.player,
      avg: entry.gp ? entry.total / entry.gp : 0,
      rel: entry.gp ? entry.relTotal / entry.gp : 0,
      war: entry.war,
    };
    if (!byTeam.has(entry.team)) byTeam.set(entry.team, []);
    byTeam.get(entry.team).push(item);
  });

  const leaders = new Map();
  byTeam.forEach((list, team) => {
    leaders.set(team, {
      topAvg: [...list].sort((a, b) => b.avg - a.avg)[0] || null,
      topRel: [...list].sort((a, b) => b.rel - a.rel)[0] || null,
      topWar: [...list].sort((a, b) => b.war - a.war)[0] || null,
    });
  });
  return leaders;
}

function getTopPerformer(players) {
  return (players || [])
    .map((player) => ({ ...player, numericPoints: parseNumeric(player.points) }))
    .filter((player) => player.player && player.numericPoints !== null)
    .sort((a, b) => b.numericPoints - a.numericPoints)[0] || null;
}

function buildRecentForm(team, scheduleGames, completedGames, beforeToken) {
  const all = scheduleGames.filter((game) => {
    if (game.team1 !== team && game.team2 !== team) return false;
    if (beforeToken && normalizeDateToken(game.dateToken) === beforeToken) return false;
    return completedGames.has(buildGameKey(game.dateToken, game.team1, game.team2));
  });
  const sorted = all.sort((a, b) => parseDateValue(b.dateToken) - parseDateValue(a.dateToken)).slice(0, 3);
  let wins = 0;
  sorted.forEach((game) => {
    const result = completedGames.get(buildGameKey(game.dateToken, game.team1, game.team2));
    if (!result) return;
    const myScore = game.team1 === team ? result.team1Score : result.team2Score;
    const oppScore = game.team1 === team ? result.team2Score : result.team1Score;
    if (myScore > oppScore) wins += 1;
  });
  return { wins, games: sorted.length };
}

function findPreviousMeeting(team1, team2, scheduleGames, completedGames, beforeToken) {
  return scheduleGames
    .filter((game) => {
      const sameMatchup =
        (game.team1 === team1 && game.team2 === team2) ||
        (game.team1 === team2 && game.team2 === team1);
      if (!sameMatchup) return false;
      if (beforeToken && normalizeDateToken(game.dateToken) === beforeToken) return false;
      return completedGames.has(buildGameKey(game.dateToken, game.team1, game.team2));
    })
    .sort((a, b) => parseDateValue(b.dateToken) - parseDateValue(a.dateToken))[0] || null;
}

function buildPreviewItems({ todayIso, scheduleGames, standingsMap, leaderMap, completedGames }) {
  const dateToken = getDateTokenFromIso(todayIso);
  const games = scheduleGames.filter((game) => game.dateToken === dateToken);

  return games.map((game) => {
    const team1Standings = standingsMap.get(game.team1);
    const team2Standings = standingsMap.get(game.team2);
    const team1Leader = leaderMap.get(game.team1);
    const team2Leader = leaderMap.get(game.team2);
    const team1Form = buildRecentForm(game.team1, scheduleGames, completedGames, dateToken);
    const team2Form = buildRecentForm(game.team2, scheduleGames, completedGames, dateToken);
    const previousMeeting = findPreviousMeeting(game.team1, game.team2, scheduleGames, completedGames, dateToken);

    const bullets = [];
    if (team1Standings && team2Standings) {
      const edge = team1Standings.winPct >= team2Standings.winPct ? game.team1 : game.team2;
      const standingsLeader = edge === game.team1 ? team1Standings : team2Standings;
      bullets.push(
        `${edge} bring the stronger record into this one at ${standingsLeader.wins}-${standingsLeader.losses}, so the early tone of the matchup matters.`
      );
    } else {
      bullets.push(`Watch which side grabs control first, because both teams have room to shape the day with a fast start.`);
    }

    if (team1Leader?.topAvg && team2Leader?.topAvg) {
      bullets.push(
        `${game.team1} will lean on ${team1Leader.topAvg.player} (${team1Leader.topAvg.avg.toFixed(1)} avg) while ${game.team2} answer with ${team2Leader.topAvg.player} (${team2Leader.topAvg.avg.toFixed(1)} avg).`
      );
    } else if (team1Leader?.topWar || team2Leader?.topWar) {
      const star = team1Leader?.topWar || team2Leader?.topWar;
      bullets.push(`${star.player} has been the swing piece lately, so their box score is one of the first places to check.`);
    }

    if (previousMeeting) {
      const result = completedGames.get(buildGameKey(previousMeeting.dateToken, previousMeeting.team1, previousMeeting.team2));
      const winner = result.team1Score >= result.team2Score ? previousMeeting.team1 : previousMeeting.team2;
      const loser = winner === previousMeeting.team1 ? previousMeeting.team2 : previousMeeting.team1;
      const winnerScore = winner === previousMeeting.team1 ? result.team1Score : result.team2Score;
      const loserScore = winner === previousMeeting.team1 ? result.team2Score : result.team1Score;
      bullets.push(
        `The last meeting went ${winner} ${winnerScore}-${loserScore} over ${loser} on ${previousMeeting.dateToken}, so there is already a little revenge angle here.`
      );
    } else if (team1Form.games || team2Form.games) {
      bullets.push(
        `${game.team1} are ${team1Form.wins}-${Math.max(team1Form.games - team1Form.wins, 0)} in their last ${team1Form.games || 0}, while ${game.team2} are ${team2Form.wins}-${Math.max(team2Form.games - team2Form.wins, 0)} over their last ${team2Form.games || 0}.`
      );
    } else {
      bullets.push(`Because there is not much completed-game history yet, this one feels wide open and worth checking from the first scoring update.`);
    }

    return {
      id: `preview-${todayIso}-${slugify(game.team1)}-${slugify(game.team2)}`,
      kind: "preview",
      season: "c2s3-regular",
      title: `${game.team1} vs ${game.team2}: 3 things to watch`,
      summary: `Three quick angles to watch before ${game.team1} and ${game.team2} hit the ${dateToken} slate.`,
      bullets: bullets.slice(0, 3),
      teams: [game.team1, game.team2],
      gameDate: dateToken,
      publishedAt: buildPublishedAt(todayIso, 10, 0),
    };
  });
}

function buildRecapItems({ todayIso, scheduleGames, completedGames }) {
  const yesterdayIso = shiftIsoDate(todayIso, -1);
  const dateToken = getDateTokenFromIso(yesterdayIso);
  const games = scheduleGames.filter((game) => game.dateToken === dateToken);

  return games
    .map((game) => {
      const result = completedGames.get(buildGameKey(game.dateToken, game.team1, game.team2));
      if (!result) return null;

      const winner = result.team1Score >= result.team2Score ? game.team1 : game.team2;
      const loser = winner === game.team1 ? game.team2 : game.team1;
      const winnerScore = winner === game.team1 ? result.team1Score : result.team2Score;
      const loserScore = winner === game.team1 ? result.team2Score : result.team1Score;
      const margin = Math.abs(winnerScore - loserScore);
      const top1 = getTopPerformer(result.team1Players);
      const top2 = getTopPerformer(result.team2Players);
      const overallTop = [top1, top2].filter(Boolean).sort((a, b) => b.numericPoints - a.numericPoints)[0] || null;
      const losingTop = winner === game.team1 ? top2 : top1;

      const bullets = [];
      bullets.push(
        margin <= 250
          ? `This stayed close all the way through, with only ${margin} points separating the sides at the finish.`
          : `${winner} created enough separation to close this out by ${margin} points.`
      );
      if (overallTop) {
        bullets.push(`${overallTop.player} led the whole game sheet with ${overallTop.numericPoints.toFixed(0)} points.`);
      }
      if (losingTop && (!overallTop || losingTop.player !== overallTop.player)) {
        bullets.push(`${loser} still got a real push from ${losingTop.player}, who posted ${losingTop.numericPoints.toFixed(0)} in the loss.`);
      }

      return {
        id: `recap-${yesterdayIso}-${slugify(game.team1)}-${slugify(game.team2)}`,
        kind: "recap",
        season: "c2s3-regular",
        title: `${winner} beat ${loser}, ${winnerScore}-${loserScore}`,
        summary: `${winner} took care of business on ${dateToken}. Here is the fast read on the margin, the star turns, and what decided it.`,
        bullets,
        teams: [game.team1, game.team2],
        gameDate: dateToken,
        publishedAt: buildPublishedAt(todayIso, 7, 5),
      };
    })
    .filter(Boolean);
}

function extractPlayers(text) {
  return String(text || "").match(/@[A-Za-z0-9_.]+/g) || [];
}

function parseTradeRows(rows) {
  return rows
    .filter((row) => row.some((cell) => String(cell || "").trim() !== ""))
    .map((row) => ({
      date: String(row[0] || "").trim() || "—",
      type: "Trade",
      summary: `${canonicalTeamName(row[1] || "Team 1")} gets ${String(row[2] || "").trim() || "—"} • ${canonicalTeamName(row[3] || "Team 2")} gets ${String(row[4] || "").trim() || "—"}`,
      team1: canonicalTeamName(row[1] || ""),
      team1Gets: String(row[2] || "").trim() || "—",
      team2: canonicalTeamName(row[3] || ""),
      team2Gets: String(row[4] || "").trim() || "—",
      teams: [canonicalTeamName(row[1] || ""), canonicalTeamName(row[3] || "")].filter(Boolean),
      players: Array.from(new Set([...extractPlayers(row[2]), ...extractPlayers(row[4])])),
    }));
}

function parseSinglePartyRows(rows, type) {
  return rows
    .filter((row) => row.some((cell) => String(cell || "").trim() !== ""))
    .map((row) => {
      const player = String(row[0] || row[1] || "").trim();
      const mergedCell = String(row[2] || row[3] || "").trim();
      const dateMatch = mergedCell.match(/^(\d{1,2}\/\d{1,2})/);
      const date = dateMatch ? dateMatch[1] : "—";
      const team = canonicalTeamName(mergedCell.replace(/^(\d{1,2}\/\d{1,2})/, "").trim());
      const verb =
        type === "Signing"
          ? "signed"
          : type === "Cut"
          ? "cut"
          : "retired";
      return {
        date,
        type,
        summary: `${player || "Player"} ${verb}${team ? ` • ${team}` : ""}`,
        team,
        teams: team ? [team] : [],
        players: player ? [player] : [],
      };
    });
}

function buildTransactionItems(transactionRows, existingItems = []) {
  const existingIds = new Set(
    (existingItems || [])
      .filter((item) => item.kind === "transaction")
      .map((item) => String(item.id || ""))
  );
  const items = [
    ...parseTradeRows(sliceRange(transactionRows, TRANSACTION_RANGES.trade)),
    ...parseSinglePartyRows(sliceRange(transactionRows, TRANSACTION_RANGES.signing), "Signing"),
    ...parseSinglePartyRows(sliceRange(transactionRows, TRANSACTION_RANGES.cut), "Cut"),
    ...parseSinglePartyRows(sliceRange(transactionRows, TRANSACTION_RANGES.retirement), "Retirement"),
  ]
    .filter((item) => item.summary)
    .sort((a, b) => parseDateValue(b.date) - parseDateValue(a.date));

  return items.map((item) => {
    const title =
      item.type === "Trade"
        ? `Trade Breakdown: ${item.team1 || "Team 1"} and ${item.team2 || "Team 2"}`
        : `Transaction Breakdown: ${item.players?.[0] || "Roster move"}`;
    const bullets =
      item.type === "Trade"
        ? [
            `${item.team1 || "Team 1"} added ${item.team1Gets || "new pieces"}, which could reshape their rotation right away.`,
            `${item.team2 || "Team 2"} answered with ${item.team2Gets || "new pieces"}, so both sides clearly had a specific need in mind.`,
            `This is the kind of move to track over the next slate, because the real value will show up in roles, minutes, and who absorbs the usage.`,
          ]
        : [
            `${item.summary}.`,
            `${item.team ? `${item.team} now have a little more roster pressure around that spot.` : "This move is worth tracking for the next round of lineup decisions."}`,
          ];
    const summary =
      item.type === "Trade"
        ? `${item.team1 || "Team 1"} and ${item.team2 || "Team 2"} swapped pieces, and this one deserves a closer look than a normal transaction line.`
        : `${item.summary}. This is the quick AI read on what the move could mean.`;

    const nextItem = {
      id: `transaction-${slugify(item.type)}-${slugify(item.date)}-${slugify(item.summary)}`,
      kind: "transaction",
      season: "c2s3-regular",
      title,
      summary,
      bullets,
      teams: item.teams || [],
      publishedAt: new Date().toISOString(),
      transactionDate: item.date,
    };
    return existingIds.has(nextItem.id) ? null : nextItem;
  }).filter(Boolean);
}

function mergeItems(existingItems, nextItems) {
  const merged = new Map((existingItems || []).map((item) => [item.id, item]));
  nextItems.forEach((item) => {
    const existing = merged.get(item.id);
    merged.set(item.id, existing ? { ...item, publishedAt: existing.publishedAt || item.publishedAt } : item);
  });
  const deduped = new Map();
  Array.from(merged.values()).forEach((item) => {
    const teamsKey = Array.isArray(item.teams)
      ? [...item.teams].sort((a, b) => String(a).localeCompare(String(b))).join("|")
      : "";
    const semanticKey =
      item.kind === "transaction"
        ? `${item.kind}|${item.transactionDate || ""}|${item.summary || ""}`
        : ["preview", "recap"].includes(item.kind)
        ? `game|${item.gameDate || ""}|${teamsKey}`
        : `${item.kind}|${item.gameDate || ""}|${teamsKey}|${item.title || ""}`;
    const existing = deduped.get(semanticKey);
    if (!existing) {
      deduped.set(semanticKey, item);
      return;
    }
    const existingPublished = Date.parse(String(existing.publishedAt || "")) || 0;
    const nextPublished = Date.parse(String(item.publishedAt || "")) || 0;
    deduped.set(semanticKey, nextPublished >= existingPublished ? item : existing);
  });
  return Array.from(deduped.values()).sort(
    (a, b) => Date.parse(String(b.publishedAt || "")) - Date.parse(String(a.publishedAt || ""))
  );
}

function parseArgs(argv) {
  const modes = new Set();
  let date = getTodayIsoEt();

  argv.forEach((arg) => {
    if (arg.startsWith("--date=")) {
      date = arg.slice("--date=".length);
      return;
    }
    if (["preview", "recap", "transactions", "all"].includes(arg)) {
      modes.add(arg);
    }
  });

  if (!modes.size || modes.has("all")) {
    return { preview: true, recap: true, transactions: true, date };
  }
  return {
    preview: modes.has("preview"),
    recap: modes.has("recap"),
    transactions: modes.has("transactions"),
    date,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const feed = await readNewsFeed();
  const fetches = [];

  if (options.preview || options.recap) {
    fetches.push({
      key: "standingsRows",
      promise: fetchCsv(SOURCES.standingsDashboard),
    });
    fetches.push({
      key: "scheduleRows",
      promise: fetchCsv(SOURCES.schedule),
    });
  }

  if (options.preview) {
    fetches.push({
      key: "boxscoreRows",
      promise: fetchCsv(SOURCES.boxscore),
    });
    fetches.push({
      key: "playerRows",
      promise: fetchCsv(SOURCES.playerStats),
    });
  }

  if (options.transactions) {
    fetches.push({
      key: "transactionRows",
      promise: fetchCsv(SOURCES.transactions).catch((error) => {
        console.warn(`Transaction source unavailable; falling back to existing feed items: ${error.message}`);
        return null;
      }),
    });
  }

  const resolved = Object.fromEntries(
    await Promise.all(fetches.map(async ({ key, promise }) => [key, await promise]))
  );
  const standingsRows = resolved.standingsRows || [];
  const scheduleRows = resolved.scheduleRows || [];
  const boxscoreRows = resolved.boxscoreRows || [];
  const playerRows = resolved.playerRows || [];
  const transactionRows = resolved.transactionRows || null;

  const scheduleGames = buildScheduleGames(prepareScheduleRows(scheduleRows));
  const standingsMap = buildStandingsMap(standingsRows);
  const completedGames = buildCompletedGameMap(boxscoreRows);
  const leaderMap = computeTeamLeaders(playerRows);

  let nextItems = [];
  if (options.preview) {
    nextItems = nextItems.concat(
      buildPreviewItems({
        todayIso: options.date,
        scheduleGames,
        standingsMap,
        leaderMap,
        completedGames,
      })
    );
  }
  if (options.recap) {
    nextItems = nextItems.concat(
      buildRecapItems({
        todayIso: options.date,
        scheduleGames,
        completedGames,
      })
    );
  }
  if (options.transactions) {
    nextItems = nextItems.concat(
      transactionRows
        ? buildTransactionItems(transactionRows, feed.items)
        : feed.items.filter((item) => item.kind === "transaction")
    );
  }

  const mergedItems = mergeItems(feed.items, nextItems);
  const nextFeed = {
    updatedAt: new Date().toISOString(),
    timezone: TIMEZONE,
    items: mergedItems,
  };

  await writeNewsFeed(nextFeed);
  console.log(
    JSON.stringify(
      {
        ok: true,
        written: nextItems.length,
        total: mergedItems.length,
        modes: options,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
