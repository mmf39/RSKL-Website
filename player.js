const PLAYER_STATS_URL = "/api/player-stats";

const els = {
  lastUpdated: document.getElementById("last-updated"),
  search: document.getElementById("player-search"),
  results: document.getElementById("player-results"),
  filter: document.getElementById("player-filter"),
};

let playerRows = [];
let leaderboardRows = [];

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

function renderResults(rows, query) {
  if (!rows.length) {
    els.results.innerHTML = "<p>No games found for that player.</p>";
    return;
  }

  const grouped = new Map();
  rows.forEach((row) => {
    const opponent = row[5] || "Unknown";
    if (!grouped.has(opponent)) {
      grouped.set(opponent, []);
    }
    grouped.get(opponent).push(row);
  });

  els.results.innerHTML = Array.from(grouped.entries())
    .map(([opponent, games]) => {
      const items = games
        .map(
          (row) => `
            <div class="player-game">
              <div class="player-game-title">${escapeHtml(row[0])} • ${escapeHtml(row[1])}</div>
              <div class="player-game-meta">
                <span>Score: ${escapeHtml(row[3])}</span>
                <span>Rank: ${escapeHtml(row[4])}</span>
              </div>
            </div>
          `
        )
        .join("");

      return `
        <div class="player-section">
          <h3>vs ${escapeHtml(opponent)}</h3>
          ${items}
        </div>
      `;
    })
    .join("");
}

function buildLeaderboard(rows) {
  const totals = new Map();
  rows.forEach((row) => {
    const name = String(row[2] || "").trim();
    if (!name) {
      return;
    }
    const score = Number(String(row[3] || "").replace(/[^0-9.\-]/g, ""));
    const rank = Number(String(row[4] || "").replace(/[^0-9.\-]/g, ""));
    if (Number.isNaN(score)) {
      return;
    }
    if (!totals.has(name)) {
      totals.set(name, { sum: 0, games: 0, rankSum: 0, rankGames: 0 });
    }
    const entry = totals.get(name);
    entry.sum += score;
    entry.games += 1;
    if (!Number.isNaN(rank)) {
      entry.rankSum += rank;
      entry.rankGames += 1;
    }
  });

  return Array.from(totals.entries())
    .map(([name, value]) => ({
      name,
      total: value.sum,
      avg: value.games ? value.sum / value.games : 0,
      avgRank: value.rankGames ? value.rankSum / value.rankGames : 0,
      games: value.games,
    }))
    .slice(0, 25);
}

function renderLeaderboard(list, query, metric) {
  const filtered = query
    ? list.filter((item) => item.name.toLowerCase().includes(query))
    : list;

  if (!filtered.length) {
    els.results.innerHTML = "<p>No players found.</p>";
    return;
  }

  const sorted = [...filtered];
  if (metric === "total_score") {
    sorted.sort((a, b) => b.total - a.total);
  } else if (metric === "avg_rank") {
    sorted.sort((a, b) => a.avgRank - b.avgRank);
  } else {
    sorted.sort((a, b) => b.avg - a.avg);
  }

  const metricLabel =
    metric === "total_score"
      ? "total"
      : metric === "avg_rank"
      ? "avg rank"
      : "avg";

  els.results.innerHTML = `
    <div class="leader-grid">
      ${sorted
        .map(
          (item, index) => `
            <div class="player-leader-row">
              <div class="leader-rank">#${index + 1}</div>
              <a class="leader-name" href="player-detail.html?player=${encodeURIComponent(item.name)}">${escapeHtml(item.name)}</a>
              <div class="leader-value">${
                metric === "total_score"
                  ? item.total.toFixed(0)
                  : metric === "avg_rank"
                  ? item.avgRank.toFixed(2)
                  : item.avg.toFixed(2)
              } ${metricLabel}</div>
              <div class="leader-sub">${item.games} games</div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

async function loadPlayerStats() {
  try {
    const response = await fetch(PLAYER_STATS_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    const rows = parseCSV(await response.text());
    if (!rows.length) {
      throw new Error("No data found.");
    }
    playerRows = rows.slice(1);
    updateLastUpdated();
    leaderboardRows = buildLeaderboard(playerRows);
    renderLeaderboard(leaderboardRows, "", els.filter.value);
  } catch (error) {
    els.results.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
  }
}

els.search.addEventListener("input", () => {
  const query = els.search.value.trim().toLowerCase();
  renderLeaderboard(leaderboardRows, query, els.filter.value);
});

els.filter.addEventListener("change", () => {
  const query = els.search.value.trim().toLowerCase();
  renderLeaderboard(leaderboardRows, query, els.filter.value);
});

loadPlayerStats();
