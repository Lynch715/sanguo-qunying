import asyncio, json
from playwright.async_api import async_playwright
OUT='/tmp/claude-0/shots/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for vw,vh,tag in ((420,860,'m'),(1280,800,'d')):
            pg=await b.new_page(viewport={'width':vw,'height':vh}, device_scale_factor=2 if tag=='m' else 1)
            errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
            await pg.goto('http://localhost:8765/index.html')
            await pg.click('[data-a=camp-new]'); await pg.click('#modal .btn.main')
            await pg.evaluate("""() => { const G = SG.getGame(); G.s.gold = 99999;
              for (const n of ['刘备','关羽','张飞','赵云','马超','黄忠','诸葛亮','曹操','吕布']) { G.addHero(n); Object.assign(G.hero(n), {lv: 20, hp: 20000}); }
              G.s.formation = ['关羽','张飞','赵云','马超','刘备','黄忠','诸葛亮','曹操','吕布']; SG.save(); SG.go('heroes'); }""")
            await pg.wait_for_timeout(500); await pg.screenshot(path=OUT+f'a_{tag}_heroes.png')
            await pg.click('.hc[data-n=关羽]'); await pg.wait_for_timeout(400); await pg.screenshot(path=OUT+f'a_{tag}_hero.png', full_page=True)
            await pg.evaluate("() => { const D=SG.D; const s=D.STAGES.find(x=>x['关']==='三英战吕布'); for (const x of D.STAGES) if (x._i < s._i) SG.getGame().s.cleared[x.id]=1; SG.V.stage=s.id; SG.go('form'); }")
            await pg.wait_for_timeout(300); await pg.screenshot(path=OUT+f'a_{tag}_form.png')
            await pg.click('[data-a=fight]'); await pg.wait_for_timeout(3000); await pg.screenshot(path=OUT+f'a_{tag}_battle.png')
            print(tag, errs)
        await b.close()
asyncio.run(main())
