import asyncio, sys
from playwright.async_api import async_playwright
OUT='/tmp/claude-0/shots/'
import os; os.makedirs(OUT,exist_ok=True)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':420,'height':860})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(500)
        await pg.screenshot(path=OUT+'01_title.png')
        await pg.click('text=闯关　新开'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=OUT+'02_gift.png')
        await pg.click('#modal .btn.main')
        await pg.click('.tab >> text=招贤'); 
        for i in range(2): await pg.click('[data-a=draw][data-k="1"]'); await pg.click('#modal .x')
        await pg.click('.tab >> text=征战'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=OUT+'03_stages.png')
        await pg.click('.stg >> nth=0'); await pg.wait_for_timeout(200)
        if await pg.query_selector('#modal .chapcard'): await pg.click('#modal .chapcard'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=OUT+'04_stage.png')
        await pg.click('#modal [data-a=to-form]'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=OUT+'05_form.png', full_page=True)
        await pg.click('[data-a=fight]'); await pg.wait_for_timeout(2500)
        await pg.screenshot(path=OUT+'06_battle.png')
        await pg.click('[data-a=skip]'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=OUT+'07_result.png', full_page=True)
        await pg.click('.result ~ .btns [data-a=go]'); await pg.click('.tab >> text=将领'); await pg.click('.hc >> nth=0'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=OUT+'08_hero.png', full_page=True)
        print('errors',errs)
        await b.close()
asyncio.run(main())
