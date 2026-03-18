# UMaT Marketplace (Private)

UMaT Marketplace is a private multi-platform campus commerce product for student buying, selling, trust, and operations.

## Product Scope

- Cross-platform marketplace: web + mobile with a shared backend.
- Buyer flow: discover listings, chat with sellers, save items, checkout, order tracking, notifications.
- Seller flow: create/edit listings, onboarding wizard, analytics, coupons, bundles, campaigns, bulk actions.
- Admin flow: moderation queue, dispute center, ops retry jobs, audit logs, growth analytics.

## Core Capabilities

- Marketplace intelligence:
  - recommendations
  - price insights and smart pricing assistance
  - social proof surfaces (sold feed, top sellers)
- Growth tooling:
  - campaign scheduling with A/B slots
  - coupon and bundle tooling
  - bulk listing operations and advanced CSV import with preview
- Trust and safety:
  - dispute workflows
  - trust signal tracking (identity/safe meetup/scam flags)
  - profile completion gates for sensitive actions
- Messaging:
  - real-time chat via sockets
  - quick replies, offer objects, and attachment metadata
- Push and engagement:
  - web push + Expo push subscription pipeline
  - deep-link handling for notification taps

## System Layout

- `web/` — React + Vite client
- `server/` — Express + TypeScript API
- `mobile/` — Expo React Native app
- `shared/` — shared contracts/utilities

## Notes

- This repository is maintained for private product development.
- Public setup and distribution instructions are intentionally omitted.
