// 每个将领的价值：X + 同档随机5人 vs 同档随机6人；带技能 / 去技能各跑一遍（配对种子）
const L = require('./lib.js');
const fs = require('fs');
const N = +(process.argv[2] || 300);
const tiers = (process.argv[3] || '无双,虎,名,骁,校').split(',');
const out = [];
for (const tier of tiers) {
  const pool = L.byTier[tier];
  for (const X of pool) {
    const r = {};
    for (const ns of [false, true]) {
      const R = L.rng(31337); let win = 0, m = 0, dealt = 0, healed = 0;
      for (let i = 0; i < N; i++) {
        const others = R.sample(pool.filter(n => n !== X), 5);
        const b = L.order(R.sample(pool, 6));
        const a = L.order([X].concat(others));
        const A = a.map(n => L.mk(n, 50, 1, null, ns && n === X)), B = b.map(n => L.mk(n));
        const f = L.fight(A, B, 50000 + i);
        if (f.w === 0) win++; else if (f.w === -1) win += .5; m += f.m;
        const u = A.find(u => u.name === X); dealt += u.tally.dealt / u.lvhp; healed += u.tally.healed / u.lvhp;
      }
      r[ns ? 'noskill' : 'skill'] = { win: win / N, m: m / N, dealt: dealt / N, healed: healed / N };
    }
    const h = L.H[X], sk = L.D.SKROW[X];
    out.push({ name: X, tier, role: h['定位'], fac: h['阵营'], type: sk ? sk['类型'] : '', skill: sk ? sk['技能'] : '', ...Object.fromEntries(Object.entries(r).flatMap(([k, v]) => Object.entries(v).map(([kk, vv]) => [k + '_' + kk, vv]))) });
  }
  console.error(tier, 'done');
}
fs.writeFileSync('e3_' + tiers.join('_') + '.json', JSON.stringify(out));
