// 100级、二周目7星、经济曲线与新养成值的战斗/存档/PVP回归。
const assert = require('node:assert/strict');
const { SG, DATA } = require('./load_node'); SG.init(DATA);
require('../src/pvp_catalog'); require('../src/engine_pvp'); require('../src/saveio');
(async () => {
  for (const make of [() => SG.Game.fresh(42), () => SG.ConquestGame.fresh('蜀',42)]) {
    const g = make(), n = '关羽'; g.addHero(n);
    assert.equal(g.maxLv(),100); assert.equal(g.maxStar(),5);
    Object.assign(g.hero(n), {lv:99,hp:99000,exp:0,star:5,frag:1000});
    g.s.gold = g.trainPrice(100)-1; const before = structuredClone(g.hero(n));
    assert.equal(g.train(n),0); assert.deepEqual(g.hero(n),before);
    g.s.gold++; assert.equal(g.train(n,10),1); assert.equal(g.hero(n).lv,100); assert.equal(g.hero(n).hp,100000);
    assert.equal(g.gainExp(n,1e9),0); assert.equal(g.hero(n).exp,0);
    assert.equal(g.canStar(n),false); assert.equal(g.starUp(n),false);
    g.s.cycle=2; assert.equal(g.maxStar(),7);
    for(const star of [6,7]) {
      const need=g.starNeed(n); assert(need>0);
      const frag=g.hero(n).frag; assert.equal(g.starUp(n),true);
      assert.equal(g.hero(n).star,star); assert.equal(g.hero(n).frag,frag-need);
      const u=g.unitOf(n); for(const k of ['atk','def','int','agi']) assert(Number.isFinite(u.base[k]));
    }
    if(g.kind==='conquest') for(const [cn,k] of [['武力','atk'],['统率','def'],['智力','int'],['速度','agi']]) assert(Math.abs(g.cqStat4(n)[cn]-g.unitOf(n).base[k])<1e-9);
    assert.equal(g.starNeed(n),0); assert.equal(g.starUp(n),false);
    g.s.cycle=3; assert.equal(g.maxStar(),7);
    Object.assign(g.hero(n), {lv:99,hp:50000,exp:0});
    assert.equal(g.gainExp(n,SG.CFG.exp_need(99)-1),0);
    assert.equal(g.gainExp(n,1),1); assert.equal(g.hero(n).lv,100); assert.equal(g.hero(n).hp,51000);
    const loaded=g.kind==='conquest'?SG.ConquestGame.load(g.toJSON()):SG.Game.load(g.toJSON());
    assert.equal(loaded.hero(n).lv,100); assert.equal(loaded.hero(n).star,7);
  }
  for(let lv=2;lv<=100;lv++) {
    const k=lv>50?lv/50:1;
    assert.equal(SG.CFG.train_cost(lv),Math.round((200+lv*lv)*k));
    assert(SG.CFG.train_cost_conquest(lv)>20+5*lv);
    assert.equal(SG.CFG.exp_need(lv),Math.round(10*lv*lv*k));
  }
  const row=SG.D.H['关羽']; const u5=new SG.Unit(row,100,5),u7=new SG.Unit(row,100,7);
  for(const k of ['atk','def','int','agi']) assert(Math.abs(u7.base[k]/u5.base[k]-1.32/1.2)<1e-9);
  const g=SG.Game.fresh(1); g.s.cycle=2;
  const p=SG.PVP.state(g);p.name='百级七星';p.cells=DATA.heroes.slice(0,9).map(h=>h['名']);
  for(const n of p.cells){g.addHero(n); Object.assign(g.hero(n),{lv:100,star:7,hp:100000});}
  const snap=SG.PVP.snapshot(g); assert.deepEqual(await SG.PVP.decode(await SG.PVP.encode(snap)),snap);
  for(const [k,v] of [['lv',101],['star',8]]) {const bad=structuredClone(snap);bad.team[0][k]=v;assert.throws(()=>SG.PVP.validate(bad));}
  const opponent=structuredClone(snap);opponent.owner=crypto.randomUUID();
  const result=await SG.PVP.fight(g,opponent);assert(Number.isFinite(result.res.rounds));
  assert.equal(SG.CFG.train_cost(100),20400); assert.equal(SG.CFG.exp_need(99),Math.round(10*99*99*99/50));
  console.log('100级/7星边界、跨模式、成本、属性、存档与PVP编码通过');
})().catch(e=>{console.error(e);process.exit(1);});
