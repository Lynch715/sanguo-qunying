# 用点击从头打到第 3 章章末（三英战吕布）
import asyncio, sys, json, os
from playwright.async_api import async_playwright
TARGET = sys.argv[1] if len(sys.argv) > 1 else '三英战吕布'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 420, 'height': 860})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html')
        await pg.click('[data-a=camp-new]'); await pg.click('#modal .btn.main'); await pg.click('.tab >> text=征战')
        log = []; fails = 0
        for attempt in range(int(os.environ.get("N", 80))):
            nxt = await pg.evaluate("""() => { const G = SG.getGame(); const D = SG.D;
              const s = D.STAGES.find(s => (s['类型']==='主线'||s['类型']==='章末') && !G.isCleared(s.id));
              return {id: s.id, ch: s['章'], name: s['关'], gold: G.s.gold, n: Object.keys(G.s.heroes).length}; }""")
            if nxt['name'] == TARGET and any(l.get('won') and l['name'] == TARGET for l in log): break
            # 花钱：人不到 8 个先抽，剩下的钱练级
            await pg.click('.tab >> text=招贤')
            while True:
                st = await pg.evaluate("() => ({g: SG.getGame().s.gold, n: Object.keys(SG.getGame().s.heroes).length})")
                if st['n'] >= 12 or st['g'] < 300 + 150: break
                await pg.click('[data-a=draw][data-k="1"]'); await pg.click('#modal .x')
            await pg.click('.tab >> text=将领'); await pg.click('[data-a=sort][data-v=power]')
            for i in range(6):
                cards = await pg.query_selector_all('.hc')
                if i >= len(cards): break
                await cards[i].click()
                for _ in range(3):
                    btn = await pg.query_selector('[data-a=train][data-k="1"]:not(.off)')
                    if not btn: break
                    lvl = await pg.evaluate("() => SG.getGame().hero(SG.V.hero).lv")
                    if lvl >= int(await pg.evaluate(f"() => SG.stageFoes(SG.D.STAGE['{nxt['id']}'],1).lv")) + 1 + min(6, fails // 2): break
                    await btn.click()
                await pg.click('[data-a=go][data-v=heroes]')
            # 打
            await pg.click('.tab >> text=征战')
            if not await pg.query_selector(f".stg[data-id={nxt['id']}]"):
                await pg.click(f".chap .hd[data-c=\"{nxt['ch']}\"]")
            await pg.click(f".stg[data-id={nxt['id']}]")
            if await pg.query_selector('#modal .chapcard'): await pg.click('#modal .chapcard')
            await pg.click('#modal [data-a=to-form]')
            await pg.click('[data-a=form-auto]')
            rb = await pg.query_selector('[data-a=recruit-all]:not(.off)')
            if rb: await rb.click()
            await pg.click('[data-a=fight]'); await pg.wait_for_timeout(150)
            await pg.click('[data-a=skip]')
            won = await pg.inner_text('.result') == '胜'
            log.append({'name': nxt['name'], 'won': won, 'gold': nxt['gold'], 'heroes': nxt['n']})
            fails = 0 if won else fails + 1
            if not won:
                # 输了：回头把前面三关各刷到今天的上限，攒钱
                prev = await pg.evaluate("""(id) => { const D = SG.D, G = SG.getGame(); const i = D.STAGE[id]._i; return D.STAGES.slice(Math.max(0, i - 3), i).filter(s => G.isCleared(s.id) && G.replayLeft(s.id) > 0).map(s => [s.id, s['章']]); }""", nxt['id'])
                await pg.click('.result ~ .btns [data-a=go]')
                for sid, ch in prev:
                    for _ in range(3):
                        await pg.click('.tab >> text=征战')
                        if not await pg.query_selector(f'.stg[data-id={sid}]'): await pg.click(f'.chap .hd[data-c="{ch}"]')
                        await pg.click(f'.stg[data-id={sid}]')
                        if await pg.query_selector('#modal .chapcard'): await pg.click('#modal .chapcard')
                        if await pg.query_selector('#modal [data-a=to-form].off'): await pg.click('#modal .x'); break
                        await pg.click('#modal [data-a=to-form]'); await pg.click('[data-a=form-auto]'); await pg.click('[data-a=fight]'); await pg.wait_for_timeout(100); await pg.click('[data-a=skip]')
                        await pg.click('.result ~ .btns [data-a=go]')
                await pg.evaluate("() => { SG.getGame().s.replay.day = '换天'; }")  # 模拟过了一天
                print('   刷完前面，金', await pg.evaluate('() => SG.getGame().s.gold'))
                continue
            print(nxt['ch'], nxt['name'], '胜' if won else '败', '金', nxt['gold'], '人', nxt['n'])
            await pg.click('.result ~ .btns [data-a=go]')
        # 隐藏关点不进去
        await pg.click('.tab >> text=征战')
        await pg.evaluate("() => { SG.V.open[1] = true; SG.render(); }")
        hid = await pg.query_selector('.stg.lock[data-a=locked]')
        if hid:
            await hid.click(); await pg.wait_for_timeout(100)
            t = await pg.inner_text('#toast'); print('点隐藏关：', t.strip())
            opened = await pg.evaluate("() => document.getElementById('modal').classList.contains('on')")
            print('隐藏关弹出了关卡页？', opened)
        await pg.screenshot(path='/tmp/claude-0/shots/10_after.png', full_page=True)
        print('页面报错', errs)
        await b.close()
asyncio.run(main())
