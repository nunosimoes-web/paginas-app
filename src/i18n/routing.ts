import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pt-PT", "en"],
  defaultLocale: "pt-PT",
  // pt-PT serve em "/", en em "/en".
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
