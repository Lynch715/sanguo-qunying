const assert = require('assert');
const { SG, DATA } = require('./load_node'); SG.init(DATA);
const st = SG.D.STAGES[0];
const rows = [];
for (const cycle of [1, 2, 3]) {
  const g = SG.Game.fresh(42); g.s.cycle = cycle;
  g.s.tx = { cycle, on: [], used: [], seen: [] };
  const f = g.foesOf(st.id);
  const r = SG.fightStage(st, [], SG.stageEase(st), { cycle });
  const u = r.foes[0], raw = SG.mkEnemy(f.names[0], f.lv, f.star, SG.stageEase(st));
  assert(Math.abs(u.maxhp / raw.maxhp - SG.cycleRules(cycle).hp) < 1e-9);
  for (const k in raw.base) assert(Math.abs(u.base[k] / raw.base[k] - SG.cycleRules(cycle).stats) < 1e-9);
  assert.equal(g.goldMul(), [1, .7, .5][cycle - 1]);
  assert.equal(g.clearGold2('隐藏'), [3, 3, 1][cycle - 1]);
  assert.equal(g.clearGold2('章末'), [1, 1, 0][cycle - 1]);
  const army = ['关羽', '张飞', '赵云', '马超', '黄忠', '诸葛亮'];
  for (const n of army) { g.addHero(n); Object.assign(g.hero(n), { lv: 70, hp: 70000, star: 5 }); }
  g.s.formation = [...army, null, null, null];
  const original = g.unitOf.bind(g);
  g.unitOf = n => { const u = original(n); for (const k in u.base) u.base[k] *= 100; return u; };
  const before = g.s.gold;
  const result = g.fight(st.id, g.s.formation, { seed: 1, quick: true });
  assert(result.res.win);
  assert.equal(result.rew.gold, Math.round(SG.CFG.gold_clear(f.lv) * g.goldMul()));
  assert.equal(g.s.gold - before, result.rew.gold);
  const replay = g.fight(st.id, g.s.formation, { seed: 2, quick: true });
  assert(replay.res.win);
  assert.equal(replay.rew.gold, Math.round(SG.CFG.gold_replay(f.lv) * g.goldMul()));
  g.s.tx.on = ['天狼']; assert.equal(g.clearGold2('主线'), cycle >= 2 ? 1 : 0);
  g.s.tx.on = ['岁星']; assert.equal(g.goldMul(), [1, .7 * 1.5, .75][cycle - 1]);
  rows.push({ cycle, lv: f.lv, star: f.star, power: g.stagePower(st.id), gold: Math.round(SG.CFG.gold_clear(f.lv) * g.goldMul()) });
}
assert(rows[1].power > rows[0].power * 2);
assert(rows[2].power > rows[1].power * 1.4);
console.table(rows);
console.log('周目难度、兵力、奖励与天象回归检查通过');
