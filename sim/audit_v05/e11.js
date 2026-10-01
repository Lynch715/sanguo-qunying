const L=require('./lib.js');const SG=L.SG;const set=process.argv[2];
SG.AGI= set==='D'?{k:.2,crit:.08,dodge:.05}:{k:0,crit:0,dodge:0};
function run(lo,hi,hp,N=500){const R=L.rng(161803);let w=0;for(let i=0;i<N;i++){const a=L.order(R.sample(L.byTier[lo],9)),b=L.order(R.sample(L.byTier[hi],9));const A=a.map(n=>L.mk(n)),B=b.map(n=>L.mk(n));B.forEach(u=>u.hp=u.maxhp*hp);const f=L.fight(A,B,123000+i);w+=f.w===0?1:f.w===-1?.5:0;}return w/N;}
for(const [lo,hi] of [['虎','无双'],['名','虎'],['骁','名'],['校','骁']]){
 const pts=[.75,.7,.65,.6,.55].map(h=>[h,run(lo,hi,h)]);
 // 线性插值找 50%
 let par=null;for(let i=0;i<pts.length-1;i++){const [h1,w1]=pts[i],[h2,w2]=pts[i+1];if(w1<=.5&&w2>=.5){par=h1+(h2-h1)*(.5-w1)/(w2-w1);break;}}
 console.log(set,hi,'对',lo,'持平点',par?Math.round(par*100)+'%':'?',pts.map(([h,w])=>h+':'+Math.round(w*100)).join(' '));
}
