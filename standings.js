const STANDINGS_CSV_URL = "/api/sheet?name=standings";
const SCHEDULE_CSV_URL = "/api/sheet?name=schedule";
const PLAYER_STATS_URL = "/api/sheet?name=player-stats";
const TRANSACTIONS_URL = "/api/sheet?name=transactions";
const ARCHIVE_URL = "/api/sheet?name=archive";
const C2S2_REGULAR_URL = "/api/sheet?name=c2s2-regular";
const SEASON_KEY = "season";
const C2S2_SCHEDULE_RANGE = "A2:E77";
const TRANSACTIONS_RANGE = "A3:E81";
const RETIREMENT_RANGE = "G3:J70";
const CUT_RANGE = "L3:O81";
const SIGNING_RANGE = "Q3:T81";
const STANDINGS_RANGES = {
  Turkeys: "H3:M3",
  "Gus N Em": "H4:M4",
  Bullets: "H5:M5",
  Storm: "H5:M5",
  Cheerios: "H6:M6",
  Yetis: "H7:M7",
  Illegals: "H8:M8",
  "The Lions": "H9:M9",
  "The Future": "H10:M10",
  "The Phantoms": "H11:M11",
  "The Snipers": "H12:M12",
};

const els = {
  lastUpdated: document.getElementById("last-updated"),
  leaderboard: document.getElementById("leaderboard"),
};

let standingsRows = [];
let standingsHeaders = [];
let sosByTeam = new Map();
let requestedMetric = "wins";
let advancedByTeam = new Map();
let transactionsByTeam = new Map();
let leagueStandingsMetrics = [];

const ARCHIVE_RANGES = {
  standings: "A1:F7",
  bracket: "A9:F15",
};
const C2S2_REGULAR_RANGES = {
  standings: "A59:F69",
  schedule: "A71:E170",
  player_stats: "A151:G1150",
};

const EXCLUDED_STANDINGS_NAMES = new Set([
  "team",
  "north",
  "south",
  "east",
  "west",
  "bracket",
  "standings",
  "playoffs",
]);

const DIVISIONS = {
  North: new Set(["Turkeys", "The Lions", "The Phantoms", "Gus N Em", "Illegals"]),
  South: new Set(["Cheerios", "The Snipers", "Storm", "MayeDay", "Dream Team"]),
};

function getSeasonRaw() {
  const raw = localStorage.getItem(SEASON_KEY) || "c2s3-regular";
  if (raw === "c2s2" || raw === "c2s2-playoffs") return "c2s3-regular";
  return raw;
}

function getSeason() {
  const raw = getSeasonRaw();
  if (raw === "c2s3-regular" || raw === "c2s2-playoffs" || raw === "c2s2-regular") return "c2s2";
  if (raw === "c2s1-playoffs") return "c2s1-post";
  return raw;
}

function initSeasonSelect() {
  const select = document.getElementById("season-select");
  if (!select) {
    return;
  }
  const raw = getSeasonRaw();
  select.value = raw;
  if (!select.value) {
    select.value = "c2s3-regular";
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function displayTeamName(value) {
  const name = String(value || "").trim();
  if (name === "Bullets") return "Storm";
  if (name === "Yetis") return "MayeDay";
  if (name === "The Future") return "Dream Team";
  return name;
}

function isStandingsTeamName(value) {
  const shown = displayTeamName(value);
  const key = normalizeTeamLabel(shown);
  if (!key || EXCLUDED_STANDINGS_NAMES.has(key)) {
    return false;
  }
  return true;
}

function colToIndex(letter) {
  return letter.toUpperCase().charCodeAt(0) - 65;
}

function parseRange(range) {
  const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
  if (!match) {
    return null;
  }
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
  if (!parsed) {
    return [];
  }
  const slicedRows = rows.slice(parsed.startRow, parsed.endRow + 1);
  return slicedRows.map((row) =>
    row.slice(parsed.startCol, parsed.endCol + 1)
  );
}

function getC2S2ScheduleRows(rows) {
  const sliced = sliceRange(rows, C2S2_SCHEDULE_RANGE);
  return [["Date", "Team 1", "Team 2", "Info", "Game Type"], ...sliced];
}

function renderTable(rows) {
  if (!rows.length) {
    els.leaderboard.innerHTML = "<p>No data available.</p>";
    return;
  }
  const headers = rows[0];
  const dataRows = rows.slice(1);
  const table = `
    <div class="table-wrap">
      <table id="standings-table">
        <thead>
          <tr>
            ${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${dataRows
            .map(
              (row) => `
                <tr>
                  ${row.map((cell) => `<td>${escapeHtml(cell ?? "")}</td>`).join("")}
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
  els.leaderboard.innerHTML = table;
}

function getTeamLogoHtml(teamName) {
  if (teamName === "Dream Team") {
    return '<img class="standings-logo" src="/assets/dream-team.jpg" alt="Dream Team logo" />';
  }
  if (teamName === "The Lions") {
    return '<img class="standings-logo" src="/assets/the-lions.png" alt="The Lions logo" />';
  }
  if (teamName === "The Snipers") {
    return '<img class="standings-logo" src="/assets/the-snipers.png" alt="The Snipers logo" />';
  }
  if (teamName === "The Phantoms") {
    return '<img class="standings-logo" src="/assets/the-phantoms.png" alt="The Phantoms logo" />';
  }
  if (teamName === "MayeDay") {
    return '<img class="standings-logo" src="/assets/mayeday.jpg" alt="MayeDay logo" />';
  }
  if (teamName === "Gus N Em") {
    return '<img class="standings-logo" src="/assets/gus-n-em.png" alt="Gus N Em logo" />';
  }
  if (teamName === "Cheerios") {
    return '<img class="standings-logo" src="/assets/cheerios.png" alt="Cheerios logo" />';
  }
  if (teamName === "Illegals") {
    return '<img class="standings-logo" src="/assets/illegals.png" alt="Illegals logo" />';
  }
  if (teamName === "Storm") {
    return '<img class="standings-logo" src="/assets/storm.png" alt="Storm logo" />';
  }
  if (teamName === "Turkeys") {
    return '<img class="standings-logo" src="/assets/turkeys.png" alt="Turkeys logo" />';
  }
  return "";
}

function parseMetricValue(metric, value) {
  if (metric === "winpct") {
    return parsePct(value);
  }
  return parseNumber(value);
}

function formatMetricDisplay(metric, value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (metric === "winpct") {
    const pct = typeof value === "number" ? value : parsePct(value);
    return pct === null ? "—" : pct.toFixed(3);
  }
  if (metric === "sos" || metric === "trel") {
    const num = typeof value === "number" ? value : parseNumber(value);
    return num === null ? "—" : num.toFixed(3);
  }
  if (metric === "pam") {
    const num = typeof value === "number" ? value : parseNumber(value);
    return num === null ? "—" : num.toFixed(2);
  }
  if (metric === "gb") {
    const num = typeof value === "number" ? value : parseNumber(value);
    return num === null ? "—" : String(num);
  }
  const num = typeof value === "number" ? value : parseNumber(value);
  return num === null ? escapeHtml(String(value)) : String(num);
}

function sortStandingsRows(rows) {
  return [...rows].sort((a, b) => {
    const av = parseMetricValue(requestedMetric, a[requestedMetric]);
    const bv = parseMetricValue(requestedMetric, b[requestedMetric]);
    if (av === null && bv === null) {
      return 0;
    }
    if (av === null) {
      return 1;
    }
    if (bv === null) {
      return -1;
    }
    if (metricOrder(requestedMetric) === "asc") {
      return av - bv;
    }
    return bv - av;
  });
}

function getDivisionName(teamName) {
  const shown = displayTeamName(teamName);
  if (DIVISIONS.North.has(shown)) return "North";
  if (DIVISIONS.South.has(shown)) return "South";
  return "Other";
}

function renderStandingsSection(title, rows) {
  const chips = [
    ["GP", "gp"],
    ["Wins", "wins"],
    ["Loss", "loss"],
    ["GB", "gb"],
    ["Win %", "winpct"],
    ["SOS", "sos"],
    ["PAM", "pam"],
    ["tREL", "trel"],
    ["Transactions", "transactions"],
  ];

  return `
    <section class="leader-section">
      <h2 class="leader-section-title">${escapeHtml(title)}</h2>
      <div class="leader-section-grid">
        ${rows
          .map((row, index) => {
            const rawTeamName = row.team || "Team";
            const teamName = displayTeamName(rawTeamName);
            const link = `team.html?team=${encodeURIComponent(rawTeamName)}`;
            const logo = getTeamLogoHtml(teamName);
            return `
              <a class="leader-row" href="${link}">
                <div class="leader-rank">#${index + 1}</div>
                <div>
                  <div class="leader-name">${logo}${escapeHtml(teamName)}</div>
                </div>
                <div class="leader-meta">
                  ${chips
                    .map(
                      ([label, key]) => `
                        <div class="leader-chip">
                          ${label}
                          <span>${formatMetricDisplay(key, row[key])}</span>
                        </div>
                      `
                    )
                    .join("")}
                </div>
              </a>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderStandings() {
  if (!leagueStandingsMetrics.length) {
    els.leaderboard.innerHTML = "<p>No standings data available.</p>";
    return;
  }

  const leagueRows = sortStandingsRows(leagueStandingsMetrics);
  const northRows = sortStandingsRows(
    leagueStandingsMetrics.filter((row) => getDivisionName(row.team) === "North")
  );
  const southRows = sortStandingsRows(
    leagueStandingsMetrics.filter((row) => getDivisionName(row.team) === "South")
  );

  els.leaderboard.innerHTML = [
    renderStandingsSection("League Standings", leagueRows),
    renderStandingsSection("North Division", northRows),
    renderStandingsSection("South Division", southRows),
  ].join("");
}

function stripCaptainMarker(value) {
  return String(value || "")
    .replace(/\s*\(c\)\s*$/i, "")
    .replace(/\s+c\s*$/i, "")
    .trim();
}

function buildLeagueRowsFromC2S2(standingsRows, scheduleRows, playerRows) {
  const uniqueTeams = new Map();
  Object.keys(STANDINGS_RANGES).forEach((team) => {
    const shown = displayTeamName(team);
    if (!uniqueTeams.has(shown)) {
      uniqueTeams.set(shown, STANDINGS_RANGES[team]);
    }
  });

  const winPctMap = buildWinPctMapFromStandingsRows(standingsRows);
  return Array.from(uniqueTeams.entries())
    .map(([team, range]) => {
      const sliced = sliceRange(standingsRows, range);
      const metricRow = sliced[0] || [];
      if (!metricRow.length) {
        return null;
      }
      const gp = parseNumber(metricRow[1]);
      const advanced = computeAdvancedTeamStats(team, playerRows) || {};
      return {
        team: displayTeamName(metricRow[0] || team),
        gp,
        wins: parseNumber(metricRow[2]),
        loss: parseNumber(metricRow[3]),
        gb: parseNumber(metricRow[4]),
        winpct: parsePct(metricRow[5]),
        sos: computeTeamSOS(team, scheduleRows, winPctMap, "c2s2", gp),
        pam: typeof advanced.pam === "number" ? advanced.pam : null,
        trel: typeof advanced.tRel === "number" ? advanced.tRel : null,
        transactions: 0,
      };
    })
    .filter((row) => row && isStandingsTeamName(row.team));
}

function buildLeagueRowsFromArchive(standingsTable, scheduleTable, season) {
  if (!standingsTable.length) {
    return [];
  }
  const headers = (standingsTable[0] || []).map((h) => String(h || "").trim().toLowerCase());
  const teamIdx = headers.findIndex((h) => h === "team");
  const gpIdx = headers.findIndex((h) => h === "gp");
  const winsIdx = headers.findIndex((h) => h === "wins");
  const lossIdx = headers.findIndex((h) => h === "loss" || h === "losses");
  const gbIdx = headers.findIndex((h) => h === "gb");
  const pctIdx = headers.findIndex((h) => h === "win %" || h === "win%" || h === "pct");
  const winPctMap = buildWinPctMapFromStandingsTable(standingsTable);

  return standingsTable
    .slice(1)
    .map((row) => {
      const team = displayTeamName(row[teamIdx] || "");
      if (!team) {
        return null;
      }
      return {
        team,
        gp: parseNumber(row[gpIdx]),
        wins: parseNumber(row[winsIdx]),
        loss: parseNumber(row[lossIdx]),
        gb: parseNumber(row[gbIdx]),
        winpct: parsePct(row[pctIdx]),
        sos: computeTeamSOS(team, scheduleTable, winPctMap, season),
        pam: null,
        trel: null,
        transactions: 0,
      };
    })
    .filter((row) => row && isStandingsTeamName(row.team));
}

function applyTransactionCountsToLeagueRows(rows, counts) {
  rows.forEach((row) => {
    row.transactions = counts.get(normalizeTeamLabel(row.team)) || 0;
  });
}

function buildWinPctMapFromStandingsRows(standingsRows) {
  const map = new Map();
  Object.keys(STANDINGS_RANGES).forEach((team) => {
    const sliced = sliceRange(standingsRows, STANDINGS_RANGES[team]);
    if (!sliced.length) {
      return;
    }
    const values = sliced[0] || [];
    const rowTeam = String(values[0] || team).trim();
    const pct = parsePct(values[5]);
    if (rowTeam && pct !== null) {
      map.set(rowTeam, pct);
    }
  });
  return map;
}

function buildWinPctMapFromStandingsTable(tableRows) {
  const map = new Map();
  if (!tableRows || !tableRows.length) {
    return map;
  }
  const headers = (tableRows[0] || []).map((h) => String(h || "").toLowerCase());
  const teamIdx = headers.findIndex((h) => h === "team");
  const pctIdx = headers.findIndex((h) => h === "win %" || h === "win%" || h === "pct");
  if (teamIdx === -1 || pctIdx === -1) {
    return map;
  }
  tableRows.slice(1).forEach((row) => {
    const team = String(row[teamIdx] || "").trim();
    const pct = parsePct(row[pctIdx]);
    if (!team || pct === null) {
      return;
    }
    map.set(team, pct);
  });
  return map;
}

function getScheduleIndexes(headers, season) {
  const lower = headers.map((h) => String(h || "").trim().toLowerCase());
  const findIdx = (checks) => lower.findIndex((h) => checks.some((check) => h.includes(check)));

  let date = findIdx(["date"]);
  let team1 = findIdx(["team 1", "team1", "away"]);
  let team2 = findIdx(["team 2", "team2", "home"]);

  if (date === -1 || team1 === -1 || team2 === -1) {
    if (season === "c2s2") {
      if (date === -1) date = 0;
      if (team1 === -1) team1 = 1;
      if (team2 === -1) team2 = 2;
    } else if (headers.length <= 3) {
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

function computeTeamSOS(teamName, scheduleRows, winPctMap, season, gpLimit = null) {
  if (!teamName || !scheduleRows.length || !winPctMap.size) {
    return null;
  }
  const headers = scheduleRows[0] || [];
  const idx = getScheduleIndexes(headers, season);
  const gameTypeIdx = headers.findIndex((h) => String(h || "").toLowerCase().includes("type"));
  const winPctByNormalizedTeam = new Map();
  winPctMap.forEach((pct, team) => {
    winPctByNormalizedTeam.set(normalizeTeamLabel(team), pct);
  });
  const dataRows = scheduleRows
    .slice(1)
    .map((row, order) => ({ row, order }))
    .filter(({ row }) => {
      if (gameTypeIdx >= 0) {
        const gameType = String(row[gameTypeIdx] || "").toLowerCase();
        if (gameType.includes("pre")) {
          return false;
        }
      }
      const team1 = String(row[idx.team1] || "").trim();
      const team2 = String(row[idx.team2] || "").trim();
      return teamMatches(team1, teamName) || teamMatches(team2, teamName);
    })
    .sort((a, b) => {
      const aDate = parseDateValue(a.row[idx.date]);
      const bDate = parseDateValue(b.row[idx.date]);
      if (aDate === bDate) {
        return a.order - b.order;
      }
      return aDate - bDate;
    });

  const limitedRows = Number.isFinite(gpLimit) && gpLimit >= 0 ? dataRows.slice(0, gpLimit) : dataRows;

  let sum = 0;
  let games = 0;
  limitedRows.forEach(({ row }) => {
    const team1 = String(row[idx.team1] || "").trim();
    const team2 = String(row[idx.team2] || "").trim();
    if (!team1 || !team2) {
      return;
    }
    const opponent = teamMatches(team1, teamName) ? team2 : teamMatches(team2, teamName) ? team1 : "";
    if (!opponent) {
      return;
    }
    const oppPct = winPctByNormalizedTeam.get(normalizeTeamLabel(opponent));
    if (oppPct === null || oppPct === undefined) {
      return;
    }
    sum += oppPct;
    games += 1;
  });
  return games ? sum / games : null;
}

function computeAdvancedTeamStats(teamName, allRows) {
  if (!teamName || !allRows.length) {
    return null;
  }
  const columns = detectPlayerColumns(allRows[0] || []);
  const dataRows = allRows.slice(1);

  const leagueTeamTotalsByDate = new Map();
  const leagueScoresByDate = new Map();
  dataRows.forEach((row) => {
    const date = String(row[columns.date] || "").trim();
    const rowTeam = String(row[columns.team] || "").trim();
    const score = parseAdjustedScore(row, columns);
    if (!date || score === null || !rowTeam) {
      return;
    }
    if (!leagueTeamTotalsByDate.has(date)) {
      leagueTeamTotalsByDate.set(date, new Map());
    }
    const teamTotals = leagueTeamTotalsByDate.get(date);
    const teamKey = normalizeTeamLabel(rowTeam);
    teamTotals.set(teamKey, (teamTotals.get(teamKey) || 0) + score);

    if (!leagueScoresByDate.has(date)) {
      leagueScoresByDate.set(date, []);
    }
    leagueScoresByDate.get(date).push(score);
  });

  const medianByDate = new Map();
  leagueScoresByDate.forEach((scores, date) => {
    const med = median(scores);
    if (med !== null) {
      medianByDate.set(date, med);
    }
  });
  const teamMedianByDate = new Map();
  leagueTeamTotalsByDate.forEach((teamTotals, date) => {
    const totals = Array.from(teamTotals.values()).filter((v) => Number.isFinite(v));
    const med = median(totals);
    if (med !== null) {
      teamMedianByDate.set(date, med);
    }
  });

  const teamTotalsByDate = new Map();
  const playerAgg = new Map();
  dataRows.forEach((row) => {
    const rowTeam = String(row[columns.team] || "").trim();
    if (!teamMatches(rowTeam, teamName)) {
      return;
    }
    const date = String(row[columns.date] || "").trim();
    const score = parseAdjustedScore(row, columns);
    const med = medianByDate.get(date);
    if (!date || score === null || !med || med <= 0) {
      return;
    }

    teamTotalsByDate.set(date, (teamTotalsByDate.get(date) || 0) + score);

    const player = stripCaptainMarker(row[columns.player]);
    if (!player) {
      return;
    }
    if (!playerAgg.has(player)) {
      playerAgg.set(player, { relSum: 0, relGames: 0, gp: 0 });
    }
    const agg = playerAgg.get(player);
    agg.relSum += score / med;
    agg.relGames += 1;
    agg.gp += 1;
  });

  if (!teamTotalsByDate.size) {
    return null;
  }

  let pam = 0;
  let tRelWeighted = 0;
  let tRelWeight = 0;
  teamTotalsByDate.forEach((teamTotal, date) => {
    const med = teamMedianByDate.get(date);
    if (!med || med <= 0) {
      return;
    }
    pam += teamTotal - med;
  });

  playerAgg.forEach((agg) => {
    if (!agg.relGames || !agg.gp) {
      return;
    }
    const rel = agg.relSum / agg.relGames;
    tRelWeighted += rel * agg.gp;
    tRelWeight += agg.gp;
  });

  return {
    pam,
    tRel: tRelWeight ? tRelWeighted / tRelWeight : null,
  };
}

function parsePct(value) {
  const num = Number(String(value || "").replace(/[^0-9.\-]/g, ""));
  if (Number.isNaN(num)) {
    return null;
  }
  return num > 1 ? num / 100 : num;
}

function parseNumber(value) {
  const num = Number(String(value || "").replace(/[^0-9.\-]/g, ""));
  return Number.isNaN(num) ? null : num;
}

function median(numbers) {
  if (!numbers.length) {
    return null;
  }
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function normalizeTeamLabel(value) {
  const normalized = String(value || "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\*/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  return normalized === "bullets" ? "storm" : normalized;
}

function teamMatches(value, teamName) {
  const a = normalizeTeamLabel(value);
  const b = normalizeTeamLabel(teamName);
  if (!a || !b) {
    return false;
  }
  return a === b || a.includes(b) || b.includes(a);
}

function isCaptainMarked(value) {
  const text = String(value || "").trim();
  return /\(c\)\s*$/i.test(text) || /\sc\s*$/i.test(text);
}

function parseAdjustedScore(row, columns) {
  const base = parseNumber(row[columns.score]);
  if (base === null) {
    return null;
  }
  return isCaptainMarked(row[columns.player]) ? base - 0.5 : base;
}

function detectPlayerColumns(headerRow) {
  const columns = { date: 0, team: 1, player: 2, score: 3, rank: 4, opponent: 5 };
  if (!headerRow || !headerRow.length) {
    return columns;
  }
  const lowered = headerRow.map((cell) => String(cell || "").trim().toLowerCase());
  const pickByIncludes = (tokens) =>
    lowered.findIndex((h) => tokens.some((token) => h.includes(token)));
  const dateIdx = pickByIncludes(["date", "day"]);
  const teamIdx = pickByIncludes(["team"]);
  const playerIdx = pickByIncludes(["player", "user", "tag"]);
  const scoreIdx = pickByIncludes(["score", "points", "karma"]);
  if (dateIdx !== -1) columns.date = dateIdx;
  if (teamIdx !== -1) columns.team = teamIdx;
  if (playerIdx !== -1) columns.player = playerIdx;
  if (scoreIdx !== -1) columns.score = scoreIdx;
  return columns;
}

function computeAdvancedByTeam(allRows) {
  const map = new Map();
  if (!allRows.length) {
    return map;
  }
  const columns = detectPlayerColumns(allRows[0] || []);
  const dataRows = allRows.slice(1);

  const leagueTeamTotalsByDate = new Map();
  const leagueScoresByDate = new Map();
  dataRows.forEach((row) => {
    const date = String(row[columns.date] || "").trim();
    const rowTeam = String(row[columns.team] || "").trim();
    const score = parseAdjustedScore(row, columns);
    if (!date || score === null || !rowTeam) {
      return;
    }
    if (!leagueTeamTotalsByDate.has(date)) {
      leagueTeamTotalsByDate.set(date, new Map());
    }
    const teamTotals = leagueTeamTotalsByDate.get(date);
    const teamKey = normalizeTeamLabel(rowTeam);
    teamTotals.set(teamKey, (teamTotals.get(teamKey) || 0) + score);

    if (!leagueScoresByDate.has(date)) {
      leagueScoresByDate.set(date, []);
    }
    leagueScoresByDate.get(date).push(score);
  });

  const medianByDate = new Map();
  leagueScoresByDate.forEach((scores, date) => {
    const med = median(scores);
    if (med !== null) {
      medianByDate.set(date, med);
    }
  });
  const teamMedianByDate = new Map();
  leagueTeamTotalsByDate.forEach((teamTotals, date) => {
    const totals = Array.from(teamTotals.values()).filter((v) =>
      Number.isFinite(v)
    );
    const med = median(totals);
    if (med !== null) {
      teamMedianByDate.set(date, med);
    }
  });

  const teamTotalsByDate = new Map();
  const playerAggByTeam = new Map();
  dataRows.forEach((row) => {
    const rowTeam = String(row[columns.team] || "").trim();
    const teamKey = normalizeTeamLabel(rowTeam);
    const date = String(row[columns.date] || "").trim();
    const score = parseAdjustedScore(row, columns);
    const med = medianByDate.get(date);
    if (!teamKey || !date || score === null || !med || med <= 0) {
      return;
    }
    if (!teamTotalsByDate.has(teamKey)) {
      teamTotalsByDate.set(teamKey, new Map());
    }
    const totals = teamTotalsByDate.get(teamKey);
    totals.set(date, (totals.get(date) || 0) + score);

    if (!playerAggByTeam.has(teamKey)) {
      playerAggByTeam.set(teamKey, new Map());
    }
    const playerKey = String(row[columns.player] || "").trim().toLowerCase();
    if (!playerKey) {
      return;
    }
    const playerAgg = playerAggByTeam.get(teamKey);
    if (!playerAgg.has(playerKey)) {
      playerAgg.set(playerKey, { relSum: 0, relGames: 0, gp: 0 });
    }
    const agg = playerAgg.get(playerKey);
    agg.relSum += score / med;
    agg.relGames += 1;
    agg.gp += 1;
  });

  teamTotalsByDate.forEach((totals, team) => {
    let pam = 0;
    totals.forEach((teamTotal, date) => {
      const med = teamMedianByDate.get(date);
      if (!med || med <= 0) {
        return;
      }
      pam += teamTotal - med;
    });

    let tRelWeighted = 0;
    let tRelWeight = 0;
    const playerAgg = playerAggByTeam.get(team) || new Map();
    playerAgg.forEach((agg) => {
      if (!agg.relGames || !agg.gp) {
        return;
      }
      const rel = agg.relSum / agg.relGames;
      tRelWeighted += rel * agg.gp;
      tRelWeight += agg.gp;
    });

    map.set(team, {
      pam,
      tRel: tRelWeight ? tRelWeighted / tRelWeight : null,
    });
  });

  return map;
}

function parseTeamRetirementRow(row) {
  const extractDateAndTeam = (value) => {
    const raw = String(value || "").trim();
    if (!raw) {
      return { date: "", team: "" };
    }
    const firstFour = raw.slice(0, 4).trim();
    if (/^\d{1,2}\/\d{1,2}$/.test(firstFour)) {
      return { date: firstFour, team: raw.slice(4).trim() };
    }
    return { date: "", team: raw };
  };
  const mergedTeamCell = String(row[2] || row[3] || "").trim();
  const parsed = extractDateAndTeam(mergedTeamCell);
  return {
    team: displayTeamName(parsed.team || mergedTeamCell || ""),
  };
}

function parseTeamCutRow(row) {
  const extractDateAndTeam = (value) => {
    const raw = String(value || "").trim();
    if (!raw) {
      return { date: "", team: "" };
    }
    const firstFour = raw.slice(0, 4).trim();
    if (/^\d{1,2}\/\d{1,2}$/.test(firstFour)) {
      return { date: firstFour, team: raw.slice(4).trim() };
    }
    return { date: "", team: raw };
  };
  const mergedTeamCell = String(row[2] || row[3] || "").trim();
  const player = String(row[0] || row[1] || "").trim() || "—";
  const playerLower = String(player).toLowerCase();
  const teamLower = mergedTeamCell.toLowerCase();
  if (
    playerLower === "cuts" ||
    playerLower === "player" ||
    teamLower === "date/team" ||
    teamLower === "team"
  ) {
    return null;
  }
  const parsed = extractDateAndTeam(mergedTeamCell);
  return {
    team: displayTeamName(parsed.team || mergedTeamCell || ""),
  };
}

function parseTeamSigningRow(row) {
  const extractDateAndTeam = (value) => {
    const raw = String(value || "").trim();
    if (!raw) {
      return { date: "", team: "" };
    }
    const firstFour = raw.slice(0, 4).trim();
    if (/^\d{1,2}\/\d{1,2}$/.test(firstFour)) {
      return { date: firstFour, team: raw.slice(4).trim() };
    }
    return { date: "", team: raw };
  };
  const player = String(row[0] || row[1] || "").trim() || "—";
  const mergedTeamCell = String(row[2] || row[3] || "").trim();
  const playerLower = String(player).toLowerCase();
  const teamLower = mergedTeamCell.toLowerCase();
  if (
    playerLower === "signings" ||
    playerLower === "player" ||
    teamLower === "date/team" ||
    teamLower === "team"
  ) {
    return null;
  }
  const parsed = extractDateAndTeam(mergedTeamCell);
  return {
    team: displayTeamName(parsed.team || mergedTeamCell || ""),
  };
}

function computeTransactionCounts(allRows) {
  const counts = new Map();
  const bump = (team) => {
    const key = normalizeTeamLabel(team);
    if (!key) {
      return;
    }
    counts.set(key, (counts.get(key) || 0) + 1);
  };

  sliceRange(allRows, TRANSACTIONS_RANGE)
    .filter((row) => row.some((cell) => String(cell || "").trim()))
    .forEach((row) => {
      bump(row[1]);
      bump(row[3]);
    });

  sliceRange(allRows, RETIREMENT_RANGE)
    .filter((row) => row.some((cell) => String(cell || "").trim()))
    .map(parseTeamRetirementRow)
    .forEach((row) => bump(row.team));

  sliceRange(allRows, CUT_RANGE)
    .filter((row) => row.some((cell) => String(cell || "").trim()))
    .map(parseTeamCutRow)
    .filter(Boolean)
    .forEach((row) => bump(row.team));

  sliceRange(allRows, SIGNING_RANGE)
    .filter((row) => row.some((cell) => String(cell || "").trim()))
    .map(parseTeamSigningRow)
    .filter(Boolean)
    .forEach((row) => bump(row.team));

  return counts;
}

function getRequestedMetric() {
  const metric = new URLSearchParams(window.location.search)
    .get("metric")
    ?.toLowerCase();
  const allowed = new Set([
    "gp",
    "wins",
    "loss",
    "gb",
    "winpct",
    "sos",
    "pam",
    "trel",
    "transactions",
  ]);
  if (allowed.has(metric)) {
    return metric;
  }
  if (metric === "win%" || metric === "pct") {
    return "winpct";
  }
  return "wins";
}

function metricOrder(metric) {
  return metric === "loss" || metric === "gb" ? "asc" : "desc";
}

function getMetricValue(row, headers, metric) {
  const lower = headers.map((h) => String(h || "").toLowerCase());
  const gpIdx = lower.findIndex((h) => h === "gp");
  const winsIdx = lower.findIndex((h) => h === "wins");
  const lossIdx = lower.findIndex((h) => h === "loss" || h === "losses");
  const gbIdx = lower.findIndex((h) => h === "gb");
  const pctIdx = lower.findIndex(
    (h) => h === "win %" || h === "win%" || h === "pct"
  );
  const rawTeamName = row[0] || row[1] || "";
  const teamKey = normalizeTeamLabel(rawTeamName);

  if (metric === "sos") {
    return parseNumber(sosByTeam.get(teamKey));
  }
  if (metric === "pam") {
    return parseNumber((advancedByTeam.get(teamKey) || {}).pam);
  }
  if (metric === "trel") {
    return parseNumber((advancedByTeam.get(teamKey) || {}).tRel);
  }
  if (metric === "transactions") {
    return parseNumber(transactionsByTeam.get(teamKey));
  }
  if (metric === "winpct") {
    return parsePct(row[pctIdx]);
  }
  if (metric === "gp") {
    return parseNumber(row[gpIdx]);
  }
  if (metric === "wins") {
    return parseNumber(row[winsIdx]);
  }
  if (metric === "loss") {
    return parseNumber(row[lossIdx]);
  }
  if (metric === "gb") {
    return parseNumber(row[gbIdx]);
  }
  return null;
}

function parseDateValue(value) {
  const text = String(value || "").trim();
  if (!text) {
    return Number.NEGATIVE_INFINITY;
  }
  const mdy = text.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (mdy) {
    const month = Number(mdy[1]) - 1;
    const day = Number(mdy[2]);
    let year = mdy[3] ? Number(mdy[3]) : new Date().getFullYear();
    if (year < 100) {
      year += 2000;
    }
    const t = new Date(year, month, day).getTime();
    return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
  }
  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

function computeSosMap(
  standingsHeader,
  standingsDataRows,
  scheduleRows,
  team1Idx = 2,
  team2Idx = 3
) {
  const map = new Map();
  if (!standingsDataRows.length || !scheduleRows.length) {
    return map;
  }
  const lower = standingsHeader.map((h) => String(h || "").toLowerCase());
  const teamIdx = lower.findIndex((h) => h === "team");
  const winIdx = lower.findIndex((h) => h === "win %" || h === "win%" || h === "pct");
  const gpIdx = lower.findIndex((h) => h === "gp");
  if (teamIdx === -1 || winIdx === -1) {
    return map;
  }
  const winPctByTeam = new Map();
  const gpByTeam = new Map();
  standingsDataRows.forEach((row) => {
    const team = String(row[teamIdx] || "").trim();
    const pct = parsePct(row[winIdx]);
    if (!team || pct === null) {
      return;
    }
    const key = normalizeTeamLabel(team);
    winPctByTeam.set(key, pct);
    if (gpIdx !== -1) {
      const gp = parseNumber(row[gpIdx]);
      if (Number.isFinite(gp)) {
        gpByTeam.set(key, gp);
      }
    }
  });

  const scheduleHeader = (scheduleRows[0] || []).map((h) =>
    String(h || "").trim().toLowerCase()
  );
  const findScheduleIdx = (checks) =>
    scheduleHeader.findIndex((h) => checks.some((check) => h.includes(check)));

  const resolvedTeam1Idx = (() => {
    const idx = findScheduleIdx(["team 1", "team1", "away"]);
    return idx !== -1 ? idx : team1Idx;
  })();
  const resolvedTeam2Idx = (() => {
    const idx = findScheduleIdx(["team 2", "team2", "home"]);
    return idx !== -1 ? idx : team2Idx;
  })();
  const resolvedDateIdx = (() => {
    const idx = findScheduleIdx(["date"]);
    return idx !== -1 ? idx : 0;
  })();
  const resolvedTypeIdx = (() => {
    const idx = findScheduleIdx(["type", "game type"]);
    return idx;
  })();

  const scheduleData = scheduleRows
    .slice(1)
    .map((row, order) => {
      const team1 = normalizeTeamLabel(String(row[resolvedTeam1Idx] || "").trim());
      const team2 = normalizeTeamLabel(String(row[resolvedTeam2Idx] || "").trim());
      const gameType = resolvedTypeIdx >= 0 ? String(row[resolvedTypeIdx] || "").toLowerCase() : "";
      return {
        row,
        order,
        team1,
        team2,
        dateValue: parseDateValue(row[resolvedDateIdx]),
        isPreseason: gameType.includes("pre"),
      };
    })
    .filter((g) => g.team1 && g.team2 && !g.isPreseason);

  winPctByTeam.forEach((_, teamKey) => {
    const teamGames = scheduleData
      .filter((g) => g.team1 === teamKey || g.team2 === teamKey)
      .sort((a, b) => {
        if (a.dateValue === b.dateValue) return a.order - b.order;
        return a.dateValue - b.dateValue;
      });
    const gpLimit = gpByTeam.get(teamKey);
    const playedGames =
      Number.isFinite(gpLimit) && gpLimit >= 0
        ? teamGames.slice(0, gpLimit)
        : teamGames;

    let sum = 0;
    let count = 0;
    playedGames.forEach((g) => {
      const oppKey = g.team1 === teamKey ? g.team2 : g.team1;
      const oppPct = winPctByTeam.get(oppKey);
      if (oppPct === undefined || oppPct === null) return;
      sum += oppPct;
      count += 1;
    });

    map.set(teamKey, count ? (sum / count).toFixed(3) : "—");
  });
  return map;
}

async function loadStandings() {
  try {
    const seasonRaw = getSeasonRaw();
    const season = getSeason();

    if (seasonRaw === "c2s3-regular" || seasonRaw === "c2s2-playoffs") {
      const [standingsRes, scheduleRes, playerStatsRes, transactionsRes] = await Promise.all([
        fetch(STANDINGS_CSV_URL, { cache: "no-store" }),
        fetch(SCHEDULE_CSV_URL, { cache: "no-store" }),
        fetch(PLAYER_STATS_URL, { cache: "no-store" }),
        fetch(TRANSACTIONS_URL, { cache: "no-store" }),
      ]);
      if (!standingsRes.ok || !scheduleRes.ok || !playerStatsRes.ok) {
        throw new Error(`Fetch failed: ${standingsRes.status || scheduleRes.status || playerStatsRes.status}`);
      }

      const standingsData = parseCSV(await standingsRes.text());
      const scheduleRows = getC2S2ScheduleRows(parseCSV(await scheduleRes.text()));
      const playerRows = parseCSV(await playerStatsRes.text());
      if (!standingsData.length) {
        throw new Error("No data found.");
      }

      standingsHeaders = standingsData[0] || [];
      standingsRows = standingsData.slice(1);
      transactionsByTeam = transactionsRes.ok
        ? computeTransactionCounts(parseCSV(await transactionsRes.text()))
        : new Map();
      leagueStandingsMetrics = buildLeagueRowsFromC2S2(standingsData, scheduleRows, playerRows);
      applyTransactionCountsToLeagueRows(leagueStandingsMetrics, transactionsByTeam);
      renderStandings();
    } else if (seasonRaw === "c2s2-regular") {
      const [regularRes, transactionsRes] = await Promise.all([
        fetch(C2S2_REGULAR_URL, { cache: "no-store" }),
        fetch(TRANSACTIONS_URL, { cache: "no-store" }),
      ]);
      if (!regularRes.ok) {
        throw new Error(`Fetch failed: ${regularRes.status}`);
      }

      const regularRows = parseCSV(await regularRes.text());
      const standingsTable = sliceRange(regularRows, C2S2_REGULAR_RANGES.standings);
      const scheduleTable = sliceRange(regularRows, C2S2_REGULAR_RANGES.schedule);
      if (!standingsTable.length) {
        throw new Error("No data found.");
      }

      standingsHeaders = standingsTable[0] || [];
      standingsRows = standingsTable.slice(1);
      transactionsByTeam = transactionsRes.ok
        ? computeTransactionCounts(parseCSV(await transactionsRes.text()))
        : new Map();
      leagueStandingsMetrics = buildLeagueRowsFromArchive(standingsTable, scheduleTable, season);
      applyTransactionCountsToLeagueRows(leagueStandingsMetrics, transactionsByTeam);
      renderStandings();
    } else {
      const response = await fetch(ARCHIVE_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }

      const rows = parseCSV(await response.text());
      const standingsTable = sliceRange(rows, ARCHIVE_RANGES.standings);
      const scheduleTable = sliceRange(rows, "G31:I79");
      if (!standingsTable.length) {
        throw new Error("No data found.");
      }

      standingsHeaders = standingsTable[0] || [];
      standingsRows = standingsTable.slice(1);
      transactionsByTeam = new Map();
      leagueStandingsMetrics = buildLeagueRowsFromArchive(standingsTable, scheduleTable, season);
      renderStandings();
    }

    updateLastUpdated();
  } catch (error) {
    els.leaderboard.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
  }
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

initSeasonSelect();
requestedMetric = getRequestedMetric();
loadStandings();
