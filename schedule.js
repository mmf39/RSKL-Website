const SCHEDULE_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=507537612&single=true&output=csv";
const BOXSCORE_CSV_URL = "/api/sheet?name=boxscore";
const LIVE_CSV_URL = "/api/sheet?name=live-scoring";
const PLAYER_STATS_URL = "/api/sheet?name=player-stats";
const GAME_FLOW_API = "/api/game-flow";
const NEWS_ARTICLES_API = "/api/articles";
const ARCHIVE_URL = "/api/sheet?name=archive";
const C2S2_REGULAR_URL = "/api/sheet?name=c2s2-regular";
const C1S2_REGULAR_SCHEDULE_URL = "/assets/data/c1s2-regular-schedule.csv";
const C1S2_POST_SCHEDULE_URL = "/assets/data/c1s2-post-schedule.csv";
const C1S6_REGULAR_SCHEDULE_URL = "/assets/data/c1s6-regular-schedule.csv";
const C1S6_POST_SCHEDULE_URL = "/assets/data/c1s6-post-schedule.csv";
const C1S5_REGULAR_SCHEDULE_URL = "/assets/data/c1s5-regular-schedule.csv";
const C1S5_POST_SCHEDULE_URL = "/assets/data/c1s5-post-schedule.csv";
const C1S4_REGULAR_SCHEDULE_URL = "/assets/data/c1s4-regular-schedule.csv";
const C1S4_POST_SCHEDULE_URL = "/assets/data/c1s4-post-schedule.csv";
const C1S3_REGULAR_SCHEDULE_URL = "/assets/data/c1s3-regular-schedule.csv";
const C1S3_POST_SCHEDULE_URL = "/assets/data/c1s3-post-schedule.csv";
const SEASON_KEY = "season";
const SCHEDULE_CACHE_TTL_MS = 5 * 60 * 1000;

const els = {
  lastUpdated: document.getElementById("last-updated"),
  search: document.getElementById("schedule-search"),
  daySelect: document.getElementById("schedule-day"),
  dayGamesTitle: document.getElementById("day-games-title"),
  upcomingGamesTitle: document.getElementById("upcoming-games-title"),
  nextGames: document.getElementById("next-games"),
  dayGames: document.getElementById("day-games"),
  modal: document.getElementById("boxscore-modal"),
  boxDetails: document.getElementById("boxscore-details"),
};

let cachedBoxScoreRows = [];
let liveScoreMap = new Map();
let finalScoreMap = new Map();
let teamLeadersMap = new Map();
let scheduleGames = [];
let gamesByDate = new Map();
let selectedDateKey = "";
let scheduleLoadToken = 0;
let gameScoreStateCache = new Map();
let scheduleRenderFrame = 0;
let gameContentMap = new Map();

const ARCHIVE_RANGES = {
  schedule_regular: "G31:I79",
  schedule_post: "A31:D43",
  boxscore: "L31:R149",
};
const C2S2_SCHEDULE_RANGE = "A1:E82";
const C2S2_REGULAR_RANGES = {
  schedule: "A71:E170",
  boxscore: "K60:R1059",
};
const LIVE_RIGHT_NAME_COL = 5;
const LIVE_RIGHT_POINTS_COL = 6;
const LIVE_RIGHT_RANK_COL = 7;
const KNOWN_LIVE_TEAMS = new Set(
  [
    "turkeys",
    "gus n em",
    "storm",
    "bad bois",
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

function getScheduleEnhancementCacheKey(seasonRaw) {
  return `schedule:enhancements:${seasonRaw}`;
}

function getScheduleCacheKey(seasonRaw) {
  return `schedule:rows:${seasonRaw}`;
}

function readCachedScheduleRows(seasonRaw) {
  try {
    const raw = localStorage.getItem(getScheduleCacheKey(seasonRaw));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.rows) || !parsed.savedAt) return [];
    if (Date.now() - Number(parsed.savedAt) > SCHEDULE_CACHE_TTL_MS) return [];
    return parsed.rows;
  } catch (error) {
    return [];
  }
}

function writeCachedScheduleRows(seasonRaw, rows) {
  try {
    localStorage.setItem(
      getScheduleCacheKey(seasonRaw),
      JSON.stringify({
        savedAt: Date.now(),
        rows,
      })
    );
  } catch (error) {
    // ignore cache failures
  }
}

function readCachedScheduleEnhancements(seasonRaw) {
  try {
    const raw = localStorage.getItem(getScheduleEnhancementCacheKey(seasonRaw));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.savedAt) return null;
    if (Date.now() - Number(parsed.savedAt) > SCHEDULE_CACHE_TTL_MS) return null;
    return parsed;
  } catch (error) {
    return null;
  }
}

function writeCachedScheduleEnhancements(seasonRaw, payload) {
  try {
    localStorage.setItem(
      getScheduleEnhancementCacheKey(seasonRaw),
      JSON.stringify({
        savedAt: Date.now(),
        ...payload,
      })
    );
  } catch (error) {
    // ignore cache failures
  }
}

function hydrateCachedEnhancements(seasonRaw) {
  const cached = readCachedScheduleEnhancements(seasonRaw);
  if (!cached) return false;

  if (Array.isArray(cached.boxScoreRows)) {
    cachedBoxScoreRows = cached.boxScoreRows;
    finalScoreMap = buildFinalScoreMap(cachedBoxScoreRows);
  }

  if (Array.isArray(cached.liveRows)) {
    liveScoreMap = buildLiveScoreMap(cached.liveRows);
  }

  if (Array.isArray(cached.playerRows)) {
    teamLeadersMap = computeTeamLeaders(cached.playerRows);
  }

  scheduleRenderScheduleViews();
  return true;
}

function getGameCacheKey(game) {
  return buildGameKey(game.dateToken, game.team1, game.team2);
}

function scheduleRenderScheduleViews() {
  if (scheduleRenderFrame) return;
  scheduleRenderFrame = requestAnimationFrame(() => {
    scheduleRenderFrame = 0;
    renderScheduleViews();
  });
}

function getSeasonRaw() {
  const raw = localStorage.getItem(SEASON_KEY) || "c2s3-playoffs";
  if (raw === "all-time") return "c2s3-playoffs";
  if (raw === "c2s2") return "c2s3-playoffs";
  if (raw === "c2s3" || raw === "c2s3-regular" || raw === "c2s3-playoffs") {
    return "c2s3-playoffs";
  }
  return raw;
}

function getSelectedSeasonRaw() {
  const raw = localStorage.getItem(SEASON_KEY) || "c2s3-playoffs";
  if (raw === "all-time" || raw === "c2s2" || raw === "c2s3") return "c2s3-playoffs";
  return raw;
}

function getSeason() {
  const raw = getSeasonRaw();
  if (raw === "c2s3-regular" || raw === "c2s3-playoffs" || raw === "c2s2-playoffs" || raw === "c2s2-regular") return "c2s2";
  return raw;
}

function initSeasonSelect() {
  const select = document.getElementById("season-select");
  if (!select) return;
  select.value = getSelectedSeasonRaw();
  if (!select.value) {
    select.value = getSeasonRaw();
  }
  localStorage.setItem(SEASON_KEY, select.value);
  select.addEventListener("change", () => {
    localStorage.setItem(SEASON_KEY, select.value);
    location.reload();
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

function getC2S2ScheduleRows(rows) {
  const headerRowIndex = rows.findIndex((row) => {
    const header = row.map((value) => String(value || "").trim().toLowerCase());
    return (
      header.some((value) => value === "date" || value.includes("date")) &&
      header.some(
        (value) => value.includes("team 1") || value.includes("team1") || value.includes("away")
      ) &&
      header.some(
        (value) => value.includes("team 2") || value.includes("team2") || value.includes("home")
      )
    );
  });
  if (headerRowIndex >= 0) {
    return rows.slice(headerRowIndex);
  }
  const sliced = sliceRange(rows, C2S2_SCHEDULE_RANGE);
  return [["Date", "Team 1", "Team 2", "Info", "Game Type"], ...sliced];
}

function getC2S2RegularScheduleRows(rows) {
  const sliced = sliceRange(rows, C2S2_REGULAR_RANGES.schedule);
  return [["Date", "Team 1", "Team 2", "Info", "Game Type"], ...sliced];
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function getTeamLogo(team) {
  const clean = displayTeamName(team);
  if (clean === "The Future" || clean === "Dream Team") return "/assets/dream-team.jpg";
  if (clean === "The Lions") return "/assets/the-lions.png";
  if (clean === "The Snipers") return "/assets/the-snipers.png";
  if (clean === "The Phantoms") return "/assets/the-phantoms.png";
  if (clean === "Scorpions") return "/assets/mayeday.jpg";
  if (clean === "Cobras") return "/assets/cobras.png";
  if (clean === "Karma Avengers") return "/assets/karma-avengers.png";
  if (clean === "Mafia") return "/assets/mafia.png";
  if (clean === "Mets" || clean === "The Mets") return "/assets/mets.png";
  if (clean === "Phoenix" || clean === "The Phoenix") return "/assets/phoenix.png";
  if (clean === "Thunderhawks") return "/assets/thunderhawks.png";
  if (clean === "The Currents" || clean === "Currents") return "/assets/the-currents.png";
  if (clean === "Whatsgrass") return "/assets/whatsgrass.png";
  if (clean === "Wolves") return "/assets/wolves.png";
  if (clean === "Zombies") return "/assets/zombies.png";
  if (clean === "Yetis") return "/assets/yetis.png";
  if (clean === "Gus N Em") return "/assets/gus-n-em.png";
  if (clean === "Bad Bois")
    return "https://media.realapp.com/assets/user/default/large/4JZRj4DJ_29132497.webp";
  if (clean === "Illegals") return "/assets/illegals.png";
  if (clean === "Storm" || clean === "Bullets") return "/assets/storm.png";
  if (clean === "Turkeys") return "/assets/turkeys.png";
  return "";
}

function normalizeDateToken(value) {
  const text = String(value || "").trim();
  const match = text.match(/(\d{1,2}\/\d{1,2})(?:\/\d{2,4})?/);
  return match ? match[1] : "";
}

function getTodayToken() {
  const now = new Date();
  return `${now.getMonth() + 1}/${now.getDate()}`;
}

function parseDateFromToken(token) {
  const m = String(token || "").match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;
  const month = Number(m[1]) - 1;
  const day = Number(m[2]);
  const year = new Date().getFullYear();
  const d = new Date(year, month, day);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function buildGameKey(dateToken, team1, team2) {
  return `${String(dateToken || "").trim()}|${normalizeTeamName(team1)}|${normalizeTeamName(team2)}`;
}

function buildGameContentMapKey(contentType, gameKey) {
  return `${String(contentType || "").trim()}|${String(gameKey || "").trim()}`;
}

function getGameContent(game, contentType) {
  const gameKey = buildGameKey(game?.dateToken || "", game?.team1 || "", game?.team2 || "");
  const reverseGameKey = buildGameKey(game?.dateToken || "", game?.team2 || "", game?.team1 || "");
  return (
    gameContentMap.get(buildGameContentMapKey(contentType, gameKey)) ||
    gameContentMap.get(buildGameContentMapKey(contentType, reverseGameKey)) ||
    null
  );
}

function buildGameArticleLinks(game, options = {}) {
  const manualPreview = getGameContent(game, "game_preview");
  const manualSummary = getGameContent(game, "game_summary");
  const links = [];
  if (manualPreview?.id && options.includePreview !== false) {
    links.push(`<a class="game-preview-link" href="/article.html?id=${encodeURIComponent(manualPreview.id)}">Game Preview</a>`);
  }
  if (manualSummary?.id && options.includeSummary !== false) {
    links.push(`<a class="game-preview-link game-review-link" href="/article.html?id=${encodeURIComponent(manualSummary.id)}">Game Summary</a>`);
  }
  return links.join("");
}

async function loadGameContent() {
  try {
    const fetchPayload = async (url) => {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      return response.json();
    };
    let payload = await fetchPayload(`${NEWS_ARTICLES_API}?content=game&season=${encodeURIComponent(getSeasonRaw())}`);
    if (!Array.isArray(payload?.articles) || !payload.articles.length) {
      payload = await fetchPayload(`${NEWS_ARTICLES_API}?content=game`);
    }
    const map = new Map();
    (Array.isArray(payload?.articles) ? payload.articles : []).forEach((article) => {
      const type = String(article?.content_type || "").trim();
      const gameKey = String(article?.game_key || "").trim();
      if (!type || !gameKey || !String(article?.body || "").trim()) return;
      [gameKey, buildGameKey(article?.date_token || "", article?.team1 || "", article?.team2 || ""), buildGameKey(article?.date_token || "", article?.team2 || "", article?.team1 || "")]
        .filter((key) => key && !key.includes("||"))
        .forEach((candidateKey) => {
          const key = buildGameContentMapKey(type, candidateKey);
          if (!map.has(key)) map.set(key, article);
        });
    });
    gameContentMap = map;
    document.querySelectorAll(".calendar-game-details[data-loaded]").forEach((node) => {
      node.removeAttribute("data-loaded");
      node.innerHTML = "";
    });
    scheduleRenderScheduleViews();
  } catch (_error) {
    gameContentMap = new Map();
  }
}

function parseTeamHeader(value) {
  const text = String(value || "").trim();
  if (!text) return { name: "", score: "" };
  const match = text.match(/^(.*?)(?:\(([-+]?\d+)\))?\s*$/);
  const name = displayTeamName((match ? match[1] : text).trim());
  const score = match && match[2] ? String(match[2]).trim() : "";
  return { name, score };
}

function normalizePlayerCell(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^c$/i.test(raw)) return "";
  return raw
    .replace(/\s+\(?c\)?$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getRightNameCol(row) {
  const rightF = String(row?.[5] || "").trim();
  const rightE = String(row?.[4] || "").trim();
  if (rightF) return 5;
  if (rightE) return 4;
  return LIVE_RIGHT_NAME_COL;
}

function getRightPointsCol(row) {
  return getRightNameCol(row) + 1;
}

function getRightRankCol(row) {
  return getRightNameCol(row) + 2;
}

function isPlayerLabelRow(left, right) {
  return String(left || "").trim().toLowerCase() === "player" &&
    String(right || "").trim().toLowerCase() === "player";
}

function isPlayerCell(value) {
  return normalizePlayerCell(value).startsWith("@");
}

function isCaptainCell(value) {
  const raw = String(value || "").trim();
  return /\s+\(?c\)?$/i.test(raw);
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

function buildPlayerEntry(value, points, rank) {
  return {
    player: normalizePlayerCell(value),
    isCaptain: isCaptainCell(value),
    points: String(points || ""),
    rank: String(rank || ""),
  };
}

function formatPlayerDisplay(player) {
  if (!player) return "";
  return player.isCaptain ? `${player.player} (C)` : player.player;
}

function renderPlayerName(name, season, options = {}) {
  const badgeHtml = window.rsklPlayerBadgeHtml
    ? window.rsklPlayerBadgeHtml({
        player: name,
        season,
        rookie: options.rookie !== false,
        risingStars: options.risingStars !== false,
      })
    : "";
  return `${escapeHtml(name)}${badgeHtml}`;
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
  return normalizeDateToken(value) || value;
}

function buildLiveScoreMap(rows) {
  const map = new Map();
  if (!rows.length) return map;
  const day = extractLeagueDay(rows);
  if (!day) return map;
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
      current = { header: row, players: [] };
      games.push(current);
      return;
    }
    if (current && (left || right)) {
      current.players.push(row);
    }
  });

  games.forEach((game) => {
    const header = game.header || [];
    const left = String(header[0] || "").trim();
    const rightCol = getRightNameCol(header);
    const right = String(header[rightCol] || "").trim();
    const team1 = parseTeamHeader(left);
    const team2 = parseTeamHeader(right);
    if (!team1.name || !team2.name) return;

    const team1Players = game.players
      .filter((r) => isPlayerCell(r[0]))
      .map((r) => buildPlayerEntry(r[0], r[1], r[2]));
    const team2Players = game.players
      .filter((r) => isPlayerCell(r[getRightNameCol(r)]))
      .map((r) =>
        buildPlayerEntry(
          r[getRightNameCol(r)],
          r[getRightPointsCol(r)],
          r[getRightRankCol(r)]
        )
      );

    const payload = {
      status: "live",
      team1Score: team1.score || "",
      team2Score: team2.score || "",
      team1Header: left,
      team2Header: right,
      team1Players,
      team2Players,
    };
    map.set(buildGameKey(day, team1.name, team2.name), payload);
    map.set(buildGameKey(day, team2.name, team1.name), {
      status: "live",
      team1Score: team2.score || "",
      team2Score: team1.score || "",
      team1Header: right,
      team2Header: left,
      team1Players: team2Players,
      team2Players: team1Players,
    });
  });

  return map;
}

function buildFinalScoreMap(rows) {
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
    const right = String(row[getRightNameCol(row)] || "").trim();
    if (!day || !left || !right) continue;
    if (isPlayerCell(left) || isPlayerCell(right)) continue;
    const t1 = parseTeamHeader(left);
    const t2 = parseTeamHeader(right);
    if (!t1.name || !t2.name || !t1.score || !t2.score) continue;
    const payload = { team1Score: t1.score, team2Score: t2.score };
    map.set(buildGameKey(day, t1.name, t2.name), payload);
    map.set(buildGameKey(day, t2.name, t1.name), {
      team1Score: t2.score,
      team2Score: t1.score,
    });
  }
  return map;
}

function computeTeamLeaders(playerRows) {
  const map = new Map();
  if (!playerRows.length) return map;
  const data = playerRows.slice(1);
  const byDate = new Map();
  data.forEach((row) => {
    const date = normalizeDateToken(row[0]);
    const score = parseNumericScore(row[3]);
    if (!date || score === null) return;
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push(score);
  });
  const medianByDate = new Map();
  byDate.forEach((scores, date) => {
    const s = [...scores].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    const median = s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
    medianByDate.set(date, median || 0);
  });

  const teamPlayer = new Map();
  data.forEach((row) => {
    const team = displayTeamName(String(row[1] || "").trim());
    const player = String(row[2] || "").trim();
    const date = normalizeDateToken(row[0]);
    const score = parseNumericScore(row[3]);
    if (!team || !player || score === null) return;
    const med = medianByDate.get(date) || 0;
    const rel = med > 0 ? score / med : 0;
    const war = med > 0 ? (score - 0.9 * med) / (0.92 * med) : 0;
    const key = `${team}|${player}`;
    const agg = teamPlayer.get(key) || { team, player, gp: 0, total: 0, relTotal: 0, war: 0 };
    agg.gp += 1;
    agg.total += score;
    agg.relTotal += rel;
    agg.war += war;
    teamPlayer.set(key, agg);
  });

  const byTeam = new Map();
  teamPlayer.forEach((entry) => {
    const avg = entry.gp ? entry.total / entry.gp : 0;
    const relAvg = entry.gp ? entry.relTotal / entry.gp : 0;
    if (!byTeam.has(entry.team)) byTeam.set(entry.team, []);
    byTeam.get(entry.team).push({
      player: entry.player,
      avg,
      rel: relAvg,
      war: entry.war,
    });
  });

  byTeam.forEach((list, team) => {
    const topAvg = [...list].sort((a, b) => b.avg - a.avg)[0] || null;
    const topRel = [...list].sort((a, b) => b.rel - a.rel)[0] || null;
    const topWar = [...list].sort((a, b) => b.war - a.war)[0] || null;
    map.set(team, { topAvg, topRel, topWar });
  });
  return map;
}

function parseNumericScore(value) {
  const num = Number(String(value || "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(num) ? num : null;
}

function getOutcomeFromScores(score1, score2) {
  const s1 = parseNumericScore(score1);
  const s2 = parseNumericScore(score2);
  if (s1 === null || s2 === null || s1 === s2) {
    return { team1: "", team2: "" };
  }
  return {
    team1: s1 > s2 ? "win" : "loss",
    team2: s2 > s1 ? "win" : "loss",
  };
}

function normalizeGameType(value) {
  const raw = String(value || "").trim();
  if (!raw) return { key: "", label: "" };
  const lower = raw.toLowerCase();
  if (lower.includes("pre")) {
    return { key: "preseason", label: "Pre-Season" };
  }
  if (lower.includes("regular")) {
    return { key: "regular", label: "Regular Season" };
  }
  return { key: "other", label: raw };
}

function updateLastUpdated() {
  const now = new Date();
  const formatted = now.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  if (els.lastUpdated) {
    els.lastUpdated.textContent = `Last updated: ${formatted}`;
  }
}

function buildGames(rows, season) {
  const headerLower = (rows[0] || []).map((h) => String(h || "").toLowerCase());
  const findIdx = (checks) =>
    headerLower.findIndex((h) => checks.some((check) => h.includes(check)));

  let dateIndex = findIdx(["date"]);
  let team1Index = findIdx(["team 1", "team1", "away"]);
  let team2Index = findIdx(["team 2", "team2", "home"]);
  let gameTypeIndex = findIdx(["game type", "type"]);
  let winnerIndex = findIdx(["winner"]);

  if (season === "c2s2") {
    if (dateIndex === -1) dateIndex = 0;
    if (team1Index === -1) team1Index = 1;
    if (team2Index === -1) team2Index = 2;
    if (gameTypeIndex === -1 && (rows[0] || []).length >= 5) gameTypeIndex = 4;
  } else {
    const isThreeCol = (rows[0] || []).length <= 3;
    if (dateIndex === -1) dateIndex = isThreeCol || season === "c2s1-regular" ? 0 : 1;
    if (team1Index === -1) team1Index = isThreeCol || season === "c2s1-regular" ? 1 : 2;
    if (team2Index === -1) team2Index = isThreeCol || season === "c2s1-regular" ? 2 : 3;
  }

  const dataRows = rows.slice(1).filter((r) => r.some((c) => String(c || "").trim() !== ""));
  const games = dataRows
    .map((row) => {
      const rawDate = String(row[dateIndex] || "").trim();
      const dateToken = normalizeDateToken(rawDate);
      const dateObj = parseDateFromToken(dateToken);
      const team1 = displayTeamName(String(row[team1Index] || "").trim());
      const team2 = displayTeamName(String(row[team2Index] || "").trim());
      const gameTypeRaw = gameTypeIndex >= 0 ? String(row[gameTypeIndex] || "").trim() : "";
      const gameType = normalizeGameType(gameTypeRaw);
      const winner = winnerIndex >= 0 ? displayTeamName(String(row[winnerIndex] || "").trim()) : "";
      if (!dateToken || !team1 || !team2) return null;
      return {
        rawDate,
        dateToken,
        dateObj,
        team1,
        team2,
        winner,
        gameTypeRaw,
        gameType,
      };
    })
    .filter(Boolean);
  return games.map((game, idx) => ({ ...game, idx }));
}

function rebuildGamesByDate() {
  gamesByDate = new Map();
  scheduleGames.forEach((g) => {
    if (!gamesByDate.has(g.dateToken)) gamesByDate.set(g.dateToken, []);
    gamesByDate.get(g.dateToken).push(g);
  });
}

function compareGameDates(a, b) {
  if (a.dateObj && b.dateObj) {
    return a.dateObj - b.dateObj;
  }
  if (a.dateObj) return -1;
  if (b.dateObj) return 1;
  return String(a.dateToken || "").localeCompare(String(b.dateToken || ""), undefined, {
    numeric: true,
  });
}

function formatDayLabel(token) {
  const parsed = parseDateFromToken(token);
  if (!parsed) {
    return token;
  }
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function populateDaySelect() {
  if (!els.daySelect) return;
  const options = Array.from(gamesByDate.keys()).sort((a, b) => {
    const dateA = parseDateFromToken(a);
    const dateB = parseDateFromToken(b);
    if (dateA && dateB) return dateA - dateB;
    if (dateA) return -1;
    if (dateB) return 1;
    return a.localeCompare(b, undefined, { numeric: true });
  });
  els.daySelect.innerHTML = options
    .map((token) => {
      const count = (gamesByDate.get(token) || []).length;
      const selected = token === selectedDateKey ? ' selected' : "";
      return `<option value="${escapeHtml(token)}"${selected}>${escapeHtml(
        `${formatDayLabel(token)} (${count})`
      )}</option>`;
    })
    .join("");
}

function findBoxScoreRowsForGame(game) {
  if (!game || !game.dateToken || !cachedBoxScoreRows.length) return [];
  const tokenMatches = (cell, token) => normalizeDateToken(cell) === token;
  const isDateRow = (row) => {
    const a = String(row[0] || "");
    const b = String(row[1] || "");
    return tokenMatches(a, game.dateToken) || tokenMatches(b, game.dateToken);
  };

  const start = cachedBoxScoreRows.findIndex(isDateRow);
  if (start === -1) return [];

  let end = cachedBoxScoreRows.length;
  for (let i = start + 1; i < cachedBoxScoreRows.length; i += 1) {
    if (isDateRow(cachedBoxScoreRows[i])) {
      end = i;
      break;
    }
  }
  const dayRows = cachedBoxScoreRows.slice(start + 1, end);
  const blocks = [];
  let current = null;

  dayRows.forEach((row) => {
    const left = String(row[0] || "").trim();
    const right = String(row[getRightNameCol(row)] || "").trim();
    const isHeader =
      left &&
      right &&
      !isPlayerCell(left) &&
      !isPlayerCell(right) &&
      !isPlayerLabelRow(left, right) &&
      !left.includes("League Day") &&
      !right.includes("League Day");
    const isPlayer = isPlayerCell(left) || isPlayerCell(right);
    if (isHeader) {
      current = [row];
      blocks.push(current);
      return;
    }
    if (isPlayer && current) {
      current.push(row);
    }
  });

  if (!blocks.length) return [];
  const target1 = normalizeTeamName(game.team1);
  const target2 = normalizeTeamName(game.team2);
  const match = blocks.find((block) => {
    const header = block[0] || [];
    const h1 = normalizeTeamName(parseTeamHeader(header[0]).name);
    const h2 = normalizeTeamName(
      parseTeamHeader(header[getRightNameCol(header)]).name
    );
    const exact = (h1 === target1 && h2 === target2) || (h1 === target2 && h2 === target1);
    const fuzzy =
      (h1.includes(target1) || target1.includes(h1)) &&
      (h2.includes(target2) || target2.includes(h2));
    const fuzzySwap =
      (h1.includes(target2) || target2.includes(h1)) &&
      (h2.includes(target1) || target1.includes(h2));
    return exact || fuzzy || fuzzySwap;
  });
  return match || [];
}

function getBoxScorePayload(game) {
  const rows = findBoxScoreRowsForGame(game);
  const scoreFallback = finalScoreMap.get(buildGameKey(game.dateToken, game.team1, game.team2));
  const hasMatchedRows = rows.length > 0;

  const toTeamRows = (rowsIn, side) => {
    if (side === 1) {
      return rowsIn.filter((r) => String(r[0] || "").trim() !== "");
    }
    return rowsIn.filter((r) => String(r[getRightNameCol(r)] || "").trim() !== "");
  };

  const team1Rows = toTeamRows(rows, 1);
  const team2Rows = toTeamRows(rows, 2);
  const team1Header = team1Rows.length
    ? team1Rows[0][0]
    : scoreFallback?.team1Score
    ? `${game.team1} (${scoreFallback.team1Score})`
    : game.team1;
  const team2Header = team2Rows.length
    ? team2Rows[0][getRightNameCol(team2Rows[0])]
    : scoreFallback?.team2Score
    ? `${game.team2} (${scoreFallback.team2Score})`
    : game.team2;

  const mapRows = (arr, side) =>
    arr
      .slice(1)
      .map((row) =>
        side === 1
          ? buildPlayerEntry(row[0], row[1], row[2])
          : buildPlayerEntry(
              row[getRightNameCol(row)],
              row[getRightPointsCol(row)],
              row[getRightRankCol(row)]
            )
      )
      .filter((row) => row.player);

  const team1 = mapRows(team1Rows, 1);
  const team2 = mapRows(team2Rows, 2);

  const cleanTeamLabel = (name) => String(name || "").replace(/\([^)]*\)/g, "").trim();
  const renderTeamTable = (players, header) => {
    const cleanHeader = displayTeamName(cleanTeamLabel(header));
    const logo = getTeamLogo(cleanHeader);
    const logoHtml = logo
      ? `<img class="standings-logo" src="${logo}" alt="${escapeHtml(cleanHeader)} logo" />`
      : "";
    const teamLink = `/team.html?team=${encodeURIComponent(cleanHeader)}`;
    const body = players.length
      ? players
          .map(
            (p) => `
              <div class="boxscore-row">
                <a class="boxscore-link" href="/player-detail.html?player=${encodeURIComponent(String(p.player || "").trim())}">${escapeHtml(formatPlayerDisplay(p))}</a>
                <span>${escapeHtml(p.points)}</span>
                <span>${escapeHtml(p.rank)}</span>
              </div>
            `
          )
          .join("")
      : '<div class="boxscore-empty">Player stats not recorded.</div>';

    return `
      <div class="boxscore-card">
        <a class="boxscore-team" href="${teamLink}">${logoHtml}<span>${escapeHtml(cleanHeader)}</span></a>
        <div class="boxscore-row"><span>Player</span><span>Points</span><span>Rank</span></div>
        ${body}
      </div>
    `;
  };

  const parsed1 = parseTeamHeader(team1Header);
  const parsed2 = parseTeamHeader(team2Header);
  const finalScore = parsed1.score && parsed2.score ? `${parsed1.score}-${parsed2.score}` : "";
  const hasPlayerStats = hasMatchedRows && (team1.length || team2.length);
  const hasTeamScores = Boolean(parsed1.score && parsed2.score);
  const teamOnlyHtml = `
    <div class="boxscore-meta">League Day: ${escapeHtml(game.dateToken)}</div>
    <div class="boxscore-table">
      <div class="boxscore-row"><span>Team</span><span>${hasTeamScores ? "Score" : "Result"}</span><span></span></div>
      <div class="boxscore-row">
        <a class="boxscore-link" href="/team.html?team=${encodeURIComponent(parsed1.name || game.team1)}">${escapeHtml(parsed1.name || game.team1)}</a>
        <span>${hasTeamScores ? escapeHtml(parsed1.score) : game.winner && normalizeTeamName(game.winner) === normalizeTeamName(parsed1.name || game.team1) ? "Win" : "Loss"}</span>
        <span></span>
      </div>
      <div class="boxscore-row">
        <a class="boxscore-link" href="/team.html?team=${encodeURIComponent(parsed2.name || game.team2)}">${escapeHtml(parsed2.name || game.team2)}</a>
        <span>${hasTeamScores ? escapeHtml(parsed2.score) : game.winner && normalizeTeamName(game.winner) === normalizeTeamName(parsed2.name || game.team2) ? "Win" : "Loss"}</span>
        <span></span>
      </div>
      ${!hasTeamScores ? '<div class="boxscore-empty">Player stats not recorded.</div>' : ""}
    </div>
  `;
  return {
    team1Header: parsed1.name || game.team1,
    team2Header: parsed2.name || game.team2,
    team1Score: parsed1.score || "",
    team2Score: parsed2.score || "",
    team1,
    team2,
    finalScore,
    hasPlayerStats,
    html: hasPlayerStats
      ? `
        ${game.winner ? `<div class="boxscore-meta">Winner: ${escapeHtml(game.winner)}</div>` : ""}
        <div class="boxscore-meta">League Day: ${escapeHtml(game.dateToken)}</div>
        ${renderTeamTable(team1, team1Header)}
        ${renderTeamTable(team2, team2Header)}
      `
      : teamOnlyHtml,
  };
}

function getGameScoreState(game) {
  const cacheKey = getGameCacheKey(game);
  const cached = gameScoreStateCache.get(cacheKey);
  if (cached) return cached;

  const live = liveScoreMap.get(cacheKey);
  if (live) {
    const outcomes = getOutcomeFromScores(live.team1Score, live.team2Score);
    const payload = {
      status: "live",
      label: "LIVE",
      team1Score: live.team1Score || "",
      team2Score: live.team2Score || "",
      team1Outcome: outcomes.team1,
      team2Outcome: outcomes.team2,
      livePayload: live,
    };
    gameScoreStateCache.set(cacheKey, payload);
    return payload;
  }
  const final = finalScoreMap.get(cacheKey);
  if (final && final.team1Score && final.team2Score) {
    const outcomes = getOutcomeFromScores(final.team1Score, final.team2Score);
    const payload = {
      status: "final",
      label: "FINAL",
      team1Score: final.team1Score,
      team2Score: final.team2Score,
      team1Outcome: outcomes.team1,
      team2Outcome: outcomes.team2,
    };
    gameScoreStateCache.set(cacheKey, payload);
    return payload;
  }
  const payload = getBoxScorePayload(game);
  if (payload.finalScore) {
    const outcomes = getOutcomeFromScores(payload.team1Score, payload.team2Score);
    const state = {
      status: "final",
      label: "FINAL",
      team1Score: payload.team1Score || "",
      team2Score: payload.team2Score || "",
      team1Outcome: outcomes.team1,
      team2Outcome: outcomes.team2,
    };
    gameScoreStateCache.set(cacheKey, state);
    return state;
  }
  if (game.winner) {
    const state = {
      status: "final",
      label: "FINAL",
      team1Score: "",
      team2Score: "",
      team1Outcome: normalizeTeamName(game.winner) === normalizeTeamName(game.team1) ? "win" : "loss",
      team2Outcome: normalizeTeamName(game.winner) === normalizeTeamName(game.team2) ? "win" : "loss",
    };
    gameScoreStateCache.set(cacheKey, state);
    return state;
  }
  const state = {
    status: "upcoming",
    label: "UPCOMING",
    team1Score: "",
    team2Score: "",
    team1Outcome: "",
    team2Outcome: "",
  };
  gameScoreStateCache.set(cacheKey, state);
  return state;
}

function buildLiveBoxMarkup(game, livePayload) {
  if (!livePayload) return "";
  const parsed1 = parseTeamHeader(livePayload.team1Header);
  const parsed2 = parseTeamHeader(livePayload.team2Header);
  const renderTeam = (header, players) => {
    const parsed = parseTeamHeader(header);
    const team = parsed.name || "";
    const logo = getTeamLogo(team);
    const logoHtml = logo
      ? `<img class="standings-logo" src="${logo}" alt="${escapeHtml(displayTeamName(team))} logo" />`
      : "";
    const teamLink = `/team.html?team=${encodeURIComponent(team)}`;
    const rows = (players || [])
      .map(
        (p) => `<div class="boxscore-row">
          <a class="boxscore-link" href="/player-detail.html?player=${encodeURIComponent(p.player)}">${escapeHtml(formatPlayerDisplay(p))}</a>
          <span>${escapeHtml(p.points || "")}</span>
          <span>${escapeHtml(p.rank || "")}</span>
        </div>`
      )
      .join("");
    return `<div class="boxscore-card">
      <a class="boxscore-team" href="${teamLink}">${logoHtml}<span>${escapeHtml(parsed.name || header)}</span></a>
      <div class="boxscore-row"><span>Player</span><span>Points</span><span>Rank</span></div>
      ${rows || '<div class="boxscore-empty">No stats available.</div>'}
    </div>`;
  };
  return `<div class="boxscore-meta">League Day: ${escapeHtml(game.dateToken)}</div>
    ${renderTeam(livePayload.team1Header, livePayload.team1Players)}
    ${renderTeam(livePayload.team2Header, livePayload.team2Players)}`;
}

function buildGameFlowMarkup(team1Name, team2Name, snapshots) {
  const team1Key = normalizeTeamName(team1Name);
  const team2Key = normalizeTeamName(team2Name);
  const ordered = (Array.isArray(snapshots) ? [...snapshots] : [])
    .sort((a, b) => Number(a.snapshot_minute || 0) - Number(b.snapshot_minute || 0))
    .map((row) => {
      const storedTeam1 = normalizeTeamName(row.team1);
      const aligned =
        storedTeam1 === team1Key
          ? { team1Score: Number(row.team1_score || 0), team2Score: Number(row.team2_score || 0) }
          : { team1Score: Number(row.team2_score || 0), team2Score: Number(row.team1_score || 0) };
      return {
        label: String(row.snapshot_label || "").trim() || `${row.snapshot_minute || 0}m`,
        minute: Number(row.snapshot_minute || 0),
        team1Score: aligned.team1Score,
        team2Score: aligned.team2Score,
      };
    });

  if (!ordered.length) {
    return `<div class="game-flow-shell"><div class="boxscore-empty">No game flow snapshots yet.</div></div>`;
  }

  const maxScore = Math.max(
    ...ordered.map((item) => Math.max(item.team1Score, item.team2Score)),
    1
  );
  const width = 640;
  const height = 240;
  const padX = 48;
  const padY = 28;
  const plotWidth = width - padX * 2;
  const plotHeight = height - padY * 2;
  const xForIndex = (index) =>
    ordered.length <= 1 ? width / 2 : padX + (plotWidth * index) / (ordered.length - 1);
  const yForScore = (score) => padY + plotHeight - (plotHeight * score) / maxScore;
  const linePoints = (key) =>
    ordered
      .map((item, index) => `${xForIndex(index)},${yForScore(item[key])}`)
      .join(" ");
  const latest = ordered[ordered.length - 1] || null;
  const checkpoints = latest
    ? (() => {
        let leader = "Tied";
        if (latest.team1Score > latest.team2Score) leader = team1Name;
        if (latest.team2Score > latest.team1Score) leader = team2Name;
        return `
          <div class="game-flow-checkpoint">
            <div class="game-flow-checkpoint-time">${escapeHtml(latest.label)}</div>
            <div class="game-flow-checkpoint-score">${escapeHtml(team1Name)} ${latest.team1Score} - ${latest.team2Score} ${escapeHtml(team2Name)}</div>
            <div class="game-flow-checkpoint-leader">${escapeHtml(leader)}</div>
          </div>
        `;
      })()
    : "";

  const svg = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Game flow chart">
      <line class="game-flow-axis" x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" />
      <line class="game-flow-axis" x1="${padX}" y1="${padY}" x2="${padX}" y2="${height - padY}" />
      <polyline class="game-flow-line team1" points="${linePoints("team1Score")}" />
      <polyline class="game-flow-line team2" points="${linePoints("team2Score")}" />
      ${ordered
        .map((item, index) => {
          const x = xForIndex(index);
          const y1 = yForScore(item.team1Score);
          const y2 = yForScore(item.team2Score);
          return `
            <circle class="game-flow-dot team1" cx="${x}" cy="${y1}" r="4.5"></circle>
            <circle class="game-flow-dot team2" cx="${x}" cy="${y2}" r="4.5"></circle>
            <text class="game-flow-label" x="${x}" y="${height - 8}" text-anchor="middle">${escapeHtml(item.label)}</text>
            <text class="game-flow-value team1" x="${x}" y="${Math.max(y1 - 10, 12)}" text-anchor="middle">${item.team1Score}</text>
            <text class="game-flow-value team2" x="${x}" y="${Math.max(y2 - 10, 12)}" text-anchor="middle">${item.team2Score}</text>
          `;
        })
        .join("")}
    </svg>
  `;

  return `
    <div class="game-flow-shell">
      <div class="game-flow-header">
        <h3 class="game-flow-title">Game Flow</h3>
        <div class="game-flow-subtitle">Saved every 15 minutes during live play</div>
      </div>
      <div class="game-flow-legend">
        <div class="game-flow-legend-item"><span class="game-flow-legend-swatch team1"></span>${escapeHtml(team1Name)}</div>
        <div class="game-flow-legend-item"><span class="game-flow-legend-swatch team2"></span>${escapeHtml(team2Name)}</div>
      </div>
      <div class="game-flow-chart">${svg}</div>
      <div class="game-flow-checkpoints">${checkpoints}</div>
    </div>
  `;
}

function buildBoxScoreViewShell(innerHtml, config) {
  const showFlow = config.showFlow !== false;
  return `
    <div class="boxscore-view-shell"
      data-flow-game-key="${escapeHtml(config.gameKey)}"
      data-flow-season="${escapeHtml(config.season)}"
      data-flow-team1="${escapeHtml(config.team1Name)}"
      data-flow-team2="${escapeHtml(config.team2Name)}">
      ${config.reviewLink ? `<div class="boxscore-action-row">${config.reviewLink}</div>` : ""}
      ${
        showFlow
          ? `<div class="boxscore-view-tabs">
              <button class="boxscore-view-tab active" type="button" data-box-view="boxscore">Box Score</button>
              <button class="boxscore-view-tab" type="button" data-box-view="flow">Game Flow</button>
            </div>`
          : ""
      }
      <div class="boxscore-view-panel" data-box-panel="boxscore">${innerHtml}</div>
      ${
        showFlow
          ? `<div class="boxscore-view-panel" data-box-panel="flow" hidden>
              <div class="boxscore-empty">Loading game flow…</div>
            </div>`
          : ""
      }
    </div>
  `;
}

async function loadGameFlowPanel(root) {
  if (!root || root.dataset.flowLoaded === "1" || root.dataset.flowLoading === "1") return;
  const panel = root.querySelector('[data-box-panel="flow"]');
  if (!panel) return;
  root.dataset.flowLoading = "1";
  try {
    const gameKey = String(root.dataset.flowGameKey || "").trim();
    const season = String(root.dataset.flowSeason || "").trim();
    const team1Name = String(root.dataset.flowTeam1 || "").trim();
    const team2Name = String(root.dataset.flowTeam2 || "").trim();
    const response = await fetch(
      `${GAME_FLOW_API}?gameKey=${encodeURIComponent(gameKey)}&season=${encodeURIComponent(season)}`,
      { cache: "no-store" }
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.message || `Game flow failed: ${response.status}`);
    }
    panel.innerHTML = buildGameFlowMarkup(team1Name, team2Name, payload.snapshots || []);
    root.dataset.flowLoaded = "1";
  } catch (error) {
    panel.innerHTML = `<div class="boxscore-empty">${escapeHtml(error.message || "Unable to load game flow.")}</div>`;
  } finally {
    root.dataset.flowLoading = "0";
  }
}

function setBoxScoreView(root, view) {
  if (!root) return;
  root.querySelectorAll("[data-box-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.boxView === view);
  });
  root.querySelectorAll("[data-box-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.boxPanel !== view;
  });
  if (view === "flow") {
    loadGameFlowPanel(root);
  }
}

function buildPreviewMarkup(game) {
  const articleLinks = buildGameArticleLinks(game);
  const previewForTeam = (teamName, opponentName) => {
    const history = scheduleGames
      .filter((g) => {
        if (!g.dateObj || !game.dateObj || g.dateObj >= game.dateObj) return false;
        if (g.team1 !== teamName && g.team2 !== teamName) return false;
        return finalScoreMap.has(buildGameKey(g.dateToken, g.team1, g.team2));
      })
      .sort((a, b) => b.dateObj - a.dateObj)
      .slice(0, 3)
      .map((g) => {
        const s = finalScoreMap.get(buildGameKey(g.dateToken, g.team1, g.team2));
        const isHome = g.team1 === teamName;
        const my = isHome ? s.team1Score : s.team2Score;
        const opp = isHome ? s.team2Score : s.team1Score;
        const oppName = isHome ? g.team2 : g.team1;
        const result = parseNumericScore(my) > parseNumericScore(opp) ? "W" : "L";
        return `${g.dateToken} • ${result} ${my}-${opp} vs ${oppName}`;
      });

    const leaders = teamLeadersMap.get(teamName) || {};
    const renderLeader = (label, item, formatter) =>
      `<div class="preview-metric"><span>${label}</span><strong>${item ? `${item.player} (${formatter(item)})` : "—"}</strong></div>`;

    return `<div class="preview-team-card">
      <h4>${escapeHtml(teamName)} <span>vs ${escapeHtml(opponentName)}</span></h4>
      <div class="preview-sub">Last 3 Games</div>
      <ul>${history.map((h) => `<li>${escapeHtml(h)}</li>`).join("") || "<li>No completed games yet.</li>"}</ul>
      ${renderLeader("Top AVG", leaders.topAvg, (v) => v.avg.toFixed(1))}
      ${renderLeader("Top REL", leaders.topRel, (v) => v.rel.toFixed(3))}
      ${renderLeader("Top WAR", leaders.topWar, (v) => v.war.toFixed(2))}
    </div>`;
  };

  return `${articleLinks ? `<div class="boxscore-action-row">${articleLinks}</div>` : ""}<div class="preview-grid">
    ${previewForTeam(game.team1, game.team2)}
    ${previewForTeam(game.team2, game.team1)}
  </div>`;
}

function buildGameCards(games) {
  const term = String(els.search?.value || "").trim().toLowerCase();
  const filtered = term
    ? games.filter((g) =>
        [g.team1, g.team2, g.rawDate, g.dateToken].join(" ").toLowerCase().includes(term)
      )
    : games;
  return filtered
    .map((g, idx) => {
      const logo1 = getTeamLogo(g.team1);
      const logo2 = getTeamLogo(g.team2);
      const l1 = logo1
        ? `<img class="standings-logo" src="${logo1}" alt="${escapeHtml(displayTeamName(g.team1))} logo" />`
        : "";
      const l2 = logo2
        ? `<img class="standings-logo" src="${logo2}" alt="${escapeHtml(displayTeamName(g.team2))} logo" />`
        : "";
      const scoreState = getGameScoreState(g);
      const team1ScoreLine = scoreState.team1Score
        ? `<span class="team-score-line ${escapeHtml(scoreState.status)}">${
            scoreState.status === "live"
              ? '<span class="live-pulse-dot"></span>'
              : ""
          }${
            scoreState.team1Outcome === "win"
              ? '<span class="outcome-mark win">✓</span>'
              : scoreState.team1Outcome === "loss"
              ? '<span class="outcome-mark loss">✕</span>'
              : ""
          }${escapeHtml(scoreState.team1Score)}</span>`
        : "";
      const team2ScoreLine = scoreState.team2Score
        ? `<span class="team-score-line ${escapeHtml(scoreState.status)}">${
            scoreState.status === "live"
              ? '<span class="live-pulse-dot"></span>'
              : ""
          }${
            scoreState.team2Outcome === "win"
              ? '<span class="outcome-mark win">✓</span>'
              : scoreState.team2Outcome === "loss"
              ? '<span class="outcome-mark loss">✕</span>'
              : ""
          }${escapeHtml(scoreState.team2Score)}</span>`
        : "";
      const isTodayGame = g.dateToken === getTodayToken();
      const articleLinks = buildGameArticleLinks(g, {
        includePreview: scoreState.status === "upcoming" || scoreState.status === "final",
        includeSummary: scoreState.status === "final" || scoreState.status === "live",
      });
      return `
        <div class="calendar-game ${isTodayGame ? "today-game" : ""}" data-game-index="${g.idx}" aria-expanded="false">
          <div class="calendar-game-date">${escapeHtml(g.dateToken)}</div>
          <div class="calendar-game-matchup">
            <a class="schedule-team-link" href="/team.html?team=${encodeURIComponent(g.team1)}">${l1}<span class="team-name-stack"><span>${escapeHtml(displayTeamName(g.team1))}</span>${team1ScoreLine}</span></a>
            <span>vs</span>
            <a class="schedule-team-link" href="/team.html?team=${encodeURIComponent(g.team2)}">${l2}<span class="team-name-stack"><span>${escapeHtml(displayTeamName(g.team2))}</span>${team2ScoreLine}</span></a>
          </div>
          <div class="calendar-game-status ${escapeHtml(scoreState.status)}">
            <strong>${escapeHtml(scoreState.label)}</strong>
          </div>
          ${articleLinks ? `<div class="boxscore-action-row">${articleLinks}</div>` : ""}
          <div class="calendar-game-details" hidden></div>
        </div>
      `;
    })
    .join("");
}

function renderGameSection(target, games, emptyMessage) {
  if (!target) return;
  target.hidden = false;
  const html = buildGameCards(games);
  target.innerHTML = html || `<div class="gm-empty">${escapeHtml(emptyMessage)}</div>`;
}

function getUpcomingGameDay() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sorted = [...scheduleGames].sort(compareGameDates);
  const upcoming = sorted.filter((game) => {
    if (!game.dateObj) return true;
    const date = new Date(game.dateObj);
    date.setHours(0, 0, 0, 0);
    return date >= today;
  });
  const source = upcoming.length ? upcoming : sorted;
  const nextGame = source[0];
  if (!nextGame) {
    return { label: "Upcoming Game Day", games: [] };
  }
  const sameDayGames = source.filter((game) => game.dateToken === nextGame.dateToken);
  return {
    label: `Upcoming Game Day: ${formatDayLabel(nextGame.dateToken)}`,
    games: sameDayGames,
  };
}

function renderScheduleViews() {
  populateDaySelect();
  const upcomingDay = getUpcomingGameDay();
  if (els.upcomingGamesTitle) {
    els.upcomingGamesTitle.textContent = upcomingDay.label;
  }
  if (els.dayGamesTitle) {
    els.dayGamesTitle.textContent = selectedDateKey
      ? `Games for ${formatDayLabel(selectedDateKey)}`
      : "Games By Day";
  }
  renderGameSection(els.nextGames, upcomingDay.games, "No upcoming games found.");
  renderGameSection(
    els.dayGames,
    selectedDateKey ? gamesByDate.get(selectedDateKey) || [] : [],
    "No games found for that day."
  );
}

function bindCalendarEvents() {
  if (els.daySelect) {
    els.daySelect.addEventListener("change", () => {
      selectedDateKey = String(els.daySelect.value || "");
      renderScheduleViews();
    });
  }

  const setCardOpenState = (card, isOpen) => {
    const details = card.querySelector(".calendar-game-details");
    if (!details) return;
    details.hidden = !isOpen;
    card.classList.toggle("open", isOpen);
    card.setAttribute("aria-expanded", isOpen ? "true" : "false");
  };

  const handleGameClick = (event) => {
    const viewButton = event.target.closest("[data-box-view]");
    if (viewButton) {
      event.preventDefault();
      event.stopPropagation();
      setBoxScoreView(viewButton.closest(".boxscore-view-shell"), viewButton.dataset.boxView || "boxscore");
      return;
    }
    const link = event.target.closest("a");
    if (link) return;
    const card = event.target.closest("[data-game-index]");
    if (!card) return;
    const idx = String(card.dataset.gameIndex || "");
    const game = scheduleGames.find((candidate) => String(candidate.idx) === idx);
    if (!game) return;
    const details = card.querySelector(".calendar-game-details");
    if (!details) return;
    const shouldClose = card.classList.contains("open");
    if (shouldClose) {
      setCardOpenState(card, false);
      return;
    }
    if (!details.dataset.loaded) {
      const scoreState = getGameScoreState(game);
      if (scoreState.status === "upcoming") {
        details.innerHTML = buildPreviewMarkup(game);
      } else if (scoreState.status === "live") {
        const parsed1 = parseTeamHeader(scoreState.livePayload?.team1Header || game.team1);
        const parsed2 = parseTeamHeader(scoreState.livePayload?.team2Header || game.team2);
        details.innerHTML = buildBoxScoreViewShell(
          buildLiveBoxMarkup(game, scoreState.livePayload),
          {
            gameKey: buildGameKey(game.dateToken, parsed1.name || game.team1, parsed2.name || game.team2),
            season: getSeasonRaw(),
          team1Name: parsed1.name || game.team1,
          team2Name: parsed2.name || game.team2,
          reviewLink: buildGameArticleLinks(game),
        }
      );
      } else {
        const payload = getBoxScorePayload(game);
        const parsed1 = parseTeamHeader(payload.team1Header || game.team1);
        const parsed2 = parseTeamHeader(payload.team2Header || game.team2);
        details.innerHTML = buildBoxScoreViewShell(payload.html, {
          gameKey: buildGameKey(game.dateToken, parsed1.name || game.team1, parsed2.name || game.team2),
          season: getSeasonRaw(),
          team1Name: parsed1.name || game.team1,
          team2Name: parsed2.name || game.team2,
          showFlow: payload.hasPlayerStats,
          reviewLink: buildGameArticleLinks(game),
        });
      }
      details.dataset.loaded = "1";
    }
    setCardOpenState(card, true);
  };

  if (els.nextGames) {
    els.nextGames.addEventListener("click", handleGameClick);
  }
  if (els.dayGames) {
    els.dayGames.addEventListener("click", handleGameClick);
  }

  if (els.search) {
    let searchTimer = 0;
    els.search.addEventListener("input", () => {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        searchTimer = 0;
        renderScheduleViews();
      }, 80);
    });
  }

  document.addEventListener("click", (event) => {
    if (event.target.matches('[data-close="true"]')) {
      els.modal.hidden = true;
    }
  });
}

function resetScheduleEnhancements() {
  cachedBoxScoreRows = [];
  liveScoreMap = new Map();
  finalScoreMap = new Map();
  teamLeadersMap = new Map();
  gameScoreStateCache = new Map();
}

function applyInitialScheduleRows(rows, season) {
  if (!rows.length) {
    throw new Error("No data found.");
  }

  scheduleGames = buildGames(rows, season);
  scheduleGames.sort(compareGameDates);
  rebuildGamesByDate();
  gameScoreStateCache = new Map();

  if (!scheduleGames.length) {
    throw new Error("No games found.");
  }

  const todayToken = getTodayToken();
  const upcomingGames = getUpcomingGameDay().games;
  selectedDateKey = gamesByDate.has(todayToken)
    ? todayToken
    : upcomingGames[0]
    ? upcomingGames[0].dateToken
    : scheduleGames[0].dateToken;
  scheduleRenderScheduleViews();
  loadGameContent();
  updateLastUpdated();
}

async function hydrateCurrentSeasonSchedule(loadToken, seasonRaw = getSeasonRaw()) {
  const [boxRes, liveRes, playerStatsRes] = await Promise.allSettled([
    fetch(BOXSCORE_CSV_URL, { cache: "no-store" }),
    fetch(LIVE_CSV_URL, { cache: "no-store" }),
    fetch(PLAYER_STATS_URL, { cache: "no-store" }),
  ]);

  if (loadToken !== scheduleLoadToken) {
    return;
  }

  if (boxRes.status === "fulfilled" && boxRes.value.ok) {
    cachedBoxScoreRows = parseCSV(await boxRes.value.text()).slice(0, 1000);
    finalScoreMap = buildFinalScoreMap(cachedBoxScoreRows);
  }

  let liveRows = [];
  if (liveRes.status === "fulfilled" && liveRes.value.ok) {
    liveRows = parseCSV(await liveRes.value.text());
    liveScoreMap = buildLiveScoreMap(liveRows);
  }

  let playerRows = [];
  if (playerStatsRes.status === "fulfilled" && playerStatsRes.value.ok) {
    playerRows = parseCSV(await playerStatsRes.value.text());
    teamLeadersMap = computeTeamLeaders(playerRows);
  }

  writeCachedScheduleEnhancements(seasonRaw, {
    boxScoreRows: cachedBoxScoreRows,
    liveRows,
    playerRows,
  });

  scheduleRenderScheduleViews();
}

function hydrateEmbeddedScheduleData(regularRows, loadToken, seasonRaw) {
  setTimeout(() => {
    if (loadToken !== scheduleLoadToken) {
      return;
    }
    cachedBoxScoreRows = sliceRange(regularRows, C2S2_REGULAR_RANGES.boxscore);
    finalScoreMap = buildFinalScoreMap(cachedBoxScoreRows);
    const playerRows = sliceRange(regularRows, "A151:G1150");
    teamLeadersMap = computeTeamLeaders(playerRows);
    writeCachedScheduleEnhancements(seasonRaw, {
      boxScoreRows: cachedBoxScoreRows,
      liveRows: [],
      playerRows,
    });
    scheduleRenderScheduleViews();
  }, 0);
}

function hydrateArchiveScheduleData(archiveRows, loadToken, seasonRaw) {
  setTimeout(() => {
    if (loadToken !== scheduleLoadToken) {
      return;
    }
    cachedBoxScoreRows = sliceRange(archiveRows, ARCHIVE_RANGES.boxscore);
    finalScoreMap = buildFinalScoreMap(cachedBoxScoreRows);
    writeCachedScheduleEnhancements(seasonRaw, {
      boxScoreRows: cachedBoxScoreRows,
      liveRows: [],
      playerRows: [],
    });
    scheduleRenderScheduleViews();
  }, 0);
}

async function loadSchedule() {
  const loadToken = ++scheduleLoadToken;
  try {
    const seasonRaw = getSeasonRaw();
    const season = getSeason();
    let rows = [];
    const cachedRows = readCachedScheduleRows(seasonRaw);
    resetScheduleEnhancements();

    if (cachedRows.length) {
      try {
        applyInitialScheduleRows(cachedRows, season);
      } catch (error) {
        // ignore stale cache parse failures and continue with network fetch
      }
    }
    hydrateCachedEnhancements(seasonRaw);

    if (seasonRaw === "c2s3-playoffs" || seasonRaw === "c2s2-playoffs") {
      const scheduleRes = await fetch(SCHEDULE_CSV_URL, { cache: "no-store" });
      if (!scheduleRes.ok) throw new Error(`Fetch failed: ${scheduleRes.status}`);
      rows = getC2S2ScheduleRows(parseCSV(await scheduleRes.text()));
    } else if (seasonRaw === "c2s2-regular") {
      const regularRes = await fetch(C2S2_REGULAR_URL, { cache: "no-store" });
      if (!regularRes.ok) throw new Error(`Fetch failed: ${regularRes.status}`);
      const regularRows = parseCSV(await regularRes.text());
      rows = getC2S2RegularScheduleRows(regularRows);
      writeCachedScheduleRows(seasonRaw, rows);
      applyInitialScheduleRows(rows, season);
      hydrateEmbeddedScheduleData(regularRows, loadToken, seasonRaw);
      return;
    } else if (seasonRaw === "c1s2-regular" || seasonRaw === "c1s2-post") {
      const response = await fetch(
        seasonRaw === "c1s2-post" ? C1S2_POST_SCHEDULE_URL : C1S2_REGULAR_SCHEDULE_URL,
        { cache: "no-store" }
      );
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      rows = parseCSV(await response.text());
      writeCachedScheduleRows(seasonRaw, rows);
      applyInitialScheduleRows(rows, seasonRaw);
      return;
    } else if (seasonRaw === "c1s6-regular" || seasonRaw === "c1s6-post") {
      const response = await fetch(
        seasonRaw === "c1s6-post" ? C1S6_POST_SCHEDULE_URL : C1S6_REGULAR_SCHEDULE_URL,
        { cache: "no-store" }
      );
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      rows = parseCSV(await response.text());
      writeCachedScheduleRows(seasonRaw, rows);
      applyInitialScheduleRows(rows, seasonRaw);
      return;
    } else if (seasonRaw === "c1s5-regular" || seasonRaw === "c1s5-post") {
      const response = await fetch(
        seasonRaw === "c1s5-post" ? C1S5_POST_SCHEDULE_URL : C1S5_REGULAR_SCHEDULE_URL,
        { cache: "no-store" }
      );
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      rows = parseCSV(await response.text());
      writeCachedScheduleRows(seasonRaw, rows);
      applyInitialScheduleRows(rows, seasonRaw);
      return;
    } else if (seasonRaw === "c1s3-regular" || seasonRaw === "c1s3-post") {
      const response = await fetch(
        seasonRaw === "c1s3-post" ? C1S3_POST_SCHEDULE_URL : C1S3_REGULAR_SCHEDULE_URL,
        { cache: "no-store" }
      );
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      rows = parseCSV(await response.text());
      writeCachedScheduleRows(seasonRaw, rows);
      applyInitialScheduleRows(rows, seasonRaw);
      return;
    } else if (seasonRaw === "c1s4-regular" || seasonRaw === "c1s4-post") {
      const response = await fetch(
        seasonRaw === "c1s4-post" ? C1S4_POST_SCHEDULE_URL : C1S4_REGULAR_SCHEDULE_URL,
        { cache: "no-store" }
      );
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      rows = parseCSV(await response.text());
      writeCachedScheduleRows(seasonRaw, rows);
      applyInitialScheduleRows(rows, seasonRaw);
      return;
    } else {
      const response = await fetch(ARCHIVE_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      const archive = parseCSV(await response.text());
      const range = season === "c2s1-post" ? ARCHIVE_RANGES.schedule_post : ARCHIVE_RANGES.schedule_regular;
      rows = sliceRange(archive, range);
      writeCachedScheduleRows(seasonRaw, rows);
      applyInitialScheduleRows(rows, season);
      hydrateArchiveScheduleData(archive, loadToken, seasonRaw);
      return;
    }

    writeCachedScheduleRows(seasonRaw, rows);
    applyInitialScheduleRows(rows, season);
    hydrateCurrentSeasonSchedule(loadToken, seasonRaw);
  } catch (error) {
    renderGameSection(els.nextGames, [], error.message);
    renderGameSection(els.dayGames, [], error.message);
  }
}

initSeasonSelect();
bindCalendarEvents();
loadSchedule();
