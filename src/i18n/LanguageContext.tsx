import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { translations, type Lang } from "./translations";
import { extra } from "./extra";
import { extra2 } from "./extra2";
import { extra3 } from "./extra3";
import { extra4 } from "./extra4";

interface LanguageContextValue {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (path: string) => any;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "mizan.lang.v3";

// Fusion PROFONDE : plusieurs fichiers définissent le même espace de noms
// (ex. `common` existe dans translations.ts ET dans extra3.ts). Un simple
// spread {...a, ...b} écraserait tout l'objet `common` au lieu de fusionner
// ses clés — c'est ce qui faisait disparaître common.login / common.langName.
function isObject(v: any): boolean {
  return v != null && typeof v === "object" && !Array.isArray(v);
}
function deepMerge(target: any, source: any): any {
  const out: any = { ...target };
  for (const key of Object.keys(source)) {
    if (isObject(out[key]) && isObject(source[key])) {
      out[key] = deepMerge(out[key], source[key]);
    } else {
      out[key] = source[key];
    }
  }
  return out;
}
function buildDict(lang: Lang): any {
  return [translations, extra, extra2, extra3, extra4].reduce(
    (acc, mod) => deepMerge(acc, (mod as any)[lang] ?? {}),
    {} as any
  );
}

const dict: Record<Lang, any> = {
  fr: buildDict("fr"),
  ar: buildDict("ar"),
};

function resolve(obj: any, path: string): any {
  return path.split(".").reduce((acc, k) => (acc == null ? undefined : acc[k]), obj);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = (typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY)) as Lang | null;
    // 👉 Par défaut : ARABE
    return saved === "ar" || saved === "fr" ? saved : "ar";
  });

  const dir: "ltr" | "rtl" = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = dir;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
  }, [lang, dir]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggleLang = useCallback(() => setLangState((p) => (p === "fr" ? "ar" : "fr")), []);

  const t = useCallback(
    (path: string) => {
      const val = resolve(dict[lang], path);
      if (val !== undefined) return val;
      return resolve(dict.fr, path) ?? path;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, dir, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang doit être utilisé dans <LanguageProvider>");
  return ctx;
}
