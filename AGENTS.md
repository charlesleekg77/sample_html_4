# AGENTS.md

## What this is

A faithful, from-scratch clone of <https://jesperlandberg.com> — Jesper
Landberg's portfolio. The original is a Nuxt app whose every visible thing is
drawn through WebGL; this rebuild keeps the same architecture in plain
Vite + Vue 3, with three.js providing the GL layer.

The long-form brief lives in `jesperlandberg-build-prompt.md`. Read it before
changing anything structural — it documents the page inventory, the data shape,
the motion model and the original's DOM/CMS conventions.

## Commands

```bash
npm install        # deps
npm run dev        # dev server on :12000 (allowedHosts open for the proxy)
npm run build      # production bundle into dist/
npm run preview    # serve dist/ (same markdown + API middleware)
```

## Architecture

- `src/main.js` — app bootstrap, router mount.
- `src/router.js` — routes: `/` (featured run), `/full`, `/newsletter`,
  `/projects/:slug`.
- `src/App.vue` — shell: fixed chrome (logo / Profile / Featured / Full /
  Newsletter), the two overlays, the loader and the intro curtain. The intro
  doubles as the home hero: `state.profileOpen` is true on `/`.
- `src/webgl/gl.js` — the heart of the thing. Every `[data-gl]` element in the
  DOM is mirrored by a textured quad drawn in a single full-screen WebGL pass.
  Types: `card`, `simple` (media), `text` (DOM rasterised to a texture via
  `syncText`), `pill`, `bar`, `sheet`, `related`. Elements get their DOM
  text/background hidden (`html.gl-active` rules in `style.css`) only once GL is
  live, so the page is a plain readable document when WebGL is unavailable.
- `src/lib/dragScroll.js` — there is no native scroll on the site. This class
  translates one track element; pointer drag, wheel and touch all feed a single
  target offset that eases toward the rendered position, with momentum on
  release and optional snap-to-child.
- `src/lib/store.js` — project data (`src/data/projects.json`, generated from
  the real `_payload.json`) plus shared reactive UI state and site copy.
- `src/lib/mdServer.js` — dev/preview middleware serving the Markdown mirrors
  in `public/md/` and the `/api/subscribe` endpoint.

## Conventions

- Tailwind for layout, but the numeric scale is custom and matches the original
  in rem: `p-40` is 4rem, `text-45` is 4.5rem, `rounded-20` is 2rem, etc. The
  root font-size is 10px at desktop, 8px on small screens.
- The `s:` prefix is the small-screen breakpoint. This is inverted from the
  usual mobile-first convention: unprefixed classes are the desktop values.
- Media comes from DatoCMS (`datocms-assets.com`) and Mux
  (`image.mux.com` / `stream.mux.com`). Both send CORS headers, so they can be
  used directly as GL textures.
- Content is mirrored to Markdown on purpose. Every route answers
  `Accept: text/markdown`, and `/path.md` returns the same. Keep `public/md/`
  and `public/llms.txt` in sync when project data changes (`/tmp/genmd.py` was
  the generator).

## Gotchas

- GL quads are drawn in DOM order, so page transitions and overlays must call
  `gl.refresh()` after the DOM settles or the mirror lags a frame behind.
- `[data-gl-clip]` clips a GL quad to an ancestor's box (used by the case-study
  sheet's media column). The mask is computed in the fragment shader from
  `uCenter`, `uSize` and `uClip`.
- `DragScroll.destroy()` must be called on unmount and on axis change; it sets
  `_alive = false` to stop its rAF loop.
