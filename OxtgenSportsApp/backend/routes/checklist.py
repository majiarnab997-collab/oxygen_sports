"""
Oxygen Sports — Checklist Routes
POST /api/generate  → build prompt, call AI, save + return checklist
"""

import json
from flask import Blueprint, request, jsonify
from database import db, Generation
from ai_service import generate_checklist

checklist_bp = Blueprint("checklist", __name__)


@checklist_bp.route("/generate", methods=["POST"])
def generate():
    """
    Accepts player inputs, calls AI, stores the generation, returns checklist.

    Request JSON:
        {
            "player": "Arjun Sharma",
            "sport":  "Cricket",
            "format": "T20",
            "level":  "Club Level",
            "notes":  "recovering from ankle strain"   (optional)
        }

    Response JSON:
        {
            "success":       true,
            "generation_id": 1,
            "checklist": {
                "equipment":  ["...", ...],
                "warmup":     ["...", ...],
                "nutrition":  ["...", ...],
                "mental":     ["...", ...]
            },
            "ai_provider": "gemini"
        }
    """
    data = request.get_json()

    # ── Validate required fields ──
    required = ["player", "sport", "format", "level"]
    missing  = [f for f in required if not data.get(f, "").strip()]
    if missing:
        return jsonify({
            "success": False,
            "error":   f"Missing required fields: {', '.join(missing)}"
        }), 400

    player = data["player"].strip()
    sport  = data["sport"].strip()
    fmt    = data["format"].strip()
    level  = data["level"].strip()
    notes  = data.get("notes", "").strip()

    # ── Call AI service ──
    try:
        from config import Config
        checklist = generate_checklist(player, sport, fmt, level, notes)
        provider  = Config.AI_PROVIDER
    except Exception as e:
        return jsonify({
            "success": False,
            "error":   f"AI generation failed: {str(e)}"
        }), 500

    user_uid   = data.get("user_uid")
    user_email = data.get("user_email")

    # ── Save to database ──
    generation = Generation(
        player      = player,
        sport       = sport,
        format      = fmt,
        level       = level,
        notes       = notes,
        checklist   = json.dumps(checklist),
        ai_provider = provider,
        user_uid    = user_uid,
        user_email  = user_email,
    )
    db.session.add(generation)
    db.session.commit()

    return jsonify({
        "success":       True,
        "generation_id": generation.id,
        "checklist":     checklist,
        "ai_provider":   provider,
    }), 201