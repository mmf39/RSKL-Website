const SCHEDULE_CSV_URL = "/api/sheet?name=schedule";
const BOXSCORE_CSV_URL = "/api/sheet?name=boxscore";
const ARCHIVE_URL = "/api/sheet?name=archive";
const SEASON_KEY = "season";

const els = {
  lastUpdated: document.getElementById("last-updated"),
  search: document.getElementById("schedule-search"),
  modal: document.getElementById("boxscore-modal"),
  boxDetails: document.getElementById("boxscore-details"),
  month: document.getElementById("calendar-month"),
  prev: document.getElementById("calendar-prev"),
  next: document.getElementById("calendar-next"),
  grid: document.getElementById("calendar-grid"),
  games: document.getElementById("calendar-games"),
};

let cachedBoxScoreRows = [];
let scheduleGames = [];
let gamesByDate = new Map();
let currentMonth = null;
let selectedDateKey = "";

const ARCHIVE_RANGES = {
  schedule_regular: "G31:I79",
  schedule_post: "A31:D43",
  boxscore: "L31:R149",
};
const C2S2_SCHEDULE_RANGE = "A2:C77";

function getSeason() {
  return localStorage.getItem(SEASON_KEY) || "c2s2";
}

function initSeasonSelect() {
  const select = document.getElementById("season-select");
  if (!select) return;
  select.value = getSeason();
  select.addEventListener("change", () => {
    localStorage.setItem(SEASON_KEY, select.value);
    location.reload();
  });
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
      if (char === "\r" && next === "\n") i += 1;
      row.push(value.trim());
      if (row.length > 1 || row[0] !== "") rows.push(row);
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
  if (!match) return null;
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
  if (!parsed) return [];
  return rows
    .slice(parsed.startRow, parsed.endRow + 1)
    .map((row) => row.slice(parsed.startCol, parsed.endCol + 1));
}

function getC2S2ScheduleRows(rows) {
  const sliced = sliceRange(rows, C2S2_SCHEDULE_RANGE);
  return [["Date", "Team 1", "Team 2"], ...sliced];
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function displayTeamName(value) {
  const name = String(value || "").trim();
  return name === "Bullets" ? "Storm" : name;
}

function getTeamLogo(team) {
  const clean = displayTeamName(team);
  if (clean === "The Future") return "/assets/the-future.png";
  if (clean === "The Lions") return "/assets/the-lions.png";
  if (clean === "The Snipers") return "/assets/the-snipers.png";
  if (clean === "The Phantoms") return "/assets/the-phantoms.png";
  if (clean === "Yetis") return "/assets/yetis.png";
  if (clean === "Gus N Em") return "/assets/gus-n-em.png";
  if (clean === "Cheerios") return "/assets/cheerios.png";
  if (clean === "Illegals") return "/assets/illegals.png";
  if (clean === "Storm" || clean === "Bullets") return "/assets/storm.png";
  if (clean === "Turkeys") return "/assets/turkeys.png";
  return "";
}

function normalizeDateToken(value) {
  const text = String(value || "").trim();
  const match = text.match(/(\d{1,2}\/\d{1,2})(?:\/\d{2,4})?/);
  return match ? match[1] : "";
}

function parseDateFromToken(token) {
  const m = String(token || "").match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;
  const month = Number(m[1]) - 1;
  const day = Number(m[2]);
  const year = new Date().getFullYear();
  const d = new Date(year, month, day);
  if (Number.isNaN(d.getTime())) return null;
  return d;
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

function buildGames(rows, season) {
  const isThreeCol = (rows[0] || []).length <= 3;
  const dateIndex = isThreeCol || season === "c2s1-regular" ? 0 : 1;
  const team1Index = isThreeCol || season === "c2s1-regular" ? 1 : 2;
  const team2Index = isThreeCol || season === "c2s1-regular" ? 2 : 3;

  const dataRows = rows.slice(1).filter((r) => r.some((c) => String(c || "").trim() !== ""));
  return dataRows
    .map((row, i) => {
      const rawDate = String(row[dateIndex] || "").trim();
      const dateToken = normalizeDateToken(rawDate);
      const dateObj = parseDateFromToken(dateToken);
      const team1 = displayTeamName(String(row[team1Index] || "").trim());
      const team2 = displayTeamName(String(row[team2Index] || "").trim());
      if (!dateToken || !team1 || !team2) return null;
      return {
        idx: i,
        rawDate,
        dateToken,
        dateObj,
        team1,
        team2,
      };
    })
    .filter(Boolean);
}

function rebuildGamesByDate() {
  gamesByDate = new Map();
  scheduleGames.forEach((g) => {
    if (!gamesByDate.has(g.dateToken)) gamesByDate.set(g.dateToken, []);
    gamesByDate.get(g.dateToken).push(g);
  });
}

function formatMonthLabel(d) {
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

function getMonthBounds(d) {
  return {
    first: new Date(d.getFullYear(), d.getMonth(), 1),
    last: new Date(d.getFullYear(), d.getMonth() + 1, 0),
  };
}

function renderCalendar() {
  if (!els.grid || !currentMonth) return;
  const { first, last } = getMonthBounds(currentMonth);
  if (els.month) els.month.textContent = formatMonthLabel(first);

  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const cells = [];

  weekday.forEach((w) => cells.push(`<div class="calendar-weekday">${w}</div>`));
  for (let i = 0; i < first.getDay(); i += 1) {
    cells.push('<div class="calendar-day empty"></div>');
  }

  for (let day = 1; day <= last.getDate(); day += 1) {
    const token = `${first.getMonth() + 1}/${day}`;
    const hasGames = gamesByDate.has(token);
    const isSelected = token === selectedDateKey;
    cells.push(`
      <button class="calendar-day ${hasGames ? "has-games" : ""} ${isSelected ? "selected" : ""}" data-date="${token}" type="button">
        <span class="calendar-num">${day}</span>
        ${hasGames ? `<span class="calendar-dot">${gamesByDate.get(token).length}</span>` : ""}
      </button>
    `);
  }

  els.grid.innerHTML = cells.join("");
}

function findBoxScoreRowsForDate(dateToken) {
  if (!dateToken || !cachedBoxScoreRows.length) return [];
  const isDateRow = (row) => {
    const a = String(row[0] || "");
    const b = String(row[1] || "");
    return (
      (a.includes("League Day") && a.includes(dateToken)) ||
      (b.includes("League Day") && b.includes(dateToken)) ||
      a.includes(dateToken) ||
      b.includes(dateToken)
    );
  };

  const start = cachedBoxScoreRows.findIndex(isDateRow);
  if (start === -1) return [];

  const out = [];
  for (let i = start + 1; i < cachedBoxScoreRows.length; i += 1) {
    const row = cachedBoxScoreRows[i];
    if (!row) break;
    if (isDateRow(row)) break;
    const hasTeam1 = String(row[0] || "").trim() !== "";
    const hasTeam2 = String(row[4] || "").trim() !== "";
    if (!hasTeam1 && !hasTeam2) {
      if (out.length) break;
      continue;
    }
    out.push(row);
  }
  return out;
}

function renderBoxScore(game) {
  const rows = findBoxScoreRowsForDate(game.dateToken);

  const toTeamRows = (rowsIn, side) => {
    if (side === 1) {
      return rowsIn.filter((r) => String(r[0] || "").trim() !== "");
    }
    return rowsIn.filter((r) => String(r[4] || "").trim() !== "");
  };

  const team1Rows = toTeamRows(rows, 1);
  const team2Rows = toTeamRows(rows, 2);
  const team1Header = team1Rows.length ? team1Rows[0][0] : game.team1;
  const team2Header = team2Rows.length ? team2Rows[0][4] : game.team2;

  const mapRows = (arr, side) =>
    arr.slice(1).map((row) =>
      side === 1
        ? { player: row[0] || "", points: row[1] || "", rank: row[2] || "" }
        : { player: row[4] || "", points: row[5] || "", rank: row[6] || "" }
    );

  const team1 = mapRows(team1Rows, 1);
  const team2 = mapRows(team2Rows, 2);

  const cleanTeamLabel = (name) => String(name || "").replace(/\([^)]*\)/g, "").trim();
  const renderTeamTable = (players, header) => {
    const cleanHeader = displayTeamName(cleanTeamLabel(header));
    const logo = getTeamLogo(cleanHeader);
    const logoHtml = logo
      ? `<img class="standings-logo" src="${logo}" alt="${escapeHtml(cleanHeader)} logo" />`
      : "";
    const teamLink = `/team.html?team=${encodeURIComponent(cleanHeader)}`;
    const body = players.length
      ? players
          .map(
            (p) => `
              <div class="boxscore-row">
                <a class="boxscore-link" href="/player-detail.html?player=${encodeURIComponent(String(p.player || "").trim())}">${escapeHtml(p.player)}</a>
                <span>${escapeHtml(p.points)}</span>
                <span>${escapeHtml(p.rank)}</span>
              </div>
            `
          )
          .join("")
      : '<div class="boxscore-empty">No stats available.</div>';

    return `
      <div class="boxscore-card">
        <a class="boxscore-team" href="${teamLink}">${logoHtml}<span>${escapeHtml(cleanHeader)}</span></a>
        <div class="boxscore-row"><span>Player</span><span>Points</span><span>Rank</span></div>
        ${body}
      </div>
    `;
  };

  els.boxDetails.innerHTML = `
    <div class="boxscore-meta">League Day: ${escapeHtml(game.dateToken)}</div>
    ${renderTeamTable(team1, team1Header)}
    ${renderTeamTable(team2, team2Header)}
  `;
  els.modal.hidden = false;
}

function renderGameList() {
  if (!els.games) return;
  const term = String(els.search?.value || "").trim().toLowerCase();

  let games = selectedDateKey ? (gamesByDate.get(selectedDateKey) || []) : [];
  if (!selectedDateKey && currentMonth) {
    const month = currentMonth.getMonth() + 1;
    games = scheduleGames.filter((g) => String(g.dateToken).startsWith(`${month}/`));
  }

  const filtered = term
    ? games.filter((g) =>
        [g.team1, g.team2, g.rawDate, g.dateToken].join(" ").toLowerCase().includes(term)
      )
    : games;

  if (!filtered.length) {
    els.games.innerHTML = '<div class="gm-empty">No games found.</div>';
    return;
  }

  els.games.innerHTML = filtered
    .map((g, idx) => {
      const logo1 = getTeamLogo(g.team1);
      const logo2 = getTeamLogo(g.team2);
      const l1 = logo1
        ? `<img class="standings-logo" src="${logo1}" alt="${escapeHtml(g.team1)} logo" />`
        : "";
      const l2 = logo2
        ? `<img class="standings-logo" src="${logo2}" alt="${escapeHtml(g.team2)} logo" />`
        : "";
      return `
        <button class="calendar-game" type="button" data-game-index="${g.idx}">
          <div class="calendar-game-date">${escapeHtml(g.dateToken)}</div>
          <div class="calendar-game-matchup">
            <a class="schedule-team-link" href="/team.html?team=${encodeURIComponent(g.team1)}">${l1}<span>${escapeHtml(g.team1)}</span></a>
            <span>vs</span>
            <a class="schedule-team-link" href="/team.html?team=${encodeURIComponent(g.team2)}">${l2}<span>${escapeHtml(g.team2)}</span></a>
          </div>
        </button>
      `;
    })
    .join("");
}

function bindCalendarEvents() {
  if (els.prev) {
    els.prev.addEventListener("click", () => {
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      selectedDateKey = "";
      renderCalendar();
      renderGameList();
    });
  }
  if (els.next) {
    els.next.addEventListener("click", () => {
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
      selectedDateKey = "";
      renderCalendar();
      renderGameList();
    });
  }

  if (els.grid) {
    els.grid.addEventListener("click", (event) => {
      const cell = event.target.closest("[data-date]");
      if (!cell) return;
      selectedDateKey = String(cell.dataset.date || "");
      renderCalendar();
      renderGameList();
    });
  }

  if (els.games) {
    els.games.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (link) return;
      const card = event.target.closest("[data-game-index]");
      if (!card) return;
      const idx = Number(card.dataset.gameIndex);
      const game = scheduleGames[idx];
      if (!game) return;
      renderBoxScore(game);
    });
  }

  if (els.search) {
    els.search.addEventListener("input", () => {
      renderGameList();
    });
  }

  document.addEventListener("click", (event) => {
    if (event.target.matches('[data-close="true"]')) {
      els.modal.hidden = true;
    }
  });
}

async function loadSchedule() {
  try {
    const season = getSeason();
    let rows = [];

    if (season === "c2s2") {
      const response = await fetch(SCHEDULE_CSV_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      rows = getC2S2ScheduleRows(parseCSV(await response.text()));
      const boxRes = await fetch(BOXSCORE_CSV_URL, { cache: "no-store" });
      cachedBoxScoreRows = parseCSV(await boxRes.text()).slice(0, 1000);
    } else {
      const response = await fetch(ARCHIVE_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      const archive = parseCSV(await response.text());
      const range = season === "c2s1-post" ? ARCHIVE_RANGES.schedule_post : ARCHIVE_RANGES.schedule_regular;
      rows = sliceRange(archive, range);
      cachedBoxScoreRows = sliceRange(archive, ARCHIVE_RANGES.boxscore);
    }

    if (!rows.length) throw new Error("No data found.");

    scheduleGames = buildGames(rows, season);
    rebuildGamesByDate();

    if (!scheduleGames.length) throw new Error("No games found.");

    const firstGameDate = scheduleGames.find((g) => g.dateObj)?.dateObj || new Date();
    currentMonth = new Date(firstGameDate.getFullYear(), firstGameDate.getMonth(), 1);
    selectedDateKey = scheduleGames[0].dateToken;

    renderCalendar();
    renderGameList();
    updateLastUpdated();
  } catch (error) {
    if (els.games) {
      els.games.innerHTML = `<div class="gm-empty">${escapeHtml(error.message)}</div>`;
    }
  }
}

initSeasonSelect();
bindCalendarEvents();
loadSchedule();
