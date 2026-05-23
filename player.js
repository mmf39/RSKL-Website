const PLAYER_STATS_URL = "/api/sheet?name=player-stats";
const ARCHIVE_URL = "/api/sheet?name=archive";
const C2S2_REGULAR_URL = "/api/sheet?name=c2s2-regular";
const C2S1_ROSTERS_URL = "/assets/data/c2s1-rosters.csv";
const C1S2_ROSTERS_URL = "/assets/data/c1s2-rosters.csv";
const C1S3_ROSTERS_URL = "/assets/data/c1s3-rosters.csv";
const C1S4_PLAYER_STATS_URL = "/assets/data/c1s4-player-stats.csv";
const C1S5_ROSTERS_URL = "/assets/data/c1s5-rosters.csv";
const C1S6_ROSTERS_URL = "/assets/data/c1s6-rosters.csv";
const PLAYER_SEASON_KEY = "playerSeason";
const SEASON_KEY = "season";
const SUPABASE_PLAYERS_URL = "https://wbbkjikdxpywfeyenbhs.supabase.co/rest/v1/players?select=player_tag,display_name";
const SUPABASE_API_KEY = "sb_publishable_P_4Gvh9rXEUrHS_-VZu6uw_As3f4CK3";

const els = {
  lastUpdated: document.getElementById("last-updated"),
  search: document.getElementById("player-search"),
  minGp: document.getElementById("player-min-gp"),
  results: document.getElementById("player-results"),
  filter: document.getElementById("player-filter"),
};

let playerRows = [];
let leaderboardRows = [];
let playerNameOverrides = new Map();
let rookieSeasonCache = new Map();
const RISING_STARS_HANDLES = new Set([
  "fullofopps",
  "xyz",
  "jd3",
  "vampire",
  "florida_sportsfan",
  "osboti",
]);
const ROOKIE_SEASON_ORDER = [
  "c1s2-regular",
  "c1s3-regular",
  "c1s4-regular",
  "c1s5-regular",
  "c1s6-regular",
  "c2s1-regular",
  "c2s2-regular",
  "c2s3-regular",
];
const ROOKIE_ROSTER_SOURCES = {
  "c1s2-regular": C1S2_ROSTERS_URL,
  "c1s3-regular": C1S3_ROSTERS_URL,
  "c1s4-regular": C1S4_PLAYER_STATS_URL,
  "c1s5-regular": C1S5_ROSTERS_URL,
  "c1s6-regular": C1S6_ROSTERS_URL,
  "c2s1-regular": C2S1_ROSTERS_URL,
  "c2s2-regular": PLAYER_STATS_URL,
  "c2s3-regular": PLAYER_STATS_URL,
};
let playerColumns = {
  date: 0,
  team: 1,
  player: 2,
  score: 3,
  rank: 4,
  opponent: 5,
};

const ARCHIVE_RANGES = {
  player_stats: "A45:F117",
};
const C2S2_REGULAR_RANGES = {
  player_stats: "A151:G1150",
};

function getPlayerSeason() {
  const season = localStorage.getItem(SEASON_KEY);
  if (season === "all-time") {
    const playerSeason = localStorage.getItem(PLAYER_SEASON_KEY);
    return playerSeason || "c2s2-regular";
  }
  if (season === "c2s3-regular") {
    return "c2s3-regular";
  }
  if (season === "c2s2-playoffs") {
    return "c2s2-playoffs";
  }
  if (season === "c2s2-regular" || season === "c2s2") {
    return "c2s2-regular";
  }
  if (season === "c2s1-post") {
    return "c2s1-playoffs";
  }
  if (season === "c2s1-regular") {
    return "c2s1-regular";
  }
  if (season === "c1s2-post") {
    return "c1s2-playoffs";
  }
  if (season === "c1s2-regular") {
    return "c1s2-regular";
  }
  if (season === "c1s3-post") {
    return "c1s3-playoffs";
  }
  if (season === "c1s3-regular") {
    return "c1s3-regular";
  }
  if (season === "c1s4-post") {
    return "c1s4-playoffs";
  }
  if (season === "c1s4-regular") {
    return "c1s4-regular";
  }
  if (season === "c1s5-post") {
    return "c1s5-playoffs";
  }
  if (season === "c1s5-regular") {
    return "c1s5-regular";
  }
  if (season === "c1s6-post") {
    return "c1s6-playoffs";
  }
  if (season === "c1s6-regular") {
    return "c1s6-regular";
  }
  const playerSeason = localStorage.getItem(PLAYER_SEASON_KEY);
  if (playerSeason) {
    return playerSeason;
  }
  return "c2s2-regular";
}

function getLeaderboardParams() {
  const params = new URLSearchParams(window.location.search);
  const metric = params.get("metric") || "";
  const player = params.get("player") || "";
  const season = params.get("season") || "";
  return { metric, player, season };
}

function applyLeaderboardParams() {
  const { metric, player, season } = getLeaderboardParams();
  const allowedMetrics = new Set([
    "avg_score",
    "total_score",
    "avg_rank",
    "rel_median",
    "rel_mean",
    "war",
    "gp",
  ]);
  const allowedSeasons = new Set([
    "c2s3-regular",
    "c2s2-playoffs",
    "c2s2-regular",
    "c1s6-playoffs",
    "c1s6-regular",
    "c1s5-playoffs",
    "c1s5-regular",
    "c1s4-playoffs",
    "c1s4-regular",
    "c1s3-playoffs",
    "c1s3-regular",
    "c1s2-playoffs",
    "c1s2-regular",
    "c2s1-playoffs",
    "c2s1-regular",
  ]);
  if (allowedMetrics.has(metric) && els.filter) {
    els.filter.value = metric;
  }
  if (player && els.search) {
    els.search.value = player;
  }
  if (allowedSeasons.has(season)) {
    localStorage.setItem(PLAYER_SEASON_KEY, season);
    localStorage.setItem(
      SEASON_KEY,
      season === "c2s3-regular"
        ? "c2s3-regular"
        : season === "c2s2-playoffs"
        ? "c2s2-playoffs"
        : season === "c1s6-playoffs"
        ? "c1s6-post"
        : season === "c1s6-regular"
        ? "c1s6-regular"
        : season === "c1s5-playoffs"
        ? "c1s5-post"
        : season === "c1s5-regular"
        ? "c1s5-regular"
        : season === "c1s4-playoffs"
        ? "c1s4-post"
        : season === "c1s4-regular"
        ? "c1s4-regular"
        : season === "c1s3-playoffs"
        ? "c1s3-post"
        : season === "c1s3-regular"
        ? "c1s3-regular"
        : season === "c1s2-playoffs"
        ? "c1s2-post"
        : season === "c1s2-regular"
        ? "c1s2-regular"
        : season === "c2s1-playoffs"
        ? "c2s1-post"
        : season === "c2s1-regular"
        ? "c2s1-regular"
        : "c2s2-regular"
    );
  }
}

function initPlayerSeasonSelect() {
  const panelSelect = document.getElementById("player-season-select");
  const navSelect = document.getElementById("season-select");
  const current = getPlayerSeason();

  if (panelSelect) {
    panelSelect.value = current;
  }
  if (navSelect) {
    navSelect.value =
      current === "c2s3-regular"
        ? "c2s3-regular"
        : current === "c2s2-playoffs"
        ? "c2s2-playoffs"
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
        : "c2s2-regular";
  }

  if (!localStorage.getItem(PLAYER_SEASON_KEY)) {
    localStorage.setItem(PLAYER_SEASON_KEY, current);
  }
  if (!localStorage.getItem(SEASON_KEY)) {
    localStorage.setItem(
      SEASON_KEY,
      current === "c2s3-regular"
        ? "c2s3-regular"
        : current === "c2s2-playoffs"
        ? "c2s2-playoffs"
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
        : "c2s2-regular"
    );
  }

  const onChange = (value) => {
    localStorage.setItem(PLAYER_SEASON_KEY, value);
    localStorage.setItem(
      SEASON_KEY,
      value === "c2s3-regular"
        ? "c2s3-regular"
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
        : value === "c2s1-playoffs"
        ? "c2s1-post"
        : value === "c2s1-regular"
        ? "c2s1-regular"
        : "c2s2-regular"
    );
    location.reload();
  };

  if (panelSelect) {
    panelSelect.addEventListener("change", () => onChange(panelSelect.value));
  }
  if (navSelect) {
    navSelect.addEventListener("change", () => {
      const mapped =
        navSelect.value === "c2s3-regular"
          ? "c2s3-regular"
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
          : navSelect.value === "c2s1-post"
          ? "c2s1-playoffs"
          : navSelect.value === "c2s1-regular"
          ? "c2s1-regular"
          : "c2s2-regular";
      onChange(mapped);
    });
  }
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

function normalizePlayerKey(value) {
  return String(value || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}

function isRisingStarsPlayer(value) {
  return RISING_STARS_HANDLES.has(normalizePlayerKey(value));
}

function getRookieResetIndex(seasonKey) {
  const index = ROOKIE_SEASON_ORDER.indexOf(seasonKey);
  if (index === -1) return -1;
  const resetIndex = ROOKIE_SEASON_ORDER.indexOf("c2s1-regular");
  if (seasonKey === "c2s1-regular") return resetIndex;
  return index >= resetIndex ? resetIndex : 0;
}

function isRookieSeason(seasonKey, playerKey) {
  const normalizedPlayer = normalizePlayerKey(playerKey);
  if (!normalizedPlayer) return false;
  const seasonIndex = ROOKIE_SEASON_ORDER.indexOf(seasonKey);
  if (seasonIndex === -1) return false;
  const resetIndex = getRookieResetIndex(seasonKey);
  if (resetIndex === -1) return false;
  for (let i = resetIndex; i < seasonIndex; i += 1) {
    const priorSeason = ROOKIE_SEASON_ORDER[i];
    const priorSet = rookieSeasonCache.get(priorSeason);
    if (priorSet && priorSet.has(normalizedPlayer)) {
      return false;
    }
  }
  const currentSet = rookieSeasonCache.get(seasonKey);
  return Boolean(currentSet && currentSet.has(normalizedPlayer));
}

async function loadRookieSeasonCache() {
  if (rookieSeasonCache.size) return rookieSeasonCache;
  const entries = await Promise.all(
    ROOKIE_SEASON_ORDER.map(async (seasonKey) => {
      const url = ROOKIE_ROSTER_SOURCES[seasonKey];
      if (!url) return [seasonKey, new Set()];
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) return [seasonKey, new Set()];
      const rows = parseCSV(await response.text());
      const players = new Set();
      rows.slice(1).forEach((row) => {
        const candidate = [row[1], row[0], row[2]]
          .map((value) => String(value || "").trim())
          .find(Boolean);
        if (candidate) {
          players.add(normalizePlayerKey(candidate));
        }
      });
      return [seasonKey, players];
    })
  );
  rookieSeasonCache = new Map(entries);
  return rookieSeasonCache;
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

function renderResults(rows, query) {
  if (!rows.length) {
    els.results.innerHTML = "<p>No games found for that player.</p>";
    return;
  }

  const grouped = new Map();
  rows.forEach((row) => {
    const opponent = row[playerColumns.opponent] || "Unknown";
    if (!grouped.has(opponent)) {
      grouped.set(opponent, []);
    }
    grouped.get(opponent).push(row);
  });

  els.results.innerHTML = Array.from(grouped.entries())
    .map(([opponent, games]) => {
      const items = games
        .map(
          (row) => `
            <div class="player-game">
              <div class="player-game-title">${escapeHtml(row[playerColumns.date])} • ${escapeHtml(row[playerColumns.team])}</div>
              <div class="player-game-meta">
                <span>Score: ${escapeHtml(row[playerColumns.score])}</span>
                <span>Rank: ${escapeHtml(row[playerColumns.rank])}</span>
              </div>
            </div>
          `
        )
        .join("");

      return `
        <div class="player-section">
          <h3>vs ${escapeHtml(opponent)}</h3>
          ${items}
        </div>
      `;
    })
    .join("");
}

function buildLeaderboard(rows) {
  const baselines = buildDailyBaselines(rows);
  const totals = new Map();
  rows.forEach((row) => {
    const rawNameWithMarker = String(row[playerColumns.player] || "").trim();
    const rawName = stripCaptainMarker(rawNameWithMarker);
    const displayName =
      playerNameOverrides.get(normalizePlayerKey(rawName)) || rawName;
    const team = String(row[playerColumns.team] || "").trim();
    if (!rawName) {
      return;
    }
    const baseScore = parseNumber(row[playerColumns.score]);
    const score =
      baseScore === null
        ? null
        : isCaptainMarked(rawNameWithMarker)
        ? baseScore - 0.5
        : baseScore;
    const rank = parseNumber(row[playerColumns.rank]);
    if (score === null) {
      return;
    }
    if (!totals.has(rawName)) {
      totals.set(rawName, {
        sum: 0,
        games: 0,
        rankSum: 0,
        rankGames: 0,
        relMeanSum: 0,
        relMeanGames: 0,
        relMedianSum: 0,
        relMedianGames: 0,
        war: 0,
        team,
        displayName,
      });
    }
    const entry = totals.get(rawName);
    if (displayName) {
      entry.displayName = displayName;
    }
    if (!entry.team && team) {
      entry.team = team;
    }
    entry.sum += score;
    entry.games += 1;
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
    if (rank !== null) {
      entry.rankSum += rank;
      entry.rankGames += 1;
    }
  });

  return Array.from(totals.entries())
    .map(([tag, value]) => ({
      tag,
      displayName: value.displayName || tag,
      total: value.sum,
      avg: value.games ? value.sum / value.games : 0,
      avgRank: value.rankGames ? value.rankSum / value.rankGames : 0,
      relMean: value.relMeanGames ? value.relMeanSum / value.relMeanGames : 0,
      relMedian: value.relMedianGames
        ? value.relMedianSum / value.relMedianGames
        : 0,
      war: value.war,
      games: value.games,
      team: value.team || "",
    }));
}

function renderLeaderboard(list, query, metric, minGp = 0) {
  const gpFloor = Number.isFinite(Number(minGp)) ? Math.max(0, Number(minGp)) : 0;
  const filteredByGp = list.filter((item) => Number(item.games || 0) >= gpFloor);
  const filtered = query
    ? filteredByGp.filter((item) => {
        const name = String(item.displayName || "").toLowerCase();
        const tag = String(item.tag || "").toLowerCase();
        return name.includes(query) || tag.includes(query);
      })
    : filteredByGp;

  if (!filtered.length) {
    els.results.innerHTML = "<p>No players found.</p>";
    return;
  }

  const sorted = [...filtered];
  if (metric === "total_score") {
    sorted.sort((a, b) => b.total - a.total);
  } else if (metric === "avg_rank") {
    sorted.sort((a, b) => a.avgRank - b.avgRank);
  } else if (metric === "rel_median") {
    sorted.sort((a, b) => b.relMedian - a.relMedian);
  } else if (metric === "rel_mean") {
    sorted.sort((a, b) => b.relMean - a.relMean);
  } else if (metric === "war") {
    sorted.sort((a, b) => b.war - a.war);
  } else if (metric === "gp") {
    sorted.sort((a, b) => b.games - a.games);
  } else {
    sorted.sort((a, b) => b.avg - a.avg);
  }

  const visible = query ? sorted : sorted.slice(0, 25);
  const selectedSeason = getPlayerSeason();
  const formatNumber = (value, digits = 2) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "0.00";
    return num.toFixed(digits);
  };

  const teamLogo = (team) => {
    if (team === "The Future" || team === "Dream Team") {
      return '<img class="standings-logo" src="/assets/dream-team.jpg" alt="Dream Team logo" />';
    }
    if (team === "The Lions") {
      return '<img class="standings-logo" src="/assets/the-lions.png" alt="The Lions logo" />';
    }
    if (team === "The Snipers") {
      return '<img class="standings-logo" src="/assets/the-snipers.png" alt="The Snipers logo" />';
    }
    if (team === "The Phantoms") {
      return '<img class="standings-logo" src="/assets/the-phantoms.png" alt="The Phantoms logo" />';
    }
    if (team === "Scorpions") {
      return '<img class="standings-logo" src="/assets/mayeday.jpg" alt="Scorpions logo" />';
    }
    if (team === "Cobras") {
      return '<img class="standings-logo" src="/assets/cobras.png" alt="Cobras logo" />';
    }
    if (team === "Karma Avengers") {
      return '<img class="standings-logo" src="/assets/karma-avengers.png" alt="Karma Avengers logo" />';
    }
    if (team === "Mafia") {
      return '<img class="standings-logo" src="/assets/mafia.png" alt="Mafia logo" />';
    }
    if (team === "Mets" || team === "The Mets") {
      return '<img class="standings-logo" src="/assets/mets.png" alt="Mets logo" />';
    }
    if (team === "Phoenix" || team === "The Phoenix") {
      return '<img class="standings-logo" src="/assets/phoenix.png" alt="Phoenix logo" />';
    }
    if (team === "Thunderhawks") {
      return '<img class="standings-logo" src="/assets/thunderhawks.png" alt="Thunderhawks logo" />';
    }
    if (team === "The Currents" || team === "Currents") {
      return '<img class="standings-logo" src="/assets/the-currents.png" alt="The Currents logo" />';
    }
    if (team === "Whatsgrass") {
      return '<img class="standings-logo" src="/assets/whatsgrass.png" alt="Whatsgrass logo" />';
    }
    if (team === "Wolves") {
      return '<img class="standings-logo" src="/assets/wolves.png" alt="Wolves logo" />';
    }
    if (team === "Zombies") {
      return '<img class="standings-logo" src="/assets/zombies.png" alt="Zombies logo" />';
    }
    if (team === "Yetis") {
      return '<img class="standings-logo" src="/assets/yetis.png" alt="Yetis logo" />';
    }
    if (team === "Gus N Em") {
      return '<img class="standings-logo" src="/assets/gus-n-em.png" alt="Gus N Em logo" />';
    }
    if (team === "Cheerios") {
      return '<img class="standings-logo" src="/assets/cheerios.png" alt="Cheerios logo" />';
    }
    if (team === "Illegals") {
      return '<img class="standings-logo" src="/assets/illegals.png" alt="Illegals logo" />';
    }
    if (team === "Bullets" || team === "Storm") {
      return '<img class="standings-logo" src="/assets/storm.png" alt="Storm logo" />';
    }
    if (team === "Turkeys") {
      return '<img class="standings-logo" src="/assets/turkeys.png" alt="Turkeys logo" />';
    }
    return "";
  };

  const playerLabel = (item) => {
    const rookieBadge = isRookieSeason(selectedSeason, item.tag)
      ? '<span class="player-mark rookie-mark" title="Drafted for this season">R</span>'
      : "";
    const badge = isRisingStarsPlayer(item.tag)
      ? '<span class="player-mark" title="Rising Stars participant">RS</span>'
      : "";
    return `${escapeHtml(item.displayName)}${rookieBadge}${badge}`;
  };

  els.results.innerHTML = `
    ${
      selectedSeason === "c1s2-regular" || selectedSeason === "c1s2-playoffs"
        ? '<p><em>Partial C1S2 data only. Some stats were not recorded.</em></p>'
        : selectedSeason === "c1s6-regular" || selectedSeason === "c1s6-playoffs"
        ? '<p><em>No player stats are available yet for Chapter 1 S6.</em></p>'
        : selectedSeason === "c1s5-regular" || selectedSeason === "c1s5-playoffs"
        ? '<p><em>No player stats are available yet for Chapter 1 S5.</em></p>'
        : selectedSeason === "c1s4-regular" || selectedSeason === "c1s4-playoffs"
        ? '<p><em>No player stats are available yet for Chapter 1 S4.</em></p>'
        : selectedSeason === "c1s3-regular" || selectedSeason === "c1s3-playoffs"
        ? '<p><em>Partial C1S3 data only. Some stats were not recorded.</em></p>'
        : ""
    }
    <div class="leader-grid leader-grid--players">
      <div class="player-leader-row player-leader-row--head">
        <div class="leader-rank">#</div>
        <div class="leader-name">Player</div>
        <div class="leader-team">Team</div>
        <div class="leader-col">GP</div>
        <div class="leader-col">Avv score</div>
        <div class="leader-col">Avv rank</div>
        <div class="leader-col">REL</div>
        <div class="leader-col">WAR</div>
      </div>
      ${visible
        .map(
          (item, index) => `
            <div class="player-leader-row">
              <div class="leader-rank">#${index + 1}</div>
              <a class="leader-name" href="player-detail.html?player=${encodeURIComponent(item.tag)}&season=${encodeURIComponent(selectedSeason)}">${playerLabel(item)}</a>
              <div class="leader-team">
                ${teamLogo(item.team)}
                <a class="leader-team-link" href="team.html?team=${encodeURIComponent(
                  displayTeamName(item.team)
                )}">${escapeHtml(displayTeamName(item.team) || "—")}</a>
              </div>
              <div class="leader-col">${item.games}</div>
              <div class="leader-col">${formatNumber(item.avg)}</div>
              <div class="leader-col">${formatNumber(item.avgRank)}</div>
              <div class="leader-col">${formatNumber(item.relMean, 3)}</div>
              <div class="leader-col">${formatNumber(item.war, 3)}</div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

async function loadPlayerStats() {
  try {
    await loadPlayerOverrides();
    await loadRookieSeasonCache();
    const season = getPlayerSeason();
    if (season === "c2s3-regular" || season === "c2s2-playoffs") {
      const response = await fetch(PLAYER_STATS_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      const rows = parseCSV(await response.text());
      if (!rows.length) {
        throw new Error("No data found.");
      }
      const header = rows[0] || [];
      playerColumns = detectPlayerColumns(header);
      playerRows = rows.slice(1);
    } else if (season === "c2s2-regular") {
      const response = await fetch(C2S2_REGULAR_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      const rawRows = parseCSV(await response.text());
      const rows = sliceRange(rawRows, C2S2_REGULAR_RANGES.player_stats);
      if (!rows.length) {
        throw new Error("No data found.");
      }
      const header = rows[0] || [];
      playerColumns = detectPlayerColumns(header);
      playerRows = rows.slice(1);
    } else if (season === "c2s1-playoffs") {
      const response = await fetch(ARCHIVE_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      const archive = parseCSV(await response.text());
      const sliced = sliceRange(archive, ARCHIVE_RANGES.player_stats);
      const header = sliced[0] || [];
      playerColumns = detectPlayerColumns(header);
      playerRows = sliced.slice(1);
    } else if (season === "c1s2-regular" || season === "c1s2-playoffs") {
      const response = await fetch(C1S2_PLAYER_STATS_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      const rows = parseCSV(await response.text());
      playerColumns = detectPlayerColumns(rows[0] || []);
      playerRows = rows.slice(1);
    } else if (season === "c1s6-regular" || season === "c1s6-playoffs") {
      const response = await fetch(C1S6_PLAYER_STATS_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      const rows = parseCSV(await response.text());
      playerColumns = detectPlayerColumns(rows[0] || []);
      playerRows = rows.slice(1);
    } else if (season === "c1s5-regular" || season === "c1s5-playoffs") {
      const response = await fetch(C1S5_PLAYER_STATS_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      const rows = parseCSV(await response.text());
      playerColumns = detectPlayerColumns(rows[0] || []);
      playerRows = rows.slice(1);
    } else if (season === "c1s4-regular" || season === "c1s4-playoffs") {
      const response = await fetch(C1S4_PLAYER_STATS_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      const rows = parseCSV(await response.text());
      playerColumns = detectPlayerColumns(rows[0] || []);
      playerRows = rows.slice(1);
    } else if (season === "c1s3-regular" || season === "c1s3-playoffs") {
      const response = await fetch(C1S3_PLAYER_STATS_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      const rows = parseCSV(await response.text());
      playerColumns = detectPlayerColumns(rows[0] || []);
      playerRows = rows.slice(1);
    } else {
      playerRows = [];
    }
    updateLastUpdated();
    leaderboardRows = buildLeaderboard(playerRows);
    if (season === "c2s1-regular") {
      els.results.innerHTML = "<p>No stats available for C2S1 Regular Season.</p>";
    } else {
      const query = els.search.value.trim().toLowerCase();
      renderLeaderboard(
        leaderboardRows,
        query,
        els.filter.value,
        els.minGp ? els.minGp.value : 0
      );
    }
  } catch (error) {
    els.results.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
  }
}

els.search.addEventListener("input", () => {
  const query = els.search.value.trim().toLowerCase();
  renderLeaderboard(
    leaderboardRows,
    query,
    els.filter.value,
    els.minGp ? els.minGp.value : 0
  );
});

els.filter.addEventListener("change", () => {
  const query = els.search.value.trim().toLowerCase();
  renderLeaderboard(
    leaderboardRows,
    query,
    els.filter.value,
    els.minGp ? els.minGp.value : 0
  );
});

if (els.minGp) {
  els.minGp.addEventListener("input", () => {
    const query = els.search.value.trim().toLowerCase();
    renderLeaderboard(leaderboardRows, query, els.filter.value, els.minGp.value);
  });
}

applyLeaderboardParams();
initPlayerSeasonSelect();
loadPlayerStats();
