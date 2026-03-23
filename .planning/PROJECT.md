# n8n-nodes-etsy

## What This Is

An n8n community node package that integrates with the Etsy API v3, allowing n8n users to automate their Etsy shop workflows — managing shops, listings, orders (receipts), and reviews directly from n8n workflows.

## Core Value

Etsy sellers can automate their shop operations through n8n without writing code — the node handles OAuth2 token management transparently and exposes the most important Etsy API endpoints as simple n8n operations.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] OAuth2 credential type with clientId, accessToken, refreshToken fields
- [ ] Automatic token refresh on 401 with retry
- [ ] Shop resource: Get My Shop, Get Shop by ID
- [ ] Listing resource: Get All Active, Get, Create Draft, Update, Delete
- [ ] Receipt (Order) resource: Get All, Get, Update
- [ ] Review resource: Get All for Shop
- [ ] Programmatic node style with custom execute() method
- [ ] Zero runtime dependencies (n8n-workflow helpers only)
- [ ] Passes npm run lint with no errors
- [ ] OAuth helper script for initial token acquisition (PKCE flow)
- [ ] Etsy logo SVG icon
- [ ] Codex metadata (Etsy.node.json)
- [ ] GitHub Actions publish workflow for npm provenance
- [ ] Comprehensive README with credentials guide and trademark disclaimer

### Out of Scope

- n8n built-in OAuth2 flow — community nodes can't use it, manual token fields required
- Declarative node style — need custom token refresh logic in execute()
- Image/file upload endpoints — complex multipart, defer to v2
- Etsy webhook/push notification integration — Etsy doesn't offer webhooks
- Payment/billing endpoints — sensitive financial data, not needed for shop automation
- Etsy Ads / promoted listings API — niche, defer to v2

## Context

- **Ecosystem:** n8n community nodes are npm packages following the `n8n-nodes-*` naming convention. They're discovered via the `n8n-community-node-package` keyword.
- **Scaffolding:** Use `npm create @n8n/node@latest` to get correct project structure, linter config, and GitHub Actions workflow.
- **Auth model:** Etsy API v3 uses OAuth2 with PKCE. All requests need `Authorization: Bearer {token}` and `x-api-key: {clientId}` headers. Base URL: `https://openapi.etsy.com/v3`.
- **Token refresh:** POST to `https://api.etsy.com/v3/public/oauth/token` with `grant_type=refresh_token&client_id={clientId}&refresh_token={refreshToken}`.
- **Reference nodes:** Stripe and Shopify nodes in n8n's nodes-base package show the expected programmatic patterns.
- **Package details:** name: n8n-nodes-etsy, version: 0.1.0, author: Friedemann Frommelt, license: MIT.

## Constraints

- **No runtime deps**: n8n community node verification requires zero runtime dependencies — use only n8n-workflow built-in HTTP request helpers
- **TypeScript strict**: No `any` types where avoidable
- **Etsy trademark**: README must include: "The term 'Etsy' is a trademark of Etsy, Inc. This application uses the Etsy API but is not endorsed or certified by Etsy, Inc."
- **Programmatic style**: Must use `implements INodeType` with `execute()` method for custom token refresh logic

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Manual token fields instead of OAuth2 credential type | Community nodes can't use n8n's built-in OAuth2 flow | — Pending |
| Programmatic over declarative node style | Need custom 401 → refresh → retry logic in execute() | — Pending |
| Include OAuth helper script (scripts/get-tokens.mjs) | Users need a way to get initial access + refresh tokens via PKCE | — Pending |
| Use n8n CLI scaffolding | Gets correct structure, linter, GitHub Actions automatically | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-23 after initialization*
