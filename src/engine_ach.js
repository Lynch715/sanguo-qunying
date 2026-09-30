// 三国群英录 · 功名（V0.3）
// 达成不自动发，记成「待领」；大帐提示，功名簿里点领。霸业那边的几条通过 SG.cqAch 读写（界面接 localStorage）。
(function () {
const SG = globalThis.SG;
const Game = SG.Game;

const REWARD = {
  小: { gold: 1000 },
  中: { tokens: 1 },
  大: { gold2: 1, tokens: 3 },
  特: { gold2: 2, tokens: 5 },
};
SG.ACH_REWARD = REWARD;
SG.rewardText = t => { const r = REWARD[t], L = []; if (r.gold) L.push(`金 ${r.gold}`); if (r.gold2) L.push(`黄金 ${r.gold2}`); if (r.tokens) L.push(`兵符 ${r.tokens}`); return L.join('、'); };

// 霸业记录：{ win: {魏:1,…}, fast: 1, nx: 招降无双数最高的一局 }
SG.cqAch = SG.cqAch || { get: () => ({}), set: () => {} };

const D = () => SG.D;
const owned = g => Object.keys(g.s.heroes);
const tierCount = (g, t) => owned(g).filter(n => D().H[n]['品阶'] === t).length;
const ever = (g, name) => D().STAGES.some(s => s['关'] === name && g.s.ever[s.id]);
const chapDone = (g, c) => D().STAGES.some(s => +s['章'] === c && s['类型'] === '章末' && g.s.ever[s.id]);
const exclSets = g => { const have = new Set(g.s.bag.map(it => it.id)); return Object.keys(D().EXCL).filter(n => D().EXCL[n].every(e => have.has(e.id))).length; };
const exclAny = g => g.s.bag.some(it => D().EQID[it.id]['归属']);
const allOf = (g, typ) => D().STAGES.filter(s => s['类型'] === typ).every(s => g.s.ever[s.id]);
const st = (g, k) => (g.s.st || {})[k] || 0;
const ev = (g, k) => !!(g.s.ev || {})[k];
const cq = () => SG.cqAch.get() || {};

// 条件 c(g)。hidden：达成前只显示？？？
const ACH = [
  // 招贤
  ['招贤', '初聚', '麾下 9 人', '小', g => owned(g).length >= 9],
  ['招贤', '三十六员', '麾下 36 人', '中', g => owned(g).length >= 36],
  ['招贤', '百将', '麾下 100 人', '中', g => owned(g).length >= 100],
  ['招贤', '二百将', '麾下 200 人', '大', g => owned(g).length >= 200],
  ['招贤', '群英毕至', '图鉴收齐 358 人', '特', g => owned(g).length >= D().HLIST.length, '群英录'],
  ['招贤', '无双五人', '拥有 5 个无双', '中', g => tierCount(g, '无双') >= 5],
  ['招贤', '无双十五', '拥有 15 个无双', '大', g => tierCount(g, '无双') >= 15],
  ['招贤', '无双尽收', '36 个无双收齐', '特', g => tierCount(g, '无双') >= D().POOL['无双'].length, '无双'],
  ['招贤', '求贤若渴', '十连招贤 20 次', '小', g => st(g, 'd10') >= 20],
  ['招贤', '广纳英雄', '十连招贤 50 次', '中', g => st(g, 'd10') >= 50],
  // 推图
  ['推图', '桃园', '通第 1 章', '小', g => chapDone(g, 1)],
  ['推图', '讨董', '通第 3 章', '小', g => chapDone(g, 3)],
  ['推图', '官渡', '通第 10 章', '中', g => chapDone(g, 10)],
  ['推图', '赤壁', '通第 14 章', '中', g => chapDone(g, 14)],
  ['推图', '汉中王', '通第 18 章', '中', g => chapDone(g, 18)],
  ['推图', '出师表', '通第 22 章', '中', g => chapDone(g, 22)],
  ['推图', '三国归晋', '通第 26 章', '大', g => chapDone(g, 26), '天下归晋'],
  ['推图', '全通', '同一周目 142 关全通', '大', g => D().STAGES.every(s => g.s.cleared[s.id])],
  ['推图', '秘藏', '隐藏关全过', '大', g => allOf(g, '隐藏')],
  ['推图', '外传', '支线关全过', '大', g => allOf(g, '支线')],
  ['推图', '再起', '开二周目', '中', g => g.s.cycle >= 2],
  ['推图', '三周目', '三周目通终章', '特', g => g.s.cycle >= 3 && D().STAGES.some(s => +s['章'] === 26 && s['类型'] === '章末' && g.s.cleared[s.id]), '乱世不死'],
  // 破关
  ['破关', '单挑', '神亭酣斗、裸衣斗马超都过', '中', g => ever(g, '神亭酣斗') && ever(g, '裸衣斗马超')],
  ['破关', '死守', '据水断桥、草船借箭、单刀赴会、空城计都过', '中', g => ['据水断桥', '草船借箭', '单刀赴会', '空城计'].every(n => ever(g, n))],
  ['破关', '过关斩将', '过五关斩六将', '中', g => ever(g, '过五关斩六将')],
  ['破关', '七擒', '七擒七纵', '中', g => ever(g, '七擒七纵')],
  ['破关', '一合之将', '一回合打完一场章末', '中', g => ev(g, '一合')],
  ['破关', '全须全尾', '章末无人退场 20 次', '中', g => st(g, 'clean') >= 20],
  ['破关', '百战', '胜 100 场', '小', g => st(g, 'wins') >= 100],
  ['破关', '五百战', '胜 500 场', '中', g => st(g, 'wins') >= 500],
  ['破关', '千战', '胜 1000 场', '大', g => st(g, 'wins') >= 1000],
  // 神兵
  ['神兵', '神兵在手', '第一件专属', '小', g => exclAny(g)],
  ['神兵', '四件套', '集齐第一套专属', '中', g => exclSets(g) >= 1],
  ['神兵', '神兵谱', '集齐 5 套专属', '中', g => exclSets(g) >= 5],
  ['神兵', '神兵满堂', '集齐 15 套专属', '大', g => exclSets(g) >= 15],
  ['神兵', '兵器谱', '36 套专属全齐', '特', g => exclSets(g) >= Object.keys(D().EXCL).length, '兵器谱'],
  ['神兵', '铁匠铺常客', '铁匠铺十连 10 次', '小', g => st(g, 's10') >= 10],
  ['神兵', '打铁出神兵', '铁匠铺打出专属', '中', g => ev(g, '打出专属')],
  // 养成
  ['养成', '五星', '第一个 ★5', '小', g => owned(g).some(n => g.s.heroes[n].star >= 5)],
  ['养成', '九星连珠', '阵上九人全 ★5', '大', g => { const F = g.s.formation.filter(n => n && g.s.heroes[n]); return F.length === 9 && F.every(n => g.s.heroes[n].star >= 5); }],
  ['养成', '督练', '累计练 500 级', '中', g => st(g, 'train') >= 500],
  ['养成', '肝胆相照', '一阵同时激活 6 条羁绊', '中', g => st(g, 'bonds') >= 6],
  // 打法
  ['打法', '书生退敌', '全文臣、辅助阵容赢一场章末', '中', g => ev(g, '书生')],
  ['打法', '匹夫之勇', '全武将阵容赢一场章末', '中', g => ev(g, '匹夫')],
  ['打法', '火攻', '灼烧、中毒击杀 50 人', '小', g => st(g, 'dot') >= 50],
  ['打法', '以牙还牙', '反击 200 次', '小', g => st(g, 'counter') >= 200],
  // 霸业
  ['霸业', '一统天下', '霸业任一阵营统一', '大', g => Object.keys(cq().win || {}).length >= 1, '一统天下'],
  ['霸业', '再兴汉室', '霸业以汉统一', '特', g => !!(cq().win || {})['汉'], '再兴汉室'],
  ['霸业', '四海归一', '霸业四家各统一过一次', '特', g => ['魏', '蜀', '吴', '汉'].every(f => (cq().win || {})[f]), '四海归一'],
  ['霸业', '速定天下', '霸业 40 回合内统一', '大', g => !!cq().fast],
  ['霸业', '纳降', '霸业一局里招降 5 个无双', '中', g => (cq().nx || 0) >= 5],
  // 隐藏
  ['隐藏', '温酒斩华雄', '温酒斩华雄一关，华雄死在关羽手里', '中', g => ev(g, '温酒'), '美髯公', 1],
  ['隐藏', '七进七出', '赵云单人上阵打过赵云救主', '中', g => ev(g, '七进七出'), '常山赵子龙', 1],
  ['隐藏', '当阳桥', '张飞单人打过据水断桥', '中', g => ev(g, '当阳桥'), '燕人张翼德', 1],
  ['隐藏', '空城', '诸葛亮单人打过空城计', '中', g => ev(g, '空城'), '卧龙', 1],
  ['隐藏', '三英', '刘备关羽张飞同阵打过三英战吕布', '中', g => ev(g, '三英'), '桃园三英', 1],
  ['隐藏', '连环', '王允貂蝉吕布董卓同阵赢一场', '中', g => ev(g, '连环'), '司徒', 1],
  ['隐藏', '上将潘凤', '潘凤单人上阵，输在温酒斩华雄', '中', g => ev(g, '潘凤'), '无双上将', 1],
  ['隐藏', '骂死', '我方王朗被敌方诸葛亮打退', '中', g => ev(g, '骂死'), '皓首匹夫', 1],
  ['隐藏', '书生拜将', '陆逊在阵打过火烧连营', '中', g => ev(g, '书生拜将'), '书生', 1],
  ['隐藏', '南人不复反', '孟获在我方阵上打过七擒七纵', '中', g => ev(g, '南人'), '南蛮王', 1],
  ['隐藏', '三姓家奴', '吕布丁原董卓同阵赢一场', '中', g => ev(g, '三姓'), '三姓家奴', 1],
  ['隐藏', '帐中行刺', '范疆张达同阵赢一场', '中', g => ev(g, '行刺'), '夜半提刀', 1],
  ['隐藏', '既生瑜', '周瑜诸葛亮同阵赢一场', '中', g => ev(g, '既生瑜'), '何生亮', 1],
].map(([cat, name, cond, tier, c, title, hidden]) => ({ id: name, cat, name, cond, tier, c, title: title || '', hidden: !!hidden }));
const ACHID = {}; ACH.forEach(a => ACHID[a.id] = a);
SG.ACH = ACH; SG.ACHID = ACHID;
SG.ACH_CATS = ['招贤', '推图', '破关', '神兵', '养成', '打法', '霸业', '隐藏'];

// ---- 存档字段：s.ach {id: 1 待领 | 2 已领}，s.st 计数，s.ev 事件，s.ever 所有周目通过的关，s.titles，s.title ----
Game.prototype.achInit = function () {
  const s = this.s;
  s.ach = s.ach || {}; s.st = s.st || {}; s.ev = s.ev || {}; s.titles = s.titles || [];
  if (!s.ever) { s.ever = {}; for (const id in s.cleared || {}) s.ever[id] = 1; }
};
Game.prototype.achOn = function () { return this.kind !== 'conquest'; };
Game.prototype.stInc = function (k, n = 1) { if (!this.achOn()) return; this.achInit(); this.s.st[k] = (this.s.st[k] || 0) + n; };
Game.prototype.stMax = function (k, v) { if (!this.achOn()) return; this.achInit(); this.s.st[k] = Math.max(this.s.st[k] || 0, v); };
Game.prototype.evSet = function (k) { if (!this.achOn()) return; this.achInit(); this.s.ev[k] = 1; };
// 查一遍，新达成的记成待领，返回新达成的列表
Game.prototype.achCheck = function () {
  if (!this.achOn()) return [];
  this.achInit();
  const out = [];
  for (const a of ACH) if (!this.s.ach[a.id]) { let ok = false; try { ok = a.c(this); } catch (e) { ok = false; } if (ok) { this.s.ach[a.id] = 1; out.push(a); } }
  return out;
};
Game.prototype.achPending = function () { this.achInit(); return ACH.filter(a => this.s.ach[a.id] === 1); };
Game.prototype.achClaim = function (id) {
  this.achInit();
  const a = ACHID[id]; if (!a || this.s.ach[id] !== 1) return null;
  const r = REWARD[a.tier];
  this.s.gold += r.gold || 0; this.s.gold2 += r.gold2 || 0; this.s.tokens += r.tokens || 0;
  this.s.ach[id] = 2;
  if (a.title && !this.s.titles.includes(a.title)) { this.s.titles.push(a.title); if (!this.s.title) this.s.title = a.title; }
  return { a, r };
};
Game.prototype.achClaimAll = function () { return this.achPending().map(a => this.achClaim(a.id)).filter(Boolean); };

// ---- 挂到原有的动作上 ----
const _draw = Game.prototype.draw;
Game.prototype.draw = function (k) { const r = _draw.call(this, k); if (r && k === 10) this.stInc('d10'); if (r) this.achCheck(); return r; };
const _drawGold = Game.prototype.drawGold;
Game.prototype.drawGold = function () { const r = _drawGold.call(this); if (r) this.achCheck(); return r; };
const _smith = Game.prototype.smith;
Game.prototype.smith = function (k) {
  const r = _smith.call(this, k);
  if (r) { if (k === 10) this.stInc('s10'); if (r.some(o => o.ti === 5)) this.evSet('打出专属'); this.achCheck(); }
  return r;
};
const _train = Game.prototype.train;
Game.prototype.train = function (n, k) { const d = _train.call(this, n, k); if (d) { this.stInc('train', d); this.achCheck(); } return d; };
const _starUp = Game.prototype.starUp;
Game.prototype.starUp = function (n) { const r = _starUp.call(this, n); if (r) this.achCheck(); return r; };
const _newCycle = Game.prototype.newCycle;
Game.prototype.newCycle = function () { const r = _newCycle.call(this); if (r) this.achCheck(); return r; };

const _fight = Game.prototype.fight;
Game.prototype.fight = function (id, cells, opt) {
  const out = _fight.call(this, id, cells, opt);
  if (!out || out.err || !this.achOn()) return out;
  this.achInit();
  const st = this.D.STAGE[id], name = st['关'], typ = st['类型'];
  const team = out.picks.map(p => p[0]), has = n => team.includes(n), solo = n => team.length === 1 && team[0] === n;
  const win = out.res.win;
  // 羁绊数：开战时我方阵上
  if (!this.bondsOff()) this.stMax('bonds', SG.activeBonds(team).length);
  for (const b of out.res.battles) {
    this.stInc('counter', b.stats.counter[0]);
    for (const [src, tgt, side, tag] of b.stats.kills) {
      if (side === 1 && (tag === '灼烧' || tag === '中毒')) this.stInc('dot');
      if (name === '温酒斩华雄' && tgt === '华雄' && src === '关羽' && side === 1) this.evSet('温酒');
      if (tgt === '王朗' && side === 0 && src === '诸葛亮') this.evSet('骂死');
    }
  }
  if (!win && name === '温酒斩华雄' && solo('潘凤')) this.evSet('潘凤');
  if (win) {
    this.s.ever[id] = 1;
    this.stInc('wins');
    if (typ === '章末') {
      if (out.res.rounds <= 1) this.evSet('一合');
      if (out.res.A.every(u => u.alive())) this.stInc('clean');
      const roles = team.map(n => this.D.H[n]['定位']);
      if (roles.every(r => r === '文臣' || r === '辅助')) this.evSet('书生');
      if (roles.every(r => r === '武将')) this.evSet('匹夫');
    }
    if (name === '赵云救主' && solo('赵云')) this.evSet('七进七出');
    if (name === '据水断桥' && solo('张飞')) this.evSet('当阳桥');
    if (name === '空城计' && solo('诸葛亮')) this.evSet('空城');
    if (name === '三英战吕布' && ['刘备', '关羽', '张飞'].every(has)) this.evSet('三英');
    if (['王允', '貂蝉', '吕布', '董卓'].every(has)) this.evSet('连环');
    if (name === '火烧连营' && has('陆逊')) this.evSet('书生拜将');
    if (name === '七擒七纵' && has('孟获')) this.evSet('南人');
    if (['吕布', '丁原', '董卓'].every(has)) this.evSet('三姓');
    if (['范疆', '张达'].every(has)) this.evSet('行刺');
    if (['周瑜', '诸葛亮'].every(has)) this.evSet('既生瑜');
  }
  out.ach = this.achCheck();
  return out;
};
const _load = Game.load;
Game.load = function (str) { const g = _load.call(this, str); if (g) { g.achInit(); g.achCheck(); } return g; };
const _fresh = Game.fresh;
Game.fresh = function (seed) { const g = _fresh.call(this, seed); g.achInit(); return g; };
})();
