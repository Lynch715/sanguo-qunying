# -*- coding: utf-8 -*-
"""三国群英录 · 战斗模拟引擎（Python 原型，规则口径与将来的 JS 引擎一致）

回合流程
  每回合：按速度降序（同速随机）逐人行动 → 回合末结算灼烧/中毒/回兵、buff 计时
  一人行动：震慑→跳过；准备中→结算准备技；否则掷主动技（计穷则不掷）；没放技能→普攻→追击掷骰
伤害
  dmg = 攻方兵力上限 × (0.5+0.5×兵力比) × 0.30 × 倍率 × (A/(A+D))^2 × rnd(0.85,1.15)
  兵刃 A=武力 D=统率；谋略 A=智力 D=0.5智力+0.5统率；谋略普攻 ×0.9
"""
import random, math

BASE, GAMMA = 0.30, 2.0

# ---- 羁绊（V0.3）：同一方阵上凑齐/凑半，每人加四维；每项合计封顶 12% ----
import os as _os, csv as _csv
BOND_ON = True
def _load_bonds():
    p = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), '..', 'data', 'bonds.tsv')
    if not _os.path.exists(p): return []
    with open(p, encoding='utf-8') as f:
        return [{'name': r['名'], 'mem': r['成员'].split(), 'k': r['属性'], 'v': float(r['满值']) / 100} for r in _csv.DictReader(f, delimiter='\t')]
BONDS = _load_bonds()
BOND_CAP = 0.12
def bond_tier(n, c):
    if c >= n: return 1.0
    if n >= 4 and c >= max(2, -(-n // 2)): return 0.5
    return 0.0
def active_bonds(names):
    s = set(names); out = []
    for b in BONDS:
        c = sum(1 for m in b['mem'] if m in s)
        t = bond_tier(len(b['mem']), c)
        if t: out.append((b, t))
    return out
def apply_bonds(team):
    act = active_bonds([u.name for u in team])
    for u in team:
        tot = {}
        for b, t in act:
            if u.name in b['mem']: tot[b['k']] = tot.get(b['k'], 0) + b['v'] * t
        for k, v in tot.items(): u.addbuff(k, min(BOND_CAP, v), -1, 'perm羁绊' + k)
    return act

CTRL = ('震慑', '混乱', '缴械', '计穷', '怯战', '挑衅', '迷惑')

class Unit:
    def __init__(self, h, lv=50, star=1):
        self.name = h['名']; self.faction = h['阵营']; self.role = h['定位']; self.tier = h['品阶']
        g = lambda k, gk: (float(h[k]) + float(h[gk]) * (lv - 1)) * (1 + {1: 0, 2: .05, 3: .10, 4: .15, 5: .20}[star])
        self.base = {'atk': g('武力', '武成长'), 'def': g('统率', '统成长'), 'int': g('智力', '智成长'), 'agi': g('速度', '速成长')}
        self.maxhp = lv * 1000.0; self.hp = self.maxhp; self.lvhp = self.maxhp
        self.buffs = []          # [stat, pct, rounds(-1 常驻), tag]
        self.status = {}         # name -> rounds
        self.shield = 0.0
        self.skill = None        # dict, 见 skills 模块
        self.extras = []         # 装备特效等附加被动（skill dict 列表）
        self.equip = []          # 装备行（dict），见 equip_src
        self.prep = None         # 准备中的技能
        self.flags = {}          # 技能私有计数
        self.team = None; self.side = 0; self.idx = 0
        self.battle = None
        self.taunt_by = None; self.hidden = 0
        self.once = set()
    def alive(self): return self.hp > 0
    def front(self): return self.idx < 3
    def stat(self, k):
        pct = sum(b[1] for b in self.buffs if b[0] == k)
        pct = max(-0.30, min(0.25, pct))
        flat = 0.0; epct = 0.0
        for e in self.equip:
            if e['维'] == k:
                f = float(e['固定']) * (1.5 if e['归属'] == self.name else 1.0)
                flat += f; epct += float(e['百分比']) / 100
        return (self.base[k] + flat) * (1 + pct + epct)
    def addbuff(self, k, pct, rounds=-1, tag=None):
        if tag:
            for b in self.buffs:
                if b[3] == tag: b[1] = pct; b[2] = rounds; return
        self.buffs.append([k, pct, rounds, tag])
    def flag(self, k):
        return sum(b[1] for b in self.buffs if b[0] == k) + (self.flags.get(k, 0) if isinstance(self.flags.get(k, 0), (int, float)) else 0)
    def has(self, s): return self.status.get(s, 0) > 0
    def add_status(self, s, rounds, prob=1.0, src=None):
        if s in CTRL and src is not None:
            prob = min(0.95, (prob + src.flag('ctrlhit')) * math.sqrt(max(0.2, src.stat('int') / max(1, self.stat('int')))))
        if self.battle.hook_all('resist_status', self, s): return False
        if s == '隐身': self.hidden = max(self.hidden, rounds); return True
        if s == '挑衅' and self.flags.get('immune_taunt'): return False
        if s == '震慑' and self.flags.get('吓死'): self.hp = 0; self.battle.say(f'{self.name} 吓死'); return True
        if random.random() < prob:
            r = rounds + int(round(self.flag('ctrllen'))) if s in CTRL else rounds
            r = max(1, r) if s in CTRL else r
            self.status[s] = max(self.status.get(s, 0), r)
            if s in ('震慑', '混乱', '计穷') and self.prep and not self.flags.get('prep_unbreak'): self.prep = None
            return True
        return False
    def cleanse(self):
        for s in CTRL: self.status.pop(s, None)
    def dispel(self):
        self.buffs = [b for b in self.buffs if b[1] < 0 or b[2] == -1 and b[3] and b[3].startswith('perm')]
        self.shield = 0
    def ratio(self): return self.hp / self.maxhp

class Battle:
    def __init__(self, A, B, log=False):
        self.teams = [A, B]; self.round = 0; self.log = log; self.lines = []; self.flags_round = {}
        for s, t in enumerate(self.teams):
            for i, u in enumerate(t): u.team = t; u.side = s; u.idx = i; u.battle = self
        self.hooks = []  # (event, unit, fn)
        try:
            from skills_top import GLOBAL_HOOKS
        except Exception: GLOBAL_HOOKS = {}
        try:
            from skills_custom import CUSTOM as _C
            GLOBAL2 = _C.get('_global', {})
        except Exception: GLOBAL2 = {}
        for u in A + B:
            for ev, fn in GLOBAL_HOOKS.items(): self.hooks.append((ev, u, fn))
            for ev, fn in GLOBAL2.items(): self.hooks.append((ev, u, fn))
            for sk in ([u.skill] if u.skill else []) + list(u.extras):
                if sk and sk.get('hooks'):
                    for ev, fn in sk['hooks'].items():
                        if fn: self.hooks.append((ev, u, fn))
    def say(self, s):
        if self.log: self.lines.append(f'[{self.round}] {s}')
    SUBJECT = {'on_hit_taken', 'after_hit', 'after_attack', 'on_death', 'on_kill', 'round_end_unit', 'on_dodge', 'mod_in', 'mod_out', 'choose_target', 'on_lethal'}
    def hook_all(self, ev, *a):
        r = None
        subj = ev in self.SUBJECT
        for e, u, fn in self.hooks:
            if e != ev: continue
            if subj:
                if a[0] is not u or (not u.alive() and ev not in ('on_death', 'on_lethal')): continue
                x = fn(u, *a[1:])
            else:
                if not u.alive(): continue
                x = fn(u, *a)
            if x: r = x
        return r
    def enemies(self, u): return [x for x in self.teams[1 - u.side] if x.alive()]
    def allies(self, u): return [x for x in self.teams[u.side] if x.alive()]
    def targetable(self, u): return [x for x in self.enemies(u) if x.hidden <= 0] or self.enemies(u)
    # ---- 伤害 ----
    def damage(self, src, tgt, mult, kind='phys', ignore=0.0, must_hit=False, tag='skill'):
        if not tgt.alive(): return 0
        if not must_hit and random.random() < tgt.flag('dodge'): self.say(f'{tgt.name} 闪避了 {src.name}'); self.hook_all('on_dodge', tgt, src); return 0
        A = src.stat('atk') if kind == 'phys' else src.stat('int')
        D = tgt.stat('def') if kind == 'phys' else 0.5 * tgt.stat('int') + 0.5 * tgt.stat('def')
        D *= (1 - ignore)
        m = mult * (0.9 if (kind == 'mag' and tag == 'attack') else 1.0)
        dmg = src.lvhp * (0.5 + 0.5 * src.ratio()) * BASE * m * (A / (A + D)) ** GAMMA * random.uniform(0.85, 1.15)
        dmg *= (1 + src.flag('dmgout')) * (1 + tgt.flag('dmgin'))
        if kind == 'mag': dmg *= (1 + tgt.flag('magin'))
        else: dmg *= (1 + tgt.flag('physin'))
        if tag == 'pursue': dmg *= (1 + tgt.flag('pursuein'))
        for mode, who, pct in src.flags.get('vs', []):
            if mode == 'vs' and (tgt.faction == who or tgt.tier == who): dmg *= (1 + pct)
        for mode, who, pct in tgt.flags.get('vs', []):
            if mode == 'vsin' and (src.faction == who or src.tier == who): dmg *= (1 + pct)
        x = self.hook_all('mod_out', src, tgt, kind, tag)
        if x: dmg *= x
        x = self.hook_all('mod_in', tgt, src, kind, tag)
        if x: dmg *= x
        if kind == 'mag': dmg *= (1 + src.flag('magout'))
        if tag == 'pursue': dmg *= (1 + src.flag('pursueout'))
        if tgt.prep: dmg *= (1 - tgt.flags.get('prep_guard', 0))
        if random.random() < src.flag('crit'): dmg *= src.flags.get('critmul', 1.5)
        return self.apply(src, tgt, dmg, kind, tag)
    def apply(self, src, tgt, dmg, kind='phys', tag='skill', true=False):
        if not tgt.alive(): return 0
        # 替受
        sub = self.hook_all('substitute', tgt, src, kind, tag)
        if sub and sub is not tgt and sub.alive():
            return self.apply(src, sub, dmg * sub.flags.get('sub_mul', 1.0), kind, tag, true)
        if not true and tgt.shield > 0:
            a = min(tgt.shield, dmg); tgt.shield -= a; dmg -= a
            if tgt.shield <= 0: self.hook_all('shield_broken', tgt)
        tgt.hp -= dmg
        self.say(f'{src.name if src else "-"} → {tgt.name} {int(dmg)} ({tag})')
        if src: self.hook_all('after_hit', src, tgt, dmg, kind, tag)
        self.hook_all('on_hit_taken', tgt, src, dmg, kind, tag)
        if tgt.hp <= 0:
            tgt.hp = 0
            if not self.hook_all('on_lethal', tgt, src) and not self.hook_all('on_lethal_any', tgt, src):
                self.say(f'{tgt.name} 退场')
                self.hook_all('on_death', tgt, src)
                for e, u, fn in self.hooks:
                    if e == 'on_ally_death' and u.alive() and u.side == tgt.side and u is not tgt: fn(u, tgt, src)
                    if e == 'on_enemy_death' and u.alive() and u.side != tgt.side: fn(u, tgt, src)
                if src: self.hook_all('on_kill', src, tgt)
        return dmg
    def heal(self, src, tgt, pct):
        if not tgt.alive(): return
        amt = tgt.maxhp * pct * (1 + (src.flag('healout') if src else 0))
        if tgt.has('诅咒'): tgt.hp -= amt; self.say(f'{tgt.name} 诅咒 −{int(amt)}'); return
        tgt.hp = min(tgt.maxhp, tgt.hp + amt)
    def shield(self, tgt, pct, src=None): tgt.shield = max(tgt.shield, tgt.maxhp * pct * (1 + (src.flag('shieldout') if src else 0)))
    # ---- 选目标 ----
    def pick(self, u, sel='random', n=1, stat=None):
        E = self.targetable(u)
        if not E: return []
        if sel == 'random': return random.sample(E, min(n, len(E)))
        if sel == 'all': return list(E)
        if sel == 'hp_max': return sorted(E, key=lambda x: -x.hp)[:n]
        if sel == 'hp_min': return sorted(E, key=lambda x: x.hp)[:n]
        if sel == 'stat_max': return sorted(E, key=lambda x: -x.stat(stat))[:n]
        if sel == 'stat_min': return sorted(E, key=lambda x: x.stat(stat))[:n]
        if sel == 'front': return [x for x in E if x.front()][:n] or E[:n]
        if sel == 'back': return (sorted(E, key=lambda x: x.stat('agi'))[:n])
        return E[:n]
    def ally_pick(self, u, sel='hp_min', n=1):
        A = self.allies(u)
        if sel == 'hp_min': return sorted(A, key=lambda x: x.ratio())[:n]
        if sel == 'random': return random.sample(A, min(n, len(A)))
        if sel == 'all': return A
        if sel == 'front': return [x for x in A if x.front()]
        if sel == 'self': return [u]
        return A[:n]
    # ---- 普攻 ----
    def attack_target(self, u):
        if u.has('挑衅') and u.taunt_by and u.taunt_by.alive(): return u.taunt_by
        if u.has('迷惑'):
            A = [x for x in self.allies(u) if x is not u]
            return random.choice(A) if A else None
        if u.has('混乱'):
            pool = [x for x in self.allies(u) + self.enemies(u) if x is not u]
            return random.choice(pool) if pool else None
        r = self.hook_all('choose_target', u)
        if r: return r
        E = [x for x in self.targetable(u) if x.name not in u.flags.get('noattack', ())] or self.targetable(u)
        if not E: return None
        F = [x for x in E if x.front()]
        return random.choice(F) if F and random.random() < 0.7 else random.choice(E)
    def normal_attack(self, u):
        if u.has('缴械'): return
        if u.flags.get('桥窄'):
            k = ('桥', self.round)
            if self.flags_round.get(k): return
            self.flags_round[k] = True
        t = self.attack_target(u)
        if not t: return
        kind = 'mag' if u.stat('int') > u.stat('atk') else 'phys'
        if u.flags.get('atk_kind'): kind = u.flags['atk_kind']
        mult = 1.0 + u.flag('atkmult')
        self.damage(u, t, mult, kind, must_hit=u.flags.get('must_hit', False), ignore=u.flags.get('ignore', 0), tag='attack')
        self.hook_all('after_attack', u, t)
        if u.flags.get('double_attack') and t.alive(): self.damage(u, t, mult, kind, tag='attack')
        if u.flags.get('double_attack') and t.alive(): pass
        # 追击
        sk = u.skill
        if sk and sk['type'] == '追击' and not u.has('怯战') and not u.has('缴械') and t.alive() or (sk and sk['type'] == '追击' and sk.get('other') and not u.has('怯战')):
            rate = sk['rate'] + u.flag('pursue')
            if random.random() < rate: sk['fn'](self, u, t)
    # ---- 一人行动 ----
    def act(self, u):
        if not u.alive(): return
        if u.has('震慑'): return
        sk = u.skill
        if u.prep:
            f = u.prep; u.prep = None; self.say(f'{u.name} 结算 {sk.get("name","技")}'); f(self, u); return
        if sk and sk['type'] in ('主动·瞬发', '主动·准备') and not u.has('计穷') and not u.flags.get('no_active'):
            rate = sk['rate'] + u.flag('rate')
            if sk.get('first_round') and self.round == 1: rate = 1.0
            if sk.get('gate') and not sk['gate'](self, u): rate = 0
            if random.random() < rate:
                if sk['type'] == '主动·准备' and not u.flags.get('no_prep'):
                    u.prep = sk['fn']; self.say(f'{u.name} 准备 {sk.get("name","技")}'); self.hook_all('on_prepare', u); return
                self.say(f'{u.name} 发动 {sk.get("name","技")}'); sk['fn'](self, u); return
        self.normal_attack(u)
    def run(self, max_rounds=30):
        if BOND_ON:
            for side, t in enumerate(self.teams):
                if not getattr(self, 'nobond', (False, False))[side]: apply_bonds(t)
        for u in self.teams[0] + self.teams[1]:
            for sk in ([u.skill] if u.skill else []) + list(u.extras):
                if sk.get('setup'): sk['setup'](self, u)
        for u in self.teams[0] + self.teams[1]:
            for sk in ([u.skill] if u.skill else []) + list(u.extras):
                if sk['type'] in ('指挥', '兵种', '被动') and sk.get('fn') and sk is not u.skill: sk['fn'](self, u)
            if u.skill and u.skill['type'] in ('指挥', '兵种') and u.skill.get('fn'): u.skill['fn'](self, u)
        for r in range(1, max_rounds + 1):
            self.round = r
            self.hook_all('round_start', None)
            order = sorted([u for u in self.teams[0] + self.teams[1] if u.alive()], key=lambda u: -(u.stat('agi') + random.random() * 5))
            self.order = order
            for u in order:
                if not u.alive(): continue
                try: self.act(u)
                except IndexError: pass
                if not any(x.alive() for x in self.teams[0]) or not any(x.alive() for x in self.teams[1]): break
            # 回合末
            for u in self.teams[0] + self.teams[1]:
                if not u.alive(): continue
                for s in ('灼烧', '中毒'):
                    if u.has(s):
                        srcu, per = u.flags.get(s + '_src', (None, 0.03))
                        k = (0.5 + 0.5 * srcu.ratio()) if (srcu is not None and srcu.alive()) else 0.5
                        if s == '灼烧':
                            self.apply(None, u, u.maxhp * per * k * (1 + u.flag('burnin')), 'mag', s)
                        else:
                            self.apply(None, u, u.maxhp * per * k, 'mag', s, true=True)
                self.hook_all('round_end_unit', u)
                for k in list(u.status):
                    u.status[k] -= 1
                    if u.status[k] <= 0: del u.status[k]
                u.buffs = [b for b in u.buffs if b[2] == -1 or b[2] > 1]
                for b in u.buffs:
                    if b[2] > 0: b[2] -= 1
                if u.hidden > 0: u.hidden -= 1
            self.hook_all('round_end', None)
            a = any(x.alive() for x in self.teams[0]); b = any(x.alive() for x in self.teams[1])
            if not b: return 0, r
            if not a: return 1, r
        return -1, max_rounds
