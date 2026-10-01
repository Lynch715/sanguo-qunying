// 专属四件 vs 通用神品四件：X + 无双5人(神品通用) vs 无双6人(神品通用)
const L = require('./lib.js'); const fs = require('fs');
const N = +(process.env.N||300), part = +process.argv[2], parts = +process.argv[3];
const EQ = L.D.EQROWS.filter(e => !e['归属']);
function gen(n) { const H = L.H[n]; const main = (+H['智力'] + +H['智成长'] * 49) > (+H['武力'] + +H['武成长'] * 49) ? 'int' : 'atk';
  return ['武器', '盔甲', '马匹', '宝物'].map(s => { const c = EQ.filter(e => e['槽'] === s && e['档'] === '神品'); return (c.find(e => e['维'] === main && !e['DSL']) || c.find(e => !e['DSL']) || c[0]).id; }); }
const out = [];
L.byTier['无双'].forEach((X, idx) => {
  if (idx % parts !== part) return;
  const ex = (L.D.EXCL[X] || []).map(e => e.id); if (ex.length < 4) return;
  const r = {};
  for (const mode of ['gen', 'ex2', 'ex4']) {
    const R = L.rng(999); let win = 0;
    for (let i = 0; i < N; i++) {
      const others = R.sample(L.byTier['无双'].filter(n => n !== X), 5), b = L.order(R.sample(L.byTier['无双'], 6));
      const A = L.order([X].concat(others)).map(n => L.mk(n, 50, 1, n === X ? (mode === 'gen' ? gen(n) : mode === 'ex2' ? ex.slice(0, 2).concat(gen(n).slice(2)) : ex) : gen(n)));
      const B = b.map(n => L.mk(n, 50, 1, gen(n)));
      const f = L.fight(A, B, 77000 + i); if (f.w === 0) win++; else if (f.w === -1) win += .5;
    }
    r[mode] = win / N;
  }
  out.push({ name: X, ...r });
});
fs.writeFileSync(`e8_${part}.json`, JSON.stringify(out));
