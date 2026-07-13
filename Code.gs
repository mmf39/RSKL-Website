const PRIMARY_SHEET_ID = "1V_A4fzWN05a0YI5eWf1V7iMgOgd59_wN7Jc-RTvKj2w";
const MIRROR_SHEET_ID = "1EEFztFGUNtQqhHkftJHma3WHILDjZjv2WGErHEIuCbg";
const THIRD_SHEET_ID = "1-dtF8p4hyTtJcLM5upFokocaxA9zmPoPoKXRHGXDbxs";

const PRIMARY_TEAMS_SHEET = "Teams";
const PRIMARY_TEAMS_SHEET_GID = 847666124;
const TRADEBLOCKS_SHEET = "TradeBlocks";
const QUEUED_LINEUPS_SHEET = "Queued Lineups";
const TRANSACTION_REQUESTS_SHEET = "Transaction Requests";
const TRANSACTIONS_SHEET = "Transactions";
const DRAFT_CAPITAL_SHEET = "Draft Capital";

const MIRROR_TABS = ["Player Stats", "Completed Games", "Rosters"];

const THIRD_TABS = [
  "C1 S2 INFO",
  "C1 S3 INFO",
  "C1 S4 INFO",
  "C1 S5 INFO",
  "C1 S6 INFO",
  "C1 S7 INFO",
  "C2 S1 INFO",
  "C2 S2 INFO 1",
  "League History",
];

const RANGES = [
  { name: "Gus N Em", range: "B2:C13" },
  { name: "Storm", range: "E2:F13" },
  { name: "Turkeys", range: "H2:I13" },
  { name: "Bad Bois", range: "B17:C28" },
  { name: "Scorpions", range: "E17:F28" },
  { name: "Illegals", range: "H17:I28" },
  { name: "The Pandas", range: "B32:C43" },
  { name: "Dream Team", range: "E32:F43" },
  { name: "Super Kings", range: "H32:I43" },
  { name: "The Phantoms", range: "B45:C56" },
];

const TEAM_NAME_ALIASES = {
  bullets: "Storm",
  storm: "Storm",
  yetis: "Scorpions",
  scorpions: "Scorpions",
  thelions: "The Pandas",
  lions: "The Pandas",
  pandas: "The Pandas",
  thepandas: "The Pandas",
  thesnipers: "Super Kings",
  snipers: "Super Kings",
  superkings: "Super Kings",
  thefuture: "Dream Team",
  dreamteam: "Dream Team",
};

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function clean_(value) {
  return String(value == null ? "" : value).trim();
}

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9]/g, "");
}

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSheetByIdAndName(sheetId, name) {
  return SpreadsheetApp.openById(sheetId).getSheetByName(name);
}

function getPrimaryTeamsSheet_() {
  const ss = SpreadsheetApp.openById(PRIMARY_SHEET_ID);
  return (
    ss.getSheets().find((sheet) => sheet.getSheetId() === PRIMARY_TEAMS_SHEET_GID) ||
    ss.getSheetByName(PRIMARY_TEAMS_SHEET)
  );
}

function getLineupWorkbook_() {
  return SpreadsheetApp.openById(MIRROR_SHEET_ID);
}

function parseDueAt(cellValue) {
  if (Object.prototype.toString.call(cellValue) === "[object Date]" && !isNaN(cellValue.getTime())) {
    return cellValue;
  }

  const asString = clean_(cellValue);
  if (!asString) return null;

  const parsed = new Date(asString);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// ---------- Trade Blocks ----------
function getOrCreateTradeBlocksSheet() {
  const ss = SpreadsheetApp.openById(PRIMARY_SHEET_ID);
  let sh = ss.getSheetByName(TRADEBLOCKS_SHEET);

  if (!sh) {
    sh = ss.insertSheet(TRADEBLOCKS_SHEET);
    sh.getRange(1, 1, 1, 5).setValues([["team", "players", "picks", "notes", "updatedAt"]]);
  }

  return sh;
}

function actionGetTradeBlocks() {
  const sh = getOrCreateTradeBlocksSheet();
  const last = sh.getLastRow();
  const out = {};

  if (last > 1) {
    const rows = sh.getRange(2, 1, last - 1, 5).getValues();

    rows.forEach((r) => {
      const team = clean_(r[0]);
      if (!team) return;

      out[team] = {
        players: String(r[1] || ""),
        picks: String(r[2] || ""),
        notes: String(r[3] || ""),
        updatedAt: String(r[4] || ""),
      };
    });
  }

  return json({ ok: true, tradeBlocks: out });
}

function actionSaveTradeBlock(payload) {
  const team = clean_(payload.team);
  if (!team) return json({ ok: false, message: "Missing team" });

  const players = Array.isArray(payload.players) ? payload.players.join(", ") : String(payload.players || "");
  const picks = Array.isArray(payload.picks) ? payload.picks.join(", ") : String(payload.picks || "");
  const notes = String(payload.notes || "");
  const updatedAt = String(payload.updatedAt || new Date().toISOString());

  const sh = getOrCreateTradeBlocksSheet();
  const last = sh.getLastRow();

  let rowToWrite = 0;

  if (last > 1) {
    const teams = sh.getRange(2, 1, last - 1, 1).getValues().flat();
    const idx = teams.findIndex((t) => clean_(t).toLowerCase() === team.toLowerCase());
    if (idx >= 0) rowToWrite = idx + 2;
  }

  const vals = [[team, players, picks, notes, updatedAt]];

  if (rowToWrite > 0) sh.getRange(rowToWrite, 1, 1, 5).setValues(vals);
  else sh.getRange(last + 1, 1, 1, 5).setValues(vals);

  return json({ ok: true, team });
}

// ---------- Player Update ----------
function updatePlayerInPrimary(payload) {
  const oldTag = normalize(payload.oldTag);
  const newDisplayRaw = clean_(payload.newDisplay);
  const teamFilter = canonicalTeamName_(payload.team);

  if (!oldTag || !newDisplayRaw) {
    return { ok: false, updated: false, message: "Missing data" };
  }

  const newDisplay = newDisplayRaw.startsWith("@") ? newDisplayRaw : `@${newDisplayRaw}`;
  const newTagRaw = clean_(payload.newTag || newDisplay) || newDisplay;
  const newTagNorm = normalize(newTagRaw);

  const sheet = getPrimaryTeamsSheet_();
  if (!sheet) {
    return {
      ok: false,
      updated: false,
      message: `C2S4 Teams tab (${PRIMARY_TEAMS_SHEET_GID}) was not found in PRIMARY_SHEET_ID.`,
    };
  }

  let updated = false;
  let updatedRows = 0;

  RANGES.forEach(({ name, range }) => {
    if (teamFilter && normalize(name) !== normalize(teamFilter)) return;

    const rng = sheet.getRange(range);
    const values = rng.getDisplayValues();

    for (let r = 0; r < values.length; r++) {
      const displayCell = String(values[r][0] || "");
      const tagCell = String(values[r][1] || "");
      const dispN = normalize(displayCell);
      const tagN = normalize(tagCell);

      const isMatch =
        dispN === oldTag ||
        tagN === oldTag ||
        (newTagNorm && (dispN === newTagNorm || tagN === newTagNorm));

      if (!isMatch) continue;

      const row = rng.getRow() + r;
      const colA = rng.getColumn();

      sheet.getRange(row, colA).setValue(newDisplay);
      sheet.getRange(row, colA + 1).setValue(newTagRaw);

      updated = true;
      updatedRows++;
    }
  });

  return { ok: true, updated, updatedRows };
}

function updatePlayerInWorkbookTabs(workbookId, tabs, payload) {
  const oldTagRaw = clean_(payload.oldTag);
  const oldNorm = normalize(oldTagRaw);
  let newName = clean_(payload.newDisplay);

  if (!oldTagRaw || !newName) {
    return { ok: false, updated: false, message: "Missing data" };
  }

  if (oldTagRaw.startsWith("@") && !newName.startsWith("@")) {
    newName = `@${newName}`;
  }

  const ss = SpreadsheetApp.openById(workbookId);
  const rxRaw = new RegExp(escapeRegExp(oldTagRaw), "gi");

  let anyUpdated = false;
  let totalUpdatedCells = 0;
  const tabResults = {};

  tabs.forEach((tabName) => {
    const sh = ss.getSheetByName(tabName);

    if (!sh) {
      tabResults[tabName] = { ok: false, updatedCells: 0, message: "Tab not found" };
      return;
    }

    const range = sh.getDataRange();
    const displayValues = range.getDisplayValues();
    const values = range.getValues();
    let tabUpdatedCells = 0;

    for (let r = 0; r < displayValues.length; r++) {
      for (let c = 0; c < displayValues[r].length; c++) {
        const original = String(displayValues[r][c] || "");
        if (!original.trim()) continue;

        let next = original.replace(rxRaw, newName);

        if (next === original && normalize(original) === oldNorm) {
          next = newName;
        }

        if (next !== original) {
          values[r][c] = next;
          tabUpdatedCells++;
        }
      }
    }

    if (tabUpdatedCells > 0) {
      range.setValues(values);
      anyUpdated = true;
      totalUpdatedCells += tabUpdatedCells;
    }

    tabResults[tabName] = { ok: true, updatedCells: tabUpdatedCells, message: "" };
  });

  return {
    ok: true,
    updated: anyUpdated,
    updatedCells: totalUpdatedCells,
    tabs: tabResults,
  };
}

function actionUpdatePlayer(payload) {
  const primary = updatePlayerInPrimary(payload);
  const mirror = updatePlayerInWorkbookTabs(MIRROR_SHEET_ID, MIRROR_TABS, payload);
  const third = updatePlayerInWorkbookTabs(THIRD_SHEET_ID, THIRD_TABS, payload);

  if (!primary.ok) return json(primary);

  return json({
    ok: true,
    updated: primary.updated,
    updatedRows: primary.updatedRows || 0,
    mirrorOk: mirror.ok,
    mirrorUpdated: mirror.updated,
    mirrorUpdatedCells: mirror.updatedCells || 0,
    mirrorTabs: mirror.tabs || {},
    mirrorMessage: mirror.message || "",
    thirdOk: third.ok,
    thirdUpdated: third.updated,
    thirdUpdatedCells: third.updatedCells || 0,
    thirdTabs: third.tabs || {},
    thirdMessage: third.message || "",
  });
}

// ---------- Lineups ----------
function parseLineup_(payload) {
  return Array.isArray(payload.lineup)
    ? payload.lineup.map((p) => clean_(p)).filter(Boolean)
    : String(payload.lineup || "").split(",").map((p) => clean_(p)).filter(Boolean);
}

function validateLineup_(team, lineup, captain) {
  if (!team) return "Missing team";
  if (lineup.length !== 6) return `Need exactly 6 starters selected (found ${lineup.length}).`;
  if (!captain) return "Select a captain.";

  if (!lineup.some((p) => normalize(p) === normalize(captain))) {
    return "Captain must be one of the 6 starters.";
  }

  return "";
}

function applyLineupToRosters_(rosters, team, lineup, captain) {
  const rosterRange = rosters.getDataRange();
  const rosterValues = rosterRange.getValues();
  const rosterDisplay = rosterRange.getDisplayValues();

  const lineupSet = new Set(lineup.map((p) => normalize(p)));
  const captainNorm = normalize(captain);
  let rosterUpdatedRows = 0;

  for (let r = 1; r < rosterDisplay.length; r++) {
    const player = clean_(rosterDisplay[r][0]);
    const rowTeam = clean_(rosterDisplay[r][2]);

    if (!rowTeam || normalize(rowTeam) !== normalize(team)) continue;

    const isStarter = lineupSet.has(normalize(player));

    rosterValues[r][3] = isStarter ? "yes" : "no";
    rosterValues[r][4] = isStarter && normalize(player) === captainNorm ? "captain" : "player";

    rosterUpdatedRows++;
  }

  rosterRange.setValues(rosterValues);
  return rosterUpdatedRows;
}

function actionSubmitLineup(payload) {
  const team = clean_(payload.team);
  const lineup = parseLineup_(payload);
  const captain = clean_(payload.captain);

  const validationMessage = validateLineup_(team, lineup, captain);
  if (validationMessage) return json({ ok: false, message: validationMessage });

  const ss = getLineupWorkbook_();
  const config = ss.getSheetByName("Config");
  const rosters = ss.getSheetByName("Rosters");

  if (!config) return json({ ok: false, message: "Config tab not found" });
  if (!rosters) return json({ ok: false, message: "Rosters tab not found" });

  const dueAt = parseDueAt(config.getRange("B1").getValue());
  const tz = String(config.getRange("B2").getValue() || "America/New_York");
  const now = new Date();

  if (!dueAt) return json({ ok: false, message: "Invalid Config!B1 lineup_due_at datetime." });

  if (now.getTime() >= dueAt.getTime()) {
    return json({
      ok: false,
      message: `Lineups locked (${Utilities.formatDate(dueAt, tz, "M/d/yyyy h:mm a z")})`,
    });
  }

  const rosterUpdatedRows = applyLineupToRosters_(rosters, team, lineup, captain);
  saveSubmittedLineupSnapshot_(ss, team, lineup, captain);

  return json({ ok: true, team, lineup, captain, rosterUpdatedRows });
}

function saveSubmittedLineupSnapshot_(ss, team, lineup, captain) {
  let submitted = ss.getSheetByName("SubmittedLineups");

  if (!submitted) {
    submitted = ss.insertSheet("SubmittedLineups");
    submitted.getRange(1, 1, 1, 9).setValues([
      ["team", "p1", "p2", "p3", "p4", "p5", "p6", "captain", "submitted_at"],
    ]);
  }

  const last = submitted.getLastRow();
  let rowToWrite = 0;

  if (last > 1) {
    const teams = submitted.getRange(2, 1, last - 1, 1).getValues().flat();
    const idx = teams.findIndex((t) => clean_(t).toLowerCase() === team.toLowerCase());
    if (idx >= 0) rowToWrite = idx + 2;
  }

  const rowData = [[
    team,
    lineup[0],
    lineup[1],
    lineup[2],
    lineup[3],
    lineup[4],
    lineup[5],
    captain,
    new Date().toISOString(),
  ]];

  if (rowToWrite) submitted.getRange(rowToWrite, 1, 1, 9).setValues(rowData);
  else submitted.getRange(last + 1, 1, 1, 9).setValues(rowData);
}

// ---------- Queued Lineups ----------
function getOrCreateQueuedLineupsSheet_() {
  const ss = getLineupWorkbook_();
  let sh = ss.getSheetByName(QUEUED_LINEUPS_SHEET);

  if (!sh) {
    sh = ss.insertSheet(QUEUED_LINEUPS_SHEET);
    sh.getRange(1, 1, 1, 13).setValues([[
      "date", "team", "opponent", "p1", "p2", "p3", "p4", "p5", "p6",
      "captain", "status", "submitted_at", "applied_at",
    ]]);
  }

  return sh;
}

function actionSaveQueuedLineup(payload) {
  const team = clean_(payload.team);
  const date = clean_(payload.date);
  const opponent = clean_(payload.opponent);
  const lineup = parseLineup_(payload);
  const captain = clean_(payload.captain);

  const validationMessage = validateLineup_(team, lineup, captain);
  if (validationMessage) return json({ ok: false, message: validationMessage });
  if (!date) return json({ ok: false, message: "Missing date" });

  const sh = getOrCreateQueuedLineupsSheet_();
  const last = sh.getLastRow();
  let rowToWrite = 0;

  if (last > 1) {
    const rows = sh.getRange(2, 1, last - 1, 2).getDisplayValues();
    const idx = rows.findIndex((r) => clean_(r[0]) === date && normalize(r[1]) === normalize(team));
    if (idx >= 0) rowToWrite = idx + 2;
  }

  const rowData = [[
    date, team, opponent,
    lineup[0], lineup[1], lineup[2], lineup[3], lineup[4], lineup[5],
    captain, "queued", payload.submittedAt || new Date().toISOString(), "",
  ]];

  if (rowToWrite) sh.getRange(rowToWrite, 1, 1, 13).setValues(rowData);
  else sh.getRange(last + 1, 1, 1, 13).setValues(rowData);

  return json({ ok: true, message: `Queued lineup for ${team} on ${date}.`, team, date });
}

function applyQueuedLineupsForToday() {
  return applyQueuedLineupsForToday_();
}

function applyQueuedLineupsForToday_() {
  const ss = getLineupWorkbook_();
  const queued = getOrCreateQueuedLineupsSheet_();
  const rosters = ss.getSheetByName("Rosters");

  if (!rosters) throw new Error("Rosters tab not found");

  const qLast = queued.getLastRow();

  if (qLast < 2) {
    Logger.log("No queued lineup rows found.");
    return { ok: true, applied: 0 };
  }

  const qDisplay = queued.getRange(2, 1, qLast - 1, 13).getDisplayValues();
  let applied = 0;

  qDisplay.forEach((row, i) => {
    const sheetRow = i + 2;
    const team = clean_(row[1]);
    const lineup = row.slice(3, 9).map((p) => clean_(p)).filter(Boolean);
    const captain = clean_(row[9]);
    const status = clean_(row[10]).toLowerCase();

    Logger.log(`Row ${sheetRow}: team=${team}, status=${status}`);

    if (status === "applied" || status === "used") return;

    if (!team || lineup.length !== 6 || !captain) {
      Logger.log(`Skipping row ${sheetRow}: missing team, lineup, or captain.`);
      return;
    }

    const rosterUpdatedRows = applyLineupToRosters_(rosters, team, lineup, captain);
    saveSubmittedLineupSnapshot_(ss, team, lineup, captain);

    queued.getRange(sheetRow, 11).setValue("used");
    queued.getRange(sheetRow, 13).setValue(new Date().toISOString());

    Logger.log(`Used row ${sheetRow} for ${team}. Updated roster rows: ${rosterUpdatedRows}`);
    applied++;
  });

  Logger.log(`Applied queued lineups: ${applied}`);

  return { ok: true, applied };
}

function installQueuedLineupTrigger() {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === "applyQueuedLineupsForToday")
    .forEach((t) => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger("applyQueuedLineupsForToday")
    .timeBased()
    .atHour(7)
    .nearMinute(20)
    .inTimezone("America/New_York")
    .everyDays(1)
    .create();
}

function debugQueuedLineupsLocation() {
  const ss = getLineupWorkbook_();
  Logger.log(ss.getName());
  Logger.log(ss.getId());

  const sh = ss.getSheetByName("Queued Lineups");
  Logger.log(sh ? `Queued Lineups rows: ${sh.getLastRow()}` : "Queued Lineups tab not found");
}

// ---------- Transaction Requests ----------
function getOrCreateTransactionRequestsSheet_() {
  const ss = SpreadsheetApp.openById(PRIMARY_SHEET_ID);
  let sh = ss.getSheetByName(TRANSACTION_REQUESTS_SHEET);

  if (!sh) {
    sh = ss.insertSheet(TRANSACTION_REQUESTS_SHEET);
  }

  const headers = [
    "id", "status", "type", "team", "player", "partnerTeam", "outgoing",
    "incoming", "notes", "submittedBy", "submittedAt", "reviewedBy",
    "reviewedAt", "decision", "message", "outgoingAssets", "incomingAssets",
  ];

  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sh;
}

function parseAssetsJson_(value) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function assetLabels_(assets) {
  return (Array.isArray(assets) ? assets : [])
    .map((a) => clean_(a.label || a))
    .filter(Boolean);
}

function playerLabels_(assets) {
  return (Array.isArray(assets) ? assets : [])
    .filter((a) => clean_(a.type).toLowerCase() === "player" || clean_(a.label || a).startsWith("@"))
    .map((a) => clean_(a.label || a))
    .filter(Boolean);
}

function pickLabels_(assets) {
  return (Array.isArray(assets) ? assets : [])
    .filter((a) => clean_(a.type).toLowerCase() === "pick")
    .map((a) => clean_(a.label || a))
    .filter(Boolean);
}

function actionSubmitTransactionRequest(payload) {
  const sh = getOrCreateTransactionRequestsSheet_();

  const id = Utilities.getUuid();
  const type = clean_(payload.type).toLowerCase();
  const team = canonicalTeamName_(payload.team);
  const player = clean_(payload.player);
  const partnerTeam = canonicalTeamName_(payload.partnerTeam);
  const outgoingAssets = parseAssetsJson_(payload.outgoingAssets);
  const incomingAssets = parseAssetsJson_(payload.incomingAssets);
  const outgoing = clean_(payload.outgoing) || assetLabels_(outgoingAssets).join(", ");
  const incoming = clean_(payload.incoming) || assetLabels_(incomingAssets).join(", ");
  const notes = clean_(payload.notes);
  const submittedBy = clean_(payload.submittedBy);
  const submittedAt = clean_(payload.submittedAt) || new Date().toISOString();

  if (!team) return json({ ok: false, message: "Missing team." });
  if (!type) return json({ ok: false, message: "Missing transaction type." });
  if (type === "signing" && !player) return json({ ok: false, message: "Missing signing player." });
  if (type === "cut" && !player) return json({ ok: false, message: "Missing cut player." });
  if (type === "trade" && (!partnerTeam || !outgoing || !incoming)) {
    return json({ ok: false, message: "Missing trade details." });
  }

  sh.appendRow([
    id,
    "pending",
    type,
    team,
    player,
    partnerTeam,
    outgoing,
    incoming,
    notes,
    submittedBy,
    submittedAt,
    "",
    "",
    "",
    "",
    JSON.stringify(outgoingAssets),
    JSON.stringify(incomingAssets),
  ]);

  notifyPokeAiTransaction_(type, team, player, partnerTeam, outgoing, incoming, notes);

  return json({
    ok: true,
    id,
    message: "Transaction request submitted for commissioner approval.",
  });
}

function actionGetPendingTransactionRequests() {
  const sh = getOrCreateTransactionRequestsSheet_();
  const rows = sh.getDataRange().getDisplayValues();

  const requests = rows.slice(1)
    .filter((r) => clean_(r[1]).toLowerCase() === "pending")
    .map((r) => ({
      id: r[0],
      status: r[1],
      type: r[2],
      team: r[3],
      player: r[4],
      partnerTeam: r[5],
      outgoing: r[6],
      incoming: r[7],
      notes: r[8],
      submittedBy: r[9],
      submittedAt: r[10],
    }));

  return json({ ok: true, requests });
}

function actionReviewTransactionRequest(payload) {
  const id = clean_(payload.id);
  const decision = clean_(payload.decision).toLowerCase();
  const reviewedBy = clean_(payload.reviewedBy);
  const reviewedAt = clean_(payload.reviewedAt) || new Date().toISOString();

  if (!id) return json({ ok: false, message: "Missing transaction id." });
  if (decision !== "approved" && decision !== "declined") {
    return json({ ok: false, message: "Decision must be approved or declined." });
  }

  const sh = getOrCreateTransactionRequestsSheet_();
  const rows = sh.getDataRange().getDisplayValues();
  const idx = rows.findIndex((r, i) => i > 0 && clean_(r[0]) === id);

  if (idx === -1) return json({ ok: false, message: "Transaction request not found." });

  const rowNumber = idx + 1;
  const row = rows[idx];

  if (clean_(row[1]).toLowerCase() !== "pending") {
    return json({ ok: false, message: "Transaction already reviewed." });
  }

  let message = `Transaction ${decision}.`;

  if (decision === "approved") {
    const request = {
      type: row[2],
      team: row[3],
      player: row[4],
      partnerTeam: row[5],
      outgoing: row[6],
      incoming: row[7],
      notes: row[8],
      outgoingAssets: parseAssetsJson_(row[15]),
      incomingAssets: parseAssetsJson_(row[16]),
    };

    message = applyApprovedTransaction_(request);
    logApprovedTransaction_(request);
  }

  sh.getRange(rowNumber, 2).setValue(decision);
  sh.getRange(rowNumber, 12).setValue(reviewedBy);
  sh.getRange(rowNumber, 13).setValue(reviewedAt);
  sh.getRange(rowNumber, 14).setValue(decision);
  sh.getRange(rowNumber, 15).setValue(message);

  return json({ ok: true, message });
}

function applyApprovedTransaction_(request) {
  const type = clean_(request.type).toLowerCase();
  const team = canonicalTeamName_(request.team);
  const partnerTeam = canonicalTeamName_(request.partnerTeam);

  if (type === "signing") {
    addPlayerToTeam_(team, request.player);
    return `${team} signed ${request.player}.`;
  }

  if (type === "cut") {
    removePlayerFromTeam_(team, request.player);
    return `${team} cut ${request.player}.`;
  }

  if (type === "trade") {
    applyTradeAssets_({
      ...request,
      team,
      partnerTeam,
    });
    return `Trade approved: ${team} and ${partnerTeam}.`;
  }

  return "Report approved and logged.";
}

function applyTradeAssets_(request) {
  const outgoingAssets = request.outgoingAssets || [];
  const incomingAssets = request.incomingAssets || [];

  playerLabels_(outgoingAssets).forEach((player) => {
    removePlayerFromTeam_(request.team, player);
    addPlayerToTeam_(request.partnerTeam, player);
  });

  playerLabels_(incomingAssets).forEach((player) => {
    removePlayerFromTeam_(request.partnerTeam, player);
    addPlayerToTeam_(request.team, player);
  });

  moveDraftPicks_(request.team, request.partnerTeam, pickLabels_(outgoingAssets));
  moveDraftPicks_(request.partnerTeam, request.team, pickLabels_(incomingAssets));
}

function getPrimaryTeamRangeInfo_(team) {
  const teamName = canonicalTeamName_(team);
  return RANGES.find((r) => normalize(r.name) === normalize(teamName));
}

function canonicalTeamName_(team) {
  const cleanTeam = clean_(team);
  return TEAM_NAME_ALIASES[normalize(cleanTeam)] || cleanTeam;
}

function addPlayerToTeam_(team, player) {
  if (!team || !player) throw new Error("Missing team or player.");

  const teamName = canonicalTeamName_(team);
  const primary = getPrimaryTeamsSheet_();
  const rangeInfo = getPrimaryTeamRangeInfo_(teamName);

  if (!primary) {
    throw new Error(`C2S4 Teams tab (${PRIMARY_TEAMS_SHEET_GID}) was not found in PRIMARY_SHEET_ID.`);
  }
  if (!rangeInfo) throw new Error(`Team range not found for ${teamName}.`);

  const range = primary.getRange(rangeInfo.range);
  const values = range.getDisplayValues();

  for (let i = 0; i < values.length; i++) {
    const left = clean_(values[i][0]);
    const right = clean_(values[i][1]);

    if (!left && !right) {
      const row = range.getRow() + i;
      const col = range.getColumn();

      primary.getRange(row, col).setValue(player);
      primary.getRange(row, col + 1).setValue(player);
      addPlayerToMirrorRoster_(teamName, player);
      return;
    }
  }

  throw new Error(`No open roster spot found for ${teamName}.`);
}

function removePlayerFromTeam_(team, player) {
  if (!team || !player) throw new Error("Missing team or player.");

  const teamName = canonicalTeamName_(team);
  const primary = getPrimaryTeamsSheet_();
  const rangeInfo = getPrimaryTeamRangeInfo_(teamName);

  if (!primary) {
    throw new Error(`C2S4 Teams tab (${PRIMARY_TEAMS_SHEET_GID}) was not found in PRIMARY_SHEET_ID.`);
  }
  if (!rangeInfo) throw new Error(`Team range not found for ${teamName}.`);

  const range = primary.getRange(rangeInfo.range);
  const values = range.getDisplayValues();

  for (let i = 0; i < values.length; i++) {
    const left = clean_(values[i][0]);
    const right = clean_(values[i][1]);

    if (normalize(left) === normalize(player) || normalize(right) === normalize(player)) {
      const row = range.getRow() + i;
      const col = range.getColumn();

      primary.getRange(row, col, 1, 2).clearContent();
      removePlayerFromMirrorRoster_(teamName, player);
      return;
    }
  }

  throw new Error(`${player} was not found on ${teamName}.`);
}

function addPlayerToMirrorRoster_(team, player) {
  const ss = SpreadsheetApp.openById(MIRROR_SHEET_ID);
  const sh = ss.getSheetByName("Rosters");
  if (!sh) return;

  sh.appendRow([player, "", team, "no", "player"]);
}

function removePlayerFromMirrorRoster_(team, player) {
  const ss = SpreadsheetApp.openById(MIRROR_SHEET_ID);
  const sh = ss.getSheetByName("Rosters");
  if (!sh) return;

  const rows = sh.getDataRange().getDisplayValues();

  for (let i = rows.length - 1; i >= 1; i--) {
    const rowPlayer = clean_(rows[i][0]);
    const rowTeam = clean_(rows[i][2]);

    if (normalize(rowPlayer) === normalize(player) && normalize(rowTeam) === normalize(team)) {
      sh.deleteRow(i + 1);
      return;
    }
  }
}

function moveDraftPicks_(fromTeam, toTeam, picks) {
  if (!picks.length) return;

  const ss = SpreadsheetApp.openById(PRIMARY_SHEET_ID);
  const sh = ss.getSheetByName(DRAFT_CAPITAL_SHEET);
  if (!sh) return;

  const values = sh.getDataRange().getDisplayValues();
  const fromCol = findDraftCapitalTeamCol_(values, fromTeam);
  const toCol = findDraftCapitalTeamCol_(values, toTeam);

  if (fromCol === -1 || toCol === -1) return;

  picks.forEach((pick) => {
    for (let r = 1; r < values.length; r++) {
      if (normalize(values[r][fromCol]) !== normalize(pick)) continue;

      sh.getRange(r + 1, fromCol + 1).clearContent();
      const targetRow = findFirstEmptyInColumn_(sh, toCol + 1, 2);
      sh.getRange(targetRow, toCol + 1).setValue(pick);
      return;
    }
  });
}

function findDraftCapitalTeamCol_(values, team) {
  const header = values[0] || [];
  const target = normalize(canonicalTeamName_(team));
  return header.findIndex(
    (cell) => normalize(canonicalTeamName_(cell)) === target
  );
}

function findFirstEmptyInColumn_(sheet, col, startRow) {
  const last = Math.max(sheet.getLastRow(), startRow);
  const vals = sheet.getRange(startRow, col, last - startRow + 1, 1).getDisplayValues();
  const idx = vals.findIndex((r) => !clean_(r[0]));
  return idx >= 0 ? startRow + idx : last + 1;
}

function logApprovedTransaction_(request) {
  const ss = SpreadsheetApp.openById(PRIMARY_SHEET_ID);
  const sh = ss.getSheetByName(TRANSACTIONS_SHEET);
  if (!sh) return;

  const date = Utilities.formatDate(new Date(), "America/New_York", "M/d");
  const type = clean_(request.type).toLowerCase();

  if (type === "trade") {
    const row = findFirstEmptyRowInRange_(sh, 3, 81, 1, 5);
    sh.getRange(row, 1, 1, 5).setValues([[
      date,
      request.team,
      request.incoming,
      request.partnerTeam,
      request.outgoing,
    ]]);
    return;
  }

  if (type === "cut") {
    const row = findFirstEmptyRowInRange_(sh, 3, 81, 12, 15);
    sh.getRange(row, 12, 1, 4).setValues([[
      request.player,
      "",
      `${date} ${request.team}`,
      "",
    ]]);
    return;
  }

  if (type === "signing") {
    const row = findFirstEmptyRowInRange_(sh, 3, 81, 17, 20);
    sh.getRange(row, 17, 1, 4).setValues([[
      request.player,
      "",
      `${date} ${request.team}`,
      "",
    ]]);
  }
}

function findFirstEmptyRowInRange_(sheet, startRow, endRow, startCol, endCol) {
  const values = sheet.getRange(startRow, startCol, endRow - startRow + 1, endCol - startCol + 1).getDisplayValues();

  for (let i = 0; i < values.length; i++) {
    if (values[i].every((cell) => !clean_(cell))) {
      return startRow + i;
    }
  }

  return endRow + 1;
}

function notifyPokeAiTransaction_(type, team, player, partnerTeam, outgoing, incoming, notes) {
  const POKE_AI_WEBHOOK_URL =
    "https://poke.com/api/v1/inbound/ingest/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzNWNjODljNC02NmY4LTQwMDMtODgxNi05MThhODA4ZjNkNTIiLCJqdGkiOiJhOTEzYTgxYy00N2IyLTRkYWUtOWRkNC03YzAyZDRjMjFhZWMiLCJpYXQiOjE3ODI5MzEzODAsImV4cCI6MjA5ODI5MTM4MH0.Sfp8JaTZOtIopuSggXAgD7_WHvaWqxnCWJX0oxDAGGQ";

  const message = [
    "RSKL Transaction Request",
    `Type: ${type}`,
    `Team: ${team}`,
    player ? `Player: ${player}` : "",
    partnerTeam ? `Trade Partner: ${partnerTeam}` : "",
    outgoing ? `Outgoing: ${outgoing}` : "",
    incoming ? `Incoming: ${incoming}` : "",
    notes ? `Notes: ${notes}` : "",
    "",
    "Go to GM Admin > Commish > Pending Transactions to approve or decline.",
  ].filter(Boolean).join("\n");

  UrlFetchApp.fetch(POKE_AI_WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ message }),
    muteHttpExceptions: true,
  });
}

// ---------- Draft Picks ----------
const DRAFT_SHEET_NAME = "Draft";
const PICK_NUMBER_COL = 1;
const PLAYER_NAME_COL = 3;
const PROSPECTS_RANGE = "G1:K76";

function submitDraftPick_(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(DRAFT_SHEET_NAME);

  if (!sheet) throw new Error(`Could not find sheet tab named "${DRAFT_SHEET_NAME}".`);

  const pick = clean_(payload.pick);
  const player = clean_(payload.player);
  const pickOption = clean_(payload.pickOption).toLowerCase();

  if (!pick) throw new Error("Missing pick number.");
  if (pickOption !== "forfeit" && !player) throw new Error("Missing player name.");

  const rowNumber = findDraftPickRow_(sheet, pick);
  if (!rowNumber) throw new Error(`Could not find pick number ${pick} in the Draft sheet.`);

  sheet.getRange(rowNumber, PLAYER_NAME_COL)
    .setValue(pickOption === "forfeit" ? "FORFEITED" : player);

  const removedProspect = payload.removeDraftProspect
    ? removeDraftProspect_(sheet, player, payload.prospectsRange || PROSPECTS_RANGE)
    : false;

  return {
    ok: true,
    message: `Saved pick ${pick}.`,
    pick,
    row: rowNumber,
    removedProspect,
  };
}

function findDraftPickRow_(sheet, pick) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 1) return null;

  const targetPick = normalizePickNumber_(pick);
  const values = sheet.getRange(1, PICK_NUMBER_COL, lastRow, 1).getDisplayValues();

  for (let i = 0; i < values.length; i++) {
    const rawValue = clean_(values[i][0]);

    if (!/^\d+$/.test(rawValue)) continue;

    const rowPick = normalizePickNumber_(rawValue);
    if (rowPick && rowPick === targetPick) return i + 1;
  }

  return null;
}

function normalizePickNumber_(value) {
  const text = clean_(value);
  if (!text) return "";

  const match = text.match(/\d+/);
  return match ? String(Number(match[0])) : "";
}

function removeDraftProspect_(sheet, player, rangeA1) {
  const playerKey = normalizeDraftName_(player);
  if (!playerKey) return false;

  const range = sheet.getRange(rangeA1);
  const values = range.getValues();
  const displayValues = range.getDisplayValues();

  const startsWithHeader = displayValues[0].some((cell) =>
    ["prospect", "player", "name", "rank"].includes(clean_(cell).toLowerCase())
  );

  const startIndex = startsWithHeader ? 1 : 0;

  const matchIndex = displayValues.findIndex((row, index) => {
    if (index < startIndex) return false;
    return row.some((cell) => normalizeDraftName_(cell) === playerKey);
  });

  if (matchIndex === -1) return false;

  const nextValues = values.slice();

  for (let i = matchIndex; i < nextValues.length - 1; i++) {
    nextValues[i] = nextValues[i + 1];
  }

  nextValues[nextValues.length - 1] = nextValues[0].map(() => "");

  range.setValues(nextValues);
  return true;
}

function normalizeDraftName_(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9_.]/g, "");
}

// ---------- Router ----------
function route(payload) {
  const action = clean_(payload.action);

  if (action === "ping") return json({ ok: true, v: "gm-full-transactions-v10-draft-capital" });

  if (action === "getTradeBlocks") return actionGetTradeBlocks();
  if (action === "saveTradeBlock") return actionSaveTradeBlock(payload);
  if (action === "updatePlayer") return actionUpdatePlayer(payload);

  if (action === "submitLineup") return actionSubmitLineup(payload);
  if (action === "saveQueuedLineup") return actionSaveQueuedLineup(payload);
  if (action === "applyQueuedLineups") return json(applyQueuedLineupsForToday_());

  if (action === "submitTransactionRequest") return actionSubmitTransactionRequest(payload);
  if (action === "getPendingTransactionRequests") return actionGetPendingTransactionRequests();
  if (action === "reviewTransactionRequest") return actionReviewTransactionRequest(payload);

  if (action === "submitDraftPick") return json(submitDraftPick_(payload));

  return json({
    ok: false,
    message: `No valid action provided: ${action || "none"}`,
  });
}

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  return route(params);
}

function doPost(e) {
  let payload = {};

  try {
    payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  } catch (err) {
    payload = e && e.parameter ? e.parameter : {};
  }

  return route(payload);
}
function testPokePermission() {
  const POKE_AI_WEBHOOK_URL =
    "https://poke.com/api/v1/inbound/ingest/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzNWNjODljNC02NmY4LTQwMDMtODgxNi05MThhODA4ZjNkNTIiLCJqdGkiOiJhOTEzYTgxYy00N2IyLTRkYWUtOWRkNC03YzAyZDRjMjFhZWMiLCJpYXQiOjE3ODI5MzEzODAsImV4cCI6MjA5ODI5MTM4MH0.Sfp8JaTZOtIopuSggXAgD7_WHvaWqxnCWJX0oxDAGGQ";

  const res = UrlFetchApp.fetch(POKE_AI_WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      message: "RSKL Poke test. Apps Script permission is working."
    }),
    muteHttpExceptions: true,
  });

  Logger.log(`Poke status: ${res.getResponseCode()}`);
  Logger.log(`Poke body: ${res.getContentText()}`);
}
function moveDraftPicks_(fromTeam, toTeam, picks) {
  if (!picks.length) return;

  const ss = SpreadsheetApp.openById(PRIMARY_SHEET_ID);
  const sh = ss.getSheetByName(DRAFT_CAPITAL_SHEET);
  if (!sh) throw new Error(`Could not find "${DRAFT_CAPITAL_SHEET}" tab.`);

  picks.forEach((pick) => {
    const fromRow = findDraftCapitalTeamRow_(sh, fromTeam);
    const toRow = findDraftCapitalTeamRow_(sh, toTeam);

    if (!fromRow) throw new Error(`Could not find draft capital row for ${fromTeam}.`);
    if (!toRow) throw new Error(`Could not find draft capital row for ${toTeam}.`);

    const movedPick = removePickFromDraftCapitalRow_(sh, fromRow, pick);
    const nextPickText = formatMovedPickLabel_(movedPick || pick, fromTeam, toTeam);

    addPickToDraftCapitalRow_(sh, toRow, nextPickText);
  });
}

function findDraftCapitalTeamRow_(sheet, team) {
  const values = sheet.getDataRange().getDisplayValues();
  const target = normalize(canonicalTeamName_(team));

  for (let r = 0; r < values.length; r++) {
    if (normalize(canonicalTeamName_(values[r][0])) === target) {
      return r + 1;
    }
  }

  return 0;
}

function removePickFromDraftCapitalRow_(sheet, rowNumber, pick) {
  const lastCol = sheet.getLastColumn();
  const values = sheet.getRange(rowNumber, 1, 1, lastCol).getDisplayValues()[0];
  const target = normalize(pick);

  for (let c = 2; c <= values.length; c++) {
    const cellValue = clean_(values[c - 1]);
    if (normalize(cellValue) !== target) continue;

    sheet.getRange(rowNumber, c).clearContent();
    compactDraftCapitalRow_(sheet, rowNumber);
    return cellValue;
  }

  throw new Error(`Could not find pick "${pick}" in draft capital.`);
}

function addPickToDraftCapitalRow_(sheet, rowNumber, pick) {
  const lastCol = Math.max(sheet.getLastColumn(), 2);
  const values = sheet.getRange(rowNumber, 2, 1, lastCol - 1).getDisplayValues()[0];

  const emptyIdx = values.findIndex((value) => !clean_(value));
  const targetCol = emptyIdx >= 0 ? emptyIdx + 2 : lastCol + 1;

  sheet.getRange(rowNumber, targetCol).setValue(pick);
  compactDraftCapitalRow_(sheet, rowNumber);
}

function compactDraftCapitalRow_(sheet, rowNumber) {
  const lastCol = sheet.getLastColumn();
  const row = sheet.getRange(rowNumber, 1, 1, lastCol).getDisplayValues()[0];
  const team = row[0];
  const picks = row.slice(1).map(clean_).filter(Boolean);
  const nextRow = [team, ...picks];

  while (nextRow.length < lastCol) {
    nextRow.push("");
  }

  sheet.getRange(rowNumber, 1, 1, lastCol).setValues([nextRow]);
}

function formatMovedPickLabel_(pick, fromTeam, toTeam) {
  const text = clean_(pick);
  if (!text) return text;

  if (/\bvia\b/i.test(text)) {
    return text;
  }

  if (normalize(fromTeam) === normalize(toTeam)) {
    return text;
  }

  return `${text} via ${fromTeam}`;
}
