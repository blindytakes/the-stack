# Deliverability Baseline (Newsletter)

Use this checklist before enabling production newsletter sends.

## 1) Required DNS records

Replace placeholders with values provided by your email platform.

### SPF

- Type: `TXT`
- Host/Name: `@`
- Value: `v=spf1 include:spf.resend.com ~all`

### DKIM

- Type: `TXT`
- Host/Name: `resend._domainkey` (or provider-specific selector)
- Value: provider-generated DKIM public key (`k=rsa; p=...`)

### DMARC

- Type: `TXT`
- Host/Name: `_dmarc`
- Value: `v=DMARC1; p=none; rua=mailto:<your-dmarc-mailbox@yourdomain>; fo=1`

After stable delivery, move policy from `p=none` to `p=quarantine` and later `p=reject`.

## 2) App environment variables

- `NEWSLETTER_PROVIDER=resend`
- `RESEND_API_KEY=...`
- `RESEND_AUDIENCE_ID=...`
- `NEWSLETTER_SYNC_MAX_RETRIES=2` (or 3)

## 3) Provider setup prerequisites

- Verify your sending domain inside Resend before running campaigns.
- Confirm the verified domain is the one used in your from-address.
- Enable `List-Unsubscribe` support in send flows so mailbox providers can process unsubscribes cleanly.

## 4) Monitoring checks

- Watch `GET /api/health` for `newsletter.ok` and `newsletter.message`.
- Alert on logs containing `[newsletter] provider sync failed`.
- Alert on non-2xx responses from `/api/newsletter/subscribe`.

## 5) Seed sender reputation

- Start with low volume and consistent cadence.
- Keep hard bounce and spam complaint rates low.
- Ensure every campaign includes clear unsubscribe links.
