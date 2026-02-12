import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://wbbkjikdxpywfeyenbhs.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_P_4Gvh9rXEUrHS_-VZu6uw_As3f4CK3";

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
  tradeView: document.getElementById("trade-view"),
  tradePlayers: document.getElementById("trade-players"),
  tradePicks: document.getElementById("trade-picks"),
  tradeNotes: document.getElementById("trade-notes"),
  tradeSave: document.getElementById("trade-save"),
  tradeStatus: document.getElementById("trade-status"),
  tradePlayerList: document.getElementById("trade-player-list"),
};

let playersCache = [];
let gmTeam = "";
let gmUserId = "";

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
  els.result.textContent = message;
  els.result.className = `gm-status ${isError ? "error" : ""}`;
}

function setTradeStatus(message, isError = false) {
  els.tradeStatus.textContent = message;
  els.tradeStatus.className = `gm-status ${isError ? "error" : ""}`;
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
    await loadGmTeam();
    setupTradeTeamView();
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
    .eq("user_id", gmUserId)
    .single();
  if (error) {
    return;
  }
  gmTeam = data?.team_name || "";
  if (els.gmTeamLabel) {
    els.gmTeamLabel.textContent = gmTeam || "—";
  }
}

function setupTradeTeamView() {
  if (!els.tradeView) {
    return;
  }
  if (gmTeam) {
    els.tradeView.value = gmTeam;
    loadTradeBlock(gmTeam);
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
  let newPlayerTag = displayName.trim();
  if (!newPlayerTag.startsWith("@")) {
    newPlayerTag = `@${newPlayerTag}`;
  }
  setResult("Updating...");
  const orQuery = variants
    .map((tag) => `player_tag.ilike.*${tag}*`)
    .join(",");
  const { error, data } = await supabase
    .from("players")
    .update({
      player_tag: newPlayerTag,
      display_name: displayName,
      updated_at: new Date().toISOString(),
    })
    .or(orQuery)
    .select();

  if (error) {
    setResult(error.message, true);
    return;
  }
  if (data && data.length) {
    setResult("Player updated.");
    await loadPlayers();
    return;
  }
  setResult("No matching player tag found. Use the exact tag from Supabase.", true);
});

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
    .select("player_tag, display_name, team_name")
    .order("player_tag", { ascending: true });
  if (error) {
    setStatus(error.message, true);
    return;
  }
  playersCache = data || [];
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
    const filtered = playersCache.filter(
      (player) => String(player.team_name || "") === team
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

function renderTradePlayersList(team) {
  if (!els.tradePlayerList) {
    return;
  }
  if (!team) {
    els.tradePlayerList.innerHTML = "<div class=\"gm-empty\">Select a team.</div>";
    return;
  }
  const list = playersCache.filter(
    (player) => String(player.team_name || "") === team
  );
  if (!list.length) {
    els.tradePlayerList.innerHTML = "<div class=\"gm-empty\">No players found.</div>";
    return;
  }
  const selected = new Set(
    els.tradePlayers.value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
  );
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

if (els.tradePlayerList) {
  els.tradePlayerList.addEventListener("change", () => {
    const selected = Array.from(
      els.tradePlayerList.querySelectorAll("input[type=checkbox]:checked")
    ).map((input) => input.value);
    els.tradePlayers.value = selected.join("\n");
  });
}

async function loadTradeBlock(team) {
  if (!team) {
    els.tradePlayers.value = "";
    els.tradePicks.value = "";
    els.tradeNotes.value = "";
    renderTradePlayersList("");
    return;
  }
  const { data, error } = await supabase
    .from("trade_blocks")
    .select("players, picks, notes")
    .eq("team_name", team)
    .single();
  if (error) {
    els.tradePlayers.value = "";
    els.tradePicks.value = "";
    els.tradeNotes.value = "";
    renderTradePlayersList(team);
    return;
  }
  els.tradePlayers.value = data?.players || "";
  els.tradePicks.value = data?.picks || "";
  els.tradeNotes.value = data?.notes || "";
  renderTradePlayersList(team);
}

if (els.tradeView) {
  els.tradeView.addEventListener("change", () => {
    const team = els.tradeView.value;
    loadTradeBlock(team);
  });
}

if (els.tradeSave) {
  els.tradeSave.addEventListener("click", async () => {
    if (!gmTeam) {
      setTradeStatus("No GM team assigned.", true);
      return;
    }
    setTradeStatus("Saving...");
    const payload = {
      team_name: gmTeam,
      players: els.tradePlayers.value.trim(),
      picks: els.tradePicks.value.trim(),
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
  });
}

updateLastUpdated();
refreshSession();
