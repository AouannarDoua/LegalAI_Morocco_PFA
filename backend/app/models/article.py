from datetime import datetime
from ..extensions import db


class Article(db.Model):
    __tablename__ = "articles"

    id          = db.Column(db.Integer, primary_key=True)
    title       = db.Column(db.String(255), nullable=False)
    content     = db.Column(db.Text, nullable=True)
    category    = db.Column(db.String(100), nullable=True)
    author      = db.Column(db.String(120), nullable=True)
    published   = db.Column(db.Boolean, default=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":         self.id,
            "title":      self.title,
            "category":   self.category,
            "author":     self.author,
            "published":  self.published,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
