const {
  assertAutomationSecret,
  assertCommish,
  fetchQueue,
  queueRealAnnouncement,
  updateAnnouncementStatus,
} = require("./_real-post-queue");

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

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const raw = await readBody(req);
  try {
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    const error = new Error("Request body must be valid JSON.");
    error.status = 400;
    throw error;
  }
}

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      await assertCommish(req);
      const status = String(req.query?.status || new URL(req.url, "http://local").searchParams.get("status") || "pending");
      sendJson(res, 200, { ok: true, announcements: await fetchQueue(status) });
      return;
    }

    if (req.method === "POST") {
      assertAutomationSecret(req);
      const payload = await readJsonBody(req);
      const result = await queueRealAnnouncement(payload);
      sendJson(res, result.duplicate ? 200 : 201, {
        ok: true,
        duplicate: result.duplicate,
        announcement: result.announcement,
      });
      return;
    }

    if (req.method === "PATCH") {
      await assertCommish(req);
      const payload = await readJsonBody(req);
      const announcement = await updateAnnouncementStatus(payload.id, payload.status);
      sendJson(res, 200, { ok: true, announcement });
      return;
    }

    sendJson(res, 405, { ok: false, message: "Method not allowed." });
  } catch (error) {
    sendJson(res, error.status || 500, { ok: false, message: error.message || "Queue request failed." });
  }
};
