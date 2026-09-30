# -*- coding: utf-8 -*-
import csv
from dsl import parse_line, build
from skills_custom import CUSTOM
def load(path='../data/skills_dsl.tsv'):
    SK = {}; errs = []
    for r in csv.DictReader(open(path, encoding='utf-8'), delimiter='\t'):
        try:
            sk = build(parse_line(r['DSL']), r['名'])
            for ev, fn in CUSTOM.get('_hooks', {}).get(r['名'], {}).items(): sk['hooks'][ev] = fn
            if r['名'] in CUSTOM.get('_gates', {}): sk['gate'] = CUSTOM['_gates'][r['名']]
            SK[r['名']] = sk
        except Exception as e: errs.append((r['名'], r['DSL'], repr(e)))
    return SK, errs
