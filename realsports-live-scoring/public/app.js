const STORAGE_KEY = "realsportsLiveScoringConfig";

const DEFAULT_CONFIG = {
  apiBase: "https://api.realsports.io",
  pathTemplate: "/v1/players/{id}/stats/live",
  apiToken: "",
  refreshSeconds: 30,
  rules: [{ statKey: "stats.points", weight: 1 }],
  players: [{ name: "@e3th1n", apiId: "DJ465ao3", multiplier: 1 }],
};

const els = {
  apiBase: document.getElementById("api-base"),
  pathTemplate: document.getElementById("path-template"),
  apiToken: document.getElementById("api-token"),
  refreshSeconds: document.getElementById("refresh-seconds"),
  rulesList: document.getElementById("rules-list"),
  playersList: document.getElementById("players-list"),
  addRule: document.getElementById("add-rule"),
  addPlayer: document.getElementById("add-player"),
  saveSetup: document.getElementById("save-setup"),
  refreshNow: document.getElementById("refresh-now"),
  lastUpdated: document.getElementById("last-updated"),
  totalPoints: document.getElementById("total-points"),
  results: document.getElementById("results"),
};

let config = loadConfig();
let timer = null;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
    const parsed = JSON.parse(raw);
    return {
      apiBase: String(parsed.apiBase || DEFAULT_CONFIG.apiBase),
      pathTemplate: String(parsed.pathTemplate || DEFAULT_CONFIG.pathTemplate),
      apiToken: String(parsed.apiToken || ""),
      refreshSeconds: Math.max(10, Number(parsed.refreshSeconds) || 30),
      rules: Array.isArray(parsed.rules) && parsed.rules.length
        ? parsed.rules.map((r) => ({
            statKey: String(r.statKey || ""),
            weight: Number(r.weight) || 0,
          }))
        : [{ statKey: "", weight: 0 }],
      players: Array.isArray(parsed.players) && parsed.players.length
        ? parsed.players.map((p) => ({
            name: String(p.name || ""),
            apiId: String(p.apiId || ""),
            multiplier: Math.max(0, Number(p.multiplier) || 1),
          }))
        : [{ name: "", apiId: "", multiplier: 1 }],
    };
  } catch (_err) {
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }
}

function fillFormFromConfig() {
  els.apiBase.value = config.apiBase;
  els.pathTemplate.value = config.pathTemplate;
  els.apiToken.value = config.apiToken;
  els.refreshSeconds.value = String(config.refreshSeconds);
  renderRules();
  renderPlayers();
}

function readFormIntoConfig() {
  config.apiBase = String(els.apiBase.value || "").trim() || DEFAULT_CONFIG.apiBase;
  config.pathTemplate = String(els.pathTemplate.value || "").trim() || DEFAULT_CONFIG.pathTemplate;
  config.apiToken = String(els.apiToken.value || "").trim();
  config.refreshSeconds = Math.max(10, Number(els.refreshSeconds.value) || 30);

  const rules = Array.from(els.rulesList.querySelectorAll(".row.rule"))
    .map((row) => ({
      statKey: String(row.querySelector("[data-field='stat-key']")?.value || "").trim(),
      weight: Number(row.querySelector("[data-field='weight']")?.value || 0),
    }))
    .filter((r) => r.statKey);

  const players = Array.from(els.playersList.querySelectorAll(".row.player"))
    .map((row) => ({
      name: String(row.querySelector("[data-field='name']")?.value || "").trim(),
      apiId: String(row.querySelector("[data-field='api-id']")?.value || "").trim(),
      multiplier: Math.max(0, Number(row.querySelector("[data-field='multiplier']")?.value || 1)),
    }))
    .filter((p) => p.apiId);

  config.rules = rules.length ? rules : [{ statKey: "", weight: 0 }];
  config.players = players.length ? players : [{ name: "", apiId: "", multiplier: 1 }];
}

function saveConfig() {
  readFormIntoConfig();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  restartAutoRefresh();
}

function renderRules() {
  els.rulesList.innerHTML = config.rules
    .map(
      (rule, i) => `
      <div class="row rule" data-index="${i}">
        <input data-field="stat-key" type="text" placeholder="stat path (ex: stats.points)" value="${escapeHtml(rule.statKey)}" />
        <input data-field="weight" type="number" step="0.01" value="${Number(rule.weight) || 0}" />
        <button type="button" data-action="remove-rule">Remove</button>
      </div>
    `
    )
    .join("");
}

function renderPlayers() {
  els.playersList.innerHTML = config.players
    .map(
      (player, i) => `
      <div class="row players player" data-index="${i}">
        <input data-field="name" type="text" placeholder="display name" value="${escapeHtml(player.name)}" />
        <input data-field="api-id" type="text" placeholder="player api id" value="${escapeHtml(player.apiId)}" />
        <input data-field="multiplier" type="number" min="0" step="0.1" value="${Number(player.multiplier) || 1}" />
        <button type="button" data-action="remove-player">Remove</button>
      </div>
    `
    )
    .join("");
}

function normalize(text) {
  return String(text || "").trim().toLowerCase();
}

function collectNumericFields(node, prefix = "", out = {}) {
  if (node === null || node === undefined) {
    return out;
  }

  if (typeof node === "number" && Number.isFinite(node)) {
    out[prefix] = node;
    return out;
  }

  if (Array.isArray(node)) {
    node.forEach((item, idx) => {
      const next = prefix ? `${prefix}[${idx}]` : `[${idx}]`;
      collectNumericFields(item, next, out);
    });
    return out;
  }

  if (typeof node === "object") {
    Object.keys(node).forEach((key) => {
      const next = prefix ? `${prefix}.${key}` : key;
      collectNumericFields(node[key], next, out);
    });
  }

  return out;
}

function lookupStatValue(fields, statKey) {
  const target = normalize(statKey);
  if (!target) {
    return 0;
  }

  for (const [key, value] of Object.entries(fields)) {
    if (normalize(key) === target) {
      return Number(value) || 0;
    }
  }

  for (const [key, value] of Object.entries(fields)) {
    if (normalize(key).endsWith(`.${target}`)) {
      return Number(value) || 0;
    }
  }

  return 0;
}

async function fetchPlayerPayload(player) {
  const params = new URLSearchParams({
    base: config.apiBase,
    pathTemplate: config.pathTemplate,
    playerId: player.apiId,
  });
  if (config.apiToken) {
    params.set("token", config.apiToken);
  }

  const res = await fetch(`/api/realsports?${params.toString()}`, {
    cache: "no-store",
  });

  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.ok !== true) {
    const msg = body && body.message ? body.message : `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return body.data;
}

function scorePlayer(player, payload) {
  const fields = collectNumericFields(payload, "", {});
  const lines = config.rules.map((rule) => {
    const value = lookupStatValue(fields, rule.statKey);
    const subtotal = value * Number(rule.weight || 0);
    return {
      statKey: rule.statKey,
      value,
      weight: Number(rule.weight || 0),
      subtotal,
    };
  });

  const raw = lines.reduce((sum, line) => sum + line.subtotal, 0);
  const multiplier = Number(player.multiplier || 1);
  const total = raw * multiplier;

  return {
    player,
    raw,
    total,
    multiplier,
    lines,
  };
}

function renderResults(rows) {
  if (!rows.length) {
    els.results.innerHTML = '<p class="muted">No players configured.</p>';
    els.totalPoints.textContent = "Total: 0.00";
    return;
  }

  const sorted = rows.slice().sort((a, b) => b.total - a.total);
  const total = sorted.reduce((sum, row) => sum + row.total, 0);
  els.totalPoints.textContent = `Total: ${total.toFixed(2)}`;

  els.results.innerHTML = sorted
    .map((row) => {
      const lineHtml = row.lines
        .map(
          (line) => `
          <div class="result-line">
            <span>${escapeHtml(line.statKey)}</span>
            <span>${line.value.toFixed(2)} x ${line.weight.toFixed(2)} = ${line.subtotal.toFixed(2)}</span>
          </div>
        `
        )
        .join("");

      return `
        <article class="result-card">
          <div class="result-head">
            <strong>${escapeHtml(row.player.name || row.player.apiId)}</strong>
            <span class="muted">ID: ${escapeHtml(row.player.apiId)}</span>
            <strong>${row.total.toFixed(2)} pts</strong>
          </div>
          <p class="muted small">Raw ${row.raw.toFixed(2)} • Multiplier ${row.multiplier.toFixed(2)}</p>
          <div class="result-lines">${lineHtml}</div>
        </article>
      `;
    })
    .join("");
}

function renderError(message) {
  els.results.innerHTML = `<p class="error">${escapeHtml(message)}</p>`;
}

async function refreshScores() {
  readFormIntoConfig();

  if (!config.pathTemplate.includes("{id}")) {
    renderError("Path template must include {id}.");
    return;
  }

  const players = config.players.filter((p) => p.apiId);
  if (!players.length) {
    renderResults([]);
    return;
  }

  try {
    const rows = await Promise.all(
      players.map(async (player) => {
        const payload = await fetchPlayerPayload(player);
        return scorePlayer(player, payload);
      })
    );

    renderResults(rows);
    els.lastUpdated.textContent = `Last updated: ${new Date().toLocaleString()}`;
  } catch (err) {
    renderError(`Live refresh failed: ${err.message || "Unknown error"}`);
  }
}

function restartAutoRefresh() {
  if (timer) {
    clearInterval(timer);
  }
  timer = setInterval(() => {
    refreshScores();
  }, Math.max(10, Number(config.refreshSeconds) || 30) * 1000);
}

function onStackClick(event) {
  const btn = event.target.closest("button[data-action]");
  if (!btn) {
    return;
  }

  const row = btn.closest("[data-index]");
  const index = Number(row?.dataset.index || -1);

  if (btn.dataset.action === "remove-rule" && index >= 0) {
    config.rules.splice(index, 1);
    if (!config.rules.length) {
      config.rules.push({ statKey: "", weight: 0 });
    }
    renderRules();
    return;
  }

  if (btn.dataset.action === "remove-player" && index >= 0) {
    config.players.splice(index, 1);
    if (!config.players.length) {
      config.players.push({ name: "", apiId: "", multiplier: 1 });
    }
    renderPlayers();
  }
}

function init() {
  fillFormFromConfig();

  els.addRule.addEventListener("click", () => {
    config.rules.push({ statKey: "", weight: 0 });
    renderRules();
  });

  els.addPlayer.addEventListener("click", () => {
    config.players.push({ name: "", apiId: "", multiplier: 1 });
    renderPlayers();
  });

  els.rulesList.addEventListener("click", onStackClick);
  els.playersList.addEventListener("click", onStackClick);

  els.saveSetup.addEventListener("click", () => {
    saveConfig();
    refreshScores();
  });

  els.refreshNow.addEventListener("click", () => {
    refreshScores();
  });

  restartAutoRefresh();
  refreshScores();
}

init();
