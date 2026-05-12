from datetime import datetime
from ..extensions import db


class Contract(db.Model):
    __tablename__ = "contracts"

    id            = db.Column(db.Integer, primary_key=True)
    user_id       = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)  # ✅ CASCADE
    title         = db.Column(db.String(255), nullable=False)
    content       = db.Column(db.Text, nullable=True)
    contract_type = db.Column(db.String(100), nullable=True)
    status        = db.Column(db.String(50), default="draft")
    ai_analysis   = db.Column(db.Text, nullable=True)
    file_name     = db.Column(db.String(255), nullable=True)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at    = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id":            self.id,
            "user_id":       self.user_id,
            "title":         self.title,
            "content":       self.content,
            "contract_type": self.contract_type,
            "status":        self.status,
            "ai_analysis":   self.ai_analysis,
            "file_name":     self.file_name,
            "created_at":    self.created_at.isoformat() if self.created_at else None,
        }