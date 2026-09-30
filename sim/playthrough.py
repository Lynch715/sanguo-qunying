# -*- coding: utf-8 -*-
"""一周目模拟：按 142 关顺序打。玩家从开局赠将起，靠剧情入伙、抽卡、练级、捡装备长起来。
经济数先按水浒比例套一版（CFG），跑完一起调。"""
import csv, random, statistics as st, json, re, sys, collections
from engine import Unit, Battle
from skills_load import load
from equip_load import load_equip, load_set4, wear
SK, _ = load(); EQ, EQROWS = load_equip(); SET4 = load_set4()
H = {r['名']: r for r in csv.DictReader(open('../data/heroes_all.tsv', encoding='utf-8'), delimiter='\t')}
STAGES = list(csv.DictReader(open('../data/stages.tsv', encoding='utf-8'), delimiter='\t'))
SKROW = {r['名']: r for r in csv.DictReader(open('../data/skills_dsl.tsv', encoding='utf-8'), delimiter='\t')}
STRATS = ['power', 'guard', 'antimag', 'burst', 'mag']
STRAT_CN = {'power': '战力最高', 'guard': '厚统率带指挥', 'antimag': '抗谋略带解控回兵', 'burst': '速攻瞬发追击', 'mag': '谋略输出', 'duel': '单挑最强'}
MOBS = {'黄巾兵': (48, 40, 18, 50), '汉军郡兵': (46, 44, 20, 46), '西凉兵': (52, 40, 16, 52), '并州骑': (50, 38, 15, 58), '袁军步卒': (48, 44, 18, 46), '荆州水军': (46, 40, 20, 54),
        '魏卒·刀盾': (48, 46, 18, 46), '魏卒·弓手': (50, 36, 20, 54), '虎豹骑': (54, 44, 16, 58), '蜀卒·长枪': (50, 44, 18, 48), '蜀卒·弩手': (48, 38, 20, 54), '吴卒·环刀': (50, 40, 18, 50), '吴卒·水军': (46, 40, 20, 56),
        '南蛮兵': (52, 38, 14, 50), '藤甲兵': (46, 52, 12, 38), '羌胡骑': (52, 40, 14, 56)}
MOBG = (1.1, 0.9, 0.3, 0.8)
CFG = dict(
    gold_clear=lambda lv: 200 + 40 * lv,        # 首通金币
    gold_replay=lambda lv: 40 + 10 * lv,        # 复刷金币
    train_cost=lambda lv: 20 + 5 * lv,          # 练一级的钱（按目标等级）
    draw=300, draw10=2700,
    pool={'校': .40, '骁': .30, '名': .20, '虎': .08, '无双': .02},
    pity10='名', pity50='虎',
    frag_per_dup=3, frag_star=[0, 5, 10, 15, 20],   # 升到 ★2..5 各要几片
    lv_cap=lambda stage_lv: stage_lv,            # 玩家等级上限跟进度走；卡关每 5 次 +1，最多 +6
    max_try=15, side_try=3, per_strat=3, replay_cap=9,
    boss_mult=3, hidden_mult=5,
    token_price=500, token_step=25, token_cap=1000,
    star_need=[0, 5, 10, 15, 20], star_q={'校': .5, '骁': .6, '名': .8, '虎': 1.0, '无双': 2.0},
    smith=400, smith10=3600, smith_pool={'凡品': .35, '良品': .30, '精品': .20, '珍品': .10, '神品': .04},
    sell={'凡品': 20, '良品': 60, '精品': 150, '珍品': 400, '神品': 1000},
    ease=lambda ch: 1.0,
    foe_mul=lambda ch, typ: (1.0 + 0.01 * (ch - 1)) * (1.10 if typ == '章末' else 1.0) * (1.1 if typ == '隐藏' else 1.0),
    foe_star=lambda ch, typ: min(5, 1 + (ch - 1) // 5 + (1 if typ == '隐藏' else 0)),
)
TIER_ORDER = ['校', '骁', '名', '虎', '无双']
POOL = {t: [n for n, h in H.items() if h['品阶'] == t] for t in TIER_ORDER}

class Player:
    def __init__(self, seed):
        self.rng = random.Random(seed)
        self.heroes = {}   # name -> dict(lv, star, frag)
        self.gold = 1000; self.draws = 0; self.since_hu = 0; self.bag = []; self.shards = {}; self.tokens_bought = 0; self.spent = collections.Counter()
        self.log = []
        gift = [self.rng.choice(list(H)), self.rng.choice(list(H))]
        for n in gift: self.add(n)
        self.gift = gift
    def add(self, n):
        if n in self.heroes:
            h = self.heroes[n]; h['frag'] += CFG['frag_per_dup']
            while h['star'] < 5 and h['frag'] >= CFG['frag_star'][h['star']]: h['frag'] -= CFG['frag_star'][h['star']]; h['star'] += 1
        else: self.heroes[n] = dict(lv=1, star=1, frag=0)
    def draw_one(self):
        r = self.rng.random(); acc = 0; tier = '校'
        for t in TIER_ORDER:
            acc += CFG['pool'][t]
            if r < acc: tier = t; break
        self.draws += 1; self.since_hu += 1
        if self.since_hu >= 50 and TIER_ORDER.index(tier) < 3: tier = '虎'
        if tier in ('虎', '无双'): self.since_hu = 0
        return tier
    def draw10(self):
        self.gold -= CFG['draw10']; tiers = [self.draw_one() for _ in range(10)]
        if all(TIER_ORDER.index(t) < 2 for t in tiers): tiers[-1] = '名'
        for t in tiers: self.add(self.rng.choice(POOL[t]))
    def power(self, n):
        h = H[n]; s = self.heroes[n]
        base = sum(float(h[k]) + float(h[g]) * (s['lv'] - 1) for k, g in [('武力', '武成长'), ('统率', '统成长'), ('智力', '智成长'), ('速度', '速成长')])
        return base * (1 + .05 * (s['star'] - 1)) * (1 + .15 * TIER_ORDER.index(h['品阶']))
    def stat4(self, n):
        h = H[n]; s = self.heroes[n]; k = (1 + .05 * (s['star'] - 1))
        return {c: (float(h[c]) + float(h[g]) * (s['lv'] - 1)) * k for c, g in [('武力', '武成长'), ('统率', '统成长'), ('智力', '智成长'), ('速度', '速成长')]}
    def score(self, n, strat):
        v = self.stat4(n); r = SKROW.get(n, {}); typ = r.get('类型', ''); dsl = r.get('DSL', '')
        tier = 1 + .15 * TIER_ORDER.index(H[n]['品阶'])
        if strat == 'power': return self.power(n)
        if strat == 'duel': return (v['武力'] * 1.2 + v['统率'] + v['速度'] * .3) * tier * (1.15 if H[n]['定位'] == '武将' else .8)
        if strat == 'guard': return (v['统率'] * 1.6 + v['武力'] * .8 + v['智力'] * .3) * tier * (1.2 if typ == '指挥' or 'shield' in dsl else 1)
        if strat == 'antimag': return (v['统率'] + v['智力'] * 1.2 + v['武力'] * .5) * tier * (1.25 if any(k in dsl for k in ('cleanse', 'heal', 'dispel')) else 1)
        if strat == 'burst': return (v['武力'] * 1.3 + v['速度'] * .9 + v['统率'] * .4) * tier * (1.2 if typ in ('主动·瞬发', '追击') else 1)
        if strat == 'mag': return (v['智力'] * 1.5 + v['速度'] * .7 + v['统率'] * .4) * tier * (1.15 if 'mag' in dsl else 1)
        return self.power(n)
    def team(self, stage, strat='power'):
        need = [x for x in stage['必带'].split(',') if x and x in self.heroes]
        lim = stage['限制']
        m = re.match(r'只能带(\S)人', lim)
        solo = bool(m) or '一对一' in lim
        st_ = 'duel' if solo and strat == 'power' else strat
        rest = sorted([n for n in self.heroes if n not in need], key=lambda n: -self.score(n, st_))
        if m: return (need + rest)[:{'一': 1, '两': 2, '三': 3}[m.group(1)]]
        if '一对一' in lim: return (need + rest)[:1]
        return (need + rest)[:9]
    def train(self, names, cap):
        for n in sorted(names, key=lambda n: -self.power(n)):
            h = self.heroes[n]
            while h['lv'] < cap:
                c = CFG['train_cost'](h['lv'] + 1)
                if self.gold < c: return
                self.gold -= c; self.spent['练级'] += c; h['lv'] += 1
    def token_price(self, k=0): return min(CFG['token_cap'], CFG['token_price'] + CFG['token_step'] * ((self.tokens_bought + k) // 10))
    def star_up(self, names, reserve):
        # 给阵上的人升星：优先品阶高的；用本人碎片，不够买兵符
        for n in sorted(names, key=lambda n: -self.power(n)):
            h = self.heroes[n]
            while h['star'] < 5:
                need = int(round(CFG['star_need'][h['star']] * CFG['star_q'][H[n]['品阶']]))
                lack = max(0, need - h['frag'])
                cost = sum(self.token_price(i) for i in range(lack))
                if self.gold - cost < reserve: break
                self.gold -= cost; self.spent['兵符'] += cost; self.tokens_bought += lack; h['frag'] = 0; h['star'] += 1
    def smith10(self):
        self.gold -= CFG['smith10']; self.spent['铁匠铺'] += CFG['smith10']
        for _ in range(10):
            r = self.rng.random(); acc = 0; tier = '凡品'
            for t, pr in CFG['smith_pool'].items():
                acc += pr
                if r < acc: tier = t; break
            cands = [e for e in EQROWS if e['档'] == tier and not e['归属']]
            self.bag.append(self.rng.choice(cands))
    def sell_junk(self):
        # 每槽留最好的三件，其余卖掉
        keep = []; by = collections.defaultdict(list)
        for e in self.bag: by[e['槽']].append(e)
        for k, L in by.items():
            L.sort(key=lambda e: -float(e['固定']))
            keep += L[:3]
            for e in L[3:]:
                if not e['归属']: self.gold += CFG['sell'][e['档']]; self.spent['卖装备'] -= CFG['sell'][e['档']]
                else: keep.append(e)
        self.bag = keep
    def equip_team(self, names):
        # 简化：把背包里每槽最好的四件给前三个人
        best = {}
        for e in self.bag:
            k = e['槽']
            if k not in best or float(e['固定']) > float(best[k]['固定']): best[k] = e
        return [list(best.values()) for _ in names[:3]]

def mk_player_unit(p, n, gear):
    s = p.heroes[n]; u = Unit(H[n], s['lv'], s['star']); u.skill = SK.get(n)
    if gear: wear(u, [e['名'] for e in gear], EQ, SET4)
    return u
def mk_enemy(name, lv, star, ease):
    if name in H: u = Unit(H[name], lv, star); u.skill = SK.get(name)
    else:
        a, d, i, g = MOBS[name]; ga, gd, gi, gg = MOBG
        row = dict(名=name, 阵营='无', 定位='武将', 品阶='卒', 武力=a, 统率=d, 智力=i, 速度=g, 武成长=ga, 统成长=gd, 智成长=gi, 速成长=gg)
        u = Unit(row, lv, star)
    for k in u.base: u.base[k] *= ease
    return u
def apply_limit(stage, A, B):
    lim = stage['限制']
    m = re.search(r'(\S+)兵力(\d+)%', lim)
    if m:
        for e in B:
            if e.name == m.group(1): e.maxhp *= int(m.group(2)) / 100; e.hp = u_hp = e.maxhp
    if '我方不能攻击' in lim:
        for a in A: a.status['缴械'] = 3; a.status['计穷'] = 3
    if '敌方前三回合怯战' in lim:
        for e in B: e.status['怯战'] = 3
    if '桥窄' in lim:
        for e in B: e.flags['桥窄'] = True
    if '敌方前两回合不能攻击' in lim:
        for e in B: e.status['缴械'] = 2; e.status['计穷'] = 2
    # V0.2：原来只当剧情字的几条落地
    from dsl import parse_line, build
    if '反目' in lim:
        for e in B:
            if e.name in ('吕布', '董卓'): e.extras.append(build(parse_line('被动 | rend:custom(反目自伤)'), '反目'))
    if '我方灼烧伤害翻倍' in lim:
        for a in A: a.flags['dotout'] = a.flags.get('dotout', 0) + 1
    if '我方首位开场兵力50%且中毒3回合' in lim and A:
        A[0].hp = min(A[0].hp, A[0].maxhp * .5); A[0].status['中毒'] = 3; A[0].flags['中毒_src'] = (None, .03)
    if '孟获回场七次' in lim:
        for e in B:
            if e.name == '孟获': e.extras.append(build(parse_line('被动 | lethal:custom(七擒回场)'), '七擒'))
    if '敌方三回合不攻击' in lim:
        for e in B: e.status['缴械'] = 3; e.status['计穷'] = 3
    if '敌方前两回合不能攻击' in lim:
        for e in B: e.status['缴械'] = 2; e.status['计穷'] = 2
def strat_order(stage):
    named = [e for e in stage['敌方'].split('、') if e in H]
    if not named: return STRATS
    a = st.mean(float(H[e]['武力']) for e in named); i = st.mean(float(H[e]['智力']) for e in named)
    chase = sum(1 for e in named if SKROW.get(e, {}).get('类型', '') in ('追击', '主动·瞬发'))
    if i > a: return ['power', 'antimag', 'guard', 'burst', 'mag']
    if chase >= len(named) / 2: return ['power', 'guard', 'burst', 'antimag', 'mag']
    return ['power', 'burst', 'guard', 'mag', 'antimag']
def fight(p, stage, ease, strat='power'):
    names = p.team(stage, strat)
    if not names: return False, 0
    gears = p.equip_team(names)
    A = [mk_player_unit(p, n, gears[i] if i < len(gears) else None) for i, n in enumerate(names)]
    enemies = [e for e in stage['敌方'].split('、') if e]
    if '车轮战' in stage['限制']:
        named = [e for e in enemies if e in H]; mobs = [e for e in enemies if e not in H]
        r = 0
        for i, e in enumerate(named):
            B = [mk_enemy(x, int(stage['等级']), int(stage['星级']), ease) for x in [e] + mobs[:2]]
            for a in A:
                if a.alive(): a.hp = min(a.maxhp, a.hp + a.maxhp * .2); a.status.clear(); a.prep = None
            keep = [a for a in A if a.alive()]
            if not keep: return False, r
            b = Battle(keep, B); w, rr = b.run(); r += rr
            if w != 0: return False, r
        return True, r
    B = [mk_enemy(e, int(stage['等级']), int(stage['星级']), ease) for e in enemies]
    apply_limit(stage, A, B)
    b = Battle(A, B); fight.last = (A, B)
    mm = re.search(r'撑过(\S)回合即胜', stage['限制'])
    if mm:
        nr = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5}[mm.group(1)]
        w, r = b.run(max_rounds=nr)
        if any(a.alive() for a in A): w = 0
    else: w, r = b.run()
    if '必须存活' in stage['限制']:
        req = stage['必带'].split(',')[0]
        if not any(a.name == req and a.alive() for a in A): w = 1
    return w == 0, r

def run(seed, verbose=False):
    import random as _r; _r.seed(seed * 7919 + 1)
    p = Player(seed); res = []; stuck = None
    for idx, stage in enumerate(STAGES):
        if stage['类型'] in ('支线', '隐藏') and int(stage['章']) <= 26:
            pass  # 一周目主线优先，支线隐藏顺路打一次，打不过不管
        lv = int(stage['等级']); ch = int(stage['章']); ease = CFG['ease'](ch) * CFG['foe_mul'](ch, stage['类型'])
        cap = CFG['lv_cap'](lv)
        tries = 0; won = False; replays = 0; win_strat = ''
        main = stage['类型'] in ('主线', '章末')
        order = strat_order(stage) if main else ['power']
        per = CFG['per_strat'] if main else CFG['side_try']
        for strat in order:
            for k in range(per):
                while len(p.heroes) < 4 and p.gold >= CFG['draw']:
                    p.gold -= CFG['draw']; p.spent['招贤'] += CFG['draw']; p.add(p.rng.choice(POOL[p.draw_one()]))
                p.train(p.team(stage, strat), min(50, cap + min(6, tries // 5)))
                while len(p.heroes) < 9 and p.gold >= CFG['draw'] + 200:
                    p.gold -= CFG['draw']; p.spent['招贤'] += CFG['draw']; p.add(p.rng.choice(POOL[p.draw_one()]))
                # 前期人比星重要：不到 30 人就先十连，再考虑升星
                if p.gold >= CFG['draw10'] + (300 if len(p.heroes) < 30 else 3000) and len(p.heroes) < 80: p.spent['招贤'] += CFG['draw10']; p.draw10()
                p.sell_junk()
                p.star_up(p.team(stage, strat), reserve=2000)
                if p.gold >= CFG['smith10'] + 3000 and ch >= 6: p.smith10()
                tries += 1
                won, rounds = fight(p, stage, ease, strat)
                if won:
                    A, B = getattr(fight, 'last', ([], []))
                    margin = (sum(a.hp for a in A) / max(1, sum(a.maxhp for a in A))) if A else 0
                    tlv = st.mean(p.heroes[n]['lv'] for n in p.team(stage, strat)) if p.team(stage, strat) else 0
                    win_strat = strat; break
                # 卡关：复刷最近三关各最多三次（一天的量），刷完就没有了
                if idx > 0 and replays < CFG['replay_cap']:
                    p.gold += CFG['gold_replay'](int(STAGES[idx - 1 - replays // 3]['等级'])); replays += 1
                if tries % 5 == 0 and p.gold >= CFG['draw']:
                    p.gold -= CFG['draw']; p.spent['招贤'] += CFG['draw']; p.add(p.rng.choice(POOL[p.draw_one()]))
            if won: break
        res.append(dict(idx=idx, ch=ch, name=stage['关'], type=stage['类型'], lv=lv, tries=tries, won=won, heroes=len(p.heroes), gold=int(p.gold), margin=round(margin, 2) if won else 0, tlv=round(tlv, 1) if won else 0, stars=sum(p.heroes[n]['star'] for n in p.team(stage, win_strat or 'power')), strat=win_strat))
        if not won:
            if stage['类型'] in ('支线', '隐藏'): continue
            stuck = stage; break
        p.gold += CFG['gold_clear'](lv) * (CFG['boss_mult'] if stage['类型'] == '章末' else (CFG['hidden_mult'] if stage['类型'] == '隐藏' else 1))
        for n in [x for x in stage['入伙'].split(',') if x]:
            if n.endswith('碎片'):
                nm = n[:-2]; p.shards[nm] = p.shards.get(nm, 0) + 10
                if p.shards[nm] >= 30 and nm not in p.heroes: p.add(nm)
            else: p.add(n)
        # 掉落一件装备，档按章
        tier = ['凡品', '良品', '精品', '珍品', '神品'][min(4, (ch - 1) // 5 if ch <= 25 else 4)]
        cands = [e for e in EQROWS if e['档'] == tier and not e['归属']]
        if cands: p.bag.append(p.rng.choice(cands))
    return p, res, stuck

if __name__ == '__main__':
    N = int(sys.argv[1]) if len(sys.argv) > 1 else 8
    allres = []; stucks = collections.Counter(); cleared = []
    for seed in range(N):
        p, res, stuck = run(seed)
        main = [r for r in res if r['type'] in ('主线', '章末')]
        cleared.append(sum(1 for r in main if r['won']))
        if stuck: stucks[f"{stuck['章']} {stuck['关']}"] += 1
        allres.append(res)
        print('   花销', dict(p.spent))
        print(f"seed {seed}: 主线通 {cleared[-1]}/108，卡在 {stuck['章'] + ' ' + stuck['关'] if stuck else '—'}，将领 {len(p.heroes)}，抽了 {p.draws} 次，开局 {p.gift}")
    # 逐关平均重试
    per = collections.defaultdict(list)
    for res in allres:
        for r in res: per[(r['ch'], r['name'], r['type'])].append(r['tries'])
    print('\n重试最多的关（平均）：')
    for k, v in sorted(per.items(), key=lambda kv: -st.mean(kv[1]))[:20]:
        print(f'  第{k[0]}章 {k[1]}（{k[2]}）平均 {st.mean(v):.1f} 次，{len(v)} 局到达')
    chap = collections.defaultdict(list)
    for k, v in per.items():
        if k[2] in ('主线', '章末'): chap[k[0]] += v
    mg = collections.defaultdict(list)
    for res in allres:
        for r in res:
            if r['type'] in ('主线', '章末') and r['won']: mg[r['ch']].append(r['margin'])
    print('各章主线赢时我方剩兵比：', ' '.join(f'{c}:{st.mean(v):.2f}' for c, v in sorted(mg.items())))
    gl = collections.defaultdict(list)
    for res in allres:
        for r in res:
            if r['type'] == '章末': gl[r['ch']].append((r['gold'], r['tlv'], r['heroes'], r.get('stars', 0)))
    print('章末时 金币/队伍等级/将领数/阵上总星：', ' '.join(f'{c}:{int(st.mean(x[0] for x in v))}/{st.mean(x[1] for x in v):.0f}/{st.mean(x[2] for x in v):.0f}/{st.mean(x[3] for x in v):.0f}' for c, v in sorted(gl.items())))
    print('\n各章主线平均重试：', ' '.join(f'{c}:{st.mean(v):.1f}' for c, v in sorted(chap.items())))
    print('\n零重试的章：', sorted({k[0] for k, v in per.items() if k[2] in ('主线', '章末') and st.mean(v) <= 1.0 and all(st.mean(v2) <= 1.0 for k2, v2 in per.items() if k2[0] == k[0] and k2[2] in ('主线', '章末'))}))
    print('卡关分布：', dict(stucks))
    sw = collections.defaultdict(collections.Counter)
    for res in allres:
        for r in res:
            if r['won'] and r['type'] in ('主线', '章末') and r['strat'] != 'power': sw[(r['ch'], r['name'])][STRAT_CN[r['strat']]] += 1
    print('\n靠换阵容过的关（局数）：')
    for k, c in sorted(sw.items()): print(f'  第{k[0]}章 {k[1]}：' + '，'.join(f'{a} {b}' for a, b in c.items()))
    json.dump(allres, open('playthrough_result.json', 'w'), ensure_ascii=False)
