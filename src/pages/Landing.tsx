import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Search,
  FileText,
  RefreshCw,
  ShieldCheck,
  Check,
  ArrowRight,
  Scale,
  Send,
  BadgeCheck,
  Sparkles,
  FilePlus2,
  Calculator,
  Mic,
} from "lucide-react";
import { useLang } from "../i18n/LanguageContext";
import LanguageToggle from "../components/LanguageToggle";

/* Étoile zellige (khatam) réutilisée comme signature visuelle */
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

const featIcons = [Search, FileText, FilePlus2, Calculator, RefreshCw, Mic];

export default function Landing() {
  const { t, dir } = useLang();

  // ── démo : machine à écrire ────────────────────────────────────────────
  const answer: string = t("landing.demoAnswer");
  const [typed, setTyped] = useState("");
  const [showCite, setShowCite] = useState(false);
  const demoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTyped("");
    setShowCite(false);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setTyped(answer);
      setShowCite(true);
      return;
    }
    let i = 0;
    const start = setTimeout(() => {
      const iv = setInterval(() => {
        i++;
        setTyped(answer.slice(0, i));
        if (i >= answer.length) {
          clearInterval(iv);
          setShowCite(true);
        }
      }, 16);
    }, 600);
    return () => clearTimeout(start);
  }, [answer]);

  const features: { t: string; d: string }[] = t("landing.features");
  const steps: { t: string; d: string }[] = t("landing.steps");
  const coverage: { t: string; d: string }[] = t("landing.coverage");
  const sources: string[] = t("landing.sources");
  const plans: any[] = t("landing.plans");
  const fl = t("landing.footLinks");

  return (
    <div className="min-h-screen bg-cream font-[inherit] text-ink">
      {/* ═══ TOP BAR ═══ */}
      <header className="sticky top-0 z-50 border-b border-gold-soft/60 bg-cream/85 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center gap-7 px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="text-mizan-600">
              <svg width="34" height="34" viewBox="0 0 40 40">
                <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
                  <polygon points="20,3 24.5,15.5 37,20 24.5,24.5 20,37 15.5,24.5 3,20 15.5,15.5" />
                  <polygon points="20,8 23,17 32,20 23,23 20,32 17,23 8,20 17,17" />
                </g>
                <circle cx="20" cy="20" r="2.4" fill="#C1272D" />
              </svg>
            </span>
            <span className="leading-none">
              <span className="font-display text-[22px] font-semibold">
                Miz<span className="text-mizan-600">an</span>
              </span>
              <span className="block font-ar text-xs font-semibold text-gold-600">ميزان</span>
            </span>
          </Link>

          <nav className="ms-auto hidden items-center gap-7 md:flex">
            <a href="#features" className="text-sm font-medium text-ink/80 hover:text-mizan-600">
              {fl.features}
            </a>
            <a href="#pricing" className="text-sm font-medium text-ink/80 hover:text-mizan-600">
              {fl.pricing}
            </a>
            <a href="#coverage" className="text-sm font-medium text-ink/80 hover:text-mizan-600">
              {fl.sources}
            </a>
            <Link
              to="/login"
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:border-mizan-600 hover:text-mizan-600"
            >
              {t("common.login")}
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-mizan-600 px-5 py-2 text-sm font-semibold text-white hover:bg-mizan-700"
            >
              {t("common.tryFree")}
            </Link>
          </nav>

          <LanguageToggle className="ms-auto md:ms-0" />
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        <div className="zellij-bg pointer-events-none absolute inset-0 opacity-70 [mask-image:linear-gradient(180deg,#000,transparent)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 py-16 md:grid-cols-2 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-soft bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-mizan-800">
              <span className="h-1.5 w-1.5 rounded-full bg-flag" />
              {t("landing.eyebrow")}
            </span>

            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
              {t("landing.heroPre")}
              <span className="relative whitespace-nowrap text-mizan-600">
                {t("landing.heroHl")}
                <span className="absolute inset-x-0 bottom-1.5 -z-10 h-2.5 rounded bg-gold-soft" />
              </span>
              {t("landing.heroPost")}
            </h1>

            <p className="mt-5 max-w-[46ch] text-lg text-gray-600">{t("landing.lead")}</p>

            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-mizan-600 px-6 py-3 font-semibold text-white shadow-zellij transition hover:bg-mizan-700"
              >
                {t("landing.ctaPrimary")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 font-semibold hover:border-mizan-600 hover:text-mizan-600"
              >
                {t("landing.ctaSecondary")}
              </a>
            </div>

            <p className="mt-6 flex items-center gap-2 text-sm text-gray-600">
              <BadgeCheck className="h-[18px] w-[18px] text-mizan-600" />
              {t("landing.reassure")}
            </p>
          </motion.div>

          {/* SIGNATURE : carte assistant */}
          <motion.div
            id="demo"
            ref={demoRef}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="relative"
          >
            <ZellijStar className="pointer-events-none absolute -top-10 -end-8 h-56 w-56 text-gold opacity-50" />
            <div className="relative rounded-[20px] border border-gray-200 bg-white p-1.5 shadow-zellij">
              <div className="overflow-hidden rounded-[15px] border border-gold-soft">
                {/* head */}
                <div className="flex items-center gap-2.5 border-b border-gray-100 bg-[#fcfbf6] px-4 py-3.5">
                  <span className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-mizan-600 text-white">
                    <Scale className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold">{t("landing.assistantTitle")}</div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                      {t("landing.online")}
                    </div>
                  </div>
                </div>
                {/* body */}
                <div className="flex min-h-[236px] flex-col gap-3.5 p-4">
                  <div className="max-w-[88%] self-end rounded-2xl rounded-br-md bg-mizan-600 px-3.5 py-2.5 text-sm text-white rtl:self-start rtl:rounded-br-2xl rtl:rounded-bl-md">
                    {t("landing.demoQuestion")}
                  </div>
                  <div className="max-w-[88%] self-start rounded-2xl rounded-bl-md border border-gray-100 bg-[#f3f1e8] px-3.5 py-2.5 text-sm leading-relaxed text-ink rtl:self-end rtl:rounded-bl-2xl rtl:rounded-br-md">
                    {typed || <span className="text-gray-400">…</span>}
                    {showCite && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-md border border-gold-soft bg-white px-2 py-0.5 text-[11px] font-semibold text-mizan-800">
                          <FileText className="h-3 w-3" /> Code du Travail · Art. 43
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md border border-gold-soft bg-white px-2 py-0.5 text-[11px] font-semibold text-mizan-800">
                          <Check className="h-3 w-3" /> Bulletin Officiel
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {/* foot */}
                <div className="flex items-center gap-2.5 border-t border-gray-100 bg-[#fcfbf6] px-4 py-3">
                  <span className="flex-1 text-sm text-gray-400">{t("landing.demoInput")}</span>
                  <span className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-mizan-600 text-white">
                    <Send className="h-4 w-4 rtl:rotate-180" />
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ SOURCES STRIP ═══ */}
      <div className="border-y border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {t("landing.sourcesLabel")}
          </span>
          {sources.map((s) => (
            <span key={s} className="inline-flex items-center gap-2 text-sm font-semibold text-ink/75">
              <span className="h-2 w-2 rotate-45 bg-gold" />
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="bg-cream py-20">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHead
            kicker={t("landing.featKicker")}
            title={t("landing.featTitle")}
            sub={t("landing.featSub")}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => {
              const Icon = featIcons[i] ?? Sparkles;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-100 bg-white p-6 transition hover:-translate-y-1 hover:border-gold-soft hover:shadow-zellij"
                >
                  <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-mizan-50 text-mizan-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-[17px] font-semibold">{f.t}</h3>
                  <p className="text-sm text-gray-600">{f.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ HOW ═══ */}
      <section className="relative overflow-hidden bg-mizan-800 py-20 text-mizan-50">
        <div className="zellij-bg-light pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-6">
          <SectionHead kicker={t("landing.howKicker")} title={t("landing.howTitle")} dark />
          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gold-soft/25 bg-white/5 p-7"
              >
                <div className="mb-3.5 font-display text-3xl font-semibold text-gold-300">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{s.t}</h3>
                <p className="text-sm text-mizan-100/90">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COVERAGE ═══ */}
      <section id="coverage" className="bg-cream py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 md:grid-cols-2">
          <div>
            <SectionHead
              kicker={t("landing.covKicker")}
              title={t("landing.covTitle")}
              sub={t("landing.covSub")}
              compact
            />
            <div className="mt-2 flex flex-col gap-3.5">
              {coverage.map((c, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3.5 rounded-xl border border-gray-100 bg-white p-4"
                >
                  <span className="grid h-6 w-6 flex-none place-items-center rounded-lg bg-mizan-50 text-mizan-600">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <b className="block text-[15px]">{c.t}</b>
                    <span className="text-sm text-gray-600">{c.d}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid place-items-center">
            <ZellijStar className="h-72 w-72 text-gold" />
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="bg-cream py-20">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHead
            kicker={t("landing.priceKicker")}
            title={t("landing.priceTitle")}
            sub={t("landing.priceSub")}
          />
          <div className="grid items-stretch gap-5 md:grid-cols-3">
            {plans.map((p, i) => {
              const feat = i === 1;
              return (
                <div
                  key={i}
                  className={
                    "relative flex flex-col rounded-[18px] bg-white p-7 " +
                    (feat
                      ? "border-[1.5px] border-mizan-600 shadow-zellij"
                      : "border border-gray-100")
                  }
                >
                  {feat && (
                    <span className="absolute -top-3 start-7 rounded-full bg-mizan-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                      {t("landing.mostChosen")}
                    </span>
                  )}
                  <div className="mb-1.5 text-base font-semibold text-mizan-800">{p.name}</div>
                  <div className="font-display text-4xl font-semibold leading-none">
                    {p.price}
                    {p.unit && <span className="ms-1 font-sans text-sm font-medium text-gray-500">{p.unit}</span>}
                  </div>
                  <p className="mb-5 mt-2 min-h-[38px] text-sm text-gray-600">{p.desc}</p>
                  <ul className="mb-6 flex flex-1 flex-col gap-2.5">
                    {p.features.map((ft: string, k: number) => (
                      <li key={k} className="flex items-start gap-2.5 text-sm">
                        <Check className="mt-0.5 h-4 w-4 flex-none text-mizan-600" />
                        {ft}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/register"
                    className={
                      "w-full rounded-full px-4 py-2.5 text-center text-sm font-semibold transition " +
                      (feat
                        ? "bg-mizan-600 text-white hover:bg-mizan-700"
                        : "border border-gray-200 hover:border-mizan-600 hover:text-mizan-600")
                    }
                  >
                    {p.cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ FINALE ═══ */}
      <section className="px-6 pb-20">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-mizan-600 px-8 py-16 text-center text-white">
          <div className="zellij-bg-light pointer-events-none absolute inset-0" />
          <h2 className="relative font-display text-3xl font-semibold md:text-4xl">
            {t("landing.finaleTitle")}
          </h2>
          <p className="relative mx-auto mt-3 max-w-[50ch] text-mizan-50/90">
            {t("landing.finaleSub")}
          </p>
          <div className="relative mt-7 flex flex-wrap justify-center gap-3.5">
            <Link
              to="/register"
              className="rounded-full bg-white px-6 py-3 font-semibold text-mizan-800 hover:bg-gold-soft"
            >
              {t("landing.finaleCta")}
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-white/50 px-6 py-3 font-semibold text-white hover:bg-white/10"
            >
              {t("landing.finaleCta2")}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-ink py-14 text-sm text-gray-300">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 border-b border-white/10 pb-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <svg width="28" height="28" viewBox="0 0 40 40">
                  <g fill="none" stroke="#BE9A4E" strokeWidth="2.2" strokeLinejoin="round">
                    <polygon points="20,3 24.5,15.5 37,20 24.5,24.5 20,37 15.5,24.5 3,20 15.5,15.5" />
                  </g>
                  <circle cx="20" cy="20" r="2.4" fill="#C1272D" />
                </svg>
                <span className="font-display text-xl font-semibold text-white">
                  Miz<span className="text-gold">an</span>
                </span>
              </div>
              <p className="mt-3.5 max-w-[34ch] text-gray-400">{t("landing.footDesc")}</p>
            </div>
            <FooterCol
              title={t("landing.footProduct")}
              links={[fl.features, fl.pricing, fl.sources, fl.demo]}
            />
            <FooterCol title={t("landing.footCompany")} links={[fl.about, fl.contact, fl.blog]} />
            <FooterCol title={t("landing.footLegal")} links={[fl.legal, fl.privacy, fl.terms]} />
          </div>
          <div className="flex flex-wrap justify-between gap-3 pt-6 text-[13px] text-gray-400">
            <span>© 2026 Mizan · {t("landing.footRights")}</span>
            <span className="inline-flex items-center gap-2">
              <span className="text-flag">★</span> {t("landing.footMade")}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── sous-composants ─────────────────────────────────────────────────────── */
function SectionHead({
  kicker,
  title,
  sub,
  dark,
  compact,
}: {
  kicker: string;
  title: string;
  sub?: string;
  dark?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "max-w-xl" : "mb-11 max-w-2xl"}>
      <div
        className={
          "mb-3.5 flex items-center gap-2.5 text-xs font-bold uppercase tracking-widest " +
          (dark ? "text-gold-soft" : "text-gold-600")
        }
      >
        <span className={"h-0.5 w-6 " + (dark ? "bg-gold-soft" : "bg-gold-600")} />
        {kicker}
      </div>
      <h2
        className={
          "font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl " +
          (dark ? "text-white" : "text-ink")
        }
      >
        {title}
      </h2>
      {sub && (
        <p className={"mt-3 text-[17px] " + (dark ? "text-mizan-100/90" : "text-gray-600")}>{sub}</p>
      )}
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white">{title}</h4>
      {links.map((l) => (
        <a key={l} href="#" className="mb-2.5 block text-gray-400 hover:text-gold">
          {l}
        </a>
      ))}
    </div>
  );
}
