const ROSTER_CSV_URL = "/api/sheet?name=roster";
const STANDINGS_CSV_URL = "/api/sheet?name=standings";
const SCHEDULE_CSV_URL = "/api/sheet?name=schedule";
const BOXSCORE_CSV_URL = "/api/sheet?name=boxscore";
const PLAYER_STATS_URL = "/api/sheet?name=player-stats";
const ARCHIVE_URL = "/api/sheet?name=archive";
const DRAFT_CAPITAL_URL = "/api/sheet?name=draft-capital";
const SEASON_KEY = "season";
const TRANSACTIONS_URL = "/api/sheet?name=transactions";
const TRANSACTIONS_RANGE = "A3:E81";
const RETIREMENT_RANGE = "G3:J70";
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
const C2S2_SCHEDULE_RANGE = "A2:C77";

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

function getSeason() {
  return localStorage.getItem(SEASON_KEY) || "c2s2";
}

function displayTeamName(value) {
  const name = String(value || "").trim();
  return name === "Bullets" ? "Storm" : name;
}

function initSeasonSelect() {
  const select = document.getElementById("season-select");
  if (!select) {
    return;
  }
  select.value = getSeason();
  select.addEventListener("change", () => {
    localStorage.setItem(SEASON_KEY, select.value);
    location.reload();
  });
}

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
  statTransactions: document.getElementById("stat-transactions"),
  statTeam: document.getElementById("stat-team"),
  standingsMetricSelect: document.getElementById("standings-metric-select"),
  standingsMetricLeader: document.getElementById("standings-metric-leader"),
  standingsStatBoxes: Array.from(document.querySelectorAll(".stat-box[data-metric]")),
  draftCapital: document.getElementById("team-draft-capital"),
  teamTransactions: document.getElementById("team-transactions"),
  scheduleHead: document.querySelector("#team-schedule thead"),
  scheduleBody: document.querySelector("#team-schedule tbody"),
  modal: document.getElementById("boxscore-modal"),
  modalClose: document.querySelector(".modal-close"),
  boxDetails: document.getElementById("boxscore-details"),
};

let leagueStandingsMetrics = [];
let leagueTransactionCounts = new Map();

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
      const row = sliced[0] || [];
      if (!row.length) {
        return null;
      }
      const advanced = computeAdvancedTeamStats(team, playerRows) || {};
      return {
        team: displayTeamName(row[0] || team),
        gp: parseNumber(row[1]),
        wins: parseNumber(row[2]),
        loss: parseNumber(row[3]),
        gb: parseNumber(row[4]),
        winpct: parsePct(row[5]),
        sos: computeTeamSOS(team, scheduleRows, winPctMap, "c2s2"),
        pam: typeof advanced.pam === "number" ? advanced.pam : null,
        trel: typeof advanced.tRel === "number" ? advanced.tRel : null,
        transactions: 0,
      };
    })
    .filter(Boolean);
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

function renderSchedule(headers, dataRows) {
  els.scheduleHead.innerHTML = `
    <tr>
      ${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}
    </tr>
  `;

  els.scheduleBody.innerHTML = dataRows
    .map((row, index) => {
      const box = buildBoxScore(getTeamName(), row, getSeason());
      const concluded =
        box &&
        (box.team1.some((entry) =>
          String(entry.player || "").trim().startsWith("@")
        ) ||
          box.team2.some((entry) =>
            String(entry.player || "").trim().startsWith("@")
          ));
      return `
        <tr class="schedule-row" data-index="${index}">
          ${headers
            .map((header, i) => {
              const value = row[i] ?? "";
              const isTeamCol = String(header || "")
                .toLowerCase()
                .includes("team");
              const shown = displayTeamName(value);
              const logo = getTeamLogo(shown);
              const logoHtml = logo
                ? `<img class="standings-logo" src="${logo}" alt="${escapeHtml(
                    shown
                  )} logo" />`
                : "";
              if (isTeamCol && String(value).trim() && !concluded) {
                return `<td><a class="roster-link schedule-team-link" href="/team.html?team=${encodeURIComponent(
                  shown
                )}">${logoHtml}<span>${escapeHtml(shown)}</span></a></td>`;
              }
              if (isTeamCol && String(value).trim()) {
                return `<td><span class="schedule-team-link schedule-team-static">${logoHtml}<span>${escapeHtml(
                  shown
                )}</span></span></td>`;
              }
              return `<td>${escapeHtml(value)}</td>`;
            })
            .join("")}
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
  return params.get("team") || "";
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
  const lowered = headerRow.map((cell) => String(cell || "").toLowerCase());
  const pick = (label) => lowered.indexOf(label);
  const dateIdx = pick("date");
  const teamIdx = pick("team");
  const playerIdx = pick("player");
  const scoreIdx = pick("score") !== -1 ? pick("score") : pick("points");
  const rankIdx = pick("rank");
  const opponentIdx = pick("opponent");

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

  const leagueScoresByDate = new Map();
  dataRows.forEach((row) => {
    const date = String(row[columns.date] || "").trim();
    const score = parseAdjustedScore(row, columns);
    if (!date || score === null) {
      return;
    }
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
    const med = medianByDate.get(date);
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

function computeTeamSOS(teamName, scheduleRows, winPctMap, season) {
  if (!teamName || !scheduleRows.length || !winPctMap.size) {
    return null;
  }
  const headers = scheduleRows[0] || [];
  const idx = getScheduleIndexes(headers, season);
  const winPctByNormalizedTeam = new Map();
  winPctMap.forEach((pct, team) => {
    winPctByNormalizedTeam.set(normalizeTeamLabel(team), pct);
  });
  const dataRows = scheduleRows.slice(1);
  let sum = 0;
  let games = 0;
  dataRows.forEach((row) => {
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

  // Match rows that only show the base pick (without origin text).
  targets.add(base.replace(/\s+via\s+.+$/i, "").trim());
  targets.add(base.replace(/\s+from\s+.+$/i, "").trim());

  // Match rows where the origin is wrapped in extra descriptors.
  targets.add(base.replace(/\s+\b(via|from)\b\s+.+$/i, "").trim());

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
  const merged = [...trades, ...retirements]
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
      if (tx.type === "Retirement") {
        return `
          <article class="tx-card">
            <div class="tx-head">
              <strong>Retirement</strong>
              <span>${escapeHtml(tx.date)}</span>
            </div>
            <div class="tx-sides">
              <div class="tx-side tx-side-full">
                <div class="tx-retire-player">${linkifyPlayers(tx.player)}</div>
                <div class="tx-side-team">${renderTeamHeader(tx.team)}</div>
                <div class="tx-details">Retired${tx.note ? ` • ${escapeHtml(tx.note)}` : ""}</div>
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
  const originalTeam = normalizeTeamLabel(pick && pick.original_team);
  const currentTeam = normalizeTeamLabel(pick && pick.current_team);
  const teamCandidates = Array.from(
    new Set(
      [currentTeam, originalTeam, meta.viaTeam]
        .map((v) => normalizeTeamLabel(v))
        .filter(Boolean)
    )
  );
  const teamsPerRound = 10;
  const roundMin = meta.round ? (meta.round - 1) * teamsPerRound + 1 : null;
  const roundMax = meta.round ? meta.round * teamsPerRound : null;

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
    const directMatch = targets.some((target) => normalizedRow.includes(target));
    let fallbackMatch = false;

    if (!directMatch && meta.round) {
      const nums = extractOverallNumbers(joined);
      const hasRoundNumber =
        nums.length > 0 &&
        nums.some((n) => roundMin !== null && roundMax !== null && n >= roundMin && n <= roundMax);
      const hasTeamContext =
        (meta.viaTeam && normalizedRow.includes(meta.viaTeam)) ||
        (originalTeam && normalizedRow.includes(originalTeam)) ||
        (currentTeam && normalizedRow.includes(currentTeam));
      fallbackMatch = hasRoundNumber && hasTeamContext;
    }

    if (directMatch || fallbackMatch) {
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
    els.draftCapital.innerHTML = picks
      .map((label) => {
        const pickMeta = {
          label,
          current_team: teamName,
          original_team: teamName,
        };
        const tradeEntries = findTradeEntriesForPick(pickMeta, txRows);
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
  const teamName = getTeamName();
  if (els.statTransactions) {
    els.statTransactions.textContent = "—";
  }
  if (els.teamTransactions) {
    els.teamTransactions.innerHTML =
      '<div class="tx-card"><div class="tx-details">Loading transactions...</div></div>';
  }
  await loadDraftCapital(teamName);
  if (els.logo) {
    if (teamName === "The Future") {
      els.logo.src = "/assets/the-future.png";
      els.logo.alt = "The Future logo";
      els.logo.style.display = "block";
    } else if (teamName === "The Lions") {
      els.logo.src = "/assets/the-lions.png";
      els.logo.alt = "The Lions logo";
      els.logo.style.display = "block";
    } else if (teamName === "The Snipers") {
      els.logo.src = "/assets/the-snipers.png";
      els.logo.alt = "The Snipers logo";
      els.logo.style.display = "block";
    } else if (teamName === "The Phantoms") {
      els.logo.src = "/assets/the-phantoms.png";
      els.logo.alt = "The Phantoms logo";
      els.logo.style.display = "block";
    } else if (teamName === "Yetis") {
      els.logo.src = "/assets/yetis.png";
      els.logo.alt = "Yetis logo";
      els.logo.style.display = "block";
    } else if (teamName === "Gus N Em") {
      els.logo.src = "/assets/gus-n-em.png";
      els.logo.alt = "Gus N Em logo";
      els.logo.style.display = "block";
    } else if (teamName === "Cheerios") {
      els.logo.src = "/assets/cheerios.png";
      els.logo.alt = "Cheerios logo";
      els.logo.style.display = "block";
    } else if (teamName === "Illegals") {
      els.logo.src = "/assets/illegals.png";
      els.logo.alt = "Illegals logo";
      els.logo.style.display = "block";
    } else if (teamName === "Bullets" || teamName === "Storm") {
      els.logo.src = "/assets/storm.png";
      els.logo.alt = "Storm logo";
      els.logo.style.display = "block";
    } else if (teamName === "Turkeys") {
      els.logo.src = "/assets/turkeys.png";
      els.logo.alt = "Turkeys logo";
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
      ? `Roster for ${displayTeamName(teamName)}`
      : "Missing team name.";
  }

  try {
    const season = getSeason();
    if (season === "c2s2") {
      const [rosterRes, standingsRes, scheduleRes, boxscoreRes, playerStatsRes] = await Promise.all([
        fetch(ROSTER_CSV_URL, { cache: "no-store" }),
        fetch(STANDINGS_CSV_URL, { cache: "no-store" }),
        fetch(SCHEDULE_CSV_URL, { cache: "no-store" }),
        fetch(BOXSCORE_CSV_URL, { cache: "no-store" }),
        fetch(PLAYER_STATS_URL, { cache: "no-store" }),
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
      const sos = computeTeamSOS(teamName, scheduleRows, winPctMap, season);
      if (els.statSos) {
        els.statSos.textContent = sos !== null ? sos.toFixed(3) : "—";
      }
      updateTeamSchedule(
        teamName,
        scheduleRows,
        parseCSV(await boxscoreRes.text()),
        season
      );
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
      const archiveSos = computeTeamSOS(
        teamName,
        scheduleTable,
        archiveWinPctMap,
        season
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
      updateTeamSchedule(teamName, scheduleTable, boxscoreTable, season);
      if (season === "c2s1-post") {
        updateAdvancedTeamStats(
          computeAdvancedTeamStats(teamName, archivePlayerRows)
        );
      } else {
        clearAdvancedTeamStats();
      }
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
  } catch (error) {
    els.body.innerHTML = `<tr><td>${escapeHtml(error.message)}</td></tr>`;
  }
}

function updateStandingsFromRanges(teamName, standingsRows) {
  const range = STANDINGS_RANGES[teamName];
  if (!range || !standingsRows.length) {
    return;
  }
  const sliced = sliceRange(standingsRows, range);
  if (!sliced.length) {
    return;
  }
  const values = sliced[0];
  const [team, gp, wins, loss, gb, winPct] = values;

  els.statTeam.textContent = displayTeamName(team || teamName || "—");
  els.statGp.textContent = gp || "—";
  els.statWins.textContent = wins || "—";
  els.statLoss.textContent = loss || "—";
  els.statGb.textContent = gb || "—";
  els.statWinPct.textContent = winPct || "—";
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
let scheduleIndexes = { date: 1, team1: 2, team2: 3 };

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

function getScheduleIndexes(headers, season) {
  if (headers.length <= 3) {
    return { date: 0, team1: 1, team2: 2 };
  }
  return { date: 1, team1: 2, team2: 3 };
}

function getC2S2ScheduleRows(rows) {
  const sliced = sliceRange(rows, C2S2_SCHEDULE_RANGE);
  return [["Date", "Team 1", "Team 2"], ...sliced];
}

function updateTeamSchedule(teamName, scheduleRows, boxScoreData, season) {
  if (!scheduleRows.length) {
    return;
  }
  const headers = scheduleRows[0];
  scheduleIndexes = getScheduleIndexes(headers, season);
  const dataRows = scheduleRows.slice(1);
  const filtered = dataRows.filter((row) => {
    const team1 = String(row[scheduleIndexes.team1] || "").trim();
    const team2 = String(row[scheduleIndexes.team2] || "").trim();
    return teamMatches(team1, teamName) || teamMatches(team2, teamName);
  });

  const trimmedHeaders = headers.slice(0, headers.length);
  const trimmedRows = filtered.map((row) => row.slice(0, headers.length));
  teamScheduleRows = filtered;
  boxScoreRows = boxScoreData.slice(0, 1000);
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

  const teamRows = [];
  for (let i = matchIndex + 1; i < boxScoreRows.length; i += 1) {
    const row = boxScoreRows[i];
    if (!row) {
      break;
    }
    if (isDateRow(row)) {
      break;
    }
    const hasTeam1 = String(row[0] || "").trim() !== "";
    const hasTeam2 = String(row[4] || "").trim() !== "";
    if (!hasTeam1 && !hasTeam2) {
      if (teamRows.length) {
        break;
      }
      continue;
    }
    teamRows.push(row);
  }

  const team1Rows = teamRows.filter((row) => String(row[0] || "").trim() !== "");
  const team2Rows = teamRows.filter((row) => String(row[4] || "").trim() !== "");

  const team1Header = team1Rows.length ? team1Rows[0][0] : team1Name;
  const team2Header = team2Rows.length ? team2Rows[0][4] : team2Name;

  return {
    dateLabel: `League Day: ${dateToken}`,
    team1Name: team1Header || team1Name,
    team2Name: team2Header || team2Name,
    team1: team1Rows.slice(1).map((row) => ({
      player: row[0] || "",
      points: row[1] || "",
      rank: row[2] || "",
    })),
    team2: team2Rows.slice(1).map((row) => ({
      player: row[4] || "",
      points: row[5] || "",
      rank: row[6] || "",
    })),
  };
}

function renderBoxScoreModal(boxScore) {
  if (!boxScore) {
    return;
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
            )}">${escapeHtml(row.player)}</a>
            <span>${escapeHtml(row.points)}</span>
            <span>${escapeHtml(row.rank)}</span>
          </div>
        `
      )
      .join("");
    return `<div class="boxscore-table">${headerLine}${headerRow}${body}</div>`;
  };

  els.boxDetails.innerHTML = `
    <div class="boxscore-meta">${escapeHtml(boxScore.dateLabel || "")}</div>
    <div class="boxscore-card">
      ${renderTeamTable(boxScore.team1, boxScore.team1Name)}
    </div>
    <div class="boxscore-card">
      ${renderTeamTable(boxScore.team2, boxScore.team2Name)}
    </div>
  `;

  els.modal.hidden = false;
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
  renderBoxScoreModal(boxScore);
});

document.addEventListener("click", (event) => {
  if (event.target.matches("[data-close=\"true\"]")) {
    els.modal.hidden = true;
  }
});

initSeasonSelect();
initStandingsInteractions();
loadRoster();
