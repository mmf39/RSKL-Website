const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 5173;
const ROOT = __dirname;

const STANDINGS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=2115060088&single=true&output=csv";
const TEAMS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=847666124&single=true&output=csv";
const DRAFT_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=894447035&single=true&output=csv";
const TRANSACTIONS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=1782609175&single=true&output=csv";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, "Not found");
      return;
    }
    const ext = path.extname(filePath);
    send(res, 200, data, MIME[ext] || "application/octet-stream");
  });
}

function proxyCsv(res, url) {
  https
    .get(url, (proxyRes) => {
      let data = "";
      proxyRes.on("data", (chunk) => (data += chunk));
      proxyRes.on("end", () => {
        if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
          send(res, proxyRes.statusCode, `Upstream error ${proxyRes.statusCode}`);
          return;
        }
        send(res, 200, data, "text/csv; charset=utf-8");
      });
    })
    .on("error", (err) => {
      send(res, 500, `Proxy error: ${err.message}`);
    });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/standings") {
    proxyCsv(res, STANDINGS_URL);
    return;
  }

  if (url.pathname === "/api/teams") {
    proxyCsv(res, TEAMS_URL);
    return;
  }

  if (url.pathname === "/api/draft") {
    proxyCsv(res, DRAFT_URL);
    return;
  }

  if (url.pathname === "/api/transactions") {
    proxyCsv(res, TRANSACTIONS_URL);
    return;
  }

  const filePath = url.pathname === "/" ? "/index.html" : url.pathname;
  const resolved = path.join(ROOT, filePath);

  if (!resolved.startsWith(ROOT)) {
    send(res, 403, "Forbidden");
    return;
  }

  serveFile(res, resolved);
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
