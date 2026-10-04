// 首批神武将：同一人物觉醒，不增加图鉴身份。
(function(){
'use strict';
const SG=globalThis.SG;
const DATA={
  "曹操": {
    "title": "玄极帝君",
    "faction": "魏",
    "primary": "def",
    "secondary": "int",
    "skillText": "玄极号令：开战时，己方全体将领的武力和智力提高8%，持续3回合。从第4回合开始，每隔2回合结束时，为己方兵力比例最低的2名将领各恢复其兵力上限5%的兵力。",
    "passiveText": "归心：己方首次有队友阵亡时，为其余存活队友各提供相当于其兵力上限8%的护盾。每场战斗触发一次。",
    "myth": "玄极印出，九州兵符汇于掌中；万军奉令，旌旗映照苍穹。"
  },
  "张辽": {
    "title": "破军天将",
    "faction": "魏",
    "primary": "atk",
    "secondary": "agi",
    "skillText": "天狼破阵：普通攻击后，有40%概率追击同一目标，造成张辽1.25倍兵刃伤害。若目标在追击前拥有护盾，本次伤害的30%可穿透护盾。",
    "passiveText": "八百锋：前2回合，张辽的速度提高15%。追击击败目标后，对敌方兵力比例最低的将领造成张辽0.5倍兵刃伤害。该连锁攻击每回合最多触发一次，且不能再次触发连锁。",
    "myth": "八百锋影化作天狼，破阵于未明之际；铁骑踏霜，长刀划开夜色。"
  },
  "司马懿": {
    "title": "玄冥星主",
    "faction": "魏",
    "primary": "int",
    "secondary": "def",
    "skillText": "星渊收局：主动技能，发动概率为40%。对敌方随机3名将领各造成司马懿0.8倍谋略伤害。从第5回合开始，伤害倍率提高至1.15倍。",
    "passiveText": "鹰视：每回合结束时，司马懿的智力提高3%，最多叠加5层。阵亡后清除全部层数；该效果不能被净化。",
    "myth": "星盘归于玄冥，残局尽落掌心；袖底星河流转，静观天地落子。"
  },
  "郭嘉": {
    "title": "霜命天师",
    "faction": "魏",
    "primary": "int",
    "secondary": "agi",
    "skillText": "天机雪断：主动技能，发动概率为45%。对敌方智力最高的将领造成郭嘉1.4倍谋略伤害，并有60%概率使该目标陷入计穷，持续1回合。",
    "passiveText": "遗策：郭嘉首次阵亡时，为己方智力最高的2名存活将领各解除一种控制状态，并使其下一次主动技能的发动概率提高15个百分点。成功发动后，该概率加成消失；复活不会重置遗策的触发次数。",
    "myth": "霜雪封住未至的战火，天机凝于羽扇；遗策随风，仍闻故人低语。"
  },
  "典韦": {
    "title": "镇狱武神",
    "faction": "魏",
    "primary": "def",
    "secondary": "atk",
    "skillText": "镇狱双戟：被动技能。己方兵力比例最低的将领受到单体兵刃或谋略攻击时，典韦有60%概率代其承受伤害，替受伤害降低25%。每回合最多替受2次。",
    "passiveText": "死战不退：典韦首次受到致命伤害时免于阵亡，保留相当于兵力上限15%的兵力，并停止本回合剩余的替受。每场战斗触发一次。",
    "myth": "双戟镇住营门，神躯如山；狱火绕刃，守护身后同袍。"
  },
  "刘备": {
    "title": "昭烈仁皇",
    "faction": "蜀",
    "primary": "def",
    "secondary": "int",
    "skillText": "仁皇济世：主动技能，发动概率为45%。为己方兵力比例最低的3名将领各恢复其兵力上限8%的兵力，并为其中兵力比例最低的将领解除一种控制状态。",
    "passiveText": "桃园誓：己方将领的兵力首次低于其兵力上限30%时，为该将领提供相当于其兵力上限10%的护盾。每场战斗最多触发2次，同一将领最多获得一次。",
    "myth": "昭烈之光起于万家灯火，仁皇不弃同袍；桃园誓言长照山河。"
  },
  "关羽": {
    "title": "青龙圣君",
    "faction": "蜀",
    "primary": "atk",
    "secondary": "def",
    "skillText": "青龙断岳：主动技能，发动概率为35%。对目标及其同一排的将领各造成关羽1.2倍兵刃伤害，最多命中3人。若主目标具有可净化的控制状态，再对其造成关羽0.35倍兵刃伤害。",
    "passiveText": "义绝：关羽每击败一名敌人，武力提高5%，最多叠加3层。阵亡后清除全部层数。",
    "myth": "青龙盘刃，誓言化为锋芒；长髯迎风，圣威贯日。"
  },
  "张飞": {
    "title": "雷霆战尊",
    "faction": "蜀",
    "primary": "atk",
    "secondary": "agi",
    "skillText": "雷震长坂：主动技能，发动概率为40%。对敌方随机3名将领各造成张飞0.9倍兵刃伤害，并有50%概率使本次命中的将领中速度最高的一人陷入震慑，持续1回合。",
    "passiveText": "横矛：前2回合，张飞首次被敌方主动技能命中后，对施术者发起反击，造成张飞0.6倍兵刃伤害。每回合最多触发一次；该反击不能再次触发神格。",
    "myth": "长坂雷声凝于蛇矛，喝声压阵；怒目所向，风雷震动山河。"
  },
  "赵云": {
    "title": "银龙武神",
    "faction": "蜀",
    "primary": "agi",
    "secondary": "atk",
    "skillText": "龙胆穿云：普通攻击后，有45%概率追击同一目标，造成赵云1.1倍兵刃伤害。若赵云没有控制状态，本次追击额外无视目标15%的统率。",
    "passiveText": "独骑：每回合首次行动前，赵云解除自身一种控制状态。若成功解除，本回合不能发动追击。",
    "myth": "银龙绕枪，孤骑穿云；霜甲映月，一身胆气照长空。"
  },
  "诸葛亮": {
    "title": "七曜天君",
    "faction": "蜀",
    "primary": "int",
    "secondary": "def",
    "skillText": "七曜归阵：主动技能，发动概率为55%，需要准备1回合。准备完成后，对敌方随机3名将领各造成诸葛亮1.25倍谋略伤害，并为己方兵力比例最低的2名将领各提供相当于其兵力上限5%的护盾。",
    "passiveText": "续灯：诸葛亮首次陷入计穷时，将该次计穷的持续时间缩短1回合，最少仍持续1回合。此后首次成功施放神技时，为己方兵力比例最低的将领恢复其兵力上限6%的兵力。",
    "myth": "七曜布阵，灯火续明；羽扇轻摇，星河铺满天幕。"
  },
  "孙权": {
    "title": "江海帝君",
    "faction": "吴",
    "primary": "def",
    "secondary": "agi",
    "skillText": "江海御令：开战时，己方全体将领的速度提高8%，持续3回合。第2、4、6回合结束时，为己方兵力比例最低的2名将领各提供相当于其兵力上限6%的护盾。",
    "passiveText": "制衡：己方首次有队友阵亡时，其余存活队友的武力和智力提高5%，持续2回合。每场战斗触发一次。",
    "myth": "江潮汇成帝印，舟阵随令而动；碧海千帆，尽归掌中。"
  },
  "孙策": {
    "title": "赤霄霸王",
    "faction": "吴",
    "primary": "atk",
    "secondary": "agi",
    "skillText": "赤霄突阵：普通攻击后，有40%概率追击同一目标，造成孙策1.35倍兵刃伤害。若目标兵力全满，本次追击的暴击概率提高20个百分点。",
    "passiveText": "霸锋：前2回合，孙策受到的兵刃伤害降低15%。",
    "myth": "赤霄烈焰化为霸王枪，锋芒直贯云天；江东战鼓随其奔腾。"
  },
  "周瑜": {
    "title": "焚天都督",
    "faction": "吴",
    "primary": "int",
    "secondary": "agi",
    "skillText": "朱雀焚江：主动技能，发动概率为45%。对敌方随机3名将领各造成周瑜0.7倍谋略伤害，并使其陷入灼烧，持续2回合。灼烧每回合造成周瑜0.25倍谋略伤害。",
    "passiveText": "烈焰共鸣：周瑜的灼烧命中已经灼烧的目标时，伤害提高15%。对同一目标每回合最多触发一次。灼烧不能叠加，重复施加时刷新持续时间。",
    "myth": "朱雀燃翼，江上火线连营；琴音引风，赤焰映照千帆。"
  },
  "陆逊": {
    "title": "燎原天策",
    "faction": "吴",
    "primary": "int",
    "secondary": "def",
    "skillText": "燎原天策：主动技能，发动概率为50%，需要准备1回合。准备完成后，对敌方随机3名将领各造成陆逊1.1倍谋略伤害。若目标已经灼烧，再对其造成陆逊0.35倍谋略伤害，随后移除该目标的灼烧状态。",
    "passiveText": "忍锋：陆逊开始准备神技时，获得相当于自身兵力上限8%的护盾。每回合最多触发一次，护盾不能累计。",
    "myth": "余烬藏策，静候连营之势；长剑出鞘，燎原之火照彻江岸。"
  },
  "甘宁": {
    "title": "沧浪锦帆",
    "faction": "吴",
    "primary": "agi",
    "secondary": "atk",
    "skillText": "百骑劫营：主动技能，发动概率为40%。对敌方后排兵力比例最低的将领造成甘宁1.6倍兵刃伤害，本次攻击无视目标15%的统率。若敌方后排没有存活将领，则从敌方全体中选择兵力比例最低的将领。",
    "passiveText": "锦帆疾：第1回合，甘宁的速度提高20%。首次击败敌人时，恢复自身兵力上限6%的兵力。恢复效果每场战斗触发一次。",
    "myth": "沧浪绕锦帆，百骑渡夜潮；铃声起处，神锋掠过江天。"
  },
  "吕布": {
    "title": "修罗天将",
    "faction": "汉",
    "primary": "atk",
    "secondary": "agi",
    "skillText": "修罗无双：主动技能，发动概率为40%。对敌方随机3名将领各造成吕布1.2倍兵刃伤害，随后吕布损失自身兵力上限5%的兵力。该兵力损失不能触发反击或击杀奖励。",
    "passiveText": "孤锋：若吕布是己方队伍中唯一的武将，其造成的兵刃伤害提高12%；否则提高4%。",
    "myth": "修罗戟开，孤锋震世；赤兔踏焰，战影横贯九霄。"
  },
  "貂蝉": {
    "title": "月魄天姬",
    "faction": "汉",
    "primary": "int",
    "secondary": "agi",
    "skillText": "月魄离间：主动技能，发动概率为40%。对敌方随机2名将领各造成貂蝉0.7倍谋略伤害，并有60%概率使本次命中的将领中武力最高的一人陷入混乱，持续1回合。",
    "passiveText": "闭月：前2回合，貂蝉受到的单体伤害降低15%。",
    "myth": "月魄照镜，流光映袖；清辉之下，花影随步而生。"
  },
  "华佗": {
    "title": "青囊药仙",
    "faction": "汉",
    "primary": "int",
    "secondary": "def",
    "skillText": "青囊回天：主动技能，发动概率为45%。为己方兵力比例最低的3名存活将领各恢复其兵力上限10%的兵力。华佗处于计穷状态时不能发动该技能。",
    "passiveText": "五禽生息：每3回合结束时，为己方全体存活将领各恢复其兵力上限3%的兵力。处于禁疗状态的将领不能获得恢复。",
    "myth": "青囊化百草，药仙护生；五禽环身，灵芝清露润泽众生。"
  },
  "张角": {
    "title": "太平天尊",
    "faction": "汉",
    "primary": "int",
    "secondary": "def",
    "skillText": "太平雷诏：主动技能，发动概率为50%，需要准备1回合。准备完成后，对敌方随机3名将领各造成张角1.15倍谋略伤害，并从本次命中的存活将领中随机选择一人，有50%概率使其陷入震慑，持续1回合。",
    "passiveText": "黄天：张角每次成功施放神技，智力提高4%，最多叠加3层。阵亡后清除全部层数。",
    "myth": "雷诏书于虚空，黄天立于群愿；符光万道，天鼓震鸣。"
  },
  "袁绍": {
    "title": "天枢盟主",
    "faction": "汉",
    "primary": "def",
    "secondary": "atk",
    "skillText": "四世盟旗：开战时，己方汉阵营将领的武力和智力提高8%，持续3回合。最多影响4名将领，按上阵位置顺序选择。",
    "passiveText": "河北之望：己方汉阵营将领首次击败敌人时，为己方兵力比例最低的将领恢复其兵力上限5%的兵力。每回合最多触发一次。",
    "myth": "盟旗映天枢，群雄在旗下结阵；四世荣光化作漫天星辉。"
  }
};

const alive=u=>u.team.filter(x=>x.alive());
const low=(L,n=1)=>L.filter(x=>x.alive()).sort((a,b)=>a.ratio()-b.ratio()||a.idx-b.idx).slice(0,n);
const top=(L,k,n=1)=>L.filter(x=>x.alive()).sort((a,b)=>b.stat(k)-a.stat(k)||a.idx-b.idx).slice(0,n);
const once=(u,k)=>{if(u.once.has(k))return false;u.once.add(k);return true;};
function cleanse(u){const k=SG.CTRL.find(k=>u.has(k));if(!k)return false;delete u.status[k];u.battle.say(`${u.name} 净化 ${k}`,{t:'st',u,s:'净化'});return true;}
function control(u,t,k,p){if(t.add_status(k,1,p,u))t.status[k]=Math.min(t.status[k],1+(SG.REND_FIX&&t.battle.inRend?1:0));}
function context(b,values,fn){const old=b.godContext;b.godContext={...old,...values};try{return fn();}finally{b.godContext=old;}}
function hit(b,u,t,m,kind='phys',ignore=0,tag='skill'){if(!t||!u.alive())return 0;return b.damage(u,t,m,kind,ignore,false,tag);}
function skill(n){
 const types={'曹操':['指挥',0],'孙权':['指挥',0],'袁绍':['指挥',0],'典韦':['被动',0],'张辽':['追击',.4],'赵云':['追击',.45],'孙策':['追击',.4],'诸葛亮':['主动·准备',.55],'陆逊':['主动·准备',.5],'张角':['主动·准备',.5]};
 const rates={'司马懿':.4,'郭嘉':.45,'刘备':.45,'关羽':.35,'张飞':.4,'周瑜':.45,'甘宁':.4,'吕布':.4,'貂蝉':.4,'华佗':.45};
 const [type,rate]=types[n]||['主动·瞬发',rates[n]];
 const sk={name:DATA[n].skillText.split('：')[0],dname:DATA[n].skillText.split('：')[0],type,rate,hooks:{},god:true};
 const H=sk.hooks;
 const h=(event,fn)=>H[event]=fn;
 const shield=(u,L,p)=>L.forEach(t=>u.battle.shieldUp(t,p,u));
 const heal=(u,L,p)=>L.forEach(t=>u.battle.heal(u,t,p));
 const stacks=(u,k,p,max)=>{const v=Math.min(max,(u.flags[k]||0)+1);u.flags[k]=v;u.addbuff(k==='godGuan'?'atk':'int',v*p,-1,'perm'+k);};
 sk.fn=(b,u,target)=>context(b,{active:type.startsWith('主动'),aoe:['司马懿','关羽','张飞','诸葛亮','周瑜','陆逊','吕布','貂蝉','张角'].includes(n),chain:false},()=>{
  let E=b.targetable(u),A=b.allies(u),T=b.pick(u,'random',3);
  if(n==='曹操')A.forEach(t=>{t.addbuff('atk',.08,3);t.addbuff('int',.08,3);});
  if(n==='孙权')A.forEach(t=>t.addbuff('agi',.08,3));
  if(n==='袁绍')A.filter(t=>t.faction==='汉').sort((a,b)=>a.idx-b.idx).slice(0,4).forEach(t=>{t.addbuff('atk',.08,3);t.addbuff('int',.08,3);});
  if(n==='司马懿')T.forEach(t=>hit(b,u,t,b.round>=5?1.15:.8,'mag'));
  if(n==='郭嘉'){const t=top(E,'int')[0];if(t){hit(b,u,t,1.4,'mag');if(t.alive())control(u,t,'计穷',.6);}}
  if(n==='刘备'){T=low(A,3);heal(u,T,.08);if(T[0])cleanse(T[0]);}
  if(n==='关羽'){const t=target||b.attack_target(u);if(t){const extra=SG.CTRL.some(k=>t.has(k));E.filter(x=>Math.floor(x.idx/3)===Math.floor(t.idx/3)).slice(0,3).forEach(x=>hit(b,u,x,1.2));if(extra&&t.alive())hit(b,u,t,.35);}}
  if(n==='张飞'){T.forEach(t=>hit(b,u,t,.9));const t=top(T,'agi')[0];if(t)control(u,t,'震慑',.5);}
  if(n==='诸葛亮'){T.forEach(t=>hit(b,u,t,1.25,'mag'));shield(u,low(A,2),.05);if(u.flags.godLamp){heal(u,low(A),.06);delete u.flags.godLamp;}}
  if(n==='张辽'&&target){context(b,{shieldPierce:target.shield>0?.3:0},()=>hit(b,u,target,1.25,'phys',0,'pursue'));if(!target.alive()&&once(u,'godLiaoChain'+b.round)){const t=low(b.enemies(u))[0];context(b,{chain:true},()=>hit(b,u,t,.5,'phys',0,'神连锁'));}}
  if(n==='赵云'&&target&&u.flags.godZhaoClean!==b.round)hit(b,u,target,1.1,'phys',SG.CTRL.some(k=>u.has(k))?0:.15,'pursue');
  if(n==='孙策'&&target){const c=u.flags.crit||0;if(target.hp===target.maxhp)u.flags.crit=c+.2;try{hit(b,u,target,1.35,'phys',0,'pursue');}finally{u.flags.crit=c;}}
  if(n==='周瑜')T.forEach(t=>{const burning=t.has('灼烧');let m=.7;if(burning&&once(u,'godZhou'+b.round+':'+t.idx))m*=1.15;hit(b,u,t,m,'mag');if(t.alive()&&t.add_status('灼烧',2,1,u)){t.flags['灼烧_src']=[u,0];t.flags.godBurn=u;}});
  if(n==='陆逊')T.forEach(t=>{const burn=t.has('灼烧');hit(b,u,t,1.1,'mag');if(burn){hit(b,u,t,.35,'mag');delete t.status['灼烧'];delete t.flags['灼烧_src'];delete t.flags.godBurn;}});
  if(n==='甘宁'){const rear=E.filter(t=>t.idx>=6);hit(b,u,low(rear.length?rear:E)[0],1.6,'phys',.15);}
  if(n==='吕布'){T.forEach(t=>hit(b,u,t,1.2));u.hp=Math.max(0,u.hp-u.maxhp*.05);if(!u.alive())b.selfDeath(u);}
  if(n==='貂蝉'){T=b.pick(u,'random',2);T.forEach(t=>hit(b,u,t,.7,'mag'));const t=top(T,'atk')[0];if(t)control(u,t,'混乱',.6);}
  if(n==='华佗')heal(u,low(A,3),.10);
  if(n==='张角'){T.forEach(t=>hit(b,u,t,1.15,'mag'));const L=T.filter(t=>t.alive());if(L.length)control(u,SG.R.choice(L),'震慑',.5);stacks(u,'godJiao',.04,3);}
 });
 sk.setup=(b,u)=>{if(n==='张辽')u.addbuff('agi',.15,2);if(n==='甘宁')u.addbuff('agi',.20,1);};
 if(n==='曹操'){
  h('round_end_unit',u=>{if(u.battle.round>=4&&u.battle.round%2===0)heal(u,low(alive(u),2),.05);});
  h('on_ally_death',u=>{if(once(u,'godCao'))shield(u,alive(u),.08);});
 }
 if(n==='孙权'){
  h('round_end_unit',u=>{if([2,4,6].includes(u.battle.round))shield(u,low(alive(u),2),.06);});
  h('on_ally_death',u=>{if(once(u,'godQuan'))alive(u).forEach(t=>{t.addbuff('atk',.05,2);t.addbuff('int',.05,2);});});
 }
 if(n==='司马懿')h('round_end_unit',u=>stacks(u,'godSima',.03,5));
 if(n==='郭嘉')h('on_death',u=>{if(once(u,'godGuo'))top(alive(u),'int',2).forEach(t=>{cleanse(t);t.flags.godNextRate=.15;});});
 if(n==='典韦'){
  h('substitute',(u,t,src,kind,tag)=>{const b=u.battle;if(t.side!==u.side||t===u||t.flags._subbing||!src||!['phys','mag'].includes(kind)||['灼烧','中毒','神灼烧'].includes(tag)||b.godContext?.aoe||b.godContext?.chain||u.flags.godDianStop===b.round||t!==low(alive(u))[0])return;const k='godDianSub'+b.round;if((u.flags[k]||0)>=2||SG.R.random()>=.6)return;u.flags[k]=(u.flags[k]||0)+1;u.flags.sub_mul=.75;return u;});
  h('on_lethal',u=>{if(!once(u,'godDianLife'))return;u.hp=u.maxhp*.15;u.flags.godDianStop=u.battle.round;return true;});
 }
 if(n==='刘备')h('on_damage_any',(u,t)=>{if(t.side!==u.side||!t.alive()||t.ratio()>=.3||(u.flags.godLiuCount||0)>=2||!once(u,'godLiu'+t.idx))return;u.flags.godLiuCount=(u.flags.godLiuCount||0)+1;shield(u,[t],.10);});
 if(n==='关羽')h('on_kill',u=>stacks(u,'godGuan',.05,3));
 if(n==='张飞')h('on_hit_taken',(u,src,dmg,kind,tag)=>{const b=u.battle;if(src&&src.side!==u.side&&dmg>0&&b.round<=2&&b.godContext?.active&&!b.godContext?.chain&&once(u,'godFei'+b.round))context(b,{chain:true,active:false,aoe:false},()=>hit(b,u,src,.6,'phys',0,'反击'));});
 if(n==='赵云')h('before_action',(u,t)=>{if(t===u&&once(u,'godZhao'+u.battle.round)&&cleanse(u))u.flags.godZhaoClean=u.battle.round;});
 if(n==='诸葛亮')h('status_added',(u,t,k)=>{if(t===u&&k==='计穷'&&once(u,'godLamp')){u.status[k]=Math.max(1,u.status[k]-1);u.flags.godLamp=true;}});
 if(n==='陆逊')h('on_prepare',(u,t)=>{if(t===u&&once(u,'godLu'+u.battle.round))shield(u,[u],.08);});
 if(n==='甘宁')h('on_kill',u=>{if(once(u,'godGan'))heal(u,[u],.06);});
 if(n==='孙策'||n==='貂蝉')h('mod_in',(u,src,kind)=>{if(u.battle.round<=2&&(n==='孙策'?kind==='phys':!u.battle.godContext?.aoe))return .85;});
 if(n==='吕布')h('mod_out',(u,t,kind)=>kind==='phys'?1+(u.team.filter(x=>x.role==='武将').length===1?.12:.04):1);
 if(n==='华佗')h('round_end_unit',u=>{if(u.battle.round%3===0)heal(u,alive(u),.03);});
 if(n==='袁绍')h('kill_any',(u,src)=>{if(src&&src.side===u.side&&src.faction==='汉'&&once(u,'godYuan'+u.battle.round))heal(u,low(alive(u)),.05);});
 if(['司马懿','关羽','张角'].includes(n))h('on_death',u=>{const k={'司马懿':'godSima','关羽':'godGuan','张角':'godJiao'}[n];delete u.flags[k];u.buffs=u.buffs.filter(x=>x[3]!=='perm'+k);});
 return sk;
}
function apply(u){const m=DATA[u.name];if(!m)throw Error('此人物尚无神形态');u.form='god';u.label='神·'+u.name;u.base[m.primary]*=1.08;u.base[m.secondary]*=1.04;u.skill=skill(u.name);return u;}
function check(g,names){return names.filter(n=>n&&g.hero(n)?.form==='god').length<=1;}
function godState(g){const s=g.s.gods||(g.s.gods={heroes:{},trials:{}});s.heroes=s.heroes||{};s.trials=s.trials||{};return s;}
function progress(g,n){if(!DATA[n])throw Error('此人物尚无神形态');const s=godState(g);return s.heroes[n]||(s.heroes[n]={qualified:false,awakened:false});}
function dayKey(date=new Date()){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');}
function weekKey(date=new Date()){const d=new Date(date.getFullYear(),date.getMonth(),date.getDate());d.setDate(d.getDate()-(d.getDay()+6)%7);return dayKey(d);}
SG.God={DATA,apply,skill,cleanse,check,progress,dayKey,weekKey,context,
 portrait:(n,g,form)=>((form??g?.hero(n)?.form)==='god'?'神·':'')+n,
 tickBurn(b,t){const u=t.flags.godBurn;context(b,{aoe:true,chain:true,active:false},()=>b.damage(u,t,.25,'mag',0,true,'神灼烧'));}
};
const P=SG.Game.prototype;
P.godProgress=function(n){return progress(this,n);};
P.awaken=function(n){const h=this.hero(n),p=progress(this,n);if(this.kind==='conquest'||this.s.cycle<2)return {err:'二周目闯关开放觉醒'};if(p.awakened)return {err:'已觉醒'};if(!h||h.lv<70||h.star<5||!p.qualified)return {err:'需要70级、5星并通关所属封神试炼'};if(this.s.gold<1000000)return {err:'需要100万金币'};this.s.gold-=1000000;p.awakened=true;return {ok:true};};
P.setGodForm=function(n,form){const h=this.hero(n);if(!h||!DATA[n]||!['normal','god'].includes(form))return {err:'形态无效'};if(form==='god'&&!progress(this,n).awakened)return {err:'尚未觉醒'};if(form==='god'){
 const formations=[this.s.formation,this.s.pvp?.cells].filter(Boolean);if(formations.some(F=>F.includes(n)&&F.some(x=>x!==n&&this.hero(x)?.form==='god')))return {err:'每队最多上阵一位神将，请先调整阵容'};
 }h.form=form;return {ok:true};};
P.godTrial=function(n,cells,opt={}){
 if(this.kind==='conquest'||this.s.cycle<2)return {err:'二周目闯关开放封神试炼'};
 const h=this.hero(n);if(!DATA[n]||!h||h.lv<70||h.star<5)return {err:'试炼对象须达到70级、5星'};
 if(!Array.isArray(cells)||cells.length!==9)return {err:'阵容须为九宫站位'};
 const names=cells.filter(Boolean);if(!names.includes(n)||new Set(names).size!==names.length||names.some(x=>!this.hero(x)))return {err:'试炼须带上该将，且不可重复上阵'};
 if(!check(this,names))return {err:'每队最多上阵一位神将'};
 if(names.some(x=>this.hero(x).hp<1))return {err:'有人没兵了，先征兵'};
 const faction=DATA[n].faction,foes=Object.keys(DATA).filter(x=>DATA[x].faction===faction);
 const A=names.map(x=>this.unitOf(x,true)),B=foes.map(x=>SG.mkHeroUnit(x,75,5,[],null,x===n?'god':'normal'));
 SG.setBattleSeed(opt.seed??Math.floor(Math.random()*2**31));const b=new SG.Battle(A,B,!opt.quick);A.forEach((u,i)=>u.idx=cells.indexOf(names[i]));
 const [w,rounds]=b.run(30);const p=progress(this,n),already=p.qualified;
 if(w===0)p.qualified=true;
 return {res:{win:w===0,rounds,battles:[b]},rew:{},title:'封神试炼 · '+n,winTxt:w===0?'试炼通过':'试炼未过',note:w===0?(already?'已取得觉醒资格，可前往武将详情页觉醒。':'已取得觉醒资格，可消耗100万金币觉醒。'):'试炼失败，不扣金币或兵力。',back:'gods',backTxt:'回封神试炼'};
};
})();
