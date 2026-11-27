import type { MetadataRoute } from "next";
import { CANONICAL_URL } from "@/lib/site";

const PUBLIC_PATHS = ["", "/terapeutas", "/register", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: `${CANONICAL_URL}${path || "/"}`,
    alternates: {
      languages: {
        "pt-PT": `${CANONICAL_URL}${path || "/"}`,
        en: `${CANONICAL_URL}/en${path}`,
      },
    },
  }));
}
