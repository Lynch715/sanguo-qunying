# -*- coding: utf-8 -*-
"""小语法表达不了的手写段落。每个 fn(b, u, ctx)。数量控制在二十个以内，多了就是语法该扩。"""
import random
CUSTOM = {}
def reg(name):
    def d(f): CUSTOM[name] = f; return f
    return d

@reg('关羽斩')
def _(b, u, ctx):
    t = b.pick(u, 'hp_max')[0]
    if t.ratio() < .30 and '斩' not in u.once: u.once.add('斩'); b.apply(u, t, t.hp + 1, 'phys', '斩杀'); return
    b.damage(u, t, 2.6)

@reg('赵云七进七出')
def _(b, u, ctx):
    t = ctx['tgt']; n = 0
    while t.alive() and n < 3:
        b.damage(u, t, 1.2, tag='pursue'); n += 1
        if t.ratio() >= .5: break

@reg('马超后期')
def _(b, u, ctx):
    if b.round >= 4: u.flags['神威'] = min(.16, u.flags.get('神威', 0) + .04); u.addbuff('atk', u.flags['神威'], -1, 'perm神威')

@reg('黄忠老当益壮')
def _(b, u, ctx):
    t = b.pick(u, 'stat_min', stat='def')[0]
    u.addbuff('crit', .4, 1, '穿杨'); b.damage(u, t, 2.4 + min(.8, .1 * (b.round - 1)), must_hit=True)

@reg('庞统连环')
def _(b, u, ctx):
    ts = b.pick(u, 'random', 3)
    r = u.flags.get('连环比', .15); r = r if isinstance(r, float) else .15
    for t in ts: t.status['连环'] = 2; t.flags['连环组'] = ts; t.flags['连环比'] = r
    for t in ts: b.damage(u, t, 1.0, 'mag')
def _lianhuan(u, src, dmg, kind, tag):
    # V0.2 修：钩子挂在每个人身上（原来只挂在庞统自己身上，庞统不会中连环，所以从不触发）
    if tag == '连环' or not u.has('连环'): return
    for o in u.flags.get('连环组', []):
        if o is not u and o.alive() and o.has('连环'): u.battle.apply(src, o, dmg * u.flags.get('连环比', .15), kind, '连环')
CUSTOM['_hooks'] = {}
CUSTOM['_global'] = {'on_hit_taken': _lianhuan}

@reg('姜维九伐')
def _(b, u, ctx):
    k = 'phys' if u.stat('atk') >= u.stat('int') else 'mag'
    m = 1.8 + min(.9, .15 * u.flags.get('九伐', 0)); u.flags['九伐'] = u.flags.get('九伐', 0) + 1
    for t in b.pick(u, 'random', 2): b.damage(u, t, m, k)

@reg('曹操抽兵')
def _(b, u, ctx):
    m = max(b.allies(u), key=lambda x: x.hp)
    if m is not u: a = m.maxhp * .03; m.hp -= a; u.hp = min(u.maxhp, u.hp + a)
@reg('曹操负人')
def _(b, u, ctx):
    n = u.flags.get('负人', 0)
    if n < 3:
        u.flags['负人'] = n + 1
        for a in b.allies(u): a.addbuff('atk', .04 * (n + 1), -1, 'perm负人')

@reg('许褚裸衣')
def _(b, u, ctx):
    u.addbuff('def', -.30, 2, '裸衣'); u.flags['裸衣中'] = 2
    b.damage(u, b.pick(u, 'random')[0], 3.0 + u.flags.get('裸衣加', 0))
@reg('许褚受击')
def _(b, u, ctx):
    if u.flags.get('裸衣中', 0) > 0: u.flags['裸衣加'] = u.flags.get('裸衣加', 0) + .3
@reg('许褚回合')
def _(b, u, ctx): u.flags['裸衣中'] = max(0, u.flags.get('裸衣中', 0) - 1)

@reg('郭嘉遗计')
def _(b, u, ctx):
    A = b.allies(u)
    if A: a = random.choice(A); a.addbuff('rate', 1.0, 1, '遗计'); a.flags['遗计倍'] = .5

@reg('司马懿记账起')
def _(b, u, ctx): u.flags['记账'] = 0.0; u.flags['记账中'] = True
@reg('司马懿记账收')
def _(b, u, ctx):
    if u.flags.get('记账中'): u.flags['记账'] = u.flags.get('记账', 0) + ctx.get('dmg', 0)
@reg('司马懿鹰视')
def _(b, u, ctx):
    acc = u.flags.get('记账', 0); u.flags['记账中'] = False
    E = b.pick(u, 'all')
    if acc > 0:
        for t in E: b.damage(u, t, .7, 'mag'); b.apply(u, t, acc * .8 / max(1, len(E)), 'mag', '记账')
    else: b.damage(u, b.pick(u, 'random')[0], 2.5, 'mag')

@reg('邓艾阴平')
def _(b, u, ctx):
    if b.round == 3:
        for t in b.pick(u, 'back', 2): b.damage(u, t, 2.0, ignore=.5)

@reg('孙策叠层')
def _(b, u, ctx):
    n = min(5, u.flags.get('霸王', 0) + 1); u.flags['霸王'] = n; u.addbuff('atk', .04 * n, -1, 'perm霸王')

@reg('陆逊潜渊')
def _(b, u, ctx):
    if b.round <= 3: u.addbuff('int', .03 * b.round, -1, 'perm潜渊'); return
    for t in b.pick(u, 'all'): b.damage(u, t, .7, 'mag'); t.add_status('灼烧', 3); t.flags['灼烧_src'] = (u, .02)
CUSTOM['_gates'] = {'陆逊': lambda b, u: b.round >= 4}

@reg('太史慈神射')
def _(b, u, ctx):
    E = b.enemies(u); pre = [e for e in E if e.prep]
    t = random.choice(pre) if pre else ctx['tgt']
    b.damage(u, t, 1.3, must_hit=True, tag='pursue')
    if t.prep: t.prep = None; b.say(f'{t.name} 准备被打断')

@reg('吕布围攻')
def _(b, u, ctx):
    k = ('围', b.round)
    if u.flags.get(k, 0) == 3: u.addbuff('atk', .15, 2, '三英')

@reg('董卓吸血')
def _(b, u, ctx):
    if ctx.get('tag') in ('attack', 'skill', 'pursue'): u.hp = min(u.maxhp, u.hp + ctx.get('dmg', 0) * .25)

@reg('华佗刮骨')
def _(b, u, ctx):
    d = ctx['dead']
    if '刮骨' not in u.once: u.once.add('刮骨'); d.hp = d.maxhp * .3; b.say(f'华佗救回 {d.name}')

@reg('王允反目')
def _(b, u, ctx):
    E = b.enemies(u)
    if len(E) < 2: return
    a = max(E, key=lambda x: x.stat('atk')); c = max(E, key=lambda x: x.stat('int'))
    if a is not c: u.flags['反目'] = (a, c)
@reg('王允互伤')
def _(b, u, ctx):
    for x in u.flags.get('反目', ()):
        if x.alive(): b.apply(None, x, x.maxhp * .03, 'mag', '反目', true=True)

@reg('陈宫犄角')
def _(b, u, ctx):
    for a in b.allies(u):
        if a.flags.get(('挨', b.round), 0) >= 2: a.addbuff('def', .10, 1, '犄角')

@reg('袁绍人多')
def _(b, u, ctx):
    more = len(b.allies(u)) > len(b.enemies(u))
    for a in b.allies(u): a.addbuff('atk', .05 if more else 0, -1, 'perm四世2'); a.addbuff('def', .05 if more else 0, -1, 'perm四世2d')

@reg('华雄连斩')
def _(b, u, ctx):
    t = b.pick(u, 'hp_min')[0]; b.damage(u, t, 2.0)
    if not t.alive():
        o = b.pick(u, 'random')
        if o: b.damage(u, o[0], 1.0, tag='attack')

@reg('郭淮陇西')
def _(b, u, ctx):
    n = min(4, u.flags.get('陇西', 0) + 1) if u.flags.get(('挨', b.round), 0) == 0 else 0
    u.flags['陇西'] = n; u.addbuff('def', .03 * n, -1, 'perm陇西')

@reg('钟会野心')
def _(b, u, ctx):
    n = min(3, u.flags.get('野心', 0) + 1); u.flags['野心'] = n
    u.addbuff('atk', .05 * n, -1, 'perm野心'); u.addbuff('int', .05 * n, -1, 'perm野心i')

@reg('黄盖苦肉')
def _(b, u, ctx):
    n = min(4, int((1 - u.ratio()) / .2)); u.addbuff('atk', .04 * n, -1, 'perm苦肉')

@reg('曹彰黄须')
def _(b, u, ctx):
    n = min(3, u.flags.get('黄须', 0) + 1); u.flags['黄须'] = n; u.addbuff('atk', .04 * n, -1, 'perm黄须')

@reg('周泰护主')
def _(b, u, ctx):
    n = u.flags.get('护主', 0) + 1; u.flags['护主'] = n
    if n == 3: u.addbuff('def', .10, -1, 'perm护主')

@reg('孟获七擒')
def _(b, u, ctx):
    if '七擒' not in u.once: u.once.add('七擒'); u.hp = u.maxhp * .25; u.addbuff('def', .05, -1, 'perm屡败'); ctx['_revived'] = True

@reg('傅肜不倒')
def _(b, u, ctx):
    if u.ratio() < .2 and '不倒' not in u.once: u.once.add('不倒'); u.flags['不倒到'] = b.round + 1
@reg('傅肜免死')
def _(b, u, ctx):
    if u.flags.get('不倒到', -1) >= b.round: u.hp = 1; ctx['_revived'] = True

@reg('王朗骂死')
def _(b, u, ctx):
    t = b.pick(u, 'stat_max', stat='int')[0]
    if t.name == '诸葛亮':
        u.hp = 0; b.say('王朗被骂死')
        for a in b.allies(u): a.addbuff('atk', .05, -1, 'perm骂')
    else:
        if t.add_status('挑衅', 1, 1.0, u): t.taunt_by = u
        b.damage(u, t, 1.0, 'mag')

@reg('曹洪替死')
def _(b, u, ctx):
    pass
def _tidie(owner_name, protect):
    def f(u, tgt, src):
        if tgt.name == protect and u.alive() and 'sub' not in u.once:
            u.once.add('sub'); u.hp = 0; tgt.hp = tgt.maxhp * .01; u.battle.say(f'{u.name} 替死'); return True
    return f
CUSTOM['_hooks']['曹洪'] = {'on_lethal_any': _tidie('曹洪', '曹操')}
CUSTOM['_hooks']['曹昂'] = {'on_lethal_any': _tidie('曹昂', '曹操')}

@reg('阎柔胡骑')
def _(b, u, ctx):
    if random.random() < .3:
        o = b.pick(u, 'random')
        if o: b.damage(u, o[0], .6, tag='胡骑')

@reg('文鸯集火')
def _(b, u, ctx):
    if u.flags.get(('挨', b.round), 0) >= 2: u.addbuff('pursue', 1.0, 1, '单骑')

@reg('徐氏设伏')
def _(b, u, ctx):
    src = ctx.get('src')
    if src and src.alive() and ctx.get('tag') in ('attack', 'skill', 'pursue') and u.flags.get('伏回合') != b.round:
        u.flags['伏回合'] = b.round; a = random.choice(b.allies(u)); b.damage(a, src, .8, tag='反击')

@reg('杜预破竹')
def _(b, u, ctx):
    n = min(4, u.flags.get('破竹', 0) + 1); u.flags['破竹'] = n
    u.addbuff('atk', .04 * n, -1, 'perm破竹'); u.addbuff('int', .04 * n, -1, 'perm破竹i')

@reg('吕岱定公')
def _(b, u, ctx):
    n = min(4, u.flags.get('定公', 0) + 1); u.flags['定公'] = n
    u.addbuff('atk', .03 * n, -1, 'perm定公'); u.addbuff('def', .03 * n, -1, 'perm定公d')

@reg('刘禅站桩')
def _(b, u, ctx): u.hidden = 99; u.status['缴械'] = 99

@reg('傅肜断后层')
def _(b, u, ctx):
    n = min(3, u.flags.get('断后', 0) + 1); u.flags['断后'] = n; u.addbuff('def', .06 * n, -1, 'perm断后')

@reg('潘凤退场')
def _(b, u, ctx):
    t = ctx.get('tgt')
    if t and t.name == '华雄' and '潘凤' not in u.once: u.once.add('潘凤'); u.hp = 0; b.say('潘凤退场')

@reg('赵云追击率')
def _(b, u, ctx): u.flags['pursue'] = .03 * int((1 - u.ratio()) * 10)

# ---- 四件套变体 ----
@reg('关羽斩40')
def _(b, u, ctx):
    t = b.pick(u, 'hp_max')[0]
    if t.ratio() < .40 and '斩' not in u.once: u.once.add('斩'); b.apply(u, t, t.hp + 1, 'phys', '斩杀'); return
    b.damage(u, t, 2.6)
@reg('赵云七进七出4')
def _(b, u, ctx):
    t = ctx['tgt']; n = 0
    while t.alive() and n < 4:
        b.damage(u, t, 1.2, tag='pursue'); n += 1
        if t.ratio() >= .5: break
@reg('黄忠老当益壮15')
def _(b, u, ctx):
    t = b.pick(u, 'stat_min', stat='def')[0]
    u.addbuff('crit', .4, 1, '穿杨'); b.damage(u, t, 2.4 + min(1.2, .15 * (b.round - 1)), must_hit=True)
@reg('庞统连环4')
def _(b, u, ctx):
    ts = b.pick(u, 'random', 4)
    r = u.flags.get('连环比', .15); r = r if isinstance(r, float) else .15
    for t in ts: t.status['连环'] = 2; t.flags['连环组'] = ts; t.flags['连环比'] = r
    for t in ts: b.damage(u, t, 1.0, 'mag')
@reg('姜维九伐20')
def _(b, u, ctx):
    k = 'phys' if u.stat('atk') >= u.stat('int') else 'mag'
    m = 1.8 + min(1.2, .2 * u.flags.get('九伐', 0)); u.flags['九伐'] = u.flags.get('九伐', 0) + 1
    for t in b.pick(u, 'random', 2): b.damage(u, t, m, k)
@reg('许褚裸衣15')
def _(b, u, ctx):
    u.addbuff('def', -.15, 2, '裸衣'); u.flags['裸衣中'] = 2
    b.damage(u, b.pick(u, 'random')[0], 3.0 + u.flags.get('裸衣加', 0))
@reg('郭嘉遗计2')
def _(b, u, ctx):
    A = b.allies(u)
    for a in random.sample(A, min(2, len(A))): a.addbuff('rate', 1.0, 1, '遗计')
@reg('司马懿鹰视100')
def _(b, u, ctx):
    acc = u.flags.get('记账', 0); u.flags['记账中'] = False
    E = b.pick(u, 'all')
    if acc > 0:
        for t in E: b.damage(u, t, .7, 'mag'); b.apply(u, t, acc * 1.0 / max(1, len(E)), 'mag', '记账')
    else: b.damage(u, b.pick(u, 'random')[0], 2.5, 'mag')
@reg('邓艾阴平3')
def _(b, u, ctx):
    if b.round == 3:
        for t in b.pick(u, 'back', 3): b.damage(u, t, 2.0, ignore=.5)
@reg('孙策叠层8')
def _(b, u, ctx):
    n = min(8, u.flags.get('霸王', 0) + 1); u.flags['霸王'] = n; u.addbuff('atk', .04 * n, -1, 'perm霸王')
@reg('陆逊潜渊2')
def _(b, u, ctx):
    if b.round <= 2: u.addbuff('int', .03 * b.round, -1, 'perm潜渊'); return
    for t in b.pick(u, 'all'): b.damage(u, t, .7, 'mag'); t.add_status('灼烧', 3); t.flags['灼烧_src'] = (u, .02)
CUSTOM['_gates']['陆逊4'] = lambda b, u: b.round >= 3
@reg('吕布围攻2')
def _(b, u, ctx):
    k = ('围', b.round)
    if u.flags.get(k, 0) == 2: u.addbuff('atk', .15, 2, '三英')
@reg('华佗刮骨2')
def _(b, u, ctx):
    d = ctx['dead']; n = u.flags.get('刮骨n', 0)
    if n < 2: u.flags['刮骨n'] = n + 1; d.hp = d.maxhp * .3
@reg('王允互伤5')
def _(b, u, ctx):
    for x in u.flags.get('反目', ()):
        if x.alive(): b.apply(None, x, x.maxhp * .05, 'mag', '反目', true=True)

# ---- V0.2 关卡限制用 ----
@reg('反目自伤')
def _(b, u, ctx): b.apply(None, u, u.maxhp * .03, 'mag', '反目', true=True)
@reg('七擒回场')
def _(b, u, ctx):
    n = u.flags.get('回场', 0)
    if n < 7: u.flags['回场'] = n + 1; u.hp = u.maxhp * (0.7 - 0.1 * n); ctx['_revived'] = True; b.say(f'{u.name} 第 {n + 1} 次回场')
