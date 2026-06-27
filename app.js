const STANDINGS_CSV_URL = "/api/sheet?name=standings-dashboard";
const STANDINGS_RECORDS_URL = "/api/sheet?name=standings";
const TEAMS_CSV_URL = "/api/sheet?name=teams";
const SCHEDULE_URL = "/api/sheet?name=schedule";
const LIVE_SCORING_URL = "/api/sheet?name=live-scoring";
const GAME_FLOW_API = "/api/game-flow";
const PLAYER_PROFILE_URL = "/api/player-profile";
const SUPABASE_CONFIG_URL = "/api/supabase-config";
const PLAYER_PROFILE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwLH2qYcWceJucuI559OzLNjk9Bh8WjQgBKZJttcrBwS13gTY1GtnJi9T5eAb0jJeSwbA/exec";
const PLAYER_STATS_URL = "/api/sheet?name=player-stats";
const PLAYER_STATS_PLAYOFF_URL = "/api/sheet?name=player-stats-playoffs";
const TRANSACTIONS_CSV_URL = "/api/sheet?name=transactions";
const NEWS_ARTICLES_API = "/api/articles";
const BRACKET_CHALLENGE_API = "/api/bracket-challenge";
let BRACKET_CHALLENGE_OPEN = false;
const BRACKET_CHALLENGE_LOCAL_KEY = "rskl_c2s3_bracket_entries";
const BRACKET_CHALLENGE_HANDLE_KEY = "rskl_c2s3_bracket_handle";
const BRACKET_CHALLENGE_CONFIRMED_KEY = "rskl_c2s3_bracket_handle_confirmed";
const ARCHIVE_URL = "/api/sheet?name=archive";
const C2S2_REGULAR_URL = "/api/sheet?name=c2s2-regular";
const C1S2_REGULAR_SCHEDULE_URL = "/assets/data/c1s2-regular-schedule.csv";
const C1S2_POST_SCHEDULE_URL = "/assets/data/c1s2-post-schedule.csv";
const C1S2_STANDINGS_URL = "/assets/data/c1s2-standings.csv";
const C1S6_REGULAR_SCHEDULE_URL = "/assets/data/c1s6-regular-schedule.csv";
const C1S6_POST_SCHEDULE_URL = "/assets/data/c1s6-post-schedule.csv";
const C1S6_STANDINGS_URL = "/assets/data/c1s6-standings.csv";
const C1S5_REGULAR_SCHEDULE_URL = "/assets/data/c1s5-regular-schedule.csv";
const C1S5_POST_SCHEDULE_URL = "/assets/data/c1s5-post-schedule.csv";
const C1S5_STANDINGS_URL = "/assets/data/c1s5-standings.csv";
const C1S4_REGULAR_SCHEDULE_URL = "/assets/data/c1s4-regular-schedule.csv";
const C1S4_POST_SCHEDULE_URL = "/assets/data/c1s4-post-schedule.csv";
const C1S4_STANDINGS_URL = "/assets/data/c1s4-standings.csv";
const C1S3_REGULAR_SCHEDULE_URL = "/assets/data/c1s3-regular-schedule.csv";
const C1S3_POST_SCHEDULE_URL = "/assets/data/c1s3-post-schedule.csv";
const C1S3_STANDINGS_URL = "/assets/data/c1s3-standings.csv";
const SEASON_KEY = "season";

const AUTO_REFRESH_MS = 5 * 60 * 1000;

const TEAM_ORDER = [
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

const CURRENT_PLAYOFF_DIVISIONS = {
  North: new Set(["Turkeys", "The Lions", "The Phantoms", "Gus N Em", "Illegals"]),
  "Locked PSP": new Set(["Bad Bois", "The Snipers", "Storm", "Scorpions", "Dream Team"]),
};

const CURRENT_LOCKED_PSP_TIEBREAK_ORDER = new Map([
  ["The Snipers", 1],
  ["Dream Team", 2],
  ["Bad Bois", 3],
  ["Scorpions", 4],
  ["Storm", 5],
]);

const C2S3_PLAYOFF_ADVANCEMENTS = {
  northWildCard: "Gus N Em",
  lockedWildCard: "Bad Bois",
  northFinal: "Gus N Em",
  lockedFinal: "Bad Bois",
};

const ARCHIVE_RANGES = {
  standings: "A1:F7",
  schedule_regular: "G31:I79",
  schedule_post: "A31:D43",
  player_stats: "A45:F117",
};

const C2S2_REGULAR_RANGES = {
  standings: "A59:F69",
  schedule: "A71:E170",
  player_stats: "A151:G1150",
};

const TRANSACTION_RANGES = {
  trade: "A3:E81",
  retirement: "G3:J70",
  cut: "L3:O81",
  signing: "Q3:T81",
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

const els = {
  lastUpdated: document.getElementById("last-updated"),
  standingsLink: document.getElementById("standings-link"),
  teamsLink: document.getElementById("teams-link"),
  teamsGrid: document.getElementById("teams-grid"),
  liveRow: document.getElementById("live-scoring"),
  viewPlayoffPage: document.getElementById("view-playoff-page"),
  featuredMatchups: document.getElementById("featured-matchups"),
  leagueLeaders: document.getElementById("league-leaders"),
  recentTransactions: document.getElementById("recent-transactions"),
  dashboardNews: document.getElementById("dashboard-news"),
  playoffBracket: document.getElementById("dashboard-playoff-bracket"),
  bracketChallenge: document.getElementById("bracket-challenge"),
  bracketViewTabs: Array.from(document.querySelectorAll("[data-bracket-view]")),
  liveModal: document.getElementById("live-modal"),
  liveDetails: document.getElementById("live-details"),
  bracketModal: document.getElementById("bracket-matchup-modal"),
  bracketDetails: document.getElementById("bracket-matchup-details"),
};

els.livePanel = els.liveRow ? els.liveRow.closest(".panel") : null;
els.featuredPanel = els.featuredMatchups ? els.featuredMatchups.closest(".panel") : null;
els.playoffPanel = els.playoffBracket ? els.playoffBracket.closest(".panel") : null;
els.teamsPanel = els.teamsGrid ? els.teamsGrid.closest(".panel") : null;
els.transactionsPanel = els.recentTransactions ? els.recentTransactions.closest(".panel") : null;

let currentLiveGames = [];
let currentDashboardBracketGames = [];
let currentDashboardScheduleGames = [];
let currentDashboardPlayerRows = [];
let currentDashboardPlayerColumns = null;
let currentBracketPreviewPlayerRows = [];
let currentBracketPreviewPlayerColumns = null;
let sheetCache = new Map();
let lastLeagueSnapshotRows = [];
let currentBracketChallengeSeeds = null;
let bracketChallengeEntries = [];
let activeBracketView = "official";
const dashboardPlayerAvatarCache = new Map();
let supabaseUrl = "";
let supabaseAnon = "";
let supabaseConfigPromise = null;
let supabasePlayerPhotoMap = new Map();
let supabasePlayerPhotoMapPromise = null;

function isArchiveSeason(seasonRaw) {
  return seasonRaw !== "c2s3-regular" && seasonRaw !== "c2s3-playoffs";
}

function renderPlayerName(player, season, options = {}) {
  const badgeHtml = window.rsklPlayerBadgeHtml
    ? window.rsklPlayerBadgeHtml({
        player,
        season,
        rookie: options.rookie !== false,
        risingStars: options.risingStars !== false,
      })
    : "";
  const label = String(player?.displayName || player?.player || player?.tag || "Player");
  return `${escapeHtml(label)}${badgeHtml}`;
}

function buildPlayerAvatarMarkup(item) {
  const cacheKey = normalizePlayerKey(item?.tag || item?.player || "");
  const initials = String(item?.displayName || item?.tag || item?.player || "P")
    .trim()
    .replace(/^@/, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "P";
  return `
    <span class="dashboard-player-avatar dashboard-player-avatar--empty" data-player-avatar="${escapeHtml(cacheKey)}" aria-hidden="true">
      <img class="dashboard-player-avatar__image" alt="" loading="lazy" />
      <span class="dashboard-player-avatar__fallback">${escapeHtml(initials)}</span>
    </span>
  `;
}

function requireSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnon);
}

function supabaseHeaders() {
  if (!requireSupabaseConfig()) return {};
  return {
    apikey: supabaseAnon,
    Authorization: `Bearer ${supabaseAnon}`,
  };
}

function supabaseRestUrl(path) {
  if (!requireSupabaseConfig()) return "";
  return `${supabaseUrl}/rest/v1${path}`;
}

async function loadSupabaseConfig() {
  if (!supabaseConfigPromise) {
    supabaseConfigPromise = fetch(SUPABASE_CONFIG_URL, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        supabaseUrl = String(payload?.url || payload?.supabaseUrl || "").trim().replace(/\/$/, "");
        supabaseAnon = String(payload?.anonKey || payload?.supabaseAnon || "").trim();
        return requireSupabaseConfig();
      })
      .catch(() => false);
  }
  return supabaseConfigPromise;
}

async function fetchDashboardPlayerAvatarUrl(item, season) {
  const cacheKey = normalizePlayerKey(item?.tag || item?.player || "");
  if (!cacheKey) return "";
  if (dashboardPlayerAvatarCache.has(cacheKey)) {
    return dashboardPlayerAvatarCache.get(cacheKey) || "";
  }
  try {
    const hasSupabase = await loadSupabaseConfig();
    if (hasSupabase && !supabasePlayerPhotoMapPromise) {
      supabasePlayerPhotoMapPromise = fetch(supabaseRestUrl("/player_profiles?select=player_tag,photo_url"), {
        headers: supabaseHeaders(),
        cache: "no-store",
      })
        .then((response) => (response.ok ? response.json() : []))
        .then((rows) => {
          supabasePlayerPhotoMap = new Map(
            (Array.isArray(rows) ? rows : [])
              .filter((row) => row.player_tag && row.photo_url)
              .map((row) => [normalizePlayerKey(row.player_tag), String(row.photo_url || "").trim()])
          );
          return supabasePlayerPhotoMap;
        })
        .catch(() => new Map());
    }
    if (supabasePlayerPhotoMapPromise) {
      await supabasePlayerPhotoMapPromise;
    }
    const supabasePhotoUrl = supabasePlayerPhotoMap.get(cacheKey) || "";
    if (supabasePhotoUrl) {
      dashboardPlayerAvatarCache.set(cacheKey, supabasePhotoUrl);
      return supabasePhotoUrl;
    }

    const params = new URLSearchParams();
    params.set("player", item.tag || item.player || "");
    if (item.displayName && item.displayName !== item.tag) {
      params.set("displayName", item.displayName);
    }
    if (season) {
      params.set("season", season);
    }
    const response = await fetch(`${PLAYER_PROFILE_URL}?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) {
      const fallbackResponse = await fetch(`${PLAYER_PROFILE_SCRIPT_URL}?${params.toString()}`, { cache: "no-store" });
      if (!fallbackResponse.ok) {
        dashboardPlayerAvatarCache.set(cacheKey, "");
        return "";
      }
      const fallbackPayload = await fallbackResponse.json().catch(() => ({}));
      const fallbackResolved = String(
        fallbackPayload.photoUrl ||
          fallbackPayload.profilePictureUrl ||
          fallbackPayload.avatarUrl ||
          fallbackPayload.imageUrl ||
          fallbackPayload.headshotUrl ||
          fallbackPayload.pictureUrl ||
          ""
      ).trim();
      dashboardPlayerAvatarCache.set(cacheKey, fallbackResolved);
      return fallbackResolved;
    }
    const payload = await response.json().catch(() => ({}));
    const resolved = String(
      payload.photoUrl ||
        payload.profilePictureUrl ||
        payload.avatarUrl ||
        payload.imageUrl ||
        payload.headshotUrl ||
        payload.pictureUrl ||
        ""
    ).trim();
    dashboardPlayerAvatarCache.set(cacheKey, resolved);
    return resolved;
  } catch (_error) {
    dashboardPlayerAvatarCache.set(cacheKey, "");
    return "";
  }
}

async function hydrateDashboardPlayerAvatars(items, season) {
  await Promise.all(
    (items || []).map(async (item) => {
      const cacheKey = normalizePlayerKey(item?.tag || item?.player || "");
      if (!cacheKey) return;
      const url = await fetchDashboardPlayerAvatarUrl(item, season);
      if (!url) return;
      document.querySelectorAll(`[data-player-avatar="${CSS.escape(cacheKey)}"]`).forEach((avatar) => {
        const image = avatar.querySelector(".dashboard-player-avatar__image");
        if (!image) return;
        image.src = url;
        avatar.classList.remove("dashboard-player-avatar--empty");
      });
    })
  );
}

function syncDashboardPanels(seasonRaw) {
  const hideArchiveOnly = isArchiveSeason(seasonRaw);
  const hideRegularSeasonOnly = seasonRaw === "c2s3-playoffs" || seasonRaw.endsWith("-post");
  if (els.livePanel) {
    els.livePanel.hidden = hideArchiveOnly;
  }
  if (els.viewPlayoffPage) {
    els.viewPlayoffPage.hidden = seasonRaw !== "c2s3-regular";
  }
  if (els.featuredPanel) {
    els.featuredPanel.hidden = hideArchiveOnly;
  }
  if (els.playoffPanel) {
    els.playoffPanel.hidden = seasonRaw !== "c2s3-playoffs";
  }
  if (els.teamsPanel) {
    els.teamsPanel.hidden = hideRegularSeasonOnly;
  }
  if (els.transactionsPanel) {
    els.transactionsPanel.hidden = hideRegularSeasonOnly;
  }
  if (hideArchiveOnly && els.liveModal) {
    els.liveModal.hidden = true;
  }
}

if (els.standingsLink) {
  els.standingsLink.href = STANDINGS_CSV_URL;
}
if (els.teamsLink) {
  els.teamsLink.href = TEAMS_CSV_URL;
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
  return rows
    .slice(parsed.startRow, parsed.endRow + 1)
    .map((row) => row.slice(parsed.startCol, parsed.endCol + 1));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseNumber(value) {
  const num = Number(String(value || "").replace(/[^0-9.\-]/g, ""));
  return Number.isNaN(num) ? null : num;
}

function parsePct(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const num = parseNumber(raw);
  if (num === null) return null;
  return num > 1 ? num / 100 : num;
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
    if (year < 100) year += 2000;
    const timestamp = new Date(year, month, day).getTime();
    return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
  }
  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

function normalizeDateToken(value) {
  const text = String(value || "").trim();
  const match = text.match(/(\d{1,2}\/\d{1,2})(?:\/\d{2,4})?/);
  return match ? match[1] : "";
}

function parseDateFromToken(token) {
  const match = String(token || "").trim().match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;
  const now = new Date();
  const date = new Date(now.getFullYear(), Number(match[1]) - 1, Number(match[2]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateLabel(token) {
  const parsed = parseDateFromToken(token);
  if (!parsed) return token;
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getTodayDateTokenEt() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  const month = parts.find((part) => part.type === "month")?.value || "";
  const day = parts.find((part) => part.type === "day")?.value || "";
  return month && day ? `${Number(month)}/${Number(day)}` : "";
}

function normalizeTeamName(name) {
  return displayTeamName(String(name || ""))
    .replace(/\([^)]*\)/g, "")
    .replace(/[:*]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^bullets$/i, "storm")
    .toLowerCase();
}

function getSeasonRaw() {
  const raw = localStorage.getItem(SEASON_KEY) || "c2s3-playoffs";
  if (raw === "all-time") return "c2s3-playoffs";
  if (raw === "c2s2") return "c2s3-playoffs";
  return raw;
}

function initSeasonSelect() {
  const select = document.getElementById("season-select");
  if (!select) return;
  select.value = getSeasonRaw();
  if (!select.value) {
    select.value = "c2s3-playoffs";
  }
  localStorage.setItem(SEASON_KEY, select.value);
  select.addEventListener("change", () => {
    localStorage.setItem(SEASON_KEY, select.value);
    location.reload();
  });
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

function getTeamLogoSrc(name) {
  const shown = displayTeamName(name);
  if (shown === "Dream Team") return "/assets/dream-team.jpg";
  if (shown === "The Lions") return "/assets/the-lions.png";
  if (shown === "The Snipers") return "/assets/the-snipers.png";
  if (shown === "The Phantoms") return "/assets/the-phantoms.png";
  if (shown === "Scorpions") return "/assets/mayeday.jpg";
  if (shown === "ALEK Manoahs") return "/assets/alek-manoahs.jpg";
  if (shown === "Bees") return "/assets/bees.jpg";
  if (shown === "Broncos") return "/assets/broncos.jpg";
  if (shown === "Burritos") return "/assets/burritos.jpg";
  if (shown === "Cobras") return "/assets/cobras.png";
  if (shown === "Karma Avengers") return "/assets/karma-avengers.png";
  if (shown === "Mafia") return "/assets/mafia.png";
  if (shown === "Mets" || shown === "The Mets") return "/assets/mets.png";
  if (shown === "Phoenix" || shown === "The Phoenix") return "/assets/phoenix.png";
  if (shown === "Thunderhawks") return "/assets/thunderhawks.png";
  if (shown === "The Currents") return "/assets/the-currents.png";
  if (shown === "Whatsgrass") return "/assets/whatsgrass.png";
  if (shown === "Wolves") return "/assets/wolves.png";
  if (shown === "Zombies") return "/assets/zombies.png";
  if (shown === "Chicken Nuggets") return "/assets/chicken-nuggets.jpg";
  if (shown === "Masdog N Em") return "/assets/gus-n-em.png";
  if (shown === "Richer N Em") return "/assets/gus-n-em.png";
  if (shown === "Gus N Em") return "/assets/gus-n-em.png";
  if (shown === "Bad Bois")
    return "https://media.realapp.com/assets/user/default/large/4JZRj4DJ_29132497.webp";
  if (shown === "Illegals") return "/assets/illegals.png";
  if (shown === "Storm") return "/assets/storm.png";
  if (shown === "Turkeys") return "/assets/turkeys.png";
  return "";
}

function getTeamColorClass(name) {
  const clean = normalizeTeamName(name);
  if (clean === "turkeys") return "team-color-turkeys";
  if (clean === "gus n em") return "team-color-gus";
  if (clean === "storm") return "team-color-storm";
  if (clean === "bad bois") return "team-color-cheerios";
  if (clean === "scorpions" || clean === "yetis") return "team-color-yetis";
  if (clean === "illegals") return "team-color-illegals";
  if (clean === "the lions") return "team-color-lions";
  if (clean === "dream team" || clean === "the future") return "team-color-future";
  if (clean === "the snipers") return "team-color-snipers";
  if (clean === "the phantoms") return "team-color-phantoms";
  return "team-color-default";
}

function renderSmallTeamLogo(name) {
  const src = getTeamLogoSrc(name);
  if (!src) return "";
  return `<img class="standings-logo" src="${src}" alt="${escapeHtml(displayTeamName(name))} logo" />`;
}

function getSeasonLabel(seasonRaw) {
  if (seasonRaw === "c2s3-regular") return "C2S3 Regular Season";
  if (seasonRaw === "c2s3-playoffs") return "C2S3 Playoffs";
  if (seasonRaw === "c2s2-regular") return "C2S2 Regular Season";
  if (seasonRaw === "c2s1-regular") return "C2S1 Regular Season";
  if (seasonRaw === "c2s1-post") return "C2S1 Postseason";
  if (seasonRaw === "c1s2-regular") return "C1S2 Regular Season";
  if (seasonRaw === "c1s2-post") return "C1S2 Postseason";
  if (seasonRaw === "c1s6-regular") return "C1S6 Regular Season";
  if (seasonRaw === "c1s6-post") return "C1S6 Postseason";
  if (seasonRaw === "c1s5-regular") return "C1S5 Regular Season";
  if (seasonRaw === "c1s5-post") return "C1S5 Postseason";
  if (seasonRaw === "c1s4-regular") return "C1S4 Regular Season";
  if (seasonRaw === "c1s4-post") return "C1S4 Postseason";
  if (seasonRaw === "c1s3-regular") return "C1S3 Regular Season";
  if (seasonRaw === "c1s3-post") return "C1S3 Postseason";
  return "League Season";
}

function buildStateCard(title, body) {
  return `<div class="dashboard-state-card"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(body)}</span></div>`;
}

function buildSkeletonCard(lines = 3) {
  return `
    <div class="dashboard-skeleton-card" aria-hidden="true">
      <span class="dashboard-skeleton dashboard-skeleton--title"></span>
      ${Array.from({ length: Math.max(1, lines) })
        .map(
          (_, index) =>
            `<span class="dashboard-skeleton ${index === lines - 1 ? "dashboard-skeleton--short" : ""}"></span>`
        )
        .join("")}
    </div>
  `;
}

function prepareDashboardScheduleRows(rows, seasonRaw) {
  if (!rows.length) return [];
  if (seasonRaw !== "c2s3-regular" && seasonRaw !== "c2s3-playoffs") return rows;
  const headerRowIndex = rows.findIndex((row) => {
    const header = row.map((value) => String(value || "").trim().toLowerCase());
    return (
      header.some((value) => value === "date" || value.includes("date")) &&
      header.some((value) => value.includes("team 1") || value.includes("team1") || value.includes("away")) &&
      header.some((value) => value.includes("team 2") || value.includes("team2") || value.includes("home"))
    );
  });
  if (headerRowIndex >= 0) {
    return rows.slice(headerRowIndex);
  }
  return rows;
}

function prepareDashboardPlayerRows(rows) {
  if (!rows.length) return [];
  const headerRowIndex = rows.findIndex((row) => {
    const header = row.map((value) => String(value || "").trim().toLowerCase());
    return (
      header.includes("team") &&
      header.includes("player") &&
      (header.includes("score") || header.includes("points"))
    );
  });
  if (headerRowIndex >= 0) {
    return rows.slice(headerRowIndex);
  }
  return rows;
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

async function fetchSheet(url) {
  if (sheetCache.has(url)) {
    return sheetCache.get(url);
  }
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status}`);
  }
  const text = await response.text();
  const rows = parseCSV(text);
  if (!rows.length) {
    throw new Error("No data found.");
  }
  sheetCache.set(url, rows);
  return rows;
}

function setDashboardLoading() {
  if (els.liveRow) {
    els.liveRow.innerHTML = `<div class="dashboard-live-list">${buildSkeletonCard(4)}${buildSkeletonCard(4)}</div>`;
  }
  if (els.leagueLeaders) {
    els.leagueLeaders.innerHTML = `<div class="dashboard-leader-grid">${buildSkeletonCard(3)}${buildSkeletonCard(3)}${buildSkeletonCard(3)}</div>`;
  }
  if (els.recentTransactions) {
    els.recentTransactions.innerHTML = `<div class="dashboard-transactions-list">${buildSkeletonCard(3)}${buildSkeletonCard(3)}</div>`;
  }
  if (els.dashboardNews) {
    els.dashboardNews.innerHTML = `<div class="dashboard-news-list">${buildSkeletonCard(3)}${buildSkeletonCard(3)}</div>`;
  }
  if (els.playoffBracket) {
    els.playoffBracket.innerHTML = `<div class="dashboard-bracket-rounds">${buildSkeletonCard(3)}${buildSkeletonCard(3)}${buildSkeletonCard(3)}</div>`;
  }
  if (els.teamsGrid) {
    els.teamsGrid.innerHTML = `<div class="dashboard-feature-grid">${buildSkeletonCard(3)}${buildSkeletonCard(3)}${buildSkeletonCard(3)}</div>`;
  }
}

function buildCurrentLeagueSnapshotRows(rows) {
  const itemsByTeam = new Map();
  let activeIndexes = null;

  rows.forEach((row) => {
    const normalized = row.map((cell) => String(cell || "").trim().toLowerCase());
    const teamIdx = normalized.findIndex((cell) => cell === "team");
    const winsIdx = normalized.findIndex((cell) => cell === "wins" || cell === "win");
    const lossesIdx = normalized.findIndex((cell) => cell === "loss" || cell === "losses" || cell === "l");
    const gbIdx = normalized.findIndex((cell) => cell === "gb");
    const pctIdx = normalized.findIndex((cell) => cell === "win %" || cell === "win%" || cell === "pct");

    if (
      teamIdx >= 0 &&
      winsIdx >= 0 &&
      lossesIdx >= 0 &&
      gbIdx >= 0 &&
      pctIdx >= 0
    ) {
      activeIndexes = { teamIdx, winsIdx, lossesIdx, gbIdx, pctIdx };
      return;
    }

    if (!activeIndexes) return;

    const teamRaw = String(row[activeIndexes.teamIdx] || "").trim();
    const team = normalizeCurrentTeamName(teamRaw);
    if (!team || !TEAM_ORDER.includes(team) || team === "N/A") return;

    itemsByTeam.set(team, {
      team,
      wins: parseNumber(row[activeIndexes.winsIdx]),
      losses: parseNumber(row[activeIndexes.lossesIdx]),
      gb: parseNumber(row[activeIndexes.gbIdx]),
      winPct: parsePct(row[activeIndexes.pctIdx]),
    });
  });

  TEAM_ORDER.forEach((team) => {
    if (!itemsByTeam.has(team)) {
      itemsByTeam.set(team, {
        team,
        wins: null,
        losses: null,
        gb: null,
        winPct: null,
      });
    }
  });

  const finalItems = TEAM_ORDER.map((team) => itemsByTeam.get(team)).filter(Boolean);

  finalItems.sort((a, b) => {
    if ((b.winPct ?? -1) !== (a.winPct ?? -1)) return (b.winPct ?? -1) - (a.winPct ?? -1);
    if ((a.gb ?? 999) !== (b.gb ?? 999)) return (a.gb ?? 999) - (b.gb ?? 999);
    return a.team.localeCompare(b.team);
  });

  return finalItems.map((item, index) => ({ ...item, rank: index + 1 }));
}

function buildArchiveLeagueSnapshotRows(rows) {
  if (!rows.length) return [];
  const headers = (rows[0] || []).map((cell) => String(cell || "").trim().toLowerCase());
  const teamIdx = headers.findIndex((h) => h.includes("team"));
  const winsIdx = headers.findIndex((h) => h === "wins" || h === "win");
  const lossesIdx = headers.findIndex((h) => h === "loss" || h === "losses");
  const gbIdx = headers.findIndex((h) => h === "gb");
  const pctIdx = headers.findIndex((h) => h.includes("win %") || h.includes("win%"));
  const items = rows
    .slice(1)
    .map((row) => {
      const team = normalizeCurrentTeamName(String(row[teamIdx >= 0 ? teamIdx : 0] || "").trim());
      return {
        team,
        wins: parseNumber(row[winsIdx]),
        losses: parseNumber(row[lossesIdx]),
        gb: parseNumber(row[gbIdx]),
        winPct: parsePct(row[pctIdx]),
      };
    })
    .filter((item) => item.team);

  items.sort((a, b) => {
    if ((b.winPct ?? -1) !== (a.winPct ?? -1)) return (b.winPct ?? -1) - (a.winPct ?? -1);
    if ((a.gb ?? 999) !== (b.gb ?? 999)) return (a.gb ?? 999) - (b.gb ?? 999);
    return a.team.localeCompare(b.team);
  });

  return items.map((item, index) => ({ ...item, rank: index + 1 }));
}

function renderLeagueSnapshot(items) {
  if (!els.teamsGrid) return;
  if (!items.length) {
    els.teamsGrid.innerHTML = buildStateCard("No League Snapshot", "Standings data is missing for this season.");
    return;
  }

  els.teamsGrid.innerHTML = items
    .map((item) => {
      const team = normalizeCurrentTeamName(item.team);
      const record = item.wins !== null && item.losses !== null ? `${item.wins}-${item.losses}` : "—";
      const recordMarkup =
        item.wins !== null && item.losses !== null
          ? `<span class="dashboard-record-value"><strong>${escapeHtml(String(item.wins))}</strong><em>-</em><strong>${escapeHtml(String(item.losses))}</strong></span>`
          : `<strong>${escapeHtml(record)}</strong>`;
      const winPct = item.winPct !== null ? item.winPct.toFixed(3).replace(/^0/, ".") : "—";
      const gb = item.gb !== null ? item.gb : "—";
      return `
        <a class="team-card dashboard-team-card ${getTeamColorClass(team)}" href="/team.html?team=${encodeURIComponent(team)}">
          <div class="dashboard-team-top">
            <span class="dashboard-rank-badge">#${item.rank}</span>
            <span class="dashboard-team-logo-wrap">${renderSmallTeamLogo(team)}</span>
          </div>
          <div class="team-title">${escapeHtml(team)}</div>
          <div class="dashboard-team-metrics">
            <div class="team-record">
              <span>W-L</span>
              ${recordMarkup}
            </div>
            <div class="team-record small">
              <span>GB</span>
              <strong>${escapeHtml(String(gb))}</strong>
            </div>
            <div class="team-record small">
              <span>PCT</span>
              <strong>${escapeHtml(winPct)}</strong>
            </div>
          </div>
        </a>
      `;
    })
    .join("");
}

function getDashboardPlayoffDivision(team) {
  const shown = normalizeCurrentTeamName(team);
  return CURRENT_PLAYOFF_DIVISIONS.North.has(shown) ? "North" : "Locked PSP";
}

function parseDashboardPlayoffStandingsRows(rows) {
  const itemsByTeam = new Map();
  let indexes = null;

  rows.forEach((row) => {
    const normalized = row.map((cell) => String(cell || "").trim().toLowerCase());
    const teamIdx = normalized.findIndex((cell) => cell === "team");
    const winsIdx = normalized.findIndex((cell) => cell === "wins" || cell === "win");
    const lossesIdx = normalized.findIndex((cell) => cell === "loss" || cell === "losses" || cell === "l");
    const gbIdx = normalized.findIndex((cell) => cell === "gb");
    const pctIdx = normalized.findIndex((cell) => cell === "win %" || cell === "win%" || cell === "pct");
    const totalScoreIdx = normalized.findIndex((cell) => cell.includes("total score") || cell === "score");
    const sosIdx = normalized.findIndex((cell) => cell === "sos" || cell.includes("strength"));

    if (teamIdx >= 0 && winsIdx >= 0 && lossesIdx >= 0) {
      indexes = { teamIdx, winsIdx, lossesIdx, gbIdx, pctIdx, totalScoreIdx, sosIdx };
      return;
    }

    if (!indexes) return;

    const team = normalizeCurrentTeamName(String(row[indexes.teamIdx] || "").trim());
    if (!team || !TEAM_ORDER.includes(team)) return;

    itemsByTeam.set(team, {
      team,
      wins: parseNumber(row[indexes.winsIdx]),
      losses: parseNumber(row[indexes.lossesIdx]),
      gb: parseNumber(row[indexes.gbIdx]),
      winPct: parsePct(row[indexes.pctIdx]),
      totalScore: parseNumber(row[indexes.totalScoreIdx]),
      sos: parseNumber(row[indexes.sosIdx]),
    });
  });

  return TEAM_ORDER.map((team) => itemsByTeam.get(team)).filter(Boolean);
}

function buildDashboardPlayoffSeeds(standingsRows) {
  const rows = parseDashboardPlayoffStandingsRows(standingsRows);
  const groups = new Map([
    ["North", []],
    ["Locked PSP", []],
  ]);
  rows.forEach((row) => {
    const division = getDashboardPlayoffDivision(row.team);
    groups.get(division).push(row);
  });
  groups.forEach((divisionRows) => {
    divisionRows.sort((a, b) => {
      if (getDashboardPlayoffDivision(a.team) === "Locked PSP") {
        const ar = CURRENT_LOCKED_PSP_TIEBREAK_ORDER.get(a.team) ?? 99;
        const br = CURRENT_LOCKED_PSP_TIEBREAK_ORDER.get(b.team) ?? 99;
        if (ar !== br) return ar - br;
      }
      const aw = a.wins ?? 0;
      const bw = b.wins ?? 0;
      if (bw !== aw) return bw - aw;
      const al = a.losses ?? 0;
      const bl = b.losses ?? 0;
      if (al !== bl) return al - bl;
      const ap = a.winPct ?? -1;
      const bp = b.winPct ?? -1;
      if (bp !== ap) return bp - ap;
      const ats = a.totalScore ?? -Infinity;
      const bts = b.totalScore ?? -Infinity;
      if (bts !== ats) return bts - ats;
      const as = a.sos ?? -Infinity;
      const bs = b.sos ?? -Infinity;
      if (bs !== as) return bs - as;
      return a.team.localeCompare(b.team);
    });
  });
  return groups;
}

function renderBracketTeam(seed, className = "") {
  if (!seed) {
    return `
      <div class="dashboard-bracket-team dashboard-bracket-team--empty ${className}">
        <span class="dashboard-bracket-seed">—</span>
        <span class="dashboard-bracket-name">TBD</span>
      </div>
    `;
  }
  const record = seed.wins !== null && seed.losses !== null ? `${seed.wins}-${seed.losses}` : "—";
  return `
    <div class="dashboard-bracket-team ${className}">
      <span class="dashboard-bracket-seed">${escapeHtml(seed.seedLabel)}</span>
      ${renderSmallTeamLogo(seed.team)}
      <span class="dashboard-bracket-name">${escapeHtml(seed.team)}</span>
      <span class="dashboard-bracket-record">${escapeHtml(record)}</span>
    </div>
  `;
}

function renderBracketPlaceholder(label) {
  return `
    <div class="dashboard-bracket-team dashboard-bracket-team--empty">
      <span class="dashboard-bracket-seed">—</span>
      <span class="dashboard-bracket-name">${escapeHtml(label || "TBD")}</span>
    </div>
  `;
}

function setBracketView(view = "official") {
  activeBracketView = view === "challenge" ? "challenge" : "official";
  if (els.playoffBracket) {
    els.playoffBracket.hidden = activeBracketView !== "official";
  }
  if (els.bracketChallenge) {
    els.bracketChallenge.hidden = activeBracketView !== "challenge";
  }
  els.bracketViewTabs.forEach((button) => {
    const isActive = button.dataset.bracketView === activeBracketView;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function getBracketTeamValue(seed) {
  return seed?.team ? String(seed.team).trim() : "";
}

function getBracketMatchupsFromSeeds(seeds) {
  const north = seeds?.north || [];
  const locked = seeds?.locked || [];
  return {
    northWildCard: {
      key: "northWildCard",
      label: "North Wild Card",
      teams: [north[1], north[2]].filter(Boolean),
    },
    lockedWildCard: {
      key: "lockedWildCard",
      label: "Locked PSP Wild Card",
      teams: [locked[1], locked[2]].filter(Boolean),
    },
    northFinal: {
      key: "northFinal",
      label: "North Final",
      bye: north[0] || null,
      from: "northWildCard",
    },
    lockedFinal: {
      key: "lockedFinal",
      label: "Locked PSP Final",
      bye: locked[0] || null,
      from: "lockedWildCard",
    },
    championship: {
      key: "championship",
      label: "RSKL Finals",
      from: ["northFinal", "lockedFinal"],
    },
  };
}

function getBracketSeedRecord(seed) {
  return seed && seed.wins !== null && seed.losses !== null ? `${seed.wins}-${seed.losses}` : "—";
}

function renderBracketMatchup(game, index) {
  const seriesRecord = game.top && game.bottom ? getBracketSeriesRecord(game.top.team, game.bottom.team) : "";
  const topWon = game.winner && game.top && normalizeTeamName(game.winner) === normalizeTeamName(game.top.team);
  const bottomWon = game.winner && game.bottom && normalizeTeamName(game.winner) === normalizeTeamName(game.bottom.team);
  return `
    <button class="dashboard-bracket-matchup" type="button" data-bracket-matchup="${index}" aria-label="${escapeHtml(game.label)} details">
      <div class="dashboard-bracket-game-label">${escapeHtml(game.label)}</div>
      ${game.top ? renderBracketTeam(game.top, topWon ? "is-winner" : "") : renderBracketPlaceholder(game.topLabel)}
      ${game.bottom ? renderBracketTeam(game.bottom, bottomWon ? "is-winner" : "") : renderBracketPlaceholder(game.bottomLabel)}
      ${seriesRecord ? `<div class="dashboard-bracket-series-record">${escapeHtml(seriesRecord)}</div>` : ""}
    </button>
  `;
}

function renderBracketMatchupDetails(game) {
  const teams = [
    game.top
      ? {
          team: game.top.team,
          seed: game.top.seedLabel,
          record: getBracketSeedRecord(game.top),
          division: game.top.division,
          placeholder: false,
        }
      : { team: game.topLabel || "TBD", seed: "—", record: "—", division: "", placeholder: true },
    game.bottom
      ? {
          team: game.bottom.team,
          seed: game.bottom.seedLabel,
          record: getBracketSeedRecord(game.bottom),
          division: game.bottom.division,
          placeholder: false,
        }
      : { team: game.bottomLabel || "TBD", seed: "—", record: "—", division: "", placeholder: true },
  ];
  const status =
    game.top && game.bottom
      ? "Winner advances to the next round."
      : game.top
      ? `${game.top.team} has the bye and waits for this matchup winner.`
      : "Teams will appear here once the previous round is decided.";
  const seriesSchedule = game.top && game.bottom ? renderBracketSeriesSchedule(game.top.team, game.bottom.team) : "";
  const previewGrid = game.top && game.bottom ? renderBracketMatchupPreview(game.top.team, game.bottom.team) : "";

  return `
    <div class="bracket-matchup-detail">
      <div class="bracket-matchup-detail-head">
        <span>${escapeHtml(game.roundTitle || "Playoff Matchup")}</span>
        <h3>${escapeHtml(game.label)}</h3>
        <p>${escapeHtml(status)}</p>
      </div>
      <div class="bracket-matchup-detail-teams">
        ${teams
          .map(
            (team) => `
              <div class="bracket-matchup-detail-team ${team.placeholder ? "is-placeholder" : ""}">
                <span class="dashboard-bracket-seed">${escapeHtml(team.seed)}</span>
                ${team.placeholder ? "" : renderSmallTeamLogo(team.team)}
                <div>
                  ${
                    team.placeholder
                      ? `<strong>${escapeHtml(team.team)}</strong>`
                      : `<a href="/team.html?team=${encodeURIComponent(team.team)}">${escapeHtml(team.team)}</a>`
                  }
                  <span>${escapeHtml([team.division, team.record].filter(Boolean).join(" • "))}</span>
                </div>
              </div>
            `
          )
          .join("")}
      </div>
      ${seriesSchedule}
      ${previewGrid}
    </div>
  `;
}

function getBracketSeriesGames(teamA, teamB) {
  const left = normalizeTeamName(teamA);
  const right = normalizeTeamName(teamB);
  return (currentDashboardScheduleGames || []).filter((game) => {
    const gameLeft = normalizeTeamName(game.team1);
    const gameRight = normalizeTeamName(game.team2);
    const type = String(game.gameType || "").toLowerCase().replace(/[\s_-]+/g, "");
    return (
      type.includes("postseason") &&
      ((gameLeft === left && gameRight === right) ||
        (gameLeft === right && gameRight === left))
    );
  });
}

function getScheduleWinner(game) {
  const winner = displayTeamName(String(game?.winner || "").trim());
  if (winner) return winner;
  const live = getLiveGameForSchedule(game);
  const score1 = parseNumber(live?.team1Score);
  const score2 = parseNumber(live?.team2Score);
  if (score1 === null || score2 === null || score1 === score2) return "";
  return score1 > score2 ? live.team1 : live.team2;
}

function getMarkedScheduleWinner(game) {
  return displayTeamName(String(game?.winner || "").trim());
}

function getBracketSeriesRecord(teamA, teamB) {
  const games = getBracketSeriesGames(teamA, teamB);
  const left = displayTeamName(teamA);
  const right = displayTeamName(teamB);
  let leftWins = 0;
  let rightWins = 0;
  games.forEach((game) => {
    const winner = getMarkedScheduleWinner(game);
    if (!winner) return;
    if (normalizeTeamName(winner) === normalizeTeamName(left)) {
      leftWins += 1;
    } else if (normalizeTeamName(winner) === normalizeTeamName(right)) {
      rightWins += 1;
    }
  });
  return `Series: ${left} ${leftWins}-${rightWins} ${right}`;
}

function getLiveGameForSchedule(game) {
  return (currentLiveGames || []).find(
    (live) => buildGameKey(live.dateToken, live.team1, live.team2) === buildGameKey(game.dateToken, game.team1, game.team2)
  );
}

function renderBracketSeriesSchedule(teamA, teamB) {
  const games = getBracketSeriesGames(teamA, teamB);
  if (!games.length) {
    return `
      <section class="bracket-series-card">
        <h4>Series Schedule</h4>
        <div class="bracket-series-empty">No scheduled games found for this matchup yet.</div>
      </section>
    `;
  }
  return `
    <section class="bracket-series-card">
      <h4>Series Schedule</h4>
      <div class="bracket-series-list">
        ${games
          .map((game) => {
            const live = getLiveGameForSchedule(game);
            const score = live ? `${live.team1Score || "—"} - ${live.team2Score || "—"}` : "";
            return `
              <div class="bracket-series-row">
                <span>${escapeHtml(formatDateLabel(game.dateToken || game.rawDate || ""))}</span>
                <strong>${escapeHtml(game.team1)} vs ${escapeHtml(game.team2)}</strong>
                <em>${escapeHtml(score || game.gameType || "Scheduled")}</em>
              </div>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderBracketMatchupPreview(teamA, teamB) {
  const renderTeam = (teamName, opponentName) => {
    const leaders = buildDashboardTeamLeaders(teamName);
    const row = (label, item, formatter) => `
      <div class="preview-metric">
        <span>${escapeHtml(label)}</span>
        <strong>${item ? `${escapeHtml(item.player)} (${escapeHtml(formatter(item))})` : "—"}</strong>
      </div>
    `;
    return `
      <div class="preview-team-card">
        <h4>${escapeHtml(teamName)} <span>vs ${escapeHtml(opponentName)}</span></h4>
        <div class="preview-sub">Player Stats</div>
        ${row("Top AVG", leaders.topAvg, (item) => item.avg.toFixed(1))}
        ${row("Top REL", leaders.topRel, (item) => item.rel.toFixed(3))}
        ${row("Top WAR", leaders.topWar, (item) => item.war.toFixed(2))}
      </div>
    `;
  };
  return `
    <div class="preview-grid bracket-preview-grid">
      ${renderTeam(teamA, teamB)}
      ${renderTeam(teamB, teamA)}
    </div>
  `;
}

function openBracketMatchup(index) {
  const game = currentDashboardBracketGames[Number(index)];
  if (!game || !els.bracketModal || !els.bracketDetails) return;
  els.bracketDetails.innerHTML = renderBracketMatchupDetails(game);
  els.bracketModal.hidden = false;
}

function getLocalBracketEntries() {
  try {
    const parsed = JSON.parse(localStorage.getItem(BRACKET_CHALLENGE_LOCAL_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function setLocalBracketEntries(entries) {
  localStorage.setItem(BRACKET_CHALLENGE_LOCAL_KEY, JSON.stringify(entries.slice(0, 50)));
}

function upsertLocalBracketEntry(entry) {
  const nextEntry = normalizeBracketEntry(entry);
  const entries = getLocalBracketEntries().map(normalizeBracketEntry);
  const existingIndex = entries.findIndex((saved) => saved.handle.toLowerCase() === nextEntry.handle.toLowerCase());
  if (existingIndex >= 0) {
    entries[existingIndex] = {
      ...entries[existingIndex],
      ...nextEntry,
      created_at: entries[existingIndex].created_at || nextEntry.created_at,
      updated_at: nextEntry.updated_at || new Date().toISOString(),
    };
  } else {
    entries.unshift(nextEntry);
  }
  const dedupedEntries = dedupeBracketEntries(entries);
  setLocalBracketEntries(dedupedEntries);
  return dedupedEntries;
}

function normalizeBracketEntry(row) {
  const picks = row?.picks && typeof row.picks === "object" ? row.picks : {};
  return {
    id: String(row?.id || row?.created_at || Date.now()).trim(),
    handle: String(row?.handle || row?.user_handle || "").trim(),
    champion: String(row?.champion || picks.championship || "").trim(),
    picks,
    created_at: row?.created_at || row?.updated_at || new Date().toISOString(),
    updated_at: row?.updated_at || row?.created_at || new Date().toISOString(),
  };
}

function dedupeBracketEntries(entries) {
  const seen = new Set();
  return (Array.isArray(entries) ? entries : []).filter((entry) => {
    const key = String(entry.handle || "").trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatBracketHandle(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.startsWith("@") ? raw : `@${raw}`;
}

function getConfirmedBracketHandle() {
  const handle = String(localStorage.getItem(BRACKET_CHALLENGE_HANDLE_KEY) || "").trim();
  const confirmed = localStorage.getItem(BRACKET_CHALLENGE_CONFIRMED_KEY) === "1";
  return confirmed && handle ? handle : "";
}

function getBracketPickValue(key) {
  const input = document.querySelector(`[name="bracket-${key}"]:checked`);
  return String(input?.value || "").trim();
}

function getBracketChallengePicks() {
  const picks = {
    northWildCard: getBracketPickValue("northWildCard"),
    lockedWildCard: getBracketPickValue("lockedWildCard"),
    northFinal: getBracketPickValue("northFinal"),
    lockedFinal: getBracketPickValue("lockedFinal"),
    championship: getBracketPickValue("championship"),
  };
  return picks;
}

function renderBracketPickButton(groupKey, seed, disabled = false, selectedValue = "") {
  const team = getBracketTeamValue(seed);
  if (!team) return "";
  const record = seed.wins !== null && seed.losses !== null && seed.wins !== undefined && seed.losses !== undefined ? `${seed.wins}-${seed.losses}` : "Pick";
  return `
    <label class="dashboard-bracket-team bracket-pick-option ${disabled ? "bracket-pick-option--disabled" : ""}">
      <input type="radio" name="bracket-${escapeHtml(groupKey)}" value="${escapeHtml(team)}" ${disabled ? "disabled" : ""} ${team === selectedValue ? "checked" : ""} />
      <span class="dashboard-bracket-seed">${escapeHtml(seed?.seedLabel || "—")}</span>
      ${renderSmallTeamLogo(team)}
      <span class="dashboard-bracket-name">${escapeHtml(team)}</span>
      <span class="dashboard-bracket-record">${escapeHtml(record)}</span>
    </label>
  `;
}

function getBracketEntryForHandle(handle) {
  const normalizedHandle = String(handle || "").trim().toLowerCase();
  if (!normalizedHandle) return null;
  return bracketChallengeEntries.find((entry) => String(entry.handle || "").trim().toLowerCase() === normalizedHandle) || null;
}

function getCurrentBracketEntry() {
  return getBracketEntryForHandle(getConfirmedBracketHandle());
}

function getBracketChallengeScore(entry) {
  const picks = entry?.picks || {};
  let correct = 0;
  let points = 0;
  if (normalizeTeamName(picks.northWildCard) === normalizeTeamName(C2S3_PLAYOFF_ADVANCEMENTS.northWildCard)) {
    correct += 1;
    points += 3;
  }
  if (normalizeTeamName(picks.lockedWildCard) === normalizeTeamName(C2S3_PLAYOFF_ADVANCEMENTS.lockedWildCard)) {
    correct += 1;
    points += 3;
  }
  if (normalizeTeamName(picks.northFinal) === normalizeTeamName(C2S3_PLAYOFF_ADVANCEMENTS.northFinal)) {
    correct += 1;
    points += 6;
  }
  if (normalizeTeamName(picks.lockedFinal) === normalizeTeamName(C2S3_PLAYOFF_ADVANCEMENTS.lockedFinal)) {
    correct += 1;
    points += 6;
  }
  return {
    correct,
    points,
  };
}

function renderBracketChallengeEntries(entries) {
  const confirmedHandle = getConfirmedBracketHandle();
  if (!confirmedHandle) {
    return `<div class="bracket-entry-empty">Confirm your @ to see your submitted bracket.</div>`;
  }
  const normalizedHandle = confirmedHandle.trim().toLowerCase();
  const list = (Array.isArray(entries) ? entries : [])
    .filter((entry) => String(entry.handle || "").trim().toLowerCase() === normalizedHandle)
    .slice(0, 1);
  if (!list.length) {
    return `<div class="bracket-entry-empty">No bracket submitted for ${escapeHtml(formatBracketHandle(confirmedHandle))} yet.</div>`;
  }
  return list
    .map((entry) => {
      const handle = entry.handle || "Unknown";
      const champion = entry.champion || entry.picks?.championship || "No champion";
      const score = getBracketChallengeScore(entry);
      return `
        <div class="bracket-entry-row">
          <div>
            <strong>${escapeHtml(handle)}</strong>
            <span>${escapeHtml(formatArticleDate(entry.created_at))}</span>
          </div>
          <div class="bracket-entry-score">
            <b>${escapeHtml(String(score.points))} pts</b>
            <span>${escapeHtml(`${score.correct} correct picks`)}</span>
            <em>Champion: ${escapeHtml(champion)}</em>
          </div>
        </div>
      `;
    })
    .join("");
}

async function loadBracketChallengeEntries() {
  if (!els.bracketChallenge) return;
  try {
    const response = await fetch(`${BRACKET_CHALLENGE_API}?season=c2s3-playoffs`, { cache: "no-store" });
    if (!response.ok) throw new Error("Bracket API unavailable.");
    const payload = await response.json().catch(() => ({}));
    if (typeof payload?.open === "boolean" && payload.open !== BRACKET_CHALLENGE_OPEN) {
      BRACKET_CHALLENGE_OPEN = payload.open;
      renderBracketChallenge(currentBracketChallengeSeeds);
      return;
    }
    bracketChallengeEntries = Array.isArray(payload?.entries)
      ? dedupeBracketEntries(payload.entries.map(normalizeBracketEntry))
      : dedupeBracketEntries(getLocalBracketEntries().map(normalizeBracketEntry));
  } catch (_error) {
    bracketChallengeEntries = dedupeBracketEntries(getLocalBracketEntries().map(normalizeBracketEntry));
  }
  const entriesEl = document.getElementById("bracket-entry-list");
  if (entriesEl) {
    entriesEl.innerHTML = renderBracketChallengeEntries(bracketChallengeEntries);
  }
  applyExistingBracketEntry();
}

async function saveBracketChallengeEntry() {
  const statusEl = document.getElementById("bracket-status");
  const saveButton = document.getElementById("bracket-save");
  const handle = getConfirmedBracketHandle();
  const picks = getBracketChallengePicks();
  const missing = Object.entries(picks)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (!BRACKET_CHALLENGE_OPEN) {
    if (statusEl) {
      statusEl.textContent = "Bracket challenge submissions are not open yet.";
      statusEl.className = "bracket-status error";
    }
    return;
  }
  if (!handle) {
    if (statusEl) {
      statusEl.textContent = "Confirm your @ before filling out a bracket.";
      statusEl.className = "bracket-status error";
    }
    return;
  }
  if (missing.length) {
    if (statusEl) {
      statusEl.textContent = "Finish every pick before submitting.";
      statusEl.className = "bracket-status error";
    }
    return;
  }

  const entry = normalizeBracketEntry({
    handle,
    champion: picks.championship,
    picks,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  localStorage.setItem(BRACKET_CHALLENGE_HANDLE_KEY, handle);
  localStorage.setItem(BRACKET_CHALLENGE_CONFIRMED_KEY, "1");
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";
  }
  if (statusEl) {
    statusEl.textContent = "Saving bracket...";
    statusEl.className = "bracket-status";
  }

  try {
    const response = await fetch(BRACKET_CHALLENGE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        season: "c2s3-playoffs",
        handle,
        picks,
        champion: picks.championship,
      }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const error = new Error(payload?.message || "Saved locally. Add the Supabase bracket table for public entries.");
      error.skipLocalSave = response.status === 403;
      throw error;
    }
    const payload = await response.json().catch(() => ({}));
    bracketChallengeEntries = Array.isArray(payload?.entries)
      ? dedupeBracketEntries(payload.entries.map(normalizeBracketEntry))
      : dedupeBracketEntries([entry, ...bracketChallengeEntries]);
    if (statusEl) {
      statusEl.textContent = "Bracket saved. You can keep editing it for now.";
      statusEl.className = "bracket-status success";
    }
  } catch (error) {
    if (!error.skipLocalSave) {
      bracketChallengeEntries = upsertLocalBracketEntry(entry);
    }
    if (statusEl) {
      statusEl.textContent = error.message || "Bracket saved locally.";
      statusEl.className = "bracket-status";
    }
  } finally {
    if (saveButton) {
      saveButton.disabled = !BRACKET_CHALLENGE_OPEN || !getConfirmedBracketHandle();
      saveButton.textContent = "Save Bracket";
    }
    const entriesEl = document.getElementById("bracket-entry-list");
    if (entriesEl) {
      entriesEl.innerHTML = renderBracketChallengeEntries(bracketChallengeEntries);
    }
  }
}

function confirmBracketChallengeHandle() {
  const input = document.getElementById("bracket-handle");
  const statusEl = document.getElementById("bracket-status");
  const handle = formatBracketHandle(input?.value || "");
  if (!handle) {
    if (statusEl) {
      statusEl.textContent = "Type your real @ first.";
      statusEl.className = "bracket-status error";
    }
    return;
  }
  localStorage.setItem(BRACKET_CHALLENGE_HANDLE_KEY, handle);
  localStorage.setItem(BRACKET_CHALLENGE_CONFIRMED_KEY, "1");
  renderBracketChallenge(currentBracketChallengeSeeds);
  const nextStatus = document.getElementById("bracket-status");
  if (nextStatus) {
    nextStatus.textContent = BRACKET_CHALLENGE_OPEN
      ? `${handle} confirmed. Fill out your bracket.`
      : `${handle} confirmed. Bracket submissions are not open yet.`;
    nextStatus.className = BRACKET_CHALLENGE_OPEN ? "bracket-status success" : "bracket-status";
  }
}

function setBracketPickValue(key, value) {
  const input = Array.from(document.querySelectorAll(`[name="bracket-${key}"]`)).find(
    (option) => option.value === String(value || "")
  );
  if (input) {
    input.checked = true;
    return true;
  }
  return false;
}

function applyExistingBracketEntry() {
  const entry = getCurrentBracketEntry();
  if (!entry?.picks) return;
  setBracketPickValue("northWildCard", entry.picks.northWildCard);
  setBracketPickValue("lockedWildCard", entry.picks.lockedWildCard);
  syncBracketChallengeDependentRounds();
  setBracketPickValue("northFinal", entry.picks.northFinal);
  setBracketPickValue("lockedFinal", entry.picks.lockedFinal);
  syncBracketChallengeDependentRounds();
  setBracketPickValue("championship", entry.picks.championship);
  const statusEl = document.getElementById("bracket-status");
  if (statusEl) {
    statusEl.textContent = BRACKET_CHALLENGE_OPEN
      ? "Your saved bracket is loaded. You can edit it for now."
      : "Your saved bracket is loaded. Submissions are not open yet.";
    statusEl.className = BRACKET_CHALLENGE_OPEN ? "bracket-status success" : "bracket-status";
  }
}

function renderBracketDependentGame(groupKey, teams, placeholderLabel, disabled, selectedValue) {
  const filledTeams = (Array.isArray(teams) ? teams : []).filter((team) => getBracketTeamValue(team));
  const pickRows = filledTeams.map((team) => renderBracketPickButton(groupKey, team, disabled, selectedValue)).join("");
  return `${pickRows}${filledTeams.length < 2 ? renderBracketPlaceholder(placeholderLabel) : ""}`;
}

function renderBracketChampionshipGame(finalTeams, disabled, selectedValue) {
  const northTeam = finalTeams.find((team) => team?.seedLabel === "North") || null;
  const lockedTeam = finalTeams.find((team) => team?.seedLabel === "Locked") || null;
  return `
    ${northTeam ? renderBracketPickButton("championship", northTeam, disabled, selectedValue) : renderBracketPlaceholder("North Champion")}
    ${lockedTeam ? renderBracketPickButton("championship", lockedTeam, disabled, selectedValue) : renderBracketPlaceholder("Locked PSP Champion")}
  `;
}

function syncBracketChallengeDependentRounds() {
  if (!currentBracketChallengeSeeds) return;
  const matchups = getBracketMatchupsFromSeeds(currentBracketChallengeSeeds);
  const isConfirmed = Boolean(getConfirmedBracketHandle());
  const canPick = BRACKET_CHALLENGE_OPEN && isConfirmed;
  const picks = getBracketChallengePicks();
  const northFinalTeams = [matchups.northFinal.bye, { team: picks.northWildCard, seedLabel: "WC" }].filter((team) => getBracketTeamValue(team));
  const lockedFinalTeams = [matchups.lockedFinal.bye, { team: picks.lockedWildCard, seedLabel: "WC" }].filter((team) => getBracketTeamValue(team));
  const northFinalEl = document.getElementById("bracket-north-final-picks");
  const lockedFinalEl = document.getElementById("bracket-locked-final-picks");
  const championshipEl = document.getElementById("bracket-championship-picks");
  if (northFinalEl) {
    northFinalEl.innerHTML = renderBracketDependentGame(
      "northFinal",
      northFinalTeams,
      "North WC Winner",
      !canPick || !picks.northWildCard,
      picks.northFinal
    );
  }
  if (lockedFinalEl) {
    lockedFinalEl.innerHTML = renderBracketDependentGame(
      "lockedFinal",
      lockedFinalTeams,
      "Locked PSP WC Winner",
      !canPick || !picks.lockedWildCard,
      picks.lockedFinal
    );
  }
  const updatedPicks = getBracketChallengePicks();
  const finalTeams = [
    updatedPicks.northFinal ? { team: updatedPicks.northFinal, seedLabel: "North" } : null,
    updatedPicks.lockedFinal ? { team: updatedPicks.lockedFinal, seedLabel: "Locked" } : null,
  ].filter(Boolean);
  if (championshipEl) {
    championshipEl.innerHTML = renderBracketChampionshipGame(
      finalTeams,
      !canPick || finalTeams.length < 2,
      updatedPicks.championship
    );
  }
}

function renderBracketChallenge(seeds) {
  if (!els.bracketChallenge) return;
  currentBracketChallengeSeeds = seeds;
  const matchups = getBracketMatchupsFromSeeds(seeds);
  const savedHandle = localStorage.getItem(BRACKET_CHALLENGE_HANDLE_KEY) || "";
  const confirmedHandle = getConfirmedBracketHandle();
  const isConfirmed = Boolean(confirmedHandle);
  const canPick = BRACKET_CHALLENGE_OPEN && isConfirmed;
  const currentEntry = getBracketEntryForHandle(confirmedHandle);
  els.bracketChallenge.innerHTML = `
    <div class="dashboard-bracket-rounds bracket-challenge-rounds">
      <section class="dashboard-bracket-round">
        <div class="dashboard-bracket-round-head">
          <h3>Wild Card</h3>
          <span>Division #2 hosts division #3.</span>
        </div>
        <div class="dashboard-bracket-games">
          <article class="dashboard-bracket-game">
            <div class="dashboard-bracket-game-label">${escapeHtml(matchups.northWildCard.label)}</div>
            ${matchups.northWildCard.teams.map((team) => renderBracketPickButton("northWildCard", team, !canPick, currentEntry?.picks?.northWildCard)).join("")}
          </article>
          <article class="dashboard-bracket-game">
            <div class="dashboard-bracket-game-label">${escapeHtml(matchups.lockedWildCard.label)}</div>
            ${matchups.lockedWildCard.teams.map((team) => renderBracketPickButton("lockedWildCard", team, !canPick, currentEntry?.picks?.lockedWildCard)).join("")}
          </article>
        </div>
      </section>
      <section class="dashboard-bracket-round">
        <div class="dashboard-bracket-round-head">
          <h3>Semifinals</h3>
          <span>Division winners receive byes.</span>
        </div>
        <div class="dashboard-bracket-games">
          <article class="dashboard-bracket-game">
            <div class="dashboard-bracket-game-label">${escapeHtml(matchups.northFinal.label)}</div>
            <div id="bracket-north-final-picks" class="bracket-dependent-picks"></div>
          </article>
          <article class="dashboard-bracket-game">
            <div class="dashboard-bracket-game-label">${escapeHtml(matchups.lockedFinal.label)}</div>
            <div id="bracket-locked-final-picks" class="bracket-dependent-picks"></div>
          </article>
        </div>
      </section>
      <section class="dashboard-bracket-round">
        <div class="dashboard-bracket-round-head">
          <h3>Championship</h3>
          <span>Pick the RSKL Finals winner.</span>
        </div>
        <div class="dashboard-bracket-games">
          <article class="dashboard-bracket-game">
            <div class="dashboard-bracket-game-label">${escapeHtml(matchups.championship.label)}</div>
            <div id="bracket-championship-picks" class="bracket-dependent-picks"></div>
          </article>
        </div>
      </section>
    </div>
    <div class="bracket-challenge-control">
      <div class="bracket-entry-card">
        <label class="bracket-handle-label" for="bracket-handle">Your Real @</label>
        <div class="bracket-handle-lock">
          <input id="bracket-handle" class="bracket-handle-input" type="text" placeholder="@yourname" value="${escapeHtml(confirmedHandle || savedHandle)}" ${isConfirmed ? "disabled" : ""} />
          <button id="bracket-confirm-user" class="btn ghost bracket-confirm-user" type="button" ${isConfirmed ? "disabled" : ""}>${isConfirmed ? "Confirmed" : "Confirm User"}</button>
          <button id="bracket-save" class="btn ghost bracket-save" type="button" ${canPick ? "" : "disabled"}>Save Bracket</button>
        </div>
        <div class="bracket-confirm-note">
          ${
            BRACKET_CHALLENGE_OPEN
              ? isConfirmed
                ? `${escapeHtml(confirmedHandle)} is locked to your bracket. Picks can still be edited for now.`
                : "Confirm your user before making picks."
              : "Bracket challenge submissions are not open yet."
          }
        </div>
        <div id="bracket-status" class="bracket-status" role="status">${
          currentEntry
            ? BRACKET_CHALLENGE_OPEN
              ? "Your saved bracket is loaded. You can edit it for now."
              : "Your saved bracket is loaded. Submissions are not open yet."
            : BRACKET_CHALLENGE_OPEN
              ? ""
              : "Waiting for brackets to open."
        }</div>
      </div>
    </div>
    <section class="bracket-entry-card bracket-submitted-card">
      <div class="bracket-entry-card-head">
        <h4>Your Submitted Bracket</h4>
        <span>Champion pick</span>
      </div>
      <div id="bracket-entry-list" class="bracket-entry-list">
        ${renderBracketChallengeEntries(bracketChallengeEntries)}
      </div>
    </section>
  `;
  syncBracketChallengeDependentRounds();
  loadBracketChallengeEntries();
}

function renderDashboardPlayoffBracket(standingsRows) {
  if (!els.playoffBracket) return;
  const groups = buildDashboardPlayoffSeeds(standingsRows);
  const north = (groups.get("North") || []).slice(0, 3).map((row, index) => ({
    ...row,
    division: "North",
    seedLabel: `N${index + 1}`,
  }));
  const locked = (groups.get("Locked PSP") || []).slice(0, 3).map((row, index) => ({
    ...row,
    division: "Locked PSP",
    seedLabel: `L${index + 1}`,
  }));

  if (north.length < 3 || locked.length < 3) {
    els.playoffBracket.innerHTML = buildStateCard("Bracket Unavailable", "Need at least three teams from each division.");
    if (els.bracketChallenge) {
      els.bracketChallenge.innerHTML = buildStateCard("Bracket Challenge Unavailable", "Need at least three teams from each division.");
    }
    return;
  }
  const seeds = { north, locked };
  const northWildCardWinner =
    north.find((seed) => normalizeTeamName(seed.team) === normalizeTeamName(C2S3_PLAYOFF_ADVANCEMENTS.northWildCard)) || null;
  const lockedWildCardWinner =
    locked.find((seed) => normalizeTeamName(seed.team) === normalizeTeamName(C2S3_PLAYOFF_ADVANCEMENTS.lockedWildCard)) || null;
  const northChampion =
    north.find((seed) => normalizeTeamName(seed.team) === normalizeTeamName(C2S3_PLAYOFF_ADVANCEMENTS.northFinal)) || null;
  const lockedChampion =
    locked.find((seed) => normalizeTeamName(seed.team) === normalizeTeamName(C2S3_PLAYOFF_ADVANCEMENTS.lockedFinal)) || null;

  const rounds = [
    {
      title: "Wild Card",
      note: "Division #2 hosts division #3.",
      games: [
        { label: "North Wild Card", top: north[1], bottom: north[2], winner: C2S3_PLAYOFF_ADVANCEMENTS.northWildCard },
        { label: "Locked PSP Wild Card", top: locked[1], bottom: locked[2], winner: C2S3_PLAYOFF_ADVANCEMENTS.lockedWildCard },
      ],
    },
    {
      title: "Semifinals",
      note: "Division winners receive byes.",
      games: [
        { label: "North Final", top: north[0], bottom: northWildCardWinner, bottomLabel: "North WC Winner", winner: C2S3_PLAYOFF_ADVANCEMENTS.northFinal },
        { label: "Locked PSP Final", top: locked[0], bottom: lockedWildCardWinner, bottomLabel: "Locked PSP WC Winner", winner: C2S3_PLAYOFF_ADVANCEMENTS.lockedFinal },
      ],
    },
    {
      title: "Championship",
      note: "Division champions meet for the title.",
      games: [
        { label: "RSKL Finals", top: northChampion, topLabel: "North Champion", bottom: lockedChampion, bottomLabel: "Locked PSP Champion" },
      ],
    },
  ];
  currentDashboardBracketGames = rounds.flatMap((round) =>
    round.games.map((game) => ({ ...game, roundTitle: round.title }))
  );
  let bracketGameIndex = 0;

  els.playoffBracket.innerHTML = `
    <div class="dashboard-bracket-rounds">
      ${rounds
        .map(
          (round) => `
            <section class="dashboard-bracket-round">
              <div class="dashboard-bracket-round-head">
                <h3>${escapeHtml(round.title)}</h3>
                <span>${escapeHtml(round.note)}</span>
              </div>
              <div class="dashboard-bracket-games">
                ${round.games
                  .map((game) => renderBracketMatchup(game, bracketGameIndex++))
                  .join("")}
              </div>
            </section>
          `
        )
        .join("")}
    </div>
  `;
  renderBracketChallenge(seeds);
  setBracketView(activeBracketView);
}

function parseTeamHeader(value) {
  const text = String(value || "").trim();
  if (!text) return { name: "", score: "" };
  const match = text.match(/^(.*?)(?:\(([-+]?\d+)\))?\s*$/);
  const name = displayTeamName(String(match ? match[1] : text).trim());
  const score = match && match[2] ? String(match[2]).trim() : "";
  return { name, score };
}

function extractLeagueDay(rows) {
  const row = rows.find(
    (r) =>
      String(r[0] || "").includes("League Day") ||
      String(r[1] || "").includes("League Day")
  );
  if (!row) return "";
  const cell = String(row[0] || row[1] || "");
  const parts = cell.split(":");
  const value = parts.length > 1 ? parts[1].trim() : cell.trim();
  return normalizeDateToken(value) || value;
}

function buildGameKey(dateToken, team1, team2) {
  return `${String(dateToken || "").trim()}|${normalizeTeamName(team1)}|${normalizeTeamName(team2)}`;
}

function normalizeLivePlayerCell(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^c$/i.test(raw)) return "";
  return raw
    .replace(/\s+\(?c\)?$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isLivePlayerCell(value) {
  return normalizeLivePlayerCell(value).startsWith("@");
}

function isLiveCaptainCell(value) {
  const raw = String(value || "").trim();
  return /\s+\(?c\)?$/i.test(raw);
}

function isLikelyLiveHeader(left, right) {
  const leftText = String(left || "").trim();
  const rightText = String(right || "").trim();
  if (!leftText || !rightText) return false;
  if (isLivePlayerCell(leftText) || isLivePlayerCell(rightText)) return false;

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

function buildLivePlayerEntry(value, points, rank) {
  return {
    player: normalizeLivePlayerCell(value),
    isCaptain: isLiveCaptainCell(value),
    points: String(points || "").trim(),
    rank: String(rank || "").trim(),
  };
}

function formatLivePlayerDisplay(player) {
  if (!player) return "";
  return player.isCaptain ? `${player.player} (C)` : player.player;
}

function parseLiveGames(rows) {
  const games = [];
  if (!rows.length) return games;
  const dateToken = extractLeagueDay(rows);
  if (!dateToken) return games;

  const startIndex = rows.findIndex(
    (row) =>
      String(row[0] || "").includes("League Day") ||
      String(row[1] || "").includes("League Day")
  );
  const dataRows = rows.slice(startIndex >= 0 ? startIndex + 1 : 0);

  let current = null;
  dataRows.forEach((row) => {
    const left = String(row[0] || "").trim();
    const right = String(row[LIVE_RIGHT_NAME_COL] || "").trim();

    if (isLikelyLiveHeader(left, right)) {
      current = { header: row, players: [] };
      games.push(current);
      return;
    }

    if (current && (left || right)) {
      current.players.push(row);
    }
  });

  return games
    .map((game) => {
      const header = game.header || [];
      const team1 = parseTeamHeader(header[0]);
      const team2 = parseTeamHeader(header[LIVE_RIGHT_NAME_COL]);
      if (!team1.name || !team2.name) return null;
      return {
        dateToken,
        team1: team1.name,
        team2: team2.name,
        team1Score: team1.score || "",
        team2Score: team2.score || "",
        team1Header: String(header[0] || "").trim(),
        team2Header: String(header[LIVE_RIGHT_NAME_COL] || "").trim(),
        team1Players: game.players
          .filter((row) => isLivePlayerCell(row[0]))
          .map((row) => buildLivePlayerEntry(row[0], row[1], row[2])),
        team2Players: game.players
          .filter((row) => isLivePlayerCell(row[LIVE_RIGHT_NAME_COL]))
          .map((row) =>
            buildLivePlayerEntry(
              row[LIVE_RIGHT_NAME_COL],
              row[LIVE_RIGHT_POINTS_COL],
              row[LIVE_RIGHT_RANK_COL]
            )
          ),
      };
    })
    .filter(Boolean);
}

function renderLiveScoring(games, seasonRaw) {
  if (!els.liveRow) return;
  currentLiveGames = games || [];
  if (seasonRaw !== "c2s3-regular" && seasonRaw !== "c2s3-playoffs") {
    els.liveRow.innerHTML = buildStateCard(
      "Live Scoring Off",
      "Live box scores are only available during the current C2S3 feed."
    );
    return;
  }
  if (!currentLiveGames.length) {
    els.liveRow.innerHTML = buildStateCard(
      "No Live Games",
      "No active matchups are showing in the current live scoring sheet."
    );
    return;
  }

  els.liveRow.innerHTML = `
    <div class="live-list dashboard-live-list">
      ${currentLiveGames
        .map(
          (game, index) => `
            <button class="live-row-item dashboard-live-card ${getTeamColorClass(game.team1)} ${getTeamColorClass(game.team2)}" type="button" data-live-index="${index}">
              <div class="dashboard-live-head">
                <span class="dashboard-live-badge">LIVE</span>
                <span class="dashboard-live-date">${escapeHtml(formatDateLabel(game.dateToken || ""))}</span>
              </div>
              <div class="live-matchup">
                <strong class="live-team-name ${getTeamColorClass(game.team1)}">${renderSmallTeamLogo(game.team1)}<span>${escapeHtml(game.team1)}</span></strong>
                <span class="dashboard-live-score">${escapeHtml(game.team1Score || "—")}</span>
              </div>
              <div class="live-matchup">
                <strong class="live-team-name ${getTeamColorClass(game.team2)}">${renderSmallTeamLogo(game.team2)}<span>${escapeHtml(game.team2)}</span></strong>
                <span class="dashboard-live-score">${escapeHtml(game.team2Score || "—")}</span>
              </div>
              <span class="dashboard-live-cta">Open live box score</span>
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function buildGameFlowMarkup(team1Name, team2Name, snapshots) {
  const items = Array.isArray(snapshots) ? snapshots : [];
  if (!items.length) {
    return `<div class="game-flow-shell"><div class="boxscore-empty">No game flow snapshots yet.</div></div>`;
  }

  const normalized = items
    .map((item) => ({
      label: String(item.snapshot_label || item.label || "").trim(),
      minute: Number(item.snapshot_minute ?? item.minute ?? 0),
      team1Score: Number(item.team1_score ?? item.team1Score ?? 0),
      team2Score: Number(item.team2_score ?? item.team2Score ?? 0),
    }))
    .sort((a, b) => a.minute - b.minute);

  const maxScore = Math.max(
    1,
    ...normalized.map((item) => Math.max(item.team1Score, item.team2Score))
  );
  const width = 680;
  const height = 260;
  const padX = 44;
  const padY = 24;
  const stepX =
    normalized.length > 1 ? (width - padX * 2) / (normalized.length - 1) : 0;
  const scoreToY = (score) =>
    height - padY - (Math.max(0, score) / maxScore) * (height - padY * 2);
  const pointX = (index) => padX + stepX * index;
  const linePoints = (key) =>
    normalized
      .map((item, index) => `${pointX(index)},${scoreToY(item[key])}`)
      .join(" ");

  const svg = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Game flow chart">
      <line class="game-flow-axis" x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" />
      <line class="game-flow-axis" x1="${padX}" y1="${padY}" x2="${padX}" y2="${height - padY}" />
      <polyline class="game-flow-line team1" points="${linePoints("team1Score")}" />
      <polyline class="game-flow-line team2" points="${linePoints("team2Score")}" />
      ${normalized
        .map((item, index) => {
          const x = pointX(index);
          const y1 = scoreToY(item.team1Score);
          const y2 = scoreToY(item.team2Score);
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

  const latest = normalized[normalized.length - 1] || null;
  const checkpoints = latest
    ? (() => {
        const diff = latest.team1Score - latest.team2Score;
        const leader =
          diff === 0
            ? "Tied game"
            : diff > 0
            ? `${team1Name} +${diff}`
            : `${team2Name} +${Math.abs(diff)}`;
        return `
          <div class="game-flow-checkpoint">
            <div class="game-flow-checkpoint-time">${escapeHtml(latest.label)}</div>
            <div class="game-flow-checkpoint-score">${escapeHtml(team1Name)} ${latest.team1Score} - ${latest.team2Score} ${escapeHtml(team2Name)}</div>
            <div class="game-flow-checkpoint-leader">${escapeHtml(leader)}</div>
          </div>
        `;
      })()
    : "";

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
  return `
    <div class="boxscore-view-shell"
      data-flow-game-key="${escapeHtml(config.gameKey)}"
      data-flow-season="${escapeHtml(config.season)}"
      data-flow-team1="${escapeHtml(config.team1Name)}"
      data-flow-team2="${escapeHtml(config.team2Name)}">
      <div class="boxscore-view-tabs">
        <button class="boxscore-view-tab active" type="button" data-box-view="boxscore">Box Score</button>
        <button class="boxscore-view-tab" type="button" data-box-view="flow">Game Flow</button>
      </div>
      <div class="boxscore-view-panel" data-box-panel="boxscore">${innerHtml}</div>
      <div class="boxscore-view-panel" data-box-panel="flow" hidden>
        <div class="boxscore-empty">Loading game flow…</div>
      </div>
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

function detectScheduleIndexes(rows, seasonRaw) {
  const header = (rows[0] || []).map((cell) => String(cell || "").trim().toLowerCase());
  const findIdx = (checks) => header.findIndex((value) => checks.some((check) => value.includes(check)));
  let date = findIdx(["date"]);
  const explicitTeam1 = findIdx(["team 1", "team1"]);
  const explicitTeam2 = findIdx(["team 2", "team2"]);
  const home = findIdx(["home"]);
  const away = findIdx(["away"]);
  let team1 = explicitTeam1 !== -1 ? explicitTeam1 : home !== -1 ? home : away;
  let team2 = explicitTeam2 !== -1 ? explicitTeam2 : away !== -1 ? away : home;
  let gameType = findIdx(["game type", "type"]);
  let winner = findIdx(["winner"]);

  if (seasonRaw === "c2s2-regular") {
    if (date === -1) date = 0;
    if (team1 === -1) team1 = 1;
    if (team2 === -1) team2 = 2;
    if (gameType === -1 && (rows[0] || []).length >= 5) gameType = 4;
  } else if (seasonRaw === "c2s1-regular" || seasonRaw === "c2s1-post") {
    if (date === -1) date = 0;
    if (team1 === -1) team1 = 1;
    if (team2 === -1) team2 = 2;
  } else {
    if (date === -1) date = (rows[0] || []).length >= 4 ? 1 : 0;
    if (team1 === -1) team1 = (rows[0] || []).length >= 4 ? 2 : 1;
    if (team2 === -1) team2 = (rows[0] || []).length >= 4 ? 3 : 2;
  }

  return { date, team1, team2, gameType, winner };
}

function buildScheduleGames(rows, seasonRaw) {
  if (!rows.length) return [];
  const indexes = detectScheduleIndexes(rows, seasonRaw);
  return rows
    .slice(1)
    .filter((row) => row.some((cell) => String(cell || "").trim() !== ""))
    .map((row) => {
      const rawDate = String(row[indexes.date] || "").trim();
      const dateToken = normalizeDateToken(rawDate);
      const team1 = displayTeamName(String(row[indexes.team1] || "").trim());
      const team2 = displayTeamName(String(row[indexes.team2] || "").trim());
      const gameType = indexes.gameType >= 0 ? String(row[indexes.gameType] || "").trim() : "";
      const winner = indexes.winner >= 0 ? displayTeamName(String(row[indexes.winner] || "").trim()) : "";
      if (!dateToken || !team1 || !team2) return null;
      return {
        rawDate,
        dateToken,
        dateObj: parseDateFromToken(dateToken),
        team1,
        team2,
        gameType,
        winner,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.dateObj && b.dateObj) return a.dateObj - b.dateObj;
      if (a.dateObj) return -1;
      if (b.dateObj) return 1;
      return a.dateToken.localeCompare(b.dateToken, undefined, { numeric: true });
    });
}

function extractLooseScheduleGames(rows) {
  const seen = new Set();
  return (rows || [])
    .map((row) => {
      const cells = (row || []).map((cell) => String(cell || "").trim()).filter(Boolean);
      const dateCell = cells.find((cell) => normalizeDateToken(cell));
      const teams = cells
        .map((cell) => displayTeamName(cell))
        .filter((team) => KNOWN_LIVE_TEAMS.has(normalizeTeamName(team)));
      const uniqueTeams = [];
      teams.forEach((team) => {
        if (!uniqueTeams.some((existing) => normalizeTeamName(existing) === normalizeTeamName(team))) {
          uniqueTeams.push(team);
        }
      });
      if (!dateCell || uniqueTeams.length < 2) return null;
      const dateToken = normalizeDateToken(dateCell);
      const gameType = cells.find((cell) => /playoff|wild|semi|final|champ/i.test(cell)) || "";
      const winner = uniqueTeams.find((team) =>
        cells.some((cell) => normalizeTeamName(cell) === normalizeTeamName(team) && cell !== uniqueTeams[0] && cell !== uniqueTeams[1])
      ) || "";
      return {
        rawDate: dateCell,
        dateToken,
        dateObj: parseDateFromToken(dateToken),
        team1: uniqueTeams[0],
        team2: uniqueTeams[1],
        gameType,
        winner,
      };
    })
    .filter(Boolean)
    .filter((game) => {
      const key = buildGameKey(game.dateToken, game.team1, game.team2);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      if (a.dateObj && b.dateObj) return a.dateObj - b.dateObj;
      if (a.dateObj) return -1;
      if (b.dateObj) return 1;
      return a.dateToken.localeCompare(b.dateToken, undefined, { numeric: true });
    });
}

function getFeaturedGames(scheduleGames, liveGames) {
  if (!scheduleGames.length) return [];
  const liveByKey = new Map((liveGames || []).map((game) => [buildGameKey(game.dateToken, game.team1, game.team2), game]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const liveDay = liveGames.length ? liveGames[0].dateToken : "";
  if (liveDay) {
    const liveMatches = scheduleGames.filter((game) => game.dateToken === liveDay);
    if (liveMatches.length) {
      return liveMatches.map((game) => ({
        ...game,
        state: "live",
        live: liveByKey.get(buildGameKey(game.dateToken, game.team1, game.team2)) || null,
      }));
    }
  }

  const upcoming = scheduleGames.filter((game) => {
    if (!game.dateObj) return false;
    const date = new Date(game.dateObj);
    date.setHours(0, 0, 0, 0);
    return date >= today;
  });
  const source = upcoming.length ? upcoming : scheduleGames;
  const featureDay = source[0]?.dateToken || "";
  return source
    .filter((game) => game.dateToken === featureDay)
    .slice(0, 4)
    .map((game) => ({
      ...game,
      state: "upcoming",
      live: null,
    }));
}

function renderFeaturedMatchups(games, seasonRaw) {
  if (!els.featuredMatchups) return;
  if (!games.length) {
    els.featuredMatchups.innerHTML = buildStateCard(
      "No Featured Games",
      seasonRaw === "c2s1-regular"
        ? "Archived season has no feature-ready schedule block."
        : "Add future-dated games to the schedule feed."
    );
    return;
  }

  els.featuredMatchups.innerHTML = games
    .map((game) => {
      const live = game.live;
      const status = live ? "LIVE" : game.gameType || (seasonRaw === "c2s3-regular" ? "Upcoming" : "Featured");
      const middleMarkup = live
        ? `<div class="dashboard-matchup-score">${escapeHtml(`${live.team1Score || "—"} - ${live.team2Score || "—"}`)}</div>`
        : `<div class="dashboard-matchup-divider" aria-hidden="true"><span>vs</span></div>`;
      return `
        <article class="dashboard-matchup-card ${getTeamColorClass(game.team1)}">
          <div class="dashboard-matchup-head">
            <span class="dashboard-matchup-badge">${escapeHtml(status)}</span>
            <span class="dashboard-matchup-date">${escapeHtml(formatDateLabel(game.dateToken))}</span>
          </div>
          <div class="dashboard-matchup-body">
            <a class="dashboard-matchup-team" href="/team.html?team=${encodeURIComponent(game.team1)}">${renderSmallTeamLogo(game.team1)}<span>${escapeHtml(game.team1)}</span></a>
            ${middleMarkup}
            <a class="dashboard-matchup-team" href="/team.html?team=${encodeURIComponent(game.team2)}">${renderSmallTeamLogo(game.team2)}<span>${escapeHtml(game.team2)}</span></a>
          </div>
          <div class="dashboard-matchup-actions">
            <a class="dashboard-inline-link" href="/schedule.html">Open schedule</a>
          </div>
        </article>
      `;
    })
    .join("");
}

function detectPlayerColumns(headerRow) {
  const lowered = (headerRow || []).map((cell) => String(cell || "").toLowerCase());
  const pick = (label) => lowered.indexOf(label);
  return {
    date: pick("date") !== -1 ? pick("date") : 0,
    team: pick("team") !== -1 ? pick("team") : 1,
    player: pick("player") !== -1 ? pick("player") : 2,
    score: pick("score") !== -1 ? pick("score") : pick("points") !== -1 ? pick("points") : 3,
    rank: pick("rank") !== -1 ? pick("rank") : 4,
    opponent: pick("opponent") !== -1 ? pick("opponent") : 5,
  };
}

function normalizePlayerKey(value) {
  return String(value || "").trim().replace(/^@/, "").toLowerCase();
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

function median(numbers) {
  if (!numbers.length) return null;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function buildDailyBaselines(rows, playerColumns) {
  const byDate = new Map();
  rows.forEach((row) => {
    const dateKey = String(row[playerColumns.date] || "").trim();
    const score = parseNumber(row[playerColumns.score]);
    if (!dateKey || score === null) return;
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, []);
    }
    byDate.get(dateKey).push(score);
  });

  const baselines = new Map();
  byDate.forEach((scores, dateKey) => {
    if (!scores.length) return;
    const sum = scores.reduce((acc, n) => acc + n, 0);
    baselines.set(dateKey, {
      mean: scores.length ? sum / scores.length : null,
      median: median(scores),
    });
  });
  return baselines;
}

function buildLeaderboard(rows, playerColumns) {
  const baselines = buildDailyBaselines(rows, playerColumns);
  const totals = new Map();
  rows.forEach((row) => {
    const rawNameWithMarker = String(row[playerColumns.player] || "").trim();
    const tag = stripCaptainMarker(rawNameWithMarker);
    const team = displayTeamName(String(row[playerColumns.team] || "").trim());
    const baseScore = parseNumber(row[playerColumns.score]);
    const score =
      baseScore === null
        ? null
        : isCaptainMarked(rawNameWithMarker)
        ? baseScore - 0.5
        : baseScore;
    const rank = parseNumber(row[playerColumns.rank]);
    if (!tag || score === null) return;
    const key = normalizePlayerKey(tag);
    const entry = totals.get(key) || {
      tag,
      displayName: tag,
      team,
      total: 0,
      gp: 0,
      rankSum: 0,
      rankGames: 0,
      war: 0,
    };
    entry.total += score;
    entry.gp += 1;
    const dateKey = String(row[playerColumns.date] || "").trim();
    const baseline = baselines.get(dateKey);
    if (baseline && baseline.median && baseline.median > 0) {
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
    totals.set(key, entry);
  });

  return Array.from(totals.values()).map((entry) => ({
    ...entry,
    avg: entry.gp ? entry.total / entry.gp : 0,
    avgRank: entry.rankGames ? entry.rankSum / entry.rankGames : 0,
  }));
}

function buildDashboardTeamLeaders(teamName) {
  const columns = currentBracketPreviewPlayerColumns;
  const rows = currentBracketPreviewPlayerRows || [];
  if (!columns || columns.team < 0 || columns.player < 0 || columns.score < 0) {
    return {};
  }
  const baselines = buildDailyBaselines(rows, columns);
  const totals = new Map();
  rows.forEach((row) => {
    const team = displayTeamName(String(row[columns.team] || "").trim());
    if (team !== teamName) return;
    const rawName = String(row[columns.player] || "").trim();
    const player = stripCaptainMarker(rawName);
    const baseScore = parseNumber(row[columns.score]);
    if (!player || baseScore === null) return;
    const score = isCaptainMarked(rawName) ? baseScore - 0.5 : baseScore;
    const key = normalizePlayerKey(player);
    const entry = totals.get(key) || {
      player,
      gp: 0,
      total: 0,
      rel: 0,
      relGames: 0,
      war: 0,
    };
    entry.gp += 1;
    entry.total += score;
    const dateKey = String(row[columns.date] || "").trim();
    const baseline = baselines.get(dateKey);
    if (baseline && baseline.median && baseline.median > 0) {
      entry.rel += score / baseline.median;
      entry.relGames += 1;
      const replacementScore = 0.9 * baseline.median;
      const avgMargin = 0.92 * baseline.median;
      if (avgMargin > 0) {
        entry.war += (score - replacementScore) / avgMargin;
      }
    }
    totals.set(key, entry);
  });

  const players = Array.from(totals.values()).map((entry) => ({
    ...entry,
    avg: entry.gp ? entry.total / entry.gp : 0,
    rel: entry.relGames ? entry.rel / entry.relGames : 0,
  }));
  return {
    topAvg: [...players].sort((a, b) => b.avg - a.avg)[0] || null,
    topRel: [...players].sort((a, b) => b.rel - a.rel)[0] || null,
    topWar: [...players].sort((a, b) => b.war - a.war)[0] || null,
  };
}

function renderLeagueLeaders(rows, seasonRaw) {
  if (!els.leagueLeaders) return;
  if (!rows.length) {
    els.leagueLeaders.innerHTML = buildStateCard(
      "No League Leaders",
      seasonRaw === "c2s1-regular"
        ? "Player stats are not available for C2S1 regular season in the current archive feed."
        : "Player stats could not be loaded for this season."
    );
    return;
  }

  const metrics = [
    {
      title: "Score Average",
      subtitle: "Best per-game scorer",
      list: [...rows].sort((a, b) => b.avg - a.avg).slice(0, 5),
      formatter: (item) => item.avg.toFixed(2),
    },
    {
      title: "Total Score",
      subtitle: "Most total points",
      list: [...rows].sort((a, b) => b.total - a.total).slice(0, 5),
      formatter: (item) => item.total.toFixed(0),
    },
    {
      title: "WAR",
      subtitle: "Value leader",
      list: [...rows].sort((a, b) => b.war - a.war).slice(0, 5),
      formatter: (item) => item.war.toFixed(2),
    },
  ];

  els.leagueLeaders.innerHTML = `
    <div class="dashboard-leaders-grid">
      ${metrics
        .map((metric) => renderLeaderMetricCard(metric, seasonRaw))
        .join("")}
    </div>
  `;

  els.leagueLeaders.querySelectorAll(".dashboard-leader-card").forEach((card) => {
    const firstRow = card.querySelector(".dashboard-leader-rankrow");
    if (firstRow) {
      updateLeaderPreview(card, firstRow);
    }
  });

  if (!els.leagueLeaders.dataset.leaderBound) {
    els.leagueLeaders.dataset.leaderBound = "1";
    els.leagueLeaders.addEventListener("mouseover", (event) => {
      const row = event.target.closest(".dashboard-leader-rankrow");
      if (!row || !els.leagueLeaders.contains(row)) return;
      const card = row.closest(".dashboard-leader-card");
      if (card) updateLeaderPreview(card, row);
    });
    els.leagueLeaders.addEventListener("click", (event) => {
      const row = event.target.closest(".dashboard-leader-rankrow");
      if (!row || !els.leagueLeaders.contains(row)) return;
      const card = row.closest(".dashboard-leader-card");
      if (card) updateLeaderPreview(card, row);
    });
  }

  hydrateDashboardPlayerAvatars(
    metrics.flatMap((metric) => metric.list || []).filter(Boolean).slice(0, 15),
    seasonRaw
  );
}

function renderLeaderMetricCard(metric, seasonRaw) {
  const topFive = [...(metric.list || [])].slice(0, 5);
  const leader = topFive[0];
  if (!leader) return buildStateCard(metric.title, "No qualifying player.");
  const renderRow = (item, index) => {
    const value = metric.formatter(item);
    return `
      <button class="dashboard-leader-rankrow ${index === 0 ? "is-top" : ""}" type="button"
        data-leader-player="${escapeHtml(item.tag)}"
        data-leader-team="${escapeHtml(item.team || "")}"
        data-leader-gp="${escapeHtml(String(item.gp || 0))}"
        data-leader-value="${escapeHtml(String(value))}"
        data-leader-name="${escapeHtml(item.displayName || item.tag || "Player")}"
        data-leader-avatar="${escapeHtml(item.tag || "")}">
        <span class="dashboard-leader-rankpos">${index + 1}.</span>
        <span class="dashboard-leader-rankname">${escapeHtml(item.displayName || item.tag || "Player")}</span>
        <span class="dashboard-leader-rankvalue">${escapeHtml(String(value))}</span>
      </button>
    `;
  };
  return `
    <article class="leader-card dashboard-leader-card">
      <div class="dashboard-leader-headline">
        <div class="dashboard-leader-hero">
          <div class="dashboard-leader-avatar">${buildPlayerAvatarMarkup(leader)}</div>
          <div class="dashboard-leader-hero-copy">
            <div class="dashboard-leader-kicker">${escapeHtml(metric.title)}</div>
            <div class="leader-name">${escapeHtml(leader.displayName || leader.tag || "Player")}</div>
            <div class="dashboard-leader-subhead">${escapeHtml(leader.team || "—")} • ${escapeHtml(metric.subtitle)}</div>
          </div>
        </div>
        <div class="dashboard-leader-hero-value">
          <div class="leader-value">${escapeHtml(metric.formatter(leader))}</div>
          <div class="dashboard-leader-value-label">${escapeHtml(metric.title.toUpperCase())}</div>
        </div>
      </div>
      <div class="dashboard-leader-list" data-leader-list>
        ${topFive.map((item, index) => renderRow(item, index)).join("")}
      </div>
    </article>
  `;
}

function updateLeaderPreview(card, row) {
  if (!card || !row) return;
  const heroAvatar = card.querySelector(".dashboard-leader-avatar");
  const heroName = card.querySelector(".dashboard-leader-hero-copy .leader-name");
  const heroSubhead = card.querySelector(".dashboard-leader-hero-copy .dashboard-leader-subhead");
  const heroValue = card.querySelector(".dashboard-leader-hero-value .leader-value");
  const team = String(row.dataset.leaderTeam || "—").trim();
  const gp = String(row.dataset.leaderGp || "0").trim();
  const value = String(row.dataset.leaderValue || "—").trim();
  const name = String(row.dataset.leaderName || "Player").trim();
  const avatar = String(row.dataset.leaderAvatar || "P").trim().replace(/^@/, "").slice(0, 1).toUpperCase() || "P";
  if (heroAvatar) heroAvatar.textContent = avatar;
  if (heroName) heroName.textContent = name;
  if (heroSubhead) heroSubhead.textContent = `${team} • ${card.querySelector(".dashboard-leader-kicker")?.textContent || ""}`.trim();
  if (heroValue) heroValue.textContent = value;
}


function extractPlayers(text) {
  return String(text || "").match(/@[A-Za-z0-9_.]+/g) || [];
}

function parseTradeRows(rows) {
  return rows
    .filter((row) => row.some((cell) => String(cell || "").trim() !== ""))
    .map((row) => ({
      date: String(row[0] || "").trim() || "—",
      type: "Trade",
      summary: `${displayTeamName(row[1] || "Team 1")} gets ${String(row[2] || "").trim() || "—"} • ${displayTeamName(row[3] || "Team 2")} gets ${String(row[4] || "").trim() || "—"}`,
      team1: displayTeamName(row[1] || ""),
      team1Gets: String(row[2] || "").trim() || "—",
      team2: displayTeamName(row[3] || ""),
      team2Gets: String(row[4] || "").trim() || "—",
      teams: [displayTeamName(row[1] || ""), displayTeamName(row[3] || "")].filter(Boolean),
      players: Array.from(new Set([...extractPlayers(row[2]), ...extractPlayers(row[4])])),
    }));
}

function parseSinglePartyRows(rows, type) {
  return rows
    .filter((row) => row.some((cell) => String(cell || "").trim() !== ""))
    .map((row) => {
      const player = String(row[0] || row[1] || "").trim();
      const mergedCell = String(row[2] || row[3] || "").trim();
      const dateMatch = mergedCell.match(/^(\d{1,2}\/\d{1,2})/);
      const date = dateMatch ? dateMatch[1] : "—";
      const team = displayTeamName(mergedCell.replace(/^(\d{1,2}\/\d{1,2})/, "").trim());
      const verb =
        type === "Signing"
          ? "signed"
          : type === "Cut"
          ? "cut"
          : "retired";
      return {
        date,
        type,
        summary: `${player || "Player"} ${verb}${team ? ` • ${team}` : ""}`,
        team,
        teams: team ? [team] : [],
        players: player ? [player] : [],
      };
    });
}

function renderRecentTransactions(items) {
  if (!els.recentTransactions) return;
  if (!items.length) {
    els.recentTransactions.innerHTML = buildStateCard("No Transactions", "No recent transactions were found in the sheet.");
    return;
  }

  els.recentTransactions.innerHTML = items
    .map((item) => {
      const tradeSides =
        item.type === "Trade" && item.team1 && item.team2
          ? `
            <div class="dashboard-trade-sides">
              <div class="dashboard-trade-side">
                <a class="dashboard-trade-team" href="/team.html?team=${encodeURIComponent(item.team1)}">
                  ${renderSmallTeamLogo(item.team1)}
                  <span>${escapeHtml(item.team1)}</span>
                </a>
                <div class="dashboard-trade-return">${escapeHtml(item.team1Gets || "—")}</div>
              </div>
              <div class="dashboard-trade-side">
                <a class="dashboard-trade-team" href="/team.html?team=${encodeURIComponent(item.team2)}">
                  ${renderSmallTeamLogo(item.team2)}
                  <span>${escapeHtml(item.team2)}</span>
                </a>
                <div class="dashboard-trade-return">${escapeHtml(item.team2Gets || "—")}</div>
              </div>
            </div>
          `
          : `<div class="dashboard-transaction-body">${escapeHtml(item.summary)}</div>`;

      return `
        <article class="dashboard-transaction-card">
          <div class="dashboard-transaction-head">
            <span class="dashboard-transaction-type">${escapeHtml(item.type)}</span>
            <span class="dashboard-transaction-date">${escapeHtml(item.date || "—")}</span>
          </div>
          ${tradeSides}
        </article>
      `;
    })
    .join("");
}

function formatArticleDate(value) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildArticleExcerpt(article) {
  const summary = String(article?.summary || "").trim();
  if (summary) return summary;
  const body = String(article?.body || "").replace(/\s+/g, " ").trim();
  return body.length > 180 ? `${body.slice(0, 177)}...` : body;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function articleMentionText(article) {
  return [article?.title, article?.summary, article?.body].filter(Boolean).join(" ");
}

function findMentionedArticleTeams(article) {
  const text = articleMentionText(article);
  if (!text.trim()) return [];
  return TEAM_ORDER.filter((team) => {
    const aliases = [team, displayTeamName(team)];
    if (team === "Bullets" || displayTeamName(team) === "Storm") aliases.push("Storm", "Bullets");
    if (team === "The Future" || displayTeamName(team) === "Dream Team") aliases.push("Dream Team", "The Future");
    if (team === "Yetis" || displayTeamName(team) === "Scorpions") aliases.push("Scorpions", "Yetis", "Scorpians");
    return Array.from(new Set(aliases.filter(Boolean))).some((alias) =>
      new RegExp(`(^|[^a-z0-9])${escapeRegExp(alias)}([^a-z0-9]|$)`, "i").test(text)
    );
  });
}

function findArticleTeamNameByAlias(value) {
  const normalized = normalizeTeamName(value);
  return TEAM_ORDER.map((team) => displayTeamName(team)).find((team) => {
    const aliases = [team, displayTeamName(team)];
    if (team === "Storm") aliases.push("Bullets");
    if (team === "Dream Team") aliases.push("The Future");
    if (team === "Scorpions") aliases.push("Yetis", "Scorpians");
    return Array.from(new Set(aliases.filter(Boolean))).some((alias) => normalizeTeamName(alias) === normalized);
  });
}

function renderArticleInlineTeam(label) {
  const team = findArticleTeamNameByAlias(label);
  if (!team) return escapeHtml(label);
  const logo = renderSmallTeamLogo(team);
  return `<span class="article-inline-team article-inline-team--dashboard">${logo}<span>${escapeHtml(label)}</span></span>`;
}

function renderArticleTeamText(value) {
  const text = String(value || "");
  const aliases = TEAM_ORDER.flatMap((team) => {
    const shown = displayTeamName(team);
    const list = [team, shown];
    if (shown === "Storm") list.push("Bullets");
    if (shown === "Dream Team") list.push("The Future");
    if (shown === "Scorpions") list.push("Yetis", "Scorpians");
    return list;
  })
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  const uniqueAliases = Array.from(new Set(aliases));
  if (!uniqueAliases.length) return escapeHtml(text);
  const teamRegex = new RegExp(`(^|[^a-z0-9])(${uniqueAliases.map(escapeRegExp).join("|")})(?=[^a-z0-9]|$)`, "gi");
  let html = "";
  let lastIndex = 0;
  let match;

  while ((match = teamRegex.exec(text))) {
    const prefix = match[1] || "";
    const teamName = match[2] || "";
    const teamStart = match.index + prefix.length;
    html += escapeHtml(text.slice(lastIndex, teamStart));
    html += renderArticleInlineTeam(teamName);
    lastIndex = teamStart + teamName.length;
  }

  html += escapeHtml(text.slice(lastIndex));
  return html;
}

function renderDashboardArticles(articles) {
  if (!els.dashboardNews) return;
  const latestArticles = (Array.isArray(articles) ? articles : []).slice(0, 3);
  if (!latestArticles.length) {
    els.dashboardNews.innerHTML = buildStateCard("No Articles", "No league articles have been published yet.");
    return;
  }

  const authorItems = [];
  els.dashboardNews.innerHTML = latestArticles
    .map((article) => {
      const title = String(article?.title || "Untitled Article").trim();
      const excerpt = buildArticleExcerpt(article);
      const rawAuthor = String(article?.author || "").trim();
      const author = rawAuthor.toLowerCase() === "commissioner" ? "" : rawAuthor;
      if (author) {
        authorItems.push({ tag: author, player: author, displayName: author });
      }
      const articleId = String(article?.id || "").trim();
      const href = articleId ? `/article.html?id=${encodeURIComponent(articleId)}` : "";
      return `
        <a class="dashboard-news-card dashboard-news-link" href="${escapeHtml(href || "#")}">
          <div class="dashboard-news-meta">
            <span>${escapeHtml(formatArticleDate(article?.created_at || article?.updated_at))}</span>
            ${
              author
                ? `<span class="dashboard-news-author">${buildPlayerAvatarMarkup({
                    tag: author,
                    player: author,
                    displayName: author,
                  })}<span>${escapeHtml(author)}</span></span>`
                : ""
            }
          </div>
          <h3>${renderArticleTeamText(title)}</h3>
          <p>${renderArticleTeamText(excerpt || "No article text.")}</p>
        </a>
      `;
    })
    .join("");
  hydrateDashboardPlayerAvatars(authorItems, getSeasonRaw());
}

async function loadDashboardArticles() {
  if (!els.dashboardNews) return;
  try {
    const response = await fetch(`${NEWS_ARTICLES_API}?content=articles`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    const payload = await response.json();
    renderDashboardArticles(Array.isArray(payload?.articles) ? payload.articles : []);
  } catch (_error) {
    els.dashboardNews.innerHTML = buildStateCard("Articles Unavailable", "League articles could not be loaded right now.");
  }
}

function renderLiveModal(game) {
  if (!els.liveDetails || !els.liveModal || !game) return;

  const renderTeamTable = (header, players) => `
    <div class="boxscore-card">
      <a class="boxscore-team" href="/team.html?team=${encodeURIComponent(displayTeamName(header))}">
        ${renderSmallTeamLogo(header)}
        <span>${escapeHtml(displayTeamName(header))}</span>
      </a>
      <div class="boxscore-row">
        <span>Player</span>
        <span>Points</span>
        <span>Rank</span>
      </div>
      ${(players || [])
        .map(
          (player) => `
            <div class="boxscore-row">
              <a class="boxscore-link" href="/player-detail.html?player=${encodeURIComponent(player.player)}">${renderPlayerName({ player: formatLivePlayerDisplay(player) }, undefined, { rookie: false })}</a>
              <span>${escapeHtml(player.points || "")}</span>
              <span>${escapeHtml(player.rank || "")}</span>
            </div>
          `
        )
        .join("") || '<div class="boxscore-empty">No stats available.</div>'}
    </div>
  `;

  els.liveDetails.innerHTML = buildBoxScoreViewShell(
    `
      <div class="boxscore-meta">League Day: ${escapeHtml(game.dateToken || "")}</div>
      ${renderTeamTable(game.team1, game.team1Players)}
      ${renderTeamTable(game.team2, game.team2Players)}
    `,
    {
      gameKey: buildGameKey(game.dateToken || "", game.team1 || "", game.team2 || ""),
      season: getSeasonRaw(),
      team1Name: game.team1 || "",
      team2Name: game.team2 || "",
    }
  );
  els.liveModal.hidden = false;
}

async function loadData() {
  setDashboardLoading();
  loadDashboardArticles();
  const seasonRaw = getSeasonRaw();
  syncDashboardPanels(seasonRaw);
  currentDashboardScheduleGames = [];
  currentDashboardPlayerRows = [];
  currentDashboardPlayerColumns = null;
  currentBracketPreviewPlayerRows = [];
  currentBracketPreviewPlayerColumns = null;

  if (els.standingsLink) {
    els.standingsLink.href =
      seasonRaw === "c2s2-regular"
        ? C2S2_REGULAR_URL
        : seasonRaw === "c1s2-regular" || seasonRaw === "c1s2-post"
        ? C1S2_STANDINGS_URL
        : seasonRaw === "c1s6-regular" || seasonRaw === "c1s6-post"
        ? C1S6_STANDINGS_URL
        : seasonRaw === "c1s5-regular" || seasonRaw === "c1s5-post"
        ? C1S5_STANDINGS_URL
        : seasonRaw === "c1s4-regular" || seasonRaw === "c1s4-post"
        ? C1S4_STANDINGS_URL
        : seasonRaw === "c1s3-regular" || seasonRaw === "c1s3-post"
        ? C1S3_STANDINGS_URL
        : seasonRaw === "c2s1-post" || seasonRaw === "c2s1-regular"
        ? ARCHIVE_URL
        : STANDINGS_CSV_URL;
  }
  if (els.teamsLink) {
    els.teamsLink.href =
      seasonRaw === "c2s2-regular"
        ? C2S2_REGULAR_URL
        : seasonRaw === "c1s2-post"
        ? C1S2_POST_SCHEDULE_URL
        : seasonRaw === "c1s2-regular"
        ? C1S2_REGULAR_SCHEDULE_URL
        : seasonRaw === "c1s6-post"
        ? C1S6_POST_SCHEDULE_URL
        : seasonRaw === "c1s6-regular"
        ? C1S6_REGULAR_SCHEDULE_URL
        : seasonRaw === "c1s5-post"
        ? C1S5_POST_SCHEDULE_URL
        : seasonRaw === "c1s5-regular"
        ? C1S5_REGULAR_SCHEDULE_URL
        : seasonRaw === "c1s4-post"
        ? C1S4_POST_SCHEDULE_URL
        : seasonRaw === "c1s4-regular"
        ? C1S4_REGULAR_SCHEDULE_URL
        : seasonRaw === "c1s3-post"
        ? C1S3_POST_SCHEDULE_URL
        : seasonRaw === "c1s3-regular"
        ? C1S3_REGULAR_SCHEDULE_URL
        : seasonRaw === "c2s1-post" || seasonRaw === "c2s1-regular"
        ? ARCHIVE_URL
        : TEAMS_CSV_URL;
  }

  try {
    if (seasonRaw === "c2s3-regular" || seasonRaw === "c2s3-playoffs") {
      const results = await Promise.allSettled([
        fetchSheet(STANDINGS_CSV_URL),
        fetchSheet(LIVE_SCORING_URL),
        fetchSheet(SCHEDULE_URL),
        fetchSheet(seasonRaw === "c2s3-playoffs" ? PLAYER_STATS_PLAYOFF_URL : PLAYER_STATS_URL),
        fetchSheet(TRANSACTIONS_CSV_URL),
        fetchSheet(PLAYER_STATS_URL),
      ]);

      const standingsRows = results[0].status === "fulfilled" ? results[0].value : [];
      const liveRows = results[1].status === "fulfilled" ? results[1].value : [];
      const scheduleRows = results[2].status === "fulfilled" ? results[2].value : [];
      const playerRows = results[3].status === "fulfilled" ? results[3].value : [];
      const transactionRows = results[4].status === "fulfilled" ? results[4].value : [];
      const regularPlayerRows = results[5].status === "fulfilled" ? results[5].value : [];

      renderLeagueSnapshot(buildCurrentLeagueSnapshotRows(standingsRows));

      const liveGames = liveRows.length ? parseLiveGames(liveRows) : [];
      renderLiveScoring(liveGames, seasonRaw);

      currentDashboardScheduleGames = scheduleRows.length
        ? buildScheduleGames(prepareDashboardScheduleRows(scheduleRows, seasonRaw), seasonRaw)
        : [];
      if (!currentDashboardScheduleGames.length && scheduleRows.length) {
        currentDashboardScheduleGames = extractLooseScheduleGames(scheduleRows);
      }
      renderDashboardPlayoffBracket(standingsRows);
      const featuredGames = currentDashboardScheduleGames.length ? getFeaturedGames(currentDashboardScheduleGames, liveGames) : [];
      renderFeaturedMatchups(featuredGames, seasonRaw);

      if (playerRows.length) {
        const preparedPlayerRows = prepareDashboardPlayerRows(playerRows);
        const columns = detectPlayerColumns(preparedPlayerRows[0] || []);
        currentDashboardPlayerRows = preparedPlayerRows.slice(1);
        currentDashboardPlayerColumns = columns;
        renderLeagueLeaders(buildLeaderboard(preparedPlayerRows.slice(1), columns), seasonRaw);
      } else {
        currentDashboardPlayerRows = [];
        currentDashboardPlayerColumns = null;
        renderLeagueLeaders([], seasonRaw);
      }

      if (regularPlayerRows.length) {
        const preparedRegularRows = prepareDashboardPlayerRows(regularPlayerRows);
        currentBracketPreviewPlayerColumns = detectPlayerColumns(preparedRegularRows[0] || []);
        currentBracketPreviewPlayerRows = preparedRegularRows.slice(1);
      }

      if (transactionRows.length) {
        const events = [
          ...parseTradeRows(sliceRange(transactionRows, TRANSACTION_RANGES.trade)),
          ...parseSinglePartyRows(sliceRange(transactionRows, TRANSACTION_RANGES.signing), "Signing"),
          ...parseSinglePartyRows(sliceRange(transactionRows, TRANSACTION_RANGES.cut), "Cut"),
          ...parseSinglePartyRows(sliceRange(transactionRows, TRANSACTION_RANGES.retirement), "Retirement"),
        ]
          .sort((a, b) => parseDateValue(b.date) - parseDateValue(a.date))
          .slice(0, 4);
        renderRecentTransactions(events);
      } else {
        renderRecentTransactions([]);
      }
    } else if (seasonRaw === "c2s2-regular") {
      const results = await Promise.allSettled([
        fetchSheet(C2S2_REGULAR_URL),
        fetchSheet(TRANSACTIONS_CSV_URL),
      ]);
      const regularRows = results[0].status === "fulfilled" ? results[0].value : [];
      const transactionRows = results[1].status === "fulfilled" ? results[1].value : [];

      if (regularRows.length) {
        renderLeagueSnapshot(buildArchiveLeagueSnapshotRows(sliceRange(regularRows, C2S2_REGULAR_RANGES.standings)));
        const playerTable = sliceRange(regularRows, C2S2_REGULAR_RANGES.player_stats);
        const columns = detectPlayerColumns(playerTable[0] || []);
        renderLeagueLeaders(buildLeaderboard(playerTable.slice(1), columns), seasonRaw);
      } else {
        renderLeagueSnapshot([]);
        renderLeagueLeaders([], seasonRaw);
      }

      if (transactionRows.length) {
        const events = [
          ...parseTradeRows(sliceRange(transactionRows, TRANSACTION_RANGES.trade)),
          ...parseSinglePartyRows(sliceRange(transactionRows, TRANSACTION_RANGES.signing), "Signing"),
          ...parseSinglePartyRows(sliceRange(transactionRows, TRANSACTION_RANGES.cut), "Cut"),
          ...parseSinglePartyRows(sliceRange(transactionRows, TRANSACTION_RANGES.retirement), "Retirement"),
        ]
          .sort((a, b) => parseDateValue(b.date) - parseDateValue(a.date))
          .slice(0, 4);
        renderRecentTransactions(events);
      } else {
        renderRecentTransactions([]);
      }
    } else if (seasonRaw === "c1s2-regular" || seasonRaw === "c1s2-post") {
      const [standingsRows, scheduleRows] = await Promise.all([
        fetchSheet(C1S2_STANDINGS_URL),
        fetchSheet(
          seasonRaw === "c1s2-post" ? C1S2_POST_SCHEDULE_URL : C1S2_REGULAR_SCHEDULE_URL
        ),
      ]);
      renderLeagueSnapshot(buildArchiveLeagueSnapshotRows(standingsRows));
      renderLeagueLeaders([], seasonRaw);
      renderRecentTransactions([]);
    } else if (seasonRaw === "c1s6-regular" || seasonRaw === "c1s6-post") {
      const [standingsRows, scheduleRows] = await Promise.all([
        fetchSheet(C1S6_STANDINGS_URL),
        fetchSheet(
          seasonRaw === "c1s6-post" ? C1S6_POST_SCHEDULE_URL : C1S6_REGULAR_SCHEDULE_URL
        ),
      ]);
      renderLeagueSnapshot(buildArchiveLeagueSnapshotRows(standingsRows));
      renderLeagueLeaders([], seasonRaw);
      renderRecentTransactions([]);
    } else if (seasonRaw === "c1s5-regular" || seasonRaw === "c1s5-post") {
      const [standingsRows, scheduleRows] = await Promise.all([
        fetchSheet(C1S5_STANDINGS_URL),
        fetchSheet(
          seasonRaw === "c1s5-post" ? C1S5_POST_SCHEDULE_URL : C1S5_REGULAR_SCHEDULE_URL
        ),
      ]);
      renderLeagueSnapshot(buildArchiveLeagueSnapshotRows(standingsRows));
      renderLeagueLeaders([], seasonRaw);
      renderRecentTransactions([]);
    } else if (seasonRaw === "c1s3-regular" || seasonRaw === "c1s3-post") {
      const [standingsRows, scheduleRows] = await Promise.all([
        fetchSheet(C1S3_STANDINGS_URL),
        fetchSheet(
          seasonRaw === "c1s3-post" ? C1S3_POST_SCHEDULE_URL : C1S3_REGULAR_SCHEDULE_URL
        ),
      ]);
      renderLeagueSnapshot(buildArchiveLeagueSnapshotRows(standingsRows));
      renderLeagueLeaders([], seasonRaw);
      renderRecentTransactions([]);
    } else if (seasonRaw === "c1s4-regular" || seasonRaw === "c1s4-post") {
      const [standingsRows, scheduleRows] = await Promise.all([
        fetchSheet(C1S4_STANDINGS_URL),
        fetchSheet(
          seasonRaw === "c1s4-post" ? C1S4_POST_SCHEDULE_URL : C1S4_REGULAR_SCHEDULE_URL
        ),
      ]);
      renderLeagueSnapshot(buildArchiveLeagueSnapshotRows(standingsRows));
      renderLeagueLeaders([], seasonRaw);
      renderRecentTransactions([]);
    } else {
      const results = await Promise.allSettled([
        fetchSheet(ARCHIVE_URL),
        fetchSheet(TRANSACTIONS_CSV_URL),
      ]);
      const archiveRows = results[0].status === "fulfilled" ? results[0].value : [];
      const transactionRows = results[1].status === "fulfilled" ? results[1].value : [];
      const scheduleRange = seasonRaw === "c2s1-post" ? ARCHIVE_RANGES.schedule_post : ARCHIVE_RANGES.schedule_regular;

      if (archiveRows.length) {
        renderLeagueSnapshot(buildArchiveLeagueSnapshotRows(sliceRange(archiveRows, ARCHIVE_RANGES.standings)));
        if (seasonRaw === "c2s1-post") {
          const playerTable = sliceRange(archiveRows, ARCHIVE_RANGES.player_stats);
          const columns = detectPlayerColumns(playerTable[0] || []);
          renderLeagueLeaders(buildLeaderboard(playerTable.slice(1), columns), seasonRaw);
        } else {
          renderLeagueLeaders([], seasonRaw);
        }
      } else {
        renderLeagueSnapshot([]);
        renderFeaturedMatchups([], seasonRaw);
        renderLeagueLeaders([], seasonRaw);
      }

      if (transactionRows.length) {
        const events = [
          ...parseTradeRows(sliceRange(transactionRows, TRANSACTION_RANGES.trade)),
          ...parseSinglePartyRows(sliceRange(transactionRows, TRANSACTION_RANGES.signing), "Signing"),
          ...parseSinglePartyRows(sliceRange(transactionRows, TRANSACTION_RANGES.cut), "Cut"),
          ...parseSinglePartyRows(sliceRange(transactionRows, TRANSACTION_RANGES.retirement), "Retirement"),
        ]
          .sort((a, b) => parseDateValue(b.date) - parseDateValue(a.date))
          .slice(0, 4);
        renderRecentTransactions(events);
      } else {
        renderRecentTransactions([]);
      }
    }

    updateLastUpdated();
  } catch (error) {
    if (els.teamsGrid) {
      els.teamsGrid.innerHTML = buildStateCard("Dashboard Error", "The league dashboard could not be loaded from the current sheet feeds.");
    }
    if (els.liveRow) {
      els.liveRow.innerHTML = buildStateCard("Live Scoring Unavailable", "The live feed could not be loaded right now.");
    }
    if (els.featuredMatchups) {
      els.featuredMatchups.innerHTML = buildStateCard("Schedule Unavailable", "Featured matchups could not be built from the current sheet.");
    }
    if (els.leagueLeaders) {
      els.leagueLeaders.innerHTML = buildStateCard("Leaders Unavailable", "Player leader data could not be calculated right now.");
    }
    if (els.recentTransactions) {
      els.recentTransactions.innerHTML = buildStateCard("Transactions Unavailable", "Recent transaction data is currently unavailable.");
    }
    if (els.playoffBracket) {
      els.playoffBracket.innerHTML = buildStateCard("Bracket Unavailable", "The playoff bracket could not be built from the current standings.");
    }
  }
}

if (els.liveRow) {
  els.liveRow.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-live-index]");
    if (!trigger) return;
    const index = Number(trigger.dataset.liveIndex);
    const game = currentLiveGames[index];
    if (!game) return;
    renderLiveModal(game);
  });
}

if (els.viewPlayoffPage) {
  els.viewPlayoffPage.addEventListener("click", () => {
    const nextSeason = "c2s3-playoffs";
    const select = document.getElementById("season-select");
    localStorage.setItem(SEASON_KEY, nextSeason);
    if (select) {
      select.value = nextSeason;
    }
    window.location.href = "/";
  });
}

document.addEventListener("click", (event) => {
  const bracketMatchup = event.target.closest("[data-bracket-matchup]");
  if (bracketMatchup) {
    event.preventDefault();
    openBracketMatchup(bracketMatchup.dataset.bracketMatchup);
    return;
  }
  const bracketViewButton = event.target.closest("[data-bracket-view]");
  if (bracketViewButton) {
    event.preventDefault();
    setBracketView(bracketViewButton.dataset.bracketView || "official");
    return;
  }
  const bracketConfirm = event.target.closest("#bracket-confirm-user");
  if (bracketConfirm) {
    event.preventDefault();
    confirmBracketChallengeHandle();
    return;
  }
  const bracketSave = event.target.closest("#bracket-save");
  if (bracketSave) {
    event.preventDefault();
    saveBracketChallengeEntry();
    return;
  }
  const viewButton = event.target.closest("[data-box-view]");
  if (viewButton && els.liveDetails && els.liveDetails.contains(viewButton)) {
    event.preventDefault();
    setBoxScoreView(
      viewButton.closest(".boxscore-view-shell"),
      viewButton.dataset.boxView || "boxscore"
    );
    return;
  }
  if (event.target.matches("[data-close=\"true\"]")) {
    if (els.liveModal) els.liveModal.hidden = true;
    if (els.bracketModal) els.bracketModal.hidden = true;
  }
});

document.addEventListener("change", (event) => {
  if (event.target && event.target.matches('input[type="radio"][name^="bracket-"]')) {
    syncBracketChallengeDependentRounds();
  }
});

initSeasonSelect();
loadData();
setInterval(loadData, AUTO_REFRESH_MS);
