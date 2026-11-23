import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/page-meta";
import { getLegalDoc } from "@/lib/legal.functions";
import { LEGAL_FALLBACK } from "@/lib/legal";
import { LegalPage } from "@/components/LegalPage";

const title = "Privacy Policy | McRelish";
const description = "How McRelish Ltd collects, uses and protects your personal information under the Nigeria Data Protection Act 2023.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: pageMeta(title, description),
  }),
  loader: () => getLegalDoc({ data: "privacy-policy" }),
  errorComponent: () => <LegalPage doc={LEGAL_FALLBACK["privacy-policy"]} />,
  notFoundComponent: () => <LegalPage doc={LEGAL_FALLBACK["privacy-policy"]} />,
  component: PrivacyPage,
});

function PrivacyPage() {
  return <LegalPage doc={Route.useLoaderData()} />;
}
