import sys

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.company_registration import CompanyRegistration
from app.services.ompic_service import ompic_service


def main():
    if len(sys.argv) != 4:
        print(
            "Utilisation : "
            "python link_existing_company.py email rc_number rc_city"
        )
        return

    email = sys.argv[1].strip().lower()
    rc_number = sys.argv[2].strip()
    rc_city = sys.argv[3].strip()

    app = create_app()

    with app.app_context():
        user = User.query.filter_by(email=email).first()

        if not user:
            print(f"❌ Aucun utilisateur trouvé : {email}")
            return

        current_company = getattr(
            user,
            "company_registration",
            None
        )

        if current_company:
            print("ℹ️ Ce compte possède déjà une entreprise.")
            print(current_company.to_dict())
            return

        company, error = ompic_service.verify_company(
            rc_number=rc_number,
            rc_city=rc_city
        )

        if error:
            print(f"❌ {error}")
            return

        normalized_rc = ompic_service.normalize_rc(
            company["rc_number"]
        )

        normalized_city = ompic_service.normalize_city(
            company["rc_city"]
        )

        existing_company = CompanyRegistration.query.filter_by(
            rc_number=normalized_rc,
            rc_city_key=normalized_city
        ).first()

        if existing_company:
            print("❌ Ce RC est déjà associé à un autre compte.")
            return

        registration = CompanyRegistration(
            user_id=user.id,
            company_name=company["company_name"],
            rc_number=normalized_rc,
            rc_city=company["rc_city"],
            rc_city_key=normalized_city,
            status=company.get("status", "active"),
            verification_source="ompic_mock"
        )

        try:
            db.session.add(registration)
            db.session.commit()

            print("✅ Ancien compte associé à l’entreprise.")
            print(f"Email : {user.email}")
            print(f"Entreprise : {company['company_name']}")
            print(
                f"RC : {normalized_rc} — "
                f"{company['rc_city']}"
            )

        except Exception as exc:
            db.session.rollback()
            print(f"❌ Erreur : {exc}")


if __name__ == "__main__":
    main()