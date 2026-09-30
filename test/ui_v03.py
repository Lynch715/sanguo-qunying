# V0.3 界面：羁绊、天象、功名。先用 node 造一个二周目存档塞进 localStorage
import asyncio, json
from playwright.async_api import async_playwright
OUT='/tmp/claude-0/shots/v03_'
import os; os.makedirs('/tmp/claude-0/shots',exist_ok=True)
SAVE=open('/tmp/save03.json').read()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':420,'height':860})
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
        await pg.goto('http://localhost:8765/index.html'); await pg.wait_for_timeout(300)
        await pg.evaluate('s=>{localStorage.clear();localStorage.setItem("sgqyl_campaign_v1",s)}', SAVE)
        await pg.reload(); await pg.wait_for_timeout(400)
        await pg.click('text=闯关　继续'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=OUT+'01_main.png', full_page=True)
        await pg.click('[data-a=tx-reroll] >> nth=0'); await pg.click('#modal .btn.main'); await pg.wait_for_timeout(200)
        print('换后', await pg.inner_text('.txs'))
        await pg.click('.ach-up'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=OUT+'02_ach.png', full_page=True)
        await pg.click('[data-a=ach-all]'); await pg.wait_for_timeout(200)
        t=await pg.query_selector_all('[data-a=title-set]'); print('称号数', len(t))
        if t: await t[0].click(); await pg.wait_for_timeout(200)
        await pg.click('.tab >> text=布阵'); await pg.wait_for_timeout(200)
        print('布阵羁绊', await pg.inner_text('.bonds'))
        await pg.screenshot(path=OUT+'03_form.png', full_page=True)
        await pg.click('.tab >> text=将领'); await pg.click('.hc >> nth=0'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=OUT+'04_hero.png', full_page=True)
        await pg.click('.tab >> text=图鉴'); await pg.wait_for_timeout(200)
        print('图鉴羁绊行', len(await pg.query_selector_all('.brow')))
        await pg.click('.tab >> text=征战'); await pg.wait_for_timeout(200)
        await pg.click('.chap .hd >> nth=4'); await pg.wait_for_timeout(200)
        for _ in range(3):
            if await pg.query_selector('#modal [data-a=to-form]'): break
            if await pg.query_selector('#modal .chapcard'): await pg.click('#modal .chapcard'); await pg.wait_for_timeout(200); continue
            await pg.click('.stg >> nth=0'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=OUT+'05_stage.png', full_page=True)
        await pg.click('#modal [data-a=to-form]'); await pg.wait_for_timeout(200)
        await pg.click('[data-a=fight]'); await pg.wait_for_timeout(800)
        await pg.click('[data-a=skip]'); await pg.wait_for_timeout(300)
        full=await pg.query_selector('[data-a=blog-full]')
        if full: await full.click(); await pg.wait_for_timeout(200)
        await pg.screenshot(path=OUT+'06_result.png', full_page=True)
        txt=await pg.inner_text('body'); print('战报整备行', [l for l in txt.split('\n') if '羁绊【' in l][:6])
        print('errors',errs)
        await b.close()
asyncio.run(main())
