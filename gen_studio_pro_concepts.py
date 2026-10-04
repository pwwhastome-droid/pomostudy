import os
import math
from PIL import Image, ImageDraw, ImageFilter

def create_super_canvas(size=1024):
    scale = 2
    return size * scale

def pro_concept_A(size=1024):
    """
    Concept A: 'The Monolithic Lens / Linear Precision'
    Pure Apple / Linear / Raycast craft.
    Deep brushed obsidian tile (#08080a) with microscopic 1px frosted glass bevel.
    In the center: an offset, layered dual-aperture ring with an internal caustic ambient glow.
    Sharp, ultra-expensive industrial design feel.
    """
    S = size * 2
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    
    pad = int(S * 0.05)
    corner = int(S * 0.23)
    
    # 1. Base tile: Rich dark obsidian
    bg = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    b_draw = ImageDraw.Draw(bg)
    b_draw.rounded_rectangle([(pad, pad), (S - pad, S - pad)], radius=corner, fill=(9, 10, 14, 255))
    
    # Crisp micro-edge highlight (top light reflection)
    b_draw.rounded_rectangle([(pad, pad), (S - pad, S - pad)], radius=corner, outline=(255, 255, 255, 35), width=int(S * 0.004))
    img = Image.alpha_composite(img, bg)
    
    cx, cy = S // 2, S // 2
    
    # 2. Subsurface Ember Caustic Glow (Deep optical refraction)
    glow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow)
    g_r = int(S * 0.30)
    g_draw.ellipse([(cx - g_r, cy - g_r + int(S * 0.02)), (cx + g_r, cy + g_r + int(S * 0.02))], fill=(255, 75, 43, 75))
    glow = glow.filter(ImageFilter.GaussianBlur(int(S * 0.08)))
    img = Image.alpha_composite(img, glow)
    
    # 3. Precision Machined Aperture Rings
    ring_layer = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    r_draw = ImageDraw.Draw(ring_layer)
    
    r_main = int(S * 0.28)
    w_main = int(S * 0.038)
    
    # Outer dark titanium guide ring
    r_draw.ellipse([(cx - r_main, cy - r_main), (cx + r_main, cy + r_main)], outline=(255, 255, 255, 20), width=int(S * 0.008))
    
    # Primary Focus Crescent (Machined chamfered arc with luminous gradient)
    steps = 160
    arc_span = 260
    start_deg = -85
    for i in range(steps):
        t = i / steps
        a1 = start_deg + t * arc_span
        a2 = a1 + (arc_span / steps) + 1.2
        # Optical white to luminous ember-orange transition
        if t < 0.35:
            st = t / 0.35
            cr = 255
            cg = int(255 - (255 - 100) * st)
            cb = int(255 - (255 - 60) * st)
        else:
            st = (t - 0.35) / 0.65
            cr = int(255 - 35 * st)
            cg = int(100 - 45 * st)
            cb = int(60 - 30 * st)
        r_draw.arc([(cx - r_main, cy - r_main), (cx + r_main, cy + r_main)], start=a1, end=a2, fill=(cr, cg, cb, 255), width=w_main)
        
    # Terminal precision caps
    cap_r = w_main // 2
    # Start cap at top
    r_draw.ellipse([(cx - cap_r, cy - r_main - cap_r), (cx + cap_r, cy - r_main + cap_r)], fill=(255, 255, 255, 255))
    # End cap
    end_rad = math.radians(start_deg + arc_span)
    ex = cx + int(r_main * math.cos(end_rad))
    ey = cy + int(r_main * math.sin(end_rad))
    r_draw.ellipse([(ex - cap_r, ey - cap_r), (ex + cap_r, ey + cap_r)], fill=(220, 55, 30, 255))
    
    # 4. Floating Concentric Core Node (Zero clutter, pure optical balance)
    core_r = int(S * 0.08)
    r_draw.ellipse([(cx - core_r, cy - core_r), (cx + core_r, cy + core_r)], fill=(18, 20, 28, 255), outline=(255, 255, 255, 45), width=int(S * 0.005))
    
    # Radiant center jewel
    jewel_r = int(S * 0.035)
    r_draw.ellipse([(cx - jewel_r, cy - jewel_r), (cx + jewel_r, cy + jewel_r)], fill=(255, 75, 43, 255))
    
    # Micro white pulse dot
    dot_r = int(S * 0.012)
    r_draw.ellipse([(cx - dot_r, cy - dot_r), (cx + dot_r, cy + dot_r)], fill=(255, 255, 255, 255))

    img = Image.alpha_composite(img, ring_layer)
    return img.resize((size, size), Image.Resampling.LANCZOS)


def pro_concept_B(size=1024):
    """
    Concept B: 'The Kinetic Infinity Knot / Hyper-Flow'
    Fluid mathematical geometry: an impossible continuous Möbius ribbon symbolizing uninterrupted flow state.
    Frosted titanium ribbon with an energized crimson-to-amber interior edge.
    Very high-end tech logo (like Nothing / Teenage Engineering / Figma).
    """
    S = size * 2
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    
    pad = int(S * 0.05)
    corner = int(S * 0.23)
    
    bg = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    b_draw = ImageDraw.Draw(bg)
    b_draw.rounded_rectangle([(pad, pad), (S - pad, S - pad)], radius=corner, fill=(8, 9, 12, 255))
    b_draw.rounded_rectangle([(pad, pad), (S - pad, S - pad)], radius=corner, outline=(255, 255, 255, 30), width=int(S * 0.004))
    img = Image.alpha_composite(img, bg)
    
    cx, cy = S // 2, S // 2
    
    # Ambient Flow Glow
    glow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow)
    g_draw.ellipse([(cx - int(S*0.35), cy - int(S*0.22)), (cx + int(S*0.35), cy + int(S*0.22))], fill=(255, 60, 40, 70))
    glow = glow.filter(ImageFilter.GaussianBlur(int(S * 0.09)))
    img = Image.alpha_composite(img, glow)
    
    ribbon = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    r_draw = ImageDraw.Draw(ribbon)
    
    # Parametric Infinity Loop (Lemniscate of Bernoulli)
    loop_points = []
    num_pts = 600
    a = int(S * 0.30)
    for i in range(num_pts):
        t = (i / num_pts) * 2 * math.pi
        denom = 1 + (math.sin(t) ** 2)
        x = cx + int((a * math.cos(t)) / denom)
        y = cy + int((a * math.sin(t) * math.cos(t)) / denom)
        loop_points.append((x, y))
        
    thick = int(S * 0.058)
    
    # Draw dark track base
    for idx in range(len(loop_points) - 1):
        r_draw.line([loop_points[idx], loop_points[idx+1]], fill=(30, 34, 45, 255), width=thick)
        
    # Draw dynamic glowing energy overlay on one cycle
    half = len(loop_points) // 2
    for idx in range(half):
        progress = idx / half
        # Radiant gradient: White -> Coral -> Deep Crimson
        if progress < 0.4:
            sp = progress / 0.4
            r = int(255)
            g = int(255 - 130 * sp)
            b = int(255 - 170 * sp)
        else:
            sp = (progress - 0.4) / 0.6
            r = int(255 - 40 * sp)
            g = int(125 - 85 * sp)
            b = int(85 - 55 * sp)
            
        r_draw.line([loop_points[idx], loop_points[idx+1]], fill=(r, g, b, 255), width=int(thick * 0.9))

    img = Image.alpha_composite(img, ribbon)
    return img.resize((size, size), Image.Resampling.LANCZOS)


def pro_concept_C(size=1024):
    """
    Concept C: 'The Architectural Chronograph / Swiss Monolith'
    Heavy brutalist typography and architectural precision (like Acronym, Teenage Engineering, Bang & Olufsen).
    Deep charcoal matte block, razor-sharp 4-quadrant crosshair, ultra-minimal 25m quadrant indicator, pure Swiss typography.
    """
    S = size * 2
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    
    pad = int(S * 0.05)
    corner = int(S * 0.23)
    
    bg = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    b_draw = ImageDraw.Draw(bg)
    b_draw.rounded_rectangle([(pad, pad), (S - pad, S - pad)], radius=corner, fill=(12, 13, 16, 255))
    b_draw.rounded_rectangle([(pad, pad), (S - pad, S - pad)], radius=corner, outline=(255, 255, 255, 30), width=int(S * 0.004))
    img = Image.alpha_composite(img, bg)
    
    cx, cy = S // 2, S // 2
    draw = ImageDraw.Draw(img)
    
    # 1. Subtle Precision Technical Grid Crosshairs
    grid_color = (255, 255, 255, 35)
    line_w = int(S * 0.003)
    draw.line([(cx, int(S * 0.18)), (cx, int(S * 0.82))], fill=grid_color, width=line_w)
    draw.line([(int(S * 0.18), cy), (int(S * 0.82), cy)], fill=grid_color, width=line_w)
    
    # 2. Dial Outer Tick Markers (12, 3, 6, 9 o'clock index ticks)
    r_tick = int(S * 0.31)
    tick_len = int(S * 0.035)
    t_thick = int(S * 0.008)
    
    # 12 o'clock (Active International Orange)
    draw.rectangle([(cx - t_thick//2, cy - r_tick - tick_len//2), (cx + t_thick//2, cy - r_tick + tick_len//2)], fill=(255, 70, 30, 255))
    # 3 o'clock
    draw.rectangle([(cx + r_tick - tick_len//2, cy - t_thick//2), (cx + r_tick + tick_len//2, cy + t_thick//2)], fill=(255, 255, 255, 120))
    # 6 o'clock
    draw.rectangle([(cx - t_thick//2, cy + r_tick - tick_len//2), (cx + t_thick//2, cy + r_tick + tick_len//2)], fill=(255, 255, 255, 120))
    # 9 o'clock
    draw.rectangle([(cx - r_tick - tick_len//2, cy - t_thick//2), (cx - r_tick + tick_len//2, cy + t_thick//2)], fill=(255, 255, 255, 120))
    
    # 3. Main Center Piece: The Solid 3/4 Focus Disc (The 75% quadrant subtraction)
    # Drawing an exact, sharp 270-degree pie sector in stark architectural off-white
    disc_r = int(S * 0.22)
    # The active 3 quadrants (Top-Right, Bottom-Right, Bottom-Left)
    draw.pieslice(
        [(cx - disc_r, cy - disc_r), (cx + disc_r, cy + disc_r)],
        start=-90, end=180,
        fill=(248, 248, 250, 255)
    )
    
    # Cutout center ring for pure balance
    hole_r = int(disc_r * 0.46)
    draw.ellipse(
        [(cx - hole_r, cy - hole_r), (cx + hole_r, cy + hole_r)],
        fill=(12, 13, 16, 255)
    )
    
    # Focal Red Dot in the empty 4th quadrant (The rest / goal zone)
    quad_x = cx - int(disc_r * 0.65)
    quad_y = cy - int(disc_r * 0.65)
    qd_r = int(S * 0.04)
    draw.ellipse([(quad_x - qd_r, quad_y - qd_r), (quad_x + qd_r, quad_y + qd_r)], fill=(255, 70, 30, 255))

    return img.resize((size, size), Image.Resampling.LANCZOS)


def pro_concept_D(size=1024):
    """
    Concept D: 'The Prismatic Prism / Minimal Diamond P'
    Ultra-modern dimensional lettermark (Vercel / OpenAI / Pitch calibre).
    Two interlocking precision rhombuses forming an architectural isometric 'P' / prism.
    Subtle warm titanium gradients with an electric vermilion core edge.
    """
    S = size * 2
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    
    pad = int(S * 0.05)
    corner = int(S * 0.23)
    
    bg = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    b_draw = ImageDraw.Draw(bg)
    b_draw.rounded_rectangle([(pad, pad), (S - pad, S - pad)], radius=corner, fill=(7, 8, 10, 255))
    b_draw.rounded_rectangle([(pad, pad), (S - pad, S - pad)], radius=corner, outline=(255, 255, 255, 28), width=int(S * 0.004))
    img = Image.alpha_composite(img, bg)
    
    cx, cy = S // 2, S // 2
    
    # Ambient Deep Glow
    glow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow)
    g_draw.ellipse([(cx - int(S*0.25), cy - int(S*0.25)), (cx + int(S*0.25), cy + int(S*0.25))], fill=(255, 60, 30, 80))
    glow = glow.filter(ImageFilter.GaussianBlur(int(S * 0.08)))
    img = Image.alpha_composite(img, glow)
    
    poly_layer = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    p_draw = ImageDraw.Draw(poly_layer)
    
    # Isometric dimensions
    # Left vertical column facet
    col_w = int(S * 0.12)
    top_y = int(S * 0.25)
    bot_y = int(S * 0.75)
    col_x = cx - int(S * 0.16)
    
    # Pillar (Chalk White to Ice Grey)
    pillar_pts = [
        (col_x, top_y),
        (col_x + col_w, top_y + int(S * 0.05)),
        (col_x + col_w, bot_y),
        (col_x, bot_y - int(S * 0.05))
    ]
    p_draw.polygon(pillar_pts, fill=(245, 246, 250, 255))
    
    # Right Head Upper Facet (Vibrant International Vermilion)
    loop_top_pts = [
        (col_x + col_w, top_y + int(S * 0.05)),
        (col_x + col_w + int(S * 0.24), top_y + int(S * 0.15)),
        (col_x + col_w + int(S * 0.24), top_y + int(S * 0.32)),
        (col_x + col_w, top_y + int(S * 0.22))
    ]
    p_draw.polygon(loop_top_pts, fill=(255, 75, 43, 255))
    
    # Right Head Lower Inverted Facet (Deep Ruby/Coral Shade)
    loop_bot_pts = [
        (col_x + col_w, top_y + int(S * 0.22)),
        (col_x + col_w + int(S * 0.24), top_y + int(S * 0.32)),
        (col_x + col_w + int(S * 0.12), top_y + int(S * 0.44)),
        (col_x + col_w, top_y + int(S * 0.38))
    ]
    p_draw.polygon(loop_bot_pts, fill=(200, 35, 25, 255))
    
    # Micro Floating Focal Point
    dot_x = col_x + col_w + int(S * 0.12)
    dot_y = bot_y - int(S * 0.10)
    dr = int(S * 0.038)
    p_draw.ellipse([(dot_x - dr, dot_y - dr), (dot_x + dr, dot_y + dr)], fill=(255, 255, 255, 255))

    img = Image.alpha_composite(img, poly_layer)
    return img.resize((size, size), Image.Resampling.LANCZOS)


os.makedirs('/root/pro-concepts', exist_ok=True)
imgA = pro_concept_A(1024)
imgA.save('/root/pro-concepts/concept-A-monolithic-lens.png')

imgB = pro_concept_B(1024)
imgB.save('/root/pro-concepts/concept-B-infinity-flow.png')

imgC = pro_concept_C(1024)
imgC.save('/root/pro-concepts/concept-C-architectural-chronograph.png')

imgD = pro_concept_D(1024)
imgD.save('/root/pro-concepts/concept-D-isometric-prism.png')

# Combined Pro Showcase (2x2 Grid)
grid = Image.new('RGB', (2048, 2048), (14, 15, 18))
grid.paste(imgA, (0, 0))
grid.paste(imgB, (1024, 0))
grid.paste(imgC, (0, 1024))
grid.paste(imgD, (1024, 1024))

grid.save('/root/pro-concepts/showcase-pro.png')
print("All 4 studio-grade pro concepts rendered successfully!")
