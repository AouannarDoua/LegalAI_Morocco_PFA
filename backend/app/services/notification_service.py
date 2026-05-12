from ..extensions import db
from ..models.notification import Notification


class NotificationService:
    def create(self, user_id: int, title: str, message: str = None, notif_type: str = "info") -> Notification:
        notif = Notification(user_id=user_id, title=title, message=message, notif_type=notif_type)
        db.session.add(notif)
        db.session.commit()
        return notif

    def mark_read(self, notif_id: int, user_id: int) -> bool:
        notif = Notification.query.filter_by(id=notif_id, user_id=user_id).first()
        if notif:
            notif.is_read = True
            db.session.commit()
            return True
        return False

    def mark_all_read(self, user_id: int):
        Notification.query.filter_by(user_id=user_id, is_read=False).update({"is_read": True})
        db.session.commit()


notification_service = NotificationService()
