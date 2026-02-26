const SCHEDULE_CSV_URL = "/api/sheet?name=schedule";
const LIVE_CSV_URL = "/api/sheet?name=live-scoring";
const BOXSCORE_CSV_URL = "/api/sheet?name=boxscore";
const CONFIG_URL = "/api/supabase-config";
const SEASON_KEY = "season";
const C2S2_SCHEDULE_RANGE = "A2:K77";
const ACCESS_TOKEN_KEY = "wagers_access_token";
const REFRESH_TOKEN_KEY = "wagers_refresh_token";
const WAGERS_VERSION = "20260226m";

const els = {
  lastUpdated: document.getElementById("last-updated"),
  email: document.getElementById("auth-email"),
  password: document.getElementById("auth-password"),
  signUp: document.getElementById("btn-signup"),
  signIn: document.getElementById("btn-signin"),
  signOut: document.getElementById("btn-signout"),
  status: document.getElementById("auth-status"),
  balance: document.getElementById("wallet-balance"),
  games: document.getElementById("wager-games"),
  history: document.getElementById("wager-history"),
};

let supabaseUrl = "";
let supabaseAnon = "";
let session = null;
let bankroll = 0;
let games = [];
let openGamesDisplayed = [];
let liveMap = new Map();
let finalMap = new Map();

function getSeason() {
  const raw = localStorage.getItem(SEASON_KEY) || "c2s2";
  return raw === "c2s2-regular" ? "c2s2" : raw;
}

function initSeasonSelect() {
  const select = document.getElementById("season-select");
  if (!select) return;
  select.value = getSeason();
  select.addEventListener("change", () => {
    localStorage.setItem(SEASON_KEY, select.value);
    location.reload();
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
      if (char === "\r" && next === "\n") i += 1;
      row.push(value.trim());
      if (row.length > 1 || row[0] !== "") rows.push(row);
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
  const m = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
  if (!m) return null;
  return {
    startCol: colToIndex(m[1]),
    startRow: Number(m[2]) - 1,
    endCol: colToIndex(m[3]),
    endRow: Number(m[4]) - 1,
  };
}

function sliceRange(rows, range) {
  const r = parseRange(range);
  if (!r) return [];
  return rows
    .slice(r.startRow, r.endRow + 1)
    .map((row) => row.slice(r.startCol, r.endCol + 1));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setStatus(msg, isError = false) {
  if (!els.status) return;
  els.status.textContent = msg;
  els.status.style.color = isError ? "#ff9ca3" : "";
}

function notify(msg) {
  try {
    window.alert(msg);
  } catch (_) {}
}

function cleanEmail(value) {
  return String(value || "")
    .trim()
    .replace(/^"+|"+$/g, "")
    .replace(/^'+|'+$/g, "")
    .toLowerCase();
}

function displayTeamName(value) {
  const name = String(value || "").trim();
  return name === "Bullets" ? "Storm" : name;
}

function normalizeTeamName(value) {
  const text = displayTeamName(value)
    .replace(/\([^)]*\)/g, "")
    .replace(/[:*]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return text === "bullets" ? "storm" : text;
}

function normalizeDateToken(value) {
  const text = String(value || "").trim();
  const match = text.match(/(\d{1,2}\/\d{1,2})(?:\/\d{2,4})?/);
  return match ? match[1] : "";
}

function buildGameKey(dateToken, team1, team2) {
  return `${String(dateToken || "").trim()}|${normalizeTeamName(team1)}|${normalizeTeamName(team2)}`;
}

function parseTeamHeader(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(.*?)(?:\(([-+]?\d+)\))?\s*$/);
  return {
    name: (match ? match[1] : text).trim(),
    score: match && match[2] ? Number(match[2]) : null,
  };
}

function extractLeagueDay(rows) {
  const row = rows.find(
    (r) =>
      String(r[0] || "").includes("League Day") ||
      String(r[1] || "").includes("League Day")
  );
  if (!row) return "";
  return normalizeDateToken(String(row[0] || row[1] || ""));
}

function buildLiveMap(rows) {
  const map = new Map();
  const day = extractLeagueDay(rows);
  if (!day) return map;
  rows.forEach((row) => {
    const left = String(row[0] || "").trim();
    const right = String(row[4] || "").trim();
    const isHeader =
      left &&
      right &&
      !left.startsWith("@") &&
      !right.startsWith("@") &&
      (/\(\s*-?\d+\s*\)/.test(left) || /\(\s*-?\d+\s*\)/.test(right));
    if (!isHeader) return;
    const t1 = parseTeamHeader(left);
    const t2 = parseTeamHeader(right);
    if (!t1.name || !t2.name) return;
    map.set(buildGameKey(day, t1.name, t2.name), true);
    map.set(buildGameKey(day, t2.name, t1.name), true);
  });
  return map;
}

function buildFinalMap(rows) {
  const map = new Map();
  let day = "";
  rows.forEach((row) => {
    const a = String(row[0] || "").trim();
    const b = String(row[1] || "").trim();
    if (a.includes("League Day") || b.includes("League Day")) {
      day = normalizeDateToken(a || b);
      return;
    }
    if (!day) return;
    const left = String(row[0] || "").trim();
    const right = String(row[4] || "").trim();
    if (!left || !right || left.startsWith("@") || right.startsWith("@")) return;
    const t1 = parseTeamHeader(left);
    const t2 = parseTeamHeader(right);
    if (t1.name && t2.name && t1.score !== null && t2.score !== null) {
      map.set(buildGameKey(day, t1.name, t2.name), true);
      map.set(buildGameKey(day, t2.name, t1.name), true);
    }
  });
  return map;
}

function parseScheduleGames(rows) {
  const table = [
    ["Date", "Team 1", "Team 2", "Info", "Game Type", "Team1 Odds", "Team2 Odds", "Team1 Spread", "Team2 Spread", "Team1 Spread Odds", "Team2 Spread Odds"],
    ...sliceRange(rows, C2S2_SCHEDULE_RANGE),
  ];
  return table
    .slice(1)
    .map((row) => {
      const dateToken = normalizeDateToken(row[0]);
      const team1 = displayTeamName(row[1]);
      const team2 = displayTeamName(row[2]);
      const gameType = String(row[4] || "");
      const team1Odds = String(row[5] || "").trim();
      const team2Odds = String(row[6] || "").trim();
      const team1Spread = String(row[7] || "").trim();
      const team2Spread = String(row[8] || "").trim();
      const team1SpreadOdds = String(row[9] || "").trim();
      const team2SpreadOdds = String(row[10] || "").trim();
      if (!dateToken || !team1 || !team2) return null;
      return {
        dateToken,
        team1,
        team2,
        gameType,
        team1Odds,
        team2Odds,
        team1Spread,
        team2Spread,
        team1SpreadOdds,
        team2SpreadOdds,
      };
    })
    .filter(Boolean);
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function parseAmericanOdds(text) {
  const source = String(text || "");
  const tailInParens = source.match(/\(([-+]\d{3,4})\)\s*$/);
  if (tailInParens) return Number(tailInParens[1]);
  const all = source.match(/[-+]\d{3,4}/g);
  return all && all.length ? Number(all[all.length - 1]) : null;
}

function projectedProfit(stake, oddsText) {
  const amount = Number(stake || 0);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const odds = parseAmericanOdds(oddsText);
  const useOdds = Number.isFinite(odds) ? odds : -110;
  if (useOdds > 0) return (amount * useOdds) / 100;
  return (amount * 100) / Math.abs(useOdds);
}

function authHeaders(withAuth = false, tokenOverride = "") {
  const headers = {
    apikey: supabaseAnon,
    "Content-Type": "application/json",
  };
  const token = tokenOverride || session?.access_token || "";
  if (withAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function requestJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = text;
  }
  if (!res.ok) {
    const msg =
      (data && (data.msg || data.message || data.error_description || data.error)) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

async function getConfig() {
  const json = await requestJson(CONFIG_URL, { cache: "no-store" });
  if (!json.ok) throw new Error(json.message || "Invalid config");
  supabaseUrl = json.url;
  supabaseAnon = json.anonKey;
}

function saveSession(accessToken, refreshToken) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken || "");
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken || "");
}

function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  session = null;
}

async function loadSession() {
  const access = localStorage.getItem(ACCESS_TOKEN_KEY) || "";
  if (!access) {
    session = null;
    return;
  }
  try {
    const user = await requestJson(`${supabaseUrl}/auth/v1/user`, {
      headers: authHeaders(true, access),
    });
    session = { access_token: access, user };
  } catch (_) {
    clearSession();
  }
}

async function signUp(email, password) {
  const data = await requestJson(`${supabaseUrl}/auth/v1/signup`, {
    method: "POST",
    headers: authHeaders(false),
    body: JSON.stringify({ email, password }),
  });
  if (!data?.access_token) return { requiresEmailConfirm: true };
  saveSession(data.access_token, data.refresh_token);
  await loadSession();
  return { requiresEmailConfirm: false };
}

async function signIn(email, password) {
  const data = await requestJson(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: authHeaders(false),
      body: JSON.stringify({ email, password }),
    }
  );
  saveSession(data.access_token, data.refresh_token);
  await loadSession();
}

async function signOut() {
  try {
    await requestJson(`${supabaseUrl}/auth/v1/logout`, {
      method: "POST",
      headers: authHeaders(true),
    });
  } catch (_) {}
  clearSession();
}

async function fetchProfiles(params) {
  return requestJson(
    `${supabaseUrl}/rest/v1/profiles${params}`,
    { headers: authHeaders(true) }
  );
}

async function fetchWagers(params) {
  return requestJson(
    `${supabaseUrl}/rest/v1/wagers${params}`,
    { headers: authHeaders(true) }
  );
}

async function patchProfile(userId, payload) {
  return requestJson(
    `${supabaseUrl}/rest/v1/profiles?user_id=eq.${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: {
        ...authHeaders(true),
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    }
  );
}

async function insertWager(payload) {
  return requestJson(`${supabaseUrl}/rest/v1/wagers`, {
    method: "POST",
    headers: {
      ...authHeaders(true),
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });
}

async function patchWager(id, payload) {
  return requestJson(
    `${supabaseUrl}/rest/v1/wagers?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        ...authHeaders(true),
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    }
  );
}

async function loadWallet() {
  if (!session?.user?.id) {
    bankroll = 0;
    els.balance.textContent = "$0.00";
    return;
  }
  const rows = await fetchProfiles(
    `?select=bankroll&user_id=eq.${encodeURIComponent(session.user.id)}&limit=1`
  );
  const row = Array.isArray(rows) ? rows[0] : null;
  bankroll = Number(row?.bankroll || 0);
  els.balance.textContent = formatMoney(bankroll);
}

function gameStatus(game) {
  const key = buildGameKey(game.dateToken, game.team1, game.team2);
  if (finalMap.has(key)) return "final";
  if (liveMap.has(key)) return "live";
  return "upcoming";
}

function renderGames() {
  if (!els.games) return;
  if (getSeason() !== "c2s2") {
    els.games.innerHTML = `<div class="gm-empty">Wagers are available for C2S2 only.</div>`;
    return;
  }
  const openGames = games.filter((game) => gameStatus(game) !== "final");
  openGamesDisplayed = openGames;
  if (!openGames.length) {
    els.games.innerHTML = `<div class="gm-empty">No open games to wager on.</div>`;
    return;
  }
  els.games.innerHTML = openGames
    .map((game, idx) => {
      const status = gameStatus(game);
      const locked = status !== "upcoming";
      const team1OddsLabel = (game.team1Odds || "-110").trim();
      const team2OddsLabel = (game.team2Odds || "-110").trim();
      const spread1 = (game.team1Spread || "PK").trim();
      const spread2 = (game.team2Spread || "PK").trim();
      const spreadOdds1 = (game.team1SpreadOdds || "-110").trim();
      const spreadOdds2 = (game.team2SpreadOdds || "-110").trim();
      const spreadPick1 = `${game.team1} ${spread1} SPREAD (${spreadOdds1})`.trim();
      const spreadPick2 = `${game.team2} ${spread2} SPREAD (${spreadOdds2})`.trim();
      const mlLine = `
        <div class="wager-market">
          <div class="wager-line">Odds</div>
          <div class="wager-market-buttons">
            <button class="btn ${locked ? "ghost" : ""}" data-wager="${idx}" data-pick="${escapeHtml(game.team1)} ML (${escapeHtml(team1OddsLabel)})" ${locked ? "disabled" : ""}>
              ${escapeHtml(game.team1)} (${escapeHtml(team1OddsLabel)})
            </button>
            <button class="btn ${locked ? "ghost" : ""}" data-wager="${idx}" data-pick="${escapeHtml(game.team2)} ML (${escapeHtml(team2OddsLabel)})" ${locked ? "disabled" : ""}>
              ${escapeHtml(game.team2)} (${escapeHtml(team2OddsLabel)})
            </button>
          </div>
        </div>
      `;
      const spreadLine = `
        <div class="wager-market">
          <div class="wager-line">Spread</div>
          <div class="wager-market-buttons">
            <button class="btn ${locked ? "ghost" : ""}" data-wager="${idx}" data-pick="${escapeHtml(spreadPick1)}" ${locked ? "disabled" : ""}>
              ${escapeHtml(game.team1)} ${escapeHtml(spread1)} (${escapeHtml(spreadOdds1)})
            </button>
            <button class="btn ${locked ? "ghost" : ""}" data-wager="${idx}" data-pick="${escapeHtml(spreadPick2)}" ${locked ? "disabled" : ""}>
              ${escapeHtml(game.team2)} ${escapeHtml(spread2)} (${escapeHtml(spreadOdds2)})
            </button>
          </div>
        </div>
      `;
      return `
      <div class="wager-card">
        <div class="wager-title">${escapeHtml(game.dateToken)} • ${escapeHtml(game.team1)} vs ${escapeHtml(game.team2)}</div>
        <div class="wager-sub">${escapeHtml(game.gameType || "Regular Season")} • ${status.toUpperCase()}</div>
        <div class="wager-actions">
          <input id="stake-${idx}" class="input wager-stake" type="number" min="1" step="1" placeholder="Stake" ${locked ? "disabled" : ""} />
          <div class="wager-markets">
            ${mlLine}
            ${spreadLine}
          </div>
        </div>
      </div>`;
    })
    .join("");
}

async function placeWager(game, pickLabel, stake) {
  if (!session?.user?.id) throw new Error("Sign in first");
  const amount = Number(stake);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid stake");
  if (amount > bankroll) throw new Error("Insufficient bankroll");

  const game_key = buildGameKey(game.dateToken, game.team1, game.team2);
  const existing = await fetchWagers(
    `?select=id&user_id=eq.${encodeURIComponent(
      session.user.id
    )}&game_key=eq.${encodeURIComponent(game_key)}&limit=1`
  );
  if (Array.isArray(existing) && existing.length) {
    throw new Error("You already wagered this game");
  }

  await insertWager({
    user_id: session.user.id,
    game_key,
    game_date: game.dateToken,
    team_pick: String(pickLabel || "").trim(),
    stake: amount,
    status: "open",
    payout: 0,
  });

  const updated = bankroll - amount;
  await patchProfile(session.user.id, {
    bankroll: updated,
    updated_at: new Date().toISOString(),
  });
  bankroll = updated;
  els.balance.textContent = formatMoney(bankroll);
}

async function renderHistory() {
  if (!session?.user?.id) {
    els.history.innerHTML = `<div class="gm-empty">Sign in to view wager history.</div>`;
    return;
  }
  const rows = await fetchWagers(
    `?select=id,game_date,team_pick,stake,status,payout,created_at&user_id=eq.${encodeURIComponent(
      session.user.id
    )}&order=created_at.desc&limit=50`
  );
  const visibleRows = Array.isArray(rows) ? rows : [];
  if (!visibleRows.length) {
    els.history.innerHTML = `<div class="gm-empty">No wagers yet.</div>`;
    return;
  }
  els.history.innerHTML = visibleRows
    .map(
      (w) => {
        const projected = projectedProfit(w.stake, w.team_pick);
        const isOpen = String(w.status || "").toLowerCase() === "open";
        const isCashedOut =
          String(w.status || "").toLowerCase() === "closed" ||
          String(w.status || "").toLowerCase() === "cashed_out";
        const payoutLabel = "Potential";
        const payoutValue = isCashedOut ? Number(w.payout || 0) : isOpen ? projected : Number(w.payout || 0);
        const cashoutButton = isOpen && !isCashedOut
          ? `<button class="btn" data-cashout="${escapeHtml(String(w.id || ""))}" data-stake="${escapeHtml(String(w.stake || 0))}">Cashout 1:1</button>`
          : "";
        return `
      <div class="leader-row">
        <div class="leader-rank">•</div>
        <div>
          <div class="leader-name">${escapeHtml(w.game_date)} • ${escapeHtml(w.team_pick)}</div>
          <div class="leader-meta">
            <div class="leader-chip">Stake <span>${formatMoney(w.stake)}</span></div>
            <div class="leader-chip">Status <span>${isCashedOut ? "CLOSED" : escapeHtml(String(w.status || "").toUpperCase())}</span></div>
            <div class="leader-chip">${payoutLabel} <span>${formatMoney(payoutValue)}</span></div>
            ${cashoutButton}
          </div>
        </div>
      </div>`;
      }
    )
    .join("");
}

function wireAuth() {
  els.signUp.addEventListener("click", async () => {
    try {
      const email = cleanEmail(els.email.value);
      const password = String(els.password.value || "");
      if (!email || !password) throw new Error("Enter email and password.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Enter a valid email address.");
      }
      const signUpResult = await signUp(email, password);
      await refreshAll();
      if (signUpResult.requiresEmailConfirm) {
        setStatus("Account created. Check your email to confirm, then sign in.");
        notify("Account created. Check your email to confirm.");
      } else {
        setStatus("Sign up successful.");
        notify("Sign up successful.");
      }
    } catch (e) {
      setStatus(e.message, true);
      notify(`Sign up failed: ${e.message}`);
    }
  });

  els.signIn.addEventListener("click", async () => {
    try {
      const email = cleanEmail(els.email.value);
      const password = String(els.password.value || "");
      if (!email || !password) throw new Error("Enter email and password.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Enter a valid email address.");
      }
      await signIn(email, password);
      await refreshAll();
      setStatus("Signed in.");
      notify("Signed in.");
    } catch (e) {
      setStatus(e.message, true);
      notify(`Sign in failed: ${e.message}`);
    }
  });

  els.signOut.addEventListener("click", async () => {
    await signOut();
    await refreshAll();
    setStatus("Signed out.");
    notify("Signed out.");
  });
}

function wireWagerButtons() {
  els.games.addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-wager]");
    if (!btn) return;
    const idx = Number(btn.dataset.wager);
    const game = openGamesDisplayed[idx];
    if (!game) return;
    const stakeInput = document.getElementById(`stake-${idx}`);
    try {
      const pick = String(btn.dataset.pick || "").trim();
      const stake = Number(stakeInput?.value || 0);
      const oddsNumber = parseAmericanOdds(pick);
      const oddsLabel = Number.isFinite(oddsNumber) ? String(oddsNumber) : "-110";
      const payout = projectedProfit(stake, pick);
      const totalReturn = stake + payout;
      const confirmText =
        `Confirm wager?\n\n` +
        `Game: ${game.dateToken} • ${game.team1} vs ${game.team2}\n` +
        `Wager: ${pick}\n` +
        `Stake: ${formatMoney(stake)}\n` +
        `Odds Locked: ${oddsLabel}\n` +
        `Potential Payout: ${formatMoney(payout)}\n` +
        `Potential Total Return: ${formatMoney(totalReturn)}`;
      const approved = window.confirm(confirmText);
      if (!approved) return;

      await placeWager(game, pick, stakeInput.value);
      setStatus("Wager placed.");
      await renderHistory();
    } catch (e) {
      setStatus(e.message, true);
      notify(`Wager failed: ${e.message}`);
    }
  });
}

function wireCashoutButtons() {
  els.history.addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-cashout]");
    if (!btn) return;
    if (btn.disabled) return;
    const wagerId = String(btn.dataset.cashout || "").trim();
    const stake = Number(btn.dataset.stake || 0);
    if (!wagerId || !Number.isFinite(stake) || stake <= 0) return;
    if (!session?.user?.id) {
      setStatus("Sign in first", true);
      return;
    }
    const profit = 0;
    const bankrollCredit = stake;
    const approved = window.confirm(
      `Cashout this wager?\n\nStake: ${formatMoney(stake)}\nCashout Amount: ${formatMoney(bankrollCredit)}`
    );
    if (!approved) return;
    try {
      btn.disabled = true;
      const updated = await patchWager(wagerId, {
        payout: bankrollCredit,
        status: "closed",
      });
      if (!Array.isArray(updated) || !updated.length) {
        throw new Error("Cashout update did not apply (check DB policy).");
      }
      bankroll += bankrollCredit;
      await patchProfile(session.user.id, {
        bankroll,
        updated_at: new Date().toISOString(),
      });
      els.balance.textContent = formatMoney(bankroll);
      await renderHistory();
      setStatus("Wager cashed out.");
    } catch (e) {
      btn.disabled = false;
      setStatus(e.message || "Cashout failed.", true);
    }
  });
}

async function loadGames() {
  const [scheduleRes, liveRes, boxRes] = await Promise.all([
    fetch(SCHEDULE_CSV_URL, { cache: "no-store" }),
    fetch(LIVE_CSV_URL, { cache: "no-store" }),
    fetch(BOXSCORE_CSV_URL, { cache: "no-store" }),
  ]);
  if (!scheduleRes.ok) throw new Error(`Schedule load failed: ${scheduleRes.status}`);
  const scheduleRows = parseCSV(await scheduleRes.text());
  games = parseScheduleGames(scheduleRows);
  liveMap = liveRes.ok ? buildLiveMap(parseCSV(await liveRes.text())) : new Map();
  finalMap = boxRes.ok ? buildFinalMap(parseCSV(await boxRes.text())) : new Map();
  renderGames();
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

async function refreshAll() {
  await loadSession();
  if (session?.user?.email) {
    setStatus(`Signed in as ${session.user.email}`);
  } else {
    setStatus("Not signed in.");
  }
  await loadWallet();
  await renderHistory();
}

async function boot() {
  initSeasonSelect();
  setStatus(`Loading wagers v${WAGERS_VERSION}...`);
  await getConfig();
  wireAuth();
  wireWagerButtons();
  wireCashoutButtons();
  await loadGames();
  await refreshAll();
  updateLastUpdated();
  setInterval(async () => {
    await loadGames();
    await refreshAll();
    updateLastUpdated();
  }, 60 * 1000);
}

boot().catch((error) => {
  setStatus(error.message || "Failed to load wagers page.", true);
  notify(error.message || "Failed to load wagers page.");
});
