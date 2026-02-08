const SCHEDULE_CSV_URL = "/api/schedule";
const BOXSCORE_CSV_URL = "/api/boxscore";

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
    const response = await fetch(SCHEDULE_CSV_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    const rows = parseCSV(await response.text());
    if (!rows.length) {
      throw new Error("No data found.");
    }

    const limitedFull = rows.slice(0, 1000);
    const limitedTable = limitedFull.map((row) => row.slice(0, 4));
    const headers = limitedTable[0] || [];
    const dataRows = limitedTable.slice(1);
    const fullDataRows = limitedFull.slice(1);
    const boxScoreRows = parseCSV(
      await (await fetch(BOXSCORE_CSV_URL, { cache: "no-store" })).text()
    ).slice(0, 1000);
    renderTable(headers, dataRows, fullDataRows, boxScoreRows, dataRows);
    updateLastUpdated();
  } catch (error) {
    els.body.innerHTML = `<tr><td>${escapeHtml(error.message)}</td></tr>`;
  }
}

els.body.addEventListener("click", (event) => {
  const rowEl = event.target.closest(".schedule-row");
  if (!rowEl) {
    return;
  }
  const index = Number(rowEl.dataset.index);
  const scheduleRow = cachedScheduleRows[index];
  const scheduleDate = scheduleRow ? scheduleRow[1] : "";
  const team1Name = scheduleRow ? scheduleRow[2] : "";
  const team2Name = scheduleRow ? scheduleRow[3] : "";
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
  const filtered = cachedRows
    .map((row, idx) => ({
      row,
      fullRow: cachedFullRows[idx],
      boxScoreRow: cachedBoxScoreRows[idx],
      scheduleRow: cachedScheduleRows[idx],
    }))
    .filter(({ row }) =>
      row.some((cell) => String(cell).toLowerCase().includes(term))
    );
  renderTable(
    cachedHeaders,
    filtered.map((item) => item.row),
    filtered.map((item) => item.fullRow),
    filtered.map((item) => item.boxScoreRow),
    filtered.map((item) => item.scheduleRow)
  );
});

document.addEventListener("click", (event) => {
  if (event.target.matches("[data-close=\"true\"]")) {
    els.modal.hidden = true;
  }
});

loadSchedule();
