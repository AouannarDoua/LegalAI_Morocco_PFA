from ..extensions import db, bcrypt
from ..models.user import User
from ..utils.validators import validate_email, validate_password


class AuthService:
    def register(self, email: str, password: str, full_name: str = None) -> tuple:
        if not validate_email(email):
            return None, "Email invalide"
        valid, msg = validate_password(password)
        if not valid:
            return None, msg
        if User.query.filter_by(email=email).first():
            return None, "Cet email est déjà utilisé"

        pw_hash = bcrypt.generate_password_hash(password).decode("utf-8")
        user = User(email=email, password_hash=pw_hash, full_name=full_name)
        db.session.add(user)
        db.session.commit()
        return user, None

    def login(self, email: str, password: str) -> tuple:
        user = User.query.filter_by(email=email).first()
        if not user:
            return None, "Email ou mot de passe incorrect"
        if not bcrypt.check_password_hash(user.password_hash, password):
            return None, "Email ou mot de passe incorrect"
        return user, None


auth_service = AuthService()
