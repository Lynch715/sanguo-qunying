# -*- coding: utf-8 -*-
import csv, random, statistics as st
from engine import Unit, Battle
from skills_load import load
from equip_load import load_equip, load_set4, wear
SK, _ = load(); EQ, EQROWS = load_equip(); SET4 = load_set4()
heroes = {r['名']: r for r in csv.DictReader(open('../data/heroes_all.tsv', encoding='utf-8'), delimiter='\t')}
BASE = ['廖化', '张翼', '吴懿', '吕岱', '全琮', '潘璋', '步骘', '邓芝', '董允']
GEN = {'武将': ['百辟刀', '玄甲', '龙驹', '龙泉'], '文臣': ['麈尾', '玄甲', '龙驹', '太公兵法'], '辅助': ['麈尾', '玄甲', '龙驹', '九锡']}
def mk(n, gear=None):
    u = Unit(heroes[n]); u.skill = SK.get(n)
    if gear: wear(u, gear, EQ, SET4)
    return u
def score(name, gear, n=80):
    h = heroes[name]; team = BASE[:]; team[1 if h['定位'] == '武将' else 7] = name
    tot = 0
    for i in range(n):
        A = [mk(x, gear if x == name else None) for x in team]; B = [mk(x) for x in BASE]
        if i % 2: A, B = B, A
        Battle(A, B).run()
        mine = A if i % 2 == 0 else B; theirs = B if i % 2 == 0 else A
        tot += (sum(1 - x.hp / x.maxhp for x in theirs) - sum(1 - x.hp / x.maxhp for x in mine)) / 9
    return tot / n
random.seed(9)
own = {}
for r in EQROWS:
    if r['归属']: own.setdefault(r['归属'], []).append(r['名'])
res = []
for name in own:
    h = heroes[name]
    a = score(name, None); b = score(name, GEN[h['定位']]); c = score(name, own[name])
    res.append((name, a, b, c)); print(f'{name}\t裸 {a:.2f}\t神品四件 {b:.2f}\t专属四件 {c:.2f}')
import statistics
print('均值 裸/神品/专属', [round(statistics.mean(x), 3) for x in zip(*[(a, b, c) for _, a, b, c in res])])
print('专属四件标准差', round(statistics.pstdev([c for *_, c in res]), 3), ' 裸标准差', round(statistics.pstdev([a for _, a, _, _ in res]), 3))
open('equip_report.tsv', 'w').write('名\t裸\t神品四件\t专属四件\n' + '\n'.join(f'{n}\t{a:.3f}\t{b:.3f}\t{c:.3f}' for n, a, b, c in res))
