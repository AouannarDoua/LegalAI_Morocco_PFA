# app/models/tax_update.py
import json
from datetime import datetime
from ..extensions import db


class TaxUpdate(db.Model):
    """
    Trace chaque vérification des barèmes fiscaux.
    status :
      - 'no_change' : vérification faite, aucun changement détecté
      - 'pending'   : un changement détecté, EN ATTENTE de validation par un admin
      - 'approved'  : mise à jour validée et appliquée au fichier tax_rates.json
      - 'rejected'  : mise à jour refusée par l'admin
      - 'error'     : la vérification a échoué (source injoignable, IA indisponible...)
    """
    __tablename__ = "tax_updates"

    id             = db.Column(db.Integer, primary_key=True)
    year           = db.Column(db.Integer, nullable=False)
    status         = db.Column(db.String(20), default="pending")
    triggered_by   = db.Column(db.String(20), default="auto")   # 'auto' (planificateur) | 'manual'
    source         = db.Column(db.String(255))
    message        = db.Column(db.Text)
    current_json   = db.Column(db.Text)   # barème actuellement en vigueur dans l'app
    proposed_json  = db.Column(db.Text)   # barème détecté par l'IA
    diff_json      = db.Column(db.Text)   # liste lisible des différences
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)
    reviewed_at    = db.Column(db.DateTime, nullable=True)
    reviewed_by_id = db.Column(db.Integer, nullable=True)

    @staticmethod
    def _load(x):
        try:
            return json.loads(x) if x else None
        except Exception:
            return None

    def to_dict(self):
        return {
            "id":             self.id,
            "year":           self.year,
            "status":         self.status,
            "triggered_by":   self.triggered_by,
            "source":         self.source,
            "message":        self.message,
            "current":        self._load(self.current_json),
            "proposed":       self._load(self.proposed_json),
            "differences":    self._load(self.diff_json),
            "created_at":     self.created_at.isoformat() if self.created_at else None,
            "reviewed_at":    self.reviewed_at.isoformat() if self.reviewed_at else None,
            "reviewed_by_id": self.reviewed_by_id,
        }