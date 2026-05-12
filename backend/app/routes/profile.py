from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.user import User
from ..extensions import db
from ..utils.helpers import success_response, error_response

profile_bp = Blueprint("profile", __name__)


@profile_bp.get("/")
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user    = User.query.get_or_404(user_id)
    return success_response(user.to_dict())


@profile_bp.put("/")
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user    = User.query.get_or_404(user_id)
    data    = request.get_json() or {}

    if "full_name" in data:
        user.full_name = data["full_name"].strip()
    if "avatar_url" in data:
        user.avatar_url = data["avatar_url"].strip()

    db.session.commit()
    return success_response(user.to_dict(), "Profil mis à jour")


@profile_bp.put("/password")
@jwt_required()
def change_password():
    from ..extensions import bcrypt
    user_id      = get_jwt_identity()
    user         = User.query.get_or_404(user_id)
    data         = request.get_json() or {}
    old_password = data.get("old_password", "")
    new_password = data.get("new_password", "")

    if not bcrypt.check_password_hash(user.password_hash, old_password):
        return error_response("Mot de passe actuel incorrect", 400)
    if len(new_password) < 8:
        return error_response("Le nouveau mot de passe doit contenir au moins 8 caractères", 400)

    user.password_hash = bcrypt.generate_password_hash(new_password).decode("utf-8")
    db.session.commit()
    return success_response(None, "Mot de passe modifié")
