// src/pages/ContractScore.tsx
// ──────────────────────────────────────────────────────────────────────────────
// Composant « Score du contrat » de l'app Mizan.
// • Bilingue automatique FR / العربية (suit la langue de l'app via useLang()).
// • Thème mizan (vert zellige) au lieu du bleu générique.
// • Logo Mizan dans l'en-tête.
// Backend FastAPI (main.py) — port 8000, URL via VITE_SCORE_API_URL.
// ──────────────────────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from "react";
import { useLang } from "../i18n/LanguageContext";
import { BASE_URL, tokenStorage } from "../services/apiClient";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ClausePresente  { clause: string; statut: string; commentaire: string }
interface ClauseManquante { clause: string; risque: string; recommandation: string }
interface Risque          { titre: string; niveau: string; description: string }

interface Analyse {
  score:              number;
  niveau:             string;
  resume:             string;
  clauses_presentes:  ClausePresente[];
  clauses_manquantes: ClauseManquante[];
  risques:            Risque[];
  recommandations:    string[];
}
interface ApiResponse {
  id:            number | null;
  fichier:       string;
  type_contrat:  string;
  nb_caracteres: number;
  ocr_utilise:   boolean;
  rag_utilise?:  boolean | string;
  analyse:       Analyse;
}
interface HistoryRecord {
  id: number; fichier: string; type_contrat: string;
  score: number; niveau: string; created_at: string;
}

// ── Config ────────────────────────────────────────────────────────────────────
const API =
  (import.meta as any).env?.VITE_SCORE_API_URL || "http://localhost:8000";

const CONTRACT_TYPES = [
  "عقد عمل", "عقد كراء", "عقد بيع", "عقد شراكة",
  "عقد خدمات", "عقد وكالة", "عقد مقاولة", "اتفاقية تجارية",
  "أخرى",
];

// ── Traductions locales FR / AR ───────────────────────────────────────────────
const STR = {
  ar: {
    title: "تحليل صلابة العقد",
    subtitle: "تحليل ذكي بالذكاء الاصطناعي — القانون المغربي",
    dropHere: "اسحب العقد هنا أو اضغط للرفع",
    dropHint: "PDF أو Word (.docx) — حجم أقصى 10MB",
    changeFile: "اضغط لتغيير الملف",
    typeLabel: "نوع العقد",
    typePlaceholder: "-- اختر نوع العقد --",
    analyze: "تحليل العقد",
    analyzing: "جاري التحليل بالذكاء الاصطناعي...",
    onlyPdfWord: "الرجاء رفع ملف PDF أو Word فقط",
    analyzeErr: "خطأ في التحليل",
    file: "ملف", type: "النوع", chars: "حرف",
    ocrUsed: "🔍 تم استخدام OCR (ملف مسحوب ضوئياً)",
    present: "بند موجود", missing: "بند ناقص", risk: "خطر محتمل",
    downloadPdf: "تحميل التقرير كـ PDF",
    generatingPdf: "جاري إنشاء التقرير...",
    pdfHint: "تقرير مفصل بالتحليل الكامل والتوصيات",
    pdfErr: "خطأ في تحميل التقرير: ",
    secPresent: "البنود الموجودة",
    secMissing: "البنود الناقصة",
    secRisks: "المخاطر القانونية",
    secReco: "التوصيات",
    histTitle: "سجل التحليلات السابقة",
    histShow: "عرض ▼", histHide: "إخفاء ▲",
    histLoading: "جاري التحميل...",
    histEmpty: "لا توجد تحليلات محفوظة بعد",
    levels: { مرتفع: "مرتفع", متوسط: "متوسط", منخفض: "منخفض" } as Record<string, string>,
    scoreLabels: ["خطير", "ضعيف", "متوسط", "ممتاز"],
    locale: "ar-MA",
  },
  fr: {
    title: "Analyse de solidité du contrat",
    subtitle: "Analyse intelligente par IA — Droit marocain",
    dropHere: "Glissez le contrat ici ou cliquez pour téléverser",
    dropHint: "PDF ou Word (.docx) — max 10 Mo",
    changeFile: "Cliquez pour changer le fichier",
    typeLabel: "Type de contrat",
    typePlaceholder: "-- Choisir le type --",
    analyze: "Analyser le contrat",
    analyzing: "Analyse par IA en cours...",
    onlyPdfWord: "Merci de téléverser un fichier PDF ou Word",
    analyzeErr: "Erreur lors de l'analyse",
    file: "Fichier", type: "Type", chars: "caractères",
    ocrUsed: "🔍 OCR utilisé (document scanné)",
    present: "clause(s) présente(s)", missing: "clause(s) manquante(s)", risk: "risque(s) potentiel(s)",
    downloadPdf: "Télécharger le rapport PDF",
    generatingPdf: "Génération du rapport...",
    pdfHint: "Rapport détaillé avec analyse complète et recommandations",
    pdfErr: "Erreur de téléchargement : ",
    secPresent: "Clauses présentes",
    secMissing: "Clauses manquantes",
    secRisks: "Risques juridiques",
    secReco: "Recommandations",
    histTitle: "Historique des analyses",
    histShow: "Afficher ▼", histHide: "Masquer ▲",
    histLoading: "Chargement...",
    histEmpty: "Aucune analyse enregistrée",
    levels: { مرتفع: "Élevé", متوسط: "Moyen", منخفض: "Faible" } as Record<string, string>,
    scoreLabels: ["Critique", "Faible", "Moyen", "Excellent"],
    locale: "fr-FR",
  },
};

function useStr() {
  const { lang, dir } = useLang();
  const key = (lang === "fr" ? "fr" : "ar") as "fr" | "ar";
  return { s: STR[key], lang: key, dir };
}

// ── Couleurs (thème mizan) ────────────────────────────────────────────────────
const NIVEAU_COLOR: Record<string, string> = {
  مرتفع: "bg-red-100 text-red-700 border-red-200",
  متوسط: "bg-amber-100 text-amber-700 border-amber-200",
  منخفض: "bg-mizan-100 text-mizan-700 border-mizan-200",
};

// {classe texte, fond, index label traduit, couleur trait du cercle}
const scoreMeta = (s: number) => {
  if (s >= 75) return { text: "text-mizan-600", bg: "bg-mizan-50 border-mizan-200", idx: 3, stroke: "#0E6B4E" };
  if (s >= 50) return { text: "text-amber-600",  bg: "bg-amber-50 border-amber-200",  idx: 2, stroke: "#F59E0B" };
  if (s >= 25) return { text: "text-orange-600", bg: "bg-orange-50 border-orange-200", idx: 1, stroke: "#F97316" };
  return            { text: "text-red-600",    bg: "bg-red-50 border-red-200",     idx: 0, stroke: "#EF4444" };
};

function Badge({ text }: { text: string }) {
  const { s } = useStr();
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border
      ${NIVEAU_COLOR[text] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {s.levels[text] || text}
    </span>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-mizan-50/60">
        <span className="text-lg">{icon}</span>
        <h3 className="font-bold text-slate-700 text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Score Circle ──────────────────────────────────────────────────────────────
function ScoreCircle({ score }: { score: number }) {
  const { s } = useStr();
  const meta    = scoreMeta(score);
  const r       = 54;
  const cx      = 64;
  const perim   = 2 * Math.PI * r;
  const dashOff = perim * (1 - score / 100);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#E2E8F0" strokeWidth="10" />
        <circle
          cx={cx} cy={cx} r={r} fill="none"
          stroke={meta.stroke} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={perim} strokeDashoffset={dashOff}
          transform={`rotate(-90 ${cx} ${cx})`}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x={cx} y={cx - 4} textAnchor="middle" fontSize="28" fontWeight="bold" fill={meta.stroke}>{score}</text>
        <text x={cx} y={cx + 16} textAnchor="middle" fontSize="11" fill="#94A3B8">/100</text>
      </svg>
      <span className={`text-xl font-black ${meta.text}`}>{s.scoreLabels[meta.idx]}</span>
    </div>
  );
}

// ── History Panel ─────────────────────────────────────────────────────────────
function HistoryPanel({ onDownload }: { onDownload: (id: number) => void }) {
  const { s } = useStr();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/contract-score/history`);
      if (res.ok) setRecords(await res.json());
    } finally { setLoading(false); }
  };
  const toggle = () => { if (!open) load(); setOpen(!open); };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-4 bg-mizan-50/60
          hover:bg-mizan-100/60 transition-colors border-b border-slate-100">
        <span className="font-bold text-slate-700 text-sm flex items-center gap-2">
          🗂️ {s.histTitle}
        </span>
        <span className="text-slate-400 text-xs">{open ? s.histHide : s.histShow}</span>
      </button>

      {open && (
        <div className="p-4">
          {loading ? (
            <p className="text-center text-slate-400 text-sm py-4">{s.histLoading}</p>
          ) : records.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-4">{s.histEmpty}</p>
          ) : (
            <div className="space-y-2">
              {records.map((r) => {
                const meta = scoreMeta(r.score);
                return (
                  <div key={r.id}
                    className={`flex items-center justify-between p-3 rounded-xl border ${meta.bg}`}>
                    <div className="text-start">
                      <p className="font-semibold text-sm text-slate-700">{r.fichier}</p>
                      <p className="text-xs text-slate-400">
                        {r.type_contrat} — {new Date(r.created_at).toLocaleDateString(s.locale)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-black text-lg ${meta.text}`}>{r.score}</span>
                      <button onClick={() => onDownload(r.id)}
                        className="text-xs bg-mizan-600 text-white px-3 py-1.5 rounded-lg
                          hover:bg-mizan-700 transition-colors font-semibold">
                        📥 PDF
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
// Mappe un type/titre quelconque (arabe ou français) vers un type du Score.
function mapToScoreType(raw?: string): string {
  const t = (raw || "").toLowerCase();
  if (/كراء|bail|lease|location/.test(t))      return "عقد كراء";
  if (/عمل|travail|emploi|work/.test(t))         return "عقد عمل";
  if (/بيع|vente|sale/.test(t))                  return "عقد بيع";
  if (/شراكة|شركة|associ|partner/.test(t))       return "عقد شراكة";
  if (/خدمات|prestation|service/.test(t))        return "عقد خدمات";
  if (/وكالة|mandat|agency/.test(t))             return "عقد وكالة";
  if (/مقاولة|entreprise/.test(t))               return "عقد مقاولة";
  if (/تجار|commerc/.test(t))                    return "اتفاقية تجارية";
  return "";
}

export default function ContractScore(
  { contractId }: { contractId?: string } = {},
) {
  const { s, lang, dir } = useStr();
  const [file, setFile]             = useState<File | null>(null);
  const [typeContrat, setType]      = useState("");
  const [loading, setLoading]       = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [result, setResult]         = useState<ApiResponse | null>(null);
  const [error, setError]           = useState("");
  const [dragOver, setDragOver]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ✅ Pré-chargement depuis « عقودي » : à partir de l'id du contrat (dans l'URL),
  //    on récupère ses métadonnées puis on télécharge son PDF (avec le token JWT) et
  //    on le place dans la zone d'upload, prêt à analyser. Indépendant de la langue
  //    et résistant au refresh (≠ ancien état de navigation qui se perdait).
  useEffect(() => {
    if (!contractId) return;
    let cancelled = false;
    (async () => {
      try {
        const token   = tokenStorage.get();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        // 1) métadonnées du contrat (nom de fichier + type)
        const metaResp = await fetch(`${BASE_URL}/contracts/${contractId}`, { headers });
        if (!metaResp.ok) throw new Error("meta");
        const metaJson = await metaResp.json();
        const c        = metaJson?.data ?? metaJson;   // success_response enveloppe dans .data
        const fileName = c?.file_name;
        if (!fileName) {
          if (!cancelled)
            setError(lang === "ar"
              ? "هذا العقد لا يحتوي على ملف PDF — استعمل « تحليل نصي »."
              : "Ce contrat n'a pas de PDF — utilisez « Analyse texte ».");
          return;
        }
        // 2) téléchargement du PDF
        const pdfResp = await fetch(
          `${BASE_URL}/contracts/download/${encodeURIComponent(fileName)}`, { headers },
        );
        if (!pdfResp.ok) throw new Error("pdf");
        const blob = await pdfResp.blob();
        if (cancelled) return;
        setFile(new File([blob], fileName, { type: blob.type || "application/pdf" }));
        setError("");
        setResult(null);
        const mapped = mapToScoreType(c?.contract_type || c?.title);
        if (mapped) setType(mapped);
      } catch {
        if (!cancelled)
          setError(lang === "ar" ? "تعذّر تحميل ملف العقد." : "Impossible de charger le PDF du contrat.");
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId]);

  const handleFile = (f: File) => {
    if (!f.name.match(/\.(pdf|doc|docx)$/i)) { setError(s.onlyPdfWord); return; }
    setFile(f); setError(""); setResult(null);
  };

  const analyser = async () => {
    if (!file) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("type_contrat", typeContrat);
      form.append("langue", lang); // le backend peut l'utiliser (sinon ignoré)
      const res = await fetch(`${API}/api/contract-score/analyze`, { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || s.analyzeErr);
      }
      setResult(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const telechargerRapport = async () => {
    if (!result) return;
    setPdfLoading(true);
    try {
      let res: Response;
      if (result.id) {
        res = await fetch(`${API}/api/contract-score/report/${result.id}`);
      } else {
        // ✅ On envoie l'analyse DÉJÀ affichée → le PDF est identique à l'écran
        //    (avant : on ré-uploadait le fichier, ce qui relançait l'analyse et
        //     produisait un score / des clauses différents).
        res = await fetch(`${API}/api/contract-score/report/from-data`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            analyse:       result.analyse,
            fichier:       result.fichier,
            type_contrat:  result.type_contrat,
            nb_caracteres: result.nb_caracteres,
            rag_utilise:   result.rag_utilise,
          }),
        });
      }
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport_contrat_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(s.pdfErr + e.message);
    } finally { setPdfLoading(false); }
  };

  const downloadFromHistory = async (id: number) => {
    const res = await fetch(`${API}/api/contract-score/report/${id}`);
    const url = URL.createObjectURL(await res.blob());
    const a   = document.createElement("a");
    a.href = url; a.download = `rapport_${id}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  const analyse = result?.analyse;

  return (
    <div dir={dir} className="max-w-3xl mx-auto space-y-6">

      {/* Header avec LOGO Mizan */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-white border border-mizan-100 shadow-sm
          flex items-center justify-center overflow-hidden">
          <img src="/logo.png" alt="Mizan" className="w-9 h-9 object-contain"
               onError={(e) => { (e.currentTarget.style.display = "none"); }} />
        </div>
        <div>
          <h1 className="text-xl font-black text-mizan-800">{s.title}</h1>
          <p className="text-xs text-slate-400">{s.subtitle}</p>
        </div>
      </div>

      {/* Upload Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false);
            const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${dragOver
              ? "border-mizan-400 bg-mizan-50"
              : file
                ? "border-mizan-400 bg-mizan-50"
                : "border-slate-200 hover:border-mizan-300 hover:bg-slate-50"}`}
        >
          <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

          {file ? (
            <div className="space-y-2">
              <p className="text-4xl">{file.name.endsWith(".pdf") ? "📄" : "📝"}</p>
              <p className="font-bold text-mizan-700">{file.name}</p>
              <p className="text-xs text-slate-400">
                {(file.size / 1024).toFixed(1)} KB — {s.changeFile}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-4xl">☁️</p>
              <p className="font-semibold text-slate-600">{s.dropHere}</p>
              <p className="text-xs text-slate-400">{s.dropHint}</p>
            </div>
          )}
        </div>

        {/* Type de contrat */}
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2">{s.typeLabel}</label>
          <select value={typeContrat} onChange={(e) => setType(e.target.value)}
            className="w-full border border-slate-200 rounded-xl py-2.5 px-3 text-slate-700 text-sm
              focus:outline-none focus:ring-2 focus:ring-mizan-400 bg-white">
            <option value="" disabled>{s.typePlaceholder}</option>
            {CONTRACT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 text-sm">⚠️ {error}</p>
          </div>
        )}

        <button onClick={analyser} disabled={!file || !typeContrat || loading}
          className="w-full bg-mizan-600 hover:bg-mizan-700 disabled:opacity-50
                     disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl
                     transition-all flex items-center justify-center gap-2 shadow-md">
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {s.analyzing}
            </>
          ) : ( <>⚖️ {s.analyze}</> )}
        </button>
      </div>

      {/* Results */}
      {analyse && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <ScoreCircle score={analyse.score} />
              <div className="flex-1 space-y-3 text-center md:text-start">
                <div>
                  <p className="text-xs text-slate-400 mb-1">{s.file}: {result?.fichier}</p>
                  <p className="text-xs text-slate-400">
                    {s.type}: {result?.type_contrat} — {result?.nb_caracteres?.toLocaleString()} {s.chars}
                  </p>
                  {result?.ocr_utilise && (
                    <span className="inline-block mt-1 text-xs bg-violet-100 text-violet-700
                      border border-violet-200 px-2 py-0.5 rounded-full font-semibold">
                      {s.ocrUsed}
                    </span>
                  )}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed bg-mizan-50/60 rounded-xl p-3">
                  {analyse.resume}
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="text-xs bg-mizan-100 text-mizan-700 px-2 py-1 rounded-full font-semibold">
                    ✅ {analyse.clauses_presentes?.length} {s.present}
                  </span>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">
                    ❌ {analyse.clauses_manquantes?.length} {s.missing}
                  </span>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">
                    ⚠️ {analyse.risques?.length} {s.risk}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <button onClick={telechargerRapport} disabled={pdfLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4
                  bg-gradient-to-r from-mizan-700 to-mizan-500
                  hover:from-mizan-800 hover:to-mizan-600
                  disabled:opacity-60 disabled:cursor-not-allowed
                  text-white font-bold rounded-xl transition-all shadow-md">
                {pdfLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {s.generatingPdf}
                  </>
                ) : ( <>📥 {s.downloadPdf}</> )}
              </button>
              <p className="text-center text-xs text-slate-400 mt-2">{s.pdfHint}</p>
            </div>
          </div>

          {analyse.clauses_presentes?.length > 0 && (
            <Section title={s.secPresent} icon="✅">
              <div className="space-y-2">
                {analyse.clauses_presentes.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-mizan-50 rounded-xl">
                    <span className="text-mizan-600 mt-0.5">✓</span>
                    <div>
                      <p className="font-semibold text-sm text-slate-700">{c.clause}</p>
                      {c.commentaire && <p className="text-xs text-slate-500 mt-0.5">{c.commentaire}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {analyse.clauses_manquantes?.length > 0 && (
            <Section title={s.secMissing} icon="❌">
              <div className="space-y-3">
                {analyse.clauses_manquantes.map((c, i) => (
                  <div key={i} className="border border-red-100 rounded-xl p-3 bg-red-50">
                    <div className="flex justify-between items-start mb-1.5">
                      <p className="font-semibold text-sm text-slate-700">{c.clause}</p>
                      <Badge text={c.risque} />
                    </div>
                    <p className="text-xs text-slate-600">{c.recommandation}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {analyse.risques?.length > 0 && (
            <Section title={s.secRisks} icon="⚠️">
              <div className="space-y-3">
                {analyse.risques.map((r, i) => (
                  <div key={i} className="border border-amber-100 rounded-xl p-3 bg-amber-50">
                    <div className="flex justify-between items-start mb-1.5">
                      <p className="font-semibold text-sm text-slate-700">{r.titre}</p>
                      <Badge text={r.niveau} />
                    </div>
                    <p className="text-xs text-slate-600">{r.description}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {analyse.recommandations?.length > 0 && (
            <Section title={s.secReco} icon="💡">
              <div className="space-y-2">
                {analyse.recommandations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-mizan-50/70 rounded-xl">
                    <span className="text-mizan-600 font-bold text-sm">{i + 1}.</span>
                    <p className="text-sm text-slate-700">{rec}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      <HistoryPanel onDownload={downloadFromHistory} />
    </div>
  );
}
