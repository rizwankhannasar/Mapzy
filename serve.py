#!/usr/bin/env python3
"""Tiny static server for the map app.

Serves this folder and generates /config.js from .env, so any API keys you
add later live only in .env (never committed, never hard-coded in HTML/JS).

Usage:
    python serve.py          # http://127.0.0.1:8000
"""

import json
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
HOST = "127.0.0.1"
PORT = 8000


def load_env(path: Path) -> dict:
    """Minimal .env parser (KEY=VALUE, '#' comments) — no dependencies."""
    values = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def build_config() -> str:
    env = {**load_env(ROOT / ".env"), **load_env(ROOT / ".env.local")}
    return "window.APP_CONFIG = " + json.dumps(env, indent=2) + ";\n"


def main() -> None:
    config_js = build_config().encode("utf-8")

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(ROOT), **kwargs)

        def do_GET(self):
            if urlparse(self.path).path == "/config.js":
                self.send_response(200)
                self.send_header("Content-Type", "application/javascript; charset=utf-8")
                self.send_header("Content-Length", str(len(config_js)))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(config_js)
                return
            super().do_GET()

        def log_message(self, fmt, *args):
            print("[map-app]", fmt % args)

    print(f"Map app running at http://{HOST}:{PORT}  (Ctrl+C to stop)")
    try:
        HTTPServer((HOST, PORT), Handler).serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
