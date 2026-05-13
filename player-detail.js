const PLAYER_STATS_URL = "/api/sheet?name=player-stats";
const BOXSCORE_CSV_URL = "/api/sheet?name=boxscore";
const ARCHIVE_URL = "/api/sheet?name=archive";
const C2S2_REGULAR_URL = "/api/sheet?name=c2s2-regular";
const C2S1_ROSTERS_URL = "/assets/data/c2s1-rosters.csv";
const AWARDS_URL = "/api/sheet?name=awards";
const DRAFT_URL = "/api/sheet?name=draft";
const TRANSACTIONS_URL = "/api/sheet?name=transactions";
const CONTRACTS_URL = "/api/sheet?name=contracts";
const C1S2_PLAYER_STATS_URL = "/assets/data/c1s2-player-stats.csv";
const C1S3_PLAYER_STATS_URL = "/assets/data/c1s3-player-stats.csv";
const C1S4_PLAYER_STATS_URL = "/assets/data/c1s4-player-stats.csv";
const C1S5_PLAYER_STATS_URL = "/assets/data/c1s5-player-stats.csv";
const C1S6_PLAYER_STATS_URL = "/assets/data/c1s6-player-stats.csv";
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
const C2S2_REGULAR_RANGES = {
  player_stats: "A151:G1150",
  boxscore: "K60:R1059",
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
  playoffStatsPanel: document.getElementById("player-playoff-stats-panel"),
  playoffHead: document.querySelector("#player-playoff-games thead"),
  playoffBody: document.querySelector("#player-playoff-games tbody"),
  weeklyHead: document.querySelector("#player-weekly thead"),
  weeklyBody: document.querySelector("#player-weekly tbody"),
  modal: document.getElementById("boxscore-modal"),
  boxDetails: document.getElementById("boxscore-details"),
  weeklyModal: document.getElementById("weekly-modal"),
  weeklyTitle: document.getElementById("weekly-modal-title"),
  weeklyMetrics: document.getElementById("weekly-modal-metrics"),
  weeklyGamesBody: document.getElementById("weekly-modal-games-body"),
  sumTotal: document.getElementById("sum-total"),
  sumAvgScore: document.getElementById("sum-avg-score"),
  sumAvgRank: document.getElementById("sum-avg-rank"),
  sumGp: document.getElementById("sum-gp"),
  sumRelMean: document.getElementById("sum-rel-mean"),
  sumRelMedian: document.getElementById("sum-rel-median"),
  sumWar: document.getElementById("sum-war"),
  teamValue: document.getElementById("player-team-value"),
  contractCard: document.getElementById("player-contract-card"),
  contractTeam: document.getElementById("player-contract-team"),
  contractYears: document.getElementById("player-contract-years"),
  contractTotal: document.getElementById("player-contract-total"),
  contractCapHit: document.getElementById("player-contract-cap-hit"),
  contractNotes: document.getElementById("player-contract-notes"),
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
let weeklyRowMap = new Map();
let weeklyMetaMap = new Map();
let activeWeekKey = "";
let currentRenderedTeams = [];
let currentLoadedSeason = "";
let contractRowsCache = [];
let supplementalPlayerRows = [];

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
  if (name === "Bullets") return "Storm";
  if (name === "Yetis") return "MayeDay";
  if (name === "The Future") return "Dream Team";
  return name;
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

function normalizeDateToken(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const match = text.match(/(\d{1,2})\s*\/\s*(\d{1,2})/);
  if (!match) return text.replace(/\s+/g, "");
  return `${Number(match[1])}/${Number(match[2])}`;
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

function normalizeTeamLabel(value) {
  return displayTeamName(String(value || "").replace(/\([^)]*\)/g, "").trim())
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function normalizePlayerCell(value) {
  return stripCaptainMarker(value);
}

function isPlayerCell(value) {
  return normalizePlayerCell(value).startsWith("@");
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

function isPlayerLabelRow(left, right) {
  return String(left || "").trim().toLowerCase() === "player" &&
    String(right || "").trim().toLowerCase() === "player";
}

function buildBoxScorePlayerEntry(value, points, rank) {
  return {
    player: normalizePlayerCell(value),
    isCaptain: isCaptainMarked(value),
    points: String(points || ""),
    rank: String(rank || ""),
  };
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

function formatContractValue(value) {
  const text = String(value || "").trim();
  return text || "—";
}

function findPlayerContract(rows, playerName, preferredTeams = []) {
  if (!rows || !rows.length || !playerName) {
    return null;
  }
  const aliases = getPlayerAliases(playerName);
  const preferred = new Set(
    (preferredTeams || []).map((team) => displayTeamName(team)).filter(Boolean)
  );

  const matches = rows
    .map((row) => ({
      team: displayTeamName(row[0] || ""),
      player: String(row[1] || "").trim(),
      years: String(row[2] || "").trim(),
      totalTax: String(row[3] || "").trim(),
      capHit: String(row[4] || "").trim(),
      notes: String(row[7] || "").trim(),
    }))
    .filter((entry) => matchesAnyAlias(entry.player, aliases));

  if (!matches.length) {
    return null;
  }

  const exactTeam = matches.find((entry) => preferred.has(entry.team));
  return exactTeam || matches[0];
}

function renderPlayerContract(contract) {
  if (!els.contractCard) {
    return;
  }
  if (!contract) {
    els.contractCard.hidden = true;
    return;
  }

  els.contractCard.hidden = false;
  if (els.contractTeam) {
    els.contractTeam.textContent = contract.team || "—";
  }
  if (els.contractYears) {
    els.contractYears.textContent = contract.years || "—";
  }
  if (els.contractTotal) {
    els.contractTotal.textContent = formatContractValue(contract.totalTax);
  }
  if (els.contractCapHit) {
    els.contractCapHit.textContent = formatContractValue(contract.capHit);
  }
  if (els.contractNotes) {
    const notes = String(contract.notes || "").trim();
    const capHit = String(contract.capHit || "").trim();
    const showNotes = notes && notes !== capHit;
    els.contractNotes.hidden = !showNotes;
    els.contractNotes.textContent = showNotes ? notes : "";
  }
}

async function fetchContractRows() {
  try {
    const response = await fetch(CONTRACTS_URL, { cache: "no-store" });
    if (!response.ok) {
      return [];
    }
    return parseCSV(await response.text());
  } catch (error) {
    return [];
  }
}

async function ensureBoxScoreRows(season) {
  if ((window.__boxScoreRows || []).length) {
    return window.__boxScoreRows;
  }

  if (season === "c2s3-regular") {
    const response = await fetch(BOXSCORE_CSV_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    window.__boxScoreRows = parseCSV(await response.text());
    return window.__boxScoreRows;
  }

  if (season === "c2s2-regular") {
    const response = await fetch(C2S2_REGULAR_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    const rows = parseCSV(await response.text());
    window.__boxScoreRows = sliceRange(rows, C2S2_REGULAR_RANGES.boxscore);
    return window.__boxScoreRows;
  }

  if (season === "c2s1-playoffs") {
    const response = await fetch(ARCHIVE_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    const rows = parseCSV(await response.text());
    window.__boxScoreRows = sliceRange(rows, ARCHIVE_RANGES.boxscore);
    return window.__boxScoreRows;
  }

  if (season === "career") {
    const [currentBoxRes, c2s2Res, archiveRes] = await Promise.all([
      fetch(BOXSCORE_CSV_URL, { cache: "no-store" }),
      fetch(C2S2_REGULAR_URL, { cache: "no-store" }),
      fetch(ARCHIVE_URL, { cache: "no-store" }),
    ]);
    if (!currentBoxRes.ok || !c2s2Res.ok || !archiveRes.ok) {
      throw new Error("Unable to load box scores.");
    }
    const currentBox = parseCSV(await currentBoxRes.text());
    const c2s2SheetRows = parseCSV(await c2s2Res.text());
    const archive = parseCSV(await archiveRes.text());
    window.__boxScoreRows = [
      ...currentBox,
      ...sliceRange(c2s2SheetRows, C2S2_REGULAR_RANGES.boxscore),
      ...sliceRange(archive, ARCHIVE_RANGES.boxscore),
    ];
    return window.__boxScoreRows;
  }

  window.__boxScoreRows = [];
  return window.__boxScoreRows;
}

async function findTeamForPlayer(season, playerName) {
  if (!playerName) {
    return "";
  }
  const aliases = getPlayerAliases(playerName);
  if (!aliases.length) {
    return "";
  }
  if (season === "c2s3-regular" || season === "c2s2-regular" || season === "career") {
    const rosterUrl =
      season === "c2s2-regular" ? C2S2_REGULAR_URL : "/api/sheet?name=roster";
    const response = await fetch(rosterUrl, { cache: "no-store" });
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
    return "";
  }
  if (season === "c2s1-regular" || season === "career") {
    const rosterRes = await fetch(C2S1_ROSTERS_URL, { cache: "no-store" });
    if (rosterRes.ok) {
      const rosterRows = parseCSV(await rosterRes.text());
      const matchedTeamsStrict = [];
      const matchedTeamsLoose = [];
      rosterRows.slice(1).forEach((row) => {
        const team = String(row[0] || "").trim();
        const player = String(row[1] || "").trim();
        if (!team || !player) {
          return;
        }
        if (matchesAnyAliasStrict(player, aliases)) {
          matchedTeamsStrict.push(team);
        } else if (matchesAnyAlias(player, aliases)) {
          matchedTeamsLoose.push(team);
        }
      });
      if (matchedTeamsStrict.length) {
        return matchedTeamsStrict[matchedTeamsStrict.length - 1];
      }
      if (matchedTeamsLoose.length) {
        return matchedTeamsLoose[matchedTeamsLoose.length - 1];
      }
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
  if (value === "all-time") {
    return "c2s3-regular";
  }
  if (value === "c2s3-regular" || value === "c2s2-playoffs") {
    return value;
  }
  if (
    value === "career" ||
    value === "c1s6-playoffs" ||
    value === "c1s6-regular" ||
    value === "c1s5-playoffs" ||
    value === "c1s5-regular" ||
    value === "c1s4-playoffs" ||
    value === "c1s4-regular" ||
    value === "c1s3-playoffs" ||
    value === "c1s3-regular" ||
    value === "c1s2-playoffs" ||
    value === "c1s2-regular" ||
    value === "c2s1-playoffs" ||
    value === "c2s1-regular"
  ) {
    return value;
  }
  if (value === "c2s2" || value === "c2s2-regular") {
    return "c2s2-regular";
  }
  return "c2s3-regular";
}

function getSeason() {
  const params = new URLSearchParams(window.location.search);
  const rawFromQuery = params.get("season");
  if (rawFromQuery) {
    const normalized = normalizeSeason(rawFromQuery);
    localStorage.setItem(PLAYER_SEASON_KEY, normalized);
    localStorage.setItem(
      SEASON_KEY,
      normalized === "c2s1-playoffs"
        ? "c2s1-post"
        : normalized === "c2s2-playoffs"
        ? "c2s2-playoffs"
        : normalized === "c1s6-playoffs"
        ? "c1s6-post"
        : normalized === "c1s6-regular"
        ? "c1s6-regular"
        : normalized === "c1s5-playoffs"
        ? "c1s5-post"
        : normalized === "c1s5-regular"
        ? "c1s5-regular"
        : normalized === "c1s4-playoffs"
        ? "c1s4-post"
        : normalized === "c1s4-regular"
        ? "c1s4-regular"
        : normalized === "c1s3-playoffs"
        ? "c1s3-post"
        : normalized === "c1s3-regular"
        ? "c1s3-regular"
        : normalized === "c1s2-playoffs"
        ? "c1s2-post"
        : normalized === "c1s2-regular"
        ? "c1s2-regular"
        : normalized === "c2s1-regular"
        ? "c2s1-regular"
        : normalized === "c2s2-regular"
        ? "c2s2-regular"
        : "c2s3-regular"
    );
    return normalized;
  }

  const playerSeason = localStorage.getItem(PLAYER_SEASON_KEY);
  if (playerSeason) {
    return normalizeSeason(playerSeason);
  }

  const season = localStorage.getItem(SEASON_KEY);
  if (season === "c2s1-post") {
    return "c2s1-playoffs";
  }
  if (season === "c1s3-post") {
    return "c1s3-playoffs";
  }
  if (season === "c1s6-post") {
    return "c1s6-playoffs";
  }
  if (season === "c1s4-post") {
    return "c1s4-playoffs";
  }
  if (season === "c1s5-post") {
    return "c1s5-playoffs";
  }
  if (season === "c1s2-post") {
    return "c1s2-playoffs";
  }
  if (season === "c2s1-regular") {
    return "c2s1-regular";
  }
  if (season === "c1s2-regular") {
    return "c1s2-regular";
  }
  if (season === "c1s3-regular") {
    return "c1s3-regular";
  }
  if (season === "c1s6-regular") {
    return "c1s6-regular";
  }
  if (season === "c1s4-regular") {
    return "c1s4-regular";
  }
  if (season === "c1s5-regular") {
    return "c1s5-regular";
  }
  if (season === "c2s3-regular" || season === "c2s2-playoffs") {
    return season;
  }
  if (season === "c2s2-regular" || season === "c2s2") {
    return "c2s2-regular";
  }
  return "c2s3-regular";
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
      current === "career" || current === "c2s3-regular"
        ? "c2s3-regular"
        : current === "c2s2-playoffs"
        ? "c2s2-playoffs"
        : current === "c2s2-regular"
        ? "c2s2-regular"
        : current === "c1s6-playoffs"
        ? "c1s6-post"
        : current === "c1s6-regular"
        ? "c1s6-regular"
        : current === "c1s5-playoffs"
        ? "c1s5-post"
        : current === "c1s5-regular"
        ? "c1s5-regular"
        : current === "c1s4-playoffs"
        ? "c1s4-post"
        : current === "c1s4-regular"
        ? "c1s4-regular"
        : current === "c1s3-playoffs"
        ? "c1s3-post"
        : current === "c1s3-regular"
        ? "c1s3-regular"
        : current === "c1s2-playoffs"
        ? "c1s2-post"
        : current === "c1s2-regular"
        ? "c1s2-regular"
        : current === "c2s1-playoffs"
        ? "c2s1-post"
        : current === "c2s1-regular"
        ? "c2s1-regular"
        : "c2s3-regular";
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
        : value === "c2s2-playoffs"
        ? "c2s2-playoffs"
        : value === "c1s6-playoffs"
        ? "c1s6-post"
        : value === "c1s6-regular"
        ? "c1s6-regular"
        : value === "c1s5-playoffs"
        ? "c1s5-post"
        : value === "c1s5-regular"
        ? "c1s5-regular"
        : value === "c1s4-playoffs"
        ? "c1s4-post"
        : value === "c1s4-regular"
        ? "c1s4-regular"
        : value === "c1s3-playoffs"
        ? "c1s3-post"
        : value === "c1s3-regular"
        ? "c1s3-regular"
        : value === "c1s2-playoffs"
        ? "c1s2-post"
        : value === "c1s2-regular"
        ? "c1s2-regular"
        : value === "c2s1-regular"
        ? "c2s1-regular"
        : value === "c2s2-regular"
        ? "c2s2-regular"
        : "c2s3-regular"
    );
    const params = new URLSearchParams(window.location.search);
    params.set("season", value);
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
    window.location.assign(nextUrl);
  };

  if (panelSelect) {
    panelSelect.addEventListener("change", () => onChange(panelSelect.value));
  }
  if (navSelect) {
    navSelect.addEventListener("change", () => {
      const mapped =
        navSelect.value === "c2s1-post"
          ? "c2s1-playoffs"
          : navSelect.value === "c2s2-playoffs"
          ? "c2s2-playoffs"
          : navSelect.value === "c1s6-post"
          ? "c1s6-playoffs"
          : navSelect.value === "c1s6-regular"
          ? "c1s6-regular"
          : navSelect.value === "c1s5-post"
          ? "c1s5-playoffs"
          : navSelect.value === "c1s5-regular"
          ? "c1s5-regular"
          : navSelect.value === "c1s4-post"
          ? "c1s4-playoffs"
          : navSelect.value === "c1s4-regular"
          ? "c1s4-regular"
          : navSelect.value === "c1s3-post"
          ? "c1s3-playoffs"
          : navSelect.value === "c1s3-regular"
          ? "c1s3-regular"
          : navSelect.value === "c1s2-post"
          ? "c1s2-playoffs"
          : navSelect.value === "c1s2-regular"
          ? "c1s2-regular"
          : navSelect.value === "c2s1-regular"
          ? "c2s1-regular"
          : navSelect.value === "c2s2-regular"
          ? "c2s2-regular"
          : "c2s3-regular";
      onChange(mapped);
    });
  }
}

function getTeamLogoHtml(teamName) {
  const shownTeam = displayTeamName(teamName);
  return shownTeam === "The Future" || shownTeam === "Dream Team"
    ? '<img class="player-team-logo" src="/assets/dream-team.jpg" alt="Dream Team logo" />'
    : shownTeam === "The Lions"
    ? '<img class="player-team-logo" src="/assets/the-lions.png" alt="The Lions logo" />'
    : shownTeam === "The Snipers"
    ? '<img class="player-team-logo" src="/assets/the-snipers.png" alt="The Snipers logo" />'
    : shownTeam === "The Phantoms"
    ? '<img class="player-team-logo" src="/assets/the-phantoms.png" alt="The Phantoms logo" />'
    : shownTeam === "MayeDay"
    ? '<img class="player-team-logo" src="/assets/mayeday.jpg" alt="MayeDay logo" />'
    : shownTeam === "ALEK Manoahs"
    ? '<img class="player-team-logo" src="/assets/alek-manoahs.jpg" alt="ALEK Manoahs logo" />'
    : shownTeam === "Bees"
    ? '<img class="player-team-logo" src="/assets/bees.jpg" alt="Bees logo" />'
    : shownTeam === "Broncos"
    ? '<img class="player-team-logo" src="/assets/broncos.jpg" alt="Broncos logo" />'
    : shownTeam === "Burritos"
    ? '<img class="player-team-logo" src="/assets/burritos.jpg" alt="Burritos logo" />'
    : shownTeam === "Cobras"
    ? '<img class="player-team-logo" src="/assets/cobras.png" alt="Cobras logo" />'
    : shownTeam === "Chicken Nuggets"
    ? '<img class="player-team-logo" src="/assets/chicken-nuggets.jpg" alt="Chicken Nuggets logo" />'
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
  currentRenderedTeams = [];
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
  currentRenderedTeams = uniqueTeams;
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
  window.__playerRows = rows;
  renderTableInto(els.head, els.body, rows);
}

function renderTableInto(headEl, bodyEl, rows, options = {}) {
  if (!headEl || !bodyEl) {
    return;
  }
  const rowClass = options.rowClass || "schedule-row";
  const dataKey = options.dataKey || "index";
  const includeSeason = rows.some((row) => row && row.__seasonLabel);
  const headers = includeSeason
    ? ["Season", "Date", "Team", "Score", "Rank", "Opponent"]
    : ["Date", "Team", "Score", "Rank", "Opponent"];
  headEl.innerHTML = `
    <tr>
      ${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}
    </tr>
  `;

  bodyEl.innerHTML = rows
    .map(
      (row, index) => `
        <tr class="${escapeHtml(rowClass)}" data-${escapeHtml(dataKey)}="${index}">
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

function prependTableNotice(bodyEl, message, colspan) {
  if (!bodyEl || !message) {
    return;
  }
  bodyEl.insertAdjacentHTML(
    "afterbegin",
    `<tr class="table-note-row"><td colspan="${Number(colspan) || 5}"><em>${escapeHtml(
      message
    )}</em></td></tr>`
  );
}

function renderPlayoffSupplement(rows) {
  supplementalPlayerRows = rows;
  if (!els.playoffStatsPanel || !els.playoffHead || !els.playoffBody) {
    return;
  }
  if (!rows.length) {
    els.playoffStatsPanel.hidden = true;
    els.playoffHead.innerHTML = "";
    els.playoffBody.innerHTML = "";
    return;
  }
  els.playoffStatsPanel.hidden = false;
  renderTableInto(els.playoffHead, els.playoffBody, rows, {
    rowClass: "playoff-log-row",
    dataKey: "playoffIndex",
  });
}

function dateFromRowValue(value) {
  const parsed = parseDateValue(value);
  if (parsed === Number.NEGATIVE_INFINITY) return null;
  const d = new Date(parsed);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatMonthDay(dateObj) {
  return `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
}

function getWeekBucket(dateObj, anchorYear) {
  const weekOneStart = new Date(anchorYear, 1, 23); // 2/23
  const weekOneEnd = new Date(anchorYear, 2, 2); // 3/2

  if (dateObj >= weekOneStart && dateObj <= weekOneEnd) {
    return {
      key: `W1-${anchorYear}`,
      label: "Week 1",
      range: `${formatMonthDay(weekOneStart)}-${formatMonthDay(weekOneEnd)}`,
      sortTime: weekOneStart.getTime(),
    };
  }

  const sundayStart = new Date(dateObj);
  sundayStart.setHours(0, 0, 0, 0);
  sundayStart.setDate(sundayStart.getDate() - sundayStart.getDay());
  const sundayEnd = new Date(sundayStart);
  sundayEnd.setDate(sundayEnd.getDate() + 7);

  return {
    key: `W-${sundayStart.getTime()}`,
    label: "",
    range: `${formatMonthDay(sundayStart)}-${formatMonthDay(sundayEnd)}`,
    sortTime: sundayStart.getTime(),
  };
}

function renderWeeklyKarma(rows) {
  if (!els.weeklyHead || !els.weeklyBody) return;
  weeklyRowMap = new Map();
  weeklyMetaMap = new Map();
  activeWeekKey = "";
  const includeSeason = rows.some((row) => row && row.__seasonLabel);
  const baselines = buildDailyBaselines(rows);
  const headers = includeSeason
    ? ["Season", "Week", "Range", "GP", "Weekly Karma", "Avg Karma", "REL", "WAR"]
    : ["Week", "Range", "GP", "Weekly Karma", "Avg Karma", "REL", "WAR"];
  els.weeklyHead.innerHTML = `
    <tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>
  `;

  if (!rows.length) {
    els.weeklyBody.innerHTML = `<tr><td colspan="${headers.length}">No weekly data available.</td></tr>`;
    return;
  }

  const datedRows = rows
    .map((row) => ({ row, dateObj: dateFromRowValue(row[playerColumns.date]) }))
    .filter((item) => item.dateObj);

  if (!datedRows.length) {
    els.weeklyBody.innerHTML = `<tr><td colspan="${headers.length}">No weekly data available.</td></tr>`;
    return;
  }

  const firstYear = datedRows[0].dateObj.getFullYear();
  const byBucket = new Map();

  datedRows.forEach(({ row, dateObj }) => {
    const score = parseAdjustedScore(row);
    if (score === null) return;
    const seasonLabel = String(row.__seasonLabel || "");
    const bucket = getWeekBucket(dateObj, firstYear);
    const key = `${seasonLabel}|${bucket.key}`;
    const current =
      byBucket.get(key) || {
        seasonLabel,
        bucketId: bucket.key,
        weekLabel: bucket.label,
        range: bucket.range,
        gp: 0,
        total: 0,
        sortTime: bucket.sortTime,
      };
    current.gp += 1;
    current.total += score;
    byBucket.set(key, current);
  });

  const grouped = Array.from(byBucket.values()).sort((a, b) => {
    if (a.seasonLabel !== b.seasonLabel) {
      const order = [
        "C2S3 Regular Season",
        "C2S2 Regular Season",
        "C2S1 Regular Season",
        "C2S1 Playoffs",
        "C1S6 Regular Season",
        "C1S6 Playoffs",
        "C1S5 Regular Season",
        "C1S5 Playoffs",
        "C1S4 Regular Season",
        "C1S4 Playoffs",
        "C1S3 Regular Season",
        "C1S3 Playoffs",
        "C1S2 Regular Season",
        "C1S2 Playoffs",
      ];
      const ai = order.indexOf(a.seasonLabel);
      const bi = order.indexOf(b.seasonLabel);
      if (ai !== -1 || bi !== -1) {
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      }
      return a.seasonLabel.localeCompare(b.seasonLabel);
    }
    return a.sortTime - b.sortTime;
  });

  const seasonWeekCounter = new Map();
  els.weeklyBody.innerHTML = grouped
    .map((item) => {
      const seasonKey = String(item.seasonLabel || "");
      const nextWeek = (seasonWeekCounter.get(seasonKey) || 0) + 1;
      seasonWeekCounter.set(seasonKey, nextWeek);
      const label = item.weekLabel || `Week ${nextWeek}`;
      const bucketKey = `${seasonKey}|${label}|${item.range}`;
      const bucketRows = datedRows
        .map((x) => x.row)
        .filter((row) => {
          const d = dateFromRowValue(row[playerColumns.date]);
          if (!d) return false;
          const b = getWeekBucket(d, firstYear);
          return (
            String(row.__seasonLabel || "") === seasonKey &&
            b.key === item.bucketId
          );
        });
      weeklyRowMap.set(bucketKey, bucketRows);
      weeklyMetaMap.set(bucketKey, {
        seasonLabel: item.seasonLabel,
        label,
        range: item.range,
      });
      const summary = summarizeRows(bucketRows, baselines);
      return `
        <tr class="weekly-row" data-week-key="${escapeHtml(bucketKey)}">
          ${includeSeason ? `<td>${escapeHtml(item.seasonLabel)}</td>` : ""}
          <td>${escapeHtml(label)}</td>
          <td>${escapeHtml(item.range)}</td>
          <td>${escapeHtml(String(item.gp))}</td>
          <td>${escapeHtml(String(Math.round(item.total)))}</td>
          <td>${summary.avgScore === null ? "—" : escapeHtml(summary.avgScore.toFixed(2))}</td>
          <td>${summary.relMedian === null ? "—" : escapeHtml(summary.relMedian.toFixed(3))}</td>
          <td>${summary.war === null ? "—" : escapeHtml(summary.war.toFixed(3))}</td>
        </tr>
      `;
    })
    .join("");
}

function summarizeRows(rows, baselines) {
  if (!rows.length) {
    return {
      total: null,
      avgScore: null,
      avgRank: null,
      medianRank: null,
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
  const rankValues = [];

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
      rankValues.push(rank);
    }
  });
  const sortedRanks = rankValues.slice().sort((a, b) => a - b);
  const mid = Math.floor(sortedRanks.length / 2);
  const medianRank = !sortedRanks.length
    ? null
    : sortedRanks.length % 2
      ? sortedRanks[mid]
      : (sortedRanks[mid - 1] + sortedRanks[mid]) / 2;
  return {
    total,
    avgScore: scoreGames ? total / scoreGames : null,
    avgRank: rankGames ? rankTotal / rankGames : null,
    medianRank,
    gp: scoreGames,
    relMean: relMeanGames ? relMeanSum / relMeanGames : null,
    relMedian: relMedianGames ? relMedianSum / relMedianGames : null,
    war: warTotal,
  };
}

function renderWeeklyModal(key) {
  if (!els.weeklyModal || !els.weeklyTitle || !els.weeklyMetrics || !els.weeklyGamesBody) {
    return;
  }
  const weekRows = weeklyRowMap.get(key) || [];
  const meta = weeklyMetaMap.get(key) || {};
  const allRows = window.__allPlayerRows || weekRows;
  const baselines = buildDailyBaselines(allRows);
  const summary = summarizeRows(weekRows, baselines);

  const titleParts = [];
  if (meta.seasonLabel) titleParts.push(meta.seasonLabel);
  if (meta.label) titleParts.push(meta.label);
  if (meta.range) titleParts.push(meta.range);
  els.weeklyTitle.textContent = titleParts.join(" • ") || "Weekly Breakdown";

  els.weeklyMetrics.innerHTML = `
    <div class="leader-chip">GP <span>${escapeHtml(String(summary.gp || 0))}</span></div>
    <div class="leader-chip">Avg Karma <span>${summary.avgScore === null ? "—" : escapeHtml(summary.avgScore.toFixed(2))}</span></div>
    <div class="leader-chip">REL <span>${summary.relMedian === null ? "—" : escapeHtml(summary.relMedian.toFixed(3))}</span></div>
    <div class="leader-chip">WAR <span>${summary.war === null ? "—" : escapeHtml(summary.war.toFixed(3))}</span></div>
  `;

  if (!weekRows.length) {
    els.weeklyGamesBody.innerHTML = `<tr><td colspan="5">No games for this week.</td></tr>`;
    els.weeklyModal.hidden = false;
    return;
  }

  const includeSeason = weekRows.some((row) => row && row.__seasonLabel);
  els.weeklyGamesBody.innerHTML = weekRows
    .map((row) => {
      const score = parseAdjustedScore(row);
      const teamName = displayTeamName(String(row[playerColumns.team] || "").trim());
      const opponentName = displayTeamName(String(row[playerColumns.opponent] || "").trim());
      const dateValue = String(row[playerColumns.date] || "");
      const dateToken = dateValue.includes("•")
        ? dateValue.split("•").pop().trim()
        : dateValue.trim();
      return `
        <tr class="weekly-game-row" data-date="${escapeHtml(dateToken)}" data-team="${escapeHtml(teamName)}" data-opponent="${escapeHtml(opponentName)}">
          ${includeSeason ? `<td>${escapeHtml(row.__seasonLabel || "")}</td>` : ""}
          <td>${escapeHtml(row[playerColumns.date] || "")}</td>
          <td><a data-team-link="true" href="team.html?team=${encodeURIComponent(teamName)}">${escapeHtml(teamName)}</a></td>
          <td><a data-team-link="true" href="team.html?team=${encodeURIComponent(opponentName)}">${escapeHtml(opponentName)}</a></td>
          <td>${score === null ? "—" : escapeHtml(score.toFixed(1).replace(/\\.0$/, ""))}</td>
          <td>${escapeHtml(row[playerColumns.rank] || "")}</td>
        </tr>
      `;
    })
    .join("");

  const head = document.querySelector("#weekly-modal-games thead");
  if (head) {
    head.innerHTML = `
      <tr>
        ${includeSeason ? "<th>Season</th>" : ""}
        <th>Date</th>
        <th>Team</th>
        <th>Opponent</th>
        <th>Score</th>
        <th>Rank</th>
      </tr>
    `;
  }

  els.weeklyModal.hidden = false;
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

  const seasonOrder = [
    "C2S3 Regular Season",
    "C2S2 Regular Season",
    "C2S1 Regular Season",
    "C2S1 Playoffs",
    "C1S6 Regular Season",
    "C1S6 Playoffs",
    "C1S5 Regular Season",
    "C1S5 Playoffs",
    "C1S4 Regular Season",
    "C1S4 Playoffs",
    "C1S3 Regular Season",
    "C1S3 Playoffs",
    "C1S2 Regular Season",
    "C1S2 Playoffs",
  ];
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
  const shortSeasonLabel = (value) => {
    const text = String(value || "");
    if (text === "C2S3 Regular Season") return "C2S3";
    if (text === "C2S2 Regular Season") return "C2S2";
    if (text === "C2S1 Regular Season") return "C2S1";
    if (text === "C2S1 Playoffs") return "C2S1 Post";
    if (text === "C1S6 Regular Season") return "C1S6";
    if (text === "C1S6 Playoffs") return "C1S6 Post";
    if (text === "C1S5 Regular Season") return "C1S5";
    if (text === "C1S5 Playoffs") return "C1S5 Post";
    if (text === "C1S4 Regular Season") return "C1S4";
    if (text === "C1S4 Playoffs") return "C1S4 Post";
    if (text === "C1S3 Regular Season") return "C1S3";
    if (text === "C1S3 Playoffs") return "C1S3 Post";
    if (text === "C1S2 Regular Season") return "C1S2";
    if (text === "C1S2 Playoffs") return "C1S2 Post";
    return text;
  };
  const renderTeamCell = (team) =>
    `<a class="leader-team-link career-team-link" href="team.html?team=${encodeURIComponent(team)}">${getTeamLogoHtml(team)}<span>${escapeHtml(team)}</span></a>`;

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
      const teamRowsHtml = teamSummaries
        .map(
          ({ team, summary }) => `
            <tr class="career-data-row">
              <td class="career-season-cell">${escapeHtml(shortSeasonLabel(seasonLabel))}</td>
              <td>${renderTeamCell(team)}</td>
              <td>${escapeHtml(String(summary.gp || 0))}</td>
              <td>${renderStat(summary.relMedian, 3)}</td>
              <td>${renderStat(summary.war, 3)}</td>
              <td>${renderStat(summary.medianRank, 0)}</td>
              <td>${renderStat(summary.avgRank, 0)}</td>
            </tr>
          `
        )
        .join("");

      return teamRowsHtml;
    })
    .join("");

  const careerCombined = summarizeRows(rows, baselines);

  els.careerTeamBreakdown.hidden = false;
  els.careerTeamBreakdown.innerHTML = `
    <div class="career-breakdown-title">Career Snapshot</div>
    <div class="table-wrap">
      <table class="career-breakdown-table">
        <thead>
          <tr>
            <th>Season</th>
            <th>Team</th>
            <th>GP</th>
            <th>REL</th>
            <th>WAR</th>
            <th>Med Rank</th>
            <th>Mean Rank</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr class="career-combined-row">
            <td><strong>${escapeHtml(String(orderedSeasons.length))} seasons</strong></td>
            <td><strong>Career</strong></td>
            <td>${escapeHtml(String(careerCombined.gp || 0))}</td>
            <td>${renderStat(careerCombined.relMedian, 3)}</td>
            <td>${renderStat(careerCombined.war, 3)}</td>
            <td>${renderStat(careerCombined.medianRank, 0)}</td>
            <td>${renderStat(careerCombined.avgRank, 0)}</td>
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
      { key: "C2S2", range: "O4:P15" },
    ];
    const championMap = [
      { key: "C1S2", range: "C15:D24" },
      { key: "C1S3", range: "E15:F28" },
      { key: "C1S4", range: "G16:H27" },
      { key: "C1S5", range: "I16:J28" },
      { key: "C1S6", range: "K16:L27" },
      { key: "C2S1", range: "M16:N29" },
      { key: "C2S2", range: "O16:P29", rosterOnly: true },
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
        if (season.rosterOnly) {
          if (
            !label ||
            /^C\d+S\d+/i.test(label) ||
            /^GM\b/i.test(label)
          ) {
            return;
          }
          if (matchesName(label, target)) {
            found.push({
              player: playerName,
              season: season.key,
              award: "Champion",
            });
          }
          return;
        }
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
  currentLoadedSeason = getSeason();
  window.__boxScoreRows = [];
  supplementalPlayerRows = [];
  renderPlayoffSupplement([]);
  const overridesPromise = loadPlayerOverrides();
  const contractPromise = fetchContractRows();
  const initialDisplayName = playerName || "Player";
  els.name.textContent = initialDisplayName;
  if (els.sub) {
    els.sub.textContent = initialDisplayName
      ? initialDisplayName
      : "Missing player name.";
  }

  contractRowsCache = await contractPromise;
  const earlyContract = findPlayerContract(contractRowsCache, playerName, []);
  if (earlyContract && earlyContract.team) {
    renderPlayerTeam(earlyContract.team);
  }
  renderPlayerContract(earlyContract);

  await overridesPromise;
  const displayName =
    playerNameOverrides.get(normalizePlayerKey(playerName)) || playerName;
  els.name.textContent = displayName || "Player";
  if (els.sub) {
    els.sub.textContent = displayName
      ? displayName
      : "Missing player name.";
  }

  if (playerName.toUpperCase().startsWith("GM")) {
    renderTable([]);
    renderWeeklyKarma([]);
    updateSummary([]);
    els.body.innerHTML = `<tr><td>No stats for GM entries.</td></tr>`;
    renderAwards([]);
    return;
  }

  try {
    const season = getSeason();
    currentLoadedSeason = season;
    let dataRows = [];
    let supplementalRows = [];
    let contractRows = contractRowsCache;
    if (season === "c2s3-regular" || season === "c2s2-playoffs") {
      const [playerRes, contractRes] = await Promise.all([
        fetch(PLAYER_STATS_URL, { cache: "no-store" }),
        fetch(CONTRACTS_URL, { cache: "no-store" }),
      ]);
      if (!playerRes.ok) {
        throw new Error(`Fetch failed: ${playerRes.status}`);
      }
      contractRows = contractRes.ok ? parseCSV(await contractRes.text()) : [];
      contractRowsCache = contractRows;
      const rows = parseCSV(await playerRes.text());
      if (!rows.length) {
        throw new Error("No data found.");
      }
      playerColumns = detectPlayerColumns(rows[0] || []);
      dataRows = rows.slice(1);
    } else if (season === "c2s2-regular") {
      const [playerRes, contractRes] = await Promise.all([
        fetch(C2S2_REGULAR_URL, { cache: "no-store" }),
        fetch(CONTRACTS_URL, { cache: "no-store" }),
      ]);
      if (!playerRes.ok) {
        throw new Error(`Fetch failed: ${playerRes.status}`);
      }
      contractRows = contractRes.ok ? parseCSV(await contractRes.text()) : [];
      contractRowsCache = contractRows;
      const rows = parseCSV(await playerRes.text());
      if (!rows.length) {
        throw new Error("No data found.");
      }
      const playerSlice = sliceRange(rows, C2S2_REGULAR_RANGES.player_stats);
      playerColumns = detectPlayerColumns(playerSlice[0] || []);
      dataRows = playerSlice.slice(1);
    } else if (season === "career") {
      const [currentPlayerRes, c2s2Res, archiveRes, contractRes] = await Promise.all([
        fetch(PLAYER_STATS_URL, { cache: "no-store" }),
        fetch(C2S2_REGULAR_URL, { cache: "no-store" }),
        fetch(ARCHIVE_URL, { cache: "no-store" }),
        fetch(CONTRACTS_URL, { cache: "no-store" }),
      ]);
      if (!currentPlayerRes.ok) {
        throw new Error(`Fetch failed: ${currentPlayerRes.status}`);
      }
      if (!c2s2Res.ok) {
        throw new Error(`Fetch failed: ${c2s2Res.status}`);
      }
      if (!archiveRes.ok) {
        throw new Error(`Fetch failed: ${archiveRes.status}`);
      }
      const [c1s2Res, c1s3Res, c1s4Res, c1s5Res, c1s6Res] = await Promise.all([
        fetch(C1S2_PLAYER_STATS_URL, { cache: "no-store" }),
        fetch(C1S3_PLAYER_STATS_URL, { cache: "no-store" }),
        fetch(C1S4_PLAYER_STATS_URL, { cache: "no-store" }),
        fetch(C1S5_PLAYER_STATS_URL, { cache: "no-store" }),
        fetch(C1S6_PLAYER_STATS_URL, { cache: "no-store" }),
      ]);
      contractRows = contractRes.ok ? parseCSV(await contractRes.text()) : [];
      contractRowsCache = contractRows;
      const currentRows = parseCSV(await currentPlayerRes.text());
      const c2s2SheetRows = parseCSV(await c2s2Res.text());
      const archive = parseCSV(await archiveRes.text());
      const c1s2Rows = c1s2Res.ok ? parseCSV(await c1s2Res.text()) : [];
      const c1s3Rows = c1s3Res.ok ? parseCSV(await c1s3Res.text()) : [];
      const c1s4Rows = c1s4Res.ok ? parseCSV(await c1s4Res.text()) : [];
      const c1s5Rows = c1s5Res.ok ? parseCSV(await c1s5Res.text()) : [];
      const c1s6Rows = c1s6Res.ok ? parseCSV(await c1s6Res.text()) : [];
      const c2s2Rows = sliceRange(c2s2SheetRows, C2S2_REGULAR_RANGES.player_stats);
      const c2s1PlayoffRows = sliceRange(archive, ARCHIVE_RANGES.player_stats);

      const currentHeader = currentRows[0] || [];
      const c2s2Header = c2s2Rows[0] || [];
      const c2s1Header = c2s1PlayoffRows[0] || [];
      const c1s2Header = c1s2Rows[0] || [];
      const c1s3Header = c1s3Rows[0] || [];
      const c1s4Header = c1s4Rows[0] || [];
      const c1s5Header = c1s5Rows[0] || [];
      const c1s6Header = c1s6Rows[0] || [];
      playerColumns = detectPlayerColumns(
        currentHeader.length
          ? currentHeader
          : c2s2Header.length
          ? c2s2Header
          : c1s6Header.length
          ? c1s6Header
          : c1s5Header.length
          ? c1s5Header
          : c1s4Header.length
          ? c1s4Header
          : c1s3Header.length
          ? c1s3Header
          : c1s2Header.length
          ? c1s2Header
          : c2s1Header
      );

      const annotate = (rows, label) =>
        rows.map((row) => {
          const copy = [...row];
          copy.__seasonLabel = label;
          return copy;
        });

      dataRows = [
        ...annotate(currentRows.slice(1), "C2S3 Regular Season"),
        ...annotate(c2s2Rows.slice(1), "C2S2 Regular Season"),
        ...annotate(c1s6Rows.slice(1), "C1S6 Regular Season"),
        ...annotate(c1s5Rows.slice(1), "C1S5 Regular Season"),
        ...annotate(c1s4Rows.slice(1), "C1S4 Regular Season"),
        ...annotate(c1s3Rows.slice(1), "C1S3 Regular Season"),
        ...annotate(c1s2Rows.slice(1), "C1S2 Regular Season"),
        ...annotate(c2s1PlayoffRows.slice(1), "C2S1 Playoffs"),
      ];
    } else if (season === "c2s1-playoffs") {
      const [response, contractRes] = await Promise.all([
        fetch(ARCHIVE_URL, { cache: "no-store" }),
        fetch(CONTRACTS_URL, { cache: "no-store" }),
      ]);
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      contractRows = contractRes.ok ? parseCSV(await contractRes.text()) : [];
      contractRowsCache = contractRows;
      const archive = parseCSV(await response.text());
      const sliced = sliceRange(archive, ARCHIVE_RANGES.player_stats);
      playerColumns = detectPlayerColumns(sliced[0] || []);
      dataRows = sliced.slice(1);
    } else if (season === "c1s2-regular" || season === "c1s2-playoffs") {
      const [response, contractRes] = await Promise.all([
        fetch(C1S2_PLAYER_STATS_URL, { cache: "no-store" }),
        fetch(CONTRACTS_URL, { cache: "no-store" }),
      ]);
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      contractRows = contractRes.ok ? parseCSV(await contractRes.text()) : [];
      contractRowsCache = contractRows;
      const rows = parseCSV(await response.text());
      playerColumns = detectPlayerColumns(rows[0] || []);
      dataRows = rows.slice(1);
    } else if (season === "c1s6-regular" || season === "c1s6-playoffs") {
      const [response, contractRes] = await Promise.all([
        fetch(C1S6_PLAYER_STATS_URL, { cache: "no-store" }),
        fetch(CONTRACTS_URL, { cache: "no-store" }),
      ]);
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      contractRows = contractRes.ok ? parseCSV(await contractRes.text()) : [];
      contractRowsCache = contractRows;
      const rows = parseCSV(await response.text());
      playerColumns = detectPlayerColumns(rows[0] || []);
      dataRows = rows.slice(1);
    } else if (season === "c1s5-regular" || season === "c1s5-playoffs") {
      const [response, contractRes] = await Promise.all([
        fetch(C1S5_PLAYER_STATS_URL, { cache: "no-store" }),
        fetch(CONTRACTS_URL, { cache: "no-store" }),
      ]);
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      contractRows = contractRes.ok ? parseCSV(await contractRes.text()) : [];
      contractRowsCache = contractRows;
      const rows = parseCSV(await response.text());
      playerColumns = detectPlayerColumns(rows[0] || []);
      dataRows = rows.slice(1);
    } else if (season === "c1s4-regular" || season === "c1s4-playoffs") {
      const [response, contractRes] = await Promise.all([
        fetch(C1S4_PLAYER_STATS_URL, { cache: "no-store" }),
        fetch(CONTRACTS_URL, { cache: "no-store" }),
      ]);
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      contractRows = contractRes.ok ? parseCSV(await contractRes.text()) : [];
      contractRowsCache = contractRows;
      const rows = parseCSV(await response.text());
      playerColumns = detectPlayerColumns(rows[0] || []);
      dataRows = rows.slice(1);
    } else if (season === "c1s3-regular" || season === "c1s3-playoffs") {
      const [response, contractRes] = await Promise.all([
        fetch(C1S3_PLAYER_STATS_URL, { cache: "no-store" }),
        fetch(CONTRACTS_URL, { cache: "no-store" }),
      ]);
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      contractRows = contractRes.ok ? parseCSV(await contractRes.text()) : [];
      contractRowsCache = contractRows;
      const rows = parseCSV(await response.text());
      playerColumns = detectPlayerColumns(rows[0] || []);
      dataRows = rows.slice(1);
    } else {
      dataRows = [];
    }
    const aliases = getPlayerAliases(playerName);
    const filtered = playerName
      ? dataRows.filter(
          (row) => matchesAnyAlias(row[playerColumns.player], aliases)
        )
      : [];
    window.__allPlayerRows = filtered;

    const baselines = buildDailyBaselines(dataRows);
    renderLeagueRanks(dataRows, playerName);
    if (season === "c2s1-regular") {
      els.body.innerHTML = `<tr><td>No stats available for C2S1 Regular Season.</td></tr>`;
      const [archiveRes] = await Promise.all([
        fetch(ARCHIVE_URL, { cache: "no-store" }),
      ]);
      if (archiveRes.ok) {
        const archiveRows = parseCSV(await archiveRes.text());
        const playoffSlice = sliceRange(archiveRows, ARCHIVE_RANGES.player_stats);
        const playoffColumns = detectPlayerColumns(playoffSlice[0] || []);
        supplementalRows = playoffSlice.slice(1).map((row) => {
          const copy = [...row];
          copy.__boxScoreSeason = "c2s1-playoffs";
          return copy;
        });
        const playoffFiltered = playerName
          ? supplementalRows.filter((row) => matchesAnyAlias(row[playoffColumns.player], aliases))
          : [];
        playerColumns = playoffColumns;
        renderPlayoffSupplement(playoffFiltered);
      } else {
        renderPlayoffSupplement([]);
      }
      renderWeeklyKarma([]);
      updateSummary([], baselines);
      renderCareerTeamBreakdown([], baselines, season);
      const teamName = await findTeamForPlayer(season, playerName);
      renderPlayerTeam(teamName);
    } else {
      if (season === "career") {
        const playoffRows = filtered
          .filter((row) => String(row.__seasonLabel || "") === "C2S1 Playoffs")
          .map((row) => {
            const copy = [...row];
            copy.__boxScoreSeason = "c2s1-playoffs";
            return copy;
          });
        const regularRows = filtered.filter(
          (row) => String(row.__seasonLabel || "") !== "C2S1 Playoffs"
        );
        renderPlayoffSupplement(playoffRows);
        renderTable(regularRows);
      } else {
        renderPlayoffSupplement([]);
        renderTable(filtered);
      }
      if ((season === "c2s3-regular" || season === "c2s2-playoffs") && !filtered.length) {
        els.body.innerHTML = `<tr><td colspan="5">No games played.</td></tr>`;
      } else if (season === "c1s6-regular" || season === "c1s6-playoffs") {
        els.body.innerHTML =
          '<tr><td colspan="5">No player stats are available yet for Chapter 1 S6.</td></tr>';
      } else if (season === "c1s5-regular" || season === "c1s5-playoffs") {
        els.body.innerHTML =
          '<tr><td colspan="5">No player stats are available yet for Chapter 1 S5.</td></tr>';
      } else if (season === "c1s4-regular" || season === "c1s4-playoffs") {
        els.body.innerHTML =
          '<tr><td colspan="5">No player stats are available yet for Chapter 1 S4.</td></tr>';
      } else if (season === "c1s3-regular" || season === "c1s3-playoffs") {
        if (!filtered.length) {
          els.body.innerHTML =
            '<tr><td colspan="5">No recorded C1S3 stats found for this player.</td></tr>';
        } else {
          prependTableNotice(
            els.body,
            "Partial C1S3 data only. Some stats were not recorded.",
            5
          );
        }
      } else if (season === "c1s2-regular" || season === "c1s2-playoffs") {
        if (!filtered.length) {
          els.body.innerHTML =
            '<tr><td colspan="5">No recorded C1S2 stats found for this player.</td></tr>';
        } else {
          prependTableNotice(
            els.body,
            "Partial C1S2 data only. Some stats were not recorded.",
            5
          );
        }
      }
      renderWeeklyKarma(
        season === "c1s2-regular" ||
          season === "c1s2-playoffs" ||
          season === "c1s6-regular" ||
          season === "c1s6-playoffs" ||
          season === "c1s5-regular" ||
          season === "c1s5-playoffs" ||
          season === "c1s4-regular" ||
          season === "c1s4-playoffs" ||
          season === "c1s3-regular" ||
          season === "c1s3-playoffs"
          ? []
          : filtered
      );
      updateSummary(filtered, baselines);
      renderCareerTeamBreakdown(filtered, baselines, season);
      const teamsFromStats = getTeamsFromRows(filtered);
      if (season === "career") {
        const currentTeam = await findTeamForPlayer("c2s3-regular", playerName);
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
      } else if (
        season === "c2s3-regular" ||
        season === "c2s2-playoffs" ||
        season === "c2s2-regular"
      ) {
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
    const playerContract = findPlayerContract(contractRows, playerName, currentRenderedTeams);
    if (!currentRenderedTeams.length && playerContract && playerContract.team) {
      renderPlayerTeam(playerContract.team);
    }
    renderPlayerContract(playerContract);
    await loadPlayerTransactions(playerName, season);
    updateLastUpdated();
    loadAwards(playerName);
  } catch (error) {
    els.body.innerHTML = `<tr><td>${escapeHtml(error.message)}</td></tr>`;
    renderWeeklyKarma([]);
    renderLeagueRanks([], playerName);
  }
}

function renderBoxScore(boxScore) {
  if (!boxScore) {
    return;
  }
  const formatPlayerDisplay = (player) =>
    player && player.isCaptain ? `${player.player} (C)` : String(player?.player || "");
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
            )}">${escapeHtml(formatPlayerDisplay(row))}</a>
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

function buildBoxScore(dateToken, teamName, opponent) {
  const rows = window.__boxScoreRows || [];
  if (!rows.length) {
    return null;
  }
  const opponentName = opponent;
  const targetDate = normalizeDateToken(dateToken);
  const isDateRow = (row) => {
    const a = String(row[0] || "");
    const b = String(row[1] || "");
    return (
      normalizeDateToken(a).includes(targetDate) ||
      normalizeDateToken(b).includes(targetDate)
    );
  };

  const matchIndex = rows.findIndex(isDateRow);
  if (matchIndex === -1) {
    return null;
  }
  let dayEnd = rows.length;
  for (let i = matchIndex + 1; i < rows.length; i += 1) {
    if (isDateRow(rows[i])) {
      dayEnd = i;
      break;
    }
  }

  const dayRows = rows.slice(matchIndex + 1, dayEnd);
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

  const normalizedTeam1 = normalizeTeamLabel(teamName);
  const normalizedTeam2 = normalizeTeamLabel(opponentName);
  const selectedBlock = blocks.find((block) => {
    const header = block[0] || [];
    const h1 = normalizeTeamLabel(parseTeamHeader(header[0]).name);
    const h2 = normalizeTeamLabel(parseTeamHeader(header[getRightNameCol(header)]).name);
    const exact =
      normalizedTeam1 &&
      normalizedTeam2 &&
      ((h1 === normalizedTeam1 && h2 === normalizedTeam2) ||
        (h1 === normalizedTeam2 && h2 === normalizedTeam1));
    const fuzzy =
      normalizedTeam2 &&
      (`${h1} ${h2}`.includes(normalizedTeam2) ||
        `${h2} ${h1}`.includes(normalizedTeam2));
    return exact || fuzzy;
  });

  if (!selectedBlock) {
    return null;
  }

  const team1Rows = selectedBlock.filter((row) => String(row[0] || "").trim() !== "");
  const team2Rows = selectedBlock.filter(
    (row) => String(row[getRightNameCol(row)] || "").trim() !== ""
  );

  const team1Header = team1Rows.length ? team1Rows[0][0] : teamName;
  const team2Header = team2Rows.length
    ? team2Rows[0][getRightNameCol(team2Rows[0])]
    : opponentName;

  return {
    dateLabel: `League Day: ${dateToken}`,
    team1Name: team1Header,
    team2Name: team2Header,
    team1: team1Rows
      .slice(1)
      .map((row) => buildBoxScorePlayerEntry(row[0], row[1], row[2]))
      .filter((row) => row.player),
    team2: team2Rows
      .slice(1)
      .map((row) =>
        buildBoxScorePlayerEntry(
          row[getRightNameCol(row)],
          row[getRightPointsCol(row)],
          row[getRightRankCol(row)]
        )
      )
      .filter((row) => row.player),
  };
}

els.body.addEventListener("click", async (event) => {
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
  const teamName = String(row[playerColumns.team] || "").trim();
  const dateValue = String(row[playerColumns.date] || "").trim();
  const dateToken = dateValue.includes("•")
    ? dateValue.split("•").pop().trim()
    : dateValue;
  try {
    await ensureBoxScoreRows(currentLoadedSeason || getSeason());
  } catch (error) {
    els.boxDetails.innerHTML = `<div class=\"boxscore-empty\">No stats available.</div>`;
    els.modal.hidden = false;
    return;
  }
  const boxScore = buildBoxScore(dateToken, teamName, opponent);
  if (!boxScore) {
    els.boxDetails.innerHTML = `<div class=\"boxscore-empty\">No stats available.</div>`;
    els.modal.hidden = false;
    return;
  }
  renderBoxScore(boxScore);
});

if (els.playoffBody) {
  els.playoffBody.addEventListener("click", async (event) => {
    const rowEl = event.target.closest(".playoff-log-row");
    if (!rowEl) {
      return;
    }
    const index = Number(rowEl.dataset.playoffIndex);
    const row = supplementalPlayerRows[index];
    if (!row) {
      return;
    }
    const opponent = String(row[playerColumns.opponent] || "").trim();
    const teamName = String(row[playerColumns.team] || "").trim();
    const dateValue = String(row[playerColumns.date] || "").trim();
    const dateToken = dateValue.includes("•")
      ? dateValue.split("•").pop().trim()
      : dateValue;
    const boxScoreSeason = row.__boxScoreSeason || currentLoadedSeason || getSeason();
    window.__boxScoreRows = [];
    try {
      await ensureBoxScoreRows(boxScoreSeason);
    } catch (error) {
      els.boxDetails.innerHTML = `<div class=\"boxscore-empty\">No stats available.</div>`;
      els.modal.hidden = false;
      return;
    }
    const boxScore = buildBoxScore(dateToken, teamName, opponent);
    if (!boxScore) {
      els.boxDetails.innerHTML = `<div class=\"boxscore-empty\">No stats available.</div>`;
      els.modal.hidden = false;
      return;
    }
    renderBoxScore(boxScore);
  });
}

if (els.weeklyBody) {
  els.weeklyBody.addEventListener("click", (event) => {
    const row = event.target.closest(".weekly-row");
    if (!row) return;
    const key = String(row.dataset.weekKey || "");
    if (!key) return;
    els.weeklyBody
      .querySelectorAll(".weekly-row")
      .forEach((r) => r.classList.toggle("active", r === row));
    activeWeekKey = key;
    renderWeeklyModal(key);
  });
}

if (els.weeklyGamesBody) {
  els.weeklyGamesBody.addEventListener("click", async (event) => {
    if (event.target.closest("[data-team-link=\"true\"]")) {
      return;
    }
    const row = event.target.closest(".weekly-game-row");
    if (!row) return;
    const dateToken = String(row.dataset.date || "").trim();
    const teamName = String(row.dataset.team || "").trim();
    const opponent = String(row.dataset.opponent || "").trim();
    if (!dateToken) return;
    try {
      await ensureBoxScoreRows(currentLoadedSeason || getSeason());
    } catch (error) {
      els.weeklyModal.hidden = true;
      els.boxDetails.innerHTML = `<div class=\"boxscore-empty\">No stats available.</div>`;
      els.modal.hidden = false;
      return;
    }
    const boxScore = buildBoxScore(dateToken, teamName, opponent);
    els.weeklyModal.hidden = true;
    if (!boxScore) {
      els.boxDetails.innerHTML = `<div class=\"boxscore-empty\">No stats available.</div>`;
      els.modal.hidden = false;
      return;
    }
    renderBoxScore(boxScore);
  });
}

document.addEventListener("click", (event) => {
  if (event.target.matches("[data-close=\"true\"]")) {
    els.modal.hidden = true;
    if (els.weeklyModal) {
      els.weeklyModal.hidden = true;
    }
  }
});

els.summaryCards.forEach((card) => {
  card.addEventListener("click", () => {
    const metric = card.dataset.metric || "avg_score";
    const season = getSeason();
    const leaderboardSeason = season === "career" ? "c2s3-regular" : season;
    const params = new URLSearchParams({
      metric,
      season: leaderboardSeason,
    });
    window.location.href = `player.html?${params.toString()}`;
  });
});

initSeasonSelect();
loadPlayer();
