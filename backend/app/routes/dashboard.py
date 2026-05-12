from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.contract import Contract
from ..models.document import Document
from ..models.notification import Notification
from ..models.chat import ChatMessage
from ..utils.helpers import success_response

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.get("/stats")
@jwt_required()
def get_stats():
    user_id = get_jwt_identity()
    stats = {
        "contracts":          Contract.query.filter_by(user_id=user_id).count(),
        "documents":          Document.query.filter_by(user_id=user_id).count(),
        "unread_notifications": Notification.query.filter_by(user_id=user_id, is_read=False).count(),
        "chat_sessions":      ChatMessage.query.filter_by(user_id=user_id, role="user").count(),
    }
    return success_response(stats)
