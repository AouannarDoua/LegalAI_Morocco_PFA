# seed_data.py
from app import create_app
from app.extensions import db
from app.models.notification import Notification
from app.models.article import Article
from app.models.contract import Contract
from datetime import datetime
from app.models.user import User


app = create_app()

with app.app_context():
    # 1. Ajout d'une Notification Mock
   user = User.query.first() # Récupère le premier utilisateur existant
   if user:
    n1 = Notification(
            user_id=user.id, 
            title="Test de Connexion",
            message="Si vous voyez ce message, le lien JWT <-> DB fonctionne.",
            notif_type="success"
        )

    # 2. Ajout d'un Article de Loi Mock (Droit Marocain)
    a1 = Article(
        title="Article 33 - Dahir formant Code des Obligations et des Contrats",
        content="L'offre faite à une personne présente, sans fixation de délai, est non avenue si elle n'est acceptée sur-le-champ par l'autre partie.",
        category="Droit Civil",
        author="Ministère de la Justice",
        published=True
    )

    db.session.add(n1)
    db.session.add(a1)
    db.session.commit()
    
    print("✅ Mock Data injectées avec succès dans MySQL !")

    # À ajouter dans seed_data.py pour tester l'analyse


    c1 = Contract(
       user_id=1,
       title="Contrat de Bail Commercial",
       contract_type="bail",
       status="analyzed",
       ai_analysis="### Points de vigilance\n1. Clause de résiliation unilatérale...\n2. Durée du préavis..."
    )
    db.session.add(c1)
    db.session.commit()

    print(f"✅ Notification ajoutée pour l'utilisateur : {user.email} (ID: {user.id})")
   else:
    print("❌ Aucun utilisateur trouvé. Créez un compte d'abord.")