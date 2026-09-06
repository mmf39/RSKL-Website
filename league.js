(() => {
  const LEAGUE_KEY = "league";
  const SEASON_KEY = "season";
  const PLAYER_SEASON_KEY = "playerSeason";
  const DRAFT_YEAR_KEY = "draftYear";
  const RSKL_DEFAULT_SEASON = "c2s4-regular";
  const NFLKL_DEFAULT_SEASON = "nflkl-s1";
  const VALID_LEAGUES = new Set(["rskl", "nflkl"]);

  const savedLeague = String(localStorage.getItem(LEAGUE_KEY) || "").trim().toLowerCase();
  const needsLeagueChoice = !VALID_LEAGUES.has(savedLeague);
  const activeLeague = needsLeagueChoice ? "rskl" : savedLeague;

  window.RSKL_ACTIVE_LEAGUE = activeLeague;
  window.RSKL_NEEDS_LEAGUE_CHOICE = needsLeagueChoice;

  function applyLeagueDefaults(league) {
    if (league === "nflkl") {
      localStorage.setItem(SEASON_KEY, NFLKL_DEFAULT_SEASON);
      localStorage.setItem(PLAYER_SEASON_KEY, NFLKL_DEFAULT_SEASON);
      localStorage.setItem(DRAFT_YEAR_KEY, NFLKL_DEFAULT_SEASON);
      return;
    }

    if (localStorage.getItem(SEASON_KEY) === NFLKL_DEFAULT_SEASON) {
      localStorage.setItem(SEASON_KEY, RSKL_DEFAULT_SEASON);
    }
    if (localStorage.getItem(PLAYER_SEASON_KEY) === NFLKL_DEFAULT_SEASON) {
      localStorage.setItem(PLAYER_SEASON_KEY, RSKL_DEFAULT_SEASON);
    }
    if (localStorage.getItem(DRAFT_YEAR_KEY) === NFLKL_DEFAULT_SEASON) {
      localStorage.setItem(DRAFT_YEAR_KEY, "c2s4");
    }
  }

  window.rsklSetLeague = (league) => {
    const nextLeague = VALID_LEAGUES.has(String(league || "").toLowerCase())
      ? String(league).toLowerCase()
      : "rskl";
    localStorage.setItem(LEAGUE_KEY, nextLeague);
    window.RSKL_ACTIVE_LEAGUE = nextLeague;
    window.RSKL_NEEDS_LEAGUE_CHOICE = false;
    applyLeagueDefaults(nextLeague);
    window.location.assign("/");
  };

  applyLeagueDefaults(activeLeague);
})();
