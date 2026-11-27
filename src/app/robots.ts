import type { MetadataRoute } from "next";
import { CANONICAL_URL, isCanonicalDeploy } from "@/lib/site";

export const dynamic = "force-dynamic";

// Só o domínio canónico é indexável; previews e cópias locais ficam de fora.
export default function robots(): MetadataRoute.Robots {
  if (!isCanonicalDeploy()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${CANONICAL_URL}/sitemap.xml`,
  };
}
