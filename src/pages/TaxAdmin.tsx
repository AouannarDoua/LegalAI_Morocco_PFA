import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, RefreshCw, Check, X, AlertTriangle, Clock, History } from "lucide-react";
import { api, ApiError } from "../services/apiClient";

interface Diff { indicateur: string; actuel: number | string | null; detecte: number | string | null; }
interface TaxUpdate {
  id: number; year: number; status: string; triggered_by: string;
  source: string | null; message: string | null;
  differences: Diff[] | null; created_at: string | null;
}

const STATUS_LABEL: Record<string, { txt: string; cls: string }> = {
  pending:   { txt: "En attente", cls: "bg-amber-100 text-amber-800" },
  approved:  { txt: "Appliqué",   cls: "bg-green-100 text-green-800" },
  rejected:  { txt: "Refusé",     cls: "bg-gray-200 text-gray-700" },
  no_change: { txt: "Aucun changement", cls: "bg-blue-100 text-blue-800" },
  error:     { txt: "Erreur",     cls: "bg-red-100 text-red-700" },
};

export default function TaxAdmin() {
  const [pending, setPending] = useState<TaxUpdate[]>([]);
  const [history, setHistory] = useState<TaxUpdate[]>([]);
  const [last, setLast] = useState<TaxUpdate | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [status, pend, hist] = await Promise.all([
        api.get<{ last_check: TaxUpdate | null; pending_count: number }>("tax/admin/status"),
        api.get<TaxUpdate[]>("tax/admin/pending"),
        api.get<TaxUpdate[]>("tax/admin/history"),
      ]);
      setLast(status.last_check);
      setPending(pend);
      setHistory(hist);
    } catch (e) {
      setMsg({ type: "err", text: e instanceof ApiError ? e.message : "Erreur de chargement" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const checkNow = async () => {
    setChecking(true);
    setMsg(null);
    try {
      const rec = await api.post<TaxUpdate>("tax/admin/check-now", {});
      const s = STATUS_LABEL[rec.status]?.txt ?? rec.status;
      setMsg({ type: "ok", text: `Vérification terminée : ${s}.` });
      await load();
    } catch (e) {
      setMsg({ type: "err", text: e instanceof ApiError ? e.message : "Erreur lors de la vérification" });
    } finally {
      setChecking(false);
    }
  };

  const decide = async (id: number, action: "approve" | "reject") => {
    setMsg(null);
    try {
      await api.post(`tax/admin/${id}/${action}`, {});
      setMsg({ type: "ok", text: action === "approve" ? "Barème validé et appliqué." : "Mise à jour refusée." });
      await load();
    } catch (e) {
      setMsg({ type: "err", text: e instanceof ApiError ? e.message : "Erreur" });
    }
  };

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString("fr-FR") : "—";

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-1">
        <ShieldCheck className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Veille fiscale — Administration</h1>
      </div>
      <p className="text-gray-500 mb-6">
        Détection automatique des changements de barèmes (Loi de Finances). Aucune modification n'est appliquée sans votre validation.
      </p>

      {msg && (
        <div className={`mb-4 rounded-lg px-4 py-2 text-sm ${msg.type === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg.text}
        </div>
      )}

      {/* État + bouton vérifier */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4 text-gray-400" />
          {last ? (
            <span>Dernière vérification : <strong>{fmtDate(last.created_at)}</strong> — {STATUS_LABEL[last.status]?.txt ?? last.status}</span>
          ) : <span>Aucune vérification effectuée pour l'instant.</span>}
        </div>
        <button onClick={checkNow} disabled={checking}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
          {checking ? "Vérification…" : "Vérifier maintenant"}
        </button>
      </div>

      {/* Mises à jour en attente */}
      <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-500" /> Mises à jour en attente ({pending.length})
      </h2>
      {pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-sm text-gray-500 mb-8">
          Aucune mise à jour en attente. Les barèmes en vigueur sont à jour.
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {pending.map((u) => (
            <div key={u.id} className="bg-white rounded-xl border border-amber-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-900">Barème {u.year}</span>
                <span className="text-xs text-gray-400">{fmtDate(u.created_at)} · {u.triggered_by === "auto" ? "auto" : "manuel"}</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{u.message}</p>

              {u.differences && u.differences.length > 0 && (
                <table className="w-full text-sm mb-4">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="py-2">Indicateur</th><th className="py-2">Actuel</th><th className="py-2">Détecté</th>
                    </tr>
                  </thead>
                  <tbody>
                    {u.differences.map((d, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-2 text-gray-700">{d.indicateur}</td>
                        <td className="py-2 text-gray-500">{String(d.actuel)}</td>
                        <td className="py-2 font-semibold text-blue-700">{String(d.detecte)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {u.source && <p className="text-xs text-gray-400 mb-3 break-all">Source : {u.source}</p>}

              <div className="flex gap-2">
                <button onClick={() => decide(u.id, "approve")}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
                  <Check className="w-4 h-4" /> Valider & appliquer
                </button>
                <button onClick={() => decide(u.id, "reject")}
                  className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg">
                  <X className="w-4 h-4" /> Refuser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Historique */}
      <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <History className="w-5 h-5 text-gray-400" /> Historique
      </h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-5 text-sm text-gray-500">Chargement…</div>
        ) : history.length === 0 ? (
          <div className="p-5 text-sm text-gray-500">Aucun historique.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 bg-gray-50 border-b">
                <th className="py-2.5 px-4">Date</th><th className="py-2.5 px-4">Année</th>
                <th className="py-2.5 px-4">Type</th><th className="py-2.5 px-4">Statut</th><th className="py-2.5 px-4">Message</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-b border-gray-100">
                  <td className="py-2.5 px-4 text-gray-600">{fmtDate(h.created_at)}</td>
                  <td className="py-2.5 px-4 text-gray-600">{h.year}</td>
                  <td className="py-2.5 px-4 text-gray-500">{h.triggered_by === "auto" ? "auto" : "manuel"}</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_LABEL[h.status]?.cls ?? "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABEL[h.status]?.txt ?? h.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-gray-500">{h.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}