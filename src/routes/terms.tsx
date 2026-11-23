import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/page-meta";
import { getLegalDoc } from "@/lib/legal.functions";
import { LEGAL_FALLBACK } from "@/lib/legal";
import { LegalPage } from "@/components/LegalPage";

const title = "Terms of Service | McRelish";
const description = "Terms for ordering meals, bulk packs, food boxes and catering from McRelish Ltd.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: pageMeta(title, description),
  }),
  loader: () => getLegalDoc({ data: "terms-of-service" }),
  errorComponent: () => <LegalPage doc={LEGAL_FALLBACK["terms-of-service"]} />,
  notFoundComponent: () => <LegalPage doc={LEGAL_FALLBACK["terms-of-service"]} />,
  component: TermsPage,
});

function TermsPage() {
  return <LegalPage doc={Route.useLoaderData()} />;
}
