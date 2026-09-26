import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app as fastapi_app

async def app(scope, receive, send):
    if scope["type"] == "http":
        path = scope.get("path", "")
        # Strip /api or /api/index.py prefix if present
        if path.startswith("/api/index.py"):
            new_path = path[13:] or "/"
            scope["path"] = new_path
            scope["raw_path"] = new_path.encode("latin1")
        elif path.startswith("/api"):
            new_path = path[4:] or "/"
            scope["path"] = new_path
            scope["raw_path"] = new_path.encode("latin1")
    await fastapi_app(scope, receive, send)
