// 速度接暴击闪避：几组参数下，档差、马匹槽、速度 +10% 的变化
const L = require('./lib.js'); const SG = L.SG;
const EQ = L.D.EQROWS.filter(e => !e['归属']);
const horse = EQ.find(e => e['名'] === '龙驹').id, weap = n => { const H = L.H[n]; const main = (+H['智力'] + +H['智成长'] * 49) > (+H['武力'] + +H['武成长'] * 49) ? 'int' : 'atk'; return EQ.find(e => e['槽'] === '武器' && e['档'] === '神品' && e['维'] === main).id; };
const SETS = { '现状': { k: 0, crit: 0, dodge: 0 }, 'A k.3/暴12/闪8': { k: .3, crit: .12, dodge: .08 }, 'B k.5/暴15/闪10': { k: .5, crit: .15, dodge: .10 }, 'C k.5/暴20/闪15': { k: .5, crit: .20, dodge: .15 }, 'D k.2/暴8/闪5': { k: .2, crit: .08, dodge: .05 }, 'E k.15/暴6/闪4': { k: .15, crit: .06, dodge: .04 } };
function tierRun(lo, hi, hp, N = 400) { const R = L.rng(161803); let w = 0; for (let i = 0; i < N; i++) { const a = L.order(R.sample(L.byTier[lo], 9)), b = L.order(R.sample(L.byTier[hi], 9)); const A = a.map(n => L.mk(n)), B = b.map(n => L.mk(n)); B.forEach(u => u.hp = u.maxhp * hp); const f = L.fight(A, B, 123000 + i); w += f.w === 0 ? 1 : f.w === -1 ? .5 : 0; } return Math.round(w / N * 100) + '%'; }
function slotRun(gear, N = 1200) { const R = L.rng(4242); let w = 0; for (let i = 0; i < N; i++) { const a = L.order(R.sample(L.byTier['名'], 6)), b = L.order(R.sample(L.byTier['名'], 6)); const A = a.map(n => L.mk(n, 50, 1, gear ? gear(n) : null)), B = b.map(n => L.mk(n)); const f = L.fight(A, B, 9000 + i); w += f.w === 0 ? 1 : f.w === -1 ? .5 : 0; } return Math.round(w / N * 100) + '%'; }
function mirror(N = 1500) { const R = L.rng(777); let w = 0; for (let i = 0; i < N; i++) { const nm = L.order(R.sample(L.byTier['名'], 6)); const A = nm.map(n => L.mk(n)), B = nm.map(n => L.mk(n)); A.forEach(u => u.base.agi *= 1.1); const f = L.fight(A, B, 1000 + i); w += f.w === 0 ? 1 : f.w === -1 ? .5 : 0; } return Math.round(w / N * 100) + '%'; }
const which = process.argv[2];
for (const [nm, s] of Object.entries(SETS)) {
  if (which && !nm.startsWith(which)) continue;
  SG.AGI = s;
  console.log(nm, JSON.stringify({ '虎满打无双65%': tierRun('虎', '无双', .65), '名满打虎65%': tierRun('名', '虎', .65), '校满打骁65%': tierRun('校', '骁', .65), '神品马': slotRun(n => [horse]), '神品武器': slotRun(n => [weap(n)]), '镜像速度+10%': mirror() }));
}
