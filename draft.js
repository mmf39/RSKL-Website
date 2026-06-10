const DRAFT_CSV_URL = "/api/sheet?name=draft";
const ARCHIVE_CSV_URL = "/api/sheet?name=archive";
const STANDINGS_CSV_URL = "/api/sheet?name=standings-dashboard";
const DRAFT_CAPITAL_CSV_URL = "/api/sheet?name=draft-capital";
const C1S2_DRAFT_URL = "/assets/data/c1s2-draft.csv";
const C1S3_DRAFT_URL = "/assets/data/c1s3-draft.csv";
const C1S4_DRAFT_URL = "/assets/data/c1s4-draft.csv";
const C1S5_DRAFT_URL = "/assets/data/c1s5-draft.csv";
const C1S6_DRAFT_URL = "/assets/data/c1s6-draft.csv";
const DRAFT_YEAR_KEY = "draftYear";
const DRAFT_YEAR_VALUES = new Set([
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

const els = {
  lastUpdated: document.getElementById("last-updated"),
  sections: document.getElementById("draft-sections"),
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
  { title: "The Snipers", range: "E1:F7" },
  { title: "The Phantoms", range: "E9:F15" },
  { title: "The Future", range: "E17:F23" },
  { title: "The Lions", range: "E25:F31" },
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
  "The Lions",
  "The Future",
  "Dream Team",
  "The Snipers",
  "The Phantoms",
]);

let draftRowsCache = [];
let c2s3Context = null;

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
  if (clean === "The Lions") {
    return '<img class="standings-logo" src="/assets/the-lions.png" alt="The Lions logo" />';
  }
  if (clean === "The Snipers") {
    return '<img class="standings-logo" src="/assets/the-snipers.png" alt="The Snipers logo" />';
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
  if (lower === "thesnipers") return "The Snipers";
  if (lower === "thephantoms") return "The Phantoms";
  if (lower === "thefuture") return "The Future";
  if (lower === "dreamteam") return "Dream Team";
  if (lower === "thelions") return "The Lions";
  if (lower === "lions") return "The Lions";
  if (lower === "phantoms") return "The Phantoms";
  if (lower === "future") return "The Future";
  if (lower === "mayeday") return "Scorpions";
  if (lower === "snipers") return "The Snipers";
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
    "The Lions": "The Lions",
    Lions: "The Lions",
    TheLions: "The Lions",
    "The Phantoms": "The Phantoms",
    Phantoms: "The Phantoms",
    ThePhantoms: "The Phantoms",
    "The Future": "Dream Team",
    "Dream Team": "Dream Team",
    Future: "Dream Team",
    TheFuture: "Dream Team",
    "The Snipers": "The Snipers",
    Snipers: "The Snipers",
    TheSnipers: "The Snipers",
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
  const text = String(value ?? "").trim();
  if (!text) {
    return "";
  }
  const headerLower = String(header || "").toLowerCase();
  const likelyTeamCol = headerLower.includes("team");
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
    return `<a class="draft-link" href="team.html?team=${encodeURIComponent(
      team
    )}">${logo}${escapeHtml(text)}</a>`;
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
    "The Lions",
    "The Phantoms",
    "The Future",
    "The Snipers",
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

function buildProjectedDraftRows(order, draftCapitalByRound, roundNumber, standingsByTeam) {
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
      summarizeDraftPickInfo(pickInfo, owner, originalTeam),
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
      summarizeDraftPickInfo(pickInfo, owner, original),
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
      <div class="leader-meta">
        ${order
          .map((team, index) => `<span class="leader-chip">${getTeamLogo(team)} <span>${index + 1}. ${escapeHtml(team)}</span></span>`)
          .join("")}
      </div>
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
      title === "The Lions"
        ? '<p class="expansion-disclaimer">The lions used last 2 picks in trade with Bad Bois</p>'
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
  const params = new URLSearchParams(window.location.search);
  const queryYear = params.get("year") || params.get("draftYear");
  if (DRAFT_YEAR_VALUES.has(queryYear)) {
    return queryYear;
  }
  const saved = localStorage.getItem(DRAFT_YEAR_KEY);
  if (DRAFT_YEAR_VALUES.has(saved)) {
    return saved;
  }
  return "c2s3";
}

async function loadDraft() {
  try {
    const selectedYear = els.yearSelect ? els.yearSelect.value : getSelectedDraftYear();
    const selectedView = els.viewSelect ? els.viewSelect.value : "teams";
    if (els.lotteryPanel) els.lotteryPanel.hidden = true;
    if (els.rulesPanel) els.rulesPanel.hidden = true;
    c2s3Context = null;

    if (selectedYear === "c2s3" && selectedView === "teams") {
      const rows = await fetchRows(DRAFT_CSV_URL);
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

    if (selectedYear === "c2s4" && selectedView === "teams") {
      const [standingsRows, draftCapitalRows] = await Promise.all([
        fetchRows(STANDINGS_CSV_URL),
        fetchRows(DRAFT_CAPITAL_CSV_URL),
      ]);
      draftRowsCache = standingsRows;
      const standings = parseStandingsRows(standingsRows);
      const order = getReverseStandingsOrder(standings);
      const standingsByTeam = new Map(standings.map((row) => [row.team, row]));
      const draftCapitalByRound = parseDraftCapitalRows(draftCapitalRows, "c2s4");
      if (!order.length) {
        els.sections.innerHTML = `
          <section class="panel">
            <div class="panel-head"><h2>C2S4 Draft Projection</h2></div>
            <p>No current standings data available.</p>
          </section>
        `;
      } else {
        els.sections.innerHTML = [
          renderC2S4ProjectionNote(order),
          renderRound("round-1", "Round 1", [
            ["Pick", "Original Pick", "Selection Team", "Current Record", "Notes"],
            ...buildProjectedDraftRows(order, draftCapitalByRound, 1, standingsByTeam),
          ]),
          renderRound("round-2", "Round 2", [
            ["Pick", "Original Pick", "Selection Team", "Current Record", "Notes"],
            ...buildProjectedDraftRows(order, draftCapitalByRound, 2, standingsByTeam),
          ]),
        ].join("");
        applyRoundFilter();
      }
      updateLastUpdated();
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
  els.yearSelect.addEventListener("change", () => {
    localStorage.setItem(DRAFT_YEAR_KEY, els.yearSelect.value);
    loadDraft();
  });
}

if (els.viewSelect) {
  els.viewSelect.addEventListener("change", async () => {
    if (!draftRowsCache.length) {
      await loadDraft();
      return;
    }
    if (els.viewSelect.value === "prospects") {
      const selectedYear = els.yearSelect ? els.yearSelect.value : getSelectedDraftYear();
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

loadDraft();
