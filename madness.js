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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderSide(title, entries) {
  return `
    <div class="madness-side">
      <h3>${escapeHtml(title)}</h3>
      <div class="madness-list">
        ${entries
          .map(
            (entry) => `
          <div class="madness-seed-row">
            <span class="madness-seed">${entry.seed}</span>
            <span class="madness-player">${escapeHtml(entry.player)}</span>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
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
      ${renderSide("East", EAST_BRACKET)}
      ${renderSide("West", WEST_BRACKET)}
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
