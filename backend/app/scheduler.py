# app/scheduler.py
# ─────────────────────────────────────────────────────────────────────────────
# Planificateur : lance automatiquement la vérification des barèmes fiscaux
# le 1er de chaque mois à 03h00. Utilise APScheduler.
# ─────────────────────────────────────────────────────────────────────────────
import os

try:
    from apscheduler.schedulers.background import BackgroundScheduler
except Exception:
    BackgroundScheduler = None

_scheduler = None


def _run_monthly_check(app):
    """Exécutée par le planificateur — doit tourner dans un contexte d'application."""
    with app.app_context():
        try:
            from .services.tax_update_service import tax_update_service
            rec = tax_update_service.run_check(triggered_by="auto")
            print(f"[scheduler] Vérification fiscale mensuelle : statut={rec.status}")
        except Exception as e:
            print(f"[scheduler] Erreur vérification mensuelle : {e}")


def init_scheduler(app):
    """
    Démarre le planificateur une seule fois.
    - En dev (Flask debug + reloader), WERKZEUG_RUN_MAIN == 'true' dans le process
      qui sert réellement : on évite ainsi un double démarrage.
    - En prod, définir la variable d'environnement RUN_SCHEDULER=1 pour l'activer.
    """
    global _scheduler
    if BackgroundScheduler is None:
        print("[scheduler] APScheduler non installé — planificateur désactivé.")
        return

    should_start = (
        os.environ.get("WERKZEUG_RUN_MAIN") == "true"
        or os.environ.get("RUN_SCHEDULER") == "1"
    )
    if not should_start or _scheduler is not None:
        return

    _scheduler = BackgroundScheduler(daemon=True)
    # 1er de chaque mois à 03:00
    _scheduler.add_job(
        func=lambda: _run_monthly_check(app),
        trigger="cron",
        day=1, hour=3, minute=0,
        id="tax_monthly_check",
        replace_existing=True,
    )
    _scheduler.start()
    print("[scheduler] Planificateur démarré — vérification fiscale le 1er de chaque mois à 03h00.")