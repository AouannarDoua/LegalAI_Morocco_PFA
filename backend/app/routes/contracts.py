from flask import Blueprint, request, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.contract_service import contract_service
from ..services.notification_service import notification_service
from ..services.data_service import data_service
from ..models.contract import Contract
from ..utils.helpers import success_response, error_response
import os

contracts_bp = Blueprint("contracts", __name__)


# ─── GET /contracts ───────────────────────────────────────────────────────────

@contracts_bp.get("/")
@jwt_required()
def get_contracts():
    user_id   = get_jwt_identity()
    contracts = Contract.query.filter_by(user_id=user_id)\
                              .order_by(Contract.created_at.desc()).all()
    return success_response({
        "items": [c.to_dict() for c in contracts],
        "total": len(contracts)
    })


# ─── POST /contracts ──────────────────────────────────────────────────────────

@contracts_bp.post("/")
@jwt_required()
def create_contract():
    user_id = get_jwt_identity()
    data    = request.get_json() or {}
    title   = data.get("title", "").strip()

    if not title:
        return error_response("Le titre est requis", 400)

    contract = contract_service.create(
        user_id, title,
        data.get("content"),
        data.get("contract_type")
    )
    notification_service.create(
        user_id=user_id,
        title="Contrat ajouté",
        message=f"Le contrat '{title}' a été ajouté avec succès.",
        notif_type="success"
    )
    return success_response(contract.to_dict(), "Contrat créé", 201)


# ─── POST /contracts/<id>/analyze ────────────────────────────────────────────

@contracts_bp.post("/<int:contract_id>/analyze")
@jwt_required()
def analyze_contract(contract_id):
    user_id     = get_jwt_identity()
    contract    = Contract.query.filter_by(id=contract_id, user_id=user_id).first_or_404()
    result, err = contract_service.analyze(contract_id, user_id)

    if err:
        return error_response(err, 400)

    notification_service.create(
        user_id=user_id,
        title="Analyse terminée",
        message=f"L'analyse de votre contrat '{contract.title}' est prête.",
        notif_type="success"
    )
    return success_response(result, "Analyse terminée")


# ─── POST /contracts/generate ────────────────────────────────────────────────

@contracts_bp.post("/generate")
@jwt_required()
def generate_contract():
    user_id       = get_jwt_identity()
    data          = request.get_json() or {}
    contract_type = data.get("contract_type", "").strip()
    details       = data.get("details", {})

    if not contract_type:
        return error_response("Le type de contrat est requis", 400)

    try:
        contract = contract_service.generate(
            user_id=user_id,
            contract_type=contract_type,
            details=details
        )
        notification_service.create(
            user_id=user_id,
            title="Contrat généré",
            message=f"Le contrat '{contract.title}' a été généré avec succès.",
            notif_type="success"
        )
        return success_response(contract.to_dict(), "Contrat généré avec succès", 201)

    except Exception as e:
        print(f"[generate_contract] Error: {e}")
        return error_response(f"Erreur lors de la génération : {str(e)}", 500)


# ─── GET /contracts/types — ✅ PUBLIC : 20 types + champs structurés ──────────
# Renvoie pour CHAQUE type : son nom (arabe), la liste de ses champs
# (name / label arabe / type text|number|date / required / default) et ses
# clauses. C'est ce qui permet au frontend d'afficher un FORMULAIRE DYNAMIQUE
# par type de contrat, exactement comme display_form_by_contract_type() du
# script v12 (test.py).

@contracts_bp.get("/types")
def list_contract_types():
    try:
        return success_response(contract_service.list_types())
    except Exception as e:
        print(f"[list_contract_types] Error: {e}")
        return error_response(str(e), 500)


# ─── GET /contracts/templates — ✅ PUBLIC (pas de jwt_required) ───────────────

@contracts_bp.get("/templates")
def list_templates():
    try:
        templates = data_service.get_all_templates()
        return success_response(templates)
    except Exception as e:
        print(f"[list_templates] Error: {e}")
        return error_response(str(e), 500)


# ─── POST /contracts/<id>/rerender — régénère le PDF depuis le texte édité ────
# Permet à l'avocat de corriger le contrat (supprimer une phrase, corriger un
# nom) puis de reconstruire le PDF, SANS rappeler l'IA.

@contracts_bp.post("/<int:contract_id>/rerender")
@jwt_required()
def rerender_contract(contract_id):
    user_id = get_jwt_identity()
    data    = request.get_json() or {}
    content = data.get("content", "")
    title   = data.get("title")

    contract, err = contract_service.re_render(user_id, contract_id, content, title)
    if err:
        return error_response(err, 400)
    return success_response(contract.to_dict(), "PDF mis à jour")


# ─── GET /contracts/download/<filename> ──────────────────────────────────────

@contracts_bp.get("/download/<filename>")
@jwt_required()
def download_contract(filename):
    if ".." in filename or "/" in filename or "\\" in filename:
        return error_response("Fichier invalide", 400)
    upload_dir = os.path.join(os.getcwd(), "uploads")
    return send_from_directory(upload_dir, filename)