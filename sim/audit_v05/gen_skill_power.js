// V0.7 战力里的技能系数：每人「X + 同档随机五人 对 同档随机六人」带技能、摘技能各打 N 场，胜率差就是系数
// 用法：node gen_skill_power.js [N=150] [分片 0] [片数 1]；全部片跑完再 node gen_skill_power.js merge
// 技能、四件、引擎规则改过就重跑一次，出 data/skill_power.tsv
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '..', '..', 'data', 'skill_power.tsv');
if (process.argv[2] === 'merge') {
  const parts = fs.readdirSync(__dirname).filter(f => /^skpow_\d+\.json$/.test(f));
  const R = parts.flatMap(f => JSON.parse(fs.readFileSync(path.join(__dirname, f))));
  R.sort((a, b) => a.i - b.i);
  fs.writeFileSync(OUT, '名\t技能系数\n' + R.map(r => `${r.name}\t${r.k.toFixed(3)}`).join('\n') + '\n');
  console.log('写了', R.length, '人 →', OUT); process.exit(0);
}
const L = require('./lib.js');
const N = +(process.argv[2] || 150), part = +(process.argv[3] || 0), parts = +(process.argv[4] || 1), out = [];
L.D.HLIST.forEach((X, i) => {
  if (i % parts !== part) return;
  const pool = L.byTier[L.H[X]['品阶']], w = [0, 0];
  [false, true].forEach((ns, j) => {
    const R = L.rng(31337);
    for (let k = 0; k < N; k++) {
      const others = R.sample(pool.filter(n => n !== X), 5), b = L.order(R.sample(pool, 6));
      const A = L.order([X].concat(others)).map(n => L.mk(n, 50, 1, null, ns && n === X)), B = b.map(n => L.mk(n));
      const f = L.fight(A, B, 50000 + k); w[j] += f.w === 0 ? 1 : f.w === -1 ? .5 : 0;
    }
  });
  out.push({ i, name: X, k: (w[0] - w[1]) / N });
});
fs.writeFileSync(path.join(__dirname, `skpow_${part}.json`), JSON.stringify(out));
console.log('片', part, '完', out.length);
