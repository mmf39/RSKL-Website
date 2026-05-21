const AWARDS_URL = "/api/sheet?name=awards";
const ROSTER_URL = "/api/sheet?name=roster";
const SUPABASE_CONFIG_URL = "/api/supabase-config";
const GM_ALL_STAR_VOTES_TABLE = "gm_all_star_votes_public";
const ALL_STAR_VOTE_KEY = "rskl_all_star_vote";
const ALL_STAR_VOTER_KEY = "rskl_all_star_voter_handle";
const ALL_STAR_VOTER_ID_KEY = "rskl_all_star_voter_id";
const ALL_STAR_VOTER_LOCK_KEY = "rskl_all_star_voter_locked";
const ALL_STAR_DAILY_BRACKET_DATE_KEY = "rskl_all_star_bracket_day";
const ALL_STAR_DAILY_BRACKET_COUNT_KEY = "rskl_all_star_bracket_count";

const els = {
  lastUpdated: document.getElementById("last-updated"),
  season: document.getElementById("awards-season"),
  table: document.getElementById("awards-table"),
  champions: document.getElementById("champions-table"),
  voterHandle: document.getElementById("awards-voter-handle"),
  voteAdvance: document.getElementById("awards-vote-advance"),
  voteSave: document.getElementById("awards-vote-save"),
  voteClear: document.getElementById("awards-vote-clear"),
  voteGate: document.getElementById("awards-vote-gate"),
  voteList: document.getElementById("awards-vote-list"),
  voteCount: document.getElementById("awards-vote-count"),
  voteStatus: document.getElementById("awards-vote-status"),
};

const SEASON_KEY = "awardsSeason";
const AWARDS_CACHE_KEY = "awardsCsvCache";
const AWARDS_CACHE_TIME_KEY = "awardsCsvCacheTime";
const AWARDS_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

const AWARD_RANGES = {
  c2s2: "O4:P15",
  c1s1: "B3:B15",
  c1s2: "C3:D24",
  c1s3: "E3:F28",
  c1s4: "G3:H27",
  c1s5: "I3:J28",
  c1s6: "K3:L27",
  c2s1: "M3:N29",
};

const CHAMPION_RANGES = {
  c2s2: "O16:P29",
  c1s2: "C15:D24",
  c1s3: "E15:F28",
  c1s4: "G16:H27",
  c1s5: "I16:J28",
  c1s6: "K16:L27",
  c2s1: "M16:N29",
};

const TEAM_NAMES = [
  "Gus N Em",
  "Storm",
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

let supabaseUrl = "";
let supabaseAnon = "";
let selectedVotes = [];
let allStarPlayers = [];
let voterId = "";

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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeJsonParse(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (_) {
    return fallback;
  }
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim()
  );
}

function createUuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

function requireSupabaseConfig() {
  if (!supabaseUrl || !supabaseAnon) {
    throw new Error("Supabase config missing.");
  }
}

function authHeaders() {
  requireSupabaseConfig();
  return {
    "Content-Type": "application/json",
    apikey: supabaseAnon,
  };
}

async function loadSupabaseConfig() {
  const response = await fetch(SUPABASE_CONFIG_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Supabase config failed: ${response.status}`);
  }
  const payload = await response.json();
  supabaseUrl = String(payload.url || payload.supabaseUrl || "").trim();
  supabaseAnon = String(payload.anonKey || payload.supabaseAnon || "").trim();
}

function loadVoteDraft() {
  selectedVotes = safeJsonParse(localStorage.getItem(ALL_STAR_VOTE_KEY), []);
  if (els.voterHandle) {
    els.voterHandle.value = String(localStorage.getItem(ALL_STAR_VOTER_KEY) || "").trim();
  }
  voterId = String(localStorage.getItem(ALL_STAR_VOTER_ID_KEY) || "").trim();
  if (!isUuid(voterId)) {
    voterId = createUuid();
    localStorage.setItem(ALL_STAR_VOTER_ID_KEY, voterId);
  }
  syncVoteGate();
}

function saveVoteDraft(nextVotes) {
  selectedVotes = Array.isArray(nextVotes)
    ? nextVotes.map((v) => String(v || "").trim()).filter(Boolean)
    : [];
  localStorage.setItem(ALL_STAR_VOTE_KEY, JSON.stringify(selectedVotes));
  if (els.voteCount) {
    els.voteCount.textContent = `${selectedVotes.length} / 6`;
  }
}

function hasSavedVoterHandle() {
  return Boolean(String(localStorage.getItem(ALL_STAR_VOTER_KEY) || "").trim());
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getDailyBracketCount() {
  const today = getTodayKey();
  const storedDay = String(localStorage.getItem(ALL_STAR_DAILY_BRACKET_DATE_KEY) || "").trim();
  if (storedDay !== today) {
    localStorage.setItem(ALL_STAR_DAILY_BRACKET_DATE_KEY, today);
    localStorage.setItem(ALL_STAR_DAILY_BRACKET_COUNT_KEY, "0");
    return 0;
  }
  return Number(localStorage.getItem(ALL_STAR_DAILY_BRACKET_COUNT_KEY) || 0) || 0;
}

function incrementDailyBracketCount() {
  const count = getDailyBracketCount() + 1;
  localStorage.setItem(ALL_STAR_DAILY_BRACKET_COUNT_KEY, String(count));
  return count;
}

function syncVoteGate() {
  const locked = hasSavedVoterHandle();
  if (els.voteGate) {
    els.voteGate.hidden = !locked;
  }
  if (els.voterHandle) {
    els.voterHandle.disabled = locked;
  }
  if (els.voteAdvance) {
    els.voteAdvance.disabled = locked;
  }
}

function getAllStarPlayersFromRows(rows) {
  const seen = new Set();
  const players = [];
  Object.values(TEAM_RANGES).forEach((range) => {
    const sliced = sliceRange(rows, range);
    sliced.forEach((row) => {
      const left = String(row[0] || "").trim();
      const right = String(row[1] || "").trim();
      const candidates = [];
      if (left && !["PLAYER", "TEAM", "INFO"].includes(left.toUpperCase())) {
        candidates.push(left);
      }
      if (right && !["PLAYER", "TEAM", "INFO"].includes(right.toUpperCase())) {
        candidates.push(right);
      }
      candidates.forEach((player) => {
        const key = player.toLowerCase();
        if (!key || seen.has(key)) return;
        seen.add(key);
        players.push(player);
      });
    });
  });
  return players;
}

function renderVoteList() {
  if (!els.voteList) return;
  if (els.voteCount) {
    els.voteCount.textContent = `${selectedVotes.length} / 6`;
  }
  els.voteList.innerHTML = allStarPlayers.map((player) => {
    const checked = selectedVotes.some((value) => value.toLowerCase() === player.toLowerCase())
      ? "checked"
      : "";
    return `
      <label class="gm-check">
        <input type="checkbox" data-awards-vote-player value="${escapeHtml(player)}" ${checked} />
        <span><strong>${escapeHtml(player)}</strong></span>
        <span class="gm-check-pill">All Star</span>
      </label>
    `;
  }).join("");
}

function setVoterLocked(isLocked) {
  localStorage.setItem(ALL_STAR_VOTER_LOCK_KEY, isLocked ? "1" : "0");
  syncVoteGate();
}

async function saveVoteToSupabase() {
  requireSupabaseConfig();
  const voterHandle = String(
    els.voterHandle?.value || localStorage.getItem(ALL_STAR_VOTER_KEY) || ""
  ).trim();
  if (!voterHandle) {
    throw new Error("Enter your real @handle.");
  }
  if (!selectedVotes.length) {
    throw new Error("Select at least one player.");
  }
  if (selectedVotes.length > 6) {
    throw new Error("Pick up to 6 players only.");
  }
  localStorage.setItem(ALL_STAR_VOTER_KEY, voterHandle);
  const payload = {
    voter_id: voterId,
    voter_email: "",
    voter_team: "",
    voter_handle: voterHandle.startsWith("@") ? voterHandle : `@${voterHandle}`,
    votes: selectedVotes,
    updated_at: new Date().toISOString(),
  };
  const response = await fetch(
    `${supabaseUrl}/rest/v1/${GM_ALL_STAR_VOTES_TABLE}?on_conflict=voter_id`,
    {
      method: "POST",
      headers: {
        ...authHeaders(),
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify([payload]),
    }
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `All Star ballot save failed: ${response.status}${detail ? ` - ${detail}` : ""}`
    );
  }
  syncVoteGate();
  setVoterLocked(true);
}

function advanceToBallot() {
  const voterHandle = String(els.voterHandle?.value || "").trim();
  if (!voterHandle) {
    if (els.voteStatus) {
      els.voteStatus.textContent = "Enter your real @handle first.";
    }
    return;
  }
  const alreadyLocked = hasSavedVoterHandle();
  const currentCount = getDailyBracketCount();
  if (!alreadyLocked && currentCount >= 5) {
    if (els.voteStatus) {
      els.voteStatus.textContent = "You can only create 5 brackets per day.";
    }
    return;
  }
  localStorage.setItem(ALL_STAR_VOTER_KEY, voterHandle);
  setVoterLocked(true);
  if (!alreadyLocked) {
    incrementDailyBracketCount();
  }
  syncVoteGate();
  renderVoteList();
  if (els.voteStatus) {
    els.voteStatus.textContent = "Handle locked. You can now choose your players.";
  }
}

function linkifyWinner(text) {
  const value = String(text || "").trim();
  if (!value) {
    return "";
  }
  const teamMatch = TEAM_NAMES.find(
    (team) => team.toLowerCase() === value.toLowerCase()
  );
  if (teamMatch) {
    return `<a class="awards-link" href="team.html?team=${encodeURIComponent(
      teamMatch
    )}">${escapeHtml(value)}</a>`;
  }
  return `<a class="awards-link" href="player-detail.html?player=${encodeURIComponent(
    value
  )}">${escapeHtml(value)}</a>`;
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

function getSeason() {
  return localStorage.getItem(SEASON_KEY) || "c2s1";
}

function renderAwards(rows) {
  if (!rows.length) {
    els.table.innerHTML = "<p>No awards data available.</p>";
    return;
  }

  const hasSecondColumn = rows.some((row) => String(row[1] || "").trim());

  const cleaned = rows.filter((row) => String(row[0] || "").trim());

  if (cleaned.length) {
    cleaned.forEach((row) => {
      if (row.length >= 5) {
        const merged = [row[3], row[4]].filter(Boolean).join(" / ");
        row.splice(3, 2, merged);
      }
    });
  }

  const cardMarkup = cleaned
    .map((row) => {
      const winner = String(row[1] || row[0] || "").trim();
      const hasWinner = Boolean(row[1] && String(row[1]).trim());
      const isTeam = TEAM_NAMES.some(
        (team) => team.toLowerCase() === winner.toLowerCase()
      );
      const link = isTeam
        ? `team.html?team=${encodeURIComponent(winner)}`
        : `player-detail.html?player=${encodeURIComponent(winner)}`;
      if (!hasSecondColumn || !hasWinner) {
        return `
          <a class="awards-card awards-card-link" href="${link}">
            <div class="awards-title">${escapeHtml(row[0])}</div>
          </a>
        `;
      }
      return `
        <a class="awards-card awards-card-link" href="${link}">
          <div class="awards-title">${escapeHtml(row[0] || "")}</div>
          <div class="awards-winner">${escapeHtml(row[1] || "")}</div>
        </a>
      `;
    })
    .join("");

  els.table.innerHTML = `<div class="awards-grid">${cardMarkup}</div>`;
}

function renderChampions(rows, seasonKey) {
  if (!els.champions) {
    return;
  }
  if (!rows.length) {
    els.champions.innerHTML = "<p>No champions data available.</p>";
    return;
  }
  const body = rows
    .filter((row) => String(row[0] || "").trim())
    .map((row) => {
      const label = String(row[0] || "").trim();
      const winner = String(row[1] || "").trim();
      if (!winner) {
        return `
          <a class="champion-row single" href="player-detail.html?player=${encodeURIComponent(
            label
          )}">
            <div class="champion-single">${escapeHtml(label)}</div>
          </a>
        `;
      }
      const winnerLink = `<a class="champion-link" href="team.html?team=${encodeURIComponent(
        winner
      )}">${escapeHtml(winner)}</a>`;
      return `
        <div class="champion-row">
          <div class="champion-award">${escapeHtml(label)}</div>
          <div class="champion-winner">${winnerLink}</div>
        </div>
      `;
    })
    .join("");

  const title = seasonKey ? seasonKey.toUpperCase() : "Season";

  els.champions.innerHTML = `
    <div class="champion-box">
      <div class="champion-title">${escapeHtml(title)} Champions</div>
      <div class="champion-list">${body}</div>
    </div>
  `;
}

async function loadAwards() {
  if (!els.table || !els.champions) {
    return;
  }
  try {
    const cachedTime = Number(localStorage.getItem(AWARDS_CACHE_TIME_KEY) || 0);
    const cachedCsv = localStorage.getItem(AWARDS_CACHE_KEY);
    let rows = [];
    const hasFreshCache =
      cachedCsv &&
      cachedTime &&
      Date.now() - cachedTime < AWARDS_CACHE_TTL;

    if (hasFreshCache) {
      rows = parseCSV(cachedCsv);
    } else {
      const response = await fetch(AWARDS_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      const csvText = await response.text();
      localStorage.setItem(AWARDS_CACHE_KEY, csvText);
      localStorage.setItem(AWARDS_CACHE_TIME_KEY, String(Date.now()));
      rows = parseCSV(csvText);
    }
    if (!rows.length) {
      throw new Error("No data found.");
    }
    const season = getSeason();
    if (els.season) {
      els.season.value = season;
    }
    const range = AWARD_RANGES[season];
    const sliced = range ? sliceRange(rows, range) : [];
    let awardsRows = sliced;
    const champRange = CHAMPION_RANGES[season];
    if (champRange) {
      const awardParsed = parseRange(range || "");
      const champParsed = parseRange(champRange);
      if (awardParsed && champParsed) {
        const relStart = champParsed.startRow - awardParsed.startRow;
        const relEnd = champParsed.endRow - awardParsed.startRow;
        awardsRows = sliced.filter((_, idx) => idx < relStart || idx > relEnd);
      }
    }
    renderAwards(awardsRows);
    const championRange = CHAMPION_RANGES[season];
    const championSlice = championRange ? sliceRange(rows, championRange) : [];
    renderChampions(championSlice, season);
    if (cachedCsv && cachedTime) {
      const cachedDate = new Date(cachedTime);
      const formatted = cachedDate.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      els.lastUpdated.textContent = `Last updated: ${formatted}`;
    } else {
      updateLastUpdated();
    }
  } catch (error) {
    els.table.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
    if (els.champions) {
      els.champions.innerHTML = "";
    }
  }
}

async function loadAllStarPlayers() {
  const response = await fetch(ROSTER_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Roster fetch failed: ${response.status}`);
  }
  const rows = parseCSV(await response.text());
  allStarPlayers = getAllStarPlayersFromRows(rows);
}

async function loadSavedBallot() {
  requireSupabaseConfig();
  const response = await fetch(
    `${supabaseUrl}/rest/v1/${GM_ALL_STAR_VOTES_TABLE}?select=voter_id,voter_handle,votes,updated_at&voter_id=eq.${encodeURIComponent(voterId)}&limit=1`,
    {
      headers: authHeaders(),
      cache: "no-store",
    }
  );
  if (!response.ok) {
    return;
  }
  const payload = await response.json();
  if (!Array.isArray(payload) || !payload.length) {
    return;
  }
  const row = payload[0];
  const savedHandle = String(row?.voter_handle || "").trim();
  const votes = Array.isArray(row?.votes) ? row.votes.map((v) => String(v || "").trim()).filter(Boolean) : [];
  if (savedHandle && els.voterHandle) {
    els.voterHandle.value = savedHandle;
  }
  saveVoteDraft(votes);
  setVoterLocked(true);
}

async function initAllStarVoting() {
  try {
    await loadSupabaseConfig();
  } catch (_) {
    // Keep the page functional even if Supabase config is unavailable.
  }
  try {
    await loadAllStarPlayers();
  } catch (error) {
    allStarPlayers = [];
    if (els.voteStatus) {
      els.voteStatus.textContent = error.message || "Unable to load players.";
    }
  }
  loadVoteDraft();
  if (hasSavedVoterHandle()) {
    setVoterLocked(true);
  }
  try {
    await loadSavedBallot();
  } catch (_) {
    // fall back to local draft if Supabase is unavailable
  }
  renderVoteList();
  if (els.voteList) {
    els.voteList.addEventListener("change", (event) => {
      const checkbox = event.target.closest('input[data-awards-vote-player]');
      if (!checkbox) return;
      const checked = Array.from(
        els.voteList.querySelectorAll('input[data-awards-vote-player]:checked')
      ).map((node) => String(node.value || "").trim());
      if (checked.length > 6) {
        checkbox.checked = false;
        if (els.voteStatus) {
          els.voteStatus.textContent = "Pick up to 6 players only.";
        }
        return;
      }
      saveVoteDraft(checked);
      if (els.voteStatus) {
        els.voteStatus.textContent = `Selected ${checked.length} of 6.`;
      }
    });
  }
  const saveHandler = async () => {
    try {
      const checked = Array.from(
        els.voteList.querySelectorAll('input[data-awards-vote-player]:checked')
      ).map((node) => String(node.value || "").trim());
      saveVoteDraft(checked);
      await saveVoteToSupabase();
      if (els.voteStatus) {
        els.voteStatus.textContent = "All Star ballot saved.";
      }
    } catch (error) {
      if (els.voteStatus) {
        els.voteStatus.textContent = error.message || "Unable to save ballot.";
      }
    }
  };
  if (els.voteSave) els.voteSave.addEventListener("click", saveHandler);
  if (els.voteAdvance) els.voteAdvance.addEventListener("click", advanceToBallot);
  if (els.voterHandle) {
    els.voterHandle.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        advanceToBallot();
      }
    });
  }
  if (els.voteClear) {
    els.voteClear.addEventListener("click", () => {
      saveVoteDraft([]);
      renderVoteList();
      if (els.voteStatus) {
        els.voteStatus.textContent = "Selection cleared.";
      }
    });
  }
}

if (els.season) {
  els.season.addEventListener("change", () => {
    localStorage.setItem(SEASON_KEY, els.season.value);
    loadAwards();
  });
}

loadAwards();
initAllStarVoting();
