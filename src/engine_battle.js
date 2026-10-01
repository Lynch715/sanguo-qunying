// 三国群英录 · 战斗引擎（从 sim/engine.py + sim/dsl.py + sim/skills_custom.py 逐行搬过来）
// 不碰 DOM。浏览器里挂在 window.SG，node 里 module.exports。
(function (G) {
'use strict';
const SG = G.SG = G.SG || {};

// ---------------- 随机数 ----------------
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function makeRng(seed) {
  const f = seed == null ? Math.random : mulberry32(seed);
  const R = {
    random: f,
    uniform: (a, b) => a + (b - a) * f(),
    choice: L => { if (!L.length) throw new IndexError('choice'); return L[Math.floor(f() * L.length)]; },
    sample: (L, n) => {
      if (n > L.length) throw new Error('sample larger than population');
      const c = L.slice(), out = [];
      for (let i = 0; i < n; i++) { const j = i + Math.floor(f() * (c.length - i)); const t = c[i]; c[i] = c[j]; c[j] = t; out.push(c[i]); }
      return out;
    },
    shuffle: L => { for (let i = L.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); const t = L[i]; L[i] = L[j]; L[j] = t; } return L; },
    randint: (a, b) => a + Math.floor(f() * (b - a + 1)),
  };
  return R;
}
// 战斗用的全局随机源，可以换成带种子的
let R = makeRng();
SG.setBattleSeed = s => { R = makeRng(s); SG.R = R; };
SG.makeRng = makeRng;
SG.R = R;

class IndexError extends Error { constructor(m) { super(m); this.name = 'IndexError'; } }
SG.IndexError = IndexError;
function first(L) { if (!L || !L.length) throw new IndexError('list index out of range'); return L[0]; }
function argmax(L, key) { if (!L.length) throw new Error('max() arg is an empty sequence'); let b = L[0], bk = key(b); for (let i = 1; i < L.length; i++) { const k = key(L[i]); if (k > bk) { b = L[i]; bk = k; } } return b; }
function argmin(L, key) { if (!L.length) throw new Error('min() arg is an empty sequence'); let b = L[0], bk = key(b); for (let i = 1; i < L.length; i++) { const k = key(L[i]); if (k < bk) { b = L[i]; bk = k; } } return b; }
function sortBy(L, key) { const m = L.map((x, i) => [key(x), i, x]); m.sort((a, b) => a[0] - b[0] || a[1] - b[1]); return m.map(x => x[2]); }
function pyRound(x) { const r = Math.round(x); return (Math.abs(x % 1) === 0.5 && r % 2 !== 0) ? r - 1 : r; }
SG.util = { first, argmax, argmin, sortBy, pyRound };

const BASE = 0.30, GAMMA = 2.0;
const CTRL = ['震慑', '混乱', '缴械', '计穷', '怯战', '挑衅', '迷惑'];
const STARK = { 1: 0, 2: .05, 3: .10, 4: .15, 5: .20 };
SG.CTRL = CTRL;

// ---------------- Unit ----------------
class Unit {
  constructor(h, lv = 50, star = 1) {
    this.name = h['名']; this.faction = h['阵营']; this.role = h['定位']; this.tier = h['品阶'];
    const g = (k, gk) => (parseFloat(h[k]) + parseFloat(h[gk]) * (lv - 1)) * (1 + STARK[star]);
    this.base = { atk: g('武力', '武成长'), def: g('统率', '统成长'), int: g('智力', '智成长'), agi: g('速度', '速成长') };
    this.lv = lv; this.star = star;
    this.maxhp = lv * 1000.0; this.hp = this.maxhp; this.lvhp = this.maxhp;
    this.buffs = []; this.status = {}; this.shield = 0.0;
    this.skill = null; this.extras = []; this.equip = [];
    this.prep = null; this.flags = {};
    this.team = null; this.side = 0; this.idx = 0; this.battle = null;
    this.taunt_by = null; this.hidden = 0; this.once = new Set();
    this.tally = { dealt: 0, taken: 0, healed: 0 };
  }
  alive() { return this.hp > 0; }
  front() { return this.idx < 3; }
  stat(k) {
    let pct = 0; for (const b of this.buffs) if (b[0] === k) pct += b[1];
    pct = Math.max(-0.30, Math.min(0.25, pct));
    let flat = 0, epct = 0;
    for (const e of this.equip) {
      if (e['维'] === k) {
        flat += parseFloat(e['固定']) * (e['归属'] === this.name ? 1.5 : 1.0);
        epct += parseFloat(e['百分比']) / 100;
      }
    }
    return (this.base[k] + flat) * (1 + pct + epct);
  }
  addbuff(k, pct, rounds = -1, tag = null) {
    if (rounds > 0 && SG.REND_FIX && this.battle && this.battle.inRend) rounds += 1;   // V0.7：回合末加的效果要撑到下一回合
    if (tag) { for (const b of this.buffs) if (b[3] === tag) { b[1] = pct; b[2] = rounds; return; } }
    this.buffs.push([k, pct, rounds, tag]);
  }
  flag(k) {
    let s = 0; for (const b of this.buffs) if (b[0] === k) s += b[1];
    const v = this.flags[k];
    if (typeof v === 'number') s += v; else if (v === true) s += 1;
    return s;
  }
  has(s) { return (this.status[s] || 0) > 0; }
  add_status(s, rounds, prob = 1.0, src = null) {
    const b = this.battle;
    if (CTRL.includes(s) && src != null) {
      prob = Math.min(0.95, (prob + src.flag('ctrlhit')) * Math.sqrt(Math.max(0.2, src.stat('int') / Math.max(1, this.stat('int')))));
    }
    if (b.hook_all('resist_status', this, s)) return false;
    if (s === '隐身') { this.hidden = Math.max(this.hidden, rounds + (SG.REND_FIX && b.inRend ? 1 : 0)); return true; }
    if (s === '挑衅' && this.flags['immune_taunt']) return false;
    if (s === '震慑' && this.flags['吓死']) { this.hp = 0; b.say(`${this.name} 吓死`, { t: 'die', u: this }); return true; }
    if (R.random() < prob) {
      let r = CTRL.includes(s) ? rounds + Math.trunc(pyRound(this.flag('ctrllen'))) : rounds;
      if (CTRL.includes(s)) r = Math.max(1, r);
      if (SG.REND_FIX && b.inRend) r += 1;
      this.status[s] = Math.max(this.status[s] || 0, r);
      b.say(`${this.name} ${s}`, { t: 'st', u: this, s, n: this.status[s], by: src });
      if ((s === '震慑' || s === '混乱' || s === '计穷') && this.prep && !this.flags['prep_unbreak']) this.prep = null;
      return true;
    }
    if (src && b.log) b.say(`${this.name} 抵抗 ${s}`, { t: 'resist', u: this, s, p: prob, by: src });
    return false;
  }
  cleanse() { for (const s of CTRL) delete this.status[s]; }
  dispel() {
    this.buffs = this.buffs.filter(b => b[1] < 0 || (b[2] === -1 && b[3] && b[3].startsWith('perm')));
    this.shield = 0;
  }
  ratio() { return this.hp / this.maxhp; }
}
SG.Unit = Unit;


// ---- 羁绊（V0.3）：同一方阵上凑齐给满、四人以上凑半数给一半；每人每项合计封顶 12% ----
SG.BONDS = [];
SG.BOND_ON = true;
const BOND_CAP = 0.12;
function bondTier(n, c) { if (c >= n) return 1; if (n >= 4 && c >= Math.max(2, Math.ceil(n / 2))) return 0.5; return 0; }
function activeBonds(names) {
  const s = new Set(names), out = [];
  for (const b of SG.BONDS) { const c = b.mem.filter(m => s.has(m)).length; const t = bondTier(b.mem.length, c); if (t) out.push({ b, t, c }); }
  return out;
}
function applyBonds(team) {
  const act = activeBonds(team.map(u => u.name));
  for (const u of team) {
    const tot = {};
    for (const { b, t } of act) if (b.mem.includes(u.name)) tot[b.k] = (tot[b.k] || 0) + b.v * t;
    for (const k in tot) u.addbuff(k, Math.min(BOND_CAP, tot[k]), -1, 'perm羁绊' + k);
  }
  return act;
}
SG.bondTier = bondTier; SG.activeBonds = activeBonds; SG.applyBonds = applyBonds;
SG.setBonds = rows => { SG.BONDS = rows.map(r => ({ name: r['名'], mem: r['成员'].split(/\s+/), k: r['属性'], v: parseFloat(r['满值']) / 100, cat: r['类别'], txt: r['说明'] || '' })); };

// ---- 速度（V0.6）：比对方快多少，攻方吃暴击、守方吃闪避；只算速度差，不吃等级 ----
SG.AGI = { k: .2, crit: .08, dodge: .05 };   // 对照 Python 时设 k=0
function agiEdge(me, other, kind) {
  const A = SG.AGI; if (!A.k || !other) return 0;
  const a = me.stat('agi'), o = Math.max(1, other.stat('agi'));
  return Math.max(0, Math.min(A[kind], (a - o) / o * A.k));
}
SG.agiEdge = agiEdge;

// ---------------- Battle ----------------
const SUBJECT = new Set(['on_hit_taken', 'after_hit', 'after_attack', 'on_death', 'on_kill', 'round_end_unit', 'on_dodge', 'mod_in', 'mod_out', 'choose_target', 'on_lethal']);
function _count_hits(u, src, dmg, kind, tag) { const b = u.battle; const k = '挨|' + b.round; u.flags[k] = (u.flags[k] || 0) + 1; }
const GLOBAL_HOOKS = { on_hit_taken: _count_hits };
const GLOBAL_HOOKS_EXTRA = {};   // skills_custom 的 _global
SG.GLOBAL_HOOKS_EXTRA = GLOBAL_HOOKS_EXTRA;

class Battle {
  constructor(A, B, log = false) {
    this.teams = [A, B]; this._all = A.concat(B); this.round = 0; this.stats = { kills: [], counter: [0, 0] }; this.log = log; this.lines = []; this.events = []; this.flags_round = {};
    this.teams.forEach((t, s) => t.forEach((u, i) => { u.team = t; u.side = s; u.idx = i; u.battle = this; }));
    this.hooks = [];
    for (const u of A.concat(B)) {
      for (const ev in GLOBAL_HOOKS) this.hooks.push([ev, u, GLOBAL_HOOKS[ev]]);
      for (const ev in GLOBAL_HOOKS_EXTRA) this.hooks.push([ev, u, GLOBAL_HOOKS_EXTRA[ev]]);
      for (const sk of (u.skill ? [u.skill] : []).concat(u.extras)) {
        if (sk && sk.hooks) for (const ev in sk.hooks) { const fn = sk.hooks[ev]; if (fn) this.hooks.push([ev, u, fn]); }
      }
    }
  }
  say(s, ev) {
    if (!this.log) return;
    this.lines.push(`[${this.round}] ${s}`);
    if (ev) {
      ev.r = this.round; ev.txt = s;
      ev.snap = this._all.map(u => [u.hp > 0 ? u.hp : 0, u.maxhp, u.shield]);
      ev.sts = this._all.map(u => { const k = Object.keys(u.status).filter(x => u.status[x] > 0); if (u.hidden > 0 && !k.includes('隐身')) k.push('隐身'); if (u.prep) k.push('准备'); return k; });
      this.events.push(ev);
    }
  }
  hook_all(ev, ...a) {
    let r = null; const subj = SUBJECT.has(ev);
    for (const [e, u, fn] of this.hooks) {
      if (e !== ev) continue;
      let x;
      if (subj) {
        if (a[0] !== u || (!u.alive() && ev !== 'on_death' && ev !== 'on_lethal')) continue;
        x = fn(u, ...a.slice(1));
      } else {
        if (!u.alive()) continue;
        x = fn(u, ...a);
      }
      if (x) r = x;
    }
    return r;
  }
  enemies(u) { return this.teams[1 - u.side].filter(x => x.alive()); }
  allies(u) { return this.teams[u.side].filter(x => x.alive()); }
  targetable(u) { const E = this.enemies(u); const T = E.filter(x => x.hidden <= 0); return T.length ? T : E; }
  damage(src, tgt, mult, kind = 'phys', ignore = 0.0, must_hit = false, tag = 'skill') {
    if (!tgt.alive()) return 0;
    if (SG.FX7 && tag === 'pursue' && src.flags['pursue_ig']) ignore = Math.max(ignore, src.flags['pursue_ig']);   // 赵云青釭剑
    if (!must_hit && R.random() < tgt.flag('dodge') + agiEdge(tgt, src, 'dodge')) { this.say(`${tgt.name} 闪避了 ${src.name}`, { t: 'dodge', u: tgt, s: src }); this.hook_all('on_dodge', tgt, src); return 0; }
    const A = kind === 'phys' ? src.stat('atk') : src.stat('int');
    let D = kind === 'phys' ? tgt.stat('def') : 0.5 * tgt.stat('int') + 0.5 * tgt.stat('def');
    D *= (1 - ignore);
    const m = mult * ((kind === 'mag' && tag === 'attack') ? 0.9 : 1.0);
    let dmg = src.lvhp * (0.5 + 0.5 * src.ratio()) * BASE * m * Math.pow(A / (A + D), GAMMA) * R.uniform(0.85, 1.15);
    dmg *= (1 + src.flag('dmgout')) * (1 + tgt.flag('dmgin'));
    if (kind === 'mag') dmg *= (1 + tgt.flag('magin')); else dmg *= (1 + tgt.flag('physin'));
    if (tag === 'pursue') dmg *= (1 + tgt.flag('pursuein'));
    for (const [mode, who, pct] of (src.flags['vs'] || [])) if (mode === 'vs' && (tgt.faction === who || tgt.tier === who)) dmg *= (1 + pct);
    for (const [mode, who, pct] of (tgt.flags['vs'] || [])) if (mode === 'vsin' && (src.faction === who || src.tier === who)) dmg *= (1 + pct);
    let x = this.hook_all('mod_out', src, tgt, kind, tag); if (x) dmg *= x;
    x = this.hook_all('mod_in', tgt, src, kind, tag); if (x) dmg *= x;
    if (kind === 'mag') dmg *= (1 + src.flag('magout'));
    else dmg *= (1 + src.flag('physout'));   // V0.3 天象太白；sim 里没有这个口子，恒为 0
    if (tag === 'pursue') dmg *= (1 + src.flag('pursueout'));
    if (tgt.prep) dmg *= (1 - (tgt.flags['prep_guard'] || 0));
    let crit = false;
    if (R.random() < src.flag('crit') + agiEdge(src, tgt, 'crit')) { dmg *= (src.flags['critmul'] != null ? src.flags['critmul'] : 1.5); crit = true; }
    return this.apply(src, tgt, dmg, kind, tag, false, crit);
  }
  apply(src, tgt, dmg, kind = 'phys', tag = 'skill', trueDmg = false, crit = false) {
    if (!tgt.alive()) return 0;
    const sub = this.hook_all('substitute', tgt, src, kind, tag);
    if (sub && sub !== tgt && sub.alive()) {
      this.say(`${sub.name} 替 ${tgt.name} 挡下`, { t: 'sub', u: sub, v: tgt });
      sub.flags['_subbing'] = true;   // V0.6：替挡这一击里，subbed 条件成立（典韦短戟囊）
      try { return this.apply(src, sub, dmg * (sub.flags['sub_mul'] != null ? sub.flags['sub_mul'] : 1.0), kind, tag, trueDmg, crit); }
      finally { sub.flags['_subbing'] = false; }
    }
    const hp0 = tgt.hp, tot = dmg; let ab = 0;
    if (!trueDmg && tgt.shield > 0) {
      const a = Math.min(tgt.shield, dmg); tgt.shield -= a; dmg -= a; ab = a;
      if (tgt.shield <= 0) this.hook_all('shield_broken', tgt);
    }
    tgt.hp -= dmg;
    tgt.tally.taken += tot; if (src) src.tally.dealt += tot;
    this.say(`${src ? src.name : '-'} → ${tgt.name} ${Math.trunc(tot)} (${tag})`, { t: 'hit', s: src, u: tgt, d: tot, ab, h0: hp0, h1: Math.max(0, tgt.hp), k: kind, g: tag, c: crit });
    if (src && tag === '反击') this.stats.counter[src.side]++;
    if (src) this.hook_all('after_hit', src, tgt, dmg, kind, tag);
    this.hook_all('on_hit_taken', tgt, src, dmg, kind, tag, ab);   // ab：护盾挡下的量（V0.7，反弹用）
    if (tgt.hp <= 0) {
      tgt.hp = 0;
      if (!this.hook_all('on_lethal', tgt, src) && !this.hook_all('on_lethal_any', tgt, src)) {
        this.say(`${tgt.name} 退场`, { t: 'die', u: tgt });
        this.stats.kills.push([src ? src.name : null, tgt.name, tgt.side, tag]);   // 功名用
        this.hook_all('on_death', tgt, src);
        for (const [e, u, fn] of this.hooks) {
          if (e === 'on_ally_death' && u.alive() && u.side === tgt.side && u !== tgt) fn(u, tgt, src);
          if (e === 'on_enemy_death' && u.alive() && u.side !== tgt.side) fn(u, tgt, src);
        }
        if (src) this.hook_all('on_kill', src, tgt);
      }
    }
    return dmg;
  }
  heal(src, tgt, pct) {
    if (!tgt.alive()) return;
    const amt = tgt.maxhp * pct * (1 + (src ? src.flag('healout') : 0));
    const hp0 = tgt.hp;
    if (tgt.has('诅咒')) { tgt.hp -= amt; this.say(`${tgt.name} 诅咒 −${Math.trunc(amt)}`, { t: 'hit', u: tgt, d: amt, ab: 0, h0: hp0, h1: Math.max(0, tgt.hp), g: '诅咒' }); return; }
    tgt.hp = Math.min(tgt.maxhp, tgt.hp + amt);
    if (src) src.tally.healed += tgt.hp - hp0;
    this.say(`${tgt.name} 回兵 ${Math.trunc(amt)}`, { t: 'heal', u: tgt, d: tgt.hp - hp0, h0: hp0, h1: tgt.hp, s: src });
  }
  shieldUp(tgt, pct, src = null) { const v = tgt.maxhp * pct * (1 + (src ? src.flag('shieldout') : 0)); tgt.shield = Math.max(tgt.shield, v); this.say(`${tgt.name} 护盾`, { t: 'shield', u: tgt, d: tgt.shield }); }
  pick(u, sel = 'random', n = 1, stat = null) {
    const E = this.targetable(u);
    if (!E.length) return [];
    if (sel === 'random') return R.sample(E, Math.min(n, E.length));
    if (sel === 'all') return E.slice();
    if (sel === 'hp_max') return sortBy(E, x => -x.hp).slice(0, n);
    if (sel === 'hp_min') return sortBy(E, x => x.hp).slice(0, n);
    if (sel === 'stat_max') return sortBy(E, x => -x.stat(stat)).slice(0, n);
    if (sel === 'stat_min') return sortBy(E, x => x.stat(stat)).slice(0, n);
    if (sel === 'front') { const F = E.filter(x => x.front()).slice(0, n); return F.length ? F : E.slice(0, n); }
    if (sel === 'back') return sortBy(E, x => x.stat('agi')).slice(0, n);
    return E.slice(0, n);
  }
  ally_pick(u, sel = 'hp_min', n = 1) {
    const A = this.allies(u);
    if (sel === 'hp_min') return sortBy(A, x => x.ratio()).slice(0, n);
    if (sel === 'random') return R.sample(A, Math.min(n, A.length));
    if (sel === 'all') return A;
    if (sel === 'front') return A.filter(x => x.front());
    if (sel === 'self') return [u];
    return A.slice(0, n);
  }
  attack_target(u) {
    if (u.has('挑衅') && u.taunt_by && u.taunt_by.alive()) return u.taunt_by;
    if (u.has('迷惑')) { const A = this.allies(u).filter(x => x !== u); return A.length ? R.choice(A) : null; }
    if (u.has('混乱')) { const pool = this.allies(u).concat(this.enemies(u)).filter(x => x !== u); return pool.length ? R.choice(pool) : null; }
    const r = this.hook_all('choose_target', u); if (r) return r;
    const na = u.flags['noattack'];
    let E = this.targetable(u).filter(x => !(na && na.has(x.name)));
    if (!E.length) E = this.targetable(u);
    if (!E.length) return null;
    if (SG.FX7 && u.flags['anytarget']) return R.choice(E);   // 黄忠宝雕弓：普攻可打任意目标
    const F = E.filter(x => x.front());
    return (F.length && R.random() < 0.7) ? R.choice(F) : R.choice(E);
  }
  normal_attack(u) {
    if (u.has('缴械')) return;
    if (u.flags['桥窄']) { const k = '桥|' + this.round; if (this.flags_round[k]) return; this.flags_round[k] = true; }
    const t = this.attack_target(u);
    if (!t) return;
    let kind = u.stat('int') > u.stat('atk') ? 'mag' : 'phys';
    if (u.flags['atk_kind'] && u.flags['atk_kind'] !== 'best') kind = u.flags['atk_kind'];   // best = 默认就取高的
    const mult = 1.0 + u.flag('atkmult');
    this.say(`${u.name} 普攻`, { t: 'atk', u, v: t });
    this.damage(u, t, mult, kind, u.flags['ignore'] || 0, u.flags['must_hit'] || false, 'attack');
    this.hook_all('after_attack', u, t);
    if (u.flags['double_attack'] && t.alive()) this.damage(u, t, mult, kind, 0, false, 'attack');
    const sk = u.skill;
    if ((sk && sk.type === '追击' && !u.has('怯战') && !u.has('缴械') && t.alive()) || (sk && sk.type === '追击' && sk.other && !u.has('怯战'))) {
      const rate = sk.rate + u.flag('pursue');
      if (R.random() < rate) { this.say(`${u.name} 追击 ${sk.name}`, { t: 'skill', u, n: sk.dname || sk.name, how: '追击', sk }); SG.count(sk); sk.fn(this, u, t); }
    }
  }
  act(u) {
    if (!u.alive()) return;
    if (u.has('震慑')) { this.say(`${u.name} 震慑中`, { t: 'skip', u }); return; }
    const sk = u.skill;
    // V0.6：每回合先掷主动技，再普攻（SG.BOTH）；关掉就是老规矩：发了技能这回合不普攻
    const both = SG.BOTH;
    if (u.prep) { const f = u.prep; u.prep = null; this.say(`${u.name} 结算 ${sk.name || '技'}`, { t: 'skill', u, n: sk.dname || sk.name, how: '结算', sk }); SG.count(sk); f(this, u); if (!both) return; }
    else if (sk && (sk.type === '主动·瞬发' || sk.type === '主动·准备') && !u.has('计穷') && !u.flags['no_active']) {
      let rate = sk.rate + u.flag('rate');
      if (sk.first_round && this.round === 1) rate = 1.0;
      if (sk.gate && !sk.gate(this, u)) rate = 0;
      if (R.random() < rate) {
        if (sk.type === '主动·准备' && !u.flags['no_prep']) {
          u.prep = sk.fn; this.say(`${u.name} 准备 ${sk.name || '技'}`, { t: 'prep', u, n: sk.dname || sk.name, sk }); this.hook_all('on_prepare', u); if (!both) return;
        } else { this.say(`${u.name} 发动 ${sk.name || '技'}`, { t: 'skill', u, n: sk.dname || sk.name, how: '发动', sk }); SG.count(sk); sk.fn(this, u); if (!both) return; }
      }
    }
    if (!u.alive() || u.has('震慑')) return;
    if (!this.teams[0].some(x => x.alive()) || !this.teams[1].some(x => x.alive())) return;
    this.normal_attack(u);
  }
  run(max_rounds = 30) {
    const all = this.teams[0].concat(this.teams[1]);
    this.say('开战', { t: 'start' });
    if (this.log) for (const u of all) if (u.equip && u.equip.length) this.say(`${u.name} 整备`, { t: 'gear', u });
    if (SG.BOND_ON) this.teams.forEach((t, side) => {
      if (this.nobond && this.nobond[side]) return;
      const act = applyBonds(t);
      for (const a of act) this.say(`${a.b.name}`, { t: 'bond', side, n: a.b.name, k: a.b.k, v: a.b.v * a.t, full: a.t === 1, mem: a.b.mem.filter(m => t.some(u => u.name === m)) });
    });
    for (const u of all) if (SG.PAS_ATK && !u.flags['_pas'] && u.skill && /^(指挥|被动|兵种)/.test(u.skill.type)) { u.flags['_pas'] = 1; u.flags['atkmult'] = (u.flags['atkmult'] || 0) + SG.PAS_ATK; }   // 车轮战同一批人连打几阵，只加一次
    for (const u of all) for (const sk of (u.skill ? [u.skill] : []).concat(u.extras)) if (sk.setup) sk.setup(this, u);
    for (const u of all) {
      for (const sk of (u.skill ? [u.skill] : []).concat(u.extras)) {
        if ((sk.type === '指挥' || sk.type === '兵种' || sk.type === '被动') && sk.fn && sk !== u.skill) sk.fn(this, u);
      }
      if (u.skill && (u.skill.type === '指挥' || u.skill.type === '兵种') && u.skill.fn) { this.say(`${u.name} ${u.skill.type}`, { t: 'skill', u, n: u.skill.dname || u.skill.name, how: u.skill.type, sk: u.skill }); u.skill.fn(this, u); }
    }
    for (let r = 1; r <= max_rounds; r++) {
      this.round = r;
      this.say(`第 ${r} 回合`, { t: 'round' });
      this.hook_all('round_start', null);
      const alive = all.filter(u => u.alive());
      const order = sortBy(alive, u => -(u.stat('agi') + R.random() * 5));
      this.order = order;
      for (const u of order) {
        if (!u.alive()) continue;
        try { this.act(u); } catch (e) { if (!(e instanceof IndexError)) throw e; }
        if (!this.teams[0].some(x => x.alive()) || !this.teams[1].some(x => x.alive())) break;
      }
      this.inRend = true;
      const tick = u => {
        for (const k of Object.keys(u.status)) { u.status[k] -= 1; if (u.status[k] <= 0) delete u.status[k]; }
        u.buffs = u.buffs.filter(b => b[2] === -1 || b[2] > 1);
        for (const b of u.buffs) if (b[2] > 0) b[2] -= 1;
        if (u.hidden > 0) u.hidden -= 1;
      };
      for (const u of all) {
        if (!u.alive()) continue;
        for (const s of ['灼烧', '中毒']) {
          if (u.has(s)) {
            const [srcu, per] = u.flags[s + '_src'] || [null, 0.03];
            const k = (srcu != null && srcu.alive()) ? (0.5 + 0.5 * srcu.ratio()) : 0.5;
            if (s === '灼烧') this.apply(null, u, u.maxhp * per * k * (1 + u.flag('burnin')), 'mag', s);
            else this.apply(null, u, u.maxhp * per * k, 'mag', s, true);
          }
        }
        this.hook_all('round_end_unit', u);
        if (this.regen && this.regen[u.side] && u.alive()) this.heal(null, u, this.regen[u.side]);   // V0.3 天象紫微
        if (!SG.REND_FIX) tick(u);
      }
      if (SG.REND_FIX) for (const u of all) if (u.alive()) tick(u);   // V0.7：先让所有人的回合末效果都结算完，再统一扣回合
      this.inRend = false;
      this.hook_all('round_end', null);
      const a = this.teams[0].some(x => x.alive()), b = this.teams[1].some(x => x.alive());
      if (!b) { this.say('胜', { t: 'end', w: 0 }); return [0, r]; }
      if (!a) { this.say('败', { t: 'end', w: 1 }); return [1, r]; }
    }
    this.say('平', { t: 'end', w: -1, r: max_rounds });
    return [-1, max_rounds];
  }
}
Battle.prototype.shield = Battle.prototype.shieldUp;
SG.Battle = Battle;

// 统计钩子（对照测试用）
SG.counts = null;
SG.FX7 = true;
SG.BOTH = true;   // V0.6：每回合技能和普攻都有
SG.SET4_BONUS = 6;   // V0.7 四件通用加成（%）：主属性、统率各 +6
SG.PAS_ATK = .2;     // V0.7 技能是指挥、被动、兵种的将领，普攻 +20%
SG.REND_FIX = true;  // V0.7：回合末加的 1 回合效果原来当场就被清掉（对照 Python 时关掉）
// ↑ FX7：设计_装备数值 五.5 那七条单件特效（sim 里没做，JS 里补上；对照测试时关掉）
SG.count = sk => { if (SG.casts) { const k = sk.cname || sk.name; SG.casts[k] = (SG.casts[k] || 0) + 1; } };

// ---------------- 技能小语法 ----------------
const TRIGS = new Set(['hit', 'maghit', 'death', 'allydeath', 'enemydeath', 'kill', 'atk', 'rend', 'rstart', 'eprep', 'lethal', 'sbreak', 'dodge', 'setup', 'myprep', 'dealt']);
function _num(x) { const v = Number(x); return (x.trim() !== '' && !isNaN(v)) ? v : x; }
function parse_line(line) {
  const i = line.indexOf('|');
  const head = (i < 0 ? line : line.slice(0, i)).trim();
  const body = (i < 0 ? '' : line.slice(i + 1)).trim();
  const m = /^(指挥|兵种|被动|瞬发|准备|追击)\s*(\d+)?(f)?/.exec(head);
  if (!m) throw new Error('类型不认得: ' + head);
  const typ = m[1], rate = m[2] ? parseInt(m[2]) / 100 : null, fst = !!m[3];
  const effs = [];
  for (let e of body.split(';').map(x => x.trim()).filter(x => x)) {
    let trig = null;
    const mm = /^(\w+):([\s\S]*)$/.exec(e);
    if (mm && TRIGS.has(mm[1])) { trig = mm[1]; e = mm[2].trim(); }
    const j = e.indexOf('@');
    const conds = [];   // V0.7 修：inany:甲,乙 这种名单里的逗号原来会被当成条件分隔，只认第一个名字；中文开头的片段并回上一条
    for (const c of (j < 0 ? '' : e.slice(j + 1)).split(',').map(c => c.trim()).filter(c => c)) { if (conds.length && /^[^\x00-\x7f]/.test(c)) conds[conds.length - 1] += ',' + c; else conds.push(c); }
    if (j >= 0) e = e.slice(0, j);
    const m2 = /^(\w+)\((.*)\)/.exec(e.trim());
    if (!m2) throw new Error('效果写法不对: ' + e);
    const args = m2[2].split(',').map(a => a.trim()).filter(a => a);
    effs.push({ trig, op: m2[1], args, conds });
  }
  return { type: typ, rate, first: fst, effs };
}
SG.parse_line = parse_line;

const TIER_ORDER6 = ['卒', '校', '骁', '名', '虎', '无双'];
function targets(b, u, T, ctx) {
  const E = b.targetable(u), A = b.allies(u);
  if (T === 'self') return [u];
  if (T === 'last') return (ctx.last || []).filter(x => x.alive());
  if ((T in ctx) && ctx[T] != null) return Array.isArray(ctx[T]) ? ctx[T] : [ctx[T]];
  if (T === 'other') { if (!E.length) return []; const o = E.filter(e => e !== ctx.tgt); return [R.choice(o.length ? o : E)]; }
  if (T[0] === 'e') {
    if (!E.length) return [];
    if (T === 'e1') return R.sample(E, 1);
    if (T === 'e2' || T === 'e3' || T === 'e4' || T === 'e5') return R.sample(E, Math.min(+T[1], E.length));
    if (T === 'eatk2') return sortBy(E, x => -x.stat('atk')).slice(0, 2);
    if (T === 'eall') return E.slice();
    if (T === 'ehpmax') return [argmax(E, x => x.hp)];
    if (T === 'ehpmin') return [argmin(E, x => x.hp)];
    if (T === 'eatkmax') return [argmax(E, x => x.stat('atk'))];
    if (T === 'edefmax') return [argmax(E, x => x.stat('def'))];
    if (T === 'eintmax') return [argmax(E, x => x.stat('int'))];
    if (T === 'eintmin') return [argmin(E, x => x.stat('int'))];
    if (T === 'edefmin') return [argmin(E, x => x.stat('def'))];
    if (T === 'eagimax') return [argmax(E, x => x.stat('agi'))];
    if (T === 'eagimin') return [argmin(E, x => x.stat('agi'))];
    if (T === 'eback2') return sortBy(E, x => x.stat('agi')).slice(0, 2);
    if (T === 'efront3') { const F = E.filter(x => x.front()).slice(0, 3); return F.length ? F : E.slice(0, 3); }
    if (T.startsWith('e:')) return b.enemies(u).filter(x => x.name === T.slice(2));
    if (T.startsWith('eside:')) return E.filter(x => x.faction === T.slice(6));
    if (T.startsWith('erole:')) { const L = E.filter(x => x.role === T.slice(6)).slice(0, 1); return L.length ? L : R.sample(E, 1); }
    if (T === 'eratemax') { const L = E.filter(x => x.skill && x.skill.rate); return L.length ? [argmax(L, x => x.skill.rate)] : []; }
  }
  if (T[0] === 'a') {
    if (!A.length) return [];
    if (T === 'a1') return R.sample(A, 1);
    if (T === 'a2') return R.sample(A, Math.min(2, A.length));
    if (T === 'aall') return A.slice();
    if (T === 'ahpmin') return [argmin(A, x => x.ratio())];
    if (T === 'ahpmin2') return sortBy(A, x => x.ratio()).slice(1, 2);
    if (T === 'ahpmax') return [argmax(A, x => x.hp)];
    if (T === 'afront3') return A.filter(x => x.front());
    if (T === 'aagimax') return [argmax(A, x => x.stat('agi'))];
    if (T.startsWith('a:')) return A.filter(x => x.name === T.slice(2));
    if (T.startsWith('aside:')) return A.filter(x => x.faction === T.slice(6));
    if (T.startsWith('arole:')) return A.filter(x => x.role === T.slice(6));
    if (T.startsWith('awen:')) return A.filter(x => x.faction === T.slice(5) && x.role === '文臣');
    if (T.startsWith('atier:')) { const k = TIER_ORDER6.indexOf(T.slice(6).replace(/\+$/, '')); return A.filter(x => TIER_ORDER6.indexOf(x.tier) >= k); }
  }
  return [];
}

function cond_ok(b, u, conds, ctx) {
  const ok = _cond_ok(b, u, conds, ctx);
  if (ok && SG.counts && ctx._eid) { const k = ctx._eid.split('#')[0]; SG.counts[k] = (SG.counts[k] || 0) + 1; }
  return ok;
}
function _cond_ok(b, u, conds, ctx) {
  for (const c of conds) {
    if (c === 'first') { if (b.round !== 1) return false; }
    else if (c === 'once') {
      const key = 'once|' + ctx._eid;
      const lim = (SG.FX7 && ctx._trig === 'lethal' && typeof u.flags['免死次数'] === 'number') ? u.flags['免死次数'] : 1;   // 左慈遁甲天书
      if (lim > 1) { const n = u.flags['#' + key] || 0; if (n >= lim) return false; u.flags['#' + key] = n + 1; u.once.add(key); }
      else { if (u.once.has(key)) return false; u.once.add(key); }
    }
    else if (c === 'every3') { if (b.round % 3) return false; }
    else if (c === 'every2') { if (b.round % 2) return false; }
    else if (c === 'notfirst') { if (b.round === 1) return false; }
    else if (c === 'hidden') { if (u.hidden <= 0) return false; }
    else if (c === 'front') { if (!u.front()) return false; }
    else if (c === 'back') { if (u.front()) return false; }
    else if (c === 'nlt') { if (!(b.allies(u).length < b.enemies(u).length)) return false; }
    else if (c === 'nge') { if (!(b.allies(u).length > b.enemies(u).length)) return false; }
    else if (c === 'nlt4') { if (!(b.allies(u).length < 4)) return false; }
    else if (c === 'fastest') { if (argmax(b.teams[0].concat(b.teams[1]).filter(x => x.alive()), x => x.stat('agi')) !== u) return false; }
    else if (c === 'nohit') { if ((u.flags['挨|' + b.round] || 0) > 0) return false; }
    else if (c === 'wasfirst') { if (!b.order || !b.order.length || b.order[0] !== u) return false; }
    else if (c === 'notwasfirst') { if (b.order && b.order.length && b.order[0] === u) return false; }
    else if (c === 'faclt3') { if (b.allies(u).filter(a => a.faction === u.faction).length >= 3) return false; }
    else if (c === 'every3r1') { if (b.round % 3 !== 1) return false; }
    else if (c === 'subbed') { if (!u.flags['_subbing']) return false; u.flags['_subbing'] = false; }   // 用一次就清，防反击来回弹
    else if (c === 'shielded') { if (u.shield <= 0) return false; }
    else if (c === 'fasterthan') { if (!(ctx.tgt && u.stat('agi') > ctx.tgt.stat('agi'))) return false; }
    else if (c === 'notfasterthan') { if (ctx.tgt && u.stat('agi') > ctx.tgt.stat('agi')) return false; }
    else if (c.startsWith('tgthp>')) { if (!(ctx.tgt && ctx.tgt.ratio() > parseInt(c.slice(6)) / 100)) return false; }
    else if (c.startsWith('allyfac:')) { if (!b.allies(u).some(a => a.faction === c.slice(8))) return false; }
    else if (c.startsWith('lastis:')) { if (!(ctx.last || []).some(t => t.name === c.slice(7))) return false; }
    else if (c.startsWith('tgtin:')) { const L = c.slice(6).split(','); if (!(ctx.last || []).some(t => L.includes(t.name))) return false; }
    else if (c === 'lastintlt') { if (!(ctx.last && ctx.last.length && ctx.last[0].stat('int') < u.stat('int'))) return false; }
    else if (c.startsWith('inany:')) { const L = c.slice(6).split(','); if (!b.allies(u).some(a => L.includes(a.name))) return false; }
    else if (c.startsWith('notinany:')) { const L = c.slice(9).split(','); if (b.allies(u).some(a => L.includes(a.name))) return false; }
    else if (c.startsWith('vs:') || c.startsWith('vsin:')) { /* buff 里处理 */ }
    else if (c.startsWith('in:')) { if (!b.allies(u).some(a => a.name === c.slice(3))) return false; }
    else if (c.startsWith('notin:')) { if (b.allies(u).some(a => a.name === c.slice(6))) return false; }
    else if (c.startsWith('en:')) { if (!b.enemies(u).some(e => e.name === c.slice(3))) return false; }
    else if (c.startsWith('fac>=')) { if (b.allies(u).filter(a => a.faction === u.faction).length < parseInt(c.slice(5))) return false; }
    else if (c[0] === 'r') {
      const m = /^r(<=|>=|==|<|>)(\d+)/.exec(c); const n = parseInt(m[2]), op = m[1], rr = b.round;
      if (!({ '<=': rr <= n, '>=': rr >= n, '==': rr === n, '<': rr < n, '>': rr > n }[op])) return false;
    }
    else if (c.startsWith('hp')) { const m = /^hp(<|>)(\d+)/.exec(c); const p = parseInt(m[2]) / 100; if (!(m[1] === '<' ? u.ratio() < p : u.ratio() > p)) return false; }
    else if (c.startsWith('tgt:')) { const t = ctx.tgt; if (!t || t.name !== c.slice(4)) return false; }
    else if (c.startsWith('src:')) { const t = ctx.src; const w = c.slice(4); if (!t || (t.name !== w && t.faction !== w && t.tier !== w)) return false; }
    else if (c.startsWith('srckind:')) { if (ctx.kind !== c.slice(8)) return false; }
    else if (c.startsWith('srctag:')) { if (ctx.tag !== c.slice(7)) return false; }
  }
  return true;
}

function run_effect(b, u, eff, ctx) {
  const op = eff.op, a = eff.args;
  if (!cond_ok(b, u, eff.conds, ctx)) return;
  if (['dmg', 'st', 'dot', 'buff', 'heal', 'shield', 'dispel', 'cleanse'].includes(op) && a.length && a[0] !== 'last') ctx.last = targets(b, u, a[0], ctx);
  if (op === 'dmg') {
    const T = targets(b, u, a[0], ctx), mult = (SG.FX7 && a[0] === 'src' && u.flags['counter_mul']) ? u.flags['counter_mul'] : parseFloat(a[1]), kind = a.slice(2).includes('mag') ? 'mag' : 'phys';
    const ig = a.includes('ig50') ? .5 : (a.includes('ig20') ? .2 : 0), hit = a.includes('hit');
    for (const t of T) if (t.alive()) b.damage(u, t, mult, kind, ig, hit, ctx._tag || 'skill');
  } else if (op === 'st') {
    const T = a[0] !== 'last' ? ctx.last : targets(b, u, 'last', ctx), s = a[1], r = parseInt(a[2]) + ((SG.FX7 && s === '计穷' && typeof u.flags['计穷加'] === 'number') ? u.flags['计穷加'] : 0), p = a.length > 3 ? parseFloat(a[3]) / 100 : 1.0;
    for (const t of T) if (t.alive() && t.add_status(s, r, p, u) && s === '挑衅') t.taunt_by = u;
  } else if (op === 'dot') {
    const T = a[0] !== 'last' ? ctx.last : targets(b, u, 'last', ctx), s = a[1], r = parseInt(a[2]), per = parseFloat(a[3]) / 100;
    for (const t of T) if (t.alive()) { t.add_status(s, r); t.flags[s + '_src'] = [u, per * (1 + u.flag('dotout'))]; }
  } else if (op === 'buff') {
    const T = a[0] !== 'last' ? ctx.last : targets(b, u, 'last', ctx), k = a[1], pct = parseFloat(a[2]) / 100, r = a.length > 3 ? parseInt(a[3]) : -1;
    const vs = eff.conds.filter(c => c.startsWith('vs:') || c.startsWith('vsin:'));
    if (vs.length) { const [mode, who] = vs[0].split(':'); for (const t of T) (t.flags['vs'] = t.flags['vs'] || []).push([mode, who, pct]); return; }
    for (const t of T) {
      if (k === 'maxhp') { t.maxhp *= (1 + pct); t.hp *= (1 + pct); }
      else t.addbuff(k, pct, r, r === -1 ? 'perm' + ctx._eid : null);
    }
    if (b.log && T.length) b.say(`${u.name} 加成 ${k}`, { t: 'buff', u, k, p: pct, r, tt: T.slice(), from: String(ctx._eid || '').split('#')[0] });
  } else if (op === 'heal') {
    for (const t of targets(b, u, a[0], ctx)) b.heal(u, t, parseFloat(a[1]) / 100);
  } else if (op === 'shield') {
    for (const t of targets(b, u, a[0], ctx)) { if (parseFloat(a[1]) === 0) t.shield = 0; else b.shieldUp(t, parseFloat(a[1]) / 100, u); }
  } else if (op === 'dmgself') {
    u.hp -= u.maxhp * parseFloat(a[0]) / 100;
  } else if (op === 'reflect') {
    const src = ctx.src;
    if (src && src.alive() && ctx.ab > 0 && ctx.tag !== '反弹') b.apply(u, src, ctx.ab * parseFloat(a[0]) / 100, 'phys', '反弹');   // V0.7：原来要「挨打后还有盾且有伤害漏过来」，两条互斥，从没反弹过；改成护盾挡下多少、按比例弹回去
  } else if (op === 'dmgby') {
    const AA = targets(b, u, a[0], ctx), T = targets(b, u, a[1], ctx);
    for (const x of AA) for (const t of T) b.damage(x, t, parseFloat(a[2]), 'phys', 0, false, 'pursue');
  } else if (op === 'dispel') {
    for (const t of targets(b, u, a[0], ctx)) t.dispel();
  } else if (op === 'cleanse') {
    for (const t of targets(b, u, a[0], ctx)) t.cleanse();
  } else if (op === 'revive') {
    u.hp = u.maxhp * parseFloat(a[0]) / 100; ctx._revived = true; b.say(`${u.name} 免死`, { t: 'revive', u, h1: u.hp });
  } else if (op === 'flag') {
    const k = a[0], v = a.length > 1 ? _num(a[1]) : true;
    if (k.startsWith('noattack:')) { (u.flags['noattack'] = u.flags['noattack'] || new Set()).add(k.slice(9)); }
    else u.flags[k] = v;
  } else if (op === 'counter') {
    const src = ctx.src;
    if (src && src.alive() && ['attack', 'skill', 'pursue'].includes(ctx.tag) && R.random() < parseFloat(a[0]) / 100) b.damage(u, src, (SG.FX7 && u.flags['counter_mul']) ? u.flags['counter_mul'] : parseFloat(a[1]), 'phys', 0, false, '反击');
  } else if (op === 'interrupt') {
    const who = ctx.who;
    if (who && who.side !== u.side && who.prep && R.random() < parseFloat(a[0]) / 100) {
      if (a.length > 1) b.damage(u, who, parseFloat(a[1]));
      who.prep = null; b.say(`${u.name} 打断 ${who.name}`, { t: 'interrupt', u, v: who });
    }
  } else if (op === 'custom') {
    const f = CUSTOM[a[0]];
    if (!f) throw new Error('custom 没有: ' + a[0]);
    f(b, u, ctx);
  }
}
SG.targets = targets; SG.cond_ok = cond_ok; SG.run_effect = run_effect;

const EV = { myprep: 'on_prepare', dealt: 'after_hit', hit: 'on_hit_taken', maghit: 'on_hit_taken', death: 'on_death', allydeath: 'on_ally_death', enemydeath: 'on_enemy_death', kill: 'on_kill', atk: 'after_attack', rend: 'round_end_unit', rstart: 'round_start', eprep: 'on_prepare', lethal: 'on_lethal', sbreak: 'shield_broken', dodge: 'on_dodge' };
function build(spec, name, cname) {
  const typ = spec.type, effs = spec.effs;
  effs.forEach((e, i) => { e.id = `${name}#${i}`; });
  const sk = { name, cname: cname || name, type: ({ '瞬发': '主动·瞬发', '准备': '主动·准备' })[typ] || typ, rate: spec.rate || 0, first_round: spec.first, hooks: {} };
  let inline = effs.filter(e => e.trig == null);
  const setups = effs.filter(e => e.trig === 'setup');
  const hooked = effs.filter(e => e.trig && e.trig !== 'setup');
  const run_list = (b, u, L, ctx) => { for (const e of L) { ctx._eid = e.id; run_effect(b, u, e, ctx); } };
  if (setups.length) sk.setup = (b, u) => run_list(b, u, setups, {});
  if (typ === '瞬发' || typ === '准备') sk.fn = (b, u) => run_list(b, u, inline, { _tag: 'skill' });
  else if (typ === '追击') {
    sk.fn = (b, u, t) => run_list(b, u, inline, { tgt: t, _tag: 'pursue' });
    sk.other = inline.some(e => e.op === 'dmg' && e.args[0] !== 'tgt');
  } else sk.fn = (b, u) => run_list(b, u, inline, { _tag: 'skill' });
  const subs = inline.filter(e => e.op === 'sub');
  inline = inline.filter(e => e.op !== 'sub');
  if (subs.length) {
    sk.hooks.substitute = (u, tgt, src, kind, tag) => {
      const b = u.battle;
      if (tgt === u || !['attack', 'skill', 'pursue'].includes(tag)) return null;
      for (const e of subs) {
        const ctx = { _eid: e.id, src, kind, tag };
        if (!cond_ok(b, u, e.conds, ctx)) continue;
        if (targets(b, u, e.args[0], ctx).includes(tgt) && R.random() < parseFloat(e.args[1]) / 100) { u.flags['sub_mul'] = parseFloat(e.args[2]); return u; }
      }
      return null;
    };
  }
  const by = new Map();
  for (const e of hooked) { if (!by.has(e.trig)) by.set(e.trig, []); by.get(e.trig).push(e); }
  for (const [trig, L] of by) {
    const ev = EV[trig];
    sk.hooks[ev] = (u, ...args) => {
      const b = u.battle, ctx = { _trig: trig };
      if (trig === 'hit' || trig === 'maghit') {
        const [src, dmg, kind, tag, ab] = args; Object.assign(ctx, { src, kind, tag, dmg, ab });   // V0.7：带上伤害值和护盾挡下的量
        if (trig === 'maghit' && kind !== 'mag') return;
      } else if (trig === 'death') ctx.src = args[0];
      else if (trig === 'allydeath' || trig === 'enemydeath') { ctx.dead = args[0]; ctx.src = args[1]; }
      else if (trig === 'kill') ctx.tgt = args[0];
      else if (trig === 'atk') ctx.tgt = args[0];
      else if (trig === 'eprep') ctx.who = args[0];
      else if (trig === 'myprep') { if (args[0] !== u) return; }
      else if (trig === 'dealt') { ctx.tgt = args[0]; ctx.dmg = args[1]; ctx.kind = args[2]; ctx.tag = args[3]; }
      else if (trig === 'lethal') ctx.src = args[0];
      else if (trig === 'sbreak') { ctx.who = args[0]; if (!args[0] || args[0].side !== u.side) return; }   // V0.7：只管我方的护盾
      run_list(b, u, L, ctx);
      if (trig === 'lethal' && ctx._revived) return true;
    };
  }
  return sk;
}
SG.build = build;

// ---------------- 手写技能（skills_custom.py） ----------------
const CUSTOM = {};
SG.CUSTOM = CUSTOM;
const reg = (n, f) => { CUSTOM[n] = f; };
function _zhan(lim, m = 2.6) {
  return (b, u, ctx) => {
    const t = first(b.pick(u, 'hp_max'));
    if (t.ratio() < lim && !u.once.has('斩')) { u.once.add('斩'); b.apply(u, t, t.hp + 1, 'phys', '斩杀'); return; }
    b.damage(u, t, m);
  };
}
reg('关羽斩', _zhan(.30)); reg('关羽斩40', _zhan(.40)); reg('关羽斩V7', _zhan(.40, 3.2));
function _qijin(nmax) {
  return (b, u, ctx) => {
    const t = ctx.tgt; let n = 0;
    while (t.alive() && n < nmax) { b.damage(u, t, 1.2, 'phys', 0, false, 'pursue'); n++; if (t.ratio() >= .5) break; }
  };
}
reg('赵云七进七出', _qijin(3)); reg('赵云七进七出4', _qijin(4));
reg('马超后期', (b, u) => { if (b.round >= 4) { u.flags['神威'] = Math.min(.16, (u.flags['神威'] || 0) + .04); u.addbuff('atk', u.flags['神威'], -1, 'perm神威'); } });
function _huangzhong(cap, step, n = 1) {
  return (b, u) => {
    u.addbuff('crit', .4, 1, '穿杨');
    for (const t of b.pick(u, 'stat_min', n, 'def')) b.damage(u, t, 2.4 + Math.min(cap, step * (b.round - 1)), 'phys', 0, true);
  };
}
reg('黄忠老当益壮V7', _huangzhong(1.2, .15, 2));
reg('黄忠老当益壮', _huangzhong(.8, .1)); reg('黄忠老当益壮15', _huangzhong(1.2, .15));
function _lianhuanCast(n) {
  return (b, u) => {
    const ts = b.pick(u, 'random', n);
    const r = typeof u.flags['连环比'] === 'number' ? u.flags['连环比'] : .15;   // V0.2：传导 40% → 15%（修好之后 40% 太强）
    for (const t of ts) { t.status['连环'] = 2; t.flags['连环组'] = ts; t.flags['连环比'] = r; }
    for (const t of ts) b.damage(u, t, 1.0, 'mag');
  };
}
reg('庞统连环', _lianhuanCast(3)); reg('庞统连环4', _lianhuanCast(4));
// V0.2 修：连环的传导钩子挂在每个人身上（原来只挂在庞统自己身上，庞统不会中连环，从不触发）
function _lianhuan(u, src, dmg, kind, tag) {
  if (tag === '连环' || !u.has('连环')) return;
  for (const o of (u.flags['连环组'] || [])) if (o !== u && o.alive() && o.has('连环')) u.battle.apply(src, o, dmg * (u.flags['连环比'] || .15), kind, '连环');
}
CUSTOM._hooks = {};
GLOBAL_HOOKS_EXTRA.on_hit_taken = _lianhuan;
function _jiangwei(cap, step, n = 2) {
  return (b, u) => {
    const k = u.stat('atk') >= u.stat('int') ? 'phys' : 'mag';
    const m = 1.8 + Math.min(cap, step * (u.flags['九伐'] || 0)); u.flags['九伐'] = (u.flags['九伐'] || 0) + 1;
    for (const t of b.pick(u, 'random', n)) b.damage(u, t, m, k);
  };
}
reg('姜维九伐V7', _jiangwei(1.2, .2, 3));
reg('姜维九伐', _jiangwei(.9, .15)); reg('姜维九伐20', _jiangwei(1.2, .2));
reg('曹操抽兵', (b, u) => { const m = argmax(b.allies(u), x => x.hp); if (m !== u) { const a = m.maxhp * .03; m.hp -= a; u.hp = Math.min(u.maxhp, u.hp + a); } });
reg('曹操负人', (b, u) => { const n = u.flags['负人'] || 0; if (n < 3) { u.flags['负人'] = n + 1; for (const a of b.allies(u)) a.addbuff('atk', .04 * (n + 1), -1, 'perm负人'); } });
function _xuchu(d) { return (b, u) => { u.addbuff('def', d, 2, '裸衣'); u.flags['裸衣中'] = 2; b.damage(u, first(b.pick(u, 'random')), 3.0 + (u.flags['裸衣加'] || 0)); }; }
reg('许褚裸衣', _xuchu(-.30)); reg('许褚裸衣15', _xuchu(-.15));
reg('许褚受击', (b, u) => { if ((u.flags['裸衣中'] || 0) > 0) u.flags['裸衣加'] = (u.flags['裸衣加'] || 0) + .3; });
reg('许褚回合', (b, u) => { u.flags['裸衣中'] = Math.max(0, (u.flags['裸衣中'] || 0) - 1); });
reg('郭嘉遗计', (b, u) => { const A = b.allies(u); if (A.length) { const a = R.choice(A); a.addbuff('rate', 1.0, 1, '遗计'); a.flags['遗计倍'] = .5; } });
reg('郭嘉遗计2', (b, u) => { const A = b.allies(u); for (const a of R.sample(A, Math.min(2, A.length))) a.addbuff('rate', 1.0, 1, '遗计'); });
reg('司马懿记账起', (b, u) => { u.flags['记账'] = 0.0; u.flags['记账中'] = true; });
reg('司马懿记账收', (b, u, ctx) => { if (u.flags['记账中']) u.flags['记账'] = (u.flags['记账'] || 0) + (ctx.dmg || 0); });
function _yingshi(k) {
  return (b, u) => {
    const acc = u.flags['记账'] || 0; u.flags['记账中'] = false;
    const E = b.pick(u, 'all');
    if (acc > 0) { for (const t of E) { b.damage(u, t, .7, 'mag'); b.apply(u, t, acc * k / Math.max(1, E.length), 'mag', '记账'); } }
    else b.damage(u, first(b.pick(u, 'random')), 2.5, 'mag');
  };
}
reg('司马懿鹰视', _yingshi(.8)); reg('司马懿鹰视100', _yingshi(1.0));
// V0.7 司马懿加强：结算全体 1.0 倍谋略 + 记账 ×1.5（四件 ×2.0）；准备期没挨打改单体 3.0 倍
function _yingshi2(base, k, solo) {
  return (b, u) => {
    const acc = u.flags['记账'] || 0; u.flags['记账中'] = false;
    const E = b.pick(u, 'all');
    if (acc > 0) { for (const t of E) { b.damage(u, t, base, 'mag'); b.apply(u, t, acc * k / Math.max(1, E.length), 'mag', '记账'); } }
    else b.damage(u, first(b.pick(u, 'random')), solo, 'mag');
  };
}
reg('司马懿鹰视B', _yingshi2(1.2, 2.0, 3.2)); reg('司马懿鹰视B4', _yingshi2(1.3, 2.5, 3.6));
reg('刘禅隐身', (b, u) => { u.hidden = 99; });   // V0.7：只隐身，照常普攻
function _dengai(n) { return (b, u) => { if (b.round === 3) for (const t of b.pick(u, 'back', n)) b.damage(u, t, 2.0, 'phys', .5); }; }
reg('邓艾阴平', _dengai(2)); reg('邓艾阴平3', _dengai(3));
function _sunce(cap) { return (b, u) => { const n = Math.min(cap, (u.flags['霸王'] || 0) + 1); u.flags['霸王'] = n; u.addbuff('atk', .04 * n, -1, 'perm霸王'); }; }
reg('孙策叠层', _sunce(5)); reg('孙策叠层8', _sunce(8));
function _luxun(k) {
  return (b, u) => {
    if (b.round <= k) { u.addbuff('int', .03 * b.round, -1, 'perm潜渊'); return; }
    for (const t of b.pick(u, 'all')) { b.damage(u, t, .7, 'mag'); t.add_status('灼烧', 3); t.flags['灼烧_src'] = [u, .02 * (1 + u.flag('dotout'))]; }
  };
}
reg('陆逊潜渊', _luxun(3)); reg('陆逊潜渊2', _luxun(2));
// V0.7 修：蓄势加智力原来写在技能本体里，前三回合技能不发，这段从没跑过；改挂回合开始
function _luxunXu(k) { return (b, u) => { if (b.round <= k) u.addbuff('int', .03 * b.round, -1, 'perm潜渊'); }; }
reg('陆逊蓄势', _luxunXu(3)); reg('陆逊蓄势2', _luxunXu(2));
CUSTOM._gates = { '陆逊': (b, u) => b.round >= 4, '陆逊4': (b, u) => b.round >= 3 };
reg('太史慈神射', (b, u, ctx) => {
  const E = b.enemies(u), pre = E.filter(e => e.prep);
  const t = pre.length ? R.choice(pre) : ctx.tgt;
  b.damage(u, t, 1.3, 'phys', 0, true, 'pursue');
  if (t.prep) { t.prep = null; b.say(`${t.name} 准备被打断`, { t: 'interrupt', u, v: t }); }
});
// V0.6 修：原来读的「围|回合」没人写，从不生效；改读每回合挨打计数
reg('吕布围攻', (b, u) => { if ((u.flags['挨|' + b.round] || 0) === 3) u.addbuff('atk', .15, 2, '三英'); });
reg('吕布围攻2', (b, u) => { if ((u.flags['挨|' + b.round] || 0) === 2) u.addbuff('atk', .15, 2, '三英'); });
reg('董卓吸血', (b, u, ctx) => { if (['attack', 'skill', 'pursue'].includes(ctx.tag)) u.hp = Math.min(u.maxhp, u.hp + (ctx.dmg || 0) * ((SG.FX7 && typeof u.flags['吸血'] === 'number') ? u.flags['吸血'] : .25)); });
reg('华佗刮骨', (b, u, ctx) => { const d = ctx.dead; if (!u.once.has('刮骨')) { u.once.add('刮骨'); d.hp = d.maxhp * .3; b.say(`华佗救回 ${d.name}`, { t: 'revive', u: d }); } });
reg('华佗刮骨2', (b, u, ctx) => { const d = ctx.dead, n = u.flags['刮骨n'] || 0; if (n < 2) { u.flags['刮骨n'] = n + 1; d.hp = d.maxhp * .3; b.say(`华佗救回 ${d.name}`, { t: 'revive', u: d }); } });
reg('王允反目', (b, u) => {
  const E = b.enemies(u); if (E.length < 2) return;
  const a = argmax(E, x => x.stat('atk')), c = argmax(E, x => x.stat('int'));
  if (a !== c) u.flags['反目'] = [a, c];
});
function _wangyun(p) { return (b, u) => { for (const x of (u.flags['反目'] || [])) if (x.alive()) b.apply(null, x, x.maxhp * p, 'mag', '反目', true); }; }
reg('王允互伤', _wangyun(.03)); reg('王允互伤5', _wangyun(.05));
reg('陈宫犄角', (b, u) => { for (const a of b.allies(u)) if ((a.flags['挨|' + b.round] || 0) >= 2) a.addbuff('def', .10, 1, '犄角'); });
reg('袁绍人多', (b, u) => { const more = b.allies(u).length > b.enemies(u).length; for (const a of b.allies(u)) { a.addbuff('atk', more ? .05 : 0, -1, 'perm四世2'); a.addbuff('def', more ? .05 : 0, -1, 'perm四世2d'); } });
reg('华雄连斩', (b, u) => { const t = first(b.pick(u, 'hp_min')); b.damage(u, t, 2.0); if (!t.alive()) { const o = b.pick(u, 'random'); if (o.length) b.damage(u, o[0], 1.0, 'phys', 0, false, 'attack'); } });
reg('郭淮陇西', (b, u) => { const n = (u.flags['挨|' + b.round] || 0) === 0 ? Math.min(4, (u.flags['陇西'] || 0) + 1) : 0; u.flags['陇西'] = n; u.addbuff('def', .03 * n, -1, 'perm陇西'); });
reg('钟会野心', (b, u) => { const n = Math.min(3, (u.flags['野心'] || 0) + 1); u.flags['野心'] = n; u.addbuff('atk', .05 * n, -1, 'perm野心'); u.addbuff('int', .05 * n, -1, 'perm野心i'); });
reg('黄盖苦肉', (b, u) => { const n = Math.min(4, Math.trunc((1 - u.ratio()) / .2)); u.addbuff('atk', .04 * n, -1, 'perm苦肉'); });
reg('曹彰黄须', (b, u) => { const n = Math.min(3, (u.flags['黄须'] || 0) + 1); u.flags['黄须'] = n; u.addbuff('atk', .04 * n, -1, 'perm黄须'); });
reg('周泰护主', (b, u) => { const n = (u.flags['护主'] || 0) + 1; u.flags['护主'] = n; if (n === 3) u.addbuff('def', .10, -1, 'perm护主'); });
reg('孟获七擒', (b, u, ctx) => { if (!u.once.has('七擒')) { u.once.add('七擒'); u.hp = u.maxhp * .25; u.addbuff('def', .05, -1, 'perm屡败'); ctx._revived = true; b.say(`${u.name} 又回来了`, { t: 'revive', u }); } });
reg('傅肜不倒', (b, u) => { if (u.ratio() < .2 && !u.once.has('不倒')) { u.once.add('不倒'); u.flags['不倒到'] = b.round + 1; } });
reg('傅肜免死', (b, u, ctx) => { if ((u.flags['不倒到'] != null ? u.flags['不倒到'] : -1) >= b.round) { u.hp = 1; ctx._revived = true; } });
reg('王朗骂死', (b, u) => {
  const t = first(b.pick(u, 'stat_max', 1, 'int'));
  if (t.name === '诸葛亮') {
    u.hp = 0; b.say('王朗被骂死', { t: 'die', u });
    for (const a of b.allies(u)) a.addbuff('atk', .05, -1, 'perm骂');
  } else {
    if (t.add_status('挑衅', 1, 1.0, u)) t.taunt_by = u;
    b.damage(u, t, 1.0, 'mag');
  }
});
reg('曹洪替死', () => { });
function _tidie(protect) {
  return (u, tgt, src) => {
    if (tgt.name === protect && tgt.side === u.side && u.alive() && !u.once.has('sub')) { u.once.add('sub'); u.hp = 0; tgt.hp = tgt.maxhp * .01; u.battle.say(`${u.name} 替死`, { t: 'die', u }); return true; }
  };
}
CUSTOM._hooks['曹洪'] = { on_lethal_any: _tidie('曹操') };
CUSTOM._hooks['曹昂'] = { on_lethal_any: _tidie('曹操') };
reg('阎柔胡骑', (b, u) => { if (R.random() < .3) { const o = b.pick(u, 'random'); if (o.length) b.damage(u, o[0], .6, 'phys', 0, false, '胡骑'); } });
reg('文鸯集火', (b, u) => { if ((u.flags['挨|' + b.round] || 0) >= 2) u.addbuff('pursue', 1.0, 1, '单骑'); });
reg('徐氏设伏', (b, u, ctx) => {
  const src = ctx.src;
  if (src && src.alive() && ['attack', 'skill', 'pursue'].includes(ctx.tag) && u.flags['伏回合'] !== b.round) {
    u.flags['伏回合'] = b.round; const a = R.choice(b.allies(u)); b.damage(a, src, .8, 'phys', 0, false, '反击');
  }
});
reg('杜预破竹', (b, u) => { const n = Math.min(4, (u.flags['破竹'] || 0) + 1); u.flags['破竹'] = n; u.addbuff('atk', .04 * n, -1, 'perm破竹'); u.addbuff('int', .04 * n, -1, 'perm破竹i'); });
reg('吕岱定公', (b, u) => { const n = Math.min(4, (u.flags['定公'] || 0) + 1); u.flags['定公'] = n; u.addbuff('atk', .03 * n, -1, 'perm定公'); u.addbuff('def', .03 * n, -1, 'perm定公d'); });
reg('刘禅站桩', (b, u) => { u.hidden = 99; u.status['缴械'] = 99; });
reg('傅肜断后层', (b, u) => { const n = Math.min(3, (u.flags['断后'] || 0) + 1); u.flags['断后'] = n; u.addbuff('def', .06 * n, -1, 'perm断后'); });
reg('潘凤退场', (b, u, ctx) => { const t = ctx.tgt; if (t && t.name === '华雄' && !u.once.has('潘凤')) { u.once.add('潘凤'); u.hp = 0; b.say('潘凤退场', { t: 'die', u }); } });
reg('反目自伤', (b, u) => { b.apply(null, u, u.maxhp * .03, 'mag', '反目', true); });
reg('七擒回场', (b, u, ctx) => { const n = u.flags['回场'] || 0; if (n < 7) { u.flags['回场'] = n + 1; u.hp = u.maxhp * (0.7 - 0.1 * n); ctx._revived = true; b.say(`${u.name} 第 ${n + 1} 次回场`, { t: 'revive', u, n: n + 1 }); } });
reg('赵云追击率', (b, u) => { u.flags['pursue'] = .03 * Math.trunc((1 - u.ratio()) * 10); });

// ---------------- 载入技能、装备 ----------------
function loadSkills(rows) {
  const SK = {}, errs = [];
  for (const r of rows) {
    try {
      const sk = build(parse_line(r['DSL']), r['名']);
      sk.dname = r['技能'];
      const hk = (CUSTOM._hooks[r['名']] || {});
      for (const ev in hk) sk.hooks[ev] = hk[ev];
      if (CUSTOM._gates[r['名']]) sk.gate = CUSTOM._gates[r['名']];
      SK[r['名']] = sk;
    } catch (e) { errs.push([r['名'], r['DSL'], String(e)]); }
  }
  return [SK, errs];
}
function loadSet4(rows, SKROWS) {
  const out = {};
  for (const r of rows) {
    const sk = build(parse_line(r['DSL']), r['名'] + '·四件', r['名'] + '·四件');
    if (SKROWS && SKROWS[r['名']]) sk.dname = SKROWS[r['名']]['技能'];
    const hk = (CUSTOM._hooks[r['名']] || {});
    for (const ev in hk) sk.hooks[ev] = hk[ev];
    if (CUSTOM._gates[r['名'] + '4']) sk.gate = CUSTOM._gates[r['名'] + '4'];
    else if (CUSTOM._gates[r['名']]) sk.gate = CUSTOM._gates[r['名']];
    out[r['名']] = sk;
  }
  return out;
}
// 技能 dict 带闭包状态吗？没有——闭包只读 spec，状态都在 unit/battle 上，所以一招可以多人共用。
function wear(u, items, EQ, SET4) {
  u.equip = items.map(n => EQ[n]);
  for (const e of u.equip) {
    if (e['DSL']) u.extras.push(build(parse_line('被动 | ' + e['DSL']), e['名']));
  }
  const own = u.equip.filter(e => e['归属'] === u.name);
  if (own.length >= 2) {
    const main = u.role !== '武将' ? 'int' : 'atk';
    u.extras.push(build(parse_line(`被动 | setup:buff(self,${main},6)`), '两件'));
  }
  if (own.length >= 4 && SET4 && SET4[u.name]) u.skill = SET4[u.name];
  if (own.length >= 4 && SG.SET4_BONUS) { const main = u.role !== '武将' ? 'int' : 'atk'; u.extras.push(build(parse_line(`被动 | setup:buff(self,${main},${SG.SET4_BONUS}); setup:buff(self,def,${SG.SET4_BONUS})`), '四件')); }   // V0.7：四件齐再给主属性、统率
}
SG.loadSkills = loadSkills; SG.loadSet4 = loadSet4; SG.wear = wear;

if (typeof module !== 'undefined' && module.exports) module.exports = SG;
})(typeof window !== 'undefined' ? window : globalThis);
