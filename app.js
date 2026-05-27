const STANDINGS_CSV_URL = "/api/sheet?name=standings-dashboard";
const STANDINGS_RECORDS_URL = "/api/sheet?name=standings";
const TEAMS_CSV_URL = "/api/sheet?name=teams";
const SCHEDULE_URL = "/api/sheet?name=schedule";
const LIVE_SCORING_URL = "/api/sheet?name=live-scoring";
const GAME_FLOW_API = "/api/game-flow";
const PLAYER_STATS_URL = "/api/sheet?name=player-stats";
const TRANSACTIONS_CSV_URL = "/api/sheet?name=transactions";
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
  "Cheerios",
  "Scorpions",
  "Illegals",
  "The Lions",
  "Dream Team",
  "The Snipers",
  "The Phantoms",
];

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
    "cheerios",
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
  featuredMatchups: document.getElementById("featured-matchups"),
  leagueLeaders: document.getElementById("league-leaders"),
  recentTransactions: document.getElementById("recent-transactions"),
  activityFeed: document.getElementById("activity-feed"),
  liveModal: document.getElementById("live-modal"),
  liveDetails: document.getElementById("live-details"),
};

els.livePanel = els.liveRow ? els.liveRow.closest(".panel") : null;
els.featuredPanel = els.featuredMatchups ? els.featuredMatchups.closest(".panel") : null;

let currentLiveGames = [];
let sheetCache = new Map();
let lastLeagueSnapshotRows = [];

function isArchiveSeason(seasonRaw) {
  return seasonRaw !== "c2s3-regular";
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

function syncDashboardPanels(seasonRaw) {
  const hideArchiveOnly = isArchiveSeason(seasonRaw);
  if (els.livePanel) {
    els.livePanel.hidden = hideArchiveOnly;
  }
  if (els.featuredPanel) {
    els.featuredPanel.hidden = hideArchiveOnly;
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
  const raw = localStorage.getItem(SEASON_KEY) || "c2s3-regular";
  if (raw === "all-time") return "c2s3-regular";
  if (raw === "c2s2") return "c2s3-regular";
  return raw;
}

function initSeasonSelect() {
  const select = document.getElementById("season-select");
  if (!select) return;
  select.value = getSeasonRaw();
  if (!select.value) {
    select.value = "c2s3-regular";
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
  if (shown === "Cheerios") return "/assets/cheerios.png";
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
  if (clean === "cheerios") return "team-color-cheerios";
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

function formatNewsTimestamp(value) {
  const parsed = Date.parse(String(value || ""));
  if (Number.isNaN(parsed)) {
    return "Scheduled";
  }
  return new Date(parsed).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatNewsKind(value) {
  if (value === "preview") return "Preview";
  if (value === "recap") return "Recap";
  if (value === "transaction") return "Transactions";
  return "League News";
}

function prepareDashboardScheduleRows(rows, seasonRaw) {
  if (!rows.length) return [];
  if (seasonRaw !== "c2s3-regular") return rows;
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
  if (els.teamsGrid) {
    els.teamsGrid.innerHTML = `<div class="dashboard-feature-grid">${buildSkeletonCard(3)}${buildSkeletonCard(3)}${buildSkeletonCard(3)}</div>`;
  }
  if (els.activityFeed) {
    els.activityFeed.innerHTML = `<div class="dashboard-activity-list">${buildSkeletonCard(3)}${buildSkeletonCard(3)}</div>`;
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

function buildPlayerAverageMap(rows) {
  if (!rows.length) return new Map();
  const preparedRows = prepareDashboardPlayerRows(rows);
  const columns = detectPlayerColumns(preparedRows[0] || []);
  const leaderboard = buildLeaderboard(preparedRows.slice(1), columns);
  const map = new Map();
  leaderboard.forEach((item) => {
    map.set(normalizePlayerKey(item.tag), item);
  });
  return map;
}

function formatSignedNumber(value, digits = 0) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  const rounded = digits ? num.toFixed(digits) : String(Math.round(num));
  return num > 0 ? `+${rounded}` : rounded;
}

function getTopPerformer(game) {
  const players = [
    ...(game?.team1Players || []).map((player) => ({ ...player, team: game.team1 })),
    ...(game?.team2Players || []).map((player) => ({ ...player, team: game.team2 })),
  ];
  return players
    .map((player) => ({ ...player, numericPoints: parseNumber(player.points) ?? 0 }))
    .sort((a, b) => b.numericPoints - a.numericPoints)[0] || null;
}

function projectWinBreakdown(game, playerAverageMap) {
  const summarizeTeam = (players = [], fallbackScore = "0") => {
    const current = parseNumber(fallbackScore) ?? 0;
    let projected = 0;
    let playersTracked = 0;
    players.forEach((player) => {
      const currentPoints = parseNumber(player.points) ?? 0;
      const profile = playerAverageMap.get(normalizePlayerKey(player.player));
      const average = Number.isFinite(profile?.avg) ? profile.avg : currentPoints;
      projected += Math.max(currentPoints, average);
      playersTracked += 1;
    });
    if (!playersTracked) {
      projected = current;
    }
    return {
      current,
      projected,
      tracked: playersTracked,
    };
  };

  const team1 = summarizeTeam(game.team1Players, game.team1Score);
  const team2 = summarizeTeam(game.team2Players, game.team2Score);
  const diff = team1.projected - team2.projected;
  const probability = 1 / (1 + Math.exp(-diff / 45));
  return {
    team1,
    team2,
    team1WinPct: Math.max(0.05, Math.min(0.95, probability)),
    team2WinPct: Math.max(0.05, Math.min(0.95, 1 - probability)),
  };
}

function buildLiveDetailMarkup(game, playerAverageMap) {
  const topPerformer = getTopPerformer(game);
  const projection = projectWinBreakdown(game, playerAverageMap);
  const favoriteName = projection.team1WinPct >= projection.team2WinPct ? game.team1 : game.team2;
  const favoritePct = projection.team1WinPct >= projection.team2WinPct ? projection.team1WinPct : projection.team2WinPct;

  return `
    <div class="dashboard-live-extra-content">
      <div class="dashboard-live-actions">
        <button class="dashboard-inline-link" type="button" data-live-open>Open box score</button>
      </div>
    </div>
  `;
}

function renderActivityFeed(items) {
  if (!els.activityFeed) return;
  if (!items.length) {
    els.activityFeed.innerHTML = buildStateCard(
      "No Activity Yet",
      "Standings movement and league activity will appear here once enough game data is available."
    );
    return;
  }
  els.activityFeed.innerHTML = items
    .map(
      (item) => `
        <article class="dashboard-activity-card">
          <div class="dashboard-activity-kicker">${escapeHtml(item.kicker || "League Update")}</div>
          <div class="dashboard-activity-title">${escapeHtml(item.title || "")}</div>
          <div class="dashboard-activity-body">${escapeHtml(item.body || "")}</div>
        </article>
      `
    )
    .join("");
}

function buildActivityItems(rows, seasonRaw) {
  const normalizedRows = Array.isArray(rows) ? rows.filter(Boolean) : [];
  if (!normalizedRows.length) {
    return [];
  }
  const storageKey = `rskl-standings-order-${seasonRaw}`;
  const previousOrder = (() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch (_error) {
      return [];
    }
  })();
  const currentOrder = normalizedRows.map((row) => normalizeTeamName(row.team));
  localStorage.setItem(storageKey, JSON.stringify(currentOrder));

  const previousIndex = new Map(previousOrder.map((team, index) => [team, index]));
  const currentIndex = new Map(currentOrder.map((team, index) => [team, index]));
  const movedUp = normalizedRows
    .filter((row) => previousIndex.has(normalizeTeamName(row.team)))
    .map((row) => {
      const key = normalizeTeamName(row.team);
      const delta = previousIndex.get(key) - currentIndex.get(key);
      return { row, delta };
    })
    .filter((item) => item.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 4)
    .map(({ row, delta }) => ({
      kicker: "Standings Move",
      title: `${displayTeamName(row.team)} moved up ${delta} spot${delta === 1 ? "" : "s"}`,
      body: `Now ranked #${currentIndex.get(normalizeTeamName(row.team)) + 1} with a ${row.wins ?? "—"}-${row.losses ?? row.loss ?? "—"} record.`,
    }));

  return movedUp;
}

function renderLiveScoring(games, seasonRaw, playerAverageMap = new Map()) {
  if (!els.liveRow) return;
  currentLiveGames = games || [];
  if (seasonRaw !== "c2s3-regular") {
    els.liveRow.innerHTML = buildStateCard(
      "Live Scoring Off",
      "Live box scores are only available during the current regular season feed."
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
            <article class="dashboard-live-card ${getTeamColorClass(game.team1)} ${getTeamColorClass(game.team2)}" data-live-index="${index}">
              <button class="dashboard-live-toggle" type="button" data-live-toggle aria-expanded="false">
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
                <span class="dashboard-live-cta">Tap for Game Center</span>
              </button>
              <div class="dashboard-live-detail" hidden>
                ${buildLiveDetailMarkup(game, playerAverageMap)}
              </div>
            </article>
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
  let team1 = findIdx(["team 1", "team1", "away"]);
  let team2 = findIdx(["team 2", "team2", "home"]);
  let gameType = findIdx(["game type", "type"]);

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

  return { date, team1, team2, gameType };
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
      if (!dateToken || !team1 || !team2) return null;
      return {
        rawDate,
        dateToken,
        dateObj: parseDateFromToken(dateToken),
        team1,
        team2,
        gameType,
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
      pick: [...rows].sort((a, b) => b.avg - a.avg)[0],
      formatter: (item) => item.avg.toFixed(2),
    },
    {
      title: "Total Score",
      subtitle: "Most total points",
      pick: [...rows].sort((a, b) => b.total - a.total)[0],
      formatter: (item) => item.total.toFixed(0),
    },
    {
      title: "WAR",
      subtitle: "Value leader",
      pick: [...rows].sort((a, b) => b.war - a.war)[0],
      formatter: (item) => item.war.toFixed(2),
    },
  ];

  els.leagueLeaders.innerHTML = metrics
    .map((metric) => {
      if (!metric.pick) {
        return buildStateCard(metric.title, "No qualifying player.");
      }
      const item = metric.pick;
      return `
        <article class="leader-card dashboard-leader-card">
          <div class="dashboard-leader-kicker">${escapeHtml(metric.title)}</div>
          <a class="leader-name" href="/player-detail.html?player=${encodeURIComponent(item.tag)}&season=${encodeURIComponent(seasonRaw)}">${renderPlayerName(item)}</a>
          <div class="leader-value">${escapeHtml(metric.formatter(item))}</div>
          <div class="leader-sub">${escapeHtml(metric.subtitle)}</div>
          <div class="dashboard-leader-meta">
            <a class="leader-team-link" href="/team.html?team=${encodeURIComponent(item.team)}">${renderSmallTeamLogo(item.team)}<span>${escapeHtml(item.team || "—")}</span></a>
            <span>${escapeHtml(String(item.gp || 0))} GP</span>
          </div>
        </article>
      `;
    })
    .join("");
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
      <div class="dashboard-live-boxscore-toggle-wrap">
        <button class="dashboard-inline-link" type="button" data-live-extra-toggle aria-expanded="false">
          Show extra info
        </button>
      </div>
      <div class="dashboard-live-extra-panel" hidden>
        ${buildLiveDetailMarkup(game, playerAverageMap)}
      </div>
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
  sheetCache = new Map();
  setDashboardLoading();
  const seasonRaw = getSeasonRaw();
  syncDashboardPanels(seasonRaw);

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
    if (seasonRaw === "c2s3-regular") {
      const results = await Promise.allSettled([
        fetchSheet(STANDINGS_CSV_URL),
        fetchSheet(LIVE_SCORING_URL),
        fetchSheet(SCHEDULE_URL),
        fetchSheet(PLAYER_STATS_URL),
        fetchSheet(TRANSACTIONS_CSV_URL),
      ]);

      const standingsRows = results[0].status === "fulfilled" ? results[0].value : [];
      const liveRows = results[1].status === "fulfilled" ? results[1].value : [];
      const scheduleRows = results[2].status === "fulfilled" ? results[2].value : [];
      const playerRows = results[3].status === "fulfilled" ? results[3].value : [];
      const transactionRows = results[4].status === "fulfilled" ? results[4].value : [];

      const leagueSnapshotRows = buildCurrentLeagueSnapshotRows(standingsRows);
      lastLeagueSnapshotRows = leagueSnapshotRows;
      renderLeagueSnapshot(leagueSnapshotRows);
      renderActivityFeed(buildActivityItems(leagueSnapshotRows, seasonRaw));

      const liveGames = liveRows.length ? parseLiveGames(liveRows) : [];
      const playerAverageMap = playerRows.length ? buildPlayerAverageMap(playerRows) : new Map();
      renderLiveScoring(liveGames, seasonRaw, playerAverageMap);

      const featuredGames = scheduleRows.length ? getFeaturedGames(buildScheduleGames(prepareDashboardScheduleRows(scheduleRows, seasonRaw), seasonRaw), liveGames) : [];
      renderFeaturedMatchups(featuredGames, seasonRaw);

      if (playerRows.length) {
        const preparedPlayerRows = prepareDashboardPlayerRows(playerRows);
        const columns = detectPlayerColumns(preparedPlayerRows[0] || []);
        renderLeagueLeaders(buildLeaderboard(preparedPlayerRows.slice(1), columns), seasonRaw);
      } else {
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
    } else if (seasonRaw === "c2s2-regular") {
      const results = await Promise.allSettled([
        fetchSheet(C2S2_REGULAR_URL),
        fetchSheet(TRANSACTIONS_CSV_URL),
      ]);
      const regularRows = results[0].status === "fulfilled" ? results[0].value : [];
      const transactionRows = results[1].status === "fulfilled" ? results[1].value : [];

      if (regularRows.length) {
        const leagueSnapshotRows = buildArchiveLeagueSnapshotRows(sliceRange(regularRows, C2S2_REGULAR_RANGES.standings));
        renderLeagueSnapshot(leagueSnapshotRows);
        renderActivityFeed(buildActivityItems(leagueSnapshotRows, seasonRaw));
        const playerTable = sliceRange(regularRows, C2S2_REGULAR_RANGES.player_stats);
        const columns = detectPlayerColumns(playerTable[0] || []);
        renderLeagueLeaders(buildLeaderboard(playerTable.slice(1), columns), seasonRaw);
      } else {
        renderLeagueSnapshot([]);
        renderLeagueLeaders([], seasonRaw);
        renderActivityFeed([]);
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
      renderActivityFeed([]);
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
      renderActivityFeed([]);
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
      renderActivityFeed([]);
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
      renderActivityFeed([]);
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
      renderActivityFeed([]);
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
        const leagueSnapshotRows = buildArchiveLeagueSnapshotRows(sliceRange(archiveRows, ARCHIVE_RANGES.standings));
        renderLeagueSnapshot(leagueSnapshotRows);
        renderActivityFeed(buildActivityItems(leagueSnapshotRows, seasonRaw));
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
        renderActivityFeed([]);
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
    if (els.activityFeed) {
      els.activityFeed.innerHTML = buildStateCard("Activity Unavailable", "Recent league movement could not be summarized right now.");
    }
  }
}

if (els.liveRow) {
  els.liveRow.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-live-toggle]");
    if (toggle) {
      const card = toggle.closest("[data-live-index]");
      const detail = card ? card.querySelector(".dashboard-live-detail") : null;
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      if (!detail) return;
      toggle.setAttribute("aria-expanded", expanded ? "false" : "true");
      detail.hidden = expanded;
      card.classList.toggle("is-expanded", !expanded);
      return;
    }

    const openButton = event.target.closest("[data-live-open]");
    if (!openButton) return;
    const card = openButton.closest("[data-live-index]");
    const index = card ? Number(card.dataset.liveIndex) : Number.NaN;
    const game = currentLiveGames[index];
    if (!game) return;
    renderLiveModal(game);
  });
}

if (els.liveDetails) {
  els.liveDetails.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-live-extra-toggle]");
    if (!toggle) return;
    const panel = toggle.closest(".boxscore-view-shell")?.querySelector(".dashboard-live-extra-panel");
    if (!panel) return;
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", expanded ? "false" : "true");
    toggle.textContent = expanded ? "Show extra info" : "Hide extra info";
    panel.hidden = expanded;
  });
}

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-box-view]");
  if (viewButton && els.liveDetails && els.liveDetails.contains(viewButton)) {
    event.preventDefault();
    setBoxScoreView(
      viewButton.closest(".boxscore-view-shell"),
      viewButton.dataset.boxView || "boxscore"
    );
    return;
  }
  if (event.target.matches("[data-close=\"true\"]") && els.liveModal) {
    els.liveModal.hidden = true;
  }
});

initSeasonSelect();
loadData();
setInterval(loadData, AUTO_REFRESH_MS);
