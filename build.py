#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""拼 src/ + data/ → 三国群英录_V<版本>.html（同时写 index.html、sw.js、site.webmanifest）

只用标准库。图片不内嵌：html 里写相对路径，后面带内容哈希（?v=xxxxxxxx），换图自动刷新缓存。
  python3 build.py              正常构建（有 assets/portraits/web 就用上）
  python3 build.py --noassets   不看 assets，全部用占位
先跑 build_portraits.py 出 webp，再跑本脚本。
"""
import csv, hashlib, json, os, re, sys

VERSION = '0.5'
ROOT = os.path.dirname(os.path.abspath(__file__))
NOASSETS = '--noassets' in sys.argv
SRC = ['engine_battle.js', 'engine_game.js', 'engine_ach.js', 'engine_conquest.js', 'saveio.js', 'view.js', 'view_conquest.js', 'pwa.js']


def tsv(name):
    with open(os.path.join(ROOT, 'data', name), encoding='utf-8') as f:
        return list(csv.DictReader(f, delimiter='\t'))


def story():
    """从《设计_章节与关卡》抽章节引子和每关剧情。"""
    txt = open(os.path.join(ROOT, '设计_章节与关卡.md'), encoding='utf-8').read()
    chapters, stages = {}, {}
    ch = None
    lines = txt.split('\n')
    for i, line in enumerate(lines):
        m = re.match(r'## 第(\d+)章 (\S+)(?:（(.+)）)?', line)
        if m:
            ch = int(m.group(1))
            intro = ''
            for j in range(i + 1, min(i + 6, len(lines))):
                s = lines[j].strip()
                if s and not s.startswith('|') and not s.startswith('#'):
                    intro = s
                    break
            chapters[ch] = {'name': m.group(2), 'year': m.group(3) or '', 'intro': intro}
            continue
        if ch and line.startswith('|'):
            c = [x.strip() for x in line.strip().strip('|').split('|')]
            if len(c) >= 5 and c[1] in ('主线', '章末', '支线', '隐藏'):
                stages[f'{ch}|{c[0]}'] = c[-1]
    return {'chapters': chapters, 'stages': stages}


def crawl():
    """《设计_开篇与尾声》：标了「状态：定稿」才放进游戏。"""
    p = os.path.join(ROOT, '设计_开篇与尾声.md')
    if not os.path.exists(p):
        return {}
    txt = open(p, encoding='utf-8').read()
    if not re.search(r'^> 状态：定稿', txt, re.M):
        return {}
    out, cur = {}, None
    for line in txt.split('\n'):
        if line.startswith('## '):
            cur = {'开篇': 'intro', '尾声': 'epilogue'}.get(line[3:].strip())
            if cur: out[cur] = []
            continue
        if not cur or line.startswith('>'):
            continue
        t = line.strip()
        if t.startswith('# '): out[cur].append({'h': t[2:]})
        elif t: out[cur].append({'p': t})
    return out


def set_text():
    """《设计_装备数值》二节的专属套装表：人 → 套名、武器特效、宝物特效、四件（给玩家看的字）。"""
    txt = open(os.path.join(ROOT, '设计_装备数值.md'), encoding='utf-8').read()
    out = {}
    for line in txt.split('\n'):
        c = [x.strip() for x in line.strip().strip('|').split('|')]
        if len(c) == 5 and line.startswith('|') and c[0] not in ('人', '---') and not c[0].startswith('-') and c[4].startswith('「'):
            out[c[0]] = {'set': c[1], 'w': c[2], 't': c[3], 'four': c[4]}
    return out


def bonds():
    """羁绊表；成员名对 heroes_all.tsv 逐个校，对不上就报错。"""
    names = {r['名'] for r in tsv('heroes_all.tsv')}
    rows = tsv('bonds.tsv')
    bad = [(r['名'], m) for r in rows for m in r['成员'].split() if m not in names]
    if bad:
        sys.exit('羁绊成员对不上：' + '、'.join(f'{a}/{b}' for a, b in bad))
    dup = [r['名'] for r in rows if [x['名'] for x in rows].count(r['名']) > 1]
    if dup:
        sys.exit('羁绊重名：' + '、'.join(sorted(set(dup))))
    return rows


def heroes():
    """将领表并上生平（data/bios.tsv）；缺人、多人、空生平都报错。"""
    rows = tsv('heroes_all.tsv')
    bio = {r['名']: r['生平'] for r in tsv('bios.tsv')}
    names = {r['名'] for r in rows}
    miss = [n for n in names if not bio.get(n, '').strip()]
    extra = [n for n in bio if n not in names]
    if miss or extra:
        sys.exit('生平对不上：缺 ' + '、'.join(sorted(miss)) + '；多 ' + '、'.join(sorted(extra)))
    for r in rows:
        r['生平'] = bio[r['名']]
    return rows


def fhash(p):
    h = hashlib.md5()
    with open(p, 'rb') as f:
        h.update(f.read())
    return h.hexdigest()[:8]


def portraits():
    out = {}
    if NOASSETS:
        return out
    web = os.path.join(ROOT, 'assets', 'portraits', 'web')
    for r in tsv('portrait_names.tsv'):
        fn = r['文件']
        s = os.path.join(web, f's_{fn}.webp')
        l = os.path.join(web, f'l_{fn}.webp')
        if os.path.exists(s) and os.path.exists(l):
            out[r['名']] = {'s': f'assets/portraits/web/s_{fn}.webp?v={fhash(s)}',
                            'l': f'assets/portraits/web/l_{fn}.webp?v={fhash(l)}',
                            'k': r['类别']}
    return out


# 章 → 场景原画（8 张按地貌分，见《美术_场景原画提示词》）
SCENE_OF = {
    'sc_gong': [2, 4, 8, 24], 'sc_guan': [3, 9, 17, 19, 25], 'sc_cun': [1, 11, 27],
    'sc_zhanchang': [5, 7, 10, 12], 'sc_jiang': [6, 13, 14, 15, 26], 'sc_shudao': [18, 20, 22, 23],
    'sc_xiliang': [16, 28, 30], 'sc_nanzhong': [21, 29],
}
SCENE_CRAWL = {'intro': 'sc_cun', 'epilogue': 'sc_jiang'}


def scenes():
    """{'ch': {章: url}, 'intro': url, 'epilogue': url}；没图的不写，界面就不渲染。"""
    out = {'ch': {}}
    if NOASSETS:
        return out
    d = os.path.join(ROOT, 'assets', 'scenes', 'web')
    url = {}
    for sid in SCENE_OF:
        p = os.path.join(d, sid + '.webp')
        if os.path.exists(p):
            url[sid] = f'assets/scenes/web/{sid}.webp?v={fhash(p)}'
    for sid, chs in SCENE_OF.items():
        for c in chs:
            if sid in url: out['ch'][c] = url[sid]
    for k, sid in SCENE_CRAWL.items():
        if sid in url: out[k] = url[sid]
    return out


def main():
    data = {
        'version': VERSION,
        'heroes': heroes(), 'skills': tsv('skills_dsl.tsv'), 'equip': tsv('equip.tsv'),
        'set4': tsv('set4.tsv'), 'stages': tsv('stages.tsv'), 'cities': tsv('cities.tsv'), 'bonds': bonds(),
        'story': story(), 'crawl': crawl(), 'sets': set_text(), 'portraits': portraits(), 'scenes': scenes(),
    }
    js_data = 'window.SGDATA=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + ';'
    css = open(os.path.join(ROOT, 'src', 'style.css'), encoding='utf-8').read()
    code = []
    for f in SRC:
        p = os.path.join(ROOT, 'src', f)
        if os.path.exists(p):
            code.append(f'/* ---- {f} ---- */\n' + open(p, encoding='utf-8').read())
    code = '\n'.join(code).replace('</script', '<\\/script')
    html = f'''<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>三国群英录 V{VERSION}</title>
<meta name="theme-color" content="#f4efe4">
<link rel="manifest" href="site.webmanifest">
<link rel="icon" href="favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="assets/icons/icon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="assets/icons/icon-180.png">
<meta name="apple-mobile-web-app-title" content="三国群英录">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="description" content="三国群英录：三百五十八位三国人物，九宫对阵，闯关与霸业。作者 Lynch。">
<style>
{css}
</style>
</head>
<body>
<div id="app"></div>
<script>{js_data}</script>
<script>
{code}
</script>
<script>
if ('serviceWorker' in navigator && location.protocol !== 'file:') {{
  navigator.serviceWorker.register('sw.js').catch(function () {{}});
}}
</script>
</body>
</html>
'''
    name = f'三国群英录_V{VERSION}.html'
    for fn in (name, 'index.html'):
        with open(os.path.join(ROOT, fn), 'w', encoding='utf-8') as f:
            f.write(html)
    sw = open(os.path.join(ROOT, 'src', 'sw_template.js'), encoding='utf-8').read().replace('__VERSION__', VERSION + '-' + hashlib.md5(html.encode()).hexdigest()[:8])
    with open(os.path.join(ROOT, 'sw.js'), 'w', encoding='utf-8') as f:
        f.write(sw)
    manifest = {
        'name': '三国群英录', 'short_name': '三国群英录', 'start_url': '.', 'scope': '.', 'display': 'standalone',
        'background_color': '#f4efe4', 'theme_color': '#f4efe4',
        'icons': [{'src': 'assets/icons/icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
                  {'src': 'assets/icons/icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
                  {'src': 'assets/icons/maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}],
    }
    with open(os.path.join(ROOT, 'site.webmanifest'), 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    print(f'{name}  {len(html) // 1024} KB；立绘 {len(data["portraits"])} 张{"（--noassets）" if NOASSETS else ""}；剧情 {len(data["story"]["stages"])} 关')
    # 自检（照水浒的规矩）：同名函数、内联 onclick、setInterval、图片路径
    probe = re.sub(r'/\*[\s\S]*?\*/', '', code)
    probe = re.sub(r'^\s*//.*$', '', probe, flags=re.M)
    names = re.findall(r'^\s*function\s+([A-Za-z_$][\w$]*)\s*\(', probe, re.M)
    dup = sorted({n for n in names if names.count(n) > 1})
    print(f'  同名函数 {len(dup)}' + (f'：{"、".join(dup)}（各在自己的闭包里，不冲突就行）' if dup else ' ✓'))
    n_click = len(re.findall(r'onclick\s*=', probe))
    n_iv = len(re.findall(r'setInterval', probe))
    print(f'  内联 onclick {n_click}　setInterval {n_iv}')
    miss = [v[k].split('?')[0] for v in data['portraits'].values() for k in ('s', 'l') if not os.path.exists(os.path.join(ROOT, v[k].split('?')[0]))]
    print(f'  图片路径 {"全部能打开 ✓" if not miss else "打不开 " + str(len(miss)) + " 个"}')


if __name__ == '__main__':
    main()
