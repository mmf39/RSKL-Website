import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "REPLACE_WITH_SUPABASE_URL";
const SUPABASE_ANON_KEY = "REPLACE_WITH_SUPABASE_ANON_KEY";

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
  displayName: document.getElementById("display-name"),
  update: document.getElementById("update-player"),
  result: document.getElementById("gm-result"),
};

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
  const playerTag = els.playerTag.value.trim();
  const displayName = els.displayName.value.trim();
  if (!playerTag || !displayName) {
    setResult("Enter player tag and new display name.", true);
    return;
  }
  setResult("Updating...");
  const { error } = await supabase
    .from("players")
    .update({ display_name: displayName, updated_at: new Date().toISOString() })
    .eq("player_tag", playerTag);

  if (error) {
    setResult(error.message, true);
    return;
  }
  setResult("Player updated.");
});

updateLastUpdated();
refreshSession();
