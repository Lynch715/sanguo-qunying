#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""立绘出两档 webp：
  assets/portraits/web/s_<文件>.webp  高 96（布阵格子）
  assets/portraits/web/l_<文件>.webp  高 480（详情）
3:4 整张缩放，不裁。文件名按 data/portrait_names.tsv。

原图从哪找（按顺序）：
  1. portrait_names.tsv 的「原图」列（相对 assets/portraits/）
  2. assets/portraits/source/<文件>.png|.jpg|.jpeg|.webp
  3. assets/portraits/ 下任意子目录里，文件名去掉下划线后相同的图（zhao_yun ← zhaoyun.png）
需要 Pillow：pip3 install pillow
用法：python3 build_portraits.py [--force]
"""
import csv, os, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
PDIR = os.path.join(ROOT, 'assets', 'portraits')
WEB = os.path.join(PDIR, 'web')
SIZES = (('s', 96), ('l', 480))
EXTS = ('.png', '.jpg', '.jpeg', '.webp')


def index_sources():
    """assets/portraits 下所有原图，按「去下划线的小写文件名」建索引。"""
    idx = {}
    for d, _, files in os.walk(PDIR):
        if os.path.abspath(d).startswith(os.path.abspath(WEB)):
            continue
        for f in files:
            stem, ext = os.path.splitext(f)
            if ext.lower() in EXTS:
                idx.setdefault(stem.lower().replace('_', ''), os.path.join(d, f))
    return idx


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
            for e in EXTS:
                p = os.path.join(PDIR, 'source', fn + e)
                if os.path.exists(p):
                    src = p
                    break
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
            im = Image.open(src).convert('RGB')
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
