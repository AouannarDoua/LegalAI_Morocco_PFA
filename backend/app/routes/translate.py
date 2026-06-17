from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.translation_service import translation_service
from ..utils.helpers import success_response, error_response

translate_bp = Blueprint("translate", __name__)


@translate_bp.post("")
@translate_bp.post("/")
@jwt_required()
def translate():
    """
    Body JSON : { "text": "...", "target": "fr" | "ar" }
    Traduit un texte juridique entre l'arabe et le français.
    """
    get_jwt_identity()

    data = request.get_json() or {}
    text = (data.get("text") or "").strip()
    target = (data.get("target") or "fr").strip().lower()

    if not text:
        return error_response("Texte vide", 400)
    if target not in ("fr", "ar"):
        return error_response("Langue cible invalide (fr ou ar)", 400)

    try:
        translation = translation_service.translate(text, target=target)
    except Exception as e:
        return error_response(f"Erreur de traduction : {e}", 500)

    return success_response({"translation": translation, "target": target})