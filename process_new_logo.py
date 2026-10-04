import os
from PIL import Image, ImageDraw

src_path = '/root/.hermes/cache/images/img_41f82ae5da87.jpg'
src = Image.open(src_path).convert('RGBA')

# 1. 512x512 base icon for PWA and general app icon
icon_512 = src.resize((512, 512), Image.Resampling.LANCZOS)
icon_512.save('/root/pomodoro-app/public/pomo-icon.png', 'PNG')
icon_512.save('/root/pomodoro-app/android-res/icon.png', 'PNG')

# 2. Round icon: Mask circular edges for devices that use ic_launcher_round
mask = Image.new('L', (512, 512), 0)
mask_draw = ImageDraw.Draw(mask)
mask_draw.ellipse([(0, 0), (512, 512)], fill=255)

round_512 = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
round_512.paste(icon_512, (0, 0))
# On Android, if the icon already has a squircle, we can keep the squircle or apply circle mask
# Let's create an adaptive foreground where the icon is centered with ~70% scale to avoid launcher cropping
fg_512 = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
# Inner icon scaled to 72% (368x368) centered at offset 72, 72
inner_scaled = src.resize((368, 368), Image.Resampling.LANCZOS)
fg_512.paste(inner_scaled, (72, 72))
fg_512.save('/root/pomodoro-app/android-res/icon-foreground.png', 'PNG')

densities = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

for folder, size in densities.items():
    out_dir = os.path.join('/root/pomodoro-app/android-res', folder)
    os.makedirs(out_dir, exist_ok=True)
    
    # Standard launcher
    std = icon_512.resize((size, size), Image.Resampling.LANCZOS)
    std.save(os.path.join(out_dir, 'ic_launcher.png'), 'PNG')
    
    # Round launcher
    rnd = round_512.resize((size, size), Image.Resampling.LANCZOS)
    rnd.save(os.path.join(out_dir, 'ic_launcher_round.png'), 'PNG')
    
    # Foreground adaptive
    fg = fg_512.resize((size, size), Image.Resampling.LANCZOS)
    fg.save(os.path.join(out_dir, 'ic_launcher_foreground.png'), 'PNG')

print("Successfully processed and saved all logo mipmap assets!")
