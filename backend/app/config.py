import os
from datetime import timedelta
from dotenv import load_dotenv
load_dotenv()


class Config:
    SECRET_KEY                     = os.environ.get("SECRET_KEY", "dev-secret-key")
    SQLALCHEMY_DATABASE_URI        = os.environ.get("DATABASE_URL", "sqlite:///legalai_morocco.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY               = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret")
    JWT_ACCESS_TOKEN_EXPIRES     = timedelta(seconds=int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES", 86400)))

    OPENAI_API_KEY               = os.environ.get("OPENAI_API_KEY", "")
    FRONTEND_URL                 = os.environ.get("FRONTEND_URL", "http://localhost:3000")

    # ✅ Flask-Mail Gmail config
    MAIL_SERVER                  = "smtp.gmail.com"
    MAIL_PORT                    = 587
    MAIL_USE_TLS                 = True
    MAIL_USE_SSL                 = False
    MAIL_USERNAME                = os.environ.get("MAIL_USERNAME", "")
    MAIL_PASSWORD                = os.environ.get("MAIL_PASSWORD", "")
    MAIL_DEFAULT_SENDER          = os.environ.get("MAIL_DEFAULT_SENDER", "")


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_map = {
    "development": DevelopmentConfig,
    "production":  ProductionConfig,
    "default":     DevelopmentConfig,
}