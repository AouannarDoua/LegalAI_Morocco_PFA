from flask import Blueprint, request, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.voice_service import voice_service
from ..utils.helpers import success_response, error_response

voice_bp = Blueprint("voice", __name__)


@voice_bp.post("/transcribe")
@jwt_required()
def transcribe():
    """
    Reçoit un fichier audio (multipart, champ 'audio') + langue optionnelle
    ('language' = 'fr' | 'ar'), renvoie le texte transcrit.
    """
    get_jwt_identity()  # protège la route

    if "audio" not in request.files:
        return error_response("Aucun fichier audio reçu", 400)

    audio = request.files["audio"]
    language = (request.form.get("language") or "").strip() or None

    try:
        result = voice_service.transcribe(audio, language=language)
    except Exception as e:
        return error_response(f"Erreur de transcription : {e}", 500)

    if not result.get("text"):
        return error_response("Aucune parole détectée", 422)

    return success_response(result)


@voice_bp.post("/speak")
@jwt_required()
def speak():
    """
    Reçoit { text, lang } et renvoie un audio WAV.
    Si la langue n'est pas supportée par Groq (ex. 'fr'), renvoie 422 pour
    que le frontend bascule sur la synthèse vocale du navigateur.
    """
    get_jwt_identity()

    data = request.get_json() or {}
    text = (data.get("text") or "").strip()
    lang = (data.get("lang") or "fr").strip()

    if not text:
        return error_response("Texte vide", 400)

    try:
        audio = voice_service.synthesize(text, lang=lang)
    except Exception as e:
        return error_response(f"Erreur de synthèse vocale : {e}", 500)

    if audio is None:
        return error_response(
            "Synthèse non disponible pour cette langue (repli navigateur)", 422
        )

    return Response(audio, mimetype="audio/wav")