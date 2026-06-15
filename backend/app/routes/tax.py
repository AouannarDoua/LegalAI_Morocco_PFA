# app/routes/tax.py
from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from ..services.tax_service import tax_service
from ..services.tax_projection_service import tax_projection_service
from ..utils.helpers import success_response, error_response

tax_bp = Blueprint("tax", __name__)


# ─── GET /api/tax/years — liste des années disponibles ───────────────────────
@tax_bp.get("/years")
def list_years():
    try:
        return success_response({
            "years": tax_service.available_years(),
            "default": tax_service.default_year(),
        })
    except Exception as e:
        print(f"[tax/years] {e}")
        return error_response(str(e), 500)


# ─── GET /api/tax/rates?year=2026 — barème d'une année ───────────────────────
@tax_bp.get("/rates")
def get_rates():
    year = request.args.get("year", type=int)
    try:
        rates = tax_service.get_rates(year)
        return success_response(rates)
    except ValueError as e:
        return error_response(str(e), 404)
    except Exception as e:
        print(f"[tax/rates] {e}")
        return error_response(str(e), 500)


# ─── POST /api/tax/simulate — simulation fiscale complète ────────────────────
@tax_bp.post("/simulate")
@jwt_required()
def simulate():
    data = request.get_json() or {}

    try:
        chiffre_affaires = float(data.get("chiffre_affaires", 0) or 0)
        benefice_net     = float(data.get("benefice_net", 0) or 0)
        nombre_employes  = int(data.get("nombre_employes", 0) or 0)
        salaire_brut     = float(data.get("salaire_brut_mensuel", 0) or 0)
    except (TypeError, ValueError):
        return error_response("Les montants doivent être des nombres valides.", 400)

    if chiffre_affaires < 0 or benefice_net < 0 or nombre_employes < 0 or salaire_brut < 0:
        return error_response("Les valeurs ne peuvent pas être négatives.", 400)

    if chiffre_affaires == 0 and benefice_net == 0 and nombre_employes == 0:
        return error_response("Veuillez saisir au moins un chiffre d'affaires, un bénéfice ou des employés.", 400)

    try:
        result = tax_service.simulate(
            year=data.get("year"),
            chiffre_affaires=chiffre_affaires,
            benefice_net=benefice_net,
            secteur=data.get("secteur", "").strip(),
            nombre_employes=nombre_employes,
            salaire_brut_mensuel=salaire_brut,
            taux_tva=data.get("taux_tva", 20),
            secteur_financier=bool(data.get("secteur_financier", False)),
        )
        return success_response(result, "Simulation effectuée avec succès")
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        print(f"[tax/simulate] {e}")
        return error_response(f"Erreur lors de la simulation : {str(e)}", 500)


# ─── POST /api/tax/project — projection d'impôt prévisionnel ─────────────────
@tax_bp.post("/project")
@jwt_required()
def project():
    data = request.get_json() or {}

    try:
        mois_ecoules     = int(data.get("mois_ecoules", 0) or 0)
        ca_realise       = float(data.get("ca_realise", 0) or 0)
        benefice_realise = float(data.get("benefice_realise", 0) or 0)
        nombre_employes  = int(data.get("nombre_employes", 0) or 0)
        salaire_brut     = float(data.get("salaire_brut_mensuel", 0) or 0)
    except (TypeError, ValueError):
        return error_response("Les montants doivent être des nombres valides.", 400)

    if mois_ecoules < 1 or mois_ecoules > 12:
        return error_response("Le nombre de mois écoulés doit être compris entre 1 et 12.", 400)

    if ca_realise <= 0 and benefice_realise <= 0:
        return error_response("Veuillez saisir le chiffre d'affaires ou le bénéfice réalisé.", 400)

    try:
        result = tax_projection_service.project(
            year=data.get("year"),
            mois_ecoules=mois_ecoules,
            ca_realise=ca_realise,
            benefice_realise=benefice_realise,
            secteur=data.get("secteur", "").strip(),
            nombre_employes=nombre_employes,
            salaire_brut_mensuel=salaire_brut,
            taux_tva=data.get("taux_tva", 20),
            secteur_financier=bool(data.get("secteur_financier", False)),
        )
        return success_response(result, "Projection effectuée avec succès")
    except ValueError as e:
        return error_response(str(e), 400)
    except Exception as e:
        print(f"[tax/project] {e}")
        return error_response(f"Erreur lors de la projection : {str(e)}", 500)