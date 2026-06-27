
from datetime import datetime

from ..extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    email = db.Column(
        db.String(120),
        unique=True,
        nullable=False
    )

    password_hash = db.Column(
        db.String(256),
        nullable=False
    )

    full_name = db.Column(
        db.String(120),
        nullable=True
    )

    role = db.Column(
        db.String(20),
        default="user"
    )

    avatar_url = db.Column(
        db.String(255),
        nullable=True
    )

    is_confirmed = db.Column(
        db.Boolean,
        default=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relations
    contracts = db.relationship(
        "Contract",
        backref="contract_owner",
        lazy=True,
        cascade="all, delete-orphan"
    )

    documents = db.relationship(
        "Document",
        backref="document_owner",
        lazy=True,
        cascade="all, delete-orphan"
    )

    notifications = db.relationship(
        "Notification",
        backref="notif_user",
        lazy=True,
        cascade="all, delete-orphan"
    )

    chat_messages = db.relationship(
        "ChatMessage",
        backref="message_user",
        lazy=True,
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        company = getattr(
            self,
            "company_registration",
            None
        )

        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "avatar_url": self.avatar_url,
            "is_confirmed": self.is_confirmed,
            "company": (
                company.to_dict()
                if company
                else None
            ),
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at
                else None
            ),
        }

