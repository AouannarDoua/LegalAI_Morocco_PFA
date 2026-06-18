import { Languages } from "lucide-react";
import { useLang } from "../i18n/LanguageContext";

export default function LanguageToggle({
  className = "",
}: {
  className?: string;
}) {
  const { toggleLang, t } = useLang();
  return (
    <button
      onClick={toggleLang}
      aria-label="Changer de langue / تغيير اللغة"
      className={
        "inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:border-mizan-600 hover:text-mizan-600 " +
        className
      }
    >
      <Languages className="h-4 w-4" />
      {t("common.langName")}
    </button>
  );
}
