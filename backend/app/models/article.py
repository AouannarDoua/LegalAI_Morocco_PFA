from datetime import datetime
from sqlalchemy.dialects.mysql import LONGTEXT
from ..extensions import db


class Article(db.Model):
    __tablename__ = "articles"

    id          = db.Column(db.Integer, primary_key=True)
    title       = db.Column(db.String(255), nullable=False)
    # LONGTEXT sur MySQL pour stocker un code de loi entier (TEXT = 64 Ko max)
    content     = db.Column(db.Text().with_variant(LONGTEXT, "mysql"), nullable=True)
    category    = db.Column(db.String(100), nullable=True)
    author      = db.Column(db.String(120), nullable=True)
    published   = db.Column(db.Boolean, default=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self, full=False):
        d = {
            "id":         self.id,
            "title":      self.title,
            "category":   self.category,
            "author":     self.author,
            "published":  self.published,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if full:
            d["content"] = self.content          # texte complet (page détail)
        return d
