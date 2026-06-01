const TRANSACTIONS_CSV_URL = "/api/sheet?name=transactions";

const TEAM_NAMES = [
  "Gus N Em",
  "Storm",
  "Bullets",
  "Turkeys",
  "Bad Bois",
  "Yetis",
  "Illegals",
  "The Lions",
  "The Future",
  "The Snipers",
  "The Phantoms",
];

const els = {
  lastUpdated: document.getElementById("last-updated"),
  list: document.getElementById("transactions-list"),
  search: document.getElementById("transactions-search"),
};

let transactionRows = [];
let transactionHeaders = [];
const TRADE_RANGE = "A3:E81";
const RETIREMENT_RANGE = "G3:J70";
const CUT_RANGE = "L3:O81";
const SIGNING_RANGE = "Q3:T81";

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

function normalizeTeamName(name) {
  const clean = String(name || "")
    .replace(/\([^)]*\)/g, "")
    .trim();
  if (clean === "Bullets") return "Storm";
  if (clean === "Yetis") return "Scorpions";
  if (clean === "The Future") return "Dream Team";
  return clean;
}

function canonicalTeamName(name) {
  const clean = normalizeTeamName(name);
  const lower = clean.toLowerCase();
  if (lower === "lions" || lower === "the lions") return "The Lions";
  if (lower === "future" || lower === "the future") return "The Future";
  if (lower === "snipers" || lower === "the snipers") return "The Snipers";
  if (lower === "phantoms" || lower === "the phantoms") return "The Phantoms";
  if (lower === "bullets" || lower === "storm") return "Storm";
  return clean;
}

function extractPlayers(text) {
  const matches = String(text || "").match(/@[A-Za-z0-9_.]+/g) || [];
  return Array.from(new Set(matches));
}

function extractTeams(text) {
  const source = String(text || "").toLowerCase();
  const found = [];
  TEAM_NAMES.forEach((team) => {
    const key = team.toLowerCase();
    if (source.includes(key)) {
      found.push(normalizeTeamName(team));
    }
  });
  return Array.from(new Set(found));
}

function hasText(row) {
  return row.some((cell) => String(cell || "").trim() !== "");
}

function looksLikeHeader(row) {
  const lower = row.map((cell) => String(cell || "").toLowerCase());
  const hits = ["date", "type", "transaction", "details", "team", "player"].filter(
    (token) => lower.some((cell) => cell.includes(token))
  );
  return hits.length >= 2;
}

function parseTransactionRow(row) {
  // Fixed sheet mapping:
  // A: Date (optional)
  // B: Team 1
  // C: Team 1 receives
  // D: Team 2
  // E: Team 2 receives
  const date = String(row[0] || "").trim();
  const team1 = normalizeTeamName(row[1] || "");
  const team1Gets = String(row[2] || "").trim();
  const team2 = normalizeTeamName(row[3] || "");
  const team2Gets = String(row[4] || "").trim();
  const details = `${team1 || "Team 1"} receive ${team1Gets || "—"} | ${
    team2 || "Team 2"
  } receive ${team2Gets || "—"}`;
  const type = "Trade";

  const teams = Array.from(new Set([team1, team2].filter(Boolean)));
  const players = Array.from(
    new Set([...extractPlayers(team1Gets), ...extractPlayers(team2Gets)])
  );

  return { date, type, details, teams, players, team1, team1Gets, team2, team2Gets };
}

function parseRetirementRow(row) {
  const extractDateAndTeam = (value) => {
    const raw = String(value || "").trim();
    if (!raw) {
      return { date: "", team: "" };
    }
    const firstFour = raw.slice(0, 4).trim();
    if (/^\d{1,2}\/\d{1,2}$/.test(firstFour)) {
      return { date: firstFour, team: raw.slice(4).trim() };
    }
    return { date: "", team: raw };
  };
  // Merged layout:
  // G:H => player, I:J => team
  const player = String(row[0] || row[1] || "").trim();
  const mergedTeamCell = String(row[2] || row[3] || "").trim();
  const parsed = extractDateAndTeam(mergedTeamCell);
  const team = canonicalTeamName(parsed.team || mergedTeamCell);
  const date = parsed.date || String(row[4] || "").trim() || "—";
  const note = "";
  if (!team && !player) {
    return null;
  }
  const details = `${player || "Player"} retired${
    team ? ` (${team})` : ""
  }${note ? ` • ${note}` : ""}`;
  const players = Array.from(new Set([...extractPlayers(player), ...extractPlayers(note)]));
  if (player && player.startsWith("@") && !players.includes(player)) {
    players.unshift(player);
  }
  const teams = team ? [team] : extractTeams(note);
  return {
    date,
    type: "Retirement",
    details,
    teams,
    players,
    team,
    player,
    note,
  };
}

function parseCutRow(row) {
  const extractDateAndTeam = (value) => {
    const raw = String(value || "").trim();
    if (!raw) {
      return { date: "", team: "" };
    }
    const firstFour = raw.slice(0, 4).trim();
    if (/^\d{1,2}\/\d{1,2}$/.test(firstFour)) {
      return { date: firstFour, team: raw.slice(4).trim() };
    }
    return { date: "", team: raw };
  };
  // Merged layout:
  // L:M => player, N:O => team(+optional date prefix)
  const player = String(row[0] || row[1] || "").trim();
  const mergedTeamCell = String(row[2] || row[3] || "").trim();
  const playerLower = player.toLowerCase();
  const teamLower = mergedTeamCell.toLowerCase();
  if (
    playerLower === "cuts" ||
    playerLower === "player" ||
    teamLower === "date/team" ||
    teamLower === "team"
  ) {
    return null;
  }
  const parsed = extractDateAndTeam(mergedTeamCell);
  const team = canonicalTeamName(parsed.team || mergedTeamCell);
  const date = parsed.date || "—";
  if (!team && !player) {
    return null;
  }
  const details = `${player || "Player"} was cut${
    team ? ` (${team})` : ""
  }`;
  const players = Array.from(new Set([...extractPlayers(player)]));
  if (player && player.startsWith("@") && !players.includes(player)) {
    players.unshift(player);
  }
  const teams = team ? [team] : [];
  return {
    date,
    type: "Cut",
    details,
    teams,
    players,
    team,
    player,
    note: "",
  };
}

function parseSigningRow(row) {
  const extractDateAndTeam = (value) => {
    const raw = String(value || "").trim();
    if (!raw) {
      return { date: "", team: "" };
    }
    const firstFour = raw.slice(0, 4).trim();
    if (/^\d{1,2}\/\d{1,2}$/.test(firstFour)) {
      return { date: firstFour, team: raw.slice(4).trim() };
    }
    return { date: "", team: raw };
  };
  // Merged layout:
  // Q:R => player, S:T => team(+optional date prefix)
  const player = String(row[0] || row[1] || "").trim();
  const mergedTeamCell = String(row[2] || row[3] || "").trim();
  const playerLower = player.toLowerCase();
  const teamLower = mergedTeamCell.toLowerCase();
  if (
    playerLower === "signings" ||
    playerLower === "player" ||
    teamLower === "date/team" ||
    teamLower === "team"
  ) {
    return null;
  }
  const parsed = extractDateAndTeam(mergedTeamCell);
  const team = canonicalTeamName(parsed.team || mergedTeamCell);
  const date = parsed.date || "—";
  if (!team && !player) {
    return null;
  }
  const details = `${team || "Team"} signs ${player || "Player"}`;
  const players = Array.from(new Set([...extractPlayers(player)]));
  if (player && player.startsWith("@") && !players.includes(player)) {
    players.unshift(player);
  }
  const teams = team ? [team] : [];
  return {
    date,
    type: "Signing",
    details,
    teams,
    players,
    team,
    player,
    note: "",
  };
}

function parseDateValue(value) {
  const text = String(value || "").trim();
  if (!text) {
    return Number.NEGATIVE_INFINITY;
  }
  const mdy = text.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (mdy) {
    const month = Number(mdy[1]) - 1;
    const day = Number(mdy[2]);
    let year = mdy[3] ? Number(mdy[3]) : new Date().getFullYear();
    if (year < 100) {
      year += 2000;
    }
    const t = new Date(year, month, day).getTime();
    return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
  }
  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

function renderLinks(list, kind) {
  if (!list.length) {
    return "<span class=\"muted\">None</span>";
  }
  return list
    .map((value) => {
      const href =
        kind === "team"
          ? `team.html?team=${encodeURIComponent(value)}`
          : `player-detail.html?player=${encodeURIComponent(value)}`;
      const badge = window.rsklPlayerBadgeHtml
        ? window.rsklPlayerBadgeHtml({ player: value, rookie: true, risingStars: true })
        : "";
      return `<a class="tx-link" href="${href}">${escapeHtml(value)}${badge}</a>`;
    })
    .join(", ");
}

function linkifyPlayers(text) {
  const source = String(text || "");
  const parts = source.split(/(@[A-Za-z0-9_.]+)/g);
  return parts
    .map((part) => {
      if (/^@[A-Za-z0-9_.]+$/.test(part)) {
        const badge = window.rsklPlayerBadgeHtml
          ? window.rsklPlayerBadgeHtml({ player: part, rookie: true, risingStars: true })
          : "";
        return `<a class="tx-link" href="player-detail.html?player=${encodeURIComponent(
          part
        )}">${escapeHtml(part)}${badge}</a>`;
      }
      return escapeHtml(part);
    })
    .join("");
}

function normalizeSearch(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9@# ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTeamLogo(team) {
  const clean = canonicalTeamName(team);
  if (clean === "The Future" || clean === "Dream Team") return "/assets/dream-team.jpg";
  if (clean === "The Lions") return "/assets/the-lions.png";
  if (clean === "The Snipers") return "/assets/the-snipers.png";
  if (clean === "The Phantoms") return "/assets/the-phantoms.png";
  if (clean === "Scorpions") return "/assets/mayeday.jpg";
  if (clean === "Cobras") return "/assets/cobras.png";
  if (clean === "Karma Avengers") return "/assets/karma-avengers.png";
  if (clean === "Mafia") return "/assets/mafia.png";
  if (clean === "Mets" || clean === "The Mets") return "/assets/mets.png";
  if (clean === "Phoenix" || clean === "The Phoenix") return "/assets/phoenix.png";
  if (clean === "Thunderhawks") return "/assets/thunderhawks.png";
  if (clean === "The Currents" || clean === "Currents") return "/assets/the-currents.png";
  if (clean === "Whatsgrass") return "/assets/whatsgrass.png";
  if (clean === "Wolves") return "/assets/wolves.png";
  if (clean === "Zombies") return "/assets/zombies.png";
  if (clean === "Yetis") return "/assets/yetis.png";
  if (clean === "Gus N Em") return "/assets/gus-n-em.png";
  if (clean === "Bad Bois")
    return "https://media.realapp.com/assets/user/default/large/4JZRj4DJ_29132497.webp";
  if (clean === "Illegals") return "/assets/illegals.png";
  if (clean === "Storm" || clean === "Bullets") return "/assets/storm.png";
  if (clean === "Turkeys") return "/assets/turkeys.png";
  return "";
}

function renderTeamHeader(team) {
  const clean = canonicalTeamName(team);
  if (!clean) {
    return "<span class=\"muted\">—</span>";
  }
  const logo = getTeamLogo(clean);
  const logoHtml = logo
    ? `<img class="standings-logo" src="${logo}" alt="${escapeHtml(clean)} logo" />`
    : "";
  return `<a class="tx-link tx-team-link" href="team.html?team=${encodeURIComponent(
    clean
  )}">${logoHtml}${escapeHtml(clean)}</a>`;
}

function renderTransactions(filter = "") {
  const query = String(filter || "").trim().toLowerCase();
  const queryNorm = normalizeSearch(query);
  const parsed = transactionRows
    .map((item, idx) => ({ ...item, _idx: idx }))
    .filter((tx) => tx.details || tx.date || tx.type);

  const visible = query
    ? parsed.filter((tx) => {
        const haystackRaw = [
          tx.date,
          tx.type,
          tx.details,
          tx.team1,
          tx.team1Gets,
          tx.team2,
          tx.team2Gets,
          tx.team,
          tx.player,
          tx.note,
          tx.teams.join(" "),
          tx.players.join(" "),
        ]
          .join(" ")
          .toLowerCase();
        if (haystackRaw.includes(query)) {
          return true;
        }
        const haystackNorm = normalizeSearch(haystackRaw);
        if (queryNorm && haystackNorm.includes(queryNorm)) {
          return true;
        }
        const tokens = queryNorm.split(" ").filter((t) => t.length >= 2);
        return tokens.length > 0 && tokens.every((t) => haystackNorm.includes(t));
      })
    : parsed;

  if (!visible.length) {
    els.list.innerHTML = "<p>No transactions found.</p>";
    return;
  }

  const sorted = [...visible].sort((a, b) => {
    const dateDiff = parseDateValue(b.date) - parseDateValue(a.date);
    if (dateDiff !== 0) {
      return dateDiff;
    }
    return b._idx - a._idx;
  });

  els.list.innerHTML = sorted
    .map(
      (tx) => `
        <article class="tx-card">
          <div class="tx-head">
            <strong>${escapeHtml(tx.type || "Transaction")}</strong>
            <span>${escapeHtml(tx.date || "—")}</span>
          </div>
          ${
            tx.type === "Retirement" || tx.type === "Cut" || tx.type === "Signing"
              ? `<div class="tx-sides">
                  <div class="tx-side tx-side-full">
                    <div class="tx-side-value tx-sentence">${
                      tx.type === "Cut"
                        ? `<span class="tx-part">${renderTeamHeader(tx.team)}</span><span class="tx-verb">cuts</span><span class="tx-part">${linkifyPlayers(
                            tx.player || "—"
                          )}</span>`
                        : tx.type === "Signing"
                        ? `<span class="tx-part">${renderTeamHeader(tx.team)}</span><span class="tx-verb">signs</span><span class="tx-part">${linkifyPlayers(
                            tx.player || "—"
                          )}</span>`
                        : `<span class="tx-part">${linkifyPlayers(
                            tx.player || "—"
                          )}</span><span class="tx-verb">retires from</span><span class="tx-part">${renderTeamHeader(
                            tx.team
                          )}</span>`
                    }</div>
                  </div>
                </div>`
              : `<div class="tx-sides">
                  <div class="tx-side">
                    <div class="tx-side-team">${renderTeamHeader(tx.team1)}</div>
                    <div class="tx-side-label">Received</div>
                    <div class="tx-side-value">${linkifyPlayers(tx.team1Gets || "—")}</div>
                  </div>
                  <div class="tx-side">
                    <div class="tx-side-team">${renderTeamHeader(tx.team2)}</div>
                    <div class="tx-side-label">Received</div>
                    <div class="tx-side-value">${linkifyPlayers(tx.team2Gets || "—")}</div>
                  </div>
                </div>`
          }
        </article>
      `
    )
    .join("");
}

function getInitialQuery() {
  const params = new URLSearchParams(window.location.search);
  return String(params.get("q") || "").trim();
}

async function loadTransactions() {
  try {
    const response = await fetch(TRANSACTIONS_CSV_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    const rows = parseCSV(await response.text());
    const tradeRows = sliceRange(rows, TRADE_RANGE).filter(hasText);
    const retirementRows = sliceRange(rows, RETIREMENT_RANGE).filter(hasText);
    const cutRows = sliceRange(rows, CUT_RANGE).filter(hasText);
    const signingRows = sliceRange(rows, SIGNING_RANGE).filter(hasText);
    if (!tradeRows.length && !retirementRows.length && !cutRows.length && !signingRows.length) {
      throw new Error("No transaction data found.");
    }
    const parsedTrades = looksLikeHeader(tradeRows[0] || [])
      ? tradeRows.slice(1).filter(hasText).map(parseTransactionRow)
      : tradeRows.map(parseTransactionRow);
    const parsedRetirements = looksLikeHeader(retirementRows[0] || [])
      ? retirementRows
          .slice(1)
          .filter(hasText)
          .map(parseRetirementRow)
          .filter(Boolean)
      : retirementRows.map(parseRetirementRow).filter(Boolean);
    const parsedCuts = looksLikeHeader(cutRows[0] || [])
      ? cutRows
          .slice(1)
          .filter(hasText)
          .map(parseCutRow)
          .filter(Boolean)
      : cutRows.map(parseCutRow).filter(Boolean);
    const parsedSignings = looksLikeHeader(signingRows[0] || [])
      ? signingRows
          .slice(1)
          .filter(hasText)
          .map(parseSigningRow)
          .filter(Boolean)
      : signingRows.map(parseSigningRow).filter(Boolean);
    transactionHeaders = ["Date", "Type", "Details", "Team", "Player"];
    transactionRows = [...parsedTrades, ...parsedRetirements, ...parsedCuts, ...parsedSignings].filter(Boolean);
    const initialQuery = getInitialQuery();
    if (els.search) {
      els.search.value = initialQuery;
    }
    renderTransactions(initialQuery);
    updateLastUpdated();
  } catch (error) {
    els.list.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
  }
}

if (els.search) {
  els.search.addEventListener("input", () => {
    renderTransactions(els.search.value);
  });
}

loadTransactions();
