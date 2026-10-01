#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""立绘出两档 webp：
  assets/portraits/web/s_<文件>.webp  高 96（布阵格子）
  assets/portraits/web/l_<文件>.webp  高 480（详情）
3:4 整张缩放；GPT 图四周自带的白纸边先切掉（trim_mat），原图不动。文件名按 data/portrait_names.tsv。

原图从哪找（按顺序）：
  1. portrait_names.tsv 的「原图」列（相对 assets/portraits/，现在都指向 ../立绘/<档>/<中文名>.png）
  2. assets/立绘/ 下任意子目录里，文件名是这人中文名的图（关羽.png）——新出的图按档放进去、用中文名即可
  3. assets/立绘/ 下文件名是拼音的图（guan_yu.png / guanyu.png），兼容 GPT 出图规范里写的拼音文件名
重出的图直接存成 assets/立绘/<档>/<中文名>.png，覆盖旧的那张，再跑本脚本。
需要 Pillow：pip3 install pillow
用法：python3 build_portraits.py [--force]
"""
import csv, os, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
PDIR = os.path.join(ROOT, 'assets', 'portraits')
ARTD = os.path.join(ROOT, 'assets', '立绘')   # V0.7 起原图都在这里，按档分文件夹
WEB = os.path.join(PDIR, 'web')
SIZES = (('s', 96), ('m', 240), ('l', 480))   # V0.7：加中档 m，卡片、布阵格、战场用，比 l 小四分之三
EXTS = ('.png', '.jpg', '.jpeg', '.webp')


def index_sources():
    """assets/立绘（和老位置 assets/portraits）下所有原图，按「去下划线的小写文件名」建索引；中文名照原样当键。旧图文件夹不算。"""
    idx = {}
    for d, _, files in list(os.walk(ARTD)) + list(os.walk(PDIR)):
        if os.path.abspath(d).startswith(os.path.abspath(WEB)) or '_旧图' in d:
            continue
        for f in files:
            stem, ext = os.path.splitext(f)
            if ext.lower() in EXTS:
                idx.setdefault(stem.lower().replace('_', ''), os.path.join(d, f))
    return idx


def trim_mat(im):
    """去掉 GPT 图四周自带的白纸边，再修成 3:4（竖图从底部切，宽图左右居中切）。
    只有四条边都有一圈接近纯白、几乎没起伏的边时才动，正常的白底工笔不会被误切。"""
    from PIL import ImageStat
    g = im.convert('L')
    sw = 300
    sm = g.resize((sw, round(sw * im.height / im.width)))
    W, H = sm.size
    px = sm.load()
    def blank_row(y):
        v = [px[x, y] for x in range(W)]
        m = sum(v) / W
        return m > 236 and (sum((a - m) ** 2 for a in v) / W) ** .5 < 7
    def blank_col(x):
        v = [px[x, y] for y in range(H)]
        m = sum(v) / H
        return m > 236 and (sum((a - m) ** 2 for a in v) / H) ** .5 < 7
    t = 0
    while t < H // 4 and blank_row(t): t += 1
    b = 0
    while b < H // 4 and blank_row(H - 1 - b): b += 1
    l = 0
    while l < W // 4 and blank_col(l): l += 1
    r = 0
    while r < W // 4 and blank_col(W - 1 - r): r += 1
    lim_h, lim_w = H * 0.03, W * 0.03
    if not (t >= lim_h and b >= lim_h and l >= lim_w and r >= lim_w):
        return im
    k = im.width / W
    pad = 2  # 再往里收两个小格，免得留一道白线
    box = [round((l + pad) * k), round((t + pad) * k), round((W - r - pad) * k), round((H - b - pad) * k)]
    im = im.crop(box)
    w, h = im.size
    if w / h > 0.75:
        nw = round(h * 0.75); x = (w - nw) // 2; im = im.crop((x, 0, x + nw, h))
    elif w / h < 0.75:
        im = im.crop((0, 0, w, round(w * 4 / 3)))
    return im


def main():
    try:
        from PIL import Image
    except ImportError:
        print('需要 Pillow：pip3 install pillow')
        sys.exit(1)
    force = '--force' in sys.argv
    os.makedirs(WEB, exist_ok=True)
    rows = list(csv.DictReader(open(os.path.join(ROOT, 'data', 'portrait_names.tsv'), encoding='utf-8'), delimiter='\t'))
    idx = index_sources()
    done = skip = 0
    missing = []
    seen = set()
    for r in rows:
        fn = r['文件']
        if fn in seen:
            continue
        seen.add(fn)
        src = None
        if r.get('原图'):
            p = os.path.join(PDIR, r['原图'])
            if os.path.exists(p):
                src = p
        if not src:
            src = idx.get(r['名'].lower()) if r['类别'] != '范式' else None
        if not src:
            src = idx.get(fn.lower().replace('_', ''))
        if not src:
            missing.append(fn)
            continue
        for tag, h in SIZES:
            out = os.path.join(WEB, f'{tag}_{fn}.webp')
            if not force and os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(src):
                skip += 1
                continue
            im = trim_mat(Image.open(src).convert('RGB'))
            w = round(im.width * h / im.height)
            im.resize((w, h), Image.LANCZOS).save(out, 'WEBP', quality=82 if tag == 'l' else 78, method=6)
            done += 1
    print(f'出图 {done} 张，已是最新 {skip} 张；还没有原图的 {len(missing)} 个（用占位）')
    scenes(force)


SCENE_IDS = ['sc_gong', 'sc_guan', 'sc_cun', 'sc_zhanchang', 'sc_jiang', 'sc_shudao', 'sc_xiliang', 'sc_nanzhong']


def scenes(force):
    """场景原画：assets/scenes/source/<id>.png → assets/scenes/web/<id>.webp，720×480，往纸色提亮。"""
    from PIL import Image, ImageFilter
    src_d = os.path.join(ROOT, 'assets', 'scenes', 'source'); web_d = os.path.join(ROOT, 'assets', 'scenes', 'web')
    if not os.path.isdir(src_d):
        print('场景原画：还没有 assets/scenes/source/，跳过'); return
    os.makedirs(web_d, exist_ok=True)
    paper = (0xe9, 0xe2, 0xd0); n = 0; miss = []
    for sid in SCENE_IDS:
        src = next((os.path.join(src_d, sid + e) for e in EXTS if os.path.exists(os.path.join(src_d, sid + e))), None)
        if not src:
            miss.append(sid); continue
        out = os.path.join(web_d, sid + '.webp')
        if not force and os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(src):
            continue
        im = Image.open(src).convert('RGB')
        # 3:2 居中裁，缩到 720×480
        w, h = im.size; tw = min(w, round(h * 1.5)); th = round(tw / 1.5)
        im = im.crop(((w - tw) // 2, (h - th) // 2, (w - tw) // 2 + tw, (h - th) // 2 + th)).resize((720, 480), Image.LANCZOS)
        # 取最亮 10% 当底色，拉到纸色；再整体往纸色提亮 45%
        px = sorted(im.getdata(), key=sum); top = px[int(len(px) * .9):]
        base = [sum(p[i] for p in top) / len(top) for i in range(3)]
        k = [paper[i] / max(1, base[i]) for i in range(3)]
        im = Image.eval(im, lambda v: v)  # 复制
        r, g, b = im.split()
        im = Image.merge('RGB', [ch.point(lambda v, kk=k[i]: min(255, int(v * kk))) for i, ch in enumerate((r, g, b))])
        im = Image.blend(im, Image.new('RGB', im.size, paper), .45).filter(ImageFilter.GaussianBlur(.5))
        im.save(out, 'WEBP', quality=50, method=6); n += 1
    print(f'场景原画 出图 {n} 张；缺 {len(miss)} 张' + (f'：{"、".join(miss)}' if miss else ''))


if __name__ == '__main__':
    main()
