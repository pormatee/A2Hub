# A2Hub Permanent Edition Contract V1

## Identity

- Repository: `pormatee/A2Hub`
- Edition: `A2HUB_PERMANENT`
- Commercial Sale: `NO`
- Intended Access: Permanent / No Expiry for A2Hub-specific permanent products
- Source Family: `pormatee/MEasyMate-Products`
- Source Seed Commit: `5bfe02fcdeaef202cc6cb6bba4f48d05f4ddaefe`
- A2Hub Base Commit: `d48c9641a13b21a70c702cee6087da38d97eb972`

## Source Boundary

`pormatee/MEasyMate-Products` remains the commercial/source-family repository.

A2Hub changes must not be written back to `MEasyMate-Products` automatically.
Commercial license behavior must not be modified as part of A2Hub work.

## A2Hub Product Policy

### Factory Daily
- Stored in A2Hub at `products/factory-daily/`.
- Former A2Hub root application preserved byte-for-byte before the root became the Hub.

### Report Pro
- A2Hub Permanent Edition.
- No expiry / no renewal requirement in A2Hub.
- License ID, storage isolation, backup and restore behavior preserved.

### Contact Shift
- A2Hub Permanent Edition.
- No Trial / Grace / Renewal requirement in A2Hub.
- Maximum Full Devices remains 3.
- Viewer remains read-only and does not consume a Device Slot.
- Team/device and storage/data rules remain preserved.

### MEasyMate Money
- No A2Hub copy.
- Source of Truth remains in `pormatee/MEasyMate-Products`.
- A2Hub links to canonical runtime: `https://app.measymate.com/money/`.

### Caption Studio
- Excluded from A2Hub.
- No Caption Studio files or link are published by A2Hub.

## Safety Rules

- Commercial source modification from A2Hub work: FORBIDDEN
- Automatic A2Hub → Commercial sync: FORBIDDEN
- PRE_GIT_AUDIT required before commit/push
- PRE_RELEASE_AUDIT required before public release
- Secrets/API keys/tokens must not be stored in A2Hub
- Product data/storage schema must not be changed as a side effect of edition routing

## Release State

```text
REPORT_PRO_PERMANENT = PASS
CONTACT_SHIFT_PERMANENT = PASS
FACTORY_DAILY_RELOCATION = VERIFIED
MONEY_LOCAL_COPY = REMOVED
MONEY_CANONICAL_LINK = https://app.measymate.com/money/
CAPTION_STUDIO_A2HUB = EXCLUDED
A2HUB_HOME = PRODUCT_HUB
```
