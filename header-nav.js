(() => {
  const SUPABASE_CONFIG_URL = "/api/supabase-config";
  const BADGE_OVERRIDES_URL = "/api/badge-overrides";
  const RISING_STARS_HANDLES = new Set();
  const ROOKIE_SEASON_ORDER = [
    "c1s2-regular",
    "c1s3-regular",
    "c1s4-regular",
    "c1s5-regular",
    "c1s6-regular",
    "c1s7-regular",
    "c2s1-regular",
    "c2s2-regular",
    "c2s3-regular",
    "c2s3-playoffs",
    "c2s4-regular",
  ];
  const rookieCache = new Map();
  const allStarCache = new Map();
  let badgeOverridesPromise = null;
  const playerPhotoCache = new Map();
  let supabaseUrl = "";
  let supabaseAnon = "";
  let supabaseConfigPromise = null;
  let playerPhotoCachePromise = null;
  const DRAFT_EVENT_AT = new Date("2026-07-15T18:00:00-04:00");
  const DRAFT_EVENT_LINK = "/draft.html?year=c2s4";
  const DRAFT_FEATURE_ENABLED = true;
  const LEAGUE_KEY = "league";
  const NFLKL_SEASON = "nflkl-s1";
  const RSKL_DEFAULT_SEASON = "c2s4-regular";

  const normalize = (value) =>
    String(value || "").trim().replace(/^@/, "").toLowerCase();

  function getActiveLeague() {
    return String(window.RSKL_ACTIVE_LEAGUE || localStorage.getItem(LEAGUE_KEY) || "rskl")
      .trim()
      .toLowerCase() === "nflkl"
      ? "nflkl"
      : "rskl";
  }

  function setLeague(league) {
    if (window.rsklSetLeague) {
      window.rsklSetLeague(league);
      return;
    }
    localStorage.setItem(LEAGUE_KEY, league === "nflkl" ? "nflkl" : "rskl");
    location.assign("/");
  }

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

  function formatCountdown(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
      days ? `${days}d` : "",
      `${String(hours).padStart(2, "0")}h`,
      `${String(minutes).padStart(2, "0")}m`,
      `${String(seconds).padStart(2, "0")}s`,
    ]
      .filter(Boolean)
      .join(" ");
  }

  function ensureDraftCountdownBanner() {
    if (!DRAFT_FEATURE_ENABLED) return;
    if (getActiveLeague() !== "rskl") return;
    if (document.querySelector(".draft-countdown-banner")) return;
    const header = document.querySelector(".hero");
    if (!header) return;

    const banner = document.createElement("a");
    banner.className = "draft-countdown-banner";
    banner.href = DRAFT_EVENT_LINK;
    banner.setAttribute("aria-label", "Open the C2S4 draft room");
    banner.innerHTML = `
      <span class="draft-countdown-kicker">C2S4 Draft</span>
      <strong>Draft room is open</strong>
      <span class="draft-countdown-time" data-draft-countdown>Live board and prospects</span>
      <span class="draft-countdown-action">Open Draft</span>
    `;

    header.insertAdjacentElement("afterend", banner);

    const countdown = banner.querySelector("[data-draft-countdown]");
    const update = () => {
      const remaining = DRAFT_EVENT_AT.getTime() - Date.now();
      if (remaining <= 0) {
        countdown.textContent = "Live draft room";
        banner.classList.add("is-live");
        return;
      }
      countdown.textContent = formatCountdown(remaining);
      banner.classList.remove("is-live");
    };

    update();
    window.setInterval(update, 1000);
  }

  function ensureLeagueSelector() {
    const nav = document.querySelector(".site-nav-main");
    if (!nav || document.getElementById("league-select")) return;
    const select = document.createElement("select");
    select.id = "league-select";
    select.className = "season-select league-select";
    select.setAttribute("aria-label", "League");
    select.innerHTML = `
      <option value="rskl">RSKL</option>
      <option value="nflkl">NFLKL</option>
    `;
    select.value = getActiveLeague();
    const seasonSelect = document.getElementById("season-select");
    nav.insertBefore(select, seasonSelect || null);
    select.addEventListener("change", () => setLeague(select.value));
  }

  function configureSeasonSelectsForLeague() {
    const league = getActiveLeague();
    document.querySelectorAll("#season-select, #player-season-select, #awards-season").forEach((select) => {
      if (!select.__rsklOriginalOptions) {
        select.__rsklOriginalOptions = Array.from(select.options).map((option) => ({
          value: option.value,
          label: option.textContent,
          selected: option.selected,
        }));
      }

      if (league === "nflkl") {
        select.innerHTML = '<option value="nflkl-s1">S1</option>';
        select.value = NFLKL_SEASON;
        localStorage.setItem("season", NFLKL_SEASON);
        localStorage.setItem("playerSeason", NFLKL_SEASON);
        return;
      }

      select.innerHTML = select.__rsklOriginalOptions
        .filter((option) => option.value !== NFLKL_SEASON)
        .map((option) => `<option value="${option.value}">${option.label}</option>`)
        .join("");
      if (localStorage.getItem("season") === NFLKL_SEASON) {
        localStorage.setItem("season", RSKL_DEFAULT_SEASON);
      }
      if (localStorage.getItem("playerSeason") === NFLKL_SEASON) {
        localStorage.setItem("playerSeason", RSKL_DEFAULT_SEASON);
      }
    });
  }

  function ensureLeagueGate() {
    if (!window.RSKL_NEEDS_LEAGUE_CHOICE || document.querySelector(".league-gate")) return;
    const gate = document.createElement("div");
    gate.className = "league-gate";
    gate.innerHTML = `
      <div class="league-gate-card" role="dialog" aria-modal="true" aria-labelledby="league-gate-title">
        <span class="league-gate-kicker">Choose League</span>
        <h2 id="league-gate-title">Where do you want to go?</h2>
        <div class="league-gate-actions">
          <button class="btn" type="button" data-league-choice="rskl">RSKL</button>
          <button class="btn ghost" type="button" data-league-choice="nflkl">NFLKL</button>
        </div>
      </div>
    `;
    gate.querySelectorAll("[data-league-choice]").forEach((button) => {
      button.addEventListener("click", () => setLeague(button.dataset.leagueChoice));
    });
    document.body.appendChild(gate);
  }

  function applyLeagueChrome() {
    if (getActiveLeague() !== "nflkl") return;
    document.querySelectorAll(".badge").forEach((badge) => {
      if (/real sports karma league/i.test(badge.textContent || "")) {
        badge.textContent = "NFLKL";
      }
    });
    const title = document.querySelector(".hero h1");
    if (title && window.location.pathname === "/") {
      title.textContent = "NFLKL";
    }
  }

  function guardNflklUnsupportedPages() {
    if (getActiveLeague() !== "nflkl") return;
    const supportedPaths = new Set([
      "/",
      "/index.html",
      "/schedule.html",
      "/standings.html",
      "/player.html",
      "/player-detail.html",
      "/team.html",
      "/draft.html",
    ]);
    const path = window.location.pathname || "/";
    if (supportedPaths.has(path)) return;
    const main = document.querySelector("main.container");
    if (!main) return;
    main.innerHTML = `
      <section class="panel">
        <div class="panel-head"><h2>NFLKL S1</h2></div>
        <p>NFLKL info for this page is not available yet.</p>
      </section>
    `;
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

  function hydrateRookieBadges(root = document) {
    const badges = Array.from(root.querySelectorAll(".rookie-mark[data-rookie-player]"));
    badges.forEach((badge) => {
      const player = badge.dataset.rookiePlayer || "";
      const season = badge.dataset.rookieSeason || "";
      if (!isRookie(resolveSeason(season), player)) {
        badge.remove();
        return;
      }
      badge.hidden = false;
      badge.textContent = "R";
      badge.title = "Drafted for this season";
      badge.classList.remove("rookie-mark--pending");
    });
  }

  async function enhancePlayerLinks(root = document) {
    const links = Array.from(root.querySelectorAll('a[href*="player-detail.html?player="]'));
    hydrateRookieBadges(root);
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
    let pendingRoot = null;
    let pendingTimer = 0;
    const scheduleEnhancement = (root) => {
      pendingRoot = pendingRoot === document || root === document ? document : root || pendingRoot || document;
      window.clearTimeout(pendingTimer);
      pendingTimer = window.setTimeout(() => {
        const rootToEnhance = pendingRoot || document;
        pendingRoot = null;
        enhancePlayerLinks(rootToEnhance);
      }, 250);
    };
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length) {
          const addedElement = Array.from(mutation.addedNodes).find((node) => node.nodeType === 1);
          if (!addedElement) continue;
          const root =
            addedElement.matches?.('a[href*="player-detail.html?player="], .rookie-mark[data-rookie-player]')
              ? addedElement.parentElement || addedElement
              : addedElement.querySelector?.('a[href*="player-detail.html?player="], .rookie-mark[data-rookie-player]')
              ? addedElement
              : null;
          if (root) {
            scheduleEnhancement(root);
            break;
          }
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

  async function loadBadgeOverrides() {
    if (!badgeOverridesPromise) {
      badgeOverridesPromise = fetch(BADGE_OVERRIDES_URL, { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : {}))
        .catch(() => ({}));
    }
    return badgeOverridesPromise;
  }

  async function loadRookieCache() {
    if (rookieCache.size) return rookieCache;
    const overridePayload = await loadBadgeOverrides();
    const entries = ROOKIE_SEASON_ORDER.map((seasonKey) => [
      seasonKey,
      new Set(
        (Array.isArray(overridePayload?.rookie?.[seasonKey]) ? overridePayload.rookie[seasonKey] : [])
          .map((value) => normalize(value))
          .filter(Boolean)
      ),
    ]);
    entries.forEach(([seasonKey, set]) => rookieCache.set(seasonKey, set));
    return rookieCache;
  }

  async function loadAllStarCache() {
    if (allStarCache.size) return allStarCache;
    const payload = await loadBadgeOverrides();
    Object.entries(payload?.allStar || {}).forEach(([seasonKey, players]) => {
      allStarCache.set(
        normalizeRookieSeasonKey(seasonKey),
        new Set((Array.isArray(players) ? players : []).map((value) => normalize(value)).filter(Boolean))
      );
    });
    RISING_STARS_HANDLES.clear();
    (Array.isArray(payload?.risingStars) ? payload.risingStars : []).forEach((value) => {
      const normalized = normalize(value);
      if (normalized) RISING_STARS_HANDLES.add(normalized);
    });
    return allStarCache;
  }

  function normalizeRookieSeasonKey(seasonKey) {
    if (seasonKey === "c2s4-playoffs") return "c2s4-regular";
    if (seasonKey === "c2s3-playoffs") return "c2s3-regular";
    if (seasonKey === "c2s2-playoffs") return "c2s2-regular";
    if (seasonKey === "c2s1-playoffs") return "c2s1-regular";
    if (seasonKey === "c1s2-playoffs") return "c1s2-regular";
    if (seasonKey === "c1s3-playoffs") return "c1s3-regular";
    if (seasonKey === "c1s4-playoffs") return "c1s4-regular";
    if (seasonKey === "c1s5-playoffs") return "c1s5-regular";
    if (seasonKey === "c1s6-playoffs") return "c1s6-regular";
    if (seasonKey === "c1s7-playoffs") return "c1s7-regular";
    return seasonKey;
  }

  function isRookie(seasonKey, player) {
    const normalized = normalize(player);
    const normalizedSeason = normalizeRookieSeasonKey(seasonKey);
    if (!normalized || !normalizedSeason) return false;
    if (normalizedSeason === "career") {
      return Array.from(rookieCache.values()).some((players) => players.has(normalized));
    }
    return Boolean(rookieCache.get(normalizedSeason)?.has(normalized));
  }

  function isAllStar(seasonKey, player) {
    const normalized = normalize(player);
    const normalizedSeason = normalizeRookieSeasonKey(seasonKey);
    if (!normalized || !normalizedSeason) return false;
    if (normalizedSeason === "career") {
      return Array.from(allStarCache.values()).some((players) => players.has(normalized));
    }
    return Boolean(allStarCache.get(normalizedSeason)?.has(normalized));
  }

  function resolveSeason(input) {
    return (
      input ||
      localStorage.getItem("playerSeason") ||
      localStorage.getItem("season") ||
      "c2s3-playoffs"
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
    if (isRookie(activeSeason, player)) {
      badges.push('<span class="player-mark rookie-mark" title="Drafted for this season">R</span>');
    } else if (!rookieCache.size && player) {
      const safePlayer = String(player).replace(/"/g, "&quot;");
      const safeSeason = String(activeSeason || "").replace(/"/g, "&quot;");
      badges.push(
        `<span class="player-mark rookie-mark rookie-mark--pending" data-rookie-player="${safePlayer}" data-rookie-season="${safeSeason}" title="Drafted for this season" hidden></span>`
      );
    }
    if (risingStars && RISING_STARS_HANDLES.has(normalize(player))) {
      badges.push('<span class="player-mark rising-stars-mark" title="Rising Stars participant">RS</span>');
    }
    if (isAllStar(activeSeason, player)) {
      badges.push('<span class="player-mark all-star-mark" title="C2S3 All Star">ASG</span>');
    }
    return badges.join("");
  }

  window.rsklPlayerBadgeHtml = badgeHtml;
  window.rsklLoadRookieCache = loadRookieCache;
  window.rsklEnhancePlayerLinks = enhancePlayerLinks;

  const bootPlayerAvatars = () => {
    Promise.all([loadRookieCache(), loadAllStarCache()]).finally(() => {
      hydrateRookieBadges(document);
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

  ensureLeagueSelector();
  configureSeasonSelectsForLeague();
  ensureLeagueGate();
  applyLeagueChrome();
  guardNflklUnsupportedPages();
  ensureDraftCountdownBanner();

  const seasonSelect = document.getElementById("season-select");
  if (!seasonSelect) {
    return;
  }

  const normalizeSeason = (value) => {
    if (value === "c2s4-playoffs") return "c2s4-regular";
    if (value === "c2s2") return "c2s3-playoffs";
    return value || "c2s4-regular";
  };

  const saved = getActiveLeague() === "nflkl" ? NFLKL_SEASON : normalizeSeason(localStorage.getItem("season"));
  const availableSeasons = new Set(Array.from(seasonSelect.options, (option) => option.value));
  const initialSeason = availableSeasons.has(saved) ? saved : RSKL_DEFAULT_SEASON;
  seasonSelect.value = initialSeason;
  localStorage.setItem("season", initialSeason);

  seasonSelect.addEventListener("change", () => {
    const nextSeason = normalizeSeason(seasonSelect.value);
    localStorage.setItem("season", nextSeason);
    const playerSeasonMap = {
      "c2s3-regular": "c2s3-regular",
      career: "career",
      "c2s3-playoffs": "c2s3-playoffs",
      "c2s4-regular": "c2s4-regular",
      "c2s2-regular": "c2s2-regular",
      "c2s2-playoffs": "c2s2-playoffs",
      "c1s6-regular": "c1s6-regular",
      "c1s6-post": "c1s6-playoffs",
      "c1s5-regular": "c1s5-regular",
      "c1s5-post": "c1s5-playoffs",
      "c1s4-regular": "c1s4-regular",
      "c1s4-post": "c1s4-playoffs",
      "c1s3-regular": "c1s3-regular",
      "c1s3-post": "c1s3-playoffs",
      "c1s2-regular": "c1s2-regular",
      "c1s2-post": "c1s2-playoffs",
      "c2s1-regular": "c2s1-regular",
      "c2s1-post": "c2s1-playoffs",
    };
    const mapped = playerSeasonMap[nextSeason];
    if (mapped) {
      localStorage.setItem("playerSeason", mapped);
    }
    if (document.body.classList.contains("player-page")) {
      return;
    }
    location.reload();
  });
})();
