const https = require("https");

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbybgKT1WjHN7G13XiymsMNM6eO_sOtfchPsWGJfPZwLvEFJ6_QsYJ9pBt7jNWTkM9msXA/exec";

module.exports = (req, res) => {
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
    const request = https.request(
      SCRIPT_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (response) => {
        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          res.statusCode = response.statusCode || 200;
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
  });
};
