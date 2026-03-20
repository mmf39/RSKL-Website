const LIVE_BRACKET_CSV_URL = "/api/sheet?name=madness-live";
const LIVE_REFRESH_MS = 60000;

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
  { seed: 8, player: "@Fplostpro" },
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

const PLAY_INS = [
  { id: "P1", players: ["@power", "@aliyu_"] },
  { id: "P2", players: ["@duren", "@tuff0"] },
  { id: "P3", players: ["@mensahszn", "@andrej"] },
  { id: "P4", players: ["@josh_hart", "@cjstroud777"] },
  { id: "P5", players: ["@morant", "@patsontop7"] },
  { id: "P6", players: ["@rzk", "@jakemccarthy31"] },
  { id: "P7", players: ["@jakobe.walter", "@mmf"] },
];

const PLAY_IN_MAP = Object.fromEntries(PLAY_INS.map((p) => [p.id, p.players]));
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
const E8_ROWS = [8];

let liveState = {
  scoreMap: new Map(),
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
  const unique = [...new Set(matches.map((m) => normalizeHandle(m)))];
  return unique;
}

function toNumber(value) {
  const cleaned = String(value || "")
    .replace(/,/g, "")
    .replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractScoreMap(rows) {
  const scoreMap = new Map();

  for (const row of rows) {
    for (let c = 0; c < row.length; c += 1) {
      const cell = row[c];
      const handles = extractHandles(cell);
      if (handles.length !== 1) continue;

      const handle = handles[0];
      let score = toNumber(cell);

      if (score === null) {
        for (let step = 1; step <= 3; step += 1) {
          score = toNumber(row[c + step]);
          if (score !== null) break;
        }
      }

      if (score === null) continue;

      const prev = scoreMap.get(handle);
      if (prev === undefined || score > prev) {
        scoreMap.set(handle, score);
      }
    }
  }

  return scoreMap;
}

function resolvePlayerLabel(player) {
  const raw = String(player || "").trim();
  const match = raw.match(/^W\s*P(\d+)$/i);
  if (!match) {
    const handles = extractHandles(raw);
    return { main: raw, sub: "", handles };
  }

  const playInId = `P${match[1]}`;
  const players = PLAY_IN_MAP[playInId];
  if (!players || players.length < 2) {
    return { main: raw, sub: "", handles: extractHandles(raw) };
  }

  return {
    main: `${players[0]} vs ${players[1]}`,
    sub: "",
    handles: [normalizeHandle(players[0]), normalizeHandle(players[1])],
  };
}

function scoreTextForLabel(label, scoreMap) {
  if (!label || !label.handles || !label.handles.length) return "";

  if (label.handles.length === 1) {
    const score = scoreMap.get(label.handles[0]);
    return score === undefined ? "" : String(score);
  }

  const left = scoreMap.get(label.handles[0]);
  const right = scoreMap.get(label.handles[1]);
  if (left !== undefined && right !== undefined) return `${left}-${right}`;
  if (left !== undefined) return String(left);
  if (right !== undefined) return String(right);
  return "";
}

function scoreForHandle(player, scoreMap) {
  const handle = normalizeHandle(player);
  if (!handle) return "";
  const score = scoreMap.get(handle);
  return score === undefined ? "" : String(score);
}

function labelForWinner(a, b, scoreMap) {
  if (!a || !b || a.handles.length !== 1 || b.handles.length !== 1) return { main: "", sub: "", handles: [] };
  const aScore = scoreMap.get(a.handles[0]);
  const bScore = scoreMap.get(b.handles[0]);
  if (aScore === undefined || bScore === undefined || aScore === bScore) return { main: "", sub: "", handles: [] };
  return aScore > bScore ? a : b;
}

function slotResultStatus(aLabel, bLabel, scoreMap, forTop) {
  if (!aLabel || !bLabel || aLabel.handles.length !== 1 || bLabel.handles.length !== 1) return "";
  const aScore = scoreMap.get(aLabel.handles[0]);
  const bScore = scoreMap.get(bLabel.handles[0]);
  if (aScore === undefined || bScore === undefined || aScore === bScore) return "";
  if (forTop) return aScore > bScore ? "win" : "loss";
  return bScore > aScore ? "win" : "loss";
}

function buildSeedMap(entries) {
  const map = new Map();
  entries.forEach((entry) => map.set(entry.seed, entry.player));
  return map;
}

function renderTeamSlot(seed, playerLabel, scoreText, status) {
  return `
    <div class="madness-game-slot ${status ? `is-${status}` : ""}">
      <span class="madness-seed">${seed || ""}</span>
      <span class="madness-player">
        <span class="madness-player-main">${escapeHtml(playerLabel.main || "")}</span>
        ${playerLabel.sub ? `<small class="madness-player-sub">${escapeHtml(playerLabel.sub)}</small>` : ""}
      </span>
      <span class="madness-player-score">${escapeHtml(scoreText || "")}</span>
    </div>
  `;
}

function renderGame(topSeed, topPlayer, bottomSeed, bottomPlayer, cls, row, scoreMap, statusTop = "", statusBottom = "") {
  return `
    <article class="madness-game ${cls}" style="--row:${row};">
      ${renderTeamSlot(topSeed, topPlayer, scoreTextForLabel(topPlayer, scoreMap), statusTop)}
      ${renderTeamSlot(bottomSeed, bottomPlayer, scoreTextForLabel(bottomPlayer, scoreMap), statusBottom)}
    </article>
  `;
}

function renderPlaceholder(top, bottom, cls, row, scoreMap) {
  return renderGame("", top, "", bottom, `${cls} placeholder`, row, scoreMap);
}

function renderSide(entries, sideClass, scoreMap) {
  const seedMap = buildSeedMap(entries);

  const r1Matches = BRACKET_PAIRS.map((pair) => {
    const top = resolvePlayerLabel(seedMap.get(pair[0]) || "");
    const bottom = resolvePlayerLabel(seedMap.get(pair[1]) || "");
    return { top, bottom, topSeed: pair[0], bottomSeed: pair[1] };
  });

  const firstRound = r1Matches
    .map((m, index) => {
      const topStatus = slotResultStatus(m.top, m.bottom, scoreMap, true);
      const bottomStatus = slotResultStatus(m.top, m.bottom, scoreMap, false);
      return renderGame(
        m.topSeed,
        m.top,
        m.bottomSeed,
        m.bottom,
        `round-one ${sideClass}`,
        1 + index * 2,
        scoreMap,
        topStatus,
        bottomStatus
      );
    })
    .join("");

  const r2Winners = [
    labelForWinner(r1Matches[0].top, r1Matches[0].bottom, scoreMap),
    labelForWinner(r1Matches[1].top, r1Matches[1].bottom, scoreMap),
    labelForWinner(r1Matches[2].top, r1Matches[2].bottom, scoreMap),
    labelForWinner(r1Matches[3].top, r1Matches[3].bottom, scoreMap),
    labelForWinner(r1Matches[4].top, r1Matches[4].bottom, scoreMap),
    labelForWinner(r1Matches[5].top, r1Matches[5].bottom, scoreMap),
    labelForWinner(r1Matches[6].top, r1Matches[6].bottom, scoreMap),
    labelForWinner(r1Matches[7].top, r1Matches[7].bottom, scoreMap),
  ];

  const secondRound = R2_ROWS.map((row, idx) => {
    const top = r2Winners[idx * 2] || { main: "", sub: "", handles: [] };
    const bottom = r2Winners[idx * 2 + 1] || { main: "", sub: "", handles: [] };
    return renderPlaceholder(top, bottom, `round-two ${sideClass}`, row, scoreMap);
  }).join("");

  const s16Winners = [
    labelForWinner(r2Winners[0], r2Winners[1], scoreMap),
    labelForWinner(r2Winners[2], r2Winners[3], scoreMap),
    labelForWinner(r2Winners[4], r2Winners[5], scoreMap),
    labelForWinner(r2Winners[6], r2Winners[7], scoreMap),
  ];

  const sweet16 = S16_ROWS.map((row, idx) => {
    const top = s16Winners[idx * 2] || { main: "", sub: "", handles: [] };
    const bottom = s16Winners[idx * 2 + 1] || { main: "", sub: "", handles: [] };
    return renderPlaceholder(top, bottom, `sweet-sixteen ${sideClass}`, row, scoreMap);
  }).join("");

  const e8Winners = [
    labelForWinner(s16Winners[0], s16Winners[1], scoreMap),
    labelForWinner(s16Winners[2], s16Winners[3], scoreMap),
  ];

  const elite8 = E8_ROWS.map((row) => {
    const top = e8Winners[0] || { main: "", sub: "", handles: [] };
    const bottom = e8Winners[1] || { main: "", sub: "", handles: [] };
    return renderPlaceholder(top, bottom, `elite-eight ${sideClass}`, row, scoreMap);
  }).join("");

  const sideChamp = labelForWinner(e8Winners[0], e8Winners[1], scoreMap);

  return {
    html: `${firstRound}${secondRound}${sweet16}${elite8}`,
    champion: sideChamp && sideChamp.main ? sideChamp : { main: "", sub: "", handles: [] },
  };
}

function renderFinals(scoreMap, eastChamp, westChamp) {
  return `
    ${renderPlaceholder(eastChamp, westChamp, "final-four top", 6, scoreMap)}
    ${renderPlaceholder({ main: "", sub: "", handles: [] }, { main: "", sub: "", handles: [] }, "final-four bottom", 10, scoreMap)}
  `;
}

function render() {
  const bracket = document.getElementById("madness-bracket");
  const playins = document.getElementById("madness-playins");
  const lastUpdated = document.getElementById("last-updated");

  if (lastUpdated) {
    const formatted = new Date().toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    const suffix = liveState.loaded ? " • Live Synced" : "";
    lastUpdated.textContent = `Last updated: ${formatted}${suffix}`;
  }

  if (bracket) {
    const east = renderSide(EAST_BRACKET, "left", liveState.scoreMap);
    const west = renderSide(WEST_BRACKET, "right", liveState.scoreMap);

    bracket.innerHTML = `
      <div class="madness-board-list">
        <section class="madness-region-board">
          <div class="madness-grid-wrap">
            <div class="madness-combined-board">
              <div class="madness-side-label left">East</div>
              <div class="madness-side-label right">West</div>
              ${east.html}
              ${west.html}
              ${renderFinals(liveState.scoreMap, east.champion, west.champion)}
            </div>
          </div>
        </section>
      </div>
    `;
  }

  if (playins) {
    playins.innerHTML = PLAY_INS.map(
      (series) => `
        <div class="madness-playin-card">
          <div class="madness-playin-body">
            <span>${escapeHtml(series.players[0])}${
              scoreForHandle(series.players[0], liveState.scoreMap)
                ? ` <strong>${escapeHtml(scoreForHandle(series.players[0], liveState.scoreMap))}</strong>`
                : ""
            }</span>
            <span class="madness-vs">vs</span>
            <span>${escapeHtml(series.players[1])}${
              scoreForHandle(series.players[1], liveState.scoreMap)
                ? ` <strong>${escapeHtml(scoreForHandle(series.players[1], liveState.scoreMap))}</strong>`
                : ""
            }</span>
          </div>
        </div>
      `
    ).join("");
  }
}

async function loadLiveScores() {
  try {
    const response = await fetch(LIVE_BRACKET_CSV_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`fetch ${response.status}`);
    const text = await response.text();
    const rows = parseCSV(text);
    liveState.scoreMap = extractScoreMap(rows);
    liveState.loaded = true;
  } catch (_error) {
    liveState.scoreMap = new Map();
    liveState.loaded = false;
  }
  render();
}

loadLiveScores();
setInterval(loadLiveScores, LIVE_REFRESH_MS);
