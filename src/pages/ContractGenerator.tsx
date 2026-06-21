import { useState, useEffect, useMemo } from "react";
import { Search, FileText, Star, ListChecks, ChevronRight, AlertCircle, Download, Loader2, X, Pencil, Save } from "lucide-react";
import contractService, {
  type ContractTypeInfo,
  type ContractField,
} from "../services/contractService";
import { BASE_URL, tokenStorage, ApiError } from "../services/apiClient";
import { useLang } from "../i18n/LanguageContext";

/* ────────────────────────────────────────────────────────────────────────────
 * ContractGenerator — FORMULAIRE DYNAMIQUE PAR TYPE DE CONTRAT
 * Réplique exacte de la logique du script v12 (test.py) :
 *   1. On charge les 20 types depuis GET /contracts/types
 *      (chaque type a ses champs: name / label arabe / type / required / default)
 *   2. L'utilisateur cherche & choisit un TYPE de contrat
 *   3. On affiche un formulaire dynamique = display_form_by_contract_type()
 *        ⭐ champs obligatoires   (validation: non vide, number=chiffres, date valide)
 *        📋 champs optionnels
 *      + cohérence des dates (date_debut <= date_fin)
 *   4. On génère via POST /contracts/generate puis on affiche le PDF arabe (RTL)
 * ──────────────────────────────────────────────────────────────────────────── */

type Step = "search" | "form" | "generating" | "result";

// dd/mm/yyyy  ->  yyyy-mm-dd  (pour <input type="date">)
function toInputDate(ddmmyyyy?: string): string {
  if (!ddmmyyyy) return "";
  const m = ddmmyyyy.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return "";
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

// yyyy-mm-dd  ->  dd/mm/yyyy  (format canonique attendu par le backend / le prompt)
function fromInputDate(yyyymmdd: string): string {
  if (!yyyymmdd) return "";
  const m = yyyymmdd.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return yyyymmdd;
  const [, y, mo, d] = m;
  return `${d.padStart(2, "0")}/${mo.padStart(2, "0")}/${y}`;
}

// dd/mm/yyyy -> Date (pour comparer date_debut / date_fin)
function parseDdmmyyyy(s?: string): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const dt = new Date(Number(y), Number(mo) - 1, Number(d));
  return isNaN(dt.getTime()) ? null : dt;
}

// Équivalences FR/EN → arabe (recherche bilingue, comme l'ancienne page)
const SEARCH_ALIASES: Record<string, string[]> = {
  bail: ["كراء", "إيجار"], location: ["كراء", "إيجار"], loyer: ["كراء"], rent: ["كراء"],
  travail: ["عمل", "شغل"], emploi: ["عمل", "شغل"], employe: ["عمل", "أجير"],
  cdi: ["عمل"], cdd: ["عمل"], salarie: ["عمل", "أجير"],
  vente: ["بيع"], achat: ["بيع", "شراء"], acheter: ["شراء"],
  societe: ["شركة", "تأسيس"], sarl: ["شركة", "ش.م.م", "مسؤولية", "SARL"], entreprise: ["شركة"],
  statuts: ["نظام أساسي", "شركة"],
  procuration: ["وكالة", "توكيل"], mandat: ["وكالة"], agence: ["وكالة"],
  resiliation: ["فسخ", "إنهاء"], rupture: ["فسخ", "إنهاء"],
  attestation: ["تصريح", "شهادة"], declaration: ["تصريح"], hebergement: ["سكن", "إيواء"],
  service: ["خدمات"], services: ["خدمات"], prestation: ["خدمات"],
  partenariat: ["شراكة"], partenaire: ["شراكة"],
  distribution: ["توزيع"], distributeur: ["توزيع"],
  transport: ["نقل", "بضائع"], marchandise: ["نقل", "بضائع"],
  financement: ["تمويل", "قرض"], credit: ["قرض", "تمويل"], pret: ["قرض"],
  confidentialite: ["سرية"], nda: ["سرية"], secret: ["سرية"],
  import: ["تجارة", "استيراد"], export: ["تجارة", "تصدير"], international: ["دولية"],
  construction: ["مقاولة", "بناء"], travaux: ["مقاولة", "أشغال"],
  mise: ["إنذار"], demeure: ["إنذار"],
  etat: ["بيان", "معاينة"], lieux: ["بيان", "معاينة"],
};

export default function ContractGenerator() {
  const { t } = useLang();
  const [types,    setTypes]    = useState<ContractTypeInfo[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [step,     setStep]     = useState<Step>("search");
  const [selected, setSelected] = useState<ContractTypeInfo | null>(null);
  const [search,   setSearch]   = useState("");
  const [details,  setDetails]  = useState<Record<string, string>>({});
  const [error,    setError]    = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [pdfUrl,       setPdfUrl]       = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("contrat.pdf");

  // Édition du contrat généré (mode avocat)
  const [generated,   setGenerated]   = useState<any | null>(null); // contrat {id, content, title}
  const [editing,     setEditing]     = useState(false);
  const [editedText,  setEditedText]  = useState("");
  const [saving,      setSaving]      = useState(false);

  // 1) Charger les 20 types (avec leurs champs)
  useEffect(() => {
    let alive = true;
    contractService
      .types()
      .then((data) => {
        if (!alive) return;
        setTypes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        if (!alive) return;
        console.error("Erreur chargement des types:", err);
        setError(t("gen.loadError"));
        setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  // Recherche bilingue sur le nom arabe du type
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return types;
    const aliases = SEARCH_ALIASES[q] || SEARCH_ALIASES[q.replace(/s$/, "")] || [];
    return types.filter((t) => {
      const name = t.name.toLowerCase();
      if (name.includes(q)) return true;
      return aliases.some((a) => t.name.includes(a));
    });
  }, [types, search]);

  // Champs obligatoires / optionnels (exactement comme display_form_by_contract_type)
  const requiredFields = selected?.fields.filter((f) => f.required) ?? [];
  const optionalFields = selected?.fields.filter((f) => !f.required) ?? [];

  function chooseType(t: ContractTypeInfo) {
    // pré-remplir les valeurs par défaut (ex: date_contrat = aujourd'hui)
    const init: Record<string, string> = {};
    t.fields.forEach((f) => { if (f.default) init[f.name] = f.default; });
    setSelected(t);
    setDetails(init);
    setFieldErrors({});
    setError(null);
    setStep("form");
  }

  function setField(field: ContractField, raw: string) {
    let value = raw;
    if (field.type === "number") {
      // chiffres uniquement (comme re.sub(r'[^\d]', '', value))
      value = raw.replace(/[^\d]/g, "");
    } else if (field.type === "date") {
      // l'input renvoie yyyy-mm-dd, on stocke en dd/mm/yyyy
      value = fromInputDate(raw);
    }
    setDetails((d) => ({ ...d, [field.name]: value }));
    if (fieldErrors[field.name]) {
      setFieldErrors((e) => { const n = { ...e }; delete n[field.name]; return n; });
    }
  }

  // Validation client = required non vide + cohérence des dates
  function validate(): boolean {
    const errs: Record<string, string> = {};
    requiredFields.forEach((f) => {
      const v = (details[f.name] || "").trim();
      if (!v) errs[f.name] = t("gen.requiredField");
    });
    const debut = parseDdmmyyyy(details["date_debut"]);
    const fin   = parseDdmmyyyy(details["date_fin"]);
    if (debut && fin && debut > fin) {
      errs["date_fin"] = t("gen.dateError");
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleGenerate() {
    if (!selected) return;
    setError(null);
    if (!validate()) {
      setError(t("gen.fixFields"));
      return;
    }
    setStep("generating");
    try {
      const result = await contractService.generate({
        contract_type: selected.name,   // on envoie le NOM ARABE du type (clé exacte)
        details,
      });
      const fileName = (result as any)?.file_name;
      if (!fileName) throw new Error("Nom de fichier manquant dans la réponse");

      setGenerated(result);                          // {id, content, title, file_name}
      setEditedText((result as any)?.content || "");
      await loadPdf(fileName);
      setStep("result");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("gen.genError"));
      setStep("form");
    }
  }

  // Récupère le PDF (avec JWT) et l'affiche en aperçu
  async function loadPdf(fileName: string) {
    const token = tokenStorage.get();
    const resp = await fetch(`${BASE_URL}/contracts/download/${fileName}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!resp.ok) throw new Error("Téléchargement du document échoué");
    const blob = await resp.blob();
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(URL.createObjectURL(blob));
    setDownloadName(fileName);
  }

  // Enregistre le texte édité par l'avocat → régénère le PDF
  async function handleSaveEdit() {
    if (!generated?.id) return;
    if (editedText.trim().length < 30) {
      setError(t("gen.tooShort"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await contractService.rerender(generated.id, editedText, generated.title);
      const fileName = (updated as any)?.file_name;
      if (!fileName) throw new Error("PDF non régénéré");
      setGenerated(updated);
      await loadPdf(fileName);
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("gen.saveError"));
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setSelected(null);
    setSearch("");
    setDetails({});
    setFieldErrors({});
    setError(null);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setGenerated(null);
    setEditing(false);
    setEditedText("");
    setStep("search");
  }

  /* ── Loading ─────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <Loader2 className="w-12 h-12 text-mizan-600 animate-spin" />
        <p className="text-gray-500 animate-pulse">{t("gen.loading")}</p>
      </div>
    );
  }

  /* ── Generating ──────────────────────────────────────────────────────── */
  if (step === "generating") {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6">
        <div className="relative w-20 h-20">
          <div className="w-20 h-20 border-4 border-mizan-100 rounded-full" />
          <div className="w-20 h-20 border-4 border-mizan-600 border-t-transparent rounded-full animate-spin absolute top-0" />
        </div>
        <p className="text-xl font-bold text-gray-800">{t("gen.generating")}</p>
        <p className="text-sm text-gray-400">{t("gen.generatingSub")}</p>
      </div>
    );
  }

  /* ── Result ──────────────────────────────────────────────────────────── */
  if (step === "result") {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-mizan-900 font-ar" dir="rtl">{selected?.name}</h1>
            <p className="text-sm text-gray-500">
              {editing ? t("gen.editMode") : t("gen.success")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {!editing && (
              <button onClick={() => { setEditedText((generated as any)?.content || editedText); setEditing(true); }}
                className="flex items-center gap-2 px-5 py-2 bg-gold-100 text-gold-700 hover:bg-gold-200 rounded-xl transition font-bold">
                <Pencil className="w-4 h-4" /> {t("gen.editText")}
              </button>
            )}
            <button onClick={() => setStep("form")}
              className="px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition font-medium">
              {t("gen.editData")}
            </button>
            <button onClick={reset}
              className="px-5 py-2 bg-mizan-600 text-white rounded-xl font-bold hover:bg-mizan-700 transition shadow-lg">
              {t("gen.newContract")}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 border-l-4 border-red-500 rounded-r-xl flex justify-between items-center">
            <span className="flex items-center gap-2"><AlertCircle className="w-5 h-5" />{error}</span>
            <button onClick={() => setError(null)}><X className="w-5 h-5" /></button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 border-2 border-gray-100 rounded-3xl overflow-hidden h-[750px] bg-white shadow-2xl">
            {editing ? (
              <textarea
                dir="rtl"
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full h-full p-6 outline-none resize-none font-ar text-[15px] leading-8 text-ink"
                placeholder="نص العقد…"
                spellCheck={false}
              />
            ) : pdfUrl ? (
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                width="100%" height="100%" title={t("genx.pdfTitle")} className="border-none" />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">{t("genx.previewPrep")}</div>
            )}
          </div>

          <div className="space-y-4">
            {editing ? (
              <div className="bg-gold-50 p-6 rounded-3xl border border-gold-200 shadow-sm">
                <Pencil className="w-8 h-8 text-gold-600 mb-2" />
                <h3 className="font-bold text-gold-700 mb-2">{t("gen.editTitle")}</h3>
                <p className="text-sm text-gray-600 mb-6">
                  {t("gen.editHelp")}
                </p>
                <button onClick={handleSaveEdit} disabled={saving}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-mizan-600 text-white rounded-2xl font-bold shadow-lg hover:bg-mizan-700 transition disabled:opacity-60">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {saving ? t("gen.saving") : t("gen.save")}
                </button>
                <button onClick={() => { setEditing(false); setError(null); setEditedText((generated as any)?.content || ""); }}
                  disabled={saving}
                  className="w-full mt-2 py-2 text-sm text-gray-500 font-bold hover:text-red-400 transition">
                  {t("gen.cancelEdit")}
                </button>
              </div>
            ) : (
              <div className="bg-mizan-50 p-6 rounded-3xl border border-mizan-100 shadow-sm">
                <FileText className="w-8 h-8 text-mizan-600 mb-2" />
                <h3 className="font-bold text-mizan-900 mb-2">{t("gen.ready")}</h3>
                <p className="text-sm text-mizan-700 mb-6">
                  {t("gen.readyHelp")}
                </p>
                <a href={pdfUrl || "#"} download={downloadName} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full text-center py-4 bg-mizan-600 text-white rounded-2xl font-bold shadow-lg hover:bg-mizan-700 transition hover:-translate-y-1">
                  <Download className="w-5 h-5" /> {t("gen.download")}
                </a>
              </div>
            )}

            {!editing && selected && selected.clauses.length > 0 && (
              <div className="bg-mizan-50 p-6 rounded-3xl border border-mizan-100">
                <h3 className="font-bold text-mizan-900 mb-3 flex items-center gap-2">
                  <ListChecks className="w-5 h-5" /> {selected.clauses.length} {t("gen.clausesIncluded")}
                </h3>
                <ul className="space-y-1 text-sm text-mizan-800 font-ar" dir="rtl">
                  {selected.clauses.map((c, i) => <li key={i}>• {c}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Search + Form ───────────────────────────────────────────────────── */
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2 text-gray-900 tracking-tight">{t("gen.title")}</h1>
        <p className="text-gray-500 text-lg">{t("gen.subtitle")}</p>
        <p className="text-xs text-gray-400 mt-1">{types.length} {t("gen.available")}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border-l-4 border-red-500 rounded-r-xl flex justify-between items-center">
          <span className="flex items-center gap-2"><AlertCircle className="w-5 h-5" />{error}</span>
          <button onClick={() => setError(null)}><X className="w-5 h-5" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* ÉTAPE 1 — choix du TYPE */}
        <div className="lg:col-span-2 space-y-4">
          <label className="block font-black text-mizan-600 uppercase tracking-widest text-xs">
            {t("gen.step1")}
          </label>
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-2xl shadow-sm outline-none focus:border-mizan-500 focus:ring-4 focus:ring-mizan-50 transition-all bg-white"
              placeholder={t("gen.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {filtered.length === 0 && (
              <p className="text-gray-400 text-center italic text-sm py-6">{t("gen.noType")}</p>
            )}
            {filtered.map((ct) => {
              const isSel = selected?.name === ct.name;
              return (
                <button
                  key={ct.name}
                  onClick={() => chooseType(ct)}
                  className={`w-full text-right p-4 rounded-2xl border-2 transition group flex items-center justify-between gap-3
                    ${isSel ? "border-mizan-500 bg-mizan-50" : "border-gray-100 hover:border-mizan-200 hover:bg-mizan-50/40 bg-white"}`}
                >
                  <ChevronRight className={`w-5 h-5 shrink-0 ${isSel ? "text-mizan-600" : "text-gray-300 group-hover:text-mizan-400"}`} />
                  <div className="flex-1 font-ar" dir="rtl">
                    <div className={`font-bold ${isSel ? "text-mizan-700" : "text-gray-800"}`}>{ct.name}</div>
                    <div className="text-xs text-mizan-400">
                      {ct.fields.length} {t("gen.fields")} · {ct.clauses.length} {t("gen.clauses")}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ÉTAPE 2 — FORMULAIRE DYNAMIQUE */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl p-12 min-h-[400px]">
              <FileText className="w-12 h-12 mb-3 text-gray-300" />
              <p className="font-medium">{t("gen.selectLeft")}</p>
              <p className="text-sm">{t("gen.formHere")}</p>
            </div>
          ) : (
            <div className="bg-white p-8 border-2 border-gray-50 rounded-[32px] shadow-xl shadow-gray-100 space-y-8">
              <div>
                <label className="block font-black text-mizan-600 uppercase tracking-widest text-xs mb-1">
                  {t("gen.step2")}
                </label>
                <h2 className="text-xl font-bold text-ink font-ar" dir="rtl">{selected.name}</h2>
              </div>

              {/* ⭐ Champs obligatoires */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-gold-600 font-bold text-sm">
                  <Star className="w-4 h-4 fill-gold-500 text-gold-500" />
                  {t("gen.required")}
                </div>
                {requiredFields.map((f) => (
                  <FieldInput key={f.name} field={f} value={details[f.name] || ""}
                    error={fieldErrors[f.name]} onChange={(v) => setField(f, v)} />
                ))}
              </div>

              {/* 📋 Champs optionnels */}
              {optionalFields.length > 0 && (
                <div className="space-y-5 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 font-bold text-sm">
                    <ListChecks className="w-4 h-4" />
                    {t("gen.optional")}
                  </div>
                  {optionalFields.map((f) => (
                    <FieldInput key={f.name} field={f} value={details[f.name] || ""}
                      error={fieldErrors[f.name]} onChange={(v) => setField(f, v)} />
                  ))}
                </div>
              )}

              <div className="space-y-3 pt-2">
                <button onClick={handleGenerate}
                  className="w-full py-5 bg-mizan-600 hover:bg-mizan-700 text-white font-black rounded-2xl shadow-xl shadow-mizan-100 transition-all active:scale-95">
                  {t("gen.generate")}
                </button>
                <button onClick={reset}
                  className="w-full text-xs text-gray-400 font-bold py-2 hover:text-red-400 transition">
                  {t("gen.cancelType")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Champ de formulaire : text / number / date, avec label arabe (RTL) ──── */
function FieldInput({
  field, value, error, onChange,
}: {
  field: ContractField;
  value: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  const base =
    "w-full p-4 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-mizan-100 outline-none transition-all text-sm " +
    (error ? "border-red-300 ring-2 ring-red-100" : "border-gray-100");

  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2 font-ar" dir="rtl">
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
      </label>

      {field.type === "date" ? (
        <input type="date" className={base} value={toInputDate(value)}
          onChange={(e) => onChange(e.target.value)} />
      ) : field.type === "number" ? (
        <input type="text" inputMode="numeric" dir="rtl" className={base} value={value}
          placeholder="0" onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type="text" dir="rtl" className={base} value={value}
          placeholder={field.label} onChange={(e) => onChange(e.target.value)} />
      )}

      {error && <p className="text-xs text-red-500 mt-1" dir="rtl">{error}</p>}
    </div>
  );
}