import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://wbbkjikdxpywfeyenbhs.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_P_4Gvh9rXEUrHS_-VZu6uw_As3f4CK3";
const SHEET_UPDATE_URL =
  "https://script.google.com/macros/s/AKfycbybgKT1WjHN7G13XiymsMNM6eO_sOtfchPsWGJfPZwLvEFJ6_QsYJ9pBt7jNWTkM9msXA/exec";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const els = {
  lastUpdated: document.getElementById("last-updated"),
  email: document.getElementById("gm-email"),
  password: document.getElementById("gm-password"),
  team: document.getElementById("gm-team"),
  login: document.getElementById("gm-login"),
  signup: document.getElementById("gm-signup"),
  logout: document.getElementById("gm-logout"),
  status: document.getElementById("gm-status"),
  panel: document.getElementById("gm-panel"),
  playerTag: document.getElementById("player-tag"),
  suggestions: document.getElementById("player-suggestions"),
  displayName: document.getElementById("display-name"),
  update: document.getElementById("update-player"),
  result: document.getElementById("gm-result"),
  teamSelect: document.getElementById("team-select"),
  teamPlayers: document.getElementById("team-players"),
  tabs: document.querySelectorAll(".gm-tab"),
  tabPanels: document.querySelectorAll(".gm-tab-panel"),
  gmTeamLabel: document.getElementById("gm-team-label"),
  tradePicksList: document.getElementById("trade-picks-list"),
  tradeNotes: document.getElementById("trade-notes"),
  tradeSave: document.getElementById("trade-save"),
  tradeStatus: document.getElementById("trade-status"),
  tradePlayerList: document.getElementById("trade-player-list"),
  tradeViewList: document.getElementById("trade-view-list"),
  pickSelect: document.getElementById("pick-select"),
  pickTeamSelect: document.getElementById("pick-team-select"),
  pickUpdate: document.getElementById("pick-update"),
  pickStatus: document.getElementById("pick-status"),
  pickList: document.getElementById("pick-list"),
  commishTab: document.getElementById("commish-tab"),
  commishTradesTab: document.getElementById("commish-trades-tab"),
  tradePlayerSelect: document.getElementById("trade-player-select"),
  tradePlayerTeam: document.getElementById("trade-player-team"),
  tradePlayerUpdate: document.getElementById("trade-player-update"),
  tradePlayerStatus: document.getElementById("trade-player-status"),
  tradePlayerAdminList: document.getElementById("trade-player-admin-list"),
};

let playersCache = [];
let picksCache = [];
let gmTeam = "";
let gmUserId = "";

const TEAM_NAMES = [
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

const COMMISSIONER_ID = "610f64e4-a439-44cb-ab92-386f9f728563";

function normalizeTeam(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "");
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

function setStatus(message, isError = false) {
  els.status.textContent = message;
  els.status.className = `gm-status ${isError ? "error" : ""}`;
}

function setResult(message, isError = false) {
  if (!els.result) {
    return;
  }
  els.result.textContent = message;
  els.result.className = `gm-status ${isError ? "error" : ""}`;
}

function setTradeStatus(message, isError = false) {
  els.tradeStatus.textContent = message;
  els.tradeStatus.className = `gm-status ${isError ? "error" : ""}`;
}

function setPickStatus(message, isError = false) {
  els.pickStatus.textContent = message;
  els.pickStatus.className = `gm-status ${isError ? "error" : ""}`;
}

function setTradePlayerStatus(message, isError = false) {
  els.tradePlayerStatus.textContent = message;
  els.tradePlayerStatus.className = `gm-status ${isError ? "error" : ""}`;
}

async function refreshSession() {
  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  if (session) {
    gmUserId = session.user.id;
    els.panel.hidden = false;
    els.logout.hidden = false;
    setStatus(`Signed in as ${session.user.email}`);
    await loadPlayers();
    await loadPicks();
    await loadGmTeam();
    await loadOwnTradeBlock();
    await loadOtherTradeBlocks();
    renderPickManager();
    renderTradePlayerManager();
    toggleCommissionerTools();
  } else {
    gmUserId = "";
    gmTeam = "";
    els.panel.hidden = true;
    els.logout.hidden = true;
    setStatus("Not signed in.");
  }
}

async function loadGmTeam() {
  if (!gmUserId) {
    return;
  }
  const { data, error } = await supabase
    .from("gm_users")
    .select("team_name")
    .eq("user_id", gmUserId);
  if (error) {
    return;
  }
  const row = Array.isArray(data) ? data.find((r) => r?.team_name) : null;
  gmTeam = row?.team_name || "";
  if (els.gmTeamLabel) {
    els.gmTeamLabel.textContent = gmTeam || "—";
  }
  if (!gmTeam) {
    setTradeStatus("No team assigned to this GM account.", true);
  }
}

function toggleCommissionerTools() {
  const isCommish = gmUserId === COMMISSIONER_ID;
  if (els.commishTab) {
    els.commishTab.hidden = !isCommish;
  }
  if (els.commishTradesTab) {
    els.commishTradesTab.hidden = !isCommish;
  }
  if (!isCommish) {
    els.tabs.forEach((btn) => btn.classList.remove("active"));
    const tradeTab = Array.from(els.tabs).find(
      (btn) => btn.dataset.tab === "trade"
    );
    if (tradeTab) {
      tradeTab.classList.add("active");
    }
    els.tabPanels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== "trade";
    });
  }
}

els.login.addEventListener("click", async () => {
  setStatus("Signing in...");
  const { error } = await supabase.auth.signInWithPassword({
    email: els.email.value.trim(),
    password: els.password.value,
  });
  if (error) {
    setStatus(error.message, true);
    return;
  }
  await refreshSession();
});

els.signup.addEventListener("click", async () => {
  const team = els.team.value.trim();
  if (!team) {
    setStatus("Select your team before signing up.", true);
    return;
  }
  setStatus("Creating account...");
  const { data, error } = await supabase.auth.signUp({
    email: els.email.value.trim(),
    password: els.password.value,
  });
  if (error) {
    setStatus(error.message, true);
    return;
  }
  const user = data?.user;
  if (user) {
    await supabase.from("gm_users").insert({
      user_id: user.id,
      is_gm: true,
      team_name: team,
    });
  }
  setStatus("Account created. Check email if confirmation is required.");
});

els.logout.addEventListener("click", async () => {
  await supabase.auth.signOut();
  await refreshSession();
});

if (els.update) {
  els.update.addEventListener("click", async () => {
  let playerTag = els.playerTag.value.trim();
  const displayName = els.displayName.value.trim();
  if (!playerTag || !displayName) {
    setResult("Enter current tag and new display name.", true);
    return;
  }
  const rawTag = playerTag;
  const normalized = playerTag.replace(/^@/, "");
  const withAt = normalized ? `@${normalized}` : "";
  const variants = [rawTag, withAt, normalized].filter(Boolean);
  const variantsLower = variants.map((v) => String(v).toLowerCase());
  // Resolve the exact current tag before update so sheet sync uses the
  // original value, even after Supabase changes player_tag.
  const preUpdateMatch = playersCache.find((player) => {
    const tag = String(player.player_tag || "");
    const clean = tag.replace(/^@/, "");
    const tagLower = tag.toLowerCase();
    const cleanLower = clean.toLowerCase();
    const nameLower = String(player.display_name || "").toLowerCase();
    const queryLower = rawTag.toLowerCase();
    return (
      variantsLower.includes(tagLower) ||
      variantsLower.includes(cleanLower) ||
      variantsLower.includes(`@${cleanLower}`) ||
      nameLower === queryLower
    );
  });
  if (!preUpdateMatch?.id || !preUpdateMatch?.player_tag) {
    setResult("Player not found. Select from the team list, then update.", true);
    return;
  }
  const oldTagForSheet = preUpdateMatch.player_tag;
  let newPlayerTag = displayName.trim();
  if (!newPlayerTag.startsWith("@")) {
    newPlayerTag = `@${newPlayerTag}`;
  }
  setResult("Updating...");
  const { error } = await supabase
    .from("players")
    .update({
      player_tag: newPlayerTag,
      display_name: displayName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", preUpdateMatch.id)
    .select();

  if (error) {
    setResult(error.message, true);
    return;
  }

  setResult("Player updated. Syncing sheet...");
  await loadPlayers();
  renderTradePlayerManager();
  if (SHEET_UPDATE_URL !== "REPLACE_WITH_APPS_SCRIPT_URL") {
    const tagVariants = Array.from(
      new Set([oldTagForSheet, rawTag, withAt, normalized].filter(Boolean))
    );

    const trySync = async (oldTag) => {
      const params = new URLSearchParams({
        oldTag,
        newTag: newPlayerTag,
        newDisplay: displayName,
      });
      const response = await fetch(`${SHEET_UPDATE_URL}?${params.toString()}`);
      const text = await response.text();
      if (!response.ok) {
        return { ok: false, status: response.status, text };
      }
      try {
        const json = JSON.parse(text);
        return { ok: true, json };
      } catch (error) {
        return { ok: false, status: response.status, text };
      }
    };

    try {
      let synced = false;
      let lastError = "";

      for (const variant of tagVariants) {
        const result = await trySync(variant);
        if (!result.ok) {
          lastError = result.text || `HTTP ${result.status}`;
          continue;
        }
        const payload = result.json || {};
        if (payload.ok && payload.updated) {
          synced = true;
          break;
        }
        lastError =
          payload && payload.updated === false
            ? "Player updated, but sheet did not find the tag."
            : "Sheet update failed.";
      }

      if (synced) {
        setResult("Player updated. Sheet synced.");
      } else {
        setResult(lastError || "Sheet update failed.", true);
      }
    } catch (error) {
      setResult(`Sheet update failed: ${error.message}`, true);
    }
  }
  });
}

function renderSuggestions(list) {
  if (!els.suggestions) {
    return;
  }
  if (!list.length) {
    els.suggestions.innerHTML = "<div class=\"gm-suggestion-empty\">No players found.</div>";
    return;
  }
  els.suggestions.innerHTML = list
    .map(
      (player) => `
        <button class="gm-suggestion" data-tag="${player.player_tag || ""}" data-name="${player.display_name || ""}">
          <span>${player.player_tag || "—"}</span>
          <span>${player.display_name || ""}</span>
        </button>
      `
    )
    .join("");
}

async function loadPlayers() {
  const { data, error } = await supabase
    .from("players")
    .select("id, player_tag, display_name, team_name")
    .order("player_tag", { ascending: true });
  if (error) {
    setStatus(error.message, true);
    return;
  }
  playersCache = data || [];
}

async function loadPicks() {
  const { data, error } = await supabase
    .from("draft_picks")
    .select("id, label, current_team, original_team")
    .order("label", { ascending: true });
  if (error) {
    return;
  }
  picksCache = data || [];
}

function renderPickManager() {
  if (!els.pickSelect || !els.pickList) {
    return;
  }
  els.pickSelect.innerHTML = picksCache
    .map((pick) => {
      const via =
        pick.original_team && pick.original_team !== pick.current_team
          ? ` via ${pick.original_team}`
          : "";
      return `<option value="${pick.id}">${pick.label}${via} (${pick.current_team})</option>`;
    })
    .join("");
  els.pickList.innerHTML = picksCache
    .map((pick) => {
      const via =
        pick.original_team && pick.original_team !== pick.current_team
          ? ` via ${pick.original_team}`
          : "";
      return `
        <div class="gm-readonly-card">
          <div class="gm-readonly-title">${pick.label}${via}</div>
          <div class="gm-readonly-group">
            <div class="label">Current Team</div>
            <div>${pick.current_team}</div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderTradePlayerManager() {
  if (!els.tradePlayerSelect || !els.tradePlayerAdminList) {
    return;
  }
  els.tradePlayerSelect.innerHTML = playersCache
    .map(
      (player) =>
        `<option value="${player.player_tag}">${player.player_tag} (${player.team_name || ""})</option>`
    )
    .join("");
  els.tradePlayerAdminList.innerHTML = playersCache
    .map(
      (player) => `
        <div class="gm-readonly-card">
          <div class="gm-readonly-title">${player.player_tag}</div>
          <div class="gm-readonly-group">
            <div class="label">Team</div>
            <div>${player.team_name || ""}</div>
          </div>
        </div>
      `
    )
    .join("");
}

if (els.tradePlayerUpdate) {
  els.tradePlayerUpdate.addEventListener("click", async () => {
    if (gmUserId !== COMMISSIONER_ID) {
      setTradePlayerStatus("Commissioner only.", true);
      return;
    }
    const playerTag = els.tradePlayerSelect.value;
    const newTeam = els.tradePlayerTeam.value;
    if (!playerTag || !newTeam) {
      setTradePlayerStatus("Select a player and team.", true);
      return;
    }
    setTradePlayerStatus("Updating...");
    const { error } = await supabase
      .from("players")
      .update({ team_name: newTeam, updated_at: new Date().toISOString() })
      .eq("player_tag", playerTag);
    if (error) {
      setTradePlayerStatus(error.message, true);
      return;
    }
    setTradePlayerStatus("Player updated.");
    await loadPlayers();
    renderTradePlayerManager();
    await loadOtherTradeBlocks();
  });
}

if (els.pickUpdate) {
  els.pickUpdate.addEventListener("click", async () => {
    if (gmUserId !== COMMISSIONER_ID) {
      setPickStatus("Commissioner only.", true);
      return;
    }
    const pickId = els.pickSelect.value;
    const newTeam = els.pickTeamSelect.value;
    if (!pickId || !newTeam) {
      setPickStatus("Select a pick and a team.", true);
      return;
    }
    setPickStatus("Updating...");
    const { error } = await supabase
      .from("draft_picks")
      .update({ current_team: newTeam })
      .eq("id", pickId);
    if (error) {
      setPickStatus(error.message, true);
      return;
    }
    setPickStatus("Pick updated.");
    await loadPicks();
    renderPickManager();
    await loadOtherTradeBlocks();
  });
}

if (els.playerTag) {
  els.playerTag.addEventListener("input", () => {
    const query = els.playerTag.value.trim().toLowerCase();
    if (!query) {
      if (els.suggestions) {
        els.suggestions.innerHTML = "";
      }
      return;
    }
    const filtered = playersCache.filter((player) => {
      const tag = String(player.player_tag || "").toLowerCase();
      const name = String(player.display_name || "").toLowerCase();
      return tag.includes(query) || name.includes(query);
    });
    renderSuggestions(filtered.slice(0, 8));
  });
}

if (els.suggestions) {
  els.suggestions.addEventListener("click", (event) => {
    const item = event.target.closest(".gm-suggestion");
    if (!item) {
      return;
    }
    const tag = item.dataset.tag || "";
    const name = item.dataset.name || "";
    els.playerTag.value = tag;
    if (!els.displayName.value) {
      els.displayName.value = name;
    }
    renderSuggestions([]);
  });
}

function renderTeamPlayers(list) {
  if (!els.teamPlayers) {
    return;
  }
  if (!list.length) {
    els.teamPlayers.innerHTML = "<div class=\"gm-empty\">No players found.</div>";
    return;
  }
  els.teamPlayers.innerHTML = list
    .map(
      (player) => `
        <button class="gm-list-item" data-tag="${player.player_tag || ""}" data-name="${player.display_name || ""}">
          <span>${player.player_tag || "—"}</span>
          <span>${player.display_name || ""}</span>
        </button>
      `
    )
    .join("");
}

if (els.teamSelect) {
  els.teamSelect.addEventListener("change", () => {
    const team = els.teamSelect.value;
    if (!team) {
      renderTeamPlayers([]);
      return;
    }
    const target = normalizeTeam(team);
    const filtered = playersCache.filter(
      (player) => normalizeTeam(player.team_name) === target
    );
    renderTeamPlayers(filtered);
  });
}

if (els.teamPlayers) {
  els.teamPlayers.addEventListener("click", (event) => {
    const item = event.target.closest(".gm-list-item");
    if (!item) {
      return;
    }
    const tag = item.dataset.tag || "";
    const name = item.dataset.name || "";
    els.playerTag.value = tag;
    els.displayName.value = name;
  });
}

els.tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    els.tabs.forEach((btn) => btn.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.dataset.tab;
    els.tabPanels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== target;
    });
  });
});

function renderTradePlayersList(team, selectedPlayers) {
  if (!els.tradePlayerList) {
    return;
  }
  if (!team) {
    els.tradePlayerList.innerHTML = "<div class=\"gm-empty\">No players found.</div>";
    return;
  }
  const target = normalizeTeam(team);
  const list = playersCache.filter(
    (player) => normalizeTeam(player.team_name) === target
  );
  if (!list.length) {
    els.tradePlayerList.innerHTML = "<div class=\"gm-empty\">No players found.</div>";
    return;
  }
  const selected = new Set(selectedPlayers || []);
  els.tradePlayerList.innerHTML = list
    .map((player) => {
      const tag = player.player_tag || "";
      const checked = selected.has(tag) ? "checked" : "";
      return `
        <label class="gm-check">
          <input type="checkbox" value="${tag}" ${checked} />
          <span>${tag}</span>
        </label>
      `;
    })
    .join("");
}

function renderTradePicksList(team, selectedPicks) {
  if (!els.tradePicksList) {
    return;
  }
  if (!team) {
    els.tradePicksList.innerHTML = "<div class=\"gm-empty\">No picks found.</div>";
    return;
  }
  const list = picksCache.filter(
    (pick) => String(pick.current_team || "") === team
  );
  if (!list.length) {
    els.tradePicksList.innerHTML = "<div class=\"gm-empty\">No picks found.</div>";
    return;
  }
  const selected = new Set(selectedPicks || []);
  els.tradePicksList.innerHTML = list
    .map((pick) => {
      const checked = selected.has(pick.id) ? "checked" : "";
      const via =
        pick.original_team && pick.original_team !== pick.current_team
          ? ` via ${pick.original_team}`
          : "";
      return `
        <label class="gm-check">
          <input type="checkbox" value="${pick.id}" ${checked} />
          <span>${pick.label}${via}</span>
        </label>
      `;
    })
    .join("");
}

async function loadOwnTradeBlock() {
  if (!gmTeam) {
    return;
  }
  const { data, error } = await supabase
    .from("trade_blocks")
    .select("players, picks, notes")
    .eq("team_name", gmTeam)
    .single();
  if (error || !data) {
    renderTradePlayersList(gmTeam, []);
    renderTradePicksList(gmTeam, []);
    els.tradeNotes.value = "";
    setTradeStatus("No trade block available.");
    return;
  }
  const selectedPlayers = String(data?.players || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const selectedPicks = String(data?.picks || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  renderTradePlayersList(gmTeam, selectedPlayers);
  renderTradePicksList(gmTeam, selectedPicks);
  els.tradeNotes.value = data?.notes || "";
  setTradeStatus("");
}

async function loadOtherTradeBlocks() {
  if (!els.tradeViewList) {
    return;
  }
  const teams = TEAM_NAMES.filter((team) => team !== gmTeam);
  if (!teams.length) {
    els.tradeViewList.innerHTML = "<div class=\"gm-empty\">No other teams.</div>";
    return;
  }
  const { data, error } = await supabase
    .from("trade_blocks")
    .select("team_name, players, picks, notes")
    .in("team_name", teams);
  if (error) {
    els.tradeViewList.innerHTML = "<div class=\"gm-empty\">Unable to load trade blocks.</div>";
    return;
  }
  const byTeam = new Map((data || []).map((row) => [row.team_name, row]));
  els.tradeViewList.innerHTML = teams
    .map((team) => {
      const block = byTeam.get(team);
      if (!block) {
        return `
          <div class="gm-readonly-card">
            <div class="gm-readonly-title">${team}</div>
            <div class="gm-empty">No trade block available.</div>
          </div>
        `;
      }
      const players = String(block.players || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const picks = String(block.picks || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const pickLabels = picks.map((pickId) => {
        const match = picksCache.find((pick) => pick.id === pickId);
        if (!match) {
          return pickId;
        }
        const via =
          match.original_team && match.original_team !== match.current_team
            ? ` via ${match.original_team}`
            : "";
        return `${match.label}${via}`;
      });
      const notes = String(block.notes || "").trim();
      return `
        <div class="gm-readonly-card">
          <div class="gm-readonly-title">${team}</div>
          <div class="gm-readonly-group">
            <div class="label">Players</div>
            <div>${players.length ? players.join(", ") : "No trade block available."}</div>
          </div>
          <div class="gm-readonly-group">
            <div class="label">Picks</div>
            <div>${pickLabels.length ? pickLabels.join(", ") : "No trade block available."}</div>
          </div>
          <div class="gm-readonly-group">
            <div class="label">Notes</div>
            <div>${notes || "No trade block available."}</div>
          </div>
        </div>
      `;
    })
    .join("");
}

if (els.tradeSave) {
  els.tradeSave.addEventListener("click", async () => {
    if (!gmTeam) {
      setTradeStatus("No GM team assigned.", true);
      return;
    }
    setTradeStatus("Saving...");
    const selectedPlayers = Array.from(
      els.tradePlayerList.querySelectorAll("input[type=checkbox]:checked")
    ).map((input) => input.value);
    const selectedPicks = Array.from(
      els.tradePicksList.querySelectorAll("input[type=checkbox]:checked")
    ).map((input) => input.value);
    const payload = {
      team_name: gmTeam,
      players: selectedPlayers.join("\n"),
      picks: selectedPicks.join("\n"),
      notes: els.tradeNotes.value.trim(),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("trade_blocks").upsert(payload, {
      onConflict: "team_name",
    });
    if (error) {
      setTradeStatus(error.message, true);
      return;
    }
    setTradeStatus("Trade block saved.");
    await loadOtherTradeBlocks();
  });
}

updateLastUpdated();
refreshSession();
