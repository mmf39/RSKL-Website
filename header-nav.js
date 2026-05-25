(() => {
  const SUPABASE_CONFIG_URL = "/api/supabase-config";
  const RISING_STARS_HANDLES = new Set([
    "fullofopps",
    "xyz",
    "jd3",
    "vampire",
    "florida_sportsfan",
    "osboti",
  ]);
  const ROOKIE_SEASON_ORDER = [
    "c1s2-regular",
    "c1s3-regular",
    "c1s4-regular",
    "c1s5-regular",
    "c1s6-regular",
    "c2s1-regular",
    "c2s2-regular",
    "c2s3-regular",
  ];
  const ROOKIE_DRAFT_SOURCES = {
    "c1s2-regular": { url: "/assets/data/c1s2-draft.csv" },
    "c1s3-regular": { url: "/assets/data/c1s3-draft.csv" },
    "c1s4-regular": { url: "/assets/data/c1s4-draft.csv" },
    "c1s5-regular": { url: "/assets/data/c1s5-draft.csv" },
    "c1s6-regular": { url: "/assets/data/c1s6-draft.csv" },
    "c2s1-regular": { url: "/api/sheet?name=archive", ranges: ["A120:C175"] },
    "c2s2-regular": {
      url: "/api/sheet?name=draft",
      ranges: ["A1:C11", "A12:C22", "A23:C33", "A34:C44"],
    },
    "c2s3-regular": {
      url: "/api/sheet?name=draft",
      ranges: ["A1:C10", "A12:C21"],
    },
  };
  const rookieCache = new Map();
  const playerPhotoCache = new Map();
  let supabaseUrl = "";
  let supabaseAnon = "";
  let supabaseConfigPromise = null;
  let playerPhotoCachePromise = null;

  const normalize = (value) =>
    String(value || "").trim().replace(/^@/, "").toLowerCase();

  function ensureAvatarStyles() {
    if (document.getElementById("rskl-player-avatar-style")) return;
    const style = document.createElement("style");
    style.id = "rskl-player-avatar-style";
    style.textContent = `
      .rskl-player-link--with-avatar {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        flex-direction: row;
        flex-wrap: nowrap;
        vertical-align: middle;
        line-height: 1;
      }
      .rskl-player-link__avatar {
        width: 26px;
        height: 26px;
        flex: 0 0 26px;
        border-radius: 50%;
        overflow: hidden;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.08);
      }
      .rskl-player-link__avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .rskl-player-link__label {
        min-width: 0;
        display: inline-flex;
        align-items: center;
        white-space: nowrap;
      }
      .dashboard-leader-card .rskl-player-link--with-avatar {
        display: inline-flex;
        width: max-content;
        max-width: 100%;
        gap: 10px;
        white-space: nowrap;
      }
      .dashboard-leader-card .rskl-player-link__avatar {
        width: 32px;
        height: 32px;
        flex: 0 0 32px;
      }
      .team-page .roster-link.rskl-player-link--with-avatar {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        width: max-content;
        max-width: 100%;
        line-height: 1;
      }
      .team-page .roster-link .rskl-player-link__avatar {
        width: 42px;
        height: 42px;
        flex: 0 0 42px;
      }
    `;
    document.head.appendChild(style);
  }

  function requireSupabaseConfig() {
    return Boolean(supabaseUrl && supabaseAnon);
  }

  function supabaseHeaders() {
    return {
      apikey: supabaseAnon,
      Authorization: `Bearer ${supabaseAnon}`,
    };
  }

  function supabaseRestUrl(path) {
    return `${supabaseUrl}/rest/v1${path}`;
  }

  async function loadSupabaseConfig() {
    if (!supabaseConfigPromise) {
      supabaseConfigPromise = fetch(SUPABASE_CONFIG_URL, { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((payload) => {
          supabaseUrl = String(payload?.url || payload?.supabaseUrl || "").trim().replace(/\/$/, "");
          supabaseAnon = String(
            payload?.anonKey || payload?.supabaseAnon || payload?.publicAnonKey || ""
          ).trim();
          return requireSupabaseConfig();
        })
        .catch(() => false);
    }
    return supabaseConfigPromise;
  }

  async function loadPlayerPhotoCache() {
    if (!playerPhotoCachePromise) {
      playerPhotoCachePromise = loadSupabaseConfig()
        .then(async (hasSupabase) => {
          if (!hasSupabase) return playerPhotoCache;
          const response = await fetch(
            supabaseRestUrl("/player_profiles?select=player_tag,photo_url"),
            {
              headers: supabaseHeaders(),
              cache: "no-store",
            }
          );
          if (!response.ok) return playerPhotoCache;
          const rows = await response.json();
          playerPhotoCache.clear();
          (Array.isArray(rows) ? rows : []).forEach((row) => {
            const key = normalize(row?.player_tag);
            const value = String(row?.photo_url || "").trim();
            if (key && value) {
              playerPhotoCache.set(key, value);
            }
          });
          return playerPhotoCache;
        })
        .catch(() => playerPhotoCache);
    }
    return playerPhotoCachePromise;
  }

  function extractPlayerFromHref(href) {
    try {
      const url = new URL(href, window.location.origin);
      if (!/player-detail\.html$/i.test(url.pathname)) return "";
      return String(url.searchParams.get("player") || "").trim();
    } catch (_) {
      return "";
    }
  }

  function shouldSkipAvatar(link) {
    return Boolean(
      !link ||
        link.dataset.playerAvatarEnhanced === "true" ||
        link.querySelector(".player-avatar-inline, .rskl-player-link__avatar") ||
        link.closest(".leader-name--player") ||
        link.closest(".player-detail-hero-copy")
    );
  }

  function injectAvatarIntoLink(link, photoUrl) {
    if (!link || !photoUrl || shouldSkipAvatar(link)) return;
    ensureAvatarStyles();
    const label = document.createElement("span");
    label.className = "rskl-player-link__label";
    while (link.firstChild) {
      label.appendChild(link.firstChild);
    }
    const avatar = document.createElement("span");
    avatar.className = "rskl-player-link__avatar";
    avatar.setAttribute("aria-hidden", "true");
    const image = document.createElement("img");
    image.src = photoUrl;
    image.alt = "";
    image.loading = "lazy";
    avatar.appendChild(image);
    link.appendChild(avatar);
    link.appendChild(label);
    link.classList.add("rskl-player-link--with-avatar");
    link.dataset.playerAvatarEnhanced = "true";
  }

  function extractSeasonFromHref(href) {
    try {
      const url = new URL(href, window.location.origin);
      return String(url.searchParams.get("season") || "").trim();
    } catch (_) {
      return "";
    }
  }

  function ensureRookieBadge(link) {
    if (!link || link.querySelector(".rookie-mark")) return;
    const player = extractPlayerFromHref(link.getAttribute("href") || "");
    if (!player) return;
    const season = extractSeasonFromHref(link.getAttribute("href") || "");
    if (!isRookie(resolveSeason(season), player)) return;
    const badge = document.createElement("span");
    badge.className = "player-mark rookie-mark";
    badge.title = "Drafted for this season";
    badge.textContent = "R";
    link.appendChild(badge);
  }

  async function enhancePlayerLinks(root = document) {
    const links = Array.from(root.querySelectorAll('a[href*="player-detail.html?player="]'));
    if (!links.length) return;
    links.forEach((link) => {
      ensureRookieBadge(link);
    });
    await loadPlayerPhotoCache();
    links.forEach((link) => {
      const player = extractPlayerFromHref(link.getAttribute("href") || "");
      const photoUrl = playerPhotoCache.get(normalize(player)) || "";
      if (photoUrl) {
        injectAvatarIntoLink(link, photoUrl);
      }
    });
  }

  function observePlayerLinks() {
    if (!document.body) return;
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length) {
          enhancePlayerLinks(document);
          break;
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  const parseCSV = (text) => {
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
  };

  const colToIndex = (letter) => letter.toUpperCase().charCodeAt(0) - 65;

  const parseRange = (range) => {
    const match = String(range || "").match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
    if (!match) return null;
    const [, startCol, startRow, endCol, endRow] = match;
    return {
      startCol: colToIndex(startCol),
      endCol: colToIndex(endCol),
      startRow: Number(startRow) - 1,
      endRow: Number(endRow) - 1,
    };
  };

  const sliceRange = (rows, range) => {
    const parsed = parseRange(range);
    if (!parsed) return [];
    return rows
      .slice(parsed.startRow, parsed.endRow + 1)
      .map((row) => row.slice(parsed.startCol, parsed.endCol + 1));
  };

  const extractDraftedPlayers = (rows) => {
    const players = new Set();
    (rows || []).forEach((row) => {
      (row || []).forEach((cell) => {
        const value = String(cell || "").trim();
        if (value.startsWith("@")) {
          players.add(normalize(value));
        }
      });
    });
    return players;
  };

  async function loadRookieCache() {
    if (rookieCache.size) return rookieCache;
    const entries = await Promise.all(
      ROOKIE_SEASON_ORDER.map(async (seasonKey) => {
        const source = ROOKIE_DRAFT_SOURCES[seasonKey];
        if (!source || !source.url) return [seasonKey, new Set()];
        try {
          const response = await fetch(source.url, { cache: "no-store" });
          if (!response.ok) return [seasonKey, new Set()];
          const rows = parseCSV(await response.text());
          const scopedRows = Array.isArray(source.ranges) && source.ranges.length
            ? source.ranges.flatMap((range) => sliceRange(rows, range))
            : rows;
          return [seasonKey, extractDraftedPlayers(scopedRows)];
        } catch (_) {
          return [seasonKey, new Set()];
        }
      })
    );
    entries.forEach(([seasonKey, set]) => rookieCache.set(seasonKey, set));
    return rookieCache;
  }

  function normalizeRookieSeasonKey(seasonKey) {
    if (seasonKey === "c2s2-playoffs") return "c2s2-regular";
    if (seasonKey === "c2s1-playoffs") return "c2s1-regular";
    if (seasonKey === "c1s2-playoffs") return "c1s2-regular";
    if (seasonKey === "c1s3-playoffs") return "c1s3-regular";
    if (seasonKey === "c1s4-playoffs") return "c1s4-regular";
    if (seasonKey === "c1s5-playoffs") return "c1s5-regular";
    if (seasonKey === "c1s6-playoffs") return "c1s6-regular";
    return seasonKey;
  }

  function rookieResetIndex(seasonKey) {
    const index = ROOKIE_SEASON_ORDER.indexOf(seasonKey);
    if (index === -1) return -1;
    const resetIndex = ROOKIE_SEASON_ORDER.indexOf("c2s1-regular");
    return seasonKey === "c2s1-regular" ? resetIndex : index >= resetIndex ? resetIndex : 0;
  }

  function isRookie(seasonKey, player) {
    const normalized = normalize(player);
    const normalizedSeason = normalizeRookieSeasonKey(seasonKey);
    const seasonIndex = ROOKIE_SEASON_ORDER.indexOf(normalizedSeason);
    if (!normalized || seasonIndex === -1) return false;
    const resetIndex = rookieResetIndex(normalizedSeason);
    if (resetIndex === -1) return false;
    for (let i = resetIndex; i < seasonIndex; i += 1) {
      if (rookieCache.get(ROOKIE_SEASON_ORDER[i])?.has(normalized)) return false;
    }
    return Boolean(rookieCache.get(normalizedSeason)?.has(normalized));
  }

  function resolveSeason(input) {
    return (
      input ||
      localStorage.getItem("playerSeason") ||
      localStorage.getItem("season") ||
      "c2s3-regular"
    );
  }

  function badgeHtml({
    player,
    season,
    rookie = false,
    drafted = false,
    risingStars = false,
  }) {
    const activeSeason = normalizeRookieSeasonKey(resolveSeason(season));
    const badges = [];
    if ((rookie || drafted) && isRookie(activeSeason, player)) {
      badges.push('<span class="player-mark rookie-mark" title="Drafted for this season">R</span>');
    }
    if (risingStars && RISING_STARS_HANDLES.has(normalize(player))) {
      badges.push('<span class="player-mark" title="Rising Stars participant">RS</span>');
    }
    return badges.join("");
  }

  window.rsklPlayerBadgeHtml = badgeHtml;
  window.rsklLoadRookieCache = loadRookieCache;
  window.rsklEnhancePlayerLinks = enhancePlayerLinks;

  const bootPlayerAvatars = () => {
    loadRookieCache().finally(() => {
      enhancePlayerLinks(document);
      observePlayerLinks();
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootPlayerAvatars, { once: true });
  } else {
    bootPlayerAvatars();
  }

  const nav = document.querySelector(".site-nav");
  const toggle = document.querySelector("[data-menu-toggle]");
  const panel = document.querySelector("[data-menu-panel]");

  if (toggle && panel) {
    const setClosed = () => {
      panel.setAttribute("hidden", "");
      panel.removeAttribute("data-open");
      toggle.setAttribute("aria-expanded", "false");
    };

    const openMenu = () => {
      panel.removeAttribute("hidden");
      toggle.setAttribute("aria-expanded", "true");
      window.requestAnimationFrame(() => {
        panel.setAttribute("data-open", "true");
      });
    };

    const closeMenu = () => {
      panel.removeAttribute("data-open");
      toggle.setAttribute("aria-expanded", "false");
      window.setTimeout(() => {
        if (toggle.getAttribute("aria-expanded") === "false") {
          panel.setAttribute("hidden", "");
        }
      }, 180);
    };

    toggle.addEventListener("click", () => {
      const open = panel.hasAttribute("hidden");
      if (open) {
        openMenu();
      } else {
        closeMenu();
      }
    });

    document.addEventListener("click", (event) => {
      if (
        !panel.hasAttribute("hidden") &&
        !panel.contains(event.target) &&
        !toggle.contains(event.target)
      ) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !panel.hasAttribute("hidden")) {
        closeMenu();
      }
    });

    panel.querySelectorAll("a, button").forEach((item) => {
      item.addEventListener("click", () => {
        closeMenu();
      });
    });

    setClosed();
  }

  const seasonSelect = document.getElementById("season-select");
  if (!seasonSelect) {
    return;
  }

  const normalizeSeason = (value) => {
    if (value === "c2s2" || value === "c2s2-playoffs") return "c2s3-regular";
    return value || "c2s3-regular";
  };

  const saved = normalizeSeason(localStorage.getItem("season"));
  if (saved) {
    seasonSelect.value = saved;
  }

  seasonSelect.addEventListener("change", () => {
    localStorage.setItem("season", normalizeSeason(seasonSelect.value));
    const playerSeasonMap = {
      "c2s3-regular": "c2s3-regular",
      "c2s2-regular": "c2s2-regular",
      "c2s1-regular": "c2s1-regular",
      "c2s1-post": "c2s1-playoffs",
    };
    const mapped = playerSeasonMap[seasonSelect.value];
    if (mapped) {
      localStorage.setItem("playerSeason", mapped);
    }
    location.reload();
  });
})();
