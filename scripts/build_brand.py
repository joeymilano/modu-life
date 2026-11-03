"""Export outlined game wordmarks and a compact Pearl playing-card symbol."""
from pathlib import Path
from fontTools.ttLib import TTCollection
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'brand'
OUT.mkdir(exist_ok=True)
font = TTCollection('/System/Library/Fonts/Supplemental/Songti.ttc').fonts[0]
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()

def character(char, x, y, width, height, color):
    glyph = glyphs[cmap[ord(char)]]
    bounds = BoundsPen(glyphs); glyph.draw(bounds)
    left, bottom, right, top = bounds.bounds
    scale = min(width / (right-left), height / (top-bottom))
    pen = SVGPathPen(glyphs); glyph.draw(pen)
    tx = x + (width-(right-left)*scale)/2 - left*scale
    ty = y + (height-(top-bottom)*scale)/2 + top*scale
    return f'<path fill="{color}" transform="translate({tx:.3f} {ty:.3f}) scale({scale:.5f} {-scale:.5f})" d="{pen.getCommands()}"/>'

def svg(viewbox, shapes, title='魔都人生'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}" role="img" aria-label="{title}"><title>{title}</title>{shapes}</svg>\n'

def symbol(cream='#f5e8ca', gold='#d8af72'):
    # A cut-corner playing card with two Pearl spheres and three open support legs.
    return f'''<path fill="#a6402d" d="M5 0H51L64 13V80H0V5Z"/>
<path fill="none" stroke="{gold}" stroke-width="1.2" d="M9 5H47L59 17V75H5V9M54 6V10H58"/>
<g fill="{cream}"><path d="M31 12H33V20H31ZM30 27H34V42H30ZM27 53H30L25 67H21ZM34 53H37L43 67H39ZM31 53H33V67H31Z"/><circle cx="32" cy="24" r="4.5"/><circle cx="32" cy="48" r="9"/></g>
<g stroke="#a6402d" fill="none"><path d="M24 48H40M28 44H36M28 52H36" stroke-width="1.2"/></g>'''

hero = character('魔', 6, 10, 246, 242, '#f5e8ca')
hero += character('都', 272, 10, 246, 242, '#f5e8ca')
hero += character('人', 6, 282, 246, 242, '#d8af72')
hero += character('生', 272, 282, 246, 242, '#d8af72')
# Narrow architectural rules, kept outside the characters for legibility.
hero += '<path d="M5 267H228M296 267H519" stroke="#d8af72" stroke-width="1" opacity=".65"/><path d="M253 267L262 258L271 267L262 276Z" fill="#a6402d"/>'
(OUT/'logo-poster.svg').write_text(svg('0 0 524 534',hero))
for variant, ink in [('light','#f5e8ca'),('dark','#173a30')]:
    shapes = '<g transform="translate(0 0) scale(.8)">'+symbol()+'</g>'
    for i,char in enumerate('魔都人生'):
        shapes += character(char, 65+i*52, 9, 46, 46, ink)
    (OUT/f'logo-{variant}.svg').write_text(svg('0 0 273 64',shapes))
(OUT/'symbol.svg').write_text(svg('0 0 64 80',symbol(),'魔都人生牌'))
(ROOT/'public/favicon.svg').write_text(svg('0 0 80 80','<rect width="80" height="80" rx="16" fill="#153a30"/><g transform="translate(13 7) scale(.82)">'+symbol()+'</g>'))
print('Exported poster, light/dark wordmarks, symbol and favicon. Text is outlined; no font download needed.')
