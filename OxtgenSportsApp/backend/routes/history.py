"""
Oxygen Sports — History Routes
GET /api/history              → list all generations (newest first)
GET /api/history/<int:id>     → single generation detail
DELETE /api/history/<int:id>  → delete a generation
"""

from flask import Blueprint, request, jsonify
from database import db, Generation

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

    query = Generation.query.order_by(Generation.created_at.desc())

    if sport:
        query = query.filter(Generation.sport.ilike(f"%{sport}%"))
    if player:
        query = query.filter(Generation.player.ilike(f"%{player}%"))

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