from sqlalchemy.exc import IntegrityError

from ..extensions import db, bcrypt
from ..models.user import User
from ..models.company_registration import CompanyRegistration
from ..utils.validators import validate_email, validate_password
from .ompic_service import ompic_service


class AuthService:

    def register(
        self,
        email: str,
        password: str,
        full_name: str = None,
        rc_number: str = None,
        rc_city: str = None
    ) -> tuple:

        # 1. Vérification de l'email
        if not validate_email(email):
            return None, "Email invalide"

        # 2. Vérification du mot de passe
        valid, message = validate_password(password)

        if not valid:
            return None, message

        # 3. Vérifier que l'email n'est pas déjà utilisé
        if User.query.filter_by(email=email).first():
            return None, "Cet email est déjà utilisé"

        # 4. Vérifier l'entreprise dans la base OMPIC simulée
        company, verification_error = (
            ompic_service.verify_company(
                rc_number=rc_number,
                rc_city=rc_city
            )
        )

        if verification_error:
            return None, verification_error

        normalized_rc = ompic_service.normalize_rc(
            company["rc_number"]
        )

        normalized_city = ompic_service.normalize_city(
            company["rc_city"]
        )

        # 5. Empêcher plusieurs comptes avec le même RC
        existing_company = CompanyRegistration.query.filter_by(
            rc_number=normalized_rc,
            rc_city_key=normalized_city
        ).first()

        if existing_company:
            return None, (
                "Un compte existe déjà pour cette entreprise "
                "et ce numéro RC"
            )

        # 6. Chiffrer le mot de passe
        password_hash = bcrypt.generate_password_hash(
            password
        ).decode("utf-8")

        # 7. Créer l'utilisateur
        user = User(
            email=email,
            password_hash=password_hash,
            full_name=full_name or company["company_name"],
            role="company",
            is_confirmed=True
        )

        try:
            db.session.add(user)

            # Permet de récupérer user.id avant le commit
            db.session.flush()

            # 8. Enregistrer les informations vérifiées
            company_registration = CompanyRegistration(
                user_id=user.id,
                company_name=company["company_name"],
                rc_number=normalized_rc,
                rc_city=company["rc_city"],
                rc_city_key=normalized_city,
                status=company.get("status", "active"),
                verification_source="ompic_mock"
            )

            db.session.add(company_registration)
            db.session.commit()

            return user, None

        except IntegrityError:
            db.session.rollback()

            return None, (
                "Cet email ou ce numéro RC est déjà utilisé"
            )

        except Exception:
            db.session.rollback()
            raise

    def login(
        self,
        email: str,
        password: str
    ) -> tuple:

        user = User.query.filter_by(email=email).first()

        if not user:
            return None, "Email ou mot de passe incorrect"

        if not bcrypt.check_password_hash(
            user.password_hash,
            password
        ):
            return None, "Email ou mot de passe incorrect"

        return user, None


auth_service = AuthService()