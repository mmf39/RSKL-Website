const proxy = require("./_proxy");

const C2S3_PLAYER_STATS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5rm7eqJcdWIX78vETTfsf40lMpXzvJCSdG8dGdkFBbXXC2zEzidcpGTLUzqcZQPTTVquYuLCeXoPL/pub?gid=1201938197&single=true&output=csv";

const SOURCES = {
  archive:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5rm7eqJcdWIX78vETTfsf40lMpXzvJCSdG8dGdkFBbXXC2zEzidcpGTLUzqcZQPTTVquYuLCeXoPL/pub?gid=1077518539&single=true&output=csv",
  "c2s2-regular":
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5rm7eqJcdWIX78vETTfsf40lMpXzvJCSdG8dGdkFBbXXC2zEzidcpGTLUzqcZQPTTVquYuLCeXoPL/pub?gid=346158705&single=true&output=csv",
  awards:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5rm7eqJcdWIX78vETTfsf40lMpXzvJCSdG8dGdkFBbXXC2zEzidcpGTLUzqcZQPTTVquYuLCeXoPL/pub?gid=1527593475&single=true&output=csv",
  contracts:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTr6cIsrgXTBa6ndhiGle_qOOUWgzH3KDUgPTANYDG2O_9u3_zdhOUGdzgz9yzMnqs1dgv54qg0TudU/pub?gid=959105096&single=true&output=csv",
  boxscore:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=321367914&single=true&output=csv",
  draft:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=894447035&single=true&output=csv",
  "fa-stats":
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQofWiajf4DF95vORv18Zn9DTTM5npzo_wb3SmpujdrQGctP5r6_5QDN3EbGywUSrBtQhOuczjDhU7h/pub?gid=2107593047&single=true&output=csv",
  "power-rankings":
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQofWiajf4DF95vORv18Zn9DTTM5npzo_wb3SmpujdrQGctP5r6_5QDN3EbGywUSrBtQhOuczjDhU7h/pub?gid=812582702&single=true&output=csv",
  "draft-capital":
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=1378560378&single=true&output=csv",
  "live-scoring":
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=1486072019&single=true&output=csv",
  playoffs:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=1268131675&single=true&output=csv",
  "madness-live":
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRTCAyH_FaIk97bDq5_U4-foybMKDrXMrYVWE-cDeCgHmTFtjSAQrURZBgEA8g4Bhj-TL4U-OcITkC6/pub?gid=1463615611&single=true&output=csv",
  "madness-completed":
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRTCAyH_FaIk97bDq5_U4-foybMKDrXMrYVWE-cDeCgHmTFtjSAQrURZBgEA8g4Bhj-TL4U-OcITkC6/pub?gid=443160286&single=true&output=csv",
  "player-stats": C2S3_PLAYER_STATS_URL,
  roster:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=847666124&single=true&output=csv",
  schedule:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=507537612&single=true&output=csv",
  standings:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRKB1A8VvkamcBPMWAh7vVqAlOkx1UlINThkHhfMFEfSKEfpSnbbmq5d6w0KUdUju8x47pPrCAQUtFg/pub?gid=1102670617&single=true&output=csv",
  "standings-dashboard":
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=2115060088&single=true&output=csv",
  teams:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=847666124&single=true&output=csv",
  transactions:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=1782609175&single=true&output=csv",
};

function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === "\"") {
      if (inQuotes && next === "\"") {
        value += "\"";
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

function formatCSV(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, "\"\"")}"` : value;
        })
        .join(",")
    )
    .join("\n");
}

function trimTrailingBlankRows(rows) {
  let last = rows.length - 1;
  while (last > 0 && rows[last].every((cell) => !String(cell || "").trim())) {
    last -= 1;
  }
  return rows.slice(0, last + 1);
}

function sliceC2S3PlayerStats(text) {
  const rows = parseCSV(text)
    .slice(0, 951)
    .map((row) => row.slice(7, 13));
  return `${formatCSV(trimTrailingBlankRows(rows))}\n`;
}

module.exports = (req, res) => {
  const source = req.query && req.query.name ? String(req.query.name) : "";
  const url = SOURCES[source];
  if (!url) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, message: "Invalid sheet name" }));
    return;
  }
  proxy(req, res, url, source === "player-stats" ? { transform: sliceC2S3PlayerStats } : undefined);
};
