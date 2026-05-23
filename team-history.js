const STANDINGS_CSV_URL = "/api/sheet?name=standings-dashboard";
const ARCHIVE_URL = "/api/sheet?name=archive";
const C2S2_REGULAR_URL = "/api/sheet?name=c2s2-regular";
const C2S1_ROSTERS_URL = "/assets/data/c2s1-rosters.csv";
const C1S2_STANDINGS_URL = "/assets/data/c1s2-standings.csv";
const C1S2_POST_SCHEDULE_URL = "/assets/data/c1s2-post-schedule.csv";
const C1S2_ROSTERS_URL = "/assets/data/c1s2-rosters.csv";
const C1S6_STANDINGS_URL = "/assets/data/c1s6-standings.csv";
const C1S6_POST_SCHEDULE_URL = "/assets/data/c1s6-post-schedule.csv";
const C1S6_ROSTERS_URL = "/assets/data/c1s6-rosters.csv";
const C1S3_STANDINGS_URL = "/assets/data/c1s3-standings.csv";
const C1S3_POST_SCHEDULE_URL = "/assets/data/c1s3-post-schedule.csv";
const C1S3_ROSTERS_URL = "/assets/data/c1s3-rosters.csv";
const C1S5_STANDINGS_URL = "/assets/data/c1s5-standings.csv";
const C1S5_POST_SCHEDULE_URL = "/assets/data/c1s5-post-schedule.csv";
const C1S5_ROSTERS_URL = "/assets/data/c1s5-rosters.csv";
const C1S4_STANDINGS_URL = "/assets/data/c1s4-standings.csv";
const C1S4_POST_SCHEDULE_URL = "/assets/data/c1s4-post-schedule.csv";
const C1S4_PLAYER_STATS_URL = "/assets/data/c1s4-player-stats.csv";
const AWARDS_URL = "/api/sheet?name=awards";
const SEASON_KEY = "season";
const DEFAULT_SEASON = "c2s3-regular";
const DEFAULT_HISTORY_SCOPE = "franchise";
const HISTORY_SCOPE_KEY = "team_history_scope";
const ALL_TIME_SEASON = "all-time";

const C2S2_REGULAR_RANGES = {
  standings: "A59:F69",
};
const C2S2_PLAYOFF_HISTORY_ROWS = [
  ["Date", "Team 1", "Team 2", "Info", "Game Type", "Games", "Winner", "Winner Wins"],
  ["C2S2 Game 1", "The Phantoms", "Cheerios", "Wild Card Round", "Playoffs", "1", "Cheerios", "1"],
  ["C2S2 Game 2", "Gus N Em", "Illegals", "Wild Card Round", "Playoffs", "1", "Gus N Em", "1"],
  ["C2S2 Game 3", "Turkeys", "Cheerios", "Semi Finals", "Playoffs", "2", "Turkeys", "2"],
  ["C2S2 Game 4", "The Lions", "Gus N Em", "Semi Finals", "Playoffs", "3", "Gus N Em", "2"],
  ["C2S2 Game 5", "Turkeys", "Gus N Em", "Finals", "Playoffs", "3", "Gus N Em", "3"],
];

const ARCHIVE_RANGES = {
  standings: "A1:F7",
  schedule_post: "A31:D43",
};

const TEAM_RANGES = {
  "Gus N Em": "B2:C13",
  Bullets: "E2:F13",
  Storm: "E2:F13",
  Turkeys: "H2:I13",
  Cheerios: "B17:C28",
  Yetis: "E17:F28",
  Illegals: "H17:I28",
  "The Lions": "B32:C43",
  "The Future": "E32:F43",
  "The Snipers": "H32:I43",
  "The Phantoms": "B45:C56",
};

const SEASON_ALIASES = {
  c2s2: "c2s3-regular",
  "c2s1-playoffs": "c2s1-post",
  "c2s2-playoffs": "c2s2-playoffs",
  "c2s2-regular": "c2s2-regular",
  "c2s1-regular": "c2s1-regular",
  "c2s1-post": "c2s1-post",
  "c1s6-regular": "c1s6-regular",
  "c1s6-post": "c1s6-post",
  "c1s5-regular": "c1s5-regular",
  "c1s5-post": "c1s5-post",
  "c1s4-regular": "c1s4-regular",
  "c1s4-post": "c1s4-post",
  "c1s3-regular": "c1s3-regular",
  "c1s3-post": "c1s3-post",
  "c1s2-regular": "c1s2-regular",
  "c1s2-post": "c1s2-post",
};

const CHAMPION_RANGES = {
  c2s2: "O16:P29",
  c1s2: "C15:D24",
  c1s3: "E15:F28",
  c1s4: "G16:H27",
  c1s5: "I16:J28",
  c1s6: "K16:L27",
  c2s1: "M16:N29",
};

const els = {
  title: document.getElementById("team-title"),
  sub: document.getElementById("team-sub"),
  logo: document.getElementById("team-logo"),
  lastUpdated: document.getElementById("last-updated"),
  historyScopeTabs: document.getElementById("history-scope-tabs"),
  historyPanels: Array.from(document.querySelectorAll("[data-history-panel]")),
  backLink: document.getElementById("history-back-link"),
  franchiseHistoryHead: document.querySelector("#franchise-history-table thead"),
  franchiseHistoryBody: document.querySelector("#franchise-history-table tbody"),
  historyTotalRecord: document.getElementById("history-total-record"),
  historyAvgWinPct: document.getElementById("history-avg-winpct"),
  playoffHistoryHead: document.querySelector("#playoff-history-table thead"),
  playoffHistoryBody: document.querySelector("#playoff-history-table tbody"),
  historyPlayoffAppearances: document.getElementById("history-playoff-appearances"),
  historyPlayoffTitles: document.getElementById("history-playoff-titles"),
  franchisePlayersHead: document.querySelector("#franchise-players-table thead"),
  franchisePlayersBody: document.querySelector("#franchise-players-table tbody"),
  historyPlayerTotal: document.getElementById("history-player-total"),
  historyPlayerSeasons: document.getElementById("history-player-seasons"),
};

function normalizeSeasonValue(raw) {
  const key = String(raw || "").trim().toLowerCase();
  if (key === ALL_TIME_SEASON) {
    return ALL_TIME_SEASON;
  }
  return SEASON_ALIASES[key] || DEFAULT_SEASON;
}

function getSeason() {
  const params = new URLSearchParams(window.location.search);
  return normalizeSeasonValue(params.get("season") || localStorage.getItem(SEASON_KEY) || DEFAULT_SEASON);
}

function initSeasonSelect() {
  const select = document.getElementById("season-select");
  if (!select) return;
  const season = getSeason();
  select.value = season;
  localStorage.setItem(SEASON_KEY, season);
  select.addEventListener("change", () => {
    localStorage.setItem(SEASON_KEY, select.value);
    const params = new URLSearchParams(window.location.search);
    params.set("season", select.value);
    window.location.assign(`${window.location.pathname}?${params.toString()}`);
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function parseNumber(value) {
  const num = Number(String(value || "").replace(/[^0-9.\-]/g, ""));
  return Number.isNaN(num) ? null : num;
}

function parsePct(value) {
  const num = Number(String(value || "").replace(/[^0-9.\-]/g, ""));
  if (Number.isNaN(num)) return null;
  return num > 1 ? num / 100 : num;
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

function getTeamName() {
  const params = new URLSearchParams(window.location.search);
  const team = params.get("team") || "";
  if (team === "Dream Team") return "The Future";
  if (team === "Scorpions") return "Yetis";
  if (team === "Storm") return "Bullets";
  return team;
}

function normalizeTeamLabel(value) {
  return displayTeamName(String(value || ""))
    .replace(/\([^)]*\)/g, "")
    .replace(/\*/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getFranchiseKey(value) {
  const team = displayTeamName(value);
  if (team === "Tigers" || team === "Masdog N Em" || team === "Karma Avengers" || team === "Avengers") return "tigers-avengers-lineage";
  if (team === "Legends" || team === "Mafia") return "mafia-lineage";
  if (team === "Gamblers" || team === "Chicken Nuggets" || team === "Doggy N Em" || team === "Mambas") return "doggy-lineage";
  if (team === "Currents" || team === "The Currents") return "the-currents";
  if (team === "Bolts" || team === "The Bolts" || team === "Turkeys") return "turkeys-lineage";
  if (team === "Enforcers" || team === "Wolves") return "wolves-lineage";
  if (team === "Wrangler" || team === "Wranglers") return "wranglers";
  if (team === "Storm" || team === "Bullets" || team === "Strom") return "storm";
  if (team === "Scorpions" || team === "Yetis") return "mayeday";
  if (team === "Dream Team" || team === "The Future") return "dream-team";
  return normalizeTeamLabel(team);
}

function getTeamLogoSrc(team) {
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
  if (clean === "Masdog N Em" || clean === "Richer N Em" || clean === "Doggy N Em") return "/assets/gus-n-em.png";
  if (clean === "Thunderhawks") return "/assets/thunderhawks.png";
  if (clean === "The Currents" || clean === "Currents") return "/assets/the-currents.png";
  if (clean === "Whatsgrass") return "/assets/whatsgrass.png";
  if (clean === "Wolves") return "/assets/wolves.png";
  if (clean === "Zombies") return "/assets/zombies.png";
  if (clean === "Yetis") return "/assets/yetis.png";
  if (clean === "Gus N Em") return "/assets/gus-n-em.png";
  if (clean === "Cheerios") return "/assets/cheerios.png";
  if (clean === "Illegals") return "/assets/illegals.png";
  if (clean === "Storm" || clean === "Bullets") return "/assets/storm.png";
  if (clean === "Turkeys") return "/assets/turkeys.png";
  return "";
}

function buildTeamPageHref(team, seasonKey) {
  const params = new URLSearchParams();
  const shownTeam = displayTeamName(team);
  const normalizedSeason = seasonKey ? normalizeSeasonValue(seasonKey) : "";
  params.set("team", shownTeam);
  if (normalizedSeason) params.set("season", normalizedSeason);
  if (normalizedSeason === ALL_TIME_SEASON) params.set("view", "historical");
  return `/team.html?${params.toString()}`;
}

function buildTeamHistoryHref(team, seasonKey) {
  const params = new URLSearchParams();
  params.set("team", displayTeamName(team));
  if (seasonKey) params.set("season", normalizeSeasonValue(seasonKey));
  return `/team-history.html?${params.toString()}`;
}

function updateLastUpdated() {
  const now = new Date();
  const formatted = now.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  els.lastUpdated.textContent = `Last updated: ${formatted}`;
}

function renderFranchiseHistoryMessage(message) {
  els.franchiseHistoryHead.innerHTML = "<tr><th>Season</th><th>Team</th><th>Record</th><th>Win %</th></tr>";
  els.franchiseHistoryBody.innerHTML = `<tr><td colspan="4">${escapeHtml(message)}</td></tr>`;
  els.historyTotalRecord.textContent = "—";
  els.historyAvgWinPct.textContent = "—";
}

function renderFranchiseHistory(rows) {
  const activeRows = rows.filter((row) => row.isActive && Number.isFinite(row.wins) && Number.isFinite(row.loss) && typeof row.winpctValue === "number");
  const totalWins = activeRows.reduce((sum, row) => sum + row.wins, 0);
  const totalLosses = activeRows.reduce((sum, row) => sum + row.loss, 0);
  const avgWinPct = activeRows.length
    ? activeRows.reduce((sum, row) => sum + row.winpctValue, 0) / activeRows.length
    : null;
  els.historyTotalRecord.textContent = activeRows.length ? `${totalWins}-${totalLosses}` : "—";
  els.historyAvgWinPct.textContent = avgWinPct !== null ? avgWinPct.toFixed(3).replace(/^0/, ".") : "—";
  els.franchiseHistoryHead.innerHTML = "<tr><th>Season</th><th>Team</th><th>Record</th><th>Win %</th></tr>";
  els.franchiseHistoryBody.innerHTML = rows.map((row) => `
    <tr class="franchise-history-row${row.isActive ? " is-active" : " is-inactive"}">
      <td>${row.link ? `<a class="history-season-link" href="${row.link}">${escapeHtml(row.season || "—")}</a>` : escapeHtml(row.season || "—")}</td>
      <td>${row.link ? `<a class="history-team-link" href="${row.link}">${escapeHtml(row.team || "Not active")}</a>` : escapeHtml(row.team || "Not active")}</td>
      <td>${escapeHtml(row.record || "—")}</td>
      <td>${escapeHtml(row.winpct || "—")}</td>
    </tr>
  `).join("");
}

function renderPlayoffHistoryMessage(message) {
  els.playoffHistoryHead.innerHTML = "<tr><th>Season</th><th>Team</th><th>Opponents</th><th>Games</th><th>Result</th></tr>";
  els.playoffHistoryBody.innerHTML = `<tr><td colspan="5">${escapeHtml(message)}</td></tr>`;
  els.historyPlayoffAppearances.textContent = "—";
  els.historyPlayoffTitles.textContent = "—";
}

function renderPlayoffHistory(rows) {
  const titleCount = rows.filter((row) => row.result === "Champion").length;
  els.historyPlayoffAppearances.textContent = String(rows.length);
  els.historyPlayoffTitles.textContent = String(titleCount);
  els.playoffHistoryHead.innerHTML = "<tr><th>Season</th><th>Team</th><th>Opponents</th><th>Games</th><th>Result</th></tr>";
  if (!rows.length) {
    els.playoffHistoryBody.innerHTML = "<tr><td colspan=\"5\">No playoff appearances found.</td></tr>";
    return;
  }
  els.playoffHistoryBody.innerHTML = rows.map((row) => `
    <tr class="franchise-history-row is-active">
      <td><a class="history-season-link" href="${row.link}">${escapeHtml(row.season)}</a></td>
      <td><a class="history-team-link" href="${row.link}">${escapeHtml(row.team)}</a></td>
      <td>${escapeHtml(row.opponents || "—")}</td>
      <td>${escapeHtml(String(row.games || "—"))}</td>
      <td>${escapeHtml(row.result || "Playoff appearance")}</td>
    </tr>
  `).join("");
}

function renderAllTimePlayersMessage(message) {
  els.franchisePlayersHead.innerHTML = "<tr><th>Player</th><th>Seasons</th><th>Teams</th></tr>";
  els.franchisePlayersBody.innerHTML = `<tr><td colspan="3">${escapeHtml(message)}</td></tr>`;
  els.historyPlayerTotal.textContent = "—";
  els.historyPlayerSeasons.textContent = "—";
}

function renderAllTimePlayers(rows, trackedSeasons) {
  els.historyPlayerTotal.textContent = String(rows.length);
  els.historyPlayerSeasons.textContent = String(trackedSeasons);
  els.franchisePlayersHead.innerHTML = "<tr><th>Player</th><th>Seasons</th><th>Teams</th></tr>";
  if (!rows.length) {
    els.franchisePlayersBody.innerHTML = "<tr><td colspan=\"3\">No franchise player history found.</td></tr>";
    return;
  }
  els.franchisePlayersBody.innerHTML = rows.map((row) => `
    <tr class="franchise-history-row is-active">
      <td><a class="history-team-link" href="/player-detail.html?player=${encodeURIComponent(row.player)}">${escapeHtml(row.player)}${window.rsklPlayerBadgeHtml ? window.rsklPlayerBadgeHtml({ player: row.player, rookie: true, risingStars: true }) : ""}</a></td>
      <td>${escapeHtml(row.seasons.join(", "))}</td>
      <td>${escapeHtml(row.teams.join(", "))}</td>
    </tr>
  `).join("");
}

function getCurrentStandingsHeaderIndexes(row) {
  const normalized = (row || []).map((cell) => String(cell || "").trim().toLowerCase());
  const teamIdx = normalized.findIndex((cell) => cell === "team");
  const gpIdx = normalized.findIndex((cell) => cell === "gp");
  const winsIdx = normalized.findIndex((cell) => cell === "wins" || cell === "win");
  const lossesIdx = normalized.findIndex((cell) => cell === "loss" || cell === "losses" || cell === "l");
  const gbIdx = normalized.findIndex((cell) => cell === "gb");
  const pctIdx = normalized.findIndex((cell) => cell === "win %" || cell === "win%" || cell === "pct");
  if (teamIdx < 0 || gpIdx < 0 || winsIdx < 0 || lossesIdx < 0 || gbIdx < 0 || pctIdx < 0) return null;
  return { teamIdx, gpIdx, winsIdx, lossesIdx, gbIdx, pctIdx };
}

function buildHistoryRowsFromCurrentStandings(rows) {
  const builtRows = [];
  let indexes = null;
  (rows || []).forEach((row) => {
    const nextIndexes = getCurrentStandingsHeaderIndexes(row);
    if (nextIndexes) {
      indexes = nextIndexes;
      return;
    }
    if (!indexes) return;
    const team = displayTeamName(String(row[indexes.teamIdx] || "").trim());
    if (!team) return;
    builtRows.push({
      team,
      wins: parseNumber(row[indexes.winsIdx]),
      loss: parseNumber(row[indexes.lossesIdx]),
      winpct: parsePct(row[indexes.pctIdx]),
    });
  });
  return builtRows;
}

function buildHistoryRowsFromTable(tableRows) {
  if (!tableRows || tableRows.length < 2) return [];
  const headers = (tableRows[0] || []).map((h) => String(h || "").trim().toLowerCase());
  const teamIdx = headers.findIndex((h) => h === "team");
  const winsIdx = headers.findIndex((h) => h === "wins" || h === "win");
  const lossIdx = headers.findIndex((h) => h === "losses" || h === "loss" || h === "l");
  const pctIdx = headers.findIndex((h) => h === "win %" || h === "win%" || h === "pct");
  if (teamIdx === -1 || winsIdx === -1 || lossIdx === -1) return [];
  return tableRows.slice(1).map((row) => ({
    team: displayTeamName(row[teamIdx] || ""),
    wins: parseNumber(row[winsIdx]),
    loss: parseNumber(row[lossIdx]),
    winpct: pctIdx >= 0 ? parsePct(row[pctIdx]) : null,
  }));
}

function getScheduleIndexes(headers, season) {
  const lower = headers.map((h) => String(h || "").trim().toLowerCase());
  const findIdx = (checks) => lower.findIndex((h) => checks.some((check) => h.includes(check)));
  let date = findIdx(["date"]);
  let team1 = findIdx(["team 1", "team1", "away"]);
  let team2 = findIdx(["team 2", "team2", "home"]);
  if (date === -1 || team1 === -1 || team2 === -1) {
    if (season === "c2s2" || headers.length <= 3) {
      if (date === -1) date = 0;
      if (team1 === -1) team1 = 1;
      if (team2 === -1) team2 = 2;
    } else {
      if (date === -1) date = 1;
      if (team1 === -1) team1 = 2;
      if (team2 === -1) team2 = 3;
    }
  }
  return { date, team1, team2 };
}

function seasonKeyToChampionRangeKey(seasonKey) {
  if (seasonKey === "c2s1-post") return "c2s1";
  if (seasonKey === "c1s2-post") return "c1s2";
  if (seasonKey === "c1s3-post") return "c1s3";
  if (seasonKey === "c1s4-post") return "c1s4";
  if (seasonKey === "c1s5-post") return "c1s5";
  if (seasonKey === "c1s6-post") return "c1s6";
  if (seasonKey === "c2s2-playoffs") return "c2s2";
  return "";
}

function buildChampionMap(rows) {
  const map = new Map();
  Object.entries(CHAMPION_RANGES).forEach(([seasonKey, range]) => {
    const sliced = sliceRange(rows, range);
    const championRow = sliced.find((row) => String(row[0] || "").trim().toLowerCase().includes("champ"));
    const winner = displayTeamName((championRow && championRow[1]) || "");
    if (winner) map.set(seasonKey, winner);
  });
  return map;
}

function buildPlayoffHistoryRows(scheduleRows, seasonLabel, seasonKey, franchiseKey, championMap) {
  const headers = scheduleRows[0] || [];
  if (!headers.length) return null;
  const idx = getScheduleIndexes(headers, seasonKey);
  const lowerHeaders = headers.map((header) => String(header || "").trim().toLowerCase());
  const gamesIdx = lowerHeaders.findIndex((header) => header === "games");
  const winnerIdx = lowerHeaders.findIndex((header) => header === "winner");
  const winnerWinsIdx = lowerHeaders.findIndex((header) => header === "winner wins");
  const teamRows = scheduleRows.slice(1).filter((row) => {
    const team1 = displayTeamName(row[idx.team1] || "");
    const team2 = displayTeamName(row[idx.team2] || "");
    return getFranchiseKey(team1) === franchiseKey || getFranchiseKey(team2) === franchiseKey;
  });
  if (!teamRows.length) return null;
  const opponents = [];
  let shownTeam = "";
  teamRows.forEach((row) => {
    const team1 = displayTeamName(row[idx.team1] || "");
    const team2 = displayTeamName(row[idx.team2] || "");
    if (getFranchiseKey(team1) === franchiseKey) {
      shownTeam = shownTeam || team1;
      if (team2 && !opponents.includes(team2)) opponents.push(team2);
    } else if (getFranchiseKey(team2) === franchiseKey) {
      shownTeam = shownTeam || team2;
      if (team1 && !opponents.includes(team1)) opponents.push(team1);
    }
  });
  let inlineChampion = "";
  const winsByTeam = new Map();
  scheduleRows.slice(1).forEach((row) => {
    let winner = "";
    let total = 0;
    if (winnerIdx !== -1) {
      winner = displayTeamName(row[winnerIdx] || "");
      if (winnerWinsIdx !== -1) {
        const wins = Number(String(row[winnerWinsIdx] || "").trim());
        total = Number.isFinite(wins) && wins > 0 ? wins : 0;
      } else {
        total = 1;
      }
    } else {
      winner = displayTeamName(row[idx.team1] || "");
      total = winner ? 1 : 0;
    }
    if (!winner || total <= 0) return;
    winsByTeam.set(winner, (winsByTeam.get(winner) || 0) + total);
  });
  let bestWins = -1;
  winsByTeam.forEach((wins, team) => {
    if (wins > bestWins) {
      bestWins = wins;
      inlineChampion = team;
    }
  });
  if (!inlineChampion && winnerIdx !== -1) {
    inlineChampion = displayTeamName(
      teamRows.find((row) =>
        String(row[idx.date] || "").trim().toLowerCase().includes("final")
      )?.[winnerIdx] || ""
    );
  }
  const champion = inlineChampion || championMap.get(seasonKeyToChampionRangeKey(seasonKey)) || "";
  const totalGames = teamRows.reduce((sum, row) => {
    if (gamesIdx === -1) return sum + 1;
    const parsed = Number(String(row[gamesIdx] || "").trim());
    return sum + (Number.isFinite(parsed) && parsed > 0 ? parsed : 1);
  }, 0);
  const result = champion && getFranchiseKey(champion) === franchiseKey ? "Champion" : champion ? "Eliminated" : "Playoff appearance";
  return {
    season: seasonLabel,
    team: shownTeam || "—",
    opponents: opponents.join(", "),
    games: totalGames,
    result,
    link: buildTeamPageHref(shownTeam || getTeamName(), seasonKey),
  };
}

function collectPlayersFromRangeRows(rows, seasonLabel, teamName, playerMap) {
  let matched = false;
  rows.slice(1).forEach((row) => {
    const player = String(row[0] || "").trim();
    if (!player || player.toUpperCase().startsWith("GM")) return;
    matched = true;
    if (!playerMap.has(player)) playerMap.set(player, { player, seasons: new Set(), teams: new Set() });
    const entry = playerMap.get(player);
    entry.seasons.add(seasonLabel);
    entry.teams.add(displayTeamName(teamName));
  });
  return matched;
}

function collectPlayersFromRosterCsv(rows, seasonLabel, franchiseKey, playerMap) {
  let matched = false;
  rows.slice(1).forEach((row) => {
    const team = displayTeamName(row[0] || "");
    const player = String(row[1] || "").trim();
    if (!player || getFranchiseKey(team) !== franchiseKey) return;
    matched = true;
    if (!playerMap.has(player)) playerMap.set(player, { player, seasons: new Set(), teams: new Set() });
    const entry = playerMap.get(player);
    entry.seasons.add(seasonLabel);
    entry.teams.add(team);
  });
  return matched;
}

function collectPlayersFromPlayerStats(rows, seasonLabel, franchiseKey, playerMap) {
  let matched = false;
  rows.slice(1).forEach((row) => {
    const team = displayTeamName(row[1] || "");
    const player = String(row[2] || "").trim();
    if (!player || getFranchiseKey(team) !== franchiseKey) return;
    matched = true;
    if (!playerMap.has(player)) playerMap.set(player, { player, seasons: new Set(), teams: new Set() });
    const entry = playerMap.get(player);
    entry.seasons.add(seasonLabel);
    entry.teams.add(team);
  });
  return matched;
}

function applyHistoryScope(scope) {
  const nextScope = ["franchise", "playoffs", "players"].includes(scope) ? scope : DEFAULT_HISTORY_SCOPE;
  localStorage.setItem(HISTORY_SCOPE_KEY, nextScope);
  if (els.historyScopeTabs) {
    els.historyScopeTabs.querySelectorAll("[data-history-scope]").forEach((button) => {
      const active = button.dataset.historyScope === nextScope;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }
  els.historyPanels.forEach((panel) => {
    panel.hidden = panel.dataset.historyPanel !== nextScope;
  });
}

function initHistoryTabs() {
  if (!els.historyScopeTabs) return;
  els.historyScopeTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-history-scope]");
    if (!button) return;
    applyHistoryScope(button.dataset.historyScope || DEFAULT_HISTORY_SCOPE);
  });
  applyHistoryScope(localStorage.getItem(HISTORY_SCOPE_KEY) || DEFAULT_HISTORY_SCOPE);
}

async function loadHistoricalData(teamName) {
  renderFranchiseHistoryMessage("Loading franchise history...");
  renderPlayoffHistoryMessage("Loading playoff history...");
  renderAllTimePlayersMessage("Loading all-time players...");
  const franchiseKey = getFranchiseKey(teamName);
  const franchiseSeasonConfigs = [
    { label: "C2S3", key: "c2s3-regular", type: "current", url: STANDINGS_CSV_URL },
    { label: "C2S2", key: "c2s2-regular", type: "range", url: C2S2_REGULAR_URL, range: C2S2_REGULAR_RANGES.standings },
    { label: "C2S1", key: "c2s1-regular", type: "range", url: ARCHIVE_URL, range: ARCHIVE_RANGES.standings },
    { label: "C1S6", key: "c1s6-regular", type: "csv", url: C1S6_STANDINGS_URL },
    { label: "C1S5", key: "c1s5-regular", type: "csv", url: C1S5_STANDINGS_URL },
    { label: "C1S4", key: "c1s4-regular", type: "csv", url: C1S4_STANDINGS_URL },
    { label: "C1S3", key: "c1s3-regular", type: "csv", url: C1S3_STANDINGS_URL },
    { label: "C1S2", key: "c1s2-regular", type: "csv", url: C1S2_STANDINGS_URL },
  ];
  const playoffSeasonConfigs = [
    { label: "C2S2 Playoffs", key: "c2s2-playoffs", type: "inline", rows: C2S2_PLAYOFF_HISTORY_ROWS },
    { label: "C2S1 Playoffs", key: "c2s1-post", type: "range", url: ARCHIVE_URL, range: ARCHIVE_RANGES.schedule_post },
    { label: "C1S6 Playoffs", key: "c1s6-post", type: "csv", url: C1S6_POST_SCHEDULE_URL },
    { label: "C1S5 Playoffs", key: "c1s5-post", type: "csv", url: C1S5_POST_SCHEDULE_URL },
    { label: "C1S4 Playoffs", key: "c1s4-post", type: "csv", url: C1S4_POST_SCHEDULE_URL },
    { label: "C1S3 Playoffs", key: "c1s3-post", type: "csv", url: C1S3_POST_SCHEDULE_URL },
    { label: "C1S2 Playoffs", key: "c1s2-post", type: "csv", url: C1S2_POST_SCHEDULE_URL },
  ];
  const playerSeasonConfigs = [
    { label: "C2S3", type: "rangeRoster", url: "/api/sheet?name=roster", range: TEAM_RANGES[teamName], teamName },
    { label: "C2S2", type: "rangeRoster", url: C2S2_REGULAR_URL, range: TEAM_RANGES[teamName], teamName },
    { label: "C2S1", type: "rosterCsv", url: C2S1_ROSTERS_URL },
    { label: "C1S6", type: "rosterCsv", url: C1S6_ROSTERS_URL },
    { label: "C1S5", type: "rosterCsv", url: C1S5_ROSTERS_URL },
    { label: "C1S4", type: "playerStats", url: C1S4_PLAYER_STATS_URL },
    { label: "C1S3", type: "rosterCsv", url: C1S3_ROSTERS_URL },
    { label: "C1S2", type: "rosterCsv", url: C1S2_ROSTERS_URL },
  ];
  try {
    const championPromise = fetch(AWARDS_URL, { cache: "no-store" })
      .then((res) => (res.ok ? res.text() : ""))
      .then((text) => (text ? buildChampionMap(parseCSV(text)) : new Map()))
      .catch(() => new Map());

    const franchiseSettled = await Promise.allSettled(franchiseSeasonConfigs.map((config) => fetch(config.url, { cache: "no-store" })));
    const franchiseRows = await Promise.all(franchiseSeasonConfigs.map(async (config, index) => {
      const response = franchiseSettled[index];
      if (response.status !== "fulfilled" || !response.value.ok) {
        return { season: config.label, team: "Not active", record: "—", winpct: "—", wins: null, loss: null, winpctValue: null, link: "", isActive: false };
      }
      const parsed = parseCSV(await response.value.text());
      const candidateRows = config.type === "current"
        ? buildHistoryRowsFromCurrentStandings(parsed)
        : config.type === "range"
        ? buildHistoryRowsFromTable(sliceRange(parsed, config.range))
        : buildHistoryRowsFromTable(parsed);
      const match = candidateRows.find((row) => getFranchiseKey(row.team) === franchiseKey);
      if (!match) {
        return { season: config.label, team: "Not active", record: "—", winpct: "—", wins: null, loss: null, winpctValue: null, link: "", isActive: false };
      }
      return {
        season: config.label,
        team: displayTeamName(match.team),
        wins: match.wins,
        loss: match.loss,
        record: match.wins !== null && match.loss !== null ? `${match.wins}-${match.loss}` : "—",
        winpctValue: typeof match.winpct === "number" ? match.winpct : null,
        winpct: typeof match.winpct === "number" ? match.winpct.toFixed(3).replace(/^0/, ".") : "—",
        link: buildTeamPageHref(match.team, config.key),
        isActive: true,
      };
    }));
    renderFranchiseHistory(franchiseRows);

    const championMap = await championPromise;
    const playoffSettled = await Promise.allSettled(
      playoffSeasonConfigs.map((config) =>
        config.type === "inline"
          ? Promise.resolve({ ok: true, text: async () => "" })
          : fetch(config.url, { cache: "no-store" })
      )
    );
    const playoffRows = [];
    for (let i = 0; i < playoffSeasonConfigs.length; i += 1) {
      const config = playoffSeasonConfigs[i];
      const response = playoffSettled[i];
      if (response.status !== "fulfilled" || !response.value.ok) continue;
      const parsed = config.type === "inline" ? config.rows : parseCSV(await response.value.text());
      const scheduleRows = config.type === "range" ? sliceRange(parsed, config.range) : parsed;
      const row = buildPlayoffHistoryRows(scheduleRows, config.label, config.key, franchiseKey, championMap);
      if (row) playoffRows.push(row);
    }
    renderPlayoffHistory(playoffRows);

    const playerMap = new Map();
    let trackedSeasons = 0;
    const playerSettled = await Promise.allSettled(playerSeasonConfigs.map((config) => fetch(config.url, { cache: "no-store" })));
    for (let i = 0; i < playerSeasonConfigs.length; i += 1) {
      const config = playerSeasonConfigs[i];
      const response = playerSettled[i];
      if (response.status !== "fulfilled" || !response.value.ok) continue;
      const parsed = parseCSV(await response.value.text());
      let hadSeasonData = false;
      if (config.type === "rangeRoster" && config.range) {
        const sliced = sliceRange(parsed, config.range);
        if (sliced.length > 1) hadSeasonData = collectPlayersFromRangeRows(sliced, config.label, config.teamName, playerMap);
      } else if (config.type === "rosterCsv") {
        hadSeasonData = collectPlayersFromRosterCsv(parsed, config.label, franchiseKey, playerMap);
      } else if (config.type === "playerStats") {
        hadSeasonData = collectPlayersFromPlayerStats(parsed, config.label, franchiseKey, playerMap);
      }
      if (hadSeasonData) trackedSeasons += 1;
    }
    const playerRows = Array.from(playerMap.values())
      .map((entry) => ({
        player: entry.player,
        seasons: Array.from(entry.seasons).sort((a, b) => b.localeCompare(a)),
        teams: Array.from(entry.teams).sort((a, b) => a.localeCompare(b)),
      }))
      .sort((a, b) => (b.seasons.length - a.seasons.length) || a.player.localeCompare(b.player));
    renderAllTimePlayers(playerRows, trackedSeasons);
  } catch (error) {
    renderFranchiseHistoryMessage("Unable to load franchise history.");
    renderPlayoffHistoryMessage("Unable to load playoff history.");
    renderAllTimePlayersMessage("Unable to load all-time players.");
  }
}

function initPage() {
  const teamName = getTeamName();
  const shownTeam = displayTeamName(teamName);
  const season = getSeason();
  if (els.title) {
    els.title.textContent = shownTeam ? `${shownTeam} Historical Data` : "Historical Data";
  }
  if (els.sub) {
    els.sub.textContent = shownTeam || "Missing team name.";
  }
  const logoSrc = getTeamLogoSrc(teamName);
  if (els.logo) {
    if (logoSrc) {
      els.logo.src = logoSrc;
      els.logo.alt = `${shownTeam} logo`;
      els.logo.style.display = "block";
    } else {
      els.logo.style.display = "none";
    }
  }
  if (els.backLink) {
    els.backLink.href = buildTeamPageHref(teamName, season);
  }
  initSeasonSelect();
  initHistoryTabs();
  loadHistoricalData(teamName);
  updateLastUpdated();
}

initPage();
