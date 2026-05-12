from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from ..models.article import Article
from ..utils.helpers import success_response, paginate_query

articles_bp = Blueprint("articles", __name__)


@articles_bp.get("/")
@jwt_required()
def list_articles():
    page     = request.args.get("page", 1, type=int)
    category = request.args.get("category")
    query    = Article.query.filter_by(published=True)
    if category:
        query = query.filter_by(category=category)
    query = query.order_by(Article.created_at.desc())
    return success_response(paginate_query(query, page))


@articles_bp.get("/<int:article_id>")
@jwt_required()
def get_article(article_id):
    article = Article.query.filter_by(id=article_id, published=True).first_or_404()
    return success_response(article.to_dict())
