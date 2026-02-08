const https = require("https");

module.exports = function proxy(req, res, url) {
  https
    .get(url, (proxyRes) => {
      let data = "";
      proxyRes.on("data", (chunk) => (data += chunk));
      proxyRes.on("end", () => {
        if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
          res.statusCode = proxyRes.statusCode;
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end(`Upstream error ${proxyRes.statusCode}`);
          return;
        }
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Cache-Control", "s-maxage=90, stale-while-revalidate=300");
        res.end(data);
      });
    })
    .on("error", (err) => {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end(`Proxy error: ${err.message}`);
    });
};
