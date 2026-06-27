# -*- coding: utf-8 -*-
"""
contract_grids.py — SOURCE UNIQUE de la grille de clauses.

Partagé par les DEUX moteurs du projet :
  • la GÉNÉRATION de contrat  (Flask  : contract_service.py)
  • le SCORE / analyse         (FastAPI : main.py)

But : le contrat généré contient EXACTEMENT les clauses que le Score vérifie.
Plus de désalignement → un contrat généré par l'app obtient un bon score.

Ce fichier ne dépend de rien de lourd : il lit seulement CONTRACT_TYPES
(déjà présent dans backend/app/services/contract_types_data.py).
"""

# Import compatible avec les deux contextes :
#  - Flask importe ce module dans le package  -> import relatif
#  - le Score l'importe en module simple       -> import direct
try:
    from .contract_types_data import CONTRACT_TYPES          # contexte package (Flask)
except ImportError:                                          # pragma: no cover
    from contract_types_data import CONTRACT_TYPES           # import direct (Score)


# ──────────────────────────────────────────────────────────────────────────────
# Clauses ESSENTIELLES ajoutées à TOUS les contrats (protection juridique).
# Le générateur les produit ET le Score les vérifie -> cohérence totale.
# (Mêmes intitulés/lois que les anciennes CLAUSES_UNIVERSELLES du Score.)
# ──────────────────────────────────────────────────────────────────────────────
CLAUSES_UNIVERSELLES = [
    {"clause": "القوة القاهرة والظروف الطارئة",
     "loi": "الفصل 268-269 من ق.ل.ع",            "risque_defaut": "مرتفع"},
    {"clause": "البند الجزائي والغرامات التعاقدية",
     "loi": "الفصل 264 من ق.ل.ع",                "risque_defaut": "مرتفع"},
    {"clause": "الاختصاص القضائي والقانون الواجب التطبيق",
     "loi": "الفصل 27 من ق.م.م",                 "risque_defaut": "متوسط"},
    {"clause": "شروط تعديل العقد والملاحق",
     "loi": "الفصل 230 من ق.ل.ع",                "risque_defaut": "منخفض"},
]
_UNIV_NAMES = [u["clause"] for u in CLAUSES_UNIVERSELLES]

# Grille minimale si le type est inconnu.
DEFAULT_CLAUSES = [
    "موضوع العقد", "التزامات الأطراف", "المدة",
    "الثمن أو المقابل المالي", "شروط الإنهاء",
]


def resolve_type(text: str):
    """Clé canonique de CONTRACT_TYPES (exacte, sinon via les mots-clés)."""
    if not text:
        return None
    if text in CONTRACT_TYPES:
        return text
    low = text.lower()
    for name, data in CONTRACT_TYPES.items():
        for kw in data.get("keywords", []):
            if kw and kw.lower() in low:
                return name
    return None


def base_clauses(text: str):
    """Clauses de base du type (SANS les universelles)."""
    t = resolve_type(text)
    if t:
        cl = list(CONTRACT_TYPES[t].get("clauses", []))
        return cl or list(DEFAULT_CLAUSES)
    return list(DEFAULT_CLAUSES)


def clauses_for(text: str, with_universal: bool = True):
    """
    Liste FINALE de NOMS de clauses (base + universelles), dédupliquée.
    👉 utilisée par la GÉNÉRATION (contract_service.py).
    """
    out = base_clauses(text)
    if with_universal:
        for u in _UNIV_NAMES:
            if u not in out:
                out.append(u)
    return out


def grid_for(text: str, with_universal: bool = True):
    """
    Grille ENRICHIE [{clause, loi, risque_defaut}].
    👉 utilisée par le SCORE (main.py) — même contenu que clauses_for.
    """
    names = base_clauses(text)
    grid  = [{"clause": c, "loi": "", "risque_defaut": "متوسط"} for c in names]
    if with_universal:
        present = {g["clause"] for g in grid}
        for u in CLAUSES_UNIVERSELLES:
            if u["clause"] not in present:
                grid.append(dict(u))
    return grid
