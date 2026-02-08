const STANDINGS_CSV_URL = "/api/standings-dashboard";

const els = {
  lastUpdated: document.getElementById("last-updated"),
  leaderboard: document.getElementById("leaderboard"),
};

let standingsRows = [];
let standingsHeaders = [];

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

function renderStandings() {
  const statKeys = ["gp", "wins", "loss", "gb", "win %", "win%", "pct"];
  const statIndices = statKeys
    .map((key) =>
      standingsHeaders.findIndex((h) => h.toLowerCase() === key)
    )
    .filter((idx, i, arr) => idx !== -1 && arr.indexOf(idx) === i);

  if (!standingsRows.length) {
    els.leaderboard.innerHTML = "<p>No standings data available.</p>";
    return;
  }

  els.leaderboard.innerHTML = standingsRows
    .map((row, index) => {
      const teamName = row[0] || row[1] || "Team";
      const link = `team.html?team=${encodeURIComponent(teamName)}`;
      return `
        <a class="leader-row" href="${link}">
          <div class="leader-rank">#${index + 1}</div>
          <div>
            <div class="leader-name">${escapeHtml(teamName)}</div>
          </div>
          <div class="leader-meta">
            ${statIndices
              .map(
                (i) => `
                <div class="leader-chip">
                  ${escapeHtml(standingsHeaders[i])}
                  <span>${escapeHtml(row[i] ?? "")}</span>
                </div>
              `
              )
              .join("")}
          </div>
        </a>
      `;
    })
    .join("");
}

async function loadStandings() {
  try {
    const response = await fetch(STANDINGS_CSV_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    const rows = parseCSV(await response.text());
    if (!rows.length) {
      throw new Error("No data found.");
    }
    standingsHeaders = rows[0];
    standingsRows = rows.slice(1);
    renderStandings();
    updateLastUpdated();
  } catch (error) {
    els.leaderboard.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
  }
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

loadStandings();
