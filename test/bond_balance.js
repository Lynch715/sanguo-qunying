// 羁绊平衡：凑羁绊的阵 vs 同品阶散阵（不含任何羁绊），羁绊开/关各打一遍；另打镜像（同一阵，一边有羁绊一边没有）
const { SG, DATA } = require('./load_node');
const H = {}; DATA.heroes.forEach(h => H[h['名']] = h);
const [SK] = SG.loadSkills(DATA.skills);
SG.setBattleSeed(11);
const _r = SG.makeRng(5); const rnd = () => _r.random();
const LV = +(process.env.LV || 50), ST = +(process.env.STAR || 3), N = +(process.argv[2] || 20), R = +(process.argv[3] || 40);
const LINEUPS = {
  '桃园+五虎': '刘备 关羽 张飞 赵云 马超 黄忠 诸葛亮 庞统 徐庶',
  '五子良将+谋主半': '张辽 乐进 于禁 张郃 徐晃 荀彧 荀攸 郭嘉 程昱',
  '江表虎臣九人': '程普 黄盖 韩当 蒋钦 周泰 陈武 甘宁 凌统 徐盛',
  '江东都督+孙周': '周瑜 鲁肃 吕蒙 陆逊 孙策 大乔 小乔 孙权 甘宁',
  '连环计+吕布帐下': '王允 貂蝉 吕布 董卓 高顺 陈宫 张辽 臧霸 吕玲绮',
  '司马+陇右': '司马懿 司马师 司马昭 张春华 邓艾 钟会 郭淮 郝昭 陈泰',
  '河北四庭柱+谋士': '颜良 文丑 张郃 高览 袁绍 袁术 田丰 沮授 审配',
  '南中': '孟获 祝融 孟优 花鬘 带来洞主 兀突骨 木鹿大王 朵思大王 忙牙长',
};
const mk = (names) => names.map(n => { const u = new SG.Unit(H[n], LV, ST); u.skill = SK[n] || null; return u; });
function scatter(A) {
  for (;;) {
    const used = new Set(A), B = [];
    for (const n of A) {
      const pool = DATA.heroes.filter(h => h['品阶'] === H[n]['品阶'] && !used.has(h['名']));
      const p = pool[Math.floor(rnd() * pool.length)]['名']; used.add(p); B.push(p);
    }
    const pa = mk(A).reduce((a, u) => a + SG.unitPower(u), 0), pb = mk(B).reduce((a, u) => a + SG.unitPower(u), 0);
    if (!SG.activeBonds(B).length && Math.abs(pb / pa - 1) < 0.02) return B;
  }
}
function fight(A, B, bondA) {
  let w = 0;
  for (let k = 0; k < R; k++) {
    const left = k % 2 === 0;
    const UA = mk(A), UB = mk(B);
    const bt = left ? new SG.Battle(UA, UB) : new SG.Battle(UB, UA);
    bt.nobond = left ? [!bondA, false] : [false, !bondA];
    const [x] = bt.run(); if (x === (left ? 0 : 1)) w++;
  }
  return w / R;
}
console.log(`${LV} 级 ★${ST}，每阵 ${N} 个散阵 × ${R} 场`);
console.log('阵 | 激活 | 对散阵(有羁绊) | 对散阵(无羁绊) | 差 | 镜像');
for (const [nm, s] of Object.entries(LINEUPS)) {
  const A = s.split(' ');
  const act = SG.activeBonds(A).map(a => a.b.name + (a.t < 1 ? '半' : '')).join('、');
  let on = 0, off = 0;
  for (let i = 0; i < N; i++) { const B = scatter(A); on += fight(A, B, true); off += fight(A, B, false); }
  on /= N; off /= N;
  // 镜像
  let mw = 0; const MR = N * R;
  for (let k = 0; k < MR; k++) { const left = k % 2 === 0; const bt = new SG.Battle(mk(A), mk(A)); bt.nobond = left ? [false, true] : [true, false]; const [x] = bt.run(); if (x === (left ? 0 : 1)) mw++; }
  console.log(`${nm} | ${act} | ${(on * 100).toFixed(0)}% | ${(off * 100).toFixed(0)}% | ${((on - off) * 100).toFixed(0)} | ${(mw / MR * 100).toFixed(0)}%`);
}
