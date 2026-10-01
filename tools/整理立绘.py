#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""一次性工具（2026-10-01 已跑过）。把散在 assets/portraits/gongbi、gongbi/tiger、source、assets/_原图备份、assets/style_test 的立绘原图
按档归到 assets/立绘/<档>/<中文名>.png，用不上的旧图归到 assets/立绘/_旧图/。只搬不删。
同时把 data/portrait_names.tsv 的「原图」列改成新路径（相对 assets/portraits/）。
  python3 tools/整理立绘.py        预演，只打印
  python3 tools/整理立绘.py --do   真搬
"""
import csv, os, sys, shutil, collections
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
A = os.path.join(ROOT, 'assets'); PDIR = os.path.join(A, 'portraits'); NEW = os.path.join(A, '立绘')
DO = '--do' in sys.argv
EXTS = ('.png', '.jpg', '.jpeg', '.webp')
H = {h['名']: h for h in csv.DictReader(open(os.path.join(ROOT, 'data/heroes_all.tsv'), encoding='utf-8'), delimiter='\t')}
TSV = os.path.join(ROOT, 'data/portrait_names.tsv')
rows = list(csv.DictReader(open(TSV, encoding='utf-8'), delimiter='\t'))
# 跟 build_portraits 一样的找法
idx = {}
for d, _, fs in os.walk(PDIR):
    if os.path.abspath(d).startswith(os.path.abspath(os.path.join(PDIR, 'web'))): continue
    for f in fs:
        st, e = os.path.splitext(f)
        if e.lower() in EXTS: idx.setdefault(st.lower().replace('_', ''), os.path.join(d, f))
def resolve(r):
    if r.get('原图'):
        p = os.path.join(PDIR, r['原图'])
        if os.path.exists(p): return p
    for e in EXTS:
        p = os.path.join(PDIR, 'source', r['文件'] + e)
        if os.path.exists(p): return p
    return idx.get(r['文件'].lower().replace('_', ''))
by_file = {}   # 文件 → (档, 中文名)
for r in rows:
    if r['类别'] == '本人': by_file.setdefault(r['文件'], (H[r['名']]['品阶'], r['名']))
    elif r['类别'] == '杂兵': by_file.setdefault(r['文件'], ('杂兵', r['名']))
    elif r['类别'] == '范式图': by_file[r['文件']] = ('校_范式', r['名'])
moves, used, newp = [], set(), {}
for fn, (tier, name) in by_file.items():
    r = next(x for x in rows if x['文件'] == fn)
    src = resolve(r)
    if not src: print('没找到原图', fn, name); continue
    dst = os.path.join(NEW, tier, name + os.path.splitext(src)[1].lower())
    moves.append((src, dst)); used.add(os.path.abspath(src)); newp[fn] = os.path.relpath(dst, PDIR)
# 用不上的旧图
for sub in ('gongbi', 'source'):
    for d, _, fs in os.walk(os.path.join(PDIR, sub)):
        for f in fs:
            p = os.path.join(d, f)
            if os.path.splitext(f)[1].lower() in EXTS and os.path.abspath(p) not in used:
                moves.append((p, os.path.join(NEW, '_旧图', '被替换的原图', os.path.relpath(p, PDIR))))
for sub, to in (('_原图备份', '被替换的原图/_原图备份'), ('style_test', '风格试稿_赵云六方向')):
    base = os.path.join(A, sub)
    if not os.path.isdir(base): continue
    for d, _, fs in os.walk(base):
        for f in fs:
            p = os.path.join(d, f); rel = os.path.relpath(p, base)
            if sub == '_原图备份' and (rel.startswith('_review') or f.startswith('_check')): dst = os.path.join(NEW, '_旧图', '裁切检查', rel)
            else: dst = os.path.join(NEW, '_旧图', to, rel)
            moves.append((p, dst))
cnt = collections.Counter(os.path.relpath(d, NEW).split(os.sep)[0] + ('/' + os.path.relpath(d, NEW).split(os.sep)[1] if os.path.relpath(d, NEW).startswith('_旧图') else '') for _, d in moves)
for k, v in sorted(cnt.items()): print(f'{k}: {v}')
dup = [d for d, c in collections.Counter(d for _, d in moves).items() if c > 1]
if dup: print('目标重名', dup[:5]); sys.exit(1)
if not DO: print('（预演，没动）'); sys.exit(0)
for s, d in moves:
    os.makedirs(os.path.dirname(d), exist_ok=True); shutil.move(s, d)
for r in rows:
    if r['文件'] in newp: r['原图'] = newp[r['文件']]
with open(TSV, 'w', encoding='utf-8', newline='') as f:
    w = csv.DictWriter(f, fieldnames=['名', '文件', '类别', '原图'], delimiter='\t', lineterminator='\n'); w.writeheader(); w.writerows(rows)
print('搬了', len(moves), '个文件；portrait_names.tsv 原图列已更新')
