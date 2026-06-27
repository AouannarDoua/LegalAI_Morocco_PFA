# -*- coding: utf-8 -*-
import os
import re
import glob
import json
import math
from collections import Counter
from groq import Groq
from dotenv import load_dotenv
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from .legal_data import load_all

load_dotenv()


# ─── Normalisation arabe (pour la RECHERCHE seulement) ────────────────────────
# Améliore fortement le matching sur du texte OCR « sale » : on retire les
# diacritiques, la kashida, et on unifie les variantes (ا/أ/إ/آ, ى/ي, ة/ه…).
_AR_DIAC = re.compile(r"[\u0617-\u061A\u064B-\u0652\u0670\u06D6-\u06ED]")
# Garde uniquement : lettres arabes, chiffres (arabes & latins), lettres latines.
# => retire la ponctuation arabe (؟ ، ؛ « ») qui sinon se colle aux mots.
_KEEP = re.compile(r"[^\u0621-\u064A\u0660-\u0669A-Za-z0-9]+")


def normalize_ar(text: str) -> str:
    t = text or ""
    t = t.replace("\u0640", "")          # tatweel / kashida ـ
    t = _AR_DIAC.sub("", t)              # harakat / diacritiques
    t = re.sub("[إأآ]", "ا", t)
    t = t.replace("ى", "ي").replace("ؤ", "و").replace("ئ", "ي").replace("ة", "ه")
    t = _KEEP.sub(" ", t)                # ponctuation -> espace
    t = re.sub(r"\s+", " ", t)
    return t.strip().lower()


# Mots vides = mots fonctionnels (في، من، ما…) + mots juridiques ultra-fréquents
# (القانون، محكمة، النقض، قرار، الملف…). Ils n'aident pas à distinguer LE bon
# document : on les retire pour que la recherche porte sur les vrais termes
# (خبرة، استئناف، تمثيل، كراء…). 👉 ajoute/enlève des mots ici si besoin.
_STOP_RAW = (
    "في من على إلى عن مع و أو ثم أن إن ما ماذا هل كيف متى أين لماذا هو هي هم هن "
    "أنت أنا نحن هذا هذه ذلك تلك الذي التي الذين قد كان يكون هناك هنا كل بعض غير "
    "حتى إذا عند عندما بين خلال بعد قبل أي أية به بها له لها فيه فيها منه منها لا "
    "بل لكن منذ لدى نحو عبر أمام طرف "
    "القانون المغربي المغرب قانون محكمة النقض قرار رقم الصادر بتاريخ الملف عدد "
    "الغرفة المجلس الأعلى نشرة دليل التجار المادة مادة"
)
STOPWORDS = {normalize_ar(w) for w in _STOP_RAW.split()}


def tokenize(text: str):
    return [w for w in normalize_ar(text).split() if w not in STOPWORDS and len(w) > 1]


# Caractères CJK (chinois/japonais/coréen) : ne devraient JAMAIS apparaître dans
# une réponse arabe ou française. Le modèle en laisse parfois fuiter un (ex. 然而).
_CJK = re.compile(r"[\u3000-\u303F\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF"
                  r"\uF900-\uFAFF\uAC00-\uD7AF\uFF00-\uFFEF]+")


def clean_answer(text: str) -> str:
    if not text:
        return text
    text = _CJK.sub("", text)                                    # retire le CJK
    text = re.sub(r"[ \t]+([،؛.:!؟])", r"\1", text)              # « mot . » -> « mot. »
    text = re.sub(r"([.،؛:!؟])[ \t]*([.،؛:!؟])+", r"\1", text)   # « .، » -> « . »
    text = re.sub(r"(^|\n)[ \t]*[،,؛:.]+[ \t]*", r"\1", text)    # ponctuation en début de ligne
    text = re.sub(r"[ \t]{2,}", " ", text)
    return text.strip()


# Mots latins qui « fuitent » dans une réponse censée être 100% arabe
# (ex. « translate », « ng »). Le modèle code-switch parfois vers l'anglais.
_LATIN_RUN = re.compile(r"[A-Za-z]+")


def enforce_arabic(text: str) -> str:
    """À utiliser UNIQUEMENT pour les réponses en arabe : retire les mots latins
    qui se sont glissés dans le texte arabe (sans toucher aux chiffres ni aux
    numéros d'articles), puis recolle proprement la ponctuation et les espaces."""
    if not text:
        return text
    text = _LATIN_RUN.sub("", text)
    # nettoie les résidus laissés par la suppression (lettres orphelines collées,
    # double espaces, ponctuation isolée)
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\s+([،؛.:!؟])", r"\1", text)
    text = re.sub(r"(^|\n)[ \t]*[،,؛:.]+[ \t]*", r"\1", text)
    return text.strip()


# ─── BM25 intégré (zéro dépendance externe) ───────────────────────────────────
class SimpleBM25:
    def __init__(self, corpus_tokens, k1: float = 1.5, b: float = 0.75):
        self.k1, self.b = k1, b
        self.docs = corpus_tokens
        self.N = len(corpus_tokens)
        self.avgdl = (sum(len(d) for d in corpus_tokens) / self.N) if self.N else 0.0
        self.tf = [Counter(d) for d in corpus_tokens]
        df = Counter()
        for d in corpus_tokens:
            for w in set(d):
                df[w] += 1
        self.idf = {
            w: math.log(1 + (self.N - c + 0.5) / (c + 0.5)) for w, c in df.items()
        }

    def scores(self, query_tokens):
        out = []
        for i, freqs in enumerate(self.tf):
            dl = len(self.docs[i]) or 1
            s = 0.0
            for w in query_tokens:
                f = freqs.get(w)
                if not f:
                    continue
                idf = self.idf.get(w, 0.0)
                s += idf * (f * (self.k1 + 1)) / (
                    f + self.k1 * (1 - self.b + self.b * dl / self.avgdl)
                )
            out.append(s)
        return out

    def top_n(self, query_tokens, n: int = 5):
        sc = self.scores(query_tokens)
        ranked = sorted(range(len(sc)), key=lambda i: sc[i], reverse=True)
        return [i for i in ranked[:n] if sc[i] > 0]


class MockDocument:
    """Structure unifiée — page_content + metadata — utilisée par chat & contracts."""
    def __init__(self, content: str, metadata: dict):
        self.page_content = content
        self.metadata = metadata


class RAGService:
    def __init__(self):
        api_key = os.environ.get("GROQ_API_KEY", "")
        if not api_key:
            print("[RAGService]   GROQ_API_KEY manquante dans .env")

        self.client = Groq(api_key=api_key)
        self.model_name = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.documents = []
        self.bm25 = None
        self._prepare_knowledge_base()

    # ─── Chargement des données ───────────────────────────────────────────────
    def _data_dir(self) -> str:
        base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        return os.path.join(base, "data")

    def _prepare_knowledge_base(self):
        # Le chargement + nettoyage + détection de format est délégué à legal_data,
        # afin que le CHAT et les PAGES utilisent exactement les mêmes données.
        records, infos = load_all(self._data_dir())
        tokenized_corpus = []
        for item in records:
            self.documents.append(item)
            title = item.get("العنوان", "")
            content = item.get("المحتوى_الكامل", item.get("المحتوى", ""))
            tokenized_corpus.append(tokenize(title + " ") * 3 + tokenize(content))

        for name, n in infos:
            print(f"[RAGService] + {n} docs depuis {name}")

        if tokenized_corpus:
            self.bm25 = SimpleBM25(tokenized_corpus)
            print(f"[RAGService] ✅ {len(self.documents)} documents indexés au total")
        else:
            print("[RAGService] ❌ Aucune donnée chargée")

    # ─── Retrieval ────────────────────────────────────────────────────────────
    def _doc_to_mock(self, item: dict) -> MockDocument:
        return MockDocument(
            content=item.get("المحتوى_الكامل", item.get("المحتوى", "")),
            metadata={
                "title":    item.get("العنوان", ""),
                "url":      item.get("الرابط", ""),
                "category": item.get("التصنيفات", ""),
                "download": item.get("روابط_التحميل", ""),
                "type":     item.get("نوع_المصدر", "article"),
            },
        )

    def retrieve(self, query: str, top_n: int = 1):
        """Compat ascendante : renvoie le MEILLEUR MockDocument (ou None)."""
        docs = self.retrieve_many(query, top_n=top_n)
        return docs[0] if docs else None

    def retrieve_many(self, query: str, top_n: int = 4):
        if not self.bm25 or not self.documents:
            return []
        # ✅ Les LOIS/ARTICLES répondent mieux aux questions « comment / quelle règle »
        #    que les décisions (qui ne décrivent qu'un litige précis). On applique un
        #    petit bonus de rang aux lois pour qu'elles ne soient pas noyées sous les
        #    milliers de décisions -> le chat trouve enfin la bonne base légale.
        sc = self.bm25.scores(tokenize(query))
        ranked = []
        for i, s in enumerate(sc):
            if s <= 0:
                continue
            typ = self.documents[i].get("نوع_المصدر", "article")
            poids = 1.3 if typ in ("loi", "article") else 1.0
            ranked.append((s * poids, i))
        ranked.sort(key=lambda x: x[0], reverse=True)
        return [self._doc_to_mock(self.documents[i]) for _, i in ranked[:top_n]]

    # ─── Recherche translingue ────────────────────────────────────────────────
    def _retrieval_query(self, query: str) -> str:
        """
        La base est en ARABE. Si la question ne contient pas d'arabe (français,
        anglais…), on la traduit en arabe AVANT la recherche BM25 — sinon aucun
        mot ne correspond et on ne retrouve rien. On garde aussi le texte original
        (utile pour les chiffres / numéros de loi).
        """
        if re.search(r"[\u0600-\u06FF]", query):
            return query  # déjà en arabe -> on ne traduit pas
        try:
            resp = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content":
                        "ترجم سؤال المستخدم إلى العربية القانونية في جملة قصيرة. "
                        "أعطني الترجمة العربية فقط، دون أي شرح أو علامات."},
                    {"role": "user", "content": query},
                ],
                model=self.model_name,
                temperature=0,
                max_tokens=120,
            )
            ar = (resp.choices[0].message.content or "").strip()
            return ar if ar else query
        except Exception as e:
            print(f"[RAGService] translate-query error: {e}")
            return query

    # ─── RAG complet (chat) ───────────────────────────────────────────────────
    def get_legal_answer(self, user_query: str, lang: str = "ar") -> dict:
        """Retrieval (multi-docs) + Generation. lang = 'ar' (défaut) ou 'fr'."""
        raw_docs = self.retrieve_many(self._retrieval_query(user_query), top_n=8)
        # déduplique : la même décision peut être présente plusieurs fois dans la
        # base (ex. ancien fichier + nouveau) -> sinon la source s'affiche en double.
        seen, docs = set(), []
        for d in raw_docs:
            key = (d.metadata.get("title", "") or d.page_content[:60]).strip()
            if key in seen:
                continue
            seen.add(key)
            docs.append(d)
        docs = docs[:4]

        if docs:
            blocks = []
            for i, d in enumerate(docs, 1):
                content = d.page_content or ""
                
                # استراتيجية جديدة: أخذ البداية (للوقائع) والنهاية (لمنطوق الحكم)
                if len(content) > 6000:
                    snippet = content[:2000] + "\n\n... [تم اختصار النص الأوسط] ...\n\n" + content[-4000:]
                else:
                    snippet = content
                    
                blocks.append(f"[مرجع {i}] {d.metadata.get('title','')}\n{snippet}")
            context = "\n\n---\n\n".join(blocks)
        else:
            context = ""

        # ── Verrouillage de la langue (exigence : arabe par défaut, français
        #    seulement si demandé ; JAMAIS chinois/anglais/autre). ──────────────
        if lang == "fr":
            system = (
                "Tu es « Mizan », un assistant juridique marocain expert qui s'appuie "
                "uniquement sur les documents de référence fournis.\n"
                "RÈGLES DE LANGUE (impératives) :\n"
                "- Rédige TOUTE ta réponse en FRANÇAIS uniquement.\n"
                "- N'utilise JAMAIS l'anglais, le chinois, ni aucune autre langue dans le "
                "corps de la réponse. Tu peux uniquement citer entre parenthèses un terme "
                "ou un numéro d'article en arabe tel qu'il apparaît dans les textes.\n"
                "- Même si la question est posée dans une autre langue, ou si les documents "
                "contiennent des mots étrangers, ta réponse reste en français.\n"
                "RÈGLES DE CONTENU :\n"
                "- Appuie-toi d'abord sur les documents ci-dessous ; cite le numéro de "
                "décision / d'article / de loi lorsqu'il est présent.\n"
                "- Si les documents sont liés au sujet sans y répondre mot pour mot, fournis "
                "une réponse pratique et claire, conforme au droit marocain, fondée sur eux.\n"
                "- Ne réponds « Cette information n'est pas disponible dans nos documents. » "
                "que si la question est totalement hors du droit marocain ou qu'aucun document "
                "pertinent n'existe. N'invente jamais de numéro d'article ou de décision."
            )
            user = (
                f"Documents de référence :\n{context if context else '(aucun document pertinent trouvé)'}\n\n"
                f"Question de l'utilisateur : {user_query}"
            )
        else:
            system = (
                "أنت «ميزان»، مساعد قانوني مغربي خبير يعتمد فقط على الوثائق المرجعية المقدَّمة.\n"
                "قواعد اللغة (إلزامية):\n"
                "- اكتب إجابتك بالكامل باللغة العربية الفصحى فقط.\n"
                "- يُمنع منعاً باتاً استعمال الإنجليزية أو الصينية أو الفرنسية أو أي لغة "
                "أخرى في جسم الجواب (يُسمح فقط بذكر رقم مادة أو قانون كما ورد في النصوص).\n"
                "- حتى لو طُرح السؤال بلغة أجنبية، أو احتوت الوثائق على كلمات أجنبية، "
                "يجب أن يكون جوابك بالكامل بالعربية.\n"
                "قواعد المحتوى:\n"
                "- استند أساساً إلى الوثائق أدناه، واذكر رقم المادة/القانون/القرار عند وجوده.\n"
                "- إذا كانت الوثائق متصلة بالموضوع لكنها لا تجيب حرفياً، قدّم إجابة عملية "
                "وواضحة موافقة للقانون المغربي مستندة إلى ما ورد فيها.\n"
                "- لا تقل «هذه المعلومة غير متوفرة في وثائقنا.» إلا إذا كان السؤال خارج نطاق "
                "القانون المغربي كلياً أو لا توجد أي وثيقة ذات صلة. ولا تخترع أرقام مواد أو قرارات غير موجودة."
            )
            user = (
                f"الوثائق المرجعية:\n{context if context else '(لم يتم العثور على وثيقة مطابقة)'}\n\n"
                f"سؤال المستخدم: {user_query}"
            )

        try:
            response = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                model=self.model_name,
                temperature=0.1,
                max_tokens=1500,
            )
            answer = clean_answer(response.choices[0].message.content)
            if lang != "fr":
                answer = enforce_arabic(answer)   # ✅ supprime les fuites latines (ar uniquement)
        except Exception as e:
            print(f"[RAGService] Groq error: {e}")
            answer = (
                "وقع خطأ في الاتصال بالذكاء الاصطناعي. يرجى المحاولة لاحقاً."
                if lang != "fr"
                else "Une erreur est survenue lors de la connexion à l'IA. Réessayez plus tard."
            )

        return {
            "answer": answer,
            "source_documents": docs[:3],   # affichées comme « sources » dans le chat
        }


rag_service = RAGService()
