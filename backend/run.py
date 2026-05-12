from app import create_app
from app.extensions import db

app = create_app()

if __name__ == "__main__":
    # Optionnel : On ne laisse db.create_all() que si on veut 
    # être sûr que les tables existent sans passer par les migrations au début.
    # Mais avec votre configuration MySQL + Migrate, c'est mieux de s'en passer.
    
    app.run(debug=True, host="0.0.0.0", port=5000)