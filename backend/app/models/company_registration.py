from datetime import datetime

from ..extensions import db


class CompanyRegistration(db.Model):
    __tablename__ = "company_registrations"

    __table_args__ = (
        db.UniqueConstraint(
            "rc_number",
            "rc_city_key",
            name="uq_company_rc_city"
        ),
    )

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    company_name = db.Column(
        db.String(200),
        nullable=False
    )

    rc_number = db.Column(
        db.String(30),
        nullable=False
    )

    # Ville telle qu'elle sera affichée
    rc_city = db.Column(
        db.String(100),
        nullable=False
    )

    # Version normalisée utilisée pour éviter les doublons
    # Exemple : Tanger, TANGER et tanger deviennent "tanger"
    rc_city_key = db.Column(
        db.String(100),
        nullable=False
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="active"
    )

    verification_source = db.Column(
        db.String(50),
        nullable=False,
        default="ompic_mock"
    )

    verified_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    user = db.relationship(
        "User",
        backref=db.backref(
            "company_registration",
            uselist=False
        )
    )

    def to_dict(self):
        return {
            "id": self.id,
            "company_name": self.company_name,
            "rc_number": self.rc_number,
            "rc_city": self.rc_city,
            "status": self.status,
            "verification_source": self.verification_source,
            "verified_at": (
                self.verified_at.isoformat()
                if self.verified_at
                else None
            ),
        }