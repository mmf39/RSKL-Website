const proxy = require("./_proxy");

const SOURCES = {
  archive:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5rm7eqJcdWIX78vETTfsf40lMpXzvJCSdG8dGdkFBbXXC2zEzidcpGTLUzqcZQPTTVquYuLCeXoPL/pub?gid=1077518539&single=true&output=csv",
  awards:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5rm7eqJcdWIX78vETTfsf40lMpXzvJCSdG8dGdkFBbXXC2zEzidcpGTLUzqcZQPTTVquYuLCeXoPL/pub?gid=1527593475&single=true&output=csv",
  boxscore:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=321367914&single=true&output=csv",
  draft:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=894447035&single=true&output=csv",
  "draft-capital":
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=1378560378&single=true&output=csv",
  "live-scoring":
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=1486072019&single=true&output=csv",
  "player-stats":
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=2091759853&single=true&output=csv",
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

module.exports = (req, res) => {
  const source = req.query && req.query.name ? String(req.query.name) : "";
  const url = SOURCES[source];
  if (!url) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, message: "Invalid sheet name" }));
    return;
  }
  proxy(req, res, url);
};
