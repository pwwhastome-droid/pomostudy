import os
import math
from PIL import Image, ImageDraw

def create_pomo_icon(size=512):
    # Create image with RGBA
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Subtle Dark Rounded Squircle Background
    margin = int(size * 0.04)
    radius = int(size * 0.22)
    # Background squircle
    draw.rounded_rectangle(
        [(margin, margin), (size - margin, size - margin)],
        radius=radius,
        fill=(9, 13, 22, 255)
    )

    # 2. Outer Glow Ring
    center = size // 2
    r_outer = int(size * 0.38)
    draw.ellipse(
        [(center - r_outer, center - r_outer), (center + r_outer, center + r_outer)],
        fill=None,
        outline=(244, 63, 94, 70),
        width=int(size * 0.035)
    )

    # 3. Main Tomato / Focus Core Circle
    r_core = int(size * 0.33)
    # Radial look via concentric fills
    steps = 40
    for i in range(steps):
        factor = i / steps
        r_step = int(r_core * (1.0 - factor * 0.7))
        # Gradient from #f43f5e (244, 63, 94) to #be123c (190, 18, 60)
        r = int(244 - factor * 54)
        g = int(63 - factor * 45)
        b = int(94 - factor * 34)
        draw.ellipse(
            [(center - r_step, center - r_step), (center + r_step, center + r_step)],
            fill=(r, g, b, 255)
        )

    # 4. Timer Arc (White glowing progress tick marks)
    r_track = int(size * 0.24)
    draw.arc(
        [(center - r_track, center - r_track), (center + r_track, center + r_track)],
        start=40,
        end=300,
        fill=(255, 255, 255, 230),
        width=int(size * 0.032)
    )

    # 5. Dial Hands & Center Pin
    pin_r = int(size * 0.035)
    draw.ellipse(
        [(center - pin_r, center - pin_r), (center + pin_r, center + pin_r)],
        fill=(255, 255, 255, 255)
    )
    # Hand pointing up-right
    hand_len = int(size * 0.16)
    angle = -math.pi / 4 # 45 degrees up-right
    x_end = center + int(hand_len * math.cos(angle))
    y_end = center + int(hand_len * math.sin(angle))
    draw.line([(center, center), (x_end, y_end)], fill=(255, 255, 255, 255), width=int(size * 0.03))

    # Hand pointing straight up
    hand_len_m = int(size * 0.19)
    draw.line([(center, center), (center, center - hand_len_m)], fill=(255, 255, 255, 255), width=int(size * 0.024))

    # 6. Green Leaf Stem at top
    stem_top_y = int(size * 0.14)
    draw.line(
        [(center, int(size * 0.22)), (center + int(size * 0.04), stem_top_y)],
        fill=(16, 185, 129, 255),
        width=int(size * 0.03)
    )
    # Leaf oval
    draw.ellipse(
        [(center + int(size * 0.02), stem_top_y - int(size * 0.03)),
         (center + int(size * 0.10), stem_top_y + int(size * 0.03))],
        fill=(52, 211, 153, 255)
    )

    return img

os.makedirs('/root/pomodoro-app/android-res', exist_ok=True)
base_img = create_pomo_icon(512)
base_img.save('/root/pomodoro-app/public/pomo-icon.png')
base_img.save('/root/pomodoro-app/android-res/icon.png')

# Foreground for adaptive icon
fg_img = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
# Paste scaled center icon into foreground
small_img = create_pomo_icon(360)
fg_img.paste(small_img, (76, 76), small_img)
fg_img.save('/root/pomodoro-app/android-res/icon-foreground.png')

# Sizes for Android mipmap
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
    resized = base_img.resize((s, s), Image.Resampling.LANCZOS)
    resized.save(os.path.join(d, 'ic_launcher.png'))
    resized.save(os.path.join(d, 'ic_launcher_round.png'))
    
    fg_resized = fg_img.resize((s, s), Image.Resampling.LANCZOS)
    fg_resized.save(os.path.join(d, 'ic_launcher_foreground.png'))

print("All Android launcher icons generated successfully!")
