# Team Profiles — ServiceNow-backed

A responsive team-profile page (accordions, search, rating-based sort, QR codes,
day/night theme) that reads/writes a ServiceNow custom table.

## Why there's a proxy

The browser can't call ServiceNow directly — cross-origin requests are blocked by
CORS, and credentials must not live in client-side HTML. `team-profiles-proxy.js`
is a tiny zero-dependency Node server that holds the credentials server-side,
serves `index.html`, and forwards API calls to ServiceNow with Basic auth.

## Run

1. Put your credentials in `servicenow-config.json` (copy from
   `servicenow-config.example.json`). This file is git-ignored.
2. Start the proxy:
   ```
   node team-profiles-proxy.js
   ```
3. Open **http://localhost:3000** (open it from the proxy, *not* the file directly,
   or the API calls won't work).

## How it maps to ServiceNow

- Table: `x_palni_servicen_1_team_profiles`
- Field mapping lives in `SN_FIELDS` in `index.html`. The first name in each array
  is the column used when writing (add/edit); the rest are read fallbacks.
- **Profile picture** and **resume** are stored as *attachments* on each record.
  The proxy serves them at `/api/image?sysId=…` and `/api/resume?sysId=…`.
- **Rating** is computed in the browser from experience, certifications, trainings,
  implementations and skills — it is not read from ServiceNow.

## Endpoints (all proxied, Basic auth added server-side)

| Method | Path                        | ServiceNow action            |
|--------|-----------------------------|------------------------------|
| GET    | `/api/team-profiles`        | list records                 |
| POST   | `/api/team-profiles`        | create a member              |
| PATCH  | `/api/team-profiles/:sysId` | update a member (e.g. photo) |
| DELETE | `/api/team-profiles/:sysId` | remove a member              |
| GET    | `/api/image?sysId=…`        | stream profile-picture attachment |
| GET    | `/api/resume?sysId=…`       | stream resume attachment     |
