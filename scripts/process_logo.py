from PIL import Image

src = Image.open(r"C:\Users\rene_\Downloads\9FB88165-D96B-4379-8820-4A0786217313.png").convert("RGB")
w, h = src.size
print("source:", w, h)

# Orangenen Bereich finden (weißen Rand abschneiden)
px = src.load()
def is_orange(p):
    r, g, b = p
    return r > 150 and g < 180 and b < 120 and r > g > b

left = next(x for x in range(w) if any(is_orange(px[x, y]) for y in range(0, h, 10)))
right = next(x for x in range(w - 1, -1, -1) if any(is_orange(px[x, y]) for y in range(0, h, 10)))
top = next(y for y in range(h) if any(is_orange(px[x, y]) for x in range(0, w, 10)))
bottom = next(y for y in range(h - 1, -1, -1) if any(is_orange(px[x, y]) for x in range(0, w, 10)))
print("orange bounds:", left, top, right, bottom)

icon = src.crop((left, top, right + 1, bottom + 1))
iw, ih = icon.size

# 7.5% pro Seite reinzoomen damit die abgerundeten Ecken verschwinden
inset = int(min(iw, ih) * 0.075)
icon = icon.crop((inset, inset, iw - inset, ih - inset))

icon = icon.resize((1024, 1024), Image.LANCZOS)
icon.save("resources/icon-only.png")
print("saved resources/icon-only.png 1024x1024")
