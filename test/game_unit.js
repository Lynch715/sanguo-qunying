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
const g0 = g.s.gold; g.train(n, 10); ok(g.hero(n).lv === 11 && g0 - g.s.gold === [...Array(10)].reduce((a, _, i) => a + 200 + (i + 2) * (i + 2), 0), '练级价 200+目标等级²（50 级内）');
g.hero(n).hp = 5000; const rc = g.recruitCost(n); ok(rc === Math.ceil(6 * (30 + 2 * 11)), '征兵 (30+2×等级)每千兵 ' + rc);
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
ok(f1.res.win && f1.rew.first && f1.rew.gold === SG.CFG.gold_clear(1) && f1.rew.items.filter(it => !D.EQID[it.id]['归属']).length === 1, '首通给钱给装备');
ok(f1.rew.excl.length === 1 && f1.rew.excl[0].n === '刘备' && f1.rew.excl[0].how === 'first', 'V0.6 出处关首通必掉一件专属（桃园三结义 → 刘备）');
ok(h2.stageUnlocked(D.STAGES[1].id) && !h2.stageUnlocked(D.STAGES[2].id), '解锁下一关');
const hid = D.STAGES.find(s => s['章'] === '1' && s['类型'] === '隐藏');
ok(!h2.stageUnlocked(hid.id), '隐藏关本章没全通不开');
for (let k = 0; k < 3; k++) h2.fight(st1.id, h2.s.formation, { seed: k });
ok(!h2.fight(st1.id, h2.s.formation, { seed: 9 }).err, 'V0.6 复刷不限次数');
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
// ---- V0.6 ----
{
  // 战败：带残兵，谁都不回
  const g = SG.Game.fresh(11); const ns = Object.keys(g.s.heroes); const a = ns[0];
  g.addHero('诸葛亮'); g.hero('诸葛亮').hp = 300;
  g.hero(a).lv = 3; g.hero(a).hp = 1700;
  const hard = D.STAGES.find(s => s['类型'] === '章末' && +s['章'] === 12);
  for (const s of D.STAGES) { if (s._i < hard._i && (s['类型'] === '主线' || s['类型'] === '章末')) g.s.cleared[s.id] = 1; }
  const F = [a, null, null, null, null, null, null, null, null];
  const r = g.fight(hard.id, F, { seed: 1, quick: true });
  const up = r.rew.exp[0].up;
  ok(!r.res.win && g.hero(a).hp === Math.max(0, r.res.A[0].hp) + up * 1000 && g.hero('诸葛亮').hp === 300, `V0.6 输了带残兵、谁都不回（1700 → ${Math.round(g.hero(a).hp)}，其中升 ${up} 级新长 ${up * 1000}）`);
  ok(g.recruitCost(a) > 0, 'V0.6 输了只能征兵补');
}
{
  // 出处关：复刷不掉给信物，满 20 换一件；齐了不再掉
  const g = SG.Game.fresh(12);
  for (const x of ['关羽', '张飞', '赵云', '马超', '黄忠', '诸葛亮', '吕布', '曹操', '孙策']) { g.addHero(x); Object.assign(g.hero(x), { lv: 50, hp: 50000, star: 5 }); }
  const F = ['关羽', '张飞', '赵云', '马超', '黄忠', '诸葛亮', '吕布', '曹操', '孙策'];
  const st = D.STAGES[0]; g.s.cleared[st.id] = 1; SG.CFG.src_excl = 0;
  let swapped = 0, toks = 0;
  for (let k = 0; k < 40; k++) { const r = g.fight(st.id, F, { seed: k, quick: true }); for (const e of r.rew.excl) { if (e.how === 'swap') swapped++; if (e.how === 'token') toks++; } }
  ok(swapped === 2 && toks === 38, `V0.6 复刷不掉给信物，满 20 换一件（40 次：换 ${swapped}、信物 ${toks}）`);
  SG.CFG.src_excl = 1;
  while (g.exclMiss('刘备').length) g.fight(st.id, F, { seed: 99, quick: true });
  const r = g.fight(st.id, F, { seed: 100, quick: true });
  ok(!r.rew.excl.length && !g.exclOf(st.id).src[0].miss, 'V0.6 齐了以后不掉、不给信物');
  SG.CFG.src_excl = .03;
  // 铁匠铺：专属只出已拥有、没凑齐的
  g.s.gold = 1e9; for (const s of D.STAGES) if (+s['章'] <= 26) g.s.cleared[s.id] = 1;
  const own = new Set(Object.keys(g.s.heroes)); let bad = 0, n5 = 0;
  for (let k = 0; k < 300; k++) for (const o of g.smith(10)) if (o.ti === 5) { n5++; if (!own.has(o.row['归属'])) bad++; }
  ok(n5 > 0 && !bad, `V0.6 铁匠铺专属只出已拥有的无双（出了 ${n5} 件）`);
  // 每个无双两个出处关
  ok(Object.keys(D.EXSRC_OF).length === 36 && Object.values(D.EXSRC_OF).every(L => L.length === 2 && L.every(id => D.STAGE[id])), 'V0.6 36 个无双各两个出处关');
}
// ---- V0.7 战斗经验 ----
{
  const C = SG.CFG;
  ok(SG.expFor(10, 20, 6, true, true, false) === 1200, 'V0.7 赢了 10×敌方等级×人数');
  ok(SG.expFor(10, 20, 6, false, true, false) === 400, 'V0.7 输了三分之一');
  ok(SG.expFor(10, 20, 6, true, false, false) === 600 && SG.expFor(10, 20, 6, true, true, true) === 600, 'V0.7 阵亡、复刷各减半');
  ok(SG.expFor(25, 20, 6, true, true, false) === 240, 'V0.7 高 5 级以上只拿两成');
  ok(SG.expFor(5, 50, 6, true, true, false) === 900, 'V0.7 敌方高出 10 级以上按高 10 级算');
  const h = { lv: 1, exp: 0 }; const u1 = SG.expAdd(h, 10 + 40 + 5, 100);
  ok(u1 === 2 && h.lv === 3 && h.exp === 5, '升级要 10×等级²（50 级内），连升、余数保留');
  const h2 = { lv: 49, exp: 0 }; SG.expAdd(h2, 1e6, 50); ok(h2.lv === 50 && h2.exp === 0, 'V0.7 满级不再长，多的不留');
  const g = SG.Game.fresh(21);
  for (const x of ['关羽', '张飞', '赵云']) { g.addHero(x); Object.assign(g.hero(x), { lv: 5, hp: 5000 }); }
  const bench = Object.keys(g.s.heroes).find(n => !['关羽', '张飞', '赵云'].includes(n)); const bexp = g.hero(bench).exp || 0;
  const r = g.fight(D.STAGES[0].id, ['关羽', '张飞', '赵云', null, null, null, null, null, null], { seed: 2, quick: true });
  ok(r.res.win && r.rew.exp.length === 3 && r.rew.exp.every(x => x.e > 0) && (g.hero(bench).exp || 0) === bexp, 'V0.7 只有上阵的人拿经验');
  const k0 = g.hero('关羽'); g.s.gold = 1e6; const e0 = k0.exp; g.train('关羽', 1); ok(k0.exp === e0, 'V0.7 金币练级不清经验');
  ok(SG.CFG.train_cost_conquest(10) === 165, '霸业练级 40+10×等级+ceil(等级²/4)');
}
// 速战每关每天限次，手动复刷不限
{
  const g = SG.Game.fresh(7); const id = D.CHAPTERS[1].stages[0].id;
  for (const n of Object.keys(D.H).slice(0, 9)) g.s.heroes[n] = { lv: 30, star: 3, frag: 0, hp: 30000, exp: 0 };
  const F = Object.keys(g.s.heroes).slice(0, 9);
  g.fight(id, F);
  const heal = () => { for (const n in g.s.heroes) g.s.heroes[n].hp = 30000; };
  let errs = 0; for (let k = 0; k < SG.CFG.sweep_per_day + 1; k++) { heal(); const r = g.fight(id, F, { quick: true, sweep: true }); if (r.err) errs++; }
  ok(errs === 1 && g.sweepLeft(id) === 0, `速战每天 ${SG.CFG.sweep_per_day} 次，第 ${SG.CFG.sweep_per_day + 1} 次被拦`);
  heal(); ok(!g.fight(id, F).err, '速战用完后手动复刷照常');
}
// 存档往返
const s2 = SG.Game.load(h2.toJSON()); ok(s2 && Object.keys(s2.s.heroes).length === Object.keys(h2.s.heroes).length, '存档往返');
console.log(bad ? `${bad} 项没过` : '全过');
