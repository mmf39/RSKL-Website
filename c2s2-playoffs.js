const PLAYOFFS_CSV_URL = "/api/sheet?name=playoffs";
const REFRESH_MS = 60000;

const GAME_SLOTS = [
  { game: 1, cols: ["A", "B"], rows: [5, 7] },
  { game: 2, cols: ["A", "B"], rows: [10, 12] },
  { game: 3, cols: ["C", "D"], rows: [4, 6] },
  { game: 4, cols: ["C", "D"], rows: [9, 11] },
  { game: 5, cols: ["E", "F"], rows: [5, 10] },
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
      if (char === "\r" && next === "\n") i += 1;
      row.push(value.trim());
      if (row.length > 1 || row[0] !== "") rows.push(row);
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

function colToIndex(col) {
  const s = String(col || "").trim().toUpperCase();
  if (!s) return -1;
  let n = 0;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s.charCodeAt(i);
    if (ch < 65 || ch > 90) return -1;
    n = n * 26 + (ch - 64);
  }
  return n - 1;
}

function getCell(rows, col, rowNum) {
  const r = Number(rowNum) - 1;
  const c = colToIndex(col);
  if (r < 0 || c < 0) return "";
  return String((rows[r] && rows[r][c]) || "").trim();
}

function toNumber(value) {
  const cleaned = String(value || "")
    .replace(/,/g, "")
    .replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function extractName(value) {
  const text = String(value || "").trim();
  if (!text) return "TBD";
  return text;
}

function readGames(rows) {
  return GAME_SLOTS.map((slot) => {
    const [nameCol, scoreCol] = slot.cols;
    const [topRow, botRow] = slot.rows;

    const aName = extractName(getCell(rows, nameCol, topRow));
    const bName = extractName(getCell(rows, nameCol, botRow));
    const aScore = toNumber(getCell(rows, scoreCol, topRow));
    const bScore = toNumber(getCell(rows, scoreCol, botRow));

    const aWin = aScore !== null && bScore !== null && aScore > bScore;
    const bWin = aScore !== null && bScore !== null && bScore > aScore;

    return {
      game: slot.game,
      aName,
      bName,
      aScore,
      bScore,
      aWin,
      bWin,
    };
  });
}

function renderGames(games) {
  const container = document.getElementById("madness-bracket");
  if (!container) return;

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;">
      ${games
        .map(
          (g) => `
            <article style="border:1px solid rgba(255,140,26,.5);border-radius:12px;padding:14px;background:rgba(10,28,65,.55);">
              <div style="font-weight:800;color:#ffb347;margin-bottom:10px;">Game ${g.game}</div>
              <div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid rgba(255,140,26,.25);${g.aWin ? "color:#38e08d;font-weight:800;" : ""}">
                <span>${escapeHtml(g.aName)}</span>
                <strong>${g.aScore === null ? "—" : escapeHtml(g.aScore)}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid rgba(255,140,26,.25);${g.bWin ? "color:#38e08d;font-weight:800;" : ""}">
                <span>${escapeHtml(g.bName)}</span>
                <strong>${g.bScore === null ? "—" : escapeHtml(g.bScore)}</strong>
              </div>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

async function loadPlayoffs() {
  const lastUpdated = document.getElementById("last-updated");
  try {
    const res = await fetch(PLAYOFFS_CSV_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const text = await res.text();
    const rows = parseCSV(text);
    const games = readGames(rows);
    renderGames(games);

    if (lastUpdated) {
      const now = new Date();
      lastUpdated.textContent = `Last updated: ${now.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })}`;
    }
  } catch (_e) {
    const container = document.getElementById("madness-bracket");
    if (container) container.innerHTML = '<p>Unable to load playoff games.</p>';
  }
}

loadPlayoffs();
setInterval(loadPlayoffs, REFRESH_MS);
