import { api } from "./api";
import { LEGAL_FALLBACK, cleanLegalContent, type LegalDoc, type LegalSlug } from "./legal";

/** Loads a legal page from the backend, falling back to the bundled text. */
export async function getLegalDoc({ data: slug }: { data: LegalSlug }): Promise<LegalDoc> {
  try {
    const doc = await api<LegalDoc>(`/api/legal/${slug}`);
    return { ...doc, content: cleanLegalContent(doc.content) };
  } catch {
    return LEGAL_FALLBACK[slug];
  }
}

export const saveLegalDoc = (doc: LegalDoc) => api<LegalDoc>("/api/admin/legal", { body: doc });
