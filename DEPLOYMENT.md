# PaperLoop — Deployment Runbook

Follow these steps **in order**. Each one builds on the last. Budget ~1.5-2 hours
the first time, mostly waiting on free-tier services to spin up.

---

## STEP 0 — Push code to GitHub

You need a GitHub repo because Render and Vercel both deploy by connecting to GitHub.

1. Create a new repo on github.com (e.g. `paperloop`)
2. From the `paperloop-fullstack` folder on your machine:
   ```
   git init
   git add .
   git commit -m "Initial PaperLoop commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/paperloop.git
   git push -u origin main
   ```

**Important:** make sure `.env` (not `.env.example`) is never committed. Check there's
a `.gitignore` with `.env` and `node_modules` in it (one is included in this project).

---

## STEP 1 — Create the database (Supabase)

1. Go to supabase.com → sign up (free) → "New project"
2. Name it `paperloop`, set a database password (write it down somewhere safe)
3. Wait ~2 minutes for it to provision
4. Go to **Project Settings → Database → Connection string**
5. Choose the **"Connection pooling"** tab (not direct connection), copy the URI —
   it looks like:
   `postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres`
6. Replace `[YOUR-PASSWORD]` with the actual password you set in step 2
7. **Save this full string** — you'll need it twice (locally and on Render)

---

## STEP 2 — Initialize the database tables

On your own laptop, in the `backend` folder:

```
cd backend
npm install
cp .env.example .env
```

Open `.env` and paste in:
- `DATABASE_URL` = the connection string from Step 1
- `JWT_SECRET` = any random long string (or run `openssl rand -hex 32` in terminal)

Then run:
```
npm run init-db
```

You should see output ending in something like:
```
Done. All departments use the password: paperloop2026
Login codes: cse, cse_ds, cse_cy, eee
```

**If this fails:** double check the DATABASE_URL has no typos and the password is
correct. Copy-paste errors here are the #1 cause of failure.

**Change the default password** before your actual presentation — open
`backend/src/initDb.js`, change `DEFAULT_PASSWORD`, delete the rows in the
`departments` table in Supabase's Table Editor, and re-run `npm run init-db`.

---

## STEP 3 — Test the backend locally

Still in `backend`:
```
npm run dev
```
You should see `PaperLoop backend running on port 4000`.

Open a new terminal tab and test:
```
curl http://localhost:4000/api/health
```
Should return `{"status":"ok",...}`.

Test login:
```
curl -X POST http://localhost:4000/api/login -H "Content-Type: application/json" -d "{\"code\":\"eee\",\"password\":\"paperloop2026\"}"
```
Should return a `token` and `department` object. **If this fails, fix it before
deploying** — deploying a broken backend just wastes more time.

---

## STEP 4 — Deploy the backend (Render)

1. Go to render.com → sign up (free) → "New +" → "Web Service"
2. Connect your GitHub repo, select it
3. Settings:
   - **Root directory**: `backend`
   - **Build command**: `npm install`
   - **Start command**: `npm start`
   - **Instance type**: Free
4. Add environment variables (same as your local `.env`):
   - `DATABASE_URL` = your Supabase connection string
   - `JWT_SECRET` = same secret you used locally
5. Click "Create Web Service" and wait (~3-5 min first deploy)
6. Once live, copy the URL Render gives you, e.g. `https://paperloop-xxxx.onrender.com`
7. Test it: visit `https://paperloop-xxxx.onrender.com/api/health` in your browser —
   should show the same JSON as your local test

**Free tier note:** Render's free web services sleep after 15 minutes of no traffic
and take ~30-60 seconds to wake up on the next request. Open the URL a minute before
your demo starts so it's already awake.

---

## STEP 5 — Deploy the frontend (Vercel)

1. Go to vercel.com → sign up (free) → "Add New" → "Project"
2. Import your GitHub repo
3. Settings:
   - **Root directory**: `frontend`
   - **Framework preset**: Vite (should auto-detect)
4. Add environment variable:
   - `VITE_API_URL` = your Render backend URL from Step 4 (no trailing slash)
5. Click "Deploy", wait ~1-2 min
6. You'll get a live URL like `https://paperloop-yourname.vercel.app`

---

## STEP 6 — Final end-to-end test

Open your live Vercel URL on your phone AND your laptop at the same time.

1. Log in as `eee` / `paperloop2026` on laptop
2. Log a waste entry
3. Refresh — it should still be there
4. Open the same URL on your phone (or have a teammate open it) — you should see
   the same data, because it's a shared real database now

If any step fails, check Render's "Logs" tab — it shows live server errors, which
is the fastest way to debug a deployed backend.

---

## Common issues

| Symptom | Likely cause |
|---|---|
| Render deploy fails | Wrong root directory, or missing env vars |
| `/api/health` works but `/api/login` doesn't | DATABASE_URL wrong, or `npm run init-db` was never run against that DB |
| Frontend loads but login always fails | `VITE_API_URL` not set on Vercel, or missing `https://` |
| "Failed to fetch" in browser console | Backend is asleep (free tier) — wait 30s and retry, or CORS issue (shouldn't happen, CORS is open in this backend) |
| Works locally, not on Vercel | Forgot to redeploy after adding env var — Vercel needs a redeploy to pick up new env vars |
