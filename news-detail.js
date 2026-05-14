const NEWS_FEED_URL = "/assets/data/news.json";

const els = {
  lastUpdated: document.getElementById("last-updated"),
  detail: document.getElementById("news-detail"),
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
  if (name === "Yetis") return "Scorpions";
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
  if (shown === "Scorpions") return "/assets/mayeday.jpg";
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
  if (value === "preview") return "Preview";
  if (value === "recap") return "Recap";
  if (value === "transaction") return "Transactions";
  return "League News";
}

async function loadStory() {
  if (!els.detail) return;
  const storyId = new URLSearchParams(window.location.search).get("id");
  if (!storyId) {
    els.detail.innerHTML = buildStateCard("Story Missing", "This news story does not have a valid id.");
    return;
  }

  try {
    const response = await fetch(`${NEWS_FEED_URL}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }
    const payload = await response.json();
    const items = Array.isArray(payload?.items) ? payload.items : [];
    const story = items.find((item) => String(item.id || "") === storyId);
    if (!story) {
      els.detail.innerHTML = buildStateCard("Story Not Found", "That news story is no longer available in the feed.");
      return;
    }

    if (els.lastUpdated) {
      els.lastUpdated.textContent = `Last updated: ${formatTimestamp(payload?.updatedAt || story.publishedAt)}`;
    }

    const teams = Array.isArray(story.teams) ? story.teams.filter(Boolean) : [];
    const bullets = Array.isArray(story.bullets) ? story.bullets : [];

    els.detail.innerHTML = `
      <article class="news-story news-kind-${escapeHtml(story.kind || "news")}">
        <div class="news-story-head">
          <span class="dashboard-news-kind">${escapeHtml(formatKind(story.kind))}</span>
          <span class="dashboard-news-time">${escapeHtml(formatTimestamp(story.publishedAt))}</span>
        </div>
        <h1 class="news-story-title">${escapeHtml(story.title || "League News")}</h1>
        <p class="news-story-summary">${escapeHtml(story.summary || "")}</p>
        ${
          bullets.length
            ? `<div class="news-story-bullets">${bullets
                .map((bullet) => `<div class="dashboard-news-bullet">${escapeHtml(bullet)}</div>`)
                .join("")}</div>`
            : ""
        }
        ${
          teams.length
            ? `<div class="news-story-teams">${teams
                .map(
                  (team) =>
                    `<a class="dashboard-news-team" href="/team.html?team=${encodeURIComponent(team)}">${renderSmallTeamLogo(team)}<span>${escapeHtml(team)}</span></a>`
                )
                .join("")}</div>`
            : ""
        }
        <div class="news-story-actions">
          <a class="btn ghost" href="/news.html">Back to News</a>
        </div>
      </article>
    `;
  } catch (error) {
    els.detail.innerHTML = buildStateCard("Story Unavailable", "The news story could not be loaded right now.");
  }
}

loadStory();
