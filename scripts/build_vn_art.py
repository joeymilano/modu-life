#!/usr/bin/env python3
"""Builds the dialogue-stage art from the project's own story stills.

  python3 scripts/build_vn_art.py            # sprites + background plates
  python3 scripts/build_vn_art.py --only sprites gu-1,zheng-1
  python3 scripts/build_vn_art.py --only plates banquet

Writes `public/art/sprites/*.webp` (transparent character cut-outs) and
`public/art/stages/*.webp` (empty background plates). Needs macOS 14+ with the
Xcode command line tools for `scripts/vn_mask.swift`, plus Pillow, numpy and
opencv-python. The outputs are committed, so players never run this.
"""
import argparse
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
SHEET = ROOT / "art" / "source" / "vn-cast-sheet.png"
SPRITES = PUBLIC / "art" / "sprites"
STAGES = PUBLIC / "art" / "stages"

# name: (source under public/, per-person split?, instance id, crop as x0,y0,x1,y1 fractions or None)
SPRITES_TO_CUT = {
    "zheng-1": ("art/cold-open/shift.webp", True, 1, (0, 0, 1, 0.6)),
    "wu-2": ("art/pujiang-cinema/shift.webp", True, 1, None),
    "xu-2": ("art/pujiang-cinema/xu.webp", True, 1, None),
    "xu-3": ("art/era/station-1992.webp", True, 1, None),
    "lu-1": ("art/pujiang-cinema/stage.webp", True, 1, None),
    "lu-2": ("art/portraits/lu.webp", False, 1, None),
    "lu-3": ("art/pujiang-cinema/expo.webp", True, 3, None),
    "gu-1": ("art/pujiang-cinema/gu.webp", True, 1, None),
    "gu-2": ("art/pujiang-cinema/gu-dinner.webp", True, 1, (0, 0, 0.7, 1)),
    "zhouxiao-1": ("art/pujiang-cinema/dinner.webp", False, 2, None),
    "wen-1": ("art/pujiang-cinema/workshop.webp", True, 1, None),
    "wen-2": ("art/pujiang-cinema/expo.webp", True, 1, (0, 0, 0.74, 1)),
    "fei-1": ("art/cold-open/stage.webp", True, 1, (0, 0, 1, 0.78)),
    "fei-2": ("art/portraits/fei.webp", False, 1, None),
    "mother-2": ("art/portraits/mother-heir.webp", False, 1, None),
    "mother-3": ("art/heir-story/boardroom.webp", True, 1, None),
    "father-1": ("art/portraits/father-heir.webp", False, 1, None),
    "father-2": ("art/heir-story/boardroom.webp", True, 3, None),
    "yu-1": ("art/portraits/yu.webp", False, 1, None),
}
# The prologue cut-outs and the four-pose cast sheet are already transparent.
SPRITES_TO_COPY = {
    "mao-1": (PUBLIC / "art/prologue/arrival-actor.webp", None),
    "shen-1": (PUBLIC / "art/prologue/heir-actor.webp", None),
    "wu-1": (PUBLIC / "art/prologue/worker-actor.webp", None),
    "xu-1": (PUBLIC / "art/prologue/system-actor.webp", None),
    "mao-2": (SHEET, (512, 0, 1024, 768)),
    "shen-2": (SHEET, (512, 768, 1024, 1536)),
}
# name: (source under public/, remove people and what they hold?)
PLATES = {
    "station": ("art/prologue/arrival-place.webp", False),
    "hotel-porch": ("art/prologue/heir-place.webp", False),
    "rain-dock": ("art/prologue/system-place.webp", False),
    "warehouse-yard": ("art/prologue/worker-place.webp", False),
    "skyline": ("art/era/lujiazui-1992.webp", False),
    "bund": ("art/era/bund-1992.webp", False),
    "banquet": ("art/pujiang-cinema/dinner.webp", True),
    "banquet-gu": ("art/pujiang-cinema/gu-dinner.webp", True),
    "hall": ("art/pujiang-cinema/stage.webp", True),
    "hall-dark": ("art/pujiang-cinema/gu.webp", True),
    "warehouse-gate": ("art/pujiang-cinema/shift.webp", True),
    "gatehouse": ("art/cold-open/shift.webp", True),
    "club": ("art/cold-open/stage.webp", True),
    "night-dock": ("art/pujiang-cinema/xu.webp", True),
    "workbench": ("art/pujiang-cinema/workshop.webp", True),
    "expo": ("art/pujiang-cinema/expo.webp", True),
    "warehouse-inside": ("art/era/shift-1992.webp", True),
    "ticket-office": ("art/era/terminal-1992.webp", True),
}
PLATE_WIDTH = 1536
SPRITE_HEIGHT = 960


def compile_tool(build: Path) -> Path:
    binary = build / "vn_mask"
    subprocess.run(["swiftc", "-O", str(ROOT / "scripts" / "vn_mask.swift"), "-o", str(binary)], check=True)
    return binary


def load(path: Path) -> Image.Image:
    # ImageIO and Pillow disagree on WebP; cv2 decodes the same stills the mask tool reads.
    data = np.fromfile(str(path), dtype=np.uint8)
    return Image.fromarray(cv2.cvtColor(cv2.imdecode(data, cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB))


def finish_sprite(image: Image.Image, name: str, floor: int = 70) -> None:
    alpha = np.asarray(image.getchannel("A")).astype(np.float32)
    # Faint halos around hair and borrowed table edges are the mask guessing; drop them.
    alpha = np.clip((alpha - floor) * 255 / (255 - floor), 0, 255).astype(np.uint8)
    mask = Image.fromarray(alpha).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.1))
    image.putalpha(mask)
    # The mask tool keeps the frame it was given; stand the person on the bottom edge of their own outline.
    box = mask.getbbox()
    if box:
        image = image.crop((max(0, box[0] - 6), max(0, box[1] - 6), min(image.width, box[2] + 6), min(image.height, box[3] + 6)))
    height = image.height
    if height > SPRITE_HEIGHT or height < 760:
        width = round(image.width * SPRITE_HEIGHT / height)
        resample = Image.LANCZOS
        image = image.resize((width, SPRITE_HEIGHT), resample)
        if height < 760:
            image = image.filter(ImageFilter.UnsharpMask(2, 55, 3))
            alpha = image.getchannel("A").filter(ImageFilter.GaussianBlur(1.6))
            image.putalpha(alpha)
    image.save(SPRITES / f"{name}.webp", "WEBP", quality=80, method=6, alpha_quality=100)
    print(f"sprites/{name}.webp {image.width}x{image.height} {(SPRITES / f'{name}.webp').stat().st_size // 1024}KB")


def build_sprite(tool: Path, work: Path, name: str, spec) -> None:
    source, person, instance, crop = spec
    raw = work / f"{name}.png"
    command = [str(tool), "cut"] + (["--person"] if person else []) + [str(PUBLIC / source), str(raw), str(instance)]
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL)
    image = Image.open(raw).convert("RGBA")
    if crop:
        x0, y0, x1, y1 = crop
        image = image.crop((round(x0 * image.width), round(y0 * image.height), round(x1 * image.width), round(y1 * image.height)))
    finish_sprite(image, name)


def fill_hole(image: np.ndarray, hole: np.ndarray) -> np.ndarray:
    """Removes a person: colour flows in from the rim, texture is borrowed from beside the hole."""
    height, width = hole.shape
    picture = image.astype(np.float32)
    # Low frequencies first: at one sixteenth the hole is small, so diffusion gives smooth colour.
    small = cv2.resize(picture, (width // 16, height // 16), interpolation=cv2.INTER_AREA)
    wide = cv2.dilate(hole.astype(np.uint8), np.ones((16, 16), np.uint8))
    rim = (cv2.resize(wide, (width // 16, height // 16), interpolation=cv2.INTER_AREA) > 0).astype(np.uint8)
    poured = cv2.inpaint(small.astype(np.uint8), cv2.dilate(rim, np.ones((5, 5), np.uint8)), 7, cv2.INPAINT_TELEA)
    low = cv2.resize(poured.astype(np.float32), (width, height), interpolation=cv2.INTER_CUBIC)
    rows, columns = np.where(hole)
    centre_y, centre_x = rows.mean(), columns.mean()
    reach_x = int(np.ptp(np.nonzero(hole.any(axis=0))[0]) + 40)
    reach_y = int(np.ptp(np.nonzero(hole.any(axis=1))[0]) + 40)
    # Each matrix says where a hole pixel reads from: mirrored across the hole, then slid aside.
    reads = [np.float32([[-1, 0, 2 * centre_x], [0, 1, 0]]), np.float32([[1, 0, 0], [0, -1, 2 * centre_y]]),
             np.float32([[1, 0, reach_x], [0, 1, 0]]), np.float32([[1, 0, -reach_x], [0, 1, 0]]),
             np.float32([[1, 0, 0], [0, 1, reach_y]]), np.float32([[1, 0, 0], [0, 1, -reach_y]])]
    texture, covered = np.zeros_like(picture), np.zeros(hole.shape, bool)
    for matrix in reads:
        if covered.all():
            break
        source = cv2.warpAffine(picture, matrix, (width, height), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT101)
        blocked = cv2.warpAffine(hole.astype(np.uint8), matrix, (width, height), flags=cv2.INTER_NEAREST | cv2.WARP_INVERSE_MAP,
                                 borderMode=cv2.BORDER_CONSTANT, borderValue=1).astype(bool)
        usable = hole & ~covered & ~blocked
        texture[usable] = source[usable]
        covered |= usable
    detail = texture - cv2.GaussianBlur(texture, (0, 0), 9)
    return np.clip(low + np.where(covered[..., None], detail, 0), 0, 255)


def build_plate(tool: Path, work: Path, name: str, source: str, empty: bool) -> None:
    image = np.asarray(load(PUBLIC / source)).astype(np.uint8)
    height = round(PLATE_WIDTH * image.shape[0] / image.shape[1])
    if empty:
        # The clean prologue plates are 834px wide; lift them to stage size without new detail.
        upscaled = cv2.resize(image, (PLATE_WIDTH, height), interpolation=cv2.INTER_LANCZOS4)
        soft = cv2.GaussianBlur(upscaled, (0, 0), 1.1)
        image = cv2.addWeighted(upscaled, 0.62, soft, 0.38, 0)
    else:
        hole = np.zeros(image.shape[:2], np.uint8)
        for person in (True, False):
            target = work / f"{name}-{int(person)}-mask.png"
            subprocess.run([str(tool), "mask"] + (["--person"] if person else []) + [str(PUBLIC / source), str(target)],
                           check=True, stdout=subprocess.DEVNULL)
            hole |= np.asarray(Image.open(target).convert("L"))
        hole = cv2.dilate((hole > 24).astype(np.uint8), np.ones((17, 17), np.uint8)).astype(bool)
        blend = cv2.GaussianBlur(hole.astype(np.float32), (0, 0), 5)[..., None]
        # Where someone stood the plate stays deliberately out of focus, like a lens looking past them.
        cleared = fill_hole(image, hole)
        cleared = cv2.GaussianBlur(cleared, (0, 0), 9) + np.random.default_rng(7).normal(0, 2.2, cleared.shape)
        image = np.clip(image * (1 - blend) + cleared * blend, 0, 255).astype(np.uint8)
        image = cv2.resize(image, (PLATE_WIDTH, height), interpolation=cv2.INTER_AREA if image.shape[1] > PLATE_WIDTH else cv2.INTER_LANCZOS4)
        image = cv2.GaussianBlur(image, (0, 0), 2.2)
    Image.fromarray(image).save(STAGES / f"{name}.webp", "WEBP", quality=70, method=6)
    print(f"stages/{name}.webp {image.shape[1]}x{image.shape[0]} {(STAGES / f'{name}.webp').stat().st_size // 1024}KB")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--only", nargs="+", metavar=("GROUP", "NAMES"),
                        help="sprites or plates, optionally followed by a comma-separated list of names")
    options = parser.parse_args()
    group = options.only[0] if options.only else None
    wanted = options.only[1] if options.only and len(options.only) > 1 else None
    if group not in (None, "sprites", "plates"):
        sys.exit("--only takes sprites or plates")
    names = set(wanted.split(",")) if wanted else None
    SPRITES.mkdir(parents=True, exist_ok=True)
    STAGES.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="modu-vn-") as folder:
        work = Path(folder)
        if group != "plates":
            tool = compile_tool(work)
            for name, (path, box) in SPRITES_TO_COPY.items():
                if names is None or name in names:
                    image = Image.open(path).convert("RGBA")
                    finish_sprite(image.crop(box) if box else image, name)
            for name, spec in SPRITES_TO_CUT.items():
                if names is None or name in names:
                    build_sprite(tool, work, name, spec)
        if group != "sprites":
            tool = compile_tool(work)
            for name, (source, empty) in PLATES.items():
                if names is None or name in names:
                    build_plate(tool, work, name, source, not empty)


if __name__ == "__main__":
    main()
