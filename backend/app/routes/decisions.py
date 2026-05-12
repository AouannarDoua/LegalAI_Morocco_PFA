from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from ..models.decision import Decision
from ..utils.helpers import success_response, paginate_query

decisions_bp = Blueprint("decisions", __name__)


@decisions_bp.get("/")
@jwt_required()
def list_decisions():
    page     = request.args.get("page", 1, type=int)
    category = request.args.get("category")
    query    = Decision.query
    if category:
        query = query.filter_by(category=category)
    query = query.order_by(Decision.created_at.desc())
    return success_response(paginate_query(query, page))


@decisions_bp.get("/<int:decision_id>")
@jwt_required()
def get_decision(decision_id):
    decision = Decision.query.get_or_404(decision_id)
    return success_response(decision.to_dict())
