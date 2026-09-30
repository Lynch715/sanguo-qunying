import random, statistics as st, math
T={'无双':(227,176,150),'虎':(196,153,135),'名':(165,131,120),'骁':(134,106,105),'校':(104,83,90),'卒':(70,56,70)}
def battle(teamA,teamB,G,BASE,f,lv=50,tA=1.0,tB=1.0):
    A=[{'atk':a,'def':d,'agi':g,'hp':lv*1000*tA,'mx':lv*1000,'side':0} for a,d,g in teamA]
    B=[{'atk':a,'def':d,'agi':g,'hp':lv*1000*tB,'mx':lv*1000,'side':1} for a,d,g in teamB]
    for r in range(1,31):
        order=sorted(A+B,key=lambda u:-(u['agi']+random.random()*10))
        for u in order:
            if u['hp']<=0: continue
            foes=[x for x in (B if u['side']==0 else A) if x['hp']>0]
            if not foes: break
            t=random.choice(foes)
            t['hp']-=u['mx']*f(u['hp']/u['mx'])*BASE*(u['atk']/(u['atk']+t['def']))**G*random.uniform(0.85,1.15)
        a=any(x['hp']>0 for x in A); b=any(x['hp']>0 for x in B)
        if not b: return r,0
        if not a: return r,1
    return 30,-1
def run(a,b,G,BASE,f,n=300,tA=1.0,tB=1.0):
    rs=[];w=0
    for _ in range(n):
        r,win=battle([T[a]]*9,[T[b]]*9,G,BASE,f,tA=tA,tB=tB); rs.append(r); w+=(win==0)
    return round(st.mean(rs),1),round(w/n,2)
random.seed(3)
F={'底0.4':lambda r:0.4+0.6*r,'开方':lambda r:math.sqrt(r),'底0.5':lambda r:0.5+0.5*r}
for fn,f in F.items():
  for G,BASE in [(1.5,0.22),(2.0,0.25)]:
    print('=== 兵力系数',fn,'γ',G,'基础率',BASE)
    print(' 同档无双',run('无双','无双',G,BASE,f),' 同档卒',run('卒','卒',G,BASE,f))
    for tr in [1.0,0.9,0.8,0.7,0.6,0.5]:
        print('  无双%3d%%兵: vs虎 %s  vs名 %s  vs骁 %s  vs校 %s'%(tr*100,run('无双','虎',G,BASE,f,tA=tr),run('无双','名',G,BASE,f,tA=tr),run('无双','骁',G,BASE,f,tA=tr),run('无双','校',G,BASE,f,tA=tr)))
