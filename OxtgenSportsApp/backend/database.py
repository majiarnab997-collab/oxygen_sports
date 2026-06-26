"""
Oxygen Sports — Database Models
Tables: User, Generation, Feedback
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    """Stores registered users."""
    __tablename__ = "users"

    id            = db.Column(db.Integer,     primary_key=True)
    name          = db.Column(db.String(120), nullable=False)
    email         = db.Column(db.String(200), nullable=False, unique=True)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at    = db.Column(db.DateTime,    default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":         self.id,
            "name":       self.name,
            "email":      self.email,
            "created_at": self.created_at.isoformat(),
        }


class Generation(db.Model):
    """Stores every checklist generation request + AI response."""
    __tablename__ = "generations"

    id           = db.Column(db.Integer,     primary_key=True)
    player       = db.Column(db.String(120), nullable=False)
    sport        = db.Column(db.String(80),  nullable=False)
    format       = db.Column(db.String(80),  nullable=False)
    level        = db.Column(db.String(80),  nullable=False)
    notes        = db.Column(db.Text,        nullable=True)
    checklist    = db.Column(db.Text,        nullable=False)
    ai_provider  = db.Column(db.String(20),  nullable=False)
    user_uid     = db.Column(db.String(120), nullable=True)
    user_email   = db.Column(db.String(200), nullable=True)
    created_at   = db.Column(db.DateTime,    default=datetime.utcnow)
    updated_at   = db.Column(db.DateTime,    default=datetime.utcnow, onupdate=datetime.utcnow)

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
            "user_uid":    self.user_uid,
            "user_email":  self.user_email,
            "created_at":  self.created_at.isoformat(),
            "updated_at":  self.updated_at.isoformat() if self.updated_at else None,
            "rating":      self.feedback.rating  if self.feedback else None,
            "comment":     self.feedback.comment if self.feedback else None,
        }


class Feedback(db.Model):
    """Stores player rating and optional comment for a generation."""
    __tablename__ = "feedbacks"

    id            = db.Column(db.Integer, primary_key=True)
    generation_id = db.Column(db.Integer, db.ForeignKey("generations.id"), nullable=False, unique=True)
    rating        = db.Column(db.Integer, nullable=False)
    comment       = db.Column(db.Text,    nullable=True)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":            self.id,
            "generation_id": self.generation_id,
            "rating":        self.rating,
            "comment":       self.comment,
            "created_at":    self.created_at.isoformat(),
        }


class Config(db.Model):
    """Key/value store for runtime configuration (admin prompt, admin code, etc.)."""
    __tablename__ = "configs"

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(120), nullable=False, unique=True)
    value = db.Column(db.Text, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "key": self.key,
            "value": self.value,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }