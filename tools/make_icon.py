#!/usr/bin/env python3
# 三国群英录 专属图标：朱文印「三國群英」，右起竖读；纸底。≤64px 单画一个「群」字。
import io, os, struct, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'assets', 'icons'); os.makedirs(OUT, exist_ok=True)
FONT = '/usr/share/fonts/opentype/noto/NotoSerifCJK-Black.ttc'
PAPER = (241, 233, 214); ZHU = (178, 52, 36); ZHU_D = (150, 38, 26)

def glyph(ch, box, idx=3):
    """把一个字渲染进 box×box，按墨迹居中（不是按字框）。返回 L 模式蒙版。"""
    f = ImageFont.truetype(FONT, int(box * 1.25), index=idx)
    big = Image.new('L', (box * 3, box * 3), 0); d = ImageDraw.Draw(big)
    d.text((box, box), ch, font=f, fill=255)
    bb = big.getbbox(); g = big.crop(bb)
    s = box / max(g.size); g = g.resize((max(1, int(g.width * s)), max(1, int(g.height * s))), Image.LANCZOS)
    m = Image.new('L', (box, box), 0); m.paste(g, ((box - g.width) // 2, (box - g.height) // 2)); return m

def erode(mask, amt, seed):
    """石刻的崩口：边缘随机啃掉一点。"""
    rnd = np.random.RandomState(seed); a = np.array(mask).astype(float) / 255
    n = rnd.rand(*a.shape); n = np.array(Image.fromarray((n * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(amt))).astype(float) / 255
    edge = np.array(mask.filter(ImageFilter.GaussianBlur(amt * 1.5))).astype(float) / 255
    keep = a * (1 - ((edge < .85) & (n < .42)))
    return Image.fromarray((keep * 255).astype('uint8'))

def big_icon(S, maskable=False):
    """≥128：纸底 + 朱文方印，印里阴刻四字（红底白字）。maskable 时整片朱色出血。"""
    im = Image.new('RGB', (S, S), ZHU if maskable else PAPER)
    if not maskable:
        # 纸纹
        rnd = np.random.RandomState(7); nz = (rnd.rand(S, S) * 10 - 5)
        arr = np.array(im).astype(float) + nz[..., None]; im = Image.fromarray(np.clip(arr, 0, 255).astype('uint8'))
    inset = int(S * (.10 if maskable else .08)); side = S - 2 * inset
    seal = Image.new('L', (side, side), 0); d = ImageDraw.Draw(seal)
    d.rounded_rectangle((0, 0, side - 1, side - 1), radius=int(side * .06), fill=255)
    seal = erode(seal, max(1, S / 180), 3)
    # 四字：右列「三國」，左列「群英」
    pad = int(side * .085); cell = (side - 2 * pad) // 2; g = int(cell * .06)
    txt = Image.new('L', (side, side), 0)
    for ch, (cx, cy) in zip('三國群英', [(1, 0), (1, 1), (0, 0), (0, 1)]):
        m = glyph(ch, cell - 2 * g)
        txt.paste(m, (pad + cx * cell + g, pad + cy * cell + g), m)
    txt = erode(txt, max(1, S / 260), 5)
    # 印面：朱色，字处露纸（白文印）
    a = np.array(seal).astype(float) / 255 * (1 - np.array(txt).astype(float) / 255)
    col = np.zeros((side, side, 3)); rnd = np.random.RandomState(11)
    tone = np.array(Image.fromarray((rnd.rand(side, side) * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(S / 60))).astype(float) / 255
    for i in range(3): col[..., i] = ZHU[i] * (1 - .12 * tone) + ZHU_D[i] * .12 * tone
    base = np.array(im.crop((inset, inset, inset + side, inset + side))).astype(float)
    if maskable:   # 满版朱底：字要单独刷成纸色
        t = np.array(txt).astype(float)[..., None] / 255
        base = base * (1 - t) + np.array(PAPER, float) * t
    out = base * (1 - a[..., None]) + col * a[..., None]
    im.paste(Image.fromarray(out.astype('uint8')), (inset, inset))
    return im

def small_icon(S):
    """≤64：朱底满版，纸色「群」字占 80%，不加任何效果。"""
    im = Image.new('RGB', (S, S), ZHU)
    m = glyph('群', int(S * .80), idx=2)
    im.paste(Image.new('RGB', m.size, PAPER), ((S - m.width) // 2, (S - m.height) // 2), m)
    return im

def render(S): return small_icon(S) if S <= 64 else big_icon(S)

master = big_icon(1024)
for S in (1024, 512, 256, 192, 180, 128):
    im = master.resize((S, S), Image.LANCZOS) if S < 1024 else master
    im.save(os.path.join(OUT, f'icon-{S}.png'), optimize=True)
for S in (64, 48, 32, 16): small_icon(S).save(os.path.join(OUT, f'icon-{S}.png'), optimize=True)
master.resize((180, 180), Image.LANCZOS).save(os.path.join(OUT, 'apple-touch-icon.png'), optimize=True)
big_icon(512, maskable=True).save(os.path.join(OUT, 'maskable-512.png'), optimize=True)
imgs = [render(s) for s in (16, 32, 48, 64, 128, 256)]
imgs[-1].save(os.path.join(ROOT, 'favicon.ico'), append_images=imgs[:-1], sizes=[(s, s) for s in (16, 32, 48, 64, 128, 256)])
ICNS = [("icp4", 16), ("icp5", 32), ("icp6", 64), ("ic07", 128), ("ic08", 256), ("ic09", 512), ("ic10", 1024), ("ic11", 32), ("ic12", 64), ("ic13", 256), ("ic14", 512)]
chunks = b""
for t, s in ICNS:
    buf = io.BytesIO(); (render(s) if s <= 64 else master.resize((s, s), Image.LANCZOS)).save(buf, "PNG", optimize=True)
    dd = buf.getvalue(); chunks += t.encode() + struct.pack(">I", len(dd) + 8) + dd
open(os.path.join(OUT, '三国群英录.icns'), 'wb').write(b"icns" + struct.pack(">I", len(chunks) + 8) + chunks)
print('ok')
