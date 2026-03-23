const LIVE_BRACKET_CSV_URL = "/api/sheet?name=madness-live";
const COMPLETED_BRACKET_CSV_URL = "/api/sheet?name=madness-completed";
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

let liveState = {
  scoreMap: new Map(),
  completedScoreMap: new Map(),
  completedMatchups: new Map(),
  frozenMap: null,
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

function extractScoreMap(rows) {
  const scoreMap = new Map();

  for (const row of rows) {
    for (let c = 0; c < row.length; c += 1) {
      const cell = row[c];
      const handles = extractHandles(cell);
      if (handles.length !== 1) continue;

      const handle = handles[0];
      // Do not parse numbers from the same handle cell (e.g. @ok124 -> 124).
      // Scores should come from nearby score columns.
      let score = null;

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

function matchupKey(aHandle, bHandle) {
  const a = normalizeHandle(aHandle);
  const b = normalizeHandle(bHandle);
  if (!a || !b) return "";
  return [a, b].sort().join("|");
}

function extractCompletedMatchups(rows) {
  const result = new Map();

  for (const row of rows) {
    const rowPairs = [];
    for (let c = 0; c < row.length; c += 1) {
      const cell = row[c];
      const handles = extractHandles(cell);
      if (handles.length !== 1) continue;

      // Do not treat trailing digits in handle text as score.
      let score = null;
      if (score === null) {
        for (let step = 1; step <= 3; step += 1) {
          score = toNumber(row[c + step]);
          if (score !== null) break;
        }
      }
      if (score === null) continue;
      rowPairs.push({ handle: handles[0], score });
    }

    if (rowPairs.length < 2) continue;
    const a = rowPairs[0];
    const b = rowPairs[1];
    if (a.score === b.score) continue;

    const key = matchupKey(a.handle, b.handle);
    if (!key) continue;
    result.set(key, { winner: a.score > b.score ? a.handle : b.handle, a, b });
  }

  return result;
}

function getEtNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const map = {};
  parts.forEach((p) => {
    if (p.type !== "literal") map[p.type] = p.value;
  });

  const month = Number(map.month || 0);
  const day = Number(map.day || 0);
  const year = Number(map.year || 0);
  const hour = Number(map.hour || 0);
  const minute = Number(map.minute || 0);

  return {
    month,
    day,
    year,
    hour,
    minute,
    dateKey: `${month}/${day}/${year}`,
  };
}

function isFreezeTimeET() {
  const et = getEtNow();
  return et.hour > 18 || (et.hour === 18 && et.minute >= 55);
}

function mapToObject(map) {
  return Object.fromEntries(map.entries());
}

function objectToMap(obj) {
  return new Map(Object.entries(obj || {}).map(([k, v]) => [k, Number(v)]));
}

function freezeKeyForToday() {
  return `madness-freeze:${getEtNow().dateKey}`;
}

function readFrozenScoreMap() {
  try {
    const raw = localStorage.getItem(freezeKeyForToday());
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return objectToMap(parsed);
  } catch (_e) {
    return null;
  }
}

function maybePersistFrozenScoreMap(scoreMap) {
  if (!isFreezeTimeET()) return null;
  const existing = readFrozenScoreMap();
  if (existing && existing.size) return existing;
  if (!scoreMap || !scoreMap.size) return null;
  try {
    localStorage.setItem(freezeKeyForToday(), JSON.stringify(mapToObject(scoreMap)));
    return scoreMap;
  } catch (_e) {
    return scoreMap;
  }
}

function getActiveScoreMap() {
  return liveState.frozenMap && liveState.frozenMap.size ? liveState.frozenMap : liveState.scoreMap;
}

function getResultScoreMap() {
  if (liveState.completedScoreMap && liveState.completedScoreMap.size) {
    return liveState.completedScoreMap;
  }
  return new Map();
}

function scoreForHandle(player, scoreMap) {
  const handle = normalizeHandle(player);
  if (!handle) return "";
  const score = scoreMap.get(handle);
  return score === undefined ? "" : String(score);
}

function resolvePlayerLabel(player) {
  const raw = String(player || "").trim();
  const match = raw.match(/^W\s*P(\d+)$/i);
  if (!match) {
    return { main: raw, sub: "", handles: extractHandles(raw), participants: [] };
  }

  const playInId = `P${match[1]}`;
  const players = PLAY_IN_MAP[playInId];
  if (!players || players.length < 2) {
    return { main: raw, sub: "", handles: extractHandles(raw), participants: [] };
  }

  return {
    main: `${players[0]} vs ${players[1]}`,
    sub: "",
    handles: [normalizeHandle(players[0]), normalizeHandle(players[1])],
    participants: [players[0], players[1]],
  };
}

function collapseMatchupToWinner(label, scoreMap) {
  if (!label || !Array.isArray(label.handles) || label.handles.length !== 2) return label;
  const [a, b] = label.handles;
  const aScore = scoreMap.get(a);
  const bScore = scoreMap.get(b);
  if (aScore === undefined || bScore === undefined || aScore === bScore) return label;

  const winnerIndex = aScore > bScore ? 0 : 1;
  const winnerHandle = label.handles[winnerIndex];
  const winnerName = (label.participants && label.participants[winnerIndex]) || `@${winnerHandle}`;

  return {
    main: winnerName,
    sub: "",
    handles: [winnerHandle],
    participants: [winnerName],
  };
}

function scoreTextForLabel(label, scoreMap) {
  if (!label || !label.handles || !label.handles.length) return "";
  if (label.handles.length !== 1) return "";
  const score = scoreMap.get(label.handles[0]);
  return score === undefined ? "" : String(score);
}

function labelForWinner(a, b, scoreMap, matchupResults) {
  if (!a || !b || a.handles.length !== 1 || b.handles.length !== 1) {
    return { main: "", sub: "", handles: [] };
  }

  const key = matchupKey(a.handles[0], b.handles[0]);
  const matchup = key ? matchupResults.get(key) : null;
  if (matchup && matchup.winner) {
    return normalizeHandle(a.handles[0]) === matchup.winner ? a : b;
  }

  const aScore = scoreMap.get(a.handles[0]);
  const bScore = scoreMap.get(b.handles[0]);
  if (aScore === undefined || bScore === undefined || aScore === bScore) {
    return { main: "", sub: "", handles: [] };
  }

  return aScore > bScore ? a : b;
}

function slotResultStatus(aLabel, bLabel, scoreMap, matchupResults, forTop) {
  if (!aLabel || !bLabel || aLabel.handles.length !== 1 || bLabel.handles.length !== 1) return "";
  const key = matchupKey(aLabel.handles[0], bLabel.handles[0]);
  const matchup = key ? matchupResults.get(key) : null;
  if (matchup && matchup.winner) {
    const topWins = normalizeHandle(aLabel.handles[0]) === matchup.winner;
    if (forTop) return topWins ? "win" : "loss";
    return topWins ? "loss" : "win";
  }

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

function renderSide(entries, sideClass, displayScoreMap, resultScoreMap, matchupResults) {
  const seedMap = buildSeedMap(entries);
  const emptyLabel = { main: "", sub: "", handles: [] };
  const roundOneScoreMap = resultScoreMap && resultScoreMap.size ? resultScoreMap : new Map();
  const advanceScoreMap = displayScoreMap && displayScoreMap.size ? displayScoreMap : roundOneScoreMap;
  const roundThreeScoreMap = displayScoreMap && displayScoreMap.size ? displayScoreMap : new Map();

  const r1Matches = BRACKET_PAIRS.map((pair) => {
    const rawTop = resolvePlayerLabel(seedMap.get(pair[0]) || "");
    const rawBottom = resolvePlayerLabel(seedMap.get(pair[1]) || "");
    const top = collapseMatchupToWinner(rawTop, resultScoreMap);
    const bottom = collapseMatchupToWinner(rawBottom, resultScoreMap);
    return { top, bottom, topSeed: pair[0], bottomSeed: pair[1] };
  });

  const firstRound = r1Matches
    .map((m, index) => {
      const topStatus = slotResultStatus(m.top, m.bottom, resultScoreMap, matchupResults, true);
      const bottomStatus = slotResultStatus(m.top, m.bottom, resultScoreMap, matchupResults, false);
      return renderGame(
        m.topSeed,
        m.top,
        m.bottomSeed,
        m.bottom,
        `round-one ${sideClass}`,
        1 + index * 2,
        roundOneScoreMap,
        topStatus,
        bottomStatus
      );
    })
    .join("");

  const r2Winners = [
    labelForWinner(r1Matches[0].top, r1Matches[0].bottom, resultScoreMap, matchupResults),
    labelForWinner(r1Matches[1].top, r1Matches[1].bottom, resultScoreMap, matchupResults),
    labelForWinner(r1Matches[2].top, r1Matches[2].bottom, resultScoreMap, matchupResults),
    labelForWinner(r1Matches[3].top, r1Matches[3].bottom, resultScoreMap, matchupResults),
    labelForWinner(r1Matches[4].top, r1Matches[4].bottom, resultScoreMap, matchupResults),
    labelForWinner(r1Matches[5].top, r1Matches[5].bottom, resultScoreMap, matchupResults),
    labelForWinner(r1Matches[6].top, r1Matches[6].bottom, resultScoreMap, matchupResults),
    labelForWinner(r1Matches[7].top, r1Matches[7].bottom, resultScoreMap, matchupResults),
  ];

  const secondRound = R2_ROWS.map((row, idx) => {
    const top = r2Winners[idx * 2] || emptyLabel;
    const bottom = r2Winners[idx * 2 + 1] || emptyLabel;
    const topStatus = slotResultStatus(top, bottom, advanceScoreMap, matchupResults, true);
    const bottomStatus = slotResultStatus(top, bottom, advanceScoreMap, matchupResults, false);
    return renderGame(
      "",
      top,
      "",
      bottom,
      `round-two ${sideClass}`,
      row,
      advanceScoreMap,
      topStatus,
      bottomStatus
    );
  }).join("");

  const s16Winners = [
    labelForWinner(r2Winners[0], r2Winners[1], advanceScoreMap, matchupResults),
    labelForWinner(r2Winners[2], r2Winners[3], advanceScoreMap, matchupResults),
    labelForWinner(r2Winners[4], r2Winners[5], advanceScoreMap, matchupResults),
    labelForWinner(r2Winners[6], r2Winners[7], advanceScoreMap, matchupResults),
  ];

  const sweet16 = S16_ROWS.map((row, idx) => {
    const top = s16Winners[idx * 2] || emptyLabel;
    const bottom = s16Winners[idx * 2 + 1] || emptyLabel;
    const topStatus = slotResultStatus(top, bottom, roundThreeScoreMap, matchupResults, true);
    const bottomStatus = slotResultStatus(top, bottom, roundThreeScoreMap, matchupResults, false);
    return renderGame(
      "",
      top,
      "",
      bottom,
      `sweet-sixteen ${sideClass}`,
      row,
      roundThreeScoreMap,
      topStatus,
      bottomStatus
    );
  }).join("");

  const sideChamp = emptyLabel;

  return {
    html: `${firstRound}${secondRound}${sweet16}`,
    champion: sideChamp && sideChamp.main ? sideChamp : emptyLabel,
  };
}

function renderFinals(scoreMap, eastChamp, westChamp) {
  return `
    ${renderPlaceholder(eastChamp, westChamp, "championship", 8, scoreMap)}
  `;
}

function render() {
  const bracket = document.getElementById("madness-bracket");
  const playins = document.getElementById("madness-playins");
  const lastUpdated = document.getElementById("last-updated");

  const displayScoreMap = getActiveScoreMap();
  const resultScoreMap = getResultScoreMap();
  const matchupResults = liveState.completedMatchups || new Map();

  if (lastUpdated) {
    const formatted = new Date().toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const suffix = liveState.frozenMap && liveState.frozenMap.size
      ? " • Frozen 6:55 PM ET"
      : liveState.loaded
        ? " • Live Synced"
        : "";

    lastUpdated.textContent = `Last updated: ${formatted}${suffix}`;
  }

  if (bracket) {
    const east = renderSide(EAST_BRACKET, "left", displayScoreMap, resultScoreMap, matchupResults);
    const west = renderSide(WEST_BRACKET, "right", displayScoreMap, resultScoreMap, matchupResults);

    bracket.innerHTML = `
      <div class="madness-board-list">
        <section class="madness-region-board">
          <div class="madness-grid-wrap">
            <div class="madness-combined-board">
              <div class="madness-side-label left">East</div>
              <div class="madness-side-label right">West</div>
              ${east.html}
              ${west.html}
              ${renderFinals(displayScoreMap, east.champion, west.champion)}
            </div>
          </div>
        </section>
      </div>
    `;
  }

  if (playins) {
    playins.innerHTML = PLAY_INS.map(
      (series) => {
        const leftLabel = {
          main: series.players[0],
          sub: "",
          handles: [normalizeHandle(series.players[0])],
        };
        const rightLabel = {
          main: series.players[1],
          sub: "",
          handles: [normalizeHandle(series.players[1])],
        };
        const winner = labelForWinner(leftLabel, rightLabel, resultScoreMap, matchupResults);
        return `
        <div class="madness-playin-card">
          <div class="madness-playin-body">
            <span>${winner.main ? escapeHtml(winner.main) : "TBD"}</span>
          </div>
        </div>
      `;
      }
    ).join("");
  }
}

async function loadLiveScores() {
  const frozen = readFrozenScoreMap();
  if (frozen && frozen.size) {
    liveState.frozenMap = frozen;
    liveState.loaded = true;
    render();
    return;
  }

  try {
    const [liveResponse, completedResponse] = await Promise.all([
      fetch(LIVE_BRACKET_CSV_URL, { cache: "no-store" }),
      fetch(COMPLETED_BRACKET_CSV_URL, { cache: "no-store" }),
    ]);
    if (!liveResponse.ok) throw new Error(`live ${liveResponse.status}`);

    const liveText = await liveResponse.text();
    const liveRows = parseCSV(liveText);
    liveState.scoreMap = extractScoreMap(liveRows);

    if (completedResponse.ok) {
      const completedText = await completedResponse.text();
      const completedRows = parseCSV(completedText);
      liveState.completedScoreMap = extractScoreMap(completedRows);
      liveState.completedMatchups = extractCompletedMatchups(completedRows);
    } else {
      liveState.completedScoreMap = new Map();
      liveState.completedMatchups = new Map();
    }

    const persisted = maybePersistFrozenScoreMap(liveState.scoreMap);
    if (persisted && persisted.size) {
      liveState.frozenMap = new Map(persisted);
    }

    liveState.loaded = true;
  } catch (_error) {
    liveState.scoreMap = new Map();
    liveState.completedScoreMap = new Map();
    liveState.completedMatchups = new Map();
    liveState.loaded = false;
  }

  render();
}

loadLiveScores();
setInterval(loadLiveScores, LIVE_REFRESH_MS);
