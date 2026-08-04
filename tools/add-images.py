#!/usr/bin/env python3
"""Add every new image in images/ to content/artworks.js.

Usage:
    python3 tools/add-images.py            # see what would be added
    python3 tools/add-images.py --write    # actually add them

It works out each image's width and height for you, so the gallery lays out
correctly with no jumping while the page loads. New entries go to the TOP of
the list with the title guessed from the file name — edit the title, year and
medium afterwards (or just ask Claude to).

No installation needed. Uses only what comes with macOS.
"""

import os
import re
import struct
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
IMAGES = os.path.join(ROOT, "images")
ARTWORKS = os.path.join(ROOT, "content", "artworks.js")

EXTENSIONS = (".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".avif")


# --------------------------------------------------------------- dimensions


def png_size(fh):
    fh.seek(16)
    return struct.unpack(">II", fh.read(8))


def gif_size(fh):
    fh.seek(6)
    return struct.unpack("<HH", fh.read(4))


def jpeg_size(fh):
    fh.seek(2)
    while True:
        marker = fh.read(2)
        if len(marker) < 2 or marker[0] != 0xFF:
            return None
        code = marker[1]
        (length,) = struct.unpack(">H", fh.read(2))
        # SOF0..SOF15, skipping the non-dimension markers in that range
        if 0xC0 <= code <= 0xCF and code not in (0xC4, 0xC8, 0xCC):
            fh.read(1)
            height, width = struct.unpack(">HH", fh.read(4))
            return width, height
        fh.seek(length - 2, os.SEEK_CUR)


def webp_size(fh):
    fh.seek(12)
    chunk = fh.read(4)
    if chunk == b"VP8 ":
        fh.seek(26)
        w, h = struct.unpack("<HH", fh.read(4))
        return w & 0x3FFF, h & 0x3FFF
    if chunk == b"VP8L":
        fh.seek(21)
        bits = struct.unpack("<I", fh.read(4))[0]
        return (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1
    if chunk == b"VP8X":
        fh.seek(24)
        data = fh.read(6)
        w = data[0] | data[1] << 8 | data[2] << 16
        h = data[3] | data[4] << 8 | data[5] << 16
        return w + 1, h + 1
    return None


def avif_size(path):
    """Pull width/height out of the first ispe box."""
    with open(path, "rb") as fh:
        blob = fh.read(4096)
    idx = blob.find(b"ispe")
    if idx == -1:
        return None
    w, h = struct.unpack(">II", blob[idx + 8 : idx + 16])
    return w, h


def svg_size(path):
    with open(path, "r", errors="replace") as fh:
        head = fh.read(4096)
    width = re.search(r'\bwidth="([\d.]+)', head)
    height = re.search(r'\bheight="([\d.]+)', head)
    if width and height:
        return int(float(width.group(1))), int(float(height.group(1)))
    box = re.search(r'viewBox="[\d.\-]+[ ,]+[\d.\-]+[ ,]+([\d.]+)[ ,]+([\d.]+)', head)
    if box:
        return int(float(box.group(1))), int(float(box.group(2)))
    return None


def image_size(path):
    ext = os.path.splitext(path)[1].lower()
    try:
        if ext == ".svg":
            return svg_size(path)
        if ext == ".avif":
            return avif_size(path)
        with open(path, "rb") as fh:
            head = fh.read(12)
            fh.seek(0)
            if head.startswith(b"\x89PNG"):
                return png_size(fh)
            if head.startswith(b"GIF8"):
                return gif_size(fh)
            if head.startswith(b"\xff\xd8"):
                return jpeg_size(fh)
            if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
                return webp_size(fh)
    except Exception:
        return None
    return None


# --------------------------------------------------------------------- main


def pretty_title(filename):
    stem = os.path.splitext(filename)[0]
    stem = re.sub(r"[_-]+", " ", stem)
    stem = re.sub(r"\s+", " ", stem).strip()
    return stem[:1].upper() + stem[1:]


def entry(src, width, height, title):
    return "\n".join(
        [
            "  {",
            '    src: "%s",' % src,
            "    width: %d," % width,
            "    height: %d," % height,
            '    title: "%s",' % title.replace('"', "'"),
            '    year: "",',
            '    medium: "",',
            '    album: "",',
            "    selects: true,",
            "  },",
            "",
        ]
    )


def main():
    write = "--write" in sys.argv

    if not os.path.isdir(IMAGES):
        sys.exit("No images/ folder found at " + IMAGES)

    with open(ARTWORKS, "r") as fh:
        source = fh.read()

    listed = set(re.findall(r'src:\s*"([^"]+)"', source))
    on_disk = sorted(
        name
        for name in os.listdir(IMAGES)
        if name.lower().endswith(EXTENSIONS) and not name.startswith(".")
    )

    new = []
    for name in on_disk:
        src = "images/" + name
        if src in listed:
            continue
        size = image_size(os.path.join(IMAGES, name))
        if not size:
            print("  ?  {} — could not read its size, skipping".format(src))
            continue
        new.append((src, size[0], size[1], pretty_title(name)))

    if not new:
        print("Nothing new. Every image in images/ is already in artworks.js.")
        return

    print("Found {} new image(s):".format(len(new)))
    for src, w, h, title in new:
        print("  +  {}  ({} x {})  “{}”".format(src, w, h, title))

    if not write:
        print("\nRun again with --write to add them:")
        print("    python3 tools/add-images.py --write")
        return

    marker = "window.ARTWORKS = ["
    at = source.index(marker) + len(marker)
    block = "\n" + "".join(entry(*item) for item in new)
    source = source[:at] + block.rstrip("\n") + source[at:]

    with open(ARTWORKS, "w") as fh:
        fh.write(source)

    print("\nAdded to content/artworks.js. Open it and fill in the year,")
    print("medium and album for each — or ask Claude to do it.")


if __name__ == "__main__":
    main()
