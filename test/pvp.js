// 对战码快照、奖励去重、资源隔离与存档回归。
const assert = require('node:assert/strict');
const { SG, DATA } = require('./load_node'); SG.init(DATA);
require('../src/pvp_catalog'); require('../src/engine_pvp'); require('../src/saveio');
function player(lv, name) {
  const g = SG.Game.fresh(42), names = ['关羽','张飞','赵云','马超','黄忠','诸葛亮','刘备','曹操','孙权'];
  for (const n of names) { g.addHero(n); Object.assign(g.hero(n), { lv, star: lv === 70 ? 5 : 1, hp: 1 }); }
  const p = SG.PVP.state(g); p.name = name; p.cells = names;
  return g;
}
function reject(fn) { assert.throws(fn); }
(async () => {
  const a = player(70, '测试甲'), b = player(1, '<测试乙>');
  const pa = SG.PVP.state(a), pb = SG.PVP.state(b);
  const code = await SG.PVP.encode(SG.PVP.snapshot(b)), foe = await SG.PVP.decode(code);
  assert.equal(code, await SG.PVP.encode(SG.PVP.snapshot(b)));
  assert.deepEqual(await SG.PVP.decode(code.slice(0, 5) + '\n ' + code.slice(5)), foe);
  const legacy = 'SGP1:' + Buffer.from(JSON.stringify(foe), 'utf8').toString('base64');
  assert.deepEqual(await SG.PVP.decode(legacy), foe);
  for (const sample of [code, legacy]) assert.deepEqual(await SG.PVP.decode(sample.slice(0,5).toLowerCase() + sample.slice(5)), foe);
  const zip = 'SGP2:' + require('node:zlib').deflateRawSync(Buffer.from(JSON.stringify(foe))).toString('base64');
  assert.deepEqual(await SG.PVP.decode(zip), foe);
  assert.deepEqual(await SG.PVP.decode(zip.slice(0,5).toLowerCase() + zip.slice(5)), foe);
  const userCode = 'sgp3:AQAPbbMk5St5QAG9NyOEdsOd1+Wkp+iAs+acteWbvuWbvgE7iZxxwAu4lbbbAbuJ3XXQ+7kPnnkCu4pfffAjuKHnngA7iRppoDO4qgggA7uK4YYQODy2UQ==';
  assert.equal((await SG.PVP.decode(userCode)).name, '大耳朵图图');
  assert.ok(code.length <= 100);
  // 最长 Unicode 姓名、九人全装、各不相同的培养值，无损且小于 200 字。
  const full = structuredClone(foe); full.name = '😀'.repeat(16);
  full.team.forEach((h, i) => { h.lv = 70 - i; h.star = i % 5 + 1; h.eq = SG.PVP_CATALOG.gear.map(ids => ids[(i * 7) % ids.length]); });
  const fullCode = await SG.PVP.encode(full);
  assert.deepEqual(await SG.PVP.decode(fullCode), full);
  assert.ok(fullCode.length <= 200);
  console.log(`全装九人 + 16 个 emoji 姓名：${fullCode.length} 字`);
  const corrupt = Buffer.from(code.slice(5), 'base64'); corrupt[20] ^= 1;
  await assert.rejects(() => SG.PVP.decode('SGP3:' + corrupt.toString('base64')));
  // 混合稀疏/满装、Unicode 姓名与各档培养，检验位字段跨字节往返。
  const rng = SG.makeRng(117);
  for (let t = 0; t < 80; t++) {
    const varied = structuredClone(foe); varied.name = t % 2 ? '短码测试' : '😀'.repeat(16);
    const picks = rng.sample(SG.PVP_CATALOG.heroes, 9);
    varied.team.forEach((h, i) => { h.n = picks[i]; h.lv = rng.randint(1,70); h.star = rng.randint(1,5); h.eq = SG.PVP_CATALOG.gear.map(ids => rng.random() < t / 80 ? rng.choice(ids) : null); });
    const short = await SG.PVP.encode(varied); assert.ok(short.length <= 200); assert.deepEqual(await SG.PVP.decode(short), varied);
  }
  const custom = {...foe, owner: 'oldcustomidentity1234'};
  assert.deepEqual(await SG.PVP.decode(await SG.PVP.encode(custom)), custom);

  assert.ok(code.length < legacy.length * .6);
  console.log(`对战码压缩：${legacy.length} → ${code.length} 字，缩短 ${Math.round((1-code.length/legacy.length)*100)}%`);
  const packedBomb = await new Response(new Blob(['x'.repeat(20000)]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer();
  await assert.rejects(() => SG.PVP.decode('SGP2:' + Buffer.from(packedBomb).toString('base64')));
  const key = await SG.PVP.identity(foe);
  assert.equal(key, await SG.PVP.identity({ ...foe, name: '改名' }));
  b.hero(pb.cells[0]).lv = 2;
  assert.equal(foe.team[0].lv, 1);
  assert.notEqual(key, await SG.PVP.identity(SG.PVP.snapshot(b)));
  await assert.rejects(() => SG.PVP.decode('SG1:xxx')); await assert.rejects(() => SG.PVP.decode(code.slice(0, -10)));
  reject(() => SG.PVP.validate({ ...foe, v: 99 }));
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
  const r = await SG.PVP.fight(a, foe);
  assert.equal(r.res.win, true); assert.equal(pa.ears.length, 1); assert.equal(pa.records[0].reward, '<测试乙>的耳朵');
  assert.equal(base(), before);
  const r2 = await SG.PVP.fight(a, { ...foe, name: '改名' });
  assert.equal(r2.res.rounds, r.res.rounds); assert.equal(pa.ears.length, 1); assert.equal(pa.records[0].reward, null);
  assert.deepEqual(r2.res.battles[0].teams.map(t => t.map(u => u.hp)), r.res.battles[0].teams.map(t => t.map(u => u.hp)));
  await assert.rejects(() => SG.PVP.fight(a, SG.PVP.snapshot(a)));
  const packed = await SG.SaveIO.encode(a.toJSON());
  const restored = SG.Game.load(await SG.SaveIO.decode(packed));
  assert.deepEqual(restored.s.pvp, pa); await SG.PVP.fight(restored, foe); assert.equal(restored.s.pvp.ears.length, 1);
  const loser = player(1, '弱者'); await SG.PVP.fight(loser, SG.PVP.snapshot(a)); assert.equal(loser.s.pvp.ears.length, 0); assert.equal(loser.s.pvp.records[0].result, '败');
  pa.records = Array(100).fill(pa.records[0]); await SG.PVP.fight(a, foe); assert.equal(pa.records.length, 100);
  // 停战引擎模拟平局，验证不发奖和结果标识。
  const Original = SG.Battle; SG.Battle = class extends Original { run() { return [-1, 30]; } };
  const tie = await SG.PVP.fight(a, SG.PVP.snapshot(b)); assert.equal(tie.winTxt, '平'); assert.equal(pa.ears.length, 1); SG.Battle = Original;
  const old = SG.Game.fresh(4); assert.equal(old.s.pvp, undefined); assert.equal(SG.PVP.state(old).cells.length, 9);
  a.sell(item.uid); assert.equal(SG.PVP.snapshot(a).team[1].eq[0], null);
  console.log('PVP 全过：码校验 / 固定快照与随机种子 / 单码奖励去重 / 配装隔离 / 资源不变 / 胜败平 / 存档往返 / 记录上限 / 旧档与卖装');
})().catch(e => { console.error(e); process.exitCode = 1; });
