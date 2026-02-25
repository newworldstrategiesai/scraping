# Push this repo to GitHub

Your repo is initialized with one commit on branch `main`. Do this next:

## 1. Create a new repo on GitHub

1. Go to [github.com/new](https://github.com/new).
2. Choose a name (e.g. `scraping` or `lead-automation`).
3. **Do not** add a README, .gitignore, or license (you already have them).
4. Click **Create repository**.

## 2. Add remote and push

In your terminal, from the project folder:

```bash
cd /Users/benmurray/scraping

# Add your GitHub repo as remote (replace YOUR_USERNAME and YOUR_REPO with yours)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push
git push -u origin main
```

If you use SSH:

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 3. Deploy the dashboard (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
2. **Add New Project** → **Import** your GitHub repo.
3. Set **Root Directory** to `app` (so Vercel builds the Next.js app).
4. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
5. Deploy. Then run `app/supabase/schema.sql` in Supabase if you haven’t already.

Done. Your dashboard will be live; jobs stay pending until you add a worker (see `PLAN_FRONTEND_VERCEL_SUPABASE.md` Phase 2).
