# Deploying Uncharted Expedition to GitHub + Vercel

This guide walks you through pushing the skeleton to GitHub and deploying it to Vercel. The project is a standard Next.js 16 App Router app — no exotic build steps.

---

## 1. Prerequisites

- A free [GitHub](https://github.com) account.
- A free [Vercel](https://vercel.com) account (sign up with your GitHub account — they integrate natively).
- [Git](https://git-scm.com/downloads) installed on your machine.
- [Node.js 18+](https://nodejs.org/) and npm OR [Bun](https://bun.sh/) installed locally if you want to test before pushing.

---

## 2. Unzip the project locally

```bash
# Replace ~/projects with wherever you keep code
cd ~/projects
unzip uncharted-expedition.zip
cd uncharted-expedition
```

Verify it boots locally:

```bash
bun install          # OR: npm install
bun run dev          # OR: npm run dev
# open http://localhost:3000
```

You should see the landing page asking for Name / Department / Email.

---

## 3. Create a new GitHub repository

1. Go to <https://github.com/new>.
2. **Repository name:** `uncharted-expedition` (or whatever you like).
3. **Visibility:** Private (recommended) or Public.
4. **DO NOT** tick "Add a README", "Add .gitignore", or "Choose a license" — the zip already has all of these. Initializing an empty repo avoids merge conflicts.
5. Click **Create repository**.

GitHub will show you a screen like:

```
…or push an existing repository from the command line
git remote add origin https://github.com/<your-username>/uncharted-expedition.git
git branch -M main
git push -u origin main
```

Copy those commands — you'll use them in step 4.

---

## 4. Push the code to GitHub

From inside the unzipped project folder:

```bash
git init
git add .
git commit -m "Uncharted expedition skeleton — initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/uncharted-expedition.git
git push -u origin main
```

If you're asked for credentials:
- GitHub no longer accepts your account password for git over HTTPS.
- Use a [Personal Access Token](https://github.com/settings/tokens) (classic, with `repo` scope) as the password when prompted.
- Or set up SSH keys once and use the SSH remote URL instead: `git@github.com:<your-username>/uncharted-expedition.git`.

Refresh the GitHub repo page — you should see all your files.

---

## 5. Deploy to Vercel

1. Go to <https://vercel.com> and click **Sign Up** → **Continue with GitHub**.
2. Authorize Vercel to access your GitHub (you can scope it to just public repos or just this org).
3. Once logged in, click **Add New…** → **Project**.
4. Find `uncharted-expedition` in the GitHub import list and click **Import**.
5. Vercel auto-detects Next.js. The default settings are correct — leave them alone:
   - **Framework Preset:** Next.js
   - **Build Command:** `next build` (Vercel picks this up automatically from `package.json`)
   - **Output Directory:** `.next`
   - **Install Command:** `bun install` OR `npm install` (Vercel auto-detects Bun if `bun.lock` exists)
6. **Environment Variables** — the skeleton runs without any. Skip this section for now. (When seniors wire up MongoDB later, they'll add `MONGODB_URI` and `DB_NAME` here.)
7. Click **Deploy**.

Vercel runs `install` → `build` → deploys. The first deploy typically takes 1–3 minutes. When it's done you'll see a "Congratulations" screen with your live URL:

```
https://uncharted-expedition-<your-suffix>.vercel.app
```

Click it. The landing page should load.

---

## 6. Every-push deploys automatically

Once the initial deploy is done, Vercel watches your GitHub `main` branch. Every time you `git push origin main`:

1. Vercel starts a new build automatically.
2. Once the build succeeds, the new version goes live at the same URL.
3. The previous deploy stays available at a "preview" URL in case you need to roll back.

You can also open Pull Requests on GitHub — Vercel will build a preview deploy for each PR so reviewers can click a link to see the changes live.

---

## 7. Custom domain (optional)

1. In the Vercel dashboard → your project → **Settings** → **Domains**.
2. Add your domain (e.g. `expedition.yourdomain.com`).
3. Vercel shows you the DNS records to add at your registrar (Namecheap, GoDaddy, Cloudflare, etc.). Add them, wait 5–30 minutes for propagation, and you're live on your custom domain with automatic HTTPS.

---

## 8. Switching from the mock store to MongoDB later

When seniors are ready to wire up a real database, no code changes are needed in the UI/API routes — just:

1. Provision a MongoDB cluster (MongoDB Atlas free tier is fine).
2. Get the connection string (looks like `mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/`).
3. In Vercel → your project → **Settings** → **Environment Variables**:
   - `MONGODB_URI` = your connection string
   - `DB_NAME` = `uncharted-expedition` (or whatever you like)
4. Add `mongodb` to dependencies: `bun add mongodb` (locally, then commit & push — Vercel will pick it up).
5. Restore `src/lib/mongodb.ts` from the original Minecraft project (or write a fresh client — there's a reference shape in `src/lib/services.mongodb.ts`).
6. In `src/lib/services.ts`, replace each function body with the matching function from `src/lib/services.mongodb.ts`. Function signatures already match.
7. Push to `main`. Vercel rebuilds and the live site is now backed by MongoDB.

Optional: hit `POST /api/init` once after deploying to seed the labs + admin collections.

---

## 9. Common gotchas

- **`bun install` fails on Vercel:** Vercel supports Bun out of the box. If for some reason it doesn't, just delete `bun.lock` and let Vercel fall back to npm — `package.json` is npm-compatible.
- **Build fails with "Cannot find module X":** Make sure you committed `package.json` and the module is listed in `dependencies` (not just `devDependencies`). Re-run `bun install` locally and commit the updated `bun.lock`.
- **Locally works, Vercel build fails:** Check the Vercel build log. The most common cause is a TypeScript error that the dev server tolerates but `next build` does not. Run `bun run lint` locally to catch these before pushing.
- **Environment variable not picked up:** After adding env vars in Vercel settings, you must **redeploy** for them to take effect. Easiest: push an empty commit `git commit --allow-empty -m "trigger redeploy"` and `git push`.
- **404 on direct navigation to a sub-route (e.g. `/expedition/a`):** Shouldn't happen with App Router, but if it does, make sure you didn't accidentally enable `output: 'export'` in `next.config.ts`. The skeleton doesn't — leave it as-is.

---

## Quick reference — the 4 commands you'll actually run

```bash
# 1. unzip
unzip uncharted-expedition.zip && cd uncharted-expedition

# 2. install + run locally to verify
bun install && bun run dev

# 3. init git + push to GitHub
git init && git add . && git commit -m "Uncharted expedition skeleton"
git branch -M main
git remote add origin https://github.com/<your-username>/uncharted-expedition.git
git push -u origin main

# 4. on vercel.com → New Project → Import the GitHub repo → Deploy
```

That's it. Live in under 5 minutes.
