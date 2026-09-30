# -*- coding: utf-8 -*-
import csv, random, statistics as st, collections, json, sys
from engine import Unit, Battle
from skills_load import load
SK, errs = load()
heroes = {r['名']: r for r in csv.DictReader(open('../data/heroes_all.tsv', encoding='utf-8'), delimiter='\t')}
BASE = ['廖化', '张翼', '吴懿', '吕岱', '全琮', '潘璋', '步骘', '邓芝', '董允']
def mk(n): u = Unit(heroes[n]); u.skill = SK.get(n); return u
def score(name, n=80):
    h = heroes[name]; team = BASE[:]; team[1 if h['定位'] == '武将' else 7] = name
    tot = 0.0
    for i in range(n):
        A = [mk(x) for x in team]; B = [mk(x) for x in BASE]
        if i % 2: A, B = B, A
        try: Battle(A, B).run()
        except Exception as e: print('ERR', name, repr(e)); return 0
        mine = A if i % 2 == 0 else B; theirs = B if i % 2 == 0 else A
        tot += (sum(1 - x.hp / x.maxhp for x in theirs) - sum(1 - x.hp / x.maxhp for x in mine)) / 9
    return tot / n
random.seed(5)
res = {n: score(n) for n in heroes}
by = collections.defaultdict(list)
for n, v in res.items(): by[heroes[n]['品阶']].append((v, n))
out = []
for q in ['无双', '虎', '名', '骁', '校']:
    L = sorted(by[q], reverse=True); vs = [v for v, _ in L]
    out.append(f'## {q}（{len(L)} 人）均值 {st.mean(vs):.3f}  标准差 {st.pstdev(vs):.3f}')
    out.append('最强十个：' + '、'.join(f'{n} {v:.2f}' for v, n in L[:10]))
    out.append('最弱十个：' + '、'.join(f'{n} {v:.2f}' for v, n in L[-10:]))
    out.append('')
open('score_report_v03.md', 'w').write('\n'.join(out)); json.dump(res, open('score_v03.json', 'w'), ensure_ascii=False)
print('\n'.join(out))
