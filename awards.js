const AWARDS_URL = "/api/sheet?name=awards";

const els = {
  lastUpdated: document.getElementById("last-updated"),
  season: document.getElementById("awards-season"),
  table: document.getElementById("awards-table"),
  champions: document.getElementById("champions-table"),
};

const SEASON_KEY = "awardsSeason";
const AWARDS_CACHE_KEY = "awardsCsvCache";
const AWARDS_CACHE_TIME_KEY = "awardsCsvCacheTime";
const AWARDS_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

const AWARD_RANGES = {
  c2s2: "O4:P15",
  c1s1: "B3:B15",
  c1s2: "C3:D24",
  c1s3: "E3:F28",
  c1s4: "G3:H27",
  c1s5: "I3:J28",
  c1s6: "K3:L27",
  c2s1: "M3:N29",
};

const CHAMPION_RANGES = {
  c1s2: "C15:D24",
  c1s3: "E15:F28",
  c1s4: "G16:H27",
  c1s5: "I16:J28",
  c1s6: "K16:L27",
  c2s1: "M16:N29",
};

const TEAM_NAMES = [
  "Gus N Em",
  "Storm",
  "Bullets",
  "Turkeys",
  "Cheerios",
  "Yetis",
  "Illegals",
  "The Lions",
  "The Future",
  "The Snipers",
  "The Phantoms",
];

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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function linkifyWinner(text) {
  const value = String(text || "").trim();
  if (!value) {
    return "";
  }
  const teamMatch = TEAM_NAMES.find(
    (team) => team.toLowerCase() === value.toLowerCase()
  );
  if (teamMatch) {
    return `<a class="awards-link" href="team.html?team=${encodeURIComponent(
      teamMatch
    )}">${escapeHtml(value)}</a>`;
  }
  return `<a class="awards-link" href="player-detail.html?player=${encodeURIComponent(
    value
  )}">${escapeHtml(value)}</a>`;
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

function getSeason() {
  return localStorage.getItem(SEASON_KEY) || "c2s1";
}

function renderAwards(rows) {
  if (!rows.length) {
    els.table.innerHTML = "<p>No awards data available.</p>";
    return;
  }

  const hasSecondColumn = rows.some((row) => String(row[1] || "").trim());

  const cleaned = rows.filter((row) => String(row[0] || "").trim());

  if (cleaned.length) {
    cleaned.forEach((row) => {
      if (row.length >= 5) {
        const merged = [row[3], row[4]].filter(Boolean).join(" / ");
        row.splice(3, 2, merged);
      }
    });
  }

  const cardMarkup = cleaned
    .map((row) => {
      const winner = String(row[1] || row[0] || "").trim();
      const hasWinner = Boolean(row[1] && String(row[1]).trim());
      const isTeam = TEAM_NAMES.some(
        (team) => team.toLowerCase() === winner.toLowerCase()
      );
      const link = isTeam
        ? `team.html?team=${encodeURIComponent(winner)}`
        : `player-detail.html?player=${encodeURIComponent(winner)}`;
      if (!hasSecondColumn || !hasWinner) {
        return `
          <a class="awards-card awards-card-link" href="${link}">
            <div class="awards-title">${escapeHtml(row[0])}</div>
          </a>
        `;
      }
      return `
        <a class="awards-card awards-card-link" href="${link}">
          <div class="awards-title">${escapeHtml(row[0] || "")}</div>
          <div class="awards-winner">${escapeHtml(row[1] || "")}</div>
        </a>
      `;
    })
    .join("");

  els.table.innerHTML = `<div class="awards-grid">${cardMarkup}</div>`;
}

function renderChampions(rows, seasonKey) {
  if (!els.champions) {
    return;
  }
  if (!rows.length) {
    els.champions.innerHTML = "<p>No champions data available.</p>";
    return;
  }
  const body = rows
    .filter((row) => String(row[0] || "").trim())
    .map((row) => {
      const label = String(row[0] || "").trim();
      const winner = String(row[1] || "").trim();
      if (!winner) {
        return `
          <a class="champion-row single" href="player-detail.html?player=${encodeURIComponent(
            label
          )}">
            <div class="champion-single">${escapeHtml(label)}</div>
          </a>
        `;
      }
      const winnerLink = `<a class="champion-link" href="team.html?team=${encodeURIComponent(
        winner
      )}">${escapeHtml(winner)}</a>`;
      return `
        <div class="champion-row">
          <div class="champion-award">${escapeHtml(label)}</div>
          <div class="champion-winner">${winnerLink}</div>
        </div>
      `;
    })
    .join("");

  const title = seasonKey ? seasonKey.toUpperCase() : "Season";

  els.champions.innerHTML = `
    <div class="champion-box">
      <div class="champion-title">${escapeHtml(title)} Champions</div>
      <div class="champion-list">${body}</div>
    </div>
  `;
}

async function loadAwards() {
  try {
    const cachedTime = Number(localStorage.getItem(AWARDS_CACHE_TIME_KEY) || 0);
    const cachedCsv = localStorage.getItem(AWARDS_CACHE_KEY);
    let rows = [];
    const hasFreshCache =
      cachedCsv &&
      cachedTime &&
      Date.now() - cachedTime < AWARDS_CACHE_TTL;

    if (hasFreshCache) {
      rows = parseCSV(cachedCsv);
    } else {
      const response = await fetch(AWARDS_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      const csvText = await response.text();
      localStorage.setItem(AWARDS_CACHE_KEY, csvText);
      localStorage.setItem(AWARDS_CACHE_TIME_KEY, String(Date.now()));
      rows = parseCSV(csvText);
    }
    if (!rows.length) {
      throw new Error("No data found.");
    }
    const season = getSeason();
    if (els.season) {
      els.season.value = season;
    }
    const range = AWARD_RANGES[season];
    const sliced = range ? sliceRange(rows, range) : [];
    let awardsRows = sliced;
    const champRange = CHAMPION_RANGES[season];
    if (champRange) {
      const awardParsed = parseRange(range || "");
      const champParsed = parseRange(champRange);
      if (awardParsed && champParsed) {
        const relStart = champParsed.startRow - awardParsed.startRow;
        const relEnd = champParsed.endRow - awardParsed.startRow;
        awardsRows = sliced.filter((_, idx) => idx < relStart || idx > relEnd);
      }
    }
    renderAwards(awardsRows);
    const championRange = CHAMPION_RANGES[season];
    const championSlice = championRange ? sliceRange(rows, championRange) : [];
    renderChampions(championSlice, season);
    if (cachedCsv && cachedTime) {
      const cachedDate = new Date(cachedTime);
      const formatted = cachedDate.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      els.lastUpdated.textContent = `Last updated: ${formatted}`;
    } else {
      updateLastUpdated();
    }
  } catch (error) {
    els.table.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
    if (els.champions) {
      els.champions.innerHTML = "";
    }
  }
}

els.season.addEventListener("change", () => {
  localStorage.setItem(SEASON_KEY, els.season.value);
  loadAwards();
});

loadAwards();
