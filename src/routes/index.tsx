import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/lib/page-meta";
import { Hero } from "@/components/Hero";
import { CategoryNav } from "@/components/CategoryNav";

const title = "McRelish | Order The Best Jollof In Awka";
const description =
  "Good food, great moments. Order McRelish jollof rice, family packs, gift food boxes and event catering in Awka, Anambra State.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: pageMeta(title, description),
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <Hero />
      <CategoryNav />
    </>
  );
}
