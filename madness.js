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

const ROUND_HEADERS = [
  { name: "First Round", dates: "3/19-3/20" },
  { name: "Second Round", dates: "3/21-3/22" },
  { name: "Sweet 16", dates: "3/26-3/27" },
  { name: "Elite Eight", dates: "3/28-3/29" },
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolvePlayerLabel(player) {
  const raw = String(player || "").trim();
  const match = raw.match(/^W\s*P(\d+)$/i);
  if (!match) {
    return { main: raw, sub: "" };
  }
  const playInId = `P${match[1]}`;
  const players = PLAY_IN_MAP[playInId];
  if (!players || players.length < 2) {
    return { main: raw, sub: "" };
  }
  return {
    main: `W ${playInId}`,
    sub: `${players[0]} vs ${players[1]}`,
  };
}

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

function buildSeedMap(entries) {
  const map = new Map();
  entries.forEach((entry) => {
    map.set(entry.seed, entry.player);
  });
  return map;
}

function renderMatch(seedMap, topSeed, bottomSeed, roundClass, row) {
  const topPlayer = resolvePlayerLabel(seedMap.get(topSeed) || "");
  const bottomPlayer = resolvePlayerLabel(seedMap.get(bottomSeed) || "");
  return `
    <article class="madness-game ${roundClass}" style="--row:${row};">
      <div class="madness-game-slot">
        <span class="madness-seed">${topSeed}</span>
        <span class="madness-player">
          <span class="madness-player-main">${escapeHtml(topPlayer.main)}</span>
          ${topPlayer.sub ? `<small class="madness-player-sub">${escapeHtml(topPlayer.sub)}</small>` : ""}
        </span>
      </div>
      <div class="madness-game-slot">
        <span class="madness-seed">${bottomSeed}</span>
        <span class="madness-player">
          <span class="madness-player-main">${escapeHtml(bottomPlayer.main)}</span>
          ${bottomPlayer.sub ? `<small class="madness-player-sub">${escapeHtml(bottomPlayer.sub)}</small>` : ""}
        </span>
      </div>
    </article>
  `;
}

function renderRegion(title, entries) {
  const seedMap = buildSeedMap(entries);
  const firstRound = BRACKET_PAIRS.map((pair, index) =>
    renderMatch(seedMap, pair[0], pair[1], "round-one", 1 + index * 2)
  ).join("");

  const secondRound = R2_ROWS.map(
    (row, idx) => `
      <article class="madness-game round-two placeholder" style="--row:${row};">
        <div class="madness-game-slot"><span class="madness-player">Winner ${idx * 2 + 1}</span></div>
        <div class="madness-game-slot"><span class="madness-player">Winner ${idx * 2 + 2}</span></div>
      </article>
    `
  ).join("");

  const sweet16 = S16_ROWS.map(
    (row, idx) => `
      <article class="madness-game sweet-sixteen placeholder" style="--row:${row};">
        <div class="madness-game-slot"><span class="madness-player">Winner ${idx * 2 + 1}</span></div>
        <div class="madness-game-slot"><span class="madness-player">Winner ${idx * 2 + 2}</span></div>
      </article>
    `
  ).join("");

  const elite8 = E8_ROWS.map(
    (row) => `
      <article class="madness-game elite-eight placeholder" style="--row:${row};">
        <div class="madness-game-slot"><span class="madness-player">Regional Finalist A</span></div>
        <div class="madness-game-slot"><span class="madness-player">Regional Finalist B</span></div>
      </article>
    `
  ).join("");

  return `
    <section class="madness-region-board">
      <h3 class="madness-region-title">${escapeHtml(title)}</h3>
      <div class="madness-round-headers">
        ${ROUND_HEADERS.map(
          (round) => `
            <div class="madness-round-header">
              <span>${escapeHtml(round.name)}</span>
              <small>${escapeHtml(round.dates)}</small>
            </div>
          `
        ).join("")}
      </div>
      <div class="madness-grid-wrap">
        <div class="madness-grid">
          ${firstRound}
          ${secondRound}
          ${sweet16}
          ${elite8}
        </div>
      </div>
    </section>
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
    lastUpdated.textContent = `Last updated: ${formatted}`;
  }

  if (bracket) {
    bracket.innerHTML = `
      <div class="madness-board-list">
        ${renderRegion("East", EAST_BRACKET)}
        ${renderRegion("West", WEST_BRACKET)}
      </div>
    `;
  }

  if (playins) {
    playins.innerHTML = PLAY_INS.map(
      (series) => `
        <div class="madness-playin-card">
          <div class="madness-playin-title">${escapeHtml(series.id)}</div>
          <div class="madness-playin-body">
            <span>${escapeHtml(series.players[0])}</span>
            <span class="madness-vs">vs</span>
            <span>${escapeHtml(series.players[1])}</span>
          </div>
        </div>
      `
    ).join("");
  }
}

render();
