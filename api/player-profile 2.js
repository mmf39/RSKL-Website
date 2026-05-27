const https = require("https");
const { URL } = require("url");

const PLAYER_PROFILE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwLH2qYcWceJucuI559OzLNjk9Bh8WjQgBKZJttcrBwS13gTY1GtnJi9T5eAb0jJeSwbA/exec";

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
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

module.exports = (req, res) => {
  const params = parseQueryFromReq(req);
  const player = String(params.player || "").trim();
  if (!player) {
    sendJson(res, 400, { ok: false, message: "Missing player parameter." });
    return;
  }

  const target = new URL(PLAYER_PROFILE_SCRIPT_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      target.searchParams.set(key, String(value));
    }
  });

  https
    .get(
      target,
      {
        headers: {
          Accept: "application/json,*/*",
          "User-Agent": "RSKL Player Profile Proxy/1.0",
        },
      },
      (response) => {
        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          const status = response.statusCode || 200;
          if (status >= 400) {
            sendJson(res, status, {
              ok: false,
              message: `Upstream error ${status}`,
              details: data.slice(0, 400),
            });
            return;
          }
          try {
            sendJson(res, 200, JSON.parse(data));
          } catch (_error) {
            sendJson(res, 502, {
              ok: false,
              message: "Expected JSON response from player profile API.",
              details: data.slice(0, 400),
            });
          }
        });
      }
    )
    .on("error", (error) => {
      sendJson(res, 500, { ok: false, message: error.message });
    });
};
