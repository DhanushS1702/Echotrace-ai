import os
import sys

# Ensure backend folder is on Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app
