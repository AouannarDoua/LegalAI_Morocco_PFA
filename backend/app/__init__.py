import os
from flask import Flask
from .extensions import db, migrate, jwt, cors, bcrypt, mail
from .config import config_map
from .routes.tax import tax_bp
from .routes.tax_admin import tax_admin_bp
from .models.tax_update import TaxUpdate 

def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config_map.get(config_name, config_map["default"]))
    app.url_map.strict_slashes = False

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    mail.init_app(app)  # ✅ Mail ajouté
    cors.init_app(app, resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
        }
    })

    from .routes.auth import auth_bp
    from .routes.chat import chat_bp
    from .routes.contracts import contracts_bp
    from .routes.documents import documents_bp
    from .routes.decisions import decisions_bp
    from .routes.articles import articles_bp
    from .routes.notifications import notifications_bp
    from .routes.profile import profile_bp
    from .routes.dashboard import dashboard_bp

    app.register_blueprint(auth_bp,          url_prefix="/api/auth")
    app.register_blueprint(chat_bp,          url_prefix="/api/chat")
    app.register_blueprint(contracts_bp,     url_prefix="/api/contracts")
    app.register_blueprint(documents_bp,     url_prefix="/api/documents")
    app.register_blueprint(decisions_bp,     url_prefix="/api/decisions")
    app.register_blueprint(articles_bp,      url_prefix="/api/articles")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
    app.register_blueprint(profile_bp,       url_prefix="/api/profile")
    app.register_blueprint(dashboard_bp,     url_prefix="/api/dashboard")
    app.register_blueprint(tax_bp,       url_prefix="/api/tax")
    app.register_blueprint(tax_admin_bp, url_prefix="/api/tax/admin")
    @app.route("/api/health")
    def health():
        return {"status": "ok", "app": "LegalAI Morocco API"}, 200
    
    from .scheduler import init_scheduler
    init_scheduler(app)


    return app