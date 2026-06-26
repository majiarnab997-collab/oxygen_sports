"""
Config routes: GET/POST configuration key/value pairs.
GET  /api/config             -> list public configs
GET  /api/config/<key>       -> get single config
POST /api/config             -> create or update config (admin-only via header X-Admin-Secret)
POST /api/config/validate-admin-code -> validate admin registration code against stored config
"""

from flask import Blueprint, request, jsonify
from database import db, Config
from config import Config as AppConfig

config_bp = Blueprint("config", __name__)

SENSITIVE_KEYS = {"admin_secret_code"}


def require_admin_header(req):
    admin_secret = req.headers.get("X-Admin-Secret")
    return admin_secret and admin_secret == AppConfig.ADMIN_SECRET


def get_config_value(key, default=None):
    cfg = Config.query.filter_by(key=key).first()
    if not cfg or cfg.value is None:
        return default
    return cfg.value


def _config_to_payload(cfg):
    return cfg.to_dict()


@config_bp.route("/config", methods=["GET"])
def list_configs():
    configs = Config.query.all()
    if not require_admin_header(request):
        configs = [cfg for cfg in configs if cfg.key not in SENSITIVE_KEYS]
    return jsonify({"success": True, "configs": [_config_to_payload(cfg) for cfg in configs]}), 200


@config_bp.route("/config/<key>", methods=["GET"])
def get_config(key):
    if key in SENSITIVE_KEYS and not require_admin_header(request):
        return jsonify({"success": False, "error": "not_found"}), 404

    cfg = Config.query.filter_by(key=key).first()
    if not cfg:
        return jsonify({"success": False, "error": "not_found"}), 404
    return jsonify({"success": True, "config": cfg.to_dict()}), 200


@config_bp.route("/config/validate-admin-code", methods=["POST"])
def validate_admin_code():
    data = request.get_json() or {}
    submitted_code = str(data.get("code", "")).strip()
    if not submitted_code:
        return jsonify({"success": True, "valid": False}), 200

    stored_code = get_config_value("admin_secret_code", AppConfig.ADMIN_SECRET)
    return jsonify({"success": True, "valid": submitted_code == str(stored_code).strip()}), 200


@config_bp.route("/config", methods=["POST"])
def set_config():
    # Simple admin auth: header X-Admin-Secret must match server env ADMIN_SECRET or SECRET_KEY
    if not require_admin_header(request):
        return jsonify({"success": False, "error": "unauthorized"}), 401

    data = request.get_json() or {}
    key = data.get("key")
    value = data.get("value")
    if not key:
        return jsonify({"success": False, "error": "missing_key"}), 400

    cfg = Config.query.filter_by(key=key).first()
    if not cfg:
        cfg = Config(key=key, value=value)
        db.session.add(cfg)
    else:
        cfg.value = value
    db.session.commit()
    return jsonify({"success": True, "config": cfg.to_dict()}), 200
