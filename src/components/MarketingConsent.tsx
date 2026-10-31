"use client";
import Script from "next/script";
export function MarketingConsent({ containerId, allowTags = true }: { containerId: string | null; allowTags?: boolean }) {
  return <Script id="cognixhub-mindwink-consent" src="/cognix-marketing.js?v=20261031-2" strategy="afterInteractive" data-project="mindwink" data-pixel="1389787159809594" data-hosts="mindwink.cognixhub.com" data-paths="/,/en,/en/" data-enabled={allowTags ? "true" : "false"} data-gtm={containerId || ""} />;
}
