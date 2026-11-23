import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/page-meta";
import { DealsSection } from "@/components/DealsSection";
import { OrderCta } from "@/components/OrderCta";

const title = "Deals & Value Packs | McRelish";
const description =
  "McRelish value packs and curated food boxes — family-size African meals priced exactly as listed on our menu.";

export const Route = createFileRoute("/deals")({
  head: () => ({
    meta: pageMeta(title, description),
  }),
  component: DealsPage,
});

function DealsPage() {
  return (
    <>
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow">Offers</p>
          <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">Deals & value packs</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Our November Jolly Fest Feast is on offer now, shown on the menu. Below are
            the best-value multi-serving packs and gift boxes.
          </p>
        </div>
      </section>
      <DealsSection />
      <OrderCta />
    </>
  );
}
