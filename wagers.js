const SCHEDULE_CSV_URL = "/api/sheet?name=schedule";
const LIVE_CSV_URL = "/api/sheet?name=live-scoring";
const BOXSCORE_CSV_URL = "/api/sheet?name=boxscore";
const CONFIG_URL = "/api/supabase-config";
const SEASON_KEY = "season";
const C2S2_SCHEDULE_RANGE = "A2:E77";

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

let supabase = null;
let session = null;
let bankroll = 0;
let games = [];
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
  let current = null;
  rows.forEach((row) => {
    const left = String(row[0] || "").trim();
    const right = String(row[4] || "").trim();
    const isHeader =
      left &&
      right &&
      !left.startsWith("@") &&
      !right.startsWith("@") &&
      (/\(\s*-?\d+\s*\)/.test(left) || /\(\s*-?\d+\s*\)/.test(right));
    if (isHeader) {
      current = { left, right };
      const t1 = parseTeamHeader(left);
      const t2 = parseTeamHeader(right);
      if (t1.name && t2.name) {
        map.set(buildGameKey(day, t1.name, t2.name), true);
        map.set(buildGameKey(day, t2.name, t1.name), true);
      }
    }
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
  const table = [["Date", "Team 1", "Team 2", "Info", "Game Type"], ...sliceRange(rows, C2S2_SCHEDULE_RANGE)];
  return table
    .slice(1)
    .map((row) => {
      const dateToken = normalizeDateToken(row[0]);
      const team1 = displayTeamName(row[1]);
      const team2 = displayTeamName(row[2]);
      const gameType = String(row[4] || "");
      if (!dateToken || !team1 || !team2) return null;
      return { dateToken, team1, team2, gameType };
    })
    .filter(Boolean);
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function setStatus(msg, isError = false) {
  if (!els.status) return;
  els.status.textContent = msg;
  els.status.style.color = isError ? "#ff9ca3" : "";
}

function notify(msg) {
  try {
    window.alert(msg);
  } catch (_) {
    // no-op
  }
}

async function getConfig() {
  const res = await fetch(CONFIG_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load Supabase config");
  const json = await res.json();
  if (!json.ok) throw new Error(json.message || "Invalid Supabase config");
  return json;
}

async function loadSession() {
  const { data } = await supabase.auth.getSession();
  session = data.session || null;
}

async function loadWallet() {
  if (!session) {
    bankroll = 0;
    els.balance.textContent = "$0.00";
    return;
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("bankroll")
    .eq("user_id", session.user.id)
    .single();
  if (error) throw error;
  bankroll = Number(data.bankroll || 0);
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
  els.games.innerHTML = games
    .map((game, idx) => {
      const status = gameStatus(game);
      const locked = status !== "upcoming";
      return `
      <div class="wager-card">
        <div class="wager-title">${escapeHtml(game.dateToken)} • ${escapeHtml(game.team1)} vs ${escapeHtml(game.team2)}</div>
        <div class="wager-sub">${escapeHtml(game.gameType || "Regular Season")} • ${status.toUpperCase()}</div>
        <div class="wager-actions">
          <input id="stake-${idx}" class="input wager-stake" type="number" min="1" step="1" placeholder="Stake" ${locked ? "disabled" : ""} />
          <button class="btn ${locked ? "ghost" : ""}" data-wager="${idx}" data-team="${escapeHtml(game.team1)}" ${locked ? "disabled" : ""}>Pick ${escapeHtml(game.team1)}</button>
          <button class="btn ${locked ? "ghost" : ""}" data-wager="${idx}" data-team="${escapeHtml(game.team2)}" ${locked ? "disabled" : ""}>Pick ${escapeHtml(game.team2)}</button>
        </div>
      </div>`;
    })
    .join("");
}

async function placeWager(game, teamPick, stake) {
  if (!session) throw new Error("Sign in first");
  const amount = Number(stake);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid stake");
  if (amount > bankroll) throw new Error("Insufficient bankroll");

  const game_key = buildGameKey(game.dateToken, game.team1, game.team2);
  const team_pick = displayTeamName(teamPick);

  const existing = await supabase
    .from("wagers")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("game_key", game_key)
    .maybeSingle();
  if (existing.data) throw new Error("You already wagered this game");

  const newBankroll = bankroll - amount;
  const update = await supabase
    .from("profiles")
    .update({ bankroll: newBankroll, updated_at: new Date().toISOString() })
    .eq("user_id", session.user.id)
    .eq("bankroll", bankroll)
    .select("user_id");
  if (update.error || !update.data || !update.data.length) {
    throw new Error("Bankroll update failed. Try again.");
  }

  const inserted = await supabase.from("wagers").insert({
    user_id: session.user.id,
    game_key,
    game_date: game.dateToken,
    team_pick,
    stake: amount,
    status: "open",
    payout: 0,
  });
  if (inserted.error) {
    await supabase
      .from("profiles")
      .update({ bankroll, updated_at: new Date().toISOString() })
      .eq("user_id", session.user.id);
    throw inserted.error;
  }

  bankroll = newBankroll;
  els.balance.textContent = formatMoney(bankroll);
}

async function renderHistory() {
  if (!session) {
    els.history.innerHTML = `<div class="gm-empty">Sign in to view wager history.</div>`;
    return;
  }
  const { data, error } = await supabase
    .from("wagers")
    .select("game_date,team_pick,stake,status,payout,created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    els.history.innerHTML = `<div class="gm-empty">${escapeHtml(error.message)}</div>`;
    return;
  }
  if (!data || !data.length) {
    els.history.innerHTML = `<div class="gm-empty">No wagers yet.</div>`;
    return;
  }
  els.history.innerHTML = data
    .map(
      (w) => `
      <div class="leader-row">
        <div class="leader-rank">•</div>
        <div>
          <div class="leader-name">${escapeHtml(w.game_date)} • ${escapeHtml(w.team_pick)}</div>
          <div class="leader-meta">
            <div class="leader-chip">Stake <span>${formatMoney(w.stake)}</span></div>
            <div class="leader-chip">Status <span>${escapeHtml(String(w.status || "").toUpperCase())}</span></div>
            <div class="leader-chip">Payout <span>${formatMoney(w.payout || 0)}</span></div>
          </div>
        </div>
      </div>
    `
    )
    .join("");
}

function wireAuth() {
  els.signUp.addEventListener("click", async () => {
    try {
      const email = String(els.email.value || "").trim();
      const password = String(els.password.value || "");
      if (!email || !password) {
        throw new Error("Enter email and password.");
      }
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setStatus("Sign up successful. Check your email if confirmation is required.");
      notify("Sign up request sent.");
    } catch (e) {
      setStatus(e.message, true);
      notify(`Sign up failed: ${e.message}`);
    }
  });

  els.signIn.addEventListener("click", async () => {
    try {
      const email = String(els.email.value || "").trim();
      const password = String(els.password.value || "");
      if (!email || !password) {
        throw new Error("Enter email and password.");
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await refreshAll();
      setStatus("Signed in.");
      notify("Signed in.");
    } catch (e) {
      setStatus(e.message, true);
      notify(`Sign in failed: ${e.message}`);
    }
  });

  els.signOut.addEventListener("click", async () => {
    await supabase.auth.signOut();
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
    const game = games[idx];
    if (!game) return;
    const stakeInput = document.getElementById(`stake-${idx}`);
    try {
      await placeWager(game, btn.dataset.team, stakeInput.value);
      setStatus("Wager placed.");
      await renderHistory();
    } catch (e) {
      setStatus(e.message, true);
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
  const cfg = await getConfig();
  supabase = window.supabase.createClient(cfg.url, cfg.anonKey);
  wireAuth();
  wireWagerButtons();
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
