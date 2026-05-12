from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.notification_service import notification_service
from ..models.notification import Notification
from ..utils.helpers import success_response, paginate_query

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.get("/")
@jwt_required()
def list_notifications():
    # Convertir en int pour être sûr de la correspondance avec MySQL
    try:
        user_id = int(get_jwt_identity())
    except:
        user_id = get_jwt_identity()

    page   = request.args.get("page", 1, type=int)
    unread = request.args.get("unread", type=lambda v: v.lower() == "true")
    
    # Utilisation de filter au lieu de filter_by pour plus de clarté
    query = Notification.query.filter(Notification.user_id == user_id)
    
    if unread:
        query = query.filter(Notification.is_read == False)
        
    query = query.order_by(Notification.created_at.desc())
    
    return success_response(paginate_query(query, page))


@notifications_bp.put("/<int:notif_id>/read")
@jwt_required()
def mark_read(notif_id):
    user_id = get_jwt_identity()
    ok      = notification_service.mark_read(notif_id, user_id)
    if not ok:
        from ..utils.helpers import error_response
        return error_response("Notification introuvable", 404)
    return success_response(None, "Notification marquée comme lue")


@notifications_bp.put("/read-all")
@jwt_required()
def mark_all_read():
    user_id = get_jwt_identity()
    notification_service.mark_all_read(user_id)
    return success_response(None, "Toutes les notifications lues")
