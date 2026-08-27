const PRIMARY_SHEET_ID = "1V_A4fzWN05a0YI5eWf1V7iMgOgd59_wN7Jc-RTvKj2w";
const MIRROR_SHEET_ID = "1EEFztFGUNtQqhHkftJHma3WHILDjZjv2WGErHEIuCbg";
const THIRD_SHEET_ID = "1-dtF8p4hyTtJcLM5upFokocaxA9zmPoPoKXRHGXDbxs";

const PRIMARY_TEAMS_SHEET = "Teams";
const TRADEBLOCKS_SHEET = "TradeBlocks";
const QUEUED_LINEUPS_SHEET = "Queued Lineups";
const TRANSACTION_REQUESTS_SHEET = "Transaction Requests";
const TRANSACTIONS_SHEET = "Transactions";
const DRAFT_CAPITAL_SHEET = "Draft Capital";
const PRIMARY_SCHEDULE_SHEET_GID = 507537612;
const PRIMARY_STANDINGS_SHEET_GID = 2115060088;

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

function getPrimarySheetByGid_(gid) {
  const ss = SpreadsheetApp.openById(PRIMARY_SHEET_ID);
  return ss.getSheets().find((sheet) => sheet.getSheetId() === Number(gid)) || null;
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
  const teamFilter = clean_(payload.team);

  if (!oldTag || !newDisplayRaw) {
    return { ok: false, updated: false, message: "Missing data" };
  }

  const newDisplay = newDisplayRaw.startsWith("@") ? newDisplayRaw : `@${newDisplayRaw}`;
  const newTagRaw = clean_(payload.newTag || newDisplay) || newDisplay;
  const newTagNorm = normalize(newTagRaw);

  const sheet = getSheetByIdAndName(PRIMARY_SHEET_ID, PRIMARY_TEAMS_SHEET);
  if (!sheet) return { ok: false, updated: false, message: "Primary Teams sheet not found" };

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
  const team = clean_(payload.team);
  const player = clean_(payload.player);
  const partnerTeam = clean_(payload.partnerTeam);
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
  const rawType = clean_(request.type).toLowerCase();
  const type = rawType === "sign" ? "signing" : rawType;

  if (type === "signing") {
    addPlayerToTeam_(request.team, request.player);
    return `${request.team} signed ${request.player}.`;
  }

  if (type === "cut") {
    removePlayerFromTeam_(request.team, request.player);
    return `${request.team} cut ${request.player}.`;
  }

  if (type === "trade") {
    applyTradeAssets_(request);
    return `Trade approved: ${request.team} and ${request.partnerTeam}.`;
  }

  if (type === "namechange") {
    const result = actionUpdatePlayerData_(request);
    if (!result.ok) throw new Error(result.message || "Could not update the player name.");
    return `${request.team} changed ${request.oldTag} to ${request.newDisplay}.`;
  }

  return "Transaction approved and logged.";
}

function actionUpdatePlayerData_(request) {
  const payload = {
    oldTag: request.oldTag,
    newDisplay: request.newDisplay,
    newTag: request.newDisplay,
    team: request.team
  };

  const primary = updatePlayerInPrimary(payload);
  const mirror = updatePlayerInWorkbookTabs(MIRROR_SHEET_ID, MIRROR_TABS, payload);
  const third = updatePlayerInWorkbookTabs(THIRD_SHEET_ID, THIRD_TABS, payload);

  if (!primary.ok) return primary;

  return {
    ok: true,
    updated: primary.updated || mirror.updated || third.updated
  };
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
  return RANGES.find((r) => normalize(r.name) === normalize(team));
}

function addPlayerToTeam_(team, player) {
  if (!team || !player) throw new Error("Missing team or player.");

  const primary = SpreadsheetApp.openById(PRIMARY_SHEET_ID).getSheetByName(PRIMARY_TEAMS_SHEET);
  const rangeInfo = getPrimaryTeamRangeInfo_(team);

  if (!primary || !rangeInfo) throw new Error(`Team range not found for ${team}.`);

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
      addPlayerToMirrorRoster_(team, player);
      return;
    }
  }

  throw new Error(`No open roster spot found for ${team}.`);
}

function removePlayerFromTeam_(team, player) {
  if (!team || !player) throw new Error("Missing team or player.");

  const primary = SpreadsheetApp.openById(PRIMARY_SHEET_ID).getSheetByName(PRIMARY_TEAMS_SHEET);
  const rangeInfo = getPrimaryTeamRangeInfo_(team);

  if (!primary || !rangeInfo) throw new Error(`Team range not found for ${team}.`);

  const range = primary.getRange(rangeInfo.range);
  const values = range.getDisplayValues();

  for (let i = 0; i < values.length; i++) {
    const left = clean_(values[i][0]);
    const right = clean_(values[i][1]);

    if (normalize(left) === normalize(player) || normalize(right) === normalize(player)) {
      const row = range.getRow() + i;
      const col = range.getColumn();

      primary.getRange(row, col, 1, 2).clearContent();
      removePlayerFromMirrorRoster_(team, player);
      return;
    }
  }

  throw new Error(`${player} was not found on ${team}.`);
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
  return header.findIndex((cell) => normalize(cell) === normalize(team));
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

// ---------- Commissioner Sheet Edit ----------
function normalizeSheetEditRows_(values, maxRows, maxCols) {
  if (!Array.isArray(values)) return [];

  return values
    .slice(0, maxRows)
    .map((row) => {
      const source = Array.isArray(row) ? row : [];
      const next = [];

      for (let i = 0; i < maxCols; i++) {
        next.push(clean_(source[i]));
      }

      return next;
    })
    .filter((row, index, rows) => {
      return row.some((cell) => cell !== "") || index < rows.length - 1;
    });
}

function actionSaveSheetRoster(payload) {
  const rawTeam = clean_(payload.team);
  const rangeInfo = getPrimaryTeamRangeInfo_(rawTeam);
  const teamName = rangeInfo ? rangeInfo.name : rawTeam;
  const gm = clean_(payload.gm);
  const players = Array.isArray(payload.players)
    ? payload.players.slice(0, 10).map((player) => clean_(player))
    : [];

  if (!teamName) return json({ ok: false, message: "Missing team." });

  const sheet = getSheetByIdAndName(PRIMARY_SHEET_ID, PRIMARY_TEAMS_SHEET);
  if (!sheet) {
    throw new Error(`Could not find "${PRIMARY_TEAMS_SHEET}" tab.`);
  }

  if (!rangeInfo) {
    throw new Error(`Team range not found for ${rawTeam}.`);
  }

  while (players.length < 10) players.push("");

  const values = [[teamName, teamName], [gm, gm]].concat(
    players.map((player) => [player, player])
  );

  sheet.getRange(rangeInfo.range).clearContent();
  sheet.getRange(rangeInfo.range).setValues(values);

  return json({
    ok: true,
    message: `Saved ${teamName} roster.`,
    team: teamName,
    gm,
    players,
  });
}

function getSheetEditTarget_(sheetKey) {
  const key = clean_(sheetKey).toLowerCase();

  if (key === "c2s4-schedule" || key === "schedule") {
    return {
      sheet: getPrimarySheetByGid_(PRIMARY_SCHEDULE_SHEET_GID),
      label: "Schedule",
      startRow: 1,
      startCol: 1,
      maxRows: 250,
      maxCols: 5,
    };
  }

  if (key === "c2s4-standings" || key === "standings") {
    return {
      sheet: getPrimarySheetByGid_(PRIMARY_STANDINGS_SHEET_GID),
      label: "Standings",
      startRow: 1,
      startCol: 2,
      maxRows: 16,
      maxCols: 6,
    };
  }

  throw new Error(`Unknown sheet editor target: ${sheetKey}`);
}

function actionSaveSheetGrid(payload) {
  const target = getSheetEditTarget_(payload.sheetKey);
  if (!target.sheet) throw new Error(`${target.label} sheet tab was not found.`);

  const values = normalizeSheetEditRows_(payload.values, target.maxRows, target.maxCols);
  if (!values.length) return json({ ok: false, message: "No rows to save." });

  target.sheet
    .getRange(target.startRow, target.startCol, target.maxRows, target.maxCols)
    .clearContent();

  target.sheet
    .getRange(target.startRow, target.startCol, values.length, target.maxCols)
    .setValues(values);

  return json({
    ok: true,
    message: `Saved ${values.length} ${target.label} row${values.length === 1 ? "" : "s"}.`,
    sheetKey: payload.sheetKey,
    rows: values.length,
  });
}

// ---------- Router ----------
function route(payload) {
  const action = clean_(payload.action);

  if (action === "ping") return json({ ok: true, v: "gm-full-transactions-v8" });

  if (action === "getTradeBlocks") return actionGetTradeBlocks();
  if (action === "saveTradeBlock") return actionSaveTradeBlock(payload);
  if (action === "updatePlayer") return actionUpdatePlayer(payload);

  if (action === "submitLineup") return actionSubmitLineup(payload);
  if (action === "saveQueuedLineup") return actionSaveQueuedLineup(payload);
  if (action === "applyQueuedLineups") return json(applyQueuedLineupsForToday_());

  if (action === "submitTransaction") return json(submitTransaction_(payload));
  if (action === "approveBotTransaction") return json(approveBotTransaction_(payload));
  if (action === "submitTransactionRequest") return actionSubmitTransactionRequest(payload);
  if (action === "getPendingTransactionRequests") return actionGetPendingTransactionRequests();
  if (action === "reviewTransactionRequest") return actionReviewTransactionRequest(payload);

  if (action === "submitDraftPick") return json(submitDraftPick_(payload));
  if (action === "saveSheetRoster") return actionSaveSheetRoster(payload);
  if (action === "saveSheetGrid") return actionSaveSheetGrid(payload);

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
  const target = normalize(team);

  for (let r = 0; r < values.length; r++) {
    if (normalize(values[r][0]) === target) {
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

function findTeamByUserId_(userId, submittedTeam) {
  const id = clean_(userId);
  const requestedTeam = clean_(submittedTeam);

  // Commissioner can submit transactions for every team.
  if (id === "Y3KdBmLn") {
    return requestedTeam || "Commissioner";
  }

  const gmUserIds = {
    "4JZo9wZv": "Turkeys",
    "R3XDLZz3": "Turkeys",
    "rner1dZJ": "Gus N Em",
    "5nxBPRyv": "The Phantoms",
    "5nxPZYQn": "Illegals",
    "jvbN8dbv": "The Pandas",
    "7JkKrbKJ": "Super Kings",
    "qnBmomW3": "Dream Team",
    "QvDoOXZJ": "Bad Bois",
    "eJ9dx9bn": "Scorpions",
    "mvg4OPG3": "Storm"
  };

  return gmUserIds[id] || "";
}


function parseBotAssetList_(value) {
  return clean_(value)
    .split(",")
    .map((item) => clean_(item))
    .filter(Boolean)
    .map((label) => ({
      type: /^@/.test(label) ? "player" : /\b(pick|round|rd)\b/i.test(label) ? "pick" : "player",
      label
    }));
}

function parseBotTransactionDetails_(typeValue, team, secondTeam, details) {
  const type = clean_(typeValue).toLowerCase() === "sign"
    ? "signing"
    : clean_(typeValue).toLowerCase();

  const parsed = {
    type,
    team: clean_(team),
    player: "",
    partnerTeam: clean_(secondTeam),
    outgoing: "",
    incoming: "",
    notes: clean_(details),
    outgoingAssets: [],
    incomingAssets: [],
    oldTag: "",
    newDisplay: ""
  };

  if (type === "signing" || type === "cut") {
    parsed.player = clean_(details);
    return parsed;
  }

  if (type === "namechange") {
    const parts = clean_(details).split(/\s+/).filter(Boolean);
    parsed.oldTag = parts.shift() || "";
    parsed.newDisplay = parts.join(" ");
    return parsed;
  }

  if (type === "trade") {
    const sections = clean_(details)
      .split("|")
      .map((section) => clean_(section))
      .filter(Boolean);

    const assetSections = sections.filter((section) => /\bgive\s*:/i.test(section));

    assetSections.forEach((section) => {
      const match = section.match(/^(.*?)\s+give\s*:\s*(.*)$/i);
      if (!match) return;

      const givingTeam = clean_(match[1]);
      const assetsText = clean_(match[2]);

      if (normalize(givingTeam) === normalize(parsed.team)) {
        parsed.outgoing = assetsText;
        parsed.outgoingAssets = parseBotAssetList_(assetsText);
      } else if (
        parsed.partnerTeam &&
        normalize(givingTeam) === normalize(parsed.partnerTeam)
      ) {
        parsed.incoming = assetsText;
        parsed.incomingAssets = parseBotAssetList_(assetsText);
      }
    });

    if (!parsed.partnerTeam) {
      const tradeHeader = sections[0] || "";
      const headerMatch = tradeHeader.match(/^(.*?)\s+and\s+(.*?)\s+trade$/i);
      if (headerMatch) {
        if (!parsed.team) parsed.team = clean_(headerMatch[1]);
        parsed.partnerTeam = clean_(headerMatch[2]);
      }
    }
  }

  return parsed;
}

function submitTransaction_(data) {
  const submittedByUserId = clean_(data.submittedByUserId);
  const submittedTeam = clean_(data.team);
  const secondTeam = clean_(data.secondTeam);
  const rawTransactionType = clean_(data.transactionType).toLowerCase();
  const transactionType = rawTransactionType === "sign" ? "signing" : rawTransactionType;
  const details = clean_(data.details);
  const source = clean_(data.source) || "Real Bot";
  const submittedAt = clean_(data.submittedAt) || new Date().toISOString();

  if (!submittedByUserId) {
    return {
      ok: false,
      message: "submittedByUserId is required."
    };
  }

  if (!submittedTeam) {
    return {
      ok: false,
      message: "team is required."
    };
  }

  if (!transactionType) {
    return {
      ok: false,
      message: "transactionType is required."
    };
  }

  if (!details) {
    return {
      ok: false,
      message: "details are required."
    };
  }

  const authorizedTeam = findTeamByUserId_(
    submittedByUserId,
    submittedTeam
  );

  if (!authorizedTeam) {
    return {
      ok: false,
      message: "You are not authorized to submit transactions."
    };
  }

  if (
    submittedByUserId !== "Y3KdBmLn" &&
    normalize(authorizedTeam) !== normalize(submittedTeam)
  ) {
    return {
      ok: false,
      message: `You may only submit transactions for ${authorizedTeam}.`
    };
  }

  const parsed = parseBotTransactionDetails_(
    transactionType,
    submittedTeam,
    secondTeam,
    details
  );

  const sh = getOrCreateTransactionRequestsSheet_();
  const transactionId = Utilities.getUuid();

  sh.appendRow([
    transactionId,
    "pending",
    parsed.type,
    parsed.team,
    parsed.player,
    parsed.partnerTeam,
    parsed.outgoing,
    parsed.incoming,
    parsed.notes,
    submittedByUserId,
    submittedAt,
    "",
    "",
    "",
    "",
    JSON.stringify(parsed.outgoingAssets),
    JSON.stringify(parsed.incomingAssets)
  ]);

  return {
    ok: true,
    transactionId,
    id: transactionId,
    status: "pending",
    team: parsed.team,
    secondTeam: parsed.partnerTeam,
    transactionType: parsed.type,
    details,
    source,
    submittedByUserId,
    submittedAt,
    message: "Transaction submitted for commissioner approval."
  };
}

function approveBotTransaction_(payload) {
  const transactionId = clean_(
    payload.transactionId ||
    payload.id
  );

  const reviewedBy = clean_(
    payload.reviewedBy ||
    payload.approvedBy ||
    "Y3KdBmLn"
  );

  const reviewedAt = clean_(
    payload.reviewedAt ||
    payload.approvedAt
  ) || new Date().toISOString();

  const sh = getOrCreateTransactionRequestsSheet_();
  const rows = sh.getDataRange().getDisplayValues();

  if (rows.length < 2) {
    return {
      ok: false,
      message: "There are no transaction requests."
    };
  }

  let rowIndex = -1;

  if (transactionId) {
    rowIndex = rows.findIndex((row, index) =>
      index > 0 &&
      clean_(row[0]) === transactionId
    );
  } else {
    // No ID was supplied, so approve the newest pending transaction.
    for (let index = rows.length - 1; index >= 1; index--) {
      if (clean_(rows[index][1]).toLowerCase() === "pending") {
        rowIndex = index;
        break;
      }
    }
  }

  if (rowIndex === -1) {
    return {
      ok: false,
      message: transactionId
        ? "Transaction request not found."
        : "No pending transaction requests were found."
    };
  }

  const row = rows[rowIndex];
  const status = clean_(row[1]).toLowerCase();

  if (status !== "pending") {
    return {
      ok: false,
      message: `Transaction is already ${status || "reviewed"}.`
    };
  }

  let request = {
    type: clean_(row[2]),
    team: clean_(row[3]),
    player: clean_(row[4]),
    partnerTeam: clean_(row[5]),
    outgoing: clean_(row[6]),
    incoming: clean_(row[7]),
    notes: clean_(row[8]),
    outgoingAssets: parseAssetsJson_(row[15]),
    incomingAssets: parseAssetsJson_(row[16]),
    oldTag: "",
    newDisplay: ""
  };

  const parsedBotRequest = parseBotTransactionDetails_(
    request.type,
    request.team,
    request.partnerTeam,
    request.notes
  );

  request = {
    ...request,
    type: parsedBotRequest.type || request.type,
    team: parsedBotRequest.team || request.team,
    player: request.player || parsedBotRequest.player,
    partnerTeam: request.partnerTeam || parsedBotRequest.partnerTeam,
    outgoing: request.outgoing || parsedBotRequest.outgoing,
    incoming: request.incoming || parsedBotRequest.incoming,
    outgoingAssets: request.outgoingAssets.length
      ? request.outgoingAssets
      : parsedBotRequest.outgoingAssets,
    incomingAssets: request.incomingAssets.length
      ? request.incomingAssets
      : parsedBotRequest.incomingAssets,
    oldTag: parsedBotRequest.oldTag,
    newDisplay: parsedBotRequest.newDisplay
  };

  const type = clean_(request.type).toLowerCase();
  const canApplyTransaction =
    (type === "signing" && request.player) ||
    (type === "cut" && request.player) ||
    (
      type === "trade" &&
      request.partnerTeam &&
      (request.outgoingAssets.length || request.incomingAssets.length)
    ) ||
    (
      type === "namechange" &&
      request.oldTag &&
      request.newDisplay
    );

  if (!canApplyTransaction) {
    return {
      ok: false,
      message: `Could not read the approved ${type || "transaction"} details: ${request.notes}`
    };
  }

  const approvalMessage = applyApprovedTransaction_(request);
  logApprovedTransaction_(request);

  const sheetRow = rowIndex + 1;

  sh.getRange(sheetRow, 2).setValue("approved");
  sh.getRange(sheetRow, 12).setValue(reviewedBy);
  sh.getRange(sheetRow, 13).setValue(reviewedAt);
  sh.getRange(sheetRow, 14).setValue("approved");
  sh.getRange(sheetRow, 15).setValue(approvalMessage);

  return {
    ok: true,
    transactionId: clean_(row[0]),
    id: clean_(row[0]),
    status: "approved",
    team: request.team,
    transactionType: request.type,
    details: request.notes,
    source: "Real Bot",
    submittedByUserId: clean_(row[9]),
    submittedAt: clean_(row[10]),
    reviewedBy,
    reviewedAt,
    message: approvalMessage
  };
}
