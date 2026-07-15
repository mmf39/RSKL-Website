const https = require("https");

const QUEUE_TABLE = "real_post_queue";
const ALLOWED_STATUSES = new Set(["pending", "copied", "posted", "dismissed"]);

function getSupabaseConfig() {
  const url = String(process.env.SUPABASE_URL || "").trim().replace(/\/$/, "");
  const anonKey = String(process.env.SUPABASE_ANON_KEY || "").trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !serviceRoleKey) {
    const error = new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    error.status = 500;
    throw error;
  }
  return { url, anonKey, serviceRoleKey };
}

function requestJson(method, urlString, headers = {}, body = "") {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const req = https.request(
      {
        method,
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        headers: {
          ...headers,
          ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          const status = res.statusCode || 200;
          if (status >= 400) {
            const error = new Error(`Supabase error ${status}: ${data.slice(0, 260)}`);
            error.status = status;
            reject(error);
            return;
          }
          try {
            resolve(data ? JSON.parse(data) : []);
          } catch (_) {
            resolve([]);
          }
        });
      }
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function serviceHeaders(extra = {}) {
  const { serviceRoleKey } = getSupabaseConfig();
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...extra,
  };
}

function sanitizeAnnouncement(payload = {}) {
  const announcementType = String(payload.announcementType || payload.announcement_type || "").trim();
  const message = String(payload.message || "").trim();
  const eventKey = String(payload.eventKey || payload.event_key || "").trim();
  const rawGroupId = payload.groupId ?? payload.group_id;
  const groupId = rawGroupId === undefined || rawGroupId === null || rawGroupId === "" ? null : Number(rawGroupId);
  if (!announcementType) {
    const error = new Error("announcementType is required.");
    error.status = 400;
    throw error;
  }
  if (!message) {
    const error = new Error("message is required.");
    error.status = 400;
    throw error;
  }
  if (!eventKey) {
    const error = new Error("eventKey is required.");
    error.status = 400;
    throw error;
  }
  return {
    group_id: Number.isFinite(groupId) ? groupId : null,
    announcement_type: announcementType.slice(0, 80),
    title: String(payload.title || "").trim().slice(0, 160) || null,
    message,
    status: "pending",
    event_key: eventKey.slice(0, 180),
    created_by: String(payload.createdBy || payload.created_by || "").trim().slice(0, 120) || null,
  };
}

function normalizeQueueRow(row = {}) {
  return {
    id: row.id || "",
    groupId: row.group_id ?? null,
    announcementType: String(row.announcement_type || "").trim(),
    title: String(row.title || "").trim(),
    message: String(row.message || "").trim(),
    status: String(row.status || "pending").trim(),
    eventKey: String(row.event_key || "").trim(),
    createdAt: row.created_at || "",
    copiedAt: row.copied_at || "",
    postedAt: row.posted_at || "",
    createdBy: String(row.created_by || "").trim(),
    errorMessage: String(row.error_message || "").trim(),
  };
}

async function assertCommish(req) {
  const { url, anonKey } = getSupabaseConfig();
  if (!anonKey) {
    const error = new Error("Missing SUPABASE_ANON_KEY.");
    error.status = 500;
    throw error;
  }
  const authHeader = String(req.headers.authorization || "").trim();
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    const error = new Error("Commissioner authorization required.");
    error.status = 401;
    throw error;
  }
  const user = await requestJson("GET", `${url}/auth/v1/user?apikey=${encodeURIComponent(anonKey)}`, {
    apikey: anonKey,
    Authorization: `Bearer ${token}`,
  });
  const userId = String(user?.id || "").trim();
  if (!userId) {
    const error = new Error("Invalid commissioner session.");
    error.status = 401;
    throw error;
  }
  const params = new URLSearchParams();
  params.set("select", "user_id,role,is_commish");
  params.set("user_id", `eq.${userId}`);
  params.set("limit", "1");
  const rows = await requestJson(
    "GET",
    `${url}/rest/v1/gm_assignments?${params.toString()}`,
    serviceHeaders({ Accept: "application/json" })
  );
  const row = Array.isArray(rows) ? rows[0] : null;
  const role = String(row?.role || "").trim().toLowerCase();
  const isCommish = row?.is_commish === true || ["commish", "commissioner", "admin"].includes(role);
  if (!isCommish) {
    const error = new Error("Only the commissioner can manage Real announcement queue records.");
    error.status = 403;
    throw error;
  }
  return { userId, role };
}

function assertAutomationSecret(req) {
  const expected = String(process.env.AUTOMATION_SECRET || "").trim();
  const received = String(req.headers["x-automation-secret"] || "").trim();
  if (!expected || !received || received !== expected) {
    const error = new Error("Invalid automation secret.");
    error.status = 401;
    throw error;
  }
}

function assertCronSecret(req) {
  const expected = String(process.env.CRON_SECRET || "").trim();
  const authHeader = String(req.headers.authorization || "").trim();
  if (!expected || authHeader !== `Bearer ${expected}`) {
    const error = new Error("Invalid cron secret.");
    error.status = 401;
    throw error;
  }
}

async function queueRealAnnouncement(payload) {
  const { url } = getSupabaseConfig();
  const row = sanitizeAnnouncement(payload);
  const params = new URLSearchParams();
  params.set("on_conflict", "event_key");
  const rows = await requestJson(
    "POST",
    `${url}/rest/v1/${QUEUE_TABLE}?${params.toString()}`,
    serviceHeaders({ Prefer: "resolution=ignore-duplicates,return=representation" }),
    JSON.stringify([row])
  );
  const inserted = Array.isArray(rows) && rows.length > 0;
  if (inserted) {
    return { inserted: true, duplicate: false, announcement: normalizeQueueRow(rows[0]) };
  }
  const existing = await fetchAnnouncementByEventKey(row.event_key);
  return { inserted: false, duplicate: true, announcement: existing };
}

async function fetchAnnouncementByEventKey(eventKey) {
  const { url } = getSupabaseConfig();
  const params = new URLSearchParams();
  params.set("select", "*");
  params.set("event_key", `eq.${eventKey}`);
  params.set("limit", "1");
  const rows = await requestJson(
    "GET",
    `${url}/rest/v1/${QUEUE_TABLE}?${params.toString()}`,
    serviceHeaders({ Accept: "application/json" })
  );
  return normalizeQueueRow(Array.isArray(rows) ? rows[0] : null);
}

async function fetchQueue(status = "pending") {
  const { url } = getSupabaseConfig();
  const cleanStatus = String(status || "pending").trim().toLowerCase();
  const params = new URLSearchParams();
  params.set("select", "*");
  if (cleanStatus !== "all") {
    if (!ALLOWED_STATUSES.has(cleanStatus)) {
      const error = new Error("Invalid queue status filter.");
      error.status = 400;
      throw error;
    }
    params.set("status", `eq.${cleanStatus}`);
  }
  params.set("order", "created_at.desc");
  params.set("limit", "100");
  const rows = await requestJson(
    "GET",
    `${url}/rest/v1/${QUEUE_TABLE}?${params.toString()}`,
    serviceHeaders({ Accept: "application/json" })
  );
  return (Array.isArray(rows) ? rows : []).map(normalizeQueueRow);
}

async function updateAnnouncementStatus(id, status) {
  const { url } = getSupabaseConfig();
  const cleanId = String(id || "").trim();
  const cleanStatus = String(status || "").trim().toLowerCase();
  if (!cleanId) {
    const error = new Error("Announcement id is required.");
    error.status = 400;
    throw error;
  }
  if (!ALLOWED_STATUSES.has(cleanStatus)) {
    const error = new Error("Invalid announcement status.");
    error.status = 400;
    throw error;
  }
  const patch = { status: cleanStatus };
  if (cleanStatus === "copied") patch.copied_at = new Date().toISOString();
  if (cleanStatus === "posted") patch.posted_at = new Date().toISOString();
  if (cleanStatus === "pending") {
    patch.copied_at = null;
    patch.posted_at = null;
  }
  const rows = await requestJson(
    "PATCH",
    `${url}/rest/v1/${QUEUE_TABLE}?id=eq.${encodeURIComponent(cleanId)}`,
    serviceHeaders({ Prefer: "return=representation" }),
    JSON.stringify(patch)
  );
  return normalizeQueueRow(Array.isArray(rows) ? rows[0] : null);
}

function buildWaiverAnnouncement({ dateKey, awards = [], createdBy = "waiver-processor" } = {}) {
  const cleanDateKey = String(dateKey || new Date().toISOString().slice(0, 10)).trim();
  const lines = ["📋 WAIVERS PROCESSED", ""];
  if (Array.isArray(awards) && awards.length) {
    awards.forEach((award) => {
      const team = String(award?.team || award?.teamName || "").trim();
      const player = String(award?.player || award?.playerHandle || "").trim();
      if (team && player) lines.push(`• ${team} claimed ${player}`);
    });
  }
  if (lines.length === 2) {
    lines.push("No waiver claims were awarded.");
  }
  return {
    announcementType: "waivers_processed",
    title: "Waivers Processed",
    message: lines.join("\n"),
    eventKey: `waivers-${cleanDateKey}`,
    createdBy,
  };
}

async function queueWaiverAnnouncement({ dateKey, awards, createdBy } = {}) {
  return queueRealAnnouncement(buildWaiverAnnouncement({ dateKey, awards, createdBy }));
}

module.exports = {
  assertAutomationSecret,
  assertCommish,
  assertCronSecret,
  buildWaiverAnnouncement,
  fetchQueue,
  queueRealAnnouncement,
  queueWaiverAnnouncement,
  sanitizeAnnouncement,
  updateAnnouncementStatus,
};
