# -*- coding: utf-8 -*-
"""技能小语法（一行一招）。技能表 data/skills_dsl.tsv 的「DSL」列是引擎唯一数据源。

  行 := 类型 [发动率][f] | 效果 ; 效果 ...
  类型 := 指挥 | 兵种 | 被动 | 瞬发 | 准备 | 追击        发动率整数百分比，f = 首回合必发
  效果 := [触发:] 操作(参数...) [@条件,条件...]

触发（被动/指挥/兵种用；主动技和追击的效果不带触发，发动时按顺序执行）
  hit 我受到攻击后(src)   maghit 我受到谋略伤害后   death 我退场时   allydeath 队友退场(dead,src)
  enemydeath 敌方退场     kill 我击杀后(tgt)         atk 我普攻后(tgt)   rend 回合末   rstart 回合开始
  eprep 敌方开始准备(who)  lethal 我将死              sbreak 我方护盾被打破(who)   dodge 我闪避后

操作
  dmg(T,倍率[,mag][,ig50][,hit])   伤害；mag=谋略，ig50=无视五成统率，hit=必中
  st(T,状态,回合[,概率])            状态：震慑 混乱 缴械 计穷 怯战 挑衅 迷惑 隐身 揭示 诅咒
  dot(T,灼烧|中毒,回合,每回合%)
  buff(T,键,%[,回合])               键：atk def int agi | dodge crit rate pursue dmgin dmgout magin physin pursuein ctrlhit maxhp burnin ctrllen atkmult
                                    回合缺省 0 = 常驻
  heal(T,%)  shield(T,%)  dispel(T)  cleanse(T)
  sub(T,概率,受伤倍率)               替受：T 受到单体攻击时我 P% 顶上
  counter(概率,倍率)                 受到攻击后反击
  interrupt(概率[,倍率])             敌方开始准备时打断
  revive(%)                          免死一次回到 % 兵力
  flag(键[,值])                      double_attack no_active no_prep must_hit ignore=.2 noattack:名 atk_kind
  custom(名)                         手写函数，见 skills_custom.py

目标 T
  e1 e2 e3 eall ehpmax ehpmin eatkmax eintmax eintmin edefmin eagimax eagimin eback2 efront3 e:名 eside:魏 erole:辅助 other(≠刚打的)
  self a1 a2 aall ahpmin afront3 aagimax a:名 aside:蜀 arole:文臣 atier:名+   src(打我的人) tgt(我刚打的人) dead who
条件 @
  r<=N r>=N r==N hp<P hp>P in:名(队友在场) en:名(敌方在场) nlt nge(我方人数少/多于敌方) fac>=3 front back fastest first once every3 nohit(本回合未受伤)
"""
import re, random

def _num(x):
    try: return float(x)
    except: return x

def parse_line(line):
    head, _, body = line.partition('|')
    head = head.strip(); body = body.strip()
    m = re.match(r'(指挥|兵种|被动|瞬发|准备|追击)\s*(\d+)?(f)?', head)
    typ, rate, first = m.group(1), (int(m.group(2)) / 100 if m.group(2) else None), bool(m.group(3))
    effs = []
    for e in [x.strip() for x in body.split(';') if x.strip()]:
        trig = None
        mm = re.match(r'(\w+):(.*)', e)
        if mm and mm.group(1) in ('hit', 'maghit', 'death', 'allydeath', 'enemydeath', 'kill', 'atk', 'rend', 'rstart', 'eprep', 'lethal', 'sbreak', 'dodge', 'setup', 'myprep', 'dealt'):
            trig, e = mm.group(1), mm.group(2).strip()
        e, _, conds = e.partition('@')
        conds = [c.strip() for c in conds.split(',') if c.strip()]
        mm = re.match(r'(\w+)\((.*)\)', e.strip())
        op, args = mm.group(1), [a.strip() for a in mm.group(2).split(',') if a.strip()]
        effs.append(dict(trig=trig, op=op, args=args, conds=conds))
    return dict(type=typ, rate=rate, first=first, effs=effs)

# ---------- 目标 ----------
def targets(b, u, T, ctx):
    E = b.targetable(u); A = b.allies(u)
    if T == 'self': return [u]
    if T == 'last': return [x for x in ctx.get('last', []) if x.alive()]
    if T in ctx and ctx[T] is not None: return [ctx[T]] if not isinstance(ctx[T], list) else ctx[T]
    if T == 'other': return [random.choice([e for e in E if e is not ctx.get('tgt')] or E)] if E else []
    if T.startswith('e'):
        if not E: return []
        if T == 'e1': return random.sample(E, 1)
        if T in ('e2', 'e3', 'e4', 'e5'): return random.sample(E, min(int(T[1]), len(E)))
        if T == 'eatk2': return sorted(E, key=lambda x: -x.stat('atk'))[:2]
        if T == 'eall': return list(E)
        if T == 'ehpmax': return [max(E, key=lambda x: x.hp)]
        if T == 'ehpmin': return [min(E, key=lambda x: x.hp)]
        if T == 'eatkmax': return [max(E, key=lambda x: x.stat('atk'))]
        if T == 'edefmax': return [max(E, key=lambda x: x.stat('def'))]
        if T == 'eintmax': return [max(E, key=lambda x: x.stat('int'))]
        if T == 'eintmin': return [min(E, key=lambda x: x.stat('int'))]
        if T == 'edefmin': return [min(E, key=lambda x: x.stat('def'))]
        if T == 'eagimax': return [max(E, key=lambda x: x.stat('agi'))]
        if T == 'eagimin': return [min(E, key=lambda x: x.stat('agi'))]
        if T == 'eback2': return sorted(E, key=lambda x: x.stat('agi'))[:2]
        if T == 'efront3': return [x for x in E if x.front()][:3] or E[:3]
        if T.startswith('e:'): return [x for x in b.enemies(u) if x.name == T[2:]]
        if T.startswith('eside:'): return [x for x in E if x.faction == T[6:]]
        if T.startswith('erole:'): return [x for x in E if x.role == T[6:]][:1] or random.sample(E, 1)
        if T == 'eratemax': L = [x for x in E if x.skill and x.skill.get('rate')]; return [max(L, key=lambda x: x.skill['rate'])] if L else []
    if T.startswith('a'):
        if not A: return []
        if T == 'a1': return random.sample(A, 1)
        if T == 'a2': return random.sample(A, min(2, len(A)))
        if T == 'aall': return list(A)
        if T == 'ahpmin': return [min(A, key=lambda x: x.ratio())]
        if T == 'ahpmin2': return sorted(A, key=lambda x: x.ratio())[1:2]
        if T == 'ahpmax': return [max(A, key=lambda x: x.hp)]
        if T == 'afront3': return [x for x in A if x.front()]
        if T == 'aagimax': return [max(A, key=lambda x: x.stat('agi'))]
        if T.startswith('a:'): return [x for x in A if x.name == T[2:]]
        if T.startswith('aside:'): return [x for x in A if x.faction == T[6:]]
        if T.startswith('arole:'): return [x for x in A if x.role == T[6:]]
        if T.startswith('awen:'): return [x for x in A if x.faction == T[5:] and x.role == '文臣']
        if T.startswith('atier:'):
            order = ['卒', '校', '骁', '名', '虎', '无双']; k = order.index(T[6:].rstrip('+'))
            return [x for x in A if order.index(x.tier) >= k]
    return []

# ---------- 条件 ----------
def cond_ok(b, u, conds, ctx):
    for c in conds:
        if c == 'first' and b.round != 1: return False
        elif c == 'once':
            key = ('once', ctx.get('_eid'))
            if key in u.once: return False
            u.once.add(key)
        elif c == 'every3' and b.round % 3: return False
        elif c == 'every2' and b.round % 2: return False
        elif c == 'notfirst' and b.round == 1: return False
        elif c == 'hidden' and u.hidden <= 0: return False
        elif c == 'front' and not u.front(): return False
        elif c == 'back' and u.front(): return False
        elif c == 'nlt' and not len(b.allies(u)) < len(b.enemies(u)): return False
        elif c == 'nge' and not len(b.allies(u)) > len(b.enemies(u)): return False
        elif c == 'nlt4' and not len(b.allies(u)) < 4: return False
        elif c == 'fastest' and max([x for x in b.teams[0] + b.teams[1] if x.alive()], key=lambda x: x.stat('agi')) is not u: return False
        elif c == 'nohit' and u.flags.get(('挨', b.round), 0) > 0: return False
        elif c == 'wasfirst' and (not getattr(b, 'order', None) or b.order[0] is not u): return False
        elif c == 'notwasfirst' and (getattr(b, 'order', None) and b.order[0] is u): return False
        elif c == 'faclt3' and sum(1 for a in b.allies(u) if a.faction == u.faction) >= 3: return False
        elif c == 'every3r1' and b.round % 3 != 1: return False
        elif c == 'shielded' and u.shield <= 0: return False
        elif c == 'fasterthan' and not (ctx.get('tgt') and u.stat('agi') > ctx['tgt'].stat('agi')): return False
        elif c == 'notfasterthan' and (ctx.get('tgt') and u.stat('agi') > ctx['tgt'].stat('agi')): return False
        elif c.startswith('tgthp>') and not (ctx.get('tgt') and ctx['tgt'].ratio() > int(c[6:]) / 100): return False
        elif c.startswith('allyfac:') and not any(a.faction == c[8:] for a in b.allies(u)): return False
        elif c.startswith('lastis:') and not any(t.name == c[7:] for t in ctx.get('last', [])): return False
        elif c.startswith('tgtin:') and not any(t.name in c[6:].split(',') for t in ctx.get('last', [])): return False
        elif c == 'lastintlt' and not (ctx.get('last') and ctx['last'][0].stat('int') < u.stat('int')): return False
        elif c.startswith('inany:') and not any(a.name in c[6:].split(',') for a in b.allies(u)): return False
        elif c.startswith('notinany:') and any(a.name in c[9:].split(',') for a in b.allies(u)): return False
        elif c.startswith('vs:') or c.startswith('vsin:'): pass   # 在 buff 里特殊处理
        elif c.startswith('in:') and not any(a.name == c[3:] for a in b.allies(u)): return False
        elif c.startswith('notin:') and any(a.name == c[6:] for a in b.allies(u)): return False
        elif c.startswith('en:') and not any(e.name == c[3:] for e in b.enemies(u)): return False
        elif c.startswith('fac>='):
            if sum(1 for a in b.allies(u) if a.faction == u.faction) < int(c[5:]): return False
        elif c.startswith('r'):
            m = re.match(r'r(<=|>=|==|<|>)(\d+)', c); n = int(m.group(2)); op = m.group(1)
            if not {'<=': b.round <= n, '>=': b.round >= n, '==': b.round == n, '<': b.round < n, '>': b.round > n}[op]: return False
        elif c.startswith('hp'):
            m = re.match(r'hp(<|>)(\d+)', c); p = int(m.group(2)) / 100
            if not (u.ratio() < p if m.group(1) == '<' else u.ratio() > p): return False
        elif c.startswith('tgt:'):   # 刚打的目标是某人
            t = ctx.get('tgt')
            if not t or t.name != c[4:]: return False
        elif c.startswith('src:'):
            t = ctx.get('src')
            if not t or (t.name != c[4:] and t.faction != c[4:] and t.tier != c[4:]): return False
        elif c.startswith('srckind:'):
            if ctx.get('kind') != c[8:]: return False
        elif c.startswith('srctag:'):
            if ctx.get('tag') != c[7:]: return False
    return True

# ---------- 执行 ----------
def run_effect(b, u, eff, ctx):
    from skills_custom import CUSTOM
    op, a = eff['op'], eff['args']
    if not cond_ok(b, u, eff['conds'], ctx): return
    if op in ('dmg', 'st', 'dot', 'buff', 'heal', 'shield', 'dispel', 'cleanse') and a and a[0] != 'last':
        ctx['last'] = targets(b, u, a[0], ctx)
    if op == 'dmg':
        T = targets(b, u, a[0], ctx); mult = float(a[1]); kind = 'mag' if 'mag' in a[2:] else 'phys'
        ig = .5 if 'ig50' in a else (.2 if 'ig20' in a else 0); hit = 'hit' in a
        for t in T:
            if t.alive(): b.damage(u, t, mult, kind, ignore=ig, must_hit=hit, tag=ctx.get('_tag', 'skill'))
    elif op == 'st':
        T = ctx['last'] if a[0] != 'last' else targets(b, u, 'last', ctx); s, r = a[1], int(a[2]); p = float(a[3]) / 100 if len(a) > 3 else 1.0
        for t in T:
            if t.alive() and t.add_status(s, r, p, u) and s == '挑衅': t.taunt_by = u
    elif op == 'dot':
        T = ctx['last'] if a[0] != 'last' else targets(b, u, 'last', ctx); s, r, per = a[1], int(a[2]), float(a[3]) / 100
        for t in T:
            if t.alive(): t.add_status(s, r); t.flags[s + '_src'] = (u, per * (1 + u.flag('dotout')))
    elif op == 'buff':
        T = ctx['last'] if a[0] != 'last' else targets(b, u, 'last', ctx); k, pct = a[1], float(a[2]) / 100; r = int(a[3]) if len(a) > 3 else -1
        vs = [c for c in eff['conds'] if c.startswith('vs:') or c.startswith('vsin:')]
        if vs:
            for t in T: t.flags.setdefault('vs', []).append((vs[0].split(':')[0], vs[0].split(':')[1], pct))
            return
        for t in T:
            if k == 'maxhp': t.maxhp *= (1 + pct); t.hp *= (1 + pct)
            else: t.addbuff(k, pct, r, 'perm' + str(ctx.get('_eid')) if r == -1 else None)
    elif op == 'heal':
        for t in targets(b, u, a[0], ctx): b.heal(u, t, float(a[1]) / 100)
    elif op == 'shield':
        for t in targets(b, u, a[0], ctx):
            if float(a[1]) == 0: t.shield = 0
            else: b.shield(t, float(a[1]) / 100, u)
    elif op == 'dmgself':
        u.hp -= u.maxhp * float(a[0]) / 100
    elif op == 'reflect':
        src = ctx.get('src')
        if src and src.alive() and u.shield > 0 and ctx.get('dmg'): b.apply(u, src, ctx['dmg'] * float(a[0]) / 100, 'phys', '反弹')
    elif op == 'dmgby':
        A = targets(b, u, a[0], ctx); T = targets(b, u, a[1], ctx)
        for x in A:
            for t in T: b.damage(x, t, float(a[2]), tag='pursue')
    elif op == 'dispel':
        for t in targets(b, u, a[0], ctx): t.dispel()
    elif op == 'cleanse':
        for t in targets(b, u, a[0], ctx): t.cleanse()
    elif op == 'revive':
        u.hp = u.maxhp * float(a[0]) / 100; ctx['_revived'] = True
    elif op == 'flag':
        k = a[0]; v = _num(a[1]) if len(a) > 1 else True
        if k.startswith('noattack:'): u.flags.setdefault('noattack', set()).add(k[9:])
        else: u.flags[k] = v
    elif op == 'counter':
        src = ctx.get('src')
        if src and src.alive() and ctx.get('tag') in ('attack', 'skill', 'pursue') and random.random() < float(a[0]) / 100:
            b.damage(u, src, float(a[1]), tag='反击')
    elif op == 'interrupt':
        who = ctx.get('who')
        if who and who.side != u.side and who.prep and random.random() < float(a[0]) / 100:
            if len(a) > 1: b.damage(u, who, float(a[1]))
            who.prep = None; b.say(f'{u.name} 打断 {who.name}')
    elif op == 'custom':
        CUSTOM[a[0]](b, u, ctx)

def build(spec, name):
    """把解析后的 spec 变成引擎的 skill dict。"""
    typ = spec['type']; effs = spec['effs']
    for i, e in enumerate(effs): e['id'] = f'{name}#{i}'
    sk = {'name': name, 'type': {'瞬发': '主动·瞬发', '准备': '主动·准备'}.get(typ, typ), 'rate': spec['rate'] or 0, 'first_round': spec['first'], 'hooks': {}}
    inline = [e for e in effs if e['trig'] is None]
    setups = [e for e in effs if e['trig'] == 'setup']
    hooked = [e for e in effs if e['trig'] and e['trig'] != 'setup']
    if setups: sk['setup'] = lambda b, u: run_list(b, u, setups, {})
    def run_list(b, u, L, ctx):
        for e in L:
            ctx['_eid'] = e['id']; run_effect(b, u, e, ctx)
    if typ in ('瞬发', '准备'):
        sk['fn'] = lambda b, u: run_list(b, u, inline, {'_tag': 'skill'})
    elif typ == '追击':
        sk['fn'] = lambda b, u, t: run_list(b, u, inline, {'tgt': t, '_tag': 'pursue'})
        sk['other'] = any(e['op'] == 'dmg' and e['args'][0] != 'tgt' for e in inline)
    else:
        sk['fn'] = lambda b, u: run_list(b, u, inline, {'_tag': 'skill'})   # 开场执行
    EV = {'myprep': 'on_prepare', 'dealt': 'after_hit', 'hit': 'on_hit_taken', 'maghit': 'on_hit_taken', 'death': 'on_death', 'allydeath': 'on_ally_death', 'enemydeath': 'on_enemy_death', 'kill': 'on_kill', 'atk': 'after_attack', 'rend': 'round_end_unit', 'rstart': 'round_start', 'eprep': 'on_prepare', 'lethal': 'on_lethal', 'sbreak': 'shield_broken', 'dodge': 'on_dodge'}
    subs = [e for e in inline if e['op'] == 'sub']
    inline = [e for e in inline if e['op'] != 'sub']
    if subs:
        def substitute(u, tgt, src, kind, tag):
            b = u.battle
            if tgt is u or tag not in ('attack', 'skill', 'pursue'): return None
            for e in subs:
                ctx = {'_eid': e['id']}
                ctx.update(src=src, kind=kind, tag=tag)
                if not cond_ok(b, u, e['conds'], ctx): continue
                if tgt in targets(b, u, e['args'][0], ctx) and random.random() < float(e['args'][1]) / 100:
                    u.flags['sub_mul'] = float(e['args'][2]); return u
            return None
        sk['hooks']['substitute'] = substitute
    by = {}
    for e in hooked: by.setdefault(e['trig'], []).append(e)
    for trig, L in by.items():
        ev = EV[trig]
        def mk(trig, L):
            def h(u, *args):
                b = u.battle; ctx = {}
                if trig in ('hit', 'maghit'):
                    src, dmg, kind, tag = args; ctx.update(src=src, kind=kind, tag=tag)
                    if trig == 'maghit' and kind != 'mag': return
                elif trig == 'death': ctx['src'] = args[0]
                elif trig in ('allydeath', 'enemydeath'): ctx['dead'], ctx['src'] = args
                elif trig == 'kill': ctx['tgt'] = args[0]
                elif trig == 'atk': ctx['tgt'] = args[0]
                elif trig == 'eprep': ctx['who'] = args[0]
                elif trig == 'myprep':
                    if args[0] is not u: return
                elif trig == 'dealt': ctx['tgt'], ctx['dmg'], ctx['kind'], ctx['tag'] = args
                elif trig == 'lethal': ctx['src'] = args[0]
                elif trig == 'sbreak': ctx['who'] = args[0]
                run_list(b, u, L, ctx)
                if trig == 'lethal' and ctx.get('_revived'): return True
            return h
        sk['hooks'][ev] = mk(trig, L)
    return sk
