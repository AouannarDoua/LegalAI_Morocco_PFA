from flask import Blueprint, request, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
from ..services.auth_service import auth_service
from ..services.email_service import email_service
from ..services.notification_service import notification_service
from ..models.user import User
from ..extensions import db, bcrypt
from ..utils.helpers import success_response, error_response

auth_bp = Blueprint("auth", __name__)


def get_serializer():
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"])


# ─── Register ───────────────────────────────────────────────────────────────

@auth_bp.post("/register")
def register():
    data      = request.get_json() or {}
    email     = data.get("email", "").strip().lower()
    password  = data.get("password", "")
    full_name = data.get("full_name", data.get("fullName", "")).strip()

    user, err = auth_service.register(email, password, full_name)
    if err:
        return error_response(err, 400)

    try:
        s     = get_serializer()
        token = s.dumps(email, salt="email-confirm")
        email_service.send_confirmation_email(email, full_name, token)
        email_sent = True
    except Exception as e:
        print(f"Email error: {e}")
        email_sent = False

    try:
        notification_service.create(
            user_id=user.id,
            title="Bienvenue sur LegalAI",
            message="Votre compte a été créé. Confirmez votre email pour vous connecter.",
            notif_type="success"
        )
    except Exception as e:
        print(f"Notification error: {e}")

    return success_response(
        {"email_sent": email_sent},
        "Compte créé ! Vérifiez votre email pour confirmer votre inscription.",
        201
    )


# ─── Confirm email ───────────────────────────────────────────────────────────

@auth_bp.get("/confirm-email")
def confirm_email():
    token = request.args.get("token", "")
    if not token:
        return error_response("Token manquant", 400)

    try:
        s     = get_serializer()
        email = s.loads(token, salt="email-confirm", max_age=86400)
    except SignatureExpired:
        return error_response("Lien expiré — veuillez vous réinscrire", 400)
    except BadSignature:
        return error_response("Lien invalide", 400)

    user = User.query.filter_by(email=email).first()
    if not user:
        return error_response("Utilisateur introuvable", 404)

    if not user.is_confirmed:
        user.is_confirmed = True
        db.session.commit()
        try:
            email_service.send_welcome_email(email, user.full_name)
        except Exception as e:
            print(f"Welcome email error: {e}")

    return success_response(None, "Email confirmé avec succès ! Vous pouvez vous connecter.")


# ─── Login ───────────────────────────────────────────────────────────────────

@auth_bp.post("/login")
def login():
    data     = request.get_json() or {}
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user, err = auth_service.login(email, password)
    if err:
        return error_response(err, 401)

    if not user.is_confirmed:
        return error_response(
            "Veuillez confirmer votre email avant de vous connecter. "
            "Vérifiez votre boîte mail.", 403
        )

    token = create_access_token(identity=str(user.id))
    return success_response({"token": token, "user": user.to_dict()})


# ─── Me ──────────────────────────────────────────────────────────────────────

@auth_bp.get("/me")
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user    = User.query.get_or_404(user_id)
    return success_response(user.to_dict())


# ─── Forgot Password ─────────────────────────────────────────────────────────

@auth_bp.post("/forgot-password")
def forgot_password():
    data  = request.get_json() or {}
    email = data.get("email", "").strip().lower()

    if not email:
        return error_response("Email requis", 400)

    user = User.query.filter_by(email=email).first()

    # Sécurité — même réponse si user existe ou pas
    if user:
        try:
            s     = get_serializer()
            token = s.dumps(email, salt="password-reset")
            email_service.send_reset_password_email(email, user.full_name, token)
        except Exception as e:
            print(f"Reset email error: {e}")

    return success_response(
        None,
        "Si cet email existe, un lien de réinitialisation a été envoyé."
    )


# ─── Reset Password ──────────────────────────────────────────────────────────

@auth_bp.post("/reset-password")
def reset_password():
    data         = request.get_json() or {}
    token        = data.get("token", "")
    new_password = data.get("new_password", "")

    if not token or not new_password:
        return error_response("Token et nouveau mot de passe requis", 400)

    if len(new_password) < 8:
        return error_response("Le mot de passe doit contenir au moins 8 caractères", 400)

    try:
        s     = get_serializer()
        email = s.loads(token, salt="password-reset", max_age=3600)  # 1 heure
    except SignatureExpired:
        return error_response("Lien expiré — veuillez refaire la procédure", 400)
    except BadSignature:
        return error_response("Lien invalide", 400)

    user = User.query.filter_by(email=email).first()
    if not user:
        return error_response("Utilisateur introuvable", 404)

    user.password_hash = bcrypt.generate_password_hash(new_password).decode("utf-8")
    db.session.commit()

    # Notification
    try:
        notification_service.create(
            user_id=user.id,
            title="Mot de passe modifié",
            message="Votre mot de passe a été réinitialisé avec succès.",
            notif_type="success"
        )
    except Exception as e:
        print(f"Notification error: {e}")

    return success_response(None, "Mot de passe réinitialisé avec succès !")


# ─── Resend confirmation ──────────────────────────────────────────────────────

@auth_bp.post("/resend-confirmation")
def resend_confirmation():
    data  = request.get_json() or {}
    email = data.get("email", "").strip().lower()

    user = User.query.filter_by(email=email).first()
    if not user:
        return error_response("Email introuvable", 404)
    if user.is_confirmed:
        return error_response("Email déjà confirmé", 400)

    try:
        s     = get_serializer()
        token = s.dumps(email, salt="email-confirm")
        email_service.send_confirmation_email(email, user.full_name, token)
        return success_response(None, "Email de confirmation renvoyé")
    except Exception as e:
        return error_response(f"Erreur envoi email: {str(e)}", 500)