# app/routes/tax_admin.py
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity
from ..utils.decorators import admin_required
from ..utils.helpers import success_response, error_response
from ..models.tax_update import TaxUpdate
from ..services.tax_update_service import tax_update_service

tax_admin_bp = Blueprint("tax_admin", __name__)


# ─── GET /api/tax/admin/status — dernier état + nombre en attente ────────────
@tax_admin_bp.get("/status")
@admin_required
def status():
    last = TaxUpdate.query.order_by(TaxUpdate.created_at.desc()).first()
    pending = TaxUpdate.query.filter_by(status="pending").count()
    return success_response({
        "last_check": last.to_dict() if last else None,
        "pending_count": pending,
    })


# ─── GET /api/tax/admin/history — historique des vérifications ───────────────
@tax_admin_bp.get("/history")
@admin_required
def history():
    items = TaxUpdate.query.order_by(TaxUpdate.created_at.desc()).limit(30).all()
    return success_response([i.to_dict() for i in items])


# ─── GET /api/tax/admin/pending — mises à jour en attente ────────────────────
@tax_admin_bp.get("/pending")
@admin_required
def pending():
    items = TaxUpdate.query.filter_by(status="pending").order_by(TaxUpdate.created_at.desc()).all()
    return success_response([i.to_dict() for i in items])


# ─── POST /api/tax/admin/check-now — lancer une vérification manuelle ────────
@tax_admin_bp.post("/check-now")
@admin_required
def check_now():
    data = request.get_json() or {}
    year = data.get("year")
    source_url = (data.get("source_url") or "").strip() or None
    try:
        rec = tax_update_service.run_check(year=year, source_url=source_url, triggered_by="manual")
        return success_response(rec.to_dict(), "Vérification effectuée")
    except Exception as e:
        return error_response(f"Erreur lors de la vérification : {e}", 500)


# ─── POST /api/tax/admin/<id>/approve — valider et appliquer ─────────────────
@tax_admin_bp.post("/<int:update_id>/approve")
@admin_required
def approve(update_id):
    admin_id = get_jwt_identity()
    try:
        rec = tax_update_service.approve(update_id, admin_id)
        return success_response(rec.to_dict(), "Barème mis à jour et appliqué avec succès")
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(f"Erreur lors de la validation : {e}", 500)


# ─── POST /api/tax/admin/<id>/reject — refuser ───────────────────────────────
@tax_admin_bp.post("/<int:update_id>/reject")
@admin_required
def reject(update_id):
    admin_id = get_jwt_identity()
    try:
        rec = tax_update_service.reject(update_id, admin_id)
        return success_response(rec.to_dict(), "Mise à jour refusée")
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        return error_response(f"Erreur : {e}", 500)