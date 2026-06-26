"""
Oxygen Sports — Backend Configuration
All sensitive values are loaded from the .env file.
"""

import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # ── Flask ──────────────────────────────────────────────
    SECRET_KEY       = os.getenv("SECRET_KEY", "oxygen-sports-secret-key")
    DEBUG            = os.getenv("DEBUG", "True") == "True"

    # ── Database ──────────────────────────────────────────
    SQLALCHEMY_DATABASE_URI        = os.getenv("DATABASE_URL", "sqlite:///oxygen_sports.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── AI Provider ───────────────────────────────────────
    AI_PROVIDER    = os.getenv("AI_PROVIDER", "gemini")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

    # ── Models — gemini-3.5-flash is the correct default ──
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

    # ── CORS ──────────────────────────────────────────────
    _origins = os.getenv("ALLOWED_ORIGINS", "*").strip()
    if not _origins or _origins == "*":
        ALLOWED_ORIGINS = ["*"]
    else:
        ALLOWED_ORIGINS = [origin.strip() for origin in _origins.split(",") if origin.strip()]
