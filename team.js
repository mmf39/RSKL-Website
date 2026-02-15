const ROSTER_CSV_URL = "/api/roster";
const STANDINGS_CSV_URL = "/api/standings";
const SCHEDULE_CSV_URL = "/api/schedule";
const BOXSCORE_CSV_URL = "/api/boxscore";
const ARCHIVE_URL = "/api/archive";
const SEASON_KEY = "season";
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

const ARCHIVE_RANGES = {
  standings: "A1:F7",
  teams: "H1:O27",
  schedule_regular: "G31:I79",
  schedule_post: "A31:D43",
  boxscore: "L31:R149",
};

const ARCHIVE_TEAM_ROSTERS = {
  "Gus N Em": "H1:I12",
  Cheerios: "H16:I27",
  Bullets: "K1:L12",
  Yetis: "K16:L27",
  Turkeys: "N1:O12",
  Illegals: "N16:O27",
};

const ARCHIVE_TEAM_STANDINGS = {
  Turkeys: "A2:F2",
  "Gus N Em": "A3:F3",
  Bullets: "A4:F4",
  Cheerios: "A5:F5",
  Yetis: "A6:F6",
  Illegals: "A7:F7",
};

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

const STANDINGS_RANGES = {
  Turkeys: "H3:M3",
  "Gus N Em": "H4:M4",
  Bullets: "H5:M5",
  Cheerios: "H6:M6",
  Yetis: "H7:M7",
  Illegals: "H8:M8",
  "The Lions": "H9:M9",
  "The Future": "H10:M10",
  "The Phantoms": "H11:M11",
  "The Snipers": "H12:M12",
};

const els = {
  title: document.getElementById("team-title"),
  sub: document.getElementById("team-sub"),
  lastUpdated: document.getElementById("last-updated"),
  logo: document.getElementById("team-logo"),
  head: document.querySelector("#roster-table thead"),
  body: document.querySelector("#roster-table tbody"),
  statGp: document.getElementById("stat-gp"),
  statWins: document.getElementById("stat-wins"),
  statLoss: document.getElementById("stat-loss"),
  statGb: document.getElementById("stat-gb"),
  statWinPct: document.getElementById("stat-winpct"),
  statSos: document.getElementById("stat-sos"),
  statTeam: document.getElementById("stat-team"),
  scheduleHead: document.querySelector("#team-schedule thead"),
  scheduleBody: document.querySelector("#team-schedule tbody"),
  modal: document.getElementById("boxscore-modal"),
  modalClose: document.querySelector(".modal-close"),
  boxDetails: document.getElementById("boxscore-details"),
};

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

function renderTable(headers, dataRows, teamName) {
  els.head.innerHTML = `
    <tr>
      ${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}
    </tr>
  `;

  const rows = dataRows.filter((row) => {
    const value = row[0] ?? "";
    const nameText = String(value).trim();
    return Boolean(nameText);
  });

  els.body.innerHTML = rows
    .map(
      (row) => `
        <tr>
          ${headers
            .map((_, i) => {
              const value = row[i] ?? "";
              if (i === 0 && value) {
                const nameText = String(value).trim();
                if (nameText.toUpperCase().startsWith("GM")) {
                  return `<td>${escapeHtml(nameText)}</td>`;
                }
                const link = `player-detail.html?player=${encodeURIComponent(
                  nameText
                )}`;
                return `<td><a class="roster-link" href="${link}">${escapeHtml(
                  nameText
                )}</a></td>`;
              }
              return `<td>${escapeHtml(value)}</td>`;
            })
            .join("")}
        </tr>
      `
    )
    .join("");
}

function renderSchedule(headers, dataRows) {
  els.scheduleHead.innerHTML = `
    <tr>
      ${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}
    </tr>
  `;

  els.scheduleBody.innerHTML = dataRows
    .map(
      (row, index) => `
        <tr class="schedule-row" data-index="${index}">
          ${headers
            .map((_, i) => `<td>${escapeHtml(row[i] ?? "")}</td>`)
            .join("")}
        </tr>
      `
    )
    .join("");
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

function getTeamName() {
  const params = new URLSearchParams(window.location.search);
  return params.get("team") || "";
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

function parsePct(value) {
  const num = Number(String(value || "").replace(/[^0-9.\-]/g, ""));
  if (Number.isNaN(num)) {
    return null;
  }
  return num > 1 ? num / 100 : num;
}

function buildWinPctMapFromStandingsRows(standingsRows) {
  const map = new Map();
  Object.keys(STANDINGS_RANGES).forEach((team) => {
    const sliced = sliceRange(standingsRows, STANDINGS_RANGES[team]);
    if (!sliced.length) {
      return;
    }
    const values = sliced[0] || [];
    const rowTeam = String(values[0] || team).trim();
    const pct = parsePct(values[5]);
    if (rowTeam && pct !== null) {
      map.set(rowTeam, pct);
    }
  });
  return map;
}

function buildWinPctMapFromStandingsTable(tableRows) {
  const map = new Map();
  if (!tableRows || !tableRows.length) {
    return map;
  }
  const headers = (tableRows[0] || []).map((h) => String(h || "").toLowerCase());
  const teamIdx = headers.findIndex((h) => h === "team");
  const pctIdx = headers.findIndex(
    (h) => h === "win %" || h === "win%" || h === "pct"
  );
  if (teamIdx === -1 || pctIdx === -1) {
    return map;
  }
  tableRows.slice(1).forEach((row) => {
    const team = String(row[teamIdx] || "").trim();
    const pct = parsePct(row[pctIdx]);
    if (!team || pct === null) {
      return;
    }
    map.set(team, pct);
  });
  return map;
}

function computeTeamSOS(teamName, scheduleRows, winPctMap, season) {
  if (!teamName || !scheduleRows.length || !winPctMap.size) {
    return null;
  }
  const dataRows = scheduleRows.slice(1);
  let sum = 0;
  let games = 0;
  dataRows.forEach((row) => {
    const team1 =
      season === "c2s1-regular"
        ? String(row[1] || "").trim()
        : String(row[2] || "").trim();
    const team2 =
      season === "c2s1-regular"
        ? String(row[2] || "").trim()
        : String(row[3] || "").trim();
    if (!team1 || !team2) {
      return;
    }
    const opponent =
      team1 === teamName ? team2 : team2 === teamName ? team1 : "";
    if (!opponent) {
      return;
    }
    const oppPct = winPctMap.get(opponent);
    if (oppPct === null || oppPct === undefined) {
      return;
    }
    sum += oppPct;
    games += 1;
  });
  return games ? sum / games : null;
}

async function loadRoster() {
  const teamName = getTeamName();
  if (els.logo) {
    if (teamName === "The Future") {
      els.logo.src = "/assets/the-future.png";
      els.logo.alt = "The Future logo";
      els.logo.style.display = "block";
    } else if (teamName === "The Lions") {
      els.logo.src = "/assets/the-lions.png";
      els.logo.alt = "The Lions logo";
      els.logo.style.display = "block";
    } else if (teamName === "The Snipers") {
      els.logo.src = "/assets/the-snipers.png";
      els.logo.alt = "The Snipers logo";
      els.logo.style.display = "block";
    } else if (teamName === "The Phantoms") {
      els.logo.src = "/assets/the-phantoms.png";
      els.logo.alt = "The Phantoms logo";
      els.logo.style.display = "block";
    } else if (teamName === "Yetis") {
      els.logo.src = "/assets/yetis.png";
      els.logo.alt = "Yetis logo";
      els.logo.style.display = "block";
    } else if (teamName === "Gus N Em") {
      els.logo.src = "/assets/gus-n-em.png";
      els.logo.alt = "Gus N Em logo";
      els.logo.style.display = "block";
    } else if (teamName === "Cheerios") {
      els.logo.src = "/assets/cheerios.png";
      els.logo.alt = "Cheerios logo";
      els.logo.style.display = "block";
    } else if (teamName === "Illegals") {
      els.logo.src = "/assets/illegals.png";
      els.logo.alt = "Illegals logo";
      els.logo.style.display = "block";
    } else if (teamName === "Bullets") {
      els.logo.src = "/assets/bullets.png";
      els.logo.alt = "Bullets logo";
      els.logo.style.display = "block";
    } else if (teamName === "Turkeys") {
      els.logo.src = "/assets/turkeys.png";
      els.logo.alt = "Turkeys logo";
      els.logo.style.display = "block";
    } else {
      els.logo.style.display = "none";
    }
  }
  els.title.textContent = teamName ? `${teamName} Roster` : "Team Roster";
  if (els.sub) {
    els.sub.textContent = teamName
      ? `Roster for ${teamName}`
      : "Missing team name.";
  }

  try {
    const season = getSeason();
    if (season === "c2s2") {
      const [rosterRes, standingsRes, scheduleRes, boxscoreRes] = await Promise.all([
        fetch(ROSTER_CSV_URL, { cache: "no-store" }),
        fetch(STANDINGS_CSV_URL, { cache: "no-store" }),
        fetch(SCHEDULE_CSV_URL, { cache: "no-store" }),
        fetch(BOXSCORE_CSV_URL, { cache: "no-store" }),
      ]);

      if (!rosterRes.ok) {
        throw new Error(`Fetch failed: ${rosterRes.status}`);
      }
      if (!standingsRes.ok) {
        throw new Error(`Fetch failed: ${standingsRes.status}`);
      }
      if (!scheduleRes.ok) {
        throw new Error(`Fetch failed: ${scheduleRes.status}`);
      }
      if (!boxscoreRes.ok) {
        throw new Error(`Fetch failed: ${boxscoreRes.status}`);
      }

      const rows = parseCSV(await rosterRes.text());
      if (!rows.length) {
        throw new Error("No data found.");
      }

      const range = TEAM_RANGES[teamName];
      if (!range) {
        throw new Error("Team roster range not found.");
      }

      const sliced = sliceRange(rows, range);
      if (!sliced.length) {
        throw new Error("No roster data in that range.");
      }

      renderTable(sliced[0], sliced.slice(1), teamName);
      const standingsRows = parseCSV(await standingsRes.text());
      const scheduleRows = parseCSV(await scheduleRes.text());
      updateStandingsFromRanges(teamName, standingsRows);
      const winPctMap = buildWinPctMapFromStandingsRows(standingsRows);
      const sos = computeTeamSOS(teamName, scheduleRows, winPctMap, season);
      if (els.statSos) {
        els.statSos.textContent = sos !== null ? sos.toFixed(3) : "—";
      }
      updateTeamSchedule(
        teamName,
        scheduleRows,
        parseCSV(await boxscoreRes.text()),
        season
      );
    } else {
      const [archiveRes] = await Promise.all([
        fetch(ARCHIVE_URL, { cache: "no-store" }),
      ]);
      if (!archiveRes.ok) {
        throw new Error(`Fetch failed: ${archiveRes.status}`);
      }
      const archive = parseCSV(await archiveRes.text());
      const standingsTable = sliceRange(archive, ARCHIVE_RANGES.standings);
      const scheduleRange =
        season === "c2s1-post"
          ? ARCHIVE_RANGES.schedule_post
          : ARCHIVE_RANGES.schedule_regular;
      const scheduleTable = sliceRange(archive, scheduleRange);
      const boxscoreTable = sliceRange(archive, ARCHIVE_RANGES.boxscore);

      const rosterRange = ARCHIVE_TEAM_ROSTERS[teamName];
      let rosterRows = rosterRange ? sliceRange(archive, rosterRange) : [];
      if (rosterRows.length) {
        rosterRows = rosterRows
          .filter((row) => String(row[0] || "").trim() !== teamName)
          .map((row) => [row[0], ""]);
      }
      renderTable(["Player"], rosterRows.map((row) => [row[0]]), teamName);

      const standingsRange = ARCHIVE_TEAM_STANDINGS[teamName];
      const standingsRow = standingsRange
        ? sliceRange(archive, standingsRange)[0]
        : null;
      updateStandingsFromRow(standingsRow || []);
      const archiveWinPctMap = buildWinPctMapFromStandingsTable(standingsTable);
      const archiveSos = computeTeamSOS(
        teamName,
        scheduleTable,
        archiveWinPctMap,
        season
      );
      if (els.statSos) {
        els.statSos.textContent =
          archiveSos !== null ? archiveSos.toFixed(3) : "—";
      }
      if (els.statSos) {
        if (els.statSos.textContent.trim() === "") {
          els.statSos.textContent = "—";
        }
      }
      updateTeamSchedule(teamName, scheduleTable, boxscoreTable, season);
    }
    updateLastUpdated();
  } catch (error) {
    els.body.innerHTML = `<tr><td>${escapeHtml(error.message)}</td></tr>`;
  }
}

function updateStandingsFromRanges(teamName, standingsRows) {
  const range = STANDINGS_RANGES[teamName];
  if (!range || !standingsRows.length) {
    return;
  }
  const sliced = sliceRange(standingsRows, range);
  if (!sliced.length) {
    return;
  }
  const values = sliced[0];
  const [team, gp, wins, loss, gb, winPct] = values;

  els.statTeam.textContent = team || teamName || "—";
  els.statGp.textContent = gp || "—";
  els.statWins.textContent = wins || "—";
  els.statLoss.textContent = loss || "—";
  els.statGb.textContent = gb || "—";
  els.statWinPct.textContent = winPct || "—";
  if (els.statSos) {
    els.statSos.textContent = "—";
  }
}

function updateStandingsFromRow(values) {
  if (!values || !values.length) {
    return;
  }
  const [team, gp, wins, loss, gb, winPct] = values;
  els.statTeam.textContent = team || "—";
  els.statGp.textContent = gp || "—";
  els.statWins.textContent = wins || "—";
  els.statLoss.textContent = loss || "—";
  els.statGb.textContent = gb || "—";
  els.statWinPct.textContent = winPct || "—";
  if (els.statSos) {
    els.statSos.textContent = "—";
  }
}

let teamScheduleRows = [];
let boxScoreRows = [];

function updateTeamSchedule(teamName, scheduleRows, boxScoreData, season) {
  if (!scheduleRows.length) {
    return;
  }
  const headers = scheduleRows[0];
  const dataRows = scheduleRows.slice(1);
  const filtered = dataRows.filter((row) => {
    const team1 =
      season === "c2s1-regular" ? String(row[1] || "").trim() : String(row[2] || "").trim();
    const team2 =
      season === "c2s1-regular" ? String(row[2] || "").trim() : String(row[3] || "").trim();
    return team1 === teamName || team2 === teamName;
  });

  const trimmedHeaders = headers.slice(0, headers.length);
  const trimmedRows = filtered.map((row) => row.slice(0, headers.length));
  teamScheduleRows = filtered;
  boxScoreRows = boxScoreData.slice(0, 1000);
  renderSchedule(trimmedHeaders, trimmedRows);
}

function buildBoxScore(teamName, scheduleRow, season) {
  if (!scheduleRow || !boxScoreRows.length) {
    return null;
  }
  const dateToken =
    season === "c2s1-regular"
      ? String(scheduleRow[0] || "").trim()
      : String(scheduleRow[1] || "").trim();
  const team1Name = scheduleRow[2] || "";
  const team2Name = scheduleRow[3] || "";

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

  const matchIndex = boxScoreRows.findIndex(isDateRow);
  if (matchIndex === -1) {
    return {
      dateLabel: `League Day: ${dateToken}`,
      team1Name,
      team2Name,
      team1: [],
      team2: [],
    };
  }

  const teamRows = [];
  for (let i = matchIndex + 1; i < boxScoreRows.length; i += 1) {
    const row = boxScoreRows[i];
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

  const team1Header = team1Rows.length ? team1Rows[0][0] : team1Name;
  const team2Header = team2Rows.length ? team2Rows[0][4] : team2Name;

  return {
    dateLabel: `League Day: ${dateToken}`,
    team1Name: team1Header || team1Name,
    team2Name: team2Header || team2Name,
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

function renderBoxScoreModal(boxScore) {
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

els.scheduleBody.addEventListener("click", (event) => {
  const rowEl = event.target.closest(".schedule-row");
  if (!rowEl) {
    return;
  }
  const index = Number(rowEl.dataset.index);
  const scheduleRow = teamScheduleRows[index];
  const boxScore = buildBoxScore(getTeamName(), scheduleRow, getSeason());
  renderBoxScoreModal(boxScore);
});

document.addEventListener("click", (event) => {
  if (event.target.matches("[data-close=\"true\"]")) {
    els.modal.hidden = true;
  }
});

initSeasonSelect();
loadRoster();
