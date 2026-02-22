const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 5180);
const ROOT = path.join(__dirname, "public");
const DEFAULT_API_BASE = process.env.REALSPORTS_API_BASE || "https://api.realsports.io";
const DEFAULT_API_KEY = process.env.REALSPORTS_API_KEY || "";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(body));
}

function sendText(res, status, text) {
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(text);
}

function serveStatic(reqPath, res) {
  const filePath = reqPath === "/" ? "/index.html" : reqPath;
  const resolved = path.join(ROOT, filePath);
  if (!resolved.startsWith(ROOT)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  fs.readFile(resolved, (err, data) => {
    if (err) {
      sendText(res, 404, "Not found");
      return;
    }
    const ext = path.extname(resolved);
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(data);
  });
}

function normalizeBase(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return DEFAULT_API_BASE;
  }
  return trimmed.replace(/\/$/, "");
}

function isAllowedBase(baseUrl) {
  try {
    const parsed = new URL(baseUrl);
    return parsed.protocol === "https:" && parsed.hostname.endsWith("realsports.io");
  } catch (_err) {
    return false;
  }
}

function proxyRealSports(reqUrl, res) {
  const playerId = String(reqUrl.searchParams.get("playerId") || "").trim();
  const pathTemplate = String(reqUrl.searchParams.get("pathTemplate") || "").trim();
  const apiBase = normalizeBase(reqUrl.searchParams.get("base"));
  const token = String(reqUrl.searchParams.get("token") || DEFAULT_API_KEY || "").trim();

  if (!playerId) {
    sendJson(res, 400, { ok: false, message: "Missing playerId" });
    return;
  }

  if (!pathTemplate || !pathTemplate.includes("{id}")) {
    sendJson(res, 400, {
      ok: false,
      message: "pathTemplate is required and must include {id}",
    });
    return;
  }

  if (!isAllowedBase(apiBase)) {
    sendJson(res, 400, {
      ok: false,
      message: "Invalid base URL. Use an https://*.realsports.io host.",
    });
    return;
  }

  const resolvedPath = pathTemplate.replaceAll("{id}", encodeURIComponent(playerId));
  const targetUrl = `${apiBase}${resolvedPath.startsWith("/") ? "" : "/"}${resolvedPath}`;

  let parsedTarget;
  try {
    parsedTarget = new URL(targetUrl);
  } catch (_err) {
    sendJson(res, 400, { ok: false, message: "Failed to build target URL" });
    return;
  }

  const options = {
    method: "GET",
    hostname: parsedTarget.hostname,
    path: `${parsedTarget.pathname}${parsedTarget.search}`,
    headers: {
      Accept: "application/json,*/*",
      "User-Agent": "realsports-live-scoring/1.0",
    },
  };

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
    options.headers["x-api-key"] = token;
  }

  https
    .request(options, (proxyRes) => {
      let raw = "";
      proxyRes.setEncoding("utf8");
      proxyRes.on("data", (chunk) => {
        raw += chunk;
      });
      proxyRes.on("end", () => {
        if ((proxyRes.statusCode || 0) >= 400) {
          sendJson(res, proxyRes.statusCode || 502, {
            ok: false,
            message: `Upstream error ${proxyRes.statusCode || 502}`,
            details: raw.slice(0, 400),
          });
          return;
        }

        try {
          const parsed = JSON.parse(raw);
          sendJson(res, 200, { ok: true, playerId, data: parsed });
        } catch (_err) {
          sendJson(res, 502, {
            ok: false,
            message: "Expected JSON response from realsports API",
            details: raw.slice(0, 400),
          });
        }
      });
    })
    .on("error", (err) => {
      sendJson(res, 500, { ok: false, message: `Proxy failed: ${err.message}` });
    })
    .end();
}

http
  .createServer((req, res) => {
    const reqUrl = new URL(req.url, `http://${req.headers.host}`);

    if (reqUrl.pathname === "/api/realsports") {
      proxyRealSports(reqUrl, res);
      return;
    }

    serveStatic(reqUrl.pathname, res);
  })
  .listen(PORT, () => {
    console.log(`Live Draft Scoring server running at http://localhost:${PORT}`);
  });
