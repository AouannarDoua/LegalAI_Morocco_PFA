# backend/app/routes/documents.py
# ──────────────────────────────────────────────────────────────────────────────
# Gestion réelle des documents : upload de fichier, liste, téléchargement,
# suppression (avec effacement du fichier sur le disque).
# ──────────────────────────────────────────────────────────────────────────────
import os
import uuid

from flask import Blueprint, request, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from ..models.document import Document
from ..extensions import db
from ..utils.helpers import success_response, error_response, paginate_query

documents_bp = Blueprint("documents", __name__)

# Extensions autorisées + taille max (10 Mo)
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx", "png", "jpg", "jpeg", "txt"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def _upload_dir() -> str:
    """Dossier d'upload : <racine_backend>/uploads/documents (créé si absent)."""
    base = os.path.join(current_app.root_path, "..", "uploads", "documents")
    base = os.path.abspath(base)
    os.makedirs(base, exist_ok=True)
    return base


def _allowed(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ── LISTE ─────────────────────────────────────────────────────────────────────
@documents_bp.get("/")
@jwt_required()
def list_documents():
    user_id = get_jwt_identity()
    page    = request.args.get("page", 1, type=int)
    query   = Document.query.filter_by(user_id=user_id).order_by(Document.created_at.desc())
    return success_response(paginate_query(query, page))


# ── CRÉATION (fichier OU texte) ───────────────────────────────────────────────
@documents_bp.post("/")
@jwt_required()
def create_document():
    user_id = get_jwt_identity()

    # ── Cas 1 : upload d'un fichier (multipart/form-data) ─────────────────────
    if "file" in request.files:
        f = request.files["file"]
        if not f or f.filename == "":
            return error_response("Aucun fichier sélectionné", 400)
        if not _allowed(f.filename):
            return error_response("Type de fichier non autorisé (pdf, doc, docx, png, jpg, txt)", 400)

        # Vérification de la taille
        f.seek(0, os.SEEK_END)
        size = f.tell()
        f.seek(0)
        if size > MAX_FILE_SIZE:
            return error_response("Fichier trop volumineux (max 10 Mo)", 400)

        original = secure_filename(f.filename)
        ext      = original.rsplit(".", 1)[1].lower() if "." in original else "bin"
        # Nom de fichier unique pour éviter les collisions
        stored_name = f"{uuid.uuid4().hex}.{ext}"
        path        = os.path.join(_upload_dir(), stored_name)
        f.save(path)

        title    = (request.form.get("title") or original).strip()
        doc_type = request.form.get("doc_type") or None

        doc = Document(
            user_id=user_id,
            title=title,
            doc_type=doc_type,
            file_path=stored_name,   # on stocke seulement le nom; le dossier est connu
        )
        db.session.add(doc)
        db.session.commit()
        return success_response(doc.to_dict(), "Document téléversé", 201)

    # ── Cas 2 : document "texte" (JSON) — compat. avec l'ancien comportement ──
    data  = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        return error_response("Le titre est requis", 400)

    doc = Document(
        user_id=user_id,
        title=title,
        doc_type=data.get("doc_type"),
        content=data.get("content"),
    )
    db.session.add(doc)
    db.session.commit()
    return success_response(doc.to_dict(), "Document créé", 201)


# ── DÉTAIL ────────────────────────────────────────────────────────────────────
@documents_bp.get("/<int:doc_id>")
@jwt_required()
def get_document(doc_id):
    user_id = get_jwt_identity()
    doc     = Document.query.filter_by(id=doc_id, user_id=user_id).first_or_404()
    return success_response(doc.to_dict())


# ── TÉLÉCHARGEMENT / OUVERTURE DU FICHIER ─────────────────────────────────────
@documents_bp.get("/<int:doc_id>/download")
@jwt_required()
def download_document(doc_id):
    user_id = get_jwt_identity()
    doc     = Document.query.filter_by(id=doc_id, user_id=user_id).first_or_404()
    if not doc.file_path:
        return error_response("Ce document ne contient pas de fichier", 404)

    path = os.path.join(_upload_dir(), doc.file_path)
    if not os.path.exists(path):
        return error_response("Fichier introuvable sur le serveur", 404)

    # Nom de téléchargement lisible (basé sur le titre)
    ext      = doc.file_path.rsplit(".", 1)[-1]
    download = f"{secure_filename(doc.title) or 'document'}.{ext}"
    return send_file(path, as_attachment=True, download_name=download)


# ── SUPPRESSION (BD + fichier disque) ─────────────────────────────────────────
@documents_bp.delete("/<int:doc_id>")
@jwt_required()
def delete_document(doc_id):
    user_id = get_jwt_identity()
    doc     = Document.query.filter_by(id=doc_id, user_id=user_id).first_or_404()

    # Supprimer le fichier physique s'il existe
    if doc.file_path:
        path = os.path.join(_upload_dir(), doc.file_path)
        if os.path.exists(path):
            try:
                os.remove(path)
            except OSError:
                pass  # on supprime quand même l'enregistrement

    db.session.delete(doc)
    db.session.commit()
    return success_response(None, "Document supprimé")
