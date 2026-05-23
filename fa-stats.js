const FA_STATS_URL = "/api/sheet?name=fa-stats";
const FA_STATS_RANGE = "A7:K162";

const els = {
  lastUpdated: document.getElementById("last-updated"),
  search: document.getElementById("fa-search"),
  field: document.getElementById("fa-field"),
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

function normalizeFilterText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseStatNumber(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/\s+/g, "");
  if (!raw || raw === "na" || raw === "—" || raw === "-") {
    return Number.NEGATIVE_INFINITY;
  }
  const match = raw.match(/^(-?\d+(?:\.\d+)?)([km])?$/);
  if (!match) {
    const num = Number(raw.replace(/[^0-9.\-]/g, ""));
    return Number.isNaN(num) ? Number.NEGATIVE_INFINITY : num;
  }
  const base = Number(match[1]);
  const suffix = match[2];
  if (suffix === "k") {
    return base * 1000;
  }
  if (suffix === "m") {
    return base * 1000000;
  }
  return base;
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

function matchesField(row, field, query) {
  if (!query) {
    return true;
  }
  const value = normalizeFilterText(row[field] || "");
  const q = normalizeFilterText(query);
  return value.includes(q);
}

function sortRows(rows, field) {
  const rankFields = new Set([
    "dailyRank",
    "weeklyRank",
    "monthlyRank",
    "totalKarmaRank",
    "avgRankOnRankedDays",
  ]);
  if (!field || field === "player") {
    return [...rows].sort((a, b) =>
      String(a.player || "").localeCompare(String(b.player || ""))
    );
  }
  const asc = rankFields.has(field);
  return [...rows].sort((a, b) => {
    const av = parseStatNumber(a[field]);
    const bv = parseStatNumber(b[field]);
    return asc ? av - bv : bv - av;
  });
}

function render(rows, query = "", field = "player") {
  if (!els.grid) {
    return;
  }
  const q = String(query || "").trim().toLowerCase();
  const selectedField = String(field || "player");
  const sorted = sortRows(rows, selectedField);
  const visible = sorted.filter((row) => matchesField(row, selectedField, q));

  if (!visible.length) {
    els.grid.innerHTML = "<p>No free agent stats found.</p>";
    return;
  }

  els.grid.innerHTML = visible
    .map(
      (row) => `
        <article class="fa-card">
          <h3 class="fa-card-title">
            <a class="tx-link" href="/player-detail.html?player=${encodeURIComponent(
              row.player
            )}">${escapeHtml(row.player)}${window.rsklPlayerBadgeHtml ? window.rsklPlayerBadgeHtml({ player: row.player, rookie: true, risingStars: true }) : ""}</a>
            <span class="fa-card-sub"> - ${escapeHtml(
              formatValue(row.rankedDays)
            )} Ranked Days (${escapeHtml(
              formatValue(row.avgRankOnRankedDays)
            )} Avg Rank)</span>
          </h3>
          <div class="fa-box-grid">
            <div class="fa-metric-box"><span>Daily Karma</span><strong>${escapeHtml(formatValue(row.dailyKarma))}</strong></div>
            <div class="fa-metric-box"><span>Daily Rank</span><strong>${escapeHtml(formatValue(row.dailyRank))}</strong></div>
            <div class="fa-metric-box"><span>Weekly Karma</span><strong>${escapeHtml(formatValue(row.weeklyKarma))}</strong></div>
            <div class="fa-metric-box"><span>Weekly Rank</span><strong>${escapeHtml(formatValue(row.weeklyRank))}</strong></div>
            <div class="fa-metric-box"><span>Monthly Karma</span><strong>${escapeHtml(formatValue(row.monthlyKarma))}</strong></div>
            <div class="fa-metric-box"><span>Monthly Rank</span><strong>${escapeHtml(formatValue(row.monthlyRank))}</strong></div>
            <div class="fa-metric-box"><span>Total Karma</span><strong>${escapeHtml(formatValue(row.totalKarma))}</strong></div>
            <div class="fa-metric-box"><span>Total Karma Rank</span><strong>${escapeHtml(formatValue(row.totalKarmaRank))}</strong></div>
            <div class="fa-metric-box"><span>Ranked Days</span><strong>${escapeHtml(formatValue(row.rankedDays))}</strong></div>
            <div class="fa-metric-box"><span>Avg Rank (Ranked Days)</span><strong>${escapeHtml(formatValue(row.avgRankOnRankedDays))}</strong></div>
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
    render(
      faRows,
      els.search ? els.search.value : "",
      els.field ? els.field.value : "player"
    );
    updateLastUpdated();
  } catch (error) {
    if (els.grid) {
      els.grid.innerHTML = "<p>Unable to load FA stats.</p>";
    }
  }
}

if (els.search) {
  els.search.addEventListener("input", () => {
    render(faRows, els.search.value, els.field ? els.field.value : "player");
  });
}

if (els.field) {
  els.field.addEventListener("change", () => {
    render(faRows, els.search ? els.search.value : "", els.field.value);
  });
}

load();
