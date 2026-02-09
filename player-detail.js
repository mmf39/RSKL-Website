const PLAYER_STATS_URL = "/api/player-stats";
const BOXSCORE_CSV_URL = "/api/boxscore";

const els = {
  name: document.getElementById("player-name"),
  sub: document.getElementById("player-sub"),
  lastUpdated: document.getElementById("last-updated"),
  head: document.querySelector("#player-games thead"),
  body: document.querySelector("#player-games tbody"),
  modal: document.getElementById("boxscore-modal"),
  boxDetails: document.getElementById("boxscore-details"),
  sumTotal: document.getElementById("sum-total"),
  sumAvgScore: document.getElementById("sum-avg-score"),
  sumAvgRank: document.getElementById("sum-avg-rank"),
  sumGp: document.getElementById("sum-gp"),
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

function getPlayerName() {
  const params = new URLSearchParams(window.location.search);
  return params.get("player") || "";
}

function renderTable(rows) {
  const headers = ["Date", "Team", "Score", "Rank", "Opponent"];
  els.head.innerHTML = `
    <tr>
      ${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}
    </tr>
  `;

  els.body.innerHTML = rows
    .map(
      (row, index) => `
        <tr class="schedule-row" data-index="${index}">
          <td>${escapeHtml(row[0] ?? "")}</td>
          <td>${escapeHtml(row[1] ?? "")}</td>
          <td>${escapeHtml(row[3] ?? "")}</td>
          <td>${escapeHtml(row[4] ?? "")}</td>
          <td>${escapeHtml(row[5] ?? "")}</td>
        </tr>
      `
    )
    .join("");
}

function updateSummary(rows) {
  if (!rows.length) {
    els.sumTotal.textContent = "—";
    els.sumAvgScore.textContent = "—";
    els.sumAvgRank.textContent = "—";
    els.sumGp.textContent = "—";
    return;
  }
  let total = 0;
  let scoreGames = 0;
  let rankTotal = 0;
  let rankGames = 0;

  rows.forEach((row) => {
    const score = Number(String(row[3] || "").replace(/[^0-9.\-]/g, ""));
    const rank = Number(String(row[4] || "").replace(/[^0-9.\-]/g, ""));
    if (!Number.isNaN(score)) {
      total += score;
      scoreGames += 1;
    }
    if (!Number.isNaN(rank)) {
      rankTotal += rank;
      rankGames += 1;
    }
  });

  els.sumTotal.textContent = total.toFixed(0);
  els.sumAvgScore.textContent = scoreGames
    ? (total / scoreGames).toFixed(2)
    : "—";
  els.sumAvgRank.textContent = rankGames
    ? (rankTotal / rankGames).toFixed(2)
    : "—";
  els.sumGp.textContent = String(scoreGames);
}

async function loadPlayer() {
  const playerName = getPlayerName();
  els.name.textContent = playerName || "Player";
  if (els.sub) {
    els.sub.textContent = playerName
      ? `Game-by-game stats for ${playerName}`
      : "Missing player name.";
  }

  if (playerName.toUpperCase().startsWith("GM")) {
    renderTable([]);
    updateSummary([]);
    els.body.innerHTML = `<tr><td>No stats for GM entries.</td></tr>`;
    return;
  }

  try {
    const [playerRes, boxRes] = await Promise.all([
      fetch(PLAYER_STATS_URL, { cache: "no-store" }),
      fetch(BOXSCORE_CSV_URL, { cache: "no-store" }),
    ]);
    if (!playerRes.ok) {
      throw new Error(`Fetch failed: ${playerRes.status}`);
    }
    if (!boxRes.ok) {
      throw new Error(`Fetch failed: ${boxRes.status}`);
    }
    const rows = parseCSV(await playerRes.text());
    if (!rows.length) {
      throw new Error("No data found.");
    }
    const dataRows = rows.slice(1);
    const normalize = (value) => String(value || "").trim().toLowerCase();
    const target = normalize(playerName);
    const filtered = playerName
      ? dataRows.filter((row) => normalize(row[2]) === target)
      : [];

    renderTable(filtered);
    updateSummary(filtered);
    window.__playerRows = filtered;
    window.__boxScoreRows = parseCSV(await boxRes.text());
    updateLastUpdated();
  } catch (error) {
    els.body.innerHTML = `<tr><td>${escapeHtml(error.message)}</td></tr>`;
  }
}

function renderBoxScore(boxScore) {
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

function buildBoxScore(dateToken, opponent) {
  const rows = window.__boxScoreRows || [];
  if (!rows.length) {
    return null;
  }
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

  const matchIndex = rows.findIndex(isDateRow);
  if (matchIndex === -1) {
    return null;
  }

  const teamRows = [];
  for (let i = matchIndex + 1; i < rows.length; i += 1) {
    const row = rows[i];
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

  const team1Header = team1Rows.length ? team1Rows[0][0] : "";
  const team2Header = team2Rows.length ? team2Rows[0][4] : "";

  const matchup = `${team1Header} ${team2Header}`.toLowerCase();
  if (opponent && !matchup.includes(opponent.toLowerCase())) {
    return null;
  }

  return {
    dateLabel: `League Day: ${dateToken}`,
    team1Name: team1Header,
    team2Name: team2Header,
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

els.body.addEventListener("click", (event) => {
  const rowEl = event.target.closest(".schedule-row");
  if (!rowEl) {
    return;
  }
  const index = Number(rowEl.dataset.index);
  const rows = window.__playerRows || [];
  const row = rows[index];
  if (!row) {
    return;
  }
  const dateToken = String(row[0] || "").trim();
  const opponent = String(row[5] || "").trim();
  const boxScore = buildBoxScore(dateToken, opponent);
  if (!boxScore) {
    els.boxDetails.innerHTML = `<div class=\"boxscore-empty\">No stats available.</div>`;
    els.modal.hidden = false;
    return;
  }
  renderBoxScore(boxScore);
});

document.addEventListener("click", (event) => {
  if (event.target.matches("[data-close=\"true\"]")) {
    els.modal.hidden = true;
  }
});

loadPlayer();
