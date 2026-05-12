from datetime import datetime
from ..extensions import db


class Document(db.Model):
    __tablename__ = "documents"

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)  # ✅ CASCADE
    title      = db.Column(db.String(255), nullable=False)
    file_path  = db.Column(db.String(255), nullable=True)
    doc_type   = db.Column(db.String(100), nullable=True)
    content    = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":         self.id,
            "user_id":    self.user_id,
            "title":      self.title,
            "file_path":  self.file_path,
            "doc_type":   self.doc_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }