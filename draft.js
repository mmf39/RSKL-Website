const DRAFT_CSV_URL = "/api/sheet?name=draft";
const C2S3_DRAFT_CSV_URL = "/api/sheet?name=c2s3-draft";
const ARCHIVE_CSV_URL = "/api/sheet?name=archive";
const STANDINGS_CSV_URL = "/api/sheet?name=standings-dashboard";
const DRAFT_CAPITAL_CSV_URL = "/api/sheet?name=draft-capital";
const TRANSACTIONS_CSV_URL = "/api/sheet?name=transactions";
const SUPABASE_CONFIG_URL = "/api/supabase-config";
const C1S2_DRAFT_URL = "/assets/data/c1s2-draft.csv";
const C1S3_DRAFT_URL = "/assets/data/c1s3-draft.csv";
const C1S4_DRAFT_URL = "/assets/data/c1s4-draft.csv";
const C1S5_DRAFT_URL = "/assets/data/c1s5-draft.csv";
const C1S6_DRAFT_URL = "/assets/data/c1s6-draft.csv";
const DRAFT_YEAR_KEY = "draftYear";
const LIVE_DRAFT_SEASON = "c2s4";
const LIVE_DRAFT_PICKS_TABLE = "draft_picks";
const LIVE_DRAFT_PROSPECTS_TABLE = "draft_prospects";
const LIVE_DRAFT_SETTINGS_TABLE = "draft_settings";
const DRAFT_YEAR_VALUES = new Set([
  "nflkl-s1",
  "c2s4",
  "c1s2",
  "c1s3",
  "c1s4",
  "c1s5",
  "c1s6",
  "c2s1",
  "c2s2",
  "c2s3",
]);

function getActiveLeague() {
  return String(window.RSKL_ACTIVE_LEAGUE || localStorage.getItem("league") || "rskl")
    .trim()
    .toLowerCase() === "nflkl"
    ? "nflkl"
    : "rskl";
}

const els = {
  lastUpdated: document.getElementById("last-updated"),
  sections: document.getElementById("draft-sections"),
  publicDraftStatus: document.getElementById("public-draft-status"),
  publicDraftPrevious: document.getElementById("public-draft-previous"),
  publicDraftClockTeam: document.getElementById("public-draft-clock-team"),
  publicDraftTime: document.getElementById("public-draft-time"),
  roundSelect: document.getElementById("round-select"),
  yearSelect: document.getElementById("draft-year-select"),
  viewSelect: document.getElementById("draft-view-select"),
  lotteryPanel: document.getElementById("c2s3-lottery-panel"),
  rulesPanel: document.getElementById("draft-rules-panel"),
  runLottery: document.getElementById("run-lottery"),
  lotteryInfo: document.getElementById("lottery-info"),
  lotteryResult: document.getElementById("lottery-result"),
};

const ROUND_RANGES_BY_YEAR = {
  "nflkl-s1": [
    { id: "round-1", title: "Round 1", range: "" },
  ],
  c2s4: [
    { id: "round-1", title: "Round 1", range: "" },
    { id: "round-2", title: "Round 2", range: "" },
  ],
  c1s6: [
    { id: "round-1", title: "Round 1", range: "" },
    { id: "round-2", title: "Round 2", range: "" },
    { id: "round-3", title: "Round 3", range: "" },
    { id: "round-4", title: "Round 4", range: "" },
  ],
  c1s5: [
    { id: "round-1", title: "Round 1", range: "" },
    { id: "round-2", title: "Round 2", range: "" },
    { id: "round-3", title: "Round 3", range: "" },
    { id: "round-4", title: "Round 4", range: "" },
  ],
  c1s4: [
    { id: "round-1", title: "Round 1", range: "" },
    { id: "round-2", title: "Round 2", range: "" },
    { id: "round-3", title: "Round 3", range: "" },
    { id: "round-4", title: "Round 4", range: "" },
  ],
  c1s2: [
    { id: "round-1", title: "Round 1", range: "" },
    { id: "round-2", title: "Round 2", range: "" },
  ],
  c1s3: [
    { id: "round-1", title: "Round 1", range: "" },
    { id: "round-2", title: "Round 2", range: "" },
    { id: "round-3", title: "Round 3", range: "" },
  ],
  c2s3: [
    { id: "round-1", title: "Round 1", range: "" },
    { id: "round-2", title: "Round 2", range: "" },
    { id: "round-3", title: "Round 3", range: "" },
    { id: "round-4", title: "Round 4", range: "" },
  ],
  c2s2: [
    { id: "round-1", title: "Round 1", range: "A1:C11" },
    { id: "round-2", title: "Round 2", range: "A12:C22" },
    { id: "round-3", title: "Round 3", range: "A23:C33" },
    { id: "round-4", title: "Round 4", range: "A34:C44" },
  ],
  c2s1: [
    { id: "round-1", title: "Round 1", range: "A120:C126" },
    { id: "round-2", title: "Round 2", range: "A127:C133" },
    { id: "round-3", title: "Round 3", range: "A134:C140" },
    { id: "round-4", title: "Round 4", range: "A141:C147" },
    { id: "round-5", title: "Round 5", range: "A148:C154" },
    { id: "round-6", title: "Round 6", range: "A155:C161" },
    { id: "round-7", title: "Round 7", range: "A162:C168" },
    { id: "round-8", title: "Round 8", range: "A169:C175" },
  ],
};

const PROSPECTS_RANGE = "G1:K76";
const EXPANSION_RANGES = [
  { title: "Super Kings", range: "E1:F7" },
  { title: "The Phantoms", range: "E9:F15" },
  { title: "The Future", range: "E17:F23" },
  { title: "Pandas", range: "E25:F31" },
];

const TEAM_NAMES = new Set([
  "Masdog N Em",
  "Richer N Em",
  "Chicken Nuggets",
  "Doggy N Em",
  "Mafia",
  "Enforcers",
  "Karma Avengers",
  "Avengers",
  "Mambas",
  "Wranglers",
  "Wolves",
  "Phoenix",
  "Mets",
  "Thunderhawks",
  "Whatsgrass",
  "Tigers",
  "Legends",
  "ALEK Manoahs",
  "Alek Manoahs",
  "Gamblers",
  "Burritos",
  "Cobras",
  "Rebels",
  "Bees",
  "Big bad club",
  "Gus N Em",
  "The Bolts",
  "The Currents",
  "Storm",
  "Bullets",
  "Turkeys",
  "Bad Bois",
  "Yetis",
  "Scorpions",
  "Illegals",
  "Pandas",
  "The Future",
  "Dream Team",
  "Super Kings",
  "The Super Kings",
  "Super Team",
  "The Phantoms",
]);

let draftRowsCache = [];
let c2s3Context = null;
let supabaseUrl = "";
let supabaseAnon = "";
let supabaseConfigPromise = null;
let draftRealtimeClient = null;
let draftRealtimeChannel = null;
let draftRealtimeRefreshTimer = null;
let liveDraftSettingsCache = null;
let liveDraftPicksCache = [];

function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnon);
}

function supabaseHeaders() {
  return {
    "Content-Type": "application/json",
    apikey: supabaseAnon,
    Authorization: `Bearer ${supabaseAnon}`,
  };
}

function supabaseRestUrl(path) {
  return `${supabaseUrl}/rest/v1${path}`;
}

async function loadSupabaseConfig() {
  if (!supabaseConfigPromise) {
    supabaseConfigPromise = fetch(SUPABASE_CONFIG_URL, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Supabase config failed: ${response.status}`);
        }
        return response.json();
      })
      .then((payload) => {
        supabaseUrl = String(payload?.url || payload?.supabaseUrl || "").trim().replace(/\/$/, "");
        supabaseAnon = String(payload?.anonKey || payload?.supabaseAnon || payload?.publicAnonKey || "").trim();
        return hasSupabaseConfig();
      });
  }
  return supabaseConfigPromise;
}

async function fetchSupabaseRows(path) {
  await loadSupabaseConfig();
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase draft config is missing.");
  }
  const response = await fetch(supabaseRestUrl(path), {
    cache: "no-store",
    headers: supabaseHeaders(),
  });
  const text = await response.text();
  let payload = [];
  try {
    payload = text ? JSON.parse(text) : [];
  } catch (_) {
    throw new Error(text || `Supabase request failed: ${response.status}`);
  }
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `Supabase request failed: ${response.status}`);
  }
  return Array.isArray(payload) ? payload : [];
}

function getLiveDraftRealtimeClient() {
  if (draftRealtimeClient) return draftRealtimeClient;
  if (!window.supabase?.createClient || !hasSupabaseConfig()) return null;
  draftRealtimeClient = window.supabase.createClient(supabaseUrl, supabaseAnon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return draftRealtimeClient;
}

function shouldRealtimeRefreshDraftView() {
  const selectedYear = els.yearSelect ? els.yearSelect.value : getSelectedDraftYear();
  const selectedView = els.viewSelect ? els.viewSelect.value : "teams";
  return selectedYear === LIVE_DRAFT_SEASON && (selectedView === "teams" || selectedView === "prospects");
}

function scheduleLiveDraftRefresh() {
  window.clearTimeout(draftRealtimeRefreshTimer);
  draftRealtimeRefreshTimer = window.setTimeout(() => {
    if (shouldRealtimeRefreshDraftView()) {
      loadDraft();
    }
  }, 250);
}

async function subscribeToLiveDraftRealtime() {
  await loadSupabaseConfig();
  const client = getLiveDraftRealtimeClient();
  if (!client || draftRealtimeChannel) return;
  draftRealtimeChannel = client
    .channel(`${LIVE_DRAFT_SEASON}-public-draft-board`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: LIVE_DRAFT_PICKS_TABLE, filter: `season=eq.${LIVE_DRAFT_SEASON}` },
      scheduleLiveDraftRefresh
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: LIVE_DRAFT_PROSPECTS_TABLE, filter: `season=eq.${LIVE_DRAFT_SEASON}` },
      scheduleLiveDraftRefresh
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: LIVE_DRAFT_SETTINGS_TABLE, filter: `season=eq.${LIVE_DRAFT_SEASON}` },
      scheduleLiveDraftRefresh
    )
    .subscribe();
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cleanTeamName(value) {
  return String(value || "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\*/g, "")
    .trim();
}

function displayTeamName(value) {
  const name = cleanTeamName(value);
  if (name === "Bullets") return "Storm";
  if (name === "Yetis") return "Scorpions";
  if (name === "The Future") return "Dream Team";
  if (name === "The Pandas" || name === "Pandas" || name === "The Lions" || name === "Lions") return "Pandas";
  if (name === "The Snipers" || name === "Snipers" || name === "Sniper") return "Super Kings";
  if (name === "The Super Kings" || name === "Super Team") return "Super Kings";
  if (name === "Avengers") return "Karma Avengers";
  if (name === "Currents") return "The Currents";
  if (name === "Bolts") return "The Bolts";
  if (name === "Doggy N em") return "Doggy N Em";
  if (name === "Wrangler") return "Wranglers";
  return name;
}

function normalizeTeamName(value) {
  return cleanTeamName(value).toLowerCase().replace(/\s+/g, " ");
}

function getFirstTeamMention(value) {
  const source = String(value || "").toLowerCase();
  if (!source.trim()) {
    return "";
  }

  let best = null;
  TEAM_NAMES.forEach((team) => {
    const label = normalizeTeamName(team);
    const idx = source.indexOf(label);
    if (idx === -1) {
      return;
    }
    if (!best || idx < best.idx) {
      best = { idx, team: displayTeamName(team) };
    }
  });

  return best ? best.team : "";
}

function getTeamLogo(team) {
  const clean = displayTeamName(team);
  if (clean === "The Future" || clean === "Dream Team") {
    return '<img class="standings-logo" src="/assets/dream-team.jpg" alt="Dream Team logo" />';
  }
  if (clean === "Pandas") {
    return '<img class="standings-logo" src="/assets/pandas.png" alt="Pandas logo" />';
  }
  if (clean === "Super Kings") {
    return '<img class="standings-logo" src="/assets/super-kings.png" alt="Super Kings logo" />';
  }
  if (clean === "The Phantoms") {
    return '<img class="standings-logo" src="/assets/the-phantoms.png" alt="The Phantoms logo" />';
  }
  if (clean === "Scorpions") {
    return '<img class="standings-logo" src="/assets/mayeday.jpg" alt="Scorpions logo" />';
  }
  if (clean === "Cobras") {
    return '<img class="standings-logo" src="/assets/cobras.png" alt="Cobras logo" />';
  }
  if (clean === "Karma Avengers") {
    return '<img class="standings-logo" src="/assets/karma-avengers.png" alt="Karma Avengers logo" />';
  }
  if (clean === "Mafia") {
    return '<img class="standings-logo" src="/assets/mafia.png" alt="Mafia logo" />';
  }
  if (clean === "Mets" || clean === "The Mets") {
    return '<img class="standings-logo" src="/assets/mets.png" alt="Mets logo" />';
  }
  if (clean === "Masdog N Em" || clean === "Richer N Em") {
    return '<img class="standings-logo" src="/assets/gus-n-em.png" alt="N Em logo" />';
  }
  if (clean === "Phoenix" || clean === "The Phoenix") {
    return '<img class="standings-logo" src="/assets/phoenix.png" alt="Phoenix logo" />';
  }
  if (clean === "Thunderhawks") {
    return '<img class="standings-logo" src="/assets/thunderhawks.png" alt="Thunderhawks logo" />';
  }
  if (clean === "The Currents" || clean === "Currents") {
    return '<img class="standings-logo" src="/assets/the-currents.png" alt="The Currents logo" />';
  }
  if (clean === "Whatsgrass") {
    return '<img class="standings-logo" src="/assets/whatsgrass.png" alt="Whatsgrass logo" />';
  }
  if (clean === "Wolves") {
    return '<img class="standings-logo" src="/assets/wolves.png" alt="Wolves logo" />';
  }
  if (clean === "Zombies") {
    return '<img class="standings-logo" src="/assets/zombies.png" alt="Zombies logo" />';
  }
  if (clean === "Yetis") {
    return '<img class="standings-logo" src="/assets/yetis.png" alt="Yetis logo" />';
  }
  if (clean === "Gus N Em") {
    return '<img class="standings-logo" src="/assets/gus-n-em.png" alt="Gus N Em logo" />';
  }
  if (clean === "Bad Bois") {
    return '<img class="standings-logo" src="https://media.realapp.com/assets/user/default/large/4JZRj4DJ_29132497.webp" alt="Bad Bois logo" />';
  }
  if (clean === "Illegals") {
    return '<img class="standings-logo" src="/assets/illegals.png" alt="Illegals logo" />';
  }
  if (clean === "Bullets" || clean === "Storm") {
    return '<img class="standings-logo" src="/assets/storm.png" alt="Storm logo" />';
  }
  if (clean === "Turkeys") {
    return '<img class="standings-logo" src="/assets/turkeys.png" alt="Turkeys logo" />';
  }
  return "";
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function canonicalTeamName(value) {
  const clean = displayTeamName(value);
  const lower = clean.toLowerCase();
  if (lower === "thesnipers") return "Super Kings";
  if (lower === "thephantoms") return "The Phantoms";
  if (lower === "thefuture") return "The Future";
  if (lower === "dreamteam") return "Dream Team";
  if (lower === "thelions") return "Pandas";
  if (lower === "lions") return "Pandas";
  if (lower === "phantoms") return "The Phantoms";
  if (lower === "future") return "The Future";
  if (lower === "mayeday") return "Scorpions";
  if (lower === "snipers") return "Super Kings";
  if (lower === "bullets") return "Storm";
  return clean;
}

function linkifyTeamsAndPlayers(text) {
  const source = String(text || "");
  const playerParts = source.split(/(@[A-Za-z0-9_.]+)/g);
  const teamMap = {
    "Masdog N Em": "Masdog N Em",
    "Richer N Em": "Richer N Em",
    "Chicken Nuggets": "Chicken Nuggets",
    Mafia: "Mafia",
    Enforcers: "Enforcers",
    Thunderhawks: "Thunderhawks",
    Whatsgrass: "Whatsgrass",
    Tigers: "Tigers",
    Legends: "Legends",
    "ALEK Manoahs": "ALEK Manoahs",
    "Alek Manoahs": "ALEK Manoahs",
    Gamblers: "Gamblers",
    Burritos: "Burritos",
    Cobras: "Cobras",
    Rebels: "Rebels",
    Bees: "Bees",
    "Big bad club": "Big bad club",
    "Gus N Em": "Gus N Em",
    Storm: "Storm",
    Bullets: "Storm",
    Turkeys: "Turkeys",
    "Bad Bois": "Bad Bois",
    Yetis: "Scorpions",
    Scorpions: "Scorpions",
    Illegals: "Illegals",
    "Pandas": "Pandas",
    Lions: "Pandas",
    TheLions: "Pandas",
    "The Phantoms": "The Phantoms",
    Phantoms: "The Phantoms",
    ThePhantoms: "The Phantoms",
    "The Future": "Dream Team",
    "Dream Team": "Dream Team",
    Future: "Dream Team",
    TheFuture: "Dream Team",
    "Super Kings": "Super Kings",
    "The Super Kings": "Super Kings",
    "Super Team": "Super Kings",
    Snipers: "Super Kings",
    TheSnipers: "Super Kings",
  };
  const teamLabels = Object.keys(teamMap).sort((a, b) => b.length - a.length);
  const teamRegex = new RegExp(
    `\\b(${teamLabels.map(escapeRegExp).join("|")})\\b`,
    "gi"
  );

  return playerParts
    .map((part) => {
      if (/^@[A-Za-z0-9_.]+$/.test(part)) {
        return `<a class="draft-link" href="/player-detail.html?player=${encodeURIComponent(
          part
        )}">${escapeHtml(part)}</a>`;
      }
      const segment = String(part || "");
      let out = "";
      let lastIndex = 0;
      segment.replace(teamRegex, (match, _group, offset) => {
        out += escapeHtml(segment.slice(lastIndex, offset));
        const canonical = canonicalTeamName(teamMap[match] || match);
        out += `<a class="draft-link" href="/team.html?team=${encodeURIComponent(
          canonical
        )}">${escapeHtml(canonical)}</a>`;
        lastIndex = offset + match.length;
        return match;
      });
      out += escapeHtml(segment.slice(lastIndex));
      return out;
    })
    .join("");
}

function renderCell(value, header, index) {
  if (value && typeof value === "object" && value.__html) {
    return value.__html;
  }
  const text = String(value ?? "").trim();
  if (!text) {
    return "";
  }
  const headerLower = String(header || "").toLowerCase();
  const likelyTeamCol = headerLower.includes("team") || index === 1;
  const likelyPlayerCol =
    headerLower.includes("player") ||
    headerLower.includes("prospect") ||
    headerLower.includes("selection");

  if (likelyTeamCol) {
    const team = getFirstTeamMention(text);
    if (!team) {
      return escapeHtml(text);
    }
    const logo = getTeamLogo(team);
    return `<span class="draft-team-cell">${logo}${linkifyTeamsAndPlayers(text)}</span>`;
  }
  if (likelyPlayerCol) {
    return linkifyTeamsAndPlayers(text);
  }
  return linkifyTeamsAndPlayers(text);
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

async function fetchRows(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status}`);
  }
  return parseCSV(await response.text());
}

function parseStandingsRows(rows) {
  const headerRowIndex = rows.findIndex((row) => {
    const cells = row.map((c) => String(c || "").trim().toLowerCase());
    return cells.includes("team") && cells.some((c) => c === "wins" || c === "win");
  });
  if (headerRowIndex === -1) return [];
  const headers = rows[headerRowIndex].map((h) => String(h || "").trim().toLowerCase());
  const teamIdx = headers.indexOf("team");
  const winsIdx = headers.findIndex((h) => h === "wins" || h === "win");
  const lossesIdx = headers.findIndex((h) => h === "loss" || h === "losses" || h === "l");
  const winPctIdx = headers.findIndex((h) => h === "win %" || h === "win%" || h === "pct");
  const gpIdx = headers.findIndex((h) => h === "gp");
  if (teamIdx === -1) return [];

  const parsed = [];
  for (let i = headerRowIndex + 1; i < rows.length; i += 1) {
    const row = rows[i] || [];
    const rawTeam = String(row[teamIdx] || "").trim();
    if (!rawTeam) continue;
    const lowerTeam = rawTeam.toLowerCase();
    if (lowerTeam === "team" || lowerTeam.includes("join")) continue;
    const rawWins = String(row[winsIdx] || "").trim();
    const rawGp = String(row[gpIdx] || "").trim();
    if (!rawWins || !rawGp || Number.isNaN(Number(rawWins.replace(/[^0-9.-]/g, "")))) continue;
    const team = canonicalTeamName(rawTeam);
    const wins = Number(String(row[winsIdx] || "0").replace(/[^0-9.-]/g, "")) || 0;
    const losses = Number(String(row[lossesIdx] || "0").replace(/[^0-9.-]/g, "")) || 0;
    const gp = Number(String(row[gpIdx] || "0").replace(/[^0-9.-]/g, "")) || 0;
    let winPct = Number(String(row[winPctIdx] || "").replace(/[^0-9.-]/g, ""));
    if (!Number.isFinite(winPct)) {
      winPct = gp > 0 ? wins / gp : 0;
    } else if (winPct > 1.5) {
      winPct = winPct / 100;
    }
    parsed.push({ team, wins, losses, gp, winPct });
  }
  return parsed;
}

function getReverseStandingsOrder(standingsRows) {
  return [...standingsRows]
    .sort((a, b) => {
      if (a.winPct !== b.winPct) return a.winPct - b.winPct;
      if (a.wins !== b.wins) return a.wins - b.wins;
      if (a.losses !== b.losses) return b.losses - a.losses;
      return a.team.localeCompare(b.team);
    })
    .map((r) => r.team);
}

function parseDraftCapitalRows(rows, season = "c2s3") {
  const fallbackOwnersByCol = [
    "Turkeys",
    "Gus N Em",
    "Storm",
    "Bad Bois",
    "Yetis",
    "Pandas",
    "The Phantoms",
    "The Future",
    "Super Kings",
    "Illegals",
  ];
  const ownersByCol = (rows[0] || []).some((cell) => String(cell || "").trim())
    ? (rows[0] || []).map((owner) => canonicalTeamName(owner))
    : fallbackOwnersByCol;
  const byRound = new Map();
  const extrasByRound = new Map();
  const seasonPattern = escapeRegExp(season);

  rows.slice(1).forEach((row) => {
    ownersByCol.forEach((ownerName, colIndex) => {
      const value = String((row && row[colIndex]) || "").trim();
      if (!new RegExp(seasonPattern, "i").test(value)) return;
      const roundMatch = value.match(new RegExp(`${seasonPattern}\\s*(\\d+)(?:st|nd|rd|th)`, "i"));
      if (!roundMatch) return;
      const round = Number(roundMatch[1]);
      if (!Number.isFinite(round)) return;
      const viaMatch = value.match(/via\s+(.+)$/i);
      const original = canonicalTeamName(viaMatch ? viaMatch[1] : ownerName);
      const owner = canonicalTeamName(ownerName);
      const pickInfo = { owner, original, text: value, isComp: /\bcomp\b/i.test(value) };
      if (!byRound.has(round)) byRound.set(round, new Map());
      if (pickInfo.isComp) {
        if (!extrasByRound.has(round)) extrasByRound.set(round, []);
        extrasByRound.get(round).push(pickInfo);
      } else {
        byRound.get(round).set(original, pickInfo);
      }
    });
  });
  byRound.extrasByRound = extrasByRound;
  return byRound;
}

function buildC2S3DraftRows(order, draftCapitalByRound, roundNumber) {
  return order.map((originalTeam, idx) => {
    const roundMap = draftCapitalByRound.get(roundNumber) || new Map();
    const pickInfo = roundMap.get(originalTeam);
    const owner = pickInfo ? pickInfo.owner : originalTeam;
    const selection = owner === originalTeam ? owner : `${owner} (via ${originalTeam})`;
    return [String(idx + 1), originalTeam, selection];
  });
}

function formatDraftRecord(row) {
  if (!row) return "";
  return `${row.wins}-${row.losses} (${row.winPct.toFixed(2)})`;
}

function summarizeDraftPickInfo(pickInfo, owner, originalTeam) {
  if (!pickInfo) return "";
  if (/potential\s+swap/i.test(pickInfo.text)) return "Potential swap";
  if (pickInfo.isComp) return "Comp pick";
  return owner === originalTeam ? "" : pickInfo.text;
}

function textHasRound(value, roundNumber) {
  const text = String(value || "").toLowerCase();
  const patterns = {
    1: /\b1(?:st)?\b|\bfirst\b/,
    2: /\b2(?:nd)?\b|\bsecond\b/,
    3: /\b3(?:rd)?\b|\bthird\b/,
    4: /\b4(?:th)?\b|\bfourth\b/,
  };
  return patterns[roundNumber] ? patterns[roundNumber].test(text) : false;
}

function normalizeTradeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function tradeSideMatchesPick(receiveText, season, roundNumber, isComp) {
  const text = String(receiveText || "").toLowerCase();
  const hasSeason = text.includes(season.toLowerCase());
  const hasSwap = /\bswap\b/.test(text);
  const hasRound = textHasRound(text, roundNumber);
  const hasComp = /\bcomp\b/.test(text);
  if (isComp && !hasComp) return false;
  return hasRound && (hasSeason || hasSwap);
}

function parseTradeRows(rows) {
  return rows
    .slice(2)
    .map((row) => {
      const date = normalizeTradeText(row[0]);
      const teamA = canonicalTeamName(row[1]);
      const receiveA = normalizeTradeText(row[2]);
      const teamB = canonicalTeamName(row[3]);
      const receiveB = normalizeTradeText(row[4]);
      if (!date || !teamA || !teamB || (!receiveA && !receiveB)) return null;
      return { date, teamA, receiveA, teamB, receiveB };
    })
    .filter(Boolean);
}

function formatTradeNote(trade) {
  if (!trade) return "";
  const query = [
    trade.date,
    trade.teamA,
    trade.receiveA,
    trade.teamB,
    trade.receiveB,
  ]
    .filter(Boolean)
    .join(" ");
  return {
    __html: `<a class="draft-link" href="/transactions.html?q=${encodeURIComponent(
      query
    )}">Trade</a>`,
  };
}

function findPickTradeNote(pickInfo, roundNumber, trades, season = "c2s4") {
  if (!pickInfo || !Array.isArray(trades)) return "";
  const owner = canonicalTeamName(pickInfo.owner);
  const original = canonicalTeamName(pickInfo.original);
  const isSwap = /potential\s+.*swap|swap/i.test(pickInfo.text);
  const trade = trades.find((row) => {
    const aToB =
      canonicalTeamName(row.teamB) === owner &&
      (canonicalTeamName(row.teamA) === original || isSwap) &&
      tradeSideMatchesPick(row.receiveB, season, roundNumber, pickInfo.isComp);
    const bToA =
      canonicalTeamName(row.teamA) === owner &&
      (canonicalTeamName(row.teamB) === original || isSwap) &&
      tradeSideMatchesPick(row.receiveA, season, roundNumber, pickInfo.isComp);
    const swapMatch =
      isSwap &&
      (canonicalTeamName(row.teamA) === owner || canonicalTeamName(row.teamB) === owner) &&
      (/\bswap\b/i.test(row.receiveA) || /\bswap\b/i.test(row.receiveB)) &&
      (textHasRound(row.receiveA, roundNumber) || textHasRound(row.receiveB, roundNumber));
    return aToB || bToA || swapMatch;
  });
  return formatTradeNote(trade);
}

function buildPickNotes(pickInfo, owner, originalTeam, roundNumber, trades) {
  const baseNote = summarizeDraftPickInfo(pickInfo, owner, originalTeam);
  const tradeNote = findPickTradeNote(pickInfo, roundNumber, trades);
  if (baseNote && tradeNote && tradeNote.__html) {
    return {
      __html: `${escapeHtml(baseNote)}. ${tradeNote.__html}`,
    };
  }
  return tradeNote || baseNote;
}

function buildProjectedDraftRows(order, draftCapitalByRound, roundNumber, standingsByTeam, trades = []) {
  const roundMap = draftCapitalByRound.get(roundNumber) || new Map();
  const rows = order.map((originalTeam, idx) => {
    const pickInfo = roundMap.get(originalTeam);
    const owner = pickInfo ? pickInfo.owner : originalTeam;
    const selection = owner === originalTeam ? owner : `${owner} (via ${originalTeam})`;
    return [
      String(idx + 1),
      originalTeam,
      selection,
      formatDraftRecord(standingsByTeam.get(originalTeam)),
      buildPickNotes(pickInfo, owner, originalTeam, roundNumber, trades),
    ];
  });
  const extras = draftCapitalByRound.extrasByRound?.get(roundNumber) || [];
  extras.forEach((pickInfo, idx) => {
    const owner = pickInfo.owner;
    const original = pickInfo.original;
    rows.push([
      `${order.length + idx + 1} (Comp)`,
      original,
      owner === original ? owner : `${owner} (via ${original})`,
      "",
      buildPickNotes(pickInfo, owner, original, roundNumber, trades),
    ]);
  });
  return rows;
}

function renderC2S4ProjectionNote(order) {
  const today = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `
    <section class="panel draft-round" data-round="projection-note">
      <div class="panel-head"><h2>C2S4 Draft Projection</h2></div>
      <p>Projected as if the draft happened today, ${escapeHtml(today)}, using current reverse overall standings.</p>
    </section>
  `;
}

function renderC2S3LotteryPanel(order) {
  if (!els.lotteryPanel || !els.rulesPanel || !els.lotteryInfo || !els.lotteryResult) return;
  const nonPlayoff = order.slice(0, 4);
  const weighted = [
    { team: nonPlayoff[0], odds: 40 },
    { team: nonPlayoff[1], odds: 30 },
    { team: nonPlayoff[2], odds: 20 },
    { team: nonPlayoff[3], odds: 10 },
  ].filter((x) => x.team);

  els.lotteryInfo.innerHTML = `
    <div class="leader-meta">
      ${weighted
        .map(
          (row) =>
            `<span class="leader-chip">${getTeamLogo(row.team)} <span>${escapeHtml(
              row.team
            )} ${row.odds}%</span></span>`
        )
        .join("")}
    </div>
  `;
  els.lotteryResult.innerHTML = "<p>Run simulation to draw 1st overall.</p>";
  els.lotteryPanel.hidden = false;
  els.rulesPanel.hidden = false;
}

function runLotterySimulation() {
  if (!c2s3Context || !els.lotteryResult) return;
  const weighted = c2s3Context.weighted;
  if (!weighted || !weighted.length) return;
  const total = weighted.reduce((sum, x) => sum + x.odds, 0);
  let r = Math.random() * total;
  let winner = weighted[0].team;
  for (const row of weighted) {
    r -= row.odds;
    if (r <= 0) {
      winner = row.team;
      break;
    }
  }
  const updatedRoundOne = [
    winner,
    ...c2s3Context.order.filter((t) => t !== winner),
  ];
  const roundOneRows = buildC2S3DraftRows(
    updatedRoundOne,
    c2s3Context.draftCapitalByRound,
    1
  );
  const roundOneHtml = renderRound("round-1", "Round 1 (Lottery Sim)", [
    ["Pick", "Original Pick", "Selection Team"],
    ...roundOneRows,
  ]);
  els.lotteryResult.innerHTML = `
    <div class="panel-head"><h2>Winner: ${escapeHtml(winner)} (1st Overall)</h2></div>
    ${roundOneHtml}
  `;
}

function renderRound(roundId, title, rows) {
  if (!rows.length) {
    return `
      <section class="panel draft-round" data-round="${escapeHtml(roundId)}">
        <div class="panel-head"><h2>${escapeHtml(title)}</h2></div>
        <p>No data available.</p>
      </section>
    `;
  }

  const cleanRows = rows.filter((row) =>
    row.some((cell) => String(cell || "").trim() !== "")
  );
  if (!cleanRows.length) {
    return `
      <section class="panel draft-round" data-round="${escapeHtml(roundId)}">
        <div class="panel-head"><h2>${escapeHtml(title)}</h2></div>
        <p>No data available.</p>
      </section>
    `;
  }

  const looksHeader = (() => {
    const first = (cleanRows[0] || []).map((v) => String(v || "").toLowerCase());
    return first.some(
      (v) =>
        v.includes("round") ||
        v.includes("pick") ||
        v.includes("team") ||
        v.includes("selection") ||
        v.includes("player")
    );
  })();
  const headers = looksHeader ? cleanRows[0] : ["Pick", "Team", "Selection"];
  const bodyRows = looksHeader ? cleanRows.slice(1) : cleanRows;

  return `
    <section class="panel draft-round" data-round="${escapeHtml(roundId)}">
      <div class="panel-head">
        <h2>${escapeHtml(title)}</h2>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              ${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${bodyRows
              .map(
                (row) => `
                  <tr>
                    ${headers
                      .map(
                        (_, i) =>
                          `<td>${renderCell(row[i], headers[i], i)}</td>`
                      )
                      .join("")}
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function applyRoundFilter() {
  if (els.viewSelect && els.viewSelect.value === "prospects") {
    return;
  }
  if (!els.roundSelect || !els.sections) {
    return;
  }
  const selected = els.roundSelect.value;
  els.sections.querySelectorAll(".draft-round").forEach((section) => {
    const isMatch = selected === "all" || section.dataset.round === selected;
    section.hidden = !isMatch;
  });
}

function hasText(row) {
  return row.some((cell) => String(cell || "").trim() !== "");
}

function extractProspectsRows(rows) {
  return sliceRange(rows, PROSPECTS_RANGE).filter(hasText);
}

function extractC2S3DraftBoardRows(rows) {
  return rows
    .map((row) => [row[0] || "", row[1] || "", row[2] || ""])
    .filter(hasText);
}

function getDraftBoardRowsFromSheet(rows) {
  const cleanRows = rows
    .map((row) => [row[0] || "", row[1] || "", row[2] || ""])
    .filter(hasText);
  const headerIndex = cleanRows.findIndex((row) => {
    const first = String(row[0] || "").trim().toLowerCase();
    const second = String(row[1] || "").trim().toLowerCase();
    return first.includes("pick") && second.includes("team");
  });
  const header = headerIndex >= 0 ? cleanRows[headerIndex] : ["Pick", "Team", "Selection"];
  const bodyRows = cleanRows
    .slice(headerIndex >= 0 ? headerIndex + 1 : 0)
    .filter((row) => {
      const first = String(row[0] || "").trim();
      return first && !/^round\s+\d+/i.test(first) && Number.isFinite(Number(first));
    });

  return bodyRows.length ? [header, ...bodyRows] : getC2S4BaseDraftRows();
}

async function renderSheetBackedC2S4DraftBoard(reason = "") {
  let rows = [];
  try {
    rows = await fetchRows(DRAFT_CSV_URL);
  } catch (_) {
    rows = getC2S4BaseDraftRows();
  }

  const boardRows = getDraftBoardRowsFromSheet(rows);
  const header = boardRows[0] || ["Pick", "Team", "Selection"];
  const picks = boardRows.slice(1);
  const roundOneRows = [header, ...picks.filter((row) => Number(row[0]) <= 10)];
  const roundTwoRows = [header, ...picks.filter((row) => Number(row[0]) > 10)];
  const fallbackNote = reason
    ? `<div class="draft-fallback-note">Live draft is temporarily unavailable. Showing the sheet backup.</div>`
    : "";

  draftRowsCache = boardRows;
  els.sections.innerHTML = [
    fallbackNote,
    renderRound("round-1", "Round 1", roundOneRows),
    renderRound("round-2", "Round 2", roundTwoRows),
  ].join("");
  applyRoundFilter();
  updateLastUpdated();
}

async function renderSheetBackedC2S4Prospects(reason = "") {
  const rows = await fetchRows(DRAFT_CSV_URL);
  renderProspects(rows, "c2s4");
  if (reason && els.sections) {
    els.sections.insertAdjacentHTML(
      "afterbegin",
      `<div class="draft-fallback-note">Live prospects are temporarily unavailable. Showing the sheet backup.</div>`
    );
  }
}

function getC2S4BaseDraftRows() {
  const order = [
    "Pandas",
    "Storm",
    "Illegals",
    "Scorpions",
    "Bad Bois",
    "The Phantoms",
    "Gus N Em",
    "Dream Team",
    "Super Kings",
    "Turkeys",
  ];
  const tradedOwners = new Map([
    [1, "Dream Team (via Pandas)"],
    [8, "Pandas (via Dream Team)"],
    [10, "Bad Bois (via Turkeys)"],
    [11, "Dream Team (via Pandas)"],
    [18, "Pandas (via Dream Team)"],
    [19, "Scorpions (via Super Kings)"],
    [20, "Turkeys"],
    [21, "Bad Bois (via Turkeys)"],
  ]);
  const rows = [["Pick", "Team", "Selection"]];
  for (let pick = 1; pick <= 20; pick += 1) {
    const original = order[(pick - 1) % order.length];
    rows.push([String(pick), tradedOwners.get(pick) || original, ""]);
  }
  rows.push(["21", tradedOwners.get(21) || "Bad Bois", ""]);
  return rows;
}

async function fetchLiveDraftPicks() {
  return fetchSupabaseRows(
    `/${LIVE_DRAFT_PICKS_TABLE}?select=round,pick,team,player,status&season=eq.${encodeURIComponent(LIVE_DRAFT_SEASON)}&order=round.asc&order=pick.asc`
  );
}

async function fetchLiveDraftProspects() {
  return fetchSupabaseRows(
    `/${LIVE_DRAFT_PROSPECTS_TABLE}?select=player,monthly,ranked_days,average_ranked_day_rank,available&season=eq.${encodeURIComponent(LIVE_DRAFT_SEASON)}&order=monthly.asc.nullslast,created_at.asc`
  );
}

function parseDraftProspectNumber(value) {
  const number = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) ? number : null;
}

function compareDraftProspectsByMonthly(a, b) {
  const aMonthly = parseDraftProspectNumber(a?.monthly);
  const bMonthly = parseDraftProspectNumber(b?.monthly);
  if (aMonthly === null && bMonthly !== null) return 1;
  if (aMonthly !== null && bMonthly === null) return -1;
  if (aMonthly !== null && bMonthly !== null && aMonthly !== bMonthly) return aMonthly - bMonthly;

  const aAverageRank = parseDraftProspectNumber(a?.average_ranked_day_rank);
  const bAverageRank = parseDraftProspectNumber(b?.average_ranked_day_rank);
  if (aAverageRank === null && bAverageRank !== null) return 1;
  if (aAverageRank !== null && bAverageRank === null) return -1;
  if (aAverageRank !== null && bAverageRank !== null && aAverageRank !== bAverageRank) {
    return aAverageRank - bAverageRank;
  }

  return String(a?.player || "").localeCompare(String(b?.player || ""));
}

async function fetchLiveDraftSettings() {
  const rows = await fetchSupabaseRows(
    `/${LIVE_DRAFT_SETTINGS_TABLE}?select=season,submissions_open,current_round,current_pick,pick_started_at,pick_duration_seconds&season=eq.${encodeURIComponent(LIVE_DRAFT_SEASON)}&limit=1`
  );
  return rows[0] || null;
}

function getLiveDraftTimerRemainingMs() {
  const startedAt = liveDraftSettingsCache?.pick_started_at
    ? new Date(liveDraftSettingsCache.pick_started_at).getTime()
    : 0;
  const duration = Math.max(1, Number(liveDraftSettingsCache?.pick_duration_seconds) || 120) * 1000;
  if (!startedAt || Number.isNaN(startedAt)) return null;
  return Math.max(0, startedAt + duration - Date.now());
}

function formatLiveDraftTime(ms) {
  if (ms === null) return "Timer not started";
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getLiveDraftPickLabel(pick) {
  if (!pick) return "—";
  const player = String(pick.player || "").trim();
  const team = String(pick.team || "").trim() || "Unknown Team";
  const pickNumber = Number(pick.pick) || "";
  const selection =
    String(pick.status || "").trim().toLowerCase() === "forfeit"
      ? "FORFEITED"
      : player || "No selection yet";
  return `Pick ${pickNumber}: ${team} - ${selection}`;
}

function getLiveDraftPickHtml(pick) {
  if (!pick) return "—";
  const player = String(pick.player || "").trim();
  const team = String(pick.team || "").trim() || "Unknown Team";
  const pickNumber = Number(pick.pick) || "";
  const selection =
    String(pick.status || "").trim().toLowerCase() === "forfeit"
      ? "FORFEITED"
      : player || "No selection yet";
  return `Pick ${escapeHtml(pickNumber)}: ${linkifyTeamsAndPlayers(team)} - ${linkifyTeamsAndPlayers(selection)}`;
}

function isPublicLiveDraftBoardView() {
  const selectedYear = els.yearSelect ? els.yearSelect.value : getSelectedDraftYear();
  const selectedView = els.viewSelect ? els.viewSelect.value : "teams";
  return selectedYear === LIVE_DRAFT_SEASON && selectedView === "teams";
}

function isLiveC2S4DraftComplete() {
  const totalPicks = Math.max(0, getC2S4BaseDraftRows().length - 1);
  const completedPicks = new Set(
    liveDraftPicksCache
      .filter((pick) => {
        const status = String(pick.status || "").trim().toLowerCase();
        return String(pick.player || "").trim() || status === "forfeit";
      })
      .map((pick) => Number(pick.pick))
      .filter((pick) => Number.isFinite(pick) && pick > 0)
  );
  return totalPicks > 0 && completedPicks.size >= totalPicks;
}

function renderPublicDraftStatus() {
  const showStatus = isPublicLiveDraftBoardView();

  if (els.publicDraftStatus) {
    els.publicDraftStatus.hidden = !showStatus;
  }
  if (!showStatus) return;

  const currentPickNumber = Number(liveDraftSettingsCache?.current_pick) || 0;
  const draftComplete = isLiveC2S4DraftComplete();
  const currentPick = liveDraftPicksCache.find((pick) => Number(pick.pick) === currentPickNumber);
  const previousPick = liveDraftPicksCache
    .filter((pick) => {
      const status = String(pick.status || "").trim().toLowerCase();
      const isCompleted = String(pick.player || "").trim() || status === "forfeit";
      return draftComplete ? isCompleted : Number(pick.pick) < currentPickNumber && isCompleted;
    })
    .sort((a, b) => Number(b.pick) - Number(a.pick))[0];
  const clockTeam = currentPick
    ? `Pick ${Number(currentPick.pick) || currentPickNumber}: ${String(currentPick.team || "").trim() || "Unknown Team"}`
    : currentPickNumber
      ? `Pick ${currentPickNumber}`
      : "Draft not started";

  if (els.publicDraftPrevious) {
    els.publicDraftPrevious.innerHTML = getLiveDraftPickHtml(previousPick);
  }
  if (els.publicDraftClockTeam) {
    els.publicDraftClockTeam.innerHTML = draftComplete ? "Draft Complete" : linkifyTeamsAndPlayers(clockTeam);
  }
  if (els.publicDraftTime) {
    els.publicDraftTime.textContent = draftComplete ? "Final" : formatLiveDraftTime(getLiveDraftTimerRemainingMs());
  }
}

async function renderLiveC2S4DraftBoard() {
  const [picks, settings] = await Promise.all([
    fetchLiveDraftPicks(),
    fetchLiveDraftSettings().catch(() => null),
  ]);
  liveDraftPicksCache = picks;
  liveDraftSettingsCache = settings;
  renderPublicDraftStatus();
  const pickedByNumber = new Map(
    picks.map((pick) => [Number(pick.pick), pick])
  );
  const rows = getC2S4BaseDraftRows().slice(1).map((row) => {
    const pickNumber = Number(row[0]);
    const fallbackRound = pickNumber > 10 ? 2 : 1;
    const livePick = pickedByNumber.get(pickNumber);
    return {
      round: livePick ? Number(livePick.round) || fallbackRound : fallbackRound,
      row: [
        row[0],
        livePick?.team || row[1],
        String(livePick?.status || "").toLowerCase() === "forfeit"
          ? "FORFEITED"
          : livePick?.player || row[2],
      ],
    };
  });
  draftRowsCache = rows;
  const headers = ["Pick", "Team", "Selection"];
  const roundOneRows = [headers, ...rows.filter((pick) => Number(pick.round) === 1).map((pick) => pick.row)];
  const roundTwoRows = [headers, ...rows.filter((pick) => Number(pick.round) === 2).map((pick) => pick.row)];
  els.sections.innerHTML = [
    renderRound("round-1", "Round 1", roundOneRows),
    renderRound("round-2", "Round 2", roundTwoRows),
  ].join("");
  applyRoundFilter();
  renderPublicDraftStatus();
  updateLastUpdated();
}

async function renderLiveC2S4Prospects() {
  const rows = await fetchLiveDraftProspects();
  const availableRows = rows
    .filter((row) => row?.available !== false)
    .sort(compareDraftProspectsByMonthly);
  const tableRows = [
    ["Player", "Monthly", "Ranked Days", "Average Ranked Day Rank"],
    ...availableRows.map((row) => [
      String(row.player || "").trim(),
      row.monthly ?? "",
      row.ranked_days ?? "",
      row.average_ranked_day_rank ?? "",
    ]),
  ];
  draftRowsCache = tableRows;
  els.sections.innerHTML = `
    <section class="panel prospects-panel">
      <div class="panel-head"><h2>C2S4 Draft Prospects</h2></div>
      <div class="table-wrap prospects-table-wrap">
        <table class="prospects-table">
          <thead>
            <tr>${tableRows[0].map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${tableRows
              .slice(1)
              .map(
                (row) => `
                  <tr>
                    ${tableRows[0]
                      .map((_, i) => `<td>${renderCell(row[i], tableRows[0][i], i)}</td>`)
                      .join("")}
                  </tr>
                `
              )
              .join("") || `<tr><td colspan="${tableRows[0].length}">No Supabase draft prospects available.</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
  updateLastUpdated();
}

function renderProspects(rows, selectedYear) {
  if (selectedYear === "c2s1") {
    els.sections.innerHTML = `
      <section class="panel prospects-panel">
        <div class="panel-head"><h2>Draft Prospects</h2></div>
        <p>NA</p>
      </section>
    `;
    return;
  }
  const prospects = extractProspectsRows(rows);
  if (!prospects.length) {
    els.sections.innerHTML = `
      <section class="panel">
        <div class="panel-head"><h2>Draft Prospects</h2></div>
        <p>No prospects data available.</p>
      </section>
    `;
    return;
  }

  const looksHeader = (prospects[0] || []).some((cell) =>
    String(cell || "")
      .toLowerCase()
      .includes("prospect")
  ) || (prospects[0] || []).some((cell) =>
    ["name", "position", "team", "notes", "rank"].includes(
      String(cell || "").trim().toLowerCase()
    )
  );

  const headers = looksHeader
    ? prospects[0]
    : (prospects[0] || []).map((_, i) => (i === 0 ? "Prospect" : `Col ${i + 1}`));
  const bodyRows = (looksHeader ? prospects.slice(1) : prospects).filter((row) =>
    row.some((cell) => String(cell || "").trim() !== "")
  );

  els.sections.innerHTML = `
    <section class="panel prospects-panel">
      <div class="panel-head"><h2>Draft Prospects</h2></div>
      <div class="table-wrap prospects-table-wrap">
        <table class="prospects-table">
          <thead>
            <tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${bodyRows
              .map(
                (row) => `
                  <tr>
                    ${headers
                      .map(
                        (_, i) =>
                          `<td>${renderCell(row[i], headers[i], i)}</td>`
                      )
                      .join("")}
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderExpansion(rows) {
  const renderExpansionSection = (title, sectionRows) => {
    const bodyRows = sectionRows.filter((row) =>
      row.some((cell) => String(cell || "").trim() !== "")
    );
    const disclaimer =
      title === "Pandas"
        ? '<p class="expansion-disclaimer">Pandas used last 2 picks in trade with Bad Bois</p>'
        : "";
    return `
      <section class="panel draft-round">
        <div class="panel-head"><h2>Team = ${escapeHtml(title)}</h2></div>
        ${disclaimer}
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Player</th><th>Monthly Rank</th></tr>
            </thead>
            <tbody>
              ${bodyRows
                .map(
                  (row) => `
                    <tr>
                      <td>${renderCell(row[0], "Player", 0)}</td>
                      <td>${renderCell(row[1], "Monthly Rank", 99)}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>
    `;
  };

  els.sections.innerHTML = EXPANSION_RANGES.map((item) =>
    renderExpansionSection(item.title, sliceRange(rows, item.range))
  ).join("");
}

function getSelectedDraftYear() {
  if (getActiveLeague() === "nflkl") {
    return "nflkl-s1";
  }
  const params = new URLSearchParams(window.location.search);
  const queryYear = params.get("year") || params.get("draftYear");
  if (DRAFT_YEAR_VALUES.has(queryYear) && queryYear !== "nflkl-s1") {
    return queryYear;
  }
  const saved = localStorage.getItem(DRAFT_YEAR_KEY);
  if (DRAFT_YEAR_VALUES.has(saved) && saved !== "nflkl-s1") {
    return saved;
  }
  return "c2s4";
}

function syncDraftViewOptions() {
  if (els.yearSelect) {
    if (!els.yearSelect.__rsklOriginalOptions) {
      els.yearSelect.__rsklOriginalOptions = Array.from(els.yearSelect.options).map((option) => ({
        value: option.value,
        label: option.textContent,
      }));
    }
    if (getActiveLeague() === "nflkl") {
      els.yearSelect.innerHTML = '<option value="nflkl-s1">S1</option>';
      els.yearSelect.value = "nflkl-s1";
      localStorage.setItem(DRAFT_YEAR_KEY, "nflkl-s1");
    } else {
      els.yearSelect.innerHTML = els.yearSelect.__rsklOriginalOptions
        .filter((option) => option.value !== "nflkl-s1")
        .map((option) => `<option value="${option.value}">${option.label}</option>`)
        .join("");
      const selectedYear = getSelectedDraftYear();
      els.yearSelect.value = selectedYear;
      localStorage.setItem(DRAFT_YEAR_KEY, selectedYear);
    }
  }
  if (!els.viewSelect) return;
  const selectedYear = els.yearSelect ? els.yearSelect.value : getSelectedDraftYear();
  const expansionOption = els.viewSelect.querySelector('option[value="expansion"]');
  const hideExpansion = selectedYear === "c2s4" || selectedYear === "nflkl-s1";

  if (expansionOption) {
    expansionOption.hidden = hideExpansion;
    expansionOption.disabled = hideExpansion;
  }
  if (hideExpansion && els.viewSelect.value === "expansion") {
    els.viewSelect.value = "teams";
  }
}

async function loadDraft() {
  try {
    syncDraftViewOptions();
    const selectedYear = els.yearSelect ? els.yearSelect.value : getSelectedDraftYear();
    const selectedView = els.viewSelect ? els.viewSelect.value : "teams";
    if (els.lotteryPanel) els.lotteryPanel.hidden = true;
    if (els.rulesPanel) els.rulesPanel.hidden = true;
    renderPublicDraftStatus();
    c2s3Context = null;

    if (selectedYear === "c2s3" && selectedView === "teams") {
      const rows = await fetchRows(C2S3_DRAFT_CSV_URL);
      draftRowsCache = rows;
      const boardRows = extractC2S3DraftBoardRows(rows);
      els.sections.innerHTML = renderRound(
        "c2s3-board",
        "C2S3 Draft Board",
        boardRows
      );
      updateLastUpdated();
      return;
    }

    if (selectedYear === "nflkl-s1") {
      draftRowsCache = [];
      const title = selectedView === "prospects" ? "NFLKL S1 Draft Prospects" : "NFLKL S1 Draft Board";
      const message = selectedView === "prospects"
        ? "NFLKL S1 prospects are not available yet."
        : "NFLKL S1 draft picks are not available yet.";
      els.sections.innerHTML = `
        <section class="panel draft-round" data-round="round-1">
          <div class="panel-head"><h2>${title}</h2></div>
          <p>${message}</p>
        </section>
      `;
      updateLastUpdated();
      return;
    }

    if (selectedYear === "c2s4" && selectedView === "teams") {
      try {
        await renderLiveC2S4DraftBoard();
      } catch (error) {
        await renderSheetBackedC2S4DraftBoard(error.message);
      }
      return;
    }

    if (selectedYear === "c2s4" && selectedView === "prospects") {
      try {
        await renderLiveC2S4Prospects();
      } catch (error) {
        await renderSheetBackedC2S4Prospects(error.message);
      }
      return;
    }

    if ((selectedYear === "c1s2" || selectedYear === "c1s3" || selectedYear === "c1s4" || selectedYear === "c1s5" || selectedYear === "c1s6") && selectedView === "teams") {
      const response = await fetch(
        selectedYear === "c1s6"
          ? C1S6_DRAFT_URL
          : selectedYear === "c1s5"
          ? C1S5_DRAFT_URL
          : selectedYear === "c1s4"
          ? C1S4_DRAFT_URL
          : selectedYear === "c1s3"
          ? C1S3_DRAFT_URL
          : C1S2_DRAFT_URL,
        { cache: "no-store" }
      );
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      const rows = parseCSV(await response.text());
      draftRowsCache = rows;
      const header = rows[0] || [];
      const body = rows.slice(1);
      const roundOne = [header, ...body.filter((row) => String(row[0] || "").trim() === "1")];
      const roundTwo = [header, ...body.filter((row) => String(row[0] || "").trim() === "2")];
      const roundThree = [header, ...body.filter((row) => String(row[0] || "").trim() === "3")];
      const roundFour = [header, ...body.filter((row) => String(row[0] || "").trim() === "4")];
      els.sections.innerHTML = [
        renderRound("round-1", "Round 1", roundOne),
        renderRound("round-2", "Round 2", roundTwo),
        roundThree.length > 1 ? renderRound("round-3", "Round 3", roundThree) : "",
        roundFour.length > 1 ? renderRound("round-4", "Round 4", roundFour) : "",
      ].join("");
      updateLastUpdated();
      return;
    }

    const sourceUrl =
      selectedView === "expansion"
        ? DRAFT_CSV_URL
        : selectedYear === "c2s1"
        ? ARCHIVE_CSV_URL
        : DRAFT_CSV_URL;
    const roundRanges = ROUND_RANGES_BY_YEAR[selectedYear] || ROUND_RANGES_BY_YEAR.c2s2;
    const response = await fetch(sourceUrl, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    const rows = parseCSV(await response.text());
    draftRowsCache = rows;
    if (selectedView === "prospects") {
      renderProspects(rows, selectedYear);
    } else if (selectedView === "expansion") {
      renderExpansion(rows);
    } else {
      els.sections.innerHTML = roundRanges.map(({ id, title, range }) =>
        renderRound(id, title, sliceRange(rows, range))
      ).join("");
      applyRoundFilter();
    }
    updateLastUpdated();
  } catch (error) {
    els.sections.innerHTML = `<section class="panel"><p>${escapeHtml(
      error.message
    )}</p></section>`;
  }
}

if (els.roundSelect) {
  els.roundSelect.addEventListener("change", applyRoundFilter);
}

if (els.yearSelect) {
  els.yearSelect.value = getSelectedDraftYear();
  syncDraftViewOptions();
  els.yearSelect.addEventListener("change", () => {
    localStorage.setItem(DRAFT_YEAR_KEY, els.yearSelect.value);
    syncDraftViewOptions();
    loadDraft();
  });
}

if (els.viewSelect) {
  els.viewSelect.addEventListener("change", async () => {
    const selectedYear = els.yearSelect ? els.yearSelect.value : getSelectedDraftYear();
    if (selectedYear === "c2s4") {
      await loadDraft();
      return;
    }
    if (!draftRowsCache.length) {
      await loadDraft();
      return;
    }
    if (els.viewSelect.value === "prospects") {
      renderProspects(draftRowsCache, selectedYear);
    } else if (els.viewSelect.value === "expansion") {
      await loadDraft();
    } else {
      await loadDraft();
    }
  });
}

if (els.runLottery) {
  els.runLottery.addEventListener("click", runLotterySimulation);
}

subscribeToLiveDraftRealtime().catch(() => {
  // The board still works with normal Supabase REST fetches if realtime cannot connect.
});
window.setInterval(renderPublicDraftStatus, 1000);
loadDraft();
