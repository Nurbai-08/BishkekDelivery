"""Run the API against local Auth Emulator settings on a separate port."""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

import uvicorn
from dotenv import load_dotenv

load_dotenv(ROOT / ".env.emulator", override=True)

from app.core.config import get_settings

settings = get_settings()
if settings.app_env != "development" or settings.firebase_project_id != "demo-bishkek":
    raise SystemExit("Requires local demo-bishkek settings in .env.emulator")

uvicorn.run("app.main:app", host="127.0.0.1", port=8001, access_log=False)
