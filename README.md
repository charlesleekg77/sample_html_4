# jesperlandberg.com — rebuilt

A faithful, working clone of [jesperlandberg.com](https://jesperlandberg.com),
Jesper Landberg's motion-driven portfolio. Built from scratch with Vite, Vue 3,
three.js and Tailwind.

The original is a Nuxt site where almost everything you see — cards, images,
videos, even the text — is drawn through WebGL rather than laid out in the DOM.
This rebuild keeps that idea: the page is a normal, accessible document, and a
single WebGL pass mirrors the elements tagged `data-gl` on top of it.

## Run it

```bash
npm install
npm run dev      # http://localhost:12000
```

```bash
npm run build && npm run preview
```

## What's in it

| Route | What it is |
| --- | --- |
| `/` | The featured run: eight projects on a horizontal, draggable track. The intro (bio, awards, socials) sits over it; **Profile** toggles it. |
| `/full` | Every project by name. Hovering one previews its media. Featured projects link to a case study; the rest link out. |
| `/projects/:slug` | A case study: a white sheet with copy, credits and a vertically draggable media column. Drag the sheet sideways for the previous/next project. |
| `/newsletter` | The newsletter overlay with a working signup form. |

Interactions: kinetic drag, wheel and touch on the featured run; wheel/drag on
case-study media; sheet drag for prev/next; a loader, an intro curtain and
cross-fading page transitions.

## Content for non-browsers

Because the visual layer is WebGL, the site mirrors itself to Markdown:

- `/index.md`, `/full.md`, `/newsletter.md`, `/projects/<slug>.md`
- any route also answers `Accept: text/markdown`
- [`/llms.txt`](/llms.txt) describes the site for language models
- `/sitemap.xml` and `/robots.txt`

## How it works

- **`src/webgl/gl.js`** — one full-screen pass. Each `[data-gl]` element becomes
  a rounded, textured quad. Text is rasterised from the DOM (`syncText`), media
  is loaded as a CORS-enabled texture from DatoCMS/Mux. `data-gl-clip` clips a
  quad to an ancestor's box.
- **`src/lib/dragScroll.js`** — native scrolling is disabled; this class
  translates a track with inertia and snap.
- **`src/lib/store.js`** — the 23 projects and shared UI state.
- **`src/App.vue`** — chrome, overlays, loader, curtain.

See `AGENTS.md` for the layout conventions (the custom rem scale and the `s:`
breakpoint) and `jesperlandberg-build-prompt.md` for the full brief.

## Notes

Project media is served from the original site's CDN (DatoCMS and Mux) and
belongs to its respective owners. This is a study/reference rebuild, not the
official site.
