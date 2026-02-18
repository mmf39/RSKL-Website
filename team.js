const ROSTER_CSV_URL = "/api/sheet?name=roster";
const STANDINGS_CSV_URL = "/api/sheet?name=standings";
const SCHEDULE_CSV_URL = "/api/sheet?name=schedule";
const BOXSCORE_CSV_URL = "/api/sheet?name=boxscore";
const ARCHIVE_URL = "/api/sheet?name=archive";
const DRAFT_CAPITAL_URL = "/api/sheet?name=draft-capital";
const SEASON_KEY = "season";
const TRANSACTIONS_URL = "/api/sheet?name=transactions";
const TRANSACTIONS_RANGE = "A3:E81";
const TEAM_RANGES = {
  "Gus N Em": "B2:C13",
  Bullets: "E2:F13",
  Storm: "E2:F13",
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
const C2S2_SCHEDULE_RANGE = "A2:C77";

const ARCHIVE_TEAM_ROSTERS = {
  "Gus N Em": "H1:I12",
  Cheerios: "H16:I27",
  Bullets: "K1:L12",
  Storm: "K1:L12",
  Yetis: "K16:L27",
  Turkeys: "N1:O12",
  Illegals: "N16:O27",
};

const ARCHIVE_TEAM_STANDINGS = {
  Turkeys: "A2:F2",
  "Gus N Em": "A3:F3",
  Bullets: "A4:F4",
  Storm: "A4:F4",
  Cheerios: "A5:F5",
  Yetis: "A6:F6",
  Illegals: "A7:F7",
};

const DRAFT_CAPITAL_COLUMNS = {
  Turkeys: "A",
  "Gus N Em": "B",
  Bullets: "C",
  Storm: "C",
  Cheerios: "D",
  Yetis: "E",
  "The Lions": "F",
  "The Phantoms": "G",
  "The Future": "H",
  "The Snipers": "I",
  Illegals: "J",
};

function getSeason() {
  return localStorage.getItem(SEASON_KEY) || "c2s2";
}

function displayTeamName(value) {
  const name = String(value || "").trim();
  return name === "Bullets" ? "Storm" : name;
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
  Storm: "H5:M5",
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
  draftCapital: document.getElementById("team-draft-capital"),
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
  const headers = scheduleRows[0] || [];
  const idx = getScheduleIndexes(headers, season);
  const winPctByNormalizedTeam = new Map();
  winPctMap.forEach((pct, team) => {
    winPctByNormalizedTeam.set(normalizeTeamLabel(team), pct);
  });
  const dataRows = scheduleRows.slice(1);
  let sum = 0;
  let games = 0;
  dataRows.forEach((row) => {
    const team1 = String(row[idx.team1] || "").trim();
    const team2 = String(row[idx.team2] || "").trim();
    if (!team1 || !team2) {
      return;
    }
    const opponent =
      teamMatches(team1, teamName)
        ? team2
        : teamMatches(team2, teamName)
        ? team1
        : "";
    if (!opponent) {
      return;
    }
    const oppPct = winPctByNormalizedTeam.get(normalizeTeamLabel(opponent));
    if (oppPct === null || oppPct === undefined) {
      return;
    }
    sum += oppPct;
    games += 1;
  });
  return games ? sum / games : null;
}

function hasText(row) {
  return row.some((cell) => String(cell || "").trim() !== "");
}

function normalizePickLabel(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/\bfirst\b/g, "1st")
    .replace(/\bsecond\b/g, "2nd")
    .replace(/\bthird\b/g, "3rd")
    .replace(/\bfourth\b/g, "4th")
    .replace(/\bfifth\b/g, "5th")
    .replace(/\bsixth\b/g, "6th")
    .replace(/\bseventh\b/g, "7th")
    .replace(/\beighth\b/g, "8th")
    .replace(/[|,;:/\\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getPickMatchTargets(pickLabel) {
  const base = normalizePickLabel(pickLabel);
  if (!base) {
    return [];
  }
  const targets = new Set([base]);

  // Match rows that only show the base pick (without origin text).
  targets.add(base.replace(/\s+via\s+.+$/i, "").trim());
  targets.add(base.replace(/\s+from\s+.+$/i, "").trim());

  // Match rows where the origin is wrapped in extra descriptors.
  targets.add(base.replace(/\s+\b(via|from)\b\s+.+$/i, "").trim());

  return Array.from(targets).filter(Boolean);
}

function pickRoundToNumber(roundText) {
  const text = String(roundText || "").toLowerCase();
  if (text.includes("1st")) return 1;
  if (text.includes("2nd")) return 2;
  if (text.includes("3rd")) return 3;
  if (text.includes("4th")) return 4;
  if (text.includes("5th")) return 5;
  if (text.includes("6th")) return 6;
  if (text.includes("7th")) return 7;
  if (text.includes("8th")) return 8;
  return null;
}

function parsePickMeta(pickLabel) {
  const label = String(pickLabel || "").trim();
  const roundMatch = label.match(/\b([1-8](?:st|nd|rd|th))\b/i);
  const viaMatch = label.match(/\b(?:via|from)\s+(.+)$/i);
  return {
    round: roundMatch ? pickRoundToNumber(roundMatch[1]) : null,
    viaTeam: viaMatch ? normalizeTeamLabel(viaMatch[1]) : "",
  };
}

function transactionIncludesTeamContext(row, teamCandidates) {
  if (!teamCandidates || !teamCandidates.length) {
    return false;
  }
  const rowTeam1 = normalizeTeamLabel(row[1] || "");
  const rowTeam2 = normalizeTeamLabel(row[3] || "");
  const rowText = normalizePickLabel(
    row
      .map((cell) => String(cell || "").trim())
      .filter(Boolean)
      .join(" ")
  );
  return teamCandidates.some((team) => {
    const normalized = normalizeTeamLabel(team);
    if (!normalized) {
      return false;
    }
    return (
      rowTeam1 === normalized ||
      rowTeam2 === normalized ||
      rowText.includes(normalized)
    );
  });
}

function extractOverallNumbers(text) {
  const source = String(text || "");
  const matches = [...source.matchAll(/#\s*(\d+)\s*overall/gi)];
  return matches.map((m) => Number(m[1])).filter((n) => Number.isFinite(n));
}

function formatTradeSummaryForPick(row, pick) {
  const date = String(row[0] || "").trim() || "Date —";
  const team1 = displayTeamName(String(row[1] || "").trim() || "Team 1");
  const team2 = displayTeamName(String(row[3] || "").trim() || "Team 2");
  return `${date}: ${team1} ↔ ${team2}`;
}

function findTradeEntriesForPick(pick, transactionRows) {
  const label = String(pick && pick.label ? pick.label : "").trim();
  const targets = getPickMatchTargets(label);
  if (!targets.length) {
    return [];
  }
  const found = new Map();
  const meta = parsePickMeta(label);
  const originalTeam = normalizeTeamLabel(pick && pick.original_team);
  const currentTeam = normalizeTeamLabel(pick && pick.current_team);
  const teamCandidates = Array.from(
    new Set(
      [currentTeam, originalTeam, meta.viaTeam]
        .map((v) => normalizeTeamLabel(v))
        .filter(Boolean)
    )
  );
  const teamsPerRound = 10;
  const roundMin = meta.round ? (meta.round - 1) * teamsPerRound + 1 : null;
  const roundMax = meta.round ? meta.round * teamsPerRound : null;

  for (const row of transactionRows) {
    const joined = row
      .map((cell) => String(cell || "").trim())
      .filter(Boolean)
      .join(" | ");
    if (!joined) {
      continue;
    }
    const teamContextMatch = transactionIncludesTeamContext(row, teamCandidates);
    if (!teamContextMatch) {
      continue;
    }
    const normalizedRow = normalizePickLabel(joined);
    const directMatch = targets.some((target) => normalizedRow.includes(target));
    let fallbackMatch = false;

    if (!directMatch && meta.round) {
      const nums = extractOverallNumbers(joined);
      const hasRoundNumber =
        nums.length > 0 &&
        nums.some((n) => roundMin !== null && roundMax !== null && n >= roundMin && n <= roundMax);
      const hasTeamContext =
        (meta.viaTeam && normalizedRow.includes(meta.viaTeam)) ||
        (originalTeam && normalizedRow.includes(originalTeam)) ||
        (currentTeam && normalizedRow.includes(currentTeam));
      fallbackMatch = hasRoundNumber && hasTeamContext;
    }

    if (directMatch || fallbackMatch) {
      if (!found.has(joined)) {
        found.set(joined, {
          query: joined,
          summary: formatTradeSummaryForPick(row, pick),
        });
      }
    }
  }
  return Array.from(found.values());
}

async function loadDraftCapital(teamName) {
  if (!els.draftCapital) {
    return;
  }
  if (!teamName) {
    els.draftCapital.innerHTML = "<div class=\"gm-empty\">No picks found.</div>";
    return;
  }
  try {
    const [capitalRes, txRes] = await Promise.all([
      fetch(DRAFT_CAPITAL_URL, { cache: "no-store" }),
      fetch(TRANSACTIONS_URL, { cache: "no-store" }),
    ]);
    if (!capitalRes.ok) {
      throw new Error(`Fetch failed: ${capitalRes.status}`);
    }
    const capitalRows = parseCSV(await capitalRes.text());
    const txRows = txRes.ok
      ? sliceRange(parseCSV(await txRes.text()), TRANSACTIONS_RANGE).filter(hasText)
      : [];

    const column = DRAFT_CAPITAL_COLUMNS[teamName];
    if (!column) {
      els.draftCapital.innerHTML = "<div class=\"gm-empty\">No picks found.</div>";
      return;
    }
    const colIndex = colToIndex(column);
    const picks = capitalRows
      .map((row) => String((row && row[colIndex]) || "").trim())
      .filter((value) => value && value !== displayTeamName(teamName));

    if (!picks.length) {
      els.draftCapital.innerHTML = "<div class=\"gm-empty\">No picks found.</div>";
      return;
    }
    els.draftCapital.innerHTML = picks
      .map((label) => {
        const pickMeta = {
          label,
          current_team: teamName,
          original_team: teamName,
        };
        const tradeEntries = findTradeEntriesForPick(pickMeta, txRows);
        const tradeLine = tradeEntries.length
          ? `<div class="draft-pick-trade">Trade: ${tradeEntries
              .map(
                (entry) =>
                  `<a class="draft-pick-trade-link" href="/transactions.html?q=${encodeURIComponent(
                    entry.query
                  )}" target="_self">${escapeHtml(entry.summary)}</a>`
              )
              .join(", ")}</div>`
          : `<div class="draft-pick-trade">No trades involving this pick.</div>`;
        return `<div class="draft-pick-row">${escapeHtml(label)}${tradeLine}</div>`;
      })
      .join("");
  } catch (error) {
    els.draftCapital.innerHTML =
      "<div class=\"gm-empty\">Unable to load picks.</div>";
  }
}

async function loadRoster() {
  const teamName = getTeamName();
  await loadDraftCapital(teamName);
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
    } else if (teamName === "Bullets" || teamName === "Storm") {
      els.logo.src = "/assets/storm.png";
      els.logo.alt = "Storm logo";
      els.logo.style.display = "block";
    } else if (teamName === "Turkeys") {
      els.logo.src = "/assets/turkeys.png";
      els.logo.alt = "Turkeys logo";
      els.logo.style.display = "block";
    } else {
      els.logo.style.display = "none";
    }
  }
  els.title.textContent = teamName
    ? `${displayTeamName(teamName)} Roster`
    : "Team Roster";
  if (els.sub) {
    els.sub.textContent = teamName
      ? `Roster for ${displayTeamName(teamName)}`
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
      const scheduleRows = getC2S2ScheduleRows(
        parseCSV(await scheduleRes.text())
      );
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

  els.statTeam.textContent = displayTeamName(team || teamName || "—");
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
  els.statTeam.textContent = displayTeamName(team || "—");
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
let scheduleIndexes = { date: 1, team1: 2, team2: 3 };

function normalizeTeamLabel(value) {
  const normalized = String(value || "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\*/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  return normalized === "bullets" ? "storm" : normalized;
}

function teamMatches(value, teamName) {
  const a = normalizeTeamLabel(value);
  const b = normalizeTeamLabel(teamName);
  if (!a || !b) {
    return false;
  }
  return a === b || a.includes(b) || b.includes(a);
}

function getScheduleIndexes(headers, season) {
  if (headers.length <= 3) {
    return { date: 0, team1: 1, team2: 2 };
  }
  return { date: 1, team1: 2, team2: 3 };
}

function getC2S2ScheduleRows(rows) {
  const sliced = sliceRange(rows, C2S2_SCHEDULE_RANGE);
  return [["Date", "Team 1", "Team 2"], ...sliced];
}

function updateTeamSchedule(teamName, scheduleRows, boxScoreData, season) {
  if (!scheduleRows.length) {
    return;
  }
  const headers = scheduleRows[0];
  scheduleIndexes = getScheduleIndexes(headers, season);
  const dataRows = scheduleRows.slice(1);
  const filtered = dataRows.filter((row) => {
    const team1 = String(row[scheduleIndexes.team1] || "").trim();
    const team2 = String(row[scheduleIndexes.team2] || "").trim();
    return teamMatches(team1, teamName) || teamMatches(team2, teamName);
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
  const dateToken = String(scheduleRow[scheduleIndexes.date] || "").trim();
  const team1Name = scheduleRow[scheduleIndexes.team1] || "";
  const team2Name = scheduleRow[scheduleIndexes.team2] || "";

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
