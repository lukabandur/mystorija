from PIL import Image
import os, glob

# iPhone 6.5" display required size
TARGET = (1284, 2778)

for lang in ("de", "en"):
    src_dir = f"screenshots/store_{lang}"
    out_dir = f"screenshots/store_{lang}_65"
    os.makedirs(out_dir, exist_ok=True)
    for f in sorted(glob.glob(f"{src_dir}/*.png")):
        img = Image.open(f).convert("RGB").resize(TARGET, Image.LANCZOS)
        out = os.path.join(out_dir, os.path.basename(f))
        img.save(out)
        print(lang, os.path.basename(f), img.size)
print("done")
