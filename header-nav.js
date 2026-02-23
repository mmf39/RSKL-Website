(() => {
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

  const saved = localStorage.getItem("season");
  if (saved) {
    seasonSelect.value = saved;
  }

  seasonSelect.addEventListener("change", () => {
    localStorage.setItem("season", seasonSelect.value);
    const playerSeasonMap = {
      "c2s2": "c2s2-regular",
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
