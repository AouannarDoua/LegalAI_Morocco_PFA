from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.rag_service import rag_service # Ghadi t-importi l'service jdid
from ..models.chat import ChatMessage
from ..extensions import db
from ..utils.helpers import success_response, error_response
import uuid

chat_bp = Blueprint("chat", __name__)

@chat_bp.post("/message")
@jwt_required()
def send_message():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    content = data.get("message", data.get("content", "")).strip()
    session_id = data.get("session_id") or str(uuid.uuid4())

    if not content:
        return error_response("Message vide", 400)

    # 1. Save user message
    user_msg = ChatMessage(user_id=user_id, role="user", content=content, session_id=session_id)
    db.session.add(user_msg)
    db.session.flush() # Bach n-akhdo l'id dialo qbel commit

    # 2. Get AI Response via RAG
    # rag_service ghadi y-joubed les documents w y-générer l'answer
    rag_result = rag_service.get_legal_answer(content)
    
    ai_reply = rag_result.get("answer")
    # N-extractiw les metadata (العنوان، الرابط، روابط_التحميل)[cite: 3]
    sources = [doc.metadata for doc in rag_result.get("source_documents", [])]

    # 3. Save AI message with Sources
    ai_msg = ChatMessage(
        user_id=user_id, 
        role="assistant", 
        content=ai_reply, 
        session_id=session_id,
        sources=sources # Hna t-zadat l'metadata d Malyium[cite: 3]
    )
    db.session.add(ai_msg)
    db.session.commit()

    return success_response({
        "message": ai_reply,
        "sources": sources,
        "session_id": session_id,
        "user_msg_id": user_msg.id,
        "ai_msg_id": ai_msg.id,
    })

@chat_bp.get("/history")
@jwt_required()
def get_history():
    user_id = get_jwt_identity()
    session_id = request.args.get("session_id")
    query = ChatMessage.query.filter_by(user_id=user_id)
    if session_id:
        query = query.filter_by(session_id=session_id)
    messages = query.order_by(ChatMessage.created_at.asc()).all()
    return success_response([m.to_dict() for m in messages])