# The Mood & Mind Centre — Client App Trial

A client-facing, mobile-first **trial/prototype** designed to show Irene what a dedicated Mood & Mind client app could feel like.

## What this ZIP contains

- Home/client dashboard
- Existing-client and new-client entry paths
- Appointment preview + secure portal links
- My Psychologist demo screen
- Hope Island / Upper Coomera / Telehealth locations
- Resources screen with search/filter demonstration
- Before My Session page
- Fees & Funding page
- Forms & Documents page that keeps sensitive work in the existing secure portal
- Contact page
- Local-device-only demo preferences
- Help Now screen
- Dark forest-green / mint visual system with subtle green fade animation

## Important: this is a trial, not a live clinical system

This version has **no server, no database and no live patient/client-record integration**. It does not collect clinical information. The appointment card is clearly marked as demonstration data.

Real booking/account actions are routed to Mood & Mind's current secure Zanda client portal. Do not add real clinical notes, assessments, therapy records or sensitive uploads to this trial.

## Repository and deployment

This repository has evolved into a **Vite + React** client-trial application. The current active platform direction is **GitHub + Cloudflare Pages**.

Cloudflare Pages settings:

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Install command: default npm install
- No production health/client database is authorised by this trial build

The root `_headers` file preserves the browser security headers previously carried by the legacy Vercel configuration.

Do not create a new Vercel deployment from this repository.

### Open production candidate

PR #1 (`production-client-v1`) is separate production work for a Cloudflare/Neon client companion. It remains **HOLD / DO NOT MERGE** because its required production check is currently RED. The failure is in dependency resolution and is not being bypassed as repository housekeeping.

## Local preview

You can open `index.html` directly, or serve the folder with any basic static server.

Example with Python:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Smoke test

For a local production build:

```bash
npm install
npm run build
```

The generated deployment output is `dist/`.

## Current public-practice details used in this trial

Source of truth used when preparing the trial: `https://www.moodandmindcentre.com/`

- Reception: 07 5573 2200
- Email: reception@moodandmindcentre.com
- Hope Island: Suite 8/8 Santa Barbara Road, Hope Island QLD 4212
- Upper Coomera: 15/90 Days Rd, Upper Coomera QLD 4209
- Public funding pathways shown by the practice: Medicare, NDIS, WorkCover, QPS, Private Health, Insurance Claims, Private Paying

Before turning this into a production client app, re-verify all practice information and have Irene approve the content, privacy model, integrations and release process.
