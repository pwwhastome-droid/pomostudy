import os
import math
from PIL import Image, ImageDraw, ImageFilter

def create_super_logo(size=1024):
    # 1. Supersampled canvas for ultra-crisp antialiasing
    scale = 2
    W = size * scale
    H = size * scale
    
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    center_x = W / 2
    center_y = H / 2

    # --- Background: Sleek Dark Squircle with subtle gradient & border ---
    pad = int(W * 0.04)
    corner = int(W * 0.23)
    
    # Base dark tile (#0c101c -> #04060b)
    bg = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg)
    bg_draw.rounded_rectangle([(pad, pad), (W - pad, H - pad)], radius=corner, fill=(11, 15, 26, 255))
    
    # Subtle inner border glow
    border_draw = ImageDraw.Draw(bg)
    border_draw.rounded_rectangle(
        [(pad, pad), (W - pad, H - pad)],
        radius=corner,
        outline=(255, 255, 255, 28),
        width=int(W * 0.008)
    )
    img = Image.alpha_composite(img, bg)

    # --- Ambient Red / Coral Glow behind the Tomato ---
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_r = int(W * 0.35)
    glow_draw.ellipse(
        [(center_x - glow_r, center_y - glow_r + int(W*0.04)),
         (center_x + glow_r, center_y + glow_r + int(W*0.04))],
        fill=(244, 63, 94, 90)
    )
    glow = glow.filter(ImageFilter.GaussianBlur(int(W * 0.07)))
    img = Image.alpha_composite(img, glow)

    draw = ImageDraw.Draw(img)

    # --- Tomato Body: Beautiful Curvature ---
    # Draw two overlapping organic lobes to create the distinct plump tomato silhouette
    tomato_body = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    tb_draw = ImageDraw.Draw(tomato_body)

    t_y = center_y + int(W * 0.04) # slightly shifted down to balance leaf
    rx = int(W * 0.31)
    ry = int(W * 0.28)

    # Gradient shader for 3D sphere look (deep ruby to vibrant coral-rose)
    steps = 60
    for i in range(steps):
        factor = i / steps
        # Shift light source towards top-left (35% from left, 35% from top)
        cx_step = center_x - int(W * 0.06 * factor)
        cy_step = t_y - int(W * 0.07 * factor)
        
        rx_step = int(rx * (1.0 - factor * 0.85))
        ry_step = int(ry * (1.0 - factor * 0.85))

        # Deep crimson #9f1239 -> Vibrant rose #f43f5e -> Soft coral highlight #fda4af
        if factor < 0.6:
            sub = factor / 0.6
            r = int(180 + (244 - 180) * sub)
            g = int(20 + (63 - 20) * sub)
            b = int(50 + (94 - 50) * sub)
        else:
            sub = (factor - 0.6) / 0.4
            r = int(244 + (253 - 244) * sub)
            g = int(63 + (164 - 63) * sub)
            b = int(94 + (175 - 94) * sub)

        tb_draw.ellipse(
            [(cx_step - rx_step, cy_step - ry_step), (cx_step + rx_step, cy_step + ry_step)],
            fill=(r, g, b, 255)
        )

    img = Image.alpha_composite(img, tomato_body)
    draw = ImageDraw.Draw(img)

    # --- Precision Clock / Focus Track Overlay ---
    # Minimalist, elegant high-tech dial inscribed on the surface
    dial_r = int(W * 0.20)
    dial_cx = center_x
    dial_cy = t_y

    # White semi-transparent dial track
    dial_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d_draw = ImageDraw.Draw(dial_layer)
    
    # 270-degree focus sweep track (Pomodoro duration metaphor)
    d_draw.arc(
        [(dial_cx - dial_r, dial_cy - dial_r), (dial_cx + dial_r, dial_cy + dial_r)],
        start=-90,
        end=170,
        fill=(255, 255, 255, 220),
        width=int(W * 0.024)
    )

    # Subtle remainder dotted track
    d_draw.arc(
        [(dial_cx - dial_r, dial_cy - dial_r), (dial_cx + dial_r, dial_cy + dial_r)],
        start=180,
        end=260,
        fill=(255, 255, 255, 60),
        width=int(W * 0.014)
    )

    # Center modern pivot
    pivot_r = int(W * 0.026)
    d_draw.ellipse(
        [(dial_cx - pivot_r, dial_cy - pivot_r), (dial_cx + pivot_r, dial_cy + pivot_r)],
        fill=(255, 255, 255, 255)
    )
    # Inner dot
    d_draw.ellipse(
        [(dial_cx - int(pivot_r*0.4), dial_cy - int(pivot_r*0.4)),
         (dial_cx + int(pivot_r*0.4), dial_cy + int(pivot_r*0.4))],
        fill=(225, 29, 72, 255)
    )

    # Clock Hands (Crisp, clean geometric arms)
    # Minute hand pointing up-right towards 2 o'clock
    m_len = int(dial_r * 0.72)
    m_angle = -math.pi / 5 # ~ -36 deg
    mx = dial_cx + int(m_len * math.cos(m_angle))
    my = dial_cy + int(m_len * math.sin(m_angle))
    d_draw.line([(dial_cx, dial_cy), (mx, my)], fill=(255, 255, 255, 255), width=int(W * 0.022))

    # Hour hand pointing to 10 o'clock
    h_len = int(dial_r * 0.48)
    h_angle = -math.pi * 0.65
    hx = dial_cx + int(h_len * math.cos(h_angle))
    hy = dial_cy + int(h_len * math.sin(h_angle))
    d_draw.line([(dial_cx, dial_cy), (hx, hy)], fill=(255, 255, 255, 255), width=int(W * 0.024))

    # Minute hand tip point
    d_draw.ellipse([(mx - int(W*0.012), my - int(W*0.012)), (mx + int(W*0.012), my + int(W*0.012))], fill=(255, 255, 255, 255))

    img = Image.alpha_composite(img, dial_layer)
    draw = ImageDraw.Draw(img)

    # --- Modern Botanical Stem & Crown Leaves ---
    leaf_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    l_draw = ImageDraw.Draw(leaf_layer)

    crown_y = t_y - ry + int(W * 0.02)
    
    # Stem: curved arch
    stem_points = [
        (center_x, crown_y),
        (center_x - int(W * 0.01), crown_y - int(W * 0.06)),
        (center_x + int(W * 0.03), crown_y - int(W * 0.11)),
        (center_x + int(W * 0.07), crown_y - int(W * 0.13))
    ]
    # Draw thick stem
    for idx in range(len(stem_points) - 1):
        l_draw.line([stem_points[idx], stem_points[idx+1]], fill=(16, 185, 129, 255), width=int(W * 0.026))

    # Left Leaf (curved polygon)
    left_leaf = [
        (center_x, crown_y),
        (center_x - int(W * 0.11), crown_y - int(W * 0.05)),
        (center_x - int(W * 0.19), crown_y - int(W * 0.02)),
        (center_x - int(W * 0.10), crown_y + int(W * 0.02)),
    ]
    l_draw.polygon(left_leaf, fill=(5, 150, 105, 255))
    
    # Left Leaf Highlight
    l_draw.polygon([
        (center_x - int(W * 0.02), crown_y - int(W * 0.01)),
        (center_x - int(W * 0.11), crown_y - int(W * 0.05)),
        (center_x - int(W * 0.19), crown_y - int(W * 0.02)),
    ], fill=(52, 211, 153, 255))

    # Right Leaf (larger, uplifting sweep)
    right_leaf = [
        (center_x, crown_y),
        (center_x + int(W * 0.08), crown_y - int(W * 0.07)),
        (center_x + int(W * 0.20), crown_y - int(W * 0.06)),
        (center_x + int(W * 0.12), crown_y + int(W * 0.02)),
    ]
    l_draw.polygon(right_leaf, fill=(16, 185, 129, 255))

    # Right Leaf Highlight
    l_draw.polygon([
        (center_x + int(W * 0.02), crown_y - int(W * 0.01)),
        (center_x + int(W * 0.08), crown_y - int(W * 0.07)),
        (center_x + int(W * 0.20), crown_y - int(W * 0.06)),
    ], fill=(110, 231, 183, 255))

    # Center calyx cap
    l_draw.ellipse(
        [(center_x - int(W * 0.035), crown_y - int(W * 0.025)),
         (center_x + int(W * 0.035), crown_y + int(W * 0.025))],
        fill=(16, 185, 129, 255)
    )

    img = Image.alpha_composite(img, leaf_layer)

    # Downscale with high quality Lanczos filter for razor-sharp vector-like finish
    final_icon = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_icon

def export_all():
    base_512 = create_super_logo(512)
    base_512.save('/root/pomodoro-app/public/pomo-icon.png')
    base_512.save('/root/pomodoro-app/android-res/icon.png')

    # Also make adaptive icon foreground (centered with safe zone)
    fg_canvas = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    scaled_core = create_super_logo(380)
    fg_canvas.paste(scaled_core, (66, 66), scaled_core)
    fg_canvas.save('/root/pomodoro-app/android-res/icon-foreground.png')

    densities = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192,
    }

    for folder, s in densities.items():
        d = os.path.join('/root/pomodoro-app/android-res', folder)
        os.makedirs(d, exist_ok=True)
        r = base_512.resize((s, s), Image.Resampling.LANCZOS)
        r.save(os.path.join(d, 'ic_launcher.png'))
        r.save(os.path.join(d, 'ic_launcher_round.png'))
        
        fgr = fg_canvas.resize((s, s), Image.Resampling.LANCZOS)
        fgr.save(os.path.join(d, 'ic_launcher_foreground.png'))

    print("All professional icon assets exported successfully!")

export_all()
