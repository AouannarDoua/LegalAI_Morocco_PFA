from datetime import datetime
from ..extensions import db


class Decision(db.Model):
    __tablename__ = "decisions"

    id          = db.Column(db.Integer, primary_key=True)
    title       = db.Column(db.String(255), nullable=False)
    court       = db.Column(db.String(150), nullable=True)
    date        = db.Column(db.Date, nullable=True)
    summary     = db.Column(db.Text, nullable=True)
    full_text   = db.Column(db.Text, nullable=True)
    category    = db.Column(db.String(100), nullable=True)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self, full=False):
        d = {
            "id":         self.id,
            "title":      self.title,
            "court":      self.court,
            "date":       self.date.isoformat() if self.date else None,
            "summary":    self.summary,
            "category":   self.category,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if full:
            d["full_text"] = self.full_text
        return d
