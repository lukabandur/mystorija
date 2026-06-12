from PIL import Image, ImageDraw, ImageFont
import os

os.makedirs("resources/variants", exist_ok=True)

ACCENT = (196, 98, 45)
ACCENT_DARK = (160, 82, 45)
CREAM = (248, 245, 240)
DARK = (26, 26, 26)
S = 1024
F = "C:/Windows/Fonts/georgiab.ttf"

def center_text(d, text, font, size, fill, dy=0):
    bbox = d.textbbox((0, 0), text, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((size - w) / 2 - bbox[0], (size - h) / 2 - bbox[1] + dy), text, fill=fill, font=font)

# ── V1: Vertikaler Farbverlauf orange -> dunkler, weißes M ──
img = Image.new("RGB", (S, S), ACCENT)
d = ImageDraw.Draw(img)
for y in range(S):
    t = y / S
    r = int(ACCENT[0] + (ACCENT_DARK[0] - ACCENT[0]) * t)
    g = int(ACCENT[1] + (ACCENT_DARK[1] - ACCENT[1]) * t)
    b = int(ACCENT[2] + (ACCENT_DARK[2] - ACCENT[2]) * t)
    d.line([(0, y), (S, y)], fill=(r, g, b))
font = ImageFont.truetype(F, 600)
center_text(d, "M", font, S, "white", dy=20)
img.save("resources/variants/v1_gradient.png")

# ── V2: M mit Dach-Linie darüber (Haus-Andeutung) ──
img = Image.new("RGB", (S, S), ACCENT)
d = ImageDraw.Draw(img)
font = ImageFont.truetype(F, 520)
center_text(d, "M", font, S, "white", dy=90)
# Dach über dem M
roof_w, roof_h, cy = 560, 170, 240
cx = S // 2
d.line([(cx - roof_w//2, cy + roof_h//2), (cx, cy - roof_h//2), (cx + roof_w//2, cy + roof_h//2)], fill="white", width=52, joint="curve")
img.save("resources/variants/v2_roof.png")

# ── V3: Creme-Hintergrund, oranges M (invertiert) ──
img = Image.new("RGB", (S, S), CREAM)
d = ImageDraw.Draw(img)
font = ImageFont.truetype(F, 600)
center_text(d, "M", font, S, ACCENT, dy=20)
img.save("resources/variants/v3_inverted.png")

# ── V4: M mit Sparkle-Akzent (wie App-Branding ✨) ──
img = Image.new("RGB", (S, S), ACCENT)
d = ImageDraw.Draw(img)
font = ImageFont.truetype(F, 580)
center_text(d, "M", font, S, "white", dy=40)
# 4-Strahlen-Funke oben rechts
def sparkle(d, cx, cy, r, fill):
    pts = []
    import math
    for i in range(8):
        ang = math.pi / 4 * i - math.pi / 2
        rad = r if i % 2 == 0 else r * 0.32
        pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
    d.polygon(pts, fill=fill)
sparkle(d, 760, 230, 110, CREAM)
sparkle(d, 870, 360, 50, CREAM)
img.save("resources/variants/v4_sparkle.png")

# ── Übersicht 2x2 ──
grid = Image.new("RGB", (S + 40, S + 40), "white")
for i, name in enumerate(["v1_gradient", "v2_roof", "v3_inverted", "v4_sparkle"]):
    v = Image.open(f"resources/variants/{name}.png").resize((S // 2 - 10, S // 2 - 10))
    x = 10 + (i % 2) * (S // 2 + 10)
    y = 10 + (i // 2) * (S // 2 + 10)
    grid.paste(v, (x, y))
grid.save("resources/variants/uebersicht.png")
print("done")
