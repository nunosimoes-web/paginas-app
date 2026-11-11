# Public form protection

Support, registration and password recovery share `public-form-security.ts`. Login and signed-in preferences retain their existing behavior.

Every submission is bounded to 16 KiB, validates field types/lengths, checks the expected origin and honeypot, and redeems a Turnstile token server-side. Success, the exact action (`support`, `register`, `password_reset`) and an approved hostname are required. Missing secret, provider/network error, expired/invalid tokens and storage failures fail closed before account creation or email delivery.

An atomic PostgreSQL quota table provides multi-process rate counters and application-level token single use, including the brief eventual-consistency window in upstream replay rejection. Limits per action: 20 attempts/IP per 15 minutes; 5 accepted/IP per 15 minutes; 80 accepted globally/hour; 3 accepted/email/hour. Client-supplied IP headers are only trustworthy behind the configured reverse proxy; independent global and token limits remain in place. Keys use HMAC with the existing server secret. Raw IP/email/token values are not stored in this quota table. Expired counters are cleaned during quota checks. The migration adds only this table; it does not modify existing accounts or preferences.

Widget credentials live in the application's existing Coolify runtime environment and the existing private cofre. Production hostname validation excludes localhost. Public sitekey is passed by server components at runtime. The native request flow is preserved through a client wrapper which keeps fields on failure, refreshes the token, and shows localized errors.

Support destinations are fixed by server configuration. HTML is escaped and Reply-To is validated. Support notifications have a stable provider idempotency key. Unknown control fields cannot select a recipient. The mailbox triage collector remains deterministic: it never executes content, opens links or invokes model tools. Possible control instructions are quarantined and redacted from owner alerts; original messages remain available privately.

Scope: this is layered abuse prevention, not a claim of immunity to all attacks or a complete penetration test. Automated tests do not replace a successful challenge through the deployed backend. Do not test registration by creating real or fictitious participant accounts, or run daily delivery cron against participants. Use controlled owner-only support checks and blocked-path tests instead.
