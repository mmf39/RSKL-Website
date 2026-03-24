const ROSTER_URL = "/api/sheet?name=roster";
const GM_LINEUP_CSV_URL = ROSTER_URL;
const DRAFT_CAPITAL_URL = "/api/sheet?name=draft-capital";
const POWER_RANKINGS_URL = "/api/sheet?name=power-rankings";
const SCHEDULE_URL = "/api/sheet?name=schedule";
const SUPABASE_CONFIG_URL = "/api/supabase-config";
const GM_ACCESS_TOKEN_KEY = "rskl_gm_access_token";
const GM_REFRESH_TOKEN_KEY = "rskl_gm_refresh_token";
const GM_SESSION_USER_KEY = "rskl_gm_user";
const GM_ASSIGNMENT_KEY = "rskl_gm_assignment";
const GM_LOCAL_LOCKS_KEY = "rskl_local_game_locks";

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

const DRAFT_CAPITAL_COLUMNS = {
  Turkeys: "A",
  "Gus N Em": "B",
  Bullets: "C",
  Cheerios: "D",
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
  "Cheerios",
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
  lockGamesList: document.getElementById("gm-lock-games-list"),
  lockSave: document.getElementById("gm-lock-save"),
  lockStatus: document.getElementById("gm-lock-status"),
  tabTradePanel: document.getElementById("gm-tab-trade"),
  tabRenamePanel: document.getElementById("gm-tab-rename"),
  tabLineupPanel: document.getElementById("gm-tab-lineup"),
  tabPowerPanel: document.getElementById("gm-tab-power"),
  authEmail: document.getElementById("gm-auth-email"),
  authPassword: document.getElementById("gm-auth-password"),
  authSignUp: document.getElementById("gm-btn-signup"),
  authSignIn: document.getElementById("gm-btn-signin"),
  authSignOut: document.getElementById("gm-btn-signout"),
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
  powerTeamSelect: document.getElementById("power-team-select"),
  powerRankingsList: document.getElementById("power-rankings-list"),
  powerRandomize: document.getElementById("power-randomize"),
  powerCode: document.getElementById("power-code"),
  powerSave: document.getElementById("power-save"),
  powerStatus: document.getElementById("power-status"),
  powerVotesView: document.getElementById("power-votes-view"),
};

let rosterByTeam = new Map();
let picksByTeam = new Map();
let tradeBlocksCache = {};
let powerVotesCache = {};
let supabaseUrl = "";
let supabaseAnon = "";
let gmSession = null;
let gmAssignment = null;
let commishUpcomingGames = [];
let lineupSubmittedByTeam = new Map();
let localGameLocksByDate = {};

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

function setActiveTab(tab) {
  const active =
    tab === "rename"
      ? "rename"
      : tab === "lineup"
      ? "lineup"
      : tab === "power"
      ? "power"
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
  if (els.tabPowerPanel) {
    els.tabPowerPanel.hidden = active !== "power";
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
  return team === "Bullets" ? "Storm" : team;
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
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
      headers: authHeaders(true),
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
  const allowed =
    row.is_gm === true ||
    row.is_commish === true ||
    commishByRole ||
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
  };
}

async function fetchLegacyGmProfile(userId) {
  const query = `?select=user_id,team_name,is_gm,is_commish&user_id=eq.${encodeURIComponent(
    userId
  )}&limit=1`;
  const rows = await requestJson(`${supabaseUrl}/rest/v1/gm_users${query}`, {
    headers: authHeaders(true),
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

async function signOutAuth() {
  if (!gmSession?.access_token) return;
  try {
    await requestJson(`${supabaseUrl}/auth/v1/logout`, {
      method: "POST",
      headers: authHeaders(true),
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

function isSignedInGm() {
  return !!gmSession?.user?.id && !!gmAssignment;
}

function sameTeam(a, b) {
  return normalizeName(displayTeamName(a)) === normalizeName(displayTeamName(b));
}

function canEditTeam(team) {
  if (!isSignedInGm()) return false;
  if (isCommish()) return true;
  const mine = getAuthorizedTeam();
  return !!mine && sameTeam(mine, team);
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
  const allowAnyTeam = isCommish();

  selects.forEach((select) => {
    Array.from(select.options).forEach((opt) => {
      if (!opt.value) return;
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
  if (els.commishCard) {
    els.commishCard.hidden = !(signedIn && isCommish());
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
  renderSelectedTeam(els.teamSelect ? els.teamSelect.value : "");
  renderRenameTeam(els.renameTeamSelect ? els.renameTeamSelect.value : "");
  renderLineupTeam(els.lineupTeamSelect ? els.lineupTeamSelect.value : "");
  renderPowerRankingsTeam(els.powerTeamSelect ? els.powerTeamSelect.value : "");
  renderPowerVotesView();
  renderCommishLockGames();

  if (signedIn) {
    const email = gmSession?.user?.email || "GM";
    const team = displayTeamName(getAuthorizedTeam()) || "No team assigned";
    setAuthStatus(`Signed in as ${email} • Team: ${team}`);
  } else {
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
  const nextMap = { ...localGameLocksByDate };
  (locks || []).forEach((lock) => {
    const date = String(lock?.date || "").trim();
    const lockAt = String(lock?.lockAt || "").trim();
    if (!date || !lockAt) return;
    nextMap[date] = lockAt;
  });
  saveLocalGameLocks(nextMap);
  return { ok: true, local: true };
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
  return rosterByTeam.get(team) || [];
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
  if (els.lineupCode) {
    els.lineupCode.value = "";
  }
  setLineupStatus("");
}

function getLockDateTimeForDay(dateText) {
  const custom = String(localGameLocksByDate?.[dateText] || "").trim();
  if (custom) {
    const customDt = new Date(custom);
    if (!Number.isNaN(customDt.getTime())) return customDt;
  }
  const day = parseScheduleDateValue(dateText);
  if (!day) return null;
  day.setHours(18, 55, 0, 0); // default lock: 6:55 PM local
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
      const canEdit = idx === 0;
      const isSubmitted = canEdit && submitted;
      const statusClass = isSubmitted ? " submitted" : "";
      const statusText = isSubmitted ? "Lineup Submitted" : "Awaiting Deadline";
      const buttonText = canEdit ? "Edit Lineup" : "Awaiting Deadline";
      const dateText = item.dateText || "—";
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
      const dateText = String(row[dateIdx >= 0 ? dateIdx : 0] || "").trim();
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
            <div class="label">Lock Date/Time (local)</div>
            <input class="text-input" type="datetime-local" data-lock-index="${idx}" value="${escapeHtml(day.lockAt || "")}" />
          </div>
        </div>
      `
    })
    .join("");
}

function renderPowerRankingsTeam(team) {
  if (!els.powerRankingsList) return;
  if (!team) {
    els.powerRankingsList.innerHTML = '<div class="gm-empty">Select a team.</div>';
    return;
  }
  const saved = powerVotesCache[team];
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
      await signOutAuth();
      gmSession = null;
      gmAssignment = null;
      clearAuthState();
      applyAuthUi();
      setAuthStatus("Signed out.");
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
          setRenameStatus("Player name updated on both sheets.");
        } else if (mirrorOk && !mirrorUpdated) {
          setRenameStatus(
            "Primary sheet updated, mirror sheet had no matching player.",
            true
          );
        } else {
          setRenameStatus(
            `Primary sheet updated, mirror failed${mirrorMsg ? `: ${mirrorMsg}` : "."}`,
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
        updateLastUpdated();
      } catch (error) {
        setLineupStatus(error.message || "Unable to submit lineup.", true);
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

  if (els.powerSave) {
    els.powerSave.addEventListener("click", async () => {
      const team = els.powerTeamSelect ? els.powerTeamSelect.value : "";
      if (!team) {
        setPowerStatus("Select a team first.", true);
        return;
      }
      if (!ensureCanEditTeam(team, setPowerStatus)) {
        return;
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

      try {
        await savePowerVoteToSheet(team, vote);
      } catch (error) {
        setPowerStatus(error.message || "Unable to save power rankings vote.", true);
        return;
      }

      powerVotesCache[team] = vote;
      renderPowerVotesView();
      setPowerStatus("Power rankings vote submitted.");
      updateLastUpdated();
    });
  }
}

async function init() {
  bindEvents();
  setActiveTab("trade");
  try {
    loadLocalGameLocks();
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
        if (!tokenData.access_token && tokenData.refresh_token) {
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

    await Promise.all([loadRoster(), loadDraftCapital()]);
    try {
      commishUpcomingGames = await loadUpcomingScheduleGames();
    } catch (_) {
      commishUpcomingGames = [];
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
    applyAuthUi();
    renderSelectedTeam(els.teamSelect.value || "");
    renderRenameTeam(els.renameTeamSelect ? els.renameTeamSelect.value : "");
    renderLineupTeam(els.lineupTeamSelect ? els.lineupTeamSelect.value : "");
    renderPowerRankingsTeam(
      els.powerTeamSelect ? els.powerTeamSelect.value : ""
    );
    renderPowerVotesView();
    updateLastUpdated();
  } catch (error) {
    setTradeStatus(error.message, true);
    setAuthStatus(error.message, true);
  }
}

init();
