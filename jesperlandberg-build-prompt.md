# Build Prompt — "Jesper Landberg" style motion/WebGL portfolio

You are a senior creative front-end engineer. Recreate a portfolio site with the
structure, motion language and WebGL layer described below. The site is a
**full-viewport, black-canvas, scroll-hijacking, drag-navigable, WebGL-mirrored**
experience built on **Nuxt + Vue + GSAP + three.js**, with content from a headless
CMS (DatoCMS). Follow the spec literally where values are given.

---

## 1. What the site is

A one-person design-engineer portfolio. Key facts shown on the site:

- Name: **Jesper Landberg** — Swedish design engineer.
- Positioning: "building visually rich, motion-driven websites."
- Credentials: **Awwwards Independent of the Year 2022 & 2024**; 77 awards
  (30× Awwwards, 40× FWA, 3× Webby, 2× Lovie).
- Contact: `jesper@alpacka.studio` (no rates published).
- Socials: Instagram, X, LinkedIn.
- The site itself is a WebGL piece. **All content is also served as Markdown**
  (see §11).

Routes (all required):

| Route | Purpose |
|---|---|
| `/` | Featured run — horizontal draggable carousel of 8 featured projects |
| `/full` | Full index — every project by name (23 projects), typographic wall |
| `/projects/[slug]` | Case study — white "sheet" over WebGL, vertical image scroll |
| `/newsletter` | Newsletter signup overlay (same shell, different content) |
| `/llms.txt`, `/index.md`, `/[page].md` | Plain-text mirrors of every page |
| `/sitemap.xml`, `/robots.txt` | SEO |

---

## 2. Tech stack (must match)

- **Framework:** Nuxt 3 / Vue 3 (SPA; `body` is `position: fixed; overflow: hidden`
  — the browser never scrolls).
- **Styling:** Tailwind CSS with a **fluid `rem` root** (see §3). A tiny custom CSS
  layer for `@font-face`, base resets and `.gl` canvas.
- **Animation:** GSAP + ScrollTrigger (used sparingly — most motion is custom rAF),
  `Flip`-style shared-element transitions.
- **WebGL:** three.js with a **DOM-mirroring** architecture (see §7), Basis/KTX2
  texture compression (`basis_transcoder` chunk present), optional Draco.
- **Video:** Mux (`stream.mux.com/.../high.mp4`, `image.mux.com/.../thumbnail.jpg`).
- **CMS:** DatoCMS assets (`www.datocms-assets.com/223669/...`) with `auto=format`.
- **Fonts:** one variable grotesk, self-hosted:
  `ABCDiatypePlusVariable.woff2`, `font-weight: 200 1000`, `font-display: swap`,
  family name `sans`. Fallback `sans, sans-serif`.

---

## 3. Global design tokens & CSS architecture

Reproduce this CSS foundation exactly:

```css
@font-face {
  font-family: sans;
  font-style: normal;
  font-weight: 200 1000;
  font-display: swap;
  src: url(/fonts/ABCDiatypePlusVariable.woff2) format("woff2-variations");
}

:root { --size: 390; }                 /* mobile "design width" */
@media (min-width: 650px) { :root { --size: 1500; } }  /* desktop */

/* Fluid root font-size: the whole layout scales from one number */
html {
  font-size: clamp(5px, 20px, 10 * 100vw / var(--size));
  -webkit-text-size-adjust: none;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body, html {
  position: fixed;
  inset: 0;
  width: 100%; height: 100%;
  min-height: 100%; max-height: 100%;
  overflow: hidden;
  touch-action: none;      /* we own all gestures */
}

body {
  background: #000;
  color: #fff;
  font-family: sans, sans-serif;
  font-size: 1.4rem;
  font-weight: 400;
  line-height: 1.4;
}

a { color: inherit; text-decoration: none; }
button { color: inherit; background: none; border: 0; cursor: pointer; font: inherit; }

.label { font-size: 1rem; font-weight: 500; text-transform: uppercase; }

html.grabbable { cursor: grab; }
html.grabbing, html.grabbing * {
  cursor: grabbing !important;
  user-select: none !important;
}

.gl { position: fixed; inset: 0; z-index: 10; pointer-events: none; }
.gl canvas { position: absolute; inset: 0; }
```

**Critical rule:** `1rem = clamp(...)` means the entire site is sized in `rem`.
Never use `px` for layout. Tailwind is configured with `rem`-based numeric
utilities (`text-14`, `text-18`, `text-30`, `text-35`, `text-45`, `size-25`,
`size-40`, `rounded-15`, `rounded-20`, `gap-x-20`, `inset-x-20`, `px-40`, etc.)
so `text-16` = `1.6rem`, `rounded-15` = `1.5rem`, `size-25` = `2.5rem`.

**Breakpoints:** base = mobile (<650px), `s:` = desktop (≥650px). Only two, mostly.

Palette:
- Background `#000`, foreground `#fff`.
- Light UI on white sheets: `#eee` chips, black text.
- Accent / "gold" detail: `#d9a441`.
- WebGL cards render the project's own imagery (Mux/DatoCMS), so per-project colour
  comes from the media, not a theme token.

---

## 4. Content / data model

Seed the CMS with these collections. Types matter.

```
Project {
  id, slug, featured (int|null), title, description (text),
  awards (int|null), link (url|null), outlined (bool),
  tags: [{ title, url|null }],          // e.g. year "2024", studio "Griflan"
  src, thumb, card,                     // image URLs (see below)
  width, height, alt,
  video (mp4|null),                     // Mux
  images: [{ src, thumb, card, width, height, alt, video }]
}
Site { favicon[], seo { siteName, titleSuffix, fallbackSeo { title, description } } }
```

Image URL conventions:
- DatoCMS: `https://www.datocms-assets.com/223669/<id>.jpg?auto=format&fit=max&w=1200`
  and crops `?auto=format&fit=crop&h=630&w=1200`.
- Mux thumbnail: `https://image.mux.com/<playbackId>/thumbnail.jpg?width=1200&height=630&fit_mode=crop`.
- Mux video: `https://stream.mux.com/<playbackId>/high.mp4`.

**Featured run (order matters):**
The Lookback, Nathan Riley, Dogelon Mars, Discoveryland, Griflan,
Book of Happiness, Casa Di Solare, Gil Huybrecht.

**Full index (all 23, this exact order):**
The Lookback, DoThings, 53 West 53, Ross Mason®, Vucko™, Ingrao,
111 West 57th Street, Better Off®, Techspeed, Nathan Riley, Dogelon Mars,
Discoveryland, Griflan, Book of Happiness, Chris Wilcock, David Lubofsky,
Casa Di Solare, Gil Huybrecht, Fivepathways, Energy Park, Outpost, Mew, Primland.

Featured projects link internally to `/projects/[slug]`; the rest link to the
client's external site.

Per-project detail (title / description / awards / live link / credits):

- **Nathan Riley** — 2023 — https://www.nrly.co/ — "Nathan is a UK-based digital
  creative specializing in art direction, surrealist 3D visuals, interactive
  experiences, and motion design."
- **Casa Di Solare** — Unseen, 2024 — 4 awards — https://casadisolare.com/
- **The Lookback** — BetterOff® Studio, 2026, Gil Huybrecht — 3 awards —
  https://tlb.betteroff.studio/ — `outlined: true`
- **Book of Happiness** — 2024, David Lubofsky — 4 awards —
  https://www.findworkhappiness.com/
- **Dogelon Mars** — Griflan, 2024 — 3 awards — https://dogelonmars.com
- **Gil Huybrecht** — 2026, Gil Huybrecht — 1 award — https://gilhuybrecht.com
- **Discoveryland** — Outpost, 2026 — https://discoverylandco.com/
- **Griflan** — 2026 — 3 awards — https://griflan.com

Homepage profile copy (rendered as WebGL text over the black canvas):
> "Jesper Landberg, Swedish design engineer, named Awwwards Independent of the
> Year in 2022 and 2024, building visually rich, motion-driven websites. Usually
> lead or sole developer, responsible for front-end architecture, animation,
> interaction and CMS, alongside international agencies and creative teams."

> "77 awards — 30× Awwwards, 40× FWA, 3× Webby, 2× Lovie"

Newsletter copy:
> "An occasional newsletter with insights and thoughts from a design engineer,
> drawn from over a decade of freelancing."

---

## 5. Global shell (persistent chrome)

A fixed, `pointer-events-none` layer at `z-40`, white text, with
`-webkit-text-fill-color: transparent` (so WebGL text can be composited over it).
Padding `px-40 py-25` mobile → `s:px-80 s:py-40` desktop.

Top row (flex, space-between):
- Left: `<a href="/">Jesper Landberg</a>` (the wordmark).
- Right: a `Profile` **button** whose label toggles to `Close` when the profile
  overlay is open (`aria-expanded`).

Bottom row:
- Left: view switch — `Featured / Full` (`aria-label="Project views"`), current
  route at full opacity, the other at `opacity-50`, hover → `opacity-100`.
  The slash `/` sits between them.
- Right (absolute bottom-right): `Newsletter` **button** (`aria-expanded`).

Interaction affordance rule: every text control gets an invisible enlarged hit
area via `before:absolute before:-inset-15` (15rem larger on all sides).

Also fixed, centred:
- **Profile overlay** (`z-40`, `w-420` mobile → `s:w-600` desktop): intro
  paragraph + awards label (`opacity-60`) + social links (Instagram / X /
  LinkedIn / Email). Hidden by default, revealed when `Profile` is pressed.
- **Newsletter overlay** (`z-40`, same size): the newsletter paragraph + the form
  (see §9).

Loading state: a centred row of **three pill bars** `data-gl="bar"`
(`h-5 w-50 rounded-[2rem]`). The whole app sits under a `fixed inset-0 z-99 bg-black`
curtain that lifts when assets are ready. A `fixed inset-0 z-99 bg-black` layer is
the last child of the shell.

---

## 6. Pages

### 6.1 `/` — Featured run

Structure: `<main class="fixed inset-0 overflow-hidden">` containing:

1. **`sr-only` block** (SEO/a11y): `<h1>Jesper Landberg — design engineer</h1>`,
   the intro paragraphs, awards line, `<h2>Featured work</h2>` list of 8 linked
   titles + descriptions, `<h2>Elsewhere</h2>` list (Full index, Newsletter,
   Instagram, X, LinkedIn, email, llms.txt). This is real, crawlable DOM.

2. **Carousel track**:
   ```html
   <div class="absolute w-full left-0 top-0 s:top-1/2
               flex flex-col s:flex-row s:-translate-y-1/2
               gap-y-20 s:gap-x-10 px-20 s:px-0">
   ```
   Each project is:
   ```html
   <article class="relative w-full s:h-[43.5svh] s:max-h-[55rem] s:w-auto
                   flex-none cursor-pointer rounded-15 s:rounded-20"
            style="aspect-ratio: 2048 / 1172"
            data-id="nathan-riley" data-gl="card">
     <p class="pointer-events-none absolute bottom-10 inset-x-10 s:bottom-10 s:inset-x-20
               flex items-end justify-between">
       <span class="whitespace-nowrap text-16 s:text-18 tracking-[-0.05em]" data-title>Nathan Riley</span>
       <span class="invisible relative inline-flex size-25 items-center justify-center
                    rounded-full bg-black text-white" aria-hidden="true"></span>
     </p>
   </article>
   ```
   Use each project's real `aspect-ratio` (e.g. 2048/1172, 2048/1204, 1250/720,
   2048/1114, 3360/2200, 1196/720, 1372/1029, 1162/720).

   - **Desktop:** horizontal row; height `43.5svh` capped at `55rem`; width derived
     from aspect ratio. `gap-x-10`.
   - **Mobile:** vertical stack, `gap-y-20`, `px-20`.
   - The `article` itself is transparent — the pixels come from the WebGL card
     positioned over it. The black pill in the corner is the "visit" affordance.

3. **Drag/scroll navigation:** the track is dragged (pointer down → move → up) and
   responds to wheel. It has **velocity + damping/lerp** inertia, and **snaps** to
   the nearest card. Dragging adds `grabbable` / `grabbing` classes to `<html>`.
   `touch-action: none` on body. Clicking a card opens its case study via a page
   transition (§8). Hovering a card may show a black circular pill (the arrow),
   initially `invisible`, revealed on hover.

### 6.2 `/full` — Full index

`<main data-gl-shield class="fixed inset-0 overflow-hidden">`:

- `sr-only`: `<h1>Index — every project by Jesper Landberg</h1>` + intro.
- Centred typographic wall:
  ```html
  <div class="mx-auto flex min-h-full max-w-[42rem] s:max-w-[90rem]
              flex-wrap content-center items-center justify-center
              gap-x-24 gap-y-6 px-20">
  ```
  Each entry:
  ```html
  <span class="relative flex">
    <a href="/projects/the-lookback"
       class="pointer-events-auto cursor-pointer whitespace-nowrap
              text-18 s:text-30 leading-none tracking-[-0.05em]">The Lookback</a>
    <span class="pointer-events-none absolute left-full top-1/2 ml-12
                 -translate-x-1/2 -translate-y-1/2 text-8 leading-none"
          aria-hidden="true">●</span>
  </span>
  ```
- All 23 names in the order in §4. Internal links for featured, external for the
  rest. A tiny `●` bullet trails every item (last item has none).
- Motion: hovering an item reveals the project's WebGL thumbnail behind the type;
  the bullet may animate. Names fade/slide in on enter.
- A trailing spacer `<div class="h-200 w-0 rounded-20">` keeps the flex centring.

### 6.3 `/projects/[slug]` — Case study

`<main class="pointer-events-none fixed inset-0 z-20">`:

- **Sheet:** a white rounded panel over the WebGL canvas:
  ```html
  <div class="fixed inset-y-15 s:inset-y-20 inset-x-20 s:inset-x-50
              flex flex-col s:flex-row s:items-start gap-y-40 s:gap-x-100
              overflow-hidden rounded-15 px-10 s:pt-40 s:rounded-20 s:pl-40 s:pr-120"
       data-id="nathan-riley" data-gl="sheet">
  ```
- **Left column** (`s:flex-1`): `<h1>` title (`text-35 s:text-45 font-regular
  leading-none tracking-[-0.05em] text-black`), description
  (`text-14 s:text-16 tracking-[-0.035em] text-black`, max-width ~40rem), then a
  row of pills:
  - a black circular "visit" pill `data-gl="pill"` linking to the live site
    (`aria-label="Visit {title}"`),
  - tag chips `data-gl="pill"` on `#eee` (`h-[2em] px-[1.25em] rounded-full`),
    e.g. `2023`, or studio/year for others.
- **Right column** (`s:w-700 s:shrink-0`): vertical stack of media blocks
  `data-gl="simple"` with each image's `aspect-ratio`, `gap-y-30 s:gap-y-60`,
  `pb-80` (removed on hover so it can bleed). These scroll vertically with the
  same inertia model; the WebGL layer draws the images.
- **Close:** black circular pill `data-gl="pill"` `aria-label="Close project"`,
  absolute bottom-right mobile / top-right desktop.
- **Related panels:** two `data-gl="related"` white (`bg-white opacity-30`)
  rounded panels translated off-screen left/right
  (`translate-x-[calc((100%+9rem)*-1)]` etc.), each wrapping an `<a>` to the
  previous / next project. Dragging the sheet horizontally navigates between case
  studies (shared-element transition).

### 6.4 `/newsletter` — Signup

Same global shell. Content overlay contains the newsletter paragraph plus the form
(§9). Submitting posts the email to `/api/subscribe`; confirmation is by email.
Include a hidden honeypot `<input name="company" tabindex="-1" aria-hidden="true"
class="hidden">`.

---

## 7. WebGL layer — DOM mirroring (the heart of the site)

There is **no `<canvas>` in the markup** — `.gl` is an empty fixed div at `z-10`
into which three.js appends a full-viewport canvas. The DOM is the layout source of
truth; the WebGL layer draws **over** it, and the DOM elements are made invisible
with `-webkit-text-fill-color: transparent` (text) or fully transparent (cards),
while remaining in the accessibility tree and clickable.

Mark elements to be mirrored with `data-gl`:

| `data-gl` | Mirrors | Rendering |
|---|---|---|
| `text` | paragraphs, links, labels | SDF/texture text planes (crisp, animated) |
| `card` | carousel `<article>` | textured plane/video per card |
| `simple` | case-study media blocks | image/video planes, vertical scroll |
| `sheet` | case-study white panel | rounded plane (mask/rounded rect) |
| `pill` | pills & circular buttons | rounded-rect / circle planes |
| `related` | prev/next panels | planes revealed on drag |
| `bar` | loading bars | animated rounded rects |
| `data-gl-shield` | containers whose children are mirrored | shields DOM, keeps hit areas |

Implementation requirements:

1. **Measure:** each frame (or on resize), read `getBoundingClientRect()` of every
   `data-gl` element, convert screen px → world units at the camera plane, and place
   a plane/sprite there.
2. **Render:** orthographic camera by default; the homepage uses a slight
   perspective/camera move for the intro. `outputColorSpace = sRGB`, sensible tone
   mapping, `RenderTarget` FBOs for effects.
3. **Media:** load Mux thumbnails / DatoCMS images as textures (Basis/KTX2 via
   `basis_transcoder`); `video` items use the Mux `high.mp4` and autoplay muted
   looped. Placeholder/skeleton state while loading, driven by the three loading
   `bar`s.
4. **z-order:** `.gl` at `z-10` sits above the black background but the
   `sr-only`/DOM content is at default flow; UI chrome is `z-40`; curtain `z-99`.
   The `sheet` plane must render above the media planes on case-study pages.
5. **Rounded corners:** round plane corners (SDF/alpha mask) to match `rounded-15`
   / `rounded-20` so WebGL cards match the DOM radii.
6. **Performance:** DPR cap (≤2), pause rAF when tab hidden, cap texture size,
   prefer `fit=max&w=1200` sources.

---

## 8. Animation & interaction model

- **No native scrolling.** `body` is fixed; all motion is transform-based.
- **Unified input:** pointer drag + wheel + touch swipe all feed one velocity value.
  Apply `lerp` toward a target with damping; add inertia on release; **snap** to
  nearest item (carousel) or nearest media block.
- **GSAP** for timelines, entrance reveals, and `Flip`-style shared-element
  transitions between a carousel card and its case-study sheet.
- **Page transitions:** intercept route change; play a timeline (card grows to
  sheet / sheet slides out), then commit the route. Hooks exist in the bundle as
  `page:transition:finish`, `transitionPromise`, `~transitionFinish`; also use the
  View Transitions API (`startViewTransition`) where supported, with a GSAP fallback.
- **Intro/loader:** three `bar`s animate; curtain (`z-99`) lifts; profile text
  fades in; the featured run settles into place.
- **Cursor:** `grab`/`grabbing` states via `<html>` classes during drag; hide
  selection while dragging.
- **Reduced motion:** honour `prefers-reduced-motion` — skip inertia/intro, use
  short cross-fades instead of flights.

---

## 9. Forms & API

`POST /api/subscribe` with `{ email }` (JSON or form-encoded). Validate email,
show status text in `role="status" aria-live="polite"` under the field
(`min-h-[1.2em]`, `opacity-60`). Disable the submit button while pending
(`aria-busy` on the form). Include the hidden `company` honeypot. The field is a
custom rounded input (placeholder "Email address", `opacity-40`) with a circular
submit button; both are also mirrored as `data-gl="pill"`/`text` planes.

---

## 10. Accessibility

- Keep the `sr-only` semantic content on every page (real `<h1>`, `<h2>`, `<ul>`,
  links). The visible WebGL text is decorative/composited; screen readers use the
  hidden DOM.
- Buttons/links keep real focusable elements with `pointer-events-auto`; the
  `data-gl-shield` pattern exists precisely so the DOM hit areas stay live under
  the canvas.
- `aria-expanded` on Profile / Newsletter toggles; `aria-label` on icon-only
  pills; `aria-live` for form status; `aria-current="page"` on the active view.
- Respect `prefers-reduced-motion`; ensure contrast (white on black, black on
  white sheet).

---

## 11. SEO + "content for non-browsers"

- Every route answers `Accept: text/markdown` with clean Markdown, and the same
  content is available at `<path>.md` (e.g. `/index.md`, `/full.md`,
  `/projects/nathan-riley.md`, `/newsletter.md`).
- Publish `/llms.txt` describing who this is, when to use it, the work list, and
  the contact email.
- Emit `link: <https://…/index.md>; rel="alternate"; type="text/markdown"` on HTML
  responses.
- `sitemap.xml` with priorities: `/` = 1.0, projects = 0.8, `/full` = 0.6,
  `/newsletter` = 0.4. `robots.txt` allows all and points to the sitemap + llms.txt.
- Meta: title `Jesper Landberg`; description "Swedish design engineer building
  visually rich, motion-driven websites. Two-time Awwwards Independent of the Year
  (2022 & 2024)."; OG/Twitter tags with a 1200×630 share image.

---

## 12. Suggested build order

1. Nuxt scaffold + Tailwind + fluid `rem` CSS + variable font + black shell.
2. DatoCMS models + seed data (§4) + `/api/subscribe`.
3. Global shell: wordmark, Profile/Newsletter overlays, view switch, loader bars.
4. WebGL bootstrap: `.gl` canvas, orthographic camera, DOM-measure → plane
   pipeline, `data-gl="text"` first, then `card`.
5. Featured run carousel: layout, drag/wheel inertia, snap, hover pill.
6. Full index: typographic wall + hover thumbnails.
7. Case study: sheet + vertical media scroll + prev/next drag + close.
8. Page transitions (GSAP Flip / View Transitions).
9. Markdown mirrors, llms.txt, sitemap, robots, OG images.
10. Perf pass (DPR, texture caps, rAF pausing), reduced-motion, a11y audit.

---

## 13. Acceptance criteria

- [ ] `body` never scrolls; all movement is transform/WebGL.
- [ ] Layout is `rem`-based and scales fluidly between 390 and 1500 design widths.
- [ ] Homepage carousel drags with inertia and snaps; clicking opens the case study.
- [ ] `/full` shows all 23 projects in order; featured link internally, others out.
- [ ] Case studies show a white sheet, title/description/tags/visit pill, vertical
      media scroll, close pill, and prev/next drag.
- [ ] WebGL mirrors DOM text, cards, media, sheet, pills with matching rounded
      corners and correct z-order.
- [ ] Loader bars + black curtain intro plays once.
- [ ] Every route serves Markdown at `.md` and via `Accept: text/markdown`.
- [ ] `llms.txt`, `sitemap.xml`, `robots.txt`, OG meta present.
- [ ] Newsletter posts to `/api/subscribe` with status feedback + honeypot.
- [ ] `prefers-reduced-motion` respected; screen-reader content intact.
- [ ] 60fps on desktop, DPR-capped, rAF paused when hidden.

---

## 14. Reference inventory (captured)

- Pages: `/`, `/full`, `/newsletter`, 8× `/projects/*`.
- Assets: `ABCDiatypePlusVariable.woff2`; Nuxt chunks (`main` contains GSAP/three/
  Vue/Nuxt/DatoCMS; separate chunks contain three.js renderer, Basis/KTX2, Draco).
- Media: Mux playback IDs + DatoCMS asset IDs per project (see §4).
- Framework signals: Nuxt 3 + Vue 3, Tailwind (fluid rem), GSAP + ScrollTrigger +
  Flip, three.js + Basis/KTX2 (+Draco), Mux, DatoCMS.
