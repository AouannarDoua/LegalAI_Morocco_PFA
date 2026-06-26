from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from ..extensions import db
from ..models.article import Article
from ..utils.helpers import success_response, paginate_query

articles_bp = Blueprint("articles", __name__)


@articles_bp.get("/categories")
@jwt_required()
def article_categories():
    """Liste des catégories réellement présentes (publiées), triées par nombre."""
    rows = (
        db.session.query(Article.category, func.count(Article.id))
        .filter(Article.published == True, Article.category.isnot(None))  # noqa: E712
        .group_by(Article.category)
        .order_by(func.count(Article.id).desc())
        .all()
    )
    return success_response([c for c, _ in rows if c])


@articles_bp.get("/")
@jwt_required()
def list_articles():
    page     = request.args.get("page", 1, type=int)
    category = request.args.get("category")
    q        = (request.args.get("q") or "").strip()
    query    = Article.query.filter_by(published=True)
    if category:
        query = query.filter_by(category=category)
    if q:
        like = f"%{q}%"
        query = query.filter(db.or_(Article.title.ilike(like),
                                    Article.content.ilike(like)))
    query = query.order_by(Article.created_at.desc())
    return success_response(paginate_query(query, page))


@articles_bp.get("/<int:article_id>")
@jwt_required()
def get_article(article_id):
    article = Article.query.filter_by(id=article_id, published=True).first_or_404()
    return success_response(article.to_dict(full=True))
