// 对战码快照、奖励去重、资源隔离、旧档迁移与存档回归。
const assert = require('node:assert/strict');
const { SG, DATA } = require('./load_node'); SG.init(DATA);
require('../src/pvp_catalog'); require('../src/engine_pvp'); require('../src/saveio');
function player(lv, name) {
  const g = SG.Game.fresh(42), names = ['关羽','张飞','赵云','马超','黄忠','诸葛亮','刘备','曹操','孙权'];
  for (const n of names) { g.addHero(n); Object.assign(g.hero(n), { lv, star: lv === 70 ? 5 : 1, hp: 1 }); }
  const p = SG.PVP.state(g); p.name = name; p.cells = names;
  return g;
}
const reject = (fn, re) => assert.throws(fn, re);
(async () => {
  const a = player(70, '测试甲'), b = player(1, '<测试乙>');
  const pa = SG.PVP.state(a), pb = SG.PVP.state(b);
  const code = SG.PVP.encode(SG.PVP.snapshot(b)), foe = SG.PVP.decode(code);
  assert.equal(code, SG.PVP.encode(SG.PVP.snapshot(b)));
  assert.deepEqual(SG.PVP.decode(code.slice(0, 5) + '\n ' + code.slice(5)), foe);
  assert.deepEqual(SG.PVP.decode('sgp3:' + code.slice(5)), foe);
  assert.ok(code.length <= 100);
  // 最长 Unicode 姓名、九人全装、各不相同的培养值，无损且小于 200 字。
  const full = structuredClone(foe); full.name = '😀'.repeat(16);
  full.team.forEach((h, i) => { h.lv = 100 - i; h.star = i % 7 + 1; h.eq = SG.PVP_CATALOG.gear.map(ids => ids[(i * 7) % ids.length]); });
  const fullCode = SG.PVP.encode(full);
  assert.deepEqual(SG.PVP.decode(fullCode), full);
  assert.ok(fullCode.length <= 200);
  console.log(`全装九人 + 16 个 emoji 姓名：${fullCode.length} 字；普通：${code.length} 字`);
  // 神将：形态位置进码，每队至多一位。
  const god = structuredClone(foe); god.team[0].form = 'god';
  assert.ok(SG.God.DATA[god.team[0].n]);
  const godCode = SG.PVP.encode(god); assert.deepEqual(SG.PVP.decode(godCode), god); assert.ok(godCode.length <= 100);
  const twoGods = structuredClone(god); twoGods.team[1].form = 'god'; assert.ok(SG.God.DATA[twoGods.team[1].n]); reject(() => SG.PVP.validate(twoGods), /一位神将/);
  // 损坏、截断、非本游戏的码一律拒收。
  const corrupt = Buffer.from(code.slice(5), 'base64'); corrupt[20] ^= 1;
  reject(() => SG.PVP.decode('SGP3:' + corrupt.toString('base64')), /损坏/);
  reject(() => SG.PVP.decode('SG1:xxx')); reject(() => SG.PVP.decode(code.slice(0, -10))); reject(() => SG.PVP.decode('SGP1:' + Buffer.from('{}').toString('base64')));
  // 混合稀疏/满装、Unicode 姓名与各档培养，检验位字段跨字节往返。
  const rng = SG.makeRng(117);
  for (let t = 0; t < 80; t++) {
    const varied = structuredClone(foe); varied.name = t % 2 ? '短码测试' : '😀'.repeat(16);
    const picks = rng.sample(SG.PVP_CATALOG.heroes, 9);
    varied.team.forEach((h, i) => { h.n = picks[i]; h.lv = rng.randint(1,100); h.star = rng.randint(1,7); h.eq = SG.PVP_CATALOG.gear.map(ids => rng.random() < t / 80 ? rng.choice(ids) : null); });
    const short = SG.PVP.encode(varied); assert.ok(short.length <= 200); assert.deepEqual(SG.PVP.decode(short), varied);
  }
  const key = SG.PVP.identity(foe);
  assert.equal(key, SG.PVP.identity({ ...foe, name: '改名' }));
  b.hero(pb.cells[0]).lv = 2;
  assert.equal(foe.team[0].lv, 1);
  assert.notEqual(key, SG.PVP.identity(SG.PVP.snapshot(b)));
  reject(() => SG.PVP.validate({ ...foe, v: 99 }));
  reject(() => SG.PVP.validate({ ...foe, owner: 'oldcustomidentity1234' }));
  reject(() => SG.PVP.validate({ ...foe, team: foe.team.slice(1) }));
  const bad = structuredClone(foe); bad.team[0].n = bad.team[1].n; reject(() => SG.PVP.validate(bad));
  const badGear = structuredClone(foe); badGear.team[0].eq[0] = '__proto__'; reject(() => SG.PVP.validate(badGear));
  const item = a.addItem(SG.D.EQROWS.find(e => e['槽'] === '武器').id);
  const beforeGear = JSON.stringify(a.s.gear);
  SG.PVP.equip(a, pa.cells[0], '武器', item.uid);
  SG.PVP.equip(a, pa.cells[1], '武器', item.uid);
  assert.equal(pa.gear[pa.cells[0]]['武器'], null);
  assert.equal(JSON.stringify(a.s.gear), beforeGear);
  const base = () => JSON.stringify(Object.fromEntries(Object.entries(a.s).filter(([k]) => k !== 'pvp')));
  const before = base();
  const r = SG.PVP.fight(a, foe);
  assert.equal(r.res.win, true); assert.equal(pa.ears.length, 1); assert.equal(pa.records[0].reward, '<测试乙>的耳朵');
  assert.equal(typeof pa.records[0].mine, 'string'); assert.equal(pa.records[0].opponent, code); assert.equal(pa.ears[0].opponent, code); assert.equal(pa.records[0].foe, '<测试乙>');
  assert.ok(JSON.stringify(pa.records[0]).length < 500);
  assert.equal(base(), before);
  const r2 = SG.PVP.fight(a, { ...foe, name: '改名' });
  const grouped = SG.PVP.recordGroups(pa); assert.equal(grouped.length, 1); assert.equal(grouped[0].entries.length, 2); assert.equal(pa.records.length, 2);
  const distinct = structuredClone(pa); distinct.records.push({...distinct.records[0], key:'another-snapshot'}); assert.equal(SG.PVP.recordGroups(distinct).length, 2);
  assert.equal(r2.res.rounds, r.res.rounds); assert.equal(pa.ears.length, 1); assert.equal(pa.records[0].reward, null);
  assert.deepEqual(r2.res.battles[0].teams.map(t => t.map(u => u.hp)), r.res.battles[0].teams.map(t => t.map(u => u.hp)));
  reject(() => SG.PVP.fight(a, SG.PVP.snapshot(a)), /自己/);
  const packed = await SG.SaveIO.encode(a.toJSON());
  const restored = SG.Game.load(await SG.SaveIO.decode(packed));
  assert.deepEqual(restored.s.pvp, pa); SG.PVP.fight(restored, foe); assert.equal(restored.s.pvp.ears.length, 1);
  const loser = player(1, '弱者'); SG.PVP.fight(loser, SG.PVP.snapshot(a)); assert.equal(loser.s.pvp.ears.length, 0); assert.equal(loser.s.pvp.records[0].result, '败');
  pa.records = Array(100).fill(pa.records[0]); SG.PVP.fight(a, foe); assert.equal(pa.records.length, 100);
  // 停战引擎模拟平局，验证不发奖和结果标识。
  const Original = SG.Battle; SG.Battle = class extends Original { run() { return [-1, 30]; } };
  const tie = SG.PVP.fight(a, SG.PVP.snapshot(b)); assert.equal(tie.winTxt, '平'); assert.equal(pa.ears.length, 1); SG.Battle = Original;
  const old = SG.Game.fresh(4); assert.equal(old.s.pvp, undefined); assert.equal(SG.PVP.state(old).cells.length, 9);
  // V0.8 旧档：战绩和耳朵存整份 JSON、奖励键是 SHA-256；读入后改存对战码，键按新算法重算，同阵容不再重复发奖。
  const legacy = player(70, '旧档'); const lp = legacy.s.pvp;
  const mineSnap = SG.PVP.snapshot(legacy), godFoe = { ...god, v: 2 };
  lp.fmt = undefined; lp.claimed = { deadbeef: true };
  lp.records = [{ time: 1, result: '胜', rounds: 9, mine: mineSnap, opponent: foe, key: 'deadbeef', reward: '<测试乙>的耳朵' }, { time: 2, result: '败', rounds: 30, mine: mineSnap, opponent: godFoe, key: 'x' }, { time: 3, result: '胜', rounds: 1, mine: mineSnap, opponent: { kind: 'pvp' }, key: 'y' }];
  lp.ears = [{ key: 'deadbeef', name: '<测试乙>的耳朵', time: 1, opponent: foe }];
  const mp = SG.PVP.state(legacy);
  assert.equal(mp.fmt, 2); assert.equal(mp.records.length, 2); assert.equal(mp.records[0].opponent, code); assert.equal(mp.records[1].opponent, godCode); assert.equal(mp.records[0].foe, '<测试乙>');
  assert.deepEqual(mp.claimed, { [key]: true }); assert.equal(mp.ears[0].key, key); assert.equal(mp.ears[0].foe, '<测试乙>');
  SG.PVP.fight(legacy, foe); assert.equal(mp.ears.length, 1); assert.equal(mp.records[0].reward, null);
  a.sell(item.uid); assert.equal(SG.PVP.snapshot(a).team[1].eq[0], null);
  // 没有 crypto.randomUUID（http 局域网）也能建身份。
  const saved = crypto.randomUUID; Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true });
  const http = SG.Game.fresh(5); assert.match(SG.PVP.state(http).owner, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  Object.defineProperty(crypto, 'randomUUID', { value: saved, configurable: true });
  console.log('PVP 全过：码校验 / 神将码 / 固定快照与随机种子 / 单码奖励去重 / 配装隔离 / 资源不变 / 胜败平 / 存档往返 / 记录上限 / 旧档迁移 / 卖装 / 无 randomUUID');
})().catch(e => { console.error(e); process.exitCode = 1; });
