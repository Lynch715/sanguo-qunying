import json, math, statistics as st, csv, os
D = os.path.dirname(os.path.abspath(__file__))
P = json.load(open(D + '/parity_py.json')); J = json.load(open(D + '/parity_js.json'))
n = len(P['res'])
wp = st.mean(r['win'] for r in P['res']); wj = st.mean(r['win'] for r in J['res'])
rp = st.mean(r['rounds'] for r in P['res']); rj = st.mean(r['rounds'] for r in J['res'])
print(f"场次：各 {n}×{P['reps']}；左方总胜率 py {wp:.3f} js {wj:.3f}；平均回合 py {rp:.2f} js {rj:.2f}（差 {abs(rj-rp)/rp*100:.1f}%）")
# 逐组胜率差
dif = [abs(a['win'] - b['win']) for a, b in zip(P['res'], J['res'])]
reps = P['reps']
big = [i for i, (a, b) in enumerate(zip(P['res'], J['res'])) if abs(a['win'] - b['win']) > 0.05 and abs(a['win'] - b['win']) > 3 * math.sqrt(max(.0025, (a['win'] * (1 - a['win']) + b['win'] * (1 - b['win'])) / reps))]
print(f"逐组胜率差：平均 {st.mean(dif)*100:.1f} 个百分点，最大 {max(dif)*100:.1f}；超 5 点且超 3σ 的组 {len(big)}")
for i in big[:10]: print('   组', i, P['res'][i], J['res'][i])
# 技能发动次数
cp, cj = P['counts'], J['counts']
keys = sorted(set(cp) | set(cj))
bad = []; within = 0; tot = 0
for k in keys:
    a, b = cp.get(k, 0), cj.get(k, 0)
    if a + b < 40: continue
    tot += 1
    rel = abs(a - b) / max(a, b)
    sig = abs(a - b) / math.sqrt(a + b)   # 泊松近似
    if rel <= .05: within += 1
    elif sig > 3: bad.append((k, a, b, rel, sig))
print(f"技能计数（样本≥40 的 {tot} 条）：差 ≤5% 的 {within} 条；超 5% 且统计显著(>3σ) 的 {len(bad)} 条")
for k, a, b, rel, sig in sorted(bad, key=lambda x: -x[4])[:40]: print(f'   {k}: py {a} js {b}  差 {rel*100:.1f}%  {sig:.1f}σ')
only = [k for k in keys if (cp.get(k, 0) == 0) != (cj.get(k, 0) == 0) and cp.get(k, 0) + cj.get(k, 0) >= 10]
print('只在一边出现的：', only)
