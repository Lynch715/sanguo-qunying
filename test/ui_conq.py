import asyncio
from playwright.async_api import async_playwright
OUT='/tmp/claude-0/shots/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':420,'height':860})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(300)
        await pg.click('[data-a=conq-new]'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=OUT+'c01_pick.png')
        await pg.click('[data-a=cq-start][data-f=蜀]'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=OUT+'c02_map.png', full_page=True)
        await pg.click('.tab >> text=招贤')
        for i in range(8): await pg.click('[data-a=draw][data-k="1"]'); await pg.click('#modal .x')
        await pg.click('.tab >> text=地图')
        # 点一个可打的城
        await pg.click('.city.can >> nth=0'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=OUT+'c03_city.png')
        await pg.click('#modal [data-a=cq-attack]'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=OUT+'c04_form.png', full_page=True)
        await pg.click('[data-a=cq-go]'); await pg.wait_for_timeout(1200)
        await pg.screenshot(path=OUT+'c05_battle.png')
        await pg.click('[data-a=skip]'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=OUT+'c06_result.png', full_page=True)
        await pg.click('[data-a=cq-after]'); await pg.wait_for_timeout(200)
        # 过二十回合：能打就打（自动布阵），有人来打就自动守
        for t in range(30):
            if await pg.query_selector('#modal.on [data-a=cq-def-auto]'):
                await pg.click('#modal [data-a=cq-def-auto]'); await pg.click('[data-a=skip]'); await pg.click('[data-a=cq-resume]'); continue
            if await pg.query_selector('#modal.on [data-a=cq-def-pick]'):
                await pg.click('#modal [data-a=cq-def-pick]'); await pg.click('[data-a=cq-def-go]'); await pg.click('[data-a=skip]'); await pg.click('[data-a=cq-resume]'); continue
            if await pg.query_selector('#modal.on'):
                x = await pg.query_selector('#modal [data-a=close]')
                if x: await x.click()
                else: break
            # 能打就打
            can = await pg.query_selector('.city.can')
            if can and t % 2 == 0:
                await can.click(); btn = await pg.query_selector('#modal [data-a=cq-attack]:not(.off)')
                if btn:
                    await btn.click(); await pg.click('[data-a=form-auto]')
                    rb = await pg.query_selector('[data-a=recruit-all]:not(.off)')
                    if rb: await rb.click()
                    go = await pg.query_selector('[data-a=cq-go]:not(.off)')
                    if go:
                        await go.click(); await pg.click('[data-a=skip]'); await pg.click('[data-a=cq-after]'); continue
                    await pg.click('[data-a=cq-cancel]')
                else: await pg.click('#modal [data-a=close]')
            await pg.click('[data-a=cq-end]'); await pg.wait_for_timeout(50)
        st = await pg.evaluate("() => { const w = SG.getGame().world; return {turn: w.st.turn, mine: w.cities(w.st.me).length, pris: w.st.prisoners.length, news: SG.getGame().s.news.slice(-5)}; }")
        print(st)
        await pg.click('.tab >> text=俘虏'); await pg.wait_for_timeout(100)
        await pg.screenshot(path=OUT+'c07_prison.png', full_page=True)
        # 重载继续
        await pg.reload(); await pg.click('[data-a=conq-continue]'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=OUT+'c08_reload.png')
        print('errors', errs)
        await b.close()
asyncio.run(main())
