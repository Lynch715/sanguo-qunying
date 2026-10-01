const L=require('./lib.js');const SG=L.SG;
const g=SG.Game?SG.Game.fresh(1):null; if(!g){console.log(Object.keys(SG).filter(k=>/Game/.test(k)));process.exit()}
const n=Object.keys(g.s.heroes)[0]; const h=g.hero(n); h.lv=10; h.hp=1000; 
console.log('打之前',n,'兵',h.hp,'/',h.lv*1000,'征兵价',g.recruitCost(n));
// 找一个够不着的关
const st=L.D.STAGES.find(s=>s['类型']==='主线'&&+s['等级']>=4);
g.s.cleared={}; const id=L.D.STAGES[0].id;
const cells=[n,null,null,null,null,null,null,null,null];
// 用第一关之后的关：先把前面标记通关
for(const s of L.D.STAGES){ if(s.id===st.id)break; if(s['类型']==='主线'||s['类型']==='章末') g.s.cleared[s.id]=1; }
const r=g.fight(st.id,cells,{quick:true,seed:1});
console.log('关',st['关'],'赢?',r.res&&r.res.win,'打完兵',g.hero(n).hp,'征兵价',g.recruitCost(n),'剩复刷',g.replayLeft(st.id));
