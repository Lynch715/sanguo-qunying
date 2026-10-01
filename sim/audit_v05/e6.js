const L=require('./lib.js');const fs=require('fs');
const R=JSON.parse(fs.readFileSync('e4_0.json')).concat(JSON.parse(fs.readFileSync('e4_1.json')));
const TO=['校','骁','名','虎','无双'];
const rows=R.map(r=>{const u=L.mk(r.name);const p=(u.stat('atk')+u.stat('def')+u.stat('int')+u.stat('agi'))*(1+.15*TO.indexOf(r.tier));return {...r,p,off:Math.max(u.stat('atk'),u.stat('int')),agi:u.stat('agi')};});
function rank(a){const s=a.map((v,i)=>[v,i]).sort((x,y)=>x[0]-y[0]);const r=[];s.forEach(([v,i],k)=>r[i]=k);return r;}
function sp(x,y){const a=rank(x),b=rank(y);const n=a.length;const ma=(n-1)/2;let num=0,da=0,db=0;for(let i=0;i<n;i++){num+=(a[i]-ma)*(b[i]-ma);da+=(a[i]-ma)**2;db+=(b[i]-ma)**2;}return num/Math.sqrt(da*db);}
for(const t of TO){const s=rows.filter(r=>r.tier===t);console.log(t,'战力数字 vs 实战 spearman',sp(s.map(r=>r.p),s.map(r=>r.win)).toFixed(2),' 主攻属性 vs 实战',sp(s.map(r=>r.off),s.map(r=>r.win)).toFixed(2));}
console.log('全体',sp(rows.map(r=>r.p),rows.map(r=>r.win)).toFixed(2));
// 战力相同但实战差最大的例子
const ex=rows.filter(r=>r.tier==='名').sort((a,b)=>a.p-b.p);
const top=ex.filter(r=>Math.abs(r.p-ex[Math.floor(ex.length/2)].p)<15).sort((a,b)=>a.win-b.win);
console.log('名档战力相近的:',top.slice(0,3).map(r=>r.name+Math.round(r.p)+'/'+r.win.toFixed(2)),top.slice(-3).map(r=>r.name+Math.round(r.p)+'/'+r.win.toFixed(2)));
