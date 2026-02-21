const ROSTER_URL = "/api/sheet?name=roster";
const DRAFT_CAPITAL_URL = "/api/sheet?name=draft-capital";
const TEAM_UPDATE_CODES = {
  "Gus N Em": "Harbor9!Maple",
  Bullets: "Orbit#17Cinder",
  Turkeys: "Raven$42North",
  Cheerios: "Mint!88Drift",
  Yetis: "Fjord@3Echo",
  Illegals: "Copper%71Trail",
  "The Lions": "Quartz&5Summit",
  "The Future": "Nova*24Anchor",
  "The Snipers": "Atlas=63Bloom",
  "The Phantoms": "Velvet+90Stone",
};

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
  tabTradePanel: document.getElementById("gm-tab-trade"),
  tabRenamePanel: document.getElementById("gm-tab-rename"),
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
};

let rosterByTeam = new Map();
let picksByTeam = new Map();
let tradeBlocksCache = {};

function setActiveTab(tab) {
  const active = tab === "rename" ? "rename" : "trade";
  if (els.tabTradePanel) {
    els.tabTradePanel.hidden = active !== "trade";
  }
  if (els.tabRenamePanel) {
    els.tabRenamePanel.hidden = active !== "rename";
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

function getTeamUpdateCode(team) {
  if (!team) {
    return "";
  }
  if (team === "Storm") {
    return TEAM_UPDATE_CODES.Bullets || "";
  }
  return TEAM_UPDATE_CODES[team] || "";
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

async function loadRoster() {
  const response = await fetch(ROSTER_URL, { cache: "no-store" });
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

  if (els.tradeSave) {
    els.tradeSave.addEventListener("click", async () => {
      const team = els.teamSelect.value;
      if (!team) {
        setTradeStatus("Select a team first.", true);
        return;
      }
      const expectedCode = getTeamUpdateCode(team);
      if (!expectedCode) {
        setTradeStatus("No update code configured for this team.", true);
        return;
      }
      if (!els.tradeCode || els.tradeCode.value.trim() !== expectedCode) {
        setTradeStatus("Invalid access code.", true);
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
      const expectedCode = getTeamUpdateCode(team);
      if (!expectedCode) {
        setRenameStatus("No update code configured for this team.", true);
        return;
      }
      if (!els.renameCode || els.renameCode.value.trim() !== expectedCode) {
        setRenameStatus("Invalid access code.", true);
        return;
      }
      try {
        await updatePlayerNameInSheet(team, oldTag, newName);
        const nextPlayers = (getTeamPlayers(team) || []).map((p) =>
          normalizeName(p) === normalizeName(oldTag) ? newName : p
        );
        rosterByTeam.set(team, nextPlayers);
        renderRenameTeam(team);
        if (els.renamePlayerSelect) {
          els.renamePlayerSelect.value = newName;
        }
        setRenameStatus("Player name updated.");
        updateLastUpdated();
      } catch (error) {
        setRenameStatus(error.message || "Unable to update player name.", true);
      }
    });
  }
}

async function init() {
  bindEvents();
  setActiveTab("trade");
  try {
    await Promise.all([loadRoster(), loadDraftCapital()]);
    try {
      tradeBlocksCache = await fetchTradeBlocksFromSheet();
    } catch (error) {
      tradeBlocksCache = {};
      setTradeStatus(
        "Could not load sheet trade blocks. Check Apps Script trade block actions.",
        true
      );
    }
    renderSelectedTeam(els.teamSelect.value || "");
    renderRenameTeam(els.renameTeamSelect ? els.renameTeamSelect.value : "");
    updateLastUpdated();
  } catch (error) {
    setTradeStatus(error.message, true);
  }
}

init();
