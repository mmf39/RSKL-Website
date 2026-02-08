const ROSTER_CSV_URL = "/api/roster";
const STANDINGS_CSV_URL = "/api/standings";
const SCHEDULE_CSV_URL = "/api/schedule";
const BOXSCORE_CSV_URL = "/api/boxscore";
const TEAM_RANGES = {
  "Gus N Em": "B2:C13",
  Bullets: "E2:F13",
  Turkeys: "H2:I13",
  Cheerios: "B17:C28",
  Yetis: "E17:F28",
  Illegals: "H17:I28",
};

const STANDINGS_RANGES = {
  Turkeys: "H3:M3",
  "Gus N Em": "H4:M4",
  Bullets: "H5:M5",
  Cheerios: "H6:M6",
  Yetis: "H7:M7",
  Illegals: "H8:M8",
};

const els = {
  title: document.getElementById("team-title"),
  sub: document.getElementById("team-sub"),
  lastUpdated: document.getElementById("last-updated"),
  head: document.querySelector("#roster-table thead"),
  body: document.querySelector("#roster-table tbody"),
  statGp: document.getElementById("stat-gp"),
  statWins: document.getElementById("stat-wins"),
  statLoss: document.getElementById("stat-loss"),
  statGb: document.getElementById("stat-gb"),
  statWinPct: document.getElementById("stat-winpct"),
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

function renderTable(headers, dataRows) {
  els.head.innerHTML = `
    <tr>
      ${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}
    </tr>
  `;

  els.body.innerHTML = dataRows
    .map(
      (row) => `
        <tr>
          ${headers
            .map((_, i) => {
              const value = row[i] ?? "";
              if (i === 0 && value) {
                const nameText = String(value).trim();
                if (nameText.toUpperCase().startsWith("GM")) {
                  return `<td>${escapeHtml(value)}</td>`;
                }
                const link = `player-detail.html?player=${encodeURIComponent(
                  nameText
                )}`;
                return `<td><a class="roster-link" href="${link}">${escapeHtml(
                  value
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

async function loadRoster() {
  const teamName = getTeamName();
  els.title.textContent = teamName ? `${teamName} Roster` : "Team Roster";
  els.sub.textContent = teamName
    ? `Roster for ${teamName}`
    : "Missing team name.";

  try {
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

    renderTable(sliced[0], sliced.slice(1));
    updateStandingsFromRanges(teamName, parseCSV(await standingsRes.text()));
    updateTeamSchedule(
      teamName,
      parseCSV(await scheduleRes.text()),
      parseCSV(await boxscoreRes.text())
    );
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
}

let teamScheduleRows = [];
let boxScoreRows = [];

function updateTeamSchedule(teamName, scheduleRows, boxScoreData) {
  if (!scheduleRows.length) {
    return;
  }
  const headers = scheduleRows[0];
  const dataRows = scheduleRows.slice(1);
  const filtered = dataRows.filter((row) => {
    const team1 = String(row[2] || "").trim();
    const team2 = String(row[3] || "").trim();
    return team1 === teamName || team2 === teamName;
  });

  const trimmedHeaders = headers.slice(0, 4);
  const trimmedRows = filtered.map((row) => row.slice(0, 4));
  teamScheduleRows = filtered;
  boxScoreRows = boxScoreData.slice(0, 1000);
  renderSchedule(trimmedHeaders, trimmedRows);
}

function buildBoxScore(teamName, scheduleRow) {
  if (!scheduleRow || !boxScoreRows.length) {
    return null;
  }
  const dateToken = String(scheduleRow[1] || "").trim();
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
  const boxScore = buildBoxScore(getTeamName(), scheduleRow);
  renderBoxScoreModal(boxScore);
});

document.addEventListener("click", (event) => {
  if (event.target.matches("[data-close=\"true\"]")) {
    els.modal.hidden = true;
  }
});

loadRoster();
