# Plan: SEO Home Page for Southern Tree Services (Memphis, TN)

**Goal:** When the Vercel URL loads, the home page is an SEO-optimized landing page targeting "Southern Tree Services" and tree service keywords in Memphis, TN. The existing dashboard (Settings, Actions, Jobs) remains available behind a separate route.

---

## 1. Route structure

| Route | Purpose | Audience |
|-------|---------|----------|
| `/` | **New home** – SEO landing for Southern Tree Services, Memphis TN | Public, search engines |
| `/dashboard` (or `/app`) | Existing control panel (Settings, Actions, Jobs) | You / internal |

- Move current dashboard from `/` to `/dashboard` (or `/app`).
- New `/` = marketing/landing page with hero, services, area, CTA, and full SEO treatment.

---

## 2. SEO strategy

### Primary keywords (Memphis + tree services)

- **Head:** Southern Tree Services, tree service Memphis TN, Memphis tree service  
- **Body:** tree removal Memphis, tree trimming Memphis, stump removal Memphis, emergency tree service Memphis, arborist Memphis TN  
- **Long-tail:** affordable tree removal Memphis TN, 24 hour tree service Memphis, tree cutting service near me Memphis  

### On-page SEO (must-have)

- **Title:** e.g. `Southern Tree Services | Tree Removal, Trimming & Stump Removal | Memphis, TN`
- **Meta description:** 150–160 chars, include primary keywords + Memphis TN + CTA (e.g. "Free estimate").
- **Canonical URL:** `https://your-vercel-domain.vercel.app/` (or custom domain).
- **H1:** One primary H1 (e.g. "Southern Tree Services – Tree Removal & Care in Memphis, TN").
- **H2/H3:** Clear sections (Services, Service Area, Why Choose Us, Contact) with keyword-rich headings.
- **URL:** Root `/`; add `/memphis-tree-service` or `/services` only if you want extra landing pages later.

### Technical SEO

- **Next.js metadata:** Use App Router `metadata` / `generateMetadata` for title, description, openGraph, twitter.
- **Structured data (JSON-LD):** `LocalBusiness` (name, address, area served, service type, phone if you want).
- **Sitemap:** `app/sitemap.ts` (or static `sitemap.xml`) with `/` and key pages.
- **Robots:** Allow indexing of `/` and marketing routes; optionally noindex `/dashboard` if you want it private.
- **Performance:** Keep LCP good (optimize images, minimal blocking JS) so Core Web Vitals support rankings.
- **Mobile:** Already responsive (Tailwind/ShadCN); ensure tap targets and text are friendly on small screens.

### Content sections (home page)

1. **Hero** – Headline (Southern Tree Services), subhead (Memphis TN + core services), primary CTA (Call / Free estimate).
2. **Services** – Short list: tree removal, trimming, stump removal, emergency service; each with a line of copy + keywords.
3. **Service area** – Memphis, TN and nearby (e.g. Germantown, Bartlett, Collierville) so search engines see geo terms.
4. **Why choose us** – 3–4 bullets (licensed/insured, free estimates, same-day emergency, etc.).
5. **CTA** – Phone number, “Free estimate,” or contact form / link.
6. **Footer** – Business name, “Memphis, TN,” optional address; link to dashboard only if you want it discoverable.

---

## 3. What to build (in order)

| Step | Task | Outcome |
|------|------|---------|
| 1 | Move current home (dashboard) to `/dashboard` | `/dashboard` = existing app; `/` free for new home |
| 2 | Create new `/` page: hero, services, area, why us, CTA, footer | Single SEO landing page |
| 3 | Add Next.js metadata (title, description, OG) for `/` | Rich snippets and share previews |
| 4 | Add JSON-LD LocalBusiness for Southern Tree Services, Memphis TN | Better local SEO |
| 5 | Add `app/sitemap.ts` (and optional `robots.ts`) | Sitemap + crawl control |
| 6 | Copy pass: keyword-rich, Memphis-specific wording | On-page relevance |
| 7 | (Optional) Custom domain in Vercel + same URL in metadata/canonical | Branded URL for SEO |

---

## 4. Copy and messaging (guidelines)

- Use “Southern Tree Services” as the business name in title, H1, and footer.
- Use “Memphis, TN” (and neighborhoods/areas) in headings and body.
- Include “tree removal,” “tree trimming,” “stump removal,” “emergency tree service” in natural sentences.
- One clear CTA: “Free estimate” or “Call for same-day service” with a visible phone or contact link.
- Keep tone professional and local; avoid keyword stuffing.

---

## 5. Design (light/dark)

- Reuse existing ShadCN + Tailwind setup; keep light/dark support.
- Home page: clean, fast, mobile-first; hero with strong headline; sections with clear hierarchy.
- No need to change dashboard UI; only its route.

---

## 6. Optional later

- **More landing pages:** e.g. `/tree-removal-memphis`, `/stump-removal` for more long-tail keywords.
- **Blog:** `/blog` with local/seasonal posts (e.g. “When to trim oaks in Memphis”) for content SEO.
- **Reviews / schema:** Add `AggregateRating` and review snippets when you have them.
- **Google Business Profile:** Align NAP and site with GBP for local pack.

---

## 7. One-line summary

**Make `/` the SEO home for “Southern Tree Services” in Memphis, TN (hero, services, area, CTA, metadata, JSON-LD, sitemap); move the current dashboard to `/dashboard` so the app stays one Vercel project.**

If you want to proceed, next step is implementing Step 1 (route move) and Step 2 (new home page layout and sections).
