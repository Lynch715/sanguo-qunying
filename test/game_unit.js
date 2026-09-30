// 闯关养成与经济的单元检查
const { SG, DATA } = require('./load_node'); SG.init(DATA);
const D = SG.D; let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log('✗', m); } else console.log('✓', m); };
const g = SG.Game.fresh(42);
ok(Object.keys(g.s.heroes).length >= 1 && g.s.gold === 1000, '开局随机两人、1000 金');
ok(g.draw(10) === null, '钱不够不能十连');
g.s.gold = 100000;
const r = g.draw(10); ok(r.length === 10 && r.some(x => ['名', '虎', '无双'].includes(x.tier)), '十连保底名');
let hu = 0; g.s.sinceHu = 49; const r2 = g.draw(1); ok(['虎', '无双'].includes(r2[0].tier), '五十抽保底虎');
const n = Object.keys(g.s.heroes)[0];
const g0 = g.s.gold; g.train(n, 10); ok(g.hero(n).lv === 11 && g0 - g.s.gold === [...Array(10)].reduce((a, _, i) => a + 20 + 5 * (i + 2), 0), '练级价 20+5×目标等级');
g.hero(n).hp = 5000; const rc = g.recruitCost(n); ok(rc === Math.ceil(6 * 4 * 11), '征兵 4×等级每千兵 ' + rc);
g.buyTokens(12); ok(g.s.tokensBought === 12 && g.tokenPrice() === 525, '兵符十枚涨 25');
const need = g.starNeed(n); ok(need === Math.trunc(SG.util.pyRound(5 * SG.CFG.star_q[D.H[n]['品阶']])), '升星所需 ' + need);
const st0 = g.hero(n).star; g.starUp(n); ok(g.hero(n).star === st0 + 1, '升星');
for (const s of D.STAGES) if (+s['章'] < 12) g.s.cleared[s.id] = 1;
const sm = g.smith(10); ok(sm.length === 10 && sm.some(o => o.ti >= 2), '铁匠十连保底精品（第 ' + g.curChapter() + ' 章，封顶 ' + SG.EQ_TIERS[Math.min(4, SG.CFG.drop_tier(g.curChapter()) + 1)] + '）');
ok(sm.every(o => o.ti <= 1 || o.ti === 2 || o.ti === 5 ? true : o.ti <= Math.min(4, SG.CFG.drop_tier(g.curChapter()) + 1)), '铁匠封顶');
const it = g.s.bag.find(x => !D.EQID[x.id]['归属']);
const slot = D.EQID[it.id]['槽']; g.equip(n, it.uid); ok(g.gearIds(n).includes(it.id), '穿装备');
const p1 = g.panel(n); ok(p1[D.EQID[it.id]['维']] > 0, '面板带装备');
const gold1 = g.s.gold; const v = g.sell(it.uid); ok(v === SG.CFG.sell[D.EQID[it.id]['档']] && g.s.gold === gold1 + v && !g.gearIds(n).length, '卖装备顺手卸下');
// 打关：塞个强阵
const h2 = SG.Game.fresh(7);
for (const x of ['关羽', '张飞', '赵云', '马超', '黄忠', '诸葛亮']) { h2.addHero(x); Object.assign(h2.hero(x), { lv: 50, hp: 50000, star: 5 }); }
h2.s.formation = ['关羽', '张飞', '赵云', '马超', '黄忠', '诸葛亮', null, null, null];
const st1 = D.STAGES[0];
const f1 = h2.fight(st1.id, h2.s.formation, { seed: 1 });
ok(f1.res.win && f1.rew.first && f1.rew.gold === SG.CFG.gold_clear(1) && f1.rew.items.length === 1, '首通给钱给装备');
ok(h2.stageUnlocked(D.STAGES[1].id) && !h2.stageUnlocked(D.STAGES[2].id), '解锁下一关');
const hid = D.STAGES.find(s => s['章'] === '1' && s['类型'] === '隐藏');
ok(!h2.stageUnlocked(hid.id), '隐藏关本章没全通不开');
for (let k = 0; k < 3; k++) h2.fight(st1.id, h2.s.formation, { seed: k });
ok(h2.fight(st1.id, h2.s.formation).err, '复刷一天三次');
for (const s of D.STAGES) if (s['章'] === '1' && s['类型'] !== '隐藏') h2.s.cleared[s.id] = 1;
ok(h2.stageUnlocked(hid.id), '本章全通隐藏关开');
// 限制关
const byName = nm => D.STAGES.find(s => s['关'] === nm);
for (const nm of ['神亭酣斗', '过五关斩六将', '据水断桥', '草船借箭', '单刀赴会', '空城计', '三英战吕布']) {
  const s = byName(nm), lim = SG.stageLimit(s);
  h2.s.cleared = {}; for (const x of D.STAGES) { if (x._i < s._i) h2.s.cleared[x.id] = 1; }
  h2.s.replay = { day: 'x', n: {} };
  for (const x in h2.s.heroes) h2.s.heroes[x].hp = h2.s.heroes[x].lv * 1000;
  const tooMany = h2.fight(s.id, h2.s.formation);
  const team = h2.s.formation.slice(); const F = [null, null, null, null, null, null, null, null, null]; team.filter(Boolean).slice(0, lim.max).forEach((q, i) => F[i] = q);
  const f = h2.fight(s.id, F, { seed: 3 });
  ok((lim.max < 9 ? !!tooMany.err : true) && !f.err, `${nm}：限 ${lim.max} 人${lim.survive ? '，撑 ' + lim.survive + ' 回合' : ''}${lim.wheel ? '，车轮 ' + f.res.battles.length + ' 阵' : ''} → ${f.res.win ? '胜' : '败'}，${f.res.rounds} 回合`);
}
// 存档往返
const s2 = SG.Game.load(h2.toJSON()); ok(s2 && Object.keys(s2.s.heroes).length === Object.keys(h2.s.heroes).length, '存档往返');
console.log(bad ? `${bad} 项没过` : '全过');
