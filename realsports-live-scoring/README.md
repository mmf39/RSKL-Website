# RealSports Live Draft Scoring (Standalone)

This is a separate website folder and does not modify your existing RSKL site.

## What it does

- You enter drafted players with their `realsports.io` API IDs.
- You define scoring rules (`stat path` + `points per unit`).
- The app fetches live player payloads and computes per-player + total points.
- The page auto-refreshes on your configured interval.

## Run

```bash
cd /Users/blake/Documents/New\ project/realsports-live-scoring
npm start
```

Open `http://localhost:5180`.

## Required API inputs

You must provide these in the UI:

1. API base URL (example: `https://api.realsports.io`)
2. Path template containing `{id}` (example: `/v1/players/{id}/stats/live`)
3. Optional API token

If your endpoint differs, just change the template.

## Preloaded test player

The default drafted player is preloaded as:

- Name: `@e3th1n`
- API ID: `DJ465ao3`

## Optional env vars

- `REALSPORTS_API_BASE`
- `REALSPORTS_API_KEY`

These are defaults. UI values override them.
