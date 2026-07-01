#!/usr/bin/env python3
"""
Snap the near-white portions of the brand logos to TRUE white (#ffffff).

Off-white pixels (all channels >= threshold, and not part of the gold accent) are set to pure
255,255,255 while preserving the navy, the gold, anti-aliased edges below the threshold, and the
alpha channel. Idempotent — running it again is a no-op.

Usage: python3 scripts/whiten-logos.py
"""
import os
import numpy as np
from PIL import Image

THRESHOLD = 225  # channels at/above this (and not gold) are treated as "white" and snapped to 255.

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
    a = np.asarray(Image.open(fp).convert("RGBA")).copy()
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    gold = (r > g) & (g > b) & ((r - b) > 28) & (r > 110)
    near_white = (al > 0) & (~gold) & (r >= THRESHOLD) & (g >= THRESHOLD) & (b >= THRESHOLD)
    before = int(((r == 255) & (g == 255) & (b == 255) & (al > 0)).sum())
    a[..., 0] = np.where(near_white, 255, r)
    a[..., 1] = np.where(near_white, 255, g)
    a[..., 2] = np.where(near_white, 255, b)
    Image.fromarray(a, "RGBA").save(fp)
    after = int(near_white.sum())
    print(f"{fp}: snapped {after} near-white px to true white (was {before} pure).")


def main():
    for fp in LOGOS:
        whiten(fp)
    print("Done. Logo white is now true #ffffff.")


if __name__ == "__main__":
    main()
