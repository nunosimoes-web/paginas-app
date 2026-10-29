import { describe, expect, it } from "vitest";
import { CONSENT_MAX_AGE_MS, consentSignals, eligiblePublicLocation, readConsent, validGtmId } from "./marketing-consent";

describe("public marketing boundary", () => {
  it("denies missing, corrupt, expired and future consent", () => {
    const now = 2000000000000;
    for (const raw of [null, "bad", "{}", JSON.stringify({ version: 1, analytics: "true", marketing: true, savedAt: now }), JSON.stringify({ version: 1, analytics: true, marketing: true, savedAt: now - CONSENT_MAX_AGE_MS }), JSON.stringify({ version: 1, analytics: true, marketing: true, savedAt: now + 1 })]) expect(readConsent(raw, now)).toBeNull();
    expect(consentSignals(null)).toEqual({ analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  });
  it("keeps analytics permission separate from advertising permission", () => {
    const c = readConsent(JSON.stringify({ version: 1, analytics: true, marketing: false, savedAt: 10 }), 11);
    expect(consentSignals(c)).toEqual({ analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  });
  it("allows only clean public home locations and a real container format", () => {
    expect(eligiblePublicLocation("/", "", "")).toBe(true);
    expect(eligiblePublicLocation("/en", "", "")).toBe(true);
    for (const path of ["/journal", "/checkin", "/today", "/settings", "/login", "/register", "/therapist/client123", "/reset-password", "/support"]) expect(eligiblePublicLocation(path, "", "")).toBe(false);
    expect(eligiblePublicLocation("/", "?email=a@b.com", "")).toBe(false);
    expect(eligiblePublicLocation("/", "", "#token")).toBe(false);
    expect(validGtmId("GTM-ABC1234")).toBe("GTM-ABC1234");
    expect(validGtmId("GTM-ABC<script>")).toBeNull();
    expect(validGtmId(undefined)).toBeNull();
  });
});
