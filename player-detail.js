const PLAYER_STATS_URL = "/api/player-stats";
const BOXSCORE_CSV_URL = "/api/boxscore";
const ARCHIVE_URL = "/api/archive";
const AWARDS_URL = "/api/awards";
const SUPABASE_PLAYERS_URL = "https://wbbkjikdxpywfeyenbhs.supabase.co/rest/v1/players?select=player_tag,display_name";
const SUPABASE_API_KEY = "sb_publishable_P_4Gvh9rXEUrHS_-VZu6uw_As3f4CK3";
const PLAYER_SEASON_KEY = "playerSeason";
const SEASON_KEY = "season";

const ARCHIVE_RANGES = {
  player_stats: "A45:F117",
  boxscore: "L31:R149",
};

const TEAM_RANGES = {
  "Gus N Em": "B2:C13",
  Bullets: "E2:F13",
  Turkeys: "H2:I13",
  Cheerios: "B17:C28",
  Yetis: "E17:F28",
  Illegals: "H17:I28",
  "The Lions": "B32:C43",
  "The Future": "E32:F43",
  "The Snipers": "H32:I43",
  "The Phantoms": "B45:C56",
};

const ARCHIVE_TEAM_ROSTERS = {
  "Gus N Em": "H1:I12",
  Cheerios: "H16:I27",
  Bullets: "K1:L12",
  Yetis: "K16:L27",
  Turkeys: "N1:O12",
  Illegals: "N16:O27",
};

const els = {
  name: document.getElementById("player-name"),
  sub: document.getElementById("player-sub"),
  lastUpdated: document.getElementById("last-updated"),
  head: document.querySelector("#player-games thead"),
  body: document.querySelector("#player-games tbody"),
  modal: document.getElementById("boxscore-modal"),
  boxDetails: document.getElementById("boxscore-details"),
  sumTotal: document.getElementById("sum-total"),
  sumAvgScore: document.getElementById("sum-avg-score"),
  sumAvgRank: document.getElementById("sum-avg-rank"),
  sumGp: document.getElementById("sum-gp"),
  sumRelMean: document.getElementById("sum-rel-mean"),
  sumRelMedian: document.getElementById("sum-rel-median"),
  sumWar: document.getElementById("sum-war"),
  teamValue: document.getElementById("player-team-value"),
  awardsPanel: document.getElementById("player-awards-panel"),
  awards: document.getElementById("player-awards"),
};

let playerColumns = {
  date: 0,
  team: 1,
  player: 2,
  score: 3,
  rank: 4,
  opponent: 5,
};
let playerNameOverrides = new Map();

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

function normalizeName(value) {
  return String(value || "")
    .trim()
    .replace(/^@/, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
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

function matchesName(cellValue, target) {
  if (!cellValue || !target) {
    return false;
  }
  const normalized = normalizeName(cellValue);
  if (!normalized) {
    return false;
  }
  return (
    normalized === target ||
    normalized.includes(target) ||
    target.includes(normalized)
  );
}

async function findTeamForPlayer(season, playerName) {
  if (!playerName) {
    return "";
  }
  const target = normalizeName(playerName);
  if (season === "c2s2-regular" || season === "career") {
    const response = await fetch("/api/roster", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    const rows = parseCSV(await response.text());
    for (const [team, range] of Object.entries(TEAM_RANGES)) {
      const sliced = sliceRange(rows, range);
      const hasPlayer = sliced.some((row) =>
        row.some((cell) => matchesName(cell, target))
      );
      if (hasPlayer) {
        return team;
      }
    }
    if (season === "c2s2-regular") {
      return "";
    }
  }
  if (
    season === "c2s1-playoffs" ||
    season === "c2s1-regular" ||
    season === "career"
  ) {
    const response = await fetch(ARCHIVE_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    const archive = parseCSV(await response.text());
    for (const [team, range] of Object.entries(ARCHIVE_TEAM_ROSTERS)) {
      const sliced = sliceRange(archive, range);
      const hasPlayer = sliced.some((row) =>
        row.some((cell) => matchesName(cell, target))
      );
      if (hasPlayer) {
        return team;
      }
    }
  }
  return "";
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

function parseNumber(value) {
  const num = Number(String(value || "").replace(/[^0-9.\-]/g, ""));
  return Number.isNaN(num) ? null : num;
}

function median(numbers) {
  if (!numbers.length) {
    return null;
  }
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function buildDailyBaselines(rows) {
  const byDate = new Map();
  rows.forEach((row) => {
    const dateKey = String(row[playerColumns.date] || "").trim();
    const score = parseNumber(row[playerColumns.score]);
    if (!dateKey || score === null) {
      return;
    }
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, []);
    }
    byDate.get(dateKey).push(score);
  });

  const baselines = new Map();
  byDate.forEach((scores, dateKey) => {
    if (!scores.length) {
      return;
    }
    const sum = scores.reduce((acc, n) => acc + n, 0);
    baselines.set(dateKey, {
      mean: scores.length ? sum / scores.length : null,
      median: median(scores),
    });
  });
  return baselines;
}

function getPlayerName() {
  const params = new URLSearchParams(window.location.search);
  return params.get("player") || "";
}

function normalizeSeason(value) {
  if (
    value === "career" ||
    value === "c2s1-playoffs" ||
    value === "c2s1-regular"
  ) {
    return value;
  }
  if (value === "c2s2" || value === "c2s2-regular") {
    return "c2s2-regular";
  }
  return "c2s2-regular";
}

function getSeason() {
  const playerSeason = localStorage.getItem(PLAYER_SEASON_KEY);
  return normalizeSeason(playerSeason);
}

function initSeasonSelect() {
  const panelSelect = document.getElementById("player-season-select");
  const navSelect = document.getElementById("season-select");
  const current = getSeason();

  if (panelSelect) {
    panelSelect.value = current;
  }
  if (navSelect) {
    navSelect.value =
      current === "career" || current === "c2s2-regular"
        ? "c2s2"
        : current === "c2s1-playoffs"
        ? "c2s1-post"
        : current === "c2s1-regular"
        ? "c2s1-regular"
        : "c2s2";
  }

  if (!localStorage.getItem(PLAYER_SEASON_KEY)) {
    localStorage.setItem(PLAYER_SEASON_KEY, current);
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

function renderPlayerTeam(teamName) {
  if (!els.teamValue) {
    return;
  }
  if (!teamName) {
    els.teamValue.textContent = "—";
    return;
  }
  const logo =
    teamName === "The Future"
      ? '<img class="player-team-logo" src="/assets/the-future.png" alt="The Future logo" />'
      : teamName === "The Lions"
      ? '<img class="player-team-logo" src="/assets/the-lions.png" alt="The Lions logo" />'
      : teamName === "The Snipers"
      ? '<img class="player-team-logo" src="/assets/the-snipers.png" alt="The Snipers logo" />'
      : teamName === "The Phantoms"
      ? '<img class="player-team-logo" src="/assets/the-phantoms.png" alt="The Phantoms logo" />'
      : teamName === "Yetis"
      ? '<img class="player-team-logo" src="/assets/yetis.png" alt="Yetis logo" />'
      : teamName === "Gus N Em"
      ? '<img class="player-team-logo" src="/assets/gus-n-em.png" alt="Gus N Em logo" />'
      : teamName === "Cheerios"
      ? '<img class="player-team-logo" src="/assets/cheerios.png" alt="Cheerios logo" />'
      : teamName === "Illegals"
      ? '<img class="player-team-logo" src="/assets/illegals.png" alt="Illegals logo" />'
      : teamName === "Bullets"
      ? '<img class="player-team-logo" src="/assets/bullets.png" alt="Bullets logo" />'
      : "";
  els.teamValue.innerHTML = `${logo}<a class="leader-team-link" href="team.html?team=${encodeURIComponent(
    teamName
  )}">${escapeHtml(teamName)}</a>`;
}

function renderTable(rows) {
  const includeSeason = rows.some((row) => row && row.__seasonLabel);
  const headers = includeSeason
    ? ["Season", "Date", "Team", "Score", "Rank", "Opponent"]
    : ["Date", "Team", "Score", "Rank", "Opponent"];
  els.head.innerHTML = `
    <tr>
      ${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}
    </tr>
  `;

  els.body.innerHTML = rows
    .map(
      (row, index) => `
        <tr class="schedule-row" data-index="${index}">
          ${
            includeSeason
              ? `<td>${escapeHtml(row.__seasonLabel || "")}</td>`
              : ""
          }
          <td>${escapeHtml(row[playerColumns.date] ?? "")}</td>
          <td>${escapeHtml(row[playerColumns.team] ?? "")}</td>
          <td>${escapeHtml(row[playerColumns.score] ?? "")}</td>
          <td>${escapeHtml(row[playerColumns.rank] ?? "")}</td>
          <td>${escapeHtml(row[playerColumns.opponent] ?? "")}</td>
        </tr>
      `
    )
    .join("");
}

function updateSummary(rows, baselines) {
  if (!rows.length) {
    els.sumTotal.textContent = "—";
    els.sumAvgScore.textContent = "—";
    els.sumAvgRank.textContent = "—";
    els.sumGp.textContent = "—";
    if (els.sumRelMean) {
      els.sumRelMean.textContent = "—";
    }
    if (els.sumRelMedian) {
      els.sumRelMedian.textContent = "—";
    }
    if (els.sumWar) {
      els.sumWar.textContent = "—";
    }
    return;
  }
  let total = 0;
  let scoreGames = 0;
  let rankTotal = 0;
  let rankGames = 0;
  let relMeanSum = 0;
  let relMeanGames = 0;
  let relMedianSum = 0;
  let relMedianGames = 0;
  let warTotal = 0;

  rows.forEach((row) => {
    const score = parseNumber(row[playerColumns.score]);
    const rank = parseNumber(row[playerColumns.rank]);
    if (score !== null) {
      total += score;
      scoreGames += 1;
      const dateKey = String(row[playerColumns.date] || "").trim();
      const baseline = baselines ? baselines.get(dateKey) : null;
      if (baseline && baseline.mean && baseline.mean > 0) {
        relMeanSum += score / baseline.mean;
        relMeanGames += 1;
      }
      if (baseline && baseline.median && baseline.median > 0) {
        relMedianSum += score / baseline.median;
        relMedianGames += 1;
        const replacementScore = 0.9 * baseline.median;
        const avgMargin = 0.92 * baseline.median;
        if (avgMargin > 0) {
          warTotal += (score - replacementScore) / avgMargin;
        }
      }
    }
    if (rank !== null) {
      rankTotal += rank;
      rankGames += 1;
    }
  });

  els.sumTotal.textContent = total.toFixed(0);
  els.sumAvgScore.textContent = scoreGames
    ? (total / scoreGames).toFixed(2)
    : "—";
  els.sumAvgRank.textContent = rankGames
    ? (rankTotal / rankGames).toFixed(2)
    : "—";
  els.sumGp.textContent = String(scoreGames);
  if (els.sumRelMean) {
    els.sumRelMean.textContent = relMeanGames
      ? (relMeanSum / relMeanGames).toFixed(3)
      : "—";
  }
  if (els.sumRelMedian) {
    els.sumRelMedian.textContent = relMedianGames
      ? (relMedianSum / relMedianGames).toFixed(3)
      : "—";
  }
  if (els.sumWar) {
    els.sumWar.textContent = warTotal.toFixed(3);
  }
}

function findTeamFromStats(rows) {
  if (!rows || !rows.length) {
    return "";
  }
  const row = rows.find((r) => String(r[playerColumns.team] || "").trim());
  return row ? String(row[playerColumns.team] || "").trim() : "";
}

function renderAwards(items) {
  if (!els.awards || !els.awardsPanel) {
    return;
  }
  if (!items.length) {
    els.awardsPanel.hidden = true;
    els.awards.innerHTML = "";
    return;
  }
  els.awardsPanel.hidden = false;
  els.awards.innerHTML = `
    <div class="awards-grid">
      ${items
        .map(
          (item) => `
            <div class="awards-card">
              <div class="awards-title awards-title-center">${escapeHtml(
                item.player
              )}</div>
              <div class="awards-winner awards-winner-center">${escapeHtml(
                `${item.season} ${item.award}`
              )}</div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

async function loadAwards(playerName) {
  if (!playerName) {
    renderAwards([]);
    return;
  }
  try {
    const response = await fetch(AWARDS_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    const rows = parseCSV(await response.text());
    if (!rows.length) {
      renderAwards([]);
      return;
    }
    const seasonMap = [
      { key: "C1S1", range: "B3:B15" },
      { key: "C1S2", range: "C3:D24" },
      { key: "C1S3", range: "E3:F28" },
      { key: "C1S4", range: "G3:H27" },
      { key: "C1S5", range: "I3:J28" },
      { key: "C1S6", range: "K3:L27" },
      { key: "C2S1", range: "M3:N29" },
    ];
    const championMap = [
      { key: "C1S2", range: "C15:D24" },
      { key: "C1S3", range: "E15:F28" },
      { key: "C1S4", range: "G16:H27" },
      { key: "C1S5", range: "I16:J28" },
      { key: "C1S6", range: "K16:L27" },
      { key: "C2S1", range: "M16:N29" },
    ];
    const target = normalizeName(playerName);
    const found = [];

    seasonMap.forEach((season) => {
      const sliced = sliceRange(rows, season.range);
      sliced.forEach((row) => {
        const award = String(row[0] || "").trim();
        const winner = String(row[1] || "").trim();
        if (!award || !winner) {
          return;
        }
        if (matchesName(winner, target)) {
          found.push({ player: playerName, season: season.key, award });
        }
      });
    });

    championMap.forEach((season) => {
      const sliced = sliceRange(rows, season.range);
      sliced.forEach((row) => {
        const label = String(row[0] || "").trim();
        const winner = String(row[1] || "").trim();
        if (!label) {
          return;
        }
        if (!winner && matchesName(label, target)) {
          found.push({
            player: playerName,
            season: season.key,
            award: "Champion",
          });
        } else if (winner && matchesName(winner, target)) {
          found.push({
            player: playerName,
            season: season.key,
            award: "Champion",
          });
        }
      });
    });

    renderAwards(found);
  } catch (error) {
    renderAwards([]);
  }
}

async function loadPlayer() {
  const playerName = getPlayerName();
  await loadPlayerOverrides();
  const displayName =
    playerNameOverrides.get(normalizePlayerKey(playerName)) || playerName;
  els.name.textContent = displayName || "Player";
  if (els.sub) {
    els.sub.textContent = displayName
      ? `Game-by-game stats for ${displayName}`
      : "Missing player name.";
  }

  if (playerName.toUpperCase().startsWith("GM")) {
    renderTable([]);
    updateSummary([]);
    els.body.innerHTML = `<tr><td>No stats for GM entries.</td></tr>`;
    renderAwards([]);
    return;
  }

  try {
    const season = getSeason();
    let dataRows = [];
    let boxRows = [];
    if (season === "c2s2-regular") {
      const [playerRes, boxRes] = await Promise.all([
        fetch(PLAYER_STATS_URL, { cache: "no-store" }),
        fetch(BOXSCORE_CSV_URL, { cache: "no-store" }),
      ]);
      if (!playerRes.ok) {
        throw new Error(`Fetch failed: ${playerRes.status}`);
      }
      if (!boxRes.ok) {
        throw new Error(`Fetch failed: ${boxRes.status}`);
      }
      const rows = parseCSV(await playerRes.text());
      if (!rows.length) {
        throw new Error("No data found.");
      }
      playerColumns = detectPlayerColumns(rows[0] || []);
      dataRows = rows.slice(1);
      boxRows = parseCSV(await boxRes.text());
    } else if (season === "career") {
      const [playerRes, boxRes, archiveRes] = await Promise.all([
        fetch(PLAYER_STATS_URL, { cache: "no-store" }),
        fetch(BOXSCORE_CSV_URL, { cache: "no-store" }),
        fetch(ARCHIVE_URL, { cache: "no-store" }),
      ]);
      if (!playerRes.ok) {
        throw new Error(`Fetch failed: ${playerRes.status}`);
      }
      if (!boxRes.ok) {
        throw new Error(`Fetch failed: ${boxRes.status}`);
      }
      if (!archiveRes.ok) {
        throw new Error(`Fetch failed: ${archiveRes.status}`);
      }
      const c2s2Rows = parseCSV(await playerRes.text());
      const c2s2Box = parseCSV(await boxRes.text());
      const archive = parseCSV(await archiveRes.text());
      const c2s1PlayoffRows = sliceRange(archive, ARCHIVE_RANGES.player_stats);
      const c2s1PlayoffBox = sliceRange(archive, ARCHIVE_RANGES.boxscore);

      const c2s2Header = c2s2Rows[0] || [];
      const c2s1Header = c2s1PlayoffRows[0] || [];
      playerColumns = detectPlayerColumns(
        c2s2Header.length ? c2s2Header : c2s1Header
      );

      const annotate = (rows, label) =>
        rows.map((row) => {
          const copy = [...row];
          copy.__seasonLabel = label;
          return copy;
        });

      dataRows = [
        ...annotate(c2s2Rows.slice(1), "C2S2 Regular Season"),
        ...annotate(c2s1PlayoffRows.slice(1), "C2S1 Playoffs"),
      ];
      boxRows = [...c2s2Box, ...c2s1PlayoffBox];
    } else if (season === "c2s1-playoffs") {
      const response = await fetch(ARCHIVE_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      const archive = parseCSV(await response.text());
      const sliced = sliceRange(archive, ARCHIVE_RANGES.player_stats);
      playerColumns = detectPlayerColumns(sliced[0] || []);
      dataRows = sliced.slice(1);
      boxRows = sliceRange(archive, ARCHIVE_RANGES.boxscore);
    } else {
      dataRows = [];
      boxRows = [];
    }
    const normalize = (value) => String(value || "").trim().toLowerCase();
    const target = normalize(playerName);
    const filtered = playerName
      ? dataRows.filter(
          (row) => normalize(row[playerColumns.player]) === target
        )
      : [];

    const baselines = buildDailyBaselines(dataRows);
    if (season === "c2s1-regular") {
      els.body.innerHTML = `<tr><td>No stats available for C2S1 Regular Season.</td></tr>`;
      updateSummary([], baselines);
      const teamName = await findTeamForPlayer(season, playerName);
      renderPlayerTeam(teamName);
    } else {
      renderTable(filtered);
      updateSummary(filtered, baselines);
      const teamFromStats = findTeamFromStats(filtered);
      if (teamFromStats) {
        renderPlayerTeam(teamFromStats);
      } else {
        const teamName = await findTeamForPlayer(season, playerName);
        renderPlayerTeam(teamName);
      }
    }
    window.__playerRows = filtered;
    window.__boxScoreRows = boxRows;
    updateLastUpdated();
    loadAwards(playerName);
  } catch (error) {
    els.body.innerHTML = `<tr><td>${escapeHtml(error.message)}</td></tr>`;
  }
}

function renderBoxScore(boxScore) {
  if (!boxScore) {
    return;
  }
  const cleanTeamLabel = (name) =>
    String(name || "").replace(/\([^)]*\)/g, "").trim();
  const renderTeamTable = (rows, header) => {
    if (!rows.length) {
      return "<div class=\"boxscore-empty\">No stats available.</div>";
    }
    const teamLink = `team.html?team=${encodeURIComponent(
      cleanTeamLabel(header)
    )}`;
    const headerLine = header
      ? `<a class="boxscore-team" href="${teamLink}">${escapeHtml(header)}</a>`
      : "";
    const headerRow = `
      <div class="boxscore-row">
        <span>Player</span>
        <span>Points</span>
        <span>Rank</span>
      </div>
    `;
    const body = rows
      .map(
        (row) => `
          <div class="boxscore-row">
            <a class="boxscore-link" href="player-detail.html?player=${encodeURIComponent(
              String(row.player || "").trim()
            )}">${escapeHtml(row.player)}</a>
            <span>${escapeHtml(row.points)}</span>
            <span>${escapeHtml(row.rank)}</span>
          </div>
        `
      )
      .join("");
    return `<div class="boxscore-table">${headerLine}${headerRow}${body}</div>`;
  };

  els.boxDetails.innerHTML = `
    <div class="boxscore-meta">${escapeHtml(boxScore.dateLabel || "")}</div>
    <div class="boxscore-card">
      ${renderTeamTable(boxScore.team1, boxScore.team1Name)}
    </div>
    <div class="boxscore-card">
      ${renderTeamTable(boxScore.team2, boxScore.team2Name)}
    </div>
  `;
  els.modal.hidden = false;
}

function buildBoxScore(dateToken, opponent) {
  const rows = window.__boxScoreRows || [];
  if (!rows.length) {
    return null;
  }
  const isDateRow = (row) => {
    const a = String(row[0] || "");
    const b = String(row[1] || "");
    return (
      (a.includes("League Day") && dateToken && a.includes(dateToken)) ||
      (b.includes("League Day") && dateToken && b.includes(dateToken)) ||
      (dateToken && a.includes(dateToken)) ||
      (dateToken && b.includes(dateToken))
    );
  };

  const matchIndex = rows.findIndex(isDateRow);
  if (matchIndex === -1) {
    return null;
  }

  const teamRows = [];
  for (let i = matchIndex + 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row) {
      break;
    }
    if (isDateRow(row)) {
      break;
    }
    const hasTeam1 = String(row[0] || "").trim() !== "";
    const hasTeam2 = String(row[4] || "").trim() !== "";
    if (!hasTeam1 && !hasTeam2) {
      if (teamRows.length) {
        break;
      }
      continue;
    }
    teamRows.push(row);
  }

  const team1Rows = teamRows.filter((row) => String(row[0] || "").trim() !== "");
  const team2Rows = teamRows.filter((row) => String(row[4] || "").trim() !== "");

  const team1Header = team1Rows.length ? team1Rows[0][0] : "";
  const team2Header = team2Rows.length ? team2Rows[0][4] : "";

  const matchup = `${team1Header} ${team2Header}`.toLowerCase();
  if (opponent && !matchup.includes(opponent.toLowerCase())) {
    return null;
  }

  return {
    dateLabel: `League Day: ${dateToken}`,
    team1Name: team1Header,
    team2Name: team2Header,
    team1: team1Rows.slice(1).map((row) => ({
      player: row[0] || "",
      points: row[1] || "",
      rank: row[2] || "",
    })),
    team2: team2Rows.slice(1).map((row) => ({
      player: row[4] || "",
      points: row[5] || "",
      rank: row[6] || "",
    })),
  };
}

els.body.addEventListener("click", (event) => {
  const rowEl = event.target.closest(".schedule-row");
  if (!rowEl) {
    return;
  }
  const index = Number(rowEl.dataset.index);
  const rows = window.__playerRows || [];
  const row = rows[index];
  if (!row) {
    return;
  }
  const opponent = String(row[playerColumns.opponent] || "").trim();
  const dateValue = String(row[playerColumns.date] || "").trim();
  const dateToken = dateValue.includes("•")
    ? dateValue.split("•").pop().trim()
    : dateValue;
  const boxScore = buildBoxScore(dateToken, opponent);
  if (!boxScore) {
    els.boxDetails.innerHTML = `<div class=\"boxscore-empty\">No stats available.</div>`;
    els.modal.hidden = false;
    return;
  }
  renderBoxScore(boxScore);
});

document.addEventListener("click", (event) => {
  if (event.target.matches("[data-close=\"true\"]")) {
    els.modal.hidden = true;
  }
});

initSeasonSelect();
loadPlayer();
