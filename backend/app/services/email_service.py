from flask import current_app, render_template_string
from flask_mail import Message
from ..extensions import mail

CONFIRMATION_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: #2563eb; padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .body { padding: 30px; }
    .btn { display: inline-block; background: #2563eb; color: white !important; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8f8f8; padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>⚖️ LegalAI Maroc</h1></div>
    <div class="body">
      <h2>Bienvenue, {{ name }} !</h2>
      <p>Merci de vous être inscrit sur <strong>LegalAI Maroc</strong>.</p>
      <p>Cliquez ci-dessous pour confirmer votre adresse email :</p>
      <a href="{{ url }}" class="btn">✅ Confirmer mon email</a>
      <p style="color: #888; font-size: 13px;">Ce lien expire dans 24 heures.</p>
    </div>
    <div class="footer">© 2025 LegalAI Maroc</div>
  </div>
</body>
</html>
"""

RESET_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: #dc2626; padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .body { padding: 30px; }
    .btn { display: inline-block; background: #dc2626; color: white !important; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8f8f8; padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>⚖️ LegalAI Maroc</h1></div>
    <div class="body">
      <h2>Réinitialisation du mot de passe</h2>
      <p>Bonjour <strong>{{ name }}</strong>,</p>
      <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
      <p>Cliquez ci-dessous pour choisir un nouveau mot de passe :</p>
      <a href="{{ url }}" class="btn">🔑 Réinitialiser mon mot de passe</a>
      <p style="color: #888; font-size: 13px;">Ce lien expire dans <strong>1 heure</strong>.</p>
      <p style="color: #888; font-size: 13px;">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    </div>
    <div class="footer">© 2025 LegalAI Maroc</div>
  </div>
</body>
</html>
"""

WELCOME_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: #2563eb; padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; }
    .body { padding: 30px; }
    .footer { background: #f8f8f8; padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>⚖️ LegalAI Maroc</h1></div>
    <div class="body">
      <h2>🎉 Email confirmé avec succès !</h2>
      <p>Bonjour <strong>{{ name }}</strong>, votre compte est maintenant actif.</p>
      <ul>
        <li>⚖️ Assistant juridique IA</li>
        <li>📄 Analyse de contrats</li>
        <li>✍️ Génération de contrats</li>
        <li>📚 Décisions judiciaires</li>
      </ul>
    </div>
    <div class="footer">© 2025 LegalAI Maroc</div>
  </div>
</body>
</html>
"""


class EmailService:
    def send_confirmation_email(self, email: str, name: str, token: str):
        frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:3000")
        url  = f"{frontend_url}/confirm-email?token={token}"
        html = render_template_string(CONFIRMATION_TEMPLATE, name=name or email, url=url)
        msg  = Message(
            subject="✅ Confirmez votre email — LegalAI Maroc",
            recipients=[email],
            html=html
        )
        mail.send(msg)

    def send_reset_password_email(self, email: str, name: str, token: str):
        frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:3000")
        url  = f"{frontend_url}/reset-password?token={token}"
        html = render_template_string(RESET_TEMPLATE, name=name or email, url=url)
        msg  = Message(
            subject="🔑 Réinitialisation de votre mot de passe — LegalAI Maroc",
            recipients=[email],
            html=html
        )
        mail.send(msg)

    def send_welcome_email(self, email: str, name: str):
        html = render_template_string(WELCOME_TEMPLATE, name=name or email)
        msg  = Message(
            subject="🎉 Bienvenue sur LegalAI Maroc !",
            recipients=[email],
            html=html
        )
        mail.send(msg)


email_service = EmailService()