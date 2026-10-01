// 档差 vs 星级 vs 装备 vs 兵力：A 档（加成）对 B 档（裸），9v9
const L = require('./lib.js');
const N = +(process.argv[2] || 600);
const EQ = L.D.EQROWS.filter(e => !e['归属']);
function set(n, tier) {
  const H = L.H[n]; const main = (+H['智力'] + +H['智成长'] * 49) > (+H['武力'] + +H['武成长'] * 49) ? 'int' : 'atk';
  const g = s => { const c = EQ.filter(e => e['槽'] === s && e['档'] === tier); return (c.find(e => e['维'] === main && !e['DSL']) || c.find(e => !e['DSL']) || c[0]).id; };
  return ['武器', '盔甲', '马匹', '宝物'].map(g);
}
function run(ta, tb, optA = {}, optB = {}) {
  const R = L.rng(161803); let win = 0;
  for (let i = 0; i < N; i++) {
    const a = L.order(R.sample(L.byTier[ta], 9)), b = L.order(R.sample(L.byTier[tb], 9));
    const A = a.map(n => L.mk(n, 50, optA.star || 1, optA.gear ? set(n, optA.gear) : null)), B = b.map(n => L.mk(n, 50, optB.star || 1, optB.gear ? set(n, optB.gear) : null));
    if (optA.hp) A.forEach(u => u.hp = u.maxhp * optA.hp); if (optB.hp) B.forEach(u => u.hp = u.maxhp * optB.hp);
    const f = L.fight(A, B, 123000 + i); if (f.w === 0) win++; else if (f.w === -1) win += .5;
  }
  return (win / N * 100).toFixed(0) + '%';
}
const pairs = [['虎', '无双'], ['名', '虎'], ['骁', '名'], ['校', '骁']];
for (const [lo, hi] of pairs) {
  const r = {
    '裸对裸': run(lo, hi),
    '低★5': run(lo, hi, { star: 5 }),
    '低全精品': run(lo, hi, { gear: '精品' }),
    '低全珍品': run(lo, hi, { gear: '珍品' }),
    '低全神品': run(lo, hi, { gear: '神品' }),
    '低★5+神品': run(lo, hi, { star: 5, gear: '神品' }),
    '高★5对低★5': run(lo, hi, { star: 5 }, { star: 5 }),
    '高方80%兵': run(lo, hi, {}, { hp: .8 }),
  };
  console.log(lo, '对', hi, JSON.stringify(r));
}
