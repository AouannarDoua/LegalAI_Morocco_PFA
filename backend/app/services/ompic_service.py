import json
import re
import unicodedata
from pathlib import Path

from flask import current_app


class OmpicService:

    @staticmethod
    def normalize_rc(rc_number: str) -> str:
        return str(rc_number or "").strip().replace(" ", "")

    @staticmethod
    def normalize_city(city: str) -> str:
        city = str(city or "").strip().lower()

        # Retire les accents : Tétouan devient tetouan
        normalized = unicodedata.normalize("NFKD", city)

        return "".join(
            character
            for character in normalized
            if not unicodedata.combining(character)
        )

    def verify_company(
        self,
        rc_number: str,
        rc_city: str
    ) -> tuple:

        rc_number = self.normalize_rc(rc_number)
        rc_city = str(rc_city or "").strip()

        if not rc_number:
            return None, "Le numéro RC est obligatoire"

        if not re.fullmatch(r"\d{1,20}", rc_number):
            return None, "Le numéro RC doit contenir uniquement des chiffres"

        if not rc_city:
            return None, "La ville du registre de commerce est obligatoire"

        # backend/app -> backend
        backend_directory = Path(current_app.root_path).parent

        file_path = (
            backend_directory
            / "data"
            / "ompic_companies.json"
        )

        if not file_path.exists():
            current_app.logger.error(
                "Fichier OMPIC simulé introuvable : %s",
                file_path
            )
            return None, "Le service de vérification RC est indisponible"

        try:
            with file_path.open("r", encoding="utf-8") as file:
                companies = json.load(file)

        except (OSError, json.JSONDecodeError) as error:
            current_app.logger.exception(
                "Erreur lecture du fichier OMPIC : %s",
                error
            )
            return None, "Impossible de vérifier le registre de commerce"

        requested_city = self.normalize_city(rc_city)

        for company in companies:
            saved_rc = self.normalize_rc(
                company.get("rc_number")
            )

            saved_city = self.normalize_city(
                company.get("rc_city")
            )

            if (
                saved_rc == rc_number
                and saved_city == requested_city
            ):
                status = str(
                    company.get("status", "")
                ).strip().lower()

                if status != "active":
                    return None, (
                        "L'entreprise existe, mais elle n'est pas active"
                    )

                return {
                    "rc_number": saved_rc,
                    "rc_city": company.get("rc_city"),
                    "company_name": company.get("company_name"),
                    "status": status
                }, None

        return None, (
            "Aucune entreprise active ne correspond "
            "à ce numéro RC et à cette ville"
        )


ompic_service = OmpicService()