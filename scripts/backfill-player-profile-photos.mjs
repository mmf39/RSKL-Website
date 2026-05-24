const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const PLAYER_PROFILE_SCRIPT_URL =
  process.env.PLAYER_PROFILE_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbwLH2qYcWceJucuI559OzLNjk9Bh8WjQgBKZJttcrBwS13gTY1GtnJi9T5eAb0jJeSwbA/exec";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const TABLE_URL = `${SUPABASE_URL}/rest/v1/player_profiles`;

function buildHeaders() {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
}

async function fetchPendingProfiles() {
  const url = `${TABLE_URL}?select=player_tag,user_id,photo_url&or=(photo_url.is.null,photo_url.eq.)&order=player_tag.asc`;
  const response = await fetch(url, {
    headers: buildHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Unable to load player_profiles: ${response.status}`);
  }
  return response.json();
}

async function resolvePhotoUrl(playerTag, userId) {
  const cleanTag = String(playerTag || "").trim();
  const cleanUserId = String(userId || "").trim();
  if (!cleanUserId) return "";

  const scriptUrl = new URL(PLAYER_PROFILE_SCRIPT_URL);
  if (cleanTag) {
    scriptUrl.searchParams.set("player", cleanTag);
  }
  scriptUrl.searchParams.set("userId", cleanUserId);

  try {
    const response = await fetch(scriptUrl, {
      headers: {
        Accept: "application/json,*/*",
      },
    });
    if (response.ok) {
      const payload = await response.json();
      const scriptPhotoUrl = String(payload.photoUrl || "").trim();
      if (scriptPhotoUrl) {
        return scriptPhotoUrl;
      }
    }
  } catch (_error) {
    // fall through to page scrape
  }

  const profileResponse = await fetch(`https://minorkarmaleague.com/players/${encodeURIComponent(cleanUserId)}`, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "text/html,*/*",
    },
  });
  if (!profileResponse.ok) {
    return "";
  }
  const html = await profileResponse.text();
  const match = html.match(/https:\/\/media\.realapp\.com\/assets\/user\/default\/large\/[^"]+\.webp/i);
  return match ? match[0] : "";
}

async function updatePhotoUrl(playerTag, photoUrl) {
  const response = await fetch(`${TABLE_URL}?player_tag=eq.${encodeURIComponent(playerTag)}`, {
    method: "PATCH",
    headers: {
      ...buildHeaders(),
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      photo_url: photoUrl,
      updated_at: new Date().toISOString(),
    }),
  });
  if (!response.ok) {
    throw new Error(`Unable to update ${playerTag}: ${response.status}`);
  }
}

async function main() {
  const rows = await fetchPendingProfiles();
  if (!Array.isArray(rows) || !rows.length) {
    console.log("No pending player_profiles rows found.");
    return;
  }

  for (const row of rows) {
    const playerTag = String(row.player_tag || "").trim();
    const userId = String(row.user_id || "").trim();
    if (!playerTag || !userId) {
      console.log(`Skipping incomplete row: ${JSON.stringify(row)}`);
      continue;
    }
    const photoUrl = await resolvePhotoUrl(playerTag, userId);
    if (!photoUrl) {
      console.log(`No photo found for ${playerTag} (${userId})`);
      continue;
    }
    await updatePhotoUrl(playerTag, photoUrl);
    console.log(`Updated ${playerTag}`);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
