# Mise à jour Mizan — Design marocain + Bilingue FR/العربية

Cette mise à jour applique l'identité visuelle **Mizan** (zellige marocain : vert
`#0E6B4E`, or `#BE9A4E`, rouge drapeau `#C1272D`) à toute l'application, ajoute une
**page d'accueil publique** de présentation, et un **système de traduction FR / العربية**
avec passage automatique en **RTL** pour l'arabe.

## 1. Comment intégrer

Copie le contenu de ce dossier dans la racine de ton projet `LegalAI_Morocco_PFA`
(écrase les fichiers existants) :

```
index.html              → racine du projet
tailwind.config.js      → racine du projet
src/                    → fusionne avec ton dossier src/
```

Puis relance :

```bash
npm install        # (rien de nouveau à installer, mais par sécurité)
npm run dev
```

Aucune nouvelle dépendance n'est requise : on réutilise `lucide-react`, `motion`
et `react-router-dom` déjà présents. Les polices (Fraunces + IBM Plex Sans/Arabic)
sont chargées via Google Fonts dans `src/index.css`.

## 2. Ce qui a changé

| Fichier | Changement |
|---|---|
| `tailwind.config.js` | Palette `mizan` (vert), `gold`, `flag`, `cream`, `ink` + polices `display`/`ar` + motifs `bg-zellij` |
| `src/index.css` | Import des polices, `.btn-primary` en vert, utilitaires `.zellij-bg`, police arabe auto en RTL |
| `src/i18n/translations.ts` | **Dictionnaire FR + AR** (nav, landing, navbar…) |
| `src/i18n/LanguageContext.tsx` | Provider `useLang()` → `t()`, `lang`, `dir`, `toggleLang` (mémorisé dans localStorage) |
| `src/components/LanguageToggle.tsx` | Bouton de bascule de langue |
| `src/pages/Landing.tsx` | **Nouvelle page d'accueil** (publique, bilingue, style Mizan) |
| `src/App.tsx` | Route `/` → Landing, et `LanguageProvider` qui englobe l'app |
| `src/components/Sidebar.tsx` | Logo Mizan + libellés traduits + RTL |
| `src/components/Navbar.tsx` | Bouton langue + recherche traduite + RTL |
| `src/components/Layout.tsx` | Marges logiques (`ps-64`) compatibles RTL |
| Toutes les pages | Bleu de marque remplacé par le vert `mizan-*` |

## 3. Traduire une page existante

Le système est prêt. Dans n'importe quelle page :

```tsx
import { useLang } from "../i18n/LanguageContext";

export default function MaPage() {
  const { t } = useLang();
  return <h1>{t("nav.dashboard")}</h1>;
}
```

Ajoute tes clés dans `src/i18n/translations.ts` (sections `fr` ET `ar`) :

```ts
fr: { dashboard: { title: "Tableau de bord", welcome: "Bienvenue" } },
ar: { dashboard: { title: "لوحة التحكم", welcome: "مرحباً" } },
```

puis `t("dashboard.title")`. Pour l'instant, la **landing page, la sidebar et la
navbar** sont entièrement traduites ; les autres pages sont déjà rebrandées en vert
et n'attendent que tes clés `t()`.

## 4. RTL (arabe)

Quand l'utilisateur choisit العربية, `LanguageContext` met `dir="rtl"` et `lang="ar"`
sur `<html>`. Utilise les utilitaires **logiques** de Tailwind pour que tout s'inverse
tout seul : `ps-`/`pe-` (au lieu de `pl-`/`pr-`), `ms-`/`me-`, `start-`/`end-`,
`border-s`/`border-e`, `text-start`/`text-end`, et le variant `rtl:` au besoin.
