const https = require("https");
const zlib = require("zlib");

const CACHE_TTL_MS = 60 * 1000;
const STALE_TTL_MS = 10 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10000;
const responseCache = new Map();

function getCacheKey(url, options = {}) {
  return `${url}::${options.transform ? options.transform.name || "transform" : "raw"}`;
}

function sendCsv(res, body, cacheState = "miss") {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=90, stale-while-revalidate=300");
  res.setHeader("X-RSKL-Cache", cacheState);
  res.end(body);
}

function getCached(cacheKey, allowStale = false) {
  const cached = responseCache.get(cacheKey);
  if (!cached) return null;
  const age = Date.now() - cached.at;
  if (age <= CACHE_TTL_MS || (allowStale && age <= STALE_TTL_MS)) {
    return cached.body;
  }
  responseCache.delete(cacheKey);
  return null;
}

function sendStaleOrError(res, cacheKey, status, message) {
  const stale = getCached(cacheKey, true);
  if (stale !== null) {
    sendCsv(res, stale, "stale");
    return;
  }
  res.statusCode = status;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(message);
}

function fetchUrl(res, url, depth = 0, options = {}) {
  const cacheKey = getCacheKey(url, options);
  const cached = depth === 0 ? getCached(cacheKey) : null;
  if (cached !== null) {
    sendCsv(res, cached, "hit");
    return;
  }

  if (depth > 3) {
    sendStaleOrError(res, cacheKey, 508, "Too many redirects");
    return;
  }

  const request = https
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
          proxyRes.resume();
          fetchUrl(res, location, depth + 1, options);
          return;
        }

        const chunks = [];
        proxyRes.on("data", (chunk) => chunks.push(chunk));
        proxyRes.on("end", () => {
          if (status >= 400) {
            sendStaleOrError(res, cacheKey, status, `Upstream error ${status}`);
            return;
          }

          const buffer = Buffer.concat(chunks);
          const encoding = String(proxyRes.headers["content-encoding"] || "").toLowerCase();

          const respond = (buf) => {
            try {
              const body = options.transform ? options.transform(buf.toString("utf8")) : buf.toString("utf8");
              responseCache.set(cacheKey, { at: Date.now(), body });
              sendCsv(res, body);
            } catch (error) {
              sendStaleOrError(res, cacheKey, 500, `Transform error: ${error.message}`);
            }
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
      sendStaleOrError(res, cacheKey, 500, `Proxy error: ${err.message}`);
    });
  request.setTimeout(REQUEST_TIMEOUT_MS, () => {
    request.destroy(new Error("Sheet request timed out"));
  });
}

module.exports = function proxy(req, res, url, options) {
  fetchUrl(res, url, 0, options);
};
