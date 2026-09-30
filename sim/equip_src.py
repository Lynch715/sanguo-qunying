# -*- coding: utf-8 -*-
"""装备数据源。运行生成 ../data/equip.tsv。
列：id 名 槽 档 类别 固定 百分比 维 归属 DSL
  槽：武器 盔甲 马匹 宝物；档：凡品 良品 精品 珍品 神品
  类别：武器的兵器类（刀 枪 戟 剑 弓 扇笔 杖拂）；宝物写它加的维
  固定/百分比：面板；维：加哪个属性（武器默认 atk，文官武器 int）
  归属：专属件写本人名；DSL：单件特效（跟技能小语法一样，作为附加被动）
套装四件效果在 SET4 里，是本人技能的替换行。"""
TIER = {'凡品': 0, '良品': 1, '精品': 2, '珍品': 3, '神品': 4}
FLAT = {'武器': [6, 10, 15, 21, 30], '盔甲': [6, 10, 14, 19, 27], '马匹': [5, 8, 11, 15, 21], '宝物': [5, 8, 11, 15, 21]}
PCT = {'武器': [0, 2, 3, 4, 6], '盔甲': [0, 2, 3, 4, 6], '马匹': [0, 2, 3, 4, 6], '宝物': [0, 0, 2, 4, 6]}
SLOTSTAT = {'武器': 'atk', '盔甲': 'def', '马匹': 'agi'}
rows = []
def add(name, slot, tier, cat='', stat=None, owner='', dsl='', flat=None, pct=None):
    t = TIER[tier]
    rows.append(dict(id=f'{slot}_{len(rows):03d}', 名=name, 槽=slot, 档=tier, 类别=cat,
                     固定=FLAT[slot][t] if flat is None else flat, 百分比=PCT[slot][t] if pct is None else pct,
                     维=stat or SLOTSTAT.get(slot, 'def'), 归属=owner, DSL=dsl))
# ---------- 通用武器 ----------
W = {'刀': ['环首刀', '斩马刀', '百炼刀', '大夏龙雀', '百辟刀'], '枪': ['长矛', '马槊', '丈二长枪', '龙胆亮银枪', '蛇矛'],
     '戟': ['铁戟', '双戟', '方天戟', '画杆方天戟', '天画戟'], '剑': ['佩剑', '松纹剑', '七星剑', '干将', '莫邪'],
     '弓': ['角弓', '柘木弓', '雕翎弓', '震天弓', '落日弓'], '扇笔': ['竹扇', '羽扇', '鹤羽扇', '诸葛扇', '麈尾'], '杖拂': ['木杖', '藜杖', '九节杖', '太平杖', '五斗米杖']}
for cat, names in W.items():
    for i, n in enumerate(names): add(n, '武器', list(TIER)[i], cat, 'int' if cat in ('扇笔', '杖拂') else 'atk')
A = [['皮甲', '布甲', '藤甲', '竹甲', '纸甲'], ['铁札甲', '锁子甲', '两当铠', '鱼鳞甲', '筩袖铠'], ['玄铁甲', '明光铠', '乌锤甲', '百炼铠', '山文甲'], ['兽面吞头铠', '黄金锁子甲', '连环铠', '龙鳞甲', '镜甲'], ['玄甲', '金缕甲', '天蚕甲', '鎏金明光铠', '七宝甲']]
for i, L in enumerate(A):
    for n in L: add(n, '盔甲', list(TIER)[i])
M = [['驽马', '川马', '蜀马', '草原马', '滇马'], ['青骢', '黄骠', '乌骓', '白马', '枣红马'], ['大宛马', '汗血马', '踏雪骢', '玉花骢', '紫骍'], ['追风', '绝尘', '赤电', '爪黄飞电', '惊帆'], ['龙驹', '玉追', '飞云', '九逸', '腾霜白']]
for i, L in enumerate(M):
    for n in L: add(n, '马匹', list(TIER)[i])
T = [[('铜印', 'def', ''), ('竹简', 'int', ''), ('令旗', 'agi', ''), ('皮盾', 'def', ''), ('药囊', 'def', 'rend:heal(self,1)')],
     [('银印', 'def', ''), ('兵书', 'int', ''), ('战鼓', 'atk', ''), ('铁盾', 'def', ''), ('酒葫芦', 'agi', '')],
     [('金印', 'def', ''), ('六韬', 'int', ''), ('虎符', 'atk', ''), ('玉佩', 'agi', ''), ('伤寒论', 'def', 'rend:heal(self,2)')],
     [('帅印', 'def', ''), ('孙子兵法', 'int', ''), ('传国玺', 'atk', ''), ('夜明珠', 'agi', ''), ('太平经', 'int', 'setup:buff(self,healout,10)')],
     [('九锡', 'def', 'setup:buff(self,atk,4); setup:buff(self,int,4); setup:buff(self,agi,4)'), ('太公兵法', 'int', 'setup:buff(self,ctrlhit,5)'), ('龙泉', 'atk', 'setup:buff(self,crit,5)'), ('飞廉', 'agi', 'setup:buff(self,dodge,5)'), ('青囊通用', 'def', 'rend:heal(self,3)')]]
for i, L in enumerate(T):
    for n, st, d in L: add(n, '宝物', list(TIER)[i], '', st, '', d)
# ---------- 专属 36 套（神品，本人固定值 ×1.5 在引擎里算） ----------
E = {
 '刘备': ('雌雄双股剑', '昭烈金甲', '的卢', '桃园誓书', 'setup:flag(double_attack); setup:buff(self,atkmult,-40)', 'setup:buff(a:关羽,def,5); setup:buff(a:张飞,def,5)'),
 '关羽': ('青龙偃月刀', '绿锦战袍', '忠义赤兔', '春秋', 'setup:buff(self,atkmult,15)', 'setup:buff(self,magin,-10)'),
 '张飞': ('丈八蛇矛', '玄铁乌甲', '乌云踏雪', '长坂酒葫芦', 'atk:st(tgt,震慑,1,20)', 'rend:buff(self,atk,8,1)@hp<50'),
 '赵云': ('涯角枪', '白龙银甲', '照夜玉狮子', '青釭剑', 'setup:buff(self,pursueout,15)', 'setup:flag(pursue_ig,0.2)'),
 '马超': ('虎头湛金枪', '狮盔兽甲', '里飞沙', '神威天将军印', 'setup:buff(self,agi,15,1)', 'setup:buff(self,dmgout,10)@vs:汉'),
 '黄忠': ('凤嘴刀', '定军山甲', '黄骠马', '宝雕弓', 'setup:flag(critmul,1.7)', 'setup:flag(anytarget)'),
 '诸葛亮': ('白羽扇', '八卦鹤氅', '四轮车', '七星灯', 'setup:buff(self,magout,8)', 'death:heal(aall,8)@once'),
 '庞统': ('凤鸣扇', '凤雏道袍', '落凤白驹', '耒阳案卷', 'setup:flag(连环比,0.2)', 'setup:buff(self,rate,5)'),
 '姜维': ('绿沉枪', '麒麟白甲', '天水骢', '兵法二十四篇', 'setup:flag(atk_kind,best)', 'setup:buff(self,int,8)@in:诸葛亮'),
 '法正': ('谋断笔', '蜀锦文袍', '定军青骓', '汉中舆图', 'setup:buff(self,ctrlhit,10)', 'buff(edefmax,dmgin,8)'),
 '曹操': ('倚天剑', '魏王衮甲', '绝影', '孟德新书', 'setup:buff(self,atkmult,20)', 'setup:buff(arole:文臣,rate,4)'),
 '张辽': ('破阵钩镰刀', '合肥铁甲', '北地烈风驹', '逍遥津令旗', 'atk:st(tgt,怯战,1,20)', 'buff(aall,agi,8,1)'),
 '典韦': ('八十斤双铁戟', '宛城铁铠', '乌骝', '短戟囊', 'setup:flag(double_attack); setup:buff(self,atkmult,-40)', 'hit:counter(100,0.5)@srctag:sub'),
 '许褚': ('裂石大刀', '虎痴皮甲', '渭水黄骠', '曳牛缰绳', 'atk:st(tgt,缴械,1,15)', 'setup:buff(self,ctrllen,-100)'),
 '夏侯惇': ('元让长枪', '铁面甲', '黑云驹', '啖睛之矢', 'setup:flag(counter_mul,1.5)', 'rend:cleanse(self)@hp<50'),
 '郭嘉': ('遗计扇', '素罗文袍', '辽东快马', '十胜十败书', 'setup:buff(self,magout,8)', 'buff(aall,rate,3)'),
 '荀彧': ('令君笔', '留香锦袍', '颍川青骢', '空食盒', 'setup:buff(self,healout,15)', 'death:heal(aall,10)@once'),
 '司马懿': ('鹰视剑', '隐忍布袍', '辽东追风', '巾帼', 'setup:flag(prep_guard,0.2)', 'setup:flag(immune_taunt)'),
 '贾诩': ('文和笔', '藏拙布衣', '凉州驽马', '抹书', 'setup:flag(计穷加,1)', 'setup:buff(self,ctrlhit,10)'),
 '邓艾': ('士载长枪', '阴平铁甲', '阴平山驹', '裹身毛毡', 'setup:flag(ignore,0.2)', 'rend:heal(self,3)@hidden'),
 '孙坚': ('古锭刀', '赤帻战袍', '乌云盖雪', '传国玉玺', 'setup:buff(self,pursueout,15)', ''),
 '孙策': ('霸王枪', '江东银甲', '神亭骏', '神亭短戟', 'setup:buff(self,atkmult,20)', 'setup:buff(self,atk,5)@in:太史慈; setup:buff(a:太史慈,atk,5)'),
 '孙权': ('白虹剑', '紫袍金甲', '跳津骏', '江东虎符', 'atk:dmg(tgt,0.3,mag)', 'buff(aside:吴,def,4)'),
 '周瑜': ('公瑾剑', '赤壁锦袍', '柴桑白马', '瑶琴', 'setup:buff(self,magout,8)', 'setup:flag(prep_unbreak)'),
 '陆逊': ('伯言剑', '白衣儒袍', '夷陵青骢', '连营火种', 'setup:buff(self,dmgin,-15,3)', 'setup:buff(self,dotout,25)'),
 '太史慈': ('铁胎弓', '神亭铁甲', '东莱骏', '神亭兜鍪', 'setup:buff(self,pursueout,15)', 'setup:buff(self,agi,5)@in:孙策; setup:buff(a:孙策,agi,5)'),
 '甘宁': ('兴霸大刀', '锦帆甲', '劫营黑驹', '铜铃', 'setup:buff(self,atkmult,50,1)', 'setup:buff(self,dodge,10,2)'),
 '吕蒙': ('子明长刀', '白衣商袍', '渡江青骓', '吴下书卷', 'setup:flag(prep_guard,0.2)', 'setup:buff(self,int,8)'),
 '吕布': ('方天画戟', '兽面吞头连环铠', '神驹赤兔', '三叉束发紫金冠', 'atk:dmg(other,0.4)', 'setup:buff(self,dmgin,-10)'),
 '董卓': ('西凉弯刀', '郿坞重铠', '西凉大宛马', '郿坞金印', 'setup:flag(吸血,0.35)', ''),
 '貂蝉': ('闭月团扇', '凤仪霓裳', '凤仪香车', '连环玉佩', 'setup:buff(self,ctrlhit,10)', 'buff(e:吕布,atk,-10,1); buff(e:董卓,atk,-10,1)'),
 '华佗': ('柳叶刀', '药囊布衣', '行医青驴', '青囊书', 'setup:buff(self,healout,15)', ''),
 '王允': ('司徒笔', '三公朝服', '司徒安车', '司徒印绶', 'setup:buff(self,magout,8)', 'buff(aside:汉,rate,4)'),
 '陈宫': ('公台剑', '布衣儒袍', '中牟快马', '中牟县令印', 'setup:buff(self,shieldout,20)', 'st(e:曹操,计穷,1)'),
 '袁绍': ('四世宝剑', '冀州金甲', '河北骏', '盟主帅旗', 'setup:buff(self,atkmult,20)', 'buff(aside:汉,def,4)'),
 '左慈': ('乌角拂尘', '八卦道袍', '云鹤', '遁甲天书', 'setup:buff(self,magout,8)', 'setup:flag(免死次数,2)'),
}
WEN = {'诸葛亮', '庞统', '法正', '郭嘉', '荀彧', '司马懿', '贾诩', '周瑜', '陆逊', '貂蝉', '华佗', '王允', '陈宫', '左慈', '刘备', '曹操', '孙权', '袁绍'}
for owner, (w, a, m, t, wd, td) in E.items():
    add(w, '武器', '神品', '专属', 'int' if owner in WEN else 'atk', owner, wd)
    add(a, '盔甲', '神品', '专属', 'def', owner)
    add(m, '马匹', '神品', '专属', 'agi', owner)
    add(t, '宝物', '神品', '专属', 'int' if owner in WEN else 'atk', owner, td)
# ---------- 四件效果：本人技能的替换行 ----------
SET4 = {
 '刘备': '指挥 | buff(aall,def,8); rend:heal(ahpmin,5); rend:heal(ahpmin2,5)',
 '关羽': '瞬发 40 | custom(关羽斩40)',
 '张飞': '瞬发 40 | dmg(eall,0.7); st(last,震慑,1,50)',
 '赵云': '追击 55 | custom(赵云七进七出4); rstart:custom(赵云追击率)',
 '马超': '兵种 | buff(self,agi,8); atk:dmg(other,0.8)@r<=5; rend:custom(马超后期)',
 '黄忠': '瞬发 45 | custom(黄忠老当益壮15)',
 '诸葛亮': '准备 45 | dmg(eall,0.7,mag); dot(last,灼烧,3,2)',
 '庞统': '瞬发 40 | custom(庞统连环4)',
 '姜维': '瞬发 40 | custom(姜维九伐20)',
 '法正': '指挥 | buff(aagimax,rate,25,3); buff(edefmax,def,-12,3)',
 '曹操': '指挥 | buff(aall,atk,6); buff(aall,int,6); rend:heal(self,3); allydeath:custom(曹操负人)',
 '张辽': '瞬发 35f | dmg(e5,1.2)@first; dmg(e3,1.2)@notfirst; st(last,怯战,1,40); setup:buff(self,agi,50,1)',
 '典韦': '被动 | setup:buff(self,def,10); sub(ahpmin,50,0.55)',
 '许褚': '瞬发 38 | custom(许褚裸衣15); hit:custom(许褚受击); rend:custom(许褚回合)',
 '夏侯惇': '被动 | hit:dmg(src,1.2); rend:buff(self,atk,12)@hp<50,once',
 '郭嘉': '指挥 | buff(eintmax,rate,-15); buff(aall,int,5); death:custom(郭嘉遗计2)',
 '荀彧': '瞬发 45 | st(e1,混乱,2); dmg(last,1.0,mag); heal(ahpmin,8)',
 '司马懿': '准备 40 | custom(司马懿鹰视100); myprep:custom(司马懿记账起); hit:custom(司马懿记账收)',
 '贾诩': '瞬发 40 | st(e1,计穷,2); st(last,迷惑,2); dmg(last,1.0,mag)',
 '邓艾': '指挥 | st(self,隐身,2); rstart:custom(邓艾阴平3)',
 '孙坚': '追击 50 | buff(self,crit,100,1)@hp>50; dmg(tgt,1.1)',
 '孙策': '瞬发 45 | dmg(e1,2.2); st(last,挑衅,1); hit:custom(孙策叠层8)',
 '孙权': '指挥 | buff(aall,def,8); buff(arole:文臣,int,6); rend:heal(aall,3)@every2',
 '周瑜': '准备 40 | dmg(eall,0.7,mag); dot(last,灼烧,3,2); setup:flag(no_prep)@in:诸葛亮',
 '陆逊': '瞬发 50 | custom(陆逊潜渊2)',
 '太史慈': '追击 70 | custom(太史慈神射)',
 '甘宁': '瞬发 35f | dmg(e5,1.2)@first; dmg(e3,1.2)@notfirst; dmg(last,0.4)@fastest; setup:buff(self,dodge,25,2)',
 '吕蒙': '准备 40 | dmg(ehpmax,2.8); st(last,缴械,2); myprep:st(self,隐身,1)',
 '吕布': '被动 | setup:flag(double_attack); setup:buff(self,dmgin,10); hit:custom(吕布围攻2)',
 '董卓': '被动 | dealt:custom(董卓吸血); rend:buff(self,def,12,1)@hp>60',
 '貂蝉': '瞬发 40 | st(eatk2,迷惑,2); dmg(last,1.0,mag)',
 '华佗': '瞬发 55 | heal(ahpmin,12); cleanse(last); allydeath:custom(华佗刮骨2)',
 '王允': '指挥 | custom(王允反目); rend:custom(王允互伤5)',
 '陈宫': '指挥 | shield(afront3,15); rend:custom(陈宫犄角)',
 '袁绍': '指挥 | buff(aall,atk,10); buff(aall,def,10); flag(no_active)',
 '左慈': '瞬发 35 | st(e4,混乱,1); dmg(last,0.6,mag); lethal:revive(1)@once; lethal:st(self,隐身,1)',
}
if __name__ == '__main__':
    import csv
    with open('../data/equip.tsv', 'w', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()), delimiter='\t'); w.writeheader(); w.writerows(rows)
    with open('../data/set4.tsv', 'w', encoding='utf-8') as f:
        w = csv.writer(f, delimiter='\t'); w.writerow(['名', 'DSL']); [w.writerow([k, v]) for k, v in SET4.items()]
    print('装备', len(rows), '套装', len(SET4))
