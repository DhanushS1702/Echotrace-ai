import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app as fastapi_app

async def app(scope, receive, send):
    if scope["type"] == "http":
        path = scope.get("path", "")
        new_path = path
        if new_path.startswith("/api/index.py"):
            new_path = new_path[13:] or "/"
        elif new_path.startswith("/index.py"):
            new_path = new_path[9:] or "/"
        elif new_path.startswith("/api"):
            new_path = new_path[4:] or "/"

        if not new_path.startswith("/"):
            new_path = "/" + new_path

        scope["path"] = new_path
        scope["raw_path"] = new_path.encode("latin1")
    await fastapi_app(scope, receive, send)

