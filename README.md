# PaperLoop

Campus paper-waste circular economy tracker, built for RVCE EEE DTL project.

## Structure

- `backend/` — Node.js + Express API, PostgreSQL database, JWT auth
- `frontend/` — React (Vite) dashboard, talks to the backend API
- `DEPLOYMENT.md` — **read this first.** Step-by-step guide to get this live on
  the internet, written for a team deploying a backend for the first time.

## What this is

A working prototype: real login per department (CSE, CSE-DS, CSE-CY, EEE), real
persistent database, real QR codes per department, live dashboard of paper waste
diverted with calculated environmental impact (trees/water/CO₂ saved).

## What this isn't (be upfront about this if asked)

- Not integrated with a real recycling partner yet — that's framed honestly in the
  UI as "pilot conversation in progress"
- No password-reset flow, no admin panel — out of scope for a 2-3 day build
- Department passwords are shared defaults (`paperloop2026`) seeded by a script,
  not self-service signup — fine for a pilot demo, not for a real multi-year rollout

## Local development

See `DEPLOYMENT.md` Steps 1-3 for backend setup, then:

```
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:4000`.
