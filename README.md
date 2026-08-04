# Robert W. Bell Watercolours

A small, plain website for showing paintings. No frameworks, no build step,
nothing to install — just HTML, CSS and one JavaScript file. That's deliberate:
it means the site will still work in ten years, and it can be hosted for free
forever.

---

## The two-minute version

**To add a painting:**

1. Put the image file in the `images/` folder.
2. Run this in Terminal, from inside the project folder:

```bash
python3 tools/add-images.py --write
```

3. Open `content/artworks.js` and fill in the title, year and medium.
4. Look at it: `python3 tools/serve.py`, then open http://localhost:4321
5. Publish it (see *Publishing changes* below).

**Or just ask Claude.** Open this folder in Claude Code and say something like:

> I've put three new paintings in the images folder. The first is "Estuary,
> Low Tide", painted 2026, 14" x 11", and I'd like it on both pages.
> Can you add them all?

It knows how this site is laid out and will do the whole thing.

---

## What's where

| Folder / file          | What it is                                                    |
| ---------------------- | ------------------------------------------------------------- |
| `images/`              | Every painting photo. Drop new ones here.                      |
| `content/artworks.js`  | **The list of paintings.** Title, year, size, which pages.      |
| `content/site.js`      | Your name, email, social links, and the About page text.       |
| `index.html`           | The front page ("Selected Work")                                     |
| `watercolours.html`    | The Watercolours page (smaller thumbnails)                     |
| `about.html`           | The About page                                                 |
| `assets/`              | The look and the behaviour. You rarely need to touch this.     |
| `tools/`               | Small helper scripts (see below).                              |

The two files in `content/` are the only ones you need for day-to-day
changes. They're plain text with comments explaining every field.

---

## Adding a painting by hand

Open `content/artworks.js` and copy an existing block to the top of the list:

```js
  {
    src: "images/estuary-low-tide.jpg",
    width: 2048,
    height: 1536,
    title: "Estuary, Low Tide",
    year: "2026",
    medium: '16" x 12"',                  // single quotes: it contains " marks
    selects: true,
  },
```

- `width` and `height` are the image's real pixel size. Getting them right
  stops the page jumping around while it loads, and keeps the two columns even.
  `tools/add-images.py` works them out for you — you don't have to.
- `selects: true` puts it on the front page (big plates).
- `watercolours: true` puts it on the Watercolours page (small thumbnails).
  The two are independent — a painting can be on one, both, or neither.

The order of the list is the order paintings appear. Newest at the top.

**Photo tips:** save as JPEG, around 2000 pixels on the long edge. Bigger than
that just makes the page slow to load without looking any better.

---

## The helper scripts

All of these use the Python that's already on your Mac. Nothing to install.

```bash
python3 tools/serve.py
```

Previews the site at http://localhost:4321. Edit a file, refresh the page, see
the change. Press Control-C to stop.

```bash
python3 tools/add-images.py
```

Lists any image in `images/` that isn't in `artworks.js` yet, with its size.
Add `--write` to actually add them to the top of the list.

---

## Publishing it — free, forever

The whole site is static files, so any static host will serve it at no cost
with no expiry. **GitHub Pages** is the recommended one: it's free with no
credit card, no trial period, and no usage limits that a painting portfolio
would ever reach.

First time only:

1. Make a free account at [github.com](https://github.com).
2. Create a new, empty repository (public).
3. From inside this folder, in Terminal:

```bash
git init
git add .
git commit -m "First version of the site"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

4. On GitHub, go to the repository's **Settings → Pages**, and under "Build and
   deployment" set **Source** to *Deploy from a branch*, branch `main`, folder
   `/ (root)`. Save.

A minute later the site is live at `https://YOUR-USERNAME.github.io/YOUR-REPO/`.

### Publishing changes after that

```bash
git add .
git commit -m "Added three new paintings"
git push
```

The live site updates itself about a minute later. (Or ask Claude to do it.)

### Using your own domain name

Buy a domain, then in **Settings → Pages → Custom domain** enter it and follow
the DNS instructions GitHub gives you. The domain costs money each year;
the hosting stays free.

### Other free hosts

The site is just files, so it works unchanged on **Cloudflare Pages** and
**Netlify** too — both have free tiers. Point them at the repository and set
the build command to nothing and the output directory to `/`.

---

## Things that are deliberately missing

No database, no content management system, no login, no cookies, no analytics,
no tracking, and no external services. The site loads nothing from anywhere
else, which is why it's fast and why it can't break when some company shuts a
product down.
