const BADGE_OVERRIDES_API = "/api/badge-overrides";
const SUPABASE_CONFIG_URL = "/api/supabase-config";
const GM_ACCESS_TOKEN_KEY = "rskl_gm_access_token";
const GM_REFRESH_TOKEN_KEY = "rskl_gm_refresh_token";
const GM_SESSION_USER_KEY = "rskl_gm_user";
const GM_ASSIGNMENT_KEY = "rskl_gm_assignment";

const SEASONS = [
  "c2s3-regular",
  "c2s2-regular",
  "c2s1-regular",
  "c1s7-regular",
  "c1s6-regular",
  "c1s5-regular",
  "c1s4-regular",
  "c1s3-regular",
  "c1s2-regular",
];

const els = {
  lastUpdated: document.getElementById("comish-last-updated"),
  authCard: document.getElementById("comish-auth-card"),
  deniedCard: document.getElementById("comish-denied-card"),
  authEmail: document.getElementById("comish-auth-email"),
  authPassword: document.getElementById("comish-auth-password"),
  authSignIn: document.getElementById("comish-signin"),
  authStatus: document.getElementById("comish-auth-status"),
  signOut: document.getElementById("comish-signout"),
  shell: document.getElementById("comish-shell"),
  seasonSelect: document.getElementById("comish-season-select"),
  rookieInput: document.getElementById("comish-rookie-input"),
  allStarInput: document.getElementById("comish-allstar-input"),
  risingStarsInput: document.getElementById("comish-rising-stars-input"),
  rookieCount: document.getElementById("comish-rookie-count"),
  allStarCount: document.getElementById("comish-allstar-count"),
  risingStarsCount: document.getElementById("comish-rising-stars-count"),
  preview: document.getElementById("comish-json-preview"),
  save: document.getElementById("comish-save"),
  reload: document.getElementById("comish-reload"),
  status: document.getElementById("comish-status"),
};

let badgeState = {
  risingStars: [],
  rookie: {},
  allStar: {},
};
let supabaseUrl = "";
let supabaseAnon = "";
let gmSession = null;
let gmAssignment = null;
let authResolved = false;

function normalizeHandle(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return `@${text.replace(/^@+/, "").trim()}`;
}

function parseHandleLines(value) {
  const unique = new Set();
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => normalizeHandle(line))
    .filter((line) => {
      if (!line || unique.has(line.toLowerCase())) return false;
      unique.add(line.toLowerCase());
      return true;
    })
    .sort((a, b) => a.localeCompare(b));
}

function formatHandleLines(list) {
  return (Array.isArray(list) ? list : []).join("\n");
}

function ensureShape(input) {
  const next = {
    risingStars: Array.isArray(input?.risingStars) ? input.risingStars.map(normalizeHandle).filter(Boolean) : [],
    rookie: {},
    allStar: {},
  };
  SEASONS.forEach((season) => {
    next.rookie[season] = Array.isArray(input?.rookie?.[season])
      ? input.rookie[season].map(normalizeHandle).filter(Boolean)
      : [];
    next.allStar[season] = Array.isArray(input?.allStar?.[season])
      ? input.allStar[season].map(normalizeHandle).filter(Boolean)
      : [];
  });
  next.risingStars = parseHandleLines(next.risingStars.join("\n"));
  SEASONS.forEach((season) => {
    next.rookie[season] = parseHandleLines(next.rookie[season].join("\n"));
    next.allStar[season] = parseHandleLines(next.allStar[season].join("\n"));
  });
  return next;
}

function setStatus(message, tone = "") {
  els.status.textContent = message;
  els.status.dataset.tone = tone;
}

function setAuthStatus(message, isError = false) {
  els.authStatus.textContent = message;
  els.authStatus.className = `gm-status${isError ? " error" : ""}`;
}

function requireSupabaseConfig() {
  if (!supabaseUrl || !supabaseAnon) {
    throw new Error("Missing Supabase config.");
  }
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

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  let payload = null;
  try {
    payload = await response.json();
  } catch (_) {
    payload = null;
  }
  if (!response.ok) {
    const error = new Error(payload?.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function supabaseUrlWithApiKey(path) {
  requireSupabaseConfig();
  const sep = path.includes("?") ? "&" : "?";
  return `${supabaseUrl}${path}${sep}apikey=${encodeURIComponent(supabaseAnon)}`;
}

async function loadSupabaseConfig() {
  const cfg = await requestJson(SUPABASE_CONFIG_URL, { cache: "no-store" });
  supabaseUrl = String(cfg.url || cfg.supabaseUrl || "").trim();
  supabaseAnon = String(cfg.anonKey || cfg.supabaseAnon || cfg.publicAnonKey || "").trim();
  requireSupabaseConfig();
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
  const rows = await requestJson(`${supabaseUrl}/rest/v1/gm_assignments${query}`, {
    headers: authHeaders(true),
  });
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return null;
  const role = String(row.role || "").trim().toLowerCase();
  const commishByRole = role === "commish" || role === "commissioner" || role === "admin";
  return {
    user_id: row.user_id,
    team: String(row.team || "").trim(),
    role,
    is_gm: row.is_gm === true || !!String(row.team || "").trim(),
    is_commish: row.is_commish === true || commishByRole,
  };
}

async function signInAuth(email, password) {
  const data = await requestJson(supabaseUrlWithApiKey("/auth/v1/token?grant_type=password"), {
    method: "POST",
    headers: authHeaders(false),
    body: JSON.stringify({ email, password }),
  });
  if (!data?.access_token) {
    throw new Error("Sign in failed.");
  }
  return data;
}

async function refreshAuthSession(refreshToken) {
  const data = await requestJson(supabaseUrlWithApiKey("/auth/v1/token?grant_type=refresh_token"), {
    method: "POST",
    headers: authHeaders(false),
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
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
    // ignore
  }
}

function persistAuthState() {
  const access = String(gmSession?.access_token || "").trim();
  const refresh = String(gmSession?.refresh_token || "").trim();
  if (access) localStorage.setItem(GM_ACCESS_TOKEN_KEY, access);
  else localStorage.removeItem(GM_ACCESS_TOKEN_KEY);
  if (refresh) localStorage.setItem(GM_REFRESH_TOKEN_KEY, refresh);
  else localStorage.removeItem(GM_REFRESH_TOKEN_KEY);
  if (gmSession?.user) localStorage.setItem(GM_SESSION_USER_KEY, JSON.stringify(gmSession.user));
  else localStorage.removeItem(GM_SESSION_USER_KEY);
  if (gmAssignment) localStorage.setItem(GM_ASSIGNMENT_KEY, JSON.stringify(gmAssignment));
  else localStorage.removeItem(GM_ASSIGNMENT_KEY);
}

function clearAuthState() {
  localStorage.removeItem(GM_ACCESS_TOKEN_KEY);
  localStorage.removeItem(GM_REFRESH_TOKEN_KEY);
  localStorage.removeItem(GM_SESSION_USER_KEY);
  localStorage.removeItem(GM_ASSIGNMENT_KEY);
}

function isCommish() {
  return !!gmAssignment?.is_commish;
}

function isSignedInCommish() {
  return !!gmSession?.user?.id && isCommish();
}

function authRequestOptions(options = {}) {
  return {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${gmSession?.access_token || ""}`,
    },
  };
}

function applyAuthUi() {
  const allowed = isSignedInCommish();
  const signedIn = !!gmSession?.user?.id;
  if (els.authCard) els.authCard.hidden = !authResolved || allowed || signedIn;
  if (els.deniedCard) els.deniedCard.hidden = !authResolved || allowed || !signedIn;
  if (els.shell) els.shell.hidden = !allowed;
  if (els.save) els.save.hidden = !allowed;
  if (els.reload) els.reload.hidden = !allowed;
  if (els.signOut) els.signOut.hidden = !allowed;

  if (allowed) {
    const email = gmSession?.user?.email || "Commissioner";
    setAuthStatus(`Signed in as ${email}.`, false);
    setStatus("Commissioner access granted.", "success");
  } else if (signedIn) {
    setAuthStatus("This account is not marked as commissioner.", true);
    setStatus("Only users listed as commissioner can access this page.", "error");
  } else {
    setAuthStatus("Sign in with the commissioner account to edit badges.", false);
    setStatus("Commissioner sign-in required.", "error");
  }
}

function updateLastUpdated() {
  const now = new Date();
  els.lastUpdated.textContent = `Last updated: ${now.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function commitSeasonEditors() {
  const season = els.seasonSelect.value;
  badgeState.rookie[season] = parseHandleLines(els.rookieInput.value);
  badgeState.allStar[season] = parseHandleLines(els.allStarInput.value);
  badgeState.risingStars = parseHandleLines(els.risingStarsInput.value);
}

function updatePreview() {
  commitSeasonEditors();
  els.preview.textContent = JSON.stringify(badgeState, null, 2);
  const season = els.seasonSelect.value;
  els.rookieCount.textContent = `${badgeState.rookie[season].length} rookies`;
  els.allStarCount.textContent = `${badgeState.allStar[season].length} all stars`;
  els.risingStarsCount.textContent = `${badgeState.risingStars.length} rising stars`;
}

function renderSeasonEditors() {
  const season = els.seasonSelect.value;
  els.rookieInput.value = formatHandleLines(badgeState.rookie[season]);
  els.allStarInput.value = formatHandleLines(badgeState.allStar[season]);
  els.risingStarsInput.value = formatHandleLines(badgeState.risingStars);
  updatePreview();
}

async function loadBadgeOverrides() {
  if (!isSignedInCommish()) {
    throw new Error("Commissioner access required.");
  }
  setStatus("Loading badge overrides…");
  const response = await fetch(BADGE_OVERRIDES_API, authRequestOptions({ cache: "no-store" }));
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || `Load failed: ${response.status}`);
  }
  badgeState = ensureShape(payload);
  renderSeasonEditors();
  updateLastUpdated();
  setStatus("Badge overrides loaded.", "success");
}

async function saveBadgeOverrides() {
  if (!isSignedInCommish()) {
    throw new Error("Commissioner access required.");
  }
  commitSeasonEditors();
  setStatus("Saving badge overrides…");
  const response = await fetch(
    BADGE_OVERRIDES_API,
    authRequestOptions({
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(badgeState),
    })
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message || `Save failed: ${response.status}`);
  }
  badgeState = ensureShape(payload?.data || badgeState);
  renderSeasonEditors();
  updateLastUpdated();
  setStatus("Badge overrides saved.", "success");
}

async function restoreSession() {
  await loadSupabaseConfig();
  const cachedAssignment = (() => {
    try {
      return JSON.parse(localStorage.getItem(GM_ASSIGNMENT_KEY) || "null");
    } catch (_) {
      return null;
    }
  })();
  const refreshToken = localStorage.getItem(GM_REFRESH_TOKEN_KEY) || "";
  const accessToken = localStorage.getItem(GM_ACCESS_TOKEN_KEY) || "";

  if (!refreshToken && !accessToken) {
    gmSession = null;
    gmAssignment = null;
    clearAuthState();
    authResolved = true;
    applyAuthUi();
    return;
  }

  try {
    let sessionData = null;
    if (refreshToken) {
      sessionData = await refreshAuthSession(refreshToken);
    } else {
      const user = await fetchAuthUser(accessToken);
      sessionData = {
        access_token: accessToken,
        refresh_token: refreshToken,
        user,
      };
    }
    const user = sessionData?.user || (await fetchAuthUser(sessionData.access_token));
    gmSession = { ...sessionData, user };
    gmAssignment = await fetchGmAssignment(user.id);
    if (!gmAssignment && cachedAssignment?.user_id === user.id) {
      gmAssignment = cachedAssignment;
    }
    if (!isCommish()) {
      gmSession = null;
      gmAssignment = null;
      clearAuthState();
      authResolved = true;
      applyAuthUi();
      setAuthStatus("This account is not marked as commissioner.", true);
      return;
    }
    persistAuthState();
    authResolved = true;
    applyAuthUi();
    await loadBadgeOverrides();
  } catch (error) {
    gmSession = null;
    gmAssignment = null;
    clearAuthState();
    authResolved = true;
    applyAuthUi();
    setAuthStatus(error.message || "Unable to restore session.", true);
  }
}

async function handleSignIn() {
  const email = String(els.authEmail?.value || "").trim();
  const password = String(els.authPassword?.value || "");
  if (!email || !password) {
    setAuthStatus("Enter email and password.", true);
    return;
  }
  try {
    setAuthStatus("Signing in…");
    const sessionData = await signInAuth(email, password);
    const user = sessionData?.user || (await fetchAuthUser(sessionData.access_token));
    gmSession = { ...sessionData, user };
    gmAssignment = await fetchGmAssignment(user.id);
    if (!isCommish()) {
      gmSession = null;
      gmAssignment = null;
      clearAuthState();
      authResolved = true;
      applyAuthUi();
      setAuthStatus("This account is not marked as commissioner.", true);
      return;
    }
    persistAuthState();
    authResolved = true;
    applyAuthUi();
    await loadBadgeOverrides();
  } catch (error) {
    gmSession = null;
    gmAssignment = null;
    clearAuthState();
    authResolved = true;
    applyAuthUi();
    setAuthStatus(error.message || "Unable to sign in.", true);
  }
}

async function handleSignOut() {
  try {
    await signOutAuth();
  } finally {
    gmSession = null;
    gmAssignment = null;
    clearAuthState();
    authResolved = true;
    applyAuthUi();
    setAuthStatus("Signed out.");
  }
}

function boot() {
  els.seasonSelect.addEventListener("change", () => {
    commitSeasonEditors();
    renderSeasonEditors();
  });

  [els.rookieInput, els.allStarInput, els.risingStarsInput].forEach((field) => {
    field.addEventListener("input", updatePreview);
  });

  els.authSignIn.addEventListener("click", () => {
    handleSignIn();
  });

  els.signOut.addEventListener("click", () => {
    handleSignOut();
  });

  els.reload.addEventListener("click", () => {
    loadBadgeOverrides().catch((error) => {
      setStatus(error.message || "Unable to reload badge overrides.", "error");
    });
  });

  els.save.addEventListener("click", () => {
    saveBadgeOverrides().catch((error) => {
      setStatus(error.message || "Unable to save badge overrides.", "error");
    });
  });

  setStatus("Checking commissioner access…");
  applyAuthUi();
  restoreSession();
}

boot();
