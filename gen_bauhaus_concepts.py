import os
import math
from PIL import Image, ImageDraw, ImageFont

def render_concept_1(size=1024):
    """
    Concept 1: 'Geometric Bauhaus Monogram P'
    Stark pitch black tile (#050505).
    Thick white vertical pillar + sweeping bold circular bowl + single precision vermilion orange accent dot.
    Pure Bauhaus constructivism.
    """
    img = Image.new('RGBA', (size, size), (5, 5, 5, 255))
    draw = ImageDraw.Draw(img)
    
    pad = int(size * 0.05)
    r = int(size * 0.22)
    # Subtle crisp hairline border
    draw.rounded_rectangle([(pad, pad), (size - pad, size - pad)], radius=r, outline=(255, 255, 255, 40), width=3)
    
    # Grid coordinates
    cx = size // 2
    cy = size // 2
    
    stem_x = int(size * 0.32)
    stem_w = int(size * 0.12)
    stem_top = int(size * 0.26)
    stem_bot = int(size * 0.74)
    
    # Vertical Pillar
    draw.rectangle([(stem_x, stem_top), (stem_x + stem_w, stem_bot)], fill=(255, 255, 255, 255))
    
    # Semi-circular bowl
    bowl_r = int(size * 0.24)
    bowl_cx = stem_x + stem_w
    bowl_cy = stem_top + bowl_r
    
    # Outer circle for bowl
    draw.pieslice(
        [(bowl_cx - bowl_r, bowl_cy - bowl_r), (bowl_cx + bowl_r, bowl_cy + bowl_r)],
        start=-90, end=90,
        fill=(255, 255, 255, 255)
    )
    # Inner cutout for bowl
    inner_r = bowl_r - stem_w
    draw.pieslice(
        [(bowl_cx - inner_r, bowl_cy - inner_r), (bowl_cx + inner_r, bowl_cy + inner_r)],
        start=-90, end=90,
        fill=(5, 5, 5, 255)
    )
    
    # Signature Bauhaus Vermilion / International Orange Accent (The Focus Dot)
    accent_r = int(size * 0.065)
    accent_cx = int(size * 0.72)
    accent_cy = int(size * 0.68)
    draw.ellipse(
        [(accent_cx - accent_r, accent_cy - accent_r), (accent_cx + accent_r, accent_cy + accent_r)],
        fill=(255, 68, 0, 255) # Pure Bauhaus International Vermilion
    )
    
    return img

def render_concept_2(size=1024):
    """
    Concept 2: 'Swiss Negative-Space Hourglass / Quadrants'
    Heavy brutalist geometric abstraction. 
    Black tile, sharp white negative-space triangles converging into an eternal focus node.
    """
    img = Image.new('RGBA', (size, size), (5, 5, 5, 255))
    draw = ImageDraw.Draw(img)
    
    pad = int(size * 0.05)
    r = int(size * 0.22)
    draw.rounded_rectangle([(pad, pad), (size - pad, size - pad)], radius=r, outline=(255, 255, 255, 40), width=3)
    
    cx = size // 2
    cy = size // 2
    
    # Top inverted triangle
    t_w = int(size * 0.36)
    t_h = int(size * 0.22)
    draw.polygon([
        (cx - t_w, cy - t_h - int(size * 0.04)),
        (cx + t_w, cy - t_h - int(size * 0.04)),
        (cx, cy - int(size * 0.04))
    ], fill=(255, 255, 255, 255))
    
    # Bottom upright triangle
    draw.polygon([
        (cx - t_w, cy + t_h + int(size * 0.04)),
        (cx + t_w, cy + t_h + int(size * 0.04)),
        (cx, cy + int(size * 0.04))
    ], fill=(255, 255, 255, 255))
    
    # Ultra-sharp center focal square (tilted 45 degrees / diamond)
    d_size = int(size * 0.055)
    draw.polygon([
        (cx, cy - d_size),
        (cx + d_size, cy),
        (cx, cy + d_size),
        (cx - d_size, cy)
    ], fill=(255, 68, 0, 255))
    
    # Two Swiss horizontal framing guide bars
    bar_h = int(size * 0.018)
    draw.rectangle([(cx - t_w, cy - t_h - int(size * 0.08)), (cx + t_w, cy - t_h - int(size * 0.08) + bar_h)], fill=(255, 255, 255, 180))
    draw.rectangle([(cx - t_w, cy + t_h + int(size * 0.08) - bar_h), (cx + t_w, cy + t_h + int(size * 0.08))], fill=(255, 255, 255, 180))

    return img

def render_concept_3(size=1024):
    """
    Concept 3: 'Minimalist Chrono-Dial (The Dieter Rams / Braun aesthetic)'
    Mathematical purity. Off-white stark dial on deep graphite tile. 
    Heavy 3/4 arc stroke, solitary orange tick mark at 12 o'clock, brutalist center crosshair.
    """
    img = Image.new('RGBA', (size, size), (8, 8, 10, 255))
    draw = ImageDraw.Draw(img)
    
    pad = int(size * 0.05)
    r = int(size * 0.22)
    draw.rounded_rectangle([(pad, pad), (size - pad, size - pad)], radius=r, outline=(255, 255, 255, 35), width=3)
    
    cx = size // 2
    cy = size // 2
    
    dial_r = int(size * 0.31)
    stroke_w = int(size * 0.065)
    
    # Complete subtle reference track
    draw.ellipse(
        [(cx - dial_r, cy - dial_r), (cx + dial_r, cy + dial_r)],
        outline=(255, 255, 255, 25),
        width=stroke_w
    )
    
    # Stark 270-degree chalk-white arc (The 75% focus block)
    draw.arc(
        [(cx - dial_r, cy - dial_r), (cx + dial_r, cy + dial_r)],
        start=-90,
        end=180,
        fill=(250, 250, 250, 255),
        width=stroke_w
    )
    
    # Crisp 12-o'clock index bar in Bauhaus Orange
    bar_w = int(size * 0.024)
    bar_len = int(size * 0.10)
    draw.rectangle([
        (cx - bar_w // 2, cy - dial_r - bar_len // 2),
        (cx + bar_w // 2, cy - dial_r + bar_len // 2)
    ], fill=(255, 68, 0, 255))
    
    # Center Brutalist Crosshair
    ch_len = int(size * 0.12)
    ch_w = int(size * 0.02)
    # Horizontal line
    draw.rectangle([(cx - ch_len, cy - ch_w // 2), (cx + ch_len, cy + ch_w // 2)], fill=(255, 255, 255, 255))
    # Vertical line
    draw.rectangle([(cx - ch_w // 2, cy - ch_len), (cx + ch_w // 2, cy + ch_len)], fill=(255, 255, 255, 255))
    # Center cut circle
    draw.ellipse([(cx - ch_w, cy - ch_w), (cx + ch_w, cy + ch_w)], fill=(8, 8, 10, 255))

    return img

def render_concept_4(size=1024):
    """
    Concept 4: 'Pure Typographic Swiss Grid [ 25 ]'
    Bold International Typographic Style (Helvetica/Akzidenz-Grotesk spirit).
    The iconic focus duration '25' set inside stark architectural framing brackets.
    """
    img = Image.new('RGBA', (size, size), (5, 5, 5, 255))
    draw = ImageDraw.Draw(img)
    
    pad = int(size * 0.05)
    r = int(size * 0.22)
    draw.rounded_rectangle([(pad, pad), (size - pad, size - pad)], radius=r, outline=(255, 255, 255, 40), width=3)
    
    cx = size // 2
    cy = size // 2
    
    # Architectural corner bracket markers
    bk_len = int(size * 0.12)
    bk_thick = int(size * 0.025)
    bk_margin = int(size * 0.18)
    
    # Top-Left Bracket
    draw.rectangle([(bk_margin, bk_margin), (bk_margin + bk_len, bk_margin + bk_thick)], fill=(255, 255, 255, 255))
    draw.rectangle([(bk_margin, bk_margin), (bk_margin + bk_thick, bk_margin + bk_len)], fill=(255, 255, 255, 255))
    
    # Top-Right Bracket
    draw.rectangle([(size - bk_margin - bk_len, bk_margin), (size - bk_margin, bk_margin + bk_thick)], fill=(255, 255, 255, 255))
    draw.rectangle([(size - bk_margin - bk_thick, bk_margin), (size - bk_margin, bk_margin + bk_len)], fill=(255, 255, 255, 255))
    
    # Bottom-Left Bracket
    draw.rectangle([(bk_margin, size - bk_margin - bk_thick), (bk_margin + bk_len, size - bk_margin)], fill=(255, 255, 255, 255))
    draw.rectangle([(bk_margin, size - bk_margin - bk_len), (bk_margin + bk_thick, size - bk_margin)], fill=(255, 255, 255, 255))
    
    # Bottom-Right Bracket
    draw.rectangle([(size - bk_margin - bk_len, size - bk_margin - bk_thick), (size - bk_margin, size - bk_margin)], fill=(255, 255, 255, 255))
    draw.rectangle([(size - bk_margin - bk_thick, size - bk_margin - bk_len), (size - bk_margin, size - bk_margin)], fill=(255, 255, 255, 255))
    
    # Center Geometric Glyph: A bold stylized "25" constructed with precise geometric strokes
    # Digit '2'
    d2_x = int(size * 0.28)
    d2_w = int(size * 0.20)
    d_top = int(size * 0.35)
    d_bot = int(size * 0.65)
    st = int(size * 0.045)
    
    # '2' top bar
    draw.rectangle([(d2_x, d_top), (d2_x + d2_w, d_top + st)], fill=(255, 255, 255, 255))
    # '2' right upper vertical
    draw.rectangle([(d2_x + d2_w - st, d_top), (d2_x + d2_w, cy)], fill=(255, 255, 255, 255))
    # '2' middle bar
    draw.rectangle([(d2_x, cy - st//2), (d2_x + d2_w, cy + st//2)], fill=(255, 255, 255, 255))
    # '2' left lower vertical
    draw.rectangle([(d2_x, cy), (d2_x + st, d_bot)], fill=(255, 255, 255, 255))
    # '2' bottom bar
    draw.rectangle([(d2_x, d_bot - st), (d2_x + d2_w, d_bot)], fill=(255, 255, 255, 255))
    
    # Digit '5' (in International Orange)
    d5_x = int(size * 0.53)
    d5_w = int(size * 0.20)
    # '5' top bar
    draw.rectangle([(d5_x, d_top), (d5_x + d5_w, d_top + st)], fill=(255, 68, 0, 255))
    # '5' left upper vertical
    draw.rectangle([(d5_x, d_top), (d5_x + st, cy)], fill=(255, 68, 0, 255))
    # '5' middle bar
    draw.rectangle([(d5_x, cy - st//2), (d5_x + d5_w, cy + st//2)], fill=(255, 68, 0, 255))
    # '5' right lower vertical
    draw.rectangle([(d5_x + d5_w - st, cy), (d5_x + d5_w, d_bot)], fill=(255, 68, 0, 255))
    # '5' bottom bar
    draw.rectangle([(d5_x, d_bot - st), (d5_x + d5_w, d_bot)], fill=(255, 68, 0, 255))

    return img

os.makedirs('/root/logo-concepts', exist_ok=True)
c1 = render_concept_1(1024)
c1.save('/root/logo-concepts/concept-1-bauhaus-p.png')

c2 = render_concept_2(1024)
c2.save('/root/logo-concepts/concept-2-swiss-hourglass.png')

c3 = render_concept_3(1024)
c3.save('/root/logo-concepts/concept-3-braun-dial.png')

c4 = render_concept_4(1024)
c4.save('/root/logo-concepts/concept-4-grid-25.png')

# Combined Showcase Sheet (2x2 grid)
grid = Image.new('RGB', (2048, 2048), (18, 18, 20))
grid.paste(c1, (0, 0))
grid.paste(c2, (1024, 0))
grid.paste(c3, (0, 1024))
grid.paste(c4, (1024, 1024))

grid.save('/root/logo-concepts/showcase-all.png')
print("All 4 Bauhaus/Swiss concepts generated successfully!")
