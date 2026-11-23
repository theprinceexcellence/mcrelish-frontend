import { Fragment, type ReactNode } from "react";
import { formatEffectiveDate, type LegalDoc } from "@/lib/legal";

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
      : <Fragment key={i}>{part}</Fragment>,
  );
}

/** Minimal, safe markdown renderer: headings, bullet lists, bold, paragraphs. No raw HTML. */
export function LegalMarkdown({ content }: { content: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) { blocks.push(<p key={blocks.length}>{inline(para.join(" "))}</p>); para = []; }
    if (list.length) {
      blocks.push(<ul key={blocks.length} className="list-disc space-y-1.5 pl-5">{list.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>);
      list = [];
    }
  };
  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    const li = /^[-*]\s+(.*)$/.exec(line);
    if (h) {
      flush();
      const level = (h[1] ?? "").length;
      blocks.push(level <= 2
        ? <h2 key={blocks.length} className="pt-6 font-display text-xl font-bold text-foreground sm:text-2xl">{inline(h[2] ?? "")}</h2>
        : <h3 key={blocks.length} className="pt-2 text-base font-semibold text-foreground">{inline(h[2] ?? "")}</h3>);
    } else if (li) {
      if (para.length) flush();
      list.push(li[1] ?? "");
    } else {
      if (list.length) flush();
      para.push(line);
    }
  }
  flush();
  return <div className="space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">{blocks}</div>;
}

export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-bold sm:text-5xl lg:text-6xl">{doc.title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Effective {formatEffectiveDate(doc.effective_date)} · Version {doc.version}
      </p>
      <div className="mt-6"><LegalMarkdown content={doc.content} /></div>
    </section>
  );
}
