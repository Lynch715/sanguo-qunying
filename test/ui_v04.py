# V0.4 界面：标题页导入、导出导入往返与备份、结算单功名、批量出售、碎片够、装备详情、专字、关于、开篇字幕、霸业说明卡
import asyncio, json, re
from playwright.async_api import async_playwright
OUT='/tmp/claude-0/shots/v04_'
import os; os.makedirs('/tmp/claude-0/shots',exist_ok=True)
SAVE=open('/tmp/save04.json').read()
bad=[]
def chk(c,m):
    print(('✓ ' if c else '✗ ')+m)
    if not c: bad.append(m)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        # 1 在一个空浏览器里导出码 → 另一个空浏览器从标题页导入
        ctx=await b.new_context(viewport={'width':420,'height':860}); pg=await ctx.new_page()
        errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto('http://localhost:8765/index.html'); await pg.evaluate('s=>{localStorage.clear();localStorage.setItem("sgqyl_campaign_v1",s)}', SAVE); await pg.reload()
        await pg.click('text=闯关　继续'); await pg.wait_for_timeout(200)
        await pg.click('.res [data-a=menu]'); await pg.click('#modal [data-a=export]'); await pg.wait_for_timeout(300)
        code=await pg.input_value('#io'); chk(code.startswith('SG1:'), f'导出压缩码 {len(code)} 字')
        ctx2=await b.new_context(viewport={'width':420,'height':860}); p2=await ctx2.new_page(); p2.on('pageerror',lambda e: errs.append(str(e)))
        await p2.goto('http://localhost:8765/index.html'); await p2.wait_for_timeout(200)
        chk(not await p2.query_selector('text=闯关　继续'), '空浏览器没有存档')
        await p2.click('[data-a=import]'); await p2.fill('#io', code[:-30]); await p2.click('[data-a=import-do]'); await p2.wait_for_timeout(300)
        chk(await p2.query_selector('#modal [data-a=import-do]') is not None, '截断的码拒收，还停在导入框')
        await p2.fill('#io', code); await p2.click('[data-a=import-do]'); await p2.wait_for_timeout(300)
        t=await p2.inner_text('#modal'); chk('导入以后' in t and '将' in t, '确认卡：'+t.replace('\n',' ')[:80])
        await p2.click('[data-a=import-yes]'); await p2.wait_for_timeout(300)
        chk('已收将' in await p2.inner_text('body'), '导入后进了大帐')
        # 再导入一次 → 有备份，换回
        await p2.click('.res [data-a=menu]'); await p2.click('#modal [data-a=import]'); await p2.fill('#io', code); await p2.click('[data-a=import-do]'); await p2.wait_for_timeout(200); await p2.click('[data-a=import-yes]'); await p2.wait_for_timeout(300)
        await p2.click('.res [data-a=menu]'); await p2.wait_for_timeout(200)
        chk(await p2.query_selector('[data-a=bak-swap]') is not None, '存档菜单有备份')
        await p2.click('[data-a=bak-swap]'); await p2.click('#modal .btn.main'); await p2.wait_for_timeout(300)
        chk('已收将' in await p2.inner_text('body'), '换回备份')
        # 2 关于与许可
        await p2.click('.res [data-a=menu]'); await p2.click('#modal [data-a=about]'); await p2.wait_for_timeout(200)
        t=await p2.inner_text('#modal'); chk('lynchrrr' in t and '许可' in t and '训练' in t, '关于与许可')
        await p2.screenshot(path=OUT+'01_about.png', full_page=True); await p2.click('#modal .x')
        # 3 行囊批量出售 + 装备详情
        await pg.click('#modal .x') if await pg.query_selector('#modal.on') else None
        await pg.click('.tab >> text=行囊'); await pg.click('[data-a=sell-mode]'); await pg.click('[data-a=sell-tier][data-v=凡品]'); await pg.wait_for_timeout(200)
        t=await pg.inner_text('.sellbar'); n=int(re.search(r'已勾\s*(\d+)',t).group(1)); chk(n>0, '勾凡品：'+t.replace('\n',' '))
        await pg.screenshot(path=OUT+'02_sell.png', full_page=True)
        bag0=await pg.evaluate('SG.getGame().s.bag.length')
        await pg.click('[data-a=sell-do]'); await pg.click('#modal .btn.main'); await pg.wait_for_timeout(200)
        bag1=await pg.evaluate('SG.getGame().s.bag.length'); chk(bag0-bag1==n, f'卖掉 {bag0-bag1} 件')
        chk(await pg.evaluate('SG.getGame().s.bag.some(it=>SG.D.EQID[it.id]["归属"])'), '专属还在')
        await pg.click('[data-a=eq-info] >> nth=0'); await pg.wait_for_timeout(200)
        chk('行囊里有' in await pg.inner_text('#modal'), '装备详情'); await pg.screenshot(path=OUT+'03_eqinfo.png'); await pg.click('#modal .x')
        # 4 碎片够 + 一键升星单子
        await pg.click('.tab >> text=将领'); await pg.click('[data-a=filt-frag]'); await pg.wait_for_timeout(200)
        chk(len(await pg.query_selector_all('.hc'))>0, '碎片够筛出人')
        star=await pg.query_selector('[data-a=star-all]')
        if star:
            await star.click(); await pg.wait_for_timeout(200); chk('→' in await pg.inner_text('#modal'), '升星单子'); await pg.click('#modal .x')
        # 5 专字、打一关看结算单功名和整备
        await pg.click('.tab >> text=征战'); await pg.wait_for_timeout(200)
        chk(len(await pg.query_selector_all('.lim.zhuan'))>0, '关卡列表有「专」')
        await pg.evaluate('SG.getGame().s.ach={}; SG.getGame().s.st={}')
        await pg.evaluate("(()=>{const g=SG.getGame(); const st=SG.D.STAGES[12]; SG.V.stage=st.id;})()")
        await pg.evaluate("SG.V.view='form'"); await pg.evaluate('SG.render()'); await pg.click('[data-a=auto-equip]'); await pg.wait_for_timeout(200)
        if await pg.query_selector('#modal.on .btn.main'): await pg.click('#modal.on .btn.main')
        await pg.click('[data-a=fight]'); await pg.wait_for_timeout(500); await pg.click('[data-a=skip]'); await pg.wait_for_timeout(300)
        f=await pg.query_selector('[data-a=blog-full]')
        if f: await f.click(); await pg.wait_for_timeout(200)
        body=await pg.inner_text('body'); chk('功名「' in body, '结算单有功名'); chk('整备：' in body, '战报有整备')
        await pg.screenshot(path=OUT+'04_result.png', full_page=True)
        cl=await pg.query_selector('.achres [data-a=ach-claim]')
        if cl: await cl.click(); await pg.wait_for_timeout(200); chk('已领' in await pg.inner_text('.achres'), '结算单上领取')
        # 6 霸业说明卡
        await pg.evaluate("SG.V.mode='title'; SG.render()"); await pg.click('[data-a=conq-new]'); await pg.wait_for_timeout(200)
        await pg.click('[data-a=cq-start] >> nth=0'); await pg.wait_for_timeout(300)
        chk('起兵' in await pg.inner_text('#modal'), '霸业开局说明卡')
        chk(not errs, 'errors '+str(errs))
        await b.close()
    print('✗ %d' % len(bad) if bad else '全过')
asyncio.run(main())
