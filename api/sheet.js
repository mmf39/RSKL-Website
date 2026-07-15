const proxy = require("../lib/proxy");

const C2S3_STATS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5rm7eqJcdWIX78vETTfsf40lMpXzvJCSdG8dGdkFBbXXC2zEzidcpGTLUzqcZQPTTVquYuLCeXoPL/pub?gid=1201938197&single=true&output=csv";
const C2S3_PLAYOFF_PLAYER_STATS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=2091759853&single=true&output=csv";
const C2S3_PLAYOFF_BOXSCORE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=321367914&single=true&output=csv";
const C2S4_PLAYER_STATS_URL = C2S3_PLAYOFF_PLAYER_STATS_URL;
const C2S4_BOXSCORE_URL = C2S3_PLAYOFF_BOXSCORE_URL;
const C2S4_LIVE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=1722620417&single=true&output=csv";
const C2S4_TEAMS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=847666124&single=true&output=csv";
const C2S4_SCHEDULE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=507537612&single=true&output=csv";
const C2S4_STANDINGS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=2115060088&single=true&output=csv";

const SOURCES = {
  archive:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5rm7eqJcdWIX78vETTfsf40lMpXzvJCSdG8dGdkFBbXXC2zEzidcpGTLUzqcZQPTTVquYuLCeXoPL/pub?gid=1077518539&single=true&output=csv",
  "c2s2-regular":
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5rm7eqJcdWIX78vETTfsf40lMpXzvJCSdG8dGdkFBbXXC2zEzidcpGTLUzqcZQPTTVquYuLCeXoPL/pub?gid=346158705&single=true&output=csv",
  awards:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5rm7eqJcdWIX78vETTfsf40lMpXzvJCSdG8dGdkFBbXXC2zEzidcpGTLUzqcZQPTTVquYuLCeXoPL/pub?gid=1527593475&single=true&output=csv",
  contracts:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTr6cIsrgXTBa6ndhiGle_qOOUWgzH3KDUgPTANYDG2O_9u3_zdhOUGdzgz9yzMnqs1dgv54qg0TudU/pub?gid=959105096&single=true&output=csv",
  boxscore: C2S3_STATS_URL,
  "boxscore-playoffs": C2S3_PLAYOFF_BOXSCORE_URL,
  "c2s4-boxscore": C2S4_BOXSCORE_URL,
  "c2s3-draft": C2S3_STATS_URL,
  "c2s4-draft":
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=894447035&single=true&output=csv",
  draft:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=894447035&single=true&output=csv",
  "fa-stats":
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQofWiajf4DF95vORv18Zn9DTTM5npzo_wb3SmpujdrQGctP5r6_5QDN3EbGywUSrBtQhOuczjDhU7h/pub?gid=2107593047&single=true&output=csv",
  "power-rankings":
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQofWiajf4DF95vORv18Zn9DTTM5npzo_wb3SmpujdrQGctP5r6_5QDN3EbGywUSrBtQhOuczjDhU7h/pub?gid=812582702&single=true&output=csv",
  "draft-capital":
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=1378560378&single=true&output=csv",
  "c2s4-live-scoring": C2S4_LIVE_URL,
  "c2s4-player-stats": C2S4_PLAYER_STATS_URL,
  "c2s4-roster": C2S4_TEAMS_URL,
  "c2s4-schedule": C2S4_SCHEDULE_URL,
  "c2s4-standings": C2S4_STANDINGS_URL,
  "c2s4-teams": C2S4_TEAMS_URL,
  "live-scoring":
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=1486072019&single=true&output=csv",
  playoffs:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=1268131675&single=true&output=csv",
  "madness-live":
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRTCAyH_FaIk97bDq5_U4-foybMKDrXMrYVWE-cDeCgHmTFtjSAQrURZBgEA8g4Bhj-TL4U-OcITkC6/pub?gid=1463615611&single=true&output=csv",
  "madness-completed":
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRTCAyH_FaIk97bDq5_U4-foybMKDrXMrYVWE-cDeCgHmTFtjSAQrURZBgEA8g4Bhj-TL4U-OcITkC6/pub?gid=443160286&single=true&output=csv",
  "player-stats": C2S3_STATS_URL,
  "player-stats-playoffs": C2S3_PLAYOFF_PLAYER_STATS_URL,
  roster: C2S3_STATS_URL,
  schedule: C2S3_STATS_URL,
  "schedule-playoffs": C2S3_STATS_URL,
  standings: C2S3_STATS_URL,
  "standings-dashboard": C2S3_STATS_URL,
  teams: C2S3_STATS_URL,
  transactions:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=1782609175&single=true&output=csv",
};

function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === "\"") {
      if (inQuotes && next === "\"") {
        value += "\"";
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

function formatCSV(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, "\"\"")}"` : value;
        })
        .join(",")
    )
    .join("\n");
}

function trimTrailingBlankRows(rows) {
  let last = rows.length - 1;
  while (last > 0 && rows[last].every((cell) => !String(cell || "").trim())) {
    last -= 1;
  }
  return rows.slice(0, last + 1);
}

function sliceC2S3PlayerStats(text) {
  const rows = parseCSV(text)
    .slice(0, 909)
    .map((row) => row.slice(7, 13));
  return `${formatCSV(trimTrailingBlankRows(rows))}\n`;
}

function sliceC2S3BoxScores(text) {
  const rows = parseCSV(text)
    .slice(3, 739)
    .map((row) => row.slice(14, 22));
  return `${formatCSV(trimTrailingBlankRows(addC2S3BoxScoreDateRows(text, rows)))}\n`;
}

function sliceC2S3RegularSchedule(text) {
  const rows = parseCSV(text)
    .slice(42, 121)
    .map((row) => row.slice(0, 5));
  return `${formatCSV(trimTrailingBlankRows(rows))}\n`;
}

function sliceC2S3PostSchedule(text) {
  const rows = parseCSV(text)
    .slice(23, 42)
    .map((row) => row.slice(0, 5));
  return `${formatCSV(trimTrailingBlankRows(rows))}\n`;
}

function parseC2S3TeamHeader(value) {
  const match = String(value || "").trim().match(/^(.+?)\s*\(([-\d.]+)\)/);
  return {
    name: match ? match[1].trim() : "",
    score: match ? match[2].trim() : "",
  };
}

function normalizeC2S3Team(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function getC2S3RegularScheduleGames(text) {
  const rows = parseCSV(text)
    .slice(42, 121)
    .map((row) => row.slice(0, 5));
  const headerIndex = rows.findIndex((row) =>
    row.map((cell) => String(cell || "").trim().toLowerCase()).includes("date")
  );
  const dataRows = headerIndex >= 0 ? rows.slice(headerIndex + 1) : rows;
  return dataRows
    .map((row) => ({
      date: String(row[0] || "").trim(),
      home: String(row[1] || "").trim(),
      away: String(row[2] || "").trim(),
    }))
    .filter((game) => game.date && game.home && game.away);
}

function addC2S3BoxScoreDateRows(text, boxRows) {
  const games = getC2S3RegularScheduleGames(text).map((game) => ({ ...game, used: false }));
  const output = [];

  boxRows.forEach((row) => {
    const left = parseC2S3TeamHeader(row[0]);
    const right = parseC2S3TeamHeader(row[5]);
    const isTeamHeader = left.name && right.name && left.score !== "" && right.score !== "";

    if (isTeamHeader) {
      const leftKey = normalizeC2S3Team(left.name);
      const rightKey = normalizeC2S3Team(right.name);
      const game = games.find((candidate) => {
        if (candidate.used) return false;
        const homeKey = normalizeC2S3Team(candidate.home);
        const awayKey = normalizeC2S3Team(candidate.away);
        return (
          (homeKey === leftKey && awayKey === rightKey) ||
          (homeKey === rightKey && awayKey === leftKey)
        );
      });
      if (game) {
        game.used = true;
        output.push([`League Day: ${game.date}`, "", "", "", "", "", "", ""]);
      }
    }

    output.push(row);
  });

  return output;
}

function sliceC2S3Standings(text) {
  const rows = parseCSV(text)
    .slice(134, 150)
    .map((row) => row.slice(0, 6));
  const headerIndex = rows.findIndex((row) =>
    String(row[0] || "").trim().toLowerCase() === "team"
  );
  const header = headerIndex >= 0 ? rows[headerIndex] : ["Team", "GP", "Wins", "Loss", "GB", "Win %"];
  const dataRows = rows.filter((row, index) => {
    if (index <= headerIndex) return false;
    const team = String(row[0] || "").trim().toLowerCase();
    const gp = String(row[1] || "").trim();
    return team && team !== "team" && /^\d+$/.test(gp);
  });
  return `${formatCSV([header, ...dataRows])}\n`;
}

function sliceC2S3Draft(text) {
  const rows = parseCSV(text)
    .slice(0, 22)
    .map((row) => row.slice(0, 3));
  return `${formatCSV(trimTrailingBlankRows(rows))}\n`;
}

function sliceC2S4Draft(text) {
  const rows = parseCSV(text)
    .slice(0, 24)
    .map((row) => row.slice(0, 3));
  return `${formatCSV(trimTrailingBlankRows(rows))}\n`;
}

function normalizeCurrentSheetTeamName(value) {
  const clean = String(value || "").trim();
  if (clean === "The Pandas" || clean === "The Lions" || clean === "Lions") return "Pandas";
  if (clean === "The Snipers" || clean === "Snipers") return "Super Kings";
  return clean;
}

function stripGmLabel(value) {
  return String(value || "")
    .replace(/^gm\s*=\s*/i, "")
    .trim();
}

function sliceC2S4Schedule(text) {
  const rows = parseCSV(text).map((row) => row.slice(0, 5));
  return `${formatCSV(trimTrailingBlankRows(rows))}\n`;
}

function sliceC2S4Standings(text) {
  const rows = parseCSV(text);
  const header = ["Team", "GP", "Wins", "Loss", "GB", "Win %"];
  const dataRows = rows
    .map((row) => row.slice(1, 7))
    .filter((row) => {
      const team = String(row[0] || "").trim().toLowerCase();
      const gp = String(row[1] || "").trim();
      return team && team !== "team" && /^\d+$/.test(gp);
    })
    .map((row) => [normalizeCurrentSheetTeamName(row[0]), ...row.slice(1)]);
  return `${formatCSV([header, ...dataRows])}\n`;
}

const C2S3_ROSTER_LAYOUT = {
  "Gus N Em": { row: 1, col: 1 },
  Storm: { row: 1, col: 4 },
  Turkeys: { row: 1, col: 7 },
  "Bad Bois": { row: 16, col: 1 },
  Scorpions: { row: 16, col: 4 },
  Illegals: { row: 16, col: 7 },
  "Pandas": { row: 31, col: 1 },
  "Dream Team": { row: 31, col: 4 },
  "Super Kings": { row: 31, col: 7 },
  "The Phantoms": { row: 44, col: 1 },
};

function normalizeSheetTeamName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function extractC2S3RosterMap(text) {
  const rows = parseCSV(text)
    .slice(2, 59)
    .map((row) => row.slice(22, 32));
  const wantedTeams = Object.keys(C2S3_ROSTER_LAYOUT);
  const teamByKey = new Map(wantedTeams.map((team) => [normalizeSheetTeamName(team), team]));
  teamByKey.set(normalizeSheetTeamName("The Lions"), "Pandas");
  teamByKey.set(normalizeSheetTeamName("Lions"), "Pandas");
  teamByKey.set(normalizeSheetTeamName("The Snipers"), "Super Kings");
  teamByKey.set(normalizeSheetTeamName("Snipers"), "Super Kings");
  const rosters = new Map();

  for (let r = 0; r < rows.length; r += 1) {
    for (let c = 0; c < rows[r].length; c += 1) {
      const team = teamByKey.get(normalizeSheetTeamName(rows[r][c]));
      if (!team || rosters.has(team)) continue;
      const gm = String(rows[r + 1]?.[c] || "").trim();
      const players = [];
      for (let offset = 2; offset < 12; offset += 1) {
        const player = String(rows[r + offset]?.[c] || "").trim();
        if (player) players.push(player);
      }
      rosters.set(team, { gm, players });
    }
  }

  return rosters;
}

function extractC2S4RosterMap(text) {
  const rows = parseCSV(text)
    .slice(1, 58)
    .map((row) => row.slice(0, 10));
  const wantedTeams = Object.keys(C2S3_ROSTER_LAYOUT);
  const teamByKey = new Map(wantedTeams.map((team) => [normalizeSheetTeamName(team), team]));
  teamByKey.set(normalizeSheetTeamName("The Pandas"), "Pandas");
  teamByKey.set(normalizeSheetTeamName("The Lions"), "Pandas");
  teamByKey.set(normalizeSheetTeamName("Lions"), "Pandas");
  teamByKey.set(normalizeSheetTeamName("The Snipers"), "Super Kings");
  teamByKey.set(normalizeSheetTeamName("Snipers"), "Super Kings");
  const rosters = new Map();

  for (let r = 0; r < rows.length; r += 1) {
    for (let c = 0; c < rows[r].length; c += 1) {
      const team = teamByKey.get(normalizeSheetTeamName(rows[r][c]));
      if (!team || rosters.has(team)) continue;
      const gm = stripGmLabel(rows[r + 1]?.[c] || "");
      const players = [];
      for (let offset = 2; offset < 12; offset += 1) {
        const player = String(rows[r + offset]?.[c] || "").trim();
        if (player) players.push(player);
      }
      rosters.set(team, { gm, players });
    }
  }

  return rosters;
}

function buildRosterGrid(rosters) {
  const grid = Array.from({ length: 56 }, () => Array.from({ length: 9 }, () => ""));

  Object.entries(C2S3_ROSTER_LAYOUT).forEach(([team, position]) => {
    const roster = rosters.get(team) || { gm: "", players: [] };
    const row = position.row;
    const col = position.col;
    grid[row][col] = "Player";
    grid[row + 1][col] = roster.gm || "GM";
    roster.players.slice(0, 10).forEach((player, index) => {
      grid[row + 2 + index][col] = player;
    });
  });

  return grid;
}

function sliceC2S3Rosters(text) {
  const rosters = extractC2S3RosterMap(text);
  const grid = buildRosterGrid(rosters);

  return `${formatCSV(trimTrailingBlankRows(grid))}\n`;
}

function sliceC2S4Rosters(text) {
  const rosters = extractC2S4RosterMap(text);
  const grid = buildRosterGrid(rosters);

  return `${formatCSV(trimTrailingBlankRows(grid))}\n`;
}

const TRANSFORMS = {
  boxscore: sliceC2S3BoxScores,
  "c2s3-draft": sliceC2S3Draft,
  "c2s4-draft": sliceC2S4Draft,
  "c2s4-roster": sliceC2S4Rosters,
  "c2s4-schedule": sliceC2S4Schedule,
  "c2s4-standings": sliceC2S4Standings,
  "c2s4-teams": sliceC2S4Rosters,
  "player-stats": sliceC2S3PlayerStats,
  roster: sliceC2S3Rosters,
  schedule: sliceC2S3RegularSchedule,
  "schedule-playoffs": sliceC2S3PostSchedule,
  standings: sliceC2S3Standings,
  "standings-dashboard": sliceC2S3Standings,
  teams: sliceC2S3Rosters,
};

module.exports = (req, res) => {
  const source = req.query && req.query.name ? String(req.query.name) : "";
  const url = SOURCES[source];
  if (!url) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, message: "Invalid sheet name" }));
    return;
  }
  proxy(req, res, url, TRANSFORMS[source] ? { transform: TRANSFORMS[source] } : undefined);
};
