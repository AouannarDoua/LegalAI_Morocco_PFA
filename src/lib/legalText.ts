// Mise en forme de textes juridiques mal découpés (retours à la ligne au milieu
// des phrases/mots). Recolle les lettres isolées, joint les fragments, détecte
// les titres. Utilisé par la page Articles ET la page Détail décision.

export type Section = { header: string | null; body: string };

export const LAW_HEAD = /^(المادة|الفصل|الباب|القسم|الكتاب|الفرع)\s+[\d\u0660-\u0669]/;
const ORDINAL  = /^(أولا|ثانيا|ثالثا|رابعا|خامسا|سادسا|سابعا|ثامنا|تاسعا|عاشرا)ً?\b/;
const NUMBERED = /^[\d\u0660-\u0669]+\s*[-\u2013.)]/;
const LETTER   = /^[أ-ي]\s*[-\u2013]\s/;
const NUM_ONLY = /^[\d\u0660-\u0669]+\s*[-\u2013.)]\s*$/;

export function fixSpacing(s: string) {
  return s
    .replace(/\s+/g, " ")
    .replace(/\s+([،؛.:!؟])/g, "$1")
    .replace(/([،؛])(?=\S)/g, "$1 ")
    .trim();
}

export function reflow(lines: string[]) {
  let s = "";
  for (const raw of lines) {
    const p = raw.trim();
    if (!p) continue;
    if (/^[<>«»►▪•\-\u2013\u2014_=*~^|.]+$/.test(p)) continue;   // ligne = bruit
    if (s === "") { s = p; continue; }
    const lastWord = s.split(/\s/).pop() || "";
    if (lastWord.length === 1 && /[\u0621-\u064A]/.test(lastWord)) s += p;  // recolle lettre isolée
    else if (/^[،؛.:!؟]/.test(p)) s += p;                                    // ponctuation collée
    else s += " " + p;
  }
  return fixSpacing(s);
}

export function parseSections(content: string, title?: string): Section[] {
  let lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  const t0 = (title || "").replace(/[.،:]+$/, "").trim();
  if (t0 && lines.length && lines[0].replace(/[.،:]+$/, "").trim() === t0) lines = lines.slice(1);

  // recolle un marqueur de numéro isolé ("2-") avec la ligne suivante
  const merged: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (NUM_ONLY.test(lines[i]) && lines[i + 1]) merged.push(lines[i] + " " + lines[++i]);
    else merged.push(lines[i]);
  }
  lines = merged;

  const isHeading = (line: string, next?: string) => {
    if (LAW_HEAD.test(line) || ORDINAL.test(line) || NUMBERED.test(line) || LETTER.test(line)) return true;
    if (line.length <= 45 && !/[.،؛:!؟]$/.test(line) && next && /^[:\-\u2013]/.test(next.trim())) return true;
    return false;
  };

  const sections: Section[] = [];
  let cur: { header: string | null; buf: string[] } = { header: null, buf: [] };
  const flush = () => {
    if (cur.header || cur.buf.length) sections.push({ header: cur.header, body: reflow(cur.buf) });
  };
  for (let i = 0; i < lines.length; i++) {
    if (isHeading(lines[i], lines[i + 1])) { flush(); cur = { header: lines[i], buf: [] }; }
    else cur.buf.push(lines[i]);
  }
  flush();
  return sections.filter((s) => s.header || s.body);
}
