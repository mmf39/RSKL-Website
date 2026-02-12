const PLAYER_STATS_URL = "/api/player-stats";
const ARCHIVE_URL = "/api/archive";
const PLAYER_SEASON_KEY = "playerSeason";
const SEASON_KEY = "season";
const SUPABASE_PLAYERS_URL = "https://wbbkjikdxpywfeyenbhs.supabase.co/rest/v1/players?select=player_tag,display_name";
const SUPABASE_API_KEY = "sb_publishable_P_4Gvh9rXEUrHS_-VZu6uw_As3f4CK3";

const els = {
  lastUpdated: document.getElementById("last-updated"),
  search: document.getElementById("player-search"),
  results: document.getElementById("player-results"),
  filter: document.getElementById("player-filter"),
};

let playerRows = [];
let leaderboardRows = [];
let playerNameOverrides = new Map();
let playerColumns = {
  date: 0,
  team: 1,
  player: 2,
  score: 3,
  rank: 4,
  opponent: 5,
};

const ARCHIVE_RANGES = {
  player_stats: "A45:F117",
};

function getPlayerSeason() {
  const playerSeason = localStorage.getItem(PLAYER_SEASON_KEY);
  if (playerSeason) {
    return playerSeason;
  }
  const season = localStorage.getItem(SEASON_KEY);
  if (season === "c2s1-post") {
    return "c2s1-playoffs";
  }
  if (season === "c2s1-regular") {
    return "c2s1-regular";
  }
  return "c2s2-regular";
}

function initPlayerSeasonSelect() {
  const panelSelect = document.getElementById("player-season-select");
  const navSelect = document.getElementById("season-select");
  const current = getPlayerSeason();

  if (panelSelect) {
    panelSelect.value = current;
  }
  if (navSelect) {
    navSelect.value =
      current === "c2s1-playoffs"
        ? "c2s1-post"
        : current === "c2s1-regular"
        ? "c2s1-regular"
        : "c2s2";
  }

  if (!localStorage.getItem(PLAYER_SEASON_KEY)) {
    localStorage.setItem(PLAYER_SEASON_KEY, current);
  }
  if (!localStorage.getItem(SEASON_KEY)) {
    localStorage.setItem(
      SEASON_KEY,
      current === "c2s1-playoffs"
        ? "c2s1-post"
        : current === "c2s1-regular"
        ? "c2s1-regular"
        : "c2s2"
    );
  }

  const onChange = (value) => {
    localStorage.setItem(PLAYER_SEASON_KEY, value);
    localStorage.setItem(
      SEASON_KEY,
      value === "c2s1-playoffs"
        ? "c2s1-post"
        : value === "c2s1-regular"
        ? "c2s1-regular"
        : "c2s2"
    );
    location.reload();
  };

  if (panelSelect) {
    panelSelect.addEventListener("change", () => onChange(panelSelect.value));
  }
  if (navSelect) {
    navSelect.addEventListener("change", () => {
      const mapped =
        navSelect.value === "c2s1-post"
          ? "c2s1-playoffs"
          : navSelect.value === "c2s1-regular"
          ? "c2s1-regular"
          : "c2s2-regular";
      onChange(mapped);
    });
  }
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

function normalizePlayerKey(value) {
  return String(value || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}

async function loadPlayerOverrides() {
  try {
    const response = await fetch(SUPABASE_PLAYERS_URL, {
      headers: {
        apikey: SUPABASE_API_KEY,
        Authorization: `Bearer ${SUPABASE_API_KEY}`,
      },
    });
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    playerNameOverrides = new Map(
      (data || [])
        .filter((row) => row.player_tag && row.display_name)
        .map((row) => [normalizePlayerKey(row.player_tag), row.display_name])
    );
  } catch (error) {
    // ignore override failures
  }
}

function detectPlayerColumns(headerRow) {
  const columns = {
    date: 0,
    team: 1,
    player: 2,
    score: 3,
    rank: 4,
    opponent: 5,
  };
  if (!headerRow || !headerRow.length) {
    return columns;
  }
  const lowered = headerRow.map((cell) => String(cell || "").toLowerCase());
  const pick = (label) => lowered.indexOf(label);
  const dateIdx = pick("date");
  const teamIdx = pick("team");
  const playerIdx = pick("player");
  const scoreIdx = pick("score") !== -1 ? pick("score") : pick("points");
  const rankIdx = pick("rank");
  const opponentIdx = pick("opponent");

  if (dateIdx !== -1) columns.date = dateIdx;
  if (teamIdx !== -1) columns.team = teamIdx;
  if (playerIdx !== -1) columns.player = playerIdx;
  if (scoreIdx !== -1) columns.score = scoreIdx;
  if (rankIdx !== -1) columns.rank = rankIdx;
  if (opponentIdx !== -1) columns.opponent = opponentIdx;

  return columns;
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
    const opponent = row[playerColumns.opponent] || "Unknown";
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
              <div class="player-game-title">${escapeHtml(row[playerColumns.date])} • ${escapeHtml(row[playerColumns.team])}</div>
              <div class="player-game-meta">
                <span>Score: ${escapeHtml(row[playerColumns.score])}</span>
                <span>Rank: ${escapeHtml(row[playerColumns.rank])}</span>
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
    const rawName = String(row[playerColumns.player] || "").trim();
    const displayName =
      playerNameOverrides.get(normalizePlayerKey(rawName)) || rawName;
    const team = String(row[playerColumns.team] || "").trim();
    if (!name) {
      return;
    }
    const score = Number(
      String(row[playerColumns.score] || "").replace(/[^0-9.\-]/g, "")
    );
    const rank = Number(
      String(row[playerColumns.rank] || "").replace(/[^0-9.\-]/g, "")
    );
    if (Number.isNaN(score)) {
      return;
    }
    if (!totals.has(rawName)) {
      totals.set(rawName, {
        sum: 0,
        games: 0,
        rankSum: 0,
        rankGames: 0,
        team,
        displayName,
      });
    }
    const entry = totals.get(rawName);
    if (displayName) {
      entry.displayName = displayName;
    }
    if (!entry.team && team) {
      entry.team = team;
    }
    entry.sum += score;
    entry.games += 1;
    if (!Number.isNaN(rank)) {
      entry.rankSum += rank;
      entry.rankGames += 1;
    }
  });

  return Array.from(totals.entries())
    .map(([tag, value]) => ({
      tag,
      displayName: value.displayName || tag,
      total: value.sum,
      avg: value.games ? value.sum / value.games : 0,
      avgRank: value.rankGames ? value.rankSum / value.rankGames : 0,
      games: value.games,
      team: value.team || "",
    }))
    .slice(0, 25);
}

function renderLeaderboard(list, query, metric) {
  const filtered = query
    ? list.filter((item) => {
        const name = String(item.displayName || "").toLowerCase();
        const tag = String(item.tag || "").toLowerCase();
        return name.includes(query) || tag.includes(query);
      })
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
  } else if (metric === "gp") {
    sorted.sort((a, b) => b.games - a.games);
  } else {
    sorted.sort((a, b) => b.avg - a.avg);
  }

  const metricLabel =
    metric === "total_score"
      ? "total"
      : metric === "avg_rank"
      ? "avg rank"
      : metric === "gp"
      ? "gp"
      : "avg";

  const teamLogo = (team) => {
    if (team === "The Future") {
      return '<img class="standings-logo" src="/assets/the-future.png" alt="The Future logo" />';
    }
    if (team === "The Lions") {
      return '<img class="standings-logo" src="/assets/the-lions.png" alt="The Lions logo" />';
    }
    if (team === "The Snipers") {
      return '<img class="standings-logo" src="/assets/the-snipers.png" alt="The Snipers logo" />';
    }
    if (team === "The Phantoms") {
      return '<img class="standings-logo" src="/assets/the-phantoms.png" alt="The Phantoms logo" />';
    }
    if (team === "Yetis") {
      return '<img class="standings-logo" src="/assets/yetis.png" alt="Yetis logo" />';
    }
    if (team === "Gus N Em") {
      return '<img class="standings-logo" src="/assets/gus-n-em.png" alt="Gus N Em logo" />';
    }
    if (team === "Cheerios") {
      return '<img class="standings-logo" src="/assets/cheerios.png" alt="Cheerios logo" />';
    }
    return "";
  };

  els.results.innerHTML = `
    <div class="leader-grid">
      ${sorted
        .map(
          (item, index) => `
            <div class="player-leader-row">
              <div class="leader-rank">#${index + 1}</div>
              <a class="leader-name" href="player-detail.html?player=${encodeURIComponent(item.tag)}">${escapeHtml(item.displayName)}</a>
              <div class="leader-team">
                ${teamLogo(item.team)}
                <a class="leader-team-link" href="team.html?team=${encodeURIComponent(item.team)}">${escapeHtml(item.team || "—")}</a>
              </div>
              <div class="leader-value">${
                metric === "total_score"
                  ? item.total.toFixed(0)
                  : metric === "avg_rank"
                  ? item.avgRank.toFixed(2)
                  : metric === "gp"
                  ? item.games
                  : item.avg.toFixed(2)
              } ${metricLabel}</div>
              <div class="leader-sub">${item.games} GP</div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

async function loadPlayerStats() {
  try {
    await loadPlayerOverrides();
    const season = getPlayerSeason();
    if (season === "c2s2-regular") {
      const response = await fetch(PLAYER_STATS_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      const rows = parseCSV(await response.text());
      if (!rows.length) {
        throw new Error("No data found.");
      }
      const header = rows[0] || [];
      playerColumns = detectPlayerColumns(header);
      playerRows = rows.slice(1);
    } else if (season === "c2s1-playoffs") {
      const response = await fetch(ARCHIVE_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      const archive = parseCSV(await response.text());
      const sliced = sliceRange(archive, ARCHIVE_RANGES.player_stats);
      const header = sliced[0] || [];
      playerColumns = detectPlayerColumns(header);
      playerRows = sliced.slice(1);
    } else {
      playerRows = [];
    }
    updateLastUpdated();
    leaderboardRows = buildLeaderboard(playerRows);
    if (season === "c2s1-regular") {
      els.results.innerHTML = "<p>No stats available for C2S1 Regular Season.</p>";
    } else {
      renderLeaderboard(leaderboardRows, "", els.filter.value);
    }
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

initPlayerSeasonSelect();
loadPlayerStats();
