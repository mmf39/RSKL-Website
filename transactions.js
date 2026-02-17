const TRANSACTIONS_CSV_URL = "/api/sheet?name=transactions";

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

const els = {
  lastUpdated: document.getElementById("last-updated"),
  list: document.getElementById("transactions-list"),
  search: document.getElementById("transactions-search"),
};

let transactionRows = [];
let transactionHeaders = [];
const TRANSACTION_RANGE = "A3:E81";

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
  return clean === "Bullets" ? "Storm" : clean;
}

function extractPlayers(text) {
  const matches = String(text || "").match(/@[A-Za-z0-9_]+/g) || [];
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
      return `<a class="tx-link" href="${href}">${escapeHtml(value)}</a>`;
    })
    .join(", ");
}

function normalizeSearch(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9@# ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTeamLogo(team) {
  const clean = normalizeTeamName(team);
  if (clean === "The Future") return "/assets/the-future.png";
  if (clean === "The Lions") return "/assets/the-lions.png";
  if (clean === "The Snipers") return "/assets/the-snipers.png";
  if (clean === "The Phantoms") return "/assets/the-phantoms.png";
  if (clean === "Yetis") return "/assets/yetis.png";
  if (clean === "Gus N Em") return "/assets/gus-n-em.png";
  if (clean === "Cheerios") return "/assets/cheerios.png";
  if (clean === "Illegals") return "/assets/illegals.png";
  if (clean === "Storm" || clean === "Bullets") return "/assets/storm.png";
  if (clean === "Turkeys") return "/assets/turkeys.png";
  return "";
}

function renderTeamHeader(team) {
  const clean = normalizeTeamName(team);
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
    .map((row) => parseTransactionRow(row))
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

  els.list.innerHTML = visible
    .map(
      (tx) => `
        <article class="tx-card">
          <div class="tx-head">
            <strong>${escapeHtml(tx.type || "Transaction")}</strong>
            <span>${escapeHtml(tx.date || "—")}</span>
          </div>
          <div class="tx-sides">
            <div class="tx-side">
              <div class="tx-side-team">${renderTeamHeader(tx.team1)}</div>
              <div class="tx-side-label">Received</div>
              <div class="tx-side-value">${escapeHtml(tx.team1Gets || "—")}</div>
            </div>
            <div class="tx-side">
              <div class="tx-side-team">${renderTeamHeader(tx.team2)}</div>
              <div class="tx-side-label">Received</div>
              <div class="tx-side-value">${escapeHtml(tx.team2Gets || "—")}</div>
            </div>
          </div>
          <div class="tx-details">${escapeHtml(tx.details || "—")}</div>
          <div class="tx-meta"><span>Teams Involved:</span> ${renderLinks(
            tx.teams,
            "team"
          )}</div>
          <div class="tx-meta"><span>Players Involved:</span> ${renderLinks(
            tx.players,
            "player"
          )}</div>
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
    const sliced = sliceRange(rows, TRANSACTION_RANGE).filter(hasText);
    if (!sliced.length) {
      throw new Error("No transaction data found.");
    }
    if (looksLikeHeader(sliced[0])) {
      transactionHeaders = sliced[0];
      transactionRows = sliced.slice(1).filter(hasText);
    } else {
      transactionHeaders = ["Date", "Type", "Details", "Team", "Player"];
      transactionRows = sliced.filter(hasText);
    }
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
