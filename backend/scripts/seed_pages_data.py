# -*- coding: utf-8 -*-
"""
Remplit les tables `decisions` et `articles` (= ce qu'affichent les PAGES
Décisions et Articles) à partir de TOUS les fichiers de data/ + data/knowledge/,
quel que soit leur format (brut, converti, ou loi).

Routage :
   - décision -> table `decisions` (page Décisions)
   - article  -> table `articles`  (page Articles)
   - LOI      -> table `articles`, UNE ligne par loi (le code entier),
                 ET reste dispo article-par-article dans le CHAT.

Usage (depuis backend/) :
   python scripts/seed_pages_data.py            # remplit si vide
   python scripts/seed_pages_data.py --force    # vide puis re-remplit
"""
import os
import sys
import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app                          # noqa: E402
from app.extensions import db                        # noqa: E402
from app.models.decision import Decision             # noqa: E402
from app.models.article import Article               # noqa: E402
from app.services.legal_data import load_all, law_documents  # noqa: E402

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

CHAMBER_TO_CAT = {
    "الغرفة الاجتماعية": "Droit du travail",
    "الغرفة الإدارية":   "Droit administratif",
    "الغرفة العقارية":   "Droit immobilier",
    "الغرفة التجارية":   "Droit commercial",
    "الغرفة الجنائية":   "Droit pénal",
    "الغرفة المدنية":    "Droit de la famille",
}

# (optionnel) matière de loi -> catégorie FR des chips Articles.
# Laisse vide pour garder la matière arabe (la loi s'affiche sous « Tous »).
LAW_MATTER_MAP = {
    # "المادة التجارية": "Droit des affaires",
}


def parse_date(s):
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d", "%Y-%m-%dT%H:%M:%S.%fZ"):
        try:
            return datetime.datetime.strptime((s or "").strip(), fmt).date()
        except ValueError:
            continue
    return None


def widen_content_column():
    """Élargit articles.content en LONGTEXT (MySQL) pour stocker un code entier."""
    try:
        from sqlalchemy import text
        db.session.execute(text("ALTER TABLE articles MODIFY content LONGTEXT"))
        db.session.commit()
        print("OK colonne `articles.content` élargie en LONGTEXT.")
    except Exception as e:
        db.session.rollback()
        print(f"i  (info) ALTER content ignoré : {e}")


def seed(force: bool):
    records, infos = load_all(DATA_DIR)
    laws = law_documents(DATA_DIR)
    print("Sources :", ", ".join(f"{n}({c})" for n, c in infos) or "aucune")

    decisions = [r for r in records if r.get("نوع_المصدر") == "decision"]
    articles  = [r for r in records if r.get("نوع_المصدر") == "article"]
    print(f"-> décisions={len(decisions)}  articles(maliyum)={len(articles)}  lois={len(laws)}")

    # Décisions
    existing = Decision.query.count()
    if existing and not force:
        print(f"i  Table `decisions` non vide ({existing}). --force pour re-remplir.")
    else:
        if force and existing:
            Decision.query.delete(); db.session.commit()
            print(f"x  {existing} décisions supprimées.")
        n = 0
        for it in decisions:
            chamber = (it.get("التصنيفات", "").split("،")[0]).strip()
            db.session.add(Decision(
                title=(it.get("العنوان", "") or "قرار")[:255],
                court="محكمة النقض" + (f" — {chamber}" if chamber else ""),
                date=parse_date(it.get("التاريخ", "")),
                summary=(it.get("المحتوى", "") or "")[:600],
                full_text=it.get("المحتوى_الكامل", ""),
                category=CHAMBER_TO_CAT.get(chamber, chamber or "قرارات قضائية"),
            ))
            n += 1
        db.session.commit()
        print(f"OK {n} décisions ajoutées.")

    # Articles (maliyum + LOIS, une ligne par loi)
    existing = Article.query.count()
    if existing and not force:
        print(f"i  Table `articles` non vide ({existing}). --force pour re-remplir.")
        return
    if force and existing:
        Article.query.delete(); db.session.commit()
        print(f"x  {existing} articles supprimés.")

    widen_content_column()

    n = 0
    for it in articles:
        ar_cat = (it.get("التصنيفات", "") or "عام").split("،")[0].strip()
        db.session.add(Article(
            title=(it.get("العنوان", "") or "مقال")[:255],
            content=it.get("المحتوى_الكامل", it.get("المحتوى", "")),
            category=ar_cat,
            author=it.get("المصدر", "Maliyum"),
            published=True,
            created_at=datetime.datetime.combine(
                parse_date(it.get("التاريخ", "")) or datetime.date.today(),
                datetime.time()),
        ))
        n += 1

    for law in laws:
        cat = LAW_MATTER_MAP.get(law["matter"], law["matter"] or "نصوص تشريعية")
        db.session.add(Article(
            title=law["title"][:255],
            content=law["content"],
            category=cat,
            author="نصوص تشريعية",
            published=True,
            created_at=datetime.datetime.combine(
                parse_date(law["date"]) or datetime.date.today(),
                datetime.time()),
        ))
        n += 1
    db.session.commit()
    print(f"OK {n} articles ajoutés (dont {len(laws)} lois), published=True.")


def main():
    app = create_app()
    with app.app_context():
        seed("--force" in sys.argv)
        print("Termine.")


if __name__ == "__main__":
    main()
