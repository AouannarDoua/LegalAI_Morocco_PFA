from datetime import datetime
from ..extensions import db


class Notification(db.Model):
    __tablename__ = "notifications"

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)  # ✅ CASCADE
    title      = db.Column(db.String(255), nullable=False)
    message    = db.Column(db.Text, nullable=True)
    is_read    = db.Column(db.Boolean, default=False)
    notif_type = db.Column(db.String(50), default="info")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":         self.id,
            "user_id":    self.user_id,
            "title":      self.title,
            "message":    self.message,
            "is_read":    self.is_read,
            "notif_type": self.notif_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }