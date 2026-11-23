import { shareImageUrl } from "./site";

export const pageMeta = (title: string, description: string) => [
  { title },
  { name: "description", content: description },
  { property: "og:title", content: title },
  { property: "og:description", content: description },
  { property: "og:type", content: "website" },
  { property: "og:image", content: shareImageUrl },
  { name: "twitter:card", content: "summary" },
  { name: "twitter:image", content: shareImageUrl },
];
