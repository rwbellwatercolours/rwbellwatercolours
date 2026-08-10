# Working on this site

A watercolour portfolio for Robert W. Bell. It is a **static site with no build step
and no dependencies** — plain HTML, one CSS file, one JS file. It has to stay
that way: the owner is not a developer, and the site needs to keep working and
stay free to host for years without maintenance.

## Who you're helping

The person editing this is the artist, not a programmer. They will describe
what they want in plain language ("add these four paintings", "change my email",
"put this one on the watercolours page too"). Do the work, then tell them in one
or two sentences what changed and how to see it. Don't hand them a task list.

## Ground rules

- **Never add a framework, bundler, package manager, or npm dependency.** No
  React, no Tailwind, no build step. If a request seems to need one, it doesn't
  — do it in vanilla HTML/CSS/JS.
- **Never fetch anything from a CDN or external host.** No web fonts, no
  analytics, no scripts. Everything must load from this folder.
- **Don't change the visual design** unless asked. The look is deliberately
  copied from a reference portfolio: black on white, one accent-free grotesque,
  generous gutters, uppercase letterspaced nav.
- Content changes go in `content/`. Behaviour changes go in `assets/js/site.js`.
  Layout changes go in `assets/css/site.css`. Adding a painting should only
  ever touch `content/artworks.js` and `images/`.

## Layout

```
index.html         Watercolours — front page, compact grid  body[data-page="watercolours"]
about.html         About                                    body[data-page="about"]
404.html           Not found
watercolours.html  Redirect stub to index.html — the grid used to live here,
                   so old links keep working. No content of its own.

content/site.js       window.SITE      — name, email, socials, About text
content/artworks.js   window.ARTWORKS  — the paintings
assets/js/site.js     builds header, footer, grid and lightbox from the above
assets/css/site.css   all styling
tools/                serve.py, add-images.py
```

Each page is a thin shell: `[data-header]`, `[data-content]`, `[data-footer]`.
`site.js` fills them in based on `body[data-page]`. To add a page, copy an
existing HTML file, give it a new `data-page`, and add a `render*` branch in
the `boot()` function plus an entry in the `NAV` array.

Scripts are loaded as ordinary `<script src>` tags (not modules) and the data
files assign to `window.*`. That's on purpose — it keeps the site to plain
files with nothing to build. A single page still opens straight off the disk
with `file://`, though the nav links between pages need a server (see the
note on extensionless URLs below).

## Adding paintings — the common request

An artwork entry:

```js
{
  src: "images/estuary-low-tide.jpg",   // always starts with "images/"
  width: 2048,                          // real pixel dimensions — required
  height: 1536,
  title: "Estuary, Low Tide",
  year: "2026",
  medium: '16" x 12"',                  // single quotes: it contains " marks
  watercolours: true,                   // show it on the Watercolours page
}
```

Steps:

1. Confirm the image files are in `images/`.
2. **Get the real pixel dimensions** — run `python3 tools/add-images.py` (no
   `--write`) to have it read and print them, or use `sips -g pixelWidth -g
   pixelHeight <file>`. Never guess: wrong numbers make the two columns
   unbalanced and the page jump while loading.
3. Add entries at the **top** of `window.ARTWORKS` (newest first).
4. If the artist gave a title/year/medium, use it. If not, leave `year` and
   `medium` as `""` rather than inventing details — they're optional and the
   caption adapts.
5. Set `watercolours: true` — there is only one grid now, and leaving it off
   means the painting never appears.

`python3 tools/add-images.py --write` does steps 2–3 automatically for every
image not yet listed, leaving the title guessed from the filename. Using it and
then editing the titles is usually faster than writing entries by hand.

## Checking your work

```bash
python3 tools/serve.py
```

Serves at http://localhost:4321. Verify the front page and the About page, and
that clicking a painting opens the lightbox. Confirm no broken images before
reporting done.

## Deploying

Hosted free on GitHub Pages from the `main` branch, root folder. Publishing is:

```bash
git add . && git commit -m "..." && git push
```

Only commit and push when asked. See README.md for the one-time setup.

## Things that are easy to get wrong

- All asset paths are **relative**, not root-absolute, so the site works when
  hosted in a subfolder (e.g. a GitHub project page). Keep it that way.
- Pages are linked **without the `.html`** — `about`, and `./` for the front
  page. The files on disk are still `about.html` etc.; GitHub Pages fills the
  extension in, and `tools/serve.py` does the same so the preview matches.
  A consequence: the nav links only work over a server, so preview with
  `serve.py` rather than opening the files with `file://`.
- The grid is packed by `packColumns()` in `site.js`, which balances column
  heights using each image's aspect ratio. It needs correct `width` and
  `height` on every artwork.
- The grid is four columns wide, dropping to three below 900px and two below
  640px, and re-renders on resize.
- Titles, years and mediums are optional and often empty — the artist adds
  them later. Never invent one. Do write an `alt` description of what the
  painting shows; it is the only text a screen reader gets.
- The grid deliberately shows images with **no** captions underneath —
  the title appears on hover instead, and in the lightbox. `renderGrid` still
  supports `{captions: true}` but nothing uses it. Don't "helpfully" add them.
- Column counts live in the `COLUMNS` table in site.js and are applied as an
  inline style, because the packing has to know the count before it can
  balance the columns. Changing them in CSS alone will do nothing.
