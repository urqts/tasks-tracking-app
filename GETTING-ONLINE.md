# Getting TaskFlow online — step by step

Goal: turn the app on your computer into a real website you can open from any phone or laptop, anytime. It's free.

You'll do four things:
1. Make sure Supabase is set up (database + keys)
2. Put your code on GitHub
3. Deploy on Vercel
4. Connect Supabase auth to your live URL

Take it slowly — each step is just copy/paste and clicking buttons.

---

## Before you start — a checklist

You need these ready. If any are missing, do them first.

- [ ] A Supabase project exists (you created it at supabase.com)
- [ ] You created the `attachments` bucket in Supabase → Storage
- [ ] You ran `npx prisma db push` once so the database tables exist
- [ ] The app runs locally with `npm run dev` (optional but reassuring)
- [ ] You have your Supabase values handy (we'll list them in Step 3)

---

## Step 1 — Create free accounts

1. **GitHub** — go to https://github.com → Sign up (free). GitHub stores your code.
2. **Vercel** — go to https://vercel.com → Sign Up → **Continue with GitHub**. This links the two automatically.

That's it for accounts.

---

## Step 2 — Put your code on GitHub

The easiest way (no command line): **GitHub Desktop**.

1. Download GitHub Desktop: https://desktop.github.com → install → sign in with your GitHub account.
2. In GitHub Desktop: **File → Add Local Repository**.
3. Choose your `taskflow` folder.
4. It will say "this isn't a git repository — create one?" → click **Create a repository**.
5. Leave the defaults and click **Create Repository**.
6. You'll see a list of files. At the bottom left, type a message like `first commit` and click **Commit to main**.
7. Click **Publish repository** at the top.
   - **Important:** keep **"Keep this code private"** checked (so your keys stay private).
   - Click **Publish repository**.

Your code is now on GitHub. ✅

> Note: the `.gitignore` file already prevents your `.env` (with secrets) and `node_modules` from being uploaded — good. Your secrets stay on your machine; you'll add them to Vercel separately in Step 4.

---

## Step 3 — Gather your environment values

Open your local `.env` file (or grab fresh values from Supabase). You'll need all of these in the next step. Keep this list open in a separate window.

From **Supabase → Settings → API**:
- `NEXT_PUBLIC_SUPABASE_URL` — Project URL (e.g. `https://abcd.supabase.co`, no trailing slash)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon public key
- `SUPABASE_SERVICE_ROLE_KEY` — service_role secret key

From **Supabase → Connect button (top bar) → ORMs / Prisma**:
- `DATABASE_URL` — Transaction pooler, port 6543 (keep `?pgbouncer=true&connection_limit=1`)
- `DIRECT_URL` — Session/direct, port 5432

Set by you:
- `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` = `attachments`
- `NEXT_PUBLIC_APP_URL` — leave blank for now; you'll fill it in Step 5 once you know your Vercel URL
- `CRON_SECRET` — make up a long random string (e.g. mash your keyboard: `k39fj20fjxq8r7whe...`)
- `RESEND_API_KEY` and `EMAIL_FROM` — optional, leave blank unless you set up email

---

## Step 4 — Deploy on Vercel

1. Go to https://vercel.com → **Add New… → Project**.
2. Under "Import Git Repository," find **taskflow** and click **Import**.
   - If you don't see it, click "Adjust GitHub App Permissions" and give Vercel access to the repo.
3. Vercel detects **Next.js** automatically — don't change the framework or build settings.
4. Expand the **Environment Variables** section. Add each variable from Step 3:
   - Name = the left side (e.g. `NEXT_PUBLIC_SUPABASE_URL`)
   - Value = your actual value
   - Add all of them, one per row. (You can skip `RESEND_API_KEY`/`EMAIL_FROM` if not using email.)
   - For `NEXT_PUBLIC_APP_URL`, put a placeholder for now like `https://temp.vercel.app` — we fix it in Step 5.
5. Click **Deploy**.
6. Wait 1–3 minutes. When it finishes you'll see "Congratulations" and a link like `https://taskflow-xxxx.vercel.app`.

Don't celebrate yet — log in won't work until Step 5.

---

## Step 5 — Connect Supabase auth to your live URL

Your app now has a real URL. Two quick updates make login work.

**A. Update the app URL variable**
1. Copy your Vercel URL (e.g. `https://taskflow-xxxx.vercel.app`).
2. In Vercel → your project → **Settings → Environment Variables**.
3. Find `NEXT_PUBLIC_APP_URL`, edit it to your real Vercel URL, save.
4. Go to **Deployments** tab → click the latest deployment's **⋯ menu → Redeploy** (so the new value takes effect).

**B. Tell Supabase to trust that URL**
1. Supabase dashboard → **Authentication → URL Configuration**.
2. **Site URL**: paste your Vercel URL.
3. **Redirect URLs**: click Add and enter:
   - `https://taskflow-xxxx.vercel.app/auth/callback`
   - (optional, for local dev) `http://localhost:3000/auth/callback`
4. Save.

---

## Step 6 — Try it!

1. Open your Vercel URL on your phone or any browser.
2. Click **Get started**, register an account.
3. Check your email for the verification link, click it, then log in.
4. Create a task. 🎉 You're live and can use TaskFlow from anywhere.

> If you didn't get a verification email while testing, you can temporarily turn off email confirmation in Supabase → Authentication → Providers → Email, then log in directly.

---

## Step 7 (optional) — Daily reminders

The recurring-task generator and email reminders run on a schedule via `vercel.json` (already in your project). They work automatically once deployed **if** you set `CRON_SECRET` in Vercel (you did in Step 4). For email to actually send, add a Resend API key (see `DEPLOYMENT.md` → Email). Without it, browser notifications still work.

---

## Updating the app later

Whenever you change code:
1. In GitHub Desktop: write a commit message → **Commit to main** → **Push origin**.
2. Vercel automatically rebuilds and redeploys within a couple minutes.

That's the whole loop. Your live site always reflects what's on GitHub.

---

## If something goes wrong

| Symptom | Fix |
|---|---|
| Build fails on Vercel | Open the build log; usually a missing environment variable. Add it under Settings → Environment Variables and redeploy. |
| Login redirects in a loop / "auth_callback_failed" | `NEXT_PUBLIC_APP_URL` is wrong, or your `/auth/callback` URL isn't in Supabase Redirect URLs (Step 5). |
| "Too many connections" | `DATABASE_URL` must include `?pgbouncer=true&connection_limit=1`. |
| Tables don't exist / data errors | You skipped `npx prisma db push`. Run it locally once against your Supabase DB. |
| Uploads fail | The `attachments` bucket doesn't exist or its name doesn't match the env var. |
