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
  const src = getTeamLogoSrc(name);
  if (!src) {
    return "";
  }
  return `<img class="team-logo" src="${src}" alt="${escapeHtml(name)} logo" />`;
}

function getTeamLogoSrc(name) {
  if (name === "The Future") {
    return "/assets/the-future.png";
  }
  if (name === "The Lions") {
    return "/assets/the-lions.png";
  }
  if (name === "The Snipers") {
    return "/assets/the-snipers.png";
  }
  if (name === "The Phantoms") {
    return "/assets/the-phantoms.png";
  }
  if (name === "Yetis") {
    return "/assets/yetis.png";
  }
  if (name === "Gus N Em") {
    return "/assets/gus-n-em.png";
  }
  if (name === "Cheerios") {
    return "/assets/cheerios.png";
  }
  if (name === "Illegals") {
    return "/assets/illegals.png";
  }
  if (name === "Bullets" || name === "Storm") {
    return "/assets/storm.png";
  }
  if (name === "Turkeys") {
    return "/assets/turkeys.png";
  }
  return "";
}

function renderSmallTeamLogo(name) {
  const src = getTeamLogoSrc(String(name || "").trim());
  if (!src) {
    return "";
  }
  return `<img class="standings-logo" src="${src}" alt="${escapeHtml(
    String(name || "").trim()
  )} logo" />`;
}

function getTeamColorClass(name) {
  const clean = String(name || "").trim().toLowerCase();
  if (clean === "turkeys") return "team-color-turkeys";
  if (clean === "gus n em") return "team-color-gus";
  if (clean === "storm" || clean === "bullets") return "team-color-storm";
  if (clean === "cheerios") return "team-color-cheerios";
  if (clean === "yetis") return "team-color-yetis";
  if (clean === "illegals") return "team-color-illegals";
  if (clean === "the lions") return "team-color-lions";
  if (clean === "the future") return "team-color-future";
  if (clean === "the snipers") return "team-color-snipers";
  if (clean === "the phantoms") return "team-color-phantoms";
  return "team-color-default";
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
  const LIVE_GAME_RANGES = [
    { range: "A4:D11", format: "compact" },
    { range: "A13:G20", format: "standard" },
  ];
  const games = [];
  LIVE_GAME_RANGES.forEach(({ range, format }) => {
    const block = sliceRange(rows, range);
    if (!block.length) {
      return;
    }
    let team1 = "";
    let team2 = "";
    if (format === "compact") {
      const cellAValues = block.map((row) => String(row[0] || "").trim());
      const cellDValues = block.map((row) => String(row[3] || "").trim());
      const teamA = cellAValues.find((v) => v && !v.startsWith("@")) || "";
      const teamD = cellDValues.find((v) => v && !v.startsWith("@")) || "";

      const combinedHeader = [teamA, teamD].filter(Boolean).join(" ");
      const vsMatch = combinedHeader.match(/(.+?)\s+vs\s+(.+)/i);
      if (vsMatch) {
        team1 = String(vsMatch[1] || "").trim();
        team2 = String(vsMatch[2] || "").trim();
      } else {
        team1 = teamA;
        team2 = teamD;
      }
    } else {
      const header = block[0] || [];
      team1 = String(header[0] || "").trim();
      team2 = String(header[4] || "").trim();
    }
    if (!team1 || !team2) {
      return;
    }
    let players = [];
    let team1Players = [];
    let team2Players = [];
    if (format === "compact") {
      const lines = block.filter((row) => {
        const left = String(row[0] || "").trim();
        const right = String(row[3] || "").trim();
        return left.startsWith("@") || right.startsWith("@");
      });
      team1Players = lines.map((row) => ({
        player: row[0] || "",
        points: row[1] || "",
        rank: row[2] || "",
      }));
      team2Players = lines.map((row) => ({
        player: row[3] || "",
        points: "",
        rank: "",
      }));
      players = lines;
    } else {
      players = block
        .slice(1)
        .filter((row) => String(row[0] || row[4] || "").trim() !== "");
      team1Players = players.map((row) => ({
        player: row[0] || "",
        points: row[1] || "",
        rank: row[2] || "",
      }));
      team2Players = players.map((row) => ({
        player: row[4] || "",
        points: row[5] || "",
        rank: row[6] || "",
      }));
    }
    games.push({
      team1,
      team2,
      key: `${normalizeTeamName(team1)}|${normalizeTeamName(team2)}`,
      players,
      team1Players,
      team2Players,
    });
  });

  return games;
}

function getLiveScheduleIndexes(scheduleRows) {
  const headers = (scheduleRows[0] || []).map((h) =>
    String(h || "").trim().toLowerCase()
  );
  const findIdx = (checks) =>
    headers.findIndex((h) => checks.some((check) => h.includes(check)));

  let date = findIdx(["date"]);
  let team1 = findIdx(["team 1", "team1", "away"]);
  let team2 = findIdx(["team 2", "team2", "home"]);

  if (team1 === -1 || team2 === -1) {
    if ((scheduleRows[0] || []).length >= 4) {
      if (date === -1) {
        date = 1;
      }
      if (team1 === -1) {
        team1 = 2;
      }
      if (team2 === -1) {
        team2 = 3;
      }
    } else {
      if (date === -1) {
        date = 0;
      }
      if (team1 === -1) {
        team1 = 1;
      }
      if (team2 === -1) {
        team2 = 2;
      }
    }
  }

  return { date, team1, team2 };
}

function renderLiveScoring(rows, scheduleRows) {
  if (!rows.length) {
    els.liveRow.textContent = "No live scoring available.";
    return;
  }

  const leagueDay = extractLeagueDay(rows);
  const liveGames = parseLiveGames(rows);
  const liveMap = new Map(liveGames.map((g) => [g.key, g]));
  const scheduleIdx = getLiveScheduleIndexes(scheduleRows);

  const scheduleData = scheduleRows.slice(1);
  const scheduleGames = scheduleData
    .filter((row) => {
      const dateValue = String(row[scheduleIdx.date] || "").trim();
      return leagueDay && dateValue === leagueDay;
    })
    .map((row) => {
      const team1 = String(row[scheduleIdx.team1] || "").trim();
      const team2 = String(row[scheduleIdx.team2] || "").trim();
      const key = `${normalizeTeamName(team1)}|${normalizeTeamName(team2)}`;
      const live = liveMap.get(key);
      return {
        team1,
        team2,
        players: live ? live.players : [],
        team1Players: live ? live.team1Players : [],
        team2Players: live ? live.team2Players : [],
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
        .map((game, index) => {
          const team1Label = cleanTeamLabel(game.team1);
          const team2Label = cleanTeamLabel(game.team2);
          return `
            <div class="live-row-item ${getTeamColorClass(team1Label)} ${getTeamColorClass(
            team2Label
          )}" data-index="${index}">
              <div class="live-matchup">
                <strong class="live-team-name ${getTeamColorClass(team1Label)}">${renderSmallTeamLogo(
                  team1Label
                )}<span>${escapeHtml(game.team1)}</span></strong>
                <span>vs</span>
                <strong class="live-team-name ${getTeamColorClass(team2Label)}">${renderSmallTeamLogo(
                  team2Label
                )}<span>${escapeHtml(game.team2)}</span></strong>
              </div>
            </div>
          `;
        })
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

    const team1Players = (game.team1Players || []).length
      ? game.team1Players
      : (game.players || []).map((row) => ({
          player: row[0] || "",
          points: row[1] || "",
          rank: row[2] || "",
        }));
    const team2Players = (game.team2Players || []).length
      ? game.team2Players
      : (game.players || []).map((row) => ({
          player: row[4] || "",
          points: row[5] || "",
          rank: row[6] || "",
        }));

    const renderTeamTable = (rowsList, header) => {
      const teamLink = `team.html?team=${encodeURIComponent(
        cleanTeamLabel(header)
      )}`;
      const logo = renderSmallTeamLogo(cleanTeamLabel(header));
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
          <a class="boxscore-team" href="${teamLink}">${logo}<span>${escapeHtml(
            header
          )}</span></a>
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
