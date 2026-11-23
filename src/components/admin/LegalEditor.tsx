import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LegalMarkdown } from "@/components/LegalPage";
import { logAudit } from "@/lib/audit";
import { LEGAL_FALLBACK, type LegalDoc, type LegalSlug } from "@/lib/legal";
import { getLegalDoc, saveLegalDoc } from "@/lib/legal.functions";
import { Field, PageHeader, Panel, SkeletonRows, fieldClass } from "./ui";

const SLUGS: LegalSlug[] = ["privacy-policy", "terms-of-service"];

export function LegalEditor() {
  const [slug, setSlug] = useState<LegalSlug>("privacy-policy");
  const [doc, setDoc] = useState<LegalDoc | null>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    let alive = true;
    setDoc(null);
    void getLegalDoc({ data: slug }).then((loaded) => {
      if (alive) setDoc(loaded);
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  async function save() {
    if (!doc) return;
    if (!doc.title.trim() || !doc.content.trim() || !doc.version.trim() || !doc.effective_date) {
      toast.error("Title, version, effective date and text are all required.");
      return;
    }
    setSaving(true);
    try {
      const saved = await saveLegalDoc(doc);
      setDoc({ ...doc, ...saved, content: doc.content });
      toast.success(`${doc.title} published`);
      void logAudit("legal.update", {
        slug,
        version: doc.version,
        effective_date: doc.effective_date,
      }).catch(() => {});
    } catch {
      toast.error("Couldn't publish. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Legal pages"
        description="Edit the Privacy Policy and Terms of Service shown on the website."
      />
      <div className="inline-flex gap-1 rounded-xl bg-muted p-1" role="group" aria-label="Document">
        {SLUGS.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={slug === s ? "default" : "ghost"}
            aria-pressed={slug === s}
            onClick={() => setSlug(s)}
          >
            {LEGAL_FALLBACK[s].title}
          </Button>
        ))}
      </div>
      {!doc ? (
        <SkeletonRows rows={2} className="h-40" />
      ) : (
        <Panel>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Title" htmlFor="legal-title">
              <input
                id="legal-title"
                className={fieldClass}
                value={doc.title}
                onChange={(e) => setDoc({ ...doc, title: e.target.value })}
              />
            </Field>
            <Field label="Version" htmlFor="legal-version">
              <input
                id="legal-version"
                className={fieldClass}
                value={doc.version}
                onChange={(e) => setDoc({ ...doc, version: e.target.value })}
              />
            </Field>
            <Field label="Effective date" htmlFor="legal-date">
              <input
                id="legal-date"
                type="date"
                className={fieldClass}
                value={doc.effective_date}
                onChange={(e) => setDoc({ ...doc, effective_date: e.target.value })}
              />
            </Field>
          </div>
          <div className="mb-1.5 mt-5 flex items-center justify-between">
            <label htmlFor="legal-text" className="text-sm font-medium">
              Text
            </label>
            <button
              type="button"
              className="text-sm font-medium text-primary underline"
              onClick={() => setPreview((p) => !p)}
            >
              {preview ? "Edit" : "Preview"}
            </button>
          </div>
          {preview ? (
            <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-border p-4">
              <LegalMarkdown content={doc.content} />
            </div>
          ) : (
            <textarea
              id="legal-text"
              className={`${fieldClass} h-auto min-h-[50vh] py-3 font-mono text-xs`}
              value={doc.content}
              onChange={(e) => setDoc({ ...doc, content: e.target.value })}
            />
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Use "## " for section headings, "### " for sub-headings, "- " for bullet points and
            **text** for bold.
          </p>
          <Button className="mt-5" onClick={() => void save()} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {saving ? "Publishing…" : "Publish"}
          </Button>
        </Panel>
      )}
    </div>
  );
}
