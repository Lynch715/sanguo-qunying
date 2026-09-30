# Python 侧对照：200 组九对九，50 级 ★3，不穿装备
import sys, json, random, csv, collections, time
import os; os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'sim')); sys.path.insert(0, '.')
import dsl, engine
from skills_load import load
SK, errs = load()
H = {r['名']: r for r in csv.DictReader(open('../data/heroes_all.tsv', encoding='utf-8'), delimiter='\t')}
REPS = int(sys.argv[1]) if len(sys.argv) > 1 else 10
rng = random.Random(20260929); names = list(H)
def bond_team():
    t = []
    while len(t) < 9:
        b = rng.choice(engine.BONDS)
        for m in b['mem']:
            if m not in t and len(t) < 9: t.append(m)
    return t
if os.environ.get('BONDTEAM'):
    M = [(bond_team(), rng.sample(names, 9)) for _ in range(200)]
else:
    M = [(rng.sample(names, 9), rng.sample(names, 9)) for _ in range(200)]
json.dump(M, open('../test/matchups.json', 'w'), ensure_ascii=False)
counts = collections.Counter()
_orig = dsl.cond_ok
def cond_ok(b, u, conds, ctx):
    ok = _orig(b, u, conds, ctx)
    if ok and ctx.get('_eid'): counts[ctx['_eid'].split('#')[0]] += 1
    return ok
dsl.cond_ok = cond_ok
random.seed(1)
res = []; t0 = time.time()
for A, B in M:
    w = 0; rs = 0; d = 0
    for _ in range(REPS):
        UA = []; UB = []
        for n in A: u = engine.Unit(H[n], 50, 3); u.skill = SK.get(n); UA.append(u)
        for n in B: u = engine.Unit(H[n], 50, 3); u.skill = SK.get(n); UB.append(u)
        x, r = engine.Battle(UA, UB).run(); w += (x == 0); d += (x == -1); rs += r
    res.append(dict(win=w / REPS, rounds=rs / REPS, draw=d / REPS))
json.dump(dict(res=res, counts=counts, reps=REPS, sec=time.time() - t0), open('../test/parity_py.json', 'w'), ensure_ascii=False)
print('py done', round(time.time() - t0, 1), 's')
