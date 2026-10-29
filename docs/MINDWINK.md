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
  address remains paginas@paginasemetaforas.pt; replies go to the existing monitored
  nuno.simoes@paginasemetaforas.pt mailbox through EMAIL_REPLY_TO.
- Do not run the daily-send or daily-report endpoints as deployment smoke tests:
  they send real messages. Test rendering and signed-link verification without sending.
- The participant announcement is a separate draft; do not send automatically.

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
