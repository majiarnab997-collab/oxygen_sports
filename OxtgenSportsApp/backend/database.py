"""
Oxygen Sports — Database Models
Tables: Generation, Feedback
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class Generation(db.Model):
    """
    Stores every checklist generation request + AI response.
    """
    __tablename__ = "generations"

    id           = db.Column(db.Integer,  primary_key=True)
    player       = db.Column(db.String(120), nullable=False)
    sport        = db.Column(db.String(80),  nullable=False)
    format       = db.Column(db.String(80),  nullable=False)
    level        = db.Column(db.String(80),  nullable=False)
    notes        = db.Column(db.Text,        nullable=True)

    # The full AI-generated checklist stored as JSON string
    checklist    = db.Column(db.Text,        nullable=False)

    # Which AI provider was used: "openai" | "gemini"
    ai_provider  = db.Column(db.String(20),  nullable=False)

    created_at   = db.Column(db.DateTime,    default=datetime.utcnow)

    # Relationship to feedback
    feedback     = db.relationship("Feedback", backref="generation", uselist=False)

    def to_dict(self):
        import json
        return {
            "id":          self.id,
            "player":      self.player,
            "sport":       self.sport,
            "format":      self.format,
            "level":       self.level,
            "notes":       self.notes,
            "checklist":   json.loads(self.checklist),
            "ai_provider": self.ai_provider,
            "created_at":  self.created_at.isoformat(),
            "rating":      self.feedback.rating if self.feedback else None,
            "comment":     self.feedback.comment if self.feedback else None,
        }


class Feedback(db.Model):
    """
    Stores player rating and optional comment for a generation.
    """
    __tablename__ = "feedbacks"

    id              = db.Column(db.Integer, primary_key=True)
    generation_id   = db.Column(db.Integer, db.ForeignKey("generations.id"), nullable=False, unique=True)
    rating          = db.Column(db.Integer, nullable=False)   # 1–5
    comment         = db.Column(db.Text,    nullable=True)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":            self.id,
            "generation_id": self.generation_id,
            "rating":        self.rating,
            "comment":       self.comment,
            "created_at":    self.created_at.isoformat(),
        }