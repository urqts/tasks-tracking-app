# Deployment guide — TaskFlow on Vercel + Supabase (free tier)

This walks through a production deploy end to end.

---

## 1. Create the Supabase project

1. Go to https://supabase.com → **New project**. Pick a region close to your users and set a strong database password (save it).
2. Once provisioned, collect credentials:
   - **Settings → API**: `Project URL`, `anon public` key, `service_role` key.
   - **Settings → Database → Connection string**:
     - **Transaction pooler** (port `6543`) → use for `DATABASE_URL`. Append `?pgbouncer=true&connection_limit=1`.
     - **Session / direct** (port `5432`) → use for `DIRECT_URL` (Prisma migrations need a direct connection).

## 2. Create the Storage bucket

Storage → **New bucket** → name `attachments` → keep **private**. The app serves files through short-lived signed URLs, so public access isn't needed.

## 3. Apply the database schema

From your machine, with `.env` filled in:

```bash
npx prisma migrate deploy   # applies committed migrations
# first time only, to create the initial migration:
npx prisma migrate dev --name init
```

## 4. (Recommended) Enable Row Level Security

The app already scopes every query by `userId`, but enabling RLS protects the database directly. In the Supabase SQL editor, for each app table enable RLS and add owner policies, e.g. for `tasks`:

```sql
alter table tasks enable row level security;

create policy "Users manage their own tasks"
  on tasks for all
  using (auth.uid() = "userId")
  with check (auth.uid() = "userId");
```

Repeat for `projects`, `categories`, `tags`, `subtasks`, `attachments`, `reminders`, `notifications`, `activity_logs`, `recurring_tasks`, `settings`, and `task_tags` (join via its task). The cron job uses the service-role key and bypasses RLS by design.

## 5. Deploy to Vercel

1. Push the repo to GitHub/GitLab.
2. Vercel → **New Project** → import the repo. Framework preset: **Next.js**.
3. **Environment Variables** — add all of these (from `.env.example`):

   | Variable | Notes |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | server only |
   | `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | `attachments` |
   | `DATABASE_URL` | pooled (6543) + `pgbouncer=true&connection_limit=1` |
   | `DIRECT_URL` | direct (5432) |
   | `NEXT_PUBLIC_APP_URL` | your production URL, e.g. `https://taskflow.vercel.app` |
   | `RESEND_API_KEY` | optional, for email |
   | `EMAIL_FROM` | optional, verified sender |
   | `CRON_SECRET` | long random string |

4. The `build` script runs `prisma generate` automatically. Deploy.

## 6. Point Supabase Auth at production

Authentication → **URL Configuration**:
- **Site URL**: your production URL.
- **Redirect URLs**: add `https://YOUR-DOMAIN/auth/callback` (and `http://localhost:3000/auth/callback` for local dev).

## 7. Scheduled jobs (recurring tasks + email reminders)

`vercel.json` already declares a daily cron at 07:00 UTC hitting `/api/cron`. Vercel Cron automatically sends the `Authorization: Bearer <CRON_SECRET>` header when `CRON_SECRET` is set as an env var, which the route validates.

- Adjust the time by editing the `schedule` (standard cron syntax) in `vercel.json`.
- Test manually:

  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR-DOMAIN/api/cron
  ```

  Response: `{ "ok": true, "recurringTasksCreated": N, "emailsSent": M }`.

> Note: Vercel Hobby allows cron jobs but limits frequency. Daily is well within limits. For more frequent reminders, upgrade or trigger `/api/cron` from an external scheduler (GitHub Actions, cron-job.org) with the same bearer header.

## 8. Email (optional)

1. Create a https://resend.com account, verify a domain, and create an API key.
2. Set `RESEND_API_KEY` and `EMAIL_FROM` (e.g. `TaskFlow <notify@yourdomain.com>`).
3. If unset, the app skips sending gracefully — everything else still works.

---

## Post-deploy checklist

- [ ] Register a user; confirm the verification email flow works (or disable confirmation for testing).
- [ ] Create a task, project, category, and tag.
- [ ] Drag a card on the board and reschedule one on the calendar.
- [ ] Upload an attachment and download it.
- [ ] Export tasks to `.xlsx` and `.csv`.
- [ ] Trigger `/api/cron` and confirm recurring generation / email.
- [ ] Toggle light/dark/system theme and notification preferences in Settings.

## Troubleshooting

- **Prisma can't reach the DB during migration** → you're using the pooled URL; migrations need `DIRECT_URL` (port 5432).
- **`Too many connections`** on Vercel → ensure `DATABASE_URL` includes `pgbouncer=true&connection_limit=1`.
- **Auth redirect loops / "auth_callback_failed"** → the `/auth/callback` URL isn't in Supabase Redirect URLs, or `NEXT_PUBLIC_APP_URL` is wrong.
- **Uploads fail** → bucket name mismatch with `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`, or RLS storage policies too strict.
