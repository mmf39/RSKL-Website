const DRAFT_CSV_URL = "/api/sheet?name=draft";
const ARCHIVE_CSV_URL = "/api/sheet?name=archive";
const DRAFT_YEAR_KEY = "draftYear";

const els = {
  lastUpdated: document.getElementById("last-updated"),
  sections: document.getElementById("draft-sections"),
  roundSelect: document.getElementById("round-select"),
  yearSelect: document.getElementById("draft-year-select"),
  viewSelect: document.getElementById("draft-view-select"),
};

const ROUND_RANGES_BY_YEAR = {
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

const PROSPECTS_RANGE = "J1:N65";
const EXPANSION_RANGES = [
  { title: "The Snipers", range: "E1:F7" },
  { title: "The Phantoms", range: "E9:F15" },
  { title: "The Future", range: "E17:F23" },
  { title: "The Lions", range: "E25:F31" },
];
const EXPANSION_PROSPECTS_RANGE = "G2:I32";
const EXPANSION_TOTAL_KARMA = {
  rockiess: "722K",
  dri: "1.12M",
  lukeboss: "1.03M",
  jr: "1.18M",
  eclipse: "1.39M",
  artifact: "1.58M",
  robertjr: "1.68M",
  etienne: "660K",
  buc: "3.21M",
  bobsburgers: "2.92M",
  playexplainer: "2.25M",
  aliyu_: "916.7K",
  sotonyc: "2.76M",
  xintervol: "1.33M",
  king: "1.39M",
  plemay: "1.93M",
  snowy: "1.69M",
  psyklone: "1.33M",
  reinhart13: "1.43M",
  bigk: "2.6M",
  bojack: "3.49M",
  xo: "2.94M",
  snivy: "1.67M",
  devinbooker: "2.15M",
  griff168: "849.6K",
  rockymountain: "1.45M",
  shy: "1.85M",
  keegan: "1.12M",
  penixszn: "635.8K",
  max: "3.6M",
};

const TEAM_NAMES = new Set([
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
]);

let draftRowsCache = [];

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
  return name === "Bullets" ? "Storm" : name;
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
  if (clean === "The Future") {
    return '<img class="standings-logo" src="/assets/the-future.png" alt="The Future logo" />';
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
  if (clean === "Yetis") {
    return '<img class="standings-logo" src="/assets/yetis.png" alt="Yetis logo" />';
  }
  if (clean === "Gus N Em") {
    return '<img class="standings-logo" src="/assets/gus-n-em.png" alt="Gus N Em logo" />';
  }
  if (clean === "Cheerios") {
    return '<img class="standings-logo" src="/assets/cheerios.png" alt="Cheerios logo" />';
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
  if (lower === "thelions") return "The Lions";
  if (lower === "lions") return "The Lions";
  if (lower === "phantoms") return "The Phantoms";
  if (lower === "future") return "The Future";
  if (lower === "snipers") return "The Snipers";
  if (lower === "bullets") return "Storm";
  return clean;
}

function normalizePlayerTag(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");
}

function linkifyTeamsAndPlayers(text) {
  const source = String(text || "");
  const playerParts = source.split(/(@[A-Za-z0-9_.]+)/g);
  const teamMap = {
    "Gus N Em": "Gus N Em",
    Storm: "Storm",
    Bullets: "Storm",
    Turkeys: "Turkeys",
    Cheerios: "Cheerios",
    Yetis: "Yetis",
    Illegals: "Illegals",
    "The Lions": "The Lions",
    Lions: "The Lions",
    TheLions: "The Lions",
    "The Phantoms": "The Phantoms",
    Phantoms: "The Phantoms",
    ThePhantoms: "The Phantoms",
    "The Future": "The Future",
    Future: "The Future",
    TheFuture: "The Future",
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
        ? '<p class="expansion-disclaimer">The lions used last 2 picks in trade with Cheerios</p>'
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

function renderExpansionProspects(rows) {
  const sourceRows = sliceRange(rows, EXPANSION_PROSPECTS_RANGE).filter((row) =>
    row.some((cell) => String(cell || "").trim() !== "")
  );
  if (!sourceRows.length) {
    els.sections.innerHTML = `
      <section class="panel draft-round">
        <div class="panel-head"><h2>Expansion Draft</h2></div>
        <p>No expansion prospects data available.</p>
      </section>
    `;
    return;
  }

  const grouped = new Map();
  const looksHeader = (sourceRows[0] || []).some((cell) =>
    ["team", "player", "prospect", "info", "note", "monthly", "rank"].some((key) =>
      String(cell || "").toLowerCase().includes(key)
    )
  );
  const dataRows = looksHeader ? sourceRows.slice(1) : sourceRows;

  dataRows.forEach((row) => {
    const rawTeam = String(row[0] || "").trim();
    const player = String(row[1] || "").trim();
    const info = String(row[2] || "").trim();
    const totalKarma = EXPANSION_TOTAL_KARMA[normalizePlayerTag(player)] || "";
    if (!rawTeam || !player) {
      return;
    }
    const team = canonicalTeamName(rawTeam);
    if (!grouped.has(team)) {
      grouped.set(team, []);
    }
    grouped.get(team).push({ player, info, totalKarma });
  });

  const renderExpansionSection = (team, players) => {
    const disclaimer =
      canonicalTeamName(team) === "The Lions"
        ? '<p class="expansion-disclaimer">The lions used last 2 picks in trade with Cheerios</p>'
        : "";
    const hasInfo = players.some((item) => String(item.info || "").trim() !== "");
    const hasTotalKarma = players.some(
      (item) => String(item.totalKarma || "").trim() !== ""
    );
    return `
      <section class="panel draft-round">
        <div class="panel-head">
          <h2><a class="draft-link" href="/team.html?team=${encodeURIComponent(
            team
          )}">${escapeHtml(team)}</a></h2>
        </div>
        ${disclaimer}
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Team</th><th>Player</th>${hasInfo ? "<th>Monthly Rank</th>" : ""}${hasTotalKarma ? "<th>Total Karma</th>" : ""}</tr>
            </thead>
            <tbody>
              ${players
                .map(
                  (item) => `
                    <tr>
                      <td>${escapeHtml(team)}</td>
                      <td>${renderCell(item.player, "Player", 1)}</td>
                      ${hasInfo ? `<td>${renderCell(item.info, "Monthly Rank", 2)}</td>` : ""}
                      ${hasTotalKarma ? `<td>${escapeHtml(item.totalKarma || "—")}</td>` : ""}
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

  els.sections.innerHTML = Array.from(grouped.entries())
    .map(([team, players]) => renderExpansionSection(team, players))
    .join("");
}

function getSelectedDraftYear() {
  const saved = localStorage.getItem(DRAFT_YEAR_KEY);
  if (saved === "c2s1" || saved === "c2s2") {
    return saved;
  }
  return "c2s2";
}

async function loadDraft() {
  try {
    const selectedYear = els.yearSelect ? els.yearSelect.value : getSelectedDraftYear();
    const selectedView = els.viewSelect ? els.viewSelect.value : "teams";
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
    } else if (selectedView === "expansion-prospects") {
      renderExpansionProspects(rows);
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
    } else if (els.viewSelect.value === "expansion-prospects") {
      renderExpansionProspects(draftRowsCache);
    } else if (els.viewSelect.value === "expansion") {
      await loadDraft();
    } else {
      await loadDraft();
    }
  });
}

loadDraft();
