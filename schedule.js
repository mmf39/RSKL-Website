const SCHEDULE_CSV_URL = "/api/sheet?name=schedule";
const BOXSCORE_CSV_URL = "/api/sheet?name=boxscore";
const ARCHIVE_URL = "/api/sheet?name=archive";
const SEASON_KEY = "season";

const els = {
  lastUpdated: document.getElementById("last-updated"),
  head: document.querySelector("#schedule-table thead"),
  body: document.querySelector("#schedule-table tbody"),
  search: document.getElementById("schedule-search"),
  modal: document.getElementById("boxscore-modal"),
  modalClose: document.querySelector(".modal-close"),
  boxDetails: document.getElementById("boxscore-details"),
};

let cachedHeaders = [];
let cachedRows = [];
let cachedFullRows = [];
let cachedBoxScoreRows = [];
let cachedScheduleRows = [];

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
  if (!select) {
    return;
  }
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

function getC2S2ScheduleRows(rows) {
  const sliced = sliceRange(rows, C2S2_SCHEDULE_RANGE);
  return [["Date", "Team 1", "Team 2"], ...sliced];
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function displayTeamName(value) {
  const name = String(value || "").trim();
  return name === "Bullets" ? "Storm" : name;
}

function isTeamColumn(header) {
  const text = String(header || "").trim().toLowerCase();
  return text.includes("team");
}

function findBoxScoreRowsForDate(dateToken, boxRows) {
  if (!dateToken || !boxRows || !boxRows.length) {
    return [];
  }
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
  const matchIndex = boxRows.findIndex(isDateRow);
  if (matchIndex === -1) {
    return [];
  }
  const rows = [];
  for (let i = matchIndex + 1; i < boxRows.length; i += 1) {
    const row = boxRows[i];
    if (!row) {
      break;
    }
    if (isDateRow(row)) {
      break;
    }
    const hasTeam1 = String(row[0] || "").trim() !== "";
    const hasTeam2 = String(row[4] || "").trim() !== "";
    if (!hasTeam1 && !hasTeam2) {
      if (rows.length) {
        break;
      }
      continue;
    }
    rows.push(row);
  }
  return rows;
}

function hasConcludedGame(row, headers, season, boxRows) {
  const isThreeCol = headers.length <= 3;
  const dateIndex = isThreeCol || season === "c2s1-regular" ? 0 : 1;
  const dateToken = String(row[dateIndex] || "").trim();
  if (!dateToken) {
    return false;
  }
  const rows = findBoxScoreRowsForDate(dateToken, boxRows);
  if (!rows.length) {
    return false;
  }
  return rows.some((r) => {
    const p1 = String(r[0] || "").trim();
    const p2 = String(r[4] || "").trim();
    return p1.startsWith("@") || p2.startsWith("@");
  });
}

function renderTable(headers, dataRows, fullRows, boxScoreRows, scheduleRows) {
  cachedHeaders = headers;
  cachedRows = dataRows;
  cachedFullRows = fullRows || dataRows;
  cachedBoxScoreRows = boxScoreRows || [];
  cachedScheduleRows = scheduleRows || dataRows;
  els.head.innerHTML = `
    <tr>
      ${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}
    </tr>
  `;

  els.body.innerHTML = dataRows
    .map((row, index) => {
      const concluded = hasConcludedGame(
        row,
        headers,
        getSeason(),
        cachedBoxScoreRows
      );
      return `
        <tr class="schedule-row" data-index="${index}">
          ${headers
            .map((header, i) => {
              const value = row[i] ?? "";
              if (isTeamColumn(header) && String(value).trim() && !concluded) {
                const shown = displayTeamName(value);
                return `<td><a class="roster-link" href="/team.html?team=${encodeURIComponent(
                  shown
                )}">${escapeHtml(shown)}</a></td>`;
              }
              return `<td>${escapeHtml(value)}</td>`;
            })
            .join("")}
        </tr>
      `;
    })
    .join("");
}

function renderBoxScore(rowEl, boxScoreBlock, team1Name, team2Name, dateLabel) {
  if (!boxScoreBlock) {
    return;
  }
  document
    .querySelectorAll(".schedule-row.active")
    .forEach((el) => el.classList.remove("active"));
  rowEl.classList.add("active");

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
            <a class="boxscore-link" href="/player-detail.html?player=${encodeURIComponent(
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
    <div class="boxscore-meta">${escapeHtml(dateLabel || "")}</div>
    <div class="boxscore-card">
      ${renderTeamTable(boxScoreBlock.team1, team1Name || "Team 1")}
    </div>
    <div class="boxscore-card">
      ${renderTeamTable(boxScoreBlock.team2, team2Name || "Team 2")}
    </div>
  `;

  els.modal.hidden = false;
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

async function loadSchedule() {
  try {
    const season = getSeason();
    let rows = [];
    let boxScoreRows = [];
    let dateIndex = 1;
    let team1Index = 2;
    let team2Index = 3;

    if (season === "c2s2") {
      const response = await fetch(SCHEDULE_CSV_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      rows = getC2S2ScheduleRows(parseCSV(await response.text()));
      const boxRes = await fetch(BOXSCORE_CSV_URL, { cache: "no-store" });
      boxScoreRows = parseCSV(await boxRes.text()).slice(0, 1000);
      dateIndex = 0;
      team1Index = 1;
      team2Index = 2;
    } else {
      const response = await fetch(ARCHIVE_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      const archive = parseCSV(await response.text());
      const range =
        season === "c2s1-post"
          ? ARCHIVE_RANGES.schedule_post
          : ARCHIVE_RANGES.schedule_regular;
      rows = sliceRange(archive, range);
      boxScoreRows = sliceRange(archive, ARCHIVE_RANGES.boxscore);
      if (season === "c2s1-post") {
        dateIndex = 1;
        team1Index = 2;
        team2Index = 3;
      } else {
        dateIndex = 0;
        team1Index = 1;
        team2Index = 2;
      }
    }

    if (!rows.length) {
      throw new Error("No data found.");
    }

    const limitedFull = rows.slice(0, 1000);
    const headers = limitedFull[0] || [];
    const dataRows = limitedFull.slice(1);
    renderTable(headers, dataRows, dataRows, boxScoreRows, dataRows);
    updateLastUpdated();
  } catch (error) {
    els.body.innerHTML = `<tr><td>${escapeHtml(error.message)}</td></tr>`;
  }
}

els.body.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    return;
  }
  const rowEl = event.target.closest(".schedule-row");
  if (!rowEl) {
    return;
  }
  const rowIndex = Number(rowEl.dataset.index);
  const scheduleRow = cachedScheduleRows[rowIndex];
  const season = getSeason();
  const isThreeCol = cachedHeaders.length <= 3;
  const dateIndex = isThreeCol || season === "c2s1-regular" ? 0 : 1;
  const team1Index = isThreeCol || season === "c2s1-regular" ? 1 : 2;
  const team2Index = isThreeCol || season === "c2s1-regular" ? 2 : 3;
  const scheduleDate = scheduleRow ? scheduleRow[dateIndex] : "";
  const team1Name = scheduleRow ? scheduleRow[team1Index] : "";
  const team2Name = scheduleRow ? scheduleRow[team2Index] : "";
  const dateToken = scheduleDate ? scheduleDate.trim() : "";

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

  const matchIndex = cachedBoxScoreRows.findIndex(isDateRow);

  if (matchIndex === -1) {
    renderBoxScore(
      rowEl,
      { team1: [], team2: [] },
      team1Name,
      team2Name,
      `League Day: ${dateToken}`
    );
    return;
  }

  const teamRows = [];
  for (let i = matchIndex + 1; i < cachedBoxScoreRows.length; i += 1) {
    const row = cachedBoxScoreRows[i];
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

  const team1 = team1Rows.slice(1).map((row) => ({
    player: row[0] || "",
    points: row[1] || "",
    rank: row[2] || "",
  }));

  const team2 = team2Rows.slice(1).map((row) => ({
    player: row[4] || "",
    points: row[5] || "",
    rank: row[6] || "",
  }));

  renderBoxScore(
    rowEl,
    { team1, team2 },
    team1Header || team1Name,
    team2Header || team2Name,
    `League Day: ${dateToken}`
  );
});

els.search.addEventListener("input", () => {
  const term = els.search.value.trim().toLowerCase();
  if (!term) {
    renderTable(
      cachedHeaders,
      cachedRows,
      cachedFullRows,
      cachedBoxScoreRows,
      cachedScheduleRows
    );
    return;
  }
  const filteredRows = [];
  const filteredScheduleRows = [];
  cachedRows.forEach((row, idx) => {
    if (row.some((cell) => String(cell).toLowerCase().includes(term))) {
      filteredRows.push(row);
      filteredScheduleRows.push(cachedScheduleRows[idx]);
    }
  });
  renderTable(
    cachedHeaders,
    filteredRows,
    filteredRows,
    cachedBoxScoreRows,
    filteredScheduleRows
  );
});

document.addEventListener("click", (event) => {
  if (event.target.matches("[data-close=\"true\"]")) {
    els.modal.hidden = true;
  }
});

initSeasonSelect();
loadSchedule();
