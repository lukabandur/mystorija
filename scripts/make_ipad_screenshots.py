from PIL import Image, ImageDraw, ImageFont
import os

RAW = "screenshots/raw/Simulator Screenshot - iPhone 17 - 2026-06-12 at %s.png"
ORANGE = (196, 98, 45)
DARK = (26, 26, 26)
CREAM = (248, 245, 240)

# 13" iPad display
W, H = 2048, 2732
FONT = "C:/Windows/Fonts/georgiab.ttf"

SETS = {
    "de": [
        ("11.56.58", "Dein Raum,\nneu gedacht mit KI"),
        ("11.57.19", "Frag den KI-\nRenovierungsexperten"),
        ("11.58.02", "Inspo gesehen?\nKI erkennt alles"),
        ("11.58.14", "100+ Ideen\n& Trends 2026"),
        ("11.58.19", "Schritt-für-Schritt\nAnleitungen"),
        ("11.58.23", "Plane dein Projekt\nvon A bis Z"),
    ],
    "en": [
        ("12.00.06", "Your room,\nreimagined with AI"),
        ("12.00.10", "Ask the AI\nrenovation expert"),
        ("12.00.13", "Found inspo?\nAI identifies it all"),
        ("12.00.16", "100+ ideas\n& trends 2026"),
        ("12.00.19", "Step-by-step\nDIY guides"),
        ("12.00.22", "Plan your project\nfrom A to Z"),
    ],
}

def rounded(img, radius):
    mask = Image.new("L", img.size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, img.size[0], img.size[1]], radius=radius, fill=255)
    out = Image.new("RGBA", img.size)
    out.paste(img, (0, 0), mask)
    return out

for lang, shots in SETS.items():
    outdir = f"screenshots/store_{lang}_ipad"
    os.makedirs(outdir, exist_ok=True)
    for i, (ts, caption) in enumerate(shots):
        bg_color = ORANGE if i % 2 == 0 else DARK
        canvas = Image.new("RGB", (W, H), bg_color)
        d = ImageDraw.Draw(canvas)

        font = ImageFont.truetype(FONT, 120)
        lines = caption.split("\n")
        y = 170
        for line in lines:
            bbox = d.textbbox((0, 0), line, font=font)
            lw = bbox[2] - bbox[0]
            d.text(((W - lw) / 2 - bbox[0], y), line, fill="white" if i % 2 else CREAM, font=font)
            y += 160

        shot = Image.open(RAW % ts).convert("RGB")
        target_w = 1080
        target_h = int(shot.size[1] * target_w / shot.size[0])
        shot = shot.resize((target_w, target_h), Image.LANCZOS)
        shot = rounded(shot, 70)

        sx = (W - target_w) // 2
        sy = y + 110
        canvas.paste(shot, (sx, sy), shot)
        canvas.save(f"{outdir}/{i+1:02d}.png")
        print(lang, i + 1, canvas.size)

print("done")
