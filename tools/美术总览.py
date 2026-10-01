#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成项目根目录的 美术总览.html：按档、阵营看全部立绘。图用 assets/portraits/web 的 480 高 webp，点开看原图。
换了图、加了人重跑一次：python3 tools/美术总览.py"""
import csv, os, html, json, collections
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
H = {h['名']: h for h in csv.DictReader(open(os.path.join(ROOT, 'data/heroes_all.tsv'), encoding='utf-8'), delimiter='\t')}
R = list(csv.DictReader(open(os.path.join(ROOT, 'data/portrait_names.tsv'), encoding='utf-8'), delimiter='\t'))
users = collections.defaultdict(list)
for r in R:
    if r['类别'] == '范式': users[r['文件']].append(r['名'])
def orig(r): return 'assets/' + r['原图'][3:] if r['原图'].startswith('../') else ''
cards = []
for r in R:
    if r['类别'] == '范式': continue
    web = f"assets/portraits/web/l_{r['文件']}.webp"
    if not os.path.exists(os.path.join(ROOT, web)): web = ''
    if r['类别'] == '本人':
        h = H[r['名']]; tier, fac, sub = h['品阶'], h['阵营'], f"{h['定位']}　{h['特点']}"
    elif r['类别'] == '杂兵': tier, fac, sub = '杂兵', '', ''
    else: tier, fac, sub = '校', '', '用的人：' + '、'.join(users.get(r['文件'], []))
    o = orig(r); mt = os.path.getmtime(os.path.join(ROOT, o)) if o and os.path.exists(os.path.join(ROOT, o)) else 0
    cards.append({'n': r['名'], 't': tier, 'f': fac, 's': sub, 'w': web, 'o': o, 'm': mt})
old = []
for d, _, fs in os.walk(os.path.join(ROOT, 'assets/立绘/_旧图/风格试稿_赵云六方向')):
    for f in sorted(fs):
        if f.lower().endswith(('.png', '.jpg')): old.append(os.path.relpath(os.path.join(d, f), ROOT))
TIERS = ['无双', '虎', '名', '骁', '校', '杂兵']
cnt = collections.Counter(c['t'] for c in cards)
data = json.dumps({'cards': cards, 'old': old}, ensure_ascii=False)
page = """<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>三国群英录 · 美术总览</title>
<style>
:root{--paper:#f6f1e6;--card:#fffdf8;--ink:#2b2622;--ink2:#6b6259;--ink3:#a39889;--line:#e3d9c6;--zhu:#b8412c;--qing:#2c5f8d}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.5 "PingFang SC","Songti SC",serif}
header{position:sticky;top:0;z-index:5;background:rgba(246,241,230,.96);border-bottom:1px solid var(--line);padding:10px 16px}
h1{font-size:20px;margin:0 0 6px;letter-spacing:2px}.sum{color:var(--ink2);font-size:13px}
.bar{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;align-items:center}
.chip{border:1px solid var(--line);background:var(--card);border-radius:14px;padding:2px 11px;cursor:pointer;font-size:13px;user-select:none}
.chip.on{background:var(--ink);color:#fff;border-color:var(--ink)}
input{border:1px solid var(--line);border-radius:14px;padding:3px 10px;font:inherit;font-size:13px;width:130px;background:var(--card)}
main{padding:8px 16px 40px}h2{font-size:17px;margin:22px 0 8px;display:flex;gap:8px;align-items:baseline}h2 small{color:var(--ink3);font-weight:normal;font-size:13px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.c{background:var(--card);border:1px solid var(--line);border-radius:6px;overflow:hidden;cursor:zoom-in}
.c img,.c .ph{display:block;width:100%;aspect-ratio:3/4;object-fit:cover;background:#ece4d4}
.c .ph{display:flex;align-items:center;justify-content:center;color:var(--ink3);font-size:13px}
.c .t{padding:5px 7px 7px}.c b{font-size:15px}.c .f{font-size:12px;color:#fff;border-radius:3px;padding:0 4px;margin-left:4px}
.c .s{font-size:12px;color:var(--ink2);line-height:1.4;margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.c .new{font-size:11px;color:var(--zhu);margin-left:4px}
.f-魏{background:#3b5f8a}.f-蜀{background:#3d7a4e}.f-吴{background:#b8412c}.f-汉{background:#8a6d2f}.f-无{background:#777}
#lb{position:fixed;inset:0;background:rgba(20,16,12,.88);display:none;align-items:center;justify-content:center;z-index:9;flex-direction:column;gap:8px}
#lb.on{display:flex}#lb img{max-width:94vw;max-height:84vh;box-shadow:0 4px 30px #000}#lb div{color:#eee;font-size:14px}#lb a{color:#f3d9a0}
@media (max-width:480px){.grid{grid-template-columns:repeat(3,1fr);gap:6px}.c .s{display:none}}
</style></head><body>
<header><h1>三国群英录 · 美术总览</h1><div class="sum">SUMMARY　点图看原图，原图在 assets/立绘/。</div>
<div class="bar" id="tiers"></div><div class="bar" id="facs"></div></header>
<main id="m"></main><div id="lb"><img><div></div></div>
<script>
const D=DATA,T=TIERS;let tier='全部',fac='全部',q='';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const now=Date.now()/1000;
function chips(id,L,cur,set){document.getElementById(id).innerHTML=L.map(x=>`<span class="chip${x===cur?' on':''}" data-v="${x}">${x}</span>`).join('')+(id==='facs'?'<input id="q" placeholder="搜名字" value="'+esc(q)+'">':'');
 document.querySelectorAll('#'+id+' .chip').forEach(e=>e.onclick=()=>{set(e.dataset.v);draw()});}
function card(c){return `<div class="c" data-o="${esc(c.o)}" data-w="${esc(c.w)}" data-n="${esc(c.n)}">${c.w?`<img loading="lazy" src="${esc(c.w)}">`:'<div class="ph">还没有图</div>'}<div class="t"><b>${esc(c.n)}</b>${c.f?`<span class="f f-${c.f}">${c.f==='无'?'群':c.f}</span>`:''}<div class="s">${esc(c.s)}</div></div></div>`}
function draw(){chips('tiers',['全部'].concat(T),tier,v=>tier=v);chips('facs',['全部','魏','蜀','吴','汉','群'],fac==='无'?'群':fac,v=>fac=v==='群'?'无':v);
 const qi=document.getElementById('q');qi.oninput=()=>{q=qi.value;drawMain()};drawMain()}
function drawMain(){let h='';for(const t of T){if(tier!=='全部'&&tier!==t)continue;
 const L=D.cards.filter(c=>c.t===t&&(fac==='全部'||c.f===fac)&&(!q||c.n.includes(q)||c.s.includes(q)));if(!L.length)continue;
 h+=`<h2>${t==='校'?'校档范式':t}<small>${L.length} 张</small></h2><div class="grid">${L.map(card).join('')}</div>`}
 if(tier==='全部'&&fac==='全部'&&!q&&D.old.length)h+=`<h2>旧图·赵云六方向风格试稿<small>不用了，留着对比</small></h2><div class="grid">${D.old.map(o=>card({n:o.split('/').pop(),o,w:o,s:'',f:'',m:0})).join('')}</div>`;
 document.getElementById('m').innerHTML=h;
 document.querySelectorAll('.c').forEach(e=>e.onclick=()=>{const lb=document.getElementById('lb');lb.querySelector('img').src=e.dataset.o||e.dataset.w;lb.querySelector('div').innerHTML=esc(e.dataset.n)+(e.dataset.o?`　<a href="${esc(e.dataset.o)}" target="_blank">原图</a>`:'')+'　（点任意处关闭）';lb.classList.add('on')})}
document.getElementById('lb').onclick=()=>document.getElementById('lb').classList.remove('on');
draw();
</script></body></html>"""
summary = '　'.join(f'{t} {cnt[t]}' for t in TIERS) + f'　共 {len(cards)} 张'
page = page.replace('DATA', data).replace('TIERS', json.dumps(TIERS, ensure_ascii=False)).replace('SUMMARY', summary)
open(os.path.join(ROOT, '美术总览.html'), 'w', encoding='utf-8').write(page)
print('写好 美术总览.html：', summary)
