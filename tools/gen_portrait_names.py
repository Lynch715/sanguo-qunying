# 生成 data/portrait_names.tsv：名 → 文件名（拼音，下划线分字），358 人 + 24 范式 + 16 杂兵
# 用 pypinyin；已有原图的按原图文件名反推读音（乐进 yue_jin，不是 le_jin）。一次性工具，data 生成后不用再跑。
import csv, itertools, re, os, sys, collections
from pypinyin import pinyin, lazy_pinyin, Style
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
H = list(csv.DictReader(open(os.path.join(ROOT, 'data/heroes_all.tsv'), encoding='utf-8'), delimiter='\t'))
# 现有原图（assets/portraits/ 下，不含 web/），参数传入清单文件：每行一个相对路径
existing = [l.strip() for l in open(sys.argv[1], encoding='utf-8') if l.strip()] if len(sys.argv) > 1 else []
FOLDER_TIER = {'gongbi': '无双', 'gongbi/tiger': '虎'}
def readings(n):
    ps = [[x.replace('ü', 'v') for x in p] for p in pinyin(n, style=Style.NORMAL, heteronym=True)]
    return [list(c) for c in itertools.product(*ps)]
src = {}; fixed = {}
for path in existing:
    folder, f = os.path.split(path); stem = os.path.splitext(f)[0]
    tier = FOLDER_TIER.get(folder)
    for h in H:
        if tier and h['品阶'] != tier: continue
        for r in readings(h['名']):
            if ''.join(r) == stem or '_'.join(r) == stem:
                src[h['名']] = path; fixed[h['名']] = '_'.join(r)
fn = {h['名']: fixed.get(h['名'], '_'.join(x.replace('ü', 'v') for x in lazy_pinyin(h['名']))) for h in H}
seen = collections.Counter()
for h in H:   # 重名拼音：后出现的加 2（张宝 zhang_bao2、张嶷 zhang_yi2）
    k = fn[h['名']]; seen[k] += 1
    if seen[k] > 1: fn[h['名']] = k + str(seen[k])
# 校档范式分配
md = open(os.path.join(ROOT, '美术文档', '美术_校卒范式提示词_工笔.md'), encoding='utf-8').read()
alloc = {m.group(1): m.group(2).lower() for m in re.finditer(r'^\| (\S+) \| \S+ \| \S+ \| (X\d\d) \|', md, re.M)}
MOB_FILE = {'黄巾兵': 'mob_huangjin', '汉军郡兵': 'mob_hanjun', '西凉兵': 'mob_xiliang', '并州骑': 'mob_bingzhou', '袁军步卒': 'mob_yuanjun', '荆州水军': 'mob_jingzhou', '魏卒·刀盾': 'mob_wei_daodun', '魏卒·弓手': 'mob_wei_gongshou', '虎豹骑': 'mob_hubaoqi', '蜀卒·长枪': 'mob_shu_changqiang', '蜀卒·弩手': 'mob_shu_nushou', '吴卒·环刀': 'mob_wu_huandao', '吴卒·水军': 'mob_wu_shuijun', '南蛮兵': 'mob_nanman', '藤甲兵': 'mob_tengjia', '羌胡骑': 'mob_qianghu'}
out = [['名', '文件', '类别', '原图']]
miss = []
for h in H:
    n = h['名']
    if h['品阶'] == '校':
        if n not in alloc: miss.append(n)
        out.append([n, alloc.get(n, fn[n]), '范式', ''])
    else: out.append([n, fn[n], '本人', src.get(n, '')])
for i in range(1, 25): out.append([f'X{i:02d}', f'x{i:02d}', '范式图', ''])
for k, v in MOB_FILE.items(): out.append([k, v, '杂兵', ''])
with open(os.path.join(ROOT, 'data/portrait_names.tsv'), 'w', encoding='utf-8') as f:
    for r in out: f.write('\t'.join(r) + '\n')
print('写了', len(out) - 1, '行；有原图', len(src), '；校档没在分配表里的', miss)
