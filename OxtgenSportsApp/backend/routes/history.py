"""
Oxygen Sports — History Routes
GET /api/history              → list all generations (newest first)
GET /api/history/<int:id>     → single generation detail
PUT /api/history/<int:id>     → update a generation record
DELETE /api/history/<int:id>  → delete a generation
"""

import json
from datetime import datetime
from flask import Blueprint, request, jsonify
from database import db, Feedback, Generation

history_bp = Blueprint("history", __name__)


@history_bp.route("/history", methods=["GET"])
def get_history():
    """
    Returns all past generations, newest first.
    Supports optional query params:
        ?sport=Cricket
        ?player=Arjun
        ?limit=20
    """
    sport  = request.args.get("sport",  "").strip()
    player = request.args.get("player", "").strip()
    limit  = int(request.args.get("limit", 50))

    uid   = request.args.get("uid", "").strip()
    email = request.args.get("email", "").strip()

    query = Generation.query.order_by(Generation.created_at.desc())

    if sport:
        query = query.filter(Generation.sport.ilike(f"%{sport}%"))
    if player:
        query = query.filter(Generation.player.ilike(f"%{player}%"))
    if uid:
        query = query.filter(Generation.user_uid == uid)
    if email:
        query = query.filter(Generation.user_email.ilike(f"%{email}%"))

    generations = query.limit(limit).all()

    return jsonify({
        "success": True,
        "count":   len(generations),
        "history": [g.to_dict() for g in generations],
    }), 200


@history_bp.route("/history/<int:generation_id>", methods=["GET"])
def get_single(generation_id):
    """
    Returns a single generation by ID including its checklist and feedback.
    """
    generation = Generation.query.get(generation_id)

    if not generation:
        return jsonify({"success": False, "error": "Generation not found"}), 404

    return jsonify({
        "success":    True,
        "generation": generation.to_dict(),
    }), 200


@history_bp.route("/history", methods=["POST"])
def create_generation():
    data = request.get_json() or {}
    player = data.get("player", "").strip()
    sport  = data.get("sport", "").strip()
    fmt    = data.get("format", "").strip()
    level  = data.get("level", "").strip()
    checklist = data.get("checklist")

    if not player or not sport or not fmt or not level or not checklist:
        return jsonify({"success": False, "error": "Missing required fields."}), 400

    try:
        checklist_json = json.dumps(checklist)
    except Exception as e:
        return jsonify({"success": False, "error": f"Invalid checklist format: {str(e)}"}), 400

    generation = Generation(
        player      = player,
        sport       = sport,
        format      = fmt,
        level       = level,
        notes       = data.get("notes", "").strip(),
        checklist   = checklist_json,
        ai_provider = data.get("ai_provider", "manual"),
        user_uid    = data.get("user_uid"),
        user_email  = data.get("user_email"),
    )
    db.session.add(generation)
    db.session.flush()

    rating  = data.get("rating")
    comment = data.get("comment")
    if rating is not None:
        feedback = Feedback(
            generation_id = generation.id,
            rating        = int(rating),
            comment       = comment or "",
        )
        db.session.add(feedback)

    db.session.commit()

    return jsonify({
        "success":    True,
        "generation": generation.to_dict(),
    }), 201


@history_bp.route("/history/<int:generation_id>", methods=["PUT"])
def update_generation(generation_id):
    """
    Updates a stored generation when the player saves or edits checklist details.
    """
    data = request.get_json() or {}
    generation = Generation.query.get(generation_id)

    if not generation:
        return jsonify({"success": False, "error": "Generation not found"}), 404

    checklist = data.get("checklist")
    if checklist is not None:
        import json
        generation.checklist = json.dumps(checklist)

    player = data.get("player")
    if player is not None:
        generation.player = player.strip()

    sport = data.get("sport")
    if sport is not None:
        generation.sport = sport.strip()

    fmt = data.get("format")
    if fmt is not None:
        generation.format = fmt.strip()

    level = data.get("level")
    if level is not None:
        generation.level = level.strip()

    notes = data.get("notes")
    if notes is not None:
        generation.notes = notes.strip()

    rating = data.get("rating")
    comment = data.get("comment")

    if rating is not None:
        existing = Feedback.query.filter_by(generation_id=generation_id).first()
        if existing:
            existing.rating  = rating
            existing.comment = comment if comment is not None else existing.comment
        else:
            feedback = Feedback(
                generation_id = generation_id,
                rating        = rating,
                comment       = comment or "",
            )
            db.session.add(feedback)

    generation.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "success":    True,
        "generation": generation.to_dict(),
    }), 200


@history_bp.route("/history/<int:generation_id>", methods=["DELETE"])
def delete_generation(generation_id):
    """
    Deletes a generation and its associated feedback.
    """
    generation = Generation.query.get(generation_id)

    if not generation:
        return jsonify({"success": False, "error": "Generation not found"}), 404

    db.session.delete(generation)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Generation {generation_id} deleted.",
    }), 200