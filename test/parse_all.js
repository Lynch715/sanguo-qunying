const { SG, DATA } = require('./load_node');
const [SK, errs] = SG.loadSkills(DATA.skills);
let e2 = 0;
for (const r of DATA.set4) try { SG.build(SG.parse_line(r.DSL), r['名']); } catch (e) { e2++; console.log('set4', r['名'], e.message); }
let e3 = 0;
for (const r of DATA.equip) if (r.DSL) try { SG.build(SG.parse_line('被动 | ' + r.DSL), r['名']); } catch (e) { e3++; console.log('equip', r['名'], e.message); }
// custom 名字都得有
const miss = new Set();
const scan = d => { for (const m of d.matchAll(/custom\(([^)]+)\)/g)) if (!SG.CUSTOM[m[1]]) miss.add(m[1]); };
DATA.skills.forEach(r => scan(r.DSL)); DATA.set4.forEach(r => scan(r.DSL)); DATA.equip.forEach(r => scan(r.DSL || ''));
console.log('技能', Object.keys(SK).length, '条，解析报错', errs.length, '；四件', DATA.set4.length, '条报错', e2, '；装备特效报错', e3, '；缺 custom', [...miss]);
errs.forEach(e => console.log(e));
