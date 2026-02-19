const DRAFT_CSV_URL = "/api/sheet?name=draft";

const els = {
  lastUpdated: document.getElementById("last-updated"),
  sections: document.getElementById("expansion-sections"),
};

const EXPANSION_RANGES = [
  { title: "The Snipers", range: "E1:F7" },
  { title: "The Phantoms", range: "E9:F15" },
  { title: "The Future", range: "E17:F23" },
  { title: "The Lions", range: "E25:F31" },
];

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

function renderCell(value, index) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  if (index === 0) {
    return `<a class="draft-link" href="/player-detail.html?player=${encodeURIComponent(
      text
    )}">${escapeHtml(text)}</a>`;
  }
  return escapeHtml(text);
}

function renderSection(title, rows) {
  const bodyRows = rows.filter((row) =>
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
            <tr><th>Player</th><th>Info</th></tr>
          </thead>
          <tbody>
            ${bodyRows
              .map(
                (row) => `
                  <tr>
                    <td>${renderCell(row[0], 0)}</td>
                    <td>${renderCell(row[1], 1)}</td>
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

async function loadExpansionDraft() {
  try {
    const response = await fetch(DRAFT_CSV_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    const rows = parseCSV(await response.text());
    els.sections.innerHTML = EXPANSION_RANGES.map((item) =>
      renderSection(item.title, sliceRange(rows, item.range))
    ).join("");
    updateLastUpdated();
  } catch (error) {
    els.sections.innerHTML = `<section class="panel"><p>${escapeHtml(
      error.message
    )}</p></section>`;
  }
}

loadExpansionDraft();
