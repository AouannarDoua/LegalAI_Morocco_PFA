import { useState } from "react";
import { useApi, useMutation } from "../hooks/useApi";
import { documentService, type Document } from "../services/index";
import { useLang } from "../i18n/LanguageContext";

export default function Documents() {
  const { t, lang } = useLang();
  const [page, setPage]         = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle]       = useState("");
  const [docType, setDocType]   = useState("");
  const [error, setError]       = useState<string | null>(null);

  const { data, isLoading, refetch } = useApi(
    () => documentService.list(page),
    [page]
  );

  const { mutate: createDoc, isLoading: creating } = useMutation(
    documentService.create,
    {
      onSuccess: () => {
        setShowForm(false);
        setTitle("");
        setDocType("");
        refetch();
      },
      onError: (e) => setError(e),
    }
  );

  const { mutate: deleteDoc } = useMutation(documentService.delete, {
    onSuccess: refetch,
  });

  const handleCreate = () => {
    setError(null);
    if (!title.trim()) {
      setError(t("common.required"));
      return;
    }
    createDoc({ title: title.trim(), doc_type: docType || undefined });
  };

  const docs: Document[] = data?.items ?? [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("docs.title")}</h1>
          {data && (
            <p className="text-sm text-gray-500 mt-0.5">
              {data.total} {data.total !== 1 ? t("docs.count_other") : t("docs.count_one")}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-mizan-600 hover:bg-mizan-700 text-white text-sm font-semibold rounded-lg transition"
        >
          {showForm ? t("common.cancel") : t("docs.new")}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
          <h2 className="font-semibold text-gray-800 text-sm">{t("docs.newTitle")}</h2>
          {error && (
            <p className="text-red-600 text-xs">{error}</p>
          )}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("docs.placeholder")}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-mizan-500 outline-none"
          />
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-mizan-500 outline-none"
          >
            <option value="">{t("docs.typeOptional")}</option>
            <option value="identite">{t("docs.tIdentity")}</option>
            <option value="contrat">{t("docs.tContract")}</option>
            <option value="jugement">{t("docs.tJudgment")}</option>
            <option value="attestation">{t("docs.tAttestation")}</option>
            <option value="autre">{t("docs.tOther")}</option>
          </select>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="px-5 py-2 bg-mizan-600 hover:bg-mizan-700 disabled:bg-mizan-400 text-white text-sm font-semibold rounded-lg transition"
          >
            {creating ? t("common.creating") : t("common.create")}
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && docs.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📁</div>
          <p className="font-medium text-gray-600">{t("docs.empty")}</p>
          <p className="text-sm mt-1">{t("docs.emptyHint")}</p>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {docs.map((doc) => (
          <div
            key={doc.id}
            className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:border-gray-300 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-mizan-50 rounded-lg flex items-center justify-center text-lg">
                📄
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{doc.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {doc.doc_type && (
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mr-2">
                      {(() => { const v = t("docTypeMap." + doc.doc_type); return v.includes("docTypeMap.") ? doc.doc_type : v; })()}
                    </span>
                  )}
                  {new Date(doc.created_at).toLocaleDateString(lang === "ar" ? "ar-MA" : "fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm(t("docs.confirmDelete"))) deleteDoc(doc.id);
              }}
              className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
            >
              {t("common.delete")}
            </button>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!data.has_prev}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
          >
            {t("common.prev")}
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">
            {t("common.page")} {data.page} / {data.pages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data.has_next}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
          >
            {t("common.next")}
          </button>
        </div>
      )}
    </div>
  );
}
