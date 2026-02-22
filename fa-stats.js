const FA_STATS_URL = "/api/sheet?name=fa-stats";
const FA_STATS_RANGE = "A7:K162";

const els = {
  lastUpdated: document.getElementById("last-updated"),
  search: document.getElementById("fa-search"),
  grid: document.getElementById("fa-stats-grid"),
};

let faRows = [];

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

function formatValue(value) {
  const text = String(value || "").trim();
  return text || "—";
}

function parseFARows(rows) {
  return rows
    .filter((row) => row.some((cell) => String(cell || "").trim() !== ""))
    .map((row) => ({
      player: String(row[0] || "").trim(),
      dailyKarma: String(row[1] || "").trim(),
      dailyRank: String(row[2] || "").trim(),
      weeklyKarma: String(row[3] || "").trim(),
      weeklyRank: String(row[4] || "").trim(),
      monthlyKarma: String(row[5] || "").trim(),
      monthlyRank: String(row[6] || "").trim(),
      totalKarma: String(row[7] || "").trim(),
      totalKarmaRank: String(row[8] || "").trim(),
      rankedDays: String(row[9] || "").trim(),
      avgRankOnRankedDays: String(row[10] || "").trim(),
    }))
    .filter((item) => {
      const player = item.player.toLowerCase();
      return !!item.player && player !== "player";
    });
}

function render(rows, query = "") {
  if (!els.grid) {
    return;
  }
  const q = String(query || "").trim().toLowerCase();
  const visible = q
    ? rows.filter((row) => row.player.toLowerCase().includes(q))
    : rows;

  if (!visible.length) {
    els.grid.innerHTML = "<p>No free agent stats found.</p>";
    return;
  }

  els.grid.innerHTML = visible
    .map(
      (row) => `
        <article class="fa-card">
          <h3>
            <a class="tx-link" href="/player-detail.html?player=${encodeURIComponent(
              row.player
            )}">${escapeHtml(row.player)}</a>
          </h3>
          <div class="fa-stats">
            <div class="fa-stat"><span>Daily Karma</span><strong>${escapeHtml(formatValue(row.dailyKarma))}</strong></div>
            <div class="fa-stat"><span>Daily Rank</span><strong>${escapeHtml(formatValue(row.dailyRank))}</strong></div>
            <div class="fa-stat"><span>Weekly Karma</span><strong>${escapeHtml(formatValue(row.weeklyKarma))}</strong></div>
            <div class="fa-stat"><span>Weekly Rank</span><strong>${escapeHtml(formatValue(row.weeklyRank))}</strong></div>
            <div class="fa-stat"><span>Monthly Karma</span><strong>${escapeHtml(formatValue(row.monthlyKarma))}</strong></div>
            <div class="fa-stat"><span>Monthly Rank</span><strong>${escapeHtml(formatValue(row.monthlyRank))}</strong></div>
            <div class="fa-stat"><span>Total Karma</span><strong>${escapeHtml(formatValue(row.totalKarma))}</strong></div>
            <div class="fa-stat"><span>Total Karma Rank</span><strong>${escapeHtml(formatValue(row.totalKarmaRank))}</strong></div>
            <div class="fa-stat"><span>Ranked Days</span><strong>${escapeHtml(formatValue(row.rankedDays))}</strong></div>
            <div class="fa-stat"><span>Avg Rank (Ranked Days)</span><strong>${escapeHtml(formatValue(row.avgRankOnRankedDays))}</strong></div>
          </div>
        </article>
      `
    )
    .join("");
}

function updateLastUpdated() {
  const now = new Date();
  const formatted = now.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  if (els.lastUpdated) {
    els.lastUpdated.textContent = `Last updated: ${formatted}`;
  }
}

async function load() {
  try {
    const response = await fetch(FA_STATS_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    const rows = parseCSV(await response.text());
    const sliced = sliceRange(rows, FA_STATS_RANGE);
    faRows = parseFARows(sliced);
    render(faRows, els.search ? els.search.value : "");
    updateLastUpdated();
  } catch (error) {
    if (els.grid) {
      els.grid.innerHTML = "<p>Unable to load FA stats.</p>";
    }
  }
}

if (els.search) {
  els.search.addEventListener("input", () => {
    render(faRows, els.search.value);
  });
}

load();
