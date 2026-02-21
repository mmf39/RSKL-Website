const https = require("https");
const { URL } = require("url");

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbylZD-O7LCsznZpnRpYsAdbp7bCbknV-qta8PO0uv_k4Tnevf8Klkbfcg6Hh5DXC9GFvg/exec";

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

function forward(url, payload, redirects, res) {
  const target = new URL(url);
  const request = https.request(
    {
      method: "POST",
      hostname: target.hostname,
      path: target.pathname + target.search,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
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
        forward(nextUrl, payload, redirects - 1, res);
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

  request.write(payload);
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
    const payload = JSON.stringify(params);
    forward(SCRIPT_URL, payload, 5, res);
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
    forward(SCRIPT_URL, JSON.stringify(payloadObj), 5, res);
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

    forward(SCRIPT_URL, JSON.stringify(payloadObj), 5, res);
  });
};
