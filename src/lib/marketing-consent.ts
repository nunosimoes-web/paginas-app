export const CONSENT_KEY = "mindwink.cookie-consent.v1";
export const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;

export type MarketingConsent = {
  version: 1;
  analytics: boolean;
  marketing: boolean;
  savedAt: number;
};

export function readConsent(raw: string | null, now = Date.now()): MarketingConsent | null {
  if (!raw) return null;
  try {
    const c = JSON.parse(raw);
    if (c.version !== 1 || typeof c.analytics !== "boolean" || typeof c.marketing !== "boolean" ||
      !Number.isFinite(c.savedAt) || c.savedAt > now || now - c.savedAt >= CONSENT_MAX_AGE_MS) return null;
    return { version: 1, analytics: c.analytics, marketing: c.marketing, savedAt: c.savedAt };
  } catch { return null; }
}

export function validGtmId(value: string | undefined): string | null {
  return value && /^GTM-[A-Z0-9]{4,20}$/.test(value) ? value : null;
}

// Never expose query strings, signed links, account routes or personal content.
export function eligiblePublicLocation(path: string, search: string, hash: string): boolean {
  return (path === "/" || path === "/en" || path === "/en/") && !search && !hash;
}

export function consentSignals(consent: MarketingConsent | null) {
  return {
    analytics_storage: consent?.analytics ? "granted" : "denied",
    ad_storage: consent?.marketing ? "granted" : "denied",
    ad_user_data: consent?.marketing ? "granted" : "denied",
    ad_personalization: consent?.marketing ? "granted" : "denied",
  };
}
