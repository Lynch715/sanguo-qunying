// 三国群英录 · 霸业模式界面。数都在 SG.World / SG.ConquestGame，这里只画和转流程。
(function () {
'use strict';
const SG = window.SG, D = SG.D;
const { $, esc, num, toast, openModal, closeModal, ask, por, store, TSEAL, facTag } = SG.ui;
const V = SG.V, VIEWS = SG.VIEWS, ACT = SG.ACT;
const G = () => SG.getGame();
const W = () => G().world;
const FCOL = { '魏': '#2c5f8d', '蜀': '#2e7a63', '吴': '#c0402a', '汉': '#b5872c', '无': '#a39a8c' };
const FDESC = {
  '魏': '曹操起家，八城，北方四面接壤。人多将广，打起来容易腹背受敌。',
  '蜀': '刘备起家，七城，据益州荆南。关张赵马黄诸葛都在一边，起手最顺。',
  '吴': '孙权起家，七城，占江东江夏。水路两头，守易攻难。',
  '汉': '王允起家，八城，手下一群小官。董卓吕布袁绍公孙瓒都在别人城里等着——四家里最难的一档，中期招降到吕布才起得来。',
};
// 城的位置（示意，不按比例）：x 西→东，y 北→南，0–100
const POS = {
  '武威': [8, 22], '陇西': [15, 34], '天水': [24, 38], '长安': [37, 39], '弘农': [45, 41], '洛阳': [52, 38], '上党': [54, 28], '晋阳': [50, 18], '蓟': [70, 8],
  '邺': [61, 28], '南皮': [69, 19], '平原': [73, 26], '濮阳': [66, 34], '北海': [80, 29], '陈留': [63, 41], '许昌': [58, 46], '谯': [68, 47], '彭城': [74, 40], '下邳': [80, 44],
  '汝南': [63, 53], '寿春': [71, 53], '广陵': [83, 51], '合肥': [76, 57], '庐江': [72, 62], '建业': [83, 59], '吴郡': [89, 66], '会稽': [89, 76],
  '汉中': [32, 46], '上庸': [43, 50], '襄阳': [51, 55], '新野': [56, 50], '梓潼': [27, 54], '成都': [20, 63], '江州': [31, 69], '永安': [40, 62], '建宁': [25, 81],
  '江陵': [49, 63], '江夏': [60, 61], '柴桑': [67, 67], '长沙': [56, 72], '武陵': [45, 72], '零陵': [49, 82], '桂阳': [60, 84], '交趾': [36, 94],
};
const Conq = SG.Conq = {};
// ---------------- 地图缩放、拖动 ----------------
// 状态存在 V.mz，重画时照旧；城点和城名反向缩放，放大后只是摊开，字不跟着变大。
const MZ_MAX = 4;
function mz() { return V.mz || (V.mz = { s: 1, x: 0, y: 0 }); }
function mzStyle() { const z = mz(); return `transform:translate(${z.x}px,${z.y}px) scale(${z.s});--s:${z.s}`; }
function mzClamp(el) {
  const z = mz(), w = el.clientWidth, h = el.clientHeight;
  z.s = Math.min(MZ_MAX, Math.max(1, z.s));
  z.x = Math.min(0, Math.max(w * (1 - z.s), z.x));
  z.y = Math.min(0, Math.max(h * (1 - z.s), z.y));
}
function mzApply(el) { mzClamp(el); const inn = el.querySelector('.mapin'); if (inn) inn.setAttribute('style', mzStyle()); }
function mzZoomAt(el, ns, px, py) { // px,py：相对地图左上角的屏幕坐标，这一点放大前后不动
  const z = mz(), cx = (px - z.x) / z.s, cy = (py - z.y) / z.s;
  z.s = Math.min(MZ_MAX, Math.max(1, ns)); z.x = px - cx * z.s; z.y = py - cy * z.s; mzApply(el);
}
const PT = new Map(); let drag = null, pinch = null, swallow = false;
function mapOf(e) { const el = e.target.closest && e.target.closest('#cqmap'); return el && !e.target.closest('.mapctl') ? el : null; }
document.addEventListener('pointerdown', e => {
  const el = mapOf(e); if (!el) return;
  PT.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const z = mz();
  if (PT.size === 1) { drag = { el, x0: e.clientX, y0: e.clientY, tx: z.x, ty: z.y, moved: false }; pinch = null; }
  else if (PT.size === 2) {
    const [a, b] = [...PT.values()], r = el.getBoundingClientRect();
    pinch = { el, d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, s0: z.s, mx: (a.x + b.x) / 2 - r.left, my: (a.y + b.y) / 2 - r.top };
    pinch.cx = (pinch.mx - z.x) / z.s; pinch.cy = (pinch.my - z.y) / z.s;
    if (drag) drag.moved = true;
  }
});
document.addEventListener('pointermove', e => {
  if (!PT.has(e.pointerId)) return;
  PT.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const z = mz();
  if (pinch && PT.size >= 2) {
    const [a, b] = [...PT.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
    z.s = Math.min(MZ_MAX, Math.max(1, pinch.s0 * d / pinch.d0));
    z.x = pinch.mx - pinch.cx * z.s; z.y = pinch.my - pinch.cy * z.s; mzApply(pinch.el); e.preventDefault();
  } else if (drag) {
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.moved && Math.hypot(dx, dy) > 6) drag.moved = true;
    if (drag.moved) { z.x = drag.tx + dx; z.y = drag.ty + dy; mzApply(drag.el); e.preventDefault(); }
  }
}, { passive: false });
function ptEnd(e) {
  if (!PT.has(e.pointerId)) return;
  PT.delete(e.pointerId);
  if (PT.size === 0) { if (drag && drag.moved) swallow = true; drag = null; pinch = null; }
  else if (PT.size === 1) { pinch = null; const [p] = [...PT.values()], z = mz(); if (drag) { drag.x0 = p.x; drag.y0 = p.y; drag.tx = z.x; drag.ty = z.y; } }
}
document.addEventListener('pointerup', ptEnd); document.addEventListener('pointercancel', ptEnd);
// 拖完松手那一下不算点城
document.addEventListener('click', e => { if (swallow) { swallow = false; if (e.target.closest && e.target.closest('#cqmap')) { e.stopPropagation(); e.preventDefault(); } } }, true);
document.addEventListener('wheel', e => {
  const el = mapOf(e); if (!el) return;
  e.preventDefault(); const r = el.getBoundingClientRect();
  mzZoomAt(el, mz().s * Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
}, { passive: false });
ACT['cq-zoom'] = btn => {
  const el = $('cqmap'); if (!el) return;
  const v = btn.dataset.v, w = el.clientWidth, h = el.clientHeight;
  if (v === '0') { V.mz = { s: 1, x: 0, y: 0 }; mzApply(el); return; }
  mzZoomAt(el, mz().s * (v === 'in' ? 1.5 : 1 / 1.5), w / 2, h / 2);
};
function saveCq() { SG.save(); }
Conq.pool = () => {
  const g = G(), w = W();
  if (V.cq && V.cq.kind === 'defend') { const c = w.st.city[V.cq.plan.best]; return (c.guard && g.hero(c.guard) ? [c.guard] : []).concat(w.free_heroes()); }
  return w.free_heroes();
};

// ---------------- 选阵营 ----------------
Conq.pickFaction = () => {
  const go = () => openModal(`<div class="shead">选阵营<span class="x" data-a="close">关闭</span></div>
    <div class="small muted">霸业和闯关各存各的。将领从一级练起，起手是主公加本阵营六个人，金币 3000。前 12 回合休战，别家不打你。</div>
    ${SG.CQ_FACTIONS.map(f => `<div class="card" style="margin-top:8px"><div class="row"><b class="kai" style="font-size:1.2em;color:${FCOL[f]}">${f}</b><span class="small muted">主公 ${SG.CQ_LEADER[f]}　都城 ${SG.CQ_CAPITAL[f]}</span><span class="grow"></span><span class="btn sm" data-a="cq-start" data-f="${f}">选</span></div><div class="small">${FDESC[f]}</div></div>`).join('')}`);
  if (store.get(SG.CQ_SAVE_KEY)) ask('新开霸业', '现有的霸业进度会被覆盖。', '新开', go); else go();
};
Conq.cont = () => {
  const g = SG.ConquestGame.load(store.get(SG.CQ_SAVE_KEY));
  if (!g) { toast('存档坏了'); return; }
  SG.setGame(g); V.mode = 'conquest'; V.cq = null; SG.go('map');
};
ACT['cq-start'] = el => {
  const g = SG.ConquestGame.fresh(el.dataset.f);
  SG.setGame(g); g.s.acted = false; g.s.news = [`第 1 回合。${el.dataset.f}起兵，都城${SG.CQ_CAPITAL[el.dataset.f]}。`];
  saveCq(); closeModal(); V.mode = 'conquest'; V.cq = null; SG.go('map');
  const T = SG.CQ && SG.CQ.truce || 12;
  openModal(`<div class="shead">${esc(el.dataset.f)}起兵</div>
    <div class="small">手下的人开局全派去守城了，一城一将。</div>
    <div class="small" style="margin-top:6px">想出兵打别人，要么去招贤添人，要么点开自己的城把守将撤下来。撤了的城就空着，别家打过来只能临时调人守。</div>
    <div class="small" style="margin-top:6px">前 ${T} 回合各家休战，这段时间用来招人、练级、配装。</div>
    <div class="small" style="margin-top:6px">丢了都城、手里又不到四座城，就算败亡。</div>
    <div class="btns"><div class="btn main" data-a="close">知道了</div></div>`);
};

// ---------------- 地图 ----------------
VIEWS.map = () => {
  const g = G(), w = W(), st = w.st, me = st.me;
  const tg = new Set(w.targets());
  let lines = '';
  const seen = new Set();
  for (const a in w.ADJ) for (const b of w.ADJ[a]) {
    const k = a < b ? a + b : b + a; if (seen.has(k)) continue; seen.add(k);
    const [x1, y1] = POS[a], [x2, y2] = POS[b];
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#b9ae9b" stroke-width="1.4" vector-effect="non-scaling-stroke" />`;
  }
  const cities = Object.keys(st.city).map(n => {
    const c = st.city[n], [x, y] = POS[n], sz = c.tier === '都' ? 15 : c.tier === '大' ? 11 : 8;
    const cap = Object.values(st.capital).includes(n) && c.owner !== '无' && st.capital[c.owner] === n;
    return `<div class="city${V.cqSel === n ? ' sel' : ''}${tg.has(n) && !g.s.acted ? ' can' : ''}" style="left:${x}%;top:${y}%" data-a="cq-city" data-c="${n}">
      <div class="dot" style="width:${sz}px;height:${sz}px;background:${FCOL[c.owner]}${cap ? ';border-color:#2b2520' : ''}"></div><div class="cn">${n}</div></div>`;
  }).join('');
  const cnt = {}; for (const n in st.city) cnt[st.city[n].owner] = (cnt[st.city[n].owner] || 0) + 1;
  const legend = ['魏', '蜀', '吴', '汉', '无'].map(f => `<span><i style="background:${FCOL[f]}"></i>${f === '无' ? '无主' : f}${f === me ? '（你）' : ''} ${cnt[f] || 0}${f !== '无' && !st.alive[f] ? '·灭' : ''}</span>`).join('');
  const news = (g.s.news || []).slice(-6).map(esc).join('<br>');
  return `<div class="row" style="margin-bottom:6px"><b class="kai" style="font-size:1.1em;color:${FCOL[me]}">${me}</b><span class="small muted">都城 ${st.capital[me]}　第 ${st.turn} 回合${st.turn <= SG.CQ.truce ? `（休战到第 ${SG.CQ.truce} 回合）` : ''}</span><span class="grow"></span>
      <span class="btn sm main" data-a="cq-end">${g.s.acted ? '结束回合' : '过回合'}</span></div>
    <div class="map" id="cqmap"><div class="mapin" style="${mzStyle()}"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>${cities}</div><div class="mapctl"><span data-a="cq-zoom" data-v="in">＋</span><span data-a="cq-zoom" data-v="out">－</span><span class="rs" data-a="cq-zoom" data-v="0">复位</span></div></div>
    <div class="legend">${legend}</div>
    <div class="small muted">${g.s.acted ? '这回合已出过兵。' : '红字的城可以打，点城看守军。'}练级、升星、招降、招贤不占回合。</div>
    ${news ? `<div class="card cq-log" style="margin-top:8px">${news}</div>` : ''}
    <div class="btns"><div class="btn sm" data-a="cq-reguard">重排守将（最弱的守城）</div></div>`;
};
function garrisonHtml(n) {
  const w = W(), c = w.st.city[n], [lv, star] = w.foeLvStar(n);
  return `<div class="small muted">${c.garrison.length} 人　${lv} 级　${'★'.repeat(star)}　兵力 ${Math.round((c.hp != null ? c.hp : 1) * 100)}%</div>
    <div class="foes">${c.garrison.map(x => `<div class="foe">${por(x, 's')}<div class="nm">${D.H[x] ? TSEAL(D.H[x]['品阶']) + ' ' : ''}${esc(x)}</div></div>`).join('')}</div>`;
}
function citySheet(n) {
  const g = G(), w = W(), st = w.st, c = st.city[n], me = st.me;
  const inc = SG.CQ_INCOME[c.tier];
  let body = '';
  if (c.owner === me) {
    const gd = c.guard;
    body = `<div class="small">每回合进账 ${inc} 金。守将统率每 10 点，守城兵力 +5%${n === SG.CQ_CAPITAL[me] ? '；都城再 ×1.5，被打时自己挑人守' : ''}。</div>
      <div class="sec"><h2>守将</h2><span class="line"></span></div>
      ${gd ? `<div class="row">${`<div style="width:60px">${por(gd)}</div>`}<div class="grow"><b class="kai">${esc(gd)}</b> ${TSEAL(D.H[gd]['品阶'])}<div class="small muted">${g.hero(gd).lv} 级　统率 ${Math.round(g.cqStat4(gd)['统率'])}</div></div></div>` : '<div class="small" style="color:var(--zhu)">没有守将。被打就直接丢。</div>'}
      <div class="sec"><h2>换守将</h2><span class="line"></span><span class="tp">守将不出征</span></div>
      <div class="hgrid">${(gd ? ['__none'] : []).concat(w.free_heroes()).map(x => x === '__none' ? `<div class="hc" data-a="cq-guard" data-c="${n}" data-n=""><div class="por"><span class="ph">撤下</span></div><div class="nm">不留人</div></div>` : SG.heroCard(x, 'cq-guard').replace('data-a="cq-guard"', `data-a="cq-guard" data-c="${n}"`)).join('')}</div>`;
  } else {
    const adj = w.targets().includes(n);
    body = `<div class="small">${c.owner === '无' ? '无主' : c.owner}　${c.tier === '都' ? '都城' : c.tier === '大' ? '大城' : '郡'}${st.capital[c.owner] === n ? '（都城）' : ''}　打下来每回合 ${inc} 金</div>
      <div class="sec"><h2>守军</h2><span class="line"></span></div>${garrisonHtml(n)}
      <div class="btns">${adj ? `<div class="btn main${g.s.acted ? ' off' : ''}" data-a="cq-attack" data-c="${n}">${g.s.acted ? '这回合出过兵了' : '出征'}</div>` : '<div class="btn off">不接壤</div>'}</div>`;
  }
  openModal(`<div class="shead">${n}<span class="x" data-a="close">关闭</span></div>${body}`);
}
ACT['cq-city'] = el => { V.cqSel = el.dataset.c; citySheet(el.dataset.c); };
ACT['cq-guard'] = el => {
  const w = W(), c = w.st.city[el.dataset.c], n = el.dataset.n || null;
  if (n) for (const x of w.cities(w.st.me)) if (w.st.city[x].guard === n) w.st.city[x].guard = null;
  c.guard = n; G().s.formation = G().s.formation.map(x => x === n ? null : x);
  saveCq(); closeModal(); SG.render(); toast(n ? `${n} 守${el.dataset.c}` : '撤下了');
};
ACT['cq-reguard'] = () => ask('重排守将', '所有城的守将重新分：最弱的人守城，强的留着出征。人不够的城就空着。', '重排', () => { W().reassign_guards(); const g = G(); const gs = g.guards(); g.s.formation = g.s.formation.map(x => x && !gs[x] ? x : null); saveCq(); SG.render(); });

// ---------------- 出征 / 守城布阵 ----------------
ACT['cq-attack'] = el => {
  const g = G(), n = el.dataset.c;
  V.cq = { kind: 'attack', city: n };
  const pool = new Set(Conq.pool());
  g.s.formation = g.s.formation.map(x => x && pool.has(x) ? x : null);
  if (!g.s.formation.some(Boolean)) SG.autoForm(9);
  closeModal(); SG.go('form');
};
Conq.formHead = () => {
  const w = W();
  if (V.cq.kind === 'attack') return `<div class="card small"><b class="kai">出征 ${esc(V.cq.city)}</b>　${garrisonHtml(V.cq.city)}${Conq.pool().length ? '' : '<div style="color:var(--zhu)">能出征的人一个也没有：手下的人全在守城。去招贤添人，或者回地图点开自己的城，把守将撤下来。</div>'}</div>`;
  const p = V.cq.plan;
  return `<div class="card small" style="border-color:var(--zhu)"><b class="kai" style="color:var(--zhu)">守 ${esc(p.best)}</b>　${p.f} 从${esc(p.a)}打过来。守将和没出征的人都能上。${garrisonHtml(p.a)}</div>`;
};
Conq.formButtons = cnt => V.cq.kind === 'attack'
  ? `<div class="btns"><div class="btn" data-a="cq-cancel">回地图</div><div class="btn main${cnt ? '' : ' off'}" data-a="cq-go">出征</div></div>`
  : `<div class="btns">${V.cq.plan.best === W().st.capital[W().st.me] ? '' : '<div class="btn" data-a="cq-def-auto">自动守</div>'}<div class="btn main${cnt ? '' : ' off'}" data-a="cq-def-go">守城</div></div>`;
ACT['cq-cancel'] = () => { V.cq = null; SG.go('map'); };
function picks() { const g = G(), pool = new Set(Conq.pool()); return g.s.formation.map((n, i) => [n, i]).filter(([n]) => n && pool.has(n)); }
ACT['cq-go'] = () => {
  const g = G(), w = W(), n = V.cq.city;
  const P = picks(); if (!P.length) { toast('阵上没人'); return; }
  if (P.some(([x]) => g.hero(x).hp < 1)) { toast('有人没兵了，先征兵'); return; }
  const A = w.my_units(P.map(p => p[0])), B = w.foe_units(n);
  SG.setBattleSeed(Math.floor(Math.random() * 2 ** 31));
  const b = new SG.Battle(A, B, true); A.forEach((u, i) => u.idx = P[i][1]);
  const [r] = b.run();
  const res = w.afterAttack(n, A, B, r);
  g.s.acted = true;
  let note;
  if (res.won) {
    note = `${esc(n)} 归你了。${res.caught.length ? `俘虏 ${res.caught.map(esc).join('、')}，去俘虏营花钱招降。` : ''}${res.fell === 'dead' ? `${res.old}只剩这几座城，就此灭了。` : res.fell === 'moved' ? `${res.old}迁都${esc(res.cap)}。` : ''}`;
    g.s.news.push(`第 ${w.st.turn} 回合：攻下${n}。`);
  } else { note = `没打下来。${esc(n)} 守军兵力还剩 ${Math.round(w.st.city[n].hp * 100)}%，过几回合会回满。`; g.s.news.push(`第 ${w.st.turn} 回合：攻${n}没下。`); }
  V.cq = null; saveCq();
  SG.Play.begin({ res: { win: res.won, battles: [b] }, rew: {}, title: `出征 ${n}`, note, back: 'map', backAct: 'cq-after' });
};
ACT['cq-after'] = () => { if (!Conq.checkEnd()) SG.go('map'); };

// ---------------- 过回合：三家 AI ----------------
ACT['cq-end'] = () => {
  const g = G(), w = W();
  g.s.queue = SG.CQ_FACTIONS.filter(f => f !== w.st.me);
  g.s.turnNews = [];
  Conq.step();
};
Conq.step = () => {
  const g = G(), w = W();
  while (g.s.queue && g.s.queue.length) {
    const f = g.s.queue.shift();
    const plan = w.aiPlan(f);
    if (!plan) continue;
    if (plan.kind === 'ai') {
      const who = x => x === '无' ? '无主的' : x;
      g.s.turnNews.push(plan.won ? `${f}从${plan.a}打下${who(plan.old)}${plan.best}。` : `${f}攻${who(plan.old)}${plan.best}，没下。`);
      continue;
    }
    // 打到你了
    const c = w.st.city[plan.best];
    const names = w.defenders(plan.best);
    if (!names.length) {
      w.afterDefense(plan, [], [], 1);
      g.s.turnNews.push(`${f}从${plan.a}打下你的${plan.best}，城里没人。`);
      continue;
    }
    g.s.pending = plan; saveCq();
    const capital = plan.best === w.st.capital[w.st.me];
    openModal(`<div class="shead" style="color:var(--zhu)">${f}来打${plan.best}</div>
      <div class="small">${f}从${esc(plan.a)}出兵。${c.guard ? `守将 ${esc(c.guard)}。` : '这城没有守将。'}${capital ? '都城被打，得自己挑人守。' : ''}</div>${garrisonHtml(plan.a)}
      <div class="btns">${capital ? '' : '<div class="btn" data-a="cq-def-auto">自动守</div>'}<div class="btn main" data-a="cq-def-pick">自己挑人</div></div>`);
    return;
  }
  Conq.finishTurn();
};
ACT['cq-def-pick'] = () => {
  const g = G(), w = W(), plan = g.s.pending;
  V.cq = { kind: 'defend', plan };
  const auto = w.defenders(plan.best);
  const F = [null, null, null, null, null, null, null, null, null];
  const order = [1, 0, 2, 4, 3, 5, 7, 6, 8];
  auto.slice(0, 9).forEach((n, i) => F[order[i]] = n);
  g.s.formation = F;
  closeModal(); SG.go('form');
};
function defend(names, cells) {
  const g = G(), w = W(), plan = g.s.pending;
  const { A, B } = w.defenseUnits(plan, names);
  SG.setBattleSeed(Math.floor(Math.random() * 2 ** 31));
  const b = new SG.Battle(A, B, true);
  if (cells) A.forEach((u, i) => u.idx = cells[i]);
  const [r] = b.run();
  const out = w.afterDefense(plan, A, B, r);
  g.s.pending = null; V.cq = null;
  let note;
  if (out.won) { note = `${esc(plan.best)} 丢了。${out.lostGuard ? `守将 ${esc(out.lostGuard)} 被俘。` : ''}`; g.s.turnNews.push(`${plan.f}打下你的${plan.best}。`); }
  else { note = `守住了。${out.caught.length ? `${out.caught.map(esc).join('、')} 战死被擒，进了俘虏营。` : ''}`; g.s.turnNews.push(`${plan.f}攻${plan.best}，被你守住。`); }
  saveCq();
  SG.Play.begin({ res: { win: !out.won, battles: [b] }, rew: {}, title: `守 ${plan.best}`, note, winTxt: out.won ? '城破' : '守住', back: 'map', backAct: 'cq-resume', backTxt: '接着过回合' });
}
ACT['cq-def-auto'] = () => { closeModal(); defend(null, null); };
ACT['cq-def-go'] = () => {
  const P = picks(); if (!P.length) { toast('阵上没人'); return; }
  defend(P.map(p => p[0]), P.map(p => p[1]));
};
ACT['cq-resume'] = () => { SG.go('map'); Conq.step(); };
Conq.checkEnd = () => {
  const w = W(), s = w.status();
  if (!s) return false;
  const g = G();
  if (s === 'win') {
    store.set('sgqyl_title', '一统天下');
    { const r = SG.cqAch.get(); r.win = r.win || {}; r.win[w.st.me] = 1; if (w.st.turn <= 40) r.fast = 1; SG.cqAch.set(r); }
    openModal(`<div class="shead">天下归一</div><div class="story">第 ${w.st.turn} 回合，${w.st.me}据有四海。</div><div class="small muted">功名簿里记下了「一统天下」，回闯关去领。</div><div class="btns"><div class="btn main" data-a="to-title">回标题</div></div>`);
  } else {
    openModal(`<div class="shead">败亡</div><div class="story">都城丢了，手里不到四座城。第 ${w.st.turn} 回合，${w.st.me}散了。</div><div class="btns"><div class="btn" data-a="close">看看地图</div><div class="btn main" data-a="to-title">回标题</div></div>`);
  }
  g.s.over = s; saveCq();
  return true;
};
Conq.finishTurn = () => {
  const g = G(), w = W();
  g.s.queue = null;
  if (Conq.checkEnd()) { SG.render(); return; }
  const inc = w.startTurn();
  g.s.acted = false;
  g.s.news.push(...g.s.turnNews.map(x => `第 ${w.st.turn - 1} 回合：${x}`));
  g.s.news.push(`第 ${w.st.turn} 回合，进账 ${inc} 金，全军回两成兵。`);
  g.s.news = g.s.news.slice(-40);
  saveCq(); SG.go('map');
  if (g.s.turnNews.length) openModal(`<div class="shead">第 ${w.st.turn - 1} 回合各家动静<span class="x" data-a="close">关闭</span></div><div class="small">${g.s.turnNews.map(esc).join('<br>')}</div><div class="small muted" style="margin-top:6px">进账 ${inc} 金。</div><div class="btns"><div class="btn main" data-a="close">知道了</div></div>`);
  g.s.turnNews = [];
};

// ---------------- 俘虏营 ----------------
VIEWS.prison = () => {
  const g = G(), w = W();
  const L = w.st.prisoners.slice().sort((a, b) => w.ransom(b[0]) - w.ransom(a[0]));
  return `<div class="sec"><h2>俘虏营</h2><span class="line"></span><span class="tp">${L.length} 人</span></div>
    <div class="small muted">谁都能降，给钱就来；放多久都不会跑。校 300、骁 800、名 2000、虎 5000、无双 12000。</div>
    <div class="card" style="padding:4px 10px;margin-top:8px">${L.map(([n, f, t]) => `<div class="item"><div style="width:44px;flex:none">${por(n, 's')}</div><div class="grow"><div class="en">${TSEAL(D.H[n]['品阶'])} ${esc(n)} ${facTag(D.H[n]['阵营'])}</div><div class="ed">${esc(D.SKROW[n]['技能'])}·${esc(D.SKROW[n]['类型'])}　第 ${t} 回合擒于${f === '无' ? '无主城' : f}</div></div>
      <span class="btn sm${g.s.gold >= w.ransom(n) ? ' main' : ' off'}" data-a="cq-ransom" data-n="${esc(n)}">${num(w.ransom(n))} 金</span></div>`).join('') || '<div class="empty">空的</div>'}</div>`;
};
ACT['cq-ransom'] = el => { const n = el.dataset.n; if (W().release(n)) { if (SG.D.H[n] && SG.D.H[n]['品阶'] === '无双') { const g = G(); g.s.nx = (g.s.nx || 0) + 1; const r = SG.cqAch.get(); r.nx = Math.max(r.nx || 0, g.s.nx); SG.cqAch.set(r); } saveCq(); SG.render(); toast(`${n} 降了`); } else toast('钱不够'); };

// 回到存档时，要是停在「有人来打」那一步，接着问
const _cont = Conq.cont;
Conq.cont = () => { _cont(); const g = G(); if (g && g.s.over) Conq.checkEnd(); else if (g && g.s.pending) { g.s.queue = g.s.queue || []; g.s.queue.unshift(g.s.pending.f); g.s.pending = null; W().st.last_hit[g.s.queue[0]] = -99; W().st.last_hit.any = -1; Conq.step(); } else if (g && g.s.queue) Conq.step(); };
})();
