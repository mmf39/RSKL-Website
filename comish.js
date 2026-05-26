const BADGE_OVERRIDES_API = "/api/badge-overrides";

const SEASONS = [
  "c2s3-regular",
  "c2s2-regular",
  "c2s1-regular",
  "c1s7-regular",
  "c1s6-regular",
  "c1s5-regular",
  "c1s4-regular",
  "c1s3-regular",
  "c1s2-regular",
];

const els = {
  lastUpdated: document.getElementById("comish-last-updated"),
  seasonSelect: document.getElementById("comish-season-select"),
  rookieInput: document.getElementById("comish-rookie-input"),
  allStarInput: document.getElementById("comish-allstar-input"),
  risingStarsInput: document.getElementById("comish-rising-stars-input"),
  rookieCount: document.getElementById("comish-rookie-count"),
  allStarCount: document.getElementById("comish-allstar-count"),
  risingStarsCount: document.getElementById("comish-rising-stars-count"),
  preview: document.getElementById("comish-json-preview"),
  save: document.getElementById("comish-save"),
  reload: document.getElementById("comish-reload"),
  status: document.getElementById("comish-status"),
};

let badgeState = {
  risingStars: [],
  rookie: {},
  allStar: {},
};

function normalizeHandle(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return `@${text.replace(/^@+/, "").trim()}`;
}

function parseHandleLines(value) {
  const unique = new Set();
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => normalizeHandle(line))
    .filter((line) => {
      if (!line || unique.has(line.toLowerCase())) return false;
      unique.add(line.toLowerCase());
      return true;
    })
    .sort((a, b) => a.localeCompare(b));
}

function formatHandleLines(list) {
  return (Array.isArray(list) ? list : []).join("\n");
}

function ensureShape(input) {
  const next = {
    risingStars: Array.isArray(input?.risingStars) ? input.risingStars.map(normalizeHandle).filter(Boolean) : [],
    rookie: {},
    allStar: {},
  };

  SEASONS.forEach((season) => {
    next.rookie[season] = Array.isArray(input?.rookie?.[season])
      ? input.rookie[season].map(normalizeHandle).filter(Boolean)
      : [];
    next.allStar[season] = Array.isArray(input?.allStar?.[season])
      ? input.allStar[season].map(normalizeHandle).filter(Boolean)
      : [];
  });

  next.risingStars = parseHandleLines(next.risingStars.join("\n"));
  SEASONS.forEach((season) => {
    next.rookie[season] = parseHandleLines(next.rookie[season].join("\n"));
    next.allStar[season] = parseHandleLines(next.allStar[season].join("\n"));
  });

  return next;
}

function setStatus(message, tone = "") {
  els.status.textContent = message;
  els.status.dataset.tone = tone;
}

function updateLastUpdated() {
  const now = new Date();
  els.lastUpdated.textContent = `Last updated: ${now.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function commitSeasonEditors() {
  const season = els.seasonSelect.value;
  badgeState.rookie[season] = parseHandleLines(els.rookieInput.value);
  badgeState.allStar[season] = parseHandleLines(els.allStarInput.value);
  badgeState.risingStars = parseHandleLines(els.risingStarsInput.value);
}

function updatePreview() {
  commitSeasonEditors();
  els.preview.textContent = JSON.stringify(badgeState, null, 2);
  const season = els.seasonSelect.value;
  els.rookieCount.textContent = `${badgeState.rookie[season].length} rookies`;
  els.allStarCount.textContent = `${badgeState.allStar[season].length} all stars`;
  els.risingStarsCount.textContent = `${badgeState.risingStars.length} rising stars`;
}

function renderSeasonEditors() {
  const season = els.seasonSelect.value;
  els.rookieInput.value = formatHandleLines(badgeState.rookie[season]);
  els.allStarInput.value = formatHandleLines(badgeState.allStar[season]);
  els.risingStarsInput.value = formatHandleLines(badgeState.risingStars);
  updatePreview();
}

async function loadBadgeOverrides() {
  setStatus("Loading badge overrides…");
  const response = await fetch(BADGE_OVERRIDES_API, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Load failed: ${response.status}`);
  }
  badgeState = ensureShape(await response.json());
  renderSeasonEditors();
  updateLastUpdated();
  setStatus("Badge overrides loaded.", "success");
}

async function saveBadgeOverrides() {
  commitSeasonEditors();
  setStatus("Saving badge overrides…");
  const response = await fetch(BADGE_OVERRIDES_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(badgeState),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message || `Save failed: ${response.status}`);
  }
  badgeState = ensureShape(payload?.data || badgeState);
  renderSeasonEditors();
  updateLastUpdated();
  setStatus("Badge overrides saved.", "success");
}

function boot() {
  els.seasonSelect.addEventListener("change", () => {
    commitSeasonEditors();
    renderSeasonEditors();
  });

  [els.rookieInput, els.allStarInput, els.risingStarsInput].forEach((field) => {
    field.addEventListener("input", updatePreview);
  });

  els.reload.addEventListener("click", () => {
    loadBadgeOverrides().catch((error) => {
      setStatus(error.message || "Unable to reload badge overrides.", "error");
    });
  });

  els.save.addEventListener("click", () => {
    saveBadgeOverrides().catch((error) => {
      setStatus(error.message || "Unable to save badge overrides.", "error");
    });
  });

  loadBadgeOverrides().catch((error) => {
    setStatus(error.message || "Unable to load badge overrides.", "error");
  });
}

boot();
