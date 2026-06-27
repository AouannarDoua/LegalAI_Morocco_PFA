# legal_kb.py
# ──────────────────────────────────────────────────────────────────────────────
# Récupération d'articles de loi depuis TA base de connaissances
# (backend/data/knowledge/...) pour alimenter l'analyse de contrat (Score).
#
# Réutilise EXACTEMENT ce qui existe déjà dans ton projet :
#   • backend/app/services/legal_data.py  → load_all()  (charge + découpe les lois
#     article par article, même données que ton chatbot)
#   • la même approche BM25 que rag_service.py (zéro dépendance lourde :
#     PAS de faiss, PAS de torch → marche même sous Python 3.14).
#
# À placer dans le même dossier que main.py (la racine du projet).
# ──────────────────────────────────────────────────────────────────────────────
import os
import re
import sys
import math
from collections import Counter

# ── Localiser le projet et importer legal_data (le tien) ──────────────────────
_ROOT        = os.path.dirname(os.path.abspath(__file__))
_DATA_DIR    = os.path.join(_ROOT, "backend", "data")
_SERVICES    = os.path.join(_ROOT, "backend", "app", "services")

LEGAL_KB_AVAILABLE = False
_load_all = None
try:
    if _SERVICES not in sys.path:
        sys.path.insert(0, _SERVICES)
    import legal_data            # ← ton chargeur existant (stdlib uniquement)
    _load_all = legal_data.load_all
    LEGAL_KB_AVAILABLE = True
except Exception as e:           # pragma: no cover
    print(f"[legal_kb] ⚠️  base juridique indisponible : {e}")


# ── Normalisation arabe (même logique que rag_service.py) ─────────────────────
_AR_DIAC = re.compile(r"[\u0617-\u061A\u064B-\u0652\u0670\u06D6-\u06ED]")
_KEEP    = re.compile(r"[^\u0621-\u064A\u0660-\u0669A-Za-z0-9]+")

_STOP_RAW = (
    "في من على إلى عن مع و أو ثم أن إن ما هل كيف متى أين هو هي هم هذا هذه ذلك "
    "التي الذي الذين قد كان يكون كل بعض غير حتى إذا عند بين خلال بعد قبل أي به "
    "بها له لها فيه فيها منه منها لا بل لكن القانون المغربي قانون المادة مادة الفصل"
)


def _normalize_ar(text: str) -> str:
    t = (text or "").replace("\u0640", "")
    t = _AR_DIAC.sub("", t)
    t = re.sub("[إأآ]", "ا", t)
    t = t.replace("ى", "ي").replace("ؤ", "و").replace("ئ", "ي").replace("ة", "ه")
    t = _KEEP.sub(" ", t)
    return re.sub(r"\s+", " ", t).strip().lower()


_STOPWORDS = {_normalize_ar(w) for w in _STOP_RAW.split()}


def _tokenize(text: str):
    return [w for w in _normalize_ar(text).split() if w not in _STOPWORDS and len(w) > 1]


# ── BM25 minimal (même formule que SimpleBM25 de rag_service.py) ──────────────
class _BM25:
    def __init__(self, corpus_tokens, k1=1.5, b=0.75):
        self.k1, self.b = k1, b
        self.docs   = corpus_tokens
        self.N      = len(corpus_tokens)
        self.avgdl  = (sum(len(d) for d in corpus_tokens) / self.N) if self.N else 0.0
        self.tf     = [Counter(d) for d in corpus_tokens]
        df = Counter()
        for d in corpus_tokens:
            for w in set(d):
                df[w] += 1
        self.idf = {w: math.log(1 + (self.N - c + 0.5) / (c + 0.5)) for w, c in df.items()}

    def top_n(self, query_tokens, n=4):
        out = []
        for i, freqs in enumerate(self.tf):
            dl = len(self.docs[i]) or 1
            s = 0.0
            for w in query_tokens:
                f = freqs.get(w)
                if not f:
                    continue
                s += self.idf.get(w, 0.0) * (f * (self.k1 + 1)) / (
                    f + self.k1 * (1 - self.b + self.b * dl / self.avgdl))
            out.append(s)
        ranked = sorted(range(len(out)), key=lambda i: out[i], reverse=True)
        return [i for i in ranked[:n] if out[i] > 0]


# ── Index construit une seule fois (lazy) ─────────────────────────────────────
_RECORDS = None
_INDEX   = None


def _ensure_index():
    global _RECORDS, _INDEX
    if _INDEX is not None or not LEGAL_KB_AVAILABLE:
        return
    try:
        records, infos = _load_all(_DATA_DIR)
        corpus = []
        kept   = []
        for item in records:
            title   = item.get("العنوان", "")
            content = item.get("المحتوى_الكامل", item.get("المحتوى", ""))
            toks    = _tokenize(title) * 3 + _tokenize(content)  # titre pondéré
            if toks:
                corpus.append(toks)
                kept.append(item)
        _RECORDS = kept
        _INDEX   = _BM25(corpus)
        total = sum(n for _, n in infos)
        print(f"[legal_kb] ✅ {len(kept)} articles juridiques indexés "
              f"(depuis {total} enregistrements de ta base)")
    except Exception as e:
        print(f"[legal_kb] ⚠️  indexation échouée : {e}")


def search_laws(query: str, k: int = 4, max_chars: int = 600) -> str:
    """
    Renvoie un bloc de texte prêt à injecter dans le prompt : les k articles
    de loi les plus pertinents trouvés dans TA base (data/knowledge).
    Retourne "" si la base est indisponible ou si rien ne correspond.
    """
    _ensure_index()
    if not _INDEX or not _RECORDS:
        return ""
    idxs = _INDEX.top_n(_tokenize(query), n=k)
    blocs = []
    for rank, i in enumerate(idxs, 1):
        item    = _RECORDS[i]
        titre   = item.get("العنوان", "").strip()
        contenu = item.get("المحتوى_الكامل", item.get("المحتوى", "")).strip()
        contenu = contenu[:max_chars]
        blocs.append(f"[مرجع {rank}] {titre}\n{contenu}")
    return "\n\n---\n\n".join(blocs)
