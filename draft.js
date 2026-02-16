const DRAFT_CSV_URL = "/api/sheet?name=draft";

const els = {
  lastUpdated: document.getElementById("last-updated"),
  sections: document.getElementById("draft-sections"),
  roundSelect: document.getElementById("round-select"),
};

const ROUND_RANGES = [
  { id: "round-1", title: "Round 1", range: "A1:C11" },
  { id: "round-2", title: "Round 2", range: "A12:C22" },
  { id: "round-3", title: "Round 3", range: "A23:C33" },
  { id: "round-4", title: "Round 4", range: "A34:C44" },
];

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

function renderCell(value, header, index) {
  const text = String(value ?? "").trim();
  if (!text) {
    return "";
  }
  const headerLower = String(header || "").toLowerCase();
  const likelyTeamCol = headerLower.includes("team") || index === 1;
  const likelyPlayerCol = headerLower.includes("player") || index === 2;

  if (likelyTeamCol) {
    const team = getFirstTeamMention(text);
    if (!team) {
      return escapeHtml(text);
    }
    const logo = getTeamLogo(team);
    return `<a class="draft-link" href="team.html?team=${encodeURIComponent(
      team
    )}">${logo}${escapeHtml(team)}</a>`;
  }
  if (likelyPlayerCol) {
    return `<a class="draft-link" href="player-detail.html?player=${encodeURIComponent(
      text
    )}">${escapeHtml(text)}</a>`;
  }
  return escapeHtml(text);
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

  const headers = cleanRows[0];
  const bodyRows = cleanRows.slice(1);

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
  if (!els.roundSelect || !els.sections) {
    return;
  }
  const selected = els.roundSelect.value;
  els.sections.querySelectorAll(".draft-round").forEach((section) => {
    const isMatch = selected === "all" || section.dataset.round === selected;
    section.hidden = !isMatch;
  });
}

async function loadDraft() {
  try {
    const response = await fetch(DRAFT_CSV_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    const rows = parseCSV(await response.text());
    els.sections.innerHTML = ROUND_RANGES.map(({ id, title, range }) =>
      renderRound(id, title, sliceRange(rows, range))
    ).join("");
    applyRoundFilter();
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

loadDraft();
