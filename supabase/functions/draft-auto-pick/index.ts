const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-draft-auto-pick-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const expectedSecret = Deno.env.get("DRAFT_AUTO_PICK_SECRET") ?? "";
  const draftSheetUpdateUrl =
    Deno.env.get("DRAFT_SHEET_UPDATE_URL") ??
    "https://script.google.com/macros/s/AKfycbybgKT1WjHN7G13XiymsMNM6eO_sOtfchPsWGJfPZwLvEFJ6_QsYJ9pBt7jNWTkM9msXA/exec";

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ ok: false, message: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." }, 500);
  }

  if (expectedSecret) {
    const providedSecret = req.headers.get("x-draft-auto-pick-secret") ?? "";
    if (providedSecret !== expectedSecret) {
      return json({ ok: false, message: "Unauthorized." }, 401);
    }
  }

  const url = new URL(req.url);
  const season = url.searchParams.get("season") || "c2s4";

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/process_expired_draft_pick`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ p_season: season }),
  });

  const text = await response.text();
  let payload: unknown = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }

  if (response.ok && isAutoPickPayload(payload) && draftSheetUpdateUrl) {
    await syncAutoPickToSheet(draftSheetUpdateUrl, payload).catch((error) => {
      payload = {
        ...payload,
        sheetSyncOk: false,
        sheetSyncMessage: error?.message ?? String(error),
      };
    });
  }

  return json(payload, response.ok ? 200 : response.status);
});

function isAutoPickPayload(payload: unknown): payload is {
  action: string;
  season: string;
  round: number;
  pick: number;
  team: string;
  player: string;
} {
  const value = payload as Record<string, unknown>;
  return value?.action === "auto_pick" && typeof value.player === "string" && value.player.length > 0;
}

async function syncAutoPickToSheet(
  draftSheetUpdateUrl: string,
  payload: { season: string; round: number; pick: number; team: string; player: string },
) {
  const target = draftSheetUpdateUrl.includes("?")
    ? `${draftSheetUpdateUrl}&action=submitDraftPick`
    : `${draftSheetUpdateUrl}?action=submitDraftPick`;
  const response = await fetch(target, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "submitDraftPick",
      season: payload.season || "c2s4",
      round: payload.round,
      pick: payload.pick,
      draftPickLabel: `Round ${payload.round} Pick ${payload.pick}`,
      pickOption: "used",
      team: payload.team,
      player: payload.player,
      removeDraftProspect: true,
      prospectsRange: "G1:K76",
      note: "Auto pick",
      sheetPickText: "Auto pick",
      commissioner: "auto-pick",
      updatedAt: new Date().toISOString(),
    }),
  });
  if (!response.ok) {
    throw new Error(`Sheet sync failed (${response.status})`);
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json",
    },
  });
}
