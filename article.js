const ARTICLE_API = "/api/articles";
const PLAYER_PROFILE_URL = "/api/player-profile";
const articleView = document.getElementById("article-view");
const mentionAvatarCache = new Map();
const ARTICLE_TEAMS = [
  { name: "Gus N Em", logo: "/assets/gus-n-em.png", aliases: ["Gus N Em", "Masdog N Em", "Richer N Em"] },
  { name: "Bad Bois", logo: "https://media.realapp.com/assets/user/default/large/4JZRj4DJ_29132497.webp", aliases: ["Bad Bois"] },
  { name: "Storm", logo: "/assets/storm.png", aliases: ["Storm", "Bullets"] },
  { name: "Turkeys", logo: "/assets/turkeys.png", aliases: ["Turkeys"] },
  { name: "Illegals", logo: "/assets/illegals.png", aliases: ["Illegals"] },
  { name: "The Lions", logo: "/assets/the-lions.png", aliases: ["The Lions", "Lions"] },
  { name: "Dream Team", logo: "/assets/dream-team.jpg", aliases: ["Dream Team", "The Future"] },
  { name: "The Snipers", logo: "/assets/the-snipers.png", aliases: ["The Snipers", "Snipers"] },
  { name: "The Phantoms", logo: "/assets/the-phantoms.png", aliases: ["The Phantoms", "Phantoms"] },
  { name: "Scorpions", logo: "/assets/mayeday.jpg", aliases: ["Scorpions", "Yetis", "Scorpians"] },
  { name: "Cobras", logo: "/assets/cobras.png", aliases: ["Cobras"] },
  { name: "Karma Avengers", logo: "/assets/karma-avengers.png", aliases: ["Karma Avengers", "Avengers"] },
  { name: "Mafia", logo: "/assets/mafia.png", aliases: ["Mafia"] },
  { name: "Mets", logo: "/assets/mets.png", aliases: ["Mets", "The Mets"] },
  { name: "Phoenix", logo: "/assets/phoenix.png", aliases: ["Phoenix", "The Phoenix"] },
  { name: "Thunderhawks", logo: "/assets/thunderhawks.png", aliases: ["Thunderhawks"] },
  { name: "The Currents", logo: "/assets/the-currents.png", aliases: ["The Currents", "Currents"] },
  { name: "Whatsgrass", logo: "/assets/whatsgrass.png", aliases: ["Whatsgrass"] },
  { name: "Wolves", logo: "/assets/wolves.png", aliases: ["Wolves"] },
  { name: "Zombies", logo: "/assets/zombies.png", aliases: ["Zombies"] },
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatArticleDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeMention(value) {
  return String(value || "").trim().replace(/^@/, "").toLowerCase();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findMentionedArticleTeams(article) {
  const text = [article?.title, article?.summary, article?.body].filter(Boolean).join(" ");
  if (!text.trim()) return [];
  return ARTICLE_TEAMS.filter((team) =>
    team.aliases.some((alias) => new RegExp(`(^|[^a-z0-9])${escapeRegExp(alias)}([^a-z0-9]|$)`, "i").test(text))
  );
}

function renderArticleTeamLogos(article) {
  const teams = findMentionedArticleTeams(article);
  if (!teams.length) return "";
  return `
    <div class="article-team-logos" aria-label="Teams mentioned">
      ${teams
        .map(
          (team) => `
            <a class="article-team-logo-link" href="/team.html?team=${encodeURIComponent(team.name)}" title="${escapeHtml(team.name)}">
              <img class="article-team-logo" src="${escapeHtml(team.logo)}" alt="${escapeHtml(team.name)} logo" loading="lazy" />
            </a>
          `
        )
        .join("")}
    </div>
  `;
}

function findProfileImageUrl(value, depth = 0) {
  if (!value || depth > 4) return "";
  if (typeof value === "string") {
    const clean = value.trim();
    return /^https?:\/\//i.test(clean) || clean.startsWith("data:image/") ? clean : "";
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = findProfileImageUrl(item, depth + 1);
      if (nested) return nested;
    }
    return "";
  }
  if (typeof value !== "object") return "";

  const preferredKeys = [
    "photoUrl",
    "photoURL",
    "photo_url",
    "profilePhoto",
    "profilePhotoUrl",
    "profile_photo",
    "profile_photo_url",
    "profilePicture",
    "profilePictureUrl",
    "profile_picture",
    "profile_picture_url",
    "avatar",
    "avatarUrl",
    "avatar_url",
    "image",
    "imageUrl",
    "image_url",
    "headshot",
    "headshotUrl",
    "headshot_url",
    "picture",
    "pictureUrl",
    "picture_url",
    "pfp",
  ];

  for (const key of preferredKeys) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      const direct = findProfileImageUrl(value[key], depth + 1);
      if (direct) return direct;
    }
  }

  for (const item of Object.values(value)) {
    const nested = findProfileImageUrl(item, depth + 1);
    if (nested) return nested;
  }
  return "";
}

function renderArticleText(value) {
  const text = String(value || "");
  const mentionRegex = /(^|[^\w@])(@[A-Za-z0-9_.-]+)/g;
  let html = "";
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text))) {
    const prefix = match[1] || "";
    const mention = match[2] || "";
    const mentionStart = match.index + prefix.length;
    html += escapeHtml(text.slice(lastIndex, mentionStart));
    const cleanMention = mention.replace(/[.,!?;:]+$/g, "");
    const trailing = mention.slice(cleanMention.length);
    const key = normalizeMention(cleanMention);
    html += `<a class="article-mention article-mention--empty" href="/player-detail.html?player=${encodeURIComponent(cleanMention)}" data-article-mention="${escapeHtml(key)}"><img class="article-mention-avatar" alt="" loading="lazy" /><span>${escapeHtml(cleanMention)}</span></a>${escapeHtml(trailing)}`;
    lastIndex = mentionStart + mention.length;
  }

  html += escapeHtml(text.slice(lastIndex));
  return html.replace(/\n/g, "<br>");
}

async function fetchMentionAvatar(mention) {
  const key = normalizeMention(mention);
  if (!key) return "";
  if (mentionAvatarCache.has(key)) return mentionAvatarCache.get(key) || "";
  try {
    const player = mention.startsWith("@") ? mention : `@${mention}`;
    const response = await fetch(`${PLAYER_PROFILE_URL}?player=${encodeURIComponent(player)}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    const payload = await response.json();
    const url = findProfileImageUrl(payload);
    mentionAvatarCache.set(key, url || "");
    return url || "";
  } catch (_error) {
    mentionAvatarCache.set(key, "");
    return "";
  }
}

async function hydrateArticleMentions() {
  const mentions = Array.from(document.querySelectorAll("[data-article-mention]"));
  const unique = Array.from(new Set(mentions.map((node) => node.dataset.articleMention || "").filter(Boolean)));
  await Promise.all(
    unique.map(async (key) => {
      const url = await fetchMentionAvatar(key);
      if (!url) return;
      document.querySelectorAll(`[data-article-mention="${CSS.escape(key)}"]`).forEach((node) => {
        const img = node.querySelector(".article-mention-avatar");
        if (!img) return;
        img.src = url;
        node.classList.remove("article-mention--empty");
      });
    })
  );
}

function renderArticle(article) {
  if (!articleView) return;
  if (!article) {
    articleView.innerHTML = '<div class="dashboard-state-card">Article not found.</div>';
    return;
  }
  const title = String(article.title || "Untitled Article").trim();
  const rawAuthor = String(article.author || "").trim();
  const author = rawAuthor.toLowerCase() === "commissioner" ? "" : rawAuthor;
  const date = formatArticleDate(article.created_at || article.updated_at);
  const body = String(article.body || "").trim();
  const paragraphs = body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p>${renderArticleText(part)}</p>`)
    .join("");

  articleView.innerHTML = `
    <article class="article-full">
      <div class="dashboard-news-meta article-full-meta">
        ${date ? `<span>${escapeHtml(date)}</span>` : ""}
        ${author ? `<span>${escapeHtml(author)}</span>` : ""}
      </div>
      ${renderArticleTeamLogos(article)}
      <h2>${escapeHtml(title)}</h2>
      <div class="article-full-body">${paragraphs || "<p>No article text.</p>"}</div>
    </article>
  `;
  hydrateArticleMentions();
}

async function loadArticle() {
  const id = new URLSearchParams(window.location.search).get("id") || "";
  if (!id) {
    renderArticle(null);
    return;
  }
  try {
    const response = await fetch(`${ARTICLE_API}?id=${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    const payload = await response.json();
    renderArticle(Array.isArray(payload.articles) ? payload.articles[0] : null);
  } catch (_error) {
    if (articleView) {
      articleView.innerHTML = '<div class="dashboard-state-card">Article could not be loaded.</div>';
    }
  }
}

loadArticle();
