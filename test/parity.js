// 第 1 步验收：Python vs JS 统计对照
const { SG, DATA } = require('./load_node');
const fs = require('fs'), path = require('path');
const REPS = +(process.argv[2] || 10);
const M = JSON.parse(fs.readFileSync(path.join(__dirname, 'matchups.json')));
const H = {}; DATA.heroes.forEach(h => H[h['名']] = h);
const [SK] = SG.loadSkills(DATA.skills);
SG.setBattleSeed(+(process.argv[3]||7));
SG.AGI.k = 0; SG.BOTH = false; SG.PAS_ATK = 0; SG.REND_FIX = false;   // V0.6 速度暴击闪避：Python 里没有，对照时关掉
SG.counts = {};
if (process.env.NOBOND) SG.BOND_ON = false;
const res = []; const t0 = Date.now();
for (const [A, B] of M) {
  let w = 0, rs = 0, d = 0;
  for (let k = 0; k < REPS; k++) {
    const UA = A.map(n => { const u = new SG.Unit(H[n], 50, 3); u.skill = SK[n] || null; return u; });
    const UB = B.map(n => { const u = new SG.Unit(H[n], 50, 3); u.skill = SK[n] || null; return u; });
    const [x, r] = new SG.Battle(UA, UB).run(); w += x === 0; d += x === -1; rs += r;
  }
  res.push({ win: w / REPS, rounds: rs / REPS, draw: d / REPS });
}
fs.writeFileSync(path.join(__dirname, 'parity_js.json'), JSON.stringify({ res, counts: SG.counts, reps: REPS, sec: (Date.now() - t0) / 1000 }));
console.log('js done', (Date.now() - t0) / 1000, 's');
