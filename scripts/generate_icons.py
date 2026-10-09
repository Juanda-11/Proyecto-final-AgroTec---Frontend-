"""Genera los iconos de AgroTec (requiere Pillow: pip install pillow).

Uso:  python scripts/generate_icons.py
Crea assets/icon.png, adaptive-icon.png, favicon.png y splash-icon.png.
Después añade en app.json (expo): "icon", "android.adaptiveIcon.foregroundImage",
"web.favicon" y "splash.image" apuntando a esos archivos.
"""
import math
import os

from PIL import Image, ImageDraw


def icon(size: int, bg: bool = True) -> Image.Image:
    s = size * 4
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if bg:
        g = Image.new("RGBA", (s, s))
        gd = ImageDraw.Draw(g)
        for y in range(s):
            t = y / s
            gd.line([(0, y), (s, y)], fill=(int(198 - 71 * t), int(248 - 47 * t), int(92 - 61 * t), 255))
        mask = Image.new("L", (s, s), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.22), fill=255)
        im.paste(g, (0, 0), mask)
    cx, cy, r = s * 0.5, s * 0.52, s * 0.27
    leaf = Image.new("L", (s, s), 0)
    ld = ImageDraw.Draw(leaf)
    ld.polygon([(cx, cy - r * 1.35), (cx + r, cy + r * 0.15), (cx + r * 0.35, cy + r * 1.1),
                (cx - r * 0.9, cy + r * 0.75), (cx - r * 0.95, cy - r * 0.35)], fill=255)
    ld.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    leaf = leaf.rotate(-30, center=(cx, cy), resample=Image.BICUBIC)
    im.paste(Image.new("RGBA", (s, s), (16, 33, 15, 255)), (0, 0), leaf)
    d.line([(cx - r * 0.55, cy + r * 0.75), (cx + r * 0.35, cy - r * 0.55)], fill=(198, 248, 92, 255), width=int(s * 0.025))
    return im.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(__file__), "..", "assets")
    os.makedirs(out, exist_ok=True)
    icon(1024).save(os.path.join(out, "icon.png"))
    icon(512, bg=False).save(os.path.join(out, "adaptive-icon.png"))
    icon(48).save(os.path.join(out, "favicon.png"))
    icon(1024, bg=False).save(os.path.join(out, "splash-icon.png"))
    print("Iconos generados en", os.path.abspath(out))
