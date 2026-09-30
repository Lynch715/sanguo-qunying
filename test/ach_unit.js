// 功名逐条造条件触发；存档往返；V0.2 存档读进来补判
const { SG, DATA } = require('./load_node');
SG.init(DATA);
const D = SG.D;
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('✗', m); } };
const got = new Set();
function G0() { const g = SG.Game.fresh(7); g.s.gold = 1e9; g.s.gold2 = 1e4; return g; }
function check(g, tag) { for (const a of g.achCheck()) got.add(a.id); for (const id in g.s.ach) got.add(id); }
// 招贤
{ const g = G0(); for (const n of D.HLIST) g.addHero(n); check(g); ['初聚', '三十六员', '百将', '二百将', '群英毕至', '无双五人', '无双十五', '无双尽收'].forEach(x => ok(got.has(x), x)); }
{ const g = G0(); for (let i = 0; i < 50; i++) g.draw(10); check(g); ok(got.has('广纳英雄') && got.has('求贤若渴'), '十连'); }
// 铁匠
{ const g = G0(); for (const s of D.STAGES) if (+s['章'] <= 25) g.s.cleared[s.id] = 1; for (let i = 0; i < 60 && !g.s.ev['打出专属']; i++) g.smith(10); check(g); ok(got.has('铁匠铺常客'), '铁匠常客'); ok(got.has('打铁出神兵'), '打铁出神兵'); }
// 神兵
{ const g = G0(); for (const n in D.EXCL) for (const e of D.EXCL[n]) g.addItem(e.id); check(g); ['神兵在手', '四件套', '神兵谱', '神兵满堂', '兵器谱'].forEach(x => ok(got.has(x), x)); }
// 养成
{ const g = G0(); const L = D.HLIST.slice(0, 9); L.forEach((n, i) => { g.addHero(n); g.s.heroes[n].star = 5; g.s.formation[i] = n; }); g.addHero('曹操'); g.train('曹操', 60); for (let i = 0; i < 20; i++) { const n = D.HLIST[20 + i]; g.addHero(n); g.train(n, 50); } check(g); ['五星', '九星连珠', '督练'].forEach(x => ok(got.has(x), x)); }
// 推图：把所有关标成通过
{ const g = G0(); for (const s of D.STAGES) { g.s.cleared[s.id] = 1; g.s.ever[s.id] = 1; } check(g); ['桃园', '讨董', '官渡', '赤壁', '汉中王', '出师表', '三国归晋', '全通', '秘藏', '外传', '单挑', '死守', '过关斩将', '七擒'].forEach(x => ok(got.has(x), x));
  g.newCycle(); check(g); ok(got.has('再起'), '再起'); g.s.cycle = 3; for (const s of D.STAGES) g.s.cleared[s.id] = 1; check(g); ok(got.has('三周目'), '三周目'); }
// 战斗类：真打
function fightAs(g, stageName, team, lv = 60, star = 5, n = 1) {
  const st = D.STAGES.find(s => s['关'] === stageName);
  for (const s of D.STAGES) if (s._i < st._i) g.s.cleared[s.id] = 1;
  team.forEach(x => { if (!g.s.heroes[x]) g.addHero(x); Object.assign(g.s.heroes[x], { lv, star, hp: lv * 1000 }); });
  const cells = [null, null, null, null, null, null, null, null, null]; team.forEach((x, i) => cells[i] = x);
  let r; for (let k = 0; k < n; k++) { delete g.s.cleared[st.id]; team.forEach(x => g.s.heroes[x].hp = lv * 1000); r = g.fight(st.id, cells, { quick: true, seed: 1000 + k }); if (r.err) { console.log(stageName, r.err); break; } }
  check(g); return r;
}
{ const g = G0(); fightAs(g, '赵云救主', ['赵云'], 70, 5, 5); ok(got.has('七进七出'), '七进七出'); }
{ const g = G0(); fightAs(g, '据水断桥', ['张飞'], 70, 5, 3); ok(got.has('当阳桥'), '当阳桥'); }
{ const g = G0(); fightAs(g, '空城计', ['诸葛亮'], 70, 5, 3); ok(got.has('空城'), '空城'); }
{ const g = G0(); fightAs(g, '三英战吕布', ['刘备', '关羽', '张飞', '赵云', '马超', '黄忠'], 60, 5, 3); ok(got.has('三英'), '三英'); }
{ const g = G0(); fightAs(g, '三英战吕布', ['王允', '貂蝉', '吕布', '董卓', '丁原', '关羽', '张飞', '赵云', '马超'], 60, 5, 3); ok(got.has('连环'), '连环'); ok(got.has('三姓家奴'), '三姓家奴'); }
{ const g = G0(); fightAs(g, '火烧连营', ['陆逊', '周瑜', '诸葛亮', '吕蒙', '甘宁', '太史慈', '孙策', '孙权', '陆抗'], 70, 5, 3); ok(got.has('书生拜将'), '书生拜将'); ok(got.has('既生瑜'), '既生瑜'); }
{ const g = G0(); fightAs(g, '七擒七纵', ['孟获', '祝融', '关羽', '张飞', '赵云', '马超', '黄忠', '诸葛亮', '庞统'], 70, 5, 3); ok(got.has('南人不复反'), '南人不复反'); }
{ const g = G0(); fightAs(g, '桃园三结义', ['范疆', '张达'], 30, 5, 2); ok(got.has('帐中行刺'), '帐中行刺'); }
{ const g = G0(); fightAs(g, '温酒斩华雄', ['潘凤'], 1, 1, 1); ok(got.has('上将潘凤'), '上将潘凤'); }
{ const g = G0(); for (let k = 0; k < 20 && !g.s.ev['温酒']; k++) fightAs(g, '温酒斩华雄', ['关羽'], 20, 5, 1); ok(got.has('温酒斩华雄'), '温酒斩华雄'); }
// 章末：一合、全须全尾、书生、匹夫
{ const g = G0(); fightAs(g, '广宗之战', ['关羽', '张飞', '赵云', '马超', '黄忠', '吕布', '典韦', '许褚', '孙策'], 70, 5, 20); ['一合之将', '全须全尾', '匹夫之勇', '百战'].forEach(x => ok(got.has(x) || x === '百战', x)); }
{ const g = G0(); fightAs(g, '广宗之战', ['诸葛亮', '司马懿', '周瑜', '郭嘉', '荀彧', '贾诩', '庞统', '陆逊', '法正'], 70, 5, 1); ok(got.has('书生退敌'), '书生退敌'); }
// 羁绊 6 条
{ const g = G0(); fightAs(g, '桃园三结义', ['刘备', '关羽', '张飞', '赵云', '马超', '黄忠', '诸葛亮', '庞统', '徐庶'], 30, 5, 1); console.log('  桃园+五虎阵羁绊数', g.s.st.bonds); }
{ const g = G0(); fightAs(g, '桃园三结义', ['曹操', '刘备', '孙权', '杨修', '许攸', '陈宫', '关羽', '张飞', '周瑜'], 30, 5, 1); ok(got.has('肝胆相照'), '肝胆相照 ' + g.s.st.bonds); }
// 火攻、以牙还牙、百战：直接给计数
{ const g = G0(); g.s.st.dot = 50; g.s.st.counter = 200; g.s.st.wins = 1000; check(g); ['火攻', '以牙还牙', '百战', '五百战', '千战'].forEach(x => ok(got.has(x), x)); }
// 骂死
{ const g = G0(); g.evSet('骂死'); check(g); ok(got.has('骂死'), '骂死'); }
// 霸业
{ const g = G0(); SG.cqAch = { get: () => ({ win: { 魏: 1, 蜀: 1, 吴: 1, 汉: 1 }, fast: 1, nx: 5 }), set: () => {} }; check(g); ['一统天下', '再兴汉室', '四海归一', '速定天下', '纳降'].forEach(x => ok(got.has(x), x)); SG.cqAch = { get: () => ({}), set: () => {} }; }
// 领奖、称号、存档往返
{ const g = G0(); for (const n of D.HLIST) g.addHero(n); g.achCheck(); const p = g.achPending().length; const g0 = g.s.gold, t0 = g.s.tokens, h0 = g.s.gold2;
  const r = g.achClaimAll(); ok(r.length === p && g.achPending().length === 0, '全领');
  const exp = r.reduce((a, x) => ({ gold: a.gold + (x.r.gold || 0), tokens: a.tokens + (x.r.tokens || 0), gold2: a.gold2 + (x.r.gold2 || 0) }), { gold: 0, tokens: 0, gold2: 0 });
  ok(g.s.gold - g0 === exp.gold && g.s.tokens - t0 === exp.tokens && g.s.gold2 - h0 === exp.gold2, '奖励入账');
  ok(g.s.titles.includes('群英录') && g.s.title, '称号');
  const g2 = SG.Game.load(g.toJSON()); ok(JSON.stringify(g2.s.ach) === JSON.stringify(g.s.ach) && g2.s.title === g.s.title, '存档往返');
  ok(!g2.achClaim('群英毕至'), '不能重复领'); }
// V0.2 存档：没有 ach/st/ever
{ const g = G0(); for (const n of D.HLIST.slice(0, 40)) g.addHero(n); for (const s of D.STAGES.slice(0, 20)) g.s.cleared[s.id] = 1;
  const s = JSON.parse(g.toJSON()); delete s.ach; delete s.st; delete s.ev; delete s.ever; delete s.titles; const gold = s.gold;
  const g2 = SG.Game.load(JSON.stringify(s)); ok(g2.s.ach['三十六员'] === 1 && g2.s.ach['桃园'] === 1 && g2.s.ach['讨董'] === 1, 'V0.2 补判为待领'); ok(g2.s.gold === gold, 'V0.2 补判不发奖'); }
console.log(`功名 ${SG.ACH.length} 条，触发到 ${got.size} 条`);
const miss = SG.ACH.filter(a => !got.has(a.id)).map(a => a.id); if (miss.length) console.log('没触发：', miss.join('、'));
console.log(fail ? `✗ ${fail} 处不对` : '全过');
