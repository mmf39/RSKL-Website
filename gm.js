import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://wbbkjikdxpywfeyenbhs.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_P_4Gvh9rXEUrHS_-VZu6uw_As3f4CK3";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const els = {
  lastUpdated: document.getElementById("last-updated"),
  email: document.getElementById("gm-email"),
  password: document.getElementById("gm-password"),
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
};

let playersCache = [];

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

async function refreshSession() {
  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  if (session) {
    els.panel.hidden = false;
    els.logout.hidden = false;
    setStatus(`Signed in as ${session.user.email}`);
    loadPlayers();
  } else {
    els.panel.hidden = true;
    els.logout.hidden = true;
    setStatus("Not signed in.");
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
  setStatus("Creating account...");
  const { error } = await supabase.auth.signUp({
    email: els.email.value.trim(),
    password: els.password.value,
  });
  if (error) {
    setStatus(error.message, true);
    return;
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

updateLastUpdated();
refreshSession();
