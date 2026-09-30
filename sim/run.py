# -*- coding: utf-8 -*-
import csv, random, statistics as st, sys, collections
from engine import Unit, Battle
import skills_top
from skills_parse import load_all, UNPARSED, APPROX, SK

rows = load_all('../data/skills.tsv')
heroes = {r['名']: r for r in csv.DictReader(open('../data/heroes_all.tsv', encoding='utf-8'), delimiter='\t')}
def mk(name, lv=50, star=1):
    u = Unit(heroes[name], lv, star); u.skill = SK.get(name); return u
def fight(A, B, log=False):
    b = Battle([mk(n) for n in A], [mk(n) for n in B], log); w, r = b.run(); return w, r, b
def winrate(A, B, n=100):
    w = 0; rs = []
    for _ in range(n):
        x, r, _b = fight(A, B); w += (x == 0); rs.append(r)
    return w / n, st.mean(rs)

print('未解析', len(UNPARSED), '近似', len(APPROX), '有技能', sum(1 for n in heroes if n in SK), '/', len(heroes))
by_tier = collections.defaultdict(list)
for n, h in heroes.items(): by_tier[h['品阶']].append(n)
random.seed(11)
# 1. 同档随机九人互打
for q in ['无双', '虎', '名', '骁', '校']:
    rs = []; w = 0
    for _ in range(60):
        pool = by_tier[q][:]; random.shuffle(pool)
        A, B = pool[:9], pool[9:18] if len(pool) >= 18 else random.sample(pool, 9)
        x, r, _b = fight(A, B); rs.append(r); w += (x == -1)
    print(q, '同档随机九人：平均回合', round(st.mean(rs), 1), '平局率', round(w / 60, 2))
# 2. 档差：无双随机九 vs 名随机九
for a, b_ in [('无双', '虎'), ('无双', '名'), ('虎', '名'), ('名', '骁'), ('骁', '校')]:
    w = 0; rs = []
    for _ in range(60):
        A = random.sample(by_tier[a], 9); B = random.sample(by_tier[b_], 9)
        x, r, _b = fight(A, B); w += (x == 0); rs.append(r)
    print(a, 'vs', b_, '胜率', round(w / 60, 2), '回合', round(st.mean(rs), 1))
