const ROSTER_CSV_URL = "/api/sheet?name=roster";
const STANDINGS_CSV_URL = "/api/sheet?name=standings-dashboard";
const SCHEDULE_CSV_URL = "/api/sheet?name=schedule";
const BOXSCORE_CSV_URL = "/api/sheet?name=boxscore";
const LIVE_CSV_URL = "/api/sheet?name=live-scoring";
const PLAYER_STATS_URL = "/api/sheet?name=player-stats";
const ARCHIVE_URL = "/api/sheet?name=archive";
const C2S2_REGULAR_URL = "/api/sheet?name=c2s2-regular";
const C1S2_STANDINGS_URL = "/assets/data/c1s2-standings.csv";
const C1S2_REGULAR_SCHEDULE_URL = "/assets/data/c1s2-regular-schedule.csv";
const C1S2_POST_SCHEDULE_URL = "/assets/data/c1s2-post-schedule.csv";
const C1S2_ROSTERS_URL = "/assets/data/c1s2-rosters.csv";
const C1S2_PLAYER_STATS_URL = "/assets/data/c1s2-player-stats.csv";
const C1S6_STANDINGS_URL = "/assets/data/c1s6-standings.csv";
const C1S6_REGULAR_SCHEDULE_URL = "/assets/data/c1s6-regular-schedule.csv";
const C1S6_POST_SCHEDULE_URL = "/assets/data/c1s6-post-schedule.csv";
const C1S6_ROSTERS_URL = "/assets/data/c1s6-rosters.csv";
const C1S3_STANDINGS_URL = "/assets/data/c1s3-standings.csv";
const C1S3_REGULAR_SCHEDULE_URL = "/assets/data/c1s3-regular-schedule.csv";
const C1S3_POST_SCHEDULE_URL = "/assets/data/c1s3-post-schedule.csv";
const C1S3_ROSTERS_URL = "/assets/data/c1s3-rosters.csv";
const C1S3_PLAYER_STATS_URL = "/assets/data/c1s3-player-stats.csv";
const C1S5_STANDINGS_URL = "/assets/data/c1s5-standings.csv";
const C1S5_REGULAR_SCHEDULE_URL = "/assets/data/c1s5-regular-schedule.csv";
const C1S5_POST_SCHEDULE_URL = "/assets/data/c1s5-post-schedule.csv";
const C1S5_ROSTERS_URL = "/assets/data/c1s5-rosters.csv";
const C1S4_STANDINGS_URL = "/assets/data/c1s4-standings.csv";
const C1S4_REGULAR_SCHEDULE_URL = "/assets/data/c1s4-regular-schedule.csv";
const C1S4_POST_SCHEDULE_URL = "/assets/data/c1s4-post-schedule.csv";
const DRAFT_CAPITAL_URL = "/api/sheet?name=draft-capital";
const CONTRACTS_URL = "/api/sheet?name=contracts";
const SEASON_KEY = "season";
const TRANSACTIONS_URL = "/api/sheet?name=transactions";
const TEAM_CAP_LIMIT = 5000;
const TEAM_ORDER = [
  "Turkeys",
  "Gus N Em",
  "Storm",
  "Cheerios",
  "MayeDay",
  "Illegals",
  "The Lions",
  "Dream Team",
  "The Snipers",
  "The Phantoms",
];
const TRANSACTIONS_RANGE = "A3:E81";
const RETIREMENT_RANGE = "G3:J70";
const CUT_RANGE = "L3:O81";
const SIGNING_RANGE = "Q3:T81";
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

const ARCHIVE_RANGES = {
  standings: "A1:F7",
  teams: "H1:O27",
  player_stats: "A45:F117",
  schedule_regular: "G31:I79",
  schedule_post: "A31:D43",
  boxscore: "L31:R149",
};
const C2S2_SCHEDULE_RANGE = "A1:E82";
const C2S2_REGULAR_RANGES = {
  standings: "A59:F69",
  schedule: "A71:E170",
  boxscore: "K60:R1059",
  player_stats: "A151:G1150",
};
const LIVE_GAME_RANGES = [
  "A5:H12",
  "A14:H21",
  "A23:H30",
  "A32:H39",
  "A41:H48",
  "A50:H57",
  "A59:H66",
  "A68:H75",
  "A77:H84",
  "A86:H93",
  "A95:H102",
  "A104:H111",
  "A113:H120",
  "A122:H129",
  "A131:H138",
];
const LIVE_RIGHT_NAME_COL = 5;
const LIVE_RIGHT_POINTS_COL = 6;
const LIVE_RIGHT_RANK_COL = 7;

const ARCHIVE_TEAM_ROSTERS = {
  "Gus N Em": "H1:I12",
  Cheerios: "H16:I27",
  Bullets: "K1:L12",
  Storm: "K1:L12",
  Yetis: "K16:L27",
  Turkeys: "N1:O12",
  Illegals: "N16:O27",
};

const ARCHIVE_TEAM_STANDINGS = {
  Turkeys: "A2:F2",
  "Gus N Em": "A3:F3",
  Bullets: "A4:F4",
  Storm: "A4:F4",
  Cheerios: "A5:F5",
  Yetis: "A6:F6",
  Illegals: "A7:F7",
};

const DRAFT_CAPITAL_COLUMNS = {
  Turkeys: "A",
  "Gus N Em": "B",
  Bullets: "C",
  Storm: "C",
  Cheerios: "D",
  Yetis: "E",
  "The Lions": "F",
  "The Phantoms": "G",
  "The Future": "H",
  "The Snipers": "I",
  Illegals: "J",
};
const TEAM_STANDINGS_METRIC_KEY = "team_standings_metric";
const DEFAULT_SEASON = "c2s3-regular";
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

function normalizeSeasonValue(raw) {
  const key = String(raw || "").trim().toLowerCase();
  return SEASON_ALIASES[key] || DEFAULT_SEASON;
}

function getSeason() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("season");
  const raw = fromQuery || localStorage.getItem(SEASON_KEY) || DEFAULT_SEASON;
  return normalizeSeasonValue(raw);
}

function displayTeamName(value) {
  const name = String(value || "").trim();
  if (name === "Bullets") return "Storm";
  if (name === "Yetis") return "MayeDay";
  if (name === "The Future") return "Dream Team";
  if (name === "Avengers") return "Karma Avengers";
  if (name === "Currents") return "The Currents";
  if (name === "Bolts") return "The Bolts";
  if (name === "Doggy N em") return "Doggy N Em";
  if (name === "Wrangler") return "Wranglers";
  return name;
}

function parseMoney(value) {
  const amount = Number(String(value || "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function initSeasonSelect() {
  const select = document.getElementById("season-select");
  if (!select) {
    return;
  }
  const currentSeason = getSeason();
  select.value = currentSeason;
  localStorage.setItem(SEASON_KEY, currentSeason);
  select.addEventListener("change", () => {
    localStorage.setItem(SEASON_KEY, select.value);
    const params = new URLSearchParams(window.location.search);
    params.set("season", select.value);
    window.location.assign(`${window.location.pathname}?${params.toString()}`);
  });
}

const els = {
  title: document.getElementById("team-title"),
  sub: document.getElementById("team-sub"),
  lastUpdated: document.getElementById("last-updated"),
  logo: document.getElementById("team-logo"),
  head: document.querySelector("#roster-table thead"),
  body: document.querySelector("#roster-table tbody"),
  statGp: document.getElementById("stat-gp"),
  statWins: document.getElementById("stat-wins"),
  statLoss: document.getElementById("stat-loss"),
  statGb: document.getElementById("stat-gb"),
  statWinPct: document.getElementById("stat-winpct"),
  statSos: document.getElementById("stat-sos"),
  statPam: document.getElementById("stat-pam"),
  statTRel: document.getElementById("stat-trel"),
  statCapSpace: document.getElementById("stat-cap-space"),
  statTransactions: document.getElementById("stat-transactions"),
  statTeam: document.getElementById("stat-team"),
  standingsMetricSelect: document.getElementById("standings-metric-select"),
  standingsMetricLeader: document.getElementById("standings-metric-leader"),
  standingsStatBoxes: Array.from(document.querySelectorAll(".stat-box[data-metric]")),
  draftCapital: document.getElementById("team-draft-capital"),
  teamTransactions: document.getElementById("team-transactions"),
  scheduleHead: document.querySelector("#team-schedule thead"),
  scheduleBody: document.querySelector("#team-schedule tbody"),
  franchiseHistoryHead: document.querySelector("#franchise-history-table thead"),
  franchiseHistoryBody: document.querySelector("#franchise-history-table tbody"),
  historyTotalRecord: document.getElementById("history-total-record"),
  historyAvgWinPct: document.getElementById("history-avg-winpct"),
  modal: document.getElementById("boxscore-modal"),
  modalClose: document.querySelector(".modal-close"),
  boxDetails: document.getElementById("boxscore-details"),
};

const AUTO_REFRESH_MS = 60 * 1000;
let isTeamPageRefreshing = false;

let leagueStandingsMetrics = [];
let leagueTransactionCounts = new Map();

function updateTeamCapSpace(teamName, contractRows) {
  if (!els.statCapSpace) {
    return;
  }
  const shownTeam = displayTeamName(teamName);
  const usedCap = (contractRows || [])
    .slice(1)
    .reduce((sum, row) => {
      const rowTeam = displayTeamName(row[0] || "");
      if (rowTeam !== shownTeam) {
        return sum;
      }
      return sum + parseMoney(row[4]);
    }, 0);
  const remaining = Math.max(TEAM_CAP_LIMIT - usedCap, 0);
  els.statCapSpace.textContent = remaining.toLocaleString();
}

function getMetricOrder(metric) {
  return metric === "gb" || metric === "loss" ? "asc" : "desc";
}

function parseMetricValue(metric, value) {
  if (metric === "winpct") {
    return parsePct(value);
  }
  return parseNumber(value);
}

function getTeamLogoSrc(team) {
  const clean = displayTeamName(team);
  if (clean === "The Future" || clean === "Dream Team") return "/assets/dream-team.jpg";
  if (clean === "The Lions") return "/assets/the-lions.png";
  if (clean === "The Snipers") return "/assets/the-snipers.png";
  if (clean === "The Phantoms") return "/assets/the-phantoms.png";
  if (clean === "MayeDay") return "/assets/mayeday.jpg";
  if (clean === "Masdog N Em" || clean === "Richer N Em" || clean === "Doggy N Em") return "/assets/gus-n-em.png";
  if (clean === "Yetis") return "/assets/yetis.png";
  if (clean === "Gus N Em") return "/assets/gus-n-em.png";
  if (clean === "Cheerios") return "/assets/cheerios.png";
  if (clean === "Illegals") return "/assets/illegals.png";
  if (clean === "Storm" || clean === "Bullets") return "/assets/storm.png";
  if (clean === "Turkeys") return "/assets/turkeys.png";
  return "";
}

function getSelectedStandingsMetric() {
  const fallback = "wins";
  const raw = localStorage.getItem(TEAM_STANDINGS_METRIC_KEY) || fallback;
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
  return allowed.has(raw) ? raw : fallback;
}

function buildLeagueRowsFromC2S2(standingsRows, scheduleRows, playerRows) {
  const currentRows = getCurrentStandingsRows(standingsRows);
  const winPctMap = buildWinPctMapFromStandingsRows(standingsRows);
  return currentRows
    .map((row) => {
      const gp = parseNumber(row.gp);
      const advanced = computeAdvancedTeamStats(row.team, playerRows) || {};
      return {
        team: row.team,
        gp,
        wins: parseNumber(row.wins),
        loss: parseNumber(row.losses),
        gb: parseNumber(row.gb),
        winpct: parsePct(row.winPct),
        sos: computeTeamSOS(row.team, scheduleRows, winPctMap, "c2s2", gp),
        pam: typeof advanced.pam === "number" ? advanced.pam : null,
        trel: typeof advanced.tRel === "number" ? advanced.tRel : null,
        transactions: 0,
      };
    })
    .filter(Boolean);
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
    const team = displayTeamName(rawTeam);
    if (!team) return;
    if (!TEAM_ORDER.includes(team)) return;

    byTeam.set(team, {
      team,
      gp: row[indexes.gpIdx],
      wins: row[indexes.winsIdx],
      losses: row[indexes.lossesIdx],
      gb: row[indexes.gbIdx],
      winPct: row[indexes.pctIdx],
    });
  });

  return TEAM_ORDER.map((team) => byTeam.get(team)).filter(Boolean);
}

function buildLeagueRowsFromArchive(standingsTable, scheduleTable, season) {
  if (!standingsTable.length) {
    return [];
  }
  const headers = (standingsTable[0] || []).map((h) =>
    String(h || "").trim().toLowerCase()
  );
  const teamIdx = headers.findIndex((h) => h === "team");
  const gpIdx = headers.findIndex((h) => h === "gp");
  const winsIdx = headers.findIndex((h) => h === "wins");
  const lossIdx = headers.findIndex((h) => h === "loss" || h === "losses");
  const gbIdx = headers.findIndex((h) => h === "gb");
  const pctIdx = headers.findIndex(
    (h) => h === "win %" || h === "win%" || h === "pct"
  );
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
    .filter(Boolean);
}

function buildLeagueRowsFromC1S2(standingsRows) {
  if (!standingsRows || standingsRows.length < 2) {
    return [];
  }
  const headers = (standingsRows[0] || []).map((h) => String(h || "").trim().toLowerCase());
  const teamIdx = headers.findIndex((h) => h === "team");
  const winsIdx = headers.findIndex((h) => h === "wins" || h === "win");
  const lossIdx = headers.findIndex((h) => h === "losses" || h === "loss");
  const gbIdx = headers.findIndex((h) => h === "gb");
  const pctIdx = headers.findIndex((h) => h === "win %" || h === "win%" || h === "pct");
  if (teamIdx === -1 || winsIdx === -1 || lossIdx === -1 || gbIdx === -1 || pctIdx === -1) {
    return [];
  }

  return standingsRows
    .slice(1)
    .map((row) => {
      const team = displayTeamName(row[teamIdx] || "");
      const wins = parseNumber(row[winsIdx]);
      const loss = parseNumber(row[lossIdx]);
      return {
        team,
        gp: wins !== null && loss !== null ? wins + loss : null,
        wins,
        loss,
        gb: parseNumber(row[gbIdx]),
        winpct: parsePct(row[pctIdx]),
        sos: null,
        pam: null,
        trel: null,
        transactions: 0,
      };
    })
    .filter((row) => row.team);
}

function applyTransactionCountsToLeagueRows(rows, counts) {
  rows.forEach((row) => {
    const key = normalizeTeamLabel(row.team);
    row.transactions = counts.get(key) || 0;
  });
}

function renderLeagueMetricLeader() {
  if (!els.standingsMetricLeader || !els.standingsMetricSelect) {
    return;
  }
  if (!leagueStandingsMetrics.length) {
    els.standingsMetricLeader.textContent = "Leader: —";
    return;
  }
  const metric = els.standingsMetricSelect.value || "wins";
  const order = getMetricOrder(metric);
  const sorted = leagueStandingsMetrics
    .map((row) => ({ row, value: parseMetricValue(metric, row[metric]) }))
    .filter((entry) => entry.value !== null)
    .sort((a, b) => {
      if (order === "asc") {
        return a.value - b.value;
      }
      return b.value - a.value;
    });
  if (!sorted.length) {
    els.standingsMetricLeader.textContent = "Leader: —";
    return;
  }
  const leader = sorted[0];
  const shownTeam = displayTeamName(leader.row.team);
  const logoSrc = getTeamLogoSrc(shownTeam);
  const logoHtml = logoSrc
    ? `<img class="standings-logo" src="${logoSrc}" alt="${escapeHtml(
        shownTeam
      )} logo" />`
    : "";
  const valueText =
    metric === "winpct" || metric === "sos" || metric === "trel"
      ? Number(leader.value).toFixed(3)
      : Number(leader.value).toLocaleString();
  const label = els.standingsMetricSelect.options[
    els.standingsMetricSelect.selectedIndex
  ]?.textContent || metric;
  els.standingsMetricLeader.innerHTML = `Leader (${escapeHtml(
    label
  )}): <a class="tx-link tx-team-link" href="/team.html?team=${encodeURIComponent(
    shownTeam
  )}">${logoHtml}${escapeHtml(shownTeam)}</a> <strong>${escapeHtml(
    valueText
  )}</strong>`;
}

function initStandingsInteractions() {
  if (els.standingsMetricSelect) {
    els.standingsMetricSelect.value = getSelectedStandingsMetric();
    els.standingsMetricSelect.addEventListener("change", () => {
      localStorage.setItem(TEAM_STANDINGS_METRIC_KEY, els.standingsMetricSelect.value);
      renderLeagueMetricLeader();
    });
  }
  els.standingsStatBoxes.forEach((box) => {
    const metric = box.dataset.metric;
    if (!metric) {
      return;
    }
    box.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        return;
      }
      localStorage.setItem(TEAM_STANDINGS_METRIC_KEY, metric);
      if (els.standingsMetricSelect) {
        els.standingsMetricSelect.value = metric;
      }
      renderLeagueMetricLeader();
      window.location.href = `/standings.html?metric=${encodeURIComponent(metric)}`;
    });
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

function renderTable(headers, dataRows, teamName) {
  els.head.innerHTML = `
    <tr>
      ${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}
    </tr>
  `;

  const rows = dataRows.filter((row) => {
    const value = row[0] ?? "";
    const nameText = String(value).trim();
    return Boolean(nameText);
  });

  els.body.innerHTML = rows
    .map(
      (row) => `
        <tr>
          ${headers
            .map((_, i) => {
              const value = row[i] ?? "";
              if (i === 0 && value) {
                const nameText = String(value).trim();
                if (nameText.toUpperCase().startsWith("GM")) {
                  return `<td>${escapeHtml(nameText)}</td>`;
                }
                const link = `player-detail.html?player=${encodeURIComponent(
                  nameText
                )}`;
                return `<td><a class="roster-link" href="${link}">${escapeHtml(
                  nameText
                )}</a></td>`;
              }
              return `<td>${escapeHtml(value)}</td>`;
            })
            .join("")}
        </tr>
      `
    )
    .join("");
}

function renderRosterMessage(message) {
  els.head.innerHTML = "<tr><th>Player</th></tr>";
  els.body.innerHTML = `<tr><td>${escapeHtml(message)}</td></tr>`;
}

function renderRosterTableWithNotice(players, notice) {
  els.head.innerHTML = "<tr><th>Player</th></tr>";
  const noticeRow = notice
    ? `<tr><td><em>${escapeHtml(notice)}</em></td></tr>`
    : "";
  const playerRows = players
    .map((player) => {
      const nameText = String(player || "").trim();
      const link = `player-detail.html?player=${encodeURIComponent(nameText)}`;
      return `<tr><td><a class="roster-link" href="${link}">${escapeHtml(
        nameText
      )}</a></td></tr>`;
    })
    .join("");
  els.body.innerHTML = `${noticeRow}${playerRows}`;
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
  if (team === "Bolts" || team === "The Bolts") {
    return "turkeys-lineage";
  }
  if (team === "Turkeys") {
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
  if (team === "MayeDay" || team === "Yetis") {
    return "mayeday";
  }
  if (team === "Dream Team" || team === "The Future") {
    return "dream-team";
  }
  return normalizeTeamLabel(team);
}

function renderFranchiseHistoryMessage(message) {
  if (!els.franchiseHistoryHead || !els.franchiseHistoryBody) {
    return;
  }
  els.franchiseHistoryHead.innerHTML = "<tr><th>Season</th><th>Team</th><th>Record</th><th>Win %</th></tr>";
  els.franchiseHistoryBody.innerHTML = `<tr><td colspan="4">${escapeHtml(message)}</td></tr>`;
  if (els.historyTotalRecord) {
    els.historyTotalRecord.textContent = "—";
  }
  if (els.historyAvgWinPct) {
    els.historyAvgWinPct.textContent = "—";
  }
}

function renderFranchiseHistory(rows) {
  if (!els.franchiseHistoryHead || !els.franchiseHistoryBody) {
    return;
  }
  const activeRows = rows.filter(
    (row) =>
      row.isActive &&
      Number.isFinite(row.wins) &&
      Number.isFinite(row.loss) &&
      typeof row.winpctValue === "number"
  );
  const totalWins = activeRows.reduce((sum, row) => sum + row.wins, 0);
  const totalLosses = activeRows.reduce((sum, row) => sum + row.loss, 0);
  const avgWinPct = activeRows.length
    ? activeRows.reduce((sum, row) => sum + row.winpctValue, 0) / activeRows.length
    : null;
  if (els.historyTotalRecord) {
    els.historyTotalRecord.textContent = activeRows.length ? `${totalWins}-${totalLosses}` : "—";
  }
  if (els.historyAvgWinPct) {
    els.historyAvgWinPct.textContent =
      avgWinPct !== null ? avgWinPct.toFixed(3).replace(/^0/, ".") : "—";
  }
  els.franchiseHistoryHead.innerHTML = `
    <tr>
      <th>Season</th>
      <th>Team</th>
      <th>Record</th>
      <th>Win %</th>
    </tr>
  `;
  els.franchiseHistoryBody.innerHTML = rows
    .map(
      (row) => `
        <tr class="franchise-history-row${row.isActive ? " is-active" : " is-inactive"}">
          <td>${
            row.link
              ? `<a class="history-season-link" href="${row.link}">${escapeHtml(row.season || "—")}</a>`
              : escapeHtml(row.season || "—")
          }</td>
          <td>${
            row.link
              ? `<a class="history-team-link" href="${row.link}">${escapeHtml(row.team || "Not active")}</a>`
              : escapeHtml(row.team || "Not active")
          }</td>
          <td>${escapeHtml(row.record || "—")}</td>
          <td>${escapeHtml(row.winpct || "—")}</td>
        </tr>
      `
    )
    .join("");
}

function buildTeamPageHref(team, seasonKey) {
  const params = new URLSearchParams();
  params.set("team", displayTeamName(team));
  if (seasonKey) {
    params.set("season", normalizeSeasonValue(seasonKey));
  }
  return `/team.html?${params.toString()}`;
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
    if (!indexes) {
      return;
    }

    const team = displayTeamName(String(row[indexes.teamIdx] || "").trim());
    if (!team) {
      return;
    }

    builtRows.push({
      team,
      wins: parseNumber(row[indexes.winsIdx]),
      loss: parseNumber(row[indexes.lossesIdx]),
      winpct: parsePct(row[indexes.pctIdx]),
      league: "",
    });
  });

  return builtRows;
}

function buildHistoryRowsFromTable(tableRows) {
  if (!tableRows || tableRows.length < 2) {
    return [];
  }
  const headers = (tableRows[0] || []).map((h) => String(h || "").trim().toLowerCase());
  const leagueIdx = headers.findIndex((h) => h === "league" || h === "division");
  const teamIdx = headers.findIndex((h) => h === "team");
  const winsIdx = headers.findIndex((h) => h === "wins" || h === "win");
  const lossIdx = headers.findIndex((h) => h === "losses" || h === "loss" || h === "l");
  const pctIdx = headers.findIndex((h) => h === "win %" || h === "win%" || h === "pct");
  if (teamIdx === -1 || winsIdx === -1 || lossIdx === -1) {
    return [];
  }
  return tableRows.slice(1).map((row) => ({
    team: displayTeamName(row[teamIdx] || ""),
    wins: parseNumber(row[winsIdx]),
    loss: parseNumber(row[lossIdx]),
    winpct: pctIdx >= 0 ? parsePct(row[pctIdx]) : null,
    league: leagueIdx >= 0 ? String(row[leagueIdx] || "").trim() : "",
  }));
}

async function loadFranchiseHistory(teamName) {
  const franchiseKey = getFranchiseKey(teamName);
  const seasonConfigs = [
    { label: "C2S3", key: "c2s3-regular", type: "current", url: STANDINGS_CSV_URL },
    { label: "C2S2", key: "c2s2-regular", type: "range", url: C2S2_REGULAR_URL, range: C2S2_REGULAR_RANGES.standings },
    { label: "C2S1", key: "c2s1-regular", type: "range", url: ARCHIVE_URL, range: ARCHIVE_RANGES.standings },
    { label: "C1S6", key: "c1s6-regular", type: "csv", url: C1S6_STANDINGS_URL },
    { label: "C1S5", key: "c1s5-regular", type: "csv", url: C1S5_STANDINGS_URL },
    { label: "C1S4", key: "c1s4-regular", type: "csv", url: C1S4_STANDINGS_URL },
    { label: "C1S3", key: "c1s3-regular", type: "csv", url: C1S3_STANDINGS_URL },
    { label: "C1S2", key: "c1s2-regular", type: "csv", url: C1S2_STANDINGS_URL },
  ];

  const settled = await Promise.allSettled(
    seasonConfigs.map((config) => fetch(config.url, { cache: "no-store" }))
  );

  const seasonRows = await Promise.all(
    seasonConfigs.map(async (config, index) => {
      const response = settled[index];
      if (response.status !== "fulfilled" || !response.value.ok) {
        return {
          season: config.label,
          seasonKey: config.key,
          team: "Not active",
          record: "—",
          winpct: "—",
          wins: null,
          loss: null,
          winpctValue: null,
          link: "",
          isActive: false,
        };
      }

      const parsed = parseCSV(await response.value.text());
      const candidateRows =
        config.type === "current"
          ? buildHistoryRowsFromCurrentStandings(parsed)
          : config.type === "range"
          ? buildHistoryRowsFromTable(sliceRange(parsed, config.range))
          : buildHistoryRowsFromTable(parsed);
      const match = candidateRows.find((row) => getFranchiseKey(row.team) === franchiseKey);
      if (!match) {
        return {
          season: config.label,
          seasonKey: config.key,
          team: "Not active",
          record: "—",
          winpct: "—",
          wins: null,
          loss: null,
          winpctValue: null,
          link: "",
          isActive: false,
        };
      }

      return {
        season: config.label,
        seasonKey: config.key,
        team: displayTeamName(match.team),
        wins: match.wins,
        loss: match.loss,
        record:
          match.wins !== null && match.loss !== null ? `${match.wins}-${match.loss}` : "—",
        winpctValue: typeof match.winpct === "number" ? match.winpct : null,
        winpct:
          typeof match.winpct === "number" ? match.winpct.toFixed(3).replace(/^0/, ".") : "—",
        link: buildTeamPageHref(match.team, config.key),
        isActive: true,
      };
    })
  );

  renderFranchiseHistory(seasonRows);
}

function renderSchedule(headers, dataRows) {
  const visibleCols = headers
    .map((h, index) => ({ h, index }))
    .filter(({ h }) => !String(h || "").toLowerCase().includes("info"));
  const visibleHeaders = visibleCols.map((c) => c.h);

  els.scheduleHead.innerHTML = `
    <tr>
      ${visibleHeaders.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}
    </tr>
  `;

  els.scheduleBody.innerHTML = dataRows
    .map((row, index) => {
      const scoreState = getScheduleScoreState(row);
      return `
        <tr class="schedule-row" data-index="${index}">
          ${visibleCols
            .map(({ h: header, index: i }) => {
              const value = row[i] ?? "";
              const headerLabel = String(header || "").toLowerCase();
              const isTeamCol = String(header || "")
                .toLowerCase()
                .includes("team");
              const isTypeCol = headerLabel.includes("type");
              const shown = displayTeamName(value);
              const logo = getTeamLogo(shown);
              const logoHtml = logo
                ? `<img class="standings-logo" src="${logo}" alt="${escapeHtml(
                    shown
                  )} logo" />`
                : "";
              if (isTeamCol && String(value).trim()) {
                const teamScore =
                  i === scheduleIndexes.team1
                    ? scoreState.team1Score
                    : i === scheduleIndexes.team2
                    ? scoreState.team2Score
                    : "";
                const scoreLine = teamScore
                  ? `<span class="team-score-line ${scoreState.status}">${
                      scoreState.status === "live"
                        ? '<span class="live-pulse-dot"></span>'
                        : ""
                    }${getOutcomeForTeam(
                      scoreState,
                      i === scheduleIndexes.team1 ? 1 : 2
                    )}${escapeHtml(teamScore)}</span>`
                  : "";
                return `<td><a class="roster-link schedule-team-link" href="/team.html?team=${encodeURIComponent(
                  shown
                )}">${logoHtml}<span class="team-name-stack"><span>${escapeHtml(
                  shown
                )}</span>${scoreLine}</span></a></td>`;
              }
              if (isTypeCol && String(value).trim()) {
                const typeRaw = String(value).trim();
                const typeLower = typeRaw.toLowerCase();
                const typeClass = typeLower.includes("pre")
                  ? "preseason"
                  : typeLower.includes("regular")
                  ? "regular"
                  : "other";
                const typeLabel = typeLower.includes("pre")
                  ? "Pre-Season"
                  : typeLower.includes("regular")
                  ? "Regular Season"
                  : typeRaw;
                const statusLine =
                  scoreState.status === "live"
                    ? '<span class="row-state live"><span class="live-pulse-dot"></span>Live</span>'
                    : scoreState.status === "final"
                    ? '<span class="row-state final"><span class="final-check">✓</span>Final</span>'
                    : '<span class="row-state upcoming">Upcoming</span>';
                return `<td><div class="type-cell"><span class="game-type-badge game-type-${typeClass}">${escapeHtml(
                  typeLabel
                )}</span>${statusLine}</div></td>`;
              }
              return `<td>${escapeHtml(value)}</td>`;
            })
            .join("")}
        </tr>
        <tr class="schedule-detail-row" data-detail-index="${index}" hidden>
          <td colspan="${visibleHeaders.length}">
            <div class="schedule-detail-box"></div>
          </td>
        </tr>
      `;
    })
    .join("");
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

function getTeamName() {
  const params = new URLSearchParams(window.location.search);
  const team = params.get("team") || "";
  if (team === "Dream Team") return "The Future";
  if (team === "MayeDay") return "Yetis";
  if (team === "Storm") return "Bullets";
  return team;
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

function stripCaptainMarker(value) {
  return String(value || "")
    .replace(/\s*\(c\)\s*$/i, "")
    .replace(/\s+c\s*$/i, "")
    .trim();
}

function isCaptainMarked(value) {
  const text = String(value || "").trim();
  return /\(c\)\s*$/i.test(text) || /\sc\s*$/i.test(text);
}

function detectPlayerColumns(headerRow) {
  const columns = {
    date: 0,
    team: 1,
    player: 2,
    score: 3,
    rank: 4,
    opponent: 5,
  };
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
  const rankIdx = pickByIncludes(["rank"]);
  const opponentIdx = pickByIncludes(["opponent", "opp"]);

  if (dateIdx !== -1) columns.date = dateIdx;
  if (teamIdx !== -1) columns.team = teamIdx;
  if (playerIdx !== -1) columns.player = playerIdx;
  if (scoreIdx !== -1) columns.score = scoreIdx;
  if (rankIdx !== -1) columns.rank = rankIdx;
  if (opponentIdx !== -1) columns.opponent = opponentIdx;

  return columns;
}

function parseAdjustedScore(row, columns) {
  const base = parseNumber(row[columns.score]);
  if (base === null) {
    return null;
  }
  const playerCell = row[columns.player];
  return isCaptainMarked(playerCell) ? base - 0.5 : base;
}

function updateAdvancedTeamStats(values) {
  if (els.statPam) {
    els.statPam.textContent =
      values && Number.isFinite(values.pam) ? values.pam.toFixed(2) : "—";
  }
  if (els.statTRel) {
    els.statTRel.textContent =
      values && Number.isFinite(values.tRel) ? values.tRel.toFixed(3) : "—";
  }
}

function clearAdvancedTeamStats() {
  updateAdvancedTeamStats(null);
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
    const totals = Array.from(teamTotals.values()).filter((v) =>
      Number.isFinite(v)
    );
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
  let pctSum = 0;
  let pctGames = 0;
  teamTotalsByDate.forEach((teamTotal, date) => {
    const med = teamMedianByDate.get(date);
    if (!med || med <= 0) {
      return;
    }
    pam += teamTotal - med;
    pctSum += (teamTotal - med) / med;
    pctGames += 1;
  });

  let tRelWeighted = 0;
  let tRelWeight = 0;
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
    apPam: pctGames ? pctSum / pctGames : null,
    tRel: tRelWeight ? tRelWeighted / tRelWeight : null,
  };
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
  const pctIdx = headers.findIndex(
    (h) => h === "win %" || h === "win%" || h === "pct"
  );
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

function computeTeamSOS(teamName, scheduleRows, winPctMap, season, gpLimit = null) {
  if (!teamName || !scheduleRows.length || !winPctMap.size) {
    return null;
  }
  const headers = scheduleRows[0] || [];
  const idx = getScheduleIndexes(headers, season);
  const gameTypeIdx = headers.findIndex((h) =>
    String(h || "").toLowerCase().includes("type")
  );
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

  const limitedRows =
    Number.isFinite(gpLimit) && gpLimit >= 0
      ? dataRows.slice(0, gpLimit)
      : dataRows;

  let sum = 0;
  let games = 0;
  limitedRows.forEach(({ row }) => {
    if (gameTypeIdx >= 0) {
      const gameType = String(row[gameTypeIdx] || "").toLowerCase();
      if (gameType.includes("pre")) {
        return;
      }
    }
    const team1 = String(row[idx.team1] || "").trim();
    const team2 = String(row[idx.team2] || "").trim();
    if (!team1 || !team2) {
      return;
    }
    const opponent =
      teamMatches(team1, teamName)
        ? team2
        : teamMatches(team2, teamName)
        ? team1
        : "";
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

function getTeamGpFromStandingsRows(teamName, standingsRows) {
  const target = normalizeTeamLabel(teamName);
  const row = getCurrentStandingsRows(standingsRows).find(
    (entry) => normalizeTeamLabel(entry.team) === target
  );
  return row ? parseNumber(row.gp) : null;
}

function hasText(row) {
  return row.some((cell) => String(cell || "").trim() !== "");
}

function normalizePickLabel(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/\bfirst\b/g, "1st")
    .replace(/\bsecond\b/g, "2nd")
    .replace(/\bthird\b/g, "3rd")
    .replace(/\bfourth\b/g, "4th")
    .replace(/\bfifth\b/g, "5th")
    .replace(/\bsixth\b/g, "6th")
    .replace(/\bseventh\b/g, "7th")
    .replace(/\beighth\b/g, "8th")
    .replace(/[|,;:/\\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getPickMatchTargets(pickLabel) {
  const base = normalizePickLabel(pickLabel);
  if (!base) {
    return [];
  }
  const targets = new Set([base]);
  const hasOrigin = /\b(via|from)\b/i.test(base);
  if (!hasOrigin) {
    // For picks without origin in the label, keep only the direct label.
    // This prevents matching "C2S3 3rd via X" against plain "C2S3 3rd".
    targets.add(base);
  }

  return Array.from(targets).filter(Boolean);
}

function pickRoundToNumber(roundText) {
  const text = String(roundText || "").toLowerCase();
  if (text.includes("1st")) return 1;
  if (text.includes("2nd")) return 2;
  if (text.includes("3rd")) return 3;
  if (text.includes("4th")) return 4;
  if (text.includes("5th")) return 5;
  if (text.includes("6th")) return 6;
  if (text.includes("7th")) return 7;
  if (text.includes("8th")) return 8;
  return null;
}

function parsePickMeta(pickLabel) {
  const label = String(pickLabel || "").trim();
  const roundMatch = label.match(/\b([1-8](?:st|nd|rd|th))\b/i);
  const viaMatch = label.match(/\b(?:via|from)\s+(.+)$/i);
  return {
    round: roundMatch ? pickRoundToNumber(roundMatch[1]) : null,
    viaTeam: viaMatch ? normalizeTeamLabel(viaMatch[1]) : "",
  };
}

function transactionIncludesTeamContext(row, teamCandidates) {
  if (!teamCandidates || !teamCandidates.length) {
    return false;
  }
  const rowTeam1 = normalizeTeamLabel(row[1] || "");
  const rowTeam2 = normalizeTeamLabel(row[3] || "");
  const rowText = normalizePickLabel(
    row
      .map((cell) => String(cell || "").trim())
      .filter(Boolean)
      .join(" ")
  );
  return teamCandidates.some((team) => {
    const normalized = normalizeTeamLabel(team);
    if (!normalized) {
      return false;
    }
    return (
      rowTeam1 === normalized ||
      rowTeam2 === normalized ||
      rowText.includes(normalized)
    );
  });
}

function extractOverallNumbers(text) {
  const source = String(text || "");
  const matches = [...source.matchAll(/#\s*(\d+)\s*overall/gi)];
  return matches.map((m) => Number(m[1])).filter((n) => Number.isFinite(n));
}

function formatTradeSummaryForPick(row, pick) {
  const date = String(row[0] || "").trim() || "Date —";
  const team1 = displayTeamName(String(row[1] || "").trim() || "Team 1");
  const team2 = displayTeamName(String(row[3] || "").trim() || "Team 2");
  return `${date}: ${team1} ↔ ${team2}`;
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

function parseTeamTradeRow(row) {
  return {
    date: String(row[0] || "").trim() || "—",
    type: "Trade",
    team1: displayTeamName(String(row[1] || "").trim() || "Team 1"),
    team1Gets: String(row[2] || "").trim() || "—",
    team2: displayTeamName(String(row[3] || "").trim() || "Team 2"),
    team2Gets: String(row[4] || "").trim() || "—",
  };
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
    date: parsed.date || "—",
    type: "Retirement",
    team: displayTeamName(parsed.team || mergedTeamCell || ""),
    player: String(row[0] || row[1] || "").trim() || "—",
    note: "",
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
    date: parsed.date || "—",
    type: "Cut",
    team: displayTeamName(parsed.team || mergedTeamCell || ""),
    player,
    note: "",
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
    date: parsed.date || "—",
    type: "Signing",
    team: displayTeamName(parsed.team || mergedTeamCell || ""),
    player,
    note: "",
  };
}

function computeLeagueTransactionCounts(allRows) {
  const counts = new Map();
  const bump = (team) => {
    const key = normalizeTeamLabel(team);
    if (!key) {
      return;
    }
    counts.set(key, (counts.get(key) || 0) + 1);
  };

  sliceRange(allRows, TRANSACTIONS_RANGE)
    .filter(hasText)
    .map(parseTeamTradeRow)
    .forEach((tx) => {
      bump(tx.team1);
      bump(tx.team2);
    });

  sliceRange(allRows, RETIREMENT_RANGE)
    .filter(hasText)
    .map(parseTeamRetirementRow)
    .forEach((tx) => {
      bump(tx.team);
    });
  sliceRange(allRows, CUT_RANGE)
    .filter(hasText)
    .map(parseTeamCutRow)
    .filter(Boolean)
    .forEach((tx) => {
      bump(tx.team);
    });
  sliceRange(allRows, SIGNING_RANGE)
    .filter(hasText)
    .map(parseTeamSigningRow)
    .filter(Boolean)
    .forEach((tx) => {
      bump(tx.team);
    });

  return counts;
}

function linkifyPlayers(text) {
  const source = String(text || "");
  const parts = source.split(/(@[A-Za-z0-9_.]+)/g);
  return parts
    .map((part) => {
      if (/^@[A-Za-z0-9_.]+$/.test(part)) {
        return `<a class="tx-link" href="/player-detail.html?player=${encodeURIComponent(
          part
        )}">${escapeHtml(part)}</a>`;
      }
      return escapeHtml(part);
    })
    .join("");
}

function getTeamLogo(team) {
  const clean = displayTeamName(team);
  if (clean === "The Future" || clean === "Dream Team") return "/assets/dream-team.jpg";
  if (clean === "The Lions") return "/assets/the-lions.png";
  if (clean === "The Snipers") return "/assets/the-snipers.png";
  if (clean === "The Phantoms") return "/assets/the-phantoms.png";
  if (clean === "MayeDay") return "/assets/mayeday.jpg";
  if (clean === "Masdog N Em" || clean === "Richer N Em") return "/assets/gus-n-em.png";
  if (clean === "Yetis") return "/assets/yetis.png";
  if (clean === "Gus N Em") return "/assets/gus-n-em.png";
  if (clean === "Cheerios") return "/assets/cheerios.png";
  if (clean === "Illegals") return "/assets/illegals.png";
  if (clean === "Storm" || clean === "Bullets") return "/assets/storm.png";
  if (clean === "Turkeys") return "/assets/turkeys.png";
  return "";
}

function renderTeamHeader(team) {
  const clean = displayTeamName(team);
  if (!clean) {
    return "<span class=\"muted\">—</span>";
  }
  const logo = getTeamLogo(clean);
  const logoHtml = logo
    ? `<img class="standings-logo" src="${logo}" alt="${escapeHtml(clean)} logo" />`
    : "";
  return `<a class="tx-link tx-team-link" href="/team.html?team=${encodeURIComponent(
    clean
  )}">${logoHtml}${escapeHtml(clean)}</a>`;
}

function loadTeamTransactionsPanel(teamName, allRows) {
  if (!els.teamTransactions) {
    return;
  }
  const normalizedTeam = normalizeTeamLabel(teamName);
  const trades = sliceRange(allRows, TRANSACTIONS_RANGE)
    .filter(hasText)
    .map(parseTeamTradeRow)
    .filter(
      (tx) =>
        normalizeTeamLabel(tx.team1) === normalizedTeam ||
        normalizeTeamLabel(tx.team2) === normalizedTeam
    );
  const retirements = sliceRange(allRows, RETIREMENT_RANGE)
    .filter(hasText)
    .map(parseTeamRetirementRow)
    .filter((tx) => normalizeTeamLabel(tx.team) === normalizedTeam);
  const cuts = sliceRange(allRows, CUT_RANGE)
    .filter(hasText)
    .map(parseTeamCutRow)
    .filter(Boolean)
    .filter((tx) => normalizeTeamLabel(tx.team) === normalizedTeam);
  const signings = sliceRange(allRows, SIGNING_RANGE)
    .filter(hasText)
    .map(parseTeamSigningRow)
    .filter(Boolean)
    .filter((tx) => normalizeTeamLabel(tx.team) === normalizedTeam);
  const merged = [...trades, ...retirements, ...cuts, ...signings]
    .map((tx, idx) => ({ ...tx, _idx: idx }))
    .sort((a, b) => {
      const dateDiff = parseDateValue(b.date) - parseDateValue(a.date);
      if (dateDiff !== 0) {
        return dateDiff;
      }
      return b._idx - a._idx;
    });

  const link = "/transactions.html";
  if (els.statTransactions) {
    els.statTransactions.innerHTML = `<a class="tx-link" href="${link}">${merged.length}</a>`;
  }

  if (!merged.length) {
    els.teamTransactions.innerHTML =
      '<div class="tx-card"><div class="tx-details">No transactions recorded.</div></div>';
    return;
  }

  els.teamTransactions.innerHTML = merged
    .map((tx) => {
      if (tx.type === "Retirement" || tx.type === "Cut" || tx.type === "Signing") {
        return `
          <article class="tx-card">
            <div class="tx-head">
              <strong>${escapeHtml(tx.type)}</strong>
              <span>${escapeHtml(tx.date)}</span>
            </div>
            <div class="tx-sides">
              <div class="tx-side tx-side-full">
                <div class="tx-details tx-sentence">${
                  tx.type === "Cut"
                    ? `<span class="tx-part">${renderTeamHeader(tx.team)}</span><span class="tx-verb">cuts</span><span class="tx-part">${linkifyPlayers(
                        tx.player || "—"
                      )}</span>`
                    : tx.type === "Signing"
                    ? `<span class="tx-part">${renderTeamHeader(tx.team)}</span><span class="tx-verb">signs</span><span class="tx-part">${linkifyPlayers(
                        tx.player || "—"
                      )}</span>`
                    : `<span class="tx-part">${linkifyPlayers(
                        tx.player || "—"
                      )}</span><span class="tx-verb">retires from</span><span class="tx-part">${renderTeamHeader(
                        tx.team
                      )}</span>`
                }</div>
              </div>
            </div>
          </article>
        `;
      }
      return `
        <article class="tx-card">
          <div class="tx-head">
            <strong>Trade</strong>
            <span>${escapeHtml(tx.date)}</span>
          </div>
          <div class="tx-details">${escapeHtml(tx.team1)} receive ${escapeHtml(
            tx.team1Gets
          )} | ${escapeHtml(tx.team2)} receive ${escapeHtml(tx.team2Gets)}</div>
        </article>
      `;
    })
    .join("");
}

function findTradeEntriesForPick(pick, transactionRows) {
  const label = String(pick && pick.label ? pick.label : "").trim();
  const targets = getPickMatchTargets(label);
  if (!targets.length) {
    return [];
  }
  const found = new Map();
  const meta = parsePickMeta(label);
  const baseNoOrigin = normalizePickLabel(label).replace(/\s+\b(via|from)\b\s+.+$/i, "").trim();
  const originalTeam = normalizeTeamLabel(pick && pick.original_team);
  const currentTeam = normalizeTeamLabel(pick && pick.current_team);
  const teamCandidates = Array.from(
    new Set(
      [currentTeam, originalTeam, meta.viaTeam]
        .map((v) => normalizeTeamLabel(v))
        .filter(Boolean)
    )
  );

  for (const row of transactionRows) {
    const joined = row
      .map((cell) => String(cell || "").trim())
      .filter(Boolean)
      .join(" | ");
    if (!joined) {
      continue;
    }
    const teamContextMatch = transactionIncludesTeamContext(row, teamCandidates);
    if (!teamContextMatch) {
      continue;
    }
    const normalizedRow = normalizePickLabel(joined);
    let directMatch = false;
    if (meta.viaTeam) {
      const hasExactOrigin = targets.some((target) => normalizedRow.includes(target));
      const hasBasePick = baseNoOrigin ? normalizedRow.includes(baseNoOrigin) : false;
      const hasViaContext = normalizedRow.includes(meta.viaTeam);
      const hasCurrentContext = currentTeam ? normalizedRow.includes(currentTeam) : true;
      directMatch = hasExactOrigin || (hasBasePick && hasViaContext && hasCurrentContext);
    } else {
      directMatch = targets.some((target) => {
        if (!normalizedRow.includes(target)) {
          return false;
        }
        // If this pick has no origin qualifier, do not match rows that explicitly
        // reference an origin for the same base pick.
        const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const originPattern = new RegExp(`${escaped}\\s+(via|from)\\s+`, "i");
        return !originPattern.test(normalizedRow);
      });
    }

    if (directMatch) {
      if (!found.has(joined)) {
        found.set(joined, {
          query: joined,
          summary: formatTradeSummaryForPick(row, pick),
        });
      }
    }
  }
  return Array.from(found.values());
}

async function loadDraftCapital(teamName) {
  if (!els.draftCapital) {
    return;
  }
  if (!teamName) {
    els.draftCapital.innerHTML = "<div class=\"gm-empty\">No picks found.</div>";
    return;
  }
  try {
    const [capitalRes, txRes] = await Promise.all([
      fetch(DRAFT_CAPITAL_URL, { cache: "no-store" }),
      fetch(TRANSACTIONS_URL, { cache: "no-store" }),
    ]);
    if (!capitalRes.ok) {
      throw new Error(`Fetch failed: ${capitalRes.status}`);
    }
    const capitalRows = parseCSV(await capitalRes.text());
    const txRows = txRes.ok
      ? sliceRange(parseCSV(await txRes.text()), TRANSACTIONS_RANGE).filter(hasText)
      : [];

    const column = DRAFT_CAPITAL_COLUMNS[teamName];
    if (!column) {
      els.draftCapital.innerHTML = "<div class=\"gm-empty\">No picks found.</div>";
      return;
    }
    const colIndex = colToIndex(column);
    const picks = capitalRows
      .map((row) => String((row && row[colIndex]) || "").trim())
      .filter((value) => value && value !== displayTeamName(teamName));

    if (!picks.length) {
      els.draftCapital.innerHTML = "<div class=\"gm-empty\">No picks found.</div>";
      return;
    }
    const parsedPicks = picks.map((label) => {
      const meta = parsePickMeta(label);
      const base = normalizePickLabel(label).replace(/\s+\b(via|from)\b\s+.+$/i, "").trim();
      return {
        label,
        meta,
        base,
      };
    });
    const viaBaseSet = new Set(parsedPicks.filter((p) => p.meta.viaTeam).map((p) => p.base));

    els.draftCapital.innerHTML = parsedPicks
      .map(({ label, meta, base }) => {
        const pickMeta = {
          label,
          current_team: teamName,
          original_team: meta.viaTeam ? displayTeamName(meta.viaTeam) : teamName,
        };
        const suppressAmbiguousBase = !meta.viaTeam && viaBaseSet.has(base);
        const tradeEntries = suppressAmbiguousBase
          ? []
          : findTradeEntriesForPick(pickMeta, txRows);
        const tradeLine = tradeEntries.length
          ? `<div class="draft-pick-trade">Trade: ${tradeEntries
              .map(
                (entry) =>
                  `<a class="draft-pick-trade-link" href="/transactions.html?q=${encodeURIComponent(
                    entry.query
                  )}" target="_self">${escapeHtml(entry.summary)}</a>`
              )
              .join(", ")}</div>`
          : `<div class="draft-pick-trade">No trades involving this pick.</div>`;
        return `<div class="draft-pick-row">${escapeHtml(label)}${tradeLine}</div>`;
      })
      .join("");
  } catch (error) {
    els.draftCapital.innerHTML =
      "<div class=\"gm-empty\">Unable to load picks.</div>";
  }
}

async function loadRoster() {
  if (isTeamPageRefreshing) {
    return;
  }
  isTeamPageRefreshing = true;
  const teamName = getTeamName();
  if (els.statTransactions) {
    els.statTransactions.textContent = "—";
  }
  if (els.statCapSpace) {
    els.statCapSpace.textContent = "—";
  }
  if (els.teamTransactions) {
    els.teamTransactions.innerHTML =
      '<div class="tx-card"><div class="tx-details">Loading transactions...</div></div>';
  }
  await loadDraftCapital(teamName);
  if (els.logo) {
    const shownTeam = displayTeamName(teamName);
    const logoSrc = getTeamLogoSrc(teamName);
    if (logoSrc) {
      els.logo.src = logoSrc;
      els.logo.alt = `${shownTeam} logo`;
      els.logo.style.display = "block";
    } else {
      els.logo.style.display = "none";
    }
  }
  els.title.textContent = teamName
    ? `${displayTeamName(teamName)} Roster`
    : "Team Roster";
  if (els.sub) {
    els.sub.textContent = teamName
      ? displayTeamName(teamName)
      : "Missing team name.";
  }
  renderFranchiseHistoryMessage("Loading franchise history...");
  loadFranchiseHistory(teamName).catch(() => {
    renderFranchiseHistoryMessage("Unable to load franchise history.");
  });

  try {
    const season = getSeason();
    if (season === "c2s3-regular" || season === "c2s2-playoffs") {
      const [rosterRes, standingsRes, scheduleRes, boxscoreRes, playerStatsRes, liveRes] = await Promise.all([
        fetch(ROSTER_CSV_URL, { cache: "no-store" }),
        fetch(STANDINGS_CSV_URL, { cache: "no-store" }),
        fetch(SCHEDULE_CSV_URL, { cache: "no-store" }),
        fetch(BOXSCORE_CSV_URL, { cache: "no-store" }),
        fetch(PLAYER_STATS_URL, { cache: "no-store" }),
        fetch(LIVE_CSV_URL, { cache: "no-store" }),
      ]);

      if (!rosterRes.ok) {
        throw new Error(`Fetch failed: ${rosterRes.status}`);
      }
      if (!standingsRes.ok) {
        throw new Error(`Fetch failed: ${standingsRes.status}`);
      }
      if (!scheduleRes.ok) {
        throw new Error(`Fetch failed: ${scheduleRes.status}`);
      }
      if (!boxscoreRes.ok) {
        throw new Error(`Fetch failed: ${boxscoreRes.status}`);
      }
      if (!playerStatsRes.ok) {
        throw new Error(`Fetch failed: ${playerStatsRes.status}`);
      }

      const rows = parseCSV(await rosterRes.text());
      if (!rows.length) {
        throw new Error("No data found.");
      }

      const range = TEAM_RANGES[teamName];
      if (!range) {
        throw new Error("Team roster range not found.");
      }

      const sliced = sliceRange(rows, range);
      if (!sliced.length) {
        throw new Error("No roster data in that range.");
      }

      renderTable(sliced[0], sliced.slice(1), teamName);
      const standingsRows = parseCSV(await standingsRes.text());
      const scheduleRows = getC2S2ScheduleRows(
        parseCSV(await scheduleRes.text())
      );
      const playerStatRows = parseCSV(await playerStatsRes.text());
      teamLeadersMap = computeTeamLeaders(playerStatRows);
      leagueStandingsMetrics = buildLeagueRowsFromC2S2(
        standingsRows,
        scheduleRows,
        playerStatRows
      );
      applyTransactionCountsToLeagueRows(
        leagueStandingsMetrics,
        leagueTransactionCounts
      );
      renderLeagueMetricLeader();
      updateStandingsFromRanges(teamName, standingsRows);
      const winPctMap = buildWinPctMapFromStandingsRows(standingsRows);
      const teamGp = getTeamGpFromStandingsRows(teamName, standingsRows);
      const sos = computeTeamSOS(teamName, scheduleRows, winPctMap, "c2s2", teamGp);
      if (els.statSos) {
        els.statSos.textContent = sos !== null ? sos.toFixed(3) : "—";
      }
      const boxScoreData = parseCSV(await boxscoreRes.text());
      const liveRows = liveRes.ok ? parseCSV(await liveRes.text()) : [];
      liveScoreMap = buildLiveScoreMap(liveRows);
      updateTeamSchedule(
        teamName,
        scheduleRows,
        boxScoreData,
        "c2s2"
      );
      updateAdvancedTeamStats(computeAdvancedTeamStats(teamName, playerStatRows));
    } else if (season === "c2s2-regular") {
      const [regularRes] = await Promise.all([
        fetch(C2S2_REGULAR_URL, { cache: "no-store" }),
      ]);
      if (!regularRes.ok) {
        throw new Error(`Fetch failed: ${regularRes.status}`);
      }
      const rows = parseCSV(await regularRes.text());
      const range = TEAM_RANGES[teamName];
      if (!range) {
        throw new Error("Team roster range not found.");
      }
      const sliced = sliceRange(rows, range);
      if (!sliced.length) {
        throw new Error("No roster data in that range.");
      }
      renderTable(sliced[0], sliced.slice(1), teamName);

      const regularRows = rows;
      const standingsTable = sliceRange(regularRows, C2S2_REGULAR_RANGES.standings);
      const scheduleRows = getC2S2ScheduleRows(
        regularRows,
        C2S2_REGULAR_RANGES.schedule
      );
      const boxScoreData = sliceRange(regularRows, C2S2_REGULAR_RANGES.boxscore);
      const playerStatRows = sliceRange(regularRows, C2S2_REGULAR_RANGES.player_stats);

      teamLeadersMap = computeTeamLeaders(playerStatRows);
      leagueStandingsMetrics = buildLeagueRowsFromArchive(
        standingsTable,
        scheduleRows,
        "c2s2-regular"
      );
      applyTransactionCountsToLeagueRows(
        leagueStandingsMetrics,
        leagueTransactionCounts
      );
      renderLeagueMetricLeader();

      const standingRow = findStandingsRowByTeam(teamName, standingsTable);
      updateStandingsFromRow(standingRow || []);
      const winPctMap = buildWinPctMapFromStandingsTable(standingsTable);
      const teamGp = standingRow ? parseNumber(standingRow[1]) : null;
      const sos = computeTeamSOS(
        teamName,
        scheduleRows,
        winPctMap,
        "c2s2-regular",
        teamGp
      );
      if (els.statSos) {
        els.statSos.textContent = sos !== null ? sos.toFixed(3) : "—";
      }
      liveScoreMap = new Map();
      updateTeamSchedule(teamName, scheduleRows, boxScoreData, "c2s2-regular");
      updateAdvancedTeamStats(computeAdvancedTeamStats(teamName, playerStatRows));
    } else if (season === "c1s2-regular" || season === "c1s2-post") {
      const [standingsRes, scheduleRes, rosterRes, playerStatsRes] = await Promise.all([
        fetch(C1S2_STANDINGS_URL, { cache: "no-store" }),
        fetch(
          season === "c1s2-post" ? C1S2_POST_SCHEDULE_URL : C1S2_REGULAR_SCHEDULE_URL,
          { cache: "no-store" }
        ),
        fetch(C1S2_ROSTERS_URL, { cache: "no-store" }),
        fetch(C1S2_PLAYER_STATS_URL, { cache: "no-store" }),
      ]);
      if (!standingsRes.ok) {
        throw new Error(`Fetch failed: ${standingsRes.status}`);
      }
      if (!scheduleRes.ok) {
        throw new Error(`Fetch failed: ${scheduleRes.status}`);
      }
      if (!rosterRes.ok) {
        throw new Error(`Fetch failed: ${rosterRes.status}`);
      }
      if (!playerStatsRes.ok) {
        throw new Error(`Fetch failed: ${playerStatsRes.status}`);
      }

      const standingsRows = parseCSV(await standingsRes.text());
      const scheduleRows = parseCSV(await scheduleRes.text());
      const rosterRows = parseCSV(await rosterRes.text());
      const playerStatRows = parseCSV(await playerStatsRes.text());
      const shownTeam = displayTeamName(teamName);
      const rosterPlayers = rosterRows
        .slice(1)
        .filter((row) => displayTeamName(row[0] || "") === shownTeam)
        .map((row) => String(row[1] || "").trim())
        .filter(Boolean);

      renderRosterTableWithNotice(
        rosterPlayers,
        "Partial C1S2 data only. Some stats were not recorded."
      );
      if (els.sub) {
        els.sub.textContent = `${shownTeam} • partial C1S2 stats`;
      }

      leagueStandingsMetrics = buildLeagueRowsFromC1S2(standingsRows);
      applyTransactionCountsToLeagueRows(
        leagueStandingsMetrics,
        leagueTransactionCounts
      );
      renderLeagueMetricLeader();
      updateStandingsFromC1S2(teamName, standingsRows);
      clearAdvancedTeamStats();
      liveScoreMap = new Map();
      boxScoreRows = [];
      finalScoreMap = new Map();
      teamLeadersMap = new Map();
      updateTeamSchedule(teamName, scheduleRows, [], season);
      updateAdvancedTeamStats(computeAdvancedTeamStats(teamName, playerStatRows));
    } else if (season === "c1s6-regular" || season === "c1s6-post") {
      const [standingsRes, scheduleRes, rosterRes] = await Promise.all([
        fetch(C1S6_STANDINGS_URL, { cache: "no-store" }),
        fetch(
          season === "c1s6-post" ? C1S6_POST_SCHEDULE_URL : C1S6_REGULAR_SCHEDULE_URL,
          { cache: "no-store" }
        ),
        fetch(C1S6_ROSTERS_URL, { cache: "no-store" }),
      ]);
      if (!standingsRes.ok) {
        throw new Error(`Fetch failed: ${standingsRes.status}`);
      }
      if (!scheduleRes.ok) {
        throw new Error(`Fetch failed: ${scheduleRes.status}`);
      }
      if (!rosterRes.ok) {
        throw new Error(`Fetch failed: ${rosterRes.status}`);
      }

      const standingsRows = parseCSV(await standingsRes.text());
      const scheduleRows = parseCSV(await scheduleRes.text());
      const rosterRows = parseCSV(await rosterRes.text());
      const shownTeam = displayTeamName(teamName);
      const rosterPlayers = rosterRows
        .slice(1)
        .filter((row) => displayTeamName(row[0] || "") === shownTeam)
        .map((row) => String(row[1] || "").trim())
        .filter(Boolean);

      renderRosterTableWithNotice(
        rosterPlayers,
        "Partial C1S6 archive data only. Some stats were not recorded."
      );
      if (els.sub) {
        els.sub.textContent = `${shownTeam} • partial C1S6 archive`;
      }

      leagueStandingsMetrics = buildLeagueRowsFromC1S2(standingsRows);
      applyTransactionCountsToLeagueRows(
        leagueStandingsMetrics,
        leagueTransactionCounts
      );
      renderLeagueMetricLeader();
      updateStandingsFromC1S2(teamName, standingsRows);
      clearAdvancedTeamStats();
      liveScoreMap = new Map();
      boxScoreRows = [];
      finalScoreMap = new Map();
      teamLeadersMap = new Map();
      updateTeamSchedule(teamName, scheduleRows, [], season);
    } else if (season === "c1s5-regular" || season === "c1s5-post") {
      const [standingsRes, scheduleRes, rosterRes] = await Promise.all([
        fetch(C1S5_STANDINGS_URL, { cache: "no-store" }),
        fetch(
          season === "c1s5-post" ? C1S5_POST_SCHEDULE_URL : C1S5_REGULAR_SCHEDULE_URL,
          { cache: "no-store" }
        ),
        fetch(C1S5_ROSTERS_URL, { cache: "no-store" }),
      ]);
      if (!standingsRes.ok) {
        throw new Error(`Fetch failed: ${standingsRes.status}`);
      }
      if (!scheduleRes.ok) {
        throw new Error(`Fetch failed: ${scheduleRes.status}`);
      }
      if (!rosterRes.ok) {
        throw new Error(`Fetch failed: ${rosterRes.status}`);
      }

      const standingsRows = parseCSV(await standingsRes.text());
      const scheduleRows = parseCSV(await scheduleRes.text());
      const rosterRows = parseCSV(await rosterRes.text());
      const shownTeam = displayTeamName(teamName);
      const rosterPlayers = rosterRows
        .slice(1)
        .filter((row) => displayTeamName(row[0] || "") === shownTeam)
        .map((row) => String(row[1] || "").trim())
        .filter(Boolean);

      renderRosterTableWithNotice(
        rosterPlayers,
        "Partial C1S5 archive data only. Some stats were not recorded."
      );
      if (els.sub) {
        els.sub.textContent = `${shownTeam} • partial C1S5 archive`;
      }

      leagueStandingsMetrics = buildLeagueRowsFromC1S2(standingsRows);
      applyTransactionCountsToLeagueRows(
        leagueStandingsMetrics,
        leagueTransactionCounts
      );
      renderLeagueMetricLeader();
      updateStandingsFromC1S2(teamName, standingsRows);
      clearAdvancedTeamStats();
      liveScoreMap = new Map();
      boxScoreRows = [];
      finalScoreMap = new Map();
      teamLeadersMap = new Map();
      updateTeamSchedule(teamName, scheduleRows, [], season);
    } else if (season === "c1s4-regular" || season === "c1s4-post") {
      const [standingsRes, scheduleRes] = await Promise.all([
        fetch(C1S4_STANDINGS_URL, { cache: "no-store" }),
        fetch(
          season === "c1s4-post" ? C1S4_POST_SCHEDULE_URL : C1S4_REGULAR_SCHEDULE_URL,
          { cache: "no-store" }
        ),
      ]);
      if (!standingsRes.ok) {
        throw new Error(`Fetch failed: ${standingsRes.status}`);
      }
      if (!scheduleRes.ok) {
        throw new Error(`Fetch failed: ${scheduleRes.status}`);
      }

      const standingsRows = parseCSV(await standingsRes.text());
      const scheduleRows = parseCSV(await scheduleRes.text());

      renderRosterMessage("No roster data available for Chapter 1 S4.");
      if (els.sub) {
        els.sub.textContent = `${displayTeamName(teamName)} • Chapter 1 S4 archive`;
      }

      leagueStandingsMetrics = buildLeagueRowsFromC1S2(standingsRows);
      applyTransactionCountsToLeagueRows(
        leagueStandingsMetrics,
        leagueTransactionCounts
      );
      renderLeagueMetricLeader();
      updateStandingsFromC1S2(teamName, standingsRows);
      clearAdvancedTeamStats();
      liveScoreMap = new Map();
      boxScoreRows = [];
      finalScoreMap = new Map();
      teamLeadersMap = new Map();
      updateTeamSchedule(teamName, scheduleRows, [], season);
    } else if (season === "c1s3-regular" || season === "c1s3-post") {
      const [standingsRes, scheduleRes, rosterRes, playerStatsRes] = await Promise.all([
        fetch(C1S3_STANDINGS_URL, { cache: "no-store" }),
        fetch(
          season === "c1s3-post" ? C1S3_POST_SCHEDULE_URL : C1S3_REGULAR_SCHEDULE_URL,
          { cache: "no-store" }
        ),
        fetch(C1S3_ROSTERS_URL, { cache: "no-store" }),
        fetch(C1S3_PLAYER_STATS_URL, { cache: "no-store" }),
      ]);
      if (!standingsRes.ok) {
        throw new Error(`Fetch failed: ${standingsRes.status}`);
      }
      if (!scheduleRes.ok) {
        throw new Error(`Fetch failed: ${scheduleRes.status}`);
      }
      if (!rosterRes.ok) {
        throw new Error(`Fetch failed: ${rosterRes.status}`);
      }
      if (!playerStatsRes.ok) {
        throw new Error(`Fetch failed: ${playerStatsRes.status}`);
      }

      const standingsRows = parseCSV(await standingsRes.text());
      const scheduleRows = parseCSV(await scheduleRes.text());
      const rosterRows = parseCSV(await rosterRes.text());
      const playerStatRows = parseCSV(await playerStatsRes.text());
      const shownTeam = displayTeamName(teamName);
      const rosterPlayers = rosterRows
        .slice(1)
        .filter((row) => displayTeamName(row[0] || "") === shownTeam)
        .map((row) => String(row[1] || "").trim())
        .filter(Boolean);

      renderRosterTableWithNotice(
        rosterPlayers,
        "Partial C1S3 data only. Some stats were not recorded."
      );
      if (els.sub) {
        els.sub.textContent = `${shownTeam} • partial C1S3 stats`;
      }

      leagueStandingsMetrics = buildLeagueRowsFromC1S2(standingsRows);
      applyTransactionCountsToLeagueRows(
        leagueStandingsMetrics,
        leagueTransactionCounts
      );
      renderLeagueMetricLeader();
      updateStandingsFromC1S2(teamName, standingsRows);
      clearAdvancedTeamStats();
      liveScoreMap = new Map();
      boxScoreRows = [];
      finalScoreMap = new Map();
      teamLeadersMap = new Map();
      updateTeamSchedule(teamName, scheduleRows, [], season);
      updateAdvancedTeamStats(computeAdvancedTeamStats(teamName, playerStatRows));
    } else {
      const [archiveRes] = await Promise.all([
        fetch(ARCHIVE_URL, { cache: "no-store" }),
      ]);
      if (!archiveRes.ok) {
        throw new Error(`Fetch failed: ${archiveRes.status}`);
      }
      const archive = parseCSV(await archiveRes.text());
      const standingsTable = sliceRange(archive, ARCHIVE_RANGES.standings);
      const archivePlayerRows = sliceRange(archive, ARCHIVE_RANGES.player_stats);
      const scheduleRange =
        season === "c2s1-post"
          ? ARCHIVE_RANGES.schedule_post
          : ARCHIVE_RANGES.schedule_regular;
      const scheduleTable = sliceRange(archive, scheduleRange);
      const boxscoreTable = sliceRange(archive, ARCHIVE_RANGES.boxscore);

      const rosterRange = ARCHIVE_TEAM_ROSTERS[teamName];
      let rosterRows = rosterRange ? sliceRange(archive, rosterRange) : [];
      if (rosterRows.length) {
        rosterRows = rosterRows
          .filter((row) => String(row[0] || "").trim() !== teamName)
          .map((row) => [row[0], ""]);
      }
      renderTable(["Player"], rosterRows.map((row) => [row[0]]), teamName);

      const standingsRange = ARCHIVE_TEAM_STANDINGS[teamName];
      const standingsRow = standingsRange
        ? sliceRange(archive, standingsRange)[0]
        : null;
      leagueStandingsMetrics = buildLeagueRowsFromArchive(
        standingsTable,
        scheduleTable,
        season
      );
      applyTransactionCountsToLeagueRows(
        leagueStandingsMetrics,
        leagueTransactionCounts
      );
      renderLeagueMetricLeader();
      updateStandingsFromRow(standingsRow || []);
      const archiveWinPctMap = buildWinPctMapFromStandingsTable(standingsTable);
      const archiveGp = standingsRow ? parseNumber(standingsRow[1]) : null;
      const archiveSos = computeTeamSOS(
        teamName,
        scheduleTable,
        archiveWinPctMap,
        season,
        archiveGp
      );
      if (els.statSos) {
        els.statSos.textContent =
          archiveSos !== null ? archiveSos.toFixed(3) : "—";
      }
      if (els.statSos) {
        if (els.statSos.textContent.trim() === "") {
          els.statSos.textContent = "—";
        }
      }
      liveScoreMap = new Map();
      updateTeamSchedule(teamName, scheduleTable, boxscoreTable, season);
      if (season === "c2s1-post") {
        updateAdvancedTeamStats(
          computeAdvancedTeamStats(teamName, archivePlayerRows)
        );
      } else {
        clearAdvancedTeamStats();
      }
      teamLeadersMap = new Map();
    }
    updateLastUpdated();
    try {
      const txRes = await fetch(TRANSACTIONS_URL, { cache: "no-store" });
      if (txRes.ok) {
        const txRows = parseCSV(await txRes.text());
        loadTeamTransactionsPanel(teamName, txRows);
        leagueTransactionCounts = computeLeagueTransactionCounts(txRows);
        applyTransactionCountsToLeagueRows(
          leagueStandingsMetrics,
          leagueTransactionCounts
        );
        renderLeagueMetricLeader();
      } else {
        if (els.teamTransactions) {
          els.teamTransactions.innerHTML =
            '<div class="tx-card"><div class="tx-details">Unable to load transactions.</div></div>';
        }
      }
    } catch (error) {
      if (els.teamTransactions) {
        els.teamTransactions.innerHTML =
          '<div class="tx-card"><div class="tx-details">Unable to load transactions.</div></div>';
      }
    }
    try {
      const contractsRes = await fetch(CONTRACTS_URL, { cache: "no-store" });
      if (contractsRes.ok) {
        updateTeamCapSpace(teamName, parseCSV(await contractsRes.text()));
      }
    } catch (error) {
      if (els.statCapSpace) {
        els.statCapSpace.textContent = "—";
      }
    }
  } catch (error) {
    els.body.innerHTML = `<tr><td>${escapeHtml(error.message)}</td></tr>`;
  } finally {
    isTeamPageRefreshing = false;
  }
}

function updateStandingsFromRanges(teamName, standingsRows) {
  const target = normalizeTeamLabel(teamName);
  const row = getCurrentStandingsRows(standingsRows).find(
    (entry) => normalizeTeamLabel(entry.team) === target
  );
  if (!row) {
    return;
  }

  els.statTeam.textContent = displayTeamName(row.team || teamName || "—");
  els.statGp.textContent = row.gp || "—";
  els.statWins.textContent = row.wins || "—";
  els.statLoss.textContent = row.losses || "—";
  els.statGb.textContent = row.gb || "—";
  els.statWinPct.textContent = row.winPct || "—";
  if (els.statSos) {
    els.statSos.textContent = "—";
  }
}

function updateStandingsFromC1S2(teamName, standingsRows) {
  if (!standingsRows || standingsRows.length < 2) {
    return;
  }
  const headers = (standingsRows[0] || []).map((h) => String(h || "").trim().toLowerCase());
  const teamIdx = headers.findIndex((h) => h === "team");
  const winsIdx = headers.findIndex((h) => h === "wins" || h === "win");
  const lossIdx = headers.findIndex((h) => h === "losses" || h === "loss");
  const gbIdx = headers.findIndex((h) => h === "gb");
  const pctIdx = headers.findIndex((h) => h === "win %" || h === "win%" || h === "pct");
  if (teamIdx === -1 || winsIdx === -1 || lossIdx === -1 || gbIdx === -1 || pctIdx === -1) {
    return;
  }
  const target = normalizeTeamLabel(teamName);
  const row = standingsRows
    .slice(1)
    .find((entry) => normalizeTeamLabel(entry[teamIdx]) === target);
  if (!row) {
    return;
  }

  const wins = parseNumber(row[winsIdx]);
  const loss = parseNumber(row[lossIdx]);
  const gp = wins !== null && loss !== null ? wins + loss : null;

  els.statTeam.textContent = displayTeamName(row[teamIdx] || teamName || "—");
  els.statGp.textContent = gp !== null ? String(gp) : "—";
  els.statWins.textContent = wins !== null ? String(wins) : "—";
  els.statLoss.textContent = loss !== null ? String(loss) : "—";
  els.statGb.textContent = row[gbIdx] || "—";
  els.statWinPct.textContent = row[pctIdx] || "—";
  if (els.statSos) {
    els.statSos.textContent = "—";
  }
}

function updateStandingsFromRow(values) {
  if (!values || !values.length) {
    return;
  }
  const [team, gp, wins, loss, gb, winPct] = values;
  els.statTeam.textContent = displayTeamName(team || "—");
  els.statGp.textContent = gp || "—";
  els.statWins.textContent = wins || "—";
  els.statLoss.textContent = loss || "—";
  els.statGb.textContent = gb || "—";
  els.statWinPct.textContent = winPct || "—";
  if (els.statSos) {
    els.statSos.textContent = "—";
  }
}

let teamScheduleRows = [];
let boxScoreRows = [];
let scheduleIndexes = { date: 0, team1: 1, team2: 2 };
let liveScoreMap = new Map();
let finalScoreMap = new Map();
let teamLeadersMap = new Map();
let leagueScheduleGames = [];

function normalizeTeamLabel(value) {
  const normalized = displayTeamName(String(value || ""))
    .replace(/\([^)]*\)/g, "")
    .replace(/\*/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  return normalized;
}

function normalizeDateToken(value) {
  const text = String(value || "").trim();
  const match = text.match(/(\d{1,2}\/\d{1,2})(?:\/\d{2,4})?/);
  return match ? match[1] : "";
}

function buildGameKey(dateToken, team1, team2) {
  return `${normalizeDateToken(dateToken)}|${normalizeTeamLabel(team1)}|${normalizeTeamLabel(team2)}`;
}

function isPlayerLabelRow(left, right) {
  return String(left || "").trim().toLowerCase() === "player" &&
    String(right || "").trim().toLowerCase() === "player";
}

function parseTeamHeader(value) {
  const text = String(value || "").trim();
  if (!text) {
    return { name: "", score: "" };
  }
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

function isPlayerCell(value) {
  return normalizePlayerCell(value).startsWith("@");
}

function isCaptainCell(value) {
  const raw = String(value || "").trim();
  return /\s+\(?c\)?$/i.test(raw);
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

function extractLeagueDay(rows) {
  const row = rows.find(
    (r) =>
      String(r[0] || "").includes("League Day") ||
      String(r[1] || "").includes("League Day")
  );
  if (!row) {
    return "";
  }
  const raw = String(row[0] || row[1] || "");
  const parts = raw.split(":");
  return normalizeDateToken(parts.length > 1 ? parts[1].trim() : raw.trim());
}

function buildLiveScoreMap(rows) {
  const map = new Map();
  if (!rows.length) {
    return map;
  }
  const day = extractLeagueDay(rows);
  if (!day) {
    return map;
  }

  const startIndex = rows.findIndex(
    (row) =>
      String(row[0] || "").includes("League Day") ||
      String(row[1] || "").includes("League Day")
  );
  const dataRows = rows.slice(startIndex >= 0 ? startIndex + 1 : 0);

  const looksLikeHeader = (left, right) =>
    left &&
    right &&
    !isPlayerCell(left) &&
    !isPlayerCell(right) &&
    (/\(\s*-?\d+\s*\)/.test(left) || /\(\s*-?\d+\s*\)/.test(right));

  const games = [];
  let current = null;
  dataRows.forEach((row) => {
    const left = String(row[0] || "").trim();
    const right = String(row[LIVE_RIGHT_NAME_COL] || "").trim();
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
    const right = String(header[LIVE_RIGHT_NAME_COL] || "").trim();
    const team1 = parseTeamHeader(left);
    const team2 = parseTeamHeader(right);
    if (!team1.name || !team2.name) {
      return;
    }

    const team1Players = game.players
      .filter((r) => isPlayerCell(r[0]))
      .map((r) => buildPlayerEntry(r[0], r[1], r[2]));
    const team2Players = game.players
      .filter((r) => isPlayerCell(r[LIVE_RIGHT_NAME_COL]))
      .map((r) =>
        buildPlayerEntry(
          r[LIVE_RIGHT_NAME_COL],
          r[LIVE_RIGHT_POINTS_COL],
          r[LIVE_RIGHT_RANK_COL]
        )
      );

    map.set(buildGameKey(day, team1.name, team2.name), {
      status: "live",
      team1Score: team1.score || "",
      team2Score: team2.score || "",
      team1Header: left,
      team2Header: right,
      team1Players,
      team2Players,
    });
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
    const right = String(row[LIVE_RIGHT_NAME_COL] || "").trim();
    if (!day || !left || !right) continue;
    if (left.startsWith("@") || right.startsWith("@")) continue;
    const t1 = parseTeamHeader(left);
    const t2 = parseTeamHeader(right);
    if (!t1.name || !t2.name || t1.score === "" || t2.score === "") continue;
    map.set(buildGameKey(day, t1.name, t2.name), {
      team1Score: t1.score,
      team2Score: t2.score,
    });
    map.set(buildGameKey(day, t2.name, t1.name), {
      team1Score: t2.score,
      team2Score: t1.score,
    });
  }
  return map;
}

function parseDateObj(token) {
  const m = String(token || "").match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;
  const d = new Date(new Date().getFullYear(), Number(m[1]) - 1, Number(m[2]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function computeTeamLeaders(playerRows) {
  const map = new Map();
  if (!playerRows.length) return map;
  const data = playerRows.slice(1);
  const byDate = new Map();
  data.forEach((row) => {
    const date = String(row[0] || "").trim();
    const key = (date.match(/(\d{1,2}\/\d{1,2})/) || [])[1];
    const score = parseNumber(row[3]);
    if (!key || score === null) return;
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key).push(score);
  });
  const medByDate = new Map();
  byDate.forEach((scores, k) => {
    const s = [...scores].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    medByDate.set(k, s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2);
  });
  const agg = new Map();
  data.forEach((row) => {
    const team = displayTeamName(String(row[1] || "").trim());
    const player = String(row[2] || "").trim();
    const date = (String(row[0] || "").match(/(\d{1,2}\/\d{1,2})/) || [])[1];
    const score = parseNumber(row[3]);
    if (!team || !player || !date || score === null) return;
    const med = medByDate.get(date) || 0;
    const rel = med > 0 ? score / med : 0;
    const war = med > 0 ? (score - 0.9 * med) / (0.92 * med) : 0;
    const key = `${team}|${player}`;
    const cur = agg.get(key) || { team, player, gp: 0, total: 0, rel: 0, war: 0 };
    cur.gp += 1;
    cur.total += score;
    cur.rel += rel;
    cur.war += war;
    agg.set(key, cur);
  });
  const teamBuckets = new Map();
  agg.forEach((v) => {
    const item = {
      player: v.player,
      avg: v.gp ? v.total / v.gp : 0,
      rel: v.gp ? v.rel / v.gp : 0,
      war: v.war,
    };
    if (!teamBuckets.has(v.team)) teamBuckets.set(v.team, []);
    teamBuckets.get(v.team).push(item);
  });
  teamBuckets.forEach((arr, team) => {
    map.set(team, {
      topAvg: [...arr].sort((a, b) => b.avg - a.avg)[0] || null,
      topRel: [...arr].sort((a, b) => b.rel - a.rel)[0] || null,
      topWar: [...arr].sort((a, b) => b.war - a.war)[0] || null,
    });
  });
  return map;
}

function getScheduleScoreState(scheduleRow) {
  const dateToken = normalizeDateToken(scheduleRow[scheduleIndexes.date]);
  const team1 = String(scheduleRow[scheduleIndexes.team1] || "").trim();
  const team2 = String(scheduleRow[scheduleIndexes.team2] || "").trim();
  const live = liveScoreMap.get(buildGameKey(dateToken, team1, team2));
  if (live) {
    return {
      status: "live",
      team1Score: live.team1Score || "",
      team2Score: live.team2Score || "",
      livePayload: live,
    };
  }

  const final = finalScoreMap.get(buildGameKey(dateToken, team1, team2));
  if (final && (final.team1Score || final.team2Score)) {
    return {
      status: "final",
      team1Score: final.team1Score || "",
      team2Score: final.team2Score || "",
    };
  }
  const payload = buildBoxScore(getTeamName(), scheduleRow, getSeason());
  if (payload) {
    const p1 = parseTeamHeader(payload.team1Name);
    const p2 = parseTeamHeader(payload.team2Name);
    if (p1.score !== "" && p2.score !== "") {
      return {
        status: "final",
        team1Score: p1.score,
        team2Score: p2.score,
      };
    }
  }
  return { status: "upcoming", team1Score: "", team2Score: "" };
}

function buildLiveBoxMarkup(scoreState, scheduleRow) {
  const payload = scoreState && scoreState.livePayload ? scoreState.livePayload : null;
  if (!payload) {
    return '<div class="boxscore-empty">No live stats available.</div>';
  }

  const renderTeam = (header, players) => {
    const parsed = parseTeamHeader(header);
    const team = parsed.name || "";
    const logoSrc = getTeamLogo(team);
    const logoHtml = logoSrc
      ? `<img class="standings-logo" src="${logoSrc}" alt="${escapeHtml(team)} logo" />`
      : "";
    const teamLink = `/team.html?team=${encodeURIComponent(team)}`;
    const headerLine = `<a class="boxscore-team" href="${teamLink}">${logoHtml}<span>${escapeHtml(
      team || header
    )}</span></a>`;
    const rows = (players || [])
      .map(
        (p) => `<div class="boxscore-row">
            <a class="boxscore-link" href="/player-detail.html?player=${encodeURIComponent(
              String(p.player || "").trim()
            )}">${escapeHtml(formatPlayerDisplay(p))}</a>
            <span>${escapeHtml(p.points || "")}</span>
            <span>${escapeHtml(p.rank || "")}</span>
          </div>`
      )
      .join("");
    return `<div class="boxscore-table">
      ${headerLine}
      <div class="boxscore-row"><span>Player</span><span>Points</span><span>Rank</span></div>
      ${rows || '<div class="boxscore-empty">No stats available.</div>'}
    </div>`;
  };

  const dateLabel = String(scheduleRow[scheduleIndexes.date] || "").trim();
  return `
    <div class="boxscore-meta">League Day: ${escapeHtml(dateLabel)}</div>
    <div class="boxscore-card">${renderTeam(payload.team1Header, payload.team1Players)}</div>
    <div class="boxscore-card">${renderTeam(payload.team2Header, payload.team2Players)}</div>
  `;
}

function parseNumericScore(value) {
  const num = Number(String(value || "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(num) ? num : null;
}

function getOutcomeForTeam(scoreState, teamIndex) {
  if (!scoreState || scoreState.status !== "final") {
    return "";
  }
  const s1 = parseNumericScore(scoreState.team1Score);
  const s2 = parseNumericScore(scoreState.team2Score);
  if (s1 === null || s2 === null || s1 === s2) {
    return "";
  }
  const isWin = teamIndex === 1 ? s1 > s2 : s2 > s1;
  return isWin
    ? '<span class="outcome-mark win">✓</span>'
    : '<span class="outcome-mark loss">✕</span>';
}

function teamMatches(value, teamName) {
  const a = normalizeTeamLabel(value);
  const b = normalizeTeamLabel(teamName);
  if (!a || !b) {
    return false;
  }
  return a === b || a.includes(b) || b.includes(a);
}

function getScheduleIndexes(headers, season) {
  const lower = headers.map((h) => String(h || "").trim().toLowerCase());
  const findIdx = (checks) =>
    lower.findIndex((h) => checks.some((check) => h.includes(check)));

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

function getC2S2ScheduleRows(rows, range = C2S2_SCHEDULE_RANGE) {
  const sliced = sliceRange(rows, range);
  return [["Date", "Team 1", "Team 2", "Info", "Game Type"], ...sliced];
}

function findStandingsRowByTeam(teamName, standingsTable) {
  if (!standingsTable || standingsTable.length < 2) {
    return null;
  }
  const teamKey = normalizeTeamLabel(teamName);
  for (const row of standingsTable.slice(1)) {
    if (normalizeTeamLabel(row[0]) === teamKey) {
      return row;
    }
  }
  return null;
}

function updateTeamSchedule(teamName, scheduleRows, boxScoreData, season) {
  if (!scheduleRows.length) {
    return;
  }
  const headers = scheduleRows[0];
  scheduleIndexes = getScheduleIndexes(headers, season);
  const dataRows = scheduleRows.slice(1);
  leagueScheduleGames = dataRows
    .map((row) => {
      const dateToken = normalizeDateToken(row[scheduleIndexes.date]);
      return {
        row,
        dateToken,
        dateObj: parseDateObj(dateToken),
        team1: displayTeamName(String(row[scheduleIndexes.team1] || "").trim()),
        team2: displayTeamName(String(row[scheduleIndexes.team2] || "").trim()),
      };
    })
    .filter((g) => g.dateToken && g.team1 && g.team2);
  const filtered = dataRows.filter((row) => {
    const team1 = String(row[scheduleIndexes.team1] || "").trim();
    const team2 = String(row[scheduleIndexes.team2] || "").trim();
    return teamMatches(team1, teamName) || teamMatches(team2, teamName);
  });

  const trimmedHeaders = headers.slice(0, headers.length);
  const trimmedRows = filtered.map((row) => row.slice(0, headers.length));
  teamScheduleRows = filtered;
  boxScoreRows = boxScoreData.slice(0, 1000);
  finalScoreMap = buildFinalScoreMap(boxScoreRows);
  renderSchedule(trimmedHeaders, trimmedRows);
}

function buildBoxScore(teamName, scheduleRow, season) {
  if (!scheduleRow || !boxScoreRows.length) {
    return null;
  }
  const dateToken = String(scheduleRow[scheduleIndexes.date] || "").trim();
  const team1Name = scheduleRow[scheduleIndexes.team1] || "";
  const team2Name = scheduleRow[scheduleIndexes.team2] || "";

  const isDateRow = (row) => {
    const a = String(row[0] || "");
    const b = String(row[1] || "");
    return (
      (a.includes("League Day") && dateToken && a.includes(dateToken)) ||
      (b.includes("League Day") && dateToken && b.includes(dateToken)) ||
      (dateToken && a.includes(dateToken)) ||
      (dateToken && b.includes(dateToken))
    );
  };

  const matchIndex = boxScoreRows.findIndex(isDateRow);
  if (matchIndex === -1) {
    return {
      dateLabel: `League Day: ${dateToken}`,
      team1Name,
      team2Name,
      team1: [],
      team2: [],
    };
  }

  let dayEnd = boxScoreRows.length;
  for (let i = matchIndex + 1; i < boxScoreRows.length; i += 1) {
    if (isDateRow(boxScoreRows[i])) {
      dayEnd = i;
      break;
    }
  }
  const dayRows = boxScoreRows.slice(matchIndex + 1, dayEnd);
  const blocks = [];
  let current = null;
  dayRows.forEach((row) => {
    const left = String(row[0] || "").trim();
    const right = String(row[4] || "").trim();
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

  const normalizedTeam1 = normalizeTeamLabel(team1Name);
  const normalizedTeam2 = normalizeTeamLabel(team2Name);
  const selectedBlock = blocks.find((block) => {
    const header = block[0] || [];
    const h1 = normalizeTeamLabel(parseTeamHeader(header[0]).name);
    const h2 = normalizeTeamLabel(
      parseTeamHeader(header[getRightNameCol(header)]).name
    );
    const exact =
      (h1 === normalizedTeam1 && h2 === normalizedTeam2) ||
      (h1 === normalizedTeam2 && h2 === normalizedTeam1);
    const fuzzy =
      ((h1.includes(normalizedTeam1) || normalizedTeam1.includes(h1)) &&
        (h2.includes(normalizedTeam2) || normalizedTeam2.includes(h2))) ||
      ((h1.includes(normalizedTeam2) || normalizedTeam2.includes(h1)) &&
        (h2.includes(normalizedTeam1) || normalizedTeam1.includes(h2)));
    return exact || fuzzy;
  });

  if (!selectedBlock) {
    return {
      dateLabel: `League Day: ${dateToken}`,
      team1Name,
      team2Name,
      team1: [],
      team2: [],
    };
  }

  const team1Rows = selectedBlock.filter((row) => String(row[0] || "").trim() !== "");
  const team2Rows = selectedBlock.filter(
    (row) => String(row[getRightNameCol(row)] || "").trim() !== ""
  );

  const team1Header = team1Rows.length ? team1Rows[0][0] : team1Name;
  const team2Header = team2Rows.length
    ? team2Rows[0][getRightNameCol(team2Rows[0])]
    : team2Name;

  return {
    dateLabel: `League Day: ${dateToken}`,
    team1Name: team1Header || team1Name,
    team2Name: team2Header || team2Name,
    team1: team1Rows
      .slice(1)
      .map((row) => buildPlayerEntry(row[0], row[1], row[2]))
      .filter((row) => row.player),
    team2: team2Rows
      .slice(1)
      .map((row) =>
        buildPlayerEntry(
          row[getRightNameCol(row)],
          row[getRightNameCol(row) + 1],
          row[getRightNameCol(row) + 2]
        )
      )
      .filter((row) => row.player),
  };
}

function buildBoxScoreMarkup(boxScore) {
  if (!boxScore) {
    return '<div class="boxscore-empty">No stats available.</div>';
  }
  const cleanTeamLabel = (name) =>
    String(name || "").replace(/\([^)]*\)/g, "").trim();
  const renderTeamTable = (rows, header) => {
    if (!rows.length) {
      return "<div class=\"boxscore-empty\">No stats available.</div>";
    }
    const teamLink = `team.html?team=${encodeURIComponent(
      cleanTeamLabel(header)
    )}`;
    const cleanHeader = displayTeamName(cleanTeamLabel(header));
    const logoSrc = getTeamLogo(cleanHeader);
    const logoHtml = logoSrc
      ? `<img class="standings-logo" src="${logoSrc}" alt="${escapeHtml(
          cleanHeader
        )} logo" />`
      : "";
    const headerLine = header
      ? `<a class="boxscore-team" href="${teamLink}">${logoHtml}<span>${escapeHtml(
          cleanHeader
        )}</span></a>`
      : "";
    const headerRow = `
      <div class="boxscore-row">
        <span>Player</span>
        <span>Points</span>
        <span>Rank</span>
      </div>
    `;
    const body = rows
      .map(
        (row) => `
          <div class="boxscore-row">
            <a class="boxscore-link" href="/player-detail.html?player=${encodeURIComponent(
              String(row.player || "").trim()
            )}">${escapeHtml(formatPlayerDisplay(row))}</a>
            <span>${escapeHtml(row.points)}</span>
            <span>${escapeHtml(row.rank)}</span>
          </div>
        `
      )
      .join("");
    return `<div class="boxscore-table">${headerLine}${headerRow}${body}</div>`;
  };

  return `
    <div class="boxscore-meta">${escapeHtml(boxScore.dateLabel || "")}</div>
    <div class="boxscore-card">
      ${renderTeamTable(boxScore.team1, boxScore.team1Name)}
    </div>
    <div class="boxscore-card">
      ${renderTeamTable(boxScore.team2, boxScore.team2Name)}
    </div>
  `;
}

function buildGamePreviewMarkup(scheduleRow) {
  const dateToken = String(scheduleRow[scheduleIndexes.date] || "").trim();
  const gameDate = parseDateObj(dateToken);
  const team1 = displayTeamName(String(scheduleRow[scheduleIndexes.team1] || "").trim());
  const team2 = displayTeamName(String(scheduleRow[scheduleIndexes.team2] || "").trim());

  const previewForTeam = (teamName, oppName) => {
    const history = leagueScheduleGames
      .filter((g) => {
        if (!g.dateObj || !gameDate || g.dateObj >= gameDate) return false;
        if (g.team1 !== teamName && g.team2 !== teamName) return false;
        return finalScoreMap.has(buildGameKey(g.dateToken, g.team1, g.team2));
      })
      .sort((a, b) => b.dateObj - a.dateObj)
      .slice(0, 3)
      .map((g) => {
        const s = finalScoreMap.get(buildGameKey(g.dateToken, g.team1, g.team2));
        const isTeam1 = g.team1 === teamName;
        const mine = isTeam1 ? s.team1Score : s.team2Score;
        const opp = isTeam1 ? s.team2Score : s.team1Score;
        const opponent = isTeam1 ? g.team2 : g.team1;
        const result = parseNumber(mine) > parseNumber(opp) ? "W" : "L";
        return `${g.dateToken} • ${result} ${mine}-${opp} vs ${opponent}`;
      });

    const leaders = teamLeadersMap.get(teamName) || {};
    const row = (label, item, fmt) =>
      `<div class="preview-metric"><span>${label}</span><strong>${item ? `${item.player} (${fmt(item)})` : "—"}</strong></div>`;
    return `<div class="preview-team-card">
      <h4>${escapeHtml(teamName)} <span>vs ${escapeHtml(oppName)}</span></h4>
      <div class="preview-sub">Last 3 Games</div>
      <ul>${history.map((h) => `<li>${escapeHtml(h)}</li>`).join("") || "<li>No completed games yet.</li>"}</ul>
      ${row("Top AVG", leaders.topAvg, (v) => v.avg.toFixed(1))}
      ${row("Top REL", leaders.topRel, (v) => v.rel.toFixed(3))}
      ${row("Top WAR", leaders.topWar, (v) => v.war.toFixed(2))}
    </div>`;
  };

  return `<div class="preview-grid">
    ${previewForTeam(team1, team2)}
    ${previewForTeam(team2, team1)}
  </div>`;
}

els.scheduleBody.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    return;
  }
  const rowEl = event.target.closest(".schedule-row");
  if (!rowEl) {
    return;
  }
  const index = Number(rowEl.dataset.index);
  const scheduleRow = teamScheduleRows[index];
  const boxScore = buildBoxScore(getTeamName(), scheduleRow, getSeason());
  const detailRow = els.scheduleBody.querySelector(
    `.schedule-detail-row[data-detail-index="${index}"]`
  );
  if (!detailRow) {
    return;
  }

  const boxWrap = detailRow.querySelector(".schedule-detail-box");
  if (!boxWrap) {
    return;
  }

  const isOpening = detailRow.hidden;
  els.scheduleBody
    .querySelectorAll(".schedule-detail-row")
    .forEach((row) => (row.hidden = true));
  els.scheduleBody
    .querySelectorAll(".schedule-row")
    .forEach((row) => row.classList.remove("active"));

  if (isOpening) {
    rowEl.classList.add("active");
    detailRow.hidden = false;
    const scoreState = getScheduleScoreState(scheduleRow);
    if (scoreState.status === "upcoming") {
      boxWrap.innerHTML = buildGamePreviewMarkup(scheduleRow);
    } else if (scoreState.status === "live") {
      boxWrap.innerHTML = buildLiveBoxMarkup(scoreState, scheduleRow);
    } else {
      boxWrap.innerHTML = buildBoxScoreMarkup(boxScore);
    }
  }
});

document.addEventListener("click", (event) => {
  if (event.target.matches("[data-close=\"true\"]")) {
    els.modal.hidden = true;
  }
});

initSeasonSelect();
initStandingsInteractions();
loadRoster();
setInterval(loadRoster, AUTO_REFRESH_MS);
