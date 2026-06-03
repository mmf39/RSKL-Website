const ARCHIVE_URL = "/api/sheet?name=archive";
const C2S2_REGULAR_URL = "/api/sheet?name=c2s2-regular";
const CURRENT_BOXSCORE_URL = "/api/sheet?name=boxscore";

const C1_POST_SCHEDULES = [
  ["C1S2", "/assets/data/c1s2-post-schedule.csv"],
  ["C1S3", "/assets/data/c1s3-post-schedule.csv"],
  ["C1S4", "/assets/data/c1s4-post-schedule.csv"],
  ["C1S5", "/assets/data/c1s5-post-schedule.csv"],
  ["C1S6", "/assets/data/c1s6-post-schedule.csv"],
];

const ARCHIVE_RANGES = {
  scheduleRegular: "G31:J80",
  boxscorePost: "L31:R149",
};

const C2S2_RANGES = {
  boxscoreRegular: "K60:R1059",
};

const els = {
  grid: document.getElementById("records-grid"),
  tabs: document.getElementById("records-phase-tabs"),
  updated: document.getElementById("last-updated"),
};

let recordsState = { regular: [], postseason: [] };
let activePhase = "regular";

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

function colToIndex(value) {
  return value
    .toUpperCase()
    .split("")
    .reduce((total, char) => total * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

function sliceRange(rows, range) {
  const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
  if (!match) return [];
  const [, startCol, startRow, endCol, endRow] = match;
  return rows
    .slice(Number(startRow) - 1, Number(endRow))
    .map((row) => row.slice(colToIndex(startCol), colToIndex(endCol) + 1));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function displayTeamName(value) {
  const name = String(value || "").trim().replace(/\s+/g, " ");
  const normalized = normalizeLoose(name);
  const aliases = {
    avengers: "Karma Avengers",
    bullets: "Storm",
    cherrios: "Cheerios",
    currents: "The Currents",
    "doggy n em": "Doggy N Em",
    "dream team": "The Future",
    "gus nem": "Gus N Em",
    "gus n em": "Gus N Em",
    scorpions: "Yetis",
    storm: "Storm",
    "the currents": "The Currents",
    "the future": "The Future",
    turkeys: "Turkeys",
    yetis: "Yetis",
  };
  return aliases[normalized] || name;
}

function normalizeLoose(value) {
  return String(value || "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[:*]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function teamKey(value) {
  return normalizeLoose(displayTeamName(value));
}

function parseTeamHeader(value) {
  const match = String(value || "").match(/^(.+?)\s*\(([-\d,\s]+)\)/);
  if (!match) return null;
  const score = Number(match[2].replace(/[^\d-]/g, ""));
  if (!Number.isFinite(score)) return null;
  return { team: displayTeamName(match[1]), score };
}

function isExhibitionGame(team1, team2) {
  return /all star|gm game/i.test(`${team1} ${team2}`);
}

function buildBoxscoreGames(rows, season, phase) {
  const games = [];
  let date = "";

  rows.forEach((row) => {
    const dayMatch = String(row[0] || "").match(/League Day:\s*(.+)/i);
    if (dayMatch) {
      date = dayMatch[1].trim();
      return;
    }

    const team1 = parseTeamHeader(row[0]);
    const team2 = parseTeamHeader(row[4]);
    if (!team1 || !team2 || isExhibitionGame(team1.team, team2.team)) return;

    games.push({
      season,
      phase,
      date,
      team1: team1.team,
      team2: team2.team,
      score: `${team1.score}-${team2.score}`,
      winner:
        team1.score > team2.score ? team1.team : team2.score > team1.score ? team2.team : "TIE",
    });
  });

  return games;
}

function normalizeResultText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/cherrios/g, "cheerios")
    .replace(/gus n\s*em/g, "gus n em")
    .replace(/\s+/g, " ")
    .trim();
}

function parseResultScore(result, team, opponent) {
  const names = [normalizeLoose(team), normalizeLoose(opponent)].sort((a, b) => b.length - a.length);
  let text = normalizeResultText(result);
  names.forEach((name) => {
    text = text.replaceAll(name, `|${name}|`);
  });

  const parts = text.split("|").filter(Boolean);
  for (let i = 0; i < parts.length; i += 1) {
    const part = normalizeLoose(parts[i]);
    if (part !== normalizeLoose(team)) continue;
    const afterNumbers = Array.from(String(parts[i + 1] || "").matchAll(/\d[\d ]*/g))
      .map((match) => Number(match[0].replace(/\s/g, "")))
      .filter(Number.isFinite);
    const beforeNumbers = Array.from(String(parts[i - 1] || "").matchAll(/\d[\d ]*/g))
      .map((match) => Number(match[0].replace(/\s/g, "")))
      .filter(Number.isFinite);
    return afterNumbers[0] ?? beforeNumbers[beforeNumbers.length - 1] ?? null;
  }

  return null;
}

function buildArchiveRegularGames(rows) {
  return sliceRange(rows, ARCHIVE_RANGES.scheduleRegular)
    .slice(2)
    .filter((row) => row[0] && row[1] && row[2] && row[3])
    .map(([date, team1Raw, team2Raw, result]) => {
      const team1 = displayTeamName(team1Raw);
      const team2 = displayTeamName(team2Raw);
      const score1 = parseResultScore(result, team1, team2);
      const score2 = parseResultScore(result, team2, team1);
      if (!Number.isFinite(score1) || !Number.isFinite(score2)) return null;
      return {
        season: "C2S1",
        phase: "regular",
        date,
        team1,
        team2,
        score: `${score1}-${score2}`,
        winner: score1 > score2 ? team1 : score2 > score1 ? team2 : "TIE",
      };
    })
    .filter(Boolean);
}

function buildPostseasonScheduleGames(rows, season) {
  return rows
    .slice(1)
    .filter((row) => row[1] && row[2] && row[4])
    .map(([date, team1, team2, gameType, winner]) => ({
      season,
      phase: "postseason",
      date,
      team1: displayTeamName(team1),
      team2: displayTeamName(team2),
      gameType,
      score: "",
      winner: displayTeamName(winner),
    }));
}

function getTeamResult(game, team) {
  const teamWon = teamKey(game.winner) === teamKey(team);
  const tied = teamKey(game.winner) === "tie";
  if (tied) return "tie";
  return teamWon ? "win" : "loss";
}

function collectStreaks(games, type) {
  const byTeamSeason = new Map();
  games.forEach((game, index) => {
    [game.team1, game.team2].forEach((team) => {
      const key = `${game.season}|${teamKey(team)}`;
      if (!byTeamSeason.has(key)) {
        byTeamSeason.set(key, { team: displayTeamName(team), season: game.season, games: [] });
      }
      byTeamSeason.get(key).games.push({ ...game, sourceIndex: index });
    });
  });

  const streaks = [];
  byTeamSeason.forEach(({ team, season, games: teamGames }) => {
    let current = [];
    const finishCurrent = () => {
      if (!current.length) return;
      streaks.push({
        type,
        team,
        season,
        length: current.length,
        start: current[0],
        end: current[current.length - 1],
        games: current,
      });
      current = [];
    };

    teamGames.forEach((game) => {
      const result = getTeamResult(game, team);
      const matches =
        type === "losses"
          ? result === "loss"
          : type === "unbeaten"
          ? result !== "loss"
          : result === "win";

      if (matches) {
        current.push(game);
      } else {
        finishCurrent();
      }
    });
    finishCurrent();
  });

  return streaks.sort((a, b) => b.length - a.length || a.team.localeCompare(b.team));
}

function recordCards(games) {
  return [
    {
      title: "Longest Win Streak",
      note: "Consecutive wins inside one season phase.",
      rows: collectStreaks(games, "wins").slice(0, 5),
    },
    {
      title: "Longest Unbeaten Streak",
      note: "Wins and ties count. Losses stop the streak.",
      rows: collectStreaks(games, "unbeaten").slice(0, 5),
    },
    {
      title: "Longest Losing Streak",
      note: "Consecutive losses inside one season phase.",
      rows: collectStreaks(games, "losses").slice(0, 5),
    },
  ];
}

function gameSummary(game, team) {
  const opponent = teamKey(game.team1) === teamKey(team) ? game.team2 : game.team1;
  const result = getTeamResult(game, team).toUpperCase();
  const score = game.score ? `, ${game.score}` : "";
  return `${game.date}: ${result} vs ${opponent}${score}`;
}

function renderRecordCard(card) {
  const rows = card.rows.length
    ? card.rows
        .map((row, index) => {
          const gameItems = row.games
            .map((game) => `<li>${escapeHtml(gameSummary(game, row.team))}</li>`)
            .join("");
          return `
            <article class="record-row ${index === 0 ? "record-row--top" : ""}">
              <div class="record-rank">${index + 1}</div>
              <div class="record-main">
                <div class="record-team">${escapeHtml(row.team)}</div>
                <div class="record-meta">${escapeHtml(row.season)} • ${escapeHtml(row.start.date)} to ${escapeHtml(row.end.date)}</div>
                <details class="record-details">
                  <summary>Games in streak</summary>
                  <ol>${gameItems}</ol>
                </details>
              </div>
              <div class="record-value">${row.length}</div>
            </article>
          `;
        })
        .join("")
    : '<div class="dashboard-state-card">No verified games found for this record yet.</div>';

  return `
    <section class="panel record-card">
      <div class="record-card-head">
        <div>
          <span class="dashboard-kicker">${escapeHtml(card.note)}</span>
          <h2>${escapeHtml(card.title)}</h2>
        </div>
      </div>
      <div class="record-list">${rows}</div>
    </section>
  `;
}

function renderRecords() {
  const games = recordsState[activePhase] || [];
  const cards = recordCards(games);
  els.grid.innerHTML = cards.map(renderRecordCard).join("");
}

async function fetchCsv(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
  return parseCSV(await response.text());
}

async function fetchCsvSafe(url) {
  try {
    return await fetchCsv(url);
  } catch (_) {
    return [];
  }
}

async function loadRecords() {
  const [archiveRows, c2s2Rows, currentRows, ...c1PostRows] = await Promise.all([
    fetchCsvSafe(ARCHIVE_URL),
    fetchCsvSafe(C2S2_REGULAR_URL),
    fetchCsvSafe(CURRENT_BOXSCORE_URL),
    ...C1_POST_SCHEDULES.map(([, url]) => fetchCsvSafe(url)),
  ]);

  const postseason = [
    ...c1PostRows.flatMap((rows, index) => buildPostseasonScheduleGames(rows, C1_POST_SCHEDULES[index][0])),
    ...buildBoxscoreGames(sliceRange(archiveRows, ARCHIVE_RANGES.boxscorePost), "C2S1", "postseason"),
  ];

  const regular = [
    ...buildArchiveRegularGames(archiveRows),
    ...buildBoxscoreGames(sliceRange(c2s2Rows, C2S2_RANGES.boxscoreRegular), "C2S2", "regular"),
    ...buildBoxscoreGames(currentRows, "C2S3", "regular"),
  ];

  recordsState = { regular, postseason };
  if (els.updated) {
    els.updated.textContent = `Last updated: ${new Date().toLocaleString()}`;
  }
  renderRecords();
}

if (els.tabs) {
  els.tabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-phase]");
    if (!button) return;
    activePhase = button.dataset.phase || "regular";
    els.tabs.querySelectorAll("[data-phase]").forEach((tab) => {
      tab.classList.toggle("active", tab === button);
    });
    renderRecords();
  });
}

loadRecords().catch((error) => {
  els.grid.innerHTML = `<div class="dashboard-state-card">Unable to load records: ${escapeHtml(error.message)}</div>`;
});
