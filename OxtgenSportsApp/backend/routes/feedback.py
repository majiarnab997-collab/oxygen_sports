"""
Oxygen Sports — Feedback Routes
POST /api/feedback          → save or update rating + comment
GET  /api/feedback/<int:id> → get feedback for a generation
"""

from flask import Blueprint, request, jsonify
from database import db, Feedback, Generation

feedback_bp = Blueprint("feedback", __name__)


@feedback_bp.route("/feedback", methods=["POST"])
def submit_feedback():
    """
    Saves or updates the star rating and optional comment for a generation.

    Request JSON:
        {
            "generation_id": 1,
            "rating":        4,         (integer 1–5)
            "comment":       "Great checklist!"   (optional)
        }

    Response JSON:
        {
            "success": true,
            "feedback": { "id": 1, "generation_id": 1, "rating": 4, ... }
        }
    """
    data = request.get_json()

    generation_id = data.get("generation_id")
    rating        = data.get("rating")
    comment       = data.get("comment", "").strip()

    # ── Validate ──
    if not generation_id:
        return jsonify({"success": False, "error": "generation_id is required"}), 400

    if rating is None or not isinstance(rating, int) or rating < 1 or rating > 5:
        return jsonify({"success": False, "error": "rating must be an integer between 1 and 5"}), 400

    # ── Check generation exists ──
    generation = Generation.query.get(generation_id)
    if not generation:
        return jsonify({"success": False, "error": "Generation not found"}), 404

    # ── Upsert feedback (one per generation) ──
    existing = Feedback.query.filter_by(generation_id=generation_id).first()

    if existing:
        existing.rating  = rating
        existing.comment = comment
        feedback = existing
    else:
        feedback = Feedback(
            generation_id = generation_id,
            rating        = rating,
            comment       = comment,
        )
        db.session.add(feedback)

    db.session.commit()

    return jsonify({
        "success":  True,
        "feedback": feedback.to_dict(),
    }), 200


@feedback_bp.route("/feedback/<int:generation_id>", methods=["GET"])
def get_feedback(generation_id):
    """
    Returns feedback for a specific generation.
    """
    feedback = Feedback.query.filter_by(generation_id=generation_id).first()

    if not feedback:
        return jsonify({"success": False, "error": "No feedback found"}), 404

    return jsonify({
        "success":  True,
        "feedback": feedback.to_dict(),
    }), 200