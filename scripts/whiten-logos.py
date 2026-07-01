#!/usr/bin/env python3
"""
Snap the near-white portions of the brand logos to TRUE white (#ffffff).

Off-white pixels (every channel >= threshold) are set to pure 255,255,255 while preserving the
navy, the gold accent, anti-aliased edges below the threshold, and the alpha channel. The gold
accent is excluded automatically because its blue channel is well below the threshold. Idempotent.

Pillow only — no numpy required.

Usage: python3 scripts/whiten-logos.py
"""
import os
from PIL import Image, ImageChops

THRESHOLD = 225  # pixels whose R, G, and B are all >= this are treated as "white" and snapped to 255.

LOGOS = [
    "public/brl-logo-navy.png",
    "public/brl-logo.png",
    "public/barsh-matters-logo-navy-transparent.png",
    "public/barsh-matters-logo-reversed-transparent.png",
    "public/barsh-matters-cropped-transparent.png",
]


def whiten(fp):
    if not os.path.exists(fp):
        return
    im = Image.open(fp).convert("RGBA")
    r, g, b, a = im.split()

    # Per-pixel minimum of the three color channels, then threshold it into a mask.
    min_rg = ImageChops.darker(r, g)
    min_rgb = ImageChops.darker(min_rg, b)
    white_mask = min_rgb.point(lambda v: 255 if v >= THRESHOLD else 0)

    # Only touch opaque pixels, so transparent areas keep their stored RGB untouched.
    opaque_mask = a.point(lambda v: 255 if v > 0 else 0)
    mask = ImageChops.darker(white_mask, opaque_mask)

    snapped = mask.histogram()[255]

    base_rgb = Image.merge("RGB", (r, g, b))
    white = Image.new("RGB", im.size, (255, 255, 255))
    result_rgb = Image.composite(white, base_rgb, mask)

    result = Image.merge("RGBA", (*result_rgb.split(), a))
    result.save(fp)
    print(f"{fp}: snapped {snapped} near-white px to true white.")


def main():
    for fp in LOGOS:
        whiten(fp)
    print("Done. Logo white is now true #ffffff.")


if __name__ == "__main__":
    main()
