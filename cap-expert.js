const CONTRACTS_URL = "/api/sheet?name=contracts";
const TEAM_CAP_LIMIT = 5000;
const CAP_CHART_COLORS = [
  "#ff9f43",
  "#feca57",
  "#54a0ff",
  "#5fdbb0",
  "#ff6b6b",
  "#a29bfe",
  "#48dbfb",
  "#1dd1a1",
  "#ff9ff3",
  "#c8d6e5",
  "#f6b93b",
  "#e58e26",
];

const els = {
  lastUpdated: document.getElementById("last-updated"),
  viewTabs: document.getElementById("cap-view-tabs"),
  teamSummary: document.getElementById("cap-team-summary"),
  playerSummary: document.getElementById("cap-player-summary"),
  teamInfoSection: document.getElementById("cap-team-info-section"),
  teamCardsSection: document.getElementById("cap-team-cards-section"),
  teamBreakdownSection: document.getElementById("cap-team-breakdown-section"),
  playerInfoSection: document.getElementById("cap-player-info-section"),
  teamCards: document.getElementById("cap-team-cards"),
  teamBreakdown: document.getElementById("cap-team-breakdown"),
  teamTitle: document.getElementById("cap-team-title"),
  teamSelect: document.getElementById("cap-team-select"),
  teamFilter: document.getElementById("cap-team-filter"),
  search: document.getElementById("cap-search"),
  tableHead: document.querySelector("#cap-table thead"),
  tableBody: document.querySelector("#cap-table tbody"),
};

let contractRows = [];
let selectedTeam = "All Teams";
const CAP_VIEW_KEY = "capExpertView";

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
  if (name === "Bullets") return "Storm";
  if (name === "Yetis") return "MayeDay";
  if (name === "The Future") return "Dream Team";
  if (name === "Lions") return "The Lions";
  if (name === "Phantoms" || name === "Phantons") return "The Phantoms";
  if (name === "Snipers" || name === "Sniper") return "The Snipers";
  return name;
}

function parseMoney(value) {
  const amount = Number(String(value || "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: Number(value || 0) % 1 === 0 ? 0 : 2,
    minimumFractionDigits: Number(value || 0) % 1 === 0 ? 0 : 2,
  });
}

function buildCapPieChart(players, remainingCap) {
  const slices = players
    .slice()
    .sort((a, b) => b.capHit - a.capHit)
    .map((player, index) => ({
      label: player.player,
      value: player.capHit,
      color: CAP_CHART_COLORS[index % CAP_CHART_COLORS.length],
    }))
    .filter((slice) => slice.value > 0);

  if (remainingCap > 0) {
    slices.push({
      label: "Cap Left",
      value: remainingCap,
      color: "rgba(255, 255, 255, 0.16)",
    });
  }

  const total = TEAM_CAP_LIMIT || slices.reduce((sum, slice) => sum + slice.value, 0);
  if (!total) {
    return `
      <div class="cap-pie-empty">No cap usage to chart.</div>
    `;
  }

  let cursor = 0;
  const stops = slices
    .map((slice) => {
      const start = cursor;
      const pct = (slice.value / total) * 100;
      cursor += pct;
      return `${slice.color} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
    })
    .join(", ");

  return `
    <div class="cap-pie-layout solo">
      <div class="cap-pie-chart" style="background: conic-gradient(${stops})">
        <div class="cap-pie-hole">
          <span>Usage</span>
          <strong>${formatNumber(total - remainingCap)}</strong>
          <small>of ${formatNumber(TEAM_CAP_LIMIT)}</small>
        </div>
      </div>
    </div>
  `;
}

function getTeamLogo(team) {
  const clean = displayTeamName(team);
  const raw = String(team || "").trim();
  if (clean === "Dream Team") {
    return "/assets/dream-team.jpg";
  }
  if (clean === "The Future") {
    return "/assets/the-future.png";
  }
  if (clean === "The Lions" || raw === "Lions") return "/assets/the-lions.png";
  if (clean === "The Snipers" || raw === "Snipers" || raw === "Sniper") return "/assets/the-snipers.png";
  if (clean === "The Phantoms" || raw === "Phantoms" || raw === "Phantons") return "/assets/the-phantoms.png";
  if (clean === "The Lions") return "/assets/the-lions.png";
  if (clean === "The Snipers") return "/assets/the-snipers.png";
  if (clean === "The Phantoms") return "/assets/the-phantoms.png";
  if (clean === "MayeDay") return "/assets/mayeday.jpg";
  if (clean === "Cobras") return "/assets/cobras.png";
  if (clean === "Karma Avengers") return "/assets/karma-avengers.png";
  if (clean === "ALEK Manoahs") return "/assets/alek-manoahs.jpg";
  if (clean === "Bees") return "/assets/bees.jpg";
  if (clean === "Broncos") return "/assets/broncos.jpg";
  if (clean === "Burritos") return "/assets/burritos.jpg";
  if (clean === "Mafia") return "/assets/mafia.png";
  if (clean === "Thunderhawks") return "/assets/thunderhawks.png";
  if (clean === "Whatsgrass") return "/assets/whatsgrass.png";
  if (clean === "Wolves") return "/assets/wolves.png";
  if (clean === "Chicken Nuggets") return "/assets/chicken-nuggets.jpg";
  if (clean === "Yetis") return "/assets/yetis.png";
  if (clean === "Gus N Em") return "/assets/gus-n-em.png";
  if (clean === "Cheerios") return "/assets/cheerios.png";
  if (clean === "Illegals") return "/assets/illegals.png";
  if (clean === "Storm") return "/assets/storm.png";
  if (clean === "Bullets") return "/assets/bullets.png";
  if (clean === "Turkeys") return "/assets/turkeys.png";
  return "/assets/rskl-logo.png?v=4";
}

function normalizeContracts(rows) {
  return rows
    .slice(1)
    .map((row) => ({
      team: displayTeamName(row[0] || ""),
      player: String(row[1] || "").trim(),
      years: String(row[2] || "").trim(),
      totalRax: parseMoney(row[3]),
      totalRaxRaw: String(row[3] || "").trim(),
      capHit: parseMoney(row[4]),
      capHitRaw: String(row[4] || "").trim(),
    }))
    .filter(
      (row) =>
        row.team &&
        row.player &&
        row.team.toLowerCase() !== "team" &&
        row.player.toLowerCase() !== "player"
    );
}

function buildTeamMap(rows) {
  const byTeam = new Map();
  rows.forEach((row) => {
    const list = byTeam.get(row.team) || [];
    list.push(row);
    byTeam.set(row.team, list);
  });
  return byTeam;
}

function updateLastUpdated() {
  if (!els.lastUpdated) return;
  const now = new Date();
  els.lastUpdated.textContent = `Last updated: ${now.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function getCapView() {
  const saved = String(localStorage.getItem(CAP_VIEW_KEY) || "team").toLowerCase();
  return saved === "player" ? "player" : "team";
}

function renderCapView() {
  const showTeam = getCapView() === "team";
  if (els.teamInfoSection) els.teamInfoSection.hidden = !showTeam;
  if (els.teamCardsSection) els.teamCardsSection.hidden = !showTeam;
  if (els.teamBreakdownSection) els.teamBreakdownSection.hidden = !showTeam;
  if (els.playerInfoSection) els.playerInfoSection.hidden = showTeam;
}

function initCapViewTabs() {
  if (!els.viewTabs) return;
  const activeView = getCapView();
  Array.from(els.viewTabs.querySelectorAll("[data-cap-view]")).forEach((button) => {
    const view = String(button.dataset.capView || "team").toLowerCase();
    const isActive = view === activeView;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
    button.addEventListener("click", () => {
      localStorage.setItem(CAP_VIEW_KEY, view);
      Array.from(els.viewTabs.querySelectorAll("[data-cap-view]")).forEach((tab) => {
        const tabActive = tab === button;
        tab.classList.toggle("active", tabActive);
        tab.setAttribute("aria-pressed", tabActive ? "true" : "false");
      });
      renderCapView();
    });
  });
  renderCapView();
}

function renderTeamSummary(rows) {
  const teamMap = buildTeamMap(rows);
  const teamEntries = Array.from(teamMap.entries()).map(([team, players]) => {
    const used = players.reduce((sum, row) => sum + row.capHit, 0);
    return { team, used, left: Math.max(TEAM_CAP_LIMIT - used, 0), players: players.length };
  });
  const totalCap = teamEntries.reduce((sum, row) => sum + row.used, 0);
  const totalLeagueCap = TEAM_CAP_LIMIT * teamEntries.length;
  const totalCapLeft = Math.max(totalLeagueCap - totalCap, 0);
  const highestUsage = teamEntries.reduce(
    (best, row) => (row.used > best.used ? row : best),
    { team: "—", used: 0 }
  );
  const mostSpace = teamEntries.reduce(
    (best, row) => (row.left > best.left ? row : best),
    { team: "—", left: 0 }
  );
  const averageUsage = teamEntries.length ? totalCap / teamEntries.length : 0;

  if (!els.teamSummary) return;
  els.teamSummary.innerHTML = `
    <article class="cap-summary-card">
      <span class="dashboard-kicker">Team Cap</span>
      <strong>${formatNumber(TEAM_CAP_LIMIT)}</strong>
      <span>Cap per franchise</span>
    </article>
    <article class="cap-summary-card">
      <span class="dashboard-kicker">Usage</span>
      <strong>${formatNumber(totalCap)}</strong>
      <span>League team usage</span>
    </article>
    <article class="cap-summary-card">
      <span class="dashboard-kicker">Cap Left</span>
      <strong>${formatNumber(totalCapLeft)}</strong>
      <span>${formatNumber(totalLeagueCap)} total league cap</span>
    </article>
    <article class="cap-summary-card">
      <span class="dashboard-kicker">Top Usage</span>
      <strong>${formatNumber(highestUsage.used)}</strong>
      <span>${escapeHtml(highestUsage.team)}</span>
    </article>
    <article class="cap-summary-card">
      <span class="dashboard-kicker">Most Space</span>
      <strong>${formatNumber(mostSpace.left)}</strong>
      <span>${escapeHtml(mostSpace.team)}</span>
    </article>
    <article class="cap-summary-card">
      <span class="dashboard-kicker">Average Team</span>
      <strong>${formatNumber(averageUsage)}</strong>
      <span>Average usage per team</span>
    </article>
  `;
}

function renderPlayerSummary(rows) {
  const totalCap = rows.reduce((sum, row) => sum + row.capHit, 0);
  const teamCount = new Set(rows.map((row) => row.team)).size;
  const highestCap = rows.reduce(
    (best, row) => (row.capHit > best.capHit ? row : best),
    { player: "—", team: "—", capHit: 0 }
  );
  const sortedByCap = rows
    .map((row) => row.capHit)
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
  const lowestCap = sortedByCap.length ? sortedByCap[0] : 0;
  const medianCap = sortedByCap.length
    ? sortedByCap[Math.floor((sortedByCap.length - 1) / 2)]
    : 0;
  const averageCap = rows.length ? totalCap / rows.length : 0;

  if (!els.playerSummary) return;
  els.playerSummary.innerHTML = `
    <article class="cap-summary-card">
      <span class="dashboard-kicker">Contracts</span>
      <strong>${formatNumber(rows.length)}</strong>
      <span>Active player deals</span>
    </article>
    <article class="cap-summary-card">
      <span class="dashboard-kicker">Top Cap</span>
      <strong>${formatNumber(highestCap.capHit)}</strong>
      <span>${escapeHtml(highestCap.player)} • ${escapeHtml(highestCap.team)}</span>
    </article>
    <article class="cap-summary-card">
      <span class="dashboard-kicker">Cap Floor</span>
      <strong>${formatNumber(lowestCap)}</strong>
      <span>Lowest player cap hit</span>
    </article>
    <article class="cap-summary-card">
      <span class="dashboard-kicker">Average Cap</span>
      <strong>${formatNumber(averageCap)}</strong>
      <span>Across ${formatNumber(teamCount)} teams</span>
    </article>
    <article class="cap-summary-card">
      <span class="dashboard-kicker">Median Cap</span>
      <strong>${formatNumber(medianCap)}</strong>
      <span>Middle contract cap hit</span>
    </article>
  `;
}

function renderTeamCards(teamMap) {
  const cards = Array.from(teamMap.entries())
    .map(([team, players]) => {
      const totalCap = players.reduce((sum, row) => sum + row.capHit, 0);
      const totalRax = players.reduce((sum, row) => sum + row.totalRax, 0);
      const topCap = players.reduce((best, row) => (row.capHit > best.capHit ? row : best), players[0]);
      return {
        team,
        players,
        totalCap,
        totalRax,
        topCap,
        remainingCap: Math.max(TEAM_CAP_LIMIT - totalCap, 0),
      };
    })
    .sort((a, b) => b.totalCap - a.totalCap);

  els.teamCards.innerHTML = cards
    .map(
      (entry) => `
        <button class="cap-team-card${entry.team === selectedTeam ? " active" : ""}" type="button" data-team-card="${escapeHtml(entry.team)}">
          <span class="cap-team-head">
            <img class="cap-team-logo" src="${escapeHtml(getTeamLogo(entry.team))}" alt="${escapeHtml(entry.team)} logo" />
            <span>
              <strong>${escapeHtml(entry.team)}</strong>
              <small>${formatNumber(entry.players.length)} players</small>
            </span>
          </span>
          <span class="cap-team-metrics">
            <span><label>Team Usage</label><strong>${formatNumber(entry.totalCap)}</strong></span>
            <span><label>Cap Left</label><strong>${formatNumber(entry.remainingCap)}</strong></span>
          </span>
          <span class="cap-team-top">${formatNumber(entry.totalCap)} of ${formatNumber(TEAM_CAP_LIMIT)} used</span>
        </button>
      `
    )
    .join("");

  els.teamCards.querySelectorAll("[data-team-card]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedTeam = button.dataset.teamCard || "All Teams";
      els.teamSelect.value = selectedTeam;
      renderTeamCards(teamMap);
      renderTeamBreakdown(teamMap);
      if (els.teamBreakdownSection) {
        els.teamBreakdownSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });
}

function renderTeamBreakdown(teamMap) {
  const team = selectedTeam === "All Teams"
    ? Array.from(teamMap.keys()).sort((a, b) => a.localeCompare(b))[0] || "All Teams"
    : selectedTeam;
  selectedTeam = team;
  els.teamTitle.textContent = `${team} Cap Sheet`;
  const players = teamMap.get(team) || [];

  if (!players.length) {
    els.teamBreakdown.innerHTML = `<div class="dashboard-state-card">No cap data found for this team.</div>`;
    return;
  }

  const totalCap = players.reduce((sum, row) => sum + row.capHit, 0);
  const averageCap = players.length ? totalCap / players.length : 0;
  const highestCap = players.reduce((best, row) => Math.max(best, row.capHit), 0);
  const remainingCap = Math.max(TEAM_CAP_LIMIT - totalCap, 0);
  const pieChart = buildCapPieChart(players, remainingCap);

  els.teamBreakdown.innerHTML = `
    <div class="cap-breakdown-top">
      <div class="cap-breakdown-brand">
        <img class="cap-breakdown-logo" src="${escapeHtml(getTeamLogo(team))}" alt="${escapeHtml(team)} logo" />
        <div>
          <span class="dashboard-kicker">Team Totals</span>
          <h3>${escapeHtml(team)}</h3>
        </div>
      </div>
      <div class="cap-breakdown-totals">
        <span><label>Team Usage</label><strong>${formatNumber(totalCap)}</strong></span>
        <span><label>Cap Left</label><strong>${formatNumber(remainingCap)}</strong></span>
        <span><label>Average Cap</label><strong>${formatNumber(averageCap)}</strong></span>
        <span><label>Highest Cap</label><strong>${formatNumber(highestCap)}</strong></span>
      </div>
    </div>
    <div class="cap-pie-panel">
      <div class="panel-head">
        <h3>Cap Allocation</h3>
      </div>
      ${pieChart}
    </div>
    <div class="table-wrap cap-table-wrap">
      <table class="cap-team-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Years</th>
            <th>Total Rax</th>
            <th>Cap Hit</th>
          </tr>
        </thead>
        <tbody>
          ${players
            .sort((a, b) => b.capHit - a.capHit || a.player.localeCompare(b.player))
            .map(
              (row) => `
                <tr>
                  <td><a class="draft-link" href="/player-detail.html?player=${encodeURIComponent(row.player)}">${escapeHtml(row.player)}</a></td>
                  <td>${escapeHtml(row.years || "—")}</td>
                  <td>${formatNumber(row.totalRax)}</td>
                  <td>${formatNumber(row.capHit)}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderLeagueTable() {
  const filterTeam = els.teamFilter.value || "all";
  const query = String(els.search.value || "").trim().toLowerCase();
  const rows = contractRows
    .filter((row) => filterTeam === "all" || row.team === filterTeam)
    .filter((row) => {
      if (!query) return true;
      return `${row.player} ${row.team}`.toLowerCase().includes(query);
    })
    .sort((a, b) => b.capHit - a.capHit || b.totalRax - a.totalRax || a.player.localeCompare(b.player));

  els.tableHead.innerHTML = `
    <tr>
      <th>Player</th>
      <th>Team</th>
      <th>Years</th>
      <th>Total Rax</th>
      <th>Cap Hit</th>
    </tr>
  `;

  els.tableBody.innerHTML = rows.length
    ? rows
        .map(
          (row) => `
            <tr>
              <td><a class="draft-link" href="/player-detail.html?player=${encodeURIComponent(row.player)}">${escapeHtml(row.player)}</a></td>
              <td>
                <a class="leader-team-link cap-team-link" href="/team.html?team=${encodeURIComponent(row.team)}">
                  <img class="cap-inline-logo" src="${escapeHtml(getTeamLogo(row.team))}" alt="${escapeHtml(row.team)} logo" />
                  <span>${escapeHtml(row.team)}</span>
                </a>
              </td>
              <td>${escapeHtml(row.years || "—")}</td>
              <td>${formatNumber(row.totalRax)}</td>
              <td>${formatNumber(row.capHit)}</td>
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="5">No cap matches found.</td></tr>`;
}

function hydrateTeamControls(teamMap) {
  const teams = Array.from(teamMap.keys()).sort((a, b) => a.localeCompare(b));
  const options = teams
    .map((team) => `<option value="${escapeHtml(team)}">${escapeHtml(team)}</option>`)
    .join("");
  els.teamSelect.innerHTML = options;
  els.teamFilter.innerHTML = `<option value="all">All Teams</option>${options}`;
  if (!teams.includes(selectedTeam)) {
    selectedTeam = teams[0] || "All Teams";
  }
  if (selectedTeam && selectedTeam !== "All Teams") {
    els.teamSelect.value = selectedTeam;
  }
}

async function loadCapPage() {
  try {
    const response = await fetch(CONTRACTS_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    contractRows = normalizeContracts(parseCSV(await response.text()));
    const teamMap = buildTeamMap(contractRows);
    hydrateTeamControls(teamMap);
    renderTeamSummary(contractRows);
    renderPlayerSummary(contractRows);
    renderTeamCards(teamMap);
    renderTeamBreakdown(teamMap);
    renderLeagueTable();
    updateLastUpdated();

    els.teamSelect.addEventListener("change", () => {
      selectedTeam = els.teamSelect.value || selectedTeam;
      renderTeamCards(teamMap);
      renderTeamBreakdown(teamMap);
      if (els.teamBreakdownSection) {
        els.teamBreakdownSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
    els.teamFilter.addEventListener("change", renderLeagueTable);
    els.search.addEventListener("input", renderLeagueTable);
  } catch (error) {
    const message = escapeHtml(error.message || "Unable to load cap sheet.");
    if (els.teamSummary) {
      els.teamSummary.innerHTML = `<div class="dashboard-state-card">${message}</div>`;
    }
    if (els.playerSummary) {
      els.playerSummary.innerHTML = `<div class="dashboard-state-card">${message}</div>`;
    }
    els.teamCards.innerHTML = `<div class="dashboard-state-card">${message}</div>`;
    els.teamBreakdown.innerHTML = `<div class="dashboard-state-card">${message}</div>`;
    els.tableBody.innerHTML = `<tr><td colspan="5">${message}</td></tr>`;
  }
}

initCapViewTabs();
loadCapPage();
