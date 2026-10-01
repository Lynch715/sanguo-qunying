// 三国群英录 · 数据、关卡战斗、养成与经济、存档（闯关模式）。不碰 DOM。
// 规则出处：设计_经济规范 v0.2、设计_关卡阵容规范 v0.2、sim/playthrough.py（CFG、MOBS、apply_limit、fight）
(function (G) {
'use strict';
const SG = G.SG;
const { first, argmax, sortBy, pyRound } = SG.util;

const TIER_ORDER = ['校', '骁', '名', '虎', '无双'];
const EQ_TIERS = ['凡品', '良品', '精品', '珍品', '神品'];
const SLOTS = ['武器', '盔甲', '马匹', '宝物'];
SG.TIER_ORDER = TIER_ORDER; SG.EQ_TIERS = EQ_TIERS; SG.SLOTS = SLOTS;

// ---------------- 杂兵（playthrough.py 的 MOBS/MOBG） ----------------
const MOBS = {
  '黄巾兵': [48, 40, 18, 50], '汉军郡兵': [46, 44, 20, 46], '西凉兵': [52, 40, 16, 52], '并州骑': [50, 38, 15, 58], '袁军步卒': [48, 44, 18, 46], '荆州水军': [46, 40, 20, 54],
  '魏卒·刀盾': [48, 46, 18, 46], '魏卒·弓手': [50, 36, 20, 54], '虎豹骑': [54, 44, 16, 58], '蜀卒·长枪': [50, 44, 18, 48], '蜀卒·弩手': [48, 38, 20, 54], '吴卒·环刀': [50, 40, 18, 50], '吴卒·水军': [46, 40, 20, 56],
  '南蛮兵': [52, 38, 14, 50], '藤甲兵': [46, 52, 12, 38], '羌胡骑': [52, 40, 14, 56],
};
const MOBG = [1.1, 0.9, 0.3, 0.8];
// 杂兵的阵营（二周目换名将用）
const MOB_FAC = { '黄巾兵': '无', '汉军郡兵': '汉', '西凉兵': '汉', '并州骑': '汉', '袁军步卒': '汉', '荆州水军': '汉', '魏卒·刀盾': '魏', '魏卒·弓手': '魏', '虎豹骑': '魏', '蜀卒·长枪': '蜀', '蜀卒·弩手': '蜀', '吴卒·环刀': '吴', '吴卒·水军': '吴', '南蛮兵': '无', '藤甲兵': '无', '羌胡骑': '汉' };
const MOB_FILE = { '黄巾兵': 'mob_huangjin', '汉军郡兵': 'mob_hanjun', '西凉兵': 'mob_xiliang', '并州骑': 'mob_bingzhou', '袁军步卒': 'mob_yuanjun', '荆州水军': 'mob_jingzhou', '魏卒·刀盾': 'mob_wei_daodun', '魏卒·弓手': 'mob_wei_gongshou', '虎豹骑': 'mob_hubaoqi', '蜀卒·长枪': 'mob_shu_changqiang', '蜀卒·弩手': 'mob_shu_nushou', '吴卒·环刀': 'mob_wu_huandao', '吴卒·水军': 'mob_wu_shuijun', '南蛮兵': 'mob_nanman', '藤甲兵': 'mob_tengjia', '羌胡骑': 'mob_qianghu' };
SG.MOBS = MOBS; SG.MOBG = MOBG; SG.MOB_FAC = MOB_FAC; SG.MOB_FILE = MOB_FILE;

// ---------------- 经济常数（playthrough.py 的 CFG + 设计_经济规范） ----------------
const CFG = {
  gold_clear: lv => 200 + 40 * lv,
  gold_replay: lv => 40 + 10 * lv,
  train_cost: lv => 20 + lv * lv,   // V0.6：原 20+5×等级，涨幅太小
  draw: 300, draw10: 2700,
  pool: { '校': .40, '骁': .30, '名': .20, '虎': .08, '无双': .02 },
  frag_per_dup: 3,
  boss_mult: 3, hidden_mult: 5,
  token_price: 500, token_step: 25, token_cap: 1000,
  star_need: [0, 5, 10, 15, 20], star_q: { '校': .5, '骁': .6, '名': .8, '虎': 1.0, '无双': 2.0 },
  smith: 400, smith10: 3600, smith_pool: { '凡品': .35, '良品': .30, '精品': .20, '珍品': .10, '神品': .04, '专属': .01 },
  sell: { '凡品': 20, '良品': 60, '精品': 150, '珍品': 400, '神品': 1000 },
  recruit_per_k: 2, recruit_per_k_conquest: 2,   // V0.6：闯关征兵 4 → 2
  regen_after_stage: .30,   // V0.6：赢了全员回三成（原两成）；输了不回
  replay_per_day: Infinity,   // V0.6：复刷不限次数
  gold2_clear: { '章末': 1, '隐藏': 3, '支线': 1 },
  gold2_draw: 2,
  start_gold: 1000,
  foe_mul: (ch, typ) => (1.0 + 0.01 * (ch - 1)) * (typ === '章末' ? 1.10 : 1.0) * (typ === '隐藏' ? 1.1 : 1.0),
  drop_tier: ch => Math.min(4, ch <= 25 ? Math.floor((ch - 1) / 5) : 4),
  replay_drop: .20, boss_excl: .03, hidden_excl: .10, side_excl: .03,
  tx_reroll: 10,
  src_excl: .03, src_token: 20,   // V0.6 专属出处关：复刷 3%，不掉给信物，20 枚换一件
  gold_hero: { '袁术': .10, '糜竺': .15, '刘巴': .20, '吕范': .10, '毛玠': .08, '杨松': .06, '黄皓': .08 },   // V0.6：技能文案里写的「上阵的仗赢了金币 +x%」，原来没生效   // V0.6 专属出处关：复刷 3%，不掉给信物，20 枚换一件
};
SG.CFG = CFG;

// ---------------- 初始化数据 ----------------
function init(DATA) {
  const D = SG.D = {};
  D.H = {}; DATA.heroes.forEach(h => D.H[h['名']] = h);
  D.HLIST = DATA.heroes.map(h => h['名']);
  D.SKROW = {}; DATA.skills.forEach(r => D.SKROW[r['名']] = r);
  const [SK, errs] = SG.loadSkills(DATA.skills); D.SK = SK; D.skillErrs = errs;
  D.SET4 = SG.loadSet4(DATA.set4, D.SKROW);
  D.SET4ROW = {}; DATA.set4.forEach(r => D.SET4ROW[r['名']] = r);
  D.EQROWS = DATA.equip;
  D.EQID = {}; DATA.equip.forEach(e => D.EQID[e.id] = e);
  D.EQ = {}; DATA.equip.forEach(e => D.EQ[e['名']] = e);   // 按名（python 口径，重名时后者覆盖）
  D.STAGES = DATA.stages;
  D.STAGE = {}; DATA.stages.forEach((s, i) => { s._i = i; D.STAGE[s.id] = s; });
  D.CITIES = DATA.cities || [];
  D.POOL = {}; TIER_ORDER.forEach(t => D.POOL[t] = D.HLIST.filter(n => D.H[n]['品阶'] === t));
  D.EXCL = {}; DATA.equip.forEach(e => { if (e['归属']) (D.EXCL[e['归属']] = D.EXCL[e['归属']] || []).push(e); });
  // V0.6 专属出处关：关 id → [无双]，无双 → [关 id, 关 id]
  D.EXSRC = {}; D.EXSRC_OF = {};
  (DATA.exsrc || []).forEach(r => { const L = [r['关一'], r['关二']]; D.EXSRC_OF[r['名']] = L; L.forEach(id => (D.EXSRC[id] = D.EXSRC[id] || []).push(r['名'])); });
  D.CHAPTERS = [];
  for (const s of DATA.stages) {
    const c = +s['章'];
    if (!D.CHAPTERS[c]) D.CHAPTERS[c] = { ch: c, name: s['章名'], stages: [] };
    D.CHAPTERS[c].stages.push(s);
  }
  D.STORY = DATA.story || {};
  D.BONDS = DATA.bonds || []; SG.setBonds(D.BONDS);
  D.BONDOF = {}; SG.BONDS.forEach(b => b.mem.forEach(m => (D.BONDOF[m] = D.BONDOF[m] || []).push(b)));
  D.PORTRAIT = DATA.portraits || {};
  return D;
}
SG.init = init;

// ---------------- 造人 ----------------
function unitPower(u) {
  const ti = Math.max(0, SG.TIER_ORDER.indexOf(u.tier));
  return (u.stat('atk') + u.stat('def') + u.stat('int') + u.stat('agi')) * (1 + .15 * ti) * (u.maxhp / 1000) / 10 * (0.5 + 0.5 * Math.max(0, u.hp) / u.maxhp);
}
SG.unitPower = unitPower;
function mkHeroUnit(name, lv, star, gearIds, hp) {
  const D = SG.D;
  const u = new SG.Unit(D.H[name], lv, star); u.skill = D.SK[name] || null;
  if (gearIds && gearIds.length) wearIds(u, gearIds);
  if (hp != null) u.hp = Math.min(u.maxhp, Math.max(0, hp));
  return u;
}
// 按 id 穿（游戏里用；装备名有重复，按 id 才准）
function wearIds(u, ids) {
  const D = SG.D;
  const rows = ids.map(i => D.EQID[i]).filter(Boolean);
  const EQtmp = {}; rows.forEach((e, k) => EQtmp['#' + k] = e);
  SG.wear(u, rows.map((e, k) => '#' + k), EQtmp, D.SET4);
}
function mobRow(name) {
  const [a, d, i, g] = MOBS[name], [ga, gd, gi, gg] = MOBG;
  return { '名': name, '阵营': '无', '定位': '武将', '品阶': '卒', '武力': a, '统率': d, '智力': i, '速度': g, '武成长': ga, '统成长': gd, '智成长': gi, '速成长': gg };
}
function mkEnemy(name, lv, star, ease) {
  const D = SG.D; let u;
  if (D.H[name]) { u = new SG.Unit(D.H[name], lv, star); u.skill = D.SK[name] || null; }
  else u = new SG.Unit(mobRow(name), lv, star);
  for (const k in u.base) u.base[k] *= ease;
  return u;
}
SG.mkHeroUnit = mkHeroUnit; SG.mkEnemy = mkEnemy; SG.mobRow = mobRow;

// ---------------- 关卡 ----------------
function strHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const CN_NUM = { '一': 1, '两': 2, '二': 2, '三': 3, '四': 4, '五': 5 };
function stageLimit(stage) {
  const lim = stage['限制'] || '';
  const m = /只能带(\S)人/.exec(lim);
  let max = 9;
  if (m) max = CN_NUM[m[1]];
  if (lim.includes('一对一')) max = 1;
  const sv = /撑过(\S)回合即胜/.exec(lim);
  return { text: lim, max, survive: sv ? CN_NUM[sv[1]] : 0, wheel: lim.includes('车轮战'), bridge: lim.includes('桥窄'), noAttack: lim.includes('我方不能攻击'), duel: lim.includes('一对一') };
}
// 引擎实现了的限制，界面上照原文显示；没实现的（sim 里也没做）归到剧情说明
const LIMIT_IMPL = [/只能带\S人/, /一对一/, /撑过\S回合即胜/, /车轮战/, /桥窄/, /我方不能攻击/, /兵力\d+%/, /敌方前(三|两)回合/, /敌方三回合不攻击/, /反目/, /灼烧伤害翻倍/, /回场/];
function limitParts(stage) {
  const parts = (stage['限制'] || '').split('；').map(x => x.trim()).filter(Boolean);
  return { rules: parts.filter(p => LIMIT_IMPL.some(r => r.test(p))), flavor: parts.filter(p => !LIMIT_IMPL.some(r => r.test(p))) };
}
SG.stageLimit = stageLimit; SG.limitParts = limitParts;

// 周目换算：等级平移到 30–60，星级 +1，杂兵换同阵营名档（按关卡 id 哈希定死），隐藏关不换
function stageFoes(stage, cycle = 1, tx = null) {
  const D = SG.D;
  let names = stage['敌方'].split('、').filter(x => x);
  let lv = +stage['等级'], star = +stage['星级'];
  if (cycle >= 2) {
    lv = Math.min(70, Math.round(30 + (lv - 1) * 30 / 52) + (cycle - 2) * 10);
    star = Math.min(5, star + 1);
    if (stage['类型'] !== '隐藏') {
      const used = new Set(names);
      names = names.map((n, i) => {
        if (D.H[n]) return n;
        const fac = MOB_FAC[n] || '汉';
        const pool = D.HLIST.filter(x => D.H[x]['品阶'] === '名' && D.H[x]['阵营'] === fac && !used.has(x));
        if (!pool.length) return n;
        const pick = pool[strHash(stage.id + ':' + i) % pool.length]; used.add(pick); return pick;
      });
    }
  }
  if (tx && tx.includes('天狼')) names = txMob(stage, names);
  return { names, lv, star };
}
SG.stageFoes = stageFoes;

function apply_limit(stage, A, B) {
  const lim = stage['限制'] || '';
  const m = /(\S+)兵力(\d+)%/.exec(lim);
  if (m) for (const e of B) if (e.name === m[1]) { e.maxhp *= parseInt(m[2]) / 100; e.hp = e.maxhp; }
  if (lim.includes('我方不能攻击')) for (const a of A) { a.status['缴械'] = 3; a.status['计穷'] = 3; }
  if (lim.includes('敌方前三回合怯战')) for (const e of B) e.status['怯战'] = 3;
  if (lim.includes('桥窄')) for (const e of B) e.flags['桥窄'] = true;
  if (lim.includes('敌方前两回合不能攻击')) for (const e of B) { e.status['缴械'] = 2; e.status['计穷'] = 2; }
  if (lim.includes('敌方三回合不攻击')) for (const e of B) { e.status['缴械'] = 3; e.status['计穷'] = 3; }
  // V0.2：原来只当剧情字的几条落地（sim/playthrough.py 同步）
  if (lim.includes('反目')) for (const e of B) if (e.name === '吕布' || e.name === '董卓') e.extras.push(SG.build(SG.parse_line('被动 | rend:custom(反目自伤)'), '反目'));
  if (lim.includes('我方灼烧伤害翻倍')) for (const a of A) a.flags['dotout'] = (a.flags['dotout'] || 0) + 1;
  if (lim.includes('我方首位开场兵力50%且中毒3回合') && A.length) { const a = A[0]; a.hp = Math.min(a.hp, a.maxhp * .5); a.status['中毒'] = 3; a.flags['中毒_src'] = [null, .03]; }
  if (lim.includes('孟获回场七次')) for (const e of B) if (e.name === '孟获') e.extras.push(SG.build(SG.parse_line('被动 | lethal:custom(七擒回场)'), '七擒'));
}

// ---------------- 天象（V0.3，二周目起） ----------------
// 每颗一好一坏。A 我方单位，B 敌方单位，b 这一阵的 Battle。百分比加成走 perm buff，跟技能、羁绊同一个 25% 封顶。
const addf = (u, k, v) => { u.flags[k] = (u.flags[k] || 0) + v; };
const TX = [
  { id: '岁星', good: '金币收入 ×1.5', bad: '兵符价格 ×1.5' },
  { id: '荧惑', good: '我方武力 +10%', bad: '敌方兵力 +8%', g: { A: u => u.addbuff('atk', .10, -1, 'perm天象') }, b: { B: u => { u.maxhp *= 1.08; u.hp *= 1.08; } } },
  { id: '太白', good: '我方兵刃伤害 +12%', bad: '我方受到的兵刃伤害 +8%', g: { A: u => addf(u, 'physout', .12) }, b: { A: u => addf(u, 'physin', .08) } },
  { id: '辰星', good: '我方谋略伤害 +12%', bad: '我方受到的谋略伤害 +8%', g: { A: u => addf(u, 'magout', .12) }, b: { A: u => addf(u, 'magin', .08) } },
  { id: '镇星', good: '我方统率 +12%', bad: '我方速度 −10%', g: { A: u => u.addbuff('def', .12, -1, 'perm天象') }, b: { A: u => u.addbuff('agi', -.10, -1, 'perm天象g') } },
  { id: '天狼', good: '首通黄金 +1', bad: '敌方每关多一个杂兵；加不进人的关（满九人、单挑、车轮战）敌方兵力 +10%' },
  { id: '贪狼', good: '装备掉落翻倍（首通两件，复刷四成）', bad: '掉落品阶降一档' },
  { id: '破军', good: '我方全属性 +6%', bad: '羁绊全部失效', g: { A: u => { for (const k of ['atk', 'def', 'int', 'agi']) u.addbuff(k, .06, -1, 'perm天象' + k); } }, b: { battle: bt => { bt.nobond = [true, false]; } } },
  { id: '七杀', good: '我方追击率 +10%', bad: '敌方追击率 +10%', g: { A: u => addf(u, 'pursue', .10) }, b: { B: u => addf(u, 'pursue', .10) } },
  { id: '文曲', good: '我方主动技发动率 +5%', bad: '我方普攻伤害 −5%', g: { A: u => addf(u, 'rate', .05) }, b: { A: u => addf(u, 'atkmult', -.05) } },
  { id: '武曲', good: '我方前排受到的伤害 −20%', bad: '我方后排受到的伤害 +20%', g: { battle: bt => { for (const u of bt.teams[0]) if (u.front()) u.addbuff('dmgin', -.20, -1, 'perm武曲'); } }, b: { battle: bt => { for (const u of bt.teams[0]) if (!u.front()) u.addbuff('dmgin', .20, -1, 'perm武曲'); } } },
  { id: '紫微', good: '每回合末我方全体回兵 2%', bad: '华佗不在麾下时，我方开场兵力 −8%', g: { battle: bt => { bt.regen = [.02, 0]; } }, b: { A0: (A, opt) => { if (!opt.huatuo) for (const u of A) u.hp *= .92; } } },
];
const TXID = {}; TX.forEach(t => TXID[t.id] = t);
SG.TX = TX; SG.TXID = TXID;
// opt.tx：天象 id 列表；opt.huatuo：华佗在不在麾下；opt.txHalf：{id: 'g'|'b'} 只开一半（验收用）
function txParts(opt) {
  const out = [];
  for (const id of opt.tx || []) {
    const t = TXID[id]; if (!t) continue;
    const h = (opt.txHalf || {})[id];
    if (t.g && h !== 'b') out.push(t.g);
    if (t.b && h !== 'g') out.push(t.b);
  }
  return out;
}
function txPlayer(A, opt) { for (const p of txParts(opt)) { if (p.A) A.forEach(p.A); if (p.A0) p.A0(A, opt); } }
function txFoe(B, bt, opt) { for (const p of txParts(opt)) { if (p.B) B.forEach(p.B); if (p.battle) p.battle(bt); } if (opt._tlHp) for (const u of B) { u.maxhp *= 1.10; u.hp *= 1.10; } }
// 天狼：加不进杂兵的关改成敌方兵力 +10%
function tlFull(stage, cycle, opt) { return (opt.tx || []).includes('天狼') && (opt.txHalf || {})['天狼'] !== 'g' && txMob(stage, stageFoes(stage, cycle).names).length === stageFoes(stage, cycle).names.length; }
// 敌方重名的加甲乙丙（只改显示用的 label，引擎认 name）
const GAN = '甲乙丙丁戊己庚辛壬癸';
function labelDup(B) {
  const cnt = {}; B.forEach(u => cnt[u.name] = (cnt[u.name] || 0) + 1);
  const k = {}; B.forEach(u => { if (cnt[u.name] > 1) { const i = k[u.name] = (k[u.name] || 0) + 1; u.label = u.name + GAN[i - 1]; } });
  return B;
}
SG.labelDup = labelDup;
function txMob(stage, names) {
  const lim = stage['限制'] || '';
  if (names.length >= 9 || lim.includes('一对一') || lim.includes('车轮战')) return names;
  const h = names.map(n => SG.D.H[n]).find(Boolean);
  const fac = h ? h['阵营'] : '汉';
  const mob = Object.keys(MOB_FAC).find(m => MOB_FAC[m] === fac) || '汉军郡兵';
  return names.concat([mob]);
}
// 打一关。A：玩家单位（已按阵位排好）；ease：敌方四维系数；cells：玩家阵位（0–8，前排 0–2），可选
// 返回 { win, rounds, battles:[Battle], foes:[Unit] }
function fightStage(stage, A, ease, opt = {}) {
  const log = !!opt.log, cycle = opt.cycle || 1;
  const { names: enemies, lv, star } = stageFoes(stage, cycle, (opt.txHalf || {})['天狼'] === 'g' ? null : opt.tx);
  const out = { win: false, rounds: 0, battles: [], A };
  if (opt.tx && opt.tx.length) { txPlayer(A, opt); opt._tlHp = tlFull(stage, cycle, opt); }
  const fixCells = (b) => { if (opt.cells) A.forEach((u, i) => { if (opt.cells[i] != null) u.idx = opt.cells[i]; }); };
  if ((stage['限制'] || '').includes('车轮战')) {
    const named = enemies.filter(e => SG.D.H[e]), mobs = enemies.filter(e => !SG.D.H[e]);
    for (const e of named) {
      const B = [e].concat(mobs.slice(0, 2)).map(x => mkEnemy(x, lv, star, ease)); labelDup(B);
      for (const a of A) if (a.alive()) { a.hp = Math.min(a.maxhp, a.hp + a.maxhp * .2); a.status = {}; a.prep = null; }
      const keep = A.filter(a => a.alive());
      if (!keep.length) return out;
      const b = new SG.Battle(keep, B, log); fixCells(b); txFoe(B, b, opt); out.battles.push(b); out.foes = B;
      const [w, rr] = b.run(); out.rounds += rr;
      if (w !== 0) return out;
    }
    out.win = true; return out;
  }
  const B = labelDup(enemies.map(e => mkEnemy(e, lv, star, ease)));
  out.foes = B;
  apply_limit(stage, A, B);
  const b = new SG.Battle(A, B, log); fixCells(b); txFoe(B, b, opt); out.battles.push(b);
  const mm = /撑过(\S)回合即胜/.exec(stage['限制'] || '');
  let w, r;
  if (mm) { [w, r] = b.run(CN_NUM[mm[1]]); if (A.some(a => a.alive())) w = 0; }
  else [w, r] = b.run();
  if ((stage['限制'] || '').includes('必须存活')) {
    const req = (stage['必带'] || '').split(',')[0];
    if (!A.some(a => a.name === req && a.alive())) w = 1;
  }
  out.win = w === 0; out.rounds = r;
  return out;
}
SG.fightStage = fightStage; SG.apply_limit = apply_limit;

// ---------------- 存档与养成（闯关） ----------------
const SAVE_KEY = 'sgqyl_campaign_v1';
function today() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

class Game {
  constructor(s) { this.s = s; if (!s.token) s.token = {}; this.rng = SG.makeRng((s.seed ^ (s.draws * 7919) ^ (s.smithDraws * 104729) ^ Date.now()) >>> 0); }
  static fresh(seed) {
    if (seed == null) seed = Math.floor(Math.random() * 2 ** 31);
    const s = { v: 1, seed, cycle: 1, gold: CFG.start_gold, gold2: 0, heroes: {}, draws: 0, sinceHu: 0, smithDraws: 0, sinceZhen: 0, tokens: 0, tokensBought: 0, bag: [], gear: {}, uid: 1, cleared: {}, replay: { day: today(), n: {} }, formation: [null, null, null, null, null, null, null, null, null], seen: {}, log: [] };
    const g = new Game(s);
    const rng = SG.makeRng(seed);
    const gift = [rng.choice(SG.D.HLIST), rng.choice(SG.D.HLIST)];
    gift.forEach(n => g.addHero(n));
    s.gift = gift;
    // 开局两人先上阵
    s.formation[1] = gift[0]; if (gift[1] !== gift[0]) s.formation[4] = gift[1];
    return g;
  }
  // ---- 基本 ----
  get D() { return SG.D; }
  maxLv() { return Math.min(70, 50 + 10 * (this.s.cycle - 1)); }
  goldMul() { return (this.s.cycle >= 2 ? 1.5 : 1) * (this.txHas('岁星') ? 1.5 : 1); }
  // ---- 天象（二周目起每周目三颗，每颗可花 10 兵符换一次） ----
  txList() { if (this.s.cycle < 2) return []; this.ensureTx(); return this.s.tx.on.slice(); }
  txHas(id) { return this.s.cycle >= 2 && !!this.s.tx && this.s.tx.on.includes(id); }
  ensureTx() { if (this.s.cycle >= 2 && (!this.s.tx || this.s.tx.cycle !== this.s.cycle)) this.rollTx(); }
  rollTx() {
    const ids = TX.map(t => t.id), on = [];
    while (on.length < 3) { const x = this.rng.choice(ids); if (!on.includes(x)) on.push(x); }
    this.s.tx = { cycle: this.s.cycle, on, used: [false, false, false], seen: on.slice() };
  }
  rerollTx(i) {
    this.ensureTx(); const T = this.s.tx;
    if (!T || T.used[i]) return { err: '这颗换过了' };
    if (this.s.tokens < CFG.tx_reroll) return { err: `兵符不够，要 ${CFG.tx_reroll} 枚` };
    const pool = TX.map(t => t.id).filter(x => !T.seen.includes(x));
    if (!pool.length) return { err: '没有可换的了' };
    const x = this.rng.choice(pool);
    this.s.tokens -= CFG.tx_reroll; T.on[i] = x; T.used[i] = true; T.seen.push(x);
    return { ok: true, id: x };
  }
  // 这一关能掉谁的专属、各缺几件
  // 这一关能掉谁的专属、各缺几件。src：出处关（V0.6）；L：本关出场的无双（老掉法）
  exclOf(id) {
    const st = this.D.STAGE[id], typ = st['类型'];
    const pe = typ === '章末' ? CFG.boss_excl : typ === '隐藏' ? CFG.hidden_excl : typ === '支线' ? CFG.side_excl : 0;
    const src = (this.D.EXSRC[id] || []).map(n => ({ n, miss: this.exclMiss(n).length, tok: this.s.token[n] || 0 }));
    const srcN = new Set(src.map(x => x.n));
    const L = pe ? [...new Set(this.foesOf(id).names)].filter(n => this.D.EXCL[n] && !srcN.has(n)).map(n => ({ n, miss: this.exclMiss(n).length })) : [];
    if (!src.length && !L.length) return null;
    return { pe, L, src, done: src.concat(L).every(x => !x.miss) };
  }
  exclMiss(n) { const have = new Set(this.s.bag.map(it => it.id)); return (this.D.EXCL[n] || []).filter(e => !have.has(e.id)); }
  // 掉一件 n 缺的专属；齐了返回 null
  dropExcl(n) { const m = this.exclMiss(n); return m.length ? this.addItem(this.rng.choice(m).id) : null; }
  bondsOff() { return this.txHas('破军'); }
  foesOf(id) { return stageFoes(this.D.STAGE[id], this.s.cycle, this.txList()); }
  hero(n) { return this.s.heroes[n]; }
  addHero(n) {
    const h = this.s.heroes[n];
    if (h) { h.frag += CFG.frag_per_dup; return { name: n, dup: true }; }
    this.s.heroes[n] = { lv: 1, star: 1, frag: 0, hp: 1000 };
    this.s.seen[n] = 1;
    return { name: n, dup: false };
  }
  maxhp(n) { return this.s.heroes[n].lv * 1000; }
  // ---- 练级 ----
  trainCost(n, to) { const h = this.hero(n); let c = 0; for (let l = h.lv + 1; l <= to; l++) c += CFG.train_cost(l); return c; }
  train(n, k = 1) {
    const h = this.hero(n); let did = 0;
    while (did < k && h.lv < this.maxLv()) {
      const c = CFG.train_cost(h.lv + 1);
      if (this.s.gold < c) break;
      this.s.gold -= c; h.lv++; h.hp += 1000; did++;   // 新增的一千兵是满的
    }
    return did;
  }
  // ---- 征兵 ----
  recruitCost(n) { const h = this.hero(n); const lack = Math.max(0, h.lv * 1000 - h.hp); return Math.ceil(lack / 1000 * CFG.recruit_per_k * h.lv); }
  recruit(n) { const c = this.recruitCost(n); if (!c || this.s.gold < c) return false; this.s.gold -= c; this.hero(n).hp = this.hero(n).lv * 1000; return true; }
  recruitAllCost(names) { return names.reduce((a, n) => a + this.recruitCost(n), 0); }
  // ---- 招贤 ----
  drawTier() {
    const r = this.rng.random(); let acc = 0, tier = '校';
    for (const t of TIER_ORDER) { acc += CFG.pool[t]; if (r < acc) { tier = t; break; } }
    this.s.draws++; this.s.sinceHu++;
    if (this.s.sinceHu >= 50 && TIER_ORDER.indexOf(tier) < 3) tier = '虎';
    if (tier === '虎' || tier === '无双') this.s.sinceHu = 0;
    return tier;
  }
  draw(k) {
    const cost = k === 10 ? CFG.draw10 : CFG.draw * k;
    if (this.s.gold < cost) return null;
    this.s.gold -= cost;
    const tiers = []; for (let i = 0; i < k; i++) tiers.push(this.drawTier());
    if (k === 10 && tiers.every(t => TIER_ORDER.indexOf(t) < 2)) tiers[9] = '名';
    return tiers.map(t => Object.assign(this.addHero(this.rng.choice(this.D.POOL[t])), { tier: t }));
  }
  drawGold() {
    if (this.s.gold2 < CFG.gold2_draw) return null;
    this.s.gold2 -= CFG.gold2_draw; this.s.draws++; this.s.sinceHu = 0;
    const t = this.rng.random() < CFG.pool['无双'] / (CFG.pool['无双'] + CFG.pool['虎']) ? '无双' : '虎';
    return [Object.assign(this.addHero(this.rng.choice(this.D.POOL[t])), { tier: t })];
  }
  // ---- 兵符与升星 ----
  tokenPrice(k = 0) { const p = Math.min(CFG.token_cap, CFG.token_price + CFG.token_step * Math.floor((this.s.tokensBought + k) / 10)); return this.txHas('岁星') ? Math.round(p * 1.5) : p; }
  tokenCost(k) { let c = 0; for (let i = 0; i < k; i++) c += this.tokenPrice(i); return c; }
  buyTokens(k) { const c = this.tokenCost(k); if (this.s.gold < c) return false; this.s.gold -= c; this.s.tokensBought += k; this.s.tokens += k; return true; }
  starNeed(n) { const h = this.hero(n); if (h.star >= 5) return 0; return Math.trunc(pyRound(CFG.star_need[h.star] * CFG.star_q[this.D.H[n]['品阶']])); }
  canStar(n) { const h = this.hero(n), need = this.starNeed(n); return h.star < 5 && h.frag + this.s.tokens >= need; }
  starUp(n) {
    const h = this.hero(n), need = this.starNeed(n);
    if (h.star >= 5 || h.frag + this.s.tokens < need) return false;
    const useF = Math.min(h.frag, need); h.frag -= useF; this.s.tokens -= (need - useF); h.star++; return true;
  }
  // ---- 装备 ----
  curChapter() {
    let ch = 1;
    for (const s of this.D.STAGES) if ((s['类型'] === '主线' || s['类型'] === '章末') && this.stageUnlocked(s.id)) ch = Math.max(ch, +s['章']);
    return Math.min(26, ch);
  }
  addItem(id) { const it = { uid: this.s.uid++, id }; this.s.bag.push(it); return it; }
  item(uid) { return this.s.bag.find(x => x.uid === uid); }
  smithRoll() {
    const r = this.rng.random(); let acc = 0, tier = '凡品';
    for (const t in CFG.smith_pool) { acc += CFG.smith_pool[t]; if (r < acc) { tier = t; break; } }
    return tier;
  }
  smith(k) {
    const cost = k === 10 ? CFG.smith10 : CFG.smith * k;
    if (this.s.gold < cost) return null;
    this.s.gold -= cost;
    const cap = Math.min(4, CFG.drop_tier(this.curChapter()) + 1);
    const out = [];
    for (let i = 0; i < k; i++) {
      let t = this.smithRoll(); this.s.smithDraws++; this.s.sinceZhen++;
      let ti = t === '专属' ? 5 : EQ_TIERS.indexOf(t);
      if (this.s.sinceZhen >= 40 && ti < 3) ti = 3;
      if (k === 10 && i === 9 && out.every(o => o.ti < 2) && ti < 2) ti = 2;
      if (ti >= 3) this.s.sinceZhen = 0;
      if (ti === 5 && cap < 4) ti = cap;
      ti = ti === 5 ? 5 : Math.min(ti, cap);
      let row;
      // V0.6：专属只出已拥有、还没凑齐的无双的，从缺的里出；一个都没有就按神品出
      if (ti === 5) {
        const ws = Object.keys(this.D.EXCL).filter(n => this.s.heroes[n] && this.exclMiss(n).length);
        if (ws.length) row = this.rng.choice(this.exclMiss(this.rng.choice(ws))); else ti = 4;
      }
      if (ti !== 5) { const L = this.D.EQROWS.filter(e => e['档'] === EQ_TIERS[ti] && !e['归属']); row = this.rng.choice(L); }
      out.push({ ti, it: this.addItem(row.id), row });
    }
    return out;
  }
  equippedBy(uid) { for (const n in this.s.gear) for (const sl of SLOTS) if (this.s.gear[n][sl] === uid) return n; return null; }
  sell(uid) {
    const it = this.item(uid); if (!it) return 0;
    const row = this.D.EQID[it.id]; if (row['归属']) return 0;
    const who = this.equippedBy(uid); if (who) this.s.gear[who][row['槽']] = null;
    this.s.bag = this.s.bag.filter(x => x.uid !== uid);
    const v = CFG.sell[row['档']]; this.s.gold += v; return v;
  }
  equip(n, uid) {
    const it = this.item(uid); if (!it) return false;
    const row = this.D.EQID[it.id], sl = row['槽'];
    const prev = this.equippedBy(uid); if (prev) this.s.gear[prev][sl] = null;
    this.s.gear[n] = this.s.gear[n] || { '武器': null, '盔甲': null, '马匹': null, '宝物': null };
    this.s.gear[n][sl] = uid; return true;
  }
  unequip(n, sl) { if (this.s.gear[n]) this.s.gear[n][sl] = null; }
  gearIds(n) { const g = this.s.gear[n]; if (!g) return []; return SLOTS.map(sl => g[sl]).filter(u => u != null).map(u => this.item(u)).filter(Boolean).map(it => it.id); }
  // ---- 面板（界面显示用） ----
  unitOf(n, full) { const h = this.hero(n); return mkHeroUnit(n, h.lv, h.star, this.gearIds(n), full ? null : h.hp); }
  panel(n) {
    const u = this.unitOf(n, true);
    return { atk: u.stat('atk'), def: u.stat('def'), int: u.stat('int'), agi: u.stat('agi'), skill: u.skill, set4: !!(u.skill && this.D.SET4[n] && u.skill === this.D.SET4[n]) };
  }
  power(n) { const p = this.panel(n); return Math.round((p.atk + p.def + p.int + p.agi) * (1 + .15 * TIER_ORDER.indexOf(this.D.H[n]['品阶']))); }
  // ---- 关卡进度 ----
  isCleared(id) { return !!this.s.cleared[id]; }
  stageUnlocked(id) {
    const D = this.D, st = D.STAGE[id], i = st._i, typ = st['类型'], ch = +st['章'];
    if (ch >= 27) { const last = D.STAGES.find(x => x['章'] === '26' && x['类型'] === '章末'); if (!this.isCleared(last.id)) return false; }
    if (typ === '隐藏') return D.CHAPTERS[ch].stages.filter(x => x['类型'] !== '隐藏').every(x => this.isCleared(x.id));
    // 主线、章末、支线：之前的主线章末全通
    for (let k = i - 1; k >= 0; k--) { const p = D.STAGES[k]; if ((p['类型'] === '主线' || p['类型'] === '章末') && +p['章'] <= 26) return this.isCleared(p.id); }
    return true;
  }
  replayLeft(id) { if (this.s.replay.day !== today()) this.s.replay = { day: today(), n: {} }; return CFG.replay_per_day - (this.s.replay.n[id] || 0); }
  // ---- 打关 ----
  // cells: 长度 9，放将领名或 null
  fight(id, cells, opt = {}) {
    const D = this.D, st = D.STAGE[id];
    if (!this.stageUnlocked(id)) return { err: '还没解锁' };
    const lim = stageLimit(st);
    const picks = []; cells.forEach((n, i) => { if (n && this.hero(n)) picks.push([n, i]); });
    if (!picks.length) return { err: '阵上没人' };
    if (picks.length > lim.max) return { err: `这关只能带 ${lim.max} 人` };
    if (picks.some(([n]) => this.hero(n).hp < 1)) return { err: '有人没兵了，先征兵' };
    const replay = this.isCleared(id);
    if (replay && this.replayLeft(id) <= 0) return { err: '这关今天刷满三次了' };
    const A = picks.map(([n]) => this.unitOf(n));
    SG.setBattleSeed(opt.seed != null ? opt.seed : Math.floor(Math.random() * 2 ** 31));
    const res = fightStage(st, A, parseFloat(st['系数']) || 1, { log: !opt.quick, cycle: this.s.cycle, cells: picks.map(p => p[1]), tx: this.txList(), huatuo: !!this.s.heroes['华佗'] });
    // 残兵带回。赢了全员回三成；输了（V0.6）谁都不回，补兵只能征兵
    picks.forEach(([n], i) => { this.hero(n).hp = Math.max(0, A[i].hp); });
    if (res.win) for (const n in this.s.heroes) { const h = this.s.heroes[n]; h.hp = Math.min(h.lv * 1000, h.hp + h.lv * 1000 * CFG.regen_after_stage); }
    const rew = { gold: 0, gold2: 0, items: [], first: false, replay, excl: [] };
    if (res.win) {
      const lv = stageFoes(st, this.s.cycle).lv, ch = +st['章'], typ = st['类型'];
      if (!replay) {
        rew.first = true;
        rew.gold = Math.round(CFG.gold_clear(lv) * (typ === '章末' ? CFG.boss_mult : typ === '隐藏' ? CFG.hidden_mult : 1) * this.goldMul());
        rew.gold2 = (CFG.gold2_clear[typ] || 0) * (this.s.cycle >= 2 ? 2 : 1) + (this.txHas('天狼') ? 1 : 0);
        const tl = this.txHas('贪狼');
        const ti = Math.max(0, CFG.drop_tier(ch) - (tl ? 1 : 0));
        const L = D.EQROWS.filter(e => e['档'] === EQ_TIERS[ti] && !e['归属']);
        for (let k = 0; k < (tl ? 2 : 1); k++) rew.items.push(this.addItem(this.rng.choice(L).id));
        this.s.cleared[id] = 1;
      } else {
        this.s.replay.n[id] = (this.s.replay.n[id] || 0) + 1;
        rew.gold = Math.round(CFG.gold_replay(lv) * this.goldMul());
        const tl = this.txHas('贪狼');
        if (this.rng.random() < CFG.replay_drop * (tl ? 2 : 1)) {
          const ti = Math.max(0, CFG.drop_tier(ch) - 1 - (tl ? 1 : 0));
          const L = D.EQROWS.filter(e => e['档'] === EQ_TIERS[ti] && !e['归属']);
          rew.items.push(this.addItem(this.rng.choice(L).id));
        }
        this.s.cleared[id]++;
      }
      // V0.6 出处关：首通必掉一件；复刷 5%，不掉给一枚信物，满 20 枚换一件；齐了不掉也不给信物
      for (const n of (D.EXSRC[id] || [])) {
        if (!this.exclMiss(n).length) continue;
        let it = null, how = '';
        if (!replay) { it = this.dropExcl(n); how = 'first'; }
        else if (this.rng.random() < CFG.src_excl) { it = this.dropExcl(n); how = 'luck'; }
        else {
          const t = (this.s.token[n] || 0) + 1;
          if (t >= CFG.src_token) { this.s.token[n] = 0; it = this.dropExcl(n); how = 'swap'; }
          else { this.s.token[n] = t; rew.excl.push({ n, how: 'token', tok: t }); }
        }
        if (it) { rew.items.push(it); rew.excl.push({ n, how, id: it.id }); }
      }
      // 专属掉落：章末 3%、隐藏 10%、支线 3%（V0.4），掉本关出场无双缺的件（V0.6 起只掉缺的）
      const pe = typ === '章末' ? CFG.boss_excl : typ === '隐藏' ? CFG.hidden_excl : typ === '支线' ? CFG.side_excl : 0;
      if (pe && this.rng.random() < pe) {
        const ws = [...new Set(stageFoes(st, this.s.cycle, this.txList()).names)].filter(n => D.EXCL[n] && this.exclMiss(n).length);
        if (ws.length) { const n = this.rng.choice(ws), it = this.dropExcl(n); rew.items.push(it); rew.excl.push({ n, how: 'boss', id: it.id }); }
      }
      const gb = picks.reduce((a, [n]) => a + (CFG.gold_hero[n] || 0), 0);
      if (gb) { rew.goldHero = Math.round(rew.gold * gb); rew.gold += rew.goldHero; }
      this.s.gold += rew.gold; this.s.gold2 += rew.gold2;
    } else if (replay) {
      this.s.replay.n[id] = (this.s.replay.n[id] || 0) + 1;
    }
    return { res, rew, picks };
  }
  // ---- 借鉴水浒：战力、一键、引导 ----
  teamPower(cells) {
    const U = (cells || this.s.formation).filter(n => n && this.hero(n)).map(n => this.unitOf(n));
    if (!this.bondsOff()) SG.applyBonds(U);
    for (const p of txParts({ tx: this.txList() })) if (p.A) U.forEach(p.A);
    return Math.round(U.reduce((a, u) => a + unitPower(u), 0));
  }
  stagePower(id) {
    const st = this.D.STAGE[id], f = stageFoes(st, this.s.cycle, this.txList()), ease = parseFloat(st['系数']) || 1;
    const B = f.names.map(n => mkEnemy(n, f.lv, f.star, ease)); apply_limit(st, [], B); SG.applyBonds(B);
    for (const p of txParts({ tx: this.txList() })) if (p.B) B.forEach(p.B);
    if (tlFull(st, this.s.cycle, { tx: this.txList() })) for (const u of B) { u.maxhp *= 1.10; u.hp *= 1.10; }
    return Math.round(B.reduce((a, u) => a + unitPower(u), 0));
  }
  itemScore(n, row) {
    const main = this.D.H[n]['定位'] === '武将' ? 'atk' : 'int';
    const own = row['归属'] === n;
    let v = parseFloat(row['固定']) * (own ? 1.5 : 1) * (row['槽'] === '武器' && row['维'] !== main ? 0.3 : 1) + parseFloat(row['百分比']) * 4;
    if (own) v += 200;   // 本人专属优先，凑两件四件
    return v;
  }
  autoEquip(names) {
    names = names.filter(n => n && this.hero(n)).sort((a, b) => this.power(b) - this.power(a));
    const team = new Set(names);
    for (const n of names) for (const sl of SLOTS) {
      let best = null, bv = -1;
      for (const it of this.s.bag) {
        const row = this.D.EQID[it.id]; if (row['槽'] !== sl) continue;
        const who = this.equippedBy(it.uid);
        if (who && who !== n && team.has(who) && names.indexOf(who) < names.indexOf(n)) continue;   // 排在前面的人已经穿上了
        const v = this.itemScore(n, row); if (v > bv) { bv = v; best = it; }
      }
      if (best) this.equip(n, best.uid);
    }
  }
  stripTeam(names) { for (const n of names) if (n && this.s.gear[n]) for (const sl of SLOTS) this.s.gear[n][sl] = null; }
  ownStarReady(n) { const h = this.hero(n); return h.star < 5 && h.frag >= this.starNeed(n) && this.starNeed(n) > 0; }
  starAll() { let k = 0; for (const n in this.s.heroes) while (this.ownStarReady(n)) { const h = this.hero(n); h.frag -= this.starNeed(n); h.star++; k++; } return k; }
  trainMax(n) { return this.train(n, 999); }
  nextStage() { return this.D.STAGES.find(s => (s['类型'] === '主线' || s['类型'] === '章末') && !this.isCleared(s.id) && this.stageUnlocked(s.id)); }
  guide() {
    const owned = Object.keys(this.s.heroes), F = this.s.formation.filter(Boolean), nx = this.nextStage();
    const cl = Object.keys(this.s.cleared).length;
    if (!cl && owned.length < 4 && this.s.gold >= CFG.draw) return { txt: '先去招贤', sub: '过关不送人，将领只能招。开局的钱够抽三次', act: 'go', v: 'tavern' };
    if (owned.length < 9 && this.s.gold >= CFG.draw + 200) return { txt: `手上才 ${owned.length} 个人`, sub: '去招贤添几个，九宫格坐满打得轻松', act: 'go', v: 'tavern' };
    if (F.length < Math.min(9, owned.length)) return { txt: `还有 ${owned.length - F.length} 个人没上阵`, sub: '去布阵把空位填满', act: 'go', v: 'form' };
    const ready = owned.filter(n => this.ownStarReady(n)).length;
    if (ready) return { txt: `${ready} 个人碎片够升星`, sub: '将领页一键升星，只花本人碎片', act: 'go', v: 'heroes' };
    const low = F.filter(n => this.hero(n).hp < this.hero(n).lv * 1000 * .6);
    if (low.length) return { txt: `${low.length} 个人兵力不到六成`, sub: '布阵页可以一键征兵', act: 'go', v: 'form' };
    if (nx) return { txt: `下一关：${nx['关']}`, sub: `第 ${nx['章']} 章 ${nx['章名']}　敌方 ${stageFoes(nx, this.s.cycle).lv} 级`, act: 'stage', v: nx.id };
    if (this.allCleared()) return { txt: '终章打完了', sub: `可以开第 ${this.s.cycle + 1} 周目`, act: 'go', v: 'stages' };
    return null;
  }
  allCleared() { const last = this.D.STAGES.find(x => x['章'] === '26' && x['类型'] === '章末'); return this.isCleared(last.id); }
  newCycle() {
    if (!this.allCleared()) return false;
    const s = this.s; s.cycle++; s.cleared = {}; s.tokensBought = 0; s.replay = { day: today(), n: {} }; this.rollTx(); return true;
  }
  // ---- 存档 ----
  toJSON() { return JSON.stringify(this.s); }
  static load(str) { try { const s = JSON.parse(str); if (!s || s.v !== 1 || s.kind === 'conquest') return null; return new Game(s); } catch (e) { return null; } }
}
SG.Game = Game; SG.SAVE_KEY = SAVE_KEY;

if (typeof module !== 'undefined' && module.exports) module.exports = SG;
})(typeof window !== 'undefined' ? window : globalThis);
