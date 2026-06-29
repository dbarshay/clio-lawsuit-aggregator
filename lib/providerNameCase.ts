// Shared provider/client display-name case normalizer.
//
// This mirrors the logic in scripts/normalize-provider-client-display-names.mjs
// so that display-time formatting (matter page, email subjects, etc.) matches the
// stored-data normalization produced by that script. Keep the two in sync.

const MANUAL_OVERRIDES = new Map<string, string>([
  ["BL PAIN MANAGEMENT, PLLC", "BL Pain Management, PLLC"],
  ["LR MEDICAL, PLLC", "LR Medical, PLLC"],
]);

function clean(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function normalizeProviderName(value: unknown): string {
  const original = clean(value);
  if (!original) return "";

  if (MANUAL_OVERRIDES.has(original)) return MANUAL_OVERRIDES.get(original) as string;

  const s = original
    .replace(/\bD\s*\/\s*B\s*\/\s*A\b/gi, "d/b/a")
    .replace(/\bDBA\b/gi, "d/b/a")
    .replace(/\bP\.?\s*C\.?\b/gi, "P.C.")
    .replace(/\bD\.?\s*C\.?\b/gi, "D.C.")
    .replace(/\bD\.?\s*O\.?\b/gi, "D.O.")
    .replace(/\bM\.?\s*D\.?\b/gi, "M.D.")
    .replace(/\bC\.?\s*A\.?\s*C\.?\b/gi, "C.A.C.")
    .replace(/\bL\.?\s*A\.?\s*C\.?\b/gi, "LAC")
    .replace(/\bL\.?\s*L\.?\s*C\.?\b/gi, "LLC")
    .replace(/\bL\.?\s*L\.?\s*P\.?\b/gi, "LLP")
    .replace(/\bP\.?\s*L\.?\s*L\.?\s*C\.?\b/gi, "PLLC")
    .replace(/\bINC\.?\b/gi, "Inc.")
    .replace(/\bCORP\.?\b/gi, "Corp.")
    .replace(/\bLTD\.?\b/gi, "Ltd.")
    .replace(/\bNYC\b/gi, "NYC")
    .replace(/\bNY\b/gi, "NY")
    .replace(/\bLI\b/gi, "LI");

  const preserveWords = new Set([
    "NY", "NYC", "LI", "MRI", "CT", "PT", "OT", "EMG", "NCV", "DME", "LAC",
    "LLC", "LLP", "PLLC",
  ]);
  const professionalWithPeriods = new Set(["P.C.", "D.C.", "D.O.", "M.D.", "C.A.C."]);
  const corporateWithPeriods = new Set(["Inc.", "Corp.", "Ltd."]);
  const smallWords = new Set(["and", "of", "the", "for", "in", "on", "at", "to", "an"]);

  const tokens = s.split(/(\s+|[-/&,.()])/);

  const out = tokens
    .map((token, index) => {
      if (!token || /^[\s\-/&,.()]+$/.test(token)) return token;

      const upper = token.toUpperCase();
      const lower = token.toLowerCase();
      const next = tokens[index + 1] || "";
      const prev = tokens[index - 1] || "";

      if (token === "d/b/a") return "d/b/a";
      if (professionalWithPeriods.has(token)) return token;
      if (corporateWithPeriods.has(token)) return token;
      if (preserveWords.has(upper)) return upper;

      if (/^[A-Z]$/i.test(token) && (next === "." || prev === "&" || tokens[index - 2] === "&")) {
        return upper;
      }

      if (smallWords.has(lower)) {
        const hasWordBefore = tokens.slice(0, index).some((t) => /\w/.test(t));
        const hasWordAfter = tokens.slice(index + 1).some((t) => /\w/.test(t));
        if (hasWordBefore && hasWordAfter) return lower;
      }

      return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
    })
    .join("");

  return out
    .replace(/\b(P\.C|D\.C|D\.O|M\.D|C\.A\.C|Inc|Corp|Ltd)\.\./g, "$1.")
    .replace(/\bP\.C\b(?!\.)/g, "P.C.")
    .replace(/\bD\.C\b(?!\.)/g, "D.C.")
    .replace(/\bD\.O\b(?!\.)/g, "D.O.")
    .replace(/\bM\.D\b(?!\.)/g, "M.D.")
    .replace(/\bC\.A\.C\b(?!\.)/g, "C.A.C.")
    .replace(/\bInc\b(?!\.)/g, "Inc.")
    .replace(/\bCorp\b(?!\.)/g, "Corp.")
    .replace(/\bLtd\b(?!\.)/g, "Ltd.")
    .replace(/\b(P\.C|D\.C|D\.O|M\.D|C\.A\.C|Inc|Corp|Ltd)\.\s*,/g, "$1.,")
    .replace(/\bD\/B\/A\b/gi, "d/b/a")
    .replace(/\s+,/g, ",")
    .replace(/\s+\./g, ".")
    .replace(/\s+/g, " ")
    .trim();
}
