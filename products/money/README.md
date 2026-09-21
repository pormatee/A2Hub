# MEasyMate Money

Project ID: `money`
Project Display Name: `MEasyMate Money`

## Current Product

- App Version: `F2.1.12`
- Data Schema Version: `3`
- Source of Truth: `projects/money/index.html`
- Public URL: `https://app.measymate.com/money/`
- Deployment: GitHub Actions

## F2.1.12 Pre-Promo System Integration

Integrated:
- Information System V1
- Notice System V1
- Privacy-first Local Analytics
- Local Usage Insights
- System Test Mode: `/money/?test=1`

Test Mode checks Information, Notice, Analytics, Usage Insights and local runtime-error counters without reading financial amounts or private user content.

### Privacy / production gate
- Financial data remains local-first.
- Central analytics transport remains OFF until a verified endpoint is configured.
- Production notices remain OFF by default.
- The test notice is visible only with `?test=1`.

## Verification status
- Static JavaScript syntax: PASS
- Information integration: PASS
- Notice integration: PASS
- Analytics local integration: PASS
- Usage Insights integration: PASS
- Normal mode hides test notice/panel: PASS
- Automated Chromium System Test: PASS
- Data Schema compatibility: PASS (Schema 3 unchanged)
- Financial calculation logic: no intentional change
- GitHub live deployment F2.1.12: UNVERIFIED until pushed
- Real-device Android Test Mode: UNVERIFIED until tested after deployment
