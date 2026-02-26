# Plan: Framer Motion on Southern Tree & Renovations

**Goal:** Use **Framer Motion** (the React animation library) to add polish and depth to the home page while staying minimalistic and performant.

**Scope:** Public SEO home page only (`app/app/page.tsx` and related components). Dashboard, login, and admin flows stay unchanged.

---

## 1. What we’re using

- **Library:** `framer-motion` (or `motion` – same maintainer, [motion.dev](https://motion.dev)).
- **Next.js:** Use **LazyMotion** + `domAnimation` so only the animation features you use are loaded (smaller bundle).
- **Principle:** Animations support content and CTAs; they don’t dominate. Prefer fade/slide and light stagger over flashy effects.

---

## 2. Suggested animations (minimal but effective)

| Area | Animation | Rationale |
|------|-----------|-----------|
| **Hero** | Fade-in + slight upward motion for title, tagline, and buttons; optional stagger between lines | Strong first impression without being loud. |
| **Services grid** | Cards fade in and move up slightly when they enter viewport (e.g. `whileInView`); optional stagger by index | Feels “built” as you scroll; keeps layout clean. |
| **Service area / About** | Section container fades in when in view | Reinforces section boundaries. |
| **Testimonial carousel** | Gentle crossfade or slide when changing reviews (in addition to or instead of instant swap) | Smoother transitions between quotes. |
| **Contact form** | Form container fade-in on scroll into view | Draws attention to CTA. |
| **Buttons / links** | Optional: light scale or opacity on hover/focus | Micro-interaction; use sparingly. |
| **Footer** | Optional: simple fade-in when in view | Keeps end of page feeling finished. |

**Out of scope for “minimal”:** Parallax, complex scroll-linked animations, auto-playing motion on every element.

---

## 3. Implementation approach

### 3.1 Install and provider

- Add dependency: `framer-motion` (or `motion`).
- Wrap animated parts in **LazyMotion** with `domAnimation` so tree-shaking works and bundle stays small.

### 3.2 Keep the home page a Server Component

- Leave `app/app/page.tsx` as a Server Component (metadata, JSON-LD, static structure).
- Introduce small **client** components only where motion is needed:
  - e.g. `<AnimatedHero>`, `<AnimatedSection>`, `<AnimatedServiceCards>`, `<AnimatedTestimonialCarousel>` (or wrap existing carousel).

### 3.3 Reusable building blocks

- **Variants:** One small file (e.g. `lib/motion-variants.ts` or `components/motion-variants.tsx`) with shared variants:
  - `fadeInUp`, `fadeIn`, `staggerContainer`, `staggerItem` (for staggered children).
- **AnimatedSection:** A client component that wraps children and runs a single “in view” animation (e.g. fade-in or fade-in-up). Reuse for hero, services, about, contact, footer as needed.
- **AnimatedCard:** Optional wrapper for service cards that uses `whileInView` + stagger index for the grid.

### 3.4 Specific components to touch

| Component | Change |
|-----------|--------|
| **Hero** | Wrap title, subtitle, and CTA in a client component that runs initial fade-in-up (and optional stagger). |
| **Services** | Wrap the list in a client component; each card gets `whileInView` + optional stagger. |
| **TestimonialCarousel** | Add `AnimatePresence` + motion to the current review block for a short fade or slide on change. |
| **Contact form section** | Wrap section content in `AnimatedSection` so it fades in when scrolled into view. |
| **Footer** | Optional: same `AnimatedSection` for consistency. |

### 3.5 Accessibility and performance

- **Reduce motion:** Use `prefers-reduced-motion: reduced` (Framer Motion supports this) so animations are disabled or simplified for users who prefer less motion.
- **No motion on critical content:** Don’t delay or obscure headings, CTAs, or form labels; keep animations short (e.g. 0.3–0.5s).
- **LazyMotion:** Use it everywhere you use `motion` so the client bundle stays small.

---

## 4. File checklist

| Action | File / location |
|--------|------------------|
| Add dependency | `app/package.json` → `framer-motion` (or `motion`) |
| Shared variants | `app/lib/motion-variants.ts` or `app/components/motion-variants.tsx` |
| Animated hero | New `app/components/home/animated-hero.tsx` (client) |
| Animated section | New `app/components/home/animated-section.tsx` (client) |
| Animated services | New `app/components/home/animated-service-cards.tsx` (client) or wrap current list |
| Testimonial carousel | `app/components/testimonial-carousel.tsx` – add motion to active review block |
| Home page | `app/app/page.tsx` – use the new animated wrappers; keep metadata and JSON-LD in server component |

---

## 5. Example variant set (minimal)

```ts
// Concept only – implement in your variants file
export const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};
export const staggerContainer = {
  visible: { transition: { staggerChildren: 0.08 } },
};
export const staggerItem = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } };
```

Use with `transition: { duration: 0.4 }` (or similar) and `whileInView` / `initial` / `animate` as needed.

---

## 6. Order of work

1. Install Framer Motion and add LazyMotion wrapper where needed.
2. Add shared variants and `AnimatedSection` (and optionally `AnimatedHero`).
3. Wire hero and one section (e.g. services) to confirm approach and reduced-motion behavior.
4. Roll out to remaining sections (about, testimonials, contact, footer).
5. Add testimonial transition and any button hover polish last.

---

## 7. Result

- **More robust:** Sections and CTAs feel more intentional and “built” as you scroll.
- **More detailed:** Stagger and in-view cues add depth without extra copy or layout.
- **Still minimalistic:** No heavy motion, no parallax, short durations; respects reduced motion and keeps the current clean layout and SEO (metadata, JSON-LD, structure) intact.

If you want to proceed, the next step is implementing step 1 and 2 (install + variants + one animated section) and then iterating from there.
