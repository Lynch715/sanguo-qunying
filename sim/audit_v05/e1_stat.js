// 属性边际价值：镜像阵容，A 方某一维 +10%（直接乘 base），看胜率
const L = require('./lib.js');
const N = 3000;
for (const tier of ['名', '无双']) {
  for (const sk of [false, true]) {
    const res = {};
    for (const k of ['none', 'atk', 'def', 'int', 'agi', 'hp']) {
      const R = L.rng(777); let win = 0, m = 0, rr = 0;
      for (let i = 0; i < N; i++) {
        const names = L.order(R.sample(L.byTier[tier], 6));
        const A = names.map(x => L.mk(x, 50, 1, null, !sk)), B = names.map(x => L.mk(x, 50, 1, null, !sk));
        for (const u of A) { if (k === 'hp') { u.maxhp *= 1.1; u.hp = u.maxhp; } else if (k !== 'none') u.base[k] *= 1.1; }
        const f = L.fight(A, B, 1000 + i); if (f.w === 0) win++; else if (f.w === -1) win += .5; m += f.m; rr += f.r;
      }
      res[k] = `${(win / N * 100).toFixed(1)}%`;
    }
    console.log(tier, sk ? '带技能' : '无技能', JSON.stringify(res));
  }
}
