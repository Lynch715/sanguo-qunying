// 统一尺子：X + 名档随机5人 vs 名档随机6人，看全体 358 人谁最能打
const L = require('./lib.js'); const fs = require('fs');
const N = 300, part = +process.argv[2], parts = +process.argv[3];
const ctx = L.byTier['名']; const out = [];
L.D.HLIST.forEach((X, idx) => {
  if (idx % parts !== part) return;
  const R = L.rng(2718); let win = 0;
  for (let i = 0; i < N; i++) {
    const others = R.sample(ctx.filter(n => n !== X), 5), b = L.order(R.sample(ctx, 6));
    const A = L.order([X].concat(others)).map(n => L.mk(n)), B = b.map(n => L.mk(n));
    const f = L.fight(A, B, 70000 + i); if (f.w === 0) win++; else if (f.w === -1) win += .5;
  }
  out.push({ name: X, tier: L.H[X]['品阶'], win: win / N });
});
fs.writeFileSync(`e4_${part}.json`, JSON.stringify(out));
