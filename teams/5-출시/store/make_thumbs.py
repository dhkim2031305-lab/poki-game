# 출시팀: GPT 원본(gpt/M1·M2·M3) → 사이트별 크기 (store/thumbnail-지시서.md 표 기준)
# 실행: python3 teams/5-출시/store/make_thumbs.py  (저장소 맨 위에서)
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, 'gpt')
FONT = '/usr/share/fonts/opentype/inter/InterDisplay-Black.otf'
TITLE = 'A World Where Only the Strong Survive'

M1 = Image.open(os.path.join(SRC, 'M1.png')).convert('RGB')
M2 = Image.open(os.path.join(SRC, 'M2.png')).convert('RGB')
M3 = Image.open(os.path.join(SRC, 'M3.png')).convert('RGB')

# M1은 장수·보스가 작아서 가운데(장수·보스가 있는 곳)를 잘라 써요. 주인공 영역: x 400~1520, y 170~880
CX, CY = 960, 525


def crop_center(im, w, h, cx=CX, cy=CY):
    x0 = max(0, min(im.width - w, int(cx - w / 2)))
    y0 = max(0, min(im.height - h, int(cy - h / 2)))
    return im.crop((x0, y0, x0 + w, y0 + h))


def m1(ratio_w, ratio_h, width, cy=CY):
    h = round(width * ratio_h / ratio_w)
    return crop_center(M1, width, h, cy=cy)


def fit(im, size):
    return im.resize(size, Image.LANCZOS)


def add_title(im, where='bottom'):
    """제목 글자만 얹어요 (CrazyGames는 제목 말고 글자 금지)."""
    im = im.copy()
    w, h = im.size
    band = int(h * 0.24)
    grad = Image.new('L', (1, band))
    for y in range(band):
        a = int(200 * (y / band if where == 'bottom' else 1 - y / band))
        grad.putpixel((0, y), a)
    grad = grad.resize((w, band))
    dark = Image.new('RGB', (w, band), (8, 6, 16))
    y0 = h - band if where == 'bottom' else 0
    im.paste(dark, (0, y0), grad)
    d = ImageDraw.Draw(im)
    size = int(h * 0.08)
    lines = [TITLE]
    font = ImageFont.truetype(FONT, size)
    while d.textlength(TITLE, font=font) > w * 0.9 and size > 10:
        size -= 2
        font = ImageFont.truetype(FONT, size)
    if size < h * 0.055:  # 너무 작으면 두 줄
        lines = ['A World Where Only', 'the Strong Survive']
        size = int(h * 0.075)
        font = ImageFont.truetype(FONT, size)
        while max(d.textlength(l, font=font) for l in lines) > w * 0.9:
            size -= 2
            font = ImageFont.truetype(FONT, size)
    lh = int(size * 1.12)
    total = lh * len(lines)
    ty = (h - int(h * 0.04) - total) if where == 'bottom' else int(h * 0.04)
    for i, l in enumerate(lines):
        tw = d.textlength(l, font=font)
        x = (w - tw) / 2
        y = ty + i * lh
        d.text((x, y), l, font=font, fill=(255, 255, 255),
               stroke_width=max(2, size // 12), stroke_fill=(20, 10, 40))
    return im


def save(im, rel, quality=88):
    p = os.path.join(BASE, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    if p.endswith('.png'):
        im.save(p, optimize=True)
    else:
        im.save(p, quality=quality, optimize=True, progressive=True)
    return p


out = []
# CrazyGames (제목 얹기)
cg_land = fit(m1(16, 9, 1500, cy=597), (1920, 1080))  # 아래에 제목 자리
out.append(save(add_title(cg_land), 'crazygames/cover-1920x1080.jpg', quality=82))
# 세로·정사각은 그림이 꽉 차서 제목이 장수·보스를 가려요 → 제목 없이 (CrazyGames는 제목이 필수 아님)
out.append(save(fit(M3, (800, 1200)), 'crazygames/cover-800x1200.jpg'))
out.append(save(fit(M2, (800, 800)), 'crazygames/cover-800x800.jpg'))

# GameDistribution (글자 없음, JPG)
out.append(save(fit(m1(16, 9, 1360, cy=515), (1280, 720)), 'gamedistribution/thumb-1280x720.jpg'))
out.append(save(fit(m1(1280, 550, 1640, cy=520), (1280, 550)), 'gamedistribution/thumb-1280x550.jpg'))
out.append(save(fit(m1(4, 3, 1260, cy=530), (512, 384)), 'gamedistribution/thumb-512x384.jpg'))
out.append(save(fit(M2, (512, 512)), 'gamedistribution/thumb-512x512.jpg'))
small = fit(m1(5, 3, 1160, cy=525), (200, 120)).filter(ImageFilter.UnsharpMask(radius=1, percent=60))
out.append(save(small, 'gamedistribution/thumb-200x120.jpg', quality=92))

# itch.io 커버 630×500 (제목 얹기)
out.append(save(add_title(fit(m1(630, 500, 1240, cy=590), (630, 500))), 'itch/cover-630x500.jpg'))

# 아이콘: M2에서 보스 얼굴
face = M2.crop((530, 0, 810, 280))
for s in (512, 192, 180):
    out.append(save(fit(face, (s, s)), f'icon/icon-{s}.png'))

for p in out:
    im = Image.open(p)
    print(f'{os.path.relpath(p, BASE):40s} {im.size[0]}x{im.size[1]}  {os.path.getsize(p)//1024} KB')
