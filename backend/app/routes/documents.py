from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.document import Document
from ..extensions import db
from ..utils.helpers import success_response, error_response, paginate_query

documents_bp = Blueprint("documents", __name__)


@documents_bp.get("/")
@jwt_required()
def list_documents():
    user_id = get_jwt_identity()
    page    = request.args.get("page", 1, type=int)
    query   = Document.query.filter_by(user_id=user_id).order_by(Document.created_at.desc())
    return success_response(paginate_query(query, page))


@documents_bp.post("/")
@jwt_required()
def create_document():
    user_id = get_jwt_identity()
    data    = request.get_json() or {}
    title   = data.get("title", "").strip()
    if not title:
        return error_response("Le titre est requis", 400)
    doc = Document(user_id=user_id, title=title, doc_type=data.get("doc_type"), content=data.get("content"))
    db.session.add(doc)
    db.session.commit()
    return success_response(doc.to_dict(), "Document créé", 201)


@documents_bp.get("/<int:doc_id>")
@jwt_required()
def get_document(doc_id):
    user_id = get_jwt_identity()
    doc     = Document.query.filter_by(id=doc_id, user_id=user_id).first_or_404()
    return success_response(doc.to_dict())


@documents_bp.delete("/<int:doc_id>")
@jwt_required()
def delete_document(doc_id):
    user_id = get_jwt_identity()
    doc     = Document.query.filter_by(id=doc_id, user_id=user_id).first_or_404()
    db.session.delete(doc)
    db.session.commit()
    return success_response(None, "Document supprimé")
