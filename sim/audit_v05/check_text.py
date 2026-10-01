#!/usr/bin/env python3
# 技能文案里的倍率、百分比、发动率，在 DSL 里找不到的列出来（custom 技能跳过，需要人工看）
import csv, re, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
S = list(csv.DictReader(open(os.path.join(ROOT, 'data', 'skills_dsl.tsv'), encoding='utf-8'), delimiter='\t'))
n = 0
for s in S:
    t, d = s['文案'], s['DSL']
    if 'custom(' in d: continue
    dn = set(re.findall(r'\d+\.?\d*', d))
    miss = [m for m in re.findall(r'(\d+\.\d+) ?倍', t) if m not in dn and m.rstrip('0').rstrip('.') not in dn]
    missp = [p + '%' for p in re.findall(r'(\d+)%', t) if p not in dn]
    rate = re.match(r'\S+ (\d+)', d)
    if s['发动'] not in ('—', '') and rate and s['发动'].rstrip('%') != rate.group(1): miss.append(f"发动 文案{s['发动']} 实际{rate.group(1)}%")
    if miss or missp:
        n += 1; print(s['名'], s['品阶'], '；'.join(miss + missp), sep='\t')
print(f'共 {n} 条')
