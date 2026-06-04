const ARTICLE_API = "/api/articles";
const articleView = document.getElementById("article-view");

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
    .map((part) => `<p>${escapeHtml(part).replace(/\n/g, "<br>")}</p>`)
    .join("");

  articleView.innerHTML = `
    <article class="article-full">
      <div class="dashboard-news-meta article-full-meta">
        ${date ? `<span>${escapeHtml(date)}</span>` : ""}
        ${author ? `<span>${escapeHtml(author)}</span>` : ""}
      </div>
      <h2>${escapeHtml(title)}</h2>
      <div class="article-full-body">${paragraphs || "<p>No article text.</p>"}</div>
    </article>
  `;
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
