const L = require('./lib.js');
const N = 400;
function run(lo, hi, hpHi) {
  const R = L.rng(161803); let win = 0;
  for (let i = 0; i < N; i++) {
    const a = L.order(R.sample(L.byTier[lo], 9)), b = L.order(R.sample(L.byTier[hi], 9));
    const A = a.map(n => L.mk(n)), B = b.map(n => L.mk(n)); B.forEach(u => u.hp = u.maxhp * hpHi);
    const f = L.fight(A, B, 123000 + i); if (f.w === 0) win++; else if (f.w === -1) win += .5;
  }
  return win / N;
}
for (const [lo, hi] of [['虎', '无双'], ['名', '虎'], ['骁', '名'], ['校', '骁']]) {
  const r = {}; for (const h of [.7, .6, .5, .4]) r[h] = (run(lo, hi, h) * 100).toFixed(0) + '%';
  console.log(hi, '残兵 vs', lo, '满兵 → 低档胜率', JSON.stringify(r));
}
