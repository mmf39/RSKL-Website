const SEASON_KEY = "season";
const CURRENT_STANDINGS_URL = "/api/sheet?name=standings-dashboard";
const C2S4_STANDINGS_URL = "/api/sheet?name=c2s4-standings";
const C1S2_POST_URL = "/assets/data/c1s2-post-schedule.csv";
const C1S3_POST_URL = "/assets/data/c1s3-post-schedule.csv";
const C1S4_POST_URL = "/assets/data/c1s4-post-schedule.csv";
const C1S5_POST_URL = "/assets/data/c1s5-post-schedule.csv";
const C1S6_POST_URL = "/assets/data/c1s6-post-schedule.csv";
const C1S2_STANDINGS_URL = "/assets/data/c1s2-standings.csv";
const C1S3_STANDINGS_URL = "/assets/data/c1s3-standings.csv";
const C1S4_STANDINGS_URL = "/assets/data/c1s4-standings.csv";
const C1S5_STANDINGS_URL = "/assets/data/c1s5-standings.csv";
const C1S6_STANDINGS_URL = "/assets/data/c1s6-standings.csv";

const PLAYOFF_SEASONS = {
  "c2s4-playoffs": {
    label: "C2S4 Playoffs",
    type: "current",
    standingsUrl: C2S4_STANDINGS_URL,
  },
  "c2s3-playoffs": {
    label: "C2S3 Playoffs",
    type: "current",
    standingsUrl: CURRENT_STANDINGS_URL,
  },
  "c2s2-playoffs": {
    label: "C2S2 Playoffs",
    type: "static",
    champion: "Gus N Em",
    championNote: "Defeated #1 Turkeys, 3-0, in the finals.",
    rounds: [
      {
        title: "Wild Card",
        matchups: [
          matchup("Game 1", team(3, "The Phantoms", 0), team(6, "Bad Bois", 1)),
          matchup("Game 2", team(4, "Gus N Em", 1), team(5, "Illegals", 0)),
        ],
      },
      {
        title: "Semifinals",
        matchups: [
          matchup("Game 3", team(1, "Turkeys", 2), team(6, "Bad Bois", 0)),
          matchup("Game 4", team(2, "Pandas", 1), team(4, "Gus N Em", 2)),
        ],
      },
      {
        title: "Finals",
        matchups: [
          matchup("Game 5", team(1, "Turkeys", 0), team(4, "Gus N Em", 3)),
        ],
      },
    ],
  },
  "c2s1-post": {
    label: "C2S1 Playoffs",
    type: "static",
    sourceNote: "Built from the C2S1 archive bracket.",
    champion: "Cheerios",
    championNote: "Defeated #2 Gus N Em, 3-2, in the finals.",
    rounds: [
      {
        title: "Wild Card",
        matchups: [
          matchup("Wild Card", team(4, "Cheerios", 1), team(5, "Yetis", 0)),
        ],
      },
      {
        title: "Semifinals",
        matchups: [
          matchup("Semifinal", team(1, "Turkeys", 1), team(4, "Cheerios", 2)),
          matchup("Semifinal", team(2, "Gus N Em", 2), team(3, "Bullets", 1)),
        ],
      },
      {
        title: "Finals",
        matchups: [
          matchup("Championship", team(4, "Cheerios", 3), team(2, "Gus N Em", 2)),
        ],
      },
    ],
  },
  "c1s6-post": {
    label: "C1S6 Playoffs",
    type: "schedule",
    scheduleUrl: C1S6_POST_URL,
    standingsUrl: C1S6_STANDINGS_URL,
  },
  "c1s5-post": {
    label: "C1S5 Playoffs",
    type: "schedule",
    scheduleUrl: C1S5_POST_URL,
    standingsUrl: C1S5_STANDINGS_URL,
  },
  "c1s4-post": {
    label: "C1S4 Playoffs",
    type: "schedule",
    scheduleUrl: C1S4_POST_URL,
    standingsUrl: C1S4_STANDINGS_URL,
  },
  "c1s3-post": {
    label: "C1S3 Playoffs",
    type: "schedule",
    scheduleUrl: C1S3_POST_URL,
    standingsUrl: C1S3_STANDINGS_URL,
  },
  "c1s2-post": {
    label: "C1S2 Playoffs",
    type: "schedule",
    scheduleUrl: C1S2_POST_URL,
    standingsUrl: C1S2_STANDINGS_URL,
  },
};

const CURRENT_LOCKED_PSP_TIEBREAK_ORDER = new Map([
  ["Super Kings", 1],
  ["Dream Team", 2],
  ["Bad Bois", 3],
  ["Scorpions", 4],
  ["Storm", 5],
]);

function team(seed, name, score = "") {
  return { seed, team: name, score };
}

function matchup(label, top, bottom) {
  return { label, top, bottom };
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

async function fetchRows(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
  return parseCSV(await response.text());
}

function displayTeamName(value) {
  const clean = String(value || "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\*/g, "")
    .trim();
  if (clean === "Bullets") return "Storm";
  if (clean === "Yetis") return "Scorpions";
  if (clean === "The Future") return "Dream Team";
  if (clean === "The Pandas" || clean === "Pandas" || clean === "The Lions" || clean === "Lions") return "Pandas";
  if (clean === "The Snipers" || clean === "Snipers" || clean === "Sniper") return "Super Kings";
  if (clean === "Avengers") return "Karma Avengers";
  if (clean === "Currents") return "The Currents";
  if (clean === "Bolts") return "The Bolts";
  return clean;
}

function normalizeTeamName(value) {
  return displayTeamName(value).toLowerCase().replace(/\s+/g, " ").trim();
}

function getTeamLogo(teamName) {
  const clean = displayTeamName(teamName);
  if (clean === "Dream Team") return "/assets/dream-team.jpg";
  if (clean === "Pandas") return "/assets/pandas.png";
  if (clean === "Super Kings") return "/assets/super-kings.png";
  if (clean === "The Phantoms") return "/assets/the-phantoms.png";
  if (clean === "Scorpions") return "/assets/mayeday.jpg";
  if (clean === "Cobras") return "/assets/cobras.png";
  if (clean === "Karma Avengers") return "/assets/karma-avengers.png";
  if (clean === "Mafia") return "/assets/mafia.png";
  if (clean === "Mets") return "/assets/mets.png";
  if (clean === "Phoenix") return "/assets/phoenix.png";
  if (clean === "Thunderhawks") return "/assets/thunderhawks.png";
  if (clean === "The Currents") return "/assets/the-currents.png";
  if (clean === "Whatsgrass") return "/assets/whatsgrass.png";
  if (clean === "Wolves") return "/assets/wolves.png";
  if (clean === "Zombies") return "/assets/zombies.png";
  if (clean === "Gus N Em") return "/assets/gus-n-em.png";
  if (clean === "Bad Bois")
    return "https://media.realapp.com/assets/user/default/large/4JZRj4DJ_29132497.webp";
  if (clean === "Illegals") return "/assets/illegals.png";
  if (clean === "Storm") return "/assets/storm.png";
  if (clean === "Turkeys") return "/assets/turkeys.png";
  if (clean === "Burritos") return "/assets/burritos.jpg";
  if (clean === "Bees") return "/assets/bees.jpg";
  if (clean === "ALEK Manoahs") return "/assets/alek-manoahs.jpg";
  return "";
}

function normalizePlayoffSeason(value) {
  const raw = String(value || "").trim();
  const aliases = {
    "c2s4-regular": "c2s4-playoffs",
    "c2s3-regular": "c2s3-playoffs",
    "c2s2-regular": "c2s2-playoffs",
    "c2s1-regular": "c2s1-post",
    "c2s1-playoffs": "c2s1-post",
    "c1s6-regular": "c1s6-post",
    "c1s6-playoffs": "c1s6-post",
    "c1s5-regular": "c1s5-post",
    "c1s5-playoffs": "c1s5-post",
    "c1s4-regular": "c1s4-post",
    "c1s4-playoffs": "c1s4-post",
    "c1s3-regular": "c1s3-post",
    "c1s3-playoffs": "c1s3-post",
    "c1s2-regular": "c1s2-post",
    "c1s2-playoffs": "c1s2-post",
  };
  return PLAYOFF_SEASONS[raw] ? raw : aliases[raw] || "c2s3-playoffs";
}

function getSelectedPlayoffSeason() {
  const params = new URLSearchParams(window.location.search);
  return normalizePlayoffSeason(
    params.get("season") || params.get("playoffs") || localStorage.getItem(SEASON_KEY)
  );
}

function syncSeasonSelect(seasonKey) {
  const select = document.getElementById("season-select");
  if (!select) return;
  select.value = seasonKey;
  if (!select.value) select.value = "c2s3-playoffs";
  localStorage.setItem(SEASON_KEY, select.value);
}

function updateTitle(label) {
  document.title = label;
  const h1 = document.querySelector(".hero h1");
  const h2 = document.querySelector(".panel-head h2");
  if (h1) h1.textContent = label;
  if (h2) h2.textContent = label;
}

function parseStandingsSeeds(rows) {
  const headerIndex = rows.findIndex((row) => {
    const lower = row.map((cell) => String(cell || "").toLowerCase());
    return lower.includes("team") && lower.some((cell) => cell.includes("win"));
  });
  if (headerIndex === -1) return new Map();
  const headers = rows[headerIndex].map((cell) => String(cell || "").trim().toLowerCase());
  const teamIdx = headers.indexOf("team");
  const winsIdx = headers.findIndex((cell) => cell === "wins" || cell === "win");
  const lossIdx = headers.findIndex((cell) => cell === "loss" || cell === "losses");
  const items = rows
    .slice(headerIndex + 1)
    .map((row) => ({
      team: displayTeamName(row[teamIdx]),
      wins: Number(String(row[winsIdx] || "0").replace(/[^0-9.-]/g, "")) || 0,
      losses: Number(String(row[lossIdx] || "0").replace(/[^0-9.-]/g, "")) || 0,
    }))
    .filter((row) => row.team && normalizeTeamName(row.team) !== "team")
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return a.team.localeCompare(b.team);
    });
  return new Map(items.map((row, index) => [normalizeTeamName(row.team), index + 1]));
}

function getDateSortValue(value, fallback) {
  const match = String(value || "").match(/(\d{1,2})\/(\d{1,2})/);
  if (!match) return fallback;
  return Number(match[1]) * 100 + Number(match[2]);
}

function makeSeriesKey(teamA, teamB) {
  return [normalizeTeamName(teamA), normalizeTeamName(teamB)].sort().join("|");
}

function parseScheduleSeries(rows, seedMap) {
  const header = rows[0] || [];
  const lower = header.map((cell) => String(cell || "").trim().toLowerCase());
  const dateIdx = lower.findIndex((cell) => cell.includes("date"));
  const team1Idx = lower.findIndex((cell) => cell.includes("team 1") || cell === "home");
  const team2Idx = lower.findIndex((cell) => cell.includes("team 2") || cell === "away");
  const winnerIdx = lower.findIndex((cell) => cell.includes("winner"));
  const typeIdx = lower.findIndex((cell) => cell.includes("type"));
  const groups = new Map();

  rows.slice(1).forEach((row, index) => {
    const teamA = displayTeamName(row[team1Idx]);
    const teamB = displayTeamName(row[team2Idx]);
    if (!teamA || !teamB || normalizeTeamName(teamA) === normalizeTeamName(teamB)) return;
    const type = String(row[typeIdx] || "").trim();
    if (type && /regular|all star|gm game/i.test(type)) return;
    const key = makeSeriesKey(teamA, teamB);
    if (!groups.has(key)) {
      groups.set(key, {
        label: type || "Playoffs",
        teamA,
        teamB,
        firstIndex: index,
        firstDate: row[dateIdx] || "",
        sortDate: getDateSortValue(row[dateIdx], index),
        wins: new Map([
          [normalizeTeamName(teamA), 0],
          [normalizeTeamName(teamB), 0],
        ]),
      });
    }
    const group = groups.get(key);
    const winner = displayTeamName(row[winnerIdx]);
    const winnerKey = normalizeTeamName(winner);
    if (winnerKey && group.wins.has(winnerKey)) {
      group.wins.set(winnerKey, group.wins.get(winnerKey) + 1);
    }
  });

  return Array.from(groups.values())
    .sort((a, b) => a.sortDate - b.sortDate || a.firstIndex - b.firstIndex)
    .map((series, index) => {
      const aKey = normalizeTeamName(series.teamA);
      const bKey = normalizeTeamName(series.teamB);
      const aScore = series.wins.get(aKey) || 0;
      const bScore = series.wins.get(bKey) || 0;
      return matchup(
        series.label && !/^playoffs$/i.test(series.label) ? series.label : `Series ${index + 1}`,
        team(seedMap.get(aKey) || "", series.teamA, aScore || ""),
        team(seedMap.get(bKey) || "", series.teamB, bScore || "")
      );
    });
}

function partitionSeriesIntoRounds(series) {
  const count = series.length;
  if (count <= 1) return [{ title: "Finals", matchups: series }];
  if (count === 3) {
    return [
      { title: "Semifinals", matchups: series.slice(0, 2) },
      { title: "Finals", matchups: series.slice(2) },
    ];
  }
  if (count === 5) {
    return [
      { title: "Wild Card", matchups: series.slice(0, 2) },
      { title: "Semifinals", matchups: series.slice(2, 4) },
      { title: "Finals", matchups: series.slice(4) },
    ];
  }
  if (count === 7) {
    return [
      { title: "Quarterfinals", matchups: series.slice(0, 4) },
      { title: "Semifinals", matchups: series.slice(4, 6) },
      { title: "Finals", matchups: series.slice(6) },
    ];
  }
  return [{ title: "Playoffs", matchups: series }];
}

function getSeriesWinner(matchupItem) {
  const topScore = Number(matchupItem.top.score);
  const bottomScore = Number(matchupItem.bottom.score);
  if (topScore > bottomScore) return matchupItem.top;
  if (bottomScore > topScore) return matchupItem.bottom;
  return null;
}

function renderTeamLine(entry, winner) {
  const isWinner = winner && normalizeTeamName(winner.team) === normalizeTeamName(entry.team);
  const logo = getTeamLogo(entry.team);
  const logoHtml = logo
    ? `<img class="standings-logo" src="${escapeHtml(logo)}" alt="${escapeHtml(entry.team)} logo" />`
    : "";
  const seedText = entry.seed ? `#${entry.seed}` : "—";
  const scoreText = entry.score !== "" && entry.score !== null && entry.score !== undefined ? entry.score : "—";
  return `
    <a class="playoff-bracket-team ${isWinner ? "is-winner" : ""}" href="/team.html?team=${encodeURIComponent(entry.team)}">
      <span class="playoff-bracket-seed">${escapeHtml(seedText)}</span>
      ${logoHtml}
      <span class="playoff-bracket-name">${escapeHtml(entry.team)}</span>
      <strong>${escapeHtml(scoreText)}</strong>
    </a>
  `;
}

function renderRound(round) {
  return `
    <section class="playoff-bracket-round">
      <div class="playoff-bracket-round-head">
        <h3>${escapeHtml(round.title)}</h3>
      </div>
      <div class="playoff-bracket-games">
        ${round.matchups
          .map((game) => {
            const winner = getSeriesWinner(game);
            return `
              <article class="playoff-bracket-game">
                <div class="playoff-bracket-game-label">${escapeHtml(game.label)}</div>
                ${renderTeamLine(game.top, winner)}
                ${renderTeamLine(game.bottom, winner)}
              </article>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderBracket(payload) {
  const container = document.getElementById("madness-bracket");
  if (!container) return;
  const finalRound = payload.rounds[payload.rounds.length - 1];
  const finalWinner = finalRound?.matchups?.[0] ? getSeriesWinner(finalRound.matchups[0]) : null;
  const champion = payload.champion || finalWinner?.team || "";
  const championSeed = finalWinner?.seed ? `#${finalWinner.seed} ` : "";
  const championNote = payload.championNote || (champion ? `Champion: ${champion}` : "Champion TBD");
  container.innerHTML = `
    ${payload.sourceNote ? `<div class="playoff-bracket-note">${escapeHtml(payload.sourceNote)}</div>` : ""}
    <div class="playoff-bracket-grid">
      ${payload.rounds.map(renderRound).join("")}
    </div>
    ${
      champion
        ? `<section class="playoff-champion-card">
            <div>Champion</div>
            <strong>${escapeHtml(championSeed)}${escapeHtml(champion)}</strong>
            <span>${escapeHtml(championNote)}</span>
          </section>`
        : ""
    }
  `;
}

function parseCurrentStandings(rows) {
  const headerIndex = rows.findIndex((row) => {
    const lower = row.map((cell) => String(cell || "").toLowerCase());
    return lower.includes("team") && lower.some((cell) => cell.includes("win"));
  });
  if (headerIndex === -1) return [];
  const headers = rows[headerIndex].map((cell) => String(cell || "").trim().toLowerCase());
  const teamIdx = headers.indexOf("team");
  const winsIdx = headers.findIndex((cell) => cell === "wins" || cell === "win");
  const lossIdx = headers.findIndex((cell) => cell === "loss" || cell === "losses" || cell === "l");
  return rows
    .slice(headerIndex + 1)
    .map((row) => ({
      team: displayTeamName(row[teamIdx]),
      wins: Number(String(row[winsIdx] || "0").replace(/[^0-9.-]/g, "")) || 0,
      losses: Number(String(row[lossIdx] || "0").replace(/[^0-9.-]/g, "")) || 0,
    }))
    .filter((row) => {
      const key = normalizeTeamName(row.team);
      return row.team && !["team", "join", "north", "locked psp", "locked psp join"].includes(key);
    });
}

function currentDivision(teamName) {
  const north = new Set(["Turkeys", "Pandas", "The Phantoms", "Gus N Em", "Illegals"]);
  return north.has(displayTeamName(teamName)) ? "North" : "Locked PSP";
}

async function buildCurrentBracket(label = "C2S3", standingsUrl = CURRENT_STANDINGS_URL) {
  const rows = parseCurrentStandings(await fetchRows(standingsUrl));
  const grouped = new Map([
    ["North", []],
    ["Locked PSP", []],
  ]);
  rows.forEach((row) => grouped.get(currentDivision(row.team)).push(row));
  grouped.forEach((items) => {
    items.sort((a, b) => {
      if (currentDivision(a.team) === "Locked PSP") {
        const ar = CURRENT_LOCKED_PSP_TIEBREAK_ORDER.get(a.team) ?? 99;
        const br = CURRENT_LOCKED_PSP_TIEBREAK_ORDER.get(b.team) ?? 99;
        if (ar !== br) return ar - br;
      }
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return a.team.localeCompare(b.team);
    });
  });
  const north = (grouped.get("North") || []).slice(0, 3).map((row, index) => team(`N${index + 1}`, row.team, `${row.wins}-${row.losses}`));
  const locked = (grouped.get("Locked PSP") || []).slice(0, 3).map((row, index) => team(`L${index + 1}`, row.team, `${row.wins}-${row.losses}`));
  return {
    sourceNote:
      `Projected from the current ${label.replace(/\s+Playoffs$/i, "")} standings. Final results will update when playoff games are on the schedule.`,
    rounds: [
      {
        title: "Wild Card",
        matchups: [
          matchup("North Wild Card", north[1], north[2]),
          matchup("Locked PSP Wild Card", locked[1], locked[2]),
        ].filter((game) => game.top && game.bottom),
      },
      {
        title: "Semifinals",
        matchups: [
          matchup("North Final", north[0], team("", "North WC Winner", "")),
          matchup("Locked PSP Final", locked[0], team("", "Locked PSP WC Winner", "")),
        ].filter((game) => game.top && game.bottom),
      },
      {
        title: "Finals",
        matchups: [
          matchup("RSKL Finals", team("", "North Champion", ""), team("", "Locked PSP Champion", "")),
        ],
      },
    ],
  };
}

async function buildScheduleBracket(config) {
  const [scheduleRows, standingsRows] = await Promise.all([
    fetchRows(config.scheduleUrl),
    fetchRows(config.standingsUrl),
  ]);
  const seedMap = parseStandingsSeeds(standingsRows);
  const series = parseScheduleSeries(scheduleRows, seedMap);
  return {
    sourceNote: "Built from this season's playoff schedule results.",
    rounds: partitionSeriesIntoRounds(series),
  };
}

async function loadBracket() {
  const seasonKey = getSelectedPlayoffSeason();
  const config = PLAYOFF_SEASONS[seasonKey] || PLAYOFF_SEASONS["c2s3-playoffs"];
  syncSeasonSelect(seasonKey);
  updateTitle(config.label);
  const container = document.getElementById("madness-bracket");
  if (container) {
    container.innerHTML = '<div class="dashboard-state-card">Loading playoff bracket...</div>';
  }

  try {
    if (config.type === "current") {
      renderBracket(await buildCurrentBracket(config.label, config.standingsUrl || CURRENT_STANDINGS_URL));
    } else if (config.type === "schedule") {
      renderBracket(await buildScheduleBracket(config));
    } else {
      renderBracket(config);
    }
    renderLastUpdated();
  } catch (error) {
    if (container) {
      container.innerHTML = `<div class="dashboard-state-card">Unable to load bracket: ${escapeHtml(error.message)}</div>`;
    }
  }
}

function renderLastUpdated() {
  const lastUpdated = document.getElementById("last-updated");
  if (!lastUpdated) return;
  const now = new Date();
  lastUpdated.textContent = `Last updated: ${now.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

loadBracket();
