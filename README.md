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

## Deploy to GitHub

1. Unzip this folder.
2. Create a **new repository** for this trial (recommended: private while Irene reviews it).
3. Upload the contents of the folder so `index.html` is at the repository root.
4. Commit/push.

No build step is required.

## Deploy to Vercel from GitHub

1. In Vercel choose **Add New → Project**.
2. Import the GitHub repository.
3. Vercel should use **Framework Preset: Other** (the included `vercel.json` sets `framework` to `null`).
4. Leave the **Build Command blank**.
5. Use the repository root as the output/static directory (`.`) if Vercel asks.
6. Deploy.

Because this is plain HTML/CSS/JavaScript, there are no npm dependencies and no framework build to fail.

## Fastest Vercel trial option

Vercel also supports deploying static folders directly. You can drag the unzipped project folder into Vercel Drop and publish a shareable trial without creating a build pipeline first.

## Local preview

You can open `index.html` directly, or serve the folder with any basic static server.

Example with Python:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Smoke test

If Node.js is installed:

```bash
node tests/smoke.mjs
```

The smoke test checks that the required files exist and key links/content are present.

## Current public-practice details used in this trial

Source of truth used when preparing the trial: `https://www.moodandmindcentre.com/`

- Reception: 07 5573 2200
- Email: reception@moodandmindcentre.com
- Hope Island: Suite 8/8 Santa Barbara Road, Hope Island QLD 4212
- Upper Coomera: 15/90 Days Rd, Upper Coomera QLD 4209
- Public funding pathways shown by the practice: Medicare, NDIS, WorkCover, QPS, Private Health, Insurance Claims, Private Paying

Before turning this into a production client app, re-verify all practice information and have Irene approve the content, privacy model, integrations and release process.
