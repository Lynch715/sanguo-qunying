# -*- coding: utf-8 -*-
"""名／骁／校 266 条：从 skills.tsv 的中文描述里按模式解析。解析不了的记到 UNPARSED，近似的记到 APPROX。"""
import re, random, csv
from skills_top import active, prep, passive, command, troop, pursue, buff_all, inplay, enemy_has, burn, poison, b_heal_min, SK

UNPARSED, APPROX = [], []
STAT = {'武力': 'atk', '统率': 'def', '智力': 'int', '速度': 'agi'}
CTRLS = ('震慑', '混乱', '缴械', '计穷', '怯战', '挑衅', '迷惑')

def cond_fn(text):
    """把条件短语翻成 (b,u)->bool。认不出返回 None。"""
    m = re.search(r'([一-龥（）]+?)在场时', text)
    if m:
        who = m.group(1).replace('、', ',').split(',')
        names = [w for w in who if w in SK or len(w) <= 3]
        return lambda b, u: all(inplay(b, u, w) for w in names)
    m = re.search(r'兵力(低于|高于) ?(\d+)% ?时', text)
    if m:
        lo, p = m.group(1) == '低于', int(m.group(2)) / 100
        return (lambda b, u: u.ratio() < p) if lo else (lambda b, u: u.ratio() > p)
    if '我方在场人数少于敌方' in text: return lambda b, u: len(b.allies(u)) < len(b.enemies(u))
    if '我方在场人数多于敌方' in text: return lambda b, u: len(b.allies(u)) > len(b.enemies(u))
    if '我方在场人数少于四人' in text: return lambda b, u: len(b.allies(u)) < 4
    m = re.search(r'我方(汉|魏|蜀|吴|无)阵营在场三人以上', text)
    if m: f = m.group(1); return lambda b, u: sum(1 for a in b.allies(u) if a.faction == f) >= 3
    if '首回合' in text: return lambda b, u: b.round == 1
    return None

def scope(text):
    """自增益作用域：返回 filt(a) 与 描述是否全队。"""
    if '我方前排三人' in text: return (lambda a: a.front()), True
    m = re.search(r'我方(汉|魏|蜀|吴|无)阵营(文臣|将领)?', text)
    if m:
        f = m.group(1); r = m.group(2)
        return (lambda a: a.faction == f and (r != '文臣' or a.role == '文臣')), True
    if '我方文臣、辅助' in text: return (lambda a: a.role in ('文臣', '辅助')), True
    if '我方文臣' in text: return (lambda a: a.role == '文臣'), True
    if '我方武将' in text: return (lambda a: a.role == '武将'), True
    if '我方全体' in text: return (lambda a: True), True
    return None, False

def parse(row):
    name, typ, rate_s, eff = row['名'], row['类型'], row['发动'], row['效果']
    m = re.search(r'(\d+)%', rate_s); rate = int(m.group(1)) / 100 if m else 0.4
    first = rate_s.startswith('首回合必发')
    sents = [s for s in re.split(r'[。；]', eff) if s.strip()]
    hooks = {}; setups = []; cmds = []; approx = False

    # ---- 通用属性句 ----
    def stat_clause(s, rounds=-1):
        nonlocal approx
        cond = cond_fn(s)
        filt, team = scope(s)
        ms = re.findall(r'(武力|统率|智力|速度)(?:、(武力|统率|智力|速度))?(?:各)? ?([+−-]) ?(\d+)%', s)
        if not ms: return False
        for a1, a2, sign, v in ms:
            pct = int(v) / 100 * (1 if sign == '+' else -1)
            for st in (a1, a2):
                if not st: continue
                k = STAT[st]
                if '敌方' in s:
                    def f(b, u, k=k, pct=pct, s=s):
                        E = b.enemies(u)
                        if '智力最高者' in s: E = b.pick(u, 'stat_max', stat='int')
                        elif '武力最高者' in s: E = b.pick(u, 'stat_max', stat='atk')
                        elif '随机一人' in s: E = b.pick(u, 'random')
                        m2 = re.search(r'敌方(汉|魏|蜀|吴)阵营', s)
                        if m2: E = [e for e in E if e.faction == m2.group(1)]
                        for e in E: e.addbuff(k, pct, rounds if rounds > 0 else (1 if '首回合' in s else -1), 'perm' + s[:6])
                    cmds.append(f)
                elif team:
                    if cond:
                        hooks.setdefault('round_start', []).append(lambda u, *_, k=k, pct=pct, filt=filt, cond=cond, s=s: buff_all(u.battle, u, k, pct if cond(u.battle, u) else 0, tag='perm' + s[:8], filt=filt))
                    else:
                        cmds.append(lambda b, u, k=k, pct=pct, filt=filt, s=s: buff_all(b, u, k, pct, tag='perm' + s[:8], filt=filt))
                else:
                    if cond:
                        hooks.setdefault('round_start', []).append(lambda u, *_, k=k, pct=pct, cond=cond, s=s: u.addbuff(k, pct if cond(u.battle, u) else 0, tag='perm' + s[:8]))
                    else:
                        setups.append(lambda b, u, k=k, pct=pct, s=s: u.addbuff(k, pct, tag='perm' + s[:8]))
        return True

    def misc_clause(s):
        nonlocal approx
        hit = False
        m = re.search(r'对(无阵营敌人|无双品阶敌人|吴阵营|魏阵营|张飞|张宝|吕布|马超|甘宁)(?:伤害)? ?\+(\d+)%', s)
        if m:
            who, v = m.group(1), int(m.group(2)) / 100
            def f(u, tgt, kind, tag, who=who, v=v):
                if who == '无阵营敌人' and tgt.faction == '无': return 1 + v
                if who == '无双品阶敌人' and tgt.tier == '无双': return 1 + v
                if who.endswith('阵营') and tgt.faction == who[0]: return 1 + v
                if tgt.name == who: return 1 + v
            hooks.setdefault('mod_out', []).append(f); hit = True
        m = re.search(r'受到(?:的)?(谋略|兵刃|吴阵营|魏阵营|无阵营敌人|追击)?(?:的)?伤害 ?[−-](\d+)%', s)
        if m and '敌方' not in s and '我方' not in s:
            kind, v = m.group(1), int(m.group(2)) / 100
            def f(u, src, k, tag, kind=kind, v=v):
                if kind == '谋略' and k == 'mag': return 1 - v
                if kind == '兵刃' and k == 'phys': return 1 - v
                if kind == '追击' and tag == 'pursue': return 1 - v
                if kind in ('吴阵营', '魏阵营') and src and src.faction == kind[0]: return 1 - v
                if kind == '无阵营敌人' and src and src.faction == '无': return 1 - v
                if kind is None: return 1 - v
            hooks.setdefault('mod_in', []).append(f); hit = True
        m = re.search(r'受到(?:的)?伤害 ?\+(\d+)%', s)
        if m and '敌方' not in s:
            v = int(m.group(1)) / 100; setups.append(lambda b, u, v=v: u.flags.__setitem__('dmg_in', u.flags.get('dmg_in', 0) + v)); hit = True
        m = re.search(r'闪避 ?\+(\d+)%', s)
        if m:
            v = int(m.group(1)) / 100; cond = cond_fn(s)
            if '我方全体' in s and '首回合' in s:
                cmds.append(lambda b, u, v=v: [a.flags.__setitem__('dodge', a.flags.get('dodge', 0) + v) for a in b.allies(u)])
                hooks.setdefault('round_end', []).append(lambda u, *_, v=v: [a.flags.__setitem__('dodge', max(0, a.flags.get('dodge', 0) - v)) for a in u.battle.allies(u)] if u.battle.round == 1 else None)
            elif '我方全体' in s: cmds.append(lambda b, u, v=v: [a.flags.__setitem__('dodge', a.flags.get('dodge', 0) + v) for a in b.allies(u)])
            elif cond: hooks.setdefault('round_start', []).append(lambda u, *_, v=v, cond=cond: u.flags.__setitem__('dodge', v if cond(u.battle, u) else 0))
            else: setups.append(lambda b, u, v=v: u.flags.__setitem__('dodge', v))
            hit = True
        m = re.search(r'每回合末(?:我方)?(兵力最低者|全体|随机一人)?回兵 ?(\d+)%', s) or re.search(r'每三回合末(?:我方)?(兵力最低者|全体|随机一人)?回兵 ?(\d+)%', s)
        if m:
            who, v = m.group(1), int(m.group(2)) / 100; every3 = '每三回合' in s
            def f(u, *_, who=who, v=v, every3=every3):
                b = u.battle
                if every3 and b.round % 3: return
                if who == '兵力最低者': b_heal_min(u, v)
                elif who == '全体': [b.heal(u, a, v) for a in b.allies(u)]
                elif who == '随机一人': b.heal(u, random.choice(b.allies(u)), v)
                else: b.heal(u, u, v)
            hooks.setdefault('round_end', []).append(f); hit = True
        m = re.search(r'(?:我方|敌方)?(全体|随机一人|汉阵营将领|魏阵营将领|蜀阵营将领|吴阵营将领|魏阵营|文臣|主动发动率最高的一人|智力最高者)?(?:首回合)?主动发动率 ?([+−-])(\d+)%', s)
        if m:
            who, sign, v = m.group(1), m.group(2), int(m.group(3)) / 100 * (1 if m.group(2) == '+' else -1)
            enemy = '敌方' in s; first_only = '首回合' in s
            def f(b, u, who=who, v=v, enemy=enemy, first_only=first_only):
                T = b.enemies(u) if enemy else b.allies(u)
                if who and '阵营' in who: T = [x for x in T if x.faction == who[0]]
                if who == '文臣': T = [x for x in T if x.role == '文臣']
                if who == '随机一人': T = random.sample(T, 1)
                for x in T: x.flags['rate_bonus'] = x.flags.get('rate_bonus', 0) + v; x.flags['rate_tmp'] = (v if first_only else 0)
            cmds.append(f); hit = True
            if first_only: hooks.setdefault('round_end', []).append(lambda u, *_: [x.flags.__setitem__('rate_bonus', x.flags.get('rate_bonus', 0) - x.flags.pop('rate_tmp', 0)) for x in u.battle.teams[0] + u.battle.teams[1]] if u.battle.round == 1 else None)
        m = re.search(r'兵力上限 ?\+(\d+)%', s)
        if m:
            v = int(m.group(1)) / 100; filt, team = scope(s)
            cmds.append(lambda b, u, v=v, filt=filt: [(setattr(a, 'maxhp', a.maxhp * (1 + v)), setattr(a, 'hp', a.hp * (1 + v))) for a in b.allies(u) if filt is None or filt(a)]); hit = True
        if '退场时' in s:
            m2 = re.search(r'我方全体(武力|统率) ?\+(\d+)%', s)
            m3 = re.search(r'我方(兵力最低者|随机一人)回兵 ?(\d+)%', s)
            if m2:
                k, v = STAT[m2.group(1)], int(m2.group(2)) / 100
                hooks.setdefault('on_death', []).append(lambda u, src, k=k, v=v: buff_all(u.battle, u, k, v, tag='perm遗')); hit = True
            elif m3:
                who, v = m3.group(1), int(m3.group(2)) / 100
                hooks.setdefault('on_death', []).append(lambda u, src, who=who, v=v: b_heal_min(u, v) if who == '兵力最低者' else u.battle.heal(u, random.choice(u.battle.allies(u) or [u]), v)); hit = True
            elif re.search(r'造成 ?(\d\.\d) 倍', s):
                v = float(re.search(r'造成 ?(\d\.\d) 倍', s).group(1))
                hooks.setdefault('on_death', []).append(lambda u, src, v=v: u.battle.damage(u, src if (src and src.alive() and '攻击者' in s) else random.choice(u.battle.enemies(u) or [src]), v) if u.battle.enemies(u) else None); hit = True
        if '替受' in s or '替死' in s:
            m2 = re.search(r'(曹操|孙权|关羽)', s); who = m2.group(1) if m2 else None
            p = re.search(r'(\d+)% 替受', s); p = int(p.group(1)) / 100 if p else 1.0
            red = re.search(r'伤害 ?[−-](\d+)%', s); red = 1 - int(red.group(1)) / 100 if red else 1.0
            if '替死' in s:
                def f(u, tgt, src, who=who):
                    if tgt.name == who and 'sub' not in u.once: u.once.add('sub'); u.hp = 0; u.battle.say(f'{u.name} 替死'); tgt.hp = tgt.maxhp * .01; return True
                # on_lethal is called on tgt, not u — register as global via battle hook_all order: we attach to u with a check on tgt
                hooks.setdefault('on_lethal_any', []).append(f)
            else:
                def f(u, tgt, src, kind, tag, who=who, p=p, red=red):
                    if tgt.name == who and tag in ('attack', 'skill', 'pursue') and random.random() < p: u.flags['sub_mul'] = red; return u
                hooks.setdefault('substitute', []).append(f)
            hit = True
        m = re.search(r'受到伤害后 ?(\d+)% 反击 ?(\d\.\d) 倍', s)
        if m:
            p, v = int(m.group(1)) / 100, float(m.group(2))
            hooks.setdefault('on_hit_taken', []).append(lambda u, src, dmg, kind, tag, p=p, v=v: u.battle.damage(u, src, v, tag='反击') if src and src.alive() and tag in ('attack', 'skill', 'pursue') and random.random() < p else None); hit = True
        m = re.search(r'得 ?(\d+)% 兵力护盾', s)
        if m:
            v = int(m.group(1)) / 100
            if '每三回合重置' in s: hooks.setdefault('round_start', []).append(lambda u, *_, v=v: u.battle.shield(u, v) if u.battle.round % 3 == 1 else None)
            else: setups.append(lambda b, u, v=v: b.shield(u, v))
            hit = True
        m = re.search(r'普攻附带(?:对另一目标)? ?(\d\.\d) 倍', s)
        if m:
            v = float(m.group(1))
            hooks.setdefault('after_attack', []).append(lambda u, t, v=v: (lambda o: u.battle.damage(u, random.choice(o), v, tag='冲撞') if o else None)([e for e in u.battle.enemies(u) if e is not t])); hit = True
        m = re.search(r'受到的(控制|怯战、迷惑|迷惑|怯战|挑衅)持续 ?[−-]1 回合', s)
        if m:
            cmds.append(lambda b, u: [a.flags.__setitem__('ctrl_len_mod', -1) for a in (b.allies(u) if '我方' in s else [u])]); hit = True
        m = re.search(r'受到的(中毒、灼烧|灼烧)伤害 ?[−-](\d+)%', s)
        if m:
            v = int(m.group(2)) / 100; cmds.append(lambda b, u, v=v: [a.flags.__setitem__('burn_in', -v) for a in b.allies(u)]); hit = True
        if '每回合末自损' in s:
            v = int(re.search(r'自损 ?(\d+)%', s).group(1)) / 100
            hooks.setdefault('round_end_unit', []).append(lambda u, *_, v=v: setattr(u, 'hp', u.hp - u.maxhp * v)); hit = True
        if '普攻按武力、智力取高者结算' in s:
            hooks.setdefault('round_start', []).append(lambda u, *_: u.flags.__setitem__('atk_kind', 'phys' if u.stat('atk') >= u.stat('int') else 'mag')); hit = True
        if '战斗胜利金币' in s or '不普攻' in s or '不会被选为单体目标' in s: hit = True   # 经济类／站桩：战斗里忽略
        if '不会被选为单体目标' in s: setups.append(lambda b, u: setattr(u, 'hidden', 99))
        if '不普攻' in s: setups.append(lambda b, u: u.status.__setitem__('缴械', 99))
        return hit

    # ---- 主动技 ----
    def active_fn(eff):
        nonlocal approx
        steps = []
        for s in sents:
            # 伤害
            m = re.search(r'对(敌方)? ?(单体|随机一人|兵力最高者|兵力最低者|速度最高者|速度最低者|武力最高者|智力最高者|统率最低者|辅助|前排三人|(\d) 人|全体) ?(\d\.\d) 倍(兵刃|谋略)?', s)
            if m:
                sel, n, mult, kind = m.group(2), m.group(3), float(m.group(4)), 'mag' if m.group(5) == '谋略' else 'phys'
                def f(b, u, sel=sel, n=n, mult=mult, kind=kind, s=s):
                    if n: T = b.pick(u, 'random', int(n))
                    elif sel == '全体': T = b.pick(u, 'all')
                    elif sel in ('单体', '随机一人'): T = b.pick(u, 'random')
                    elif sel == '兵力最高者': T = b.pick(u, 'hp_max')
                    elif sel == '兵力最低者': T = b.pick(u, 'hp_min')
                    elif sel == '速度最高者': T = b.pick(u, 'stat_max', stat='agi')
                    elif sel == '速度最低者': T = b.pick(u, 'back', 1)
                    elif sel == '武力最高者': T = b.pick(u, 'stat_max', stat='atk')
                    elif sel == '智力最高者': T = b.pick(u, 'stat_max', stat='int')
                    elif sel == '统率最低者': T = b.pick(u, 'stat_min', stat='def')
                    elif sel == '辅助': T = [e for e in b.enemies(u) if e.role == '辅助'][:1] or b.pick(u, 'random')
                    elif sel == '前排三人': T = b.pick(u, 'front', 3)
                    else: T = b.pick(u, 'random')
                    extra = 0
                    for cn, cv in re.findall(r'目标是(\S+?)时(?:倍率)? ?\+(\d\.\d)', s):
                        pass
                    for t in T:
                        mm = mult
                        for cn, cv in re.findall(r'目标是([一-龥、]+?)时倍率 ?\+(\d\.\d)', s):
                            if t.name in cn.split('、'): mm += float(cv)
                        b.damage(u, t, mm, kind)
                        for st in CTRLS:
                            mm2 = re.search(r'(?:(\d+)% )?' + st + r' ?(\d) 回合', s)
                            if mm2 and t.alive():
                                p = int(mm2.group(1)) / 100 if mm2.group(1) else 1.0
                                if '目标是' in s and st in s.split('目标是')[1]:
                                    cn = re.search(r'目标是([一-龥、]+?)时', s)
                                    if cn and t.name not in cn.group(1).split('、'): continue
                                if t.add_status(st, int(mm2.group(2)), p, u) and st == '挑衅': t.taunt_by = u
                        if '灼烧' in s: burn(b, u, t, int(re.search(r'灼烧 ?(\d) 回合', s).group(1)) if re.search(r'灼烧 ?(\d) 回合', s) else 1)
                        if '驱散其护盾' in s or '驱散' in s and '护盾' in s: t.shield = 0
                    if '自身统率' in s:
                        mm3 = re.search(r'自身统率 ?[−-](\d+)% ?(?:两|(\d))?回合', s)
                        if mm3: u.addbuff('def', -int(mm3.group(1)) / 100, 2)
                steps.append(f); continue
            # 控制 / 驱散
            got = False
            for st in CTRLS:
                mm = re.search(r'(敌方)?(随机 ?(\d) 人|随机一人|智力最高者|智力最低者|兵力最低者|兵力最高者|武力最高者)?[^。]*?' + st + r' ?(\d) 回合', s)
                if mm and '我方' not in s.split(st)[0][-4:]:
                    who, n, r = mm.group(2), mm.group(3), int(mm.group(4))
                    def f(b, u, who=who, n=n, r=r, st=st, s=s):
                        if n: T = b.pick(u, 'random', int(n))
                        elif who == '智力最高者': T = b.pick(u, 'stat_max', stat='int')
                        elif who == '智力最低者': T = b.pick(u, 'stat_min', stat='int')
                        elif who == '兵力最低者': T = b.pick(u, 'hp_min')
                        elif who == '兵力最高者': T = b.pick(u, 'hp_max')
                        elif who == '武力最高者': T = b.pick(u, 'stat_max', stat='atk')
                        else: T = b.pick(u, 'random')
                        for t in T:
                            if t.add_status(st, r, 1.0, u) and st == '挑衅': t.taunt_by = u
                            mm2 = re.search(r'破甲 ?(\d+)%', s)
                            if mm2: t.addbuff('def', -int(mm2.group(1)) / 100, 2)
                    steps.append(f); got = True; break
            if got: continue
            if '驱散敌方' in s:
                n = re.search(r'驱散敌方随机 ?(\d) 人', s); n = int(n.group(1)) if n else 1
                def f(b, u, n=n, s=s):
                    for t in b.pick(u, 'random', n):
                        gained = [x for x in t.buffs if x[1] > 0]; t.dispel()
                        if '转给我方' in s and gained:
                            a = random.choice(b.allies(u)); [a.addbuff(x[0], x[1], 1) for x in gained]
                        if '计穷' in s: t.add_status('计穷', 1, 1.0, u)
                steps.append(f); continue
            m = re.search(r'我方(随机 ?(\d) 人|随机一人|兵力最低者)回兵 ?(\d+)%', s)
            if m:
                n, v = m.group(2), int(m.group(3)) / 100; who = m.group(1)
                def f(b, u, n=n, v=v, who=who, s=s):
                    T = b.ally_pick(u, 'random', int(n)) if n else (b.ally_pick(u, 'hp_min') if who == '兵力最低者' else b.ally_pick(u, 'random', 1))
                    for a in T:
                        b.heal(u, a, v)
                        if '解控' in s: a.cleanse()
                        mm = re.search(r'各得 ?(\d+)% 兵力护盾', s)
                        if mm: b.shield(a, int(mm.group(1)) / 100)
                    mm = re.search(r'敌方随机一人中毒 ?(\d) 回合，每回合 ?(\d+)%', s)
                    if mm: poison(b, u, b.pick(u, 'random')[0], int(mm.group(1)), int(mm.group(2)) / 100)
                steps.append(f); continue
            m = re.search(r'中毒 ?(\d) 回合，每回合 ?(\d+)%', s)
            if m:
                n = re.search(r'随机 ?(\d) 人', s); n = int(n.group(1)) if n else 1
                r, v = int(m.group(1)), int(m.group(2)) / 100
                steps.append(lambda b, u, n=n, r=r, v=v: [poison(b, u, t, r, v) for t in b.pick(u, 'random', n)]); continue
            m = re.search(r'我方全体武力 ?\+(\d+)% ?(?:两|(\d))回合', s)
            if m:
                v = int(m.group(1)) / 100; steps.append(lambda b, u, v=v: buff_all(b, u, 'atk', v, 2, '吟啸')); continue
            if '自身统率' in s or '受到的伤害' in s or '每发动一次' in s or '发动后' in s or '目标是' in s or '必中' in s:
                approx = True; continue
            approx = True
        if not steps: return None
        return lambda b, u: [f(b, u) for f in steps]

    if typ.startswith('主动'):
        fn = active_fn(eff)
        if fn is None: UNPARSED.append((name, typ, eff)); return None
        sk = (prep if '准备' in typ else active)(rate, fn, first_round=first)
        # 附带的被动句
        for s in sents:
            if '受到伤害 +' in s or '受到的伤害 +' in s: misc_clause(s)
    elif typ == '追击':
        m = re.search(r'追击 ?(\d\.\d) 倍', eff)
        if not m: UNPARSED.append((name, typ, eff)); return None
        v = float(m.group(1)); alt = re.search(r'([一-龥、]+?)在场时(?:追击)? ?(\d\.\d) 倍', eff)
        tsel = 'stat_min' if '统率最低者' in eff else ('stat_max' if '速度最高者' in eff else None)
        def f(b, u, t, v=v, alt=alt, tsel=tsel, eff=eff):
            mult = v
            if alt and any(inplay(b, u, w) for w in alt.group(1).split('、')): mult = float(alt.group(2))
            if tsel:
                T = b.pick(u, tsel, stat='def' if tsel == 'stat_min' else 'agi')
                if not T: return
                t = T[0]
            for cn, cv in re.findall(r'目标是(\S+?)时 ?(\d\.\d) 倍', eff):
                if t.name == cn: mult = float(cv)
            b.damage(u, t, mult, must_hit='必中' in eff, tag='pursue')
        sk = pursue(rate, f, other=bool(tsel))
        for s in sents:
            if '追击率 +' in s:
                mm = re.search(r'([一-龥]+?)在场时(?:追击率|.*?追击率) ?\+(\d+)%', s)
                if mm: hooks.setdefault('round_start', []).append(lambda u, *_, w=mm.group(1), v=int(mm.group(2)) / 100: u.flags.__setitem__('pursue_bonus', v if inplay(u.battle, u, w) else 0))
    else:
        got = False
        for s in sents:
            a = stat_clause(s); b_ = misc_clause(s)
            got = got or a or b_
            if not a and not b_: approx = True
        if not got: UNPARSED.append((name, typ, eff)); return None
        sk = (troop if typ == '兵种' else (command if typ == '指挥' else passive))()
    if approx: APPROX.append((name, typ, eff))
    # 合并 hooks（列表→单函数）
    H = {}
    for ev, L in hooks.items():
        def mk(L):
            def g(u, *a):
                r = None
                for f in L:
                    x = f(u, *a)
                    if x: r = x
                return r
            return g
        H[ev] = mk(L)
    sk['hooks'] = {**sk.get('hooks', {}), **H}
    old_setup = sk.get('setup')
    def setup(b, u, old=old_setup, setups=setups, cmds=cmds, typ=typ):
        if old: old(b, u)
        for f in setups: f(b, u)
        if typ in ('指挥', '兵种', '被动') and not sk.get('fn'):
            for f in cmds: f(b, u)
    sk['setup'] = setup
    if typ in ('指挥', '兵种') and not sk.get('fn'): sk['fn'] = None
    return sk

def load_all(path='../data/skills.tsv'):
    rows = list(csv.DictReader(open(path, encoding='utf-8'), delimiter='\t'))
    for r in rows:
        if r['名'] in SK: continue
        sk = parse(r)
        if sk: SK[r['名']] = sk
    return rows
