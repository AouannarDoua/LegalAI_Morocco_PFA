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

interface LanguageContextValue {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (path: string) => any;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "mizan.lang.v3";

const dict: Record<Lang, any> = {
  fr: { ...(translations.fr as any), ...(extra.fr as any), ...(extra2.fr as any) },
  ar: { ...(translations.ar as any), ...(extra.ar as any), ...(extra2.ar as any) },
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
