import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app as fastapi_app

async def app(scope, receive, send):
    if scope["type"] == "http":
        path = scope.get("path", "")
        print(f"[Vercel Handler] Received request path: {path}")
        if path.startswith("/api"):
            new_path = path[4:] or "/"
            scope["path"] = new_path
            scope["raw_path"] = new_path.encode("latin1")
            print(f"[Vercel Handler] Rewrote path to: {new_path}")
    await fastapi_app(scope, receive, send)
