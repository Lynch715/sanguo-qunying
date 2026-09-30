# -*- coding: utf-8 -*-
"""霸业模式模拟：四十四城，选一家从头推。规则见《设计_霸业模式》。
用法：python3 conquest.py [每家局数] [阵营]"""
import sys, random, statistics as st, collections, csv
import playthrough as P
from playthrough import H, CFG, TIER_ORDER, mk_player_unit, mk_enemy, MOBS
from engine import Battle

# ---------- 地图 ----------
CITY_TXT = """洛阳 都 无|长安 都 汉|弘农 郡 汉|许昌 都 魏|陈留 大 魏|濮阳 郡 魏|汝南 郡 魏|谯 郡 魏
北海 郡 无|下邳 大 无|彭城 郡 无|广陵 郡 无|邺 都 魏|南皮 大 魏|平原 郡 魏|蓟 大 无|晋阳 大 汉|上党 郡 汉
天水 大 汉|陇西 郡 汉|武威 郡 汉|成都 都 蜀|梓潼 大 蜀|江州 郡 蜀|永安 大 蜀|汉中 大 蜀|建宁 郡 无
襄阳 都 无|新野 郡 无|上庸 郡 无|江陵 大 蜀|江夏 大 吴|长沙 大 吴|武陵 郡 蜀|零陵 郡 蜀|桂阳 郡 无
建业 都 吴|吴郡 大 吴|会稽 郡 吴|柴桑 大 吴|庐江 郡 吴|寿春 大 无|合肥 大 无|交趾 郡 无"""
ADJ_TXT = """洛阳—长安 弘农 许昌 陈留 上党 邺|长安—弘农 天水 汉中 上党|弘农—洛阳 长安 上庸 襄阳|许昌—洛阳 陈留 汝南 谯 襄阳 新野
陈留—洛阳 许昌 濮阳 谯 彭城|濮阳—陈留 平原 邺 北海|汝南—许昌 谯 寿春 江夏 新野|谯—许昌 陈留 汝南 彭城 寿春
北海—濮阳 平原 彭城|下邳—彭城 广陵 寿春|彭城—陈留 谯 北海 下邳|广陵—下邳 寿春 建业|邺—洛阳 濮阳 平原 南皮 上党
南皮—邺 平原 蓟|平原—濮阳 北海 邺 南皮|蓟—南皮 晋阳|晋阳—蓟 上党|上党—洛阳 长安 邺 晋阳|天水—长安 陇西 汉中
陇西—天水 武威|武威—陇西|成都—梓潼 江州 建宁|梓潼—成都 汉中 江州|江州—成都 梓潼 永安 建宁|永安—江州 江陵 武陵
汉中—长安 天水 梓潼 上庸|建宁—成都 江州 交趾|襄阳—弘农 许昌 新野 上庸 江陵|新野—许昌 汝南 襄阳 江夏|上庸—弘农 汉中 襄阳
江陵—襄阳 永安 江夏 武陵 长沙|江夏—汝南 新野 江陵 长沙 柴桑|长沙—江陵 江夏 武陵 零陵 桂阳 柴桑|武陵—永安 江陵 长沙 零陵
零陵—长沙 武陵 桂阳 交趾|桂阳—长沙 零陵 会稽|建业—广陵 吴郡 庐江 合肥|吴郡—建业 会稽|会稽—吴郡 桂阳|柴桑—江夏 长沙 庐江
庐江—建业 柴桑 合肥|寿春—汝南 谯 下邳 广陵 合肥|合肥—建业 庐江 寿春|交趾—建宁 零陵"""
CITIES = {}
for tok in CITY_TXT.replace('\n', '|').split('|'):
    n, t, o = tok.split(); CITIES[n] = dict(tier=t, owner=o)
ADJ = collections.defaultdict(set)
for tok in ADJ_TXT.replace('\n', '|').split('|'):
    a, bs = tok.split('—')
    for b in bs.split(): ADJ[a].add(b); ADJ[b].add(a)
assert set(ADJ) == set(CITIES), set(ADJ) ^ set(CITIES)
FACTIONS = ['魏', '蜀', '吴', '汉']
CAPITAL = {'魏': '许昌', '蜀': '成都', '吴': '建业', '汉': '长安'}
LEADER = {'魏': '曹操', '蜀': '刘备', '吴': '孙权', '汉': '王允'}
INCOME = {'都': 800, '大': 500, '郡': 300}
GARRISON = {'都': (9, {'无双': 2, '虎': 2, '名': 3}), '大': (7, {'虎': 1, '名': 2}), '郡': (5, {'名': 1})}
RANSOM = {'校': 300, '骁': 800, '名': 2000, '虎': 5000, '无双': 12000}
LOYAL = {'蜀': {'关羽', '张飞', '诸葛亮'}, '魏': {'荀彧', '夏侯惇', '典韦'}, '吴': {'周瑜', '太史慈'}, '汉': {'吕布', '董卓'}}
MOB_OF = {'魏': '魏卒·刀盾', '蜀': '蜀卒·长枪', '吴': '吴卒·环刀', '汉': '汉军郡兵', '无': '黄巾兵'}
CQ = dict(start_gold=3000, max_turn=120, ai_min_ratio=0.8, ai_vs_me_ratio=1.3, ai_cooldown=3, truce=12, capital_bonus=1.5, rest_below=0.9, attack_min_ratio=0.5, escape_turns=10,
          foe_lv=lambda t: min(50, int(8 + 0.8 * t)), foe_star=lambda t: min(5, 1 + t // 20),
          neutral_lv=0.85, guard_bonus=0.05)

def stat_power(name, lv, star):
    h = H[name]
    base = sum(float(h[k]) + float(h[g]) * (lv - 1) for k, g in [('武力', '武成长'), ('统率', '统成长'), ('智力', '智成长'), ('速度', '速成长')])
    return base * (1 + .05 * (star - 1)) * (1 + .15 * TIER_ORDER.index(h['品阶'])) * lv / 10

class World:
    def __init__(self, seed, me):
        self.rng = random.Random(seed); random.seed(seed * 31 + 7)
        self.me = me; self.turn = 0; self.alive = {f: True for f in FACTIONS}
        self.city = {n: dict(tier=c['tier'], owner=c['owner'], garrison=[], guard=None) for n, c in CITIES.items()}
        # 各家名单摊到城里
        self.spare = {f: [n for n, h in H.items() if h['阵营'] == f] for f in FACTIONS + ['无']}
        for f in self.spare: self.rng.shuffle(self.spare[f])
        # 玩家
        p = P.Player(seed); p.heroes = {}; p.gold = CQ['start_gold']; p.spent = collections.Counter()
        p.add(LEADER[me]); self.spare[me].remove(LEADER[me])
        for tier, k in [('名', 2), ('骁', 2), ('校', 2)]:
            c = [n for n in self.spare[me] if H[n]['品阶'] == tier]
            for n in self.rng.sample(c, min(k, len(c))): p.add(n); self.spare[me].remove(n)
        self.p = p; self.pool = [n for n in H if H[n]['阵营'] in (me, '无')]
        self.prisoners = []  # (name, faction, turn)
        self.last_hit = {}; self.capital = dict(CAPITAL)
        for n, c in self.city.items():
            if c['owner'] != me: self.fill(n)
            else: self.assign_guard(n)
        self.log = []
    # ----- 守军 -----
    def fill(self, n):
        c = self.city[n]; f = c['owner']; cnt, comp = GARRISON[c['tier']]
        if f in FACTIONS and sum(1 for x in self.city.values() if x['owner'] == f) <= 3:
            c['garrison'] = [MOB_OF[f]] * cnt; return  # 残局：不再补人
        if f == '无': cnt = max(5, cnt - 2); comp = {'虎': 1, '名': 2} if c['tier'] == '都' else {'名': 1}
        g = []
        for tier, k in comp.items():
            c2 = [x for x in self.spare[f] if H[x]['品阶'] == tier][:k]
            for x in c2: self.spare[f].remove(x); g.append(x)
        rest = [x for x in self.spare[f] if H[x]['品阶'] in ('骁', '校')]
        for x in rest[:cnt - len(g)]: self.spare[f].remove(x); g.append(x)
        while len(g) < cnt: g.append(MOB_OF[f])
        c['garrison'] = g
    def assign_guard(self, n):
        c = self.city[n]; p = self.p
        free = self.free_heroes()
        if c['guard'] in p.heroes: return
        if free: c['guard'] = min(free, key=lambda x: p.power(x))
        else: c['guard'] = None
    def reassign_guards(self):
        # 每回合重排：最弱的人守城，强的出征
        p = self.p; mine = [c for c in self.city if self.city[c]['owner'] == self.me]
        order = sorted(p.heroes, key=lambda x: p.power(x))
        for c in mine: self.city[c]['guard'] = None
        for c, g in zip(mine, order): self.city[c]['guard'] = g
    def free_heroes(self):
        used = {c['guard'] for c in self.city.values() if c['owner'] == self.me and c['guard']}
        return [n for n in self.p.heroes if n not in used]
    def foe_units(self, n):
        c = self.city[n]; lv = CQ['foe_lv'](self.turn); star = CQ['foe_star'](self.turn)
        if c['owner'] == '无': lv = max(1, int(lv * CQ['neutral_lv'])); star = max(1, star - 1)
        U = [mk_enemy(x, lv, star, 1.0) for x in c['garrison']]
        for u in U: u.hp = u.maxhp * c.get('hp', 1.0)
        return U
    def save_foe_hp(self, n, B):
        alive = [u for u in B if u.alive()]
        self.city[n]['hp'] = max(0.05, sum(u.hp for u in B) / max(1, sum(u.maxhp for u in B)))
    def foe_power(self, n):
        c = self.city[n]; lv = CQ['foe_lv'](self.turn); star = CQ['foe_star'](self.turn)
        if c['owner'] == '无': lv = max(1, int(lv * CQ['neutral_lv'])); star = max(1, star - 1)
        tot = 0; hpf = 0.5 + 0.5 * c.get('hp', 1.0)
        for x in c['garrison']:
            if x in H: tot += stat_power(x, lv, star)
            else: tot += (sum(MOBS[x]) + sum(P.MOBG) * (lv - 1)) * (1 + .05 * (star - 1)) * lv / 10
        return tot * hpf
    def my_units(self, names):
        A = []; gears = self.p.equip_team(names)
        for i, n in enumerate(names):
            u = mk_player_unit(self.p, n, gears[i] if i < len(gears) else None); u.hp = u.maxhp * self.p.heroes[n].get('hp', 1.0); A.append(u)
        return A
    def save_hp(self, A):
        for u in A: self.p.heroes[u.name]['hp'] = max(0.05, u.hp / u.maxhp)
    def recover(self):
        p = self.p
        for n, h in p.heroes.items(): h['hp'] = min(1.0, h.get('hp', 1.0) + 0.2)
    def conscript(self, names):
        # 出征队缺兵就花钱补满：缺一千兵 = 4 × 等级
        p = self.p
        for n in names:
            h = p.heroes[n]; lack = (1 - h.get('hp', 1.0)) * h['lv']  # 千兵
            if h.get('hp', 1.0) >= 0.7: continue
            cost = int(lack * 2 * h['lv'])
            if cost > 0 and p.gold - cost >= 500: p.gold -= cost; p.spent['征兵'] += cost; h['hp'] = 1.0
    def my_power(self, names): return sum(self.p.power(n) * self.p.heroes[n]['lv'] / 10 * (0.5 + 0.5 * self.p.heroes[n].get('hp', 1.0)) for n in names)
    # ----- 玩家回合 -----
    def player_turn(self):
        p = self.p; me = self.me
        p.gold += sum(INCOME[c['tier']] for c in self.city.values() if c['owner'] == me)
        self.recover()
        for c in self.city.values(): c['hp'] = min(1.0, c.get('hp', 1.0) + 0.2)
        # 招贤：不到 12 人就抽
        while len(p.heroes) < 12 and p.gold >= CFG['draw'] + 1000:
            p.gold -= CFG['draw']; p.spent['招贤'] += CFG['draw']
            t = p.draw_one(); c = [n for n in self.pool if H[n]['品阶'] == t]
            if c: p.add(self.rng.choice(c))
        self.reassign_guards()
        free = sorted(self.free_heroes(), key=lambda x: -p.power(x))
        team = free[:9]
        cap = min(50, CQ['foe_lv'](self.turn) + 2)
        p.train(team, cap); p.sell_junk(); p.star_up(team, reserve=3000)
        if p.gold >= CFG['smith10'] + 5000 and self.turn >= 6: p.smith10()
        # 招降：俘虏营里最贵的、买得起的
        for pr in sorted(self.prisoners, key=lambda x: -RANSOM[H[x[0]]['品阶']]):
            n, f, t = pr
            cost = RANSOM[H[n]['品阶']]
            if p.gold - cost >= 3000: p.gold -= cost; p.spent['招降'] += cost; p.add(n); self.prisoners.remove(pr)
        team = sorted(self.free_heroes(), key=lambda x: -p.power(x))[:9]; p.train(team, cap); p.star_up(team, reserve=1500); self.conscript(team)
        if not team: return '无人'
        if st.mean(p.heroes[n].get('hp', 1.0) for n in team) < CQ['rest_below']: return '休整(兵)'
        # 目标：相邻敌城里最好打的
        mine = [c for c in self.city if self.city[c]['owner'] == me]
        targets = {b for a in mine for b in ADJ[a] if self.city[b]['owner'] != me}
        if not targets: return '无目标'
        mp = self.my_power(team)
        strong = [t for t in targets if mp / max(1, self.foe_power(t)) >= 1.0]
        # 打得过的里面挑最肥的（先灭野战主力，再收空城）；都打不过就挑最软的
        best = max(strong, key=lambda t: self.foe_power(t)) if strong else max(targets, key=lambda t: mp / max(1, self.foe_power(t)))
        ratio = mp / max(1, self.foe_power(best))
        if ratio < CQ['attack_min_ratio']: return f'休整({ratio:.2f})'
        A = self.my_units(team); B = self.foe_units(best)
        w, r = Battle(A, B).run(); self.save_hp(A); self.conscript(team)
        if w != 0: self.save_foe_hp(best, B)
        if w == 0:
            c = self.city[best]; old = c['owner']
            for x in c['garrison']:
                if x in H: self.prisoners.append((x, old, self.turn))
            c['owner'] = me; c['garrison'] = []; c['guard'] = None; self.assign_guard(best)
            if old in FACTIONS and best == self.capital[old]:
                left = [n2 for n2, c2 in self.city.items() if c2['owner'] == old]
                if len(left) <= 3:
                    for n2 in left:
                        c2 = self.city[n2]
                        for x in c2['garrison']:
                            if x in H: self.prisoners.append((x, old, self.turn))
                        c2['owner'] = me; c2['garrison'] = []; c2['guard'] = None; self.assign_guard(n2)
                else:
                    # 迁都：搬到剩下最大的城
                    self.capital[old] = max(left, key=lambda n2: {'都': 3, '大': 2, '郡': 1}[self.city[n2]['tier']])
            self.check_dead(old); return f'攻下{best}'
        return f'攻{best}败'
    # ----- AI -----
    def faction_strength(self, f):
        cs = [c for c in self.city if self.city[c]['owner'] == f]
        return st.mean(self.foe_power(c) for c in cs) if cs else 0
    def reinforce(self, f, mine):
        # 跟玩家接壤的城补到 9 人，用手里最强的人；每回合最多两座
        border = [c for c in mine if any(self.city[b]['owner'] not in (f, '无') for b in ADJ[c])]
        sp = sorted(self.spare[f], key=lambda x: -TIER_ORDER.index(H[x]['品阶']))
        done = 0
        for c in sorted(border, key=lambda c: self.foe_power(c)):
            g = self.city[c]['garrison']
            while len([x for x in g if x in H]) < 7 and sp:
                x = sp.pop(0); self.spare[f].remove(x)
                if len(g) >= 9: g.remove(next(m for m in g if m not in H)) if any(m not in H for m in g) else g.pop()
                g.append(x)
            done += 1
            if done >= 1: break
    def ai_turn(self, f):
        if not self.alive[f]: return
        mine = [c for c in self.city if self.city[c]['owner'] == f]
        if not mine: return
        self.reinforce(f, mine)
        # 从哪座城出兵打哪座：用出兵城的守军
        def tp(t):
            if self.city[t]['owner'] == self.me:
                c = self.city[t]; g = c['guard']; free = sorted(self.free_heroes(), key=lambda x: -self.p.power(x))[:8]
                names = ([g] if g else []) + free
                return self.my_power(names) if names else 1
            return self.foe_power(t)
        pairs = [(a, b) for a in mine for b in ADJ[a] if self.city[b]['owner'] != f and self.city[a].get('hp', 1.0) >= 0.8 and not (self.turn <= CQ['truce'] and self.city[b]['owner'] == self.me)]
        if not pairs: return
        a, best = max(pairs, key=lambda ab: self.foe_power(ab[0]) / max(1, tp(ab[1])))
        ratio = self.foe_power(a) / max(1, tp(best))
        if ratio < (CQ['ai_vs_me_ratio'] if self.city[best]['owner'] == self.me else CQ['ai_min_ratio']): return
        c = self.city[best]; old = c['owner']
        if old == self.me:
            if self.turn - self.last_hit.get(f, -99) < CQ['ai_cooldown'] or self.last_hit.get('any') == self.turn: return
            self.last_hit[f] = self.turn; self.last_hit['any'] = self.turn
            g = c['guard']; free = sorted(self.free_heroes(), key=lambda x: -self.p.power(x))[:8]
            names = ([g] if g else []) + free
            if not names: won = True
            else:
                A = self.my_units(names)
                gb = 1 + CQ['guard_bonus'] * (self.p.stat4(g)['统率'] // 10) if g else 1
                if best == CAPITAL[self.me]: gb *= CQ['capital_bonus']
                for u in A: u.maxhp *= gb; u.hp *= gb; u.lvhp = u.maxhp
                B = self.foe_units(a)
                w, r = Battle(A, B).run(); won = (w == 1); self.save_hp(A); self.save_foe_hp(a, B)
                if not won:
                    dead = [u.name for u in B if not u.alive() and u.name in H]
                    for x in dead: self.city[a]['garrison'].remove(x); self.prisoners.append((x, f, self.turn))
            if won:
                if g: self.p.heroes.pop(g, None)
                c['owner'] = f; c['guard'] = None
                # 出兵城的守军搬过去，出兵城重新补
                c['garrison'] = list(self.city[a]['garrison']); c['hp'] = self.city[a].get('hp', 1.0); self.fill(a); self.city[a]['hp'] = 1.0
                self.log.append((self.turn, f, best))
                if best == CAPITAL[self.me] and sum(1 for c in self.city.values() if c['owner'] == self.me) < 4: self.dead_me = True
            return
        pwin = ratio / (1 + ratio)
        if self.rng.random() < pwin:
            for x in c['garrison']:
                if x in H: self.spare[old].append(x)
            c['owner'] = f; c['garrison'] = list(self.city[a]['garrison']); self.fill(a); self.check_dead(old, f)
    def prisoners_of_ai(self, g): pass  # 被俘的守将：等玩家打回去（简化：直接没了）
    def check_dead(self, f, by=None):
        if f in FACTIONS and self.alive[f] and not any(c['owner'] == f for c in self.city.values()):
            self.alive[f] = False
            if by in FACTIONS: self.spare[by] += self.spare[f]; self.spare[f] = []
    def run(self):
        self.dead_me = False; hist = []
        for self.turn in range(1, CQ['max_turn'] + 1):
            act = self.player_turn()
            for f in FACTIONS:
                if f != self.me: self.ai_turn(f)
            n_me = sum(1 for c in self.city.values() if c['owner'] == self.me)
            hist.append((self.turn, n_me, act))
            if self.dead_me or n_me == 0: return 'lose', self.turn, hist
            if n_me == 44 or not any(self.alive[f] for f in FACTIONS if f != self.me): return 'win', self.turn, hist
        return 'timeout', self.turn, hist

if __name__ == '__main__':
    N = int(sys.argv[1]) if len(sys.argv) > 1 else 4
    facs = [sys.argv[2]] if len(sys.argv) > 2 else FACTIONS
    for me in facs:
        res = []
        for seed in range(N):
            w = World(seed, me); out, t, hist = w.run()
            owners = collections.Counter(c['owner'] for c in w.city.values())
            res.append((out, t, hist, owners, w))
            cities_at = {k: next((h[1] for h in hist if h[0] == k), hist[-1][1]) for k in (10, 20, 40, 80)}
            fails = sum(1 for h in hist if h[2].endswith('败')); lost = len(w.log)
            print(f'   攻败{fails}次 被AI夺城{lost}次')
            print(f'{me} seed{seed}: {out} 回合{t} 城数 10/20/40/80回合={cities_at} 终局 {dict(owners)} 将领{len(w.p.heroes)} 花销{dict(w.p.spent)} 金币{int(w.p.gold)}')
        wins = [r for r in res if r[0] == 'win']
        print(f'== {me}: 赢 {len(wins)}/{N}，赢的平均回合 {st.mean(r[1] for r in wins) if wins else "-"}；输 {sum(1 for r in res if r[0]=="lose")}，超时 {sum(1 for r in res if r[0]=="timeout")}')
        acts = collections.Counter(h[2].split('(')[0][:2] for r in res for h in r[2])
        print('   玩家动作分布', dict(acts))
