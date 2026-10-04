// 三国群英录 · 霸业模式（规则照 设计_霸业模式 v0.3，AI 照 sim/conquest.py 逐段搬）。不碰 DOM。
// World 只管地图、守军、AI；玩家这一侧通过 roster 接口（cq* 方法）接进来：
//   模拟里是 test/playthrough.js 的 Player，游戏里是 ConquestGame（下面）。
(function (G) {
'use strict';
const SG = G.SG;
const { argmax, argmin, sortBy } = SG.util;

const FACTIONS = ['魏', '蜀', '吴', '汉'];
const CAPITAL = { '魏': '许昌', '蜀': '成都', '吴': '建业', '汉': '长安' };
const LEADER = { '魏': '曹操', '蜀': '刘备', '吴': '孙权', '汉': '王允' };
const INCOME = { '都': 800, '大': 500, '郡': 300 };
const GARRISON = { '都': [9, { '无双': 2, '虎': 2, '名': 3 }], '大': [7, { '虎': 1, '名': 2 }], '郡': [5, { '名': 1 }] };
const RANSOM = { '校': 300, '骁': 800, '名': 2000, '虎': 5000, '无双': 12000 };
const MOB_OF = { '魏': '魏卒·刀盾', '蜀': '蜀卒·长枪', '吴': '吴卒·环刀', '汉': '汉军郡兵', '无': '黄巾兵' };
const CQ = {
  start_gold: 3000, max_turn: 120, ai_min_ratio: 0.8, ai_vs_me_ratio: 1.3, ai_cooldown: 3, truce: 12, capital_bonus: 1.5,
  rest_below: 0.9, attack_min_ratio: 0.5,
  foe_lv: t => Math.min(50, Math.trunc(8 + 0.8 * t)), foe_star: t => Math.min(5, 1 + Math.floor(t / 20)),
  neutral_lv: 0.85, guard_bonus: 0.05,
};
const TIERN = { '都': 3, '大': 2, '郡': 1 };
SG.CQ = CQ; SG.CQ_FACTIONS = FACTIONS; SG.CQ_CAPITAL = CAPITAL; SG.CQ_LEADER = LEADER; SG.CQ_RANSOM = RANSOM; SG.CQ_INCOME = INCOME;

function stat_power(name, lv, star) {
  const h = SG.D.H[name];
  const base = [['武力', '武成长'], ['统率', '统成长'], ['智力', '智成长'], ['速度', '速成长']].reduce((a, [k, g]) => a + parseFloat(h[k]) + parseFloat(h[g]) * (lv - 1), 0);
  return base * (1 + SG.STARK[star]) * (1 + .15 * SG.TIER_ORDER.indexOf(h['品阶'])) * lv / 10;
}
SG.cq_stat_power = stat_power;

// ---------------- 世界 ----------------
class World {
  // st：可存档的状态对象；p：玩家 roster；rng：地图用随机源
  constructor(st, p, rng) { this.st = st; this.p = p; this.rng = rng || SG.makeRng(); this.ADJ = World.adj(); }
  static adj() {
    if (World._adj) return World._adj;
    const A = {};
    for (const c of SG.D.CITIES) { A[c['名']] = A[c['名']] || new Set(); for (const b of c['相邻'].split(/\s+/).filter(Boolean)) { A[c['名']].add(b); (A[b] = A[b] || new Set()).add(c['名']); } }
    const out = {}; for (const k in A) out[k] = [...A[k]];
    return (World._adj = out);
  }
  // 新开一局：摊名单、给玩家起手。p 需要实现 cqReset(leader) 与 cqAdd(n)
  static create(seed, me, p) {
    const D = SG.D, rng = SG.makeRng(seed);
    const st = { me, turn: 0, alive: {}, city: {}, spare: {}, prisoners: [], last_hit: {}, capital: Object.assign({}, CAPITAL), log: [], dead_me: false, over: null };
    FACTIONS.forEach(f => st.alive[f] = true);
    for (const c of D.CITIES) st.city[c['名']] = { tier: c['分量'], owner: c['开局归属'], garrison: [], guard: null, hp: 1.0 };
    for (const f of FACTIONS.concat(['无'])) st.spare[f] = rng.shuffle(D.HLIST.filter(n => D.H[n]['阵营'] === f));
    const w = new World(st, p, rng);
    p.cqReset();
    p.cqAdd(LEADER[me]); st.spare[me].splice(st.spare[me].indexOf(LEADER[me]), 1);
    for (const [tier, k] of [['名', 2], ['骁', 2], ['校', 2]]) {
      const c = st.spare[me].filter(n => D.H[n]['品阶'] === tier);
      for (const n of rng.sample(c, Math.min(k, c.length))) { p.cqAdd(n); st.spare[me].splice(st.spare[me].indexOf(n), 1); }
    }
    for (const n in st.city) { if (st.city[n].owner !== me) w.fill(n); else w.assign_guard(n); }
    return w;
  }
  get pool() { const me = this.st.me; return SG.D.HLIST.filter(n => [me, '无'].includes(SG.D.H[n]['阵营'])); }
  cities(owner) { return Object.keys(this.st.city).filter(n => this.st.city[n].owner === owner); }
  // ----- 守军 -----
  fill(n) {
    const D = SG.D, c = this.st.city[n], f = c.owner;
    let [cnt, comp] = GARRISON[c.tier];
    if (FACTIONS.includes(f) && this.cities(f).length <= 3) { c.garrison = Array(cnt).fill(MOB_OF[f]); return; }
    if (f === '无') { cnt = Math.max(5, cnt - 2); comp = c.tier === '都' ? { '虎': 1, '名': 2 } : { '名': 1 }; }
    const sp = this.st.spare[f], g = [];
    for (const tier in comp) {
      const c2 = sp.filter(x => D.H[x]['品阶'] === tier).slice(0, comp[tier]);
      for (const x of c2) { sp.splice(sp.indexOf(x), 1); g.push(x); }
    }
    const rest = sp.filter(x => ['骁', '校'].includes(D.H[x]['品阶']));
    for (const x of rest.slice(0, Math.max(0, cnt - g.length))) { sp.splice(sp.indexOf(x), 1); g.push(x); }
    while (g.length < cnt) g.push(MOB_OF[f]);
    c.garrison = g;
  }
  assign_guard(n) {
    const c = this.st.city[n], p = this.p;
    const free = this.free_heroes();
    if (c.guard && p.heroes[c.guard]) return;
    c.guard = free.length ? argmin(free, x => p.cqPower(x)) : null;
  }
  reassign_guards() {
    const p = this.p, mine = this.cities(this.st.me);
    const order = sortBy(Object.keys(p.heroes), x => p.cqPower(x));
    for (const c of mine) this.st.city[c].guard = null;
    mine.forEach((c, i) => { if (i < order.length) this.st.city[c].guard = order[i]; });
  }
  free_heroes() {
    const used = new Set(); for (const n of this.cities(this.st.me)) { const g = this.st.city[n].guard; if (g) used.add(g); }
    return Object.keys(this.p.heroes).filter(n => !used.has(n));
  }
  foeLvStar(n) {
    const c = this.st.city[n]; let lv = CQ.foe_lv(this.st.turn), star = CQ.foe_star(this.st.turn);
    if (c.owner === '无') { lv = Math.max(1, Math.trunc(lv * CQ.neutral_lv)); star = Math.max(1, star - 1); }
    return [lv, star];
  }
  foe_units(n) {
    const c = this.st.city[n], [lv, star] = this.foeLvStar(n);
    const U = c.garrison.map(x => SG.mkEnemy(x, lv, star, 1.0));
    for (const u of U) u.hp = u.maxhp * (c.hp != null ? c.hp : 1.0);
    return U;
  }
  save_foe_hp(n, B) { this.st.city[n].hp = Math.max(0.05, B.reduce((a, u) => a + u.hp, 0) / Math.max(1, B.reduce((a, u) => a + u.maxhp, 0))); }
  foe_power(n) {
    const c = this.st.city[n], [lv, star] = this.foeLvStar(n);
    let tot = 0; const hpf = 0.5 + 0.5 * (c.hp != null ? c.hp : 1.0);
    for (const x of c.garrison) {
      if (SG.D.H[x]) tot += stat_power(x, lv, star);
      else tot += (SG.MOBS[x].reduce((a, b) => a + b, 0) + SG.MOBG.reduce((a, b) => a + b, 0) * (lv - 1)) * (1 + SG.STARK[star]) * lv / 10;
    }
    return tot * hpf;
  }
  my_units(names) { return this.p.cqUnits(names); }
  save_hp(A) { for (const u of A) this.p.cqSetHp(u.name, Math.max(0.05, u.hp / u.maxhp)); }
  // V0.7 战斗经验：跟闯关同一套（霸业没有复刷）。先存兵力比例再升级，升级新长的一千兵是满的
  give_exp(A, B, win) {
    if (!this.p.gainExp || !A.length) return [];
    const flv = Math.max(...B.map(u => u.lv)), out = [];
    for (const u of A) { const h = this.p.heroes[u.name]; if (!h) continue; const e = SG.expFor(h.lv, flv, B.length, win, u.alive(), false); out.push({ n: u.name, e, up: this.p.gainExp(u.name, e), lv: h.lv }); }
    this.lastExp = out; return out;
  }
  recover() { for (const n in this.p.heroes) this.p.cqSetHp(n, Math.min(1.0, this.p.cqHp(n) + 0.2)); }
  my_power(names) { const p = this.p; return names.reduce((a, n) => a + p.cqPower(n) * p.heroes[n].lv / 10 * (0.5 + 0.5 * p.cqHp(n)), 0); }
  // ----- 回合开始：进账、回兵 -----
  startTurn() {
    const st = this.st; st.turn++;
    let inc = 0; for (const n of this.cities(st.me)) inc += INCOME[st.city[n].tier];
    this.p.gold += inc;
    this.recover();
    for (const n in st.city) st.city[n].hp = Math.min(1.0, (st.city[n].hp != null ? st.city[n].hp : 1.0) + 0.2);
    return inc;
  }
  targets() {
    const me = this.st.me, mine = this.cities(me), T = new Set();
    for (const a of mine) for (const b of this.ADJ[a]) if (this.st.city[b].owner !== me) T.add(b);
    return [...T];
  }
  // ----- 玩家攻城（battle 由调用方用 A、B 跑好传进来） -----
  afterAttack(best, A, B, w) {
    const st = this.st, me = st.me, D = SG.D;
    this.save_hp(A); this.give_exp(A, B, w === 0);
    if (w !== 0) { this.save_foe_hp(best, B); return { won: false }; }
    const c = st.city[best], old = c.owner;
    const caught = [];
    for (const x of c.garrison) if (D.H[x]) { st.prisoners.push([x, old, st.turn]); caught.push(x); }
    c.owner = me; c.garrison = []; c.guard = null; c.hp = 1.0; this.assign_guard(best);
    let fell = null;
    if (FACTIONS.includes(old) && best === st.capital[old]) {
      const left = this.cities(old);
      if (left.length <= 3) {
        for (const n2 of left) {
          const c2 = st.city[n2];
          for (const x of c2.garrison) if (D.H[x]) { st.prisoners.push([x, old, st.turn]); caught.push(x); }
          c2.owner = me; c2.garrison = []; c2.guard = null; this.assign_guard(n2);
        }
        fell = 'dead';
      } else {
        st.capital[old] = argmax(left, n2 => TIERN[st.city[n2].tier]); fell = 'moved';
      }
    }
    this.check_dead(old);
    return { won: true, caught, old, fell, cap: fell === 'moved' ? st.capital[old] : null };
  }
  // ----- AI -----
  reinforce(f, mine) {
    const D = SG.D, st = this.st;
    const border = mine.filter(c => this.ADJ[c].some(b => ![f, '无'].includes(st.city[b].owner)));
    const sp = sortBy(st.spare[f].slice(), x => -SG.TIER_ORDER.indexOf(D.H[x]['品阶']));
    let done = 0;
    for (const c of sortBy(border, c => this.foe_power(c))) {
      const g = st.city[c].garrison;
      while (g.filter(x => D.H[x]).length < 7 && sp.length) {
        const x = sp.shift(); st.spare[f].splice(st.spare[f].indexOf(x), 1);
        if (g.length >= 9) { const m = g.findIndex(y => !D.H[y]); if (m >= 0) g.splice(m, 1); else g.pop(); }
        g.push(x);
      }
      done++;
      if (done >= 1) break;
    }
  }
  defenders(t) {
    const c = this.st.city[t], g = c.guard;
    const free = sortBy(this.free_heroes(), x => -this.p.cqPower(x)).slice(0, 8);
    return (g ? [g] : []).concat(free);
  }
  // 这一家这回合要干什么；打玩家的城时不当场打，返回 {kind:'vsme'} 交给调用方（界面让玩家布防，模拟直接自动守）
  aiPlan(f) {
    const st = this.st, me = st.me;
    if (!st.alive[f]) return null;
    const mine = this.cities(f);
    if (!mine.length) return null;
    this.reinforce(f, mine);
    const tp = t => {
      if (st.city[t].owner === me) { const names = this.defenders(t); return names.length ? this.my_power(names) : 1; }
      return this.foe_power(t);
    };
    const pairs = [];
    for (const a of mine) for (const b of this.ADJ[a]) {
      if (st.city[b].owner !== f && (st.city[a].hp != null ? st.city[a].hp : 1) >= 0.8 && !(st.turn <= CQ.truce && st.city[b].owner === me)) pairs.push([a, b]);
    }
    if (!pairs.length) return null;
    const [a, best] = argmax(pairs, ab => this.foe_power(ab[0]) / Math.max(1, tp(ab[1])));
    const ratio = this.foe_power(a) / Math.max(1, tp(best));
    if (ratio < (st.city[best].owner === me ? CQ.ai_vs_me_ratio : CQ.ai_min_ratio)) return null;
    const old = st.city[best].owner;
    if (old === me) {
      if (st.turn - (st.last_hit[f] != null ? st.last_hit[f] : -99) < CQ.ai_cooldown || st.last_hit.any === st.turn) return null;
      st.last_hit[f] = st.turn; st.last_hit.any = st.turn;
      return { kind: 'vsme', f, a, best, ratio };
    }
    const pwin = ratio / (1 + ratio);
    if (this.rng.random() < pwin) {
      const c = st.city[best];
      for (const x of c.garrison) if (SG.D.H[x]) st.spare[old].push(x);
      c.owner = f; c.garrison = st.city[a].garrison.slice(); this.fill(a); this.check_dead(old, f);
      return { kind: 'ai', f, a, best, old, won: true };
    }
    return { kind: 'ai', f, a, best, old, won: false };
  }
  // 守城：names 是上阵的人（null = 自动：守将 + 最强 8 人），返回 { A, B, gb } 给调用方开打
  defenseUnits(plan, names) {
    const st = this.st, c = st.city[plan.best], g = c.guard;
    if (!names) {let chosen=false;names=this.defenders(plan.best).filter(n=>{if(this.p.heroes[n]?.form!=='god')return true;if(chosen)return false;chosen=true;return true;});}
    const A = this.my_units(names);
    let gb = g && names.includes(g) ? 1 + CQ.guard_bonus * Math.floor(this.p.cqStat4(g)['统率'] / 10) : 1;
    if (!names.includes(g) && g) gb = 1 + CQ.guard_bonus * Math.floor(this.p.cqStat4(g)['统率'] / 10);   // 守将在城里就有加成
    if (plan.best === CAPITAL[st.me]) gb *= CQ.capital_bonus;
    for (const u of A) { u.maxhp *= gb; u.hp *= gb; u.lvhp = u.maxhp; }
    return { A, B: this.foe_units(plan.a), names, gb };
  }
  // w：战斗结果（0 = 玩家守住，1 = 城破，-1 = 打满 30 回合也算守住）；A 为空表示没人守
  afterDefense(plan, A, B, w) {
    const st = this.st, D = SG.D, f = plan.f, a = plan.a, best = plan.best, c = st.city[best];
    const g = c.guard;
    const won = !A.length || w === 1;
    const out = { won, caught: [], lostGuard: null };
    if (A.length) {
      this.save_hp(A); this.save_foe_hp(a, B); this.give_exp(A, B, !won);
      if (!won) {
        const dead = B.filter(u => !u.alive() && D.H[u.name]).map(u => u.name);
        for (const x of dead) { const i = st.city[a].garrison.indexOf(x); if (i >= 0) st.city[a].garrison.splice(i, 1); st.prisoners.push([x, f, st.turn]); out.caught.push(x); }
      }
    }
    if (won) {
      if (g) { this.p.cqRemove(g); out.lostGuard = g; }
      c.owner = f; c.guard = null;
      c.garrison = st.city[a].garrison.slice(); c.hp = st.city[a].hp != null ? st.city[a].hp : 1.0; this.fill(a); st.city[a].hp = 1.0;
      st.log.push([st.turn, f, best]);
      if (best === CAPITAL[st.me] && this.cities(st.me).length < 4) st.dead_me = true;
    }
    return out;
  }
  check_dead(f, by) {
    const st = this.st;
    if (FACTIONS.includes(f) && st.alive[f] && !this.cities(f).length) {
      st.alive[f] = false;
      if (FACTIONS.includes(by)) { st.spare[by] = st.spare[by].concat(st.spare[f]); st.spare[f] = []; }
    }
  }
  status() {
    const st = this.st, n = this.cities(st.me).length;
    if (st.dead_me || n === 0) return 'lose';
    if (n === 44 || !FACTIONS.filter(f => f !== st.me).some(f => st.alive[f])) return 'win';
    return null;
  }
  ransom(n) { return RANSOM[SG.D.H[n]['品阶']]; }
  release(n) {   // 招降：付钱，人进队伍
    const i = this.st.prisoners.findIndex(x => x[0] === n); if (i < 0) return false;
    const cost = this.ransom(n); if (this.p.gold < cost) return false;
    this.p.gold -= cost; this.st.prisoners.splice(i, 1); this.p.cqAdd(n); return true;
  }
}
SG.World = World;

// ---------------- 游戏里的玩家一侧 ----------------
class ConquestGame extends SG.Game {
  constructor(s) { super(s); this.kind = 'conquest'; this.world = s.world ? new World(s.world, this) : null; }
  static fresh(me, seed) {
    if (seed == null) seed = Math.floor(Math.random() * 2 ** 31);
    const s = { v: 1, kind: 'conquest', seed, cycle: 1, gold: CQ.start_gold, gold2: 0, heroes: {}, draws: 0, sinceHu: 0, smithDraws: 0, sinceZhen: 0, tokens: 0, tokensBought: 0, bag: [], gear: {}, uid: 1, cleared: {}, replay: { day: '', n: {} }, formation: [null, null, null, null, null, null, null, null, null], seen: {}, log: [], news: [] };
    const g = new ConquestGame(s);
    g.world = World.create(seed, me, g);
    s.world = g.world.st;
    g.world.startTurn();
    return g;
  }
  static load(str) { try { const s = JSON.parse(str); if (!s || s.kind !== 'conquest') return null; return new ConquestGame(s); } catch (e) { return null; } }
  get heroes() { return this.s.heroes; }
  get gold() { return this.s.gold; }
  set gold(v) { this.s.gold = v; }
  // roster 接口
  cqReset() { this.s.heroes = {}; }
  cqAdd(n) { return this.addHero(n); }
  cqRemove(n) {
    delete this.s.heroes[n];
    if (this.s.gear[n]) delete this.s.gear[n];
    this.s.formation = this.s.formation.map(x => x === n ? null : x);
  }
  cqPower(n) { const h = SG.D.H[n], s = this.s.heroes[n]; const base = [['武力', '武成长'], ['统率', '统成长'], ['智力', '智成长'], ['速度', '速成长']].reduce((a, [k, g]) => a + parseFloat(h[k]) + parseFloat(h[g]) * (s.lv - 1), 0); return base * (1 + SG.STARK[s.star]) * (1 + .15 * SG.TIER_ORDER.indexOf(h['品阶'])); }
  cqStat4(n) { const h = SG.D.H[n], s = this.s.heroes[n], k = 1 + SG.STARK[s.star], o = {}; for (const [c, g] of [['武力', '武成长'], ['统率', '统成长'], ['智力', '智成长'], ['速度', '速成长']]) o[c] = (parseFloat(h[c]) + parseFloat(h[g]) * (s.lv - 1)) * k; return o; }
  cqHp(n) { const s = this.s.heroes[n]; return s.hp / (s.lv * 1000); }
  cqSetHp(n, r) { const s = this.s.heroes[n]; if (s) s.hp = r * s.lv * 1000; }
  cqUnits(names) { if(SG.God&&!SG.God.check(this,names))throw Error('每队最多上阵一位神将');return names.map(n => this.unitOf(n)); }
  // 规则差异：招贤池锁本阵营 + 无阵营；征兵每千兵 2×等级；铁匠铺不按章封顶
  drawPoolFor(t) { const me = this.world.st.me; return SG.D.POOL[t].filter(n => [me, '无'].includes(SG.D.H[n]['阵营'])); }
  draw(k) {
    const cost = k === 10 ? SG.CFG.draw10 : SG.CFG.draw * k;
    if (this.s.gold < cost) return null;
    this.s.gold -= cost;
    const tiers = []; for (let i = 0; i < k; i++) tiers.push(this.drawTier());
    if (k === 10 && tiers.every(t => SG.TIER_ORDER.indexOf(t) < 2)) tiers[9] = '名';
    return tiers.map(t => { let L = this.drawPoolFor(t); if (!L.length) L = SG.D.POOL[t]; return Object.assign(this.addHero(this.rng.choice(L)), { tier: t }); });
  }
  drawGold() { return null; }
  recruitCost(n) { const h = this.hero(n); const lack = Math.max(0, h.lv * 1000 - h.hp); return Math.ceil(lack / 1000 * SG.CFG.recruit_per_k_conquest * h.lv); }
  trainPrice(lv) { return SG.CFG.train_cost_conquest(lv); }   // 霸业采用独立的提高后练级价格
  curChapter() { return 26; }
  guards() { const w = this.world, out = {}; for (const c of w.cities(w.st.me)) { const g = w.st.city[c].guard; if (g) out[g] = c; } return out; }
  toJSON() { this.s.world = this.world.st; return JSON.stringify(this.s); }
}
SG.ConquestGame = ConquestGame; SG.CQ_SAVE_KEY = 'sgqyl_conquest_v1';

if (typeof module !== 'undefined' && module.exports) module.exports = SG;
})(typeof window !== 'undefined' ? window : globalThis);
