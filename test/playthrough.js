// 第 2 步验收：用 JS 引擎把 sim/playthrough.py 的一周目傻子策略跑一遍（逐行照搬 Player 和 run）
const { SG, DATA } = require('./load_node');
if (process.env.NOBOND) SG.BOND_ON = false;
SG.init(DATA);
SG.FX7 = false;   // 跟 python 口径一致
const D = SG.D, H = D.H, CFG = SG.CFG, TIER_ORDER = SG.TIER_ORDER;
const STAGES = D.STAGES, SKROW = D.SKROW, EQ = D.EQ, EQROWS = D.EQROWS, SET4 = D.SET4, SK = D.SK;
const STRATS = ['power', 'guard', 'antimag', 'burst', 'mag'];
const STRAT_CN = { power: '战力最高', guard: '厚统率带指挥', antimag: '抗谋略带解控回兵', burst: '速攻瞬发追击', mag: '谋略输出', duel: '单挑最强' };
const PCFG = { lv_cap: lv => lv, max_try: 15, side_try: 3, per_strat: 3, replay_cap: +(process.env.RCAP || 9), frag_star: [0, 5, 10, 15, 20] };
const POOL = D.POOL;
const CANBING = !!process.env.CANBING, VAR = process.env.VAR || '';
// V0.6 调参：V6=1 时按新规则跑——赢了只有上阵且活着的回 WINR；输了带残兵不回；卡钱卡兵就回头刷上一关（复刷不限）
const V6 = !!process.env.V6, WINR = +(process.env.WINR || CFG.regen_after_stage), WALL = !process.env.WTEAM;   // 默认按游戏现行：赢了全员回 regen_after_stage；WTEAM=1 只回上阵活着的
if (process.env.TRAIN) { const [a, b, e] = process.env.TRAIN.split(',').map(Number); CFG.train_cost = lv => Math.round(a + b * Math.pow(lv, e)); }
const mean = L => L.reduce((a, b) => a + b, 0) / L.length;

class Player {
  constructor(seed) {
    this.rng = SG.makeRng(seed * 2654435761 >>> 0);
    this.heroes = {}; this.gold = 1000; this.draws = 0; this.since_hu = 0; this.bag = []; this.shards = {}; this.tokens_bought = 0; this.spent = {}; this.free = 0; this.d10 = 0; this.lvs = 0; this.wins = 0; this.ach = {}; this.clean = 0; this.everWon = {};
    const gift = [this.rng.choice(D.HLIST), this.rng.choice(D.HLIST)];
    gift.forEach(n => this.add(n)); this.gift = gift;
  }
  sp(k, v) { this.spent[k] = (this.spent[k] || 0) + v; }
  add(n) {
    if (this.heroes[n]) {
      const h = this.heroes[n]; h.frag += CFG.frag_per_dup;
      while (h.star < 5 && h.frag >= PCFG.frag_star[h.star]) { h.frag -= PCFG.frag_star[h.star]; h.star++; }
    } else this.heroes[n] = { lv: 1, star: 1, frag: 0 };
  }
  draw_one() {
    const r = this.rng.random(); let acc = 0, tier = '校';
    for (const t of TIER_ORDER) { acc += CFG.pool[t]; if (r < acc) { tier = t; break; } }
    this.draws++; this.since_hu++;
    if (this.since_hu >= 50 && TIER_ORDER.indexOf(tier) < 3) tier = '虎';
    if (tier === '虎' || tier === '无双') this.since_hu = 0;
    return tier;
  }
  draw10() {
    this.d10++; this.gold -= CFG.draw10; const tiers = []; for (let i = 0; i < 10; i++) tiers.push(this.draw_one());
    if (tiers.every(t => TIER_ORDER.indexOf(t) < 2)) tiers[9] = '名';
    for (const t of tiers) this.add(this.rng.choice(POOL[t]));
  }
  power(n) {
    const h = H[n], s = this.heroes[n];
    const base = [['武力', '武成长'], ['统率', '统成长'], ['智力', '智成长'], ['速度', '速成长']].reduce((a, [k, g]) => a + parseFloat(h[k]) + parseFloat(h[g]) * (s.lv - 1), 0);
    return base * (1 + .05 * (s.star - 1)) * (1 + .15 * TIER_ORDER.indexOf(h['品阶']));
  }
  stat4(n) {
    const h = H[n], s = this.heroes[n], k = 1 + .05 * (s.star - 1), o = {};
    for (const [c, g] of [['武力', '武成长'], ['统率', '统成长'], ['智力', '智成长'], ['速度', '速成长']]) o[c] = (parseFloat(h[c]) + parseFloat(h[g]) * (s.lv - 1)) * k;
    return o;
  }
  score(n, strat) {
    const v = this.stat4(n), r = SKROW[n] || {}, typ = r['类型'] || '', dsl = r['DSL'] || '';
    const tier = 1 + .15 * TIER_ORDER.indexOf(H[n]['品阶']);
    if (strat === 'power') return this.power(n);
    if (strat === 'duel') return (v['武力'] * 1.2 + v['统率'] + v['速度'] * .3) * tier * (H[n]['定位'] === '武将' ? 1.15 : .8);
    if (strat === 'guard') return (v['统率'] * 1.6 + v['武力'] * .8 + v['智力'] * .3) * tier * ((typ === '指挥' || dsl.includes('shield')) ? 1.2 : 1);
    if (strat === 'antimag') return (v['统率'] + v['智力'] * 1.2 + v['武力'] * .5) * tier * (['cleanse', 'heal', 'dispel'].some(k => dsl.includes(k)) ? 1.25 : 1);
    if (strat === 'burst') return (v['武力'] * 1.3 + v['速度'] * .9 + v['统率'] * .4) * tier * ((typ === '主动·瞬发' || typ === '追击') ? 1.2 : 1);
    if (strat === 'mag') return (v['智力'] * 1.5 + v['速度'] * .7 + v['统率'] * .4) * tier * (dsl.includes('mag') ? 1.15 : 1);
    return this.power(n);
  }
  team(stage, strat = 'power') {
    const need = (stage['必带'] || '').split(',').filter(x => x && this.heroes[x]);
    const lim = stage['限制'] || '';
    const m = /只能带(\S)人/.exec(lim);
    const solo = !!m || lim.includes('一对一');
    const st_ = (solo && strat === 'power') ? 'duel' : strat;
    const rest = SG.util.sortBy(Object.keys(this.heroes).filter(n => !need.includes(n)), n => -this.score(n, st_));
    if (m) return need.concat(rest).slice(0, { '一': 1, '两': 2, '三': 3 }[m[1]]);
    if (lim.includes('一对一')) return need.concat(rest).slice(0, 1);
    return need.concat(rest).slice(0, 9);
  }
  // V0.7 战斗经验（hp 存的是比例：升级新长的一千兵是满的）
  gainExp(n, e) {
    const h = this.heroes[n]; if (!h) return 0; const lv0 = h.lv, hp0 = h.hp != null ? h.hp : 1;
    const up = SG.expAdd(h, e, 50); if (up && h.hp != null) h.hp = Math.min(1, (hp0 * lv0 + up) / h.lv);
    if (up) this.lvs += up; return up;
  }
  train(names, cap) {
    for (const n of SG.util.sortBy(names, n => -this.power(n))) {
      const h = this.heroes[n];
      while (h.lv < cap) { const c = CFG.train_cost(h.lv + 1); if (this.gold < c) return; this.gold -= c; this.sp('练级', c); h.lv++; this.lvs++; }
    }
  }
  token_price(k = 0) { return Math.min(CFG.token_cap, CFG.token_price + CFG.token_step * Math.floor((this.tokens_bought + k) / 10)); }
  star_up(names, reserve) {
    for (const n of SG.util.sortBy(names, n => -this.power(n))) {
      const h = this.heroes[n];
      while (h.star < 5) {
        const need = Math.trunc(SG.util.pyRound(CFG.star_need[h.star] * CFG.star_q[H[n]['品阶']]));
        const lack0 = Math.max(0, need - h.frag), fr = Math.min(this.free, lack0), lack = lack0 - fr;
        let cost = 0; for (let i = 0; i < lack; i++) cost += this.token_price(i);
        if (this.gold - cost < reserve) break;
        this.gold -= cost; this.sp('兵符', cost); this.tokens_bought += lack; this.free -= fr; h.frag = 0; h.star++;
      }
    }
  }
  smith10() {
    this.gold -= CFG.smith10; this.sp('铁匠铺', CFG.smith10);
    const pool = { '凡品': .35, '良品': .30, '精品': .20, '珍品': .10, '神品': .04 };
    for (let i = 0; i < 10; i++) {
      const r = this.rng.random(); let acc = 0, tier = '凡品';
      for (const t in pool) { acc += pool[t]; if (r < acc) { tier = t; break; } }
      const c = EQROWS.filter(e => e['档'] === tier && !e['归属']);
      this.bag.push(this.rng.choice(c));
    }
  }
  sell_junk() {
    let keep = []; const by = {};
    for (const e of this.bag) (by[e['槽']] = by[e['槽']] || []).push(e);
    for (const k in by) {
      const L = SG.util.sortBy(by[k], e => -parseFloat(e['固定']));
      keep = keep.concat(L.slice(0, 3));
      for (const e of L.slice(3)) { if (!e['归属']) { this.gold += CFG.sell[e['档']]; this.sp('卖装备', -CFG.sell[e['档']]); } else keep.push(e); }
    }
    this.bag = keep;
  }
  // 霸业 roster 接口（hp 存成比例，照 conquest.py）
  get cqHeroes() { return this.heroes; }
  cqReset() { this.heroes = {}; this.gold = SG.CQ ? SG.CQ.start_gold : 3000; this.spent = {}; }
  cqAdd(n) { this.add(n); }
  cqRemove(n) { delete this.heroes[n]; }
  cqPower(n) { return this.power(n); }
  cqStat4(n) { return this.stat4(n); }
  cqHp(n) { const h = this.heroes[n]; return h.hp != null ? h.hp : 1.0; }
  cqSetHp(n, r) { if (this.heroes[n]) this.heroes[n].hp = r; }
  cqUnits(names) { const gears = this.equip_team(names); return names.map((n, i) => { const u = mk_player_unit(this, n, i < gears.length ? gears[i] : null); u.hp = u.maxhp * this.cqHp(n); return u; }); }
  equip_team(names) {
    const best = {};
    for (const e of this.bag) { const k = e['槽']; if (!best[k] || parseFloat(e['固定']) > parseFloat(best[k]['固定'])) best[k] = e; }
    return names.slice(0, 3).map(() => Object.values(best));
  }
}
function mk_player_unit(p, n, gear) {
  const s = p.heroes[n]; const u = new SG.Unit(H[n], s.lv, s.star); u.skill = SK[n] || null;
  if (gear) SG.wear(u, gear.map(e => e['名']), EQ, SET4);
  return u;
}
function strat_order(stage) {
  const named = stage['敌方'].split('、').filter(e => H[e]);
  if (!named.length) return STRATS;
  const a = mean(named.map(e => parseFloat(H[e]['武力']))), i = mean(named.map(e => parseFloat(H[e]['智力'])));
  const chase = named.filter(e => ['追击', '主动·瞬发'].includes((SKROW[e] || {})['类型'])).length;
  if (i > a) return ['power', 'antimag', 'guard', 'burst', 'mag'];
  if (chase >= named.length / 2) return ['power', 'guard', 'burst', 'antimag', 'mag'];
  return ['power', 'burst', 'guard', 'mag', 'antimag'];
}
let LAST = null;
// V0.3 功名：ACH=1 时把傻子一周目够得着的那些条按档发奖（小=金1000，中=兵符1，大=兵符3，黄金不算）
const ACH_ON = !!process.env.ACH;
function achTick(p) {
  if (!ACH_ON) return;
  const own = Object.keys(p.heroes), wu = own.filter(n => H[n]['品阶'] === '无双').length;
  const ch = c => STAGES.some(s => +s['章'] === c && s['类型'] === '章末' && p.everWon[s.id]);
  const nm = n => STAGES.some(s => s['关'] === n && p.everWon[s.id]);
  const all = t => STAGES.filter(s => s['类型'] === t).every(s => p.everWon[s.id]);
  const L = [['初聚', own.length >= 9, '小'], ['三十六员', own.length >= 36, '中'], ['百将', own.length >= 100, '中'], ['二百将', own.length >= 200, '大'],
    ['无双五人', wu >= 5, '中'], ['无双十五', wu >= 15, '大'], ['求贤若渴', p.d10 >= 20, '小'], ['广纳英雄', p.d10 >= 50, '中'],
    ['桃园', ch(1), '小'], ['讨董', ch(3), '小'], ['官渡', ch(10), '中'], ['赤壁', ch(14), '中'], ['汉中王', ch(18), '中'], ['出师表', ch(22), '中'], ['三国归晋', ch(26), '大'],
    ['秘藏', all('隐藏'), '大'], ['外传', all('支线'), '大'], ['单挑', nm('神亭酣斗') && nm('裸衣斗马超'), '中'], ['死守', ['据水断桥', '草船借箭', '单刀赴会', '空城计'].every(nm), '中'],
    ['过关斩将', nm('过五关斩六将'), '中'], ['七擒', nm('七擒七纵'), '中'], ['全须全尾', p.clean >= 20, '中'], ['百战', p.wins >= 100, '小'],
    ['五星', own.some(n => p.heroes[n].star >= 5), '小'], ['督练', p.lvs >= 500, '中']];
  for (const [id, ok, t] of L) if (ok && !p.ach[id]) { p.ach[id] = 1; if (t === '小') p.gold += 1000; else p.free += t === '中' ? 1 : 3; }
}
function conscript(p, names) {   // 残兵版：缺兵三成以上就征兵（4×等级每千兵），排在练级前面
  for (const n of names) {
    const h = p.heroes[n], hp = h.hp != null ? h.hp : 1;
    if (hp >= 0.7) continue;
    const cost = Math.ceil((1 - hp) * h.lv * (process.env.RK ? +process.env.RK * h.lv : (VAR === 'C' || VAR === 'DC' ? h.lv : CFG.recruit_k(h.lv))));
    if (VAR === 'DN') continue;
    if (p.gold >= cost) { p.gold -= cost; p.sp('征兵', cost); h.hp = 1; }
  }
}
function fight(p, stage, ease, strat) {
  const names = p.team(stage, strat);
  if (!names.length) return [false, 0];
  const gears = p.equip_team(names);
  const A = names.map((n, i) => { const u = mk_player_unit(p, n, i < gears.length ? gears[i] : null); if (CANBING) u.hp = u.maxhp * Math.max(0.001, p.heroes[n].hp != null ? p.heroes[n].hp : 1); return u; });
  const r = SG.fightStage(stage, A, ease, {});
  if (!process.env.NOEXP && r.foes && r.foes.length) { const flv = r.foes[0].lv, nf = SG.stageFoes(stage, 1).names.length; A.forEach(u => { const h = p.heroes[u.name]; p.gainExp(u.name, SG.expFor(h.lv, flv, nf, r.win, u.alive(), false)); }); }
  if (CANBING) {
    if (V6) { A.forEach(u => { const h = p.heroes[u.name]; h.hp = Math.max(0, u.hp / u.maxhp); if (r.win && u.hp > 0 && !WALL) h.hp = Math.min(1, h.hp + WINR); }); if (r.win && WALL) for (const n in p.heroes) { const h = p.heroes[n]; h.hp = Math.min(1, (h.hp != null ? h.hp : 1) + WINR); } LAST = [A, r.foes || []]; return [r.win, r.rounds]; }
    if (VAR !== 'D' && VAR !== 'L' && VAR !== 'N' && !r.win) { LAST = [A, r.foes || []]; return [r.win, r.rounds]; }   // V0.6 游戏规则：输了退回出战前，谁都不回（VAR=D 是 V0.5 的输了回满）
    A.forEach(u => { p.heroes[u.name].hp = Math.max(0, u.hp / u.maxhp); });
    const regen = (VAR === 'N') ? 0 : (VAR === 'L' && !r.win) ? 0 : (VAR === 'B' && r.win) ? 1 : ((VAR === 'D' || VAR === 'DC' || VAR === 'DN') && !r.win) ? 1 : VAR === 'A' ? 0.5 : 0.2;
    for (const n in p.heroes) { const h = p.heroes[n]; h.hp = Math.min(1, (h.hp != null ? h.hp : 1) + regen); }
  }
  LAST = [A, r.foes || []];
  return [r.win, r.rounds];
}
function run(seed) {
  SG.setBattleSeed(seed * 7919 + 1);
  const p = new Player(seed); const res = []; let stuck = null;
  for (let idx = 0; idx < STAGES.length; idx++) {
    const stage = STAGES[idx];
    const lv = +stage['等级'], ch = +stage['章'], ease = CFG.foe_mul(ch, stage['类型']);
    const cap = PCFG.lv_cap(lv);
    let tries = 0, won = false, replays = 0, win_strat = '', margin = 0, tlv = 0;
    const main = stage['类型'] === '主线' || stage['类型'] === '章末';
    const order = main ? strat_order(stage) : ['power'];
    const per = main ? PCFG.per_strat : PCFG.side_try;
    for (const strat of order) {
      for (let k = 0; k < per; k++) {
        while (Object.keys(p.heroes).length < 4 && p.gold >= CFG.draw) { p.gold -= CFG.draw; p.sp('招贤', CFG.draw); p.add(p.rng.choice(POOL[p.draw_one()])); }
        if (CANBING && process.env.FARM && idx > 0) {   // 复刷不限：队里有人缺兵三成以上，就回头刷上一关（按赢算：拿复刷金、全员回两成），最多 40 次
          const tm = p.team(stage, strat); let k = 0;
          while (k < 40 && tm.some(n => (p.heroes[n].hp != null ? p.heroes[n].hp : 1) < 0.7)) { p.gold += CFG.gold_replay(+STAGES[idx - 1]['等级']); if (VAR !== 'N') for (const n in p.heroes) { const h = p.heroes[n]; h.hp = Math.min(1, (h.hp != null ? h.hp : 1) + 0.2); } k++; if (VAR === 'N') { conscript(p, tm); } p.farm = (p.farm || 0) + 1; }
        }
        if (V6 && idx > 0) {
          const tm = p.team(stage, strat), capL = Math.min(50, cap + Math.min(6, Math.floor(tries / 5)));
          const need = () => tm.reduce((a, n) => { const h = p.heroes[n], hp = h.hp != null ? h.hp : 1; let c = hp < 0.7 ? Math.ceil((1 - hp) * h.lv * (process.env.RK ? +process.env.RK * h.lv : CFG.recruit_k(h.lv))) : 0; for (let l = h.lv + 1; l <= capL; l++) c += CFG.train_cost(l); return a + c; }, 0);
          let k = 0;
          while (k < 200 && p.gold < need()) { p.gold += CFG.gold_replay(+STAGES[idx - 1]['等级']); for (const n of (WALL ? Object.keys(p.heroes) : tm)) { const h = p.heroes[n]; if (WALL || (h.hp != null ? h.hp : 1) > 0) h.hp = Math.min(1, (h.hp != null ? h.hp : 1) + WINR); } k++; }
          p.farm = (p.farm || 0) + k; (p.farmCh = p.farmCh || {})[ch] = (p.farmCh[ch] || 0) + k;
        }
        if (CANBING) conscript(p, p.team(stage, strat));
        p.train(p.team(stage, strat), Math.min(50, cap + Math.min(6, Math.floor(tries / 5))));
        while (Object.keys(p.heroes).length < 9 && p.gold >= CFG.draw + 200) { p.gold -= CFG.draw; p.sp('招贤', CFG.draw); p.add(p.rng.choice(POOL[p.draw_one()])); }
        const nh = Object.keys(p.heroes).length;
        if (p.gold >= CFG.draw10 + (nh < 30 ? 300 : 3000) && nh < 80) { p.sp('招贤', CFG.draw10); p.draw10(); }
        p.sell_junk();
        p.star_up(p.team(stage, strat), 2000);
        if (p.gold >= CFG.smith10 + 3000 && ch >= 6) p.smith10();
        tries++;
        if (process.env.DBG && ch <= 1) console.log(stage["关"], strat, "金", Math.trunc(p.gold), p.team(stage, strat).map(n => n + p.heroes[n].lv + "级" + Math.round((p.heroes[n].hp != null ? p.heroes[n].hp : 1) * 100) + "%").join(" "));
        const [w] = fight(p, stage, ease, strat); won = w;
        if (won) {
          const [A] = LAST;
          p.wins++; p.everWon[stage.id] = 1; if (stage['类型'] === '章末' && A.every(x => x.alive())) p.clean++; achTick(p);
          margin = A.length ? A.reduce((a, x) => a + x.hp, 0) / Math.max(1, A.reduce((a, x) => a + x.maxhp, 0)) : 0;
          const tm = p.team(stage, strat); tlv = tm.length ? mean(tm.map(n => p.heroes[n].lv)) : 0;
          win_strat = strat; break;
        }
        if (idx > 0 && replays < PCFG.replay_cap) { p.gold += CFG.gold_replay(+STAGES[Math.max(0, idx - 1 - Math.floor(replays / 3))]['等级']); replays++; if (CANBING) for (const n in p.heroes) { const h = p.heroes[n]; h.hp = Math.min(1, (h.hp != null ? h.hp : 1) + 0.2); } }
        if (tries % 5 === 0 && p.gold >= CFG.draw) { p.gold -= CFG.draw; p.sp('招贤', CFG.draw); p.add(p.rng.choice(POOL[p.draw_one()])); }
      }
      if (won) break;
    }
    res.push({ idx, ch, name: stage['关'], type: stage['类型'], lv, tries, won, heroes: Object.keys(p.heroes).length, gold: Math.trunc(p.gold), margin: won ? margin : 0, tlv: won ? tlv : 0, strat: win_strat });
    if (!won) { if (stage['类型'] === '支线' || stage['类型'] === '隐藏') continue; stuck = stage; break; }
    p.gold += CFG.gold_clear(lv) * (stage['类型'] === '章末' ? CFG.boss_mult : (stage['类型'] === '隐藏' ? CFG.hidden_mult : 1));
    for (const n of (stage['入伙'] || '').split(',').filter(x => x)) p.add(n);
    const tier = SG.EQ_TIERS[Math.min(4, ch <= 25 ? Math.floor((ch - 1) / 5) : 4)];
    const cands = EQROWS.filter(e => e['档'] === tier && !e['归属']);
    if (cands.length) p.bag.push(p.rng.choice(cands));
  }
  return [p, res, stuck];
}

module.exports = { Player, mk_player_unit, run };
if (require.main === module) {
const N = +(process.argv[2] || 8);
const allres = [], stucks = {}, cleared = [];
const t0 = Date.now();
for (let seed = 0; seed < N; seed++) {
  const [p, res, stuck] = run(seed);
  const main = res.filter(r => r.type === '主线' || r.type === '章末');
  cleared.push(main.filter(r => r.won).length);
  if (stuck) stucks[`${stuck['章']} ${stuck['关']}`] = (stucks[`${stuck['章']} ${stuck['关']}`] || 0) + 1;
  allres.push(res);
  if (V6) { (globalThis.FARMS = globalThis.FARMS || []).push(p); }
  console.log(`seed ${seed}: 主线通 ${cleared[cleared.length - 1]}/108，卡在 ${stuck ? stuck['章'] + ' ' + stuck['关'] : '—'}，将领 ${Object.keys(p.heroes).length}，抽了 ${p.draws} 次，开局 ${p.gift.join('、')}，花销 ${JSON.stringify(p.spent)}`);
}
const per = {};
for (const res of allres) for (const r of res) { const k = `${r.ch}|${r.name}|${r.type}`; (per[k] = per[k] || []).push(r.tries); }
console.log('\n重试最多的关（平均）：');
Object.entries(per).sort((a, b) => mean(b[1]) - mean(a[1])).slice(0, 12).forEach(([k, v]) => { const [c, n, t] = k.split('|'); console.log(`  第${c}章 ${n}（${t}）平均 ${mean(v).toFixed(1)} 次，${v.length} 局到达`); });
const chap = {};
for (const k in per) { const [c, , t] = k.split('|'); if (t === '主线' || t === '章末') chap[c] = (chap[c] || []).concat(per[k]); }
console.log('\n各章主线平均重试：', Object.entries(chap).sort((a, b) => a[0] - b[0]).map(([c, v]) => `${c}:${mean(v).toFixed(1)}`).join(' '));
console.log('卡关分布：', JSON.stringify(stucks));
if (V6) { const F = globalThis.FARMS; console.log('回头刷关次数（每局）：均', Math.round(mean(F.map(p => p.farm || 0))), '；分章均：', [1, 5, 10, 15, 20, 26].map(c => c + '章 ' + Math.round(mean(F.map(p => (p.farmCh || {})[c] || 0)))).join('，')); }
const walls = Object.entries(chap).filter(([c, v]) => mean(v) >= 3).map(([c]) => +c);
console.log('平均重试 ≥3 的章：', walls.join('、'));
require('fs').writeFileSync(__dirname + '/playthrough_js.json', JSON.stringify({ allres, stucks, cleared, sec: (Date.now() - t0) / 1000 }));
console.log('用时', (Date.now() - t0) / 1000, 's');
}
