import { useState, useEffect } from "react";
import { Calculator, TrendingUp, Building2, Receipt, Users, Info, Printer, Calendar, Lightbulb } from "lucide-react";
import { api, ApiError } from "../services/apiClient";
import { useLang } from "../i18n/LanguageContext";

type Mode = "simulateur" | "projection";

interface SimResult {
  meta: { annee: number; loi_finances: string; source: string };
  is: { taux: number; tranche: string; is_calcule: number; cotisation_minimale: number; is_du: number; explication: string };
  tva: { taux: number; tva_collectee: number; explication: string };
  cnss: null | {
    par_employe_mensuel: { salariale: number; patronale: number };
    salariale_annuelle_totale: number; patronale_annuelle_totale: number; total_annuel: number; explication: string;
  };
  ir: null | { rni_annuel_par_employe: number; taux: number; ir_annuel_par_employe: number; ir_annuel_total: number; explication: string };
  totaux: { total_charges_entreprise_annuel: number; note: string };
}
interface Acompte { numero: number; date: string; montant: number; }
interface ProjResult {
  meta: { annee: number; loi_finances: string };
  realise: { mois_ecoules: number; ca_realise: number; benefice_realise: number };
  projection: { facteur: number; ca_projete: number; benefice_projete: number };
  simulation: SimResult;
  is_previsionnel: number;
  acomptes: Acompte[];
  acomptes_note: string;
  ai: { explication: string; conseils: string[] };
}

const SECTEURS = ["Commerce", "Industrie", "Services", "BTP / Construction", "Agriculture", "Technologie / IT", "Autre"];
const fmt = (n: number) => new Intl.NumberFormat("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + " DH";

export default function TaxSimulator() {
  const { t } = useLang();
  const sectorLabel = (s: string) => {
    const v = t("tax.sectorMap." + s);
    return v.includes("tax.sectorMap.") ? s : v;
  };
  const [mode, setMode] = useState<Mode>("simulateur");

  const [years, setYears] = useState<number[]>([2026]);
  const [year, setYear] = useState(2026);

  // Champs communs
  const [secteur, setSecteur] = useState(SECTEURS[0]);
  const [employes, setEmployes] = useState("");
  const [salaire, setSalaire] = useState("");
  const [tauxTva, setTauxTva] = useState(20);
  const [secteurFinancier, setSecteurFinancier] = useState(false);

  // Champs Simulateur
  const [ca, setCa] = useState("");
  const [benefice, setBenefice] = useState("");

  // Champs Projection
  const [mois, setMois] = useState("3");
  const [caRealise, setCaRealise] = useState("");
  const [beneficeRealise, setBeneficeRealise] = useState("");

  const [sim, setSim] = useState<SimResult | null>(null);
  const [proj, setProj] = useState<ProjResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<{ years: string[]; default: number }>("tax/years")
      .then((d) => { setYears(d.years.map((y) => parseInt(y, 10)).sort((a, b) => b - a)); setYear(d.default); })
      .catch(() => {});
  }, []);

  const switchMode = (m: Mode) => { setMode(m); setSim(null); setProj(null); setError(null); };

  const handleSubmit = async () => {
    setError(null); setSim(null); setProj(null); setLoading(true);
    try {
      if (mode === "simulateur") {
        const data = await api.post<SimResult>("tax/simulate", {
          year,
          chiffre_affaires: parseFloat(ca) || 0,
          benefice_net: parseFloat(benefice) || 0,
          secteur,
          nombre_employes: parseInt(employes, 10) || 0,
          salaire_brut_mensuel: parseFloat(salaire) || 0,
          taux_tva: tauxTva,
          secteur_financier: secteurFinancier,
        });
        setSim(data);
      } else {
        const data = await api.post<ProjResult>("tax/project", {
          year,
          mois_ecoules: parseInt(mois, 10) || 0,
          ca_realise: parseFloat(caRealise) || 0,
          benefice_realise: parseFloat(beneficeRealise) || 0,
          secteur,
          nombre_employes: parseInt(employes, 10) || 0,
          salaire_brut_mensuel: parseFloat(salaire) || 0,
          taux_tva: tauxTva,
          secteur_financier: secteurFinancier,
        });
        setProj(data);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("tax.errCompute"));
    } finally {
      setLoading(false);
    }
  };

  const tabBtn = (m: Mode, icon: React.ReactNode, label: string) => (
    <button onClick={() => switchMode(m)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
        mode === m ? "bg-mizan-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
      {icon} {label}
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-1">
        <Calculator className="w-7 h-7 text-mizan-600" />
        <h1 className="text-2xl font-bold text-gray-900">{t("tax.title")}</h1>
      </div>
      <p className="text-gray-500 mb-5">{t("tax.subtitle")}</p>

      {/* Bascule de mode */}
      <div className="flex gap-2 mb-5">
        {tabBtn("simulateur", <Calculator className="w-4 h-4" />, t("tax.tabSim"))}
        {tabBtn("projection", <TrendingUp className="w-4 h-4" />, t("tax.tabProj"))}
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Commun */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("tax.year")}</label>
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-mizan-500 outline-none">
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("tax.sector")}</label>
            <select value={secteur} onChange={(e) => setSecteur(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-mizan-500 outline-none">
              {SECTEURS.map((s) => <option key={s} value={s}>{sectorLabel(s)}</option>)}
            </select>
          </div>

          {/* Champs spécifiques au mode */}
          {mode === "simulateur" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("tax.caAnnual")}</label>
                <input type="number" min="0" value={ca} onChange={(e) => setCa(e.target.value)} placeholder="ex : 2 000 000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-mizan-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("tax.profitAnnual")}</label>
                <input type="number" min="0" value={benefice} onChange={(e) => setBenefice(e.target.value)} placeholder="ex : 400 000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-mizan-500 outline-none" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("tax.monthsElapsed")}</label>
                <input type="number" min="1" max="12" value={mois} onChange={(e) => setMois(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-mizan-500 outline-none" />
              </div>
              <div className="hidden md:block" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("tax.caPeriod")}</label>
                <input type="number" min="0" value={caRealise} onChange={(e) => setCaRealise(e.target.value)} placeholder="ex : 500 000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-mizan-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("tax.profitPeriod")}</label>
                <input type="number" min="0" value={beneficeRealise} onChange={(e) => setBeneficeRealise(e.target.value)} placeholder="ex : 100 000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-mizan-500 outline-none" />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("tax.employees")}</label>
            <input type="number" min="0" value={employes} onChange={(e) => setEmployes(e.target.value)} placeholder="ex : 5"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-mizan-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("tax.avgSalary")}</label>
            <input type="number" min="0" value={salaire} onChange={(e) => setSalaire(e.target.value)} placeholder="ex : 6 000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-mizan-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("tax.tvaRate")}</label>
            <select value={tauxTva} onChange={(e) => setTauxTva(parseInt(e.target.value, 10))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-mizan-500 outline-none">
              {[20, 14, 10, 7].map((t) => <option key={t} value={t}>{t}%</option>)}
            </select>
          </div>
          <div className="flex items-center mt-7">
            <input id="fin" type="checkbox" checked={secteurFinancier} onChange={(e) => setSecteurFinancier(e.target.checked)} className="w-4 h-4 mr-2" />
            <label htmlFor="fin" className="text-sm text-gray-700">{t("tax.financial")}</label>
          </div>
        </div>

        {error && <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>}

        <button onClick={handleSubmit} disabled={loading}
          className="mt-5 w-full md:w-auto bg-mizan-600 hover:bg-mizan-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition">
          {loading ? t("tax.computing") : mode === "simulateur" ? t("tax.compute") : t("tax.project")}
        </button>
      </div>

      {/* ─── Résultats SIMULATEUR ─── */}
      {sim && (
        <div className="mt-6 space-y-4 print:mt-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">{t("tax.basedOn")} <strong>{sim.meta.loi_finances}</strong></div>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 text-sm text-mizan-600 hover:text-mizan-800 print:hidden">
              <Printer className="w-4 h-4" /> {t("tax.print")}
            </button>
          </div>

          <Card icon={<Building2 className="w-5 h-5 text-mizan-600" />} title={t("tax.isTitle")} value={fmt(sim.is.is_du)}>
            <Row label={t("tax.isRate")} value={`${sim.is.taux} %`} />
            <Row label={t("tax.isCalc")} value={fmt(sim.is.is_calcule)} />
            <Row label={t("tax.isMin")} value={fmt(sim.is.cotisation_minimale)} />
            <Row label={t("tax.isDue")} value={fmt(sim.is.is_du)} strong />
            <Explain text={sim.is.explication} />
          </Card>

          <Card icon={<Receipt className="w-5 h-5 text-mizan-600" />} title={t("tax.tvaTitle")} value={fmt(sim.tva.tva_collectee)}>
            <Row label={t("tax.tvaRateRow")} value={`${sim.tva.taux} %`} />
            <Row label={t("tax.tvaCollected")} value={fmt(sim.tva.tva_collectee)} strong />
            <Explain text={sim.tva.explication} />
          </Card>

          {sim.cnss && (
            <Card icon={<Users className="w-5 h-5 text-mizan-600" />} title={t("tax.cnssTitle")} value={fmt(sim.cnss.total_annuel)}>
              <Row label={t("tax.cnssEmployer")} value={fmt(sim.cnss.patronale_annuelle_totale)} strong />
              <Row label={t("tax.cnssEmployee")} value={fmt(sim.cnss.salariale_annuelle_totale)} />
              <Row label={t("tax.cnssTotal")} value={fmt(sim.cnss.total_annuel)} />
              <Explain text={sim.cnss.explication} />
            </Card>
          )}

          {sim.ir && (
            <Card icon={<Receipt className="w-5 h-5 text-mizan-600" />} title={t("tax.irTitle")} value={fmt(sim.ir.ir_annuel_total)}>
              <Row label={t("tax.irRni")} value={fmt(sim.ir.rni_annuel_par_employe)} />
              <Row label={t("tax.irRate")} value={`${sim.ir.taux} %`} />
              <Row label={t("tax.irTotal")} value={fmt(sim.ir.ir_annuel_total)} strong />
              <Explain text={sim.ir.explication} />
            </Card>
          )}

          <div className="bg-mizan-600 text-white rounded-xl p-5">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{t("tax.totalTitle")}</span>
              <span className="text-xl font-bold">{fmt(sim.totaux.total_charges_entreprise_annuel)}</span>
            </div>
            <p className="text-mizan-100 text-xs mt-2">{sim.totaux.note}</p>
          </div>
        </div>
      )}

      {/* ─── Résultats PROJECTION ─── */}
      {proj && (
        <div className="mt-6 space-y-4 print:mt-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">{t("tax.projOn")} (× {proj.projection.facteur}) · {proj.meta.loi_finances}</div>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 text-sm text-mizan-600 hover:text-mizan-800 print:hidden">
              <Printer className="w-4 h-4" /> {t("tax.print")}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-3">{t("tax.realised")} ({proj.realise.mois_ecoules} {t("tax.months")})</h2>
              <Row label={t("tax.ca")} value={fmt(proj.realise.ca_realise)} />
              <Row label={t("tax.profit")} value={fmt(proj.realise.benefice_realise)} />
            </div>
            <div className="bg-white rounded-xl border border-mizan-200 p-5 shadow-sm">
              <h2 className="font-semibold text-mizan-900 mb-3">{t("tax.projected")}</h2>
              <Row label={t("tax.ca")} value={fmt(proj.projection.ca_projete)} />
              <Row label={t("tax.profit")} value={fmt(proj.projection.benefice_projete)} strong />
            </div>
          </div>

          <div className="bg-mizan-600 text-white rounded-xl p-5">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{t("tax.isForecast")}</span>
              <span className="text-xl font-bold">{fmt(proj.is_previsionnel)}</span>
            </div>
            <p className="text-mizan-100 text-xs mt-2">
              {t("tax.estCharges")} {fmt(proj.simulation.totaux.total_charges_entreprise_annuel)}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3"><Calendar className="w-5 h-5 text-mizan-600" />
              <h2 className="font-semibold text-gray-900">{t("tax.acomptesTitle")}</h2></div>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 border-b">
                <th className="py-2">{t("tax.acompte")}</th><th className="py-2">{t("tax.dueDate")}</th><th className="py-2 text-right">{t("tax.amount")}</th></tr></thead>
              <tbody>
                {proj.acomptes.map((a) => (
                  <tr key={a.numero} className="border-b border-gray-100">
                    <td className="py-2 text-gray-700">{t("tax.acompte")} {a.numero}</td>
                    <td className="py-2 text-gray-600">{a.date}</td>
                    <td className="py-2 text-right font-semibold text-gray-900">{fmt(a.montant)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex gap-2 bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
              <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" /><span>{proj.acomptes_note}</span>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
            <div className="flex items-center gap-2 mb-2"><Lightbulb className="w-5 h-5 text-amber-600" />
              <h2 className="font-semibold text-amber-900">{t("tax.adviceTitle")}</h2></div>
            <p className="text-sm text-amber-900 mb-3">{proj.ai.explication}</p>
            <ul className="space-y-1.5">
              {proj.ai.conseils.map((c, i) => (
                <li key={i} className="flex gap-2 text-sm text-amber-900"><span className="text-amber-500">•</span><span>{c}</span></li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ icon, title, value, children }: { icon: React.ReactNode; title: string; value: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">{icon}<h2 className="font-semibold text-gray-900">{title}</h2></div>
        <span className="font-bold text-gray-900">{value}</span>
      </div>
      {children}
    </div>
  );
}
function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between py-1.5 text-sm border-b border-gray-100 last:border-0 ${strong ? "font-semibold text-gray-900" : "text-gray-600"}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
function Explain({ text }: { text: string }) {
  return (
    <div className="mt-3 flex gap-2 bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
      <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" /><span>{text}</span>
    </div>
  );
}