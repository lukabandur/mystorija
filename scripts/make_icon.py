from PIL import Image, ImageDraw, ImageFont
import os

os.makedirs("resources", exist_ok=True)

ACCENT = (196, 98, 45)      # #C4622D
BG = (248, 245, 240)        # #F8F5F0
DARK = (26, 26, 26)         # #1A1A1A

# ── App Icon 1024x1024: orange bg, white serif "M" ──
size = 1024
img = Image.new("RGB", (size, size), ACCENT)
d = ImageDraw.Draw(img)
font = ImageFont.truetype("C:/Windows/Fonts/georgiab.ttf", 640)
bbox = d.textbbox((0, 0), "M", font=font)
w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
d.text(((size - w) / 2 - bbox[0], (size - h) / 2 - bbox[1]), "M", fill="white", font=font)
img.save("resources/icon-only.png")
print("icon-only.png done")

# ── Splash 2732x2732: cream bg, centered "Mystorija" logo ──
ssize = 2732
splash = Image.new("RGB", (ssize, ssize), BG)
d = ImageDraw.Draw(splash)
f_logo = ImageFont.truetype("C:/Windows/Fonts/georgiab.ttf", 220)
text_my, text_storija = "My", "storija"
b1 = d.textbbox((0, 0), text_my, font=f_logo)
b2 = d.textbbox((0, 0), text_storija, font=f_logo)
total_w = (b1[2] - b1[0]) + (b2[2] - b2[0])
x = (ssize - total_w) / 2
y = (ssize - (b1[3] - b1[1])) / 2 - b1[1]
d.text((x - b1[0], y), text_my, fill=DARK, font=f_logo)
d.text((x - b1[0] + (b1[2] - b1[0]), y), text_storija, fill=ACCENT, font=f_logo)
splash.save("resources/splash.png")
print("splash.png done")

# ── Dark splash ──
splash_d = Image.new("RGB", (ssize, ssize), DARK)
d = ImageDraw.Draw(splash_d)
d.text((x - b1[0], y), text_my, fill="white", font=f_logo)
d.text((x - b1[0] + (b1[2] - b1[0]), y), text_storija, fill=ACCENT, font=f_logo)
splash_d.save("resources/splash-dark.png")
print("splash-dark.png done")
