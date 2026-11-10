"""Build Modu Life wordmarks and app icons using Noto Sans CJK SC Black and the Pearl illustration."""

import argparse
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from PIL import Image, ImageFilter, ImageOps

PUBLIC = Path(__file__).resolve().parents[1] / 'public'
TITLE = '魔都人生'
GOLD = '#ffe168'
PAPER = '#fff5e4'
CORAL = '#f87e78'
INK = '#17131d'

# Compact rendering of the illustrated tower for tabs, header and card backs.
TOWER = """
<g stroke="#24132e" stroke-width="2.5" stroke-linejoin="round">
  <path fill="#ffe0b0" d="M61 38 62.5 17 65 6 67 17 68 38z"/>
  <path fill="#ffc19c" d="M53 50h8l-1 29h-9z"/>
  <path fill="#b775a2" d="M69 50h7l2 29h-9z"/>
  <path fill="#784a81" d="M60 62h9v4h-9z"/>
  <path fill="#bd6e97" d="M60 99h10l1 15-5 4h-8z"/>
  <path fill="#ffd09b" d="M47 96 55 99 40 117H29z"/>
  <path fill="#b46c9d" d="m74 99 9-3 17 21H88z"/>
  <circle cx="65" cy="27.5" r="4.8" fill="#f47393"/>
  <ellipse cx="65" cy="42" rx="14.6" ry="11.3" fill="#ee5f8b"/>
  <ellipse cx="64.5" cy="88.5" rx="21.5" ry="15.8" fill="#f77388"/>
</g>
<path fill="#80355e" d="M78 39a13.7 10 0 0 1-23 10c10 1 19-3 23-10zm7 47a20 14.4 0 0 1-35 11c16 1 29-4 35-11z"/>
<path fill="#ffce91" d="M53 40q2-7 12-8l-5 4-4 5zm-8 46q4-9 17-11l-5 5-9 8z"/>
<path fill="#262643" d="M51 42q13-4 28 0v3q-14-3-27 1zm-7 46q19-6 41-1v3.5q-22-4-40 1z"/>
"""

SKY = """
<defs>
  <linearGradient id="dusk" x2=".23" y2="1" gradientUnits="objectBoundingBox">
    <stop stop-color="#362163"/>
    <stop offset=".37" stop-color="#9d3c96"/>
    <stop offset=".69" stop-color="#f1619b"/>
    <stop offset="1" stop-color="#ffac68"/>
  </linearGradient>
  <linearGradient id="warm-light" x1="0" x2="1" y1="1" y2=".35">
    <stop stop-color="#ffe0a4" stop-opacity=".72"/>
    <stop offset="1" stop-color="#ff966a" stop-opacity="0"/>
  </linearGradient>
</defs>
<rect width="128" height="128" fill="url(#dusk)"/>
<path d="M0 87 128 50v78H0z" fill="url(#warm-light)"/>
"""


def svg(viewbox, shapes):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}" '
        f'role="img" aria-label="{TITLE}"><title>{TITLE}</title>{shapes}</svg>\n'
    )


def lettering(font, text, start, pitch, width, height, y):
    glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
    paths = []
    for i, char in enumerate(text):
        glyph = glyphs[cmap[ord(char)]]
        bounds = BoundsPen(glyphs)
        glyph.draw(bounds)
        left, bottom, right, top = bounds.bounds
        pen = SVGPathPen(glyphs)
        glyph.draw(pen)
        sx = width / (right - left)
        sy = height / (top - bottom)
        tx = start + i * pitch - left * sx
        ty = y + top * sy
        paths.append(
            f'<path transform="translate({tx:.3f} {ty:.3f}) scale({sx:.6f} {-sy:.6f})" '
            f'd="{pen.getCommands()}"/>'
        )
    return ''.join(paths)


def maskable_art(artwork):
    size, inset = 512, 60
    inner = size - 2 * inset
    centered = artwork.resize((inner, inner), Image.Resampling.LANCZOS)
    icon = Image.new('RGB', (size, size))
    icon.paste(centered, (inset, inset))
    icon.paste(ImageOps.mirror(centered.crop((0, 0, inset, inner))), (0, inset))
    icon.paste(ImageOps.mirror(centered.crop((inner-inset, 0, inner, inner))), (size-inset, inset))
    top_edge = icon.crop((0, inset, size, inset+3))
    bottom_edge = icon.crop((0, size-inset-3, size, size-inset))
    icon.paste(top_edge.resize((size, inset)).filter(ImageFilter.GaussianBlur(8)), (0, 0))
    icon.paste(bottom_edge.resize((size, inset)).filter(ImageFilter.GaussianBlur(8)), (0, size-inset))
    return icon


def render_app_icons():
    directory = PUBLIC / 'icons' / 'pearl-dusk'
    directory.mkdir(exist_ok=True)
    with Image.open(PUBLIC.parent / 'art' / 'pearl-dusk.webp') as source:
        artwork = source.convert('RGB')
    for name, size in [('apple-touch-icon.png', 180), ('icon-192.png', 192), ('icon-512.png', 512)]:
        artwork.resize((size, size), Image.Resampling.LANCZOS).save(directory / name, optimize=True)
    maskable_art(artwork).save(directory / 'icon-maskable-512.png', optimize=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('font', type=Path, help='Path to NotoSansCJKsc-Black.otf')
    font = TTFont(parser.parse_args().font)
    brand = PUBLIC / 'brand' / 'pearl-dusk'
    brand.mkdir(exist_ok=True)

    city = lettering(font, '魔都', 18, 125, 116, 104, 6)
    life = lettering(font, '人生', 268, 125, 116, 104, 6)
    poster = f'''
<defs><g id="city">{city}</g><g id="life">{life}</g></defs>
<g transform="skewX(-7)">
  <g fill="#783d62" transform="translate(7 8)">
    <use href="#city"/><use href="#life"/>
  </g>
  <use href="#city" fill="{PAPER}"/><use href="#life" fill="{GOLD}"/>
</g>
'''
    (PUBLIC / 'brand' / 'shanghai-stories' / 'logo-poster.svg').write_text(svg('0 0 524 126', poster))
    (brand / 'symbol.svg').write_text(svg('0 0 128 128', TOWER))

    wordmark = lettering(font, TITLE, 68, 50, 42, 43, 10)
    for variant, ink in [('light', PAPER), ('dark', INK)]:
        shapes = f'<g transform="scale(.5)">{TOWER}</g><g fill="{ink}">{wordmark}</g>'
        (brand / f'logo-{variant}.svg').write_text(svg('0 0 273 64', shapes))

    icon = svg('0 0 128 128', SKY + TOWER)
    (brand / 'icon.svg').write_text(icon)
    (PUBLIC / 'favicon.svg').write_text(icon)
    render_app_icons()


if __name__ == '__main__':
    main()
