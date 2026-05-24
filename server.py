from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib.request
import urllib.error
import os
from urllib.parse import urlparse, parse_qs
import time
import json

PORT = int(os.environ.get("PORT", 5173))
ROOT = os.path.dirname(os.path.abspath(__file__))

STANDINGS_URL = (
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRKB1A8VvkamcBPMWAh7vVqAlOkx1UlINThkHhfMFEfSKEfpSnbbmq5d6w0KUdUju8x47pPrCAQUtFg/pub?gid=1102670617&single=true&output=csv"
)
STANDINGS_DASHBOARD_URL = (
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=2115060088&single=true&output=csv"
)
TEAMS_URL = (
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=847666124&single=true&output=csv"
)
ROSTER_URL = (
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=847666124&single=true&output=csv"
)
SCHEDULE_URL = (
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=507537612&single=true&output=csv"
)
BOXSCORE_URL = (
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=321367914&single=true&output=csv"
)
PLAYER_STATS_URL = (
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=2091759853&single=true&output=csv"
)
LIVE_SCORING_URL = (
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=1486072019&single=true&output=csv"
)
ARCHIVE_URL = (
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5rm7eqJcdWIX78vETTfsf40lMpXzvJCSdG8dGdkFBbXXC2zEzidcpGTLUzqcZQPTTVquYuLCeXoPL/pub?gid=1077518539&single=true&output=csv"
)
C2S2_REGULAR_URL = (
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5rm7eqJcdWIX78vETTfsf40lMpXzvJCSdG8dGdkFBbXXC2zEzidcpGTLUzqcZQPTTVquYuLCeXoPL/pub?gid=346158705&single=true&output=csv"
)
AWARDS_URL = (
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5rm7eqJcdWIX78vETTfsf40lMpXzvJCSdG8dGdkFBbXXC2zEzidcpGTLUzqcZQPTTVquYuLCeXoPL/pub?gid=1527593475&single=true&output=csv"
)
CONTRACTS_URL = (
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTr6cIsrgXTBa6ndhiGle_qOOUWgzH3KDUgPTANYDG2O_9u3_zdhOUGdzgz9yzMnqs1dgv54qg0TudU/pub?gid=959105096&single=true&output=csv"
)
SHEET_UPDATE_URL = (
    "https://script.google.com/macros/s/AKfycbylZD-O7LCsznZpnRpYsAdbp7bCbknV-qta8PO0uv_k4Tnevf8Klkbfcg6Hh5DXC9GFvg/exec"
)

MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
}

CACHE_TTL_SECONDS = 900
CACHE = {}
UNCACHED_SHEET_NAMES = {"standings", "standings-dashboard"}
SHEETS = {
    "archive": ARCHIVE_URL,
    "awards": AWARDS_URL,
    "contracts": CONTRACTS_URL,
    "boxscore": BOXSCORE_URL,
    "c2s2-regular": C2S2_REGULAR_URL,
    "draft": "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=894447035&single=true&output=csv",
    "live-scoring": LIVE_SCORING_URL,
    "player-stats": PLAYER_STATS_URL,
    "roster": ROSTER_URL,
    "schedule": SCHEDULE_URL,
    "standings": STANDINGS_URL,
    "standings-dashboard": STANDINGS_DASHBOARD_URL,
    "teams": TEAMS_URL,
    "transactions": "https://docs.google.com/spreadsheets/d/e/2PACX-1vSQ0tNTY-47XuVq8Z7W9zi_imn1WqUtrZFt8LmX_yb75g-L-oEE0dUN0SGxfiqoY-4webnYoo4APCsY/pub?gid=1782609175&single=true&output=csv",
}


def send(handler, status, body, content_type="text/plain; charset=utf-8", cache_control=None):
    handler.send_response(status)
    handler.send_header("Content-Type", content_type)
    handler.send_header("Access-Control-Allow-Origin", "*")
    if cache_control:
        handler.send_header("Cache-Control", cache_control)
    handler.end_headers()
    if isinstance(body, str):
        body = body.encode("utf-8")
    handler.wfile.write(body)


def proxy_csv(handler, url, use_cache=True):
    now = time.time()
    if use_cache:
        cached = CACHE.get(url)
    else:
        cached = None
    if cached and now - cached["time"] < CACHE_TTL_SECONDS:
        send(handler, 200, cached["data"], "text/csv; charset=utf-8", "no-store")
        return
    try:
        with urllib.request.urlopen(url) as response:
            data = response.read()
            if use_cache:
                CACHE[url] = {"time": now, "data": data}
            send(handler, 200, data, "text/csv; charset=utf-8", "no-store")
    except urllib.error.HTTPError as err:
        send(handler, err.code, f"Upstream error {err.code}", cache_control="no-store")
    except Exception as err:  # pylint: disable=broad-except
        send(handler, 500, f"Proxy error: {err}", cache_control="no-store")


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/standings":
            proxy_csv(self, STANDINGS_URL, use_cache=False)
            return
        if path == "/api/standings-dashboard":
            proxy_csv(self, STANDINGS_DASHBOARD_URL, use_cache=False)
            return
        if path == "/api/teams":
            proxy_csv(self, TEAMS_URL)
            return
        if path == "/api/roster":
            proxy_csv(self, ROSTER_URL)
            return
        if path == "/api/schedule":
            proxy_csv(self, SCHEDULE_URL)
            return
        if path == "/api/boxscore":
            proxy_csv(self, BOXSCORE_URL)
            return
        if path == "/api/player-stats":
            proxy_csv(self, PLAYER_STATS_URL)
            return
        if path == "/api/live-scoring":
            proxy_csv(self, LIVE_SCORING_URL)
            return
        if path == "/api/archive":
            proxy_csv(self, ARCHIVE_URL)
            return
        if path == "/api/awards":
            proxy_csv(self, AWARDS_URL)
            return
        if path == "/api/sheet":
            params = parse_qs(parsed.query or "")
            name = (params.get("name") or [""])[0]
            target = SHEETS.get(str(name))
            if not target:
                send(self, 400, json.dumps({"ok": False, "message": "Invalid sheet name"}), "application/json; charset=utf-8")
                return
            proxy_csv(self, target, use_cache=name not in UNCACHED_SHEET_NAMES)
            return
        if path == "/api/sheet-update":
            try:
                params = parse_qs(parsed.query or "")
                payload = {k: (v[0] if isinstance(v, list) and v else "") for k, v in params.items()}
                if "action" not in payload or not payload["action"]:
                    payload["action"] = "getTradeBlocks"
                req = urllib.request.Request(
                    SHEET_UPDATE_URL,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                with urllib.request.urlopen(req) as response:
                    data = response.read()
                    send(self, response.getcode(), data, "application/json; charset=utf-8")
            except urllib.error.HTTPError as err:
                send(self, err.code, f"Upstream error {err.code}")
            except Exception as err:  # pylint: disable=broad-except
                send(self, 500, f"Proxy error: {err}")
            return

        if path == "/":
            file_path = os.path.join(ROOT, "index.html")
        else:
            safe_path = os.path.normpath(path.lstrip("/"))
            file_path = os.path.join(ROOT, safe_path)

        if not file_path.startswith(ROOT):
            send(self, 403, "Forbidden")
            return

        if not os.path.isfile(file_path):
            send(self, 404, "Not found")
            return

        ext = os.path.splitext(file_path)[1]
        content_type = MIME.get(ext, "application/octet-stream")
        with open(file_path, "rb") as f:
            send(self, 200, f.read(), content_type)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/sheet-update":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length) if length else b"{}"
            try:
                url = SHEET_UPDATE_URL
                redirects = 5
                method = "POST"
                while redirects >= 0:
                    req = urllib.request.Request(
                        url,
                        data=body if method == "POST" else None,
                        headers={"Content-Type": "application/json"} if method == "POST" else {},
                        method=method,
                    )
                    response = urllib.request.urlopen(req)
                    status = response.getcode()
                    if status in (301, 302, 303, 307, 308):
                        location = response.headers.get("Location")
                        if not location or redirects == 0:
                            break
                        url = location
                        if status in (301, 302, 303):
                            method = "GET"
                        redirects -= 1
                        continue
                    data = response.read()
                    send(self, status, data, "application/json; charset=utf-8")
                    return
            except urllib.error.HTTPError as err:
                send(self, err.code, f"Upstream error {err.code}")
            except Exception as err:  # pylint: disable=broad-except
                send(self, 500, f"Proxy error: {err}")
            return


if __name__ == "__main__":
    print(f"Server running at http://localhost:{PORT}")
    HTTPServer(("", PORT), Handler).serve_forever()
