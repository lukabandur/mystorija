from PIL import Image, ImageDraw, ImageFont
import glob, os

files = sorted(glob.glob("screenshots/raw/*.png"))
print(len(files), "files")
thumb_w = 220
cols = 5
rows = (len(files) + cols - 1) // cols
first = Image.open(files[0])
ratio = first.size[1] / first.size[0]
thumb_h = int(thumb_w * ratio)
sheet = Image.new("RGB", (cols * (thumb_w + 10) + 10, rows * (thumb_h + 30) + 10), "white")
d = ImageDraw.Draw(sheet)
font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 14)
for i, f in enumerate(files):
    img = Image.open(f).resize((thumb_w, thumb_h))
    x = 10 + (i % cols) * (thumb_w + 10)
    y = 10 + (i // cols) * (thumb_h + 30)
    sheet.paste(img, (x, y))
    label = os.path.basename(f).replace("Simulator Screenshot - iPhone 17 - 2026-06-12 at ", "")[:14]
    d.text((x, y + thumb_h + 4), f"{i}: {label}", fill="black", font=font)
    print(i, os.path.basename(f), Image.open(f).size)
sheet.save("screenshots/contact_sheet.png")
print("sheet saved")
