const assert = require('assert');
const { SG, DATA } = require('./load_node'); SG.init(DATA);
const mk = n => SG.mkHeroUnit(n, 50, 3);
const effect = (b, u, op, args, ctx = {}) => { SG.run_effect(b, u, { op, args, conds: [] }, ctx); return ctx; };
for (let seed = 1; seed <= 100; seed++) {
  SG.setBattleSeed(seed);
  const u = mk('吕布'), E = [mk('关羽'), mk('张飞')], b = new SG.Battle([u], E);
  const ctx = effect(b, u, 'dmg', ['e1', '.1']);
  assert.equal(ctx.last[0], E.find(t => t.hp < t.maxhp), '伤害与后续效果必须为同一目标');
  E.forEach(t => t.hp = 1000);
  const healed = effect(b, u, 'heal', ['e1', '5']);
  assert.equal(healed.last[0], E.find(t => t.hp > 1000), '治疗与后续净化必须为同一目标');
}
{
  const u = mk('华佗'); u.status = { 中毒: 2, 灼烧: 2, 震慑: 1 }; u.flags['中毒_src'] = [u, .02]; u.cleanse();
  assert.deepEqual(u.status, {}); assert(!u.flags['中毒_src']);
  u.addbuff('atk', .1, 2, 'shared'); u.addbuff('def', .2, 2, 'shared');
  assert.equal(u.buffs.length, 2, '不同属性不能因同名标签相互覆盖');
}
{
  const u = mk('吕布'), E = [mk('关羽'), mk('张飞')], b = new SG.Battle([u], E);
  u.flags.double_attack = true; b.attack_target = () => E.find(t => t.alive());
  const hits = []; b.damage = (src, tgt) => { hits.push(tgt); tgt.hp = 0; };
  b.normal_attack(u); assert.deepEqual(hits, E, '双击击杀后必须重新选目标');
}
for (const [name, ratio] of [['孙坚', 1], ['乐进', 1]]) {
  const u = mk(name), t = mk('关羽'), b = new SG.Battle([u], [t]); t.hp *= ratio;
  let crit = 0; b.damage = () => { crit = u.flag('crit'); };
  u.skill.fn(b, u, t); assert(crit >= 1); assert.equal(u.flag('crit'), 0, '追击必暴击不可残留至下一次普攻');
}
{
  const u = mk('黄忠'), t = mk('关羽'), b = new SG.Battle([u], [t]);
  let crit = 0; b.damage = () => { crit = u.flag('crit'); };
  SG.CUSTOM['黄忠老当益壮'](b, u); assert.equal(crit, .4); assert.equal(u.flag('crit'), 0);
}
for (const [custom, threshold, mult] of [['吕布飞将', 2, 1], ['吕布飞将4', 1, 1.2]]) {
  const u = mk('吕布'), t = mk('关羽'), b = new SG.Battle([u], [t]); b.round = 1;
  let hits = 0; b.damage = (a, c, m) => { hits++; assert.equal(m, mult); };
  const ctx = { src: t, tag: 'attack' }; u.flags['挨|1'] = threshold - 1; SG.CUSTOM[custom](b, u, ctx); assert.equal(hits, 0);
  u.flags['挨|1'] = threshold; SG.CUSTOM[custom](b, u, ctx); SG.CUSTOM[custom](b, u, ctx); assert.equal(hits, 1);
  b.round = 2; u.flags['挨|2'] = threshold; SG.CUSTOM[custom](b, u, { src: t, tag: '反击' }); assert.equal(hits, 1);
  SG.CUSTOM[custom](b, u, ctx); assert.equal(hits, 2);
}
{
  const u = mk('左慈'), t = mk('关羽'), b = new SG.Battle([u], [t]);
  u.hp = 1; u.status['诅咒'] = 2; b.heal(u, u, .1);
  assert.equal(u.hp, u.maxhp * .01, '诅咒致命伤害必须触发免死');
  effect(b, u, 'dmgself', ['100']); assert.equal(u.hp, 0, '自伤致死必须归零');
  assert(b.stats.kills.some(k => k[1] === '左慈'), '自伤致死必须触发退场统计');
}
let battles = 0;
for (const n of SG.D.HLIST) {
  for (const config of [[1, 1, false], [50, 3, false], [70, 5, true]]) {
    const [lv, star, gear] = config;
    const items = gear ? SG.D.EQROWS.filter(e => e['归属'] === n).map(e => e.id) : [];
    const u = SG.mkHeroUnit(n, lv, star, null);
    if (items.length) SG.wear(u, items, SG.D.EQID, SG.D.SET4);
    const E = ['关羽', '诸葛亮', '董卓'].map(x => SG.mkHeroUnit(x, lv, star));
    const allies = [u, SG.mkHeroUnit('曹操', lv, star), SG.mkHeroUnit('孙坚', lv, star)];
    SG.setBattleSeed(1000 + battles); const b = new SG.Battle(allies, E, true); b.run();
    for (const x of [...allies, ...E]) {
      for (const value of [x.hp, x.maxhp, x.shield, ...Object.values(x.base), ...Object.values(x.tally)]) assert(Number.isFinite(value), `${n}: 非有限数值`);
      assert(x.hp >= 0 && x.maxhp > 0 && x.shield >= 0 && x.hp <= x.maxhp + 1e-6, `${n}: 兵力或护盾越界`);
    }
    for (const ev of b.events) if (ev.t === 'hit') assert(Number.isFinite(ev.d) && ev.d >= 0, `${n}: 负伤害或NaN`);
    battles++;
  }
}
console.log(`技能目标、净化、属性标签、双击、暴击范围、吕布反击检查通过；358名将领 ${battles} 场含满级与专属装备数值检查通过`);
