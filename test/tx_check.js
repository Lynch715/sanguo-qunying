// 天象逐颗验方向：同一关、同一阵，开这颗 vs 不开，各打 N 场
const { SG, DATA } = require('./load_node');
SG.init(DATA);
const H = {}; DATA.heroes.forEach(h => H[h['名']] = h);
const [SK] = SG.loadSkills(DATA.skills);
const N = +(process.argv[2] || 500);
const st = SG.D.STAGES.find(s => s['关'] === (process.env.STAGE || '曹操南下'));
const team = (process.env.TEAM || '张辽 徐晃 张郃 于禁 乐进 荀彧 郭嘉 贾诩 夏侯惇').split(' ');
const LV = +(process.env.LV || 44), STAR = +(process.env.STAR || 3);
const f0 = SG.stageFoes(st, 2);
console.log(`${st['关']} 二周目：敌 ${f0.lv} 级 ★${f0.star} ${f0.names.join('、')}；我方 ${LV} 级 ★${STAR}`);
function run(tx, huatuo, half) {
  SG.setBattleSeed(99); let w = 0;
  for (let k = 0; k < N; k++) {
    const A = team.map(n => { const u = new SG.Unit(H[n], LV, STAR); u.skill = SK[n] || null; return u; });
    const r = SG.fightStage(st, A, parseFloat(st['系数']) || 1, { cycle: 2, tx, huatuo, txHalf: half, cells: team.map((_, i) => i) });
    w += r.win;
  }
  return w / N;
}
const base = run([], true);
console.log(`不开：${(base * 100).toFixed(1)}%`);
const sd = Math.sqrt(base * (1 - base) / N) * Math.SQRT2;
const f = x => ((x - base) * 100).toFixed(1).replace(/^(?!-)/, '+');
console.log(`（两倍标准误 ±${(2 * sd * 100).toFixed(1)} 点）`);
for (const t of SG.TX) {
  if (!t.g && !t.b && t.id !== '天狼') { console.log(`${t.id}：经济类，不进战斗`); continue; }
  const g = run([t.id], false, { [t.id]: 'g' }), b = run([t.id], false, { [t.id]: 'b' }), w = run([t.id], false);
  console.log(`${t.id}　好处「${t.good}」${f(g)}　代价「${t.bad}」${f(b)}　合起来 ${f(w)}`);
}
