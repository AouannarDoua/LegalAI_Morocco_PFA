import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check, ArrowLeft } from "lucide-react";
import { useLang } from "../i18n/LanguageContext";
import LanguageToggle from "./LanguageToggle";

function ZellijStar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.4">
        <polygon points="100,12 122,78 188,100 122,122 100,188 78,122 12,100 78,78" />
        <polygon points="100,32 116,84 168,100 116,116 100,168 84,116 32,100 84,84" />
        <circle cx="100" cy="100" r="84" />
      </g>
    </svg>
  );
}

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** petit pictogramme/emoji au-dessus du titre (états succès, etc.) */
  icon?: ReactNode;
  /** centrer le contenu (pages de statut) */
  centered?: boolean;
}

export default function AuthShell({ title, subtitle, children, icon, centered }: AuthShellProps) {
  const { t } = useLang();
  const bullets: string[] = t("auth.brandBullets");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ── Panneau de marque (zellige) ── */}
      <aside className="brand-panel hidden flex-col justify-between p-12 lg:flex">
        <div className="zellij-bg-light pointer-events-none absolute inset-0" />
        <ZellijStar className="pointer-events-none absolute -bottom-16 -end-16 h-80 w-80 text-gold opacity-40" />

        <Link to="/" className="relative flex items-center gap-3">
          <svg width="40" height="40" viewBox="0 0 40 40">
            <g fill="none" stroke="#E7D9B4" strokeWidth="2.2" strokeLinejoin="round">
              <polygon points="20,3 24.5,15.5 37,20 24.5,24.5 20,37 15.5,24.5 3,20 15.5,15.5" />
              <polygon points="20,8 23,17 32,20 23,23 20,32 17,23 8,20 17,17" />
            </g>
            <circle cx="20" cy="20" r="2.4" fill="#C1272D" />
          </svg>
          <span className="leading-none">
            <span className="font-display text-2xl font-semibold text-white">
              Miz<span className="text-gold">an</span>
            </span>
            <span className="block font-ar text-sm font-semibold text-gold-soft">ميزان</span>
          </span>
        </Link>

        <div className="relative">
          <h2 className="font-display text-3xl font-semibold leading-snug text-white">
            {t("auth.brandTagline")}
          </h2>
          <ul className="mt-7 space-y-3.5">
            {bullets.map((b) => (
              <li key={b} className="flex items-center gap-3 text-mizan-50/90">
                <span className="grid h-6 w-6 flex-none place-items-center rounded-lg bg-white/10 text-gold-soft">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-mizan-100/70">© 2026 Mizan · ميزان</p>
      </aside>

      {/* ── Panneau formulaire ── */}
      <main className="relative flex flex-col bg-cream">
        <div className="zellij-bg pointer-events-none absolute inset-0 opacity-50 [mask-image:linear-gradient(180deg,#000,transparent_60%)]" />

        <div className="relative flex items-center justify-between px-6 py-5">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-mizan-600"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t("auth.backHome")}
          </Link>
          <LanguageToggle />
        </div>

        <div className="relative flex flex-1 items-center justify-center px-6 py-8">
          <div className="w-full max-w-md">
            <div className={"card-zellij p-8 " + (centered ? "text-center" : "")}>
              {icon && (
                <div className="mb-4 flex justify-center">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-mizan-50 text-3xl text-mizan-600">
                    {icon}
                  </div>
                </div>
              )}
              <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
              {subtitle && <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>}
              <div className={centered ? "mt-6" : "mt-6 text-start"}>{children}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
