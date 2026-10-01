// 装备每槽价值：非镜像随机对局，A 方全员穿某一槽某档（武器按主属性挑），对比裸装胜率（配对种子）
const L = require('./lib.js');
const EQ = L.D.EQROWS.filter(e => !e['归属']);
const pick = (slot, tier, n, nm) => {
  const role = L.H[n]['定位'];
  const main = (+L.H[n]['智力'] + +L.H[n]['智成长'] * 49) > (+L.H[n]['武力'] + +L.H[n]['武成长'] * 49) ? 'int' : 'atk';
  let L2 = EQ.filter(e => e['槽'] === slot && e['档'] === tier);
  if (nm) return L2.find(e => e['名'] === nm).id;
  if (slot === '武器' || slot === '宝物') { const x = L2.find(e => e['维'] === main && !e['DSL']); if (x) return x.id; }
  return L2[0].id;
};
const N = 3000, tier = process.argv[2] || '名';
function run(gearFn) {
  const R = L.rng(4242); let win = 0;
  for (let i = 0; i < N; i++) {
    const a = L.order(R.sample(L.byTier[tier], 6)), b = L.order(R.sample(L.byTier[tier], 6));
    const A = a.map(x => L.mk(x, 50, 1, gearFn ? gearFn(x) : null)), B = b.map(x => L.mk(x));
    const f = L.fight(A, B, 9000 + i); if (f.w === 0) win++; else if (f.w === -1) win += .5;
  }
  return (win / N * 100).toFixed(1) + '%';
}
console.log(tier, '裸装', run(null));
for (const gt of ['精品', '神品']) {
  const row = {};
  for (const slot of ['武器', '盔甲', '马匹', '宝物']) row[slot] = run(n => [pick(slot, gt, n)]);
  row['四件'] = run(n => ['武器', '盔甲', '马匹', '宝物'].map(s => pick(s, gt, n)));
  console.log(gt, JSON.stringify(row));
}
const row = {};
for (const nm of ['帅印', '孙子兵法', '传国玺', '夜明珠', '太平经']) row[nm] = run(n => [pick('宝物', '珍品', n, nm)]);
console.log('珍品宝物', JSON.stringify(row));
const row2 = {};
for (const nm of ['九锡', '太公兵法', '龙泉', '飞廉', '青囊通用']) row2[nm] = run(n => [pick('宝物', '神品', n, nm)]);
console.log('神品宝物', JSON.stringify(row2));
const row3 = {};
for (const nm of ['铜印', '竹简', '令旗', '皮盾', '药囊']) row3[nm] = run(n => [pick('宝物', '凡品', n, nm)]);
console.log('凡品宝物', JSON.stringify(row3));
const row4 = {};
for (const nm of ['金印', '六韬', '虎符', '玉佩', '伤寒论']) row4[nm] = run(n => [pick('宝物', '精品', n, nm)]);
console.log('精品宝物', JSON.stringify(row4));
