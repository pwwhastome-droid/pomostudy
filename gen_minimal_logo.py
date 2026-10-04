import os
import math
from PIL import Image, ImageDraw, ImageFilter

def create_ultra_minimal_logo(size=1024):
    scale = 2
    W = size * scale
    H = size * scale

    # 1. Base transparent canvas
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))

    # --- Background: Ultra-premium Midnight Squircle with Subtle Neon Border ---
    pad = int(W * 0.04)
    corner = int(W * 0.24)

    bg = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(bg)
    bg_draw.rounded_rectangle(
        [(pad, pad), (W - pad, H - pad)],
        radius=corner,
        fill=(8, 10, 15, 255)
    )
    # Subtle inner bevel stroke
    bg_draw.rounded_rectangle(
        [(pad, pad), (W - pad, H - pad)],
        radius=corner,
        outline=(255, 255, 255, 30),
        width=int(W * 0.008)
    )
    img = Image.alpha_composite(img, bg)

    center_x = W / 2
    center_y = H / 2 + int(W * 0.02) # Balanced vertical center

    # --- Soft Ambient Core Glow ---
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    gr = int(W * 0.38)
    glow_draw.ellipse(
        [(center_x - gr, center_y - gr), (center_x + gr, center_y + gr)],
        fill=(244, 63, 94, 65)
    )
    glow = glow.filter(ImageFilter.GaussianBlur(int(W * 0.09)))
    img = Image.alpha_composite(img, glow)

    # --- The Geometry Layer (Vector-like Sharp Drawing) ---
    vector_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    v_draw = ImageDraw.Draw(vector_layer)

    r_outer = int(W * 0.31)
    stroke_w = int(W * 0.048) # Bold, confident stroke

    # 1. Outer Track Ring (Subtle Track)
    v_draw.ellipse(
        [(center_x - r_outer, center_y - r_outer),
         (center_x + r_outer, center_y + r_outer)],
        fill=None,
        outline=(255, 255, 255, 18),
        width=stroke_w
    )

    # 2. Main Focus Arc: 270-degree Glowing Rose-Red Sweep (from -90 to 180 deg)
    # Draw arc in progressive gradient segments
    arc_steps = 180
    start_ang = -90
    total_sweep = 275

    for i in range(arc_steps):
        t = i / arc_steps
        cur_start = start_ang + t * total_sweep
        cur_end = cur_start + (total_sweep / arc_steps) + 1.2
        
        # Color transition: Coral-Orange (#fb7185 / #ff5376) to Deep Rose (#e11d48)
        r = int(255 - t * 45)
        g = int(80 - t * 50)
        b = int(120 - t * 50)
        
        v_draw.arc(
            [(center_x - r_outer, center_y - r_outer),
             (center_x + r_outer, center_y + r_outer)],
            start=cur_start,
            end=cur_end,
            fill=(r, g, b, 255),
            width=stroke_w
        )

    # Rounded endcaps for the arc
    # Start cap at -90 deg (top center)
    cap_r = stroke_w // 2
    top_cap_x = center_x
    top_cap_y = center_y - r_outer
    v_draw.ellipse(
        [(top_cap_x - cap_r, top_cap_y - cap_r), (top_cap_x + cap_r, top_cap_y + cap_r)],
        fill=(255, 80, 120, 255)
    )
    # End cap at end angle
    end_rad = math.radians(start_ang + total_sweep)
    end_cap_x = center_x + int(r_outer * math.cos(end_rad))
    end_cap_y = center_y + int(r_outer * math.sin(end_rad))
    v_draw.ellipse(
        [(end_cap_x - cap_r, end_cap_y - cap_r), (end_cap_x + cap_r, end_cap_y + cap_r)],
        fill=(210, 30, 70, 255)
    )

    # 3. Inner Center Clockwork: Sculpted Play/Focus Geometry
    # Solid center hub
    hub_r = int(W * 0.052)
    v_draw.ellipse(
        [(center_x - hub_r, center_y - hub_r), (center_x + hub_r, center_y + hub_r)],
        fill=(255, 255, 255, 255)
    )
    # High-contrast center core
    core_r = int(hub_r * 0.45)
    v_draw.ellipse(
        [(center_x - core_r, center_y - core_r), (center_x + core_r, center_y + core_r)],
        fill=(15, 23, 42, 255)
    )

    # Minute Hand (Pointing up-right at 2:00 / 45 deg - forward momentum)
    m_len = int(r_outer * 0.65)
    m_ang = math.radians(-38)
    mx = center_x + int(m_len * math.cos(m_ang))
    my = center_y + int(m_len * math.sin(m_ang))
    v_draw.line(
        [(center_x, center_y), (mx, my)],
        fill=(255, 255, 255, 255),
        width=int(W * 0.038)
    )
    v_draw.ellipse(
        [(mx - int(W*0.019), my - int(W*0.019)), (mx + int(W*0.019), my + int(W*0.019))],
        fill=(255, 255, 255, 255)
    )

    # Hour Hand (Pointing straight up to 12:00)
    h_len = int(r_outer * 0.44)
    v_draw.line(
        [(center_x, center_y), (center_x, center_y - h_len)],
        fill=(255, 255, 255, 255),
        width=int(W * 0.038)
    )
    v_draw.ellipse(
        [(center_x - int(W*0.019), center_y - h_len - int(W*0.019)),
         (center_x + int(W*0.019), center_y - h_len + int(W*0.019))],
        fill=(255, 255, 255, 255)
    )

    # 4. Minimalist Organic Leaf Accent (Emerald Green Crown at Top-Right)
    # An iconic 45-degree angled sleek pill-leaf that breaks the circle organically
    leaf_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    leaf_draw = ImageDraw.Draw(leaf_layer)

    leaf_cx = center_x + int(r_outer * 0.58)
    leaf_cy = center_y - int(r_outer * 0.88)
    leaf_w = int(W * 0.08)
    leaf_h = int(W * 0.16)

    # Draw slanted capsule leaf
    leaf_img = Image.new('RGBA', (leaf_w, leaf_h), (0, 0, 0, 0))
    li_draw = ImageDraw.Draw(leaf_img)
    li_draw.rounded_rectangle(
        [(0, 0), (leaf_w, leaf_h)],
        radius=leaf_w // 2,
        fill=(16, 185, 129, 255)
    )
    # Bright emerald inner streak
    li_draw.rounded_rectangle(
        [(int(leaf_w * 0.3), int(leaf_h * 0.15)),
         (int(leaf_w * 0.7), int(leaf_h * 0.65))],
        radius=int(leaf_w * 0.2),
        fill=(110, 231, 183, 255)
    )

    # Rotate leaf by 40 degrees
    rotated_leaf = leaf_img.rotate(-42, resample=Image.Resampling.BICUBIC, expand=True)
    rw, rh = rotated_leaf.size
    vector_layer.paste(rotated_leaf, (int(leaf_cx - rw/2), int(leaf_cy - rh/2)), rotated_leaf)

    img = Image.alpha_composite(img, vector_layer)

    # High-quality Lanczos downsample to target size
    return img.resize((size, size), Image.Resampling.LANCZOS)

def generate_assets():
    base = create_ultra_minimal_logo(512)
    base.save('/root/pomodoro-app/public/pomo-icon.png')
    base.save('/root/pomodoro-app/android-res/icon.png')

    # Adaptive foreground: perfectly centered with Android safe margins
    fg = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    scaled = create_ultra_minimal_logo(380)
    fg.paste(scaled, (66, 66), scaled)
    fg.save('/root/pomodoro-app/android-res/icon-foreground.png')

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
        r = base.resize((s, s), Image.Resampling.LANCZOS)
        r.save(os.path.join(d, 'ic_launcher.png'))
        r.save(os.path.join(d, 'ic_launcher_round.png'))

        fgr = fg.resize((s, s), Image.Resampling.LANCZOS)
        fgr.save(os.path.join(d, 'ic_launcher_foreground.png'))

    print("Ultra-minimal clean logo generated across all mipmap targets!")

generate_assets()
