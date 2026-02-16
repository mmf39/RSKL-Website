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
const TRANSACTION_RANGE = "A2:E81";

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

function getColumnIndex(nameHints) {
  const lower = transactionHeaders.map((h) => String(h || "").toLowerCase());
  for (const hint of nameHints) {
    const idx = lower.findIndex((h) => h.includes(hint));
    if (idx !== -1) {
      return idx;
    }
  }
  return -1;
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
  const dateIdx = getColumnIndex(["date", "day"]);
  const typeIdx = getColumnIndex(["type", "move", "transaction"]);
  const detailsIdx = getColumnIndex(["details", "note", "description"]);
  const teamIdx = getColumnIndex(["team"]);
  const playerIdx = getColumnIndex(["player"]);

  const fallbackDetails = row.filter(Boolean).join(" | ");
  const details =
    (detailsIdx !== -1 ? row[detailsIdx] : "") ||
    (typeIdx !== -1 ? row[typeIdx] : "") ||
    fallbackDetails;
  const date = dateIdx !== -1 ? row[dateIdx] || "" : "";
  const type = typeIdx !== -1 ? row[typeIdx] || "Transaction" : "Transaction";

  const fromTeams = teamIdx !== -1 ? extractTeams(row[teamIdx] || "") : [];
  const fromPlayers = playerIdx !== -1 ? extractPlayers(row[playerIdx] || "") : [];
  const teams = Array.from(
    new Set([...fromTeams, ...extractTeams(details)])
  );
  const players = Array.from(
    new Set([...fromPlayers, ...extractPlayers(details)])
  );

  return { date, type, details, teams, players };
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

function renderTransactions(filter = "") {
  const query = String(filter || "").trim().toLowerCase();
  const parsed = transactionRows
    .map((row) => parseTransactionRow(row))
    .filter((tx) => tx.details || tx.date || tx.type);

  const visible = query
    ? parsed.filter((tx) => {
        const haystack = [
          tx.date,
          tx.type,
          tx.details,
          tx.teams.join(" "),
          tx.players.join(" "),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
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
    renderTransactions();
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
