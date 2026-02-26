const BOXSCORE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=321367914&single=true&output=csv";

function parseAmericanOdds(text) {
  const source = String(text || "");
  const tailInParens = source.match(/\(([-+]\d{3,4})\)\s*$/);
  if (tailInParens) return Number(tailInParens[1]);
  const all = source.match(/[-+]\d{3,4}/g);
  return all && all.length ? Number(all[all.length - 1]) : -110;
}

function profitFromOdds(stake, odds) {
  const amount = Number(stake || 0);
  const o = Number(odds || -110);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (!Number.isFinite(o) || o === 0) return 0;
  if (o > 0) return (amount * o) / 100;
  return (amount * 100) / Math.abs(o);
}

function parseWagerPick(raw) {
  const pick = String(raw || "").trim();
  const odds = parseAmericanOdds(pick);
  const isSpread = /\bSPREAD\b/i.test(pick);
  if (!isSpread) {
    const team = pick.replace(/\s+ML\b.*$/i, "").trim();
    return { type: "moneyline", team: normalizeTeamName(team), spread: 0, odds };
  }
  const beforeSpread = pick.replace(/\s+SPREAD\b.*$/i, "").trim();
  const spreadMatch = beforeSpread.match(/([+-]?\d+(?:\.\d+)?)\s*$/);
  const spread = spreadMatch ? Number(spreadMatch[1]) : 0;
  const team = beforeSpread
    .replace(/([+-]?\d+(?:\.\d+)?)\s*$/, "")
    .trim();
  return { type: "spread", team: normalizeTeamName(team), spread, odds };
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(value.trim());
      value = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value.trim());
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
      value = "";
      continue;
    }
    value += char;
  }
  if (value.length || row.length) {
    row.push(value.trim());
    rows.push(row);
  }
  return rows;
}

function normalizeDateToken(value) {
  const text = String(value || "").trim();
  const match = text.match(/(\d{1,2}\/\d{1,2})(?:\/\d{2,4})?/);
  return match ? match[1] : "";
}

function normalizeTeamName(value) {
  const text = String(value || "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[:*]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return text === "bullets" ? "storm" : text;
}

function parseTeamHeader(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(.*?)(?:\(([-+]?\d+)\))?\s*$/);
  return {
    name: (match ? match[1] : text).trim(),
    score: match && match[2] ? Number(match[2]) : null,
  };
}

function buildFinalMap(rows) {
  const finals = new Map();
  let currentDay = "";
  rows.forEach((row) => {
    const a = String(row[0] || "").trim();
    const b = String(row[1] || "").trim();
    if (a.includes("League Day") || b.includes("League Day")) {
      currentDay = normalizeDateToken(a || b);
      return;
    }
    if (!currentDay) return;
    const left = String(row[0] || "").trim();
    const right = String(row[4] || "").trim();
    if (!left || !right) return;
    if (left.startsWith("@") || right.startsWith("@")) return;
    const t1 = parseTeamHeader(left);
    const t2 = parseTeamHeader(right);
    if (!t1.name || !t2.name || t1.score === null || t2.score === null) return;
    const key = `${currentDay}|${normalizeTeamName(t1.name)}|${normalizeTeamName(
      t2.name
    )}`;
    const keySwap = `${currentDay}|${normalizeTeamName(
      t2.name
    )}|${normalizeTeamName(t1.name)}`;
    finals.set(key, { t1, t2 });
    finals.set(keySwap, { t1: t2, t2: t1 });
  });
  return finals;
}

async function sbFetch(path, method, key, body) {
  const res = await fetch(path, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (_) {
    json = text;
  }
  return { ok: res.ok, status: res.status, data: json };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end("Method not allowed");
    return;
  }

  const url = process.env.SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !serviceKey) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, message: "Missing Supabase env vars" }));
    return;
  }

  try {
    const openWagersRes = await sbFetch(
      `${url}/rest/v1/wagers?select=id,user_id,game_key,team_pick,stake&status=eq.open`,
      "GET",
      serviceKey
    );
    if (!openWagersRes.ok) {
      throw new Error(`Failed to load open wagers (${openWagersRes.status})`);
    }
    const openWagers = Array.isArray(openWagersRes.data) ? openWagersRes.data : [];
    if (!openWagers.length) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: true, settled: 0, message: "No open wagers" }));
      return;
    }

    const boxRes = await fetch(BOXSCORE_URL, { cache: "no-store" });
    if (!boxRes.ok) {
      throw new Error(`Failed to load boxscore sheet (${boxRes.status})`);
    }
    const finalMap = buildFinalMap(parseCSV(await boxRes.text()));

    const bankrollCredits = new Map();
    let settled = 0;

    for (const wager of openWagers) {
      const gameKey = String(wager.game_key || "");
      const lookupKey = gameKey.includes("#") ? gameKey.split("#")[0] : gameKey;
      const final = finalMap.get(lookupKey);
      if (!final) continue;

      const parsedPick = parseWagerPick(wager.team_pick);
      const winner =
        final.t1.score > final.t2.score
          ? normalizeTeamName(final.t1.name)
          : final.t2.score > final.t1.score
          ? normalizeTeamName(final.t2.name)
          : "";

      const stake = Number(wager.stake || 0);
      let status = "lost";
      let credit = 0;
      let payout = 0;
      if (parsedPick.type === "moneyline") {
        if (!winner) {
          status = "push";
          credit = stake;
          payout = stake;
        } else if (parsedPick.team === winner) {
          const profit = profitFromOdds(stake, parsedPick.odds);
          status = "won";
          credit = stake + profit;
          payout = profit;
        }
      } else {
        const pickedIsT1 = parsedPick.team === normalizeTeamName(final.t1.name);
        const pickedIsT2 = parsedPick.team === normalizeTeamName(final.t2.name);
        if (!pickedIsT1 && !pickedIsT2) {
          status = "lost";
        } else {
          const pickedScore = pickedIsT1 ? final.t1.score : final.t2.score;
          const oppScore = pickedIsT1 ? final.t2.score : final.t1.score;
          const marginWithSpread = pickedScore + Number(parsedPick.spread || 0) - oppScore;
          if (marginWithSpread > 0) {
            const profit = profitFromOdds(stake, parsedPick.odds);
            status = "won";
            credit = stake + profit;
            payout = profit;
          } else if (marginWithSpread === 0) {
            status = "push";
            credit = stake;
            payout = stake;
          } else {
            status = "lost";
          }
        }
      }

      const updateRes = await sbFetch(
        `${url}/rest/v1/wagers?id=eq.${wager.id}`,
        "PATCH",
        serviceKey,
        {
          status,
          payout,
          settled_at: new Date().toISOString(),
        }
      );
      if (!updateRes.ok) continue;

      if (credit > 0) {
        bankrollCredits.set(
          wager.user_id,
          (bankrollCredits.get(wager.user_id) || 0) + credit
        );
      }
      settled += 1;
    }

    for (const [userId, credit] of bankrollCredits.entries()) {
      const profileRes = await sbFetch(
        `${url}/rest/v1/profiles?select=user_id,bankroll&user_id=eq.${userId}`,
        "GET",
        serviceKey
      );
      const profile = Array.isArray(profileRes.data) ? profileRes.data[0] : null;
      if (!profile) continue;
      const bankroll = Number(profile.bankroll || 0);
      await sbFetch(
        `${url}/rest/v1/profiles?user_id=eq.${userId}`,
        "PATCH",
        serviceKey,
        { bankroll: bankroll + credit, updated_at: new Date().toISOString() }
      );
    }

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: true, settled }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, message: error.message }));
  }
};
