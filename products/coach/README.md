# MEasyMate Coach — A2Hub Team Trial Source

This folder contains the A2Hub Coach source.

Security:
- No DeepSeek/API provider key is stored here.
- No MEasyMate AI Hub access token is stored here.
- `team-trial-config.js` is private runtime material and MUST NOT be committed.
- Public/source build falls back to Offline Core when AI is not configured.

Team Trial target:
- shared license/team entitlement
- 1,000,000 token quota (configured on MEasyMate AI Hub, not here)
- shared usage shown from `/v1/ai/status`
- Focus Mode hides unrelated home controls while a case is active

Backend/source boundary:
- AI Hub backend remains in `pormatee/measymate-ai-hub`.
- A2Hub stores the Coach product/UI edition only.
