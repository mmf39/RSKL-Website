const ROSTER_URL = "/api/sheet?name=roster";
const GM_LINEUP_CSV_URL = ROSTER_URL;
const DRAFT_URL = "/api/sheet?name=draft";
const DRAFT_CAPITAL_URL = "/api/sheet?name=draft-capital";
const STANDINGS_DASHBOARD_URL = "/api/sheet?name=standings-dashboard";
const POWER_RANKINGS_URL = "/api/sheet?name=power-rankings";
const SCHEDULE_URL = "/api/sheet?name=schedule";
const SUPABASE_CONFIG_URL = "/api/supabase-config";
const PLAYER_RENAME_SYNC_API = "/api/player-rename-sync";
const NEWS_ARTICLES_API = "/api/articles";
const GM_ASSIGNMENTS_API = "/api/gm-assignments";
const GM_ACCESS_TOKEN_KEY = "rskl_gm_access_token";
const GM_REFRESH_TOKEN_KEY = "rskl_gm_refresh_token";
const GM_SESSION_USER_KEY = "rskl_gm_user";
const GM_ASSIGNMENT_KEY = "rskl_gm_assignment";
const GM_LOCAL_LOCKS_KEY = "rskl_local_game_locks";
const GM_FREE_AGENCY_KEY = "rskl_gm_free_agency_selection";
const GM_FREE_AGENCY_VOTER_KEY = "rskl_gm_free_agency_voter_handle";
const GM_POWER_REPORTER_HANDLE_KEY = "rskl_power_reporter_handle";
const GM_DRAFT_RUNNER_KEY = "rskl_commish_test_draft_picks";
const GM_DRAFT_SUBMISSIONS_OPEN = true;
const POWER_REPORTER_VALUE = "__REPORTER__";
const GM_GAME_LOCKS_TABLE = "gm_game_locks";
const GM_ALL_STAR_VOTES_TABLE = "gm_all_star_votes_public";

const TEAM_RANGES = {
  "Gus N Em": "B2:C13",
  Bullets: "E2:F13",
  Turkeys: "H2:I13",
  "Bad Bois": "B17:C28",
  Yetis: "E17:F28",
  Illegals: "H17:I28",
  "The Lions": "B32:C43",
  "The Future": "E32:F43",
  "The Snipers": "H32:I43",
  "The Phantoms": "B45:C56",
};

const DRAFT_CAPITAL_COLUMNS = {
  Turkeys: "A",
  "Gus N Em": "B",
  Bullets: "C",
  "Bad Bois": "D",
  Yetis: "E",
  "The Lions": "F",
  "The Phantoms": "G",
  "The Future": "H",
  "The Snipers": "I",
  Illegals: "J",
};

const TEAM_ORDER = [
  "Gus N Em",
  "Bullets",
  "Turkeys",
  "Bad Bois",
  "Yetis",
  "Illegals",
  "The Lions",
  "The Future",
  "The Snipers",
  "The Phantoms",
];

const TRADE_BLOCKS_API = "/api/sheet-update";

const els = {
  tabButtons: Array.from(document.querySelectorAll("[data-gm-tab]")),
  panelHead: document.getElementById("gm-panel-head"),
  authCard: document.getElementById("gm-auth-card"),
  authedShell: document.getElementById("gm-authed-shell"),
  commishCard: document.getElementById("gm-commish-card"),
  commishDraftCard: document.getElementById("gm-commish-draft-card"),
  draftSeason: document.getElementById("gm-draft-season"),
  draftPickOption: document.getElementById("gm-draft-pick-option"),
  draftRound: document.getElementById("gm-draft-round"),
  draftPick: document.getElementById("gm-draft-pick"),
  draftCurrentRound: document.getElementById("gm-draft-current-round"),
  draftCurrentPick: document.getElementById("gm-draft-current-pick"),
  draftCurrentTeam: document.getElementById("gm-draft-current-team"),
  draftSheetPick: document.getElementById("gm-draft-sheet-pick"),
  draftTeam: document.getElementById("gm-draft-team"),
  draftPlayer: document.getElementById("gm-draft-player"),
  draftNote: document.getElementById("gm-draft-note"),
  draftSave: document.getElementById("gm-draft-save"),
  draftNext: document.getElementById("gm-draft-next"),
  draftClear: document.getElementById("gm-draft-clear"),
  draftStatus: document.getElementById("gm-draft-status"),
  draftBoard: document.getElementById("gm-draft-board"),
  gmDraftPick: document.getElementById("gm-draft-gm-pick"),
  gmDraftStatus: document.getElementById("gm-draft-gm-status"),
  draftUsedFields: Array.from(document.querySelectorAll("[data-draft-used-field]")),
  draftTeamFields: Array.from(document.querySelectorAll("[data-draft-team-field]")),
  draftPlayerFields: Array.from(document.querySelectorAll("[data-draft-player-field]")),
  articleCard: document.getElementById("gm-article-card"),
  articlesTab: document.getElementById("gm-articles-tab"),
  commishTab: document.getElementById("gm-commish-tab"),
  lockGamesList: document.getElementById("gm-lock-games-list"),
  lockSave: document.getElementById("gm-lock-save"),
  lockStatus: document.getElementById("gm-lock-status"),
  articleTitle: document.getElementById("gm-article-title"),
  articleSummary: document.getElementById("gm-article-summary"),
  articleBody: document.getElementById("gm-article-body"),
  articleAuthor: document.getElementById("gm-article-author"),
  articlePublish: document.getElementById("gm-article-publish"),
  articleStatus: document.getElementById("gm-article-status"),
  articleList: document.getElementById("gm-article-list"),
  articleType: document.getElementById("gm-article-type"),
  articleGameGroup: document.getElementById("gm-article-game-group"),
  articleGame: document.getElementById("gm-article-game"),
  tabTradePanel: document.getElementById("gm-tab-trade"),
  tabRenamePanel: document.getElementById("gm-tab-rename"),
  tabLineupPanel: document.getElementById("gm-tab-lineup"),
  tabDraftPanel: document.getElementById("gm-tab-draft"),
  tabFreeAgencyPanel: document.getElementById("gm-tab-free-agency"),
  tabPowerPanel: document.getElementById("gm-tab-power"),
  tabArticlesPanel: document.getElementById("gm-tab-articles"),
  tabCommishPanel: document.getElementById("gm-tab-commish"),
  lineupTabMeta: document.getElementById("gm-lineup-tab-meta"),
  sessionMeta: document.getElementById("gm-session-meta"),
  sessionSummary: document.getElementById("gm-session-summary"),
  authEmail: document.getElementById("gm-auth-email"),
  authPassword: document.getElementById("gm-auth-password"),
  authSignUp: document.getElementById("gm-btn-signup"),
  authSignIn: document.getElementById("gm-btn-signin"),
  authSignOut: document.getElementById("gm-btn-signout"),
  authSignOutInline: document.getElementById("gm-btn-signout-inline"),
  authStatus: document.getElementById("gm-auth-status"),
  codeLabels: Array.from(document.querySelectorAll("[data-code-label]")),
  codeInputs: Array.from(document.querySelectorAll("[data-code-input]")),
  lastUpdated: document.getElementById("last-updated"),
  teamSelect: document.getElementById("gm-team-select"),
  teamLabel: document.getElementById("gm-team-label"),
  tradePlayerList: document.getElementById("trade-player-list"),
  tradePicksList: document.getElementById("trade-picks-list"),
  tradeNotes: document.getElementById("trade-notes"),
  tradeCode: document.getElementById("trade-code"),
  tradeSave: document.getElementById("trade-save"),
  tradeStatus: document.getElementById("trade-status"),
  tradeViewList: document.getElementById("trade-view-list"),
  renameTeamSelect: document.getElementById("rename-team-select"),
  renamePlayerSelect: document.getElementById("rename-player-select"),
  renameNewName: document.getElementById("rename-new-name"),
  renameCode: document.getElementById("rename-code"),
  renameSave: document.getElementById("rename-save"),
  renameStatus: document.getElementById("rename-status"),
  lineupTeamSelect: document.getElementById("lineup-team-select"),
  lineupGameCards: document.getElementById("lineup-game-cards"),
  lineupPlayerList: document.getElementById("lineup-player-list"),
  lineupCode: document.getElementById("lineup-code"),
  lineupSave: document.getElementById("lineup-save"),
  lineupStatus: document.getElementById("lineup-status"),
  lineupOverlay: document.getElementById("lineup-submit-overlay"),
  freeAgencyVoterHandle: document.getElementById("free-agency-voter-handle"),
  freeAgencyCount: document.getElementById("free-agency-count"),
  freeAgencyPlayerList: document.getElementById("free-agency-player-list"),
  freeAgencyClear: document.getElementById("free-agency-clear"),
  freeAgencySaveTop: document.getElementById("free-agency-save-top"),
  freeAgencySave: document.getElementById("free-agency-save"),
  freeAgencyStatus: document.getElementById("free-agency-status"),
  powerTeamSelect: document.getElementById("power-team-select"),
  powerReporterGroup: document.getElementById("power-reporter-group"),
  powerReporterHandle: document.getElementById("power-reporter-handle"),
  powerRankingsList: document.getElementById("power-rankings-list"),
  powerRandomize: document.getElementById("power-randomize"),
  powerCode: document.getElementById("power-code"),
  powerSave: document.getElementById("power-save"),
  powerStatus: document.getElementById("power-status"),
  powerVotesView: document.getElementById("power-votes-view"),
};

let rosterByTeam = new Map();
let picksByTeam = new Map();
let draftCapitalRowsCache = [];
let draftOrderPicksCache = [];
let submittedDraftPicksCache = new Set();
let tradeBlocksCache = {};
let powerVotesCache = {};
let supabaseUrl = "";
let supabaseAnon = "";
let gmSession = null;
let gmAssignment = null;
let gmAssignmentsCache = [];
let commishUpcomingGames = [];
let commishArticleGames = [];
let lineupSubmittedByTeam = new Map();
let localGameLocksByDate = {};
let freeAgencySelection = [];
let freeAgencyResults = [];
let testDraftPicks = [];
let draftSaveInFlight = false;
let gmDraftSaveInFlightKeys = new Set();
let gmDraftUnlockedPickKeys = new Set();

function requireSupabaseConfig() {
  if (!supabaseUrl || !supabaseAnon) {
    throw new Error(
      "Supabase config missing. Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel env, then redeploy."
    );
  }
}

function safeJsonParse(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (_) {
    return fallback;
  }
}

function persistAuthState() {
  const access = String(gmSession?.access_token || "").trim();
  const refresh = String(gmSession?.refresh_token || "").trim();
  if (access) {
    localStorage.setItem(GM_ACCESS_TOKEN_KEY, access);
  } else {
    localStorage.removeItem(GM_ACCESS_TOKEN_KEY);
  }
  if (refresh) {
    localStorage.setItem(GM_REFRESH_TOKEN_KEY, refresh);
  } else {
    localStorage.removeItem(GM_REFRESH_TOKEN_KEY);
  }
  if (gmSession?.user) {
    localStorage.setItem(GM_SESSION_USER_KEY, JSON.stringify(gmSession.user));
  } else {
    localStorage.removeItem(GM_SESSION_USER_KEY);
  }
  if (gmAssignment) {
    localStorage.setItem(GM_ASSIGNMENT_KEY, JSON.stringify(gmAssignment));
  } else {
    localStorage.removeItem(GM_ASSIGNMENT_KEY);
  }
}

function clearAuthState() {
  localStorage.removeItem(GM_ACCESS_TOKEN_KEY);
  localStorage.removeItem(GM_REFRESH_TOKEN_KEY);
  localStorage.removeItem(GM_SESSION_USER_KEY);
  localStorage.removeItem(GM_ASSIGNMENT_KEY);
}

function loadLocalGameLocks() {
  localGameLocksByDate = safeJsonParse(
    localStorage.getItem(GM_LOCAL_LOCKS_KEY),
    {}
  ) || {};
}

function saveLocalGameLocks(nextMap) {
  localGameLocksByDate = nextMap || {};
  localStorage.setItem(GM_LOCAL_LOCKS_KEY, JSON.stringify(localGameLocksByDate));
}

function normalizeGameLocks(value) {
  if (!value) return {};
  if (Array.isArray(value)) {
    return value.reduce((acc, item) => {
      const date = normalizeScheduleDateKey(item?.date || item?.dateText || "");
      const lockAt = String(item?.lockAt || item?.value || "").trim();
      if (date && lockAt) acc[date] = lockAt;
      return acc;
    }, {});
  }
  if (typeof value === "object") {
    return Object.entries(value).reduce((acc, [date, lockAt]) => {
      const dateText = normalizeScheduleDateKey(date || "");
      const lockText = String(lockAt || "").trim();
      if (dateText && lockText) acc[dateText] = lockText;
      return acc;
    }, {});
  }
  return {};
}

function setActiveTab(tab) {
  const active =
    tab === "rename"
      ? "rename"
      : tab === "lineup"
      ? "lineup"
      : tab === "draft"
      ? "draft"
      : tab === "free-agency"
      ? "free-agency"
      : tab === "power"
      ? "power"
      : tab === "articles"
      ? "articles"
      : tab === "commish"
      ? "commish"
      : "trade";
  if (els.tabTradePanel) {
    els.tabTradePanel.hidden = active !== "trade";
  }
  if (els.tabRenamePanel) {
    els.tabRenamePanel.hidden = active !== "rename";
  }
  if (els.tabLineupPanel) {
    els.tabLineupPanel.hidden = active !== "lineup";
  }
  if (els.tabDraftPanel) {
    els.tabDraftPanel.hidden = active !== "draft";
  }
  if (els.tabFreeAgencyPanel) {
    els.tabFreeAgencyPanel.hidden = active !== "free-agency";
  }
  if (els.tabPowerPanel) {
    els.tabPowerPanel.hidden = active !== "power";
  }
  if (els.tabArticlesPanel) {
    els.tabArticlesPanel.hidden = active !== "articles";
  }
  if (els.tabCommishPanel) {
    els.tabCommishPanel.hidden = active !== "commish";
  }
  if (els.tabButtons && els.tabButtons.length) {
    els.tabButtons.forEach((button) => {
      const isActive = button.dataset.gmTab === active;
      button.classList.toggle("active", isActive);
    });
  }
}

function displayTeamName(value) {
  const team = String(value || "").trim();
  if (team === "Bullets") return "Storm";
  if (team === "Yetis") return "Scorpions";
  if (team === "The Future") return "Dream Team";
  return team;
}

function canonicalTeamKey(value) {
  const team = String(value || "").trim();
  if (team === "Storm") return "Bullets";
  if (team === "Scorpions") return "Yetis";
  if (team === "Dream Team") return "The Future";
  return team;
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function buildGameKey(dateToken, team1, team2) {
  return `${String(dateToken || "").trim()}|${normalizeName(displayTeamName(team1))}|${normalizeName(displayTeamName(team2))}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function setStatus(node, message, isError = false) {
  if (!node) return;
  node.textContent = message;
  node.className = `gm-status ${isError ? "error" : ""}`;
}

function setTradeStatus(message, isError = false) {
  els.tradeStatus.textContent = message;
  els.tradeStatus.className = `gm-status ${isError ? "error" : ""}`;
}

function setRenameStatus(message, isError = false) {
  if (!els.renameStatus) return;
  els.renameStatus.textContent = message;
  els.renameStatus.className = `gm-status ${isError ? "error" : ""}`;
}

function setLineupStatus(message, isError = false) {
  if (!els.lineupStatus) return;
  els.lineupStatus.textContent = message;
  els.lineupStatus.className = `gm-status ${isError ? "error" : ""}`;
}

function setSubmitOverlayVisible(
  visible,
  title = "Submitting lineup",
  copy = "",
  subcopy = "Please keep this tab open while we work."
) {
  if (!els.lineupOverlay) return;
  els.lineupOverlay.hidden = !visible;
  if (!visible) return;
  const titleEl = els.lineupOverlay.querySelector(".gm-submit-overlay__title");
  const copyEl = els.lineupOverlay.querySelector(".gm-submit-overlay__copy");
  const subcopyEl = els.lineupOverlay.querySelector(".gm-submit-overlay__subcopy");
  if (titleEl) {
    titleEl.textContent = title;
  }
  if (copyEl) {
    copyEl.textContent = copy || "Your lineup is being processed and submitted.";
  }
  if (subcopyEl) {
    subcopyEl.textContent = subcopy;
  }
}

function setLineupOverlayVisible(visible, title = "Submitting lineup", copy = "") {
  setSubmitOverlayVisible(visible, title, copy || "Your lineup is being processed and submitted.");
}

function setFreeAgencyStatus(message, isError = false) {
  if (!els.freeAgencyStatus) return;
  els.freeAgencyStatus.textContent = message;
  els.freeAgencyStatus.className = `gm-status ${isError ? "error" : ""}`;
}

function setPowerStatus(message, isError = false) {
  if (!els.powerStatus) return;
  els.powerStatus.textContent = message;
  els.powerStatus.className = `gm-status ${isError ? "error" : ""}`;
}

function setLockStatus(message, isError = false) {
  if (!els.lockStatus) return;
  els.lockStatus.textContent = message;
  els.lockStatus.className = `gm-status ${isError ? "error" : ""}`;
}

function setArticleStatus(message, isError = false) {
  if (!els.articleStatus) return;
  els.articleStatus.textContent = message;
  els.articleStatus.className = `gm-status ${isError ? "error" : ""}`;
}

function setAuthStatus(message, isError = false) {
  if (!els.authStatus) return;
  els.authStatus.textContent = message;
  els.authStatus.className = `gm-status ${isError ? "error" : ""}`;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch (_) {
    throw new Error(text || `Request failed (${response.status})`);
  }
  if (!response.ok || payload?.ok === false) {
    const err = new Error(
      payload?.message ||
        payload?.msg ||
        payload?.error ||
        payload?.error_description ||
        payload?.error?.message ||
        `Request failed (${response.status})`
    );
    err.status = response.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

function getReadableAuthError(error, action) {
  const status = Number(error?.status || 0);
  const message = String(error?.message || "").trim();
  const errorCode = String(error?.payload?.error_code || "").trim().toLowerCase();
  const lower = message.toLowerCase();

  if (status === 422) {
    if (
      lower.includes("already") ||
      lower.includes("exists") ||
      lower.includes("registered")
    ) {
      return "Email already registered. Use Sign In.";
    }
    if (lower.includes("password")) {
      return "Password is invalid. Use at least 8 characters.";
    }
    if (lower.includes("email")) {
      return "Email format is invalid.";
    }
    return action === "signup"
      ? "Sign up failed (422). Email may already exist or password is invalid."
      : "Sign in failed (422).";
  }

  if (
    status === 400 &&
    (lower.includes("invalid login credentials") ||
      errorCode === "invalid_credentials")
  ) {
    return "Invalid login credentials.";
  }
  if (
    lower.includes("email not confirmed") ||
    errorCode === "email_not_confirmed"
  ) {
    return "Email not confirmed. Confirm from your inbox, then sign in.";
  }
  if (status === 429) {
    return "Too many attempts. Wait a minute and try again.";
  }
  return message || `Request failed (${status || "unknown"})`;
}

function authHeaders(withAuth = false, token = "") {
  requireSupabaseConfig();
  const headers = {
    "Content-Type": "application/json",
    apikey: supabaseAnon,
  };
  const access = token || gmSession?.access_token || "";
  if (withAuth && access) {
    headers.Authorization = `Bearer ${access}`;
  }
  return headers;
}

function supabaseUrlWithApiKey(path) {
  requireSupabaseConfig();
  const sep = path.includes("?") ? "&" : "?";
  return `${supabaseUrl}${path}${sep}apikey=${encodeURIComponent(supabaseAnon)}`;
}

async function loadSupabaseConfig() {
  const cfg = await requestJson(SUPABASE_CONFIG_URL, { cache: "no-store" });
  supabaseUrl = String(cfg.url || cfg.supabaseUrl || "").trim();
  supabaseAnon = String(
    cfg.anonKey || cfg.supabaseAnon || cfg.publicAnonKey || ""
  ).trim();
  if (!supabaseUrl || !supabaseAnon) {
    throw new Error("Missing Supabase config from /api/supabase-config.");
  }
}

async function fetchAuthUser(accessToken) {
  return requestJson(supabaseUrlWithApiKey("/auth/v1/user"), {
    headers: authHeaders(true, accessToken),
  });
}

async function fetchGmAssignment(userId) {
  const query = `?select=user_id,team,role,is_gm,is_commish&user_id=eq.${encodeURIComponent(
    userId
  )}&limit=1`;
  const rows = await requestJson(
    `${supabaseUrl}/rest/v1/gm_assignments${query}`,
    {
      headers: await authHeadersFresh(),
    }
  );
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) {
    return null;
  }
  const role = String(row.role || "").trim().toLowerCase();
  const team = String(row.team || "").trim();
  const commishByRole =
    role === "commish" || role === "commissioner" || role === "admin";
  const reporterByRole = role === "reporter" || role === "media" || role === "writer";
  const allowed =
    row.is_gm === true ||
    row.is_commish === true ||
    commishByRole ||
    reporterByRole ||
    !!team;
  if (!allowed) {
    return null;
  }
  return {
    user_id: row.user_id,
    team,
    role,
    is_gm: row.is_gm === true || !!team,
    is_commish: row.is_commish === true || commishByRole,
    is_reporter: reporterByRole,
  };
}

async function fetchLegacyGmProfile(userId) {
  const query = `?select=user_id,team_name,is_gm,is_commish&user_id=eq.${encodeURIComponent(
    userId
  )}&limit=1`;
  const rows = await requestJson(`${supabaseUrl}/rest/v1/gm_users${query}`, {
    headers: await authHeadersFresh(),
  });
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row || row.is_gm === false) {
    return null;
  }
  return {
    user_id: row.user_id,
    team: String(row.team_name || "").trim(),
    role: row.is_commish ? "commish" : "gm",
    is_gm: row.is_gm !== false,
    is_commish: row.is_commish === true,
  };
}

async function signUpAuth(email, password) {
  requireSupabaseConfig();
  return requestJson(supabaseUrlWithApiKey("/auth/v1/signup"), {
    method: "POST",
    headers: authHeaders(false),
    body: JSON.stringify({ email, password }),
  });
}

async function signInAuth(email, password) {
  requireSupabaseConfig();
  const data = await requestJson(
    supabaseUrlWithApiKey("/auth/v1/token?grant_type=password"),
    {
      method: "POST",
      headers: authHeaders(false),
      body: JSON.stringify({ email, password }),
    }
  );
  if (!data?.access_token) {
    throw new Error("Sign in failed.");
  }
  return data;
}

async function refreshAuthSession(refreshToken) {
  requireSupabaseConfig();
  const data = await requestJson(
    supabaseUrlWithApiKey("/auth/v1/token?grant_type=refresh_token"),
    {
      method: "POST",
      headers: authHeaders(false),
      body: JSON.stringify({ refresh_token: refreshToken }),
    }
  );
  if (!data?.access_token) {
    throw new Error("Session refresh failed.");
  }
  return data;
}

async function ensureFreshAccessToken() {
  if (!gmSession?.access_token && !gmSession?.refresh_token) {
    throw new Error("Sign in again to continue.");
  }
  if (!gmSession?.refresh_token) {
    return gmSession.access_token;
  }
  try {
    const tokenData = await refreshAuthSession(gmSession.refresh_token);
    gmSession = {
      ...gmSession,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || gmSession.refresh_token,
    };
    persistAuthState();
    return gmSession.access_token;
  } catch (_error) {
    clearAuthState();
    gmSession = null;
    gmAssignment = null;
    applyAuthUi();
    throw new Error("Your session expired. Sign in again, then try again.");
  }
}

async function authHeadersFresh(extra = {}) {
  const accessToken = await ensureFreshAccessToken();
  return {
    ...authHeaders(true, accessToken),
    ...extra,
  };
}

async function signOutAuth() {
  if (!gmSession?.access_token) return;
  try {
    await requestJson(`${supabaseUrl}/auth/v1/logout`, {
      method: "POST",
      headers: await authHeadersFresh(),
      body: JSON.stringify({}),
    });
  } catch (_) {
    // ignore logout transport failures
  }
}

function getAuthorizedTeam() {
  return String(gmAssignment?.team || "").trim();
}

function isCommish() {
  return !!gmAssignment?.is_commish;
}

function isReporter() {
  const role = String(gmAssignment?.role || "").trim().toLowerCase();
  return !!gmAssignment?.is_reporter || role === "reporter" || role === "media" || role === "writer";
}

function canWriteArticles() {
  return isCommish() || isReporter();
}

function isSignedInGm() {
  return !!gmSession?.user?.id && !!gmAssignment;
}

function sameTeam(a, b) {
  return normalizeName(displayTeamName(a)) === normalizeName(displayTeamName(b));
}

function canEditTeam(team) {
  if (!isSignedInGm()) return false;
  if (isCommish()) return true;
  if (isReporter()) return false;
  const mine = getAuthorizedTeam();
  return !!mine && sameTeam(mine, team);
}

function canSubmitPowerRankings(team) {
  if (!isSignedInGm()) return false;
  if (team === POWER_REPORTER_VALUE) return isReporter() || isCommish();
  if (isCommish() || isReporter()) return true;
  return canEditTeam(team);
}

function formatReporterHandle(value) {
  const clean = String(value || "").trim();
  if (!clean) return "";
  return clean.startsWith("@") ? clean : `@${clean}`;
}

function getPowerVoteStorageKey(team, handle = "") {
  if (team !== POWER_REPORTER_VALUE) {
    return team;
  }
  const cleanHandle = formatReporterHandle(handle).replace(/\s+/g, "");
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `Reporter ${cleanHandle || "@unknown"} ${stamp}`;
}

function getDraftRunnerSeason() {
  return String(els.draftSeason?.value || "c2s4").trim() || "c2s4";
}

function getDraftRoundCount(season = getDraftRunnerSeason()) {
  return String(season || "").trim().toLowerCase() === "c2s4" ? 2 : 4;
}

function getDraftOption() {
  return String(els.draftPickOption?.value || "used").trim() || "used";
}

function getDraftPickKey(pick) {
  return `${pick.season}:${pick.round}:${pick.pick}`;
}

function parseDraftCapitalOwnership(season = getDraftRunnerSeason(), round = 1) {
  const rows = draftCapitalRowsCache || [];
  const map = new Map();
  const extras = [];
  if (!rows.length) return { map, extras };
  const fallbackOwnersByCol = Object.keys(DRAFT_CAPITAL_COLUMNS);
  const ownersByCol = (rows[0] || []).some((cell) => String(cell || "").trim())
    ? (rows[0] || []).map((owner, idx) => canonicalTeamKey(owner) || fallbackOwnersByCol[idx] || "")
    : fallbackOwnersByCol;
  const seasonPattern = String(season || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  rows.slice(1).forEach((row) => {
    ownersByCol.forEach((ownerName, colIndex) => {
      const text = String((row && row[colIndex]) || "").trim();
      if (!text || !new RegExp(seasonPattern, "i").test(text)) return;
      const roundMatch = text.match(new RegExp(`${seasonPattern}\\s*(\\d+)(?:st|nd|rd|th)?`, "i"));
      if (!roundMatch || Number(roundMatch[1]) !== Number(round)) return;
      const viaMatch = text.match(/via\s+(.+)$/i);
      const owner = displayTeamName(ownerName);
      const original = displayTeamName(viaMatch ? canonicalTeamKey(viaMatch[1]) || viaMatch[1] : ownerName);
      const pickInfo = { owner, original, text, isComp: /\bcomp\b/i.test(text), colIndex };
      if (pickInfo.isComp) {
        extras.push(pickInfo);
      } else {
        map.set(normalizeName(original), pickInfo);
      }
    });
  });
  return { map, extras };
}

function parseDraftStandingsRows(rows) {
  if (!Array.isArray(rows) || rows.length < 2) return [];
  const knownTeams = new Set(TEAM_ORDER.map((team) => normalizeName(displayTeamName(team))));
  return rows
    .map((row) => {
      const teamIdx = row.findIndex((cell) =>
        knownTeams.has(normalizeName(displayTeamName(canonicalTeamKey(cell))))
      );
      if (teamIdx < 0) return null;
      const team = displayTeamName(canonicalTeamKey(row[teamIdx] || ""));
      const wins = Number(String(row[teamIdx + 2] || "0").replace(/[^0-9.-]/g, "")) || 0;
      const losses = Number(String(row[teamIdx + 3] || "0").replace(/[^0-9.-]/g, "")) || 0;
      let pct = Number(String(row[teamIdx + 5] || "").replace(/[^0-9.-]/g, ""));
      if (!Number.isFinite(pct)) {
        pct = wins + losses > 0 ? wins / (wins + losses) : 0;
      } else if (pct > 1.5) {
        pct /= 100;
      }
      return { team, wins, losses, pct };
    })
    .filter(Boolean);
}

function getDraftOrderTeams() {
  return [...draftOrderPicksCache]
    .sort((a, b) => {
      if (a.pct !== b.pct) return a.pct - b.pct;
      if (a.wins !== b.wins) return a.wins - b.wins;
      if (a.losses !== b.losses) return b.losses - a.losses;
      return a.team.localeCompare(b.team);
    })
    .map((row) => row.team);
}

function getDraftRoundPickOffset(season, round, baseRoundLength) {
  let offset = 0;
  for (let previousRound = 1; previousRound < Number(round); previousRound += 1) {
    offset += baseRoundLength + parseDraftCapitalOwnership(season, previousRound).extras.length;
  }
  return offset;
}

function getDraftOrderPickOptions(season = getDraftRunnerSeason(), round = 1) {
  if (Number(round) > getDraftRoundCount(season)) return [];
  const order = getDraftOrderTeams();
  const roundOffset = getDraftRoundPickOffset(season, round, order.length);
  const ownership = parseDraftCapitalOwnership(season, round);
  const picks = order.map((originalTeam, idx) => {
    const pickInfo = ownership.map.get(normalizeName(originalTeam));
    const owner = pickInfo?.owner || originalTeam;
    const pickNumber = roundOffset + idx + 1;
    const label = owner === originalTeam
      ? `Pick ${pickNumber}: ${owner}`
      : `Pick ${pickNumber}: ${owner} via ${originalTeam}`;
    return {
      id: `${season}:${round}:${pickNumber}`,
      round,
      pick: pickNumber,
      owner,
      original: originalTeam,
      text: pickInfo?.text || "",
      label,
    };
  });
  ownership.extras.forEach((pickInfo, idx) => {
    const pickNumber = roundOffset + order.length + idx + 1;
    picks.push({
      id: `${season}:${round}:comp:${idx}`,
      round,
      pick: pickNumber,
      owner: pickInfo.owner,
      original: pickInfo.original,
      text: pickInfo.text,
      label: `Pick ${pickNumber} (Comp): ${pickInfo.owner}${pickInfo.owner === pickInfo.original ? "" : ` via ${pickInfo.original}`}`,
    });
  });
  return picks;
}

function getSelectedSheetPick() {
  const selectedId = String(els.draftSheetPick?.value || "");
  return getDraftOrderPickOptions(getDraftRunnerSeason(), Math.max(1, Number(els.draftRound?.value) || 1)).find(
    (pick) => pick.id === selectedId
  ) || null;
}

function renderDraftSheetPickOptions() {
  if (!els.draftSheetPick) return;
  const current = String(els.draftSheetPick.value || "");
  const options = getDraftOrderPickOptions(getDraftRunnerSeason(), Math.max(1, Number(els.draftRound?.value) || 1));
  els.draftSheetPick.innerHTML = [
    '<option value="">Select a draft pick</option>',
    ...options.map((pick) => `<option value="${escapeHtml(pick.id)}">${escapeHtml(pick.label)}</option>`),
  ].join("");
  if (options.some((pick) => pick.id === current)) {
    els.draftSheetPick.value = current;
  }
}

function syncDraftRoundOptions() {
  if (!els.draftRound) return;
  const season = getDraftRunnerSeason();
  const maxRound = getDraftRoundCount(season);
  const current = Math.max(1, Number(els.draftRound.value) || 1);
  els.draftRound.innerHTML = Array.from({ length: maxRound }, (_, idx) => {
    const round = idx + 1;
    return `<option value="${round}">Round ${round}</option>`;
  }).join("");
  els.draftRound.value = String(Math.min(current, maxRound));
}

function syncDraftModeFields() {
  const option = getDraftOption();
  const isUsed = option === "used";
  const isForfeit = option === "forfeit";
  els.draftUsedFields.forEach((node) => {
    node.hidden = !isUsed;
  });
  els.draftTeamFields.forEach((node) => {
    node.hidden = isUsed;
  });
  els.draftPlayerFields.forEach((node) => {
    node.hidden = isForfeit;
  });
  if (isForfeit && els.draftPlayer) {
    els.draftPlayer.value = "";
  }
  if (isUsed) {
    applySheetPickToDraftForm();
  }
}

function applySheetPickToDraftForm() {
  const pick = getSelectedSheetPick();
  if (!pick) return;
  if (els.draftRound) {
    els.draftRound.value = String(pick.round || 1);
  }
  if (els.draftPick) {
    els.draftPick.value = String(pick.pick || 1);
  }
  if (els.draftTeam) {
    els.draftTeam.value = pick.owner || "";
  }
  if (els.draftNote && !els.draftNote.value) {
    els.draftNote.value = pick.owner === pick.original ? pick.text : `via ${pick.original}`;
  }
  renderDraftRunner();
}

function loadTestDraftPicks() {
  const raw = safeJsonParse(localStorage.getItem(GM_DRAFT_RUNNER_KEY), []);
  testDraftPicks = Array.isArray(raw)
    ? raw
        .map((pick) => ({
          season: String(pick?.season || "c2s4").trim(),
          option: String(pick?.option || "used").trim(),
          round: Math.max(1, Number(pick?.round) || 1),
          pick: Math.max(1, Number(pick?.pick) || 1),
          team: String(pick?.team || "").trim(),
          sheetPickText: String(pick?.sheetPickText || "").trim(),
          player: String(pick?.player || "").trim(),
          note: String(pick?.note || "").trim(),
          updatedAt: String(pick?.updatedAt || "").trim(),
        }))
        .filter((pick) => pick.season && pick.round && pick.pick)
    : [];
}

function saveTestDraftPicks() {
  localStorage.setItem(GM_DRAFT_RUNNER_KEY, JSON.stringify(testDraftPicks));
}

function setDraftStatus(message, isError = false) {
  setStatus(els.draftStatus, message, isError);
}

function setGmDraftStatus(message, isError = false) {
  setStatus(els.gmDraftStatus, message, isError);
}

function getDraftClosedMessage() {
  return "Draft submissions are locked for now.";
}

function setDraftSaveButtonState(isSaving, label = "Save Pick") {
  if (!els.draftSave) return;
  els.draftSave.disabled = isSaving;
  els.draftSave.textContent = label;
}

function setGmDraftSaveButtonState(button, isSaving, label = "Save Pick") {
  if (!button) return;
  button.disabled = isSaving;
  button.textContent = label;
}

function getDraftSubmissionKey(pick) {
  return `${String(pick?.season || "").trim()}:${Number(pick?.round) || 0}:${Number(pick?.pick) || 0}`;
}

function isDraftPickSubmitted(pick) {
  const key = getDraftSubmissionKey(pick);
  if (!key) return false;
  if (gmDraftUnlockedPickKeys.has(key)) return false;
  if (submittedDraftPicksCache.has(key)) return true;
  return testDraftPicks.some((entry) => getDraftSubmissionKey(entry) === key && String(entry.player || "").trim());
}

function normalizeDraftPickCell(value) {
  const text = String(value == null ? "" : value).trim();
  if (!text || /^round\s+\d+/i.test(text)) return "";
  const match = text.match(/^(?:pick\s*)?#?(\d+)$/i);
  return match ? match[1] : "";
}

function buildSubmittedDraftPickSet(rows, season = "c2s4") {
  const out = new Set();
  let round = 0;
  (rows || []).forEach((row) => {
    const first = String(row?.[0] || "").trim();
    const roundMatch = first.match(/^round\s+(\d+)/i);
    if (roundMatch) {
      round = Number(roundMatch[1]) || round;
      return;
    }
    const pickNumber = normalizeDraftPickCell(first);
    const player = String(row?.[2] || "").trim();
    if (!round || !pickNumber || !player) return;
    out.add(`${season}:${round}:${Number(pickNumber)}`);
  });
  return out;
}

function getAllDraftPickOptions(season = "c2s4") {
  const picks = [];
  for (let round = 1; round <= getDraftRoundCount(season); round += 1) {
    picks.push(...getDraftOrderPickOptions(season, round));
  }
  return picks.sort((a, b) => a.round - b.round || a.pick - b.pick);
}

function getDraftPicksForTeam(team, season = "c2s4") {
  const teamKey = normalizeName(displayTeamName(team));
  if (!teamKey) return [];
  return getAllDraftPickOptions(season)
    .filter((pick) => normalizeName(displayTeamName(pick.owner)) === teamKey)
    .map((pick) => {
      const pickKey = { season, round: pick.round, pick: pick.pick };
      return {
        ...pick,
        isSubmitted: isDraftPickSubmitted(pickKey),
      };
    });
}

function getCurrentOpenDraftPick(season = "c2s4") {
  return getAllDraftPickOptions(season).find((pick) =>
    !isDraftPickSubmitted({ season, round: pick.round, pick: pick.pick })
  ) || null;
}

function isCurrentOpenDraftPick(pick) {
  const season = String(pick?.season || "c2s4").trim() || "c2s4";
  const current = getCurrentOpenDraftPick(season);
  return Boolean(
    current &&
      Number(current.round) === Number(pick?.round) &&
      Number(current.pick) === Number(pick?.pick)
  );
}

function renderGmDraftPick() {
  if (!els.gmDraftPick) return;
  const team = getAuthorizedTeam();
  if (!isSignedInGm() || isReporter() || !team) {
    els.gmDraftPick.innerHTML = '<div class="gm-empty">Sign in with a GM team account to see your C2S4 picks.</div>';
    return;
  }
  const picks = getDraftPicksForTeam(team);
  if (!picks.length) {
    els.gmDraftPick.innerHTML = '<div class="gm-empty">No C2S4 picks found for your team right now.</div>';
    return;
  }
  const currentPick = getCurrentOpenDraftPick("c2s4");
  els.gmDraftPick.innerHTML = picks
    .map((pick) => {
      const originalText = pick.owner === pick.original ? "Original pick" : `via ${pick.original}`;
      const key = getDraftSubmissionKey({ season: "c2s4", round: pick.round, pick: pick.pick });
      const isOnClock = currentPick && Number(currentPick.round) === Number(pick.round) && Number(currentPick.pick) === Number(pick.pick);
      const previousPickNumber = Math.max(1, Number(pick.pick) - 1);
      return `
        <article class="gm-draft-gm-next${pick.isSubmitted ? " submitted" : ""}${isOnClock ? " on-clock" : ""}" data-gm-draft-pick-card="${escapeHtml(key)}" data-season="c2s4" data-round="${escapeHtml(pick.round)}" data-pick="${escapeHtml(pick.pick)}" data-team="${escapeHtml(pick.owner || team)}" data-sheet-pick-text="${escapeHtml(pick.text || "")}">
          <div class="gm-draft-gm-summary">
            <span class="gm-draft-pick-meta">C2S4 Draft</span>
            <strong>Round ${escapeHtml(pick.round)} Pick ${escapeHtml(pick.pick)}</strong>
            <span class="gm-draft-pick-team">${escapeHtml(displayTeamName(pick.owner))}</span>
            <small>${escapeHtml(originalText)}</small>
          </div>
          ${
            pick.isSubmitted
              ? `<div class="gm-draft-gm-submitted">
                  <span>Pick submitted</span>
                  <button class="btn ghost" type="button" data-gm-draft-undo>Undo selection</button>
                </div>`
              : !GM_DRAFT_SUBMISSIONS_OPEN
              ? `<div class="gm-draft-gm-submitted">
                  <span>Draft submissions locked</span>
                </div>`
              : !isOnClock
              ? `<div class="gm-draft-gm-submitted">
                  <span>Locked until Pick ${escapeHtml(previousPickNumber)} is submitted</span>
                </div>`
              : `<div class="gm-draft-gm-form">
                  <label class="label" for="gm-draft-player-${escapeHtml(key)}">Player Picked</label>
                  <input id="gm-draft-player-${escapeHtml(key)}" class="text-input" type="text" placeholder="@player or player name" data-gm-draft-player />
                  <button class="btn" type="button" data-gm-draft-save>Save Pick</button>
                </div>`
          }
        </article>
      `;
    })
    .join("");
}

function undoGmDraftPick(card) {
  if (!isSignedInGm() || isReporter()) {
    setGmDraftStatus("Sign in with a GM team account first.", true);
    return;
  }
  if (!card) {
    setGmDraftStatus("Pick card could not be found.", true);
    return;
  }
  const team = getAuthorizedTeam();
  const pick = {
    season: String(card.dataset.season || "c2s4"),
    round: Math.max(1, Number(card.dataset.round) || 1),
    pick: Math.max(1, Number(card.dataset.pick) || 1),
    team: String(card.dataset.team || team).trim(),
  };
  if (!canEditTeam(pick.team)) {
    setGmDraftStatus("You can only undo your own team's picks.", true);
    return;
  }
  const key = getDraftSubmissionKey(pick);
  gmDraftUnlockedPickKeys.add(key);
  testDraftPicks = testDraftPicks.filter((entry) => getDraftSubmissionKey(entry) !== key);
  saveTestDraftPicks();
  renderGmDraftPick();
  setGmDraftStatus(`Round ${pick.round}, Pick ${pick.pick} reopened for editing.`);
}

function getVisibleTestDraftPicks() {
  const season = getDraftRunnerSeason();
  return testDraftPicks
    .filter((pick) => pick.season === season)
    .sort((a, b) => a.round - b.round || a.pick - b.pick);
}

function renderDraftRunner() {
  if (els.draftCurrentRound) {
    els.draftCurrentRound.textContent = String(Math.max(1, Number(els.draftRound?.value) || 1));
  }
  if (els.draftCurrentPick) {
    els.draftCurrentPick.textContent = String(Math.max(1, Number(els.draftPick?.value) || 1));
  }
  if (els.draftCurrentTeam) {
    const option = getDraftOption();
    const team =
      String(els.draftTeam?.value || "").trim();
    els.draftCurrentTeam.textContent =
      option === "forfeit"
        ? "Pick forfeited"
        : team
        ? displayTeamName(team)
        : "Select a team";
  }
  if (!els.draftBoard) return;
  if (!isSignedInGm() || !isCommish()) {
    els.draftBoard.innerHTML = "";
    return;
  }
  const picks = getVisibleTestDraftPicks();
  if (!picks.length) {
    els.draftBoard.innerHTML = '<div class="gm-empty">No test picks saved yet.</div>';
    return;
  }
  els.draftBoard.innerHTML = picks
    .map(
      (pick) => {
        const mode = pick.option || "used";
        const team = displayTeamName(pick.team) || "No team";
        const player = mode === "forfeit" ? "FORFEITED" : pick.player || "No player";
        const note = pick.note || pick.sheetPickText || "Click to edit";
        return `
          <button class="gm-draft-pick-card" type="button" data-draft-pick-key="${escapeHtml(getDraftPickKey(pick))}">
            <span class="gm-draft-pick-meta">R${escapeHtml(pick.round)} Pick ${escapeHtml(pick.pick)}</span>
            <span class="gm-draft-pick-team">${escapeHtml(team)}</span>
            <strong>${escapeHtml(player)}</strong>
            <small>${escapeHtml(note)}</small>
          </button>
        `;
      }
    )
    .join("");
}

function fillDraftRunnerForm(pick) {
  if (els.draftPickOption) els.draftPickOption.value = pick.option || "used";
  if (els.draftSeason) els.draftSeason.value = pick.season || getDraftRunnerSeason();
  if (els.draftRound) els.draftRound.value = String(pick.round || 1);
  if (els.draftPick) els.draftPick.value = String(pick.pick || 1);
  if (els.draftTeam) els.draftTeam.value = pick.team || "";
  if (els.draftPlayer) els.draftPlayer.value = pick.player || "";
  if (els.draftNote) els.draftNote.value = pick.note || "";
  syncDraftModeFields();
  renderDraftSheetPickOptions();
}

function findNextOpenDraftPick() {
  const season = getDraftRunnerSeason();
  const round = Math.max(1, Number(els.draftRound?.value) || 1);
  let pick = Math.max(1, Number(els.draftPick?.value) || 1);
  const taken = new Set(
    testDraftPicks
      .filter((entry) => entry.season === season && entry.round === round)
      .map((entry) => Number(entry.pick))
  );
  do {
    pick += 1;
  } while (taken.has(pick) && pick <= 80);
  return pick;
}

async function saveDraftPickToSheet(pick) {
  const commissioner =
    gmSession?.user?.email ||
    gmSession?.user?.user_metadata?.email ||
    gmSession?.user?.id ||
    "";
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 15000);
  try {
    return await requestJson(TRADE_BLOCKS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        action: "submitDraftPick",
        season: pick.season,
        round: pick.round,
        pick: pick.pick,
        draftPickLabel: `Round ${pick.round} Pick ${pick.pick}`,
        pickOption: pick.option,
        team: pick.team,
        player: pick.player,
        note: pick.note,
        sheetPickText: pick.sheetPickText,
        commissioner,
        updatedAt: pick.updatedAt,
      }),
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Draft sheet save timed out. Try again.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function saveDraftRunnerPick() {
  setDraftStatus("Save clicked. Checking pick...");
  setSubmitOverlayVisible(
    true,
    "Checking draft pick",
    "Making sure the pick is ready to save."
  );
  if (!GM_DRAFT_SUBMISSIONS_OPEN) {
    const message = getDraftClosedMessage();
    setDraftStatus(message, true);
    setSubmitOverlayVisible(
      true,
      "Draft locked",
      message,
      "Draft picks cannot be submitted yet."
    );
    window.setTimeout(() => {
      setSubmitOverlayVisible(false);
    }, 2200);
    return;
  }
  if (!isSignedInGm() || !isCommish()) {
    setDraftStatus("Commissioner access required.", true);
    setSubmitOverlayVisible(
      true,
      "Commissioner required",
      "Only the commissioner can save draft picks.",
      "Sign in with the commissioner account and try again."
    );
    window.setTimeout(() => {
      setSubmitOverlayVisible(false);
    }, 2200);
    return;
  }
  if (draftSaveInFlight) {
    setDraftStatus("Already saving this pick...");
    return;
  }
  const pick = {
    season: getDraftRunnerSeason(),
    option: getDraftOption(),
    round: Math.max(1, Number(els.draftRound?.value) || 1),
    pick: Math.max(1, Number(els.draftPick?.value) || 1),
    team: String(els.draftTeam?.value || "").trim(),
    sheetPickText: getSelectedSheetPick()?.text || "",
    player: String(els.draftPlayer?.value || "").trim(),
    note: String(els.draftNote?.value || "").trim(),
    updatedAt: new Date().toISOString(),
  };
  if (!isCurrentOpenDraftPick(pick)) {
    const current = getCurrentOpenDraftPick(pick.season);
    const message = current
      ? `Pick ${current.pick} is on the clock. You cannot submit Pick ${pick.pick} yet.`
      : "All draft picks have already been submitted.";
    setDraftStatus(message, true);
    setSubmitOverlayVisible(
      true,
      "Pick not open",
      message,
      "Submit each pick in order."
    );
    window.setTimeout(() => {
      setSubmitOverlayVisible(false);
    }, 2200);
    return;
  }
  if (pick.round > getDraftRoundCount(pick.season)) {
    setDraftStatus(`${pick.season.toUpperCase()} only has ${getDraftRoundCount(pick.season)} rounds.`, true);
    setSubmitOverlayVisible(
      true,
      "Invalid round",
      `${pick.season.toUpperCase()} only has ${getDraftRoundCount(pick.season)} rounds.`,
      "Pick Round 1 or Round 2 and try again."
    );
    window.setTimeout(() => {
      setSubmitOverlayVisible(false);
    }, 2200);
    return;
  }
  if (pick.option === "used") {
    const sheetPick = getSelectedSheetPick();
    if (!sheetPick) {
      setDraftStatus("Select a pick from the draft order.", true);
      setSubmitOverlayVisible(
        true,
        "Missing draft pick",
        "Select a pick from the draft order before saving.",
        "Then hit Save Pick again."
      );
      window.setTimeout(() => {
        setSubmitOverlayVisible(false);
      }, 2200);
      return;
    }
    if (sheetPick) {
      pick.team = sheetPick.owner;
      pick.sheetPickText = sheetPick.text;
      if (!pick.note && sheetPick.owner !== sheetPick.original) {
        pick.note = `via ${sheetPick.original}`;
      }
    }
  }
  if (pick.option === "forfeit") {
    pick.player = "";
    if (!pick.note) {
      pick.note = "Pick forfeited";
    }
  }
  if (pick.option !== "forfeit" && !pick.team) {
    setDraftStatus("Select the team making this pick.", true);
    setSubmitOverlayVisible(
      true,
      "Missing team",
      "Select the team making this pick before saving.",
      "Then hit Save Pick again."
    );
    window.setTimeout(() => {
      setSubmitOverlayVisible(false);
    }, 2200);
    return;
  }
  if (pick.option !== "forfeit" && !pick.player) {
    setDraftStatus("Enter the player picked.", true);
    setSubmitOverlayVisible(
      true,
      "Missing player",
      "Enter the player picked before saving.",
      "Then hit Save Pick again."
    );
    window.setTimeout(() => {
      setSubmitOverlayVisible(false);
    }, 2200);
    return;
  }
  setDraftStatus("Saving pick to draft sheet...");
  setDraftSaveButtonState(true, "Saving...");
  setSubmitOverlayVisible(
    true,
    "Saving draft pick",
    `Round ${pick.round}, Pick ${pick.pick} is being sent to the draft sheet.`
  );
  draftSaveInFlight = true;
  try {
    await saveDraftPickToSheet(pick);
  } catch (error) {
    setDraftStatus(error?.message || "Draft pick could not be saved to the sheet.", true);
    setSubmitOverlayVisible(
      true,
      "Draft pick failed",
      error?.message || "Draft pick could not be saved to the sheet.",
      "Check the pick info and try again."
    );
    window.setTimeout(() => {
      setSubmitOverlayVisible(false);
    }, 2400);
    return;
  } finally {
    draftSaveInFlight = false;
    setDraftSaveButtonState(false);
  }
  const key = getDraftPickKey(pick);
  const existingIndex = testDraftPicks.findIndex((entry) => getDraftPickKey(entry) === key);
  if (existingIndex >= 0) {
    testDraftPicks.splice(existingIndex, 1, pick);
  } else {
    testDraftPicks.push(pick);
  }
  saveTestDraftPicks();
  renderDraftRunner();
  setDraftStatus(`Saved Round ${pick.round}, Pick ${pick.pick} to the draft sheet.`);
  setSubmitOverlayVisible(
    true,
    "Draft pick saved",
    `Round ${pick.round}, Pick ${pick.pick} was saved to the draft sheet.`,
    "You can move to the next pick now."
  );
  window.setTimeout(() => {
    setSubmitOverlayVisible(false);
  }, 1600);
}

function handleDraftSaveClick(event) {
  const button = event?.target?.closest?.("#gm-draft-save");
  if (!button) return;
  if (event?.__draftSaveHandled) return;
  if (event) {
    event.__draftSaveHandled = true;
  }
  event.preventDefault();
  saveDraftRunnerPick().catch((error) => {
    draftSaveInFlight = false;
    setDraftSaveButtonState(false);
    setDraftStatus(error?.message || "Draft pick could not be saved.", true);
  });
}

window.handleDraftSaveClick = handleDraftSaveClick;

async function saveGmDraftPick(card, button) {
  if (!isSignedInGm() || isReporter()) {
    setGmDraftStatus("Sign in with a GM team account first.", true);
    return;
  }
  if (!GM_DRAFT_SUBMISSIONS_OPEN) {
    setGmDraftStatus(getDraftClosedMessage(), true);
    return;
  }
  if (!card) {
    setGmDraftStatus("Pick card could not be found.", true);
    return;
  }
  const team = getAuthorizedTeam();
  const playerInput = card.querySelector("[data-gm-draft-player]");
  const pick = {
    season: String(card.dataset.season || "c2s4"),
    option: "used",
    round: Math.max(1, Number(card.dataset.round) || 1),
    pick: Math.max(1, Number(card.dataset.pick) || 1),
    team: String(card.dataset.team || team).trim(),
    sheetPickText: String(card.dataset.sheetPickText || "").trim(),
    player: String(playerInput?.value || "").trim(),
    note: "",
    updatedAt: new Date().toISOString(),
  };
  const key = getDraftSubmissionKey(pick);
  if (!canEditTeam(pick.team)) {
    setGmDraftStatus("You can only submit your own team's picks.", true);
    return;
  }
  if (!isCurrentOpenDraftPick(pick)) {
    const current = getCurrentOpenDraftPick(pick.season);
    setGmDraftStatus(
      current
        ? `Pick ${current.pick} is on the clock. You cannot submit Pick ${pick.pick} yet.`
        : "All draft picks have already been submitted.",
      true
    );
    renderGmDraftPick();
    return;
  }
  if (isDraftPickSubmitted(pick)) {
    setGmDraftStatus(`Round ${pick.round}, Pick ${pick.pick} has already been submitted.`, true);
    renderGmDraftPick();
    return;
  }
  if (gmDraftSaveInFlightKeys.has(key)) {
    setGmDraftStatus("That pick is already saving.");
    return;
  }
  if (!pick.player) {
    setGmDraftStatus("Enter the player picked.", true);
    return;
  }
  setGmDraftStatus("Saving pick...");
  setGmDraftSaveButtonState(button, true, "Saving...");
  gmDraftSaveInFlightKeys.add(key);
  setSubmitOverlayVisible(
    true,
    "Saving draft pick",
    `Round ${pick.round}, Pick ${pick.pick} is being sent to the draft sheet.`
  );
  try {
    await saveDraftPickToSheet(pick);
    const existingIndex = testDraftPicks.findIndex((entry) => getDraftSubmissionKey(entry) === key);
    if (existingIndex >= 0) {
      testDraftPicks.splice(existingIndex, 1, pick);
    } else {
      testDraftPicks.push(pick);
    }
    saveTestDraftPicks();
    gmDraftUnlockedPickKeys.delete(key);
    submittedDraftPicksCache.add(key);
    if (playerInput) playerInput.value = "";
    renderGmDraftPick();
    renderDraftRunner();
    setGmDraftStatus(`Saved Round ${pick.round}, Pick ${pick.pick}.`);
    setSubmitOverlayVisible(
      true,
      "Draft pick saved",
      `Round ${pick.round}, Pick ${pick.pick} was saved.`,
      "Your next available pick is now showing."
    );
    window.setTimeout(() => {
      setSubmitOverlayVisible(false);
    }, 1600);
  } catch (error) {
    setGmDraftStatus(error?.message || "Draft pick could not be saved.", true);
    setSubmitOverlayVisible(
      true,
      "Draft pick failed",
      error?.message || "Draft pick could not be saved.",
      "Check the pick and try again."
    );
    window.setTimeout(() => {
      setSubmitOverlayVisible(false);
    }, 2400);
  } finally {
    gmDraftSaveInFlightKeys.delete(key);
    setGmDraftSaveButtonState(button, false);
  }
}

function ensureCanEditTeam(team, setStatusFn) {
  if (!isSignedInGm()) {
    setStatusFn("Sign in with a GM account first.", true);
    return false;
  }
  if (!canEditTeam(team)) {
    setStatusFn("You can only edit your assigned team.", true);
    return false;
  }
  return true;
}

function syncTeamSelectorsToAuth() {
  const selects = [
    els.teamSelect,
    els.renameTeamSelect,
    els.lineupTeamSelect,
    els.powerTeamSelect,
  ].filter(Boolean);

  const assignedTeam = getAuthorizedTeam();
  const allowAnyTeam = isCommish() || isReporter();

  selects.forEach((select) => {
    Array.from(select.options).forEach((opt) => {
      if (!opt.value) return;
      if (opt.value === POWER_REPORTER_VALUE) {
        opt.disabled = !(isCommish() || isReporter());
        return;
      }
      opt.disabled =
        !allowAnyTeam && assignedTeam ? !sameTeam(opt.value, assignedTeam) : false;
    });
    if (!allowAnyTeam && assignedTeam) {
      const match = Array.from(select.options).find((opt) =>
        sameTeam(opt.value, assignedTeam)
      );
      select.value = match ? match.value : "";
      select.disabled = true;
    } else {
      select.disabled = !isSignedInGm();
      if (!isSignedInGm()) {
        select.value = "";
      }
    }
  });
}

function applyAuthUi() {
  const signedIn = isSignedInGm();
  const reporterOnly = signedIn && isReporter() && !isCommish();
  const commishAccess = signedIn && isCommish();

  els.codeLabels.forEach((node) => {
    node.hidden = true;
  });
  els.codeInputs.forEach((node) => {
    node.hidden = true;
    node.value = "";
  });

  if (els.panelHead) {
    els.panelHead.hidden = !signedIn;
  }
  if (els.authedShell) {
    els.authedShell.hidden = !signedIn;
  }
  if (els.authCard) {
    els.authCard.hidden = signedIn;
    els.authCard.style.display = signedIn ? "none" : "";
  }
  if (els.commishCard) {
    els.commishCard.hidden = !commishAccess;
  }
  if (els.commishDraftCard) {
    els.commishDraftCard.hidden = !commishAccess;
  }
  renderDraftRunner();
  if (els.articleCard) {
    els.articleCard.hidden = !(signedIn && canWriteArticles());
  }
  if (els.articlesTab) {
    els.articlesTab.hidden = !(signedIn && canWriteArticles());
  }
  if (els.commishTab) {
    els.commishTab.hidden = !commishAccess;
  }
  ["trade", "rename", "lineup", "draft"].forEach((tabName) => {
    const button = els.tabButtons.find((tabButton) => tabButton.dataset.gmTab === tabName);
    if (button) {
      button.hidden = reporterOnly;
    }
  });
  renderGmDraftPick();
  if (reporterOnly) {
    setActiveTab("articles");
  } else if (els.tabCommishPanel && !isCommish() && !els.tabCommishPanel.hidden) {
    setActiveTab(canWriteArticles() ? "articles" : "trade");
  }
  if (signedIn && canWriteArticles()) {
    loadArticlesForWriter();
  }
  if (els.sessionMeta) {
    els.sessionMeta.hidden = !signedIn;
  }
  if (els.authEmail) {
    els.authEmail.hidden = signedIn;
  }
  if (els.authPassword) {
    els.authPassword.hidden = signedIn;
  }
  if (els.authSignUp) {
    els.authSignUp.hidden = signedIn;
  }
  if (els.authSignIn) {
    els.authSignIn.hidden = signedIn;
  }
  if (els.authSignOut) {
    els.authSignOut.hidden = !signedIn;
  }

  syncTeamSelectorsToAuth();
  if (reporterOnly && els.powerTeamSelect) {
    els.powerTeamSelect.value = POWER_REPORTER_VALUE;
    els.powerTeamSelect.disabled = true;
  }
  renderSelectedTeam(els.teamSelect ? els.teamSelect.value : "");
  renderRenameTeam(els.renameTeamSelect ? els.renameTeamSelect.value : "");
  renderLineupTeam(els.lineupTeamSelect ? els.lineupTeamSelect.value : "");
  renderPowerRankingsTeam(els.powerTeamSelect ? els.powerTeamSelect.value : "");
  renderPowerVotesView();
  renderCommishLockGames();

  if (signedIn) {
    const email = gmSession?.user?.email || "GM";
    const team = displayTeamName(getAuthorizedTeam()) || "No team assigned";
    const role = String(gmAssignment?.role || "gm").trim() || "gm";
    if (els.sessionSummary) {
      els.sessionSummary.textContent = `${email} • ${team} • ${role}`;
    }
    setAuthStatus(`Signed in as ${email} • Team: ${team} • Role: ${role}`);
  } else {
    if (els.sessionSummary) {
      els.sessionSummary.textContent = "";
    }
    setAuthStatus("Not signed in.");
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

function normalizeTradeBlockMap(value) {
  if (!value || typeof value !== "object") {
    return {};
  }
  const toList = (input) => {
    if (Array.isArray(input)) {
      return input
        .map((v) => String(v || "").trim())
        .filter(Boolean);
    }
    if (typeof input === "string") {
      return input
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }
    return [];
  };
  const out = {};
  Object.entries(value).forEach(([team, block]) => {
    if (!team || !block || typeof block !== "object") {
      return;
    }
    out[team] = {
      players: toList(block.players),
      picks: toList(block.picks),
      notes: String(block.notes || "").trim(),
      updatedAt: block.updatedAt || "",
    };
  });
  return out;
}

async function fetchTradeBlocksFromSheet() {
  const response = await fetch(TRADE_BLOCKS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "getTradeBlocks" }),
  });
  if (!response.ok) {
    throw new Error(`Trade block fetch failed: ${response.status}`);
  }
  const payload = await response.json();
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid trade block response.");
  }
  if (payload.ok === false) {
    throw new Error(payload.message || "Trade block fetch failed.");
  }
  return normalizeTradeBlockMap(
    payload.tradeBlocks || payload.blocks || payload.data || {}
  );
}

async function saveTradeBlockToSheet(team, block) {
  const response = await fetch(TRADE_BLOCKS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "saveTradeBlock",
      team,
      players: Array.isArray(block.players) ? block.players : [],
      picks: Array.isArray(block.picks) ? block.picks : [],
      notes: String(block.notes || "").trim(),
      updatedAt: block.updatedAt || new Date().toISOString(),
    }),
  });
  if (!response.ok) {
    throw new Error(`Trade block save failed: ${response.status}`);
  }
  const payload = await response.json();
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid trade block save response.");
  }
  if (payload.ok === false) {
    throw new Error(payload.message || "Trade block save failed.");
  }
  return true;
}

async function saveGameLocksToSheet(locks) {
  requireSupabaseConfig();
  const rows = (Array.isArray(locks) ? locks : [])
    .map((lock) => ({
      date_text: normalizeScheduleDateKey(lock?.date || ""),
      lock_at: String(lock?.lockAt || "").trim(),
      updated_at: new Date().toISOString(),
      updated_by: String(gmSession?.user?.id || "").trim() || null,
    }))
    .filter((row) => row.date_text && row.lock_at);

  if (!rows.length) {
    throw new Error("No valid lock rows.");
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${GM_GAME_LOCKS_TABLE}`, {
    method: "POST",
    headers: {
      ...(await authHeadersFresh()),
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });
  if (!response.ok) {
    throw new Error(`Game locks save failed: ${response.status}`);
  }
  const payload = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("Invalid game locks save response.");
  }
  saveLocalGameLocks(
    payload.reduce((acc, row) => {
      const date = normalizeScheduleDateKey(row?.date_text || row?.date || "");
      const lockAt = String(row?.lock_at || row?.lockAt || "").trim();
      if (date && lockAt) acc[date] = lockAt;
      return acc;
    }, {})
  );
  return payload;
}

async function fetchGameLocksFromSheet() {
  requireSupabaseConfig();
  if (!gmSession?.access_token) {
    return localGameLocksByDate;
  }
  const response = await fetch(
    `${supabaseUrl}/rest/v1/${GM_GAME_LOCKS_TABLE}?select=date_text,lock_at,updated_at&order=date_text.asc`,
    {
      headers: await authHeadersFresh(),
      cache: "no-store",
    }
  );
  if (!response.ok) {
    throw new Error(`Game locks fetch failed: ${response.status}`);
  }
  const payload = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("Invalid game locks response.");
  }
  const locks = normalizeGameLocks(
    payload.map((row) => ({
      date: row?.date_text || "",
      lockAt: row?.lock_at || "",
      updatedAt: row?.updated_at || "",
    }))
  );
  saveLocalGameLocks(locks);
  return locks;
}

async function updatePlayerNameInSheet(team, oldTag, newName) {
  const response = await fetch(TRADE_BLOCKS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "updatePlayer",
      team,
      oldTag,
      newDisplay: newName,
      newTag: newName,
    }),
  });
  if (!response.ok) {
    throw new Error(`Player update failed: ${response.status}`);
  }
  const payload = await response.json();
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid player update response.");
  }
  if (payload.ok === false) {
    throw new Error(payload.message || "Unable to update player.");
  }
  if (payload.updated === false) {
    throw new Error("Player not found on sheet.");
  }
  return payload;
}

async function syncPlayerRenameToSupabase(oldTag, newTag) {
  const response = await fetch(PLAYER_RENAME_SYNC_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      oldTag,
      newTag,
      newDisplay: newTag,
    }),
  });
  if (!response.ok) {
    throw new Error(`Supabase player sync failed: ${response.status}`);
  }
  const payload = await response.json();
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid Supabase player sync response.");
  }
  if (payload.ok === false) {
    throw new Error(payload.message || "Unable to sync player rename to Supabase.");
  }
  return payload;
}

async function submitLineupToSheet(team, lineup, captain) {
  const response = await fetch(TRADE_BLOCKS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "submitLineup",
      team,
      lineup,
      captain,
      submittedAt: new Date().toISOString(),
    }),
  });
  if (!response.ok) {
    throw new Error(`Lineup submit failed: ${response.status}`);
  }
  const payload = await response.json();
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid lineup submit response.");
  }
  if (payload.ok === false) {
    throw new Error(payload.message || "Unable to submit lineup.");
  }
  return payload;
}

function normalizePowerVoteMap(value) {
  if (!value || typeof value !== "object") return {};
  const out = {};
  Object.entries(value).forEach(([team, vote]) => {
    if (!team || !vote || typeof vote !== "object") return;
    const rankings = Array.isArray(vote.rankings)
      ? vote.rankings.map((v) => String(v || "").trim()).filter(Boolean)
      : [];
    out[team] = { rankings, updatedAt: vote.updatedAt || "" };
  });
  return out;
}

function parsePowerVotesCsv(rows) {
  const nonEmpty = rows.filter((row) =>
    row.some((cell) => String(cell || "").trim() !== "")
  );
  if (!nonEmpty.length) return {};

  const header = (nonEmpty[0] || []).map((h) =>
    String(h || "").trim().toLowerCase()
  );
  const teamIdx = header.findIndex((h) => h === "team" || h.includes("team"));
  const updatedIdx = header.findIndex(
    (h) => h.includes("updated") || h.includes("submitted") || h.includes("time")
  );
  const rankIdxs = header
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => h.startsWith("rank") || h.includes("#"))
    .map(({ i }) => i)
    .slice(0, TEAM_ORDER.length);
  const hasHeader = teamIdx !== -1 || rankIdxs.length > 0;
  const body = hasHeader ? nonEmpty.slice(1) : nonEmpty;

  const out = {};
  body.forEach((row) => {
    const teamCell =
      teamIdx >= 0 ? String(row[teamIdx] || "").trim() : String(row[0] || "").trim();
    const team = TEAM_ORDER.find(
      (t) => normalizeName(displayTeamName(t)) === normalizeName(displayTeamName(teamCell))
    );
    if (!team) return;
    let rankings = [];
    if (rankIdxs.length) {
      rankings = rankIdxs.map((i) => String(row[i] || "").trim()).filter(Boolean);
    } else {
      rankings = row
        .slice(teamIdx >= 0 ? teamIdx + 1 : 1, (teamIdx >= 0 ? teamIdx + 1 : 1) + TEAM_ORDER.length)
        .map((v) => String(v || "").trim())
        .filter(Boolean);
    }
    const updatedAt =
      updatedIdx >= 0 ? String(row[updatedIdx] || "").trim() : String(row[row.length - 1] || "").trim();
    out[team] = { rankings, updatedAt };
  });
  return out;
}

async function fetchPowerVotesFromSheet() {
  const response = await fetch(POWER_RANKINGS_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Power rankings fetch failed: ${response.status}`);
  }
  const rows = parseCSV(await response.text());
  return normalizePowerVoteMap(parsePowerVotesCsv(rows));
}

async function savePowerVoteToSheet(team, vote) {
  const rankings = Array.isArray(vote.rankings) ? vote.rankings : [];
  const payload = {
    action: "savePowerRankings",
    team,
    teamName: team,
    reporterHandle: String(vote.reporterHandle || "").trim(),
    rankings,
    rankingsCsv: rankings.join(", "),
    updatedAt: vote.updatedAt || new Date().toISOString(),
  };
  rankings.forEach((value, idx) => {
    payload[`rank${idx + 1}`] = value;
  });

  const response = await fetch(TRADE_BLOCKS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Power rankings save failed: ${response.status}`);
  }
  const raw = await response.text();
  let result = null;
  try {
    result = raw ? JSON.parse(raw) : {};
  } catch (_) {
    throw new Error(raw || "Invalid power rankings save response.");
  }
  if (!result || typeof result !== "object") {
    throw new Error("Invalid power rankings save response.");
  }
  if (result.ok === false) {
    throw new Error(result.message || "Power rankings save failed.");
  }
  return true;
}

function getTeamPlayers(team) {
  return rosterByTeam.get(team) || rosterByTeam.get(canonicalTeamKey(team)) || [];
}

function getAllPlayersForFreeAgency() {
  const seen = new Set();
  const players = [];
  TEAM_ORDER.forEach((team) => {
    getTeamPlayers(team).forEach((player) => {
      const key = normalizeName(player);
      if (!key || seen.has(key)) return;
      seen.add(key);
      players.push({ team, player });
    });
  });
  return players;
}

function getTeamPicks(team) {
  return picksByTeam.get(team) || [];
}

function renderTradePlayersList(team, selectedPlayers) {
  if (!team) {
    els.tradePlayerList.innerHTML = '<div class="gm-empty">Select a team.</div>';
    return;
  }
  const players = getTeamPlayers(team);
  if (!players.length) {
    els.tradePlayerList.innerHTML = '<div class="gm-empty">No players found.</div>';
    return;
  }

  const selectedSet = new Set((selectedPlayers || []).map(normalizeName));
  els.tradePlayerList.innerHTML = players
    .map((player) => {
      const checked = selectedSet.has(normalizeName(player)) ? "checked" : "";
      return `
        <label class="gm-check">
          <input type="checkbox" value="${escapeHtml(player)}" ${checked} />
          <span>${escapeHtml(player)}</span>
        </label>
      `;
    })
    .join("");
}

function renderTradePicksList(team, selectedPicks) {
  if (!team) {
    els.tradePicksList.innerHTML = '<div class="gm-empty">Select a team.</div>';
    return;
  }
  const picks = getTeamPicks(team);
  if (!picks.length) {
    els.tradePicksList.innerHTML = '<div class="gm-empty">No picks found.</div>';
    return;
  }
  const selectedSet = new Set((selectedPicks || []).map(normalizeName));
  els.tradePicksList.innerHTML = picks
    .map((pick) => {
      const checked = selectedSet.has(normalizeName(pick)) ? "checked" : "";
      return `
        <label class="gm-check">
          <input type="checkbox" value="${escapeHtml(pick)}" ${checked} />
          <span>${escapeHtml(pick)}</span>
        </label>
      `;
    })
    .join("");
}

function renderRenamePlayers(team) {
  if (!els.renamePlayerSelect) return;
  if (!team) {
    els.renamePlayerSelect.innerHTML =
      '<option value="">Select a player</option>';
    return;
  }
  const players = getTeamPlayers(team);
  if (!players.length) {
    els.renamePlayerSelect.innerHTML =
      '<option value="">No players found</option>';
    return;
  }
  els.renamePlayerSelect.innerHTML = [
    '<option value="">Select a player</option>',
    ...players.map(
      (player) =>
        `<option value="${escapeHtml(player)}">${escapeHtml(player)}</option>`
    ),
  ].join("");
}

function renderLineupPlayers(team) {
  if (!els.lineupPlayerList) return;
  if (!team) {
    els.lineupPlayerList.innerHTML = '<div class="gm-empty">Select a team.</div>';
    return;
  }
  const players = getTeamPlayers(team);
  if (!players.length) {
    els.lineupPlayerList.innerHTML = '<div class="gm-empty">No players found.</div>';
    return;
  }
  els.lineupPlayerList.innerHTML = players
    .map(
      (player, idx) => `
        <label class="gm-check">
          <input type="checkbox" data-lineup-player value="${escapeHtml(player)}" />
          <span>${escapeHtml(player)}</span>
          <input type="radio" name="lineup-captain" value="${escapeHtml(player)}" />
          <span>Captain</span>
        </label>
      `
    )
    .join("");
}

function renderOtherTradeBlocks(selectedTeam) {
  const blocks = tradeBlocksCache;
  const teams = TEAM_ORDER.filter((team) => team !== selectedTeam);

  if (!teams.length) {
    els.tradeViewList.innerHTML = '<div class="gm-empty">No other teams.</div>';
    return;
  }

  els.tradeViewList.innerHTML = teams
    .map((team) => {
      const block = blocks[team];
      if (!block) {
        return `
          <div class="gm-readonly-card">
            <div class="gm-readonly-title">${escapeHtml(displayTeamName(team))}</div>
            <div class="gm-empty">No trade block available.</div>
          </div>
        `;
      }

      const players = Array.isArray(block.players) ? block.players : [];
      const picks = Array.isArray(block.picks) ? block.picks : [];
      const notes = String(block.notes || "").trim();
      const updatedAt = block.updatedAt ? new Date(block.updatedAt).toLocaleString() : "";

      return `
        <div class="gm-readonly-card">
          <div class="gm-readonly-title">${escapeHtml(displayTeamName(team))}</div>
          <div class="gm-readonly-group">
            <div class="label">Players</div>
            <div>${players.length ? players.map(escapeHtml).join(", ") : "No trade block available."}</div>
          </div>
          <div class="gm-readonly-group">
            <div class="label">Notes</div>
            <div>${notes ? escapeHtml(notes) : "No trade block available."}</div>
          </div>
          <div class="gm-readonly-group">
            <div class="label">Picks</div>
            <div>${picks.length ? picks.map(escapeHtml).join(", ") : "No trade block available."}</div>
          </div>
          <div class="gm-readonly-group">
            <div class="label">Updated</div>
            <div>${updatedAt || "—"}</div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderSelectedTeam(team) {
  els.teamLabel.textContent = team ? displayTeamName(team) : "—";

  const blocks = tradeBlocksCache;
  const block = team ? blocks[team] || {} : {};
  const selectedPlayers = Array.isArray(block.players) ? block.players : [];
  const selectedPicks = Array.isArray(block.picks) ? block.picks : [];

  renderTradePlayersList(team, selectedPlayers);
  renderTradePicksList(team, selectedPicks);
  els.tradeNotes.value = block.notes || "";
  if (els.tradeCode) {
    els.tradeCode.value = "";
  }
  renderOtherTradeBlocks(team);
  setTradeStatus("");
}

function renderRenameTeam(team) {
  renderRenamePlayers(team);
  if (els.renameCode) {
    els.renameCode.value = "";
  }
  if (els.renameNewName) {
    els.renameNewName.value = "";
  }
  setRenameStatus("");
}

function renderLineupTeam(team) {
  renderLineupGameCards(team);
  renderLineupPlayers(team);
  updateLineupTabMeta(team);
  if (els.lineupCode) {
    els.lineupCode.value = "";
  }
  setLineupStatus("");
}

function loadFreeAgencySelection() {
  const raw = safeJsonParse(localStorage.getItem(GM_FREE_AGENCY_KEY), []);
  freeAgencySelection = Array.isArray(raw)
    ? raw.map((player) => String(player || "").trim()).filter(Boolean)
    : [];
  if (els.freeAgencyVoterHandle) {
    els.freeAgencyVoterHandle.value = String(
      localStorage.getItem(GM_FREE_AGENCY_VOTER_KEY) || ""
    ).trim();
  }
}

function setFreeAgencySelection(selection) {
  freeAgencySelection = Array.isArray(selection)
    ? selection.map((player) => String(player || "").trim()).filter(Boolean)
    : [];
  localStorage.setItem(GM_FREE_AGENCY_KEY, JSON.stringify(freeAgencySelection));
}

function setFreeAgencyVoterHandle(value) {
  const handle = String(value || "").trim();
  if (els.freeAgencyVoterHandle) {
    els.freeAgencyVoterHandle.value = handle;
  }
  if (handle) {
    localStorage.setItem(GM_FREE_AGENCY_VOTER_KEY, handle);
  } else {
    localStorage.removeItem(GM_FREE_AGENCY_VOTER_KEY);
  }
}

function renderFreeAgencySelection() {
  if (!els.freeAgencyPlayerList) return;
  if (els.freeAgencyCount) {
    els.freeAgencyCount.textContent = `${freeAgencySelection.length} / 6`;
  }
  const players = getAllPlayersForFreeAgency();
  if (!players.length) {
    els.freeAgencyPlayerList.innerHTML = '<div class="gm-empty">No players found.</div>';
    return;
  }
  const selectedSet = new Set(freeAgencySelection.map(normalizeName));
  els.freeAgencyPlayerList.innerHTML = players
    .map(({ player, team: playerTeam }) => {
      const checked = selectedSet.has(normalizeName(player)) ? "checked" : "";
      return `
        <label class="gm-check">
          <input type="checkbox" data-free-agency-player value="${escapeHtml(player)}" ${checked} />
          <span>
            <strong>${escapeHtml(player)}</strong>
            <small class="gm-check-sub">${escapeHtml(displayTeamName(playerTeam))}</small>
          </span>
          <span class="gm-check-pill">All Star</span>
        </label>
      `;
    })
    .join("");
}

function normalizeAllStarVoteRow(row) {
  const votes = Array.isArray(row?.votes)
    ? row.votes
        .map((v) => {
          if (!v || typeof v !== "object") {
            const text = String(v || "").trim();
            return text ? { player: text, handle: "" } : null;
          }
          const player = String(v.player || v.name || "").trim();
          const handle = String(v.handle || v.at || "").trim();
          return player ? { player, handle } : null;
        })
        .filter(Boolean)
    : Array.isArray(row?.players)
    ? row.players
        .map((v) => String(v || "").trim())
        .filter(Boolean)
        .map((player) => ({ player, handle: "" }))
    : String(row?.votes_csv || row?.vote || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
        .map((player) => ({ player, handle: "" }));
  return {
    voterHandle: String(row?.voter_handle || row?.submitter_handle || "").trim(),
    votes,
    updatedAt: String(row?.updated_at || row?.updatedAt || "").trim(),
  };
}

async function fetchFreeAgencySelectionFromSupabase() {
  requireSupabaseConfig();
  if (!gmSession?.access_token || !gmSession?.user?.id) {
    return [];
  }
  const query =
    `?select=voter_handle,votes,updated_at` +
    `&voter_handle=eq.${encodeURIComponent(voterHandle.startsWith("@") ? voterHandle : `@${voterHandle}`)}` +
    `&limit=1`;
  const response = await fetch(`${supabaseUrl}/rest/v1/${GM_ALL_STAR_VOTES_TABLE}${query}`, {
    headers: await authHeadersFresh(),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`All Star ballot fetch failed: ${response.status}`);
  }
  const payload = await response.json();
  if (!Array.isArray(payload) || !payload.length) return [];
  return normalizeAllStarVoteRow(payload[0]).votes;
}

async function saveFreeAgencySelectionToSupabase(selection) {
  requireSupabaseConfig();
  if (!gmSession?.access_token || !gmSession?.user?.id) {
    throw new Error("Sign in with a GM account first.");
  }
  const votes = Array.isArray(selection)
    ? selection.map((player) => String(player || "").trim()).filter(Boolean)
    : [];
  if (!votes.length) {
    throw new Error("Select at least one player.");
  }
  if (votes.length > 6) {
    throw new Error("Pick up to 6 players only.");
  }
  const voterHandle = String(els.freeAgencyVoterHandle?.value || "").trim();
  if (!voterHandle) {
    throw new Error("Enter your real @handle.");
  }
  setFreeAgencyVoterHandle(voterHandle);
  const payload = {
    voter_handle: voterHandle.startsWith("@") ? voterHandle : `@${voterHandle}`,
    votes,
    updated_at: new Date().toISOString(),
  };
  const response = await fetch(
    `${supabaseUrl}/rest/v1/${GM_ALL_STAR_VOTES_TABLE}?on_conflict=voter_handle`,
    {
      method: "POST",
      headers: {
        ...(await authHeadersFresh()),
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify([payload]),
    }
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `All Star ballot save failed: ${response.status}${detail ? ` - ${detail}` : ""}`
    );
  }
  const result = await response.json();
  if (!Array.isArray(result)) {
    throw new Error("Invalid All Star ballot save response.");
  }
  return normalizeAllStarVoteRow(result[0]).votes;
}

async function fetchAllStarResultsFromSupabase() {
  requireSupabaseConfig();
  if (!isSignedInGm() || !isCommish()) {
    freeAgencyResults = [];
    return [];
  }
  const response = await fetch(
    `${supabaseUrl}/rest/v1/${GM_ALL_STAR_VOTES_TABLE}?select=voter_handle,votes,updated_at&order=updated_at.desc`,
    {
      headers: await authHeadersFresh(),
      cache: "no-store",
    }
  );
  if (!response.ok) {
    throw new Error(`All Star results fetch failed: ${response.status}`);
  }
  const payload = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("Invalid All Star results response.");
  }
  freeAgencyResults = payload.map(normalizeAllStarVoteRow);
  return freeAgencyResults;
}

function updateLineupTabMeta(team) {
  if (!els.lineupTabMeta) return;
  const selectedTeam = String(team || "").trim() || getAuthorizedTeam();
  if (!selectedTeam) {
    els.lineupTabMeta.textContent = "Due —";
    return;
  }
  const matchups = getTeamUpcomingMatchups(selectedTeam);
  if (!matchups.length) {
    els.lineupTabMeta.textContent = "Due —";
    return;
  }
  const first = matchups[0];
  const lockAt = getLockDateTimeForDay(first.dateText);
  if (!lockAt) {
    els.lineupTabMeta.textContent = "Due —";
    return;
  }
  els.lineupTabMeta.textContent = `Due ${lockAt.toLocaleString([], {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  })} ET`;
}

async function handleSignOut() {
  await signOutAuth();
  gmSession = null;
  gmAssignment = null;
  clearAuthState();
  applyAuthUi();
  setAuthStatus("Signed out.");
}

function getTimeZoneOffsetMs(date, timeZone) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf
    .formatToParts(date)
    .reduce((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});
  const asUtc = Date.UTC(
    Number(parts.year || 0),
    Number(parts.month || 1) - 1,
    Number(parts.day || 1),
    Number(parts.hour || 0),
    Number(parts.minute || 0),
    Number(parts.second || 0),
    0
  );
  return asUtc - date.getTime();
}

function parseEasternDateTimeMs(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  const zoned = Date.parse(text);
  if (/z$|[+-]\d{2}:\d{2}$/i.test(text) && Number.isFinite(zoned)) {
    return zoned;
  }
  const m = text.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?)?$/
  );
  if (!m) return Number.isFinite(zoned) ? zoned : null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const hour = Number(m[4] || 0);
  const minute = Number(m[5] || 0);
  const second = Number(m[6] || 0);
  const baseUtc = Date.UTC(year, month, day, hour, minute, second, 0);
  let guess = baseUtc;
  for (let i = 0; i < 2; i += 1) {
    const offset = getTimeZoneOffsetMs(new Date(guess), "America/New_York");
    guess = baseUtc - offset;
  }
  return guess;
}

function getLockDateTimeForDay(dateText) {
  const dateKey = normalizeScheduleDateKey(dateText);
  const custom = String(localGameLocksByDate?.[dateKey] || "").trim();
  if (custom) {
    const customMs = parseEasternDateTimeMs(custom);
    if (Number.isFinite(customMs)) return new Date(customMs);
  }
  const day = parseScheduleDateValue(dateKey);
  if (!day) return null;
  const y = day.getFullYear();
  const mo = day.getMonth() + 1;
  const d = day.getDate();
  const defaultLockText = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}T18:55:00`;
  const defaultMs = parseEasternDateTimeMs(defaultLockText);
  if (Number.isFinite(defaultMs)) return new Date(defaultMs);
  return day;
}

function isLineupLockedForTeam(team) {
  const matchups = getTeamUpcomingMatchups(team);
  if (!matchups.length) return false;
  const first = matchups[0];
  const lockAt = getLockDateTimeForDay(first.dateText);
  if (!lockAt) return false;
  return Date.now() >= lockAt.getTime();
}

function formatDeadlineText(dateText) {
  const lockAt = getLockDateTimeForDay(dateText);
  if (!lockAt) return "Deadline: —";
  return `Deadline: ${lockAt.toLocaleString([], {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  })} ET`;
}

function toEasternInputValue(dateLike) {
  const dt =
    dateLike instanceof Date
      ? dateLike
      : new Date(
          Number.isFinite(parseEasternDateTimeMs(dateLike))
            ? parseEasternDateTimeMs(dateLike)
            : dateLike
        );
  if (Number.isNaN(dt.getTime())) return "";
  const fmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return fmt.format(dt).replace(" ", "T");
}

function getTeamUpcomingMatchups(team) {
  const selectedTeam = String(team || "").trim();
  if (!selectedTeam || !commishUpcomingGames.length) return [];
  const matchups = [];
  commishUpcomingGames.forEach((day) => {
    (day.games || []).forEach((game) => {
      const t1 = String(game.team1 || "").trim();
      const t2 = String(game.team2 || "").trim();
      if (!t1 || !t2) return;
      if (!sameTeam(t1, selectedTeam) && !sameTeam(t2, selectedTeam)) return;
      const opponent = sameTeam(t1, selectedTeam) ? t2 : t1;
      matchups.push({
        dateText: day.dateText || "",
        gameType: game.gameType || day.gameType || "",
        opponent,
      });
    });
  });
  return matchups;
}

function renderLineupGameCards(team) {
  if (!els.lineupGameCards) return;
  const selectedTeam = String(team || "").trim();
  if (!selectedTeam) {
    els.lineupGameCards.innerHTML =
      '<div class="gm-empty">Select a team to view upcoming lineup cards.</div>';
    return;
  }
  const matchups = getTeamUpcomingMatchups(selectedTeam);
  if (!matchups.length) {
    els.lineupGameCards.innerHTML =
      '<div class="gm-empty">No upcoming games found for this team.</div>';
    return;
  }
  const submitted = lineupSubmittedByTeam.get(selectedTeam) === true;
  els.lineupGameCards.innerHTML = matchups
    .slice(0, 4)
    .map((item, idx) => {
      const dateText = item.dateText || "—";
      const lockAt = getLockDateTimeForDay(dateText);
      const isLocked = !!lockAt && Date.now() >= lockAt.getTime();
      const canEdit = idx === 0 && !isLocked;
      const isSubmitted = idx === 0 && submitted;
      const statusClass = isSubmitted ? " submitted" : isLocked ? " locked" : "";
      const statusText = isSubmitted
        ? "Lineup Submitted"
        : isLocked
        ? "Locked"
        : formatDeadlineText(dateText);
      const buttonText = canEdit ? "Edit Lineup" : isLocked ? "Locked" : "Awaiting Deadline";
      return `
        <article class="gm-lineup-game-card${canEdit ? " active" : ""}">
          <div class="gm-lineup-game-title">vs ${escapeHtml(displayTeamName(item.opponent))} Date: ${escapeHtml(dateText)}</div>
          <div class="gm-lineup-game-status${statusClass}">${escapeHtml(statusText)}</div>
          <button
            class="gm-lineup-game-btn${canEdit ? "" : " disabled"}"
            type="button"
            ${canEdit ? 'data-lineup-edit="true"' : "disabled"}
          >${escapeHtml(buttonText)}</button>
        </article>
      `;
    })
    .join("");
}

function parseScheduleDateValue(value) {
  const str = String(value || "").trim();
  if (!str) return null;
  const md = str.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (md) {
    const now = new Date();
    return new Date(now.getFullYear(), Number(md[1]) - 1, Number(md[2]), 0, 0, 0, 0);
  }
  const dt = new Date(str);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function normalizeScheduleDateKey(value) {
  const parsed = parseScheduleDateValue(value);
  if (!parsed) {
    return String(value || "").trim();
  }
  return `${parsed.getMonth() + 1}/${parsed.getDate()}`;
}

async function loadUpcomingScheduleGames() {
  const response = await fetch(SCHEDULE_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Schedule fetch failed: ${response.status}`);
  }
  const rows = parseCSV(await response.text()).filter((row) =>
    row.some((cell) => String(cell || "").trim() !== "")
  );
  if (!rows.length) return [];

  const header = rows[0].map((h) => String(h || "").trim().toLowerCase());
  const body = rows.slice(1);
  const dateIdx = header.findIndex((h) => h === "date");
  const t1Idx = header.findIndex((h) => h === "team 1" || h === "away");
  const t2Idx = header.findIndex((h) => h === "team 2" || h === "home");
  const statusIdx = header.findIndex((h) => h === "status");
  const typeIdx = header.findIndex((h) => h === "type" || h === "game type");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const games = body
    .map((row) => {
      const dateText = normalizeScheduleDateKey(
        row[dateIdx >= 0 ? dateIdx : 0] || ""
      );
      const team1 = String(row[t1Idx >= 0 ? t1Idx : 1] || "").trim();
      const team2 = String(row[t2Idx >= 0 ? t2Idx : 2] || "").trim();
      const status = String(row[statusIdx] || "").trim();
      const gameType = String(row[typeIdx] || "").trim();
      const when = parseScheduleDateValue(dateText);
      if (!team1 || !team2 || !when) return null;
      const done = /(final|complete|completed)/i.test(status);
      if (done) return null;
      return { dateText, team1, team2, status, gameType, when, lockAt: "" };
    })
    .filter(Boolean)
    .sort((a, b) => a.when - b.when)
    .filter((g) => g.when >= today);

  const byDate = new Map();
  games.forEach((game) => {
    const key = game.dateText;
    if (!byDate.has(key)) {
      byDate.set(key, {
        dateText: game.dateText,
        when: game.when,
        gameCount: 0,
        gameType: game.gameType || "",
        games: [],
        lockAt: "",
      });
    }
    const day = byDate.get(key);
    day.gameCount += 1;
    if (!day.gameType && game.gameType) {
      day.gameType = game.gameType;
    }
    day.games.push({
      team1: game.team1,
      team2: game.team2,
      gameType: game.gameType || "",
    });
  });

  return Array.from(byDate.values())
    .sort((a, b) => a.when - b.when)
    .slice(0, 3)
    .map((day) => ({
      ...day,
      lockAt: String(localGameLocksByDate?.[day.dateText] || "").trim(),
    }));
}

async function loadScheduleGamesForArticles() {
  const response = await fetch(SCHEDULE_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Schedule fetch failed: ${response.status}`);
  }
  const rows = parseCSV(await response.text()).filter((row) =>
    row.some((cell) => String(cell || "").trim() !== "")
  );
  if (!rows.length) return [];

  const header = rows[0].map((h) => String(h || "").trim().toLowerCase());
  const body = rows.slice(1);
  const dateIdx = header.findIndex((h) => h === "date");
  const t1Idx = header.findIndex((h) => h === "team 1" || h === "away");
  const t2Idx = header.findIndex((h) => h === "team 2" || h === "home");
  const statusIdx = header.findIndex((h) => h === "status");
  const typeIdx = header.findIndex((h) => h === "type" || h === "game type");

  return body
    .map((row) => {
      const dateText = normalizeScheduleDateKey(row[dateIdx >= 0 ? dateIdx : 0] || "");
      const team1 = displayTeamName(String(row[t1Idx >= 0 ? t1Idx : 1] || "").trim());
      const team2 = displayTeamName(String(row[t2Idx >= 0 ? t2Idx : 2] || "").trim());
      const status = String(row[statusIdx] || "").trim();
      const gameType = String(row[typeIdx] || "").trim();
      const when = parseScheduleDateValue(dateText);
      if (!team1 || !team2 || !dateText) return null;
      return {
        dateText,
        team1,
        team2,
        status,
        gameType,
        when,
        gameKey: buildGameKey(dateText, team1, team2),
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const aTime = a.when ? a.when.getTime() : 0;
      const bTime = b.when ? b.when.getTime() : 0;
      return bTime - aTime;
    });
}

function renderArticleGameOptions() {
  if (!els.articleGame) return;
  const selected = els.articleGame.value;
  els.articleGame.innerHTML = [
    '<option value="">Select game</option>',
    ...commishArticleGames.map((game) => {
      const label = `${game.dateText} • ${game.team1} vs ${game.team2}`;
      return `<option value="${escapeHtml(game.gameKey)}">${escapeHtml(label)}</option>`;
    }),
  ].join("");
  if (selected && commishArticleGames.some((game) => game.gameKey === selected)) {
    els.articleGame.value = selected;
  }
}

function syncArticleWriterMode() {
  const type = String(els.articleType?.value || "article").trim();
  const needsGame = type === "game_preview" || type === "game_summary";
  if (els.articleGameGroup) {
    els.articleGameGroup.hidden = !needsGame;
  }
  if (els.articleTitle) {
    els.articleTitle.placeholder =
      type === "game_preview"
        ? "Game preview headline"
        : type === "game_summary"
        ? "Game summary headline"
        : "Article headline";
  }
  if (els.articleBody) {
    els.articleBody.placeholder =
      type === "game_preview"
        ? "Write the game preview here"
        : type === "game_summary"
        ? "Write the game summary here"
        : "Write the article here";
  }
}

function renderCommishLockGames() {
  if (!els.lockGamesList) return;
  if (!commishUpcomingGames.length) {
    els.lockGamesList.innerHTML = '<div class="gm-empty">No upcoming game days found.</div>';
    return;
  }
  els.lockGamesList.innerHTML = commishUpcomingGames
    .map((day, idx) => {
      const preview = day.games
        .slice(0, 2)
        .map((g) => `${displayTeamName(g.team1)} vs ${displayTeamName(g.team2)}`)
        .join(" • ");
      const extra = day.gameCount > 2 ? ` (+${day.gameCount - 2} more)` : "";
      return `
        <div class="gm-readonly-card">
          <div class="gm-readonly-title">Game Day ${idx + 1}: ${escapeHtml(day.dateText)} • ${day.gameCount} game${day.gameCount === 1 ? "" : "s"}</div>
          <div>${escapeHtml(preview + extra)}</div>
          <div class="gm-readonly-group">
            <div class="label">Lock Date/Time (ET)</div>
            <input class="text-input" type="datetime-local" data-lock-index="${idx}" value="${escapeHtml(toEasternInputValue(day.lockAt || ""))}" />
          </div>
        </div>
      `
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

function renderArticleList(articles) {
  if (!els.articleList) return;
  if (!articles.length) {
    els.articleList.innerHTML = '<div class="gm-empty">No published articles yet.</div>';
    return;
  }
  els.articleList.innerHTML = articles
    .slice(0, 5)
    .map((article) => {
      const title = String(article?.title || "Untitled Article").trim();
      const summary = String(article?.summary || article?.body || "").replace(/\s+/g, " ").trim();
      return `
        <div class="gm-readonly-card">
          <div class="gm-readonly-title">${escapeHtml(title)}</div>
          <div>${escapeHtml(formatArticleDate(article?.created_at || article?.updated_at))}</div>
          <div>${escapeHtml(summary.length > 140 ? `${summary.slice(0, 137)}...` : summary)}</div>
        </div>
      `;
    })
    .join("");
}

function setRoleStatus(message, isError = false) {
  if (!els.roleStatus) return;
  els.roleStatus.textContent = message;
  els.roleStatus.className = `gm-status ${isError ? "error" : ""}`;
}

function renderGmAssignments(assignments) {
  if (!els.roleList) return;
  if (!assignments.length) {
    els.roleList.innerHTML = '<div class="gm-empty">No user roles found.</div>';
    return;
  }
  els.roleList.innerHTML = assignments
    .map((assignment) => {
      const role = String(assignment?.role || "gm").trim() || "gm";
      const team = displayTeamName(assignment?.team || "") || "No team";
      const userId = String(assignment?.user_id || "").trim();
      return `
        <button class="gm-readonly-card gm-role-card" type="button" data-role-user-id="${escapeHtml(userId)}" data-role="${escapeHtml(role)}" data-role-team="${escapeHtml(assignment?.team || "")}">
          <div class="gm-readonly-title">${escapeHtml(role.toUpperCase())} • ${escapeHtml(team)}</div>
          <div>${escapeHtml(userId)}</div>
        </button>
      `;
    })
    .join("");
}

async function loadGmAssignmentsForCommish() {
  if (!els.roleList || !isCommish()) return;
  try {
    const response = await fetch(GM_ASSIGNMENTS_API, {
      headers: await authHeadersFresh(),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.message || `Request failed (${response.status})`);
    }
    gmAssignmentsCache = Array.isArray(payload?.assignments) ? payload.assignments : [];
    renderGmAssignments(gmAssignmentsCache);
  } catch (error) {
    els.roleList.innerHTML = `<div class="gm-empty">${escapeHtml(error.message || "Unable to load user roles.")}</div>`;
  }
}

async function saveGmAssignmentRole() {
  if (!isSignedInGm() || !isCommish()) {
    setRoleStatus("Commissioner access required.", true);
    return;
  }
  const userId = String(els.roleUserId?.value || "").trim();
  const role = String(els.roleSelect?.value || "gm").trim();
  const team = String(els.roleTeam?.value || "").trim();
  if (!userId) {
    setRoleStatus("Enter the Supabase user ID.", true);
    return;
  }
  if (role === "gm" && !team) {
    setRoleStatus("Select a team for GM role, or choose Reporter.", true);
    return;
  }
  if (els.roleSave) {
    els.roleSave.disabled = true;
    els.roleSave.textContent = "Saving...";
  }
  try {
    const response = await fetch(GM_ASSIGNMENTS_API, {
      method: "POST",
      headers: await authHeadersFresh(),
      body: JSON.stringify({ user_id: userId, role, team }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.message || `Request failed (${response.status})`);
    }
    gmAssignmentsCache = Array.isArray(payload?.assignments) ? payload.assignments : [];
    renderGmAssignments(gmAssignmentsCache);
    setRoleStatus("User role saved.");
  } catch (error) {
    setRoleStatus(error.message || "Unable to save user role.", true);
  } finally {
    if (els.roleSave) {
      els.roleSave.disabled = false;
      els.roleSave.textContent = "Save User Role";
    }
  }
}

async function loadArticlesForWriter() {
  if (!els.articleList || !canWriteArticles()) return;
  try {
    const response = await fetch(NEWS_ARTICLES_API, { cache: "no-store" });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    const payload = await response.json();
    renderArticleList(Array.isArray(payload?.articles) ? payload.articles : []);
  } catch (error) {
    els.articleList.innerHTML = `<div class="gm-empty">${escapeHtml(error.message || "Unable to load articles.")}</div>`;
  }
}

async function publishArticle() {
  if (!isSignedInGm() || !canWriteArticles()) {
    setArticleStatus("Reporter access required.", true);
    return;
  }
  const title = String(els.articleTitle?.value || "").trim();
  const summary = String(els.articleSummary?.value || "").trim();
  const body = String(els.articleBody?.value || "").trim();
  const author = String(els.articleAuthor?.value || gmSession?.user?.email || "").trim();
  const contentType = String(els.articleType?.value || "article").trim();
  const selectedGame = commishArticleGames.find((game) => game.gameKey === String(els.articleGame?.value || ""));
  if (!title || !body) {
    setArticleStatus("Add a headline and text.", true);
    return;
  }
  if ((contentType === "game_preview" || contentType === "game_summary") && !selectedGame) {
    setArticleStatus("Select a game for this post.", true);
    return;
  }

  if (els.articlePublish) {
    els.articlePublish.disabled = true;
    els.articlePublish.textContent = "Publishing...";
  }
  setArticleStatus("Publishing article...");
  try {
    const response = await fetch(NEWS_ARTICLES_API, {
      method: "POST",
      headers: {
        ...(await authHeadersFresh()),
      },
      body: JSON.stringify({
        title,
        summary,
        body,
        author,
        content_type: contentType,
        game_key: selectedGame?.gameKey || "",
        season: localStorage.getItem("season") || "c2s3-regular",
        date_token: selectedGame?.dateText || "",
        team1: selectedGame?.team1 || "",
        team2: selectedGame?.team2 || "",
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.message || `Request failed (${response.status})`);
    }
    if (els.articleTitle) els.articleTitle.value = "";
    if (els.articleSummary) els.articleSummary.value = "";
    if (els.articleBody) els.articleBody.value = "";
    setArticleStatus("Published.");
    renderArticleList(Array.isArray(payload?.articles) ? payload.articles : []);
  } catch (error) {
    setArticleStatus(error.message || "Unable to publish article.", true);
  } finally {
    if (els.articlePublish) {
      els.articlePublish.disabled = false;
      els.articlePublish.textContent = "Publish";
    }
  }
}

function renderPowerRankingsTeam(team) {
  if (!els.powerRankingsList) return;
  if (els.powerReporterGroup) {
    els.powerReporterGroup.hidden = team !== POWER_REPORTER_VALUE;
  }
  if (els.powerReporterHandle && team === POWER_REPORTER_VALUE && !els.powerReporterHandle.value) {
    els.powerReporterHandle.value = localStorage.getItem(GM_POWER_REPORTER_HANDLE_KEY) || "";
  }
  if (!team) {
    els.powerRankingsList.innerHTML = '<div class="gm-empty">Select a team.</div>';
    return;
  }
  const saved = team === POWER_REPORTER_VALUE ? null : powerVotesCache[team];
  const pick = (index) =>
    saved && Array.isArray(saved.rankings) && saved.rankings[index]
      ? saved.rankings[index]
      : "";

  const options = TEAM_ORDER.map((teamKey) => ({
    key: teamKey,
    label: displayTeamName(teamKey),
  }));

  els.powerRankingsList.innerHTML = Array.from({ length: TEAM_ORDER.length }, (_, idx) => {
    const rank = idx + 1;
    const selected = pick(idx);
    const opts = [
      '<option value="">Select team</option>',
      ...options.map(
        (opt) =>
          `<option value="${escapeHtml(opt.key)}" ${
            opt.key === selected ? "selected" : ""
          }>${escapeHtml(opt.label)}</option>`
      ),
    ].join("");
    return `
      <div class="gm-rank-row">
        <div class="gm-rank-label">#${rank}</div>
        <select class="text-input" data-power-rank="${rank}">${opts}</select>
      </div>
    `;
  }).join("");
  if (els.powerCode) {
    els.powerCode.value = "";
  }
  setPowerStatus("");
  syncPowerRankingOptions();
}

function renderPowerVotesView() {
  if (!els.powerVotesView) return;
  const selectedTeam = els.powerTeamSelect ? els.powerTeamSelect.value : "";
  if (!selectedTeam) {
    els.powerVotesView.innerHTML = '<div class="gm-empty">Select a team to view your ballot.</div>';
    return;
  }
  if (selectedTeam === POWER_REPORTER_VALUE) {
    els.powerVotesView.innerHTML = '<div class="gm-empty">Reporter ballots are saved as new responses every time.</div>';
    return;
  }
  const vote = powerVotesCache[selectedTeam] || {};
  const rankings = Array.isArray(vote.rankings) ? vote.rankings : [];
  const updatedAt = vote.updatedAt ? new Date(vote.updatedAt).toLocaleString() : "—";
  els.powerVotesView.innerHTML = `
    <div class="gm-readonly-card">
      <div class="gm-readonly-title">${escapeHtml(displayTeamName(selectedTeam))}</div>
      <div class="gm-readonly-group">
        <div class="label">Ballot</div>
        <div>${rankings.length ? rankings.map((t, i) => `#${i + 1} ${escapeHtml(displayTeamName(t))}`).join(" • ") : "No rankings submitted."}</div>
      </div>
      <div class="gm-readonly-group">
        <div class="label">Updated</div>
        <div>${escapeHtml(updatedAt)}</div>
      </div>
    </div>
  `;
}

function syncPowerRankingOptions() {
  if (!els.powerRankingsList) return;
  const selects = Array.from(
    els.powerRankingsList.querySelectorAll("select[data-power-rank]")
  );
  if (!selects.length) return;

  const chosen = new Set(
    selects.map((s) => String(s.value || "").trim()).filter(Boolean)
  );

  selects.forEach((select) => {
    const current = String(select.value || "").trim();
    Array.from(select.options).forEach((opt) => {
      const value = String(opt.value || "").trim();
      if (!value) {
        opt.disabled = false;
        return;
      }
      // Keep current selection enabled, disable teams already chosen elsewhere.
      opt.disabled = value !== current && chosen.has(value);
    });
  });
}

function randomizePowerRankings() {
  if (!els.powerRankingsList) return;
  const selects = Array.from(
    els.powerRankingsList.querySelectorAll("select[data-power-rank]")
  );
  if (!selects.length) return;

  const pool = [...TEAM_ORDER];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  selects.forEach((select, idx) => {
    select.value = pool[idx] || "";
  });
  syncPowerRankingOptions();
}

async function loadRoster() {
  const response = await fetch(GM_LINEUP_CSV_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status}`);
  }

  const rows = parseCSV(await response.text());
  const map = new Map();

  const cleanRosterCell = (value) => {
    const text = String(value || "").trim();
    if (!text) return "";
    const upper = text.toUpperCase();
    if (upper === "PLAYER" || upper === "TEAM" || upper === "INFO") return "";
    if (upper.startsWith("GM")) return "";
    return text;
  };

  Object.entries(TEAM_RANGES).forEach(([team, range]) => {
    const sliced = sliceRange(rows, range);
    const seen = new Set();
    const names = [];

    sliced.forEach((row) => {
      const left = cleanRosterCell(row[0]);
      const right = cleanRosterCell(row[1]);

      // Prefer tag-style values; fallback to whichever side has text.
      const candidates = [];
      if (left.startsWith("@")) candidates.push(left);
      if (right.startsWith("@")) candidates.push(right);
      if (!candidates.length && left) candidates.push(left);
      if (!candidates.length && right) candidates.push(right);

      candidates.forEach((name) => {
        const key = normalizeName(name);
        if (!key || seen.has(key)) return;
        seen.add(key);
        names.push(name);
      });
    });

    map.set(team, names);
  });

  rosterByTeam = map;
}

async function loadDraftCapital() {
  const response = await fetch(DRAFT_CAPITAL_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status}`);
  }
  const rows = parseCSV(await response.text());
  draftCapitalRowsCache = rows;
  const map = new Map();

  Object.entries(DRAFT_CAPITAL_COLUMNS).forEach(([team, colLetter]) => {
    const idx = colToIndex(colLetter);
    const picks = rows
      .map((row) => String((row && row[idx]) || "").trim())
      .filter((value) => {
        if (!value) {
          return false;
        }
        const lower = value.toLowerCase();
        const teamLower = team.toLowerCase();
        const shownLower = displayTeamName(team).toLowerCase();
        if (lower === teamLower || lower === shownLower) {
          return false;
        }
        if (lower === "draft capital" || lower === "picks") {
          return false;
        }
        return true;
      });
    map.set(team, picks);
  });

  picksByTeam = map;
}

async function loadDraftOrderData() {
  const response = await fetch(STANDINGS_DASHBOARD_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status}`);
  }
  draftOrderPicksCache = parseDraftStandingsRows(parseCSV(await response.text()));
}

async function loadSubmittedDraftPicks() {
  const response = await fetch(DRAFT_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status}`);
  }
  submittedDraftPicksCache = buildSubmittedDraftPickSet(parseCSV(await response.text()));
}

function bindEvents() {
  if (els.tabButtons && els.tabButtons.length) {
    els.tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setActiveTab(button.dataset.gmTab);
      });
    });
  }

  if (els.teamSelect) {
    els.teamSelect.addEventListener("change", () => {
      renderSelectedTeam(els.teamSelect.value);
    });
  }
  if (els.renameTeamSelect) {
    els.renameTeamSelect.addEventListener("change", () => {
      renderRenameTeam(els.renameTeamSelect.value);
    });
  }
  if (els.lineupTeamSelect) {
    els.lineupTeamSelect.addEventListener("change", () => {
      renderLineupTeam(els.lineupTeamSelect.value);
    });
  }
  if (els.powerTeamSelect) {
    els.powerTeamSelect.addEventListener("change", () => {
      renderPowerRankingsTeam(els.powerTeamSelect.value);
      renderPowerVotesView();
    });
  }
  if (els.powerRankingsList) {
    els.powerRankingsList.addEventListener("change", (event) => {
      if (!event.target || !event.target.matches("select[data-power-rank]")) {
        return;
      }
      syncPowerRankingOptions();
    });
  }
  if (els.powerRandomize) {
    els.powerRandomize.addEventListener("click", () => {
      randomizePowerRankings();
      setPowerStatus("Ballot randomized.");
    });
  }
  if (els.draftSeason) {
    els.draftSeason.addEventListener("change", () => {
      setDraftStatus("");
      syncDraftRoundOptions();
      renderDraftSheetPickOptions();
      renderDraftRunner();
    });
  }
  if (els.draftPickOption) {
    els.draftPickOption.addEventListener("change", () => {
      syncDraftModeFields();
      renderDraftRunner();
    });
  }
  if (els.draftSheetPick) {
    els.draftSheetPick.addEventListener("change", applySheetPickToDraftForm);
  }
  [els.draftRound, els.draftPick, els.draftTeam].filter(Boolean).forEach((node) => {
    node.addEventListener("input", renderDraftRunner);
    node.addEventListener("change", renderDraftRunner);
  });
  if (els.draftRound) {
    els.draftRound.addEventListener("change", renderDraftSheetPickOptions);
  }
  if (els.draftSave) {
    els.draftSave.addEventListener("click", handleDraftSaveClick);
  }
  document.addEventListener("click", handleDraftSaveClick);
  if (els.draftNext) {
    els.draftNext.addEventListener("click", () => {
      if (!isSignedInGm() || !isCommish()) {
        setDraftStatus("Commissioner access required.", true);
        return;
      }
      if (els.draftPick) {
        els.draftPick.value = String(findNextOpenDraftPick());
      }
      if (els.draftPlayer) {
        els.draftPlayer.value = "";
        els.draftPlayer.focus();
      }
      if (els.draftNote) {
        els.draftNote.value = "";
      }
      setDraftStatus("Advanced to the next open pick.");
    });
  }
  if (els.draftClear) {
    els.draftClear.addEventListener("click", () => {
      if (!isSignedInGm() || !isCommish()) {
        setDraftStatus("Commissioner access required.", true);
        return;
      }
      const season = getDraftRunnerSeason();
      testDraftPicks = testDraftPicks.filter((pick) => pick.season !== season);
      saveTestDraftPicks();
      renderDraftRunner();
      setDraftStatus(`${season.toUpperCase()} test draft cleared.`);
    });
  }
  if (els.draftBoard) {
    els.draftBoard.addEventListener("click", (event) => {
      const card = event.target.closest("[data-draft-pick-key]");
      if (!card || !isSignedInGm() || !isCommish()) return;
      const pick = testDraftPicks.find((entry) => getDraftPickKey(entry) === card.dataset.draftPickKey);
      if (!pick) return;
      fillDraftRunnerForm(pick);
      setDraftStatus(`Loaded Round ${pick.round}, Pick ${pick.pick} for editing.`);
    });
  }
  if (els.gmDraftPick) {
    els.gmDraftPick.addEventListener("click", (event) => {
      const undoButton = event.target.closest("[data-gm-draft-undo]");
      if (undoButton) {
        const card = undoButton.closest("[data-gm-draft-pick-card]");
        undoGmDraftPick(card);
        return;
      }
      const button = event.target.closest("[data-gm-draft-save]");
      if (!button) return;
      const card = button.closest("[data-gm-draft-pick-card]");
      saveGmDraftPick(card, button);
    });
  }
  if (els.lockSave) {
    els.lockSave.addEventListener("click", async () => {
      if (!isSignedInGm() || !isCommish()) {
        setLockStatus("Commissioner access required.", true);
        return;
      }
      const inputs = Array.from(document.querySelectorAll("input[data-lock-index]"));
      const locks = inputs
        .map((input) => {
          const idx = Number(input.dataset.lockIndex);
          const day = commishUpcomingGames[idx];
          const lockAt = String(input.value || "").trim();
          if (!day || !lockAt) return null;
          return {
            date: day.dateText,
            team1: "__ALL__",
            team2: "__ALL__",
            gameType: day.gameType || "",
            gameCount: day.gameCount || 0,
            lockAt,
          };
        })
        .filter(Boolean);
      if (!locks.length) {
        setLockStatus("Set at least one lock time.", true);
        return;
      }
      try {
        await saveGameLocksToSheet(locks);
        setLockStatus("Lock times saved.");
        updateLastUpdated();
      } catch (error) {
        setLockStatus(error.message || "Unable to save lock times.", true);
      }
    });
  }
  if (els.articlePublish) {
    els.articlePublish.addEventListener("click", publishArticle);
  }
  if (els.articleType) {
    els.articleType.addEventListener("change", syncArticleWriterMode);
  }
  if (els.roleSave) {
    els.roleSave.addEventListener("click", saveGmAssignmentRole);
  }
  if (els.roleList) {
    els.roleList.addEventListener("click", (event) => {
      const card = event.target.closest("[data-role-user-id]");
      if (!card) return;
      if (els.roleUserId) els.roleUserId.value = card.dataset.roleUserId || "";
      if (els.roleSelect) els.roleSelect.value = card.dataset.role || "gm";
      if (els.roleTeam) els.roleTeam.value = card.dataset.roleTeam || "";
      setRoleStatus("Loaded role for editing.");
    });
  }
  if (els.authSignUp) {
    els.authSignUp.addEventListener("click", async () => {
      const email = String(els.authEmail?.value || "").trim();
      const password = String(els.authPassword?.value || "");
      if (!email || !password) {
        setAuthStatus("Enter email and password.", true);
        return;
      }
      try {
        await signUpAuth(email, password);
        setAuthStatus("Account created. Confirm email, then sign in.");
      } catch (error) {
        const msg = getReadableAuthError(error, "signup");
        if (msg === "Email already registered. Use Sign In.") {
          try {
            const tokenData = await signInAuth(email, password);
            const user = await fetchAuthUser(tokenData.access_token);
            gmSession = {
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token || "",
              user,
            };
            gmAssignment = await fetchGmAssignment(user.id);
            if (!gmAssignment) gmAssignment = await fetchLegacyGmProfile(user.id);
            persistAuthState();
            try {
              await fetchGameLocksFromSheet();
            } catch (_) {
              // keep local fallback if the Supabase lock table is unavailable
            }
            applyAuthUi();
            setAuthStatus("Account exists. Signed in.");
            return;
          } catch (signInError) {
            setAuthStatus(getReadableAuthError(signInError, "signin"), true);
            return;
          }
        }
        setAuthStatus(msg, true);
      }
    });
  }
  if (els.authSignIn) {
    els.authSignIn.addEventListener("click", async () => {
      const email = String(els.authEmail?.value || "").trim();
      const password = String(els.authPassword?.value || "");
      if (!email || !password) {
        setAuthStatus("Enter email and password.", true);
        return;
      }
      try {
        const tokenData = await signInAuth(email, password);
        const user = await fetchAuthUser(tokenData.access_token);
        gmSession = {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || "",
          user,
        };
        gmAssignment = await fetchGmAssignment(user.id);
        if (!gmAssignment) {
          gmAssignment = await fetchLegacyGmProfile(user.id);
        }
        persistAuthState();
        try {
          await fetchGameLocksFromSheet();
        } catch (_) {
          // keep local fallback if the Supabase lock table is unavailable
        }
        if (!gmAssignment) {
          setAuthStatus("No GM access found for this account.", true);
        } else {
          setAuthStatus("Signed in.");
        }
        applyAuthUi();
      } catch (error) {
        gmSession = null;
        gmAssignment = null;
        clearAuthState();
        applyAuthUi();
        setAuthStatus(getReadableAuthError(error, "signin"), true);
      }
    });
  }
  if (els.authSignOut) {
    els.authSignOut.addEventListener("click", async () => {
      await handleSignOut();
    });
  }
  if (els.authSignOutInline) {
    els.authSignOutInline.addEventListener("click", async () => {
      await handleSignOut();
    });
  }

  if (els.tradeSave) {
    els.tradeSave.addEventListener("click", async () => {
      const team = els.teamSelect.value;
      if (!team) {
        setTradeStatus("Select a team first.", true);
        return;
      }
      if (!ensureCanEditTeam(team, setTradeStatus)) {
        return;
      }

      const checked = Array.from(
        els.tradePlayerList.querySelectorAll('input[type="checkbox"]:checked')
      ).map((node) => node.value);
      const checkedPicks = Array.from(
        els.tradePicksList.querySelectorAll('input[type="checkbox"]:checked')
      ).map((node) => node.value);

      const nextBlock = {
        players: checked,
        picks: checkedPicks,
        notes: String(els.tradeNotes.value || "").trim(),
        updatedAt: new Date().toISOString(),
      };
      try {
        await saveTradeBlockToSheet(team, nextBlock);
        tradeBlocksCache[team] = nextBlock;
        renderOtherTradeBlocks(team);
        setTradeStatus("Trade block saved.");
        updateLastUpdated();
      } catch (error) {
        setTradeStatus(error.message || "Unable to save trade block.", true);
      }
    });
  }

  if (els.renameSave) {
    els.renameSave.addEventListener("click", async () => {
      const team = els.renameTeamSelect ? els.renameTeamSelect.value : "";
      if (!team) {
        setRenameStatus("Select a team first.", true);
        return;
      }
      const oldTag = String(els.renamePlayerSelect?.value || "").trim();
      if (!oldTag) {
        setRenameStatus("Select a current player.", true);
        return;
      }
      let newName = String(els.renameNewName?.value || "").trim();
      if (!newName) {
        setRenameStatus("Enter a new player name.", true);
        return;
      }
      if (String(oldTag).startsWith("@") && !newName.startsWith("@")) {
        newName = `@${newName}`;
      }
      if (!ensureCanEditTeam(team, setRenameStatus)) {
        return;
      }
      try {
        const result = await updatePlayerNameInSheet(team, oldTag, newName);
        let supabaseResult = null;
        try {
          supabaseResult = await syncPlayerRenameToSupabase(oldTag, newName);
        } catch (supabaseError) {
          supabaseResult = {
            ok: false,
            message: supabaseError.message || "Supabase sync failed.",
          };
        }
        const nextPlayers = (getTeamPlayers(team) || []).map((p) =>
          normalizeName(p) === normalizeName(oldTag) ? newName : p
        );
        rosterByTeam.set(team, nextPlayers);
        renderRenameTeam(team);
        if (els.renamePlayerSelect) {
          els.renamePlayerSelect.value = newName;
        }
        const mirrorOk = result && result.mirrorOk !== false;
        const mirrorUpdated = !!(result && result.mirrorUpdated);
        const mirrorMsg =
          result && result.mirrorMessage ? String(result.mirrorMessage) : "";
        if (mirrorOk && mirrorUpdated) {
          if (supabaseResult && supabaseResult.ok !== false) {
            setRenameStatus("Player name updated on both sheets and synced to Supabase.");
          } else {
            setRenameStatus(
              `Player name updated on both sheets, Supabase sync failed${supabaseResult?.message ? `: ${supabaseResult.message}` : "."}`,
              true
            );
          }
        } else if (mirrorOk && !mirrorUpdated) {
          setRenameStatus(
            supabaseResult && supabaseResult.ok !== false
              ? "Primary sheet updated, mirror sheet had no matching player, Supabase synced."
              : `Primary sheet updated, mirror sheet had no matching player, Supabase failed${supabaseResult?.message ? `: ${supabaseResult.message}` : "."}`,
            true
          );
        } else {
          setRenameStatus(
            `Primary sheet updated, mirror failed${mirrorMsg ? `: ${mirrorMsg}` : "."}${supabaseResult && supabaseResult.ok === false ? ` Supabase failed: ${supabaseResult.message || "Unknown error."}` : supabaseResult ? " Supabase synced." : ""}`,
            true
          );
        }
        updateLastUpdated();
      } catch (error) {
        setRenameStatus(error.message || "Unable to update player name.", true);
      }
    });
  }

  if (els.lineupSave) {
    els.lineupSave.addEventListener("click", async () => {
      const team = els.lineupTeamSelect ? els.lineupTeamSelect.value : "";
      if (!team) {
        setLineupStatus("Select a team first.", true);
        return;
      }
      if (!ensureCanEditTeam(team, setLineupStatus)) {
        return;
      }
      if (isLineupLockedForTeam(team)) {
        setLineupStatus("Lineup is locked for this game day.", true);
        return;
      }
      els.lineupSave.disabled = true;
      setLineupOverlayVisible(true, "Submitting lineup");
      setLineupStatus("Submitting lineup...");
      const checkedPlayers = Array.from(
        els.lineupPlayerList.querySelectorAll('input[data-lineup-player]:checked')
      ).map((node) => String(node.value || "").trim());
      const captainNode = els.lineupPlayerList.querySelector('input[name="lineup-captain"]:checked');
      const captain = captainNode ? String(captainNode.value || "").trim() : "";
      try {
        // Server-side Apps Script is source of truth for lineup validation/lock rules.
        await submitLineupToSheet(team, checkedPlayers, captain);
        lineupSubmittedByTeam.set(team, true);
        renderLineupGameCards(team);
        setLineupStatus("Lineup submitted.");
        setLineupOverlayVisible(true, "Lineup submitted", "Your lineup was submitted successfully.");
        updateLastUpdated();
        setTimeout(() => {
          setLineupOverlayVisible(false);
        }, 1600);
      } catch (error) {
        setLineupStatus(error.message || "Unable to submit lineup.", true);
        setLineupOverlayVisible(true, "Submission failed", error.message || "Unable to submit lineup.");
        setTimeout(() => {
          setLineupOverlayVisible(false);
        }, 2400);
      } finally {
        if (els.lineupSave) {
          els.lineupSave.disabled = false;
        }
      }
    });
  }
  if (els.lineupGameCards) {
    els.lineupGameCards.addEventListener("click", (event) => {
      const editButton = event.target.closest("[data-lineup-edit]");
      if (!editButton) return;
      if (els.lineupPlayerList) {
        els.lineupPlayerList.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }
  if (els.freeAgencyPlayerList) {
    els.freeAgencyPlayerList.addEventListener("change", (event) => {
      const checkbox = event.target.closest('input[data-free-agency-player]');
      if (!checkbox) return;
      const checkedPlayers = Array.from(
        els.freeAgencyPlayerList.querySelectorAll('input[data-free-agency-player]:checked')
      ).map((node) => String(node.value || "").trim());
      if (checkedPlayers.length > 6) {
        checkbox.checked = false;
        setFreeAgencyStatus("Pick up to 6 players only.", true);
        return;
      }
      setFreeAgencySelection(checkedPlayers);
      setFreeAgencyStatus(`Selected ${checkedPlayers.length} of 6.`);
      renderFreeAgencySelection();
    });
  }
  if (els.freeAgencyClear) {
    els.freeAgencyClear.addEventListener("click", () => {
      setFreeAgencySelection([]);
      renderFreeAgencySelection();
      setFreeAgencyStatus("Selection cleared.");
    });
  }
  const saveFreeAgencyBallot = async () => {
      try {
        const selectedPlayers = Array.from(
          els.freeAgencyPlayerList.querySelectorAll('input[data-free-agency-player]:checked')
        ).map((node) => String(node.value || "").trim());
        const saved = await saveFreeAgencySelectionToSupabase(selectedPlayers);
        setFreeAgencySelection(saved);
        renderFreeAgencySelection();
        setFreeAgencyStatus("All Star ballot saved.");
      } catch (error) {
        setFreeAgencyStatus(error.message || "Unable to save ballot.", true);
      }
  };
  if (els.freeAgencySaveTop) {
    els.freeAgencySaveTop.addEventListener("click", saveFreeAgencyBallot);
  }
  if (els.freeAgencySave) {
    els.freeAgencySave.addEventListener("click", saveFreeAgencyBallot);
  }

  if (els.powerSave) {
    els.powerSave.addEventListener("click", async () => {
      const team = els.powerTeamSelect ? els.powerTeamSelect.value : "";
      if (!team) {
        setPowerStatus("Select a team first.", true);
        return;
      }
      if (!canSubmitPowerRankings(team)) {
        setPowerStatus("GM or reporter access required.", true);
        return;
      }
      const reporterHandle =
        team === POWER_REPORTER_VALUE ? formatReporterHandle(els.powerReporterHandle?.value || "") : "";
      if (team === POWER_REPORTER_VALUE && !reporterHandle) {
        setPowerStatus("Type your @ on Real first.", true);
        return;
      }
      if (reporterHandle) {
        localStorage.setItem(GM_POWER_REPORTER_HANDLE_KEY, reporterHandle);
      }
      const rankings = Array.from(
        els.powerRankingsList.querySelectorAll("select[data-power-rank]")
      ).map((node) => String(node.value || "").trim());
      if (rankings.some((value) => !value)) {
        setPowerStatus("Rank all 10 slots before submitting.", true);
        return;
      }
      const unique = new Set(rankings);
      if (unique.size !== TEAM_ORDER.length) {
        setPowerStatus("Each team can only appear once.", true);
        return;
      }

      const vote = {
        rankings,
        updatedAt: new Date().toISOString(),
      };
      const storageTeam = getPowerVoteStorageKey(team, reporterHandle);

      try {
        await savePowerVoteToSheet(storageTeam, {
          ...vote,
          reporterHandle,
        });
      } catch (error) {
        setPowerStatus(error.message || "Unable to save power rankings vote.", true);
        return;
      }

      if (team !== POWER_REPORTER_VALUE) {
        powerVotesCache[team] = vote;
      }
      renderPowerVotesView();
      setPowerStatus(team === POWER_REPORTER_VALUE ? "Reporter power rankings response submitted." : "Power rankings vote submitted.");
      updateLastUpdated();
    });
  }
}

async function init() {
  bindEvents();
  setActiveTab("trade");
  try {
    loadLocalGameLocks();
    loadFreeAgencySelection();
    loadTestDraftPicks();
    syncDraftRoundOptions();
    try {
      await Promise.all([loadRoster(), loadDraftCapital(), loadDraftOrderData(), loadSubmittedDraftPicks()]);
      syncDraftRoundOptions();
      syncDraftModeFields();
      renderDraftSheetPickOptions();
      renderGmDraftPick();
    } catch (draftError) {
      setDraftStatus(draftError.message || "Unable to load draft order.", true);
    }
    await loadSupabaseConfig();
    const savedToken = localStorage.getItem(GM_ACCESS_TOKEN_KEY) || "";
    const savedRefresh = localStorage.getItem(GM_REFRESH_TOKEN_KEY) || "";
    const cachedUser = safeJsonParse(
      localStorage.getItem(GM_SESSION_USER_KEY),
      null
    );
    const cachedAssignment = safeJsonParse(
      localStorage.getItem(GM_ASSIGNMENT_KEY),
      null
    );
    if (savedToken || savedRefresh) {
      try {
        let tokenData = { access_token: savedToken, refresh_token: savedRefresh };
        let user = null;
        if (tokenData.refresh_token) {
          tokenData = await refreshAuthSession(tokenData.refresh_token);
          user = await fetchAuthUser(tokenData.access_token);
        } else {
          user = await fetchAuthUser(tokenData.access_token);
        }
        gmSession = {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || savedRefresh || "",
          user,
        };
        gmAssignment = await fetchGmAssignment(user.id);
        if (!gmAssignment) {
          gmAssignment = await fetchLegacyGmProfile(user.id);
        }
        persistAuthState();
      } catch (_) {
        if (cachedUser && cachedAssignment) {
          gmSession = {
            access_token: savedToken || "",
            refresh_token: savedRefresh || "",
            user: cachedUser,
          };
          gmAssignment = cachedAssignment;
        } else {
          gmSession = null;
          gmAssignment = null;
          clearAuthState();
        }
      }
    } else if (cachedUser && cachedAssignment) {
      gmSession = {
        access_token: "",
        refresh_token: "",
        user: cachedUser,
      };
      gmAssignment = cachedAssignment;
      persistAuthState();
    }

    if (
      gmSession?.access_token &&
      gmSession?.refresh_token &&
      !gmSession?.user?.id
    ) {
      try {
        const tokenData = await refreshAuthSession(gmSession.refresh_token);
        const user = await fetchAuthUser(tokenData.access_token);
        gmSession = {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || gmSession.refresh_token,
          user,
        };
        if (!gmAssignment) {
          gmAssignment = await fetchGmAssignment(user.id);
          if (!gmAssignment) {
            gmAssignment = await fetchLegacyGmProfile(user.id);
          }
        }
        persistAuthState();
      } catch (_) {
        // keep cached signed-in state if refresh fails
      }
    }

    if (gmSession?.access_token) {
      try {
        await fetchGameLocksFromSheet();
      } catch (_) {
        // Keep local fallback if the Supabase lock table is unavailable.
      }
    }

    try {
      commishUpcomingGames = await loadUpcomingScheduleGames();
    } catch (_) {
      commishUpcomingGames = [];
    }
    try {
      commishArticleGames = await loadScheduleGamesForArticles();
      renderArticleGameOptions();
    } catch (_) {
      commishArticleGames = [];
      renderArticleGameOptions();
    }
    try {
      tradeBlocksCache = await fetchTradeBlocksFromSheet();
    } catch (error) {
      tradeBlocksCache = {};
      setTradeStatus(
        "Could not load sheet trade blocks. Check Apps Script trade block actions.",
        true
      );
    }
    try {
      powerVotesCache = await fetchPowerVotesFromSheet();
    } catch (_) {
      powerVotesCache = {};
    }
    try {
      const savedVotes = await fetchFreeAgencySelectionFromSupabase();
      setFreeAgencySelection(savedVotes);
    } catch (_) {
      loadFreeAgencySelection();
    }
    applyAuthUi();
    renderSelectedTeam(els.teamSelect.value || "");
    renderRenameTeam(els.renameTeamSelect ? els.renameTeamSelect.value : "");
    renderLineupTeam(els.lineupTeamSelect ? els.lineupTeamSelect.value : "");
    renderFreeAgencySelection();
    renderPowerRankingsTeam(
      els.powerTeamSelect ? els.powerTeamSelect.value : ""
    );
    renderPowerVotesView();
    syncArticleWriterMode();
    updateLastUpdated();
  } catch (error) {
    setTradeStatus(error.message, true);
    setAuthStatus(error.message, true);
  }
}

init();
