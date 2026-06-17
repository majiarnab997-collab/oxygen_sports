"""
Oxygen Sports — Analytics Routes
GET /api/analytics → summary stats for admin dashboard
"""

from flask import Blueprint, jsonify
from sqlalchemy import func
from database import db, Generation, Feedback

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/analytics", methods=["GET"])
def get_analytics():
    """
    Returns aggregated usage analytics for the admin dashboard.

    Response JSON:
        {
            "success": true,
            "analytics": {
                "total_generations":   42,
                "total_feedback":      30,
                "average_rating":      4.2,
                "by_sport":            [{"sport": "Cricket", "count": 18}, ...],
                "by_level":            [{"level": "Club Level", "count": 12}, ...],
                "by_ai_provider":      [{"provider": "gemini", "count": 42}],
                "rating_distribution": {"1": 0, "2": 1, "3": 4, "4": 12, "5": 13},
                "recent_generations":  [ ...last 5 generations... ]
            }
        }
    """

    # ── Total generations ──
    total_generations = Generation.query.count()

    # ── Total feedback submitted ──
    total_feedback = Feedback.query.count()

    # ── Average rating ──
    avg = db.session.query(func.avg(Feedback.rating)).scalar()
    average_rating = round(float(avg), 2) if avg else 0.0

    # ── Breakdown by sport ──
    sport_rows = (
        db.session.query(Generation.sport, func.count(Generation.id).label("count"))
        .group_by(Generation.sport)
        .order_by(func.count(Generation.id).desc())
        .all()
    )
    by_sport = [{"sport": row.sport, "count": row.count} for row in sport_rows]

    # ── Breakdown by level ──
    level_rows = (
        db.session.query(Generation.level, func.count(Generation.id).label("count"))
        .group_by(Generation.level)
        .order_by(func.count(Generation.id).desc())
        .all()
    )
    by_level = [{"level": row.level, "count": row.count} for row in level_rows]

    # ── Breakdown by AI provider ──
    provider_rows = (
        db.session.query(Generation.ai_provider, func.count(Generation.id).label("count"))
        .group_by(Generation.ai_provider)
        .all()
    )
    by_ai_provider = [{"provider": row.ai_provider, "count": row.count} for row in provider_rows]

    # ── Rating distribution (1–5) ──
    rating_rows = (
        db.session.query(Feedback.rating, func.count(Feedback.id).label("count"))
        .group_by(Feedback.rating)
        .all()
    )
    rating_distribution = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
    for row in rating_rows:
        rating_distribution[str(row.rating)] = row.count

    # ── Recent 5 generations ──
    recent = (
        Generation.query
        .order_by(Generation.created_at.desc())
        .limit(5)
        .all()
    )
    recent_generations = [g.to_dict() for g in recent]

    return jsonify({
        "success": True,
        "analytics": {
            "total_generations":   total_generations,
            "total_feedback":      total_feedback,
            "average_rating":      average_rating,
            "by_sport":            by_sport,
            "by_level":            by_level,
            "by_ai_provider":      by_ai_provider,
            "rating_distribution": rating_distribution,
            "recent_generations":  recent_generations,
        }
    }), 200