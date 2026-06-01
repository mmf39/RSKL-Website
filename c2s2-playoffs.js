const PLAYOFF_BRACKET = [
  {
    title: "Wild Card Round",
    matchups: [
      {
        game: "Game 1",
        top: { seed: 3, team: "The Phantoms", score: 0 },
        bottom: { seed: 6, team: "Bad Bois", score: 1 },
      },
      {
        game: "Game 2",
        top: { seed: 4, team: "Gus N Em", score: 1 },
        bottom: { seed: 5, team: "Illegals", score: 0 },
      },
    ],
  },
  {
    title: "Semi Finals",
    matchups: [
      {
        game: "Game 3",
        top: { seed: 1, team: "Turkeys", score: 2 },
        bottom: { seed: 6, team: "Bad Bois", score: 0 },
      },
      {
        game: "Game 4",
        top: { seed: 2, team: "The Lions", score: 1 },
        bottom: { seed: 4, team: "Gus N Em", score: 2 },
      },
    ],
  },
  {
    title: "Finals",
    matchups: [
      {
        game: "Game 5",
        top: { seed: 1, team: "Turkeys", score: 0 },
        bottom: { seed: 4, team: "Gus N Em", score: 3 },
      },
    ],
  },
];

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderTeamLine(entry, isWinner) {
  return `
    <div style="display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid rgba(255,140,26,.22);${isWinner ? "color:#38e08d;font-weight:800;" : ""}">
      <span>#${escapeHtml(entry.seed)} ${escapeHtml(entry.team)}</span>
      <strong>${escapeHtml(entry.score)}</strong>
    </div>
  `;
}

function renderBracket() {
  const container = document.getElementById("madness-bracket");
  if (!container) return;

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;align-items:start;">
      ${PLAYOFF_BRACKET.map(
        (round) => `
          <section style="border:1px solid rgba(255,140,26,.45);border-radius:16px;padding:16px;background:rgba(10,28,65,.55);">
            <h3 style="margin:0 0 14px;color:#ffb347;font-size:1.1rem;">${escapeHtml(round.title)}</h3>
            <div style="display:grid;gap:14px;">
              ${round.matchups
                .map((matchup) => {
                  const topWins = matchup.top.score > matchup.bottom.score;
                  const bottomWins = matchup.bottom.score > matchup.top.score;
                  return `
                    <article style="border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px;background:rgba(255,255,255,.03);">
                      <div style="font-weight:700;color:#ffd28d;margin-bottom:6px;">${escapeHtml(matchup.game)}</div>
                      ${renderTeamLine(matchup.top, topWins)}
                      ${renderTeamLine(matchup.bottom, bottomWins)}
                    </article>
                  `;
                })
                .join("")}
            </div>
          </section>
        `
      ).join("")}
    </div>
    <section style="margin-top:16px;border:1px solid rgba(56,224,141,.35);border-radius:16px;padding:16px;background:rgba(56,224,141,.08);">
      <div style="font-size:.85rem;letter-spacing:.08em;text-transform:uppercase;color:#9edfbf;">Champion</div>
      <div style="margin-top:6px;font-size:1.45rem;font-weight:800;color:#38e08d;">#4 Gus N Em</div>
      <div style="margin-top:4px;color:#d9e7ff;">Defeated #1 Turkeys, 3-0, in the finals.</div>
    </section>
  `;
}

function renderLastUpdated() {
  const lastUpdated = document.getElementById("last-updated");
  if (!lastUpdated) return;
  const now = new Date();
  lastUpdated.textContent = `Last updated: ${now.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

renderBracket();
renderLastUpdated();
