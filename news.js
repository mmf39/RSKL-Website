const NEWS_FEED_URL = "/assets/data/news.json";

const els = {
  lastUpdated: document.getElementById("last-updated"),
  filter: document.getElementById("news-filter"),
  feed: document.getElementById("news-feed"),
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function displayTeamName(value) {
  const name = String(value || "").trim();
  if (name === "Bullets") return "Storm";
  if (name === "Yetis") return "MayeDay";
  if (name === "The Future") return "Dream Team";
  if (name === "Avengers") return "Karma Avengers";
  if (name === "Currents") return "The Currents";
  if (name === "Bolts") return "The Bolts";
  if (name === "Doggy N em") return "Doggy N Em";
  if (name === "Wrangler") return "Wranglers";
  return name;
}

function getTeamLogoSrc(name) {
  const shown = displayTeamName(name);
  if (shown === "Dream Team") return "/assets/dream-team.jpg";
  if (shown === "The Lions") return "/assets/the-lions.png";
  if (shown === "The Snipers") return "/assets/the-snipers.png";
  if (shown === "The Phantoms") return "/assets/the-phantoms.png";
  if (shown === "MayeDay") return "/assets/mayeday.jpg";
  if (shown === "Cobras") return "/assets/cobras.png";
  if (shown === "Karma Avengers") return "/assets/karma-avengers.png";
  if (shown === "Mafia") return "/assets/mafia.png";
  if (shown === "Mets" || shown === "The Mets") return "/assets/mets.png";
  if (shown === "Phoenix" || shown === "The Phoenix") return "/assets/phoenix.png";
  if (shown === "Thunderhawks") return "/assets/thunderhawks.png";
  if (shown === "The Currents") return "/assets/the-currents.png";
  if (shown === "Whatsgrass") return "/assets/whatsgrass.png";
  if (shown === "Wolves") return "/assets/wolves.png";
  if (shown === "Zombies") return "/assets/zombies.png";
  if (shown === "Chicken Nuggets") return "/assets/chicken-nuggets.jpg";
  if (shown === "Masdog N Em" || shown === "Richer N Em" || shown === "Gus N Em") return "/assets/gus-n-em.png";
  if (shown === "Cheerios") return "/assets/cheerios.png";
  if (shown === "Illegals") return "/assets/illegals.png";
  if (shown === "Storm") return "/assets/storm.png";
  if (shown === "Turkeys") return "/assets/turkeys.png";
  return "";
}

function renderSmallTeamLogo(name) {
  const src = getTeamLogoSrc(name);
  if (!src) return "";
  return `<img class="standings-logo" src="${src}" alt="${escapeHtml(displayTeamName(name))} logo" />`;
}

function buildStateCard(title, body) {
  return `<div class="dashboard-state-card"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(body)}</span></div>`;
}

function formatTimestamp(value) {
  const parsed = Date.parse(String(value || ""));
  if (Number.isNaN(parsed)) return "Scheduled";
  return new Date(parsed).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatKind(value) {
  if (value === "preview") return "Game Day Preview";
  if (value === "recap") return "Game Recap";
  if (value === "transaction") return "Transaction Wire";
  return "League News";
}

let allItems = [];

function renderFeed() {
  if (!els.feed) return;
  const filter = String(els.filter?.value || "all");
  const items = filter === "all" ? allItems : allItems.filter((item) => item.kind === filter);
  if (!items.length) {
    els.feed.innerHTML = buildStateCard("No Stories", "No stories match that filter yet.");
    return;
  }

  els.feed.innerHTML = items
    .map((item) => {
      const teams = Array.isArray(item.teams) ? item.teams.filter(Boolean) : [];
      const bullets = Array.isArray(item.bullets) ? item.bullets : [];
      return `
        <article class="news-card news-kind-${escapeHtml(item.kind || "news")}">
          <div class="news-card-head">
            <span class="dashboard-news-kind">${escapeHtml(formatKind(item.kind))}</span>
            <span class="dashboard-news-time">${escapeHtml(formatTimestamp(item.publishedAt))}</span>
          </div>
          <h2 class="news-card-title">${escapeHtml(item.title || "League News")}</h2>
          <p class="news-card-summary">${escapeHtml(item.summary || item.dek || "")}</p>
          ${
            teams.length
              ? `<div class="dashboard-news-teams">${teams
                  .map(
                    (team) =>
                      `<a class="dashboard-news-team" href="/team.html?team=${encodeURIComponent(team)}">${renderSmallTeamLogo(team)}<span>${escapeHtml(team)}</span></a>`
                  )
                  .join("")}</div>`
              : ""
          }
          ${
            bullets.length
              ? `<div class="dashboard-news-bullets">${bullets
                  .map((bullet) => `<div class="dashboard-news-bullet">${escapeHtml(bullet)}</div>`)
                  .join("")}</div>`
              : ""
          }
        </article>
      `;
    })
    .join("");
}

async function loadNewsFeed() {
  if (els.feed) {
    els.feed.innerHTML = buildStateCard("Loading News", "Pulling the latest AI-written league coverage.");
  }
  try {
    const response = await fetch(`${NEWS_FEED_URL}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    const payload = await response.json();
    allItems = Array.isArray(payload?.items) ? payload.items : [];
    if (els.lastUpdated) {
      const stamp = payload?.updatedAt ? formatTimestamp(payload.updatedAt) : formatTimestamp(new Date().toISOString());
      els.lastUpdated.textContent = `Last updated: ${stamp}`;
    }
    renderFeed();
  } catch (error) {
    if (els.feed) {
      els.feed.innerHTML = buildStateCard("News Unavailable", "The news feed could not be loaded right now.");
    }
  }
}

if (els.filter) {
  els.filter.addEventListener("change", renderFeed);
}

loadNewsFeed();
