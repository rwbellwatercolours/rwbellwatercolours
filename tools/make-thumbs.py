#!/usr/bin/env python3
"""Make the small copies the gallery grid uses.

    python3 tools/make-thumbs.py

The grid shows each painting about 330 pixels wide, but the files in
images/ are 1400 pixels so they still look sharp when opened full screen.
Sending the big file to fill a small square makes the page slow to load.

This writes a 700-pixel copy of every painting into images/thumbs/. The
grid uses those; clicking a painting still opens the full-size one.

Run it after adding paintings. It skips any thumbnail that is already
there and up to date, so running it twice costs nothing.

Needs Pillow (already on this Mac). If it is ever missing:
    python3 -m pip install --user Pillow
"""

import io
import os
import re
import sys

WIDTH = 700
QUALITY = 58

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
IMAGES = os.path.join(ROOT, "images")
THUMBS = os.path.join(IMAGES, "thumbs")
ARTWORKS = os.path.join(ROOT, "content", "artworks.js")


def wanted():
    """Every painting listed in artworks.js, in order."""
    with open(ARTWORKS, "r") as fh:
        found = re.findall(r'src:\s*"images/([^"]+)"', fh.read())
    return [name for name in found if not name.startswith("thumbs/")]


def main():
    try:
        from PIL import Image
    except ImportError:
        sys.exit(
            "Pillow is needed to make thumbnails.\n"
            "    python3 -m pip install --user Pillow"
        )

    os.makedirs(THUMBS, exist_ok=True)

    made = skipped = missing = 0
    saved = 0

    for name in wanted():
        source = os.path.join(IMAGES, name)
        target = os.path.join(THUMBS, name)

        if not os.path.exists(source):
            print("  ?  images/%s is listed but not in the folder" % name)
            missing += 1
            continue

        # already current?
        if os.path.exists(target) and os.path.getmtime(target) >= os.path.getmtime(source):
            skipped += 1
            continue

        try:
            im = Image.open(source)
            im = im.convert("RGB")
            im.thumbnail((WIDTH, WIDTH), Image.LANCZOS)
            buf = io.BytesIO()
            im.save(buf, "AVIF", quality=QUALITY)
        except Exception as exc:
            print("  !  could not shrink images/%s — %s" % (name, exc))
            missing += 1
            continue

        with open(target, "wb") as fh:
            fh.write(buf.getvalue())

        saved += os.path.getsize(source) - buf.tell()
        made += 1

    print("made %d, already current %d, skipped %d" % (made, skipped, missing))
    if made:
        print("the grid now loads %.1f MB less than it would have" % (saved / 1048576.0))


if __name__ == "__main__":
    main()
