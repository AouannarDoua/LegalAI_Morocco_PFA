# make_admin.py
# ─────────────────────────────────────────────────────────────────────────────
# Crée la table 'tax_updates' (si absente) et passe un utilisateur en admin.
# Utilisation :
#   python make_admin.py ton_email@gmail.com
# ─────────────────────────────────────────────────────────────────────────────
import sys
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.tax_update import TaxUpdate  # noqa: F401 (import pour que create_all la connaisse)

app = create_app()

with app.app_context():
    # 1) Crée les tables manquantes (n'efface rien d'existant)
    db.create_all()
    print("✅ Tables vérifiées/créées (dont 'tax_updates').")

    # 2) Promotion admin
    if len(sys.argv) < 2:
        print("ℹ️  Pour désigner un admin : python make_admin.py ton_email@gmail.com")
    else:
        email = sys.argv[1].strip().lower()
        user = User.query.filter_by(email=email).first()
        if not user:
            print(f"❌ Aucun utilisateur avec l'email {email}. Crée d'abord le compte dans l'app.")
        else:
            user.role = "admin"
            db.session.commit()
            print(f"✅ {email} est maintenant ADMIN.")