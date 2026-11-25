# 캡처 여러 장을 한 장으로 모아요: python3 -I sheet.py OUT.png COLS W img1 img2 ...
import sys
from PIL import Image, ImageDraw
out, cols, w = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]); files = sys.argv[4:]
ims = [Image.open(f).convert('RGB') for f in files]; h = int(ims[0].height * w / ims[0].width)
rows = (len(ims) + cols - 1) // cols; sheet = Image.new('RGB', (cols * w, rows * (h + 16)), (20, 20, 24)); d = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(files, ims)):
    x, y = i % cols * w, i // cols * (h + 16); sheet.paste(im.resize((w, h)), (x, y + 16)); d.text((x + 4, y + 2), f.split('/')[-1], fill=(240, 220, 160))
sheet.save(out)
