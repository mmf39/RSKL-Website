const https = require("https");
const zlib = require("zlib");

function fetchUrl(res, url, depth = 0) {
  if (depth > 3) {
    res.statusCode = 508;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Too many redirects");
    return;
  }

  https
    .get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "text/csv,*/*",
          "Accept-Encoding": "gzip, deflate, br",
        },
      },
      (proxyRes) => {
        const status = proxyRes.statusCode || 200;
        const location = proxyRes.headers.location;
        if (status >= 300 && status < 400 && location) {
          fetchUrl(res, location, depth + 1);
          return;
        }

        const chunks = [];
        proxyRes.on("data", (chunk) => chunks.push(chunk));
        proxyRes.on("end", () => {
          if (status >= 400) {
            res.statusCode = status;
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.end(`Upstream error ${status}`);
            return;
          }

          const buffer = Buffer.concat(chunks);
          const encoding = String(proxyRes.headers["content-encoding"] || "").toLowerCase();

          const respond = (buf) => {
            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader(
              "Cache-Control",
              "s-maxage=90, stale-while-revalidate=300"
            );
            res.end(buf);
          };

          if (encoding.includes("gzip")) {
            zlib.gunzip(buffer, (err, decoded) => {
              if (err) {
                respond(buffer);
              } else {
                respond(decoded);
              }
            });
            return;
          }

          if (encoding.includes("deflate")) {
            zlib.inflate(buffer, (err, decoded) => {
              if (err) {
                respond(buffer);
              } else {
                respond(decoded);
              }
            });
            return;
          }

          if (encoding.includes("br") && zlib.brotliDecompress) {
            zlib.brotliDecompress(buffer, (err, decoded) => {
              if (err) {
                respond(buffer);
              } else {
                respond(decoded);
              }
            });
            return;
          }

          respond(buffer);
        });
      }
    )
    .on("error", (err) => {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end(`Proxy error: ${err.message}`);
    });
}

module.exports = function proxy(req, res, url) {
  fetchUrl(res, url);
};
