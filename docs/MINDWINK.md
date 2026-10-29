# Mindwink — deployment and continuity

Canonical URL: https://mindwink.cognixhub.com

Renamed from Páginas on 2026-10-29. The existing Coolify application
`z9y1h5x6kgz7xy7v2znzcr8c` and PostgreSQL database `paginas-db` are retained.
No user-data migration, new database, preference reset or content reseed is required
for the rename. Existing startup performs its usual idempotent content seed.

## Links and email

- NEXTAUTH_URL is the canonical URL above.
- Old public page URLs redirect temporarily (307), preserving paths and query parameters.
- Old API URLs remain served for scheduled tasks and tracking links.
- NEXTAUTH_SECRET and the existing `paginas-daily-<user>-<day>` idempotency key
  must remain unchanged. Changing them can invalidate old links or duplicate mail.
- Resend remains the sender. Display name: Mindwink. The authenticated sender
  address is hello@mindwink.cognixhub.com; replies and SUPPORT_EMAIL go to that
  monitored Hostinger mailbox. SPF, DKIM and DMARC verified.
- Do not run the daily-send or daily-report endpoints as deployment smoke tests:
  they send real messages. Test rendering and signed-link verification without sending.
- The approved one-time service announcement was delivered to all 8 existing
  accounts on 2026-10-29, using their saved locale (all pt-PT). Do not resend.
  Existing daily-mail choices were left unchanged (7 enabled, 1 disabled).
  A private per-recipient ledger and stable Resend idempotency keys prevent duplicates.

## Rollback

Keep both old hosts configured in Coolify and retain the existing database and secrets.
Restore the previous source revision and NEXTAUTH_URL/EMAIL_FROM values if needed.
Database restoration is unnecessary for a presentation/domain rollback. Never restore
an older backup over newer user activity without a separately reviewed recovery plan.

## Future public signup

The existing emailDaily preferences are preserved. The inherited signup defaults
emailDaily to true and has no dedicated consent-event history. Before promoting
public registrations, implement explicit daily-email choice and consent evidence;
keep any future promotional email permission separate.

## Consent and marketing tags

`MARKETING_GTM_ID` is a server-side optional environment variable (GTM-...).
The anonymous landing page alone mounts the consent manager. Authenticated users,
account forms, support, signed links, journals, check-ins and therapist pages do
not load GTM. Consent is denied by default (basic mode: no Google requests before
a positive choice). Analytics and advertising permissions are separate; choices
expire after 180 days. Withdrawal reloads the document to stop loaded scripts,
including across tabs. Consent does not change daily-email preferences.

The GTM container must contain only reviewed, purpose-gated tags. Meta/TikTok
tags require explicit additional advertising consent checks in GTM. No all-pages
or history triggers, form/DOM scraping, automatic advanced matching, user IDs,
emails, journal content, mood values or health-related audience segments.
The only event emitted is `mw_public_page_view` with product, locale and clean
public path/URL. Landing URLs with queries or fragments are not tagged. When tags
are active, links away from the landing page force a new document so listeners
cannot survive a client-side transition into private pages.

GTM is a dispatcher, not an audience store. An empty container does not create
advertising audiences. Each network needs its own account and pixel/dataset ID.
Conversions API is network-specific, still requires consent and has no automatic
retroactive history. Use the same event_id for browser/server deduplication if
server delivery is added later; never include private product data.
