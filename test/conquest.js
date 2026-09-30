// 第 4 步验收：JS 引擎跑 conquest.py 的傻子策略
const { SG, DATA } = require('./load_node'); SG.init(DATA); SG.FX7 = false;
const { Player } = require('./playthrough');
const D = SG.D, H = D.H, CFG = SG.CFG, CQ = SG.CQ, FACTIONS = SG.CQ_FACTIONS, RANSOM = SG.CQ_RANSOM;
const DEF = [], SNAP = [], ACTS = {}, ATK = [];
const mean = L => L.reduce((a, b) => a + b, 0) / L.length;
function conscript(w, names) {
  const p = w.p;
  for (const n of names) {
    const h = p.heroes[n]; const hp = h.hp != null ? h.hp : 1.0;
    if (hp >= 0.7) continue;
    const lack = (1 - hp) * h.lv, cost = Math.trunc(lack * 2 * h.lv);
    if (cost > 0 && p.gold - cost >= 500) { p.gold -= cost; p.sp('征兵', cost); h.hp = 1.0; }
  }
}
function player_turn(w) {
  const p = w.p, st = w.st;
  w.startTurn();
  while (Object.keys(p.heroes).length < 12 && p.gold >= CFG.draw + 1000) {
    p.gold -= CFG.draw; p.sp('招贤', CFG.draw);
    const t = p.draw_one(); const c = w.pool.filter(n => H[n]['品阶'] === t);
    if (c.length) p.add(w.rng.choice(c));
  }
  w.reassign_guards();
  let team = SG.util.sortBy(w.free_heroes(), x => -p.power(x)).slice(0, 9);
  const cap = Math.min(50, CQ.foe_lv(st.turn) + 2);
  p.train(team, cap); p.sell_junk(); p.star_up(team, 3000);
  if (p.gold >= CFG.smith10 + 5000 && st.turn >= 6) p.smith10();
  for (const pr of SG.util.sortBy(st.prisoners.slice(), x => -RANSOM[H[x[0]]['品阶']])) {
    const cost = RANSOM[H[pr[0]]['品阶']];
    if (p.gold - cost >= 3000) { p.gold -= cost; p.sp('招降', cost); p.add(pr[0]); st.prisoners.splice(st.prisoners.indexOf(pr), 1); }
  }
  team = SG.util.sortBy(w.free_heroes(), x => -p.power(x)).slice(0, 9); p.train(team, cap); p.star_up(team, 1500); conscript(w, team);
  if (!team.length) return '无人';
  if (mean(team.map(n => p.heroes[n].hp != null ? p.heroes[n].hp : 1)) < CQ.rest_below) return '休兵';
  const targets = w.targets();
  if (!targets.length) return '无目标';
  const mp = w.my_power(team);
  const strong = targets.filter(t => mp / Math.max(1, w.foe_power(t)) >= 1.0);
  const best = strong.length ? SG.util.argmax(strong, t => w.foe_power(t)) : SG.util.argmax(targets, t => mp / Math.max(1, w.foe_power(t)));
  const ratio = mp / Math.max(1, w.foe_power(best));
  if (ratio < CQ.attack_min_ratio) return '休比';
  const A = w.my_units(team), B = w.foe_units(best);
  const h0 = mean(team.map(n => p.cqHp(n)));
  const [r] = new SG.Battle(A, B).run();
  const res = w.afterAttack(best, A, B, r);
  const h1 = mean(team.map(n => p.cqHp(n)));
  conscript(w, team);
  ATK.push([h0, ratio, h1, mean(team.map(n => p.cqHp(n))), r, team.length]);
  return res.won ? '攻下' + best : '攻' + best + '败';
}
function runOne(seed, me) {
  SG.setBattleSeed(seed * 31 + 7);
  const p = new Player(seed);
  const w = SG.World.create(seed, me, p);
  const hist = [];
  for (let t = 1; t <= CQ.max_turn; t++) {
    const act = player_turn(w);
    for (const f of FACTIONS) {
      if (f === me) continue;
      const plan = w.aiPlan(f);
      if (plan && plan.kind === 'vsme') {
        const names = w.defenders(plan.best);
        if (!names.length) w.afterDefense(plan, [], [], 1);
        else { const { A, B, gb } = w.defenseUnits(plan, null); const [r, rr] = new SG.Battle(A, B).run(); const o = w.afterDefense(plan, A, B, r); DEF.push([w.st.turn, names.length, gb, o.won, rr, plan.ratio]); }
      }
    }
    const n = w.cities(me).length; hist.push([t, n, act]); { const k = act.split('(')[0].slice(0, 2); ACTS[k] = (ACTS[k] || 0) + 1; }
    if ([5, 12, 15, 20, 30].includes(t)) SNAP.push([t, n, Object.keys(p.heroes).length, w.free_heroes().length, Math.trunc(p.gold), Math.round(Object.keys(w.st.city).filter(c => ![me, '无'].includes(w.st.city[c].owner)).reduce((a, c) => a + w.foe_power(c), 0) / 1000), Math.round(w.my_power(SG.util.sortBy(w.free_heroes(), x => -p.power(x)).slice(0, 9))), Object.values(w.st.city).reduce((a, c) => a + c.garrison.filter(x => H[x]).length, 0), ...(T => T.length ? [mean(T.map(n => p.heroes[n].lv)), mean(T.map(n => p.cqHp(n))), mean(T.map(n => p.heroes[n].star))] : [0, 0, 0])(SG.util.sortBy(w.free_heroes(), x => -p.power(x)).slice(0, 9)), w.st.prisoners.length, hist.filter(h => h[2].startsWith('攻下')).length]);
    const s = w.status();
    if (s) return [s, t, hist, w];
  }
  return ['timeout', CQ.max_turn, hist, w];
}
const N = +(process.argv[2] || 4);
const facs = process.argv[3] ? [process.argv[3]] : FACTIONS;
let totWin = 0, tot = 0;
for (const me of facs) {
  const res = [];
  for (let seed = 0; seed < N; seed++) {
    const [out, t, hist, w] = runOne(seed, me);
    res.push([out, t]);
    const at = k => (hist.find(h => h[0] === k) || hist[hist.length - 1])[1];
    const fails = hist.filter(h => h[2].endsWith('败')).length;
    console.log(`${me} seed${seed}: ${out} 回合${t} 城数 10/20/40/80=${at(10)}/${at(20)}/${at(40)}/${at(80)} 攻败${fails} 被夺${w.st.log.length} 将领${Object.keys(w.p.heroes).length} 花销${JSON.stringify(w.p.spent)}`);
  }
  for (const T of [5, 12, 15, 20, 30]) { const L = SNAP.filter(x => x[0] === T); console.log('SNAP', T, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => mean(L.map(x => x[i])).toFixed(1)).join(' ')); } SNAP.length = 0;
  console.log('ATK', ATK.length, [0, 1, 2, 3].map(i => mean(ATK.map(a => a[i])).toFixed(3)).join(' '), ATK.filter(a => a[4] === 0).length, mean(ATK.map(a => a[5]))); ATK.length = 0;
  console.log('动作', JSON.stringify(ACTS)); for (const k in ACTS) delete ACTS[k];
  console.log('DEF', DEF.length, 'won', DEF.filter(d => d[3]).length, 'avg gb', mean(DEF.map(d => d[2])).toFixed(2), 'avg n', mean(DEF.map(d => d[1])).toFixed(2), 'avg r', mean(DEF.map(d => d[4])).toFixed(1), 'avg ratio', mean(DEF.map(d=>d[5])).toFixed(2)); DEF.length = 0;
  const wins = res.filter(r => r[0] === 'win');
  totWin += wins.length; tot += res.length;
  console.log(`== ${me}: 赢 ${wins.length}/${N}，平均回合 ${wins.length ? mean(wins.map(r => r[1])).toFixed(0) : '-'}；输 ${res.filter(r => r[0] === 'lose').length}，超时 ${res.filter(r => r[0] === 'timeout').length}`);
}
console.log(`合计 赢 ${totWin}/${tot}`);
