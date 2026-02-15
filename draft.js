const DRAFT_CSV_URL = "/api/draft";

const els = {
  lastUpdated: document.getElementById("last-updated"),
  sections: document.getElementById("draft-sections"),
};

const ROUND_RANGES = [
  { title: "Round 1", range: "A1:C11" },
  { title: "Round 2", range: "A12:C22" },
  { title: "Round 3", range: "A23:C33" },
  { title: "Round 4", range: "A34:C44" },
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

function renderRound(title, rows) {
  if (!rows.length) {
    return `
      <section class="panel">
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
      <section class="panel">
        <div class="panel-head"><h2>${escapeHtml(title)}</h2></div>
        <p>No data available.</p>
      </section>
    `;
  }

  const headers = cleanRows[0];
  const bodyRows = cleanRows.slice(1);

  return `
    <section class="panel">
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
                      .map((_, i) => `<td>${escapeHtml(row[i] ?? "")}</td>`)
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

async function loadDraft() {
  try {
    const response = await fetch(DRAFT_CSV_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    const rows = parseCSV(await response.text());
    els.sections.innerHTML = ROUND_RANGES.map(({ title, range }) =>
      renderRound(title, sliceRange(rows, range))
    ).join("");
    updateLastUpdated();
  } catch (error) {
    els.sections.innerHTML = `<section class="panel"><p>${escapeHtml(
      error.message
    )}</p></section>`;
  }
}

loadDraft();
