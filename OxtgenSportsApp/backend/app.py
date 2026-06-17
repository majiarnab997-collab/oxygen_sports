"""
Oxygen Sports — AI Match Preparation Checklist
Flask Backend Entry Point
"""

from flask import Flask
from flask_cors import CORS
from config import Config
from database import db
from routes.checklist import checklist_bp
from routes.feedback import feedback_bp
from routes.history import history_bp
from routes.analytics import analytics_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Allow React frontend (localhost:5173) to call this API
    CORS(app, resources={r"/api/*": {"origins": Config.ALLOWED_ORIGINS}})

    # Init database
    db.init_app(app)

    # Register route blueprints
    app.register_blueprint(checklist_bp,  url_prefix="/api")
    app.register_blueprint(feedback_bp,   url_prefix="/api")
    app.register_blueprint(history_bp,    url_prefix="/api")
    app.register_blueprint(analytics_bp,  url_prefix="/api")

    # Create all tables on first run
    with app.app_context():
        db.create_all()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)