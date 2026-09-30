# -*- coding: utf-8 -*-
"""无双 36 + 虎 56 手写技能。每条对应《设计_技能规范》v0.2 / 《设计_技能_虎档》v0.1 的描述。"""
import random

def active(rate, fn, **kw): return dict(type='主动·瞬发', rate=rate, fn=fn, **kw)
def prep(rate, fn, **kw): return dict(type='主动·准备', rate=rate, fn=fn, **kw)
def passive(hooks=None, setup=None, **kw): return dict(type='被动', hooks=hooks or {}, setup=setup, **kw)
def command(fn=None, hooks=None, **kw): return dict(type='指挥', fn=fn, hooks=hooks or {}, **kw)
def troop(fn=None, hooks=None, **kw): return dict(type='兵种', fn=fn, hooks=hooks or {}, **kw)
def pursue(rate, fn, **kw): return dict(type='追击', rate=rate, fn=fn, **kw)
def buff_all(b, u, k, pct, rounds=-1, tag=None, filt=None):
    for a in b.allies(u):
        if filt is None or filt(a): a.addbuff(k, pct, rounds, tag)
def once(u, key):
    if key in u.once: return False
    u.once.add(key); return True
def inplay(b, u, name): return any(a.name == name for a in b.allies(u))
def enemy_has(b, u, name): return any(e.name == name for e in b.enemies(u))

SK = {}
# ---------------- 蜀 无双 ----------------
def _liubei(b, u): buff_all(b, u, 'def', .08, tag='perm仁德')
SK['刘备'] = command(_liubei, hooks={'round_end': lambda u, *_: b_heal_min(u, .05)})
def b_heal_min(u, pct):
    b = u.battle; t = b.ally_pick(u, 'hp_min')
    if t: b.heal(u, t[0], pct)
def _guanyu(b, u):
    t = b.pick(u, 'hp_max')[0]
    if t.ratio() < .30 and once(u, '斩'): b.apply(u, t, t.hp + 1, 'phys', '斩杀'); return
    b.damage(u, t, 2.6)
SK['关羽'] = active(.40, _guanyu)
def _zhangfei(b, u):
    for t in b.pick(u, 'all'):
        b.damage(u, t, 0.8); t.add_status('震慑', 1, 1.0 if t.stat('agi') < u.stat('agi') else .5, u)
SK['张飞'] = prep(.40, _zhangfei)
def _zhaoyun(b, u, t):
    n = 0
    while t.alive() and n < 3:
        b.damage(u, t, 1.2, tag='pursue'); n += 1
        if t.ratio() >= .5: break
SK['赵云'] = pursue(.55, _zhaoyun, hooks={'round_start': lambda u, *_: u.flags.__setitem__('pursue_bonus', .03 * int((1 - u.ratio()) * 10))})
def _machao_setup(b, u):
    u.flags['西凉'] = True
def _machao_hook(u, t):
    b = u.battle
    if b.round <= 3:
        o = [e for e in b.enemies(u) if e is not t]
        if o: b.damage(u, random.choice(o), .6, tag='冲撞')
    else: u.addbuff('atk', min(.12, .03 * (b.round - 3)), tag='神威')
SK['马超'] = troop(hooks={'after_attack': _machao_hook})
def _huangzhong(b, u):
    t = b.pick(u, 'stat_min', stat='def')[0]
    u.flags['crit'] = .4; b.damage(u, t, 2.4 + min(.8, .1 * (b.round - 1)), must_hit=True); u.flags['crit'] = 0
SK['黄忠'] = active(.45, _huangzhong)
def burn(b, u, t, rounds, per=.03):
    t.add_status('灼烧', rounds); t.flags['灼烧_src'] = (u, per)
def _zhugeliang(b, u):
    for t in b.pick(u, 'all'): b.damage(u, t, .9, 'mag'); burn(b, u, t, 2)
SK['诸葛亮'] = prep(.45, _zhugeliang)
def _pangtong(b, u):
    ts = b.pick(u, 'random', 3)
    for t in ts: t.status['连环'] = 2; t.flags['连环组'] = ts
def _lianhuan_hook(u, src, dmg, kind, tag):
    if tag == '连环' or not u.has('连环'): return
    for o in u.flags.get('连环组', []):
        if o is not u and o.alive() and o.has('连环'): u.battle.apply(src, o, dmg * .4, kind, '连环')
SK['庞统'] = active(.40, _pangtong, hooks={'on_hit_taken': _lianhuan_hook})
def _jiangwei(b, u):
    k = 'phys' if u.stat('atk') >= u.stat('int') else 'mag'
    m = 1.8 + min(.9, .15 * u.flags.get('九伐', 0)); u.flags['九伐'] = u.flags.get('九伐', 0) + 1
    for t in b.pick(u, 'random', 2): b.damage(u, t, m, k)
SK['姜维'] = active(.40, _jiangwei)
def _fazheng(b, u):
    a = max(b.allies(u), key=lambda x: x.stat('agi')); a.flags['rate_bonus'] = .25; a.flags['先机到'] = 2
    e = b.pick(u, 'stat_max', stat='def')[0]; e.addbuff('def', -.12, 3)
SK['法正'] = command(_fazheng, hooks={'round_end': lambda u, *_: [a.flags.__setitem__('rate_bonus', 0) for a in u.battle.allies(u) if a.flags.get('先机到') and u.battle.round >= 2]})
# ---------------- 魏 无双 ----------------
def _caocao(b, u): buff_all(b, u, 'atk', .06, tag='perm奸雄'); buff_all(b, u, 'int', .06, tag='perm奸雄i')
def _caocao_end(u, *_):
    b = u.battle; m = max(b.allies(u), key=lambda x: x.hp)
    if m is not u: a = m.maxhp * .03; m.hp -= a; u.hp = min(u.maxhp, u.hp + a)
def _caocao_death(u, dead, src):
    n = u.flags.get('负人', 0)
    if n < 3: u.flags['负人'] = n + 1; buff_all(u.battle, u, 'atk', .04 * (n + 1), tag='perm负人')
SK['曹操'] = command(_caocao, hooks={'round_end': _caocao_end, 'on_ally_death': _caocao_death})
def _zhangliao(b, u):
    for t in b.pick(u, 'random', 3): b.damage(u, t, 1.5); t.add_status('怯战', 1, .4, u)
SK['张辽'] = active(.35, _zhangliao, first_round=True, setup=lambda b, u: u.addbuff('agi', .5, 1, '先手'))
def _dianwei_sub(u, tgt, src, kind, tag):
    b = u.battle
    if tag not in ('attack', 'skill', 'pursue') or tgt is u: return None
    low = min(b.allies(u), key=lambda x: x.ratio())
    if tgt is low:
        if u.ratio() < .3: u.flags['sub_mul'] = 1.0; return u
        if random.random() < .5: u.flags['sub_mul'] = .7; return u
    return None
SK['典韦'] = passive(hooks={'substitute': _dianwei_sub})
def _xuchu(b, u):
    u.addbuff('def', -.30, 2, '裸衣'); u.flags['裸衣中'] = 2
    t = b.pick(u, 'random')[0]; b.damage(u, t, 3.0 + u.flags.get('裸衣加', 0))
def _xuchu_hit(u, src, dmg, kind, tag):
    if u.flags.get('裸衣中', 0) > 0: u.flags['裸衣加'] = u.flags.get('裸衣加', 0) + .3
SK['许褚'] = active(.38, _xuchu, hooks={'on_hit_taken': _xuchu_hit, 'round_end_unit': lambda u, *_: u.flags.__setitem__('裸衣中', max(0, u.flags.get('裸衣中', 0) - 1))})
def _xiahoudun_hit(u, src, dmg, kind, tag):
    b = u.battle
    if src and src.alive() and kind == 'mag' and u.flags.get('反击回合') != b.round:
        u.flags['反击回合'] = b.round; b.damage(u, src, 1.2, tag='反击')
    if u.ratio() < .5 and once(u, '啖睛'): u.addbuff('atk', .12, tag='perm啖睛')
SK['夏侯惇'] = passive(hooks={'on_hit_taken': _xiahoudun_hit})
def _guojia(b, u):
    e = b.pick(u, 'stat_max', stat='int')[0]; e.flags['rate_bonus'] = e.flags.get('rate_bonus', 0) - .15
def _guojia_death(u, src):
    b = u.battle; A = b.allies(u)
    if A: a = random.choice(A); a.flags['遗计'] = True
SK['郭嘉'] = command(_guojia, hooks={'on_death': _guojia_death})
def _xunyu(b, u):
    t = b.pick(u, 'random')[0]; t.add_status('混乱', 1, 1.0, u); b_heal_min(u, .08)
SK['荀彧'] = active(.45, _xunyu)
def _simayi_start(b, u):
    u.flags['记账'] = 0.0; u.flags['记账中'] = True
def _simayi(b, u):
    acc = u.flags.get('记账', 0); u.flags['记账中'] = False
    if acc > 0:
        for t in b.pick(u, 'all'): b.damage(u, t, 1.0, 'mag'); b.apply(u, t, acc * .8 / max(1, len(b.enemies(u))) * 4.5, 'mag', '记账')
    else: b.damage(u, b.pick(u, 'random')[0], 2.5, 'mag')
def _simayi_hit(u, src, dmg, kind, tag):
    if u.flags.get('记账中'): u.flags['记账'] = u.flags.get('记账', 0) + dmg
SK['司马懿'] = prep(.40, _simayi, hooks={'on_hit_taken': _simayi_hit, 'on_prepare': lambda u, who: _simayi_start(u.battle, u) if who is u else None})
def _jiaxu(b, u):
    t = b.pick(u, 'random')[0]; t.add_status('计穷', 2, 1.0, u); t.add_status('迷惑', 1, 1.0, u)
SK['贾诩'] = active(.40, _jiaxu)
def _dengai(b, u): u.hidden = 2
def _dengai_rs(u, *_):
    b = u.battle
    if b.round == 3:
        for t in b.pick(u, 'back', 2): b.damage(u, t, 2.0, ignore=.5)
SK['邓艾'] = command(_dengai, hooks={'round_start': _dengai_rs})
# ---------------- 吴 无双 ----------------
def _sunjian(b, u, t):
    u.flags['crit'] = 1.0 if u.ratio() > .7 else 0; b.damage(u, t, 1.1, tag='pursue'); u.flags['crit'] = 0
SK['孙坚'] = pursue(.50, _sunjian)
def _sunce(b, u):
    t = b.pick(u, 'random')[0]; b.damage(u, t, 2.2)
    if t.add_status('挑衅', 1, 1.0, u): t.taunt_by = u
def _sunce_hit(u, src, *_):
    n = min(5, u.flags.get('霸王', 0) + 1); u.flags['霸王'] = n; u.addbuff('atk', .04 * n, tag='perm霸王')
SK['孙策'] = active(.45, _sunce, hooks={'on_hit_taken': _sunce_hit})
def _sunquan(b, u):
    buff_all(b, u, 'def', .08, tag='perm坐断'); buff_all(b, u, 'int', .06, tag='perm坐断i', filt=lambda a: a.role == '文臣')
SK['孙权'] = command(_sunquan, hooks={'round_end': lambda u, *_: [u.battle.heal(u, a, .04) for a in u.battle.allies(u)] if u.battle.round % 3 == 0 else None})
def _zhouyu(b, u):
    for t in b.pick(u, 'all'): b.damage(u, t, 1.0, 'mag'); burn(b, u, t, 2)
SK['周瑜'] = prep(.40, _zhouyu, setup=lambda b, u: u.flags.__setitem__('no_prep', inplay(b, u, '诸葛亮')))
def _luxun(b, u):
    for t in b.pick(u, 'all'): b.damage(u, t, .9, 'mag'); burn(b, u, t, 3)
SK['陆逊'] = active(.50, _luxun, gate=lambda b, u: b.round >= 4, hooks={'round_end_unit': lambda u, *_: u.addbuff('int', .03 * min(3, u.battle.round), tag='perm潜渊') if u.battle.round <= 3 else None})
def _taishici(b, u, t):
    E = b.enemies(u); pre = [e for e in E if e.prep]
    tt = random.choice(pre) if pre else t
    b.damage(u, tt, 1.0, must_hit=True, tag='pursue')
    if tt.prep: tt.prep = None; b.say(f'{tt.name} 准备被打断')
SK['太史慈'] = pursue(.60, _taishici, other=True)
def _ganning(b, u):
    fastest = max(b.teams[0] + b.teams[1], key=lambda x: x.stat('agi') if x.alive() else 0) is u
    for t in b.pick(u, 'random', 3): b.damage(u, t, 1.4 + (.4 if fastest else 0))
SK['甘宁'] = active(.35, _ganning, first_round=True, setup=lambda b, u: u.flags.__setitem__('dodge', .25), hooks={'round_start': lambda u, *_: u.flags.__setitem__('dodge', .25 if u.battle.round <= 2 else 0)})
def _lvmeng(b, u):
    t = b.pick(u, 'hp_max')[0]; b.damage(u, t, 2.8); t.add_status('缴械', 1, 1.0, u)
SK['吕蒙'] = prep(.40, _lvmeng, hooks={'on_prepare': lambda u, who: setattr(u, 'hidden', 1) if who is u else None})
# ---------------- 汉 无双 ----------------
def _lvbu_hit(u, src, *_):
    b = u.battle; k = ('围', b.round); u.flags[k] = u.flags.get(k, 0) + 1
    if u.flags[k] == 3: u.addbuff('atk', .15, 2, '三英')
SK['吕布'] = passive(setup=lambda b, u: (u.flags.__setitem__('double_attack', True), u.flags.__setitem__('dmg_in', .10)), hooks={'on_hit_taken': _lvbu_hit})
def _dongzhuo_after(u, tgt, dmg, kind, tag):
    if tag in ('attack', 'skill', 'pursue'): u.hp = min(u.maxhp, u.hp + dmg * .25)
def _dongzhuo_end(u, *_):
    u.hp -= u.maxhp * .02
    u.addbuff('def', .12 if u.ratio() > .8 else 0, tag='perm暴熊')
SK['董卓'] = passive(hooks={'after_hit': _dongzhuo_after, 'round_end_unit': _dongzhuo_end})
def _diaochan(b, u):
    t = b.pick(u, 'stat_max', stat='atk')[0]
    if t.name in ('吕布', '董卓'): t.status['迷惑'] = 3
    else: t.add_status('迷惑', 2, 1.0, u)
SK['貂蝉'] = active(.40, _diaochan)
def _huatuo(b, u):
    t = b.ally_pick(u, 'hp_min')[0]; b.heal(u, t, .12); t.status.pop('中毒', None); t.status.pop('灼烧', None)
def _huatuo_death(u, dead, src):
    if once(u, '刮骨'): dead.hp = dead.maxhp * .3; u.battle.say(f'华佗救回 {dead.name}')
SK['华佗'] = active(.55, _huatuo, hooks={'on_ally_death': _huatuo_death})
def _wangyun(b, u):
    E = b.enemies(u); a = max(E, key=lambda x: x.stat('atk')); c = max(E, key=lambda x: x.stat('int'))
    if a is c: return
    u.flags['反目'] = (a, c)
def _wangyun_end(u, *_):
    p = u.flags.get('反目')
    if p:
        for x in p:
            if x.alive(): u.battle.apply(None, x, x.maxhp * .03, 'mag', '反目', true=True)
SK['王允'] = command(_wangyun, hooks={'round_end': _wangyun_end})
def _chengong(b, u):
    for a in b.ally_pick(u, 'front'): b.shield(a, .10)
def _chengong_hit(u, tgt, src, dmg, kind, tag):
    pass
def _chengong_end(u, *_):
    b = u.battle
    for a in b.allies(u):
        if a.flags.get(('挨', b.round), 0) >= 2: a.addbuff('def', .10, 1, '犄角')
SK['陈宫'] = command(_chengong, hooks={'round_end': _chengong_end})
def _yuanshao(b, u): buff_all(b, u, 'atk', .05, tag='perm四世'); buff_all(b, u, 'def', .05, tag='perm四世d'); u.flags['no_active'] = True
def _yuanshao_rs(u, *_):
    b = u.battle; more = len(b.allies(u)) > len(b.enemies(u))
    buff_all(b, u, 'atk', .05 if more else 0, tag='perm四世2'); buff_all(b, u, 'def', .05 if more else 0, tag='perm四世2d')
SK['袁绍'] = command(_yuanshao, hooks={'round_start': _yuanshao_rs})
def _zuoci(b, u):
    for t in b.pick(u, 'random', 3): t.add_status('混乱', 1, 1.0, u)
def _zuoci_lethal(u, src):
    if once(u, '分身'): u.hp = 1; u.hidden = 1; return True
SK['左慈'] = active(.35, _zuoci, hooks={'on_lethal': _zuoci_lethal})

# 通用：记录同回合被打次数（陈宫、吕布用）
def _count_hits(u, src, dmg, kind, tag):
    b = u.battle; k = ('挨', b.round); u.flags[k] = u.flags.get(k, 0) + 1
GLOBAL_HOOKS = {'on_hit_taken': _count_hits}

# ================= 虎 56 =================
# 汉
def _huaxiong(b, u):
    t = b.pick(u, 'hp_min')[0]; b.damage(u, t, 2.0)
    if not t.alive():
        o = b.pick(u, 'random')
        if o: b.damage(u, o[0], 1.0, tag='attack')
SK['华雄'] = active(.42, _huaxiong)
SK['颜良'] = passive(hooks={'round_start': lambda u, *_: u.flags.__setitem__('atk_mult', .4 if u.battle.round <= 2 else -.2)})
SK['文丑'] = pursue(.50, lambda b, u, t: (lambda o: b.damage(u, random.choice(o), .9, tag='pursue') if o else None)([e for e in b.enemies(u) if e is not t]), other=True)
def _gaoshun(b, u): u.flags['must_hit'] = True; u.flags['ignore'] = .2
SK['高顺'] = troop(_gaoshun, hooks={'round_end': lambda u, *_: (lambda F: u.battle.shield(min(F, key=lambda x: x.stat('def')), .05) if F else None)(u.battle.ally_pick(u, 'front'))})
def _zhangxiu(b, u):
    t = b.pick(u, 'back', 1)[0]; b.damage(u, t, 2.2)
    if b.round == 1: t.add_status('缴械', 1, 1.0, u)
SK['张绣'] = active(.35, _zhangxiu, first_round=True)
def _gongsun(b, u): buff_all(b, u, 'agi', .06, tag='perm白马'); u.flags['mag_in'] = .15
def _gongsun_after(u, t):
    o = [e for e in u.battle.enemies(u) if e is not t]
    if o: u.battle.damage(u, random.choice(o), .5, tag='冲撞')
SK['公孙瓒'] = troop(_gongsun, hooks={'after_attack': _gongsun_after, 'mod_in': lambda u, src, kind, tag: 1.15 if kind == 'mag' else None})
SK['马腾'] = command(lambda b, u: buff_all(b, u, 'atk', .06, tag='perm西凉', filt=lambda a: a.faction == '汉'), hooks={'round_end': lambda u, *_: u.battle.heal(u, max(u.battle.allies(u), key=lambda x: x.stat('agi')), .03)})
def _zhangren(b, u):
    t = b.pick(u, 'stat_max', stat='int')[0]; b.damage(u, t, 2.6); t.add_status('计穷', 1, 1.0, u)
SK['张任'] = prep(.40, _zhangren)
def _huangfusong(b, u):
    for t in b.pick(u, 'random', 3): b.damage(u, t, 1.0); burn(b, u, t, 2)
SK['皇甫嵩'] = active(.40, _huangfusong)
def _tianfeng(b, u):
    E = [e for e in b.enemies(u) if e.skill and e.skill.get('rate')]
    if E: e = max(E, key=lambda x: x.skill['rate']); e.flags['rate_bonus'] = e.flags.get('rate_bonus', 0) - .12
SK['田丰'] = command(_tianfeng, hooks={'on_death': lambda u, src: [a.cleanse() for a in u.battle.allies(u)]})
def _jushou(b, u):
    for t in b.pick(u, 'random', 2): t.dispel(); t.addbuff('agi', -.10, 1)
SK['沮授'] = active(.45, _jushou)
def poison(b, u, t, rounds, per): t.add_status('中毒', rounds); t.flags['中毒_src'] = (u, per)
SK['李儒'] = active(.40, lambda b, u: poison(b, u, b.pick(u, 'hp_max')[0], 3, .03))
def _yuji(b, u):
    for a in b.ally_pick(u, 'random', 2): b.heal(u, a, .06)
    b.pick(u, 'random')[0].status['诅咒'] = 2
SK['于吉'] = active(.50, _yuji)
# 魏
SK['夏侯渊'] = pursue(.55, lambda b, u, t: b.damage(u, t, 1.4 if b.order[0] is u else 1.0, tag='pursue'))
def _zhanghe_dodge(u, src): u.flags['atk_mult'] = .5
def _zhanghe_after(u, t): u.flags['atk_mult'] = 0
SK['张郃'] = passive(setup=lambda b, u: u.flags.__setitem__('dodge', .25), hooks={'on_dodge': _zhanghe_dodge, 'after_attack': _zhanghe_after})
def _xuhuang(b, u):
    t = b.pick(u, 'hp_max')[0]; t.shield = 0; b.damage(u, t, 2.2)
SK['徐晃'] = active(.40, _xuhuang)
SK['于禁'] = command(lambda b, u: buff_all(b, u, 'def', .08, tag='perm严整'), hooks={'resist_status': lambda u, tgt, s: (tgt.side == u.side and s in ('混乱', '迷惑') and random.random() < .3) or None})
SK['乐进'] = pursue(.50, lambda b, u, t: (u.flags.__setitem__('crit', 1.0 if t.ratio() > .8 else 0), b.damage(u, t, 1.0, tag='pursue'), u.flags.__setitem__('crit', 0)))
def _pangde_end(u, *_):
    if u.ratio() < .4:
        u.addbuff('atk', .15, tag='perm抬榇'); u.flags['immune'] = ('怯战', '挑衅'); u.hp -= u.maxhp * .01
SK['庞德'] = passive(hooks={'round_end_unit': _pangde_end, 'resist_status': lambda u, tgt, s: (tgt is u and s in u.flags.get('immune', ())) or None})
SK['曹仁'] = command(lambda b, u: ([a.addbuff('def', .08, tag='perm八门') for a in b.ally_pick(u, 'front')], [e.flags.__setitem__('pursue_bonus', e.flags.get('pursue_bonus', 0) - .10) for e in b.enemies(u)]))
SK['曹真'] = command(lambda b, u: buff_all(b, u, 'def', .06, tag='perm都督', filt=lambda a: a.faction == '魏'), hooks={'round_end': lambda u, *_: random.choice(u.battle.allies(u)).cleanse() if u.battle.round % 3 == 0 else None})
def _caozhang(b, u):
    t = b.pick(u, 'random')[0]; b.damage(u, t, 2.4)
    if not t.alive(): n = min(3, u.flags.get('黄须', 0) + 1); u.flags['黄须'] = n; u.addbuff('atk', .04 * n, tag='perm黄须')
SK['曹彰'] = active(.42, _caozhang)
def _guohuai_end(u, *_):
    b = u.battle
    if u.flags.get(('挨', b.round), 0) == 0: n = min(4, u.flags.get('陇西', 0) + 1)
    else: n = 0
    u.flags['陇西'] = n; u.addbuff('def', .03 * n, tag='perm陇西')
SK['郭淮'] = passive(hooks={'round_end_unit': _guohuai_end})
def _xunyou(b, u):
    t = b.pick(u, 'random')[0]; t.add_status('计穷', 1, 1.0, u); t.addbuff('def', -.10, 2)
SK['荀攸'] = active(.45, _xunyou)
def _chengyu(b, u):
    ts = b.pick(u, 'random', 3)
    for t in ts: b.damage(u, t, 1.5, 'mag')
    if ts: min(ts, key=lambda x: x.stat('agi')).add_status('怯战', 1, 1.0, u)
SK['程昱'] = prep(.42, _chengyu)
def _zhonghui_ally(u, dead, src):
    n = min(3, u.flags.get('野心', 0) + 1); u.flags['野心'] = n; u.addbuff('atk', .05 * n, tag='perm野心'); u.addbuff('int', .05 * n, tag='perm野心i')
SK['钟会'] = passive(hooks={'on_ally_death': _zhonghui_ally, 'on_enemy_death': lambda u, dead, src: u.battle.heal(u, u, .05)})
def _caiwenji(b, u):
    for a in b.ally_pick(u, 'random', 2): a.cleanse(); b.heal(u, a, .05)
SK['蔡文姬'] = active(.50, _caiwenji)
SK['戏志才'] = command(lambda b, u: (buff_all(b, u, 'agi', .10, 1, '先知'), [e.flags.__setitem__('rate_bonus', e.flags.get('rate_bonus', 0) - .15) for e in b.enemies(u)]), hooks={'round_end': lambda u, *_: [e.flags.__setitem__('rate_bonus', e.flags.get('rate_bonus', 0) + .15) for e in u.battle.enemies(u)] if u.battle.round == 1 else None})
# 蜀
def _weiyan(b, u):
    m = 1.8 + (0 if u.front() else .4)
    for t in b.pick(u, 'back', 2): b.damage(u, t, m)
SK['魏延'] = active(.38, _weiyan)
def _guanping_setup(b, u):
    if inplay(b, u, '关羽'): u.addbuff('def', .08, tag='perm护父')
    else: u.addbuff('atk', .06, tag='perm护父')
def _guanping_sub(u, tgt, src, kind, tag):
    if tgt.name == '关羽' and tag in ('attack', 'skill', 'pursue') and random.random() < .4: u.flags['sub_mul'] = .8; return u
SK['关平'] = passive(setup=_guanping_setup, hooks={'substitute': _guanping_sub})
def _guanxing(b, u):
    t = b.pick(u, 'random')[0]; b.damage(u, t, 2.2 + (1.0 if t.flags.get('killed_ally') else 0))
SK['关兴'] = active(.42, _guanxing, hooks={'on_ally_death': lambda u, dead, src: src.flags.__setitem__('killed_ally', True) if src else None})
def _zhangbao(b, u, t):
    b.damage(u, t, 1.0, tag='pursue')
    gx = [a for a in b.allies(u) if a.name == '关兴']
    if gx and t.alive(): b.damage(gx[0], t, .6, tag='pursue')
SK['张苞'] = pursue(.50, _zhangbao)
def _wangping(b, u): u.flags['dodge'] = .10
SK['王平'] = troop(_wangping, hooks={'mod_in': lambda u, src, kind, tag: (0.8 if (src is not None and kind == 'mag') else None), 'mod_in_team': None})
def _madai_prep(u, who):
    b = u.battle
    if who.side != u.side and random.random() < .3: b.damage(u, who, 1.2); who.prep = None; b.say(f'马岱打断 {who.name}')
SK['马岱'] = passive(hooks={'on_prepare': _madai_prep})
def _yanyan_end(u, *_):
    if u.ratio() < .5: u.addbuff('def', .12, tag='perm断头'); u.flags['immune'] = ('挑衅', '震慑')
SK['严颜'] = passive(hooks={'round_end_unit': _yanyan_end, 'on_death': lambda u, src: u.battle.damage(u, src, 1.5) if src and src.alive() else None, 'resist_status': lambda u, tgt, s: (tgt is u and s in u.flags.get('immune', ())) or None})
SK['夏侯霸'] = passive(hooks={'mod_in': lambda u, src, kind, tag: .85 if src and src.faction == '魏' else None, 'mod_out': lambda u, tgt, kind, tag: 1.10 if tgt.faction == '魏' else None})
SK['孙尚香'] = pursue(.55, lambda b, u, t: b.damage(u, b.pick(u, 'stat_max', stat='agi')[0], 1.2 if inplay(b, u, '刘备') else .9, tag='pursue'), other=True)
SK['徐庶'] = command(lambda b, u: b.pick(u, 'stat_max', stat='int')[0].add_status('计穷', 2, 1.0, u))
SK['马良'] = command(lambda b, u: (buff_all(b, u, 'int', .06, tag='perm白眉', filt=lambda a: a.faction == '蜀' and a.role == '文臣'), [a.flags.__setitem__('ctrl_hit', .10) for a in b.allies(u)]))
def _huangyueying(b, u):
    for t in b.pick(u, 'all'): b.damage(u, t, .9, 'mag'); t.addbuff('def', -.08, 2)
SK['黄月英'] = prep(.40, _huangyueying)
SK['蒋琬'] = command(lambda b, u: [setattr(a, 'maxhp', a.maxhp * 1.05) or setattr(a, 'hp', a.hp * 1.05) for a in b.allies(u)], hooks={'round_end': lambda u, *_: b_heal_min(u, .03)})
def _chendao(b, u):
    for a in b.ally_pick(u, 'front'): b.shield(a, .08)
def _chendao_after(u, t):
    o = [e for e in u.battle.enemies(u) if e is not t]
    if o: u.battle.damage(u, random.choice(o), .4, tag='冲撞')
SK['陈到'] = troop(_chendao, hooks={'after_attack': _chendao_after, 'shield_broken': lambda u, who: who.addbuff('def', .05, 2, '白毦') if who.side == u.side else None})
# 吴
def _huanggai_end(u, *_):
    n = min(4, int((1 - u.ratio()) / .2)); u.addbuff('atk', .04 * n, tag='perm苦肉')
SK['黄盖'] = passive(hooks={'round_end_unit': _huanggai_end, 'after_attack': lambda u, t: burn(u.battle, u, t, 1) if u.ratio() < .3 else None})
SK['程普'] = pursue(.48, lambda b, u, t: b.damage(u, t, 1.3 if sum(1 for a in b.allies(u) if a.faction == '吴') >= 3 else 1.0, tag='pursue'))
def _handang(b, u): u.flags['ctrl_len_mod'] = -1; u.flags['anti_pursue_dmg'] = .3
SK['韩当'] = troop(_handang, hooks={'on_hit_taken': lambda u, src, dmg, kind, tag: u.battle.damage(u, src, .8, tag='反击') if src and src.alive() and tag in ('attack', 'skill', 'pursue') and random.random() < .35 else None, 'mod_in': lambda u, src, kind, tag: .7 if tag == 'pursue' else None})
def _zhoutai_sub(u, tgt, src, kind, tag):
    if tgt.name in ('孙权', '孙策') and tag in ('attack', 'skill', 'pursue') and random.random() < .6:
        u.flags['sub_mul'] = .75; n = u.flags.get('护主', 0) + 1; u.flags['护主'] = n
        if n == 3: u.addbuff('def', .10, tag='perm护主')
        return u
SK['周泰'] = passive(hooks={'substitute': _zhoutai_sub})
def _lingtong(b, u):
    t = b.pick(u, 'random')[0]; b.damage(u, t, 2.0); t.add_status('怯战', 1, 1.0, u)
SK['凌统'] = active(.42, _lingtong)
def _dingfeng(b, u):
    for t in b.pick(u, 'random', 3): b.damage(u, t, 1.3 + (.3 if u.stat('agi') < t.stat('agi') else 0))
SK['丁奉'] = active(.40, _dingfeng)
def _xusheng(b, u):
    for e in b.enemies(u): e.flags['rate_bonus'] = e.flags.get('rate_bonus', 0) - .10; e.flags['疑城'] = True
SK['徐盛'] = command(_xusheng, hooks={'round_end': lambda u, *_: [e.flags.__setitem__('rate_bonus', e.flags.get('rate_bonus', 0) + .10) for e in u.battle.enemies(u)] if u.battle.round == 2 else None})
SK['陆抗'] = passive(setup=lambda b, u: u.addbuff('def', .08, tag='perm守荆州'), hooks={'round_end': lambda u, *_: [u.battle.heal(u, a, .02) for a in u.battle.allies(u)]})
SK['鲁肃'] = command(lambda b, u: (buff_all(b, u, 'int', .06, tag='perm榻上'), buff_all(b, u, 'def', .04, tag='perm榻上d') if any(a.faction == '蜀' for a in b.allies(u)) else None))
def _zhugejin(b, u):
    for a in b.ally_pick(u, 'random', 2): b.heal(u, a, .06)
    b.pick(u, 'random')[0].dispel()
SK['诸葛瑾'] = active(.48, _zhugejin)
SK['小乔'] = active(.50, lambda b, u: b.heal(u, b.ally_pick(u, 'hp_min')[0], .08))
def _zhangzhao(b, u):
    t = b.pick(u, 'stat_min', stat='int')[0]; t.add_status('计穷', 2, 1.0, u)
SK['张昭'] = active(.42, _zhangzhao, setup=lambda b, u: None, hooks={'mod_in': lambda u, src, kind, tag: 1.15 if kind == 'mag' else None})
# 无
def _zhangjiao(b, u):
    for t in b.pick(u, 'all'): b.damage(u, t, .9, 'mag'); t.add_status('混乱', 1, .3, u)
SK['张角'] = prep(.40, _zhangjiao)
def _menghuo_lethal(u, src):
    if once(u, '七擒'): u.hp = u.maxhp * .25; u.addbuff('def', .05, tag='perm屡败'); return True
SK['孟获'] = passive(hooks={'on_lethal': _menghuo_lethal})
