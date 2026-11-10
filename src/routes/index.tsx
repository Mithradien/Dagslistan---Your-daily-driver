import { createFileRoute } from "@tanstack/react-router";
import { Dagslistan } from "@/components/Dagslistan";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dagslistan" },
      { name: "description", content: "Dagens bokningar matchade mot lagerplatser – utskrivbart på ett A4." },
      { property: "og:title", content: "Dagslistan" },
      { property: "og:description", content: "Dagens bokningar matchade mot lagerplatser – utskrivbart på ett A4." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dagslistan,
});
