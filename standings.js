const STANDINGS_CSV_URL = "/api/sheet?name=standings-dashboard";
const SCHEDULE_CSV_URL = "/api/sheet?name=schedule";
const SCHEDULE_PLAYOFF_URL = "/api/sheet?name=schedule-playoffs";
const C2S2_PLAYOFF_SCHEDULE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=507537612&single=true&output=csv";
const PLAYER_STATS_URL = "/api/sheet?name=player-stats";
const PLAYER_STATS_PLAYOFF_URL = "/api/sheet?name=player-stats-playoffs";
const TRANSACTIONS_URL = "/api/sheet?name=transactions";
const ARCHIVE_URL = "/api/sheet?name=archive";
const C2S2_REGULAR_URL = "/api/sheet?name=c2s2-regular";
const C1S2_STANDINGS_URL = "/assets/data/c1s2-standings.csv";
const C1S6_STANDINGS_URL = "/assets/data/c1s6-standings.csv";
const C1S5_STANDINGS_URL = "/assets/data/c1s5-standings.csv";
const C1S4_STANDINGS_URL = "/assets/data/c1s4-standings.csv";
const C1S3_STANDINGS_URL = "/assets/data/c1s3-standings.csv";
const SEASON_KEY = "season";
const ALL_TIME_SEASON = "all-time";
const C2S2_SCHEDULE_RANGE = "A2:E77";
const TRANSACTIONS_RANGE = "A3:E81";
const RETIREMENT_RANGE = "G3:J70";
const CUT_RANGE = "L3:O81";
const SIGNING_RANGE = "Q3:T81";
const els = {
  lastUpdated: document.getElementById("last-updated"),
  leaderboard: document.getElementById("leaderboard"),
  scopeTabs: document.getElementById("standings-scope-tabs"),
};

let standingsRows = [];
let standingsHeaders = [];
let sosByTeam = new Map();
let requestedMetric = "wins";
let advancedByTeam = new Map();
let transactionsByTeam = new Map();
let leagueStandingsMetrics = [];
let scheduleRowsForTiebreakers = [];
const STANDINGS_SCOPE_KEY = "standings_scope";

const ARCHIVE_RANGES = {
  standings: "A1:F7",
  bracket: "A9:F15",
};
const C2S2_REGULAR_RANGES = {
  standings: "A59:F69",
  schedule: "A71:E170",
  player_stats: "A151:G1150",
};
const CURRENT_PLAYOFF_GAMES = 15;
const CURRENT_PLAYOFF_SPOTS_PER_DIVISION = 3;

const EXCLUDED_STANDINGS_NAMES = new Set([
  "team",
  "north",
  "south",
  "east",
  "west",
  "bracket",
  "standings",
  "playoffs",
  "locked psp",
  "locked psp join",
]);

const DIVISIONS = {
  current: {
    primaryKey: "north",
    secondaryKey: "south",
    primaryLabel: "North",
    secondaryLabel: "Locked PSP",
    primary: new Set(["Turkeys", "The Lions", "The Phantoms", "Gus N Em", "Illegals"]),
    secondary: new Set(["Bad Bois", "The Snipers", "Storm", "Scorpions", "Dream Team"]),
  },
  c1s2: {
    primaryKey: "east",
    secondaryKey: "west",
    primaryLabel: "East",
    secondaryLabel: "West",
    primary: new Set(["Thunderhawks", "Whatsgrass", "Tigers", "Legends", "ALEK Manoahs", "Gamblers"]),
    secondary: new Set(["Burritos", "Cobras", "Illegals", "Gus N Em", "Bees"]),
  },
  c1s6: {
    primaryKey: "jj",
    secondaryKey: "jr",
    primaryLabel: "Justin Jefferson",
    secondaryLabel: "Jrrdql",
    primary: new Set(["Whatsgrass", "Wolves", "The Currents", "Mafia", "ALEK Manoahs", "Thunderhawks", "Phoenix"]),
    secondary: new Set(["Bees", "Illegals", "Gus N Em", "Cobras", "Zombies", "Mets", "Turkeys", "Broncos"]),
  },
  c1s5: {
    primaryKey: "jj",
    secondaryKey: "jr",
    primaryLabel: "Justin Jefferson",
    secondaryLabel: "Jrrdql",
    primary: new Set(["Mafia", "The Currents", "ALEK Manoahs", "Thunderhawks", "Doggy N Em", "Wolves", "Karma Avengers", "Whatsgrass"]),
    secondary: new Set(["Gus N Em", "Turkeys", "Illegals", "Burritos", "Cobras", "Bees", "Mets", "Phoenix"]),
  },
  c1s4: {
    primaryKey: "east",
    secondaryKey: "west",
    primaryLabel: "East",
    secondaryLabel: "West",
    primary: new Set(["Whatsgrass", "Karma Avengers", "Thunderhawks", "ALEK Manoahs", "Mafia", "Doggy N Em", "The Currents"]),
    secondary: new Set(["Cobras", "Burritos", "Gus N Em", "Bees", "Illegals", "Enforcers", "The Bolts"]),
  },
  c1s3: {
    primaryKey: "east",
    secondaryKey: "west",
    primaryLabel: "East",
    secondaryLabel: "West",
    primary: new Set(["Masdog N Em", "Whatsgrass", "ALEK Manoahs", "Thunderhawks", "Chicken Nuggets", "Mafia"]),
    secondary: new Set(["Cobras", "Bees", "Burritos", "Gus N Em", "Enforcers", "Illegals"]),
  },
};

const CURRENT_TEAMS = [
  "Turkeys",
  "Gus N Em",
  "Storm",
  "Bad Bois",
  "Scorpions",
  "Illegals",
  "The Lions",
  "Dream Team",
  "The Snipers",
  "The Phantoms",
];

const CURRENT_PLAYOFF_STATUS_OVERRIDES = new Map([
  ["bad bois", { key: "clinched", label: "Clinched" }],
  ["scorpions", { key: "eliminated", label: "Eliminated" }],
]);

const CURRENT_LOCKED_PSP_TIEBREAK_ORDER = new Map([
  ["the snipers", 1],
  ["dream team", 2],
  ["bad bois", 3],
  ["scorpions", 4],
  ["storm", 5],
]);

const CURRENT_FRANCHISE_NAMES = new Map(
  CURRENT_TEAMS.map((team) => [getFranchiseKey(team), team])
);

function getSeasonRaw() {
  const raw = localStorage.getItem(SEASON_KEY) || "c2s3-regular";
  if (raw === ALL_TIME_SEASON) return ALL_TIME_SEASON;
  if (raw === "c2s2") return "c2s3-regular";
  return raw;
}

function getSeason() {
  const raw = getSeasonRaw();
  if (raw === ALL_TIME_SEASON) return ALL_TIME_SEASON;
  if (raw === "c2s3-regular" || raw === "c2s3-playoffs" || raw === "c2s2-playoffs" || raw === "c2s2-regular") return "c2s2";
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
    select.value = seasonRaw;
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
  if (name === "Yetis") return "Scorpions";
  if (name === "Scorpians") return "Scorpions";
  if (name === "N/A") return "Scorpions";
  if (name === "The Future") return "Dream Team";
  if (name === "Avengers") return "Karma Avengers";
  if (name === "Currents") return "The Currents";
  if (name === "Bolts") return "The Bolts";
  if (name === "Doggy N em") return "Doggy N Em";
  if (name === "Wrangler") return "Wranglers";
  return name;
}

function normalizeCurrentTeamName(value) {
  const team = displayTeamName(value);
  if (team === "Yetis" || team === "N/A") return "Scorpions";
  return team;
}

function getFranchiseKey(value) {
  const team = displayTeamName(value);
  if (
    team === "Tigers" ||
    team === "Masdog N Em" ||
    team === "Karma Avengers" ||
    team === "Avengers"
  ) {
    return "tigers-avengers-lineage";
  }
  if (team === "Legends" || team === "Mafia") {
    return "mafia-lineage";
  }
  if (
    team === "Gamblers" ||
    team === "Chicken Nuggets" ||
    team === "Doggy N Em" ||
    team === "Mambas"
  ) {
    return "doggy-lineage";
  }
  if (team === "Currents" || team === "The Currents") {
    return "the-currents";
  }
  if (team === "Bolts" || team === "The Bolts" || team === "Turkeys") {
    return "turkeys-lineage";
  }
  if (team === "Enforcers" || team === "Wolves") {
    return "wolves-lineage";
  }
  if (team === "Wrangler" || team === "Wranglers") {
    return "wranglers";
  }
  if (team === "Storm" || team === "Bullets" || team === "Strom") {
    return "storm";
  }
  if (team === "Scorpions") {
    return "scorpions";
  }
  if (team === "Yetis") {
    return "scorpions";
  }
  if (team === "Dream Team" || team === "The Future") {
    return "dream-team";
  }
  return normalizeTeamLabel(team);
}

function getFranchiseSeasonConfigs() {
  return [
    { key: "c2s3-regular", type: "current", url: STANDINGS_CSV_URL },
    { key: "c2s2-regular", type: "range", url: C2S2_REGULAR_URL, range: C2S2_REGULAR_RANGES.standings },
    { key: "c2s1-regular", type: "range", url: ARCHIVE_URL, range: ARCHIVE_RANGES.standings },
    { key: "c1s6-regular", type: "csv", url: C1S6_STANDINGS_URL },
    { key: "c1s5-regular", type: "csv", url: C1S5_STANDINGS_URL },
    { key: "c1s4-regular", type: "csv", url: C1S4_STANDINGS_URL },
    { key: "c1s3-regular", type: "csv", url: C1S3_STANDINGS_URL },
    { key: "c1s2-regular", type: "csv", url: C1S2_STANDINGS_URL },
  ];
}

function getDivisionConfig() {
  const seasonRaw = getSeasonRaw();
  if (seasonRaw === "c1s6-regular" || seasonRaw === "c1s6-post") {
    return DIVISIONS.c1s6;
  }
  if (seasonRaw === "c1s5-regular" || seasonRaw === "c1s5-post") {
    return DIVISIONS.c1s5;
  }
  if (seasonRaw === "c1s4-regular" || seasonRaw === "c1s4-post") {
    return DIVISIONS.c1s4;
  }
  if (seasonRaw === "c1s3-regular" || seasonRaw === "c1s3-post") {
    return DIVISIONS.c1s3;
  }
  if (seasonRaw === "c1s2-regular" || seasonRaw === "c1s2-post") {
    return DIVISIONS.c1s2;
  }
  return DIVISIONS.current;
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
  const headerRowIndex = rows.findIndex((row) => {
    const header = row.map((value) => String(value || "").trim().toLowerCase());
    return (
      header.some((value) => value === "date" || value.includes("date")) &&
      header.some(
        (value) => value.includes("team 1") || value.includes("team1") || value.includes("away") || value.includes("home")
      )
    );
  });
  if (headerRowIndex >= 0) {
    return rows.slice(headerRowIndex);
  }
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
  if (teamName === "Masdog N Em" || teamName === "Richer N Em" || teamName === "Doggy N Em") {
    return '<img class="standings-logo" src="/assets/gus-n-em.png" alt="N Em logo" />';
  }
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
  if (teamName === "Scorpions") {
    return '<img class="standings-logo" src="/assets/mayeday.jpg" alt="Scorpions logo" />';
  }
  if (teamName === "ALEK Manoahs") {
    return '<img class="standings-logo" src="/assets/alek-manoahs.jpg" alt="ALEK Manoahs logo" />';
  }
  if (teamName === "Bees") {
    return '<img class="standings-logo" src="/assets/bees.jpg" alt="Bees logo" />';
  }
  if (teamName === "Broncos") {
    return '<img class="standings-logo" src="/assets/broncos.jpg" alt="Broncos logo" />';
  }
  if (teamName === "Burritos") {
    return '<img class="standings-logo" src="/assets/burritos.jpg" alt="Burritos logo" />';
  }
  if (teamName === "Cobras") {
    return '<img class="standings-logo" src="/assets/cobras.png" alt="Cobras logo" />';
  }
  if (teamName === "Karma Avengers" || teamName === "Avengers") {
    return '<img class="standings-logo" src="/assets/karma-avengers.png" alt="Karma Avengers logo" />';
  }
  if (teamName === "Mafia") {
    return '<img class="standings-logo" src="/assets/mafia.png" alt="Mafia logo" />';
  }
  if (teamName === "Mets" || teamName === "The Mets") {
    return '<img class="standings-logo" src="/assets/mets.png" alt="Mets logo" />';
  }
  if (teamName === "Phoenix" || teamName === "The Phoenix") {
    return '<img class="standings-logo" src="/assets/phoenix.png" alt="Phoenix logo" />';
  }
  if (teamName === "Thunderhawks") {
    return '<img class="standings-logo" src="/assets/thunderhawks.png" alt="Thunderhawks logo" />';
  }
  if (teamName === "The Currents" || teamName === "Currents") {
    return '<img class="standings-logo" src="/assets/the-currents.png" alt="The Currents logo" />';
  }
  if (teamName === "Whatsgrass") {
    return '<img class="standings-logo" src="/assets/whatsgrass.png" alt="Whatsgrass logo" />';
  }
  if (teamName === "Wolves") {
    return '<img class="standings-logo" src="/assets/wolves.png" alt="Wolves logo" />';
  }
  if (teamName === "Zombies") {
    return '<img class="standings-logo" src="/assets/zombies.png" alt="Zombies logo" />';
  }
  if (teamName === "Chicken Nuggets") {
    return '<img class="standings-logo" src="/assets/chicken-nuggets.jpg" alt="Chicken Nuggets logo" />';
  }
  if (teamName === "Gus N Em") {
    return '<img class="standings-logo" src="/assets/gus-n-em.png" alt="Gus N Em logo" />';
  }
  if (teamName === "Bad Bois") {
    return '<img class="standings-logo" src="https://media.realapp.com/assets/user/default/large/4JZRj4DJ_29132497.webp" alt="Bad Bois logo" />';
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
    const metricDiff = bv - av;
    if (metricDiff) {
      return metricDiff;
    }
    if (requestedMetric === "wins" || requestedMetric === "winpct") {
      const tiebreaker = compareStandingsTiebreakers(a, b);
      if (tiebreaker) return tiebreaker;
    }
    return String(a.team || "").localeCompare(String(b.team || ""));
  });
}

function compareNullableDesc(a, b) {
  const av = Number.isFinite(a) ? a : null;
  const bv = Number.isFinite(b) ? b : null;
  if (av === null && bv === null) return 0;
  if (av === null) return 1;
  if (bv === null) return -1;
  return bv - av;
}

function getTiebreakerWinnerFromResult(result, team1, team2) {
  const text = String(result || "").trim();
  if (!text) return "";
  const lower = text.toLowerCase();
  if (teamMatches(text, team1)) return displayTeamName(team1);
  if (teamMatches(text, team2)) return displayTeamName(team2);
  if (lower.includes("team 1") || lower.includes("home")) return displayTeamName(team1);
  if (lower.includes("team 2") || lower.includes("away")) return displayTeamName(team2);
  return "";
}

function getHeadToHeadWins(teamA, teamB) {
  if (!teamA || !teamB || !scheduleRowsForTiebreakers.length) {
    return null;
  }
  const headers = scheduleRowsForTiebreakers[0] || [];
  const idx = getScheduleIndexes(headers, getSeason());
  const lower = headers.map((h) => String(h || "").trim().toLowerCase());
  const resultIdx = lower.findIndex((h) => h === "result" || h.includes("winner"));
  if (resultIdx === -1) {
    return null;
  }

  let winsA = 0;
  let winsB = 0;
  scheduleRowsForTiebreakers.slice(1).forEach((row) => {
    const team1 = displayTeamName(String(row[idx.team1] || "").trim());
    const team2 = displayTeamName(String(row[idx.team2] || "").trim());
    const isMatch =
      (teamMatches(team1, teamA) && teamMatches(team2, teamB)) ||
      (teamMatches(team1, teamB) && teamMatches(team2, teamA));
    if (!isMatch) return;
    const winner = getTiebreakerWinnerFromResult(row[resultIdx], team1, team2);
    if (!winner) return;
    if (teamMatches(winner, teamA)) winsA += 1;
    if (teamMatches(winner, teamB)) winsB += 1;
  });

  if (!winsA && !winsB) return null;
  return { winsA, winsB };
}

function compareStandingsTiebreakers(a, b) {
  const officialOrder = compareCurrentLockedPspOrder(a.team, b.team);
  if (officialOrder) return officialOrder;

  const h2h = getHeadToHeadWins(a.team, b.team);
  if (h2h && h2h.winsA !== h2h.winsB) {
    return h2h.winsB - h2h.winsA;
  }

  const totalScoreCompare = compareNullableDesc(a.totalScore, b.totalScore);
  if (totalScoreCompare) return totalScoreCompare;

  const sosCompare = compareNullableDesc(a.sos, b.sos);
  if (sosCompare) return sosCompare;

  return 0;
}

function compareCurrentLockedPspOrder(teamA, teamB) {
  const season = getSeasonRaw();
  if (season !== "c2s3-regular" && season !== "c2s3-playoffs") return 0;
  if (getDivisionName(teamA) !== "Locked PSP" || getDivisionName(teamB) !== "Locked PSP") {
    return 0;
  }
  const aRank = CURRENT_LOCKED_PSP_TIEBREAK_ORDER.get(normalizeTeamLabel(teamA)) ?? 99;
  const bRank = CURRENT_LOCKED_PSP_TIEBREAK_ORDER.get(normalizeTeamLabel(teamB)) ?? 99;
  return aRank - bRank;
}

function getDivisionName(teamName) {
  const shown = displayTeamName(teamName);
  const config = getDivisionConfig();
  if (config.primary.has(shown)) return config.primaryLabel;
  if (config.secondary.has(shown)) return config.secondaryLabel;
  return "Other";
}

function getStandingsScope() {
  const raw = String(localStorage.getItem(STANDINGS_SCOPE_KEY) || "league").toLowerCase();
  const config = getDivisionConfig();
  return raw === config.primaryKey || raw === config.secondaryKey || raw === "north" || raw === "south" || raw === "magic"
    ? raw
    : "league";
}

function initStandingsScope() {
  if (!els.scopeTabs) return;
  const config = getDivisionConfig();
  const buttons = Array.from(els.scopeTabs.querySelectorAll("[data-scope]"));
  buttons.forEach((button) => {
    const scope = String(button.dataset.scope || "league").toLowerCase();
    if (scope === "north") {
      button.textContent = config.primaryLabel;
    } else if (scope === "south") {
      button.textContent = config.secondaryLabel;
    }
  });
  const activeScope = getStandingsScope();
  buttons.forEach((button) => {
    const scope = String(button.dataset.scope || "league").toLowerCase();
    const normalizedScope =
      scope === "north" ? config.primaryKey : scope === "south" ? config.secondaryKey : scope;
    const normalizedActive =
      activeScope === "north" ? config.primaryKey : activeScope === "south" ? config.secondaryKey : activeScope;
    const isActive = normalizedScope === normalizedActive;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
    button.addEventListener("click", () => {
      localStorage.setItem(STANDINGS_SCOPE_KEY, normalizedScope);
      buttons.forEach((tab) => {
        const tabActive = tab === button;
        tab.classList.toggle("active", tabActive);
        tab.setAttribute("aria-pressed", tabActive ? "true" : "false");
      });
      renderStandings();
    });
  });
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
            const status = row.playoffStatus ? `<span class="leader-status leader-status--${escapeHtml(row.playoffStatus.key)}">${escapeHtml(row.playoffStatus.label)}</span>` : "";
            return `
              <a class="leader-row" href="${link}">
                <div class="leader-rank">#${index + 1}</div>
                <div>
                  <div class="leader-name">${logo}${escapeHtml(teamName)}${status}</div>
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

function buildPlayoffStatuses(rows) {
  const ordered = [...rows].sort((a, b) => {
    const officialOrder = compareCurrentLockedPspOrder(a.team, b.team);
    if (officialOrder) return officialOrder;
    const aw = parseNumber(a.wins) ?? 0;
    const bw = parseNumber(b.wins) ?? 0;
    if (bw !== aw) return bw - aw;
    const al = parseNumber(a.loss) ?? 0;
    const bl = parseNumber(b.loss) ?? 0;
    if (al !== bl) return al - bl;
    const ag = parseNumber(a.gb);
    const bg = parseNumber(b.gb);
    if (ag !== null || bg !== null) {
      if (ag === null) return 1;
      if (bg === null) return -1;
      if (ag !== bg) return ag - bg;
    }
    const ap = parsePct(a.winpct);
    const bp = parsePct(b.winpct);
    if (ap !== null || bp !== null) {
      if (ap === null) return 1;
      if (bp === null) return -1;
      if (bp !== ap) return bp - ap;
    }
    return String(a.team || "").localeCompare(String(b.team || ""));
  });
  const byDivision = new Map();
  ordered.forEach((row) => {
    const division = getDivisionName(row.team);
    if (!byDivision.has(division)) {
      byDivision.set(division, []);
    }
    byDivision.get(division).push(row);
  });

  const statusByTeam = new Map();
  byDivision.forEach((divisionRows) => {
    const ranked = [...divisionRows];

    const thirdPlace = ranked[CURRENT_PLAYOFF_SPOTS_PER_DIVISION - 1] || null;
    const thirdPlaceWins = thirdPlace ? (parseNumber(thirdPlace.wins) ?? 0) : 0;
    const thirdPlaceLosses = thirdPlace ? (parseNumber(thirdPlace.loss) ?? 0) : 0;

    ranked.forEach((row, index) => {
      const wins = parseNumber(row.wins) ?? 0;
      const losses = parseNumber(row.loss) ?? 0;
      const gamesPlayed = parseNumber(row.gp) ?? wins + losses;
      const remaining = Math.max(0, CURRENT_PLAYOFF_GAMES - gamesPlayed);
      const maxWins = wins + remaining;
      let status = {
        key: "contention",
        label: "In contention",
      };

      if (index < CURRENT_PLAYOFF_SPOTS_PER_DIVISION) {
        const fourthPlace = ranked[CURRENT_PLAYOFF_SPOTS_PER_DIVISION] || null;
        const fourthPlaceMaxWins = fourthPlace
          ? (parseNumber(fourthPlace.wins) ?? 0) + Math.max(0, CURRENT_PLAYOFF_GAMES - ((parseNumber(fourthPlace.gp) ?? 0)))
          : -1;
        if (!fourthPlace || wins > fourthPlaceMaxWins) {
          status = { key: "clinched", label: "Clinched" };
        }
      } else if (maxWins < thirdPlaceWins) {
        status = { key: "eliminated", label: "Eliminated" };
      } else if (maxWins === thirdPlaceWins && losses > thirdPlaceLosses) {
        status = { key: "contention", label: "In contention" };
      }

      statusByTeam.set(row.team, getCurrentPlayoffStatusOverride(row.team) || status);
    });
  });

  return rows.map((row) => ({
    ...row,
    playoffStatus: statusByTeam.get(row.team) || { key: "contention", label: "In contention" },
  }));
}

function buildMagicNumberRows(rows) {
  const config = getDivisionConfig();
  const rowsByDivision = new Map();
  rows.forEach((row) => {
    const division = getDivisionName(row.team);
    if (!rowsByDivision.has(division)) rowsByDivision.set(division, []);
    rowsByDivision.get(division).push(row);
  });

  const output = [];
  rowsByDivision.forEach((divisionRows, division) => {
    const ranked = sortStandingsRows(divisionRows);
    const cutoff = ranked[CURRENT_PLAYOFF_SPOTS_PER_DIVISION] || null;
    ranked.forEach((row, index) => {
      const wins = parseNumber(row.wins) ?? 0;
      const losses = parseNumber(row.loss) ?? 0;
      const gp = parseNumber(row.gp) ?? wins + losses;
      const remaining = Math.max(0, CURRENT_PLAYOFF_GAMES - gp);
      const target = index < CURRENT_PLAYOFF_SPOTS_PER_DIVISION
        ? cutoff
        : ranked[CURRENT_PLAYOFF_SPOTS_PER_DIVISION - 1] || null;
      const targetWins = target ? (parseNumber(target.wins) ?? 0) : 0;
      const targetLosses = target ? (parseNumber(target.loss) ?? 0) : 0;
      const targetGp = target ? (parseNumber(target.gp) ?? targetWins + targetLosses) : 0;
      const targetRemaining = Math.max(0, CURRENT_PLAYOFF_GAMES - targetGp);
      const targetMaxWins = targetWins + targetRemaining;
      const magic = index < CURRENT_PLAYOFF_SPOTS_PER_DIVISION
        ? target
          ? Math.max(0, CURRENT_PLAYOFF_GAMES + 1 - wins - targetLosses)
          : 0
        : null;
      const maxWins = wins + remaining;
      const isEliminated = Boolean(target) && maxWins < targetWins;
      const doesNotControlFuture =
        !isEliminated &&
        Boolean(target) &&
        (index >= CURRENT_PLAYOFF_SPOTS_PER_DIVISION || (magic !== null && magic > remaining));
      const playoffStatusOverride = getCurrentPlayoffStatusOverride(row.team);
      output.push({
        ...row,
        division,
        rankInDivision: index + 1,
        wins,
        losses,
        remaining,
        target,
        targetWins,
        targetLosses,
        targetRemaining,
        targetMaxWins,
        maxWins,
        magic: playoffStatusOverride?.key === "clinched" ? 0 : magic,
        isEliminated: playoffStatusOverride?.key === "eliminated" ? true : isEliminated,
        doesNotControlFuture: playoffStatusOverride ? false : doesNotControlFuture,
        isInPlayoffPosition:
          playoffStatusOverride?.key === "clinched"
            ? true
            : playoffStatusOverride?.key === "eliminated"
            ? false
            : index < CURRENT_PLAYOFF_SPOTS_PER_DIVISION,
      });
    });
  });

  const divisionOrder = new Map([
    [config.primaryLabel, 0],
    [config.secondaryLabel, 1],
  ]);
  return output.sort((a, b) => {
    const ad = divisionOrder.get(a.division) ?? 9;
    const bd = divisionOrder.get(b.division) ?? 9;
    if (ad !== bd) return ad - bd;
    return a.rankInDivision - b.rankInDivision;
  });
}

function renderMagicNumberSection(rows, options = {}) {
  if (getSeasonRaw() === ALL_TIME_SEASON) return "";
  const magicRows = buildMagicNumberRows(rows);
  if (!magicRows.length) return "";
  return `
    <section class="leader-section magic-number-section">
      ${options.showTitle === false ? "" : '<h2 class="leader-section-title">Magic Numbers</h2>'}
      <div class="magic-number-grid">
        ${magicRows
          .map((row) => {
            const teamName = displayTeamName(row.team);
            const logo = getTeamLogoHtml(teamName);
            const targetName = row.target ? displayTeamName(row.target.team) : "";
            const magicText = row.isEliminated
              ? "Eliminated"
              : row.doesNotControlFuture
              ? "Dont Control Future"
              : row.magic === null
              ? "—"
              : row.magic === 0
              ? "Clinched"
              : String(row.magic);
            const summary = row.isEliminated
              ? `${teamName} is eliminated because its max wins (${row.maxWins}) cannot catch the cutoff.`
              : row.doesNotControlFuture
              ? `${teamName} still has a path, but needs help from other results.`
              : row.isInPlayoffPosition
              ? row.magic === 0
                ? `${teamName} has clinched a playoff spot.`
                : `${row.magic} combined ${teamName} win(s) and ${targetName} loss(es) clinch a playoff spot.`
              : `${teamName} is outside the playoff line and must pass ${targetName || "the playoff cutoff"}.`;
            return `
              <details class="magic-number-card">
                <summary>
                  <span class="magic-number-team">${logo}<span>${escapeHtml(teamName)}</span></span>
                  <span class="magic-number-value">${escapeHtml(magicText)}</span>
                </summary>
                <div class="magic-number-breakdown">
                  <p>${escapeHtml(summary)}</p>
                  <div class="magic-number-facts">
                    <span>Division: <strong>${escapeHtml(row.division)}</strong></span>
                    <span>Record: <strong>${escapeHtml(`${row.wins}-${row.losses}`)}</strong></span>
                    <span>Games Left: <strong>${escapeHtml(String(row.remaining))}</strong></span>
                    ${
                      row.target
                        ? `<span>Cutoff Team: <strong>${escapeHtml(targetName)} (${escapeHtml(`${row.targetWins}-${row.targetLosses}`)})</strong></span>
                           <span>${escapeHtml(targetName)} Max Wins: <strong>${escapeHtml(String(row.targetMaxWins))}</strong></span>`
                        : ""
                    }
                  </div>
                </div>
              </details>
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

  const config = getDivisionConfig();
  const scope = getStandingsScope();
  const leagueRows = sortStandingsRows(leagueStandingsMetrics);
  const primaryRows = sortStandingsRows(
    leagueStandingsMetrics.filter((row) => getDivisionName(row.team) === config.primaryLabel)
  );
  const secondaryRows = sortStandingsRows(
    leagueStandingsMetrics.filter((row) => getDivisionName(row.team) === config.secondaryLabel)
  );

  if (scope === "magic") {
    els.leaderboard.innerHTML = renderMagicNumberSection(leagueRows, { showTitle: false });
    return;
  }
  if (scope === config.primaryKey || (scope === "north" && config.primaryKey === "north")) {
    els.leaderboard.innerHTML = renderStandingsSection(`${config.primaryLabel} Division`, primaryRows);
    return;
  }
  if (scope === config.secondaryKey || (scope === "south" && config.secondaryKey === "south")) {
    els.leaderboard.innerHTML = renderStandingsSection(`${config.secondaryLabel} Division`, secondaryRows);
    return;
  }
  const leagueTitle = getSeasonRaw() === ALL_TIME_SEASON ? "All-Time Standings" : "League Standings";
  els.leaderboard.innerHTML = renderStandingsSection(leagueTitle, leagueRows);
}

function stripCaptainMarker(value) {
  return String(value || "")
    .replace(/\s*\(c\)\s*$/i, "")
    .replace(/\s+c\s*$/i, "")
    .trim();
}

function buildLeagueRowsFromC2S2(standingsRows, scheduleRows, playerRows) {
  const currentRows = getCurrentStandingsRows(standingsRows);
  const winPctMap = buildWinPctMapFromStandingsRows(standingsRows);
  return currentRows
    .map((metricRow) => {
      const gp = parseNumber(metricRow.gp);
      const advanced = computeAdvancedTeamStats(metricRow.team, playerRows) || {};
      return {
        team: metricRow.team,
        gp,
        wins: parseNumber(metricRow.wins),
        loss: parseNumber(metricRow.losses),
        gb: parseNumber(metricRow.gb),
        winpct: parsePct(metricRow.winPct),
        sos: computeTeamSOS(metricRow.team, scheduleRows, winPctMap, "c2s2", gp),
        pam: typeof advanced.pam === "number" ? advanced.pam : null,
        trel: typeof advanced.tRel === "number" ? advanced.tRel : null,
        totalScore: typeof advanced.totalScore === "number" ? advanced.totalScore : null,
        transactions: 0,
      };
    })
    .filter((row) => row && isStandingsTeamName(row.team));
}

function getCurrentStandingsHeaderIndexes(row) {
  const normalized = (row || []).map((cell) => String(cell || "").trim().toLowerCase());
  const teamIdx = normalized.findIndex((cell) => cell === "team");
  const gpIdx = normalized.findIndex((cell) => cell === "gp");
  const winsIdx = normalized.findIndex((cell) => cell === "wins" || cell === "win");
  const lossesIdx = normalized.findIndex((cell) => cell === "loss" || cell === "losses" || cell === "l");
  const gbIdx = normalized.findIndex((cell) => cell === "gb");
  const pctIdx = normalized.findIndex((cell) => cell === "win %" || cell === "win%" || cell === "pct");
  if (teamIdx < 0 || gpIdx < 0 || winsIdx < 0 || lossesIdx < 0 || gbIdx < 0 || pctIdx < 0) {
    return null;
  }
  return { teamIdx, gpIdx, winsIdx, lossesIdx, gbIdx, pctIdx };
}

function getCurrentStandingsRows(rows) {
  const byTeam = new Map();
  let indexes = null;

  (rows || []).forEach((row) => {
    const nextIndexes = getCurrentStandingsHeaderIndexes(row);
    if (nextIndexes) {
      indexes = nextIndexes;
      return;
    }
    if (!indexes) return;

    const rawTeam = String(row[indexes.teamIdx] || "").trim();
    const team = normalizeCurrentTeamName(rawTeam);
    if (!team || !isStandingsTeamName(team)) return;

    byTeam.set(team, {
      team,
      gp: row[indexes.gpIdx],
      wins: row[indexes.winsIdx],
      losses: row[indexes.lossesIdx],
      gb: row[indexes.gbIdx],
      winPct: row[indexes.pctIdx],
    });
  });

  CURRENT_TEAMS.forEach((team) => {
    if (!byTeam.has(team)) {
      byTeam.set(team, {
        team,
        gp: null,
        wins: null,
        losses: null,
        gb: null,
        winPct: null,
      });
    }
  });

  return Array.from(byTeam.values());
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
      const team = normalizeCurrentTeamName(row[teamIdx] || "");
      if (!team || team === "N/A" || !isStandingsTeamName(team)) {
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
        totalScore: null,
        transactions: 0,
      };
    })
    .filter((row) => row && row.team && row.team !== "N/A" && isStandingsTeamName(row.team));
}

function buildHistoryRowsFromCurrentStandings(rows) {
  const builtRows = [];
  const seenTeams = new Set();
  let indexes = null;

  (rows || []).forEach((row) => {
    const nextIndexes = getCurrentStandingsHeaderIndexes(row);
    if (nextIndexes) {
      indexes = nextIndexes;
      return;
    }
    if (!indexes) {
      return;
    }

    const team = normalizeCurrentTeamName(String(row[indexes.teamIdx] || "").trim());
    if (!team || team === "N/A" || !isStandingsTeamName(team)) {
      return;
    }

    builtRows.push({
      team,
      wins: parseNumber(row[indexes.winsIdx]),
      loss: parseNumber(row[indexes.lossesIdx]),
      winpct: parsePct(row[indexes.pctIdx]),
    });
    seenTeams.add(team);
  });

  CURRENT_TEAMS.forEach((team) => {
    if (!seenTeams.has(team)) {
      builtRows.push({ team, wins: null, loss: null, winpct: null });
    }
  });

  return builtRows;
}

function buildHistoryRowsFromTable(tableRows) {
  if (!tableRows || tableRows.length < 2) {
    return [];
  }
  const headers = (tableRows[0] || []).map((h) => String(h || "").trim().toLowerCase());
  const teamIdx = headers.findIndex((h) => h === "team");
  const winsIdx = headers.findIndex((h) => h === "wins" || h === "win");
  const lossIdx = headers.findIndex((h) => h === "losses" || h === "loss" || h === "l");
  const pctIdx = headers.findIndex((h) => h === "win %" || h === "win%" || h === "pct");
  if (teamIdx === -1 || winsIdx === -1 || lossIdx === -1) {
    return [];
  }
  return tableRows
    .slice(1)
    .map((row) => ({
      team: displayTeamName(row[teamIdx] || ""),
      wins: parseNumber(row[winsIdx]),
      loss: parseNumber(row[lossIdx]),
      winpct: pctIdx >= 0 ? parsePct(row[pctIdx]) : null,
    }))
    .filter((row) => row.team && isStandingsTeamName(row.team));
}

async function buildAllTimeLeagueStandings() {
  const seasonConfigs = getFranchiseSeasonConfigs();
  const settled = await Promise.allSettled(
    seasonConfigs.map((config) => fetch(config.url, { cache: "no-store" }))
  );
  const buckets = new Map();

  for (let index = 0; index < seasonConfigs.length; index += 1) {
    const config = seasonConfigs[index];
    const response = settled[index];
    if (response.status !== "fulfilled" || !response.value.ok) {
      continue;
    }
    const parsed = parseCSV(await response.value.text());
    const seasonRows =
      config.type === "current"
        ? buildHistoryRowsFromCurrentStandings(parsed)
        : config.type === "range"
        ? buildHistoryRowsFromTable(sliceRange(parsed, config.range))
        : buildHistoryRowsFromTable(parsed);

    seasonRows.forEach((row) => {
      const teamName = normalizeCurrentTeamName(row.team);
      if (!teamName || teamName === "N/A" || !isStandingsTeamName(teamName)) {
        return;
      }
      const franchiseKey = getFranchiseKey(teamName);
      if (!franchiseKey) {
        return;
      }
      const wins = parseNumber(row.wins);
      const loss = parseNumber(row.loss);
      if (!Number.isFinite(wins) || !Number.isFinite(loss)) {
        return;
      }
      const bucket = buckets.get(franchiseKey) || {
        team: CURRENT_FRANCHISE_NAMES.get(franchiseKey) || teamName,
        gp: 0,
        wins: 0,
        loss: 0,
        gb: null,
        winpct: null,
        sos: null,
        pam: null,
        trel: null,
        transactions: null,
      };
      bucket.gp += wins + loss;
      bucket.wins += wins;
      bucket.loss += loss;
      buckets.set(franchiseKey, bucket);
    });
  }

  return Array.from(buckets.values()).map((row) => ({
    ...row,
    winpct: row.gp ? row.wins / row.gp : null,
  }));
}

function applyTransactionCountsToLeagueRows(rows, counts) {
  rows.forEach((row) => {
    row.transactions = counts.get(normalizeTeamLabel(row.team)) || 0;
  });
}

function buildWinPctMapFromStandingsRows(standingsRows) {
  const map = new Map();
  getCurrentStandingsRows(standingsRows).forEach((row) => {
    const pct = parsePct(row.winPct);
    if (row.team && pct !== null) {
      map.set(row.team, pct);
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
  let totalScore = 0;
  let tRelWeighted = 0;
  let tRelWeight = 0;
  teamTotalsByDate.forEach((teamTotal, date) => {
    totalScore += teamTotal;
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
    totalScore,
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

function getCurrentPlayoffStatusOverride(team) {
  if (getSeasonRaw() !== "c2s3-regular" && getSeasonRaw() !== "c2s3-playoffs") {
    return null;
  }
  return CURRENT_PLAYOFF_STATUS_OVERRIDES.get(normalizeTeamLabel(team)) || null;
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
    let totalScore = 0;
    totals.forEach((teamTotal, date) => {
      totalScore += teamTotal;
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
      totalScore,
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

    if (seasonRaw === ALL_TIME_SEASON) {
      standingsHeaders = [];
      standingsRows = [];
      scheduleRowsForTiebreakers = [];
      transactionsByTeam = new Map();
      leagueStandingsMetrics = await buildAllTimeLeagueStandings();
      if (["gb", "sos", "pam", "trel", "transactions"].includes(requestedMetric)) {
        requestedMetric = "wins";
      }
      renderStandings();
    } else if (seasonRaw === "c2s3-regular" || seasonRaw === "c2s3-playoffs" || seasonRaw === "c2s2-playoffs") {
      const scheduleUrl =
        seasonRaw === "c2s3-playoffs"
          ? SCHEDULE_PLAYOFF_URL
          : seasonRaw === "c2s2-playoffs"
          ? C2S2_PLAYOFF_SCHEDULE_URL
          : SCHEDULE_CSV_URL;
      const [standingsRes, scheduleRes, playerStatsRes, transactionsRes] = await Promise.all([
        fetch(STANDINGS_CSV_URL, { cache: "no-store" }),
        fetch(scheduleUrl, { cache: "no-store" }),
        fetch(seasonRaw === "c2s3-playoffs" ? PLAYER_STATS_PLAYOFF_URL : PLAYER_STATS_URL, { cache: "no-store" }),
        fetch(TRANSACTIONS_URL, { cache: "no-store" }),
      ]);
      if (!standingsRes.ok || !scheduleRes.ok || !playerStatsRes.ok) {
        throw new Error(`Fetch failed: ${standingsRes.status || scheduleRes.status || playerStatsRes.status}`);
      }

      const standingsData = parseCSV(await standingsRes.text());
      const scheduleRows = getC2S2ScheduleRows(parseCSV(await scheduleRes.text()));
      scheduleRowsForTiebreakers = scheduleRows;
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
      if (seasonRaw === "c2s3-regular" || seasonRaw === "c2s3-playoffs") {
        leagueStandingsMetrics = buildPlayoffStatuses(leagueStandingsMetrics);
      }
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
      scheduleRowsForTiebreakers = scheduleTable;
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
      if (seasonRaw === "c2s2-regular") {
        leagueStandingsMetrics = buildPlayoffStatuses(leagueStandingsMetrics);
      }
      renderStandings();
    } else if (seasonRaw === "c1s2-regular" || seasonRaw === "c1s2-post") {
      const response = await fetch(C1S2_STANDINGS_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      const rows = parseCSV(await response.text());
      standingsHeaders = rows[0] || [];
      standingsRows = rows.slice(1);
      scheduleRowsForTiebreakers = [];
      transactionsByTeam = new Map();
      leagueStandingsMetrics = standingsRows.map((row) => ({
        team: String(row[1] || "").trim(),
        gp: (parseNumber(row[2]) || 0) + (parseNumber(row[3]) || 0),
        wins: parseNumber(row[2]),
        loss: parseNumber(row[3]),
        gb: parseNumber(row[4]),
        winpct: parsePct(row[5]),
        sos: null,
        pam: null,
        trel: null,
        transactions: 0,
      }));
      renderStandings();
    } else if (seasonRaw === "c1s6-regular" || seasonRaw === "c1s6-post") {
      const response = await fetch(C1S6_STANDINGS_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      const rows = parseCSV(await response.text());
      standingsHeaders = rows[0] || [];
      standingsRows = rows.slice(1);
      scheduleRowsForTiebreakers = [];
      transactionsByTeam = new Map();
      leagueStandingsMetrics = standingsRows.map((row) => ({
        team: String(row[1] || "").trim(),
        gp: (parseNumber(row[2]) || 0) + (parseNumber(row[3]) || 0),
        wins: parseNumber(row[2]),
        loss: parseNumber(row[3]),
        gb: parseNumber(row[4]),
        winpct: parsePct(row[5]),
        sos: null,
        pam: null,
        trel: null,
        transactions: 0,
      }));
      renderStandings();
    } else if (seasonRaw === "c1s5-regular" || seasonRaw === "c1s5-post") {
      const response = await fetch(C1S5_STANDINGS_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      const rows = parseCSV(await response.text());
      standingsHeaders = rows[0] || [];
      standingsRows = rows.slice(1);
      scheduleRowsForTiebreakers = [];
      transactionsByTeam = new Map();
      leagueStandingsMetrics = standingsRows.map((row) => ({
        team: String(row[1] || "").trim(),
        gp: (parseNumber(row[2]) || 0) + (parseNumber(row[3]) || 0),
        wins: parseNumber(row[2]),
        loss: parseNumber(row[3]),
        gb: parseNumber(row[4]),
        winpct: parsePct(row[5]),
        sos: null,
        pam: null,
        trel: null,
        transactions: 0,
      }));
      renderStandings();
    } else if (seasonRaw === "c1s3-regular" || seasonRaw === "c1s3-post") {
      const response = await fetch(C1S3_STANDINGS_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      const rows = parseCSV(await response.text());
      standingsHeaders = rows[0] || [];
      standingsRows = rows.slice(1);
      scheduleRowsForTiebreakers = [];
      transactionsByTeam = new Map();
      leagueStandingsMetrics = standingsRows.map((row) => ({
        team: String(row[1] || "").trim(),
        gp: (parseNumber(row[2]) || 0) + (parseNumber(row[3]) || 0),
        wins: parseNumber(row[2]),
        loss: parseNumber(row[3]),
        gb: parseNumber(row[4]),
        winpct: parsePct(row[5]),
        sos: null,
        pam: null,
        trel: null,
        transactions: 0,
      }));
      renderStandings();
    } else if (seasonRaw === "c1s4-regular" || seasonRaw === "c1s4-post") {
      const response = await fetch(C1S4_STANDINGS_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      const rows = parseCSV(await response.text());
      standingsHeaders = rows[0] || [];
      standingsRows = rows.slice(1);
      scheduleRowsForTiebreakers = [];
      transactionsByTeam = new Map();
      leagueStandingsMetrics = standingsRows.map((row) => ({
        team: String(row[1] || "").trim(),
        gp: (parseNumber(row[2]) || 0) + (parseNumber(row[3]) || 0),
        wins: parseNumber(row[2]),
        loss: parseNumber(row[3]),
        gb: parseNumber(row[4]),
        winpct: parsePct(row[5]),
        sos: null,
        pam: null,
        trel: null,
        transactions: 0,
      }));
      renderStandings();
    } else {
      const response = await fetch(ARCHIVE_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }

      const rows = parseCSV(await response.text());
      const standingsTable = sliceRange(rows, ARCHIVE_RANGES.standings);
      const scheduleTable = sliceRange(rows, "G31:I79");
      scheduleRowsForTiebreakers = scheduleTable;
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
initStandingsScope();
requestedMetric = getRequestedMetric();
loadStandings();
