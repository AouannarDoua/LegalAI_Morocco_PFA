import re


def validate_email(email: str) -> bool:
    return bool(re.match(r"[^@]+@[^@]+\.[^@]+", email))


def validate_password(password: str) -> tuple[bool, str]:
    if len(password) < 8:
        return False, "Le mot de passe doit contenir au moins 8 caractères"
    return True, ""


def validate_required_fields(data: dict, fields: list) -> tuple[bool, list]:
    missing = [f for f in fields if not data.get(f)]
    if missing:
        return False, [f"Le champ '{f}' est requis" for f in missing]
    return True, []
