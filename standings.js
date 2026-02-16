const STANDINGS_CSV_URL = "/api/sheet?name=standings-dashboard";
const SCHEDULE_CSV_URL = "/api/sheet?name=schedule";
const ARCHIVE_URL = "/api/sheet?name=archive";
const SEASON_KEY = "season";
const C2S2_SCHEDULE_RANGE = "A2:C77";

const els = {
  lastUpdated: document.getElementById("last-updated"),
  leaderboard: document.getElementById("leaderboard"),
};

let standingsRows = [];
let standingsHeaders = [];
let sosByTeam = new Map();

const ARCHIVE_RANGES = {
  standings: "A1:F7",
  bracket: "A9:F15",
};

function getSeason() {
  return localStorage.getItem(SEASON_KEY) || "c2s2";
}

function initSeasonSelect() {
  const select = document.getElementById("season-select");
  if (!select) {
    return;
  }
  if (localStorage.getItem(SEASON_KEY)) {
    select.value = getSeason();
  } else {
    localStorage.setItem(SEASON_KEY, select.value);
  }
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

function renderTable(rows) {
  if (!rows.length) {
    els.leaderboard.innerHTML = "<p>No data available.</p>";
    return;
  }
  const headers = rows[0];
  const dataRows = rows.slice(1);
  const table = `
    <div class="table-wrap">
      <table id="standings-table">
        <thead>
          <tr>
            ${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${dataRows
            .map(
              (row) => `
                <tr>
                  ${row.map((cell) => `<td>${escapeHtml(cell ?? "")}</td>`).join("")}
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
  els.leaderboard.innerHTML = table;
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
      const rawTeamName = row[0] || row[1] || "Team";
      const teamName = displayTeamName(rawTeamName);
      const link = `team.html?team=${encodeURIComponent(teamName)}`;
      const logo =
        (rawTeamName === "The Future" || teamName === "The Future")
          ? '<img class="standings-logo" src="/assets/the-future.png" alt="The Future logo" />'
          : (rawTeamName === "The Lions" || teamName === "The Lions")
          ? '<img class="standings-logo" src="/assets/the-lions.png" alt="The Lions logo" />'
          : (rawTeamName === "The Snipers" || teamName === "The Snipers")
          ? '<img class="standings-logo" src="/assets/the-snipers.png" alt="The Snipers logo" />'
          : (rawTeamName === "The Phantoms" || teamName === "The Phantoms")
          ? '<img class="standings-logo" src="/assets/the-phantoms.png" alt="The Phantoms logo" />'
          : (rawTeamName === "Yetis" || teamName === "Yetis")
          ? '<img class="standings-logo" src="/assets/yetis.png" alt="Yetis logo" />'
          : (rawTeamName === "Gus N Em" || teamName === "Gus N Em")
          ? '<img class="standings-logo" src="/assets/gus-n-em.png" alt="Gus N Em logo" />'
          : (rawTeamName === "Cheerios" || teamName === "Cheerios")
          ? '<img class="standings-logo" src="/assets/cheerios.png" alt="Cheerios logo" />'
          : (rawTeamName === "Illegals" || teamName === "Illegals")
          ? '<img class="standings-logo" src="/assets/illegals.png" alt="Illegals logo" />'
          : (rawTeamName === "Bullets" || teamName === "Storm")
          ? '<img class="standings-logo" src="/assets/bullets.png" alt="Storm logo" />'
          : teamName === "Turkeys"
          ? '<img class="standings-logo" src="/assets/turkeys.png" alt="Turkeys logo" />'
          : "";
      return `
        <a class="leader-row" href="${link}">
          <div class="leader-rank">#${index + 1}</div>
          <div>
            <div class="leader-name">${logo}${escapeHtml(teamName)}</div>
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
            <div class="leader-chip">
              SOS
              <span>${escapeHtml(
                sosByTeam.has(rawTeamName) ? sosByTeam.get(rawTeamName) : "—"
              )}</span>
            </div>
          </div>
        </a>
      `;
    })
    .join("");
}

function parsePct(value) {
  const num = Number(String(value || "").replace(/[^0-9.\-]/g, ""));
  if (Number.isNaN(num)) {
    return null;
  }
  return num > 1 ? num / 100 : num;
}

function computeSosMap(
  standingsHeader,
  standingsDataRows,
  scheduleRows,
  team1Idx = 2,
  team2Idx = 3
) {
  const map = new Map();
  if (!standingsDataRows.length || !scheduleRows.length) {
    return map;
  }
  const lower = standingsHeader.map((h) => String(h || "").toLowerCase());
  const teamIdx = lower.findIndex((h) => h === "team");
  const winIdx = lower.findIndex((h) => h === "win %" || h === "win%" || h === "pct");
  if (teamIdx === -1 || winIdx === -1) {
    return map;
  }
  const winPctByTeam = new Map();
  standingsDataRows.forEach((row) => {
    const team = String(row[teamIdx] || "").trim();
    const pct = parsePct(row[winIdx]);
    if (!team || pct === null) {
      return;
    }
    winPctByTeam.set(team, pct);
  });

  const scheduleData = scheduleRows.slice(1);
  const sums = new Map();
  const counts = new Map();
  scheduleData.forEach((row) => {
    const team1 = String(row[team1Idx] || "").trim();
    const team2 = String(row[team2Idx] || "").trim();
    if (!team1 || !team2) {
      return;
    }
    const pct1 = winPctByTeam.get(team1);
    const pct2 = winPctByTeam.get(team2);
    if (pct2 !== undefined) {
      sums.set(team1, (sums.get(team1) || 0) + pct2);
      counts.set(team1, (counts.get(team1) || 0) + 1);
    }
    if (pct1 !== undefined) {
      sums.set(team2, (sums.get(team2) || 0) + pct1);
      counts.set(team2, (counts.get(team2) || 0) + 1);
    }
  });

  winPctByTeam.forEach((_, team) => {
    const count = counts.get(team) || 0;
    if (!count) {
      map.set(team, "—");
      return;
    }
    const value = (sums.get(team) || 0) / count;
    map.set(team, value.toFixed(3));
  });
  return map;
}

async function loadStandings() {
  try {
    const season = getSeason();
    if (season === "c2s2") {
      const [standingsRes, scheduleRes] = await Promise.all([
        fetch(STANDINGS_CSV_URL, { cache: "no-store" }),
        fetch(SCHEDULE_CSV_URL, { cache: "no-store" }),
      ]);
      if (!standingsRes.ok) {
        throw new Error(`Fetch failed: ${standingsRes.status}`);
      }
      if (!scheduleRes.ok) {
        throw new Error(`Fetch failed: ${scheduleRes.status}`);
      }
      const rows = parseCSV(await standingsRes.text());
      const scheduleRows = getC2S2ScheduleRows(
        parseCSV(await scheduleRes.text())
      );
      if (!rows.length) {
        throw new Error("No data found.");
      }
      standingsHeaders = rows[0];
      standingsRows = rows.slice(1);
      sosByTeam = computeSosMap(
        standingsHeaders,
        standingsRows,
        scheduleRows,
        1,
        2
      );
      renderStandings();
    } else {
      const response = await fetch(ARCHIVE_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      const rows = parseCSV(await response.text());
      if (season === "c2s1-regular") {
        const standingsTable = sliceRange(rows, ARCHIVE_RANGES.standings);
        const scheduleTable = sliceRange(rows, "G31:I79");
        standingsHeaders = standingsTable[0] || [];
        standingsRows = standingsTable.slice(1);
        sosByTeam = computeSosMap(
          standingsHeaders,
          standingsRows,
          scheduleTable,
          1,
          2
        );
        renderStandings();
      } else {
        const sliced = sliceRange(rows, ARCHIVE_RANGES.bracket);
        sosByTeam = new Map();
        renderTable(sliced);
      }
    }
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

initSeasonSelect();
loadStandings();
