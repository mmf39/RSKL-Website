const STANDINGS_CSV_URL = "/api/sheet?name=standings-dashboard";
const STANDINGS_RECORDS_URL = "/api/sheet?name=standings";
const TEAMS_CSV_URL = "/api/sheet?name=teams";
const LIVE_SCORING_URL = "/api/sheet?name=live-scoring";
const ARCHIVE_URL = "/api/sheet?name=archive";
const SEASON_KEY = "season";

const AUTO_REFRESH_MS = 5 * 60 * 1000;

const els = {
  lastUpdated: document.getElementById("last-updated"),
  teamsGrid: document.getElementById("teams-grid"),
  standingsLink: document.getElementById("standings-link"),
  teamsLink: document.getElementById("teams-link"),
  liveRow: document.getElementById("live-scoring"),
  liveModal: document.getElementById("live-modal"),
  liveDetails: document.getElementById("live-details"),
};

const TEAMS_LIMIT = 10;


els.standingsLink.href = STANDINGS_CSV_URL;
els.teamsLink.href = TEAMS_CSV_URL;

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

function getSeason() {
  return localStorage.getItem(SEASON_KEY) || "c2s2";
}

function initSeasonSelect() {
  const select = document.getElementById("season-select");
  if (!select) {
    return;
  }
  select.value = getSeason();
  select.addEventListener("change", () => {
    localStorage.setItem(SEASON_KEY, select.value);
    location.reload();
  });
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


const TEAM_RANGES = {
  "Gus N Em": "B2:C13",
  Storm: "E2:F13",
  Turkeys: "H2:I13",
  Cheerios: "B17:C28",
  Yetis: "E17:F28",
  Illegals: "H17:I28",
  "The Lions": "B32:C43",
  "The Future": "E32:F43",
  "The Snipers": "H32:I43",
  "The Phantoms": "B45:C56",
};

const TEAM_RECORD_RANGES = {
  Turkeys: { record: "J3:K3", winPct: "M3:M3" },
  "Gus N Em": { record: "J4:K4", winPct: "M4:M4" },
  Storm: { record: "J5:K5", winPct: "M5:M5" },
  Cheerios: { record: "J6:K6", winPct: "M6:M6" },
  Yetis: { record: "J7:K7", winPct: "M7:M7" },
  Illegals: { record: "J8:K8", winPct: "M8:M8" },
  "The Lions": { record: "J9:K9", winPct: "M9:M9" },
  "The Future": { record: "J10:K10", winPct: "M10:M10" },
  "The Phantoms": { record: "J11:K11", winPct: "M11:M11" },
  "The Snipers": { record: "J12:K12", winPct: "M12:M12" },
};

const ARCHIVE_RANGES = {
  standings: "A1:F7",
  teams: "H1:O27",
  schedule_regular: "G31:I79",
  schedule_post: "A31:D43",
  bracket: "A9:F15",
  boxscore: "L31:R149",
  player_stats: "A45:F117",
};

function getTeamLogo(name) {
  if (name === "The Future") {
    return '<img class="team-logo" src="/assets/the-future.png" alt="The Future logo" />';
  }
  if (name === "The Lions") {
    return '<img class="team-logo" src="/assets/the-lions.png" alt="The Lions logo" />';
  }
  if (name === "The Snipers") {
    return '<img class="team-logo" src="/assets/the-snipers.png" alt="The Snipers logo" />';
  }
  if (name === "The Phantoms") {
    return '<img class="team-logo" src="/assets/the-phantoms.png" alt="The Phantoms logo" />';
  }
  if (name === "Yetis") {
    return '<img class="team-logo" src="/assets/yetis.png" alt="Yetis logo" />';
  }
  if (name === "Gus N Em") {
    return '<img class="team-logo" src="/assets/gus-n-em.png" alt="Gus N Em logo" />';
  }
  if (name === "Cheerios") {
    return '<img class="team-logo" src="/assets/cheerios.png" alt="Cheerios logo" />';
  }
  if (name === "Illegals") {
    return '<img class="team-logo" src="/assets/illegals.png" alt="Illegals logo" />';
  }
  if (name === "Bullets" || name === "Storm") {
    return '<img class="team-logo" src="/assets/storm.png" alt="Storm logo" />';
  }
  if (name === "Turkeys") {
    return '<img class="team-logo" src="/assets/turkeys.png" alt="Turkeys logo" />';
  }
  return "";
}

function renderTeamsCards(standingsRecordRows) {
  const teamNames = Object.keys(TEAM_RANGES).slice(0, TEAMS_LIMIT);
  if (!teamNames.length) {
    els.teamsGrid.innerHTML = "<p>No team data available.</p>";
    return;
  }

  els.teamsGrid.innerHTML = teamNames
    .map((name) => {
      const link = `team.html?team=${encodeURIComponent(name)}`;
      const logo = getTeamLogo(name);
      const ranges = TEAM_RECORD_RANGES[name];
      const recordSlice =
        ranges && standingsRecordRows.length
          ? sliceRange(standingsRecordRows, ranges.record)
          : [];
      const winPctSlice =
        ranges && standingsRecordRows.length
          ? sliceRange(standingsRecordRows, ranges.winPct)
          : [];
      const record =
        recordSlice.length && recordSlice[0].length >= 2
          ? `${recordSlice[0][0]}-${recordSlice[0][1]}`
          : "—";
      const winPct =
        winPctSlice.length && winPctSlice[0].length
          ? winPctSlice[0][0]
          : "—";
      return `
        <a class="team-card" href="${link}">
          ${logo}
          <div class="team-title">${escapeHtml(name)}</div>
          <div class="team-record">
            <span>Record</span>
            <strong>${escapeHtml(record)}</strong>
          </div>
          <div class="team-record small">
            <span>Win %</span>
            <strong>${escapeHtml(winPct || "—")}</strong>
          </div>
        </a>
      `;
    })
    .join("");
}

function renderTeamsCardsArchive(standingsRows) {
  const headers = standingsRows[0] || [];
  const dataRows = standingsRows.slice(1);
  const lower = headers.map((h) => h.toLowerCase());
  const teamIdx = lower.findIndex((h) => h.includes("team"));
  const winsIdx = lower.findIndex((h) => h.includes("win"));
  const lossIdx = lower.findIndex((h) => h.includes("loss"));
  const winPctIdx = lower.findIndex((h) => h.includes("win %") || h.includes("win%"));

  const teams = dataRows
    .map((row) => ({
      name: row[teamIdx !== -1 ? teamIdx : 0],
      wins: row[winsIdx],
      losses: row[lossIdx],
      winPct: row[winPctIdx],
    }))
    .filter((row) => row.name);

  els.teamsGrid.innerHTML = teams
    .slice(0, TEAMS_LIMIT)
    .map((team) => {
      const link = `team.html?team=${encodeURIComponent(team.name)}`;
      const logo = getTeamLogo(team.name);
      const record =
        team.wins !== undefined && team.losses !== undefined
          ? `${team.wins}-${team.losses}`
          : "—";
      const winPct = team.winPct ?? "—";
      return `
        <a class="team-card" href="${link}">
          ${logo}
          <div class="team-title">${escapeHtml(team.name)}</div>
          <div class="team-record">
            <span>Record</span>
            <strong>${escapeHtml(record)}</strong>
          </div>
          <div class="team-record small">
            <span>Win %</span>
            <strong>${escapeHtml(winPct)}</strong>
          </div>
        </a>
      `;
    })
    .join("");
}

function normalizeTeamName(name) {
  return String(name || "")
    .replace(/\([^)]*\)/g, "")
    .trim()
    .toLowerCase();
}

function cleanTeamLabel(name) {
  return String(name || "").replace(/\([^)]*\)/g, "").trim();
}

function extractLeagueDay(rows) {
  const row = rows.find(
    (r) =>
      String(r[0] || "").includes("League Day") ||
      String(r[1] || "").includes("League Day")
  );
  if (!row) {
    return "";
  }
  const cell = String(row[0] || row[1] || "");
  const parts = cell.split(":");
  return parts.length > 1 ? parts[1].trim() : cell.trim();
}

function parseLiveGames(rows) {
  const startIndex = 4; // row 5 (0-based index)
  const blockSize = 6; // A5:G10 (header + 5 rows)
  const games = [];

  for (let i = startIndex; i < rows.length; i += blockSize) {
    const header = rows[i];
    if (!header) {
      continue;
    }
    const team1 = header[0] || "Team 1";
    const team2 = header[4] || "Team 2";
    const players = rows.slice(i + 1, i + blockSize);
    games.push({
      team1,
      team2,
      key: `${normalizeTeamName(team1)}|${normalizeTeamName(team2)}`,
      players,
    });
  }

  return games;
}

function renderLiveScoring(rows, scheduleRows) {
  if (!rows.length) {
    els.liveRow.textContent = "No live scoring available.";
    return;
  }

  const leagueDay = extractLeagueDay(rows);
  const liveGames = parseLiveGames(rows);
  const liveMap = new Map(liveGames.map((g) => [g.key, g]));

  const scheduleData = scheduleRows.slice(1);
  const scheduleGames = scheduleData
    .filter((row) => {
      const dateA = String(row[0] || "").trim();
      const dateB = String(row[1] || "").trim();
      return leagueDay && (dateA === leagueDay || dateB === leagueDay);
    })
    .map((row) => {
      const team1 = row[2] || row[1] || "";
      const team2 = row[3] || row[2] || "";
      const key = `${normalizeTeamName(team1)}|${normalizeTeamName(team2)}`;
      const live = liveMap.get(key);
      return {
        team1,
        team2,
        players: live ? live.players : [],
      };
    });

  const games = scheduleGames.length ? scheduleGames : liveGames;

  if (!games.length) {
    els.liveRow.textContent = "No live games found for this day.";
    return;
  }

  els.liveRow.innerHTML = `
    <div class="live-count">${games.length} live game${games.length === 1 ? "" : "s"}${leagueDay ? ` • ${escapeHtml(leagueDay)}` : ""}</div>
    <div class="live-list">
      ${games
        .map(
          (game, index) => `
            <div class="live-row-item" data-index="${index}">
              <div>
                <strong>${escapeHtml(game.team1)}</strong>
                <span>vs</span>
                <strong>${escapeHtml(game.team2)}</strong>
              </div>
            </div>
          `
        )
        .join("")}
    </div>
  `;

  els.liveRow.onclick = (event) => {
    const rowEl = event.target.closest(".live-row-item");
    if (!rowEl) {
      return;
    }
    const index = Number(rowEl.dataset.index);
    const game = games[index];
    if (!game) {
      return;
    }

    const team1Players = (game.players || []).map((row) => ({
      player: row[0] || "",
      points: row[1] || "",
      rank: row[2] || "",
    }));
    const team2Players = (game.players || []).map((row) => ({
      player: row[4] || "",
      points: row[5] || "",
      rank: row[6] || "",
    }));

    const renderTeamTable = (rowsList, header) => {
      const teamLink = `team.html?team=${encodeURIComponent(
        cleanTeamLabel(header)
      )}`;
      const body = rowsList
        .filter((row) => String(row.player || "").trim() !== "")
        .map(
          (row) => `
            <div class="boxscore-row">
              <a class="boxscore-link" href="/player-detail.html?player=${encodeURIComponent(
                String(row.player || "").trim()
              )}">${escapeHtml(row.player)}</a>
              <span>${escapeHtml(row.points)}</span>
              <span>${escapeHtml(row.rank)}</span>
            </div>
          `
        )
        .join("");
      return `
        <div class="boxscore-card">
          <a class="boxscore-team" href="${teamLink}">${escapeHtml(header)}</a>
          <div class="boxscore-row">
            <span>Player</span>
            <span>Points</span>
            <span>Rank</span>
          </div>
          ${body || '<div class="boxscore-empty">No stats available.</div>'}
        </div>
      `;
    };

    els.liveDetails.innerHTML = `
      ${renderTeamTable(team1Players, game.team1)}
      ${renderTeamTable(team2Players, game.team2)}
    `;
    els.liveModal.hidden = false;
  };
}

async function fetchSheet(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status}`);
  }
  const text = await response.text();
  const rows = parseCSV(text);
  if (!rows.length) {
    throw new Error("No data found.");
  }
  return rows;
}

async function loadData() {
  try {
    const season = getSeason();
    if (season === "c2s2") {
      const [standingsRecordData, liveData, scheduleData] = await Promise.all([
        fetchSheet(STANDINGS_RECORDS_URL),
        fetchSheet(LIVE_SCORING_URL),
        fetchSheet("/api/sheet?name=schedule"),
      ]);
      renderTeamsCards(standingsRecordData);
      renderLiveScoring(liveData, scheduleData);
      els.liveRow.parentElement.style.display = "";
    } else {
      const archive = await fetchSheet(ARCHIVE_URL);
      const standings = sliceRange(archive, ARCHIVE_RANGES.standings);
      renderTeamsCardsArchive(standings);
      els.liveRow.parentElement.style.display = "none";
    }
    updateLastUpdated();
  } catch (error) {
    els.teamsGrid.innerHTML = "";
    els.liveRow.textContent = "Live scoring unavailable.";
  }
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

initSeasonSelect();
loadData();
setInterval(loadData, AUTO_REFRESH_MS);

document.addEventListener("click", (event) => {
  if (event.target.matches("[data-close=\"true\"]")) {
    els.liveModal.hidden = true;
  }
});
