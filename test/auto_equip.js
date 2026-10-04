const assert = require('node:assert/strict');
const {SG,DATA}=require('./load_node'); SG.init(DATA); require('../src/pvp_catalog'); require('../src/engine_pvp');
for (const mode of ['闯关','霸业','PVP']) {
 const g=mode==='霸业'?SG.ConquestGame.fresh('蜀',42):SG.Game.fresh(42);
 for (const n of ['吕布','诸葛亮','关羽']) {g.addHero(n);Object.assign(g.hero(n),{lv:n==='吕布'?70:10,star:5,hp:1000});}
 g.s.bag=[];g.s.gear={};
 const own=SG.D.EQROWS.filter(e=>e['归属']==='诸葛亮'); for(const e of own)g.addItem(e.id);
 const phys=SG.D.EQROWS.find(e=>e['槽']==='武器'&&e['维']==='atk'&&!e['归属']&&e['档']==='神品');
 const magic=SG.D.EQROWS.find(e=>e['槽']==='武器'&&e['维']==='int'&&!e['归属']&&e['档']==='神品');g.addItem(phys.id);g.addItem(magic.id);
 const names=['吕布','诸葛亮','关羽'];g.s.formation=names.concat(Array(6).fill(null));
 const p=mode==='PVP'?SG.PVP.state(g):null;if(p)p.cells=g.s.formation.slice();
 const before=JSON.stringify(g.s.gear);
 if(mode==='PVP')SG.PVP.autoEquip(g);else g.autoEquip(names);
 const gear=mode==='PVP'?p.gear:g.s.gear;
 for(const e of own)assert.equal(g.item(gear['诸葛亮'][e['槽']]).id,e.id,`${mode}专属归本人`);
 assert.equal(g.item(gear['吕布']['武器']).id,phys.id);
 assert.equal(new Set(Object.values(gear).flatMap(x=>Object.values(x)).filter(Boolean)).size,Object.values(gear).flatMap(x=>Object.values(x)).filter(Boolean).length);
 if(mode==='PVP')assert.equal(JSON.stringify(g.s.gear),before,'PVP不得改闯关装备');
 const snapshot=JSON.stringify(gear);if(mode==='PVP')SG.PVP.autoEquip(g);else g.autoEquip(names);assert.equal(JSON.stringify(gear),snapshot,'重复配装稳定');
 console.log(mode,'专属优先、属性匹配、无重复及配装隔离通过');
}
const g=SG.Game.fresh(1);g.addHero('诸葛亮');g.addHero('关羽');g.addHero('姜维');
const sword=SG.D.EQROWS.find(e=>e['槽']==='武器'&&e['归属']==='诸葛亮');const it=g.addItem(sword.id);
g.autoEquip(['关羽']);assert(!g.gearIds('关羽').includes(it.id),'不上阵的已拥有将领仍保留其专属');
const atk={槽:'武器',维:'atk',固定:30,百分比:6,归属:''},int={...atk,维:'int'};
assert(g.itemScore('关羽',atk)>g.itemScore('关羽',int));assert(g.itemScore('诸葛亮',int)>g.itemScore('诸葛亮',atk));
console.log('专属预留、物理与谋略匹配通过');
