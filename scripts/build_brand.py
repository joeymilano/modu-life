"""Build Modu Life wordmarks and app icons using Noto Sans CJK SC Black and Chrome."""

import argparse
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from playwright.sync_api import sync_playwright

PUBLIC = Path(__file__).resolve().parents[1] / 'public'
TITLE = '魔都人生'
GOLD = '#ffe168'
PAPER = '#fff5e4'
CORAL = '#f87e78'
INK = '#17131d'

# A punched arrival ticket with the Oriental Pearl and the bend of the Huangpu.
TICKET = f'''
<path fill="{CORAL}" d="M25 35 99 23l13 15-8 62-76 11-12-14Z"/>
<path fill="{GOLD}" d="M23 29 93 18l13 15-8 62-76 11-12-14Z"/>
<g fill="{INK}">
  <path d="M59 27h4v15h-4zm-2 24h8v14h-8zm-3 22 5 2-7 10-8 2zm10 1 5-2 6 9-7 2z"/>
  <circle cx="61" cy="46" r="6"/>
  <circle cx="61" cy="67" r="12"/>
  <path d="M18 90c15 3 24 2 43-4 15-5 25-6 39-5l-1 5c-13-1-22 0-37 5-18 6-30 7-45 4z"/>
</g>
'''


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


def render_app_icons(icon, maskable):
    outputs = (
        ('apple-touch-icon.png', 180, icon),
        ('icon-192.png', 192, icon),
        ('icon-512.png', 512, icon),
        ('icon-maskable-512.png', 512, maskable),
    )
    directory = PUBLIC / 'icons'
    directory.mkdir(exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel='chrome')
        page = browser.new_page()
        for name, size, source in outputs:
            page.set_viewport_size({'width': size, 'height': size})
            page.set_content('<style>body{margin:0}svg{display:block;width:100vw;height:100vh}</style>' + source)
            page.screenshot(path=directory / name)
        browser.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('font', type=Path, help='Path to NotoSansCJKsc-Black.otf')
    font = TTFont(parser.parse_args().font)
    brand = PUBLIC / 'brand'

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
    (brand / 'logo-poster.svg').write_text(svg('0 0 524 126', poster))
    (brand / 'symbol.svg').write_text(svg('0 0 128 128', TICKET))

    wordmark = lettering(font, TITLE, 68, 50, 42, 43, 10)
    for variant, ink in [('light', PAPER), ('dark', INK)]:
        shapes = f'<g transform="scale(.5)">{TICKET}</g><g fill="{ink}">{wordmark}</g>'
        (brand / f'logo-{variant}.svg').write_text(svg('0 0 273 64', shapes))

    background = f'<rect width="128" height="128" fill="{INK}"/>'
    icon = svg('0 0 128 128', background + TICKET)
    (PUBLIC / 'favicon.svg').write_text(icon)
    maskable = svg('0 0 128 128', background + f'<g transform="translate(13.4 13.4) scale(.79)">{TICKET}</g>')
    render_app_icons(icon, maskable)


if __name__ == '__main__':
    main()
