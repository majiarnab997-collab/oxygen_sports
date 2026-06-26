"""
Oxygen Sports — Auth Routes
POST /api/auth/register  → create new user
POST /api/auth/login     → login existing user
GET  /api/auth/me        → get current user info
"""

import hashlib
import os
from flask import Blueprint, request, jsonify, session
from database import db, User

auth_bp = Blueprint("auth", __name__)


def hash_password(password: str) -> str:
    """Simple SHA-256 hash with salt."""
    salt = os.getenv("SECRET_KEY", "oxygen-sports")
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()


@auth_bp.route("/auth/register", methods=["POST"])
def register():
    """
    Register a new user.
    Request: { "name": "Arnab", "email": "a@b.com", "password": "secret" }
    Response: { "success": true, "user": { "id", "name", "email" } }
    """
    data = request.get_json()

    name     = data.get("name", "").strip()
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"success": False, "error": "Email and password are required"}), 400

    if len(password) < 6:
        return jsonify({"success": False, "error": "Password must be at least 6 characters"}), 400

    # Check if email already exists
    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({"success": False, "error": "An account with this email already exists"}), 409

    user = User(
        name           = name or email.split("@")[0],
        email          = email,
        password_hash  = hash_password(password),
    )
    db.session.add(user)
    db.session.commit()

    session["user_id"] = user.id

    return jsonify({
        "success": True,
        "user":    user.to_dict(),
    }), 201


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    """
    Login existing user.
    Request: { "email": "a@b.com", "password": "secret" }
    Response: { "success": true, "user": { "id", "name", "email" } }
    """
    data = request.get_json()

    email    = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"success": False, "error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user or user.password_hash != hash_password(password):
        return jsonify({"success": False, "error": "Incorrect email or password"}), 401

    session["user_id"] = user.id

    return jsonify({
        "success": True,
        "user":    user.to_dict(),
    }), 200


@auth_bp.route("/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True}), 200


@auth_bp.route("/auth/me", methods=["GET"])
def me():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "error": "Not logged in"}), 401

    user = User.query.get(user_id)
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404

    return jsonify({"success": True, "user": user.to_dict()}), 200