const ARCHIVE_URL = "/api/sheet?name=archive";
const C2S2_REGULAR_URL = "/api/sheet?name=c2s2-regular";
const CURRENT_BOXSCORE_URL = "/api/sheet?name=boxscore";
const CURRENT_PLAYER_STATS_URL = "/api/sheet?name=player-stats";

const C1_POST_SCHEDULES = [
  ["C1S2", "/assets/data/c1s2-post-schedule.csv"],
  ["C1S3", "/assets/data/c1s3-post-schedule.csv"],
  ["C1S4", "/assets/data/c1s4-post-schedule.csv"],
  ["C1S5", "/assets/data/c1s5-post-schedule.csv"],
  ["C1S6", "/assets/data/c1s6-post-schedule.csv"],
];

const C1_PLAYER_STATS = [
  ["C1S2", "/assets/data/c1s2-player-stats.csv"],
  ["C1S3", "/assets/data/c1s3-player-stats.csv"],
  ["C1S4", "/assets/data/c1s4-player-stats.csv"],
  ["C1S5", "/assets/data/c1s5-player-stats.csv"],
  ["C1S6", "/assets/data/c1s6-player-stats.csv"],
];

const ARCHIVE_RANGES = {
  scheduleRegular: "G31:J80",
  boxscorePost: "L31:R149",
  playerStatsPost: "A45:F117",
};

const C2S2_RANGES = {
  boxscoreRegular: "K60:R1059",
  playerStatsRegular: "A151:G1150",
};

const SUPPLEMENTAL_REGULAR_WIN_STREAKS = [
  { team: "Masdog N Em", season: "C1S3", length: 14 },
  { team: "Turkeys", season: "C2S2", length: 15 },
  { team: "Cobras", season: "C1S4", length: 11 },
  { team: "Super Kings", season: "C2S3", length: 9 },
  { team: "The Phantoms", season: "C2S2", length: 8 },
  { team: "Whatsgrass", season: "C1S4", length: 7 },
  { team: "Gus N Em", season: "C1S5", length: 7 },
];

const els = {
  grid: document.getElementById("records-grid"),
  sectionTabs: document.getElementById("records-section-tabs"),
  updated: document.getElementById("last-updated"),
};

let recordsState = { regular: [], postseason: [] };
let playerRecordsState = { regular: [], postseason: [] };
let activeSection = "team-regular-season";

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
    lions: "Pandas",
    pandas: "Pandas",
    scorpions: "Yetis",
    snipers: "Super Kings",
    storm: "Storm",
    "the currents": "The Currents",
    "the future": "The Future",
    "the lions": "Pandas",
    "the snipers": "Super Kings",
    turkeys: "Turkeys",
    yetis: "Yetis",
  };
  return aliases[normalized] || name;
}

function getTeamLogoSrc(team) {
  const clean = displayTeamName(team);
  if (clean === "The Future" || clean === "Dream Team") return "/assets/dream-team.jpg";
  if (clean === "Pandas") return "/assets/pandas.png";
  if (clean === "Super Kings") return "/assets/super-kings.png";
  if (clean === "The Phantoms") return "/assets/the-phantoms.png";
  if (clean === "Scorpions") return "/assets/mayeday.jpg";
  if (clean === "ALEK Manoahs") return "/assets/alek-manoahs.jpg";
  if (clean === "Bees") return "/assets/bees.jpg";
  if (clean === "Broncos") return "/assets/broncos.jpg";
  if (clean === "Burritos") return "/assets/burritos.jpg";
  if (clean === "Cobras") return "/assets/cobras.png";
  if (clean === "Karma Avengers") return "/assets/karma-avengers.png";
  if (clean === "Mafia") return "/assets/mafia.png";
  if (clean === "Mets" || clean === "The Mets") return "/assets/mets.png";
  if (clean === "Phoenix" || clean === "The Phoenix") return "/assets/phoenix.png";
  if (clean === "Thunderhawks") return "/assets/thunderhawks.png";
  if (clean === "The Currents" || clean === "Currents") return "/assets/the-currents.png";
  if (clean === "Whatsgrass") return "/assets/whatsgrass.png";
  if (clean === "Wolves") return "/assets/wolves.png";
  if (clean === "Zombies") return "/assets/zombies.png";
  if (clean === "Chicken Nuggets") return "/assets/chicken-nuggets.jpg";
  if (clean === "Masdog N Em" || clean === "Richer N Em" || clean === "Doggy N Em") return "/assets/gus-n-em.png";
  if (clean === "Yetis") return "/assets/yetis.png";
  if (clean === "Gus N Em") return "/assets/gus-n-em.png";
  if (clean === "Bad Bois")
    return "https://media.realapp.com/assets/user/default/large/4JZRj4DJ_29132497.webp";
  if (clean === "Illegals") return "/assets/illegals.png";
  if (clean === "Storm" || clean === "Bullets") return "/assets/storm.png";
  if (clean === "Turkeys") return "/assets/turkeys.png";
  return "";
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

function detectPlayerColumns(headers) {
  const normalized = headers.map((header) => normalizeLoose(header));
  const pick = (checks, fallback) => {
    const index = normalized.findIndex((header) => checks.some((check) => header.includes(check)));
    return index >= 0 ? index : fallback;
  };
  return {
    date: pick(["date", "game"], 0),
    team: pick(["team"], 1),
    player: pick(["player"], 2),
    score: pick(["score", "points"], 3),
    rank: pick(["rank"], 4),
    opponent: pick(["opponent"], 5),
  };
}

function parseNumber(value) {
  const normalized = String(value ?? "").replace(/,/g, "").trim();
  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function getDateOrder(value) {
  const raw = String(value || "").trim();
  const recorded = raw.match(/recorded game\s*(\d+)/i);
  if (recorded) return Number(recorded[1]);
  const date = raw.match(/^(\d{1,2})\/(\d{1,2})/);
  if (date) return Number(date[1]) * 100 + Number(date[2]);
  return 0;
}

function normalizePlayerName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function buildPlayerStatRows(rows, season, phase) {
  if (!rows.length) return [];
  const columns = detectPlayerColumns(rows[0] || []);
  const entries = rows
    .slice(1)
    .map((row, index) => {
      const player = normalizePlayerName(row[columns.player]);
      const date = String(row[columns.date] || "").trim();
      const score = parseNumber(row[columns.score]);
      const rank = parseNumber(row[columns.rank]);
      if (!player || !date || score === null) return null;
      return {
        season,
        phase,
        date,
        dateOrder: getDateOrder(date),
        team: displayTeamName(row[columns.team]),
        player,
        score,
        rank,
        opponent: displayTeamName(row[columns.opponent]),
        sourceIndex: index,
      };
    })
    .filter(Boolean);

  const byDate = new Map();
  entries.forEach((entry) => {
    const key = `${season}|${entry.date}`;
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key).push(entry);
  });

  byDate.forEach((dateEntries) => {
    const ranked = [...dateEntries].sort((a, b) => b.score - a.score || a.player.localeCompare(b.player));
    ranked.forEach((entry, index) => {
      if (entry.rank === null) entry.rank = index + 1;
    });
  });

  return entries;
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

function mergeSupplementalWinStreaks(streaks) {
  const merged = [...streaks];

  SUPPLEMENTAL_REGULAR_WIN_STREAKS.forEach((record) => {
    const existing = merged.find(
      (streak) =>
        teamKey(streak.team) === teamKey(record.team) &&
        String(streak.season).toLowerCase() === String(record.season).toLowerCase()
    );
    if (existing && existing.length >= record.length) return;

    if (existing) {
      existing.length = record.length;
      existing.start = { date: "Verified record" };
      existing.end = { date: "Verified record" };
      existing.games = [];
      existing.supplemental = true;
      return;
    }

    merged.push({
      type: "wins",
      team: record.team,
      season: record.season,
      length: record.length,
      start: { date: "Verified record" },
      end: { date: "Verified record" },
      games: [],
      supplemental: true,
    });
  });

  return merged.sort((a, b) => b.length - a.length || a.team.localeCompare(b.team));
}

function recordCards(games, phase) {
  const winRows = collectStreaks(games, "wins");
  const rows = phase === "regular" ? mergeSupplementalWinStreaks(winRows) : winRows;

  return [
    {
      title: "Longest Win Streak",
      note: "Consecutive wins inside one season phase.",
      rows: rows.slice(0, 10),
    },
    {
      title: "Longest Losing Streak",
      note: "Consecutive losses inside one season phase.",
      rows: collectStreaks(games, "losses").slice(0, 5),
    },
  ];
}

function collectPlayerRankStreaks(rows, type) {
  const byPlayerSeason = new Map();
  rows.forEach((row) => {
    const key = `${row.season}|${normalizeLoose(row.player)}`;
    if (!byPlayerSeason.has(key)) {
      byPlayerSeason.set(key, { player: row.player, season: row.season, rows: [] });
    }
    byPlayerSeason.get(key).rows.push(row);
  });

  const streaks = [];
  byPlayerSeason.forEach(({ player, season, rows: playerRows }) => {
    let current = [];
    const finishCurrent = () => {
      if (!current.length) return;
      streaks.push({
        type,
        team: player,
        season,
        length: current.length,
        start: current[0],
        end: current[current.length - 1],
        games: current,
        playerRecord: true,
      });
      current = [];
    };

    playerRows
      .sort((a, b) => a.dateOrder - b.dateOrder || a.sourceIndex - b.sourceIndex)
      .forEach((row) => {
        const matches =
          type === "top50" ? row.rank <= 50 : type === "top100" ? row.rank <= 100 : row.rank > 1000;
        if (matches) {
          current.push(row);
        } else {
          finishCurrent();
        }
      });
    finishCurrent();
  });

  return streaks.sort((a, b) => b.length - a.length || a.team.localeCompare(b.team));
}

function median(numbers) {
  if (!numbers.length) return null;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function collectStarterMedianRanks(rows) {
  const byPlayerSeason = new Map();
  rows.forEach((row) => {
    if (!Number.isFinite(row.rank)) return;
    const key = `${row.season}|${normalizeLoose(row.player)}`;
    if (!byPlayerSeason.has(key)) {
      byPlayerSeason.set(key, { player: row.player, season: row.season, rows: [] });
    }
    byPlayerSeason.get(key).rows.push(row);
  });

  return Array.from(byPlayerSeason.values())
    .filter((entry) => entry.rows.length >= 5)
    .map((entry) => {
      const sortedRows = entry.rows.sort((a, b) => a.dateOrder - b.dateOrder || a.sourceIndex - b.sourceIndex);
      return {
        type: "starterMedianRank",
        team: entry.player,
        season: entry.season,
        length: median(sortedRows.map((row) => row.rank)),
        start: sortedRows[0],
        end: sortedRows[sortedRows.length - 1],
        games: sortedRows,
        playerRecord: true,
        valueLabel: "medianRank",
      };
    })
    .sort((a, b) => a.length - b.length || a.team.localeCompare(b.team));
}

function playerRecordCards(rows) {
  return [
    {
      title: "Starter Median Rank",
      note: "Best median rank among players with at least five recorded games.",
      rows: collectStarterMedianRanks(rows).slice(0, 10),
    },
    {
      title: "Top 100 Streaks",
      note: "Most games in a row ranking top 100.",
      rows: collectPlayerRankStreaks(rows, "top100").slice(0, 10),
    },
    {
      title: "Top 50 Streaks",
      note: "Most games in a row ranking top 50.",
      rows: collectPlayerRankStreaks(rows, "top50").slice(0, 10),
    },
    {
      title: "Outside Top 1000 Streaks",
      note: "Most games in a row ranking outside the top 1000.",
      rows: collectPlayerRankStreaks(rows, "outside1000").slice(0, 10),
    },
  ];
}

function gameSummary(game, team) {
  const opponent = teamKey(game.team1) === teamKey(team) ? game.team2 : game.team1;
  const result = getTeamResult(game, team).toUpperCase();
  const score = game.score ? `, ${game.score}` : "";
  return `${game.date}: ${result} vs ${opponent}${score}`;
}

function playerGameSummary(game) {
  const team = game.team ? `, ${game.team}` : "";
  return `${game.date}: rank ${game.rank}, score ${game.score}${team}`;
}

function formatRecordValue(row) {
  if (row.valueLabel === "medianRank") {
    return Number.isInteger(row.length) ? String(row.length) : row.length.toFixed(1);
  }
  return String(row.length);
}

function renderRecordCard(card) {
  const rows = card.rows.length
    ? card.rows
        .map((row, index) => {
          const gameItems = row.games.length
            ? row.games
                .map((game) =>
                  `<li>${escapeHtml(row.playerRecord ? playerGameSummary(game) : gameSummary(game, row.team))}</li>`
                )
                .join("")
            : "<li>Games not recorded</li>";
          const range =
            row.supplemental || !row.games.length
              ? "Verified record"
              : `${escapeHtml(row.start.date)} to ${escapeHtml(row.end.date)}`;
          const logoSrc = row.playerRecord ? "" : getTeamLogoSrc(row.team);
          const logoHtml = logoSrc
            ? `<img class="record-identity-logo" src="${logoSrc}" alt="${escapeHtml(row.team)} logo" />`
            : "";
          const identityHtml = row.playerRecord
            ? `<a class="record-identity-link roster-link" href="/player-detail.html?player=${encodeURIComponent(row.team)}"><span>${escapeHtml(row.team)}</span></a>`
            : `<a class="record-identity-link roster-link" href="/team.html?team=${encodeURIComponent(row.team)}">${logoHtml}<span>${escapeHtml(row.team)}</span></a>`;
          return `
            <article class="record-row ${index === 0 ? "record-row--top" : ""}">
              <div class="record-rank">${index + 1}</div>
              <div class="record-main">
                <div class="record-team">${identityHtml}</div>
                <div class="record-meta">${escapeHtml(row.season)} • ${range}</div>
                <details class="record-details">
                  <summary>Games in streak</summary>
                  <ol>${gameItems}</ol>
                </details>
              </div>
              <div class="record-value">${escapeHtml(formatRecordValue(row))}</div>
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

function renderRecordSection(id, title, cards) {
  return `
    <section class="record-section" data-record-section="${escapeHtml(id)}" ${id === activeSection ? "" : "hidden"}>
      <div class="record-section-head">
        <span class="dashboard-kicker">Streaks</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <div class="records-grid records-grid--cards">${cards.map(renderRecordCard).join("")}</div>
    </section>
  `;
}

function renderRecords() {
  els.grid.innerHTML = [
    renderRecordSection("team-regular-season", "Team Regular Season", recordCards(recordsState.regular || [], "regular")),
    renderRecordSection("team-postseason", "Team Postseason", recordCards(recordsState.postseason || [], "postseason")),
    renderRecordSection("player-regular-season", "Player Regular Season", playerRecordCards(playerRecordsState.regular || [])),
    renderRecordSection("player-postseason", "Player Postseason", playerRecordCards(playerRecordsState.postseason || [])),
  ].join("");
  if (window.rsklEnhancePlayerLinks) {
    window.rsklEnhancePlayerLinks(els.grid);
  }
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
  const [
    archiveRows,
    c2s2Rows,
    currentRows,
    currentPlayerRows,
    ...legacyRows
  ] = await Promise.all([
    fetchCsvSafe(ARCHIVE_URL),
    fetchCsvSafe(C2S2_REGULAR_URL),
    fetchCsvSafe(CURRENT_BOXSCORE_URL),
    fetchCsvSafe(CURRENT_PLAYER_STATS_URL),
    ...C1_POST_SCHEDULES.map(([, url]) => fetchCsvSafe(url)),
    ...C1_PLAYER_STATS.map(([, url]) => fetchCsvSafe(url)),
  ]);
  const c1PostRows = legacyRows.slice(0, C1_POST_SCHEDULES.length);
  const c1PlayerRows = legacyRows.slice(C1_POST_SCHEDULES.length);

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
  playerRecordsState = {
    regular: [
      ...c1PlayerRows.flatMap((rows, index) => buildPlayerStatRows(rows, C1_PLAYER_STATS[index][0], "regular")),
      ...buildPlayerStatRows(sliceRange(c2s2Rows, C2S2_RANGES.playerStatsRegular), "C2S2", "regular"),
      ...buildPlayerStatRows(currentPlayerRows, "C2S3", "regular"),
    ],
    postseason: buildPlayerStatRows(sliceRange(archiveRows, ARCHIVE_RANGES.playerStatsPost), "C2S1", "postseason"),
  };
  if (els.updated) {
    els.updated.textContent = `Last updated: ${new Date().toLocaleString()}`;
  }
  renderRecords();
}

loadRecords().catch((error) => {
  els.grid.innerHTML = `<div class="dashboard-state-card">Unable to load records: ${escapeHtml(error.message)}</div>`;
});

if (els.sectionTabs) {
  els.sectionTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-section]");
    if (!button) return;
    activeSection = button.dataset.section || "team-regular-season";
    els.sectionTabs.querySelectorAll("[data-section]").forEach((tab) => {
      tab.classList.toggle("active", tab === button);
    });
    renderRecords();
  });
}
