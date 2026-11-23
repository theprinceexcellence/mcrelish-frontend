import privacyMd from "@/content/privacy-policy.md?raw";
import termsMd from "@/content/terms-of-service.md?raw";

export type LegalSlug = "privacy-policy" | "terms-of-service";
export interface LegalDoc {
  slug: LegalSlug;
  title: string;
  content: string;
  version: string;
  effective_date: string;
}

/** Drop the leading "# TITLE" and "Effective Date:" lines; they are stored separately. */
export function cleanLegalContent(md: string) {
  return md
    .replace(/^\s*#\s+.*\n/, "")
    .replace(/^\s*\*{0,2}Effective Date:?\*{0,2}.*\n/, "")
    .trim();
}

export const LEGAL_FALLBACK: Record<LegalSlug, LegalDoc> = {
  "privacy-policy": {
    slug: "privacy-policy",
    title: "Privacy Policy",
    content: cleanLegalContent(privacyMd),
    version: "1.0",
    effective_date: "2026-11-03",
  },
  "terms-of-service": {
    slug: "terms-of-service",
    title: "Terms of Service",
    content: cleanLegalContent(termsMd),
    version: "1.0",
    effective_date: "2026-11-03",
  },
};

export function formatEffectiveDate(d: string) {
  const date = new Date(`${d}T12:00:00Z`);
  return Number.isNaN(date.getTime())
    ? d
    : date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Africa/Lagos",
      });
}
