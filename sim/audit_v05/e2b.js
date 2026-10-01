const L=require('./lib.js');const EQ=L.D.EQROWS.filter(e=>!e['归属']);
const N=1500,tier='名';
function run(nm){const R=L.rng(4242);let win=0;for(let i=0;i<N;i++){const a=L.order(R.sample(L.byTier[tier],6)),b=L.order(R.sample(L.byTier[tier],6));
const id=nm?EQ.find(e=>e['名']===nm).id:null;const A=a.map(x=>L.mk(x,50,1,id?[id]:null)),B=b.map(x=>L.mk(x));const f=L.fight(A,B,9000+i);if(f.w===0)win++;else if(f.w===-1)win+=.5;}return (win/N*100).toFixed(0)+'%';}
const o={};for(const nm of [null,'金印','六韬','虎符','玉佩','伤寒论'])o[nm||'裸']=run(nm);console.log(JSON.stringify(o));
