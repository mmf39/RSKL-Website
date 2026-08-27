const https = require("https");
const { URL } = require("url");

const TRADEBLOCK_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbylZD-O7LCsznZpnRpYsAdbp7bCbknV-qta8PO0uv_k4Tnevf8Klkbfcg6Hh5DXC9GFvg/exec";
const PLAYER_UPDATE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbybgKT1WjHN7G13XiymsMNM6eO_sOtfchPsWGJfPZwLvEFJ6_QsYJ9pBt7jNWTkM9msXA/exec";
const POWER_RANKINGS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbybxaExeUCMjSrkMVdTkFKxwIXcyQ6TEyO3Yi_LQPZs1CTD-EFN80OcgE7ipm0kUM1u/exec";
const C2S4_ROSTER_TARGET = {
  season: "c2s4",
  targetSeason: "c2s4",
  sheetSeason: "c2s4",
  rosterSheetGid: "847666124",
  rosterRange: "A2:J58",
  rosterLayout: "team-gm-players",
};

function getC2S4SheetTeamName(value) {
  const team = String(value || "").trim();
  if (team === "Pandas") return "The Pandas";
  if (team === "Bullets") return "Storm";
  if (team === "Yetis") return "Scorpions";
  if (team === "The Future") return "Dream Team";
  return team;
}

function parseQueryFromReq(req) {
  if (req && req.query && typeof req.query === "object") {
    return { ...req.query };
  }
  try {
    const url = new URL(req.url, "http://localhost");
    return Object.fromEntries(url.searchParams.entries());
  } catch (_) {
    return {};
  }
}

function withAction(url, action) {
  if (!action) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}action=${encodeURIComponent(action)}`;
}

function getScriptUrlByAction(action) {
  if (action === "savePowerRankings" || action === "getPowerRankings") {
    return POWER_RANKINGS_SCRIPT_URL;
  }
  if (
    action === "updatePlayer" ||
    action === "submitLineup" ||
    action === "saveQueuedLineup" ||
    action === "getQueuedLineups" ||
    action === "submitTransactionRequest" ||
    action === "getPendingTransactionRequests" ||
    action === "reviewTransactionRequest" ||
    action === "submitDraftPick" ||
    action === "saveSheetRoster" ||
    action === "saveSheetGrid" ||
    action === "setGameLocks" ||
    action === "saveGameLocks" ||
    action === "getGameLocks"
  ) {
    return PLAYER_UPDATE_SCRIPT_URL;
  }
  return TRADEBLOCK_SCRIPT_URL;
}

function normalizePayloadForAction(payloadObj) {
  const usesC2S4TeamNames =
    payloadObj.action === "updatePlayer" ||
    payloadObj.action === "submitLineup" ||
    payloadObj.action === "saveQueuedLineup" ||
    payloadObj.action === "submitTransactionRequest";

  const normalizedTeams = usesC2S4TeamNames
    ? {
        team: getC2S4SheetTeamName(payloadObj.team),
        ...(payloadObj.partnerTeam
          ? { partnerTeam: getC2S4SheetTeamName(payloadObj.partnerTeam) }
          : {}),
      }
    : {};

  if (
    payloadObj.action === "updatePlayer" ||
    payloadObj.action === "submitLineup" ||
    payloadObj.action === "saveQueuedLineup"
  ) {
    return {
      ...C2S4_ROSTER_TARGET,
      ...payloadObj,
      ...normalizedTeams,
      season: payloadObj.season || C2S4_ROSTER_TARGET.season,
      targetSeason:
        payloadObj.targetSeason || payloadObj.season || C2S4_ROSTER_TARGET.targetSeason,
      sheetSeason:
        payloadObj.sheetSeason ||
        payloadObj.targetSeason ||
        payloadObj.season ||
        C2S4_ROSTER_TARGET.sheetSeason,
    };
  }
  return {
    ...payloadObj,
    ...normalizedTeams,
  };
}

function forward(url, payload, redirects, res, method = "POST") {
  const target = new URL(url);
  const request = https.request(
    {
      method,
      hostname: target.hostname,
      path: target.pathname + target.search,
      headers:
        method === "POST"
          ? {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(payload),
            }
          : undefined,
    },
    (response) => {
      const status = response.statusCode || 200;
      if (
        status >= 300 &&
        status < 400 &&
        response.headers.location &&
        redirects > 0
      ) {
        const nextUrl = response.headers.location.startsWith("http")
          ? response.headers.location
          : new URL(response.headers.location, url).toString();
        response.resume();
        const nextMethod =
          status === 307 || status === 308 ? method : "GET";
        const nextPayload = nextMethod === "POST" ? payload : "";
        forward(nextUrl, nextPayload, redirects - 1, res, nextMethod);
        return;
      }

      let data = "";
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("end", () => {
        res.statusCode = status;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.end(data || "{}");
      });
    }
  );

  request.on("error", (error) => {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, message: error.message }));
  });

  if (method === "POST" && payload) {
    request.write(payload);
  }
  request.end();
}

module.exports = (req, res) => {
  const paramsForDebug = parseQueryFromReq(req);
  if (paramsForDebug.ping === "1") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(
      JSON.stringify({
        ok: true,
        endpoint: "api/sheet-update",
        build: "2026-02-21-1",
      })
    );
    return;
  }

  if (req.method === "GET") {
    const params = parseQueryFromReq(req);
    if (!params.action) {
      params.action = "getTradeBlocks";
    }
    const scriptUrl = getScriptUrlByAction(params.action);
    const payload = JSON.stringify(params);
    forward(withAction(scriptUrl, params.action), payload, 5, res, "POST");
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end("Method not allowed");
    return;
  }

  if (req.body && typeof req.body === "object") {
    const payloadObj = { ...req.body };
    if (!payloadObj.action) {
      const params = parseQueryFromReq(req);
      if (params.action) payloadObj.action = params.action;
    }
    if (!payloadObj.action) {
      payloadObj.action = "getTradeBlocks";
    }
    const normalizedPayloadObj = normalizePayloadForAction(payloadObj);
    const scriptUrl = getScriptUrlByAction(normalizedPayloadObj.action);
    forward(
      withAction(scriptUrl, normalizedPayloadObj.action),
      JSON.stringify(normalizedPayloadObj),
      5,
      res,
      "POST"
    );
    return;
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", () => {
    let payloadObj = {};
    try {
      payloadObj = body ? JSON.parse(body) : {};
    } catch (_) {
      payloadObj = {};
    }

    if (!payloadObj.action) {
      const params = parseQueryFromReq(req);
      if (params.action) payloadObj.action = params.action;
    }
    if (!payloadObj.action) {
      payloadObj.action = "getTradeBlocks";
    }
    const normalizedPayloadObj = normalizePayloadForAction(payloadObj);
    const scriptUrl = getScriptUrlByAction(normalizedPayloadObj.action);

    forward(
      withAction(scriptUrl, normalizedPayloadObj.action),
      JSON.stringify(normalizedPayloadObj),
      5,
      res,
      "POST"
    );
  });
};
