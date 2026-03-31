(() => {
  const ensureLink = (container, href, label) => {
    if (!container) return;
    const exists = Array.from(container.querySelectorAll("a")).some(
      (a) => a.getAttribute("href") === href
    );
    if (exists) return;
    const link = document.createElement("a");
    link.className = "btn ghost";
    link.href = href;
    link.textContent = label;
    container.appendChild(link);
  };

  const toggle = document.querySelector("[data-menu-toggle]");
  const panel = document.querySelector("[data-menu-panel]");

  if (toggle && panel) {
    toggle.addEventListener("click", () => {
      const open = panel.hasAttribute("hidden");
      if (open) {
        panel.removeAttribute("hidden");
        toggle.setAttribute("aria-expanded", "true");
      } else {
        panel.setAttribute("hidden", "");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("click", (event) => {
      if (
        !panel.hasAttribute("hidden") &&
        !panel.contains(event.target) &&
        !toggle.contains(event.target)
      ) {
        panel.setAttribute("hidden", "");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  const seasonSelect = document.getElementById("season-select");
  if (!seasonSelect) {
    return;
  }

  const normalizeSeason = (value) => {
    if (value === "c2s2") return "c2s2-playoffs";
    return value || "c2s2-playoffs";
  };

  const saved = normalizeSeason(localStorage.getItem("season"));
  if (saved) {
    seasonSelect.value = saved;
  }

  seasonSelect.addEventListener("change", () => {
    localStorage.setItem("season", normalizeSeason(seasonSelect.value));
    const playerSeasonMap = {
      "c2s2-playoffs": "c2s2-regular",
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
