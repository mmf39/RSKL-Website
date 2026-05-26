from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib.request
import urllib.error
import os
from urllib.parse import urlparse, parse_qs, urlencode
import time
import json
from datetime import datetime
from zoneinfo import ZoneInfo

PORT = int(os.environ.get("PORT", 5173))
ROOT = os.path.dirname(os.path.abspath(__file__))
BADGE_OVERRIDES_PATH = os.path.join(ROOT, "assets", "data", "badge-overrides.json")
DEFAULT_BADGE_OVERRIDES = {
    "risingStars": [],
    "rookie": {},
    "allStar": {},
}

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
LIVE_ROSTER_URL = (
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSyMvwXHxfA-8oojTmWqs3yMMwItbmrWrSGoWf8NFs2msKpTD6WmWkPKBsBRAE3m3yuQja7ed5FxgMI/pub?gid=0&single=true&output=csv"
)
PLAYER_PROFILE_SCRIPT_URL = os.environ.get("PLAYER_PROFILE_SCRIPT_URL", "")
if not PLAYER_PROFILE_SCRIPT_URL:
    PLAYER_PROFILE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwLH2qYcWceJucuI559OzLNjk9Bh8WjQgBKZJttcrBwS13gTY1GtnJi9T5eAb0jJeSwbA/exec"
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
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


def normalize_name(value):
    return str(value or "").replace("*", "").strip().lower()


def display_team_name(value):
    name = str(value or "").strip()
    if name == "Bullets":
        return "Storm"
    if name == "Yetis":
        return "Scorpions"
    if name == "The Future":
        return "Dream Team"
    if name == "Avengers":
        return "Karma Avengers"
    if name == "Currents":
        return "The Currents"
    if name == "Bolts":
        return "The Bolts"
    if name == "Doggy N em":
        return "Doggy N Em"
    if name == "Wrangler":
        return "Wranglers"
    return name


def normalize_team_name(value):
    return (
        display_team_name(str(value or ""))
        .replace(":", " ")
        .replace("*", " ")
        .replace("/", " ")
        .replace("(", " ")
        .replace(")", " ")
        .strip()
        .lower()
    )


def build_game_key(date_token, team1, team2):
    return f"{str(date_token or '').strip()}|{normalize_team_name(team1)}|{normalize_team_name(team2)}"


def parse_team_header(value):
    text = str(value or "").strip()
    if not text:
        return {"name": "", "score": ""}
    import re

    match = re.match(r"^(.*?)(?:\(([-+]?\d+)\))?\s*$", text)
    name = display_team_name((match.group(1) if match else text).strip())
    score = match.group(2).strip() if match and match.group(2) else ""
    return {"name": name, "score": score}


def get_right_name_col(row):
    right_f = str(row[5] if len(row) > 5 else "").strip()
    right_e = str(row[4] if len(row) > 4 else "").strip()
    if right_f:
        return 5
    if right_e:
        return 4
    return 5


def is_player_cell(value):
    text = str(value or "").strip()
    return text.startswith("@") or "member" in text.lower()


def extract_league_day(rows):
    for row in rows:
        left = str(row[0] if len(row) > 0 else "")
        right = str(row[1] if len(row) > 1 else "")
        if "League Day" in left or "League Day" in right:
            raw = left or right
            parts = raw.split(":")
            return parts[1].strip() if len(parts) > 1 else raw.strip()
    return ""


def get_eastern_snapshot_bucket():
    now = datetime.now(ZoneInfo("America/New_York"))
    minute_bucket = (now.minute // 15) * 15
    minute_of_day = now.hour * 60 + minute_bucket
    label_dt = now.replace(minute=minute_bucket, second=0, microsecond=0)
    label = label_dt.strftime("%I:%M %p").lstrip("0")
    return {"minuteOfDay": minute_of_day, "label": label}


def build_live_game_snapshot_payloads(rows, season_key, snapshot_info):
    league_day = extract_league_day(rows)
    if not league_day:
        return []
    start_index = 0
    for index, row in enumerate(rows):
        if "League Day" in str(row[0] if len(row) > 0 else "") or "League Day" in str(row[1] if len(row) > 1 else ""):
            start_index = index + 1
            break
    data_rows = rows[start_index:]

    def looks_like_header(left, right):
        import re

        return (
            left
            and right
            and not is_player_cell(left)
            and not is_player_cell(right)
            and (re.search(r"\(\s*-?\d+\s*\)", left) or re.search(r"\(\s*-?\d+\s*\)", right))
        )

    payload = []
    for row in data_rows:
        left = str(row[0] if len(row) > 0 else "").strip()
        right = str(row[get_right_name_col(row)] if len(row) > get_right_name_col(row) else "").strip()
        if not looks_like_header(left, right):
            continue
        team1 = parse_team_header(left)
        team2 = parse_team_header(right)
        if not team1["name"] or not team2["name"]:
            continue
        payload.append(
            {
                "season_key": season_key,
                "game_key": build_game_key(league_day, team1["name"], team2["name"]),
                "game_date": league_day,
                "team1": team1["name"],
                "team2": team2["name"],
                "team1_score": int(team1["score"] or 0),
                "team2_score": int(team2["score"] or 0),
                "snapshot_minute": snapshot_info["minuteOfDay"],
                "snapshot_label": snapshot_info["label"],
                "source": "auto",
            }
        )
    return payload


def parse_csv(text):
    rows = []
    row = []
    value = ""
    in_quotes = False
    index = 0
    while index < len(text):
        char = text[index]
        next_char = text[index + 1] if index + 1 < len(text) else ""
        if char == '"':
            if in_quotes and next_char == '"':
                value += '"'
                index += 1
            else:
                in_quotes = not in_quotes
            index += 1
            continue
        if char == "," and not in_quotes:
            row.append(value.strip())
            value = ""
            index += 1
            continue
        if (char == "\n" or char == "\r") and not in_quotes:
            if char == "\r" and next_char == "\n":
                index += 1
            row.append(value.strip())
            if len(row) > 1 or (row and row[0] != ""):
                rows.append(row)
            row = []
            value = ""
            index += 1
            continue
        value += char
        index += 1
    if value or row:
        row.append(value.strip())
        rows.append(row)
    return rows


def find_roster_record(rows, params):
    if not rows:
        return None
    header = [str(cell or "").strip().lower() for cell in rows[0]]
    user_at_idx = next((i for i, cell in enumerate(header) if cell in {"user @", "user@", "player"}), 0)
    user_id_idx = next((i for i, cell in enumerate(header) if cell in {"user id", "userid", "player id"}), 1)
    image_idx = next(
        (
            i
            for i, cell in enumerate(header)
            if cell in {"photo", "photo url", "profile picture", "profile picture url", "avatar", "image", "headshot"}
        ),
        -1,
    )
    targets = [normalize_name(params.get("player")), normalize_name(params.get("displayName"))]
    targets = [value for value in targets if value]
    for row in rows[1:]:
        handle = str(row[user_at_idx] if user_at_idx < len(row) else "").strip()
        if normalize_name(handle) not in targets:
            continue
        return {
            "handle": handle,
            "userId": str(row[user_id_idx] if user_id_idx < len(row) else "").strip(),
            "imageUrl": str(row[image_idx] if image_idx >= 0 and image_idx < len(row) else "").strip(),
        }
    return None


def fetch_json(url):
    with urllib.request.urlopen(
        urllib.request.Request(
            url,
            headers={
                "Accept": "application/json,*/*",
                "User-Agent": "RSKL Player Profile Proxy/1.0",
            },
        )
    ) as response:
        data = response.read().decode("utf-8")
        return json.loads(data or "{}")


def supabase_request(method, path, payload=None, extra_headers=None):
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    if extra_headers:
        headers.update(extra_headers)
    req = urllib.request.Request(
        f"{SUPABASE_URL}{path}",
        data=json.dumps(payload).encode("utf-8") if payload is not None else None,
        headers=headers,
        method=method,
    )
    with urllib.request.urlopen(req) as response:
        data = response.read().decode("utf-8")
        return json.loads(data or "[]")


def patch_supabase_player_tag(table, old_tag, payload):
    rows = supabase_request(
        "PATCH",
        f"/rest/v1/{table}?player_tag=eq.{urllib.parse.quote(old_tag, safe='')}",
        payload,
    )
    return len(rows) if isinstance(rows, list) else 0


def read_badge_overrides():
    with open(BADGE_OVERRIDES_PATH, "r", encoding="utf-8") as handle:
        return json.load(handle)


def sanitize_badge_overrides(data):
    return {
        "risingStars": data.get("risingStars") if isinstance(data.get("risingStars"), list) else [],
        "rookie": data.get("rookie") if isinstance(data.get("rookie"), dict) else {},
        "allStar": data.get("allStar") if isinstance(data.get("allStar"), dict) else {},
    }


def read_badge_overrides_from_supabase():
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return None
    rows = supabase_request("GET", "/rest/v1/badge_overrides?select=data&id=eq.global&limit=1")
    row = rows[0] if isinstance(rows, list) and rows else None
    if not row or not isinstance(row.get("data"), dict):
        return None
    return sanitize_badge_overrides(row.get("data"))


def write_badge_overrides(data):
    safe_data = sanitize_badge_overrides(data)
    if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
        rows = supabase_request(
            "POST",
            "/rest/v1/badge_overrides?on_conflict=id",
            [{"id": "global", "data": safe_data}],
            {"Prefer": "resolution=merge-duplicates,return=representation"},
        )
        row = rows[0] if isinstance(rows, list) and rows else None
        if row and isinstance(row.get("data"), dict):
            return sanitize_badge_overrides(row.get("data"))
        return safe_data
    with open(BADGE_OVERRIDES_PATH, "w", encoding="utf-8") as handle:
        json.dump(safe_data, handle, indent=2)
        handle.write("\n")
    return safe_data


def assert_commish_request(handler):
    if not SUPABASE_URL or not SUPABASE_ANON_KEY or not SUPABASE_SERVICE_ROLE_KEY:
        err = RuntimeError("Missing Supabase server configuration.")
        err.status = 500
        raise err

    auth_header = str(handler.headers.get("Authorization", "")).strip()
    token = auth_header[7:].strip() if auth_header.startswith("Bearer ") else ""
    if not token:
        err = RuntimeError("Commissioner authorization required.")
        err.status = 401
        raise err

    req = urllib.request.Request(
        f"{SUPABASE_URL}/auth/v1/user?apikey={urllib.parse.quote(SUPABASE_ANON_KEY, safe='')}",
        headers={
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        },
        method="GET",
    )
    with urllib.request.urlopen(req) as response:
        user = json.loads(response.read().decode("utf-8") or "{}")

    user_id = str(user.get("id", "")).strip()
    if not user_id:
        err = RuntimeError("Invalid commissioner session.")
        err.status = 401
        raise err

    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/gm_assignments?select=user_id,role,is_commish&user_id=eq.{urllib.parse.quote(user_id, safe='')}&limit=1",
        headers={
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Accept": "application/json",
        },
        method="GET",
    )
    with urllib.request.urlopen(req) as response:
        rows = json.loads(response.read().decode("utf-8") or "[]")

    row = rows[0] if isinstance(rows, list) and rows else None
    role = str((row or {}).get("role", "")).strip().lower()
    is_commish = (row or {}).get("is_commish") is True or role in {"commish", "commissioner", "admin"}
    if not is_commish:
        err = RuntimeError("Only the commissioner can access this page.")
        err.status = 403
        raise err


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query or "")

        if path == "/api/player-profile":
            player = (params.get("player") or [""])[0].strip()
            if not player:
                send(self, 400, json.dumps({"ok": False, "message": "Missing player parameter."}), "application/json; charset=utf-8", "no-store")
                return
            flat_params = {k: (v[0] if isinstance(v, list) and v else "") for k, v in params.items()}
            try:
                target = PLAYER_PROFILE_SCRIPT_URL
                query = []
                for key, value in flat_params.items():
                    if value:
                        query.append((key, value))
                if query:
                    sep = "&" if "?" in target else "?"
                    target = f"{target}{sep}{urlencode(query)}"
                profile = fetch_json(target)
                send(self, 200, json.dumps(profile), "application/json; charset=utf-8", "no-store")
            except urllib.error.HTTPError as err:
                send(self, err.code, json.dumps({"ok": False, "message": f"Upstream error {err.code}"}), "application/json; charset=utf-8", "no-store")
            except Exception as err:  # pylint: disable=broad-except
                send(self, 500, json.dumps({"ok": False, "message": str(err)}), "application/json; charset=utf-8", "no-store")
            return

        if path == "/api/game-flow":
            if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
                send(
                    self,
                    500,
                    json.dumps({"ok": False, "message": "Missing Supabase server configuration."}),
                    "application/json; charset=utf-8",
                    "no-store",
                )
                return
            game_key = str((params.get("gameKey") or [""])[0]).strip()
            season_key = str((params.get("season") or [""])[0]).strip()
            if not game_key:
                send(
                    self,
                    400,
                    json.dumps({"ok": False, "message": "Missing gameKey."}),
                    "application/json; charset=utf-8",
                    "no-store",
                )
                return
            query = (
                "/rest/v1/game_flow_snapshots?select=game_key,season_key,game_date,team1,team2,team1_score,team2_score,snapshot_minute,snapshot_label,created_at"
                f"&game_key=eq.{urllib.parse.quote(game_key, safe='')}"
            )
            if season_key:
                query += f"&season_key=eq.{urllib.parse.quote(season_key, safe='')}"
            query += "&order=snapshot_minute.asc"
            try:
                rows = supabase_request("GET", query)
                snapshots = []
                for row in rows if isinstance(rows, list) else []:
                    next_row = dict(row)
                    next_row["team1_key"] = normalize_team_name(row.get("team1", ""))
                    next_row["team2_key"] = normalize_team_name(row.get("team2", ""))
                    snapshots.append(next_row)
                send(
                    self,
                    200,
                    json.dumps({"ok": True, "snapshots": snapshots}),
                    "application/json; charset=utf-8",
                    "no-store",
                )
            except Exception as err:  # pylint: disable=broad-except
                send(
                    self,
                    500,
                    json.dumps({"ok": False, "message": str(err)}),
                    "application/json; charset=utf-8",
                    "no-store",
                )
            return

        if path == "/api/game-flow-capture":
            if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
                send(
                    self,
                    500,
                    json.dumps({"ok": False, "message": "Missing Supabase server configuration."}),
                    "application/json; charset=utf-8",
                    "no-store",
                )
                return
            season_key = str((params.get("season") or ["c2s3-regular"])[0]).strip() or "c2s3-regular"
            source = str((params.get("source") or ["auto"])[0]).strip() or "auto"
            try:
                request = urllib.request.Request(
                    LIVE_SCORING_URL,
                    headers={
                        "Accept": "text/csv,*/*",
                        "User-Agent": "RSKL Game Flow Capture/1.0",
                    },
                )
                with urllib.request.urlopen(request) as response:
                    csv_text = response.read().decode("utf-8")
                rows = parse_csv(csv_text)
                bucket = get_eastern_snapshot_bucket()
                payload = [
                    {**entry, "source": source}
                    for entry in build_live_game_snapshot_payloads(rows, season_key, bucket)
                ]
                if not payload:
                    send(
                        self,
                        200,
                        json.dumps({"ok": True, "captured": 0, "snapshots": []}),
                        "application/json; charset=utf-8",
                        "no-store",
                    )
                    return
                saved = supabase_request(
                    "POST",
                    "/rest/v1/game_flow_snapshots?on_conflict=game_key,snapshot_minute",
                    payload,
                    {"Prefer": "resolution=merge-duplicates,return=representation"},
                )
                send(
                    self,
                    200,
                    json.dumps(
                        {
                            "ok": True,
                            "captured": len(saved) if isinstance(saved, list) else len(payload),
                            "snapshotMinute": bucket["minuteOfDay"],
                            "snapshotLabel": bucket["label"],
                            "snapshots": saved if isinstance(saved, list) else payload,
                        }
                    ),
                    "application/json; charset=utf-8",
                    "no-store",
                )
            except Exception as err:  # pylint: disable=broad-except
                send(
                    self,
                    500,
                    json.dumps({"ok": False, "message": str(err)}),
                    "application/json; charset=utf-8",
                    "no-store",
                )
            return

        if path == "/api/supabase-config":
            if not SUPABASE_URL or not SUPABASE_ANON_KEY:
                send(
                    self,
                    500,
                    json.dumps({"ok": False, "message": "Missing SUPABASE_URL or SUPABASE_ANON_KEY"}),
                    "application/json; charset=utf-8",
                    "no-store",
                )
                return
            send(
                self,
                200,
                json.dumps({"ok": True, "url": SUPABASE_URL, "anonKey": SUPABASE_ANON_KEY}),
                "application/json; charset=utf-8",
                "no-store",
            )
            return

        if path == "/api/player-rename-sync":
            if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
                send(
                    self,
                    500,
                    json.dumps({"ok": False, "message": "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY."}),
                    "application/json; charset=utf-8",
                    "no-store",
                )
                return
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length) if length else b"{}"
            try:
                payload = json.loads(body.decode("utf-8") or "{}")
            except Exception:  # pylint: disable=broad-except
                payload = {}
            old_tag = str(payload.get("oldTag", "")).strip()
            new_tag = str(payload.get("newTag", "")).strip()
            new_display = str(payload.get("newDisplay", "") or new_tag).strip()
            if not old_tag or not new_tag:
                send(
                    self,
                    400,
                    json.dumps({"ok": False, "message": "Missing oldTag or newTag."}),
                    "application/json; charset=utf-8",
                    "no-store",
                )
                return
            try:
                players_updated = patch_supabase_player_tag(
                    "players",
                    old_tag,
                    {"player_tag": new_tag, "display_name": new_display},
                )
            except Exception:  # pylint: disable=broad-except
                players_updated = 0
            try:
                player_profiles_updated = patch_supabase_player_tag(
                    "player_profiles",
                    old_tag,
                    {"player_tag": new_tag},
                )
            except Exception:  # pylint: disable=broad-except
                player_profiles_updated = 0
            send(
                self,
                200,
                json.dumps(
                    {
                        "ok": True,
                        "playersUpdated": players_updated,
                        "playerProfilesUpdated": player_profiles_updated,
                    }
                ),
                "application/json; charset=utf-8",
                "no-store",
            )
            return

        if path == "/api/badge-overrides":
            if self.command == "GET":
                try:
                    send(
                        self,
                        200,
                        json.dumps(
                            sanitize_badge_overrides(
                                read_badge_overrides_from_supabase()
                                or read_badge_overrides()
                                or DEFAULT_BADGE_OVERRIDES
                            )
                        ),
                        "application/json; charset=utf-8",
                        "no-store",
                    )
                except Exception as err:  # pylint: disable=broad-except
                    send(
                        self,
                        getattr(err, "status", 500),
                        json.dumps({"ok": False, "message": str(err)}),
                        "application/json; charset=utf-8",
                        "no-store",
                    )
                return

            if self.command == "POST":
                length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(length) if length else b"{}"
                try:
                    assert_commish_request(self)
                    payload = json.loads(body.decode("utf-8") or "{}")
                    saved = write_badge_overrides(payload)
                    send(
                        self,
                        200,
                        json.dumps({"ok": True, "data": saved}),
                        "application/json; charset=utf-8",
                        "no-store",
                    )
                except Exception as err:  # pylint: disable=broad-except
                    send(
                        self,
                        getattr(err, "status", 500),
                        json.dumps({"ok": False, "message": str(err)}),
                        "application/json; charset=utf-8",
                        "no-store",
                    )
                return

            send(
                self,
                405,
                json.dumps({"ok": False, "message": "Method not allowed."}),
                "application/json; charset=utf-8",
                "no-store",
            )
            return

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

        if path == "/api/badge-overrides":
            return self.do_GET()

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
