# QR Attendance

Event attendance tracking via QR codes. Admins manage events and attendees; scanners check people in from their phone. Attendees get a unique QR by email and are marked present on scan.

## How it works

1. Admin creates an event and uploads an attendee CSV
2. System emails each attendee their unique QR code
3. Scanner staff log in and scan QR codes at the door
4. Dashboard shows live check-in stats; absent status is set automatically after the event ends

## Stack

Next.js 15 · PostgreSQL · Prisma · NextAuth · MUI · Docker

---

## Getting started

**Docker (recommended)**

```bash
cp .env.example .env
# fill in .env, then:
docker compose up --build
```

Visit `http://localhost:3000/setup` on first run to create your admin account.

**Local dev**

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

---

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Random 32-char string for NextAuth signing |
| `AUTH_URL` | Public URL of the app (e.g. `http://localhost:3000`) |
| `SMTP_MODE` | `console` to log emails, `smtp` to send them |
| `SMTP_HOST` | SMTP host |
| `SMTP_PORT` | SMTP port (usually 587) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SUPPORT_EMAIL` | Reply-to address shown in outgoing emails |
| `CRON_SECRET` | Secret for the hourly absent-marking cron |

---

## Roles

| Role | Access |
|---|---|
| `ADMIN` | Full dashboard — events, attendees, reports, user management |
| `SCANNER` | Scanner view only — check in attendees, view recent history |

---

## API

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/api/dashboard` | ADMIN | Stats and hourly check-in data |
| GET | `/api/attendees` | ADMIN | Paginated attendee list |
| POST | `/api/attendees/upload` | ADMIN | Preview or confirm CSV upload |
| POST | `/api/attendees/send-qr` | ADMIN | Send QR emails (all unsent or selected) |
| POST | `/api/attendees/[id]/regenerate-qr` | ADMIN | Issue new token and resend |
| POST | `/api/attendees/[id]/resend-qr` | ADMIN | Resend current QR |
| POST | `/api/scanner/checkin` | ADMIN, SCANNER | Validate QR and record check-in |
| GET | `/api/scanner/history` | ADMIN, SCANNER | Recent check-ins for current scanner |
| GET | `/api/reports` | ADMIN | Paginated report |
| GET | `/api/reports/export` | ADMIN | Export as CSV, Excel, or PDF |
| GET | `/api/cron/mark-absent` | cron | Mark non-present attendees absent after event ends |

---

## Deployment

**Docker** — `docker compose up --build` runs the app and Postgres together. Persistent data lives in the `pgdata` volume.

**Vercel** — `vercel.json` configures the hourly cron. Point `DATABASE_URL` at an external Postgres instance (Neon, Supabase, etc.) and set all env vars in the Vercel dashboard. Run `prisma migrate deploy` before first deploy.
