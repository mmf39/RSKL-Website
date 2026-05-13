(() => {
  const nav = document.querySelector(".site-nav");
  const navMain = nav ? nav.querySelector(".site-nav-main") : null;
  const toggle = document.querySelector("[data-menu-toggle]");
  const panel = document.querySelector("[data-menu-panel]");

  const ensureNavLink = (container, href, label) => {
    if (!container) return;
    const exists = Array.from(container.querySelectorAll("a")).some(
      (link) => link.getAttribute("href") === href
    );
    if (exists) return;
    const link = document.createElement("a");
    link.className = "btn ghost";
    link.href = href;
    link.textContent = label;
    container.appendChild(link);
  };

  ensureNavLink(navMain, "/news.html", "News");
  ensureNavLink(panel, "/news.html", "News");

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
