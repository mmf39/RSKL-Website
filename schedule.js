const SCHEDULE_CSV_URL = "/api/sheet?name=schedule";
const BOXSCORE_CSV_URL = "/api/sheet?name=boxscore";
const LIVE_CSV_URL = "/api/sheet?name=live-scoring";
const PLAYER_STATS_URL = "/api/sheet?name=player-stats";
const ARCHIVE_URL = "/api/sheet?name=archive";
const SEASON_KEY = "season";

const els = {
  lastUpdated: document.getElementById("last-updated"),
  search: document.getElementById("schedule-search"),
  modal: document.getElementById("boxscore-modal"),
  boxDetails: document.getElementById("boxscore-details"),
  gamesModal: document.getElementById("games-modal"),
  gamesModalTitle: document.getElementById("games-modal-title"),
  gamesModalDetails: document.getElementById("games-modal-details"),
  month: document.getElementById("calendar-month"),
  prev: document.getElementById("calendar-prev"),
  next: document.getElementById("calendar-next"),
  grid: document.getElementById("calendar-grid"),
  games: document.getElementById("calendar-games"),
};

let cachedBoxScoreRows = [];
let liveScoreMap = new Map();
let finalScoreMap = new Map();
let teamLeadersMap = new Map();
let scheduleGames = [];
let gamesByDate = new Map();
let currentMonth = null;
let selectedDateKey = "";

const ARCHIVE_RANGES = {
  schedule_regular: "G31:I79",
  schedule_post: "A31:D43",
  boxscore: "L31:R149",
};
const C2S2_SCHEDULE_RANGE = "A1:E82";

function getSeasonRaw() {
  const raw = localStorage.getItem(SEASON_KEY) || "c2s2-playoffs";
  if (raw === "c2s2") return "c2s2-playoffs";
  return raw;
}

function getSeason() {
  const raw = getSeasonRaw();
  if (raw === "c2s2-playoffs" || raw === "c2s2-regular") return "c2s2";
  return raw;
}

function initSeasonSelect() {
  const select = document.getElementById("season-select");
  if (!select) return;
  select.value = getSeasonRaw();
  if (!select.value) {
    select.value = "c2s2-playoffs";
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
  const sliced = sliceRange(rows, C2S2_SCHEDULE_RANGE);
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
  return name === "Bullets" ? "Storm" : name;
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
  if (clean === "The Future") return "/assets/the-future.png";
  if (clean === "The Lions") return "/assets/the-lions.png";
  if (clean === "The Snipers") return "/assets/the-snipers.png";
  if (clean === "The Phantoms") return "/assets/the-phantoms.png";
  if (clean === "Yetis") return "/assets/yetis.png";
  if (clean === "Gus N Em") return "/assets/gus-n-em.png";
  if (clean === "Cheerios") return "/assets/cheerios.png";
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

function parseTeamHeader(value) {
  const text = String(value || "").trim();
  if (!text) return { name: "", score: "" };
  const match = text.match(/^(.*?)(?:\(([-+]?\d+)\))?\s*$/);
  const name = displayTeamName((match ? match[1] : text).trim());
  const score = match && match[2] ? String(match[2]).trim() : "";
  return { name, score };
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

  const looksLikeHeader = (left, right) =>
    left &&
    right &&
    !left.startsWith("@") &&
    !right.startsWith("@") &&
    (/\(\s*-?\d+\s*\)/.test(left) || /\(\s*-?\d+\s*\)/.test(right));

  const games = [];
  let current = null;
  dataRows.forEach((row) => {
    const left = String(row[0] || "").trim();
    const right = String(row[4] || "").trim();
    if (looksLikeHeader(left, right)) {
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
    const right = String(header[4] || "").trim();
    const team1 = parseTeamHeader(left);
    const team2 = parseTeamHeader(right);
    if (!team1.name || !team2.name) return;

    const team1Players = game.players
      .filter((r) => String(r[0] || "").trim() !== "")
      .map((r) => ({
        player: String(r[0] || "").trim(),
        points: String(r[1] || ""),
        rank: String(r[2] || ""),
      }));
    const team2Players = game.players
      .filter((r) => String(r[4] || "").trim() !== "")
      .map((r) => ({
        player: String(r[4] || "").trim(),
        points: String(r[5] || ""),
        rank: String(r[6] || ""),
      }));

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
    const right = String(row[4] || "").trim();
    if (!day || !left || !right) continue;
    if (left.startsWith("@") || right.startsWith("@")) continue;
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
      if (!dateToken || !team1 || !team2) return null;
      return {
        rawDate,
        dateToken,
        dateObj,
        team1,
        team2,
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

function formatMonthLabel(d) {
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

function getMonthBounds(d) {
  return {
    first: new Date(d.getFullYear(), d.getMonth(), 1),
    last: new Date(d.getFullYear(), d.getMonth() + 1, 0),
  };
}

function renderCalendar() {
  if (!els.grid || !currentMonth) return;
  const { first, last } = getMonthBounds(currentMonth);
  if (els.month) els.month.textContent = formatMonthLabel(first);

  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const cells = [];

  weekday.forEach((w) => cells.push(`<div class="calendar-weekday">${w}</div>`));
  for (let i = 0; i < first.getDay(); i += 1) {
    cells.push('<div class="calendar-day empty"></div>');
  }

  for (let day = 1; day <= last.getDate(); day += 1) {
    const token = `${first.getMonth() + 1}/${day}`;
    const gameCount = (gamesByDate.get(token) || []).length;
    const hasGames = gameCount > 0;
    const isSelected = token === selectedDateKey;
    const now = new Date();
    const isToday =
      now.getFullYear() === first.getFullYear() &&
      now.getMonth() === first.getMonth() &&
      now.getDate() === day;
    cells.push(`
      <button class="calendar-day ${hasGames ? "has-games" : ""} ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}" data-date="${token}" type="button">
        <span class="calendar-num">${day}</span>
        <span class="calendar-count">${gameCount} ${gameCount === 1 ? "game" : "games"}</span>
      </button>
    `);
  }

  els.grid.innerHTML = cells.join("");
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
    const right = String(row[4] || "").trim();
    const isHeader =
      left &&
      right &&
      !left.startsWith("@") &&
      !right.startsWith("@") &&
      !left.includes("League Day") &&
      !right.includes("League Day");
    const isPlayer = left.startsWith("@") || right.startsWith("@");
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
    const h2 = normalizeTeamName(parseTeamHeader(header[4]).name);
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

  const toTeamRows = (rowsIn, side) => {
    if (side === 1) {
      return rowsIn.filter((r) => String(r[0] || "").trim() !== "");
    }
    return rowsIn.filter((r) => String(r[4] || "").trim() !== "");
  };

  const team1Rows = toTeamRows(rows, 1);
  const team2Rows = toTeamRows(rows, 2);
  const team1Header = team1Rows.length ? team1Rows[0][0] : game.team1;
  const team2Header = team2Rows.length ? team2Rows[0][4] : game.team2;

  const mapRows = (arr, side) =>
    arr.slice(1).map((row) =>
      side === 1
        ? { player: row[0] || "", points: row[1] || "", rank: row[2] || "" }
        : { player: row[4] || "", points: row[5] || "", rank: row[6] || "" }
    );

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
                <a class="boxscore-link" href="/player-detail.html?player=${encodeURIComponent(String(p.player || "").trim())}">${escapeHtml(p.player)}</a>
                <span>${escapeHtml(p.points)}</span>
                <span>${escapeHtml(p.rank)}</span>
              </div>
            `
          )
          .join("")
      : '<div class="boxscore-empty">No stats available.</div>';

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

  return {
    team1Header: parsed1.name || game.team1,
    team2Header: parsed2.name || game.team2,
    team1Score: parsed1.score || "",
    team2Score: parsed2.score || "",
    team1,
    team2,
    finalScore,
    html: `
      <div class="boxscore-meta">League Day: ${escapeHtml(game.dateToken)}</div>
      ${renderTeamTable(team1, team1Header)}
      ${renderTeamTable(team2, team2Header)}
    `,
  };
}

function getGameScoreState(game) {
  const live = liveScoreMap.get(buildGameKey(game.dateToken, game.team1, game.team2));
  if (live) {
    const outcomes = getOutcomeFromScores(live.team1Score, live.team2Score);
    return {
      status: "live",
      label: "LIVE",
      team1Score: live.team1Score || "",
      team2Score: live.team2Score || "",
      team1Outcome: outcomes.team1,
      team2Outcome: outcomes.team2,
      livePayload: live,
    };
  }
  const final = finalScoreMap.get(buildGameKey(game.dateToken, game.team1, game.team2));
  if (final && final.team1Score && final.team2Score) {
    const outcomes = getOutcomeFromScores(final.team1Score, final.team2Score);
    return {
      status: "final",
      label: "FINAL",
      team1Score: final.team1Score,
      team2Score: final.team2Score,
      team1Outcome: outcomes.team1,
      team2Outcome: outcomes.team2,
    };
  }
  const payload = getBoxScorePayload(game);
  if (payload.finalScore) {
    const outcomes = getOutcomeFromScores(payload.team1Score, payload.team2Score);
    return {
      status: "final",
      label: "FINAL",
      team1Score: payload.team1Score || "",
      team2Score: payload.team2Score || "",
      team1Outcome: outcomes.team1,
      team2Outcome: outcomes.team2,
    };
  }
  return {
    status: "upcoming",
    label: "UPCOMING",
    team1Score: "",
    team2Score: "",
    team1Outcome: "",
    team2Outcome: "",
  };
}

function buildLiveBoxMarkup(game, livePayload) {
  if (!livePayload) return "";
  const renderTeam = (header, players) => {
    const parsed = parseTeamHeader(header);
    const team = parsed.name || "";
    const logo = getTeamLogo(team);
    const logoHtml = logo
      ? `<img class="standings-logo" src="${logo}" alt="${escapeHtml(team)} logo" />`
      : "";
    const teamLink = `/team.html?team=${encodeURIComponent(team)}`;
    const rows = (players || [])
      .map(
        (p) => `<div class="boxscore-row">
          <a class="boxscore-link" href="/player-detail.html?player=${encodeURIComponent(p.player)}">${escapeHtml(p.player)}</a>
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

function buildPreviewMarkup(game) {
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

  return `<div class="preview-grid">
    ${previewForTeam(game.team1, game.team2)}
    ${previewForTeam(game.team2, game.team1)}
  </div>`;
}

function renderGameList() {
  if (!els.games) return [];
  const term = String(els.search?.value || "").trim().toLowerCase();

  let games = selectedDateKey ? (gamesByDate.get(selectedDateKey) || []) : [];
  if (!selectedDateKey && currentMonth) {
    const month = currentMonth.getMonth() + 1;
    games = scheduleGames.filter((g) => String(g.dateToken).startsWith(`${month}/`));
  }

  const filtered = term
    ? games.filter((g) =>
        [g.team1, g.team2, g.rawDate, g.dateToken].join(" ").toLowerCase().includes(term)
      )
    : games;

  if (!filtered.length) {
    els.games.innerHTML = '<div class="gm-empty">No games found.</div>';
    return [];
  }

  const html = filtered
    .map((g, idx) => {
      const logo1 = getTeamLogo(g.team1);
      const logo2 = getTeamLogo(g.team2);
      const l1 = logo1
        ? `<img class="standings-logo" src="${logo1}" alt="${escapeHtml(g.team1)} logo" />`
        : "";
      const l2 = logo2
        ? `<img class="standings-logo" src="${logo2}" alt="${escapeHtml(g.team2)} logo" />`
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
      return `
        <div class="calendar-game ${isTodayGame ? "today-game" : ""}" data-game-index="${g.idx}">
          <div class="calendar-game-date">${escapeHtml(g.dateToken)}</div>
          <div class="calendar-game-matchup">
            <a class="schedule-team-link" href="/team.html?team=${encodeURIComponent(g.team1)}">${l1}<span class="team-name-stack"><span>${escapeHtml(g.team1)}</span>${team1ScoreLine}</span></a>
            <span>vs</span>
            <a class="schedule-team-link" href="/team.html?team=${encodeURIComponent(g.team2)}">${l2}<span class="team-name-stack"><span>${escapeHtml(g.team2)}</span>${team2ScoreLine}</span></a>
          </div>
          <div class="calendar-game-status ${escapeHtml(scoreState.status)}">
            <strong>${escapeHtml(scoreState.label)}</strong>
          </div>
          <div class="calendar-game-details" hidden></div>
        </div>
      `;
    })
    .join("");
  els.games.innerHTML = html;
  return filtered;
}

function openGamesModal(games) {
  if (!els.gamesModal || !els.gamesModalDetails || !els.gamesModalTitle) return;
  const titleDate = selectedDateKey || "Selected Date";
  els.gamesModalTitle.textContent = `Games • ${titleDate}`;
  if (!games.length) {
    els.gamesModalDetails.innerHTML = '<div class="gm-empty">No games found.</div>';
  } else {
    els.gamesModalDetails.innerHTML = els.games.innerHTML;
  }
  els.gamesModal.hidden = false;
}

function bindCalendarEvents() {
  if (els.prev) {
    els.prev.addEventListener("click", () => {
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      selectedDateKey = "";
      renderCalendar();
      renderGameList();
    });
  }
  if (els.next) {
    els.next.addEventListener("click", () => {
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
      selectedDateKey = "";
      renderCalendar();
      renderGameList();
    });
  }

  if (els.grid) {
    els.grid.addEventListener("click", (event) => {
      const cell = event.target.closest("[data-date]");
      if (!cell) return;
      selectedDateKey = String(cell.dataset.date || "");
      renderCalendar();
      const games = renderGameList();
      openGamesModal(games);
    });
  }

  const handleGameClick = (event) => {
      const link = event.target.closest("a");
      if (link) return;
      const card = event.target.closest("[data-game-index]");
      if (!card) return;
      const idx = Number(card.dataset.gameIndex);
      const game = scheduleGames[idx];
      if (!game) return;
      const details = card.querySelector(".calendar-game-details");
      if (!details) return;
      const isOpen = !details.hidden;
      if (isOpen) {
        details.hidden = true;
        card.classList.remove("open");
        return;
      }
      details.hidden = false;
      card.classList.add("open");
      if (!details.dataset.loaded) {
        const scoreState = getGameScoreState(game);
        if (scoreState.status === "upcoming") {
          details.innerHTML = buildPreviewMarkup(game);
        } else if (scoreState.status === "live") {
          details.innerHTML = buildLiveBoxMarkup(game, scoreState.livePayload);
        } else {
          const payload = getBoxScorePayload(game);
          details.innerHTML = payload.html;
        }
        details.dataset.loaded = "1";
      }
    };

  if (els.games) {
    els.games.addEventListener("click", handleGameClick);
  }
  if (els.gamesModalDetails) {
    els.gamesModalDetails.addEventListener("click", handleGameClick);
  }

  if (els.search) {
    els.search.addEventListener("input", () => {
      renderGameList();
    });
  }

  document.addEventListener("click", (event) => {
    if (event.target.matches('[data-close="true"]')) {
      els.modal.hidden = true;
      if (els.gamesModal) {
        els.gamesModal.hidden = true;
      }
    }
  });
}

async function loadSchedule() {
  try {
    const season = getSeason();
    let rows = [];

    if (season === "c2s2") {
      const [scheduleRes, boxRes, liveRes, playerStatsRes] = await Promise.all([
        fetch(SCHEDULE_CSV_URL, { cache: "no-store" }),
        fetch(BOXSCORE_CSV_URL, { cache: "no-store" }),
        fetch(LIVE_CSV_URL, { cache: "no-store" }),
        fetch(PLAYER_STATS_URL, { cache: "no-store" }),
      ]);
      if (!scheduleRes.ok) throw new Error(`Fetch failed: ${scheduleRes.status}`);
      rows = getC2S2ScheduleRows(parseCSV(await scheduleRes.text()));
      cachedBoxScoreRows = parseCSV(await boxRes.text()).slice(0, 1000);
      finalScoreMap = buildFinalScoreMap(cachedBoxScoreRows);
      const liveRows = liveRes.ok ? parseCSV(await liveRes.text()) : [];
      liveScoreMap = buildLiveScoreMap(liveRows);
      const playerRows = playerStatsRes.ok ? parseCSV(await playerStatsRes.text()) : [];
      teamLeadersMap = computeTeamLeaders(playerRows);
    } else {
      const response = await fetch(ARCHIVE_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      const archive = parseCSV(await response.text());
      const range = season === "c2s1-post" ? ARCHIVE_RANGES.schedule_post : ARCHIVE_RANGES.schedule_regular;
      rows = sliceRange(archive, range);
      cachedBoxScoreRows = sliceRange(archive, ARCHIVE_RANGES.boxscore);
      finalScoreMap = buildFinalScoreMap(cachedBoxScoreRows);
      liveScoreMap = new Map();
      teamLeadersMap = new Map();
    }

    if (!rows.length) throw new Error("No data found.");

    scheduleGames = buildGames(rows, season);
    rebuildGamesByDate();

    if (!scheduleGames.length) throw new Error("No games found.");

    const now = new Date();
    currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayToken = getTodayToken();
    const firstInCurrentMonth = scheduleGames.find(
      (g) => g.dateObj && g.dateObj.getMonth() === currentMonth.getMonth()
    );
    selectedDateKey = gamesByDate.has(todayToken)
      ? todayToken
      : firstInCurrentMonth
      ? firstInCurrentMonth.dateToken
      : scheduleGames[0].dateToken;

    renderCalendar();
    renderGameList();
    updateLastUpdated();
  } catch (error) {
    if (els.games) {
      els.games.innerHTML = `<div class="gm-empty">${escapeHtml(error.message)}</div>`;
    }
  }
}

initSeasonSelect();
bindCalendarEvents();
loadSchedule();
