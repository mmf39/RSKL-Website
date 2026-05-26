const fs = require("fs");
const path = require("path");

const FILE_PATH = path.join(process.cwd(), "assets", "data", "badge-overrides.json");

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", () => resolve(""));
  });
}

function readBadgeOverrides() {
  return JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
}

function writeBadgeOverrides(data) {
  fs.writeFileSync(FILE_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

module.exports = async (req, res) => {
  if (req.method === "GET") {
    try {
      sendJson(res, 200, readBadgeOverrides());
    } catch (error) {
      sendJson(res, 500, { ok: false, message: error.message });
    }
    return;
  }

  if (req.method === "POST") {
    try {
      let payload = req.body;
      if (!payload || typeof payload !== "object") {
        payload = JSON.parse((await readBody(req)) || "{}");
      }
      writeBadgeOverrides(payload);
      sendJson(res, 200, { ok: true, data: readBadgeOverrides() });
    } catch (error) {
      sendJson(res, 500, { ok: false, message: error.message });
    }
    return;
  }

  sendJson(res, 405, { ok: false, message: "Method not allowed." });
};
