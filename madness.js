const PLAYOFFS_CSV_URL = "/api/sheet?name=playoffs";
const LIVE_REFRESH_MS = 60000;

// Game cell mappings from the playoffs sheet:
// Game 1: AB5:7, Game 2: AB10:12, Game 3: CD4:6, Game 4: CD9:11, Game 5: EF5:10
const PLAYOFF_GAME_SLOTS = [
  { cols: ["A", "B"], rows: [5, 7] },
  { cols: ["A", "B"], rows: [10, 12] },
  { cols: ["C", "D"], rows: [4, 6] },
  { cols: ["C", "D"], rows: [9, 11] },
  { cols: ["E", "F"], rows: [5, 10] },
];

const EAST_BRACKET = [
  { seed: 1, player: "@jordancarter" },
  { seed: 16, player: "W P7" },
  { seed: 2, player: "@dri" },
  { seed: 15, player: "W P5" },
  { seed: 3, player: "@logangeo" },
  { seed: 14, player: "W P3" },
  { seed: 4, player: "@fendforquis" },
  { seed: 13, player: "W P1" },
  { seed: 5, player: "@tinosthe2nd" },
  { seed: 12, player: "@chromepac" },
  { seed: 6, player: "@sports" },
  { seed: 11, player: "@arachnid" },
  { seed: 7, player: "@jamesthebot888" },
  { seed: 10, player: "@bello" },
  { seed: 8, player: "@fplostpro" },
  { seed: 9, player: "@alec" },
];

const WEST_BRACKET = [
  { seed: 1, player: "@_jake" },
  { seed: 16, player: "W P6" },
  { seed: 2, player: "@phx" },
  { seed: 15, player: "W P4" },
  { seed: 3, player: "@yanghansenlover" },
  { seed: 14, player: "W P2" },
  { seed: 4, player: "@corbin" },
  { seed: 13, player: "@paolobancheromvpszn" },
  { seed: 5, player: "@azure" },
  { seed: 12, player: "@robertjr" },
  { seed: 6, player: "@keegan" },
  { seed: 11, player: "@thebigd0g" },
  { seed: 7, player: "@noahrawji" },
  { seed: 10, player: "@maliknabers.1" },
  { seed: 8, player: "@avamax" },
  { seed: 9, player: "@ok124" },
];

const PLAY_INS = {
  P1: ["@power", "@aliyu_"],
  P2: ["@duren", "@tuff0"],
  P3: ["@mensahszn", "@andrej"],
  P4: ["@josh_hart", "@cjstroud777"],
  P5: ["@morant", "@patsontop7"],
  P6: ["@rzk", "@jakemccarthy31"],
  P7: ["@jakobe.walter", "@mmf"],
};

const BRACKET_PAIRS = [
  [1, 16],
  [8, 9],
  [5, 12],
  [4, 13],
  [6, 11],
  [3, 14],
  [7, 10],
  [2, 15],
];

const R2_ROWS = [2, 6, 10, 14];
const S16_ROWS = [4, 12];

let liveState = {
  scoreMap: new Map(),
  resultMap: new Map(),
  loaded: false,
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function normalizeHandle(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");
}

function extractHandles(text) {
  const matches = String(text || "").match(/@[a-z0-9._]+/gi) || [];
  return [...new Set(matches.map((m) => normalizeHandle(m)))];
}

function toNumber(value) {
  const cleaned = String(value || "")
    .replace(/,/g, "")
    .replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
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

function matchupKey(aHandle, bHandle) {
  const a = normalizeHandle(aHandle);
  const b = normalizeHandle(bHandle);
  if (!a || !b) return "";
  return [a, b].sort().join("|");
}

function extractPlayoffResults(rows) {
  const scoreMap = new Map();
  const resultMap = new Map();

  PLAYOFF_GAME_SLOTS.forEach((slot) => {
    const [nameCol, scoreCol] = slot.cols;
    const [topRow, bottomRow] = slot.rows;

    const topNameCell = getCell(rows, nameCol, topRow);
    const topScoreCell = getCell(rows, scoreCol, topRow);
    const bottomNameCell = getCell(rows, nameCol, bottomRow);
    const bottomScoreCell = getCell(rows, scoreCol, bottomRow);

    const topHandle = extractHandles(topNameCell)[0] || "";
    const bottomHandle = extractHandles(bottomNameCell)[0] || "";
    const topScore = toNumber(topScoreCell);
    const bottomScore = toNumber(bottomScoreCell);

    if (topHandle && topScore !== null) scoreMap.set(topHandle, topScore);
    if (bottomHandle && bottomScore !== null) scoreMap.set(bottomHandle, bottomScore);

    if (!topHandle || !bottomHandle || topScore === null || bottomScore === null) return;
    if (topScore === bottomScore) return;

    const key = matchupKey(topHandle, bottomHandle);
    if (!key) return;

    resultMap.set(key, {
      winner: topScore > bottomScore ? topHandle : bottomHandle,
      a: { handle: topHandle, score: topScore },
      b: { handle: bottomHandle, score: bottomScore },
    });
  });

  return { scoreMap, resultMap };
}

function seedMapFor(entries) {
  const m = new Map();
  entries.forEach((entry) => m.set(entry.seed, entry.player));
  return m;
}

function resolvePlayInPlayer(raw, scoreMap) {
  const value = String(raw || "").trim();
  const m = value.match(/^W\s*P(\d+)$/i);
  if (!m) {
    const handles = extractHandles(value);
    return {
      main: value,
      handles,
      sub: "",
    };
  }

  const playInKey = `P${m[1]}`;
  const pair = PLAY_INS[playInKey] || [];
  const a = normalizeHandle(pair[0] || "");
  const b = normalizeHandle(pair[1] || "");
  const aScore = scoreMap.get(a);
  const bScore = scoreMap.get(b);

  if (a && b && Number.isFinite(aScore) && Number.isFinite(bScore) && aScore !== bScore) {
    const winner = aScore > bScore ? pair[0] : pair[1];
    return {
      main: winner,
      handles: [normalizeHandle(winner)],
      sub: "",
    };
  }

  return {
    main: pair.length === 2 ? `${pair[0]} vs ${pair[1]}` : value,
    handles: pair.map((p) => normalizeHandle(p)).filter(Boolean),
    sub: "",
  };
}

function emptyLabel() {
  return { main: "", handles: [], sub: "" };
}

function winnerBetween(aLabel, bLabel, scoreMap, resultMap) {
  if (!aLabel || !bLabel) return emptyLabel();
  if (aLabel.handles.length !== 1 || bLabel.handles.length !== 1) return emptyLabel();

  const a = aLabel.handles[0];
  const b = bLabel.handles[0];
  const key = matchupKey(a, b);
  const resolved = key ? resultMap.get(key) : null;
  if (resolved && resolved.winner) {
    return normalizeHandle(a) === resolved.winner ? aLabel : bLabel;
  }

  const aScore = scoreMap.get(a);
  const bScore = scoreMap.get(b);
  if (!Number.isFinite(aScore) || !Number.isFinite(bScore) || aScore === bScore) return emptyLabel();
  return aScore > bScore ? aLabel : bLabel;
}

function statusFor(label, oppLabel, scoreMap, resultMap) {
  if (!label || !oppLabel || label.handles.length !== 1 || oppLabel.handles.length !== 1) return "";
  const a = label.handles[0];
  const b = oppLabel.handles[0];
  const key = matchupKey(a, b);
  const resolved = key ? resultMap.get(key) : null;

  if (resolved && resolved.winner) {
    return normalizeHandle(a) === resolved.winner ? "win" : "loss";
  }

  const aScore = scoreMap.get(a);
  const bScore = scoreMap.get(b);
  if (!Number.isFinite(aScore) || !Number.isFinite(bScore) || aScore === bScore) return "";
  return aScore > bScore ? "win" : "loss";
}

function scoreFor(label, scoreMap) {
  if (!label || label.handles.length !== 1) return "";
  const score = scoreMap.get(label.handles[0]);
  return Number.isFinite(score) ? String(score) : "";
}

function renderTeamSlot(seed, label, scoreText, status) {
  return `
    <div class="madness-game-slot ${status ? `is-${status}` : ""}">
      <span class="madness-seed">${seed || ""}</span>
      <span class="madness-player">
        <span class="madness-player-main">${escapeHtml(label.main || "")}</span>
        ${label.sub ? `<small class="madness-player-sub">${escapeHtml(label.sub)}</small>` : ""}
      </span>
      <span class="madness-player-score">${escapeHtml(scoreText || "")}</span>
    </div>
  `;
}

function renderGame(topSeed, topLabel, bottomSeed, bottomLabel, cls, row, scoreMap, resultMap) {
  const topStatus = statusFor(topLabel, bottomLabel, scoreMap, resultMap);
  const bottomStatus = statusFor(bottomLabel, topLabel, scoreMap, resultMap);

  return `
    <article class="madness-game ${cls}" style="--row:${row};">
      ${renderTeamSlot(topSeed, topLabel, scoreFor(topLabel, scoreMap), topStatus)}
      ${renderTeamSlot(bottomSeed, bottomLabel, scoreFor(bottomLabel, scoreMap), bottomStatus)}
    </article>
  `;
}

function renderSide(entries, sideClass, scoreMap, resultMap) {
  const seeds = seedMapFor(entries);

  const round1 = BRACKET_PAIRS.map((pair) => {
    const top = resolvePlayInPlayer(seeds.get(pair[0]) || "", scoreMap);
    const bottom = resolvePlayInPlayer(seeds.get(pair[1]) || "", scoreMap);
    return { top, bottom, topSeed: pair[0], bottomSeed: pair[1] };
  });

  const round1Html = round1
    .map((m, idx) => renderGame(m.topSeed, m.top, m.bottomSeed, m.bottom, `round-one ${sideClass}`, 1 + idx * 2, scoreMap, resultMap))
    .join("");

  const r2Labels = [];
  for (let i = 0; i < round1.length; i += 2) {
    r2Labels.push(winnerBetween(round1[i].top, round1[i].bottom, scoreMap, resultMap));
    r2Labels.push(winnerBetween(round1[i + 1].top, round1[i + 1].bottom, scoreMap, resultMap));
  }

  const round2Html = R2_ROWS.map((row, idx) => {
    const top = r2Labels[idx * 2] || emptyLabel();
    const bottom = r2Labels[idx * 2 + 1] || emptyLabel();
    return renderGame("", top, "", bottom, `round-two ${sideClass}`, row, scoreMap, resultMap);
  }).join("");

  const r3Labels = [];
  for (let i = 0; i < r2Labels.length; i += 2) {
    r3Labels.push(winnerBetween(r2Labels[i], r2Labels[i + 1], scoreMap, resultMap));
  }

  const round3Html = S16_ROWS.map((row, idx) => {
    const top = r3Labels[idx * 2] || emptyLabel();
    const bottom = r3Labels[idx * 2 + 1] || emptyLabel();
    return renderGame("", top, "", bottom, `sweet-sixteen ${sideClass}`, row, scoreMap, resultMap);
  }).join("");

  const champ = winnerBetween(r3Labels[0] || emptyLabel(), r3Labels[1] || emptyLabel(), scoreMap, resultMap);

  return {
    html: `${round1Html}${round2Html}${round3Html}`,
    champion: champ,
  };
}

function renderChampionship(eastChamp, westChamp, scoreMap, resultMap) {
  return renderGame("", eastChamp || emptyLabel(), "", westChamp || emptyLabel(), "championship", 8, scoreMap, resultMap);
}

function render() {
  const bracketEl = document.getElementById("madness-bracket");
  const lastUpdatedEl = document.getElementById("last-updated");
  if (!bracketEl) return;

  const scoreMap = liveState.scoreMap;
  const resultMap = liveState.resultMap;

  const east = renderSide(EAST_BRACKET, "left", scoreMap, resultMap);
  const west = renderSide(WEST_BRACKET, "right", scoreMap, resultMap);

  bracketEl.innerHTML = `
    <div class="madness-board-list">
      <section class="madness-region-board">
        <div class="madness-grid-wrap">
          <div class="madness-combined-board">
            <div class="madness-side-label left">East</div>
            <div class="madness-side-label right">West</div>
            ${east.html}
            ${west.html}
            ${renderChampionship(east.champion, west.champion, scoreMap, resultMap)}
          </div>
        </div>
      </section>
    </div>
  `;

  if (lastUpdatedEl) {
    const formatted = new Date().toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    lastUpdatedEl.textContent = `Last updated: ${formatted}${liveState.loaded ? " • Live Synced" : ""}`;
  }
}

async function loadLiveScores() {
  try {
    const response = await fetch(PLAYOFFS_CSV_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`playoffs ${response.status}`);

    const text = await response.text();
    const rows = parseCSV(text);
    const extracted = extractPlayoffResults(rows);

    liveState.scoreMap = extracted.scoreMap;
    liveState.resultMap = extracted.resultMap;
    liveState.loaded = true;
  } catch (_err) {
    liveState.scoreMap = new Map();
    liveState.resultMap = new Map();
    liveState.loaded = false;
  }

  render();
}

loadLiveScores();
setInterval(loadLiveScores, LIVE_REFRESH_MS);
