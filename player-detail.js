const PLAYER_STATS_URL = "/api/sheet?name=player-stats";
const BOXSCORE_CSV_URL = "/api/sheet?name=boxscore";
const ARCHIVE_URL = "/api/sheet?name=archive";
const AWARDS_URL = "/api/sheet?name=awards";
const DRAFT_URL = "/api/sheet?name=draft";
const TRANSACTIONS_URL = "/api/sheet?name=transactions";
const SUPABASE_PLAYERS_URL = "https://wbbkjikdxpywfeyenbhs.supabase.co/rest/v1/players?select=player_tag,display_name";
const SUPABASE_API_KEY = "sb_publishable_P_4Gvh9rXEUrHS_-VZu6uw_As3f4CK3";
const PLAYER_SEASON_KEY = "playerSeason";
const SEASON_KEY = "season";
const TRANSACTIONS_RANGE = "A3:E81";
const RETIREMENT_RANGE = "G3:J70";
const CUT_RANGE = "L3:O81";
const SIGNING_RANGE = "Q3:T81";
const DRAFT_ROUND_RANGES = [
  { title: "Round 1", range: "A1:C11" },
  { title: "Round 2", range: "A12:C22" },
  { title: "Round 3", range: "A23:C33" },
  { title: "Round 4", range: "A34:C44" },
];
const EXPANSION_DRAFT_RANGES = [
  { team: "The Snipers", range: "E1:F7" },
  { team: "The Phantoms", range: "E9:F15" },
  { team: "The Future", range: "E17:F23" },
  { team: "The Lions", range: "E25:F31" },
];

const ARCHIVE_RANGES = {
  player_stats: "A45:F117",
  boxscore: "L31:R149",
  draft_c2s1: "A120:C175",
};

const TEAM_RANGES = {
  "Gus N Em": "B2:C13",
  Bullets: "E2:F13",
  Turkeys: "H2:I13",
  Cheerios: "B17:C28",
  Yetis: "E17:F28",
  Illegals: "H17:I28",
  "The Lions": "B32:C43",
  "The Future": "E32:F43",
  "The Snipers": "H32:I43",
  "The Phantoms": "B45:C56",
};

const ARCHIVE_TEAM_ROSTERS = {
  "Gus N Em": "H1:I12",
  Cheerios: "H16:I27",
  Bullets: "K1:L12",
  Yetis: "K16:L27",
  Turkeys: "N1:O12",
  Illegals: "N16:O27",
};

const els = {
  name: document.getElementById("player-name"),
  sub: document.getElementById("player-sub"),
  lastUpdated: document.getElementById("last-updated"),
  head: document.querySelector("#player-games thead"),
  body: document.querySelector("#player-games tbody"),
  modal: document.getElementById("boxscore-modal"),
  boxDetails: document.getElementById("boxscore-details"),
  sumTotal: document.getElementById("sum-total"),
  sumAvgScore: document.getElementById("sum-avg-score"),
  sumAvgRank: document.getElementById("sum-avg-rank"),
  sumGp: document.getElementById("sum-gp"),
  sumRelMean: document.getElementById("sum-rel-mean"),
  sumRelMedian: document.getElementById("sum-rel-median"),
  sumWar: document.getElementById("sum-war"),
  teamValue: document.getElementById("player-team-value"),
  awardsPanel: document.getElementById("player-awards-panel"),
  awards: document.getElementById("player-awards"),
  summaryCards: Array.from(document.querySelectorAll(".summary-card-link")),
  rankGp: document.getElementById("rank-gp"),
  rankTotal: document.getElementById("rank-total"),
  rankAvgScore: document.getElementById("rank-avg-score"),
  rankAvgRank: document.getElementById("rank-avg-rank"),
  rankRelMean: document.getElementById("rank-rel-mean"),
  rankRelMedian: document.getElementById("rank-rel-median"),
  rankWar: document.getElementById("rank-war"),
  transactions: document.getElementById("player-transactions"),
  careerTeamBreakdown: document.getElementById("career-team-breakdown"),
};

let playerColumns = {
  date: 0,
  team: 1,
  player: 2,
  score: 3,
  rank: 4,
  opponent: 5,
};
let playerNameOverrides = new Map();

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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function normalizeName(value) {
  return String(value || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_.]/g, "");
}

function normalizePlayerKey(value) {
  return String(value || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}

function displayTeamName(value) {
  const name = String(value || "").trim();
  return name === "Bullets" ? "Storm" : name;
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

async function loadPlayerOverrides() {
  try {
    const response = await fetch(SUPABASE_PLAYERS_URL, {
      headers: {
        apikey: SUPABASE_API_KEY,
        Authorization: `Bearer ${SUPABASE_API_KEY}`,
      },
    });
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    playerNameOverrides = new Map(
      (data || [])
        .filter((row) => row.player_tag && row.display_name)
        .map((row) => [normalizePlayerKey(row.player_tag), row.display_name])
    );
  } catch (error) {
    // ignore override failures
  }
}

function matchesName(cellValue, target) {
  if (!cellValue || !target) {
    return false;
  }
  const normalized = normalizeName(cellValue);
  if (!normalized) {
    return false;
  }
  if (normalized === target) {
    return true;
  }
  const tokens = extractNormalizedPlayerTokens(cellValue);
  return tokens.has(target);
}

function extractNormalizedPlayerTokens(value) {
  const text = String(value || "");
  const out = new Set();
  const mentions = text.match(/@[A-Za-z0-9_.]+/g) || [];
  mentions.forEach((tag) => {
    const norm = normalizeName(tag);
    if (norm) {
      out.add(norm);
    }
  });
  const roughTokens = text.split(/[^A-Za-z0-9_.@]+/g);
  roughTokens.forEach((token) => {
    const norm = normalizeName(token);
    if (norm) {
      out.add(norm);
    }
  });
  return out;
}

function getPlayerAliases(playerName) {
  const aliases = new Set();
  const base = normalizeName(playerName);
  if (base) {
    aliases.add(base);
  }
  const keyBase = normalizePlayerKey(playerName);
  if (keyBase) {
    aliases.add(normalizeName(keyBase));
  }

  playerNameOverrides.forEach((displayName, playerTag) => {
    const displayNorm = normalizeName(displayName);
    const tagNorm = normalizeName(playerTag);
    if (!displayNorm && !tagNorm) {
      return;
    }
    if (
      (base && (displayNorm === base || tagNorm === base)) ||
      (keyBase &&
        (normalizePlayerKey(displayName) === keyBase ||
          normalizePlayerKey(playerTag) === keyBase))
    ) {
      if (displayNorm) {
        aliases.add(displayNorm);
      }
      if (tagNorm) {
        aliases.add(tagNorm);
      }
    }
  });

  return Array.from(aliases).filter(Boolean);
}

function matchesAnyAlias(cellValue, aliases) {
  if (!cellValue || !aliases.length) {
    return false;
  }
  const normalizedCell = normalizeName(cellValue);
  const tokens = extractNormalizedPlayerTokens(cellValue);
  return aliases.some((alias) => {
    if (!alias) {
      return false;
    }
    return normalizedCell === alias || tokens.has(alias);
  });
}

function matchesAnyAliasStrict(cellValue, aliases) {
  if (!cellValue || !aliases.length) {
    return false;
  }
  const normalizedCell = normalizeName(cellValue);
  const tokens = extractNormalizedPlayerTokens(cellValue);
  return aliases.some((alias) => alias && (normalizedCell === alias || tokens.has(alias)));
}

async function findTeamForPlayer(season, playerName) {
  if (!playerName) {
    return "";
  }
  const aliases = getPlayerAliases(playerName);
  if (!aliases.length) {
    return "";
  }
  if (season === "c2s2-regular" || season === "career") {
    const response = await fetch("/api/sheet?name=roster", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    const rows = parseCSV(await response.text());
    const matchedTeamsStrict = [];
    const matchedTeamsLoose = [];
    for (const [team, range] of Object.entries(TEAM_RANGES)) {
      const sliced = sliceRange(rows, range);
      const hasStrict = sliced.some((row) =>
        row.some((cell) => matchesAnyAliasStrict(cell, aliases))
      );
      const hasLoose = sliced.some((row) =>
        row.some((cell) => matchesAnyAlias(cell, aliases))
      );
      if (hasStrict) {
        matchedTeamsStrict.push(team);
      } else if (hasLoose) {
        matchedTeamsLoose.push(team);
      }
    }
    if (matchedTeamsStrict.length) {
      return matchedTeamsStrict[matchedTeamsStrict.length - 1];
    }
    if (matchedTeamsLoose.length) {
      return matchedTeamsLoose[matchedTeamsLoose.length - 1];
    }
    if (season === "c2s2-regular") {
      return "";
    }
  }
  if (
    season === "c2s1-playoffs" ||
    season === "c2s1-regular" ||
    season === "career"
  ) {
    const response = await fetch(ARCHIVE_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    const archive = parseCSV(await response.text());
    const matchedTeamsStrict = [];
    const matchedTeamsLoose = [];
    for (const [team, range] of Object.entries(ARCHIVE_TEAM_ROSTERS)) {
      const sliced = sliceRange(archive, range);
      const hasStrict = sliced.some((row) =>
        row.some((cell) => matchesAnyAliasStrict(cell, aliases))
      );
      const hasLoose = sliced.some((row) =>
        row.some((cell) => matchesAnyAlias(cell, aliases))
      );
      if (hasStrict) {
        matchedTeamsStrict.push(team);
      } else if (hasLoose) {
        matchedTeamsLoose.push(team);
      }
    }
    if (matchedTeamsStrict.length) {
      return matchedTeamsStrict[matchedTeamsStrict.length - 1];
    }
    if (matchedTeamsLoose.length) {
      return matchedTeamsLoose[matchedTeamsLoose.length - 1];
    }
  }
  return "";
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

function parseNumber(value) {
  const num = Number(String(value || "").replace(/[^0-9.\-]/g, ""));
  return Number.isNaN(num) ? null : num;
}

function parseAdjustedScore(row) {
  const base = parseNumber(row[playerColumns.score]);
  if (base === null) {
    return null;
  }
  const playerCell = row[playerColumns.player];
  return isCaptainMarked(playerCell) ? base - 0.5 : base;
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

function buildDailyBaselines(rows) {
  const byDate = new Map();
  rows.forEach((row) => {
    const dateKey = String(row[playerColumns.date] || "").trim();
    const score = parseNumber(row[playerColumns.score]);
    if (!dateKey || score === null) {
      return;
    }
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, []);
    }
    byDate.get(dateKey).push(score);
  });

  const baselines = new Map();
  byDate.forEach((scores, dateKey) => {
    if (!scores.length) {
      return;
    }
    const sum = scores.reduce((acc, n) => acc + n, 0);
    baselines.set(dateKey, {
      mean: scores.length ? sum / scores.length : null,
      median: median(scores),
    });
  });
  return baselines;
}

function buildLeaderboardEntries(rows) {
  const baselines = buildDailyBaselines(rows);
  const totals = new Map();
  rows.forEach((row) => {
    const rawName = stripCaptainMarker(row[playerColumns.player]);
    const team = String(row[playerColumns.team] || "").trim();
    const score = parseAdjustedScore(row);
    const rank = parseNumber(row[playerColumns.rank]);
    if (!rawName || score === null) {
      return;
    }
    if (!totals.has(rawName)) {
      totals.set(rawName, {
        total: 0,
        games: 0,
        rankSum: 0,
        rankGames: 0,
        relMeanSum: 0,
        relMeanGames: 0,
        relMedianSum: 0,
        relMedianGames: 0,
        war: 0,
        team,
      });
    }
    const entry = totals.get(rawName);
    entry.total += score;
    entry.games += 1;
    if (rank !== null) {
      entry.rankSum += rank;
      entry.rankGames += 1;
    }
    const dateKey = String(row[playerColumns.date] || "").trim();
    const baseline = baselines.get(dateKey);
    if (baseline && baseline.mean && baseline.mean > 0) {
      entry.relMeanSum += score / baseline.mean;
      entry.relMeanGames += 1;
    }
    if (baseline && baseline.median && baseline.median > 0) {
      entry.relMedianSum += score / baseline.median;
      entry.relMedianGames += 1;
      const replacementScore = 0.9 * baseline.median;
      const avgMargin = 0.92 * baseline.median;
      if (avgMargin > 0) {
        entry.war += (score - replacementScore) / avgMargin;
      }
    }
  });

  return Array.from(totals.entries()).map(([player, value]) => ({
    player,
    team: value.team || "",
    total: value.total,
    games: value.games,
    avgScore: value.games ? value.total / value.games : 0,
    avgRank: value.rankGames ? value.rankSum / value.rankGames : Infinity,
    relMean: value.relMeanGames ? value.relMeanSum / value.relMeanGames : 0,
    relMedian: value.relMedianGames ? value.relMedianSum / value.relMedianGames : 0,
    war: value.war,
  }));
}

function getRank(entries, playerName, selector, ascending = false) {
  const target = normalizeName(playerName);
  const sorted = [...entries].sort((a, b) => {
    const av = selector(a);
    const bv = selector(b);
    return ascending ? av - bv : bv - av;
  });
  const idx = sorted.findIndex((entry) => normalizeName(entry.player) === target);
  return idx === -1 ? "—" : String(idx + 1);
}

function renderLeagueRanks(dataRows, playerName) {
  const nodes = [
    els.rankGp,
    els.rankTotal,
    els.rankAvgScore,
    els.rankAvgRank,
    els.rankRelMean,
    els.rankRelMedian,
    els.rankWar,
  ].filter(Boolean);
  if (!dataRows.length || !playerName) {
    nodes.forEach((node) => {
      node.textContent = "League rank: —";
    });
    return;
  }
  const entries = buildLeaderboardEntries(dataRows);
  if (!entries.length) {
    nodes.forEach((node) => {
      node.textContent = "League rank: —";
    });
    return;
  }
  if (els.rankGp) {
    els.rankGp.textContent = `League rank: ${getRank(entries, playerName, (e) => e.games)}`;
  }
  if (els.rankTotal) {
    els.rankTotal.textContent = `League rank: ${getRank(entries, playerName, (e) => e.total)}`;
  }
  if (els.rankAvgScore) {
    els.rankAvgScore.textContent = `League rank: ${getRank(entries, playerName, (e) => e.avgScore)}`;
  }
  if (els.rankAvgRank) {
    els.rankAvgRank.textContent = `League rank: ${getRank(entries, playerName, (e) => e.avgRank, true)}`;
  }
  if (els.rankRelMean) {
    els.rankRelMean.textContent = `League rank: ${getRank(entries, playerName, (e) => e.relMean)}`;
  }
  if (els.rankRelMedian) {
    els.rankRelMedian.textContent = `League rank: ${getRank(entries, playerName, (e) => e.relMedian)}`;
  }
  if (els.rankWar) {
    els.rankWar.textContent = `League rank: ${getRank(entries, playerName, (e) => e.war)}`;
  }
}

function getPlayerName() {
  const params = new URLSearchParams(window.location.search);
  return params.get("player") || "";
}

function normalizeSeason(value) {
  if (
    value === "career" ||
    value === "c2s1-playoffs" ||
    value === "c2s1-regular"
  ) {
    return value;
  }
  if (value === "c2s2" || value === "c2s2-regular") {
    return "c2s2-regular";
  }
  return "c2s2-regular";
}

function getSeason() {
  const playerSeason = localStorage.getItem(PLAYER_SEASON_KEY);
  return normalizeSeason(playerSeason);
}

function initSeasonSelect() {
  const panelSelect = document.getElementById("player-season-select");
  const navSelect = document.getElementById("season-select");
  const current = getSeason();

  if (panelSelect) {
    panelSelect.value = current;
  }
  if (navSelect) {
    navSelect.value =
      current === "career" || current === "c2s2-regular"
        ? "c2s2"
        : current === "c2s1-playoffs"
        ? "c2s1-post"
        : current === "c2s1-regular"
        ? "c2s1-regular"
        : "c2s2";
  }

  if (!localStorage.getItem(PLAYER_SEASON_KEY)) {
    localStorage.setItem(PLAYER_SEASON_KEY, current);
  }

  const onChange = (value) => {
    localStorage.setItem(PLAYER_SEASON_KEY, value);
    localStorage.setItem(
      SEASON_KEY,
      value === "c2s1-playoffs"
        ? "c2s1-post"
        : value === "c2s1-regular"
        ? "c2s1-regular"
        : "c2s2"
    );
    location.reload();
  };

  if (panelSelect) {
    panelSelect.addEventListener("change", () => onChange(panelSelect.value));
  }
  if (navSelect) {
    navSelect.addEventListener("change", () => {
      const mapped =
        navSelect.value === "c2s1-post"
          ? "c2s1-playoffs"
          : navSelect.value === "c2s1-regular"
          ? "c2s1-regular"
          : "c2s2-regular";
      onChange(mapped);
    });
  }
}

function getTeamLogoHtml(teamName) {
  const shownTeam = displayTeamName(teamName);
  return shownTeam === "The Future"
    ? '<img class="player-team-logo" src="/assets/the-future.png" alt="The Future logo" />'
    : shownTeam === "The Lions"
    ? '<img class="player-team-logo" src="/assets/the-lions.png" alt="The Lions logo" />'
    : shownTeam === "The Snipers"
    ? '<img class="player-team-logo" src="/assets/the-snipers.png" alt="The Snipers logo" />'
    : shownTeam === "The Phantoms"
    ? '<img class="player-team-logo" src="/assets/the-phantoms.png" alt="The Phantoms logo" />'
    : shownTeam === "Yetis"
    ? '<img class="player-team-logo" src="/assets/yetis.png" alt="Yetis logo" />'
    : shownTeam === "Gus N Em"
    ? '<img class="player-team-logo" src="/assets/gus-n-em.png" alt="Gus N Em logo" />'
    : shownTeam === "Cheerios"
    ? '<img class="player-team-logo" src="/assets/cheerios.png" alt="Cheerios logo" />'
    : shownTeam === "Illegals"
    ? '<img class="player-team-logo" src="/assets/illegals.png" alt="Illegals logo" />'
    : shownTeam === "Storm" || shownTeam === "Bullets"
    ? '<img class="player-team-logo" src="/assets/storm.png" alt="Storm logo" />'
    : shownTeam === "Turkeys"
    ? '<img class="player-team-logo" src="/assets/turkeys.png" alt="Turkeys logo" />'
    : "";
}

function renderPlayerTeam(teamNameOrList) {
  if (!els.teamValue) {
    return;
  }
  if (!teamNameOrList || (Array.isArray(teamNameOrList) && !teamNameOrList.length)) {
    els.teamValue.textContent = "—";
    return;
  }
  if (
    !Array.isArray(teamNameOrList) &&
    String(displayTeamName(teamNameOrList)).toLowerCase() === "retired"
  ) {
    els.teamValue.innerHTML = "<span>Retired</span>";
    return;
  }
  if (
    !Array.isArray(teamNameOrList) &&
    (String(displayTeamName(teamNameOrList)).toLowerCase() === "cut" ||
      String(displayTeamName(teamNameOrList)).toLowerCase() === "free agent")
  ) {
    els.teamValue.innerHTML = "<span>Free Agent</span>";
    return;
  }
  const teams = Array.isArray(teamNameOrList)
    ? teamNameOrList.map((t) => displayTeamName(t)).filter(Boolean)
    : [displayTeamName(teamNameOrList)];
  const uniqueTeams = Array.from(new Set(teams));
  const links = uniqueTeams
    .map(
      (team) =>
        `<a class="leader-team-link player-team-chip" href="team.html?team=${encodeURIComponent(
          team
        )}">${getTeamLogoHtml(team)}<span>${escapeHtml(team)}</span></a>`
    )
    .join('<span class="player-team-sep">•</span>');
  els.teamValue.innerHTML = `<span class="player-team-list">${links}</span>`;
}

function renderTable(rows) {
  const includeSeason = rows.some((row) => row && row.__seasonLabel);
  const headers = includeSeason
    ? ["Season", "Date", "Team", "Score", "Rank", "Opponent"]
    : ["Date", "Team", "Score", "Rank", "Opponent"];
  els.head.innerHTML = `
    <tr>
      ${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}
    </tr>
  `;

  els.body.innerHTML = rows
    .map(
      (row, index) => `
        <tr class="schedule-row" data-index="${index}">
          ${
            includeSeason
              ? `<td>${escapeHtml(row.__seasonLabel || "")}</td>`
              : ""
          }
          <td>${escapeHtml(row[playerColumns.date] ?? "")}</td>
          <td>${escapeHtml(row[playerColumns.team] ?? "")}</td>
          <td>${escapeHtml(row[playerColumns.score] ?? "")}</td>
          <td>${escapeHtml(row[playerColumns.rank] ?? "")}</td>
          <td>${escapeHtml(row[playerColumns.opponent] ?? "")}</td>
        </tr>
      `
    )
    .join("");
}

function summarizeRows(rows, baselines) {
  if (!rows.length) {
    return {
      total: null,
      avgScore: null,
      avgRank: null,
      gp: 0,
      relMean: null,
      relMedian: null,
      war: null,
    };
  }
  let total = 0;
  let scoreGames = 0;
  let rankTotal = 0;
  let rankGames = 0;
  let relMeanSum = 0;
  let relMeanGames = 0;
  let relMedianSum = 0;
  let relMedianGames = 0;
  let warTotal = 0;

  rows.forEach((row) => {
    const score = parseAdjustedScore(row);
    const rank = parseNumber(row[playerColumns.rank]);
    if (score !== null) {
      total += score;
      scoreGames += 1;
      const dateKey = String(row[playerColumns.date] || "").trim();
      const baseline = baselines ? baselines.get(dateKey) : null;
      if (baseline && baseline.mean && baseline.mean > 0) {
        relMeanSum += score / baseline.mean;
        relMeanGames += 1;
      }
      if (baseline && baseline.median && baseline.median > 0) {
        relMedianSum += score / baseline.median;
        relMedianGames += 1;
        const replacementScore = 0.9 * baseline.median;
        const avgMargin = 0.92 * baseline.median;
        if (avgMargin > 0) {
          warTotal += (score - replacementScore) / avgMargin;
        }
      }
    }
    if (rank !== null) {
      rankTotal += rank;
      rankGames += 1;
    }
  });
  return {
    total,
    avgScore: scoreGames ? total / scoreGames : null,
    avgRank: rankGames ? rankTotal / rankGames : null,
    gp: scoreGames,
    relMean: relMeanGames ? relMeanSum / relMeanGames : null,
    relMedian: relMedianGames ? relMedianSum / relMedianGames : null,
    war: warTotal,
  };
}

function updateSummary(rows, baselines) {
  const summary = summarizeRows(rows, baselines);
  if (!summary.gp) {
    els.sumTotal.textContent = "—";
    els.sumAvgScore.textContent = "—";
    els.sumAvgRank.textContent = "—";
    els.sumGp.textContent = "—";
    if (els.sumRelMean) {
      els.sumRelMean.textContent = "—";
    }
    if (els.sumRelMedian) {
      els.sumRelMedian.textContent = "—";
    }
    if (els.sumWar) {
      els.sumWar.textContent = "—";
    }
    return;
  }
  els.sumTotal.textContent = summary.total.toFixed(0);
  els.sumAvgScore.textContent = summary.avgScore.toFixed(2);
  els.sumAvgRank.textContent = summary.avgRank !== null ? summary.avgRank.toFixed(2) : "—";
  els.sumGp.textContent = String(summary.gp);
  if (els.sumRelMean) {
    els.sumRelMean.textContent = summary.relMean !== null ? summary.relMean.toFixed(3) : "—";
  }
  if (els.sumRelMedian) {
    els.sumRelMedian.textContent = summary.relMedian !== null ? summary.relMedian.toFixed(3) : "—";
  }
  if (els.sumWar) {
    els.sumWar.textContent = summary.war !== null ? summary.war.toFixed(3) : "—";
  }
}

function renderCareerTeamBreakdown(rows, baselines, season) {
  if (!els.careerTeamBreakdown) {
    return;
  }
  if (season !== "career" || !rows.length) {
    els.careerTeamBreakdown.hidden = true;
    els.careerTeamBreakdown.innerHTML = "";
    return;
  }
  const bySeason = new Map();
  rows.forEach((row) => {
    const seasonLabel = String(row.__seasonLabel || "Unknown Season");
    if (!bySeason.has(seasonLabel)) bySeason.set(seasonLabel, []);
    bySeason.get(seasonLabel).push(row);
  });

  const seasonOrder = ["C2S2 Regular Season", "C2S1 Playoffs"];
  const orderedSeasons = Array.from(bySeason.keys()).sort((a, b) => {
    const ai = seasonOrder.indexOf(a);
    const bi = seasonOrder.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const renderStat = (value, digits = 2) =>
    value === null || value === undefined ? "—" : Number(value).toFixed(digits);
  const renderTeamCell = (team) =>
    `<a class="leader-team-link player-team-chip" href="team.html?team=${encodeURIComponent(team)}">${getTeamLogoHtml(team)}<span>${escapeHtml(team)}</span></a>`;

  const rowsHtml = orderedSeasons
    .map((seasonLabel) => {
      const seasonRows = bySeason.get(seasonLabel) || [];
      const byTeam = new Map();
      seasonRows.forEach((row) => {
        const team = displayTeamName(String(row[playerColumns.team] || "").trim());
        if (!team) return;
        if (!byTeam.has(team)) byTeam.set(team, []);
        byTeam.get(team).push(row);
      });
      const teamSummaries = Array.from(byTeam.entries())
        .map(([team, teamRows]) => ({ team, summary: summarizeRows(teamRows, baselines) }))
        .sort((a, b) => (b.summary.gp || 0) - (a.summary.gp || 0));
      const seasonTotal = summarizeRows(seasonRows, baselines);

      const teamRowsHtml = teamSummaries
        .map(
          ({ team, summary }) => `
            <tr>
              <td>${escapeHtml(seasonLabel)}</td>
              <td>${renderTeamCell(team)}</td>
              <td>${escapeHtml(String(summary.gp || 0))}</td>
              <td>${renderStat(summary.total, 0)}</td>
              <td>${renderStat(summary.avgScore, 2)}</td>
              <td>${renderStat(summary.avgRank, 2)}</td>
              <td>${renderStat(summary.relMedian, 3)}</td>
              <td>${renderStat(summary.war, 3)}</td>
            </tr>
          `
        )
        .join("");

      return `
        ${teamRowsHtml}
        <tr class="career-combined-row">
          <td><strong>${escapeHtml(seasonLabel)}</strong></td>
          <td><strong>Season Total</strong></td>
          <td>${escapeHtml(String(seasonTotal.gp || 0))}</td>
          <td>${renderStat(seasonTotal.total, 0)}</td>
          <td>${renderStat(seasonTotal.avgScore, 2)}</td>
          <td>${renderStat(seasonTotal.avgRank, 2)}</td>
          <td>${renderStat(seasonTotal.relMedian, 3)}</td>
          <td>${renderStat(seasonTotal.war, 3)}</td>
        </tr>
      `;
    })
    .join("");

  const careerCombined = summarizeRows(rows, baselines);

  els.careerTeamBreakdown.hidden = false;
  els.careerTeamBreakdown.innerHTML = `
    <div class="career-breakdown-title">Career Team Breakdown</div>
    <div class="table-wrap">
      <table class="career-breakdown-table">
        <thead>
          <tr>
            <th>Season</th>
            <th>Team</th>
            <th>GP</th>
            <th>Total</th>
            <th>Avg</th>
            <th>Rank</th>
            <th>REL</th>
            <th>WAR</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr class="career-combined-row">
            <td><strong>Career</strong></td>
            <td><strong>Combined</strong></td>
            <td>${escapeHtml(String(careerCombined.gp || 0))}</td>
            <td>${renderStat(careerCombined.total, 0)}</td>
            <td>${renderStat(careerCombined.avgScore, 2)}</td>
            <td>${renderStat(careerCombined.avgRank, 2)}</td>
            <td>${renderStat(careerCombined.relMedian, 3)}</td>
            <td>${renderStat(careerCombined.war, 3)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function getTeamsFromRows(rows) {
  const teams = rows
    .map((row) => displayTeamName(String(row[playerColumns.team] || "").trim()))
    .filter(Boolean);
  return Array.from(new Set(teams));
}

function findTeamFromStats(rows) {
  if (!rows || !rows.length) {
    return "";
  }
  const row = rows.find((r) => String(r[playerColumns.team] || "").trim());
  return row ? String(row[playerColumns.team] || "").trim() : "";
}

function renderAwards(items) {
  if (!els.awards || !els.awardsPanel) {
    return;
  }
  if (!items.length) {
    els.awardsPanel.hidden = true;
    els.awards.innerHTML = "";
    return;
  }
  els.awardsPanel.hidden = false;
  els.awards.innerHTML = `
    <div class="awards-grid">
      ${items
        .map(
          (item) => `
            <div class="awards-card">
              <div class="awards-title awards-title-center">${escapeHtml(
                item.player
              )}</div>
              <div class="awards-winner awards-winner-center">${escapeHtml(
                `${item.season} ${item.award}`
              )}</div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function buildTransactionsDetails(row) {
  const team1 = displayTeamName(String(row[1] || "").trim()) || "Team 1";
  const team1Gets = String(row[2] || "").trim() || "—";
  const team2 = displayTeamName(String(row[3] || "").trim()) || "Team 2";
  const team2Gets = String(row[4] || "").trim() || "—";
  return `${team1} receive ${team1Gets} | ${team2} receive ${team2Gets}`;
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

function getEventSortValue(event) {
  const parsed = parseDateValue(event && event.date);
  if (parsed !== Number.NEGATIVE_INFINITY) {
    return parsed;
  }
  const title = String((event && event.title) || "").toLowerCase();
  const details = String((event && event.details) || "").toLowerCase();
  if (title === "expansion draft") {
    return Date.parse("2026-01-01");
  }
  if (title === "drafted" && details.includes("c2s1 draft")) {
    return Date.parse("2024-01-01");
  }
  if (title === "drafted") {
    return Date.parse("2025-01-01");
  }
  if (title === "trade status") {
    return Number.NEGATIVE_INFINITY;
  }
  return Number.NEGATIVE_INFINITY + 1;
}

function isDraftHeaderRow(row) {
  const combined = row.map((cell) => String(cell || "").toLowerCase()).join(" ");
  return (
    combined.includes("round") ||
    combined.includes("team") ||
    combined.includes("selection") ||
    combined.includes("pick")
  );
}

function findDraftEvent(playerName, draftRows, aliases) {
  if (!playerName || !draftRows.length || !aliases.length) {
    return null;
  }
  for (const round of DRAFT_ROUND_RANGES) {
    const sliced = sliceRange(draftRows, round.range).filter((row) =>
      row.some((cell) => String(cell || "").trim() !== "")
    );
    if (!sliced.length) {
      continue;
    }
    for (const row of sliced) {
      if (isDraftHeaderRow(row)) {
        continue;
      }
      const selection = String(row[2] || "").trim();
      if (!selection || !matchesAnyAlias(selection, aliases)) {
        continue;
      }
      return {
        date: "Draft",
        title: "Drafted",
        details: `${round.title} • Pick ${String(row[0] || "").trim() || "—"} • ${displayTeamName(String(row[1] || "").trim() || "—")}`,
      };
    }
  }
  return null;
}

function findArchiveDraftEvent(playerName, archiveRows, aliases) {
  if (!playerName || !archiveRows.length || !aliases.length) {
    return null;
  }
  const sliced = sliceRange(archiveRows, ARCHIVE_RANGES.draft_c2s1).filter((row) =>
    row.some((cell) => String(cell || "").trim() !== "")
  );
  if (!sliced.length) {
    return null;
  }
  for (const row of sliced) {
    if (isDraftHeaderRow(row)) {
      continue;
    }
    const pickCell = String(row[0] || "").trim();
    const teamCell = String(row[1] || "").trim();
    const selection = String(row[2] || "").trim();
    if (!selection || !matchesAnyAlias(selection, aliases)) {
      continue;
    }
    return {
      date: "Draft",
      title: "Drafted",
      details: `C2S1 Draft • Pick ${pickCell || "—"} • ${displayTeamName(teamCell || "—")}`,
    };
  }
  return null;
}

function findExpansionDraftEvents(playerName, draftRows, aliases) {
  if (!playerName || !draftRows.length || !aliases.length) {
    return [];
  }
  const events = [];
  const seen = new Set();

  for (const block of EXPANSION_DRAFT_RANGES) {
    const sliced = sliceRange(draftRows, block.range).filter((row) =>
      row.some((cell) => String(cell || "").trim() !== "")
    );
    if (!sliced.length) {
      continue;
    }
    for (const row of sliced) {
      // Some sheets can have player tag/name in col E and extra info in col F.
      const left = String(row[0] || "").trim();
      const right = String(row[1] || "").trim();
      const combined = `${left} ${right}`.trim();
      if (!combined || !matchesAnyAlias(combined, aliases)) {
        continue;
      }
      const key = `${block.team}|${normalizeName(left)}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      events.push({
        date: "Draft",
        title: "Expansion Draft",
        details: `Selected by ${block.team}`,
      });
    }
  }

  return events;
}

function findTradeEvents(playerName, transactionRows, aliases) {
  if (!playerName || !transactionRows.length || !aliases.length) {
    return [];
  }
  return transactionRows
    .filter((row) => {
      const combined = row.map((cell) => String(cell || "")).join(" ");
      return matchesAnyAlias(combined, aliases);
    })
    .map((row) => {
      const date = String(row[0] || "").trim() || "—";
      const details = buildTransactionsDetails(row);
      return {
        date,
        title: "Trade",
        details,
      };
    });
}

function findRetirementEvents(playerName, retirementRows, aliases) {
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
  if (!playerName || !retirementRows.length || !aliases.length) {
    return [];
  }
  return retirementRows
    .filter((row) => {
      const combined = row.map((cell) => String(cell || "")).join(" ");
      return matchesAnyAlias(combined, aliases);
    })
    .map((row) => {
      const mergedTeamCell = String(row[2] || row[3] || "").trim();
      const parsed = extractDateAndTeam(mergedTeamCell);
      const date = parsed.date || "—";
      const team = displayTeamName(parsed.team || mergedTeamCell || "");
      const player = String(row[0] || row[1] || "").trim() || playerName;
      const note = "";
      return {
        date,
        title: "Retirement",
        details: `${player} retired${team ? ` (${team})` : ""}${
          note ? ` • ${note}` : ""
        }`,
      };
    });
}

function findCutEvents(playerName, cutRows, aliases) {
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
  if (!playerName || !cutRows.length || !aliases.length) {
    return [];
  }
  return cutRows
    .filter((row) => {
      const player = String(row[0] || row[1] || "").trim().toLowerCase();
      const teamCell = String(row[2] || row[3] || "").trim().toLowerCase();
      if (
        player === "cuts" ||
        player === "player" ||
        teamCell === "date/team" ||
        teamCell === "team"
      ) {
        return false;
      }
      const combined = row.map((cell) => String(cell || "")).join(" ");
      return matchesAnyAlias(combined, aliases);
    })
    .map((row) => {
      const mergedTeamCell = String(row[2] || row[3] || "").trim();
      const parsed = extractDateAndTeam(mergedTeamCell);
      const date = parsed.date || "—";
      const team = displayTeamName(parsed.team || mergedTeamCell || "");
      const player = String(row[0] || row[1] || "").trim() || playerName;
      return {
        date,
        title: "Cut",
        details: `${player} was cut${team ? ` (${team})` : ""}`,
        team,
      };
    });
}

function findSigningEvents(playerName, signingRows, aliases) {
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
  if (!playerName || !signingRows.length || !aliases.length) {
    return [];
  }
  return signingRows
    .filter((row) => {
      const player = String(row[0] || row[1] || "").trim().toLowerCase();
      const teamCell = String(row[2] || row[3] || "").trim().toLowerCase();
      if (
        player === "signings" ||
        player === "player" ||
        teamCell === "date/team" ||
        teamCell === "team"
      ) {
        return false;
      }
      const combined = row.map((cell) => String(cell || "")).join(" ");
      return matchesAnyAlias(combined, aliases);
    })
    .map((row) => {
      const mergedTeamCell = String(row[2] || row[3] || "").trim();
      const parsed = extractDateAndTeam(mergedTeamCell);
      const date = parsed.date || "—";
      const team = displayTeamName(parsed.team || mergedTeamCell || "");
      const player = String(row[0] || row[1] || "").trim() || playerName;
      return {
        date,
        title: "Signing",
        details: `${team || "Team"} signs ${player || "Player"}`,
        team,
      };
    });
}

function renderPlayerTransactions(events, playerName) {
  if (!els.transactions) {
    return;
  }
  if (!events.length) {
    els.transactions.innerHTML =
      "<div class=\"tx-card\"><div class=\"tx-details\">No transaction history found.</div></div>";
    return;
  }
  const query = encodeURIComponent(String(playerName || "").trim());
  els.transactions.innerHTML = events
    .map(
      (event) => `
        <article class="tx-card">
          <div class="tx-head">
            <strong>${escapeHtml(event.title)}</strong>
            <span>${escapeHtml(event.date)}</span>
          </div>
          <div class="tx-details">${escapeHtml(event.details)}</div>
          <div class="tx-meta">
            <a class="tx-link" href="/transactions.html?q=${query}" target="_self">Open transactions</a>
          </div>
        </article>
      `
    )
    .join("");
}

async function loadPlayerTransactions(playerName, season) {
  if (!els.transactions) {
    return;
  }
  if (!playerName) {
    renderPlayerTransactions([], playerName);
    return;
  }
  try {
    const [transactionsRes, draftRes, archiveRes] = await Promise.all([
      fetch(TRANSACTIONS_URL, { cache: "no-store" }),
      fetch(DRAFT_URL, { cache: "no-store" }),
      fetch(ARCHIVE_URL, { cache: "no-store" }),
    ]);

    const c2s2DraftRows = draftRes && draftRes.ok ? parseCSV(await draftRes.text()) : [];
    const archiveRows = archiveRes && archiveRes.ok ? parseCSV(await archiveRes.text()) : [];
    const rawTransactions = transactionsRes && transactionsRes.ok
      ? parseCSV(await transactionsRes.text())
      : [];
    const transactionRows = sliceRange(rawTransactions, TRANSACTIONS_RANGE).filter(
      (row) => row.some((cell) => String(cell || "").trim() !== "")
    );
    const retirementRows = sliceRange(rawTransactions, RETIREMENT_RANGE).filter(
      (row) => row.some((cell) => String(cell || "").trim() !== "")
    );
    const cutRows = sliceRange(rawTransactions, CUT_RANGE).filter(
      (row) => row.some((cell) => String(cell || "").trim() !== "")
    );
    const signingRows = sliceRange(rawTransactions, SIGNING_RANGE).filter(
      (row) => row.some((cell) => String(cell || "").trim() !== "")
    );

    const aliases = getPlayerAliases(playerName);
    const events = [];
    const draftEvents = [
      findArchiveDraftEvent(playerName, archiveRows, aliases),
      findDraftEvent(playerName, c2s2DraftRows, aliases),
    ].filter(Boolean);
    const expansionDraftEvents = findExpansionDraftEvents(
      playerName,
      c2s2DraftRows,
      aliases
    );
    draftEvents.push(...expansionDraftEvents);
    draftEvents.forEach((event) => events.push(event));
    const trades = findTradeEvents(playerName, transactionRows, aliases);
    const retirements = findRetirementEvents(playerName, retirementRows, aliases);
    const cuts = findCutEvents(playerName, cutRows, aliases);
    const signings = findSigningEvents(playerName, signingRows, aliases);
    const statusEvents = [
      ...retirements.map((e) => ({ ...e, _statusType: "retirement" })),
      ...cuts.map((e) => ({ ...e, _statusType: "cut" })),
      ...signings.map((e) => ({ ...e, _statusType: "signing" })),
    ].sort((a, b) => getEventSortValue(b) - getEventSortValue(a));
    const latestStatus = statusEvents[0] || null;
    if (latestStatus) {
      if (latestStatus._statusType === "retirement") {
        renderPlayerTeam("Retired");
      } else if (latestStatus._statusType === "cut") {
        renderPlayerTeam("Free Agent");
      } else if (latestStatus._statusType === "signing") {
        renderPlayerTeam(latestStatus.team || "Free Agent");
      }
    }
    if (trades.length || retirements.length || cuts.length || signings.length) {
      events.push(...trades, ...retirements, ...cuts, ...signings);
    } else if (!draftEvents.length) {
      events.push({
        date: "Status",
        title: "Trade Status",
        details: "No transactions recorded.",
      });
    }
    events.sort((a, b) => getEventSortValue(b) - getEventSortValue(a));
    renderPlayerTransactions(events, playerName);
  } catch (error) {
    els.transactions.innerHTML =
      "<div class=\"tx-card\"><div class=\"tx-details\">Unable to load transaction history.</div></div>";
  }
}

async function loadAwards(playerName) {
  if (!playerName) {
    renderAwards([]);
    return;
  }
  try {
    const response = await fetch(AWARDS_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    const rows = parseCSV(await response.text());
    if (!rows.length) {
      renderAwards([]);
      return;
    }
    const seasonMap = [
      { key: "C1S1", range: "B3:B15" },
      { key: "C1S2", range: "C3:D24" },
      { key: "C1S3", range: "E3:F28" },
      { key: "C1S4", range: "G3:H27" },
      { key: "C1S5", range: "I3:J28" },
      { key: "C1S6", range: "K3:L27" },
      { key: "C2S1", range: "M3:N29" },
    ];
    const championMap = [
      { key: "C1S2", range: "C15:D24" },
      { key: "C1S3", range: "E15:F28" },
      { key: "C1S4", range: "G16:H27" },
      { key: "C1S5", range: "I16:J28" },
      { key: "C1S6", range: "K16:L27" },
      { key: "C2S1", range: "M16:N29" },
    ];
    const target = normalizeName(playerName);
    const found = [];

    seasonMap.forEach((season) => {
      const sliced = sliceRange(rows, season.range);
      sliced.forEach((row) => {
        const award = String(row[0] || "").trim();
        const winner = String(row[1] || "").trim();
        if (!award || !winner) {
          return;
        }
        if (matchesName(winner, target)) {
          found.push({ player: playerName, season: season.key, award });
        }
      });
    });

    championMap.forEach((season) => {
      const sliced = sliceRange(rows, season.range);
      sliced.forEach((row) => {
        const label = String(row[0] || "").trim();
        const winner = String(row[1] || "").trim();
        if (!label) {
          return;
        }
        if (!winner && matchesName(label, target)) {
          found.push({
            player: playerName,
            season: season.key,
            award: "Champion",
          });
        } else if (winner && matchesName(winner, target)) {
          found.push({
            player: playerName,
            season: season.key,
            award: "Champion",
          });
        }
      });
    });

    renderAwards(found);
  } catch (error) {
    renderAwards([]);
  }
}

async function loadPlayer() {
  const playerName = getPlayerName();
  await loadPlayerOverrides();
  const displayName =
    playerNameOverrides.get(normalizePlayerKey(playerName)) || playerName;
  els.name.textContent = displayName || "Player";
  if (els.sub) {
    els.sub.textContent = displayName
      ? `Game-by-game stats for ${displayName}`
      : "Missing player name.";
  }

  if (playerName.toUpperCase().startsWith("GM")) {
    renderTable([]);
    updateSummary([]);
    els.body.innerHTML = `<tr><td>No stats for GM entries.</td></tr>`;
    renderAwards([]);
    return;
  }

  try {
    const season = getSeason();
    let dataRows = [];
    let boxRows = [];
    if (season === "c2s2-regular") {
      const [playerRes, boxRes] = await Promise.all([
        fetch(PLAYER_STATS_URL, { cache: "no-store" }),
        fetch(BOXSCORE_CSV_URL, { cache: "no-store" }),
      ]);
      if (!playerRes.ok) {
        throw new Error(`Fetch failed: ${playerRes.status}`);
      }
      if (!boxRes.ok) {
        throw new Error(`Fetch failed: ${boxRes.status}`);
      }
      const rows = parseCSV(await playerRes.text());
      if (!rows.length) {
        throw new Error("No data found.");
      }
      playerColumns = detectPlayerColumns(rows[0] || []);
      dataRows = rows.slice(1);
      boxRows = parseCSV(await boxRes.text());
    } else if (season === "career") {
      const [playerRes, boxRes, archiveRes] = await Promise.all([
        fetch(PLAYER_STATS_URL, { cache: "no-store" }),
        fetch(BOXSCORE_CSV_URL, { cache: "no-store" }),
        fetch(ARCHIVE_URL, { cache: "no-store" }),
      ]);
      if (!playerRes.ok) {
        throw new Error(`Fetch failed: ${playerRes.status}`);
      }
      if (!boxRes.ok) {
        throw new Error(`Fetch failed: ${boxRes.status}`);
      }
      if (!archiveRes.ok) {
        throw new Error(`Fetch failed: ${archiveRes.status}`);
      }
      const c2s2Rows = parseCSV(await playerRes.text());
      const c2s2Box = parseCSV(await boxRes.text());
      const archive = parseCSV(await archiveRes.text());
      const c2s1PlayoffRows = sliceRange(archive, ARCHIVE_RANGES.player_stats);
      const c2s1PlayoffBox = sliceRange(archive, ARCHIVE_RANGES.boxscore);

      const c2s2Header = c2s2Rows[0] || [];
      const c2s1Header = c2s1PlayoffRows[0] || [];
      playerColumns = detectPlayerColumns(
        c2s2Header.length ? c2s2Header : c2s1Header
      );

      const annotate = (rows, label) =>
        rows.map((row) => {
          const copy = [...row];
          copy.__seasonLabel = label;
          return copy;
        });

      dataRows = [
        ...annotate(c2s2Rows.slice(1), "C2S2 Regular Season"),
        ...annotate(c2s1PlayoffRows.slice(1), "C2S1 Playoffs"),
      ];
      boxRows = [...c2s2Box, ...c2s1PlayoffBox];
    } else if (season === "c2s1-playoffs") {
      const response = await fetch(ARCHIVE_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      const archive = parseCSV(await response.text());
      const sliced = sliceRange(archive, ARCHIVE_RANGES.player_stats);
      playerColumns = detectPlayerColumns(sliced[0] || []);
      dataRows = sliced.slice(1);
      boxRows = sliceRange(archive, ARCHIVE_RANGES.boxscore);
    } else {
      dataRows = [];
      boxRows = [];
    }
    const aliases = getPlayerAliases(playerName);
    const filtered = playerName
      ? dataRows.filter(
          (row) => matchesAnyAlias(row[playerColumns.player], aliases)
        )
      : [];

    const baselines = buildDailyBaselines(dataRows);
    renderLeagueRanks(dataRows, playerName);
    if (season === "c2s1-regular") {
      els.body.innerHTML = `<tr><td>No stats available for C2S1 Regular Season.</td></tr>`;
      updateSummary([], baselines);
      renderCareerTeamBreakdown([], baselines, season);
      const teamName = await findTeamForPlayer(season, playerName);
      renderPlayerTeam(teamName);
    } else {
      renderTable(filtered);
      updateSummary(filtered, baselines);
      renderCareerTeamBreakdown(filtered, baselines, season);
      const teamsFromStats = getTeamsFromRows(filtered);
      if (season === "career") {
        const currentTeam = await findTeamForPlayer("c2s2-regular", playerName);
        if (currentTeam) {
          const shownCurrent = displayTeamName(currentTeam);
          const ordered = [
            shownCurrent,
            ...teamsFromStats.filter(
              (team) => displayTeamName(team) !== shownCurrent
            ),
          ];
          renderPlayerTeam(ordered);
        } else if (teamsFromStats.length) {
          renderPlayerTeam(teamsFromStats);
        } else {
          const teamName = await findTeamForPlayer(season, playerName);
          renderPlayerTeam(teamName);
        }
      } else if (season === "c2s2-regular") {
        const currentTeam = await findTeamForPlayer(season, playerName);
        if (currentTeam) {
          renderPlayerTeam(currentTeam);
        } else if (teamsFromStats.length) {
          renderPlayerTeam(teamsFromStats[0]);
        } else {
          renderPlayerTeam("");
        }
      } else if (teamsFromStats.length) {
        renderPlayerTeam(teamsFromStats[0]);
      } else {
        const teamName = await findTeamForPlayer(season, playerName);
        renderPlayerTeam(teamName);
      }
    }
    window.__playerRows = filtered;
    window.__boxScoreRows = boxRows;
    await loadPlayerTransactions(playerName, season);
    updateLastUpdated();
    loadAwards(playerName);
  } catch (error) {
    els.body.innerHTML = `<tr><td>${escapeHtml(error.message)}</td></tr>`;
    renderLeagueRanks([], playerName);
  }
}

function renderBoxScore(boxScore) {
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
    const headerLine = header
      ? `<a class="boxscore-team" href="${teamLink}">${escapeHtml(header)}</a>`
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

function buildBoxScore(dateToken, opponent) {
  const rows = window.__boxScoreRows || [];
  if (!rows.length) {
    return null;
  }
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

  const matchIndex = rows.findIndex(isDateRow);
  if (matchIndex === -1) {
    return null;
  }

  const teamRows = [];
  for (let i = matchIndex + 1; i < rows.length; i += 1) {
    const row = rows[i];
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

  const team1Header = team1Rows.length ? team1Rows[0][0] : "";
  const team2Header = team2Rows.length ? team2Rows[0][4] : "";

  const matchup = `${team1Header} ${team2Header}`.toLowerCase();
  if (opponent && !matchup.includes(opponent.toLowerCase())) {
    return null;
  }

  return {
    dateLabel: `League Day: ${dateToken}`,
    team1Name: team1Header,
    team2Name: team2Header,
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

els.body.addEventListener("click", (event) => {
  const rowEl = event.target.closest(".schedule-row");
  if (!rowEl) {
    return;
  }
  const index = Number(rowEl.dataset.index);
  const rows = window.__playerRows || [];
  const row = rows[index];
  if (!row) {
    return;
  }
  const opponent = String(row[playerColumns.opponent] || "").trim();
  const dateValue = String(row[playerColumns.date] || "").trim();
  const dateToken = dateValue.includes("•")
    ? dateValue.split("•").pop().trim()
    : dateValue;
  const boxScore = buildBoxScore(dateToken, opponent);
  if (!boxScore) {
    els.boxDetails.innerHTML = `<div class=\"boxscore-empty\">No stats available.</div>`;
    els.modal.hidden = false;
    return;
  }
  renderBoxScore(boxScore);
});

document.addEventListener("click", (event) => {
  if (event.target.matches("[data-close=\"true\"]")) {
    els.modal.hidden = true;
  }
});

els.summaryCards.forEach((card) => {
  card.addEventListener("click", () => {
    const metric = card.dataset.metric || "avg_score";
    const season = getSeason();
    const leaderboardSeason = season === "career" ? "c2s2-regular" : season;
    const params = new URLSearchParams({
      metric,
      season: leaderboardSeason,
    });
    window.location.href = `player.html?${params.toString()}`;
  });
});

initSeasonSelect();
loadPlayer();
