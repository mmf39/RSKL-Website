const https = require("https");
const { URL } = require("url");

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbylZD-O7LCsznZpnRpYsAdbp7bCbknV-qta8PO0uv_k4Tnevf8Klkbfcg6Hh5DXC9GFvg/exec";

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
  if (req.method === "GET") {
    const url = new URL(req.url, "http://localhost");
    const params = Object.fromEntries(url.searchParams.entries());
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

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", () => {
    const payload = body || "{}";
    forward(SCRIPT_URL, payload, 5, res);
  });
};
