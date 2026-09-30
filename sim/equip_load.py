# -*- coding: utf-8 -*-
import csv
from dsl import parse_line, build
from skills_custom import CUSTOM
def load_equip(path='../data/equip.tsv'):
    rows = list(csv.DictReader(open(path, encoding='utf-8'), delimiter='\t'))
    return {r['名']: r for r in rows}, rows
def load_set4(path='../data/set4.tsv'):
    out = {}
    for r in csv.DictReader(open(path, encoding='utf-8'), delimiter='\t'):
        sk = build(parse_line(r['DSL']), r['名'] + '·四件')
        for ev, fn in CUSTOM.get('_hooks', {}).get(r['名'], {}).items(): sk['hooks'][ev] = fn
        if r['名'] + '4' in CUSTOM.get('_gates', {}): sk['gate'] = CUSTOM['_gates'][r['名'] + '4']
        elif r['名'] in CUSTOM.get('_gates', {}): sk['gate'] = CUSTOM['_gates'][r['名']]
        out[r['名']] = sk
    return out
def wear(u, items, EQ, SET4=None):
    """items: 装备名列表。挂面板、单件特效、套装效果。"""
    u.equip = [EQ[n] for n in items]
    for e in u.equip:
        if e['DSL']:
            try: u.extras.append(build(parse_line('被动 | ' + e['DSL']), e['名']))
            except Exception as ex: print('特效解析失败', e['名'], ex)
    own = [e for e in u.equip if e['归属'] == u.name]
    if len(own) >= 2:
        main = 'int' if u.role != '武将' else 'atk'
        u.extras.append(build(parse_line(f'被动 | setup:buff(self,{main},6)'), '两件'))
    if len(own) >= 4 and SET4 and u.name in SET4: u.skill = SET4[u.name]
