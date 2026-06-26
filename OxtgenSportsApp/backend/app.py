"""
Oxygen Sports — AI Match Preparation Checklist
Flask Backend Entry Point
"""

from flask import Flask
from flask_cors import CORS
from config import Config
from database import db
from routes.checklist  import checklist_bp
from routes.feedback   import feedback_bp
from routes.history    import history_bp
from routes.analytics  import analytics_bp
from routes.auth       import auth_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": Config.ALLOWED_ORIGINS}})

    db.init_app(app)

    app.register_blueprint(checklist_bp, url_prefix="/api")
    app.register_blueprint(feedback_bp,  url_prefix="/api")
    app.register_blueprint(history_bp,   url_prefix="/api")
    app.register_blueprint(analytics_bp, url_prefix="/api")
    app.register_blueprint(auth_bp,      url_prefix="/api")

    with app.app_context():
        db.create_all()

    return app


if __name__ == "__main__":
    app = create_app()
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)