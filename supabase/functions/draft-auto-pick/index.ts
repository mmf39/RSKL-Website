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

  return json(payload, response.ok ? 200 : response.status);
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json",
    },
  });
}
