// 三国群英录 · 渲染与演出（闯关）。只管画，不算数：数都找 SG.Game。
// 约定：不写内联 onclick，一律 data-a="动作" 交给 document 上的委托；不用 setInterval。
(function () {
'use strict';
const D0 = window.SGDATA;
const SG = window.SG;
SG.init(D0);
const D = SG.D;
const VERSION = D0.version;

// ---------------- 小工具 ----------------
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const num = n => { n = Math.round(n); return n >= 100000 ? (n / 10000).toFixed(1).replace(/\.0$/, '') + '万' : String(n); };
const KEYCN = { atk: '武力', def: '统率', int: '智力', agi: '速度' };
const TSEAL = t => `<span class="seal t-${t}">${t}</span>`;
const ESEAL = ['凡', '良', '精', '珍', '神'];
const eqTi = row => row['归属'] ? 5 : SG.EQ_TIERS.indexOf(row['档']);
const eqSeal = row => `<span class="gseal eb${eqTi(row)}">${row['归属'] ? '专' : ESEAL[eqTi(row)]}</span>`;
const facTag = f => `<span class="fac f-${f}">${f === '无' ? '群' : f}</span>`;
const stars = n => '★'.repeat(n) + '<span style="opacity:.3">' + '★'.repeat(Math.max(0, 5 - n)) + '</span>';
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
function toast(msg) {
  const t = $('toast'); if (!t) return;
  const d = document.createElement('div'); d.textContent = msg; t.appendChild(d);
  setTimeout(() => d.remove(), 1800);
}
function openModal(html) { const m = $('modal'); m.innerHTML = `<div class="sheet">${html}</div>`; m.classList.add('on'); m.scrollTop = 0; }
function closeModal() { const m = $('modal'); m.classList.remove('on'); m.innerHTML = ''; }
let askFn = null;
function ask(title, body, yes, fn) {
  askFn = fn;
  openModal(`<div class="shead">${esc(title)}</div><div class="small">${body}</div>
    <div class="btns"><div class="btn" data-a="close">算了</div><div class="btn main" data-a="ask-yes">${esc(yes)}</div></div>`);
}
function por(name, size = 'l', extra = '') {
  const p = (D0.portraits || {})[name];
  const mob = !D.H[name];
  if (p) return `<div class="por${mob ? ' mob' : ''}${extra}"><img src="${p[size]}" alt="${esc(name)}" loading="lazy" decoding="async"></div>`;
  return `<div class="por${mob ? ' mob' : ''}${extra}"><span class="ph">${esc(name)}</span></div>`;
}
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { } },
};
SG.cqAch = { get: () => { try { return JSON.parse(store.get('sgqyl_cq_ach') || '{}'); } catch (e) { return {}; } }, set: o => store.set('sgqyl_cq_ach', JSON.stringify(o)) };
SG.ui = { $, esc, num, toast, openModal, closeModal, ask, por, store, TSEAL, facTag, stars, eqSeal, KEYCN, clamp };

// ---------------- 状态 ----------------
const V = { mode: 'title', view: 'stages', hero: null, stage: null, sel: null, open: {}, filt: { fac: '全', tier: '全', role: '全' }, sort: 'power', battle: null, bagSlot: '全' };
let G = null;
SG.V = V;
function save() {
  if (!G) return;
  if (G.kind !== 'conquest') {
    G.achCheck();
    const fresh = G.achPending().filter(a => !(V.achToast || {})[a.id]);
    V.achToast = V.achToast || {}; fresh.forEach(a => V.achToast[a.id] = 1);
    if (fresh.length && V.achToastOn) setTimeout(() => toast(`功名达成：${fresh.map(a => a.name).join('、')}，去功名簿领`), 400);
    V.achToastOn = true;
  }
  store.set(G.kind === 'conquest' ? SG.CQ_SAVE_KEY : SG.SAVE_KEY, G.toJSON());
}
function load() { const s = store.get(SG.SAVE_KEY); return s ? SG.Game.load(s) : null; }

// ---------------- 顶栏、导航 ----------------
// 两行：上面是每局来回点的，下面隔一阵看一次（照水浒）
const NAV = [['main', '大帐'], ['stages', '征战'], ['form', '布阵'], ['heroes', '将领'], ['tavern', '招贤'], ['forge', '铁匠'], ['bag', '行囊'], ['codex', '图鉴']];
const NAV_CQ = [['map', '地图'], ['heroes', '将领'], ['prison', '俘虏'], ['tavern', '招贤'], ['forge', '铁匠'], ['bag', '行囊']];
function topBar() {
  const s = G.s;
  if (G.kind === 'conquest') {
    const w = G.world;
    return `<div class="res"><span class="it"><i>金</i><b>${num(s.gold)}</b></span><span class="it"><i>兵符</i><b>${s.tokens}</b></span>
      <span class="it"><i>回合</i><b>${w.st.turn}</b></span><span class="it"><i>城</i><b>${w.cities(w.st.me).length}/44</b></span>
      <span class="sp"></span><span class="ic" data-a="menu">存档</span></div>`;
  }
  return `<div class="res">
    <span class="it"><i>金</i><b>${num(s.gold)}</b></span>
    <span class="it"><i>黄金</i><b>${s.gold2}</b></span>
    <span class="it"><i>兵符</i><b>${s.tokens}</b></span>
    ${s.cycle > 1 ? `<span class="it"><i>周目</i><b>${s.cycle}</b></span>` : ''}
    <span class="sp"></span><span class="ic" data-a="menu">存档</span></div>`;
}
function navBar() {
  const cq = G.kind === 'conquest';
  const cur = V.view === 'hero' ? 'heroes' : (V.view === 'battle' || V.view === 'form') && cq ? 'map' : V.view === 'battle' ? 'stages' : V.view;
  return `<div class="nav"><div class="inner${cq ? '' : ' two'}">${(cq ? NAV_CQ : NAV).map(([k, t]) => `<div class="tab${cur === k ? ' on' : ''}" data-a="go" data-v="${k}">${t}</div>`).join('')}</div></div>`;
}

// ---------------- 渲染入口 ----------------
function render() {
  const app = $('app');
  if (V.mode === 'title') { app.innerHTML = `<div class="app">${titleHtml()}</div>`; return; }
  if (V.view === 'battle') { app.innerHTML = `<div class="app wide">${battleHtml()}</div>`; Play.mount(); return; }
  const body = (VIEWS[V.view] || VIEWS.stages)();
  app.innerHTML = `<div class="app">${topBar()}${body}</div>${navBar()}`;
}
SG.render = render;
function go(v) { V.view = v; V.sel = null; render(); window.scrollTo(0, 0); }

// ---------------- 标题 ----------------
function titleHtml() {
  const has = !!store.get(SG.SAVE_KEY), hasC = !!store.get('sgqyl_conquest_v1');
  return `<div class="title-page">
    <div class="seal-big">群</div>
    <h1>三国群英录</h1>
    <div style="height:18px"></div>
    ${has ? `<div class="btn main" data-a="camp-continue">闯关　继续</div>` : ''}
    <div class="btn${has ? '' : ' main'}" data-a="camp-new">闯关　新开</div>
    <div style="height:6px"></div>
    ${hasC ? `<div class="btn qing" data-a="conq-continue">霸业　继续</div>` : ''}
    <div class="btn" data-a="conq-new">霸业　新开</div>
    <div class="imp" data-a="import">已有存档？导入</div>
    <div class="ver">V${VERSION}</div>
    <div class="copy" data-a="about">© 2026 Lynch　保留所有权利，未经许可不得改编或二次创作<br>微信 lynchrrr　·　关于与许可</div>
  </div>`;
}

// ---------------- 征战（章节） ----------------
const VIEWS = {};
// ---------------- 大帐（照水浒的聚义厅：下一步引导、出征布阵、存档） ----------------

function txPanel() {
  const L = G.txList(); if (!L.length) return '';
  const T = G.s.tx;
  return `<div class="sec"><h2>天　象</h2><span class="line"></span><span class="tp">${G.s.cycle} 周目　每颗可花 ${SG.CFG.tx_reroll} 兵符换一次</span></div>
    <div class="txs">${L.map((id, i) => { const t = SG.TXID[id]; return `<div class="tx"><div class="tn">${esc(id)}</div><div class="tg">${esc(t.good)}</div><div class="tb">${esc(t.bad)}</div>${T.used[i] ? '<div class="tiny muted">已换过</div>' : `<span class="btn sm${G.s.tokens >= SG.CFG.tx_reroll ? '' : ' off'}" data-a="tx-reroll" data-i="${i}">换</span>`}</div>`; }).join('')}</div>`;
}
VIEWS.main = () => {
  const s = G.s, gd = G.guide(), owned = Object.keys(s.heroes).length;
  const cleared = Object.keys(s.cleared).length;
  const title = s.title || store.get('sgqyl_title');
  const pend = G.achPending().length;
  return `<div class="banner"><div class="bt">三国群英录</div><div class="bs">九宫对阵　三百五十八人${s.cycle > 1 ? `　${s.cycle} 周目` : ''}</div>${title ? `<div class="btitle">「${esc(title)}」</div>` : ''}</div>
    <div class="stat3"><div><b>${owned}</b><i>已收将</i></div><div><b>${s.formation.filter(Boolean).length}/9</b><i>上阵</i></div><div><b>${cleared}</b><i>已通关</i></div></div>
    ${gd ? `<div class="nextup" data-a="${gd.act === 'stage' ? 'stage' : 'go'}" data-v="${gd.v}" data-id="${gd.v}"><div class="k">下一步</div><div class="v">${esc(gd.txt)}</div><div class="m">${esc(gd.sub)}</div></div>` : ''}
    ${pend ? `<div class="nextup ach-up" data-a="go" data-v="ach"><div class="k">功名</div><div class="v">待领 ${pend} 条</div><div class="m">点进功名簿领赏</div></div>` : ''}
    ${txPanel()}
    <div class="btns"><div class="btn main" data-a="go" data-v="stages">出　征</div><div class="btn" data-a="go" data-v="form">布　阵</div></div>
    ${(s.log || []).length ? `<div class="sec"><h2>最　近</h2><span class="line"></span></div><div class="card small logbox">${s.log.slice(0, 8).map(l => `<div>${esc(l)}</div>`).join('')}</div>` : ''}
    ${(D0.crawl || {}).intro ? `<div class="btns" style="margin-top:20px"><div class="btn" data-a="crawl-intro">重看开篇</div>${s.seenEpi && (D0.crawl || {}).epilogue ? '<div class="btn" data-a="crawl-epi">重看尾声</div>' : ''}</div>` : ''}
    <div class="btns" style="margin-top:20px"><div class="btn" data-a="go" data-v="ach">功名簿</div><div class="btn" data-a="menu">存档导入导出</div>${SG.pwa && SG.pwa.can() ? '<div class="btn" data-a="pwa-install">装到桌面</div>' : ''}</div>
    <div class="btns"><div class="btn" data-a="to-title">回标题</div></div>
    <div class="contact" data-a="copy-wx">有 bug、有想法，加微信说一声：<b>lynchrrr</b><i>点一下复制</i></div>`;
};
function glog(t) { G.s.log = G.s.log || []; G.s.log.unshift(t); G.s.log = G.s.log.slice(0, 30); }

// ---------------- 羁绊 ----------------
function bondVal(b, t) { return `${KEYCN[b.k]} +${Math.round(b.v * (t || 1) * 100)}%`; }
function bondMem(b, team) {
  const T = new Set(team || []);
  return b.mem.map(m => `<span class="bm${T.has(m) ? ' in' : G.s.heroes[m] ? ' own' : ''}">${esc(m)}</span>`).join('');
}
// 布阵页：已凑成的 + 差一两人、人在麾下的
function bondPanel(names) {
  if (G.bondsOff()) return `<div class="card small bonds"><b class="kai">羁绊</b>　<span class="muted">本周目天象「破军」，羁绊不生效</span></div>`;
  const act = SG.activeBonds(names);
  const T = new Set(names), actSet = new Set(act.filter(a => a.t === 1).map(a => a.b));
  const near = SG.BONDS.map(b => {
    const c = b.mem.filter(m => T.has(m)).length, miss = b.mem.filter(m => !T.has(m));
    return { b, c, miss, own: miss.filter(m => G.s.heroes[m]) };
  }).filter(x => x.c >= 1 && !actSet.has(x.b) && x.miss.length <= 2 && x.own.length === x.miss.length)
    .sort((a, b) => a.miss.length - b.miss.length || b.b.v - a.b.v).slice(0, 4);
  if (!act.length && !near.length) return '';
  return `<div class="card small bonds"><b class="kai">羁绊</b>${act.length ? act.map(a => `<div class="bd on"><span class="bn">${esc(a.b.name)}</span>${bondVal(a.b, a.t)}${a.t < 1 ? '<i>凑半</i>' : ''}</div>`).join('') : '<span class="muted">　还没凑成</span>'}
    ${near.length ? `<div class="tiny muted" style="margin-top:4px">再上 ${near.map(x => `${x.miss.map(esc).join('、')} 可成【${esc(x.b.name)}】`).join('；')}</div>` : ''}</div>`;
}
function bondsOfHero(n) {
  const L = D.BONDOF[n] || [];
  if (!L.length) return '';
  return `<div class="sec"><h2>羁绊</h2><span class="line"></span><span class="tp">同时上阵生效</span></div>
    ${L.map(b => `<div class="card small bcard"><div><b class="kai">${esc(b.name)}</b>　${bondVal(b)}${b.mem.length >= 4 ? `<span class="tiny muted">　凑 ${Math.max(2, Math.ceil(b.mem.length / 2))} 人给一半</span>` : ''}</div><div class="bms">${bondMem(b, G.s.formation)}</div>${b.txt ? `<div class="tiny muted">${esc(b.txt)}</div>` : ''}</div>`).join('')}`;
}


// ---------------- 开篇、尾声 ----------------
function crawlHtml(kind) {
  const rows = (D0.crawl || {})[kind] || [];
  let k = 0;
  const sc = (D0.scenes || {})[kind];
  return `<div class="crawl" data-a="crawl-done">${sc ? `<div class="scene-full" style="background-image:url('${sc}')"></div>` : ''}<div class="crawl-in">${rows.map(r => `<div class="${r.h ? 'cr-h' : 'cr-p'}" style="animation-delay:${(k++ * 1.6).toFixed(1)}s">${esc(r.h || r.p)}</div>`).join('')}</div><div class="crawl-skip">轻触继续</div></div>`;
}
function showCrawl(kind, then) {
  if (!((D0.crawl || {})[kind] || []).length) { if (then) then(); return false; }
  V.crawlThen = then || null; V.crawlKind = kind;
  $('app').innerHTML = crawlHtml(kind); window.scrollTo(0, 0);
  return true;
}
// ---------------- 功名簿 ----------------
VIEWS.ach = () => {
  const A = SG.ACH, st = G.s.ach || {};
  const done = A.filter(a => st[a.id]).length, pend = G.achPending();
  let h = `<div class="stele"><div class="st-t">功 名 簿</div><div class="st-s">达成了自己来领</div><div class="st-n"><b>${done}</b> / ${A.length}</div></div>`;
  if (pend.length) h += `<div class="btns"><div class="btn main" data-a="ach-all">全部领取（${pend.length} 条）</div></div>`;
  const T = G.s.titles || [];
  if (T.length) h += `<div class="sec"><h2>称号</h2><span class="line"></span><span class="tp">挂在大帐上</span></div><div class="codex">${T.map(t => `<span class="cx ${G.s.title === t ? 'c-无双' : ''}" data-a="title-set" data-t="${esc(t)}">${esc(t)}</span>`).join('')}${G.s.title ? '<span class="cx no" data-a="title-set" data-t="" style="cursor:pointer">不挂</span>' : ''}</div>`;
  for (const cat of SG.ACH_CATS) {
    const L = A.filter(a => a.cat === cat);
    h += `<div class="sec"><h2>${cat}</h2><span class="line"></span><span class="tp">${L.filter(a => st[a.id]).length}/${L.length}</span></div>`;
    h += L.map(a => {
      const k = st[a.id] || 0, hide = a.hidden && !k;
      return `<div class="ach${k === 2 ? ' got' : k === 1 ? ' pend' : ''}"><div class="grow"><div><b class="kai">${hide ? '？？？' : esc(a.name)}</b><span class="tier t-${a.tier}">${a.tier}</span>${a.title && !hide ? `<span class="tiny muted">　称号「${esc(a.title)}」</span>` : ''}</div>
        <div class="tiny muted">${hide ? '点名的彩蛋，碰上了才知道' : esc(a.cond)}　·　${SG.rewardText(a.tier)}</div></div>
        ${k === 1 ? `<span class="btn sm main" data-a="ach-claim" data-id="${esc(a.id)}">领</span>` : k === 2 ? '<span class="small muted">已领</span>' : ''}</div>`;
    }).join('');
  }
  return h;
};
// ---------------- 图鉴 ----------------
VIEWS.codex = () => {
  const own = D.HLIST.filter(n => G.s.heroes[n]).length;
  let h = `<div class="stele"><div class="st-t">群 英 录</div><div class="st-s">名字先写好，人后来到</div><div class="st-n"><b>${own}</b> / ${D.HLIST.length}</div></div>`;
  for (const f of ['魏', '蜀', '吴', '汉', '无']) {
    const L = D.HLIST.filter(n => D.H[n]['阵营'] === f).sort((a, b) => SG.TIER_ORDER.indexOf(D.H[b]['品阶']) - SG.TIER_ORDER.indexOf(D.H[a]['品阶']));
    const o = L.filter(n => G.s.heroes[n]).length;
    h += `<div class="sec"><h2>${f === '无' ? '群雄' : f} ${o}/${L.length}</h2><span class="line"></span></div><div class="codex">${L.map(n => {
      const has = !!G.s.heroes[n];
      return `<span class="cx ${has ? 'c-' + D.H[n]['品阶'] : 'no'}"${has ? ` data-a="hero" data-n="${esc(n)}"` : ''}>${has ? esc(n) : '？'}</span>`; }).join('')}</div>`;
  }
  const ex = Object.keys(D.EXCL);
  const haveIds = new Set(G.s.bag.map(it => it.id));
  h += `<div class="sec"><h2>专属套装</h2><span class="line"></span><span class="tp">${ex.filter(n => D.EXCL[n].every(e => haveIds.has(e.id))).length}/${ex.length} 套凑齐</span></div><div class="codex">${ex.map(n => {
    const k = D.EXCL[n].filter(e => haveIds.has(e.id)).length;
    return `<span class="cx ${k ? 'c-无双' : 'no'}" data-a="eq-info" data-id="${esc(D.EXCL[n][0].id)}">${esc((D0.sets[n] || {}).set || n)}<small>${k}/4</small></span>`; }).join('')}</div>`;
  const full = SG.BONDS.filter(b => b.mem.every(m => G.s.heroes[m])).length;
  h += `<div class="sec"><h2>羁绊</h2><span class="line"></span><span class="tp">${full}/${SG.BONDS.length} 条人已收齐</span></div>`;
  h += SG.BONDS.map(b => `<div class="brow${b.mem.every(m => G.s.heroes[m]) ? ' ok' : ''}"><b class="kai">${esc(b.name)}</b><span class="tiny">${bondVal(b)}</span><div class="bms">${bondMem(b)}</div>${b.txt ? `<div class="tiny muted">${esc(b.txt)}</div>` : ''}</div>`).join('');
  return h;
};
function chapCard(c) {
  const info = (D0.story.chapters || {})[c] || {}, C = D.CHAPTERS[c];
  const sc = ((D0.scenes || {}).ch || {})[c];
  openModal(`<div class="chapcard" data-a="close">${sc ? `<div class="cc-scene" style="background-image:url('${sc}')"></div>` : ''}<div class="cc-ch">第 ${c} 章</div><div class="cc-t">${esc(C.name)}</div>${info.year ? `<div class="cc-y">${esc(info.year)}</div>` : ''}<div class="cc-rule"></div><div class="cc-l">${esc(info.intro || '')}</div><div class="cc-go">轻触继续</div></div>`);
}
VIEWS.stages = () => {
  let h = '';
  if (G.allCleared()) h += `<div class="card small">终章打完了。可以开第 ${G.s.cycle + 1} 周目：敌方等级、星级整体上调，杂兵换成名将，所有来源 ×1.5。<div class="btns"><div class="btn main" data-a="new-cycle">开第 ${G.s.cycle + 1} 周目</div></div></div>`;
  const cur = G.curChapter();
  for (let c = D.CHAPTERS.length - 1; c >= 1; c--) {
    const C = D.CHAPTERS[c]; if (!C) continue;
    const unlocked = C.stages.some(s => G.stageUnlocked(s.id));
    if (!unlocked) continue;
    const done = C.stages.filter(s => G.isCleared(s.id)).length;
    const open = V.open[c] != null ? V.open[c] : (c === cur && unlocked);
    const info = (D0.story.chapters || {})[c] || {};
    h += `<div class="chap${unlocked ? '' : ' lock'}">
      <div class="hd" data-a="chap" data-c="${c}"><span class="no">第${c}章</span><span class="nm">${esc(C.name)}</span><span class="pg">${done}/${C.stages.length}</span></div>`;
    if (open && unlocked) {
      h += `<div class="body">${info.intro ? `<div class="intro">${info.year ? `<span class="muted">${esc(info.year)}　</span>` : ''}${esc(info.intro)}</div>` : ''}`;
      for (const s of C.stages.slice().reverse()) {
        const ul = G.stageUnlocked(s.id), ok = G.isCleared(s.id);
        if (!ul) continue;
        const foe = G.foesOf(s.id);
        const lp = SG.limitParts(s);
        h += `<div class="stg${ul ? '' : ' lock'}" data-a="${ul ? 'stage' : 'locked'}" data-id="${s.id}">
          <span class="ty ty-${s['类型']}">${s['类型']}</span>
          <span class="nm">${esc(s['关'])}${lp.rules.length ? '<span class="lim">限</span>' : ''}${(() => { const x = G.exclOf(s.id); return x ? `<span class="lim zhuan${x.done ? ' done' : ''}">专</span>` : ''; })()}</span>
          <span class="lv">${foe.lv}级 ${'★'.repeat(foe.star)}</span>
          ${ok ? '<span class="ok">✓</span>' : ''}</div>`;
      }
      h += '</div>';
    }
    h += '</div>';
  }
  return h;
};
// 关卡页的专属掉落：出处关（V0.6）＋本关出场无双（老掉法）
const exLink = n => `<span data-a="eq-info" data-id="${esc(D.EXCL[n][0].id)}" style="text-decoration:underline">${esc((D0.sets[n] || {}).set || n)}</span>`;
function exDropHtml(x, replay) {
  const src = x.src.map(o => `<div>出处：${exLink(o.n)}（${esc(o.n)}）${o.miss ? `，缺 ${o.miss} 件${replay && o.tok ? `　信物 ${o.tok}/${SG.CFG.src_token}` : ''}` : '，四件齐了'}</div>`).join('');
  const old = x.L.length ? `<div>可能掉落（${Math.round(x.pe * 100)}%）：${x.L.map(o => `${exLink(o.n)}（${esc(o.n)}，${o.miss ? `缺 ${o.miss} 件` : '齐了'}）`).join('、')}</div>` : '';
  return `<div class="small" style="color:var(--zhu);margin-top:4px">${src}${old}</div>`;
}
const exSrcHtml = n => { const L = D.EXSRC_OF[n]; return L ? `出处：${L.map(id => `<span data-a="src-stage" data-id="${id}" style="text-decoration:underline">${esc(D.STAGE[id]['关'])}</span>`).join('、')}${(G.s.token || {})[n] ? `　信物 ${G.s.token[n]}/${SG.CFG.src_token}` : ''}` : ''; };
function stageSheet(id) {
  const s = D.STAGE[id];
  const foe = G.foesOf(id);
  const txt = (D0.story.stages || {})[`${s['章']}|${s['关']}`] || '';
  const lp = SG.limitParts(s), lim = SG.stageLimit(s);
  const replay = G.isCleared(id);
  const left = replay ? G.replayLeft(id) : 3;
  const typ = s['类型'];
  const mul = typ === '章末' ? 3 : typ === '隐藏' ? 5 : 1;
  const gold = replay ? SG.CFG.gold_replay(foe.lv) : SG.CFG.gold_clear(foe.lv) * mul;
  const foes = foe.names.map(n => {
    const h = D.H[n];
    return `<div class="foe">${por(n, 's')}<div class="nm">${h ? TSEAL(h['品阶']) + ' ' : ''}${esc(n)}</div></div>`;
  }).join('');
  const my = G.teamPower(), fp = G.stagePower(id), r = fp ? my / fp : 9;
  const verdict = r >= 1.35 ? ['稳操胜券', 'v-ok'] : r >= 1.1 ? ['略占上风', 'v-ok'] : r >= 0.9 ? ['势均力敌', 'v-mid'] : r >= 0.7 ? ['颇为吃力', 'v-bad'] : ['恐难取胜', 'v-bad'];
  const vsbar = `<div class="vsbar"><div class="side"><b>${num(my)}</b><i>我方现阵</i></div><div class="mid ${verdict[1]}">${verdict[0]}</div><div class="side"><b>${num(fp)}</b><i>敌方</i></div></div><div class="pbar"><em style="width:${clamp(my / (my + fp) * 100, 4, 96)}%"></em></div>`;
  const exDrop = G.exclOf(id);
  const scb = ((D0.scenes || {}).ch || {})[+s['章']];
  openModal(`${scb ? `<div class="sc-band" style="background-image:url('${scb}')"></div>` : ''}<div class="shead"><span class="ty ty-${typ}" style="font-size:.6em;padding:1px 5px;border-radius:2px;color:#fff">${typ}</span>${esc(s['关'])}<span class="x" data-a="close">关闭</span></div>
    ${txt ? `<div class="story">${esc(txt)}</div>` : ''}
    ${lp.flavor.length ? `<div class="small muted">${lp.flavor.map(esc).join('；')}</div>` : ''}
    ${lp.rules.length ? `<div class="card small" style="border-color:var(--zhu)"><b class="kai" style="color:var(--zhu)">关卡限制</b>　${lp.rules.map(esc).join('；')}</div>` : ''}
    ${vsbar}
    <div class="sec"><h2>敌方</h2><span class="line"></span><span class="tp">${foe.lv} 级　${'★'.repeat(foe.star)}　${foe.names.length} 人</span></div>
    <div class="foes">${foes}</div>
    ${(() => { const fb = SG.activeBonds(foe.names); return fb.length ? `<div class="small" style="margin-top:6px">敌方羁绊：${fb.map(a => `【${esc(a.b.name)}】${bondVal(a.b, a.t)}`).join('　')}</div>` : ''; })()}
    <div class="small muted" style="margin-top:6px">${replay ? `复刷：${num(Math.round(gold * G.goldMul()))} 金，${G.txHas('贪狼') ? '四成掉一件低两档' : '两成掉一件低一档'}的装备。` : `首通：${num(Math.round(gold * G.goldMul()))} 金${(() => { const g2 = (SG.CFG.gold2_clear[typ] || 0) * (G.s.cycle >= 2 ? 2 : 1) + (G.txHas('天狼') ? 1 : 0); return g2 ? `、黄金 ${g2}` : ''; })()}，必掉${G.txHas('贪狼') ? '两件' : '一件'}装备。`}</div>
    ${exDrop ? exDropHtml(exDrop, replay) : ''}
    <div class="btns"><div class="btn main${replay && left <= 0 ? ' off' : ''}" data-a="to-form" data-id="${id}">${lim.max < 9 ? `布阵（限 ${lim.max} 人）` : '布阵出战'}</div>${replay ? `<div class="btn${left > 0 ? '' : ' off'}" data-a="sweep" data-id="${id}">速战</div>` : ''}</div>
    ${replay ? '<div class="tiny muted" style="margin-top:4px">速战：用现在的阵容直接出结果，不看演出。</div>' : ''}`);
}

// ---------------- 将领列表 ----------------
function sortedHeroes() {
  const T = SG.TIER_ORDER;
  let L = Object.keys(G.s.heroes);
  const f = V.filt;
  if (f.fac !== '全') L = L.filter(n => D.H[n]['阵营'] === f.fac);
  if (f.tier !== '全') L = L.filter(n => D.H[n]['品阶'] === f.tier);
  if (f.role !== '全') L = L.filter(n => D.H[n]['定位'] === f.role);
  if (f.frag) L = L.filter(n => G.ownStarReady(n));
  const pw = {}; L.forEach(n => pw[n] = G.power(n));
  if (V.sort === 'power') L.sort((a, b) => pw[b] - pw[a]);
  else if (V.sort === 'tier') L.sort((a, b) => T.indexOf(D.H[b]['品阶']) - T.indexOf(D.H[a]['品阶']) || pw[b] - pw[a]);
  else if (V.sort === 'lv') L.sort((a, b) => G.hero(b).lv - G.hero(a).lv || pw[b] - pw[a]);
  return L;
}
function inTeam(n) { return G.s.formation.includes(n); }
function guardOf(n) { return G.kind === 'conquest' ? G.guards()[n] : null; }
function heroCard(n, act, extraCls = '') {
  const h = D.H[n], s = G.hero(n);
  const r = s.hp / (s.lv * 1000);
  return `<div class="hc${inTeam(n) ? ' inteam' : ''}${extraCls}" data-a="${act}" data-n="${esc(n)}">
    <span class="tag">${TSEAL(h['品阶'])}${guardOf(n) ? ` <span class="seal" style="background:var(--ink-2)">守${esc(guardOf(n))}</span>` : ''}</span>${G.canStar(n) ? '<span class="dot"></span>' : ''}
    ${por(n)}
    <div class="nm">${facTag(h['阵营'])}${esc(n)}</div>
    <div class="meta"><span>${s.lv}级</span><span class="stars">${stars(s.star)}</span></div>
    <div class="bar"><em class="${r < .5 ? 'low' : ''}" style="width:${clamp(r * 100, 0, 100)}%"></em></div></div>`;
}
function filterBar() {
  const chip = (k, v, t) => `<span class="chip${V.filt[k] === v ? ' on' : ''}" data-a="filt" data-k="${k}" data-v="${v}">${t || v}</span>`;
  const sch = (v, t) => `<span class="chip${V.sort === v ? ' on' : ''}" data-a="sort" data-v="${v}">${t}</span>`;
  return `<div class="filters">${['全', '魏', '蜀', '吴', '汉', '无'].map(v => chip('fac', v, v === '无' ? '群' : v)).join('')}</div>
    <div class="filters">${['全', '无双', '虎', '名', '骁', '校'].map(v => chip('tier', v)).join('')}<span style="width:8px"></span>${['全', '武将', '文臣', '辅助'].map(v => chip('role', v)).join('')}</div>
    <div class="filters"><span class="small muted">排序</span>${sch('power', '战力')}${sch('tier', '品阶')}${sch('lv', '等级')}<span style="width:8px"></span><span class="chip${V.filt.frag ? ' on' : ''}" data-a="filt-frag">碎片够</span></div>`;
}
VIEWS.heroes = () => {
  const L = sortedHeroes();
  const ready = Object.keys(G.s.heroes).filter(n => G.ownStarReady(n)).length;
  return `<div class="sec"><h2>将领</h2><span class="line"></span><span class="tp">${Object.keys(G.s.heroes).length} / ${D.HLIST.length}</span></div>
    ${filterBar()}
    <div class="btns" style="margin:0 0 8px"><div class="btn sm${ready ? ' main' : ' off'}" data-a="star-all">一键升星${ready ? `（${ready} 人）` : ''}</div></div>
    <div class="tiny muted" style="margin-bottom:8px">一键升星只花本人碎片，不动兵符。要兵符补的进详情页自己升。</div><div class="hgrid">${L.map(n => heroCard(n, 'hero')).join('') || '<div class="empty">没有</div>'}</div>`;
};

// ---------------- 将领详情 ----------------
function eqStatTxt(row, owner) {
  const own = row['归属'] && row['归属'] === owner;
  const f = parseFloat(row['固定']) * (own ? 1.5 : 1);
  return `${KEYCN[row['维']] || row['维']} +${Math.round(f)}${+row['百分比'] ? ` +${row['百分比']}%` : ''}`;
}
function skillHtml(n, sk) {
  const r = D.SKROW[n];
  const set4 = G.panel(n).set4;
  const st = D0.sets[n];
  return `<div class="skill"><span class="sn">${esc(r['技能'])}</span><span class="st">${esc(r['类型'])}</span>${r['发动'] && r['发动'] !== '—' ? `<span class="st">发动 ${esc(r['发动'])}</span>` : ''}
    <p>${esc(r['文案'])}</p>${set4 && st ? `<p style="color:var(--zhu)">四件已齐：${esc(st.four)}</p>` : ''}</div>`;
}
VIEWS.hero = () => {
  const n = V.hero, h = D.H[n], s = G.hero(n);
  if (!s) { V.view = 'heroes'; return VIEWS.heroes(); }
  const p = G.panel(n);
  const grow = { atk: '武成长', def: '统成长', int: '智成长', agi: '速成长' };
  const maxLv = G.maxLv();
  const c1 = G.trainCost(n, Math.min(maxLv, s.lv + 1)), c10 = G.trainCost(n, Math.min(maxLv, s.lv + 10));
  const need = G.starNeed(n);
  const rc = G.recruitCost(n);
  const st = D0.sets[n];
  const slots = SG.SLOTS.map(sl => {
    const uid = (G.s.gear[n] || {})[sl];
    const it = uid != null ? G.item(uid) : null;
    const row = it ? D.EQID[it.id] : null;
    return `<div class="slot${row ? ' fill' : ''}" data-a="slot" data-sl="${sl}"><div class="sl">${sl}</div>${row ? `<div class="en">${eqSeal(row)} ${esc(row['名'])}</div><div class="tiny muted">${eqStatTxt(row, n)}</div>` : '<div class="tiny muted">空</div>'}</div>`;
  }).join('');
  let exHtml = '';
  if (D.EXCL[n]) {
    const own = D.EXCL[n].map(e => {
      const have = G.s.bag.some(it => it.id === e.id), on = G.gearIds(n).includes(e.id);
      return `<span class="small" style="margin-right:8px;${on ? 'color:var(--zhu)' : have ? '' : 'color:var(--ink-4)'}">${esc(e['名'])}${on ? '·穿' : have ? '·有' : ''}</span>`;
    }).join('');
    exHtml = `<div class="card small"><b class="kai">专属·${esc(st ? st.set : '')}</b><div>${own}</div>${G.kind === 'conquest' ? '' : `<div class="tiny" style="margin-top:2px">${exSrcHtml(n)}</div>`}${st ? `<div class="muted tiny" style="margin-top:4px">武器：${esc(st.w)}<br>宝物：${esc(st.t)}<br>两件：主属性 +6%　四件：主属性、统率再 +6%；${esc(st.four)}</div>` : ''}</div>`;
  }
  const L = sortedHeroes(), i = L.indexOf(n);
  return `<div class="row" style="margin-bottom:8px"><span class="btn sm" data-a="go" data-v="heroes">← 将领</span><span class="grow"></span>
      ${i > 0 ? `<span class="btn sm" data-a="hero" data-n="${esc(L[i - 1])}">上一个</span>` : ''}${i >= 0 && i < L.length - 1 ? `<span class="btn sm" data-a="hero" data-n="${esc(L[i + 1])}">下一个</span>` : ''}</div>
    <div class="hd-top">${por(n, 'l')}<div class="info">
      <div class="hd-name">${esc(n)}</div>
      <div class="row wrap" style="margin:4px 0">${TSEAL(h['品阶'])}${facTag(h['阵营'])}<span class="small muted">${esc(h['定位'])}</span></div>
      <div class="small muted">${esc(h['特点'])}</div>
      <div style="margin-top:6px"><span class="kai" style="font-size:1.2em">${s.lv}</span> 级　<span class="stars">${stars(s.star)}</span></div>
      <div class="small">兵力 ${num(s.hp)} / ${num(s.lv * 1000)}</div>
      ${s.lv < maxLv ? `<div class="small muted">经验 ${num(s.exp || 0)} / ${num(SG.CFG.exp_need(s.lv))}</div><div class="bar xp" style="margin:3px 0"><em style="width:${clamp((s.exp || 0) / SG.CFG.exp_need(s.lv) * 100, 0, 100)}%"></em></div>` : ''}
      <div class="bar" style="margin:3px 0"><em class="${s.hp / (s.lv * 1000) < .5 ? 'low' : ''}" style="width:${clamp(s.hp / (s.lv * 10), 0, 100)}%"></em></div>
      <div class="small muted">碎片 ${s.frag}${s.star < 5 ? `　升星要 ${need}` : ''}</div>
    </div></div>
    <div class="stat4">${['atk', 'def', 'int', 'agi'].map(k => `<div><span>${KEYCN[k]}</span><span><b>${Math.round(p[k])}</b><small>+${h[grow[k]]}/级</small></span></div>`).join('')}</div>
    ${h['生平'] ? `<div class="bio"><div class="bh kai">生平</div>${h['生平'].split('｜').map(t => `<p>${esc(t)}</p>`).join('')}</div>` : ''}
    ${skillHtml(n)}
    <div class="btns">
      <div class="btn sm${s.lv < maxLv && G.s.gold >= c1 ? '' : ' off'}" data-a="train" data-k="1">练 1 级<br><span class="tiny">${s.lv < maxLv ? c1 + ' 金' : '已满'}</span></div>
      <div class="btn sm${G.canStar(n) ? ' main' : ' off'}" data-a="star">升星<br><span class="tiny">${s.star >= 5 ? '已满' : `碎片 ${Math.min(s.frag, need)} + 兵符 ${Math.max(0, need - s.frag)}`}</span></div>
      <div class="btn sm${rc > 0 && G.s.gold >= rc ? '' : ' off'}" data-a="recruit">征兵<br><span class="tiny">${rc > 0 ? rc + ' 金' : '满员'}</span></div>
    </div>
    <div class="sec"><h2>装备</h2><span class="line"></span><span class="tp">点格子换</span></div>
    <div class="slots">${slots}</div>${exHtml}${bondsOfHero(n)}`;
};
function slotPicker(n, sl) {
  const cur = (G.s.gear[n] || {})[sl];
  const items = G.s.bag.filter(it => D.EQID[it.id]['槽'] === sl)
    .map(it => ({ it, row: D.EQID[it.id], who: G.equippedBy(it.uid) }))
    .sort((a, b) => eqTi(b.row) - eqTi(a.row) || (b.row['归属'] === n) - (a.row['归属'] === n) || parseFloat(b.row['固定']) - parseFloat(a.row['固定']));
  const list = items.map(({ it, row, who }) => `<div class="item"><span>${eqSeal(row)}</span><div class="grow"><div class="en">${esc(row['名'])}${row['归属'] ? `<span class="tiny muted">　${esc(row['归属'])}专属</span>` : ''}</div>
      <div class="ed">${eqStatTxt(row, n)}${row['DSL'] && D0.sets[row['归属']] ? '　' + esc(sl === '武器' ? D0.sets[row['归属']].w : sl === '宝物' ? D0.sets[row['归属']].t : '') : ''}${who ? `　<span style="color:var(--zhu)">${esc(who)}穿着</span>` : ''}</div></div>
      ${it.uid === cur ? '<span class="small muted">穿着</span>' : `<span class="btn sm" data-a="equip" data-uid="${it.uid}">穿</span>`}</div>`).join('');
  openModal(`<div class="shead">${esc(n)}的${sl}<span class="x" data-a="close">关闭</span></div>
    ${cur != null ? `<div class="btns" style="margin-top:0;margin-bottom:6px"><div class="btn sm" data-a="unequip" data-sl="${sl}">卸下</div></div>` : ''}
    ${list || '<div class="empty">行囊里没有' + sl + '</div>'}`);
}

// ---------------- 布阵 ----------------
const ROWLAB = ['前排', '中排', '后排'];
function formPool() { return V.cq && SG.Conq ? SG.Conq.pool() : Object.keys(G.s.heroes); }
VIEWS.form = () => {
  const st = !V.cq && V.stage ? D.STAGE[V.stage] : null;
  const lim = st ? SG.stageLimit(st) : { max: 9 };
  const F = G.s.formation;
  const cnt = F.filter(Boolean).length;
  let grid = '';
  for (let r = 0; r < 3; r++) {
    grid += `<div class="rowlab" style="grid-column:1/4">${ROWLAB[r]}</div>`;
    for (let c = 0; c < 3; c++) {
      const i = r * 3 + c, n = F[i];
      if (n && G.hero(n)) {
        const s = G.hero(n), ratio = s.hp / (s.lv * 1000);
        grid += `<div class="gcell${V.sel === i ? ' sel' : ''}" data-a="cell" data-i="${i}">${por(n)}<div class="gn">${esc(n)} Lv.${s.lv}${s.lv < G.maxLv() && (s.exp || 0) >= SG.CFG.exp_need(s.lv) * .9 ? '<i class="xpdot"></i>' : ''}</div><div class="bar"><em class="${ratio < .5 ? 'low' : ''}" style="width:${clamp(ratio * 100, 0, 100)}%"></em></div></div>`;
      } else grid += `<div class="gcell empty-c${V.sel === i ? ' sel' : ''}" data-a="cell" data-i="${i}">空</div>`;
    }
  }
  const names = F.filter(Boolean);
  const rc = G.recruitAllCost(names);
  const pool = new Set(formPool());
  const L = sortedHeroes().filter(n => pool.has(n));
  const head = V.cq && SG.Conq ? SG.Conq.formHead() : '';
  return `${head}${st ? `<div class="card small"><b class="kai">${esc(st['关'])}</b>　${SG.stageFoes(st, G.s.cycle).lv} 级${lim.max < 9 ? `　<span style="color:var(--zhu)">只能带 ${lim.max} 人</span>` : ''}${SG.limitParts(st).rules.length ? `<div class="muted">${SG.limitParts(st).rules.map(esc).join('；')}</div>` : ''}</div>` : ''}
    <div class="sec"><h2>布阵</h2><span class="line"></span><span class="tp">${cnt} / ${lim.max} 人　总战力 ${num(G.teamPower())}</span></div>
    <div class="grid9">${grid}</div>
    ${bondPanel(names)}
    <div class="btns nowrap">
      <div class="btn sm main" data-a="form-auto">一键上阵</div>
      <div class="btn sm" data-a="auto-equip">一键装备</div>
      <div class="btn sm" data-a="strip-team">一键卸装</div>
    </div>
    <div class="btns nowrap" style="margin-top:8px">
      <div class="btn sm" data-a="form-clear">清空</div>
      <div class="btn sm${rc > 0 && G.s.gold >= rc ? '' : ' off'}" data-a="recruit-all">征兵${rc > 0 ? ' ' + num(rc) + ' 金' : ''}</div>
    </div>
    ${st ? `<div class="btns"><div class="btn" data-a="go" data-v="stages">回去</div><div class="btn main${cnt && cnt <= lim.max ? '' : ' off'}" data-a="fight">出战</div></div>` : ''}
    ${V.cq && SG.Conq ? SG.Conq.formButtons(cnt) : ''}
    <div class="sec"><h2>${V.sel != null ? `选人放进${ROWLAB[Math.floor(V.sel / 3)]}第 ${V.sel % 3 + 1} 格` : '点人上阵，点阵上的人换位或下阵'}</h2><span class="line"></span></div>
    ${filterBar()}
    <div class="hgrid">${L.map(n => heroCard(n, 'pick')).join('')}</div>`;
};
function autoForm(max) {
  const L = formPool().filter(n => G.hero(n).hp >= 1).sort((a, b) => G.power(b) - G.power(a)).slice(0, max);
  // 统率高的放前排
  const byDef = L.slice().sort((a, b) => G.panel(b).def - G.panel(a).def);
  const F = [null, null, null, null, null, null, null, null, null];
  const order = [1, 0, 2, 4, 3, 5, 7, 6, 8];
  byDef.forEach((n, k) => F[order[k]] = n);
  G.s.formation = F;
}

// ---------------- 招贤 ----------------
VIEWS.tavern = () => {
  const s = G.s, C = SG.CFG;
  const tp = G.tokenPrice();
  return `<div class="sec"><h2>招贤</h2><span class="line"></span><span class="tp">累计 ${s.draws} 抽</span></div>
    <div class="card small">校 40%　骁 30%　名 20%　虎 8%　无双 2%。十连至少一个名档；再抽 ${Math.max(0, 50 - s.sinceHu)} 次内必出虎档以上。重复的人给 3 片碎片。</div>
    <div class="btns"><div class="btn${s.gold >= C.draw ? '' : ' off'}" data-a="draw" data-k="1">单抽<br><span class="tiny">${C.draw} 金</span></div>
      <div class="btn main${s.gold >= C.draw10 ? '' : ' off'}" data-a="draw" data-k="10">十连<br><span class="tiny">${num(C.draw10)} 金</span></div></div>
    ${G.kind === 'conquest' ? `<div class="small muted">霸业里只招得到本阵营和无阵营的人，别家的人靠招降。</div>` : `<div class="btns"><div class="btn qing${s.gold2 >= C.gold2_draw ? '' : ' off'}" data-a="draw-gold">黄金求贤<br><span class="tiny">${C.gold2_draw} 黄金，必出虎档以上</span></div></div>`}
    <div class="sec"><h2>兵符</h2><span class="line"></span><span class="tp">手里 ${s.tokens} 枚</span></div>
    <div class="card small">万能碎片，升星时顶本人碎片用。${tp} 金一枚，每买十枚涨 25，涨到 1000 为止；本周目已买 ${s.tokensBought} 枚。</div>
    <div class="btns"><div class="btn${s.gold >= tp ? '' : ' off'}" data-a="token" data-k="1">买 1 枚<br><span class="tiny">${tp} 金</span></div>
      <div class="btn${s.gold >= G.tokenCost(10) ? '' : ' off'}" data-a="token" data-k="10">买 10 枚<br><span class="tiny">${num(G.tokenCost(10))} 金</span></div></div>`;
};
function pullSheet(res, title) {
  const cards = res.map(r => { const h = D.H[r.name]; return `<div class="pull">${por(r.name)}<div class="nm c-${h['品阶']}">${esc(r.name)}</div><div class="${r.dup ? 'muted' : 'new'}">${r.dup ? '碎片 +3' : '新'}</div></div>`; }).join('');
  openModal(`<div class="shead">${title}<span class="x" data-a="close">关闭</span></div><div class="pulls">${cards}</div>`);
}

// ---------------- 铁匠铺 ----------------
VIEWS.forge = () => {
  const s = G.s, C = SG.CFG;
  const cap = Math.min(4, C.drop_tier(G.curChapter()) + 1);
  return `<div class="sec"><h2>铁匠铺</h2><span class="line"></span><span class="tp">累计 ${s.smithDraws} 次</span></div>
    <div class="card small">凡品 35%　良品 30%　精品 20%　珍品 10%　神品 4%　专属 1%。十连至少一件精品；再打 ${Math.max(0, 40 - s.sinceZhen)} 次内必出珍品以上。${G.kind === 'conquest' ? '' : `<br>眼下最高打到 <b class="e${cap}">${SG.EQ_TIERS[cap]}</b>，往后打章节会放开。`}</div>
    <div class="btns"><div class="btn${s.gold >= C.smith ? '' : ' off'}" data-a="smith" data-k="1">打一件<br><span class="tiny">${C.smith} 金</span></div>
      <div class="btn main${s.gold >= C.smith10 ? '' : ' off'}" data-a="smith" data-k="10">打十件<br><span class="tiny">${num(C.smith10)} 金</span></div></div>`;
};

// ---------------- 行囊 ----------------
VIEWS.bag = () => {
  const sl = V.bagSlot, sm = !!V.sellMode, sel = V.sellSel || (V.sellSel = new Set());
  let L = G.s.bag.map(it => ({ it, row: D.EQID[it.id], who: G.equippedBy(it.uid) }));
  if (sl !== '全') L = L.filter(x => x.row['槽'] === sl);
  L.sort((a, b) => eqTi(b.row) - eqTi(a.row) || a.row['槽'].localeCompare(b.row['槽']) || parseFloat(b.row['固定']) - parseFloat(a.row['固定']));
  const canSell = x => !x.row['归属'] && !x.who;
  const junk = G.s.bag.filter(it => { const r = D.EQID[it.id]; return !r['归属'] && !G.equippedBy(it.uid) && (r['档'] === '凡品' || r['档'] === '良品'); });
  const junkV = junk.reduce((a, it) => a + SG.CFG.sell[D.EQID[it.id]['档']], 0);
  for (const u of [...sel]) if (!G.item(u)) sel.delete(u);
  const selV = [...sel].reduce((a, u) => a + SG.CFG.sell[D.EQID[G.item(u).id]['档']], 0);
  const head = sm
    ? `<div class="filters">${SG.EQ_TIERS.map(t => `<span class="chip" data-a="sell-tier" data-v="${t}">勾${t}</span>`).join('')}<span class="chip" data-a="sell-none">全不勾</span></div>
       <div class="sellbar"><span>已勾 <b>${sel.size}</b> 件，合计 <b>${num(selV)}</b> 金</span><span class="grow"></span><span class="btn sm" data-a="sell-mode">取消</span><span class="btn sm main${sel.size ? '' : ' off'}" data-a="sell-do">卖掉</span></div>`
    : `<div class="btns" style="margin-top:0">${junk.length ? `<div class="btn sm" data-a="sell-junk">卖掉没穿的凡品良品 ${junk.length} 件，得 ${junkV} 金</div>` : ''}<div class="btn sm" data-a="sell-mode">批量出售</div></div>`;
  return `<div class="sec"><h2>行囊</h2><span class="line"></span><span class="tp">${G.s.bag.length} 件</span></div>
    <div class="filters">${['全', ...SG.SLOTS].map(v => `<span class="chip${sl === v ? ' on' : ''}" data-a="bagslot" data-v="${v}">${v}</span>`).join('')}</div>
    ${head}
    <div class="card" style="padding:4px 10px">${L.map(x => { const { it, row, who } = x; return `<div class="item${sm && sel.has(it.uid) ? ' picked' : ''}">${eqSeal(row)}<div class="grow" data-a="eq-info" data-id="${esc(row.id)}" data-uid="${it.uid}"><div class="en">${esc(row['名'])}<span class="tiny muted">　${row['槽']}${row['归属'] ? '·' + esc(row['归属']) + '专属' : ''}</span></div>
      <div class="ed">${eqStatTxt(row, who || '')}${who ? `　<span style="color:var(--zhu)">${esc(who)}穿着</span>` : ''}</div></div>
      ${sm ? (canSell(x) ? `<span class="btn sm${sel.has(it.uid) ? ' main' : ''}" data-a="sell-tog" data-uid="${it.uid}">${sel.has(it.uid) ? '已勾' : '勾'}</span>` : '<span class="tiny muted">不能卖</span>')
        : row['归属'] ? '' : `<span class="btn sm" data-a="sell" data-uid="${it.uid}">卖 ${SG.CFG.sell[row['档']]}</span>`}</div>`; }).join('') || '<div class="empty">空的</div>'}</div>`;
};
// 装备详情：行囊、图鉴、掉落提示里点装备名
function eqInfo(id, uid) {
  const row = D.EQID[id]; if (!row) return;
  const own = row['归属'], st = own ? D0.sets[own] : null;
  const who = uid != null ? G.equippedBy(+uid) : null;
  const have = G.s.bag.filter(it => it.id === id).length;
  let fx = '';
  if (st) {
    const w = row['槽'] === '武器' ? st.w : row['槽'] === '宝物' ? st.t : '';
    fx = `<div class="card small"><b class="kai">专属·${esc(st.set)}</b>　${esc(own)}本人穿：固定值 ×1.5${w ? `<br>${esc(row['槽'])}特效：${esc(w)}` : ''}<br>两件：主属性 +6%<br>四件：主属性、统率再 +6%；${esc(st.four)}
      <div class="tiny muted" style="margin-top:4px">这套四件：${D.EXCL[own].map(e => `<span style="${G.s.bag.some(it => it.id === e.id) ? '' : 'color:var(--ink-4)'}">${esc(e['名'])}</span>`).join('、')}</div>${G.kind === 'conquest' ? '' : `<div class="tiny" style="margin-top:2px">${exSrcHtml(own)}</div>`}</div>`;
  }
  openModal(`<div class="shead">${eqSeal(row)} ${esc(row['名'])}<span class="x" data-a="close">关闭</span></div>
    <div class="small">${esc(row['档'])}　${esc(row['槽'])}　${eqStatTxt(row, own || '')}</div>
    ${fx}
    <div class="small muted" style="margin-top:6px">${have ? `行囊里有 ${have} 件` : '还没有'}${who ? `，${esc(who)}穿着这件` : ''}${own ? '' : `　卖 ${SG.CFG.sell[row['档']]} 金`}</div>`);
}
// ---------------- 战斗演出 ----------------
const EV_DELAY = { round: 420, skill: 560, prep: 440, atk: 170, hit: 230, heal: 190, st: 170, resist: 120, die: 300, dodge: 200, sub: 260, revive: 320, interrupt: 300, skip: 220, shield: 170, buff: 60, start: 200, end: 0, bond: 200, gear: 140 };
// ---------------- 战报（照水浒群星录的写法：分类上色，敌我名字着色，数值写全） ----------------
const BUFF_NM = { atk: '武力', def: '统率', int: '智力', agi: '速度', dodge: '闪避', crit: '暴击', rate: '主动发动率', pursue: '追击率', dmgin: '受到伤害', dmgout: '造成伤害', magin: '受到谋略伤害', physin: '受到兵刃伤害', pursuein: '受到追击伤害', ctrlhit: '控制命中', burnin: '受到灼烧伤害', ctrllen: '控制回合', atkmult: '普攻倍率', magout: '谋略伤害', pursueout: '追击伤害', healout: '治疗量', shieldout: '护盾量', dotout: '持续伤害', maxhp: '兵力上限' };
const GOOD_ST = new Set(['隐身', '揭示']);
const DOT_ST = new Set(['灼烧', '中毒']);
const pct = x => (Math.round(x * 1000) / 10).toString().replace(/\.0$/, '') + '%';
function skillWords(u, sk) {
  // 技能行后面把效果写全：「关羽 · 温酒斩将（主动·瞬发）｜对敌方……」
  const r = D.SKROW[u.name];
  if (!r) return '';
  const set = sk && D.SET4[u.name] === sk && D0.sets[u.name];
  return esc(r['文案']) + (set ? `（四件：${esc(set.four)}）` : '');
}
function fromName(from, u) {
  if (!from) return '';
  if (from === u.name && D.SKROW[from]) return D.SKROW[from]['技能'];
  if (from.endsWith('·四件')) return D.SKROW[from.slice(0, -3)] ? D.SKROW[from.slice(0, -3)]['技能'] : from;
  if (from === '两件') return '专属两件';
  if (D.SKROW[from]) return D.SKROW[from]['技能'];
  return from;
}
const Play = {
  tok: 0, speed: +(store.get('sgqyl_speed') || 1) || 1, full: false,
  begin(out) {
    V.battle = { out, bi: 0, ei: 0, done: false, lines: [] };
    this.full = false;
    V.view = 'battle'; render();
  },
  cur() { const B = V.battle; return B.out.res.battles[B.bi]; },
  mount() {
    const B = V.battle; if (!B) return;
    this.paintAll();
    if (!B.done) { const t = ++this.tok; setTimeout(() => this.step(t), 380); }
  },
  step(t) {
    if (t !== this.tok) return;
    const B = V.battle; if (!B || B.done) return;
    const b = this.cur();
    if (B.ei >= b.events.length) {
      if (B.bi < B.out.res.battles.length - 1) {
        B.bi++; B.ei = 0; B.lines.push({ c: 'r', h: `第 ${B.bi + 1} 阵` }); render(); return;
      }
      B.done = true; render(); return;
    }
    const ev = b.events[B.ei++];
    this.show(b, ev);
    // 打到后面节奏收一收：开场看得清，鏖战不拖（照水浒）
    const decay = ev.r <= 6 ? 1 : ev.r <= 12 ? .9 : ev.r <= 20 ? .8 : .7;
    const d = (EV_DELAY[ev.t] != null ? EV_DELAY[ev.t] : 150) * decay / this.speed;
    setTimeout(() => this.step(t), d);
  },
  skip() {
    const B = V.battle; if (!B) return;
    this.tok++;
    const bs = B.out.res.battles;
    for (let i = B.bi; i < bs.length; i++) {
      if (i > B.bi) B.lines.push({ c: 'r', h: `第 ${i + 1} 阵` });
      for (const ev of bs[i].events.slice(i === B.bi ? B.ei : 0)) { const l = this.line(bs[i], ev); if (l) B.lines.push(l); }
    }
    B.bi = bs.length - 1; B.ei = bs[B.bi].events.length; B.done = true;
    render();
  },
  // 一条事件 → { c: 类别, h: html }；c 同水浒：r 回合 sk 技能 dm 伤害 he 回兵 sh 护盾 st 状态 in 提示 ps 被动/加成
  line(b, ev) {
    const side = u => u && b.teams[0].includes(u) ? 'a' : 'f';
    const n = u => u ? `<b class="ln-${side(u)}">${esc(u.label || u.name)}</b>` : '';
    const hp = (a, z) => `兵力 ${num(a)}→${num(z)}`;
    switch (ev.t) {
      case 'start': return { c: 'r', h: '两军对阵' };
      case 'round': return { c: 'r', h: `第 ${ev.r} 回合` };
      case 'gear': {
        const u = ev.u, own = u.equip.filter(e => e['归属'] === u.name).length, st = D0.sets[u.name];
        const parts = [u.equip.map(e => esc(e['名'])).join('、')];
        if (own >= 2) parts.push(`专属两件：${u.role !== '武将' ? '智力' : '武力'} +6%`);
        if (own >= 4 && st) parts.push(`四件：${esc(st.four)}`);
        return { c: 'ps', h: `${n(u)} 整备：${parts.join('；')}` };
      }
      case 'bond': {
        const bd = SG.BONDS.find(x => x.name === ev.n);
        return { c: 'ps', h: `${ev.side === 0 ? '我方' : '敌方'}羁绊【${esc(ev.n)}】${ev.mem.map(m => `<b class="ln-${ev.side === 0 ? 'a' : 'f'}">${esc(m)}</b>`).join('、')}：${KEYCN[ev.k]} +${Math.round(ev.v * 100)}%${ev.full ? '' : '（凑半）'}${bd && bd.txt ? `｜${esc(bd.txt)}` : ''}` };
      }
      case 'atk': return null;
      case 'skill': {
        const typ = ev.how === '追击' ? '追击' : ev.how === '指挥' || ev.how === '兵种' ? ev.how : (ev.sk && ev.sk.type) || '';
        const k = b._all.indexOf(ev.u), tp = ev.snap && k >= 0 ? ev.snap[k][0] / ev.snap[k][1] : ev.u.hp / ev.u.maxhp;
        return { c: 'sk', h: `${n(ev.u)} · ${esc(ev.n)}（${esc(typ)}${ev.how === '结算' ? '，结算' : ''}）${tp < .995 && ev.how !== '指挥' && ev.how !== '兵种' ? `（兵力 ${pct(Math.max(0, tp))}）` : ''}｜${skillWords(ev.u, ev.sk)}` };
      }
      case 'prep': return { c: 'sk', h: `${n(ev.u)} 准备「${esc(ev.n)}」，下次行动时结算` };
      case 'hit': {
        const g = ev.g;
        let head;
        if (g === 'attack') head = `${n(ev.s)} 普攻 ${n(ev.u)}`;
        else if (g === 'pursue') head = `${n(ev.s)} 追击 ${n(ev.u)}`;
        else if (g === '反击') head = `${n(ev.s)} 反击 ${n(ev.u)}`;
        else if (g === '斩杀') head = `${n(ev.s)} 斩杀 ${n(ev.u)}`;
        else if (g === '连环') head = `${n(ev.u)} 受【连环】牵连`;
        else if (DOT_ST.has(g) || g === '反目' || g === '诅咒') head = `${n(ev.u)} 受【${esc(g)}】`;
        else if (ev.s && g && g !== 'skill') head = `${n(ev.s)} → ${n(ev.u)}（${esc(g)}）`;
        else head = ev.s ? `${n(ev.s)} → ${n(ev.u)}` : n(ev.u);
        const notes = [];
        if (ev.k === 'mag' && g !== '中毒' && g !== '灼烧' && g !== '反目') notes.push('谋略');
        if (ev.c) notes.push('暴击');
        if (ev.ab) notes.push(ev.ab >= ev.d - 0.5 ? '全部由护盾吸收' : `护盾吸收 ${num(ev.ab)}`);
        return { c: ev.ab && ev.ab >= ev.d - 0.5 ? 'sh' : 'dm', h: `${head}：伤害 ${num(ev.d)}${notes.length ? `（${notes.join('；')}）` : ''}${ev.h0 != null && ev.h0 !== ev.h1 ? `　${hp(ev.h0, ev.h1)}` : ''}` };
      }
      case 'heal': return { c: 'he', h: `${n(ev.u)} 回兵 ${num(ev.d)}${ev.h0 != null ? `：${hp(ev.h0, ev.h1)}（上限 ${num(ev.u.maxhp)}）` : ''}${ev.s && ev.s !== ev.u ? `（${n(ev.s)}）` : ''}` };
      case 'shield': return { c: 'sh', h: `${n(ev.u)} 获得护盾：护盾 ${num(ev.d || 0)}` };
      case 'st': {
        const good = GOOD_ST.has(ev.s);
        return { c: 'st', h: `${n(ev.u)} ${good ? '获得' : '陷入'}【${esc(ev.s)}】，持续 ${ev.n || 1} 回合${ev.by && ev.by !== ev.u ? `（${n(ev.by)}）` : ''}` };
      }
      case 'resist': return { c: 'in', h: `${n(ev.u)} 抵抗【${esc(ev.s)}】（命中几率 ${pct(Math.min(1, ev.p))}）` };
      case 'buff': {
        const T = ev.tt || [];
        const allSide = T.length > 1 && T.every(x => side(x) === side(T[0])) && T.length === b.teams[side(T[0]) === 'a' ? 0 : 1].filter(x => x.alive()).length;
        const who = T.length === 1 && T[0] === ev.u ? '自身' : allSide ? (side(T[0]) === side(ev.u) ? '我方全体' : '敌方全体') : T.map(n).join('、');
        const nm = BUFF_NM[ev.k] || ev.k;
        const fr = fromName(ev.from, ev.u);
        return { c: 'ps', h: `${n(ev.u)}${fr ? ` · ${esc(fr)}` : ''}：${who} ${nm} ${ev.p >= 0 ? '+' : '−'}${pct(Math.abs(ev.p))}${ev.r > 0 ? `，持续 ${ev.r} 回合` : ''}` };
      }
      case 'dodge': return { c: 'in', h: `${n(ev.u)}【闪避】${n(ev.s)} 的攻击` };
      case 'die': return { c: 'dm', h: `${n(ev.u)} 退场` };
      case 'sub': return { c: 'ps', h: `${n(ev.u)} 替 ${n(ev.v)} 挡下这一击` };
      case 'revive': return { c: 'he', h: `${n(ev.u)} ${ev.n ? `第 ${ev.n} 次回场` : '免死'}，兵力回到 ${num(ev.snap ? ev.snap[b._all.indexOf(ev.u)][0] : ev.u.hp)}` };
      case 'interrupt': return { c: 'in', h: `${n(ev.u)} 打断 ${n(ev.v)} 的准备` };
      case 'skip': return { c: 'in', h: `${n(ev.u)} 处于【震慑】，本回合无法行动` };
      case 'end': return { c: 'r', h: ev.w === 0 ? '敌军尽退' : ev.w === 1 ? '我军全没' : `打满 ${ev.r} 回合` };
      default: return ev.txt ? { c: 'in', h: esc(ev.txt) } : null;
    }
  },
  logHtml(lines, tail) {
    let cut = lines;
    if (tail) {
      cut = []; let seen = 0;
      for (let i = lines.length - 1; i >= 0; i--) { if (lines[i].c === 'r' && /回合/.test(lines[i].h) && ++seen > 2) break; cut.unshift(lines[i]); if (cut.length > 60) break; }
    }
    return cut.map(l => `<div class="${l.c}">${l.h}</div>`).join('');
  },
  cellOf(b, u) { const k = b._all.indexOf(u); return k < 0 ? null : $('bc' + k); },
  float(el, txt, cls) { if (!el) return; const fx = el.querySelector('.fx'); if (!fx) return; const d = document.createElement('div'); d.className = cls; d.textContent = txt; fx.appendChild(d); setTimeout(() => d.remove(), 1000 / Math.max(1, this.speed * .7)); },
  flash(el, cls, ms) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms); },
  apply(b, ev) {
    if (!ev.snap) return;
    b._all.forEach((u, k) => {
      const el = $('bc' + k); if (!el) return;
      const [hp, mx, sh] = ev.snap[k];
      const bar = el.querySelector('.bar em'); if (bar) { bar.style.width = clamp(hp / mx * 100, 0, 100) + '%'; bar.classList.toggle('low', hp / mx < .5); }
      const sb = el.querySelector('.bar b'); if (sb) sb.style.width = clamp(sh / mx * 100, 0, 100) + '%';
      el.classList.toggle('dead', hp <= 0);
      const st = el.querySelector('.sts');
      if (st) { const L = ev.sts[k]; const h = L.map(x => `<span class="${x === '隐身' || x === '准备' ? 'good' : ''}">${x}</span>`).join(''); if (st.innerHTML !== h) st.innerHTML = h; }
    });
  },
  show(b, ev) {
    const B = V.battle;
    const l = this.line(b, ev);
    if (l) {
      B.lines.push(l);
      const lg = $('blog');
      if (lg) {
        lg.insertAdjacentHTML('beforeend', `<div class="${l.c}">${l.h}</div>`);
        // 演出中只留最近两回合，太长了删头
        if (l.c === 'r' && /回合/.test(l.h)) { const rs = lg.querySelectorAll('.r'); if (rs.length > 2) { let x = lg.firstChild; while (x && x !== rs[rs.length - 2]) { const nx = x.nextSibling; x.remove(); x = nx; } } }
        lg.scrollTop = lg.scrollHeight;
      }
    }
    this.apply(b, ev);
    const rn = $('rn'); if (rn && ev.r) rn.textContent = ev.r;
    const U = ev.u ? this.cellOf(b, ev.u) : null;
    const hold = Math.max(200, 520 / this.speed);
    if (ev.t === 'skill') { this.float(U, ev.n, 'fsk'); this.flash(U, 'act', hold); }
    else if (ev.t === 'prep') { this.float(U, '准备·' + ev.n, 'fsk prep'); this.flash(U, 'act', hold); }
    else if (ev.t === 'atk') this.flash(U, 'act', hold * .6);
    else if (ev.t === 'hit') { this.float(U, '−' + num(ev.d), 'fnum' + (ev.c ? ' crit' : '')); this.flash(U, 'hit', 280); }
    else if (ev.t === 'heal') this.float(U, '+' + num(ev.d), 'fnum heal');
    else if (ev.t === 'dodge') this.float(U, '闪', 'fnum miss');
    else if (ev.t === 'st') this.float(U, ev.s, 'fnum miss');
    else if (ev.t === 'sub') this.float(U, '替', 'fnum heal');
    else if (ev.t === 'revive') this.float(U, ev.n ? '回场' : '免死', 'fnum heal');
    else if (ev.t === 'interrupt') this.float(this.cellOf(b, ev.v), '打断', 'fnum miss');
    else if (ev.t === 'skip') this.float(U, '震慑', 'fnum miss');
    else if (ev.t === 'shield') this.float(U, '护盾', 'fnum heal');
  },
  paintAll() {
    const B = V.battle, b = this.cur();
    let last = b.events[0] || null; for (let i = B.ei - 1; i >= 0; i--) if (b.events[i].snap) { last = b.events[i]; break; }
    if (last) this.apply(b, last);
    const lg = $('blog'); if (lg) { lg.innerHTML = this.logHtml(B.lines, !(B.done && this.full)); lg.scrollTop = B.done && this.full ? 0 : lg.scrollHeight; }
  },
  // 榜单：输出 / 承伤 / 治疗各前五，我方一张、敌方一张（照水浒 V10.6）
  board() {
    const bs = V.battle.out.res.battles;
    const acc = [{}, {}];
    for (const b of bs) b.teams.forEach((t, s) => t.forEach(u => { const key = u.label || u.name; const o = acc[s][key] = acc[s][key] || { dealt: 0, taken: 0, healed: 0 }; o.dealt += u.tally.dealt; o.taken += u.tally.taken; o.healed += u.tally.healed; }));
    // 车轮战：我方同一批人跨阵累计了两次，上面按人名合并已经去重（tally 是累计值，取最后一阵的）
    if (bs.length > 1) { acc[0] = {}; for (const u of bs[0].teams[0]) acc[0][u.name] = { dealt: u.tally.dealt, taken: u.tally.taken, healed: u.tally.healed }; }
    const col = (t, obj, k) => { const L = Object.entries(obj).filter(x => x[1][k] > 0).sort((a, b) => b[1][k] - a[1][k]).slice(0, 5);
      return `<div class="bd-col"><i>${t}</i>${L.length ? L.map(([nm, o], i) => `<span class="r${i}"><em>${esc(nm)}</em><u>${num(o[k])}</u></span>`).join('') : '<span class="none">—</span>'}</div>`; };
    const one = (s, label) => `<div class="bd-side">${label}</div><div class="board">${col('输出', acc[s], 'dealt')}${col('承伤', acc[s], 'taken')}${col('治疗', acc[s], 'healed')}</div>`;
    return one(0, '我　方') + one(1, '敌　方');
  },
};
SG.Play = Play;
function bcell(b, u, k) {
  if (!u) return '<div class="bcell void"></div>';
  return `<div class="bcell" id="bc${k}">${por(u.name)}<div class="bn">${esc(u.label || u.name)}</div><div class="bar"><em style="width:${clamp(u.hp / u.maxhp * 100, 0, 100)}%"></em><b></b></div><div class="sts"></div><div class="fx"></div></div>`;
}
function battleGrids(b) {
  const A = b.teams[0], B = b.teams[1];
  const posA = {}, posB = {};
  A.forEach(u => posA[u.idx] = u); B.forEach(u => posB[u.idx] = u);
  const cell = (pos, i) => { const u = pos[i]; return bcell(b, u, u ? b._all.indexOf(u) : -1); };
  let top = '', bot = '';
  if (V.side) {
    // 横排：我方在左、前排朝右；敌方在右、前排朝左
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { bot += cell(posA, (2 - c) * 3 + r); top += cell(posB, c * 3 + r); }
  } else {
    // 竖排：敌方在上、前排在下；我方在下、前排在上
    for (const r of [2, 1, 0]) for (let c = 0; c < 3; c++) top += cell(posB, r * 3 + c);
    for (const r of [0, 1, 2]) for (let c = 0; c < 3; c++) bot += cell(posA, r * 3 + c);
  }
  return { top, bot };
}
function expNote(rew) {
  const L = (rew && rew.exp || []).filter(x => x.e > 0);
  return L.length ? `<div class="small" style="margin-top:6px">${L.map(x => `${esc(x.n)} 经验 +${num(x.e)}${x.up ? `，<b style="color:var(--zhu)">升到 ${x.lv} 级</b>` : ''}`).join('<br>')}</div>` : '';
}
function exclNote(rew) {
  const L = (rew.excl || []).map(e => e.how === 'token' ? `${esc(e.n)}的信物 +1（${e.tok}/${SG.CFG.src_token}）` : e.how === 'swap' ? `${esc(e.n)}的信物凑齐，换得 ${esc(D.EQID[e.id]['名'])}` : '').filter(Boolean);
  return L.length ? `<div class="small" style="margin-top:4px;color:var(--zhu)">${L.join('<br>')}</div>` : '';
}
function quietAch(L) { V.achToast = V.achToast || {}; (L || []).forEach(a => V.achToast[a.id] = 1); }
function achRows(L) {
  if (!L || !L.length || !G.s.ach) return '';
  return `<div class="achres">${L.map(a => { const k = G.s.ach[a.id]; return `<div class="ach${k === 2 ? ' got' : ' pend'}"><div class="grow"><b class="kai">功名「${esc(a.name)}」</b><span class="tiny muted">　${SG.rewardText(a.tier)}${a.title ? `，称号「${esc(a.title)}」` : ''}</span></div>${k === 1 ? `<span class="btn sm main" data-a="ach-claim" data-id="${esc(a.id)}">领取</span>` : '<span class="small muted">已领</span>'}</div>`; }).join('')}</div>`;
}
function battleHtml() {
  const B = V.battle, out = B.out, st = D.STAGE[out.stageId] || null;
  const b = Play.cur();
  const g = battleGrids(b);
  let tail = '';
  if (B.done) {
    const win = out.res.win, rew = out.rew;
    const items = (rew.items || []).map(it => { const row = D.EQID[it.id]; return `<div>${eqSeal(row)} ${esc(row['名'])}　<span class="muted small">${eqStatTxt(row, '')}</span></div>`; }).join('');
    tail = out.note != null ? `<div class="card"><div class="result ${win ? 'win' : 'lose'}">${out.winTxt || (win ? '胜' : '败')}</div><div class="small" style="text-align:center">${out.note}</div>
      <div class="btns"><div class="btn main" data-a="${out.backAct || 'go'}" data-v="${out.back || 'map'}">${out.backTxt || '返回'}</div></div></div>` : `<div class="card"><div class="result ${win ? 'win' : 'lose'}">${win ? '胜' : '败'}</div>
      ${win ? `<div class="small" style="text-align:center">${rew.first ? '首通　' : ''}金 +${num(rew.gold)}${rew.gold2 ? `　黄金 +${rew.gold2}` : ''}</div>${items ? `<div class="small" style="margin-top:6px">${items}</div>` : ''}${exclNote(rew)}${expNote(rew)}`
        : `<div class="small muted" style="text-align:center">败退。折损的兵马要去征兵补齐。</div>${expNote(rew)}`}
      ${achRows(out.ach)}
      ${win && st && +st['章'] === 26 && st['类型'] === '章末' && !G.s.seenEpi && (D0.crawl || {}).epilogue ? '<div class="btns"><div class="btn main" data-a="crawl-epi">尾　声</div></div>' : ''}
      <div class="btns"><div class="btn" data-a="go" data-v="${out.back || 'stages'}">回征战</div>${st ? `<div class="btn" data-a="to-form" data-id="${st.id}">重新布阵</div><div class="btn main" data-a="refight">再战一场</div>` : ''}</div></div>`;
  }
  const title = out.title || (st ? st['关'] : '');
  V.side = window.innerWidth >= 700 && window.innerWidth > window.innerHeight;
  const rn0 = b.events.length && B.ei ? b.events[Math.min(B.ei, b.events.length) - 1].r : 0;
  const vs = V.side ? `<div class="vs"><span>我</span><span>第<span class="rn" id="rn">${rn0}</span>回合</span><span>敌</span></div>` : `<div class="vs"><span>敌</span><span>第 <span class="rn" id="rn">${rn0}</span> 回合</span><span>我</span></div>`;
  return `<div class="row" style="padding:10px 0 4px"><b class="kai" style="font-size:1.1em">${esc(title)}</b><span class="grow"></span><span class="small muted">${out.res.battles.length > 1 ? `第 ${B.bi + 1} / ${out.res.battles.length} 阵　` : ''}</span></div>
    ${V.side ? `<div class="bf side"><div class="bgrid">${g.bot}</div>${vs}<div class="bgrid">${g.top}</div></div>`
      : `<div class="bf"><div class="bgrid">${g.top}</div>${vs}<div class="bgrid">${g.bot}</div></div>`}
    ${B.done ? '' : `<div class="ctrl"><span class="btn sm${Play.speed === 1 ? ' main' : ''}" data-a="spd" data-v="1">1×</span><span class="btn sm${Play.speed === 2 ? ' main' : ''}" data-a="spd" data-v="2">2×</span><span class="btn sm${Play.speed === 4 ? ' main' : ''}" data-a="spd" data-v="4">4×</span><span class="btn sm" data-a="skip">跳过</span></div>`}
    ${B.done ? `<div class="row" style="margin-top:8px"><span class="small muted">共 ${out.res.rounds || Play.cur().round} 回合</span><span class="grow"></span><span class="btn sm" data-a="blog-full">${Play.full ? '收起战报' : '看全战报'}</span></div>` : ''}
    <div class="blog${B.done && Play.full ? ' full' : ''}" id="blog"></div>${tail}${B.done ? `<div class="card" style="margin-top:8px">${Play.board()}</div>` : ''}`;
}


// ---------------- 关于与许可 ----------------
function aboutSheet() {
  openModal(`<div class="shead">关于<span class="x" data-a="close">关闭</span></div>
    <div class="small"><b>三国群英录</b>　V${VERSION}　作者 Lynch</div>
    <div class="small" style="margin-top:8px">有 bug、有想法，加微信说一声：<b>lynchrrr</b>　<span class="btn sm" data-a="copy-wx">复制</span></div>
    <div class="small">小红书：<b>模拟游戏大全</b></div>
    <div class="sec"><h2>许可</h2><span class="line"></span></div>
    <div class="small">版权所有 © 2026 Lynch。保留所有权利。</div>
    <div class="small" style="margin-top:6px">未经 Lynch 许可，不得修改、改编、翻译、二次创作，或拿它做衍生作品。</div>
    <div class="small" style="margin-top:6px">要授权，微信 lynchrrr 联系。</div>`);
}
// ---------------- 存档菜单 ----------------
function bakRow() {
  const cq = G && G.kind === 'conquest', key = (cq ? SG.CQ_SAVE_KEY : SG.SAVE_KEY) + '_bak';
  let b; try { b = JSON.parse(store.get(key) || 'null'); } catch (e) { b = null; }
  if (!b) return '';
  const d = new Date(b.t), r = SG.SaveIO.inspect(b.s);
  return `<div class="card small" style="margin-top:8px"><div class="muted">备份（${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}）</div><div>${esc(r.sum || r.err)}</div><div class="btns" style="margin-top:4px"><div class="btn sm" data-a="bak-swap" data-k="${cq ? 'cq' : 'camp'}">换回这份</div></div></div>`;
}
function menuSheet() {
  openModal(`<div class="shead">存档<span class="x" data-a="close">关闭</span></div>
    <div class="small muted">存档在这台设备的浏览器里，自动保存。换设备用导出、导入。</div>
    <div class="btns"><div class="btn" data-a="export">导出</div><div class="btn" data-a="import">导入</div></div>
    ${bakRow()}
    <div class="btns"><div class="btn" data-a="to-title">回标题</div><div class="btn" data-a="wipe">删档重开</div></div>
    ${SG.pwa && SG.pwa.can() ? '<div class="btns"><div class="btn qing" data-a="pwa-install">装到桌面</div></div>' : ''}
    <div class="btns"><div class="btn" data-a="about">关于与许可</div></div>
    <div class="tiny muted" style="margin-top:10px">V${VERSION}　© 2026 Lynch　微信 lynchrrr</div>`);
}

// ---------------- 动作 ----------------
const ACT = {
  close: () => { closeModal(); if (V.afterCard) { const id = V.afterCard; V.afterCard = null; stageSheet(id); } },
  'pwa-install': () => { closeModal(); SG.pwa.install(); },
  'pwa-later': () => SG.pwa.later(),
  about: aboutSheet,
  'pwa-reload': () => SG.pwa.reload(),
  'ask-yes': () => { const f = askFn; askFn = null; closeModal(); if (f) f(); },
  go: el => go(el.dataset.v),
  menu: menuSheet,
  'to-title': () => { closeModal(); save(); V.mode = 'title'; render(); },
  wipe: () => { const cq = G.kind === 'conquest'; ask('删档', cq ? '这一局霸业清掉，不能恢复。闯关存档不受影响。' : '闯关进度全部清掉，不能恢复。霸业存档不受影响。', '删', () => { store.del(cq ? SG.CQ_SAVE_KEY : SG.SAVE_KEY); G = null; V.mode = 'title'; render(); }); },
  export: async () => {
    let code; try { code = await SG.SaveIO.encode(G.toJSON()); } catch (e) { toast('导出失败'); return; }
    openModal(`<div class="shead">导出<span class="x" data-a="close">关闭</span></div><div class="small muted">整段复制，发微信、存备忘录都行；也可以存成文件。</div><textarea id="io" style="width:100%;height:120px;font-size:.7em" readonly>${code}</textarea>
      <div class="tiny muted">${esc(SG.SaveIO.inspect(G.toJSON()).sum || '')}　${code.length} 字</div>
      <div class="btns"><div class="btn" data-a="copy">复制</div><div class="btn" data-a="download">存成文件</div></div>`);
  },
  download: () => {
    const t = $('io').value, a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([t], { type: 'text/plain' }));
    const d = new Date(); a.download = `三国群英录存档_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.txt`;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  },
  copy: () => { const t = $('io'); t.select(); try { navigator.clipboard.writeText(t.value); toast('复制了'); } catch (e) { document.execCommand('copy'); } },
  import: () => openModal(`<div class="shead">导入<span class="x" data-a="close">关闭</span></div>
    <div class="small muted">贴存档码，或者选存档文件。闯关、霸业的码都认，自己分得清。</div>
    <textarea id="io" style="width:100%;height:120px;font-size:.7em" placeholder="把存档码贴在这里"></textarea>
    <label class="btn sm" style="display:inline-block;margin-top:4px">选文件<input type="file" id="iofile" accept=".txt,text/plain" style="display:none"></label>
    <div class="btns"><div class="btn main" data-a="import-do">导入</div></div>`),
  'import-do': async () => {
    let json;
    try { json = await SG.SaveIO.decode($('io').value); } catch (e) { toast('码不全，或者不是本游戏的存档'); return; }
    const r = SG.SaveIO.inspect(json);
    if (r.err) { toast(r.err); return; }
    const key = r.kind === 'conquest' ? SG.CQ_SAVE_KEY : SG.SAVE_KEY;
    const cur = store.get(key), ci = cur ? SG.SaveIO.inspect(cur) : null;
    V.pendingImport = { json, kind: r.kind };
    openModal(`<div class="shead">确认导入<span class="x" data-a="close">关闭</span></div>
      <div class="card small"><div class="muted">现在这台设备上</div><div>${ci && !ci.err ? esc(ci.sum) : '没有' + (r.kind === 'conquest' ? '霸业' : '闯关') + '存档'}</div></div>
      <div class="card small"><div class="muted">导入以后</div><div><b>${esc(r.sum)}</b></div></div>
      ${ci && !ci.err ? '<div class="tiny muted">现在这份会留作备份，存档菜单里能换回来。</div>' : ''}
      <div class="btns"><div class="btn" data-a="close">算了</div><div class="btn main" data-a="import-yes">导入</div></div>`);
  },
  'import-yes': () => {
    const P = V.pendingImport; if (!P) return; V.pendingImport = null;
    const key = P.kind === 'conquest' ? SG.CQ_SAVE_KEY : SG.SAVE_KEY;
    const cur = store.get(key);
    if (cur) store.set(key + '_bak', JSON.stringify({ t: Date.now(), s: cur }));
    store.set(key, P.json); closeModal(); G = null;
    if (P.kind === 'conquest') { V.mode = 'title'; render(); SG.Conq && SG.Conq.cont(); } else ACT['camp-continue']();
    toast('导入了');
  },
  'bak-swap': el => {
    const key = el.dataset.k === 'cq' ? SG.CQ_SAVE_KEY : SG.SAVE_KEY;
    let b; try { b = JSON.parse(store.get(key + '_bak') || 'null'); } catch (e) { b = null; }
    if (!b) { toast('没有备份'); return; }
    const cur = store.get(key);
    ask('换回备份', `把「${SG.SaveIO.inspect(b.s).sum}」换回来；现在这份「${cur ? SG.SaveIO.inspect(cur).sum : '空'}」留作备份，还能再换过去。`, '换', () => {
      if (cur) store.set(key + '_bak', JSON.stringify({ t: Date.now(), s: cur }));
      store.set(key, b.s); G = null; V.mode = 'title'; closeModal(); render();
      if (el.dataset.k === 'cq') SG.Conq && SG.Conq.cont(); else ACT['camp-continue']();
      toast('换回来了');
    });
  },
  'camp-continue': () => { V.cq = null; G = load(); if (!G) { toast('存档坏了'); return; } V.mode = 'camp'; go('main'); },
  'camp-new': () => {
    const start = () => {
      V.cq = null; G = SG.Game.fresh(); save(); V.mode = 'camp'; V.view = 'main'; render();
      const g = G.s.gift;
      openModal(`<div class="shead">开局</div><div class="story">中平元年，涿县街上贴出招兵榜文。榜下站着两个人。</div>
        <div class="pulls" style="grid-template-columns:repeat(2,1fr);max-width:260px;margin:0 auto">${g.map(n => `<div class="pull">${por(n)}<div class="nm c-${D.H[n]['品阶']}">${esc(n)}</div><div class="muted">${D.H[n]['品阶']}·${esc(D.H[n]['定位'])}</div></div>`).join('')}</div>
        <div class="small muted" style="margin-top:8px">手里 1000 金。先去招贤凑几个人，再打第一关。</div><div class="btns"><div class="btn main" data-a="close">走</div></div>`);
    };
    if (store.get(SG.SAVE_KEY)) ask('新开闯关', '现有的闯关进度会被覆盖。', '新开', start); else showCrawl('intro', start);
  },
  'conq-continue': () => SG.Conq && SG.Conq.cont(),
  'conq-new': () => SG.Conq && SG.Conq.pickFaction(),
  chap: el => { const c = +el.dataset.c; const C = D.CHAPTERS[c]; const cur = V.open[c] != null ? V.open[c] : (c === G.curChapter()); if (!C.stages.some(s => G.stageUnlocked(s.id))) { toast('还没打到这一章'); return; } V.open[c] = !cur; render(); },
  locked: el => { const s = D.STAGE[el.dataset.id]; toast(s['类型'] === '隐藏' ? '本章其余关卡全通才开' : (+s['章'] >= 27 ? '终章打完才开' : '先打前面的')); },
  stage: el => {
    const id = el.dataset.id || el.dataset.v, c = +D.STAGE[id]['章'];
    G.s.seenCh = G.s.seenCh || {};
    if (!G.s.seenCh[c]) { G.s.seenCh[c] = 1; save(); chapCard(c); V.afterCard = id; return; }
    stageSheet(id);
  },
  sweep: el => {
    const id = el.dataset.id, st = D.STAGE[id];
    const lim = SG.stageLimit(st);
    const F = G.s.formation.slice(); if (F.filter(Boolean).length > lim.max) { toast(`这关只能带 ${lim.max} 人，先去布阵`); return; }
    const r = G.fight(id, F, { quick: true });
    if (r.err) { toast(r.err); return; }
    glog(`速战 ${st['关']}：${r.res.win ? `胜，金 +${r.rew.gold}${r.rew.items.length ? '，得 ' + r.rew.items.map(it => D.EQID[it.id]['名']).join('、') : ''}` : '败'}`);
    save(); closeModal(); render(); toast(r.res.win ? `速战得胜，金 +${r.rew.gold}${r.rew.items.length ? '，掉了一件装备' : ''}` : '速战没打过');
  },
  'copy-wx': () => { try { navigator.clipboard.writeText('lynchrrr'); toast('微信号复制了'); } catch (e) { toast('微信号：lynchrrr'); } },
  'ach-claim': (el) => { const r = G.achClaim(el.dataset.id); if (r) { toast(`领了「${r.a.name}」：${SG.rewardText(r.a.tier)}${r.a.title ? `，得称号「${r.a.title}」` : ''}`); glog(`功名「${r.a.name}」`); save(); render(); } },
  'ach-all': () => { const R = G.achClaimAll(); if (R.length) { const sum = { gold: 0, gold2: 0, tokens: 0 }; R.forEach(x => { for (const k in x.r) sum[k] += x.r[k]; }); toast(`领了 ${R.length} 条：金 ${sum.gold}、黄金 ${sum.gold2}、兵符 ${sum.tokens}`); glog(`领功名 ${R.length} 条`); save(); render(); } },
  'title-set': (el) => { G.s.title = el.dataset.t || ''; save(); render(); toast(G.s.title ? `挂上「${G.s.title}」` : '不挂称号'); },
  'tx-reroll': (el) => {
    const i = +el.dataset.i, old = G.s.tx.on[i];
    ask('换天象', `花 ${SG.CFG.tx_reroll} 枚兵符把「${old}」换成一颗没见过的，这颗换过就不能再换。`, '换', () => {
      const r = G.rerollTx(i); if (r.err) { toast(r.err); return; }
      glog(`天象「${old}」换成「${r.id}」`); save(); render(); toast(`换成了「${r.id}」`);
    });
  },
  'star-all': () => {
    const before = {}; for (const n in G.s.heroes) before[n] = G.s.heroes[n].star;
    const k = G.starAll(); if (!k) { toast('没有人的碎片够'); return; }
    const L = Object.keys(before).filter(n => G.s.heroes[n].star > before[n]).sort((a, b) => G.s.heroes[b].star - G.s.heroes[a].star);
    glog(`一键升星：${L.map(n => `${n} ${before[n]}→${G.s.heroes[n].star}星`).join('、')}`); save(); render();
    openModal(`<div class="shead">一键升星<span class="x" data-a="close">关闭</span></div><div class="small muted">只花本人碎片，兵符一枚没动。</div>
      ${L.map(n => `<div class="item"><span>${por(n, 's')}</span><div class="grow"><div class="en">${esc(n)}</div><div class="ed"><span class="stars">${stars(before[n])}</span> → <span class="stars">${stars(G.s.heroes[n].star)}</span>　剩碎片 ${G.s.heroes[n].frag}</div></div></div>`).join('')}
      <div class="btns"><div class="btn main" data-a="close">好</div></div>`);
  },
  'auto-equip': () => { G.autoEquip(G.s.formation); save(); render(); toast('按战力从高到低配好了'); },
  'strip-team': () => { G.stripTeam(G.s.formation); save(); render(); toast('阵上的人装备都卸了'); },
  'train-max': () => { const n = G.trainMax(V.hero); if (!n) toast(G.hero(V.hero).lv >= G.maxLv() ? '已到上限' : '钱不够'); else toast(`练了 ${n} 级`); save(); render(); },
  'refight': () => { const id = V.battle && V.battle.out.stageId; if (!id) return; const r = G.fight(id, G.s.formation); if (r.err) { toast(r.err); return; } quietAch(r.ach); save(); Play.begin({ res: r.res, rew: r.rew, ach: r.ach, stageId: id }); },
  'to-form': el => {
    const id = el.dataset.id, st = D.STAGE[id];
    if (G.isCleared(id) && G.replayLeft(id) <= 0) { toast('这关今天刷满三次了'); return; }
    closeModal(); V.stage = id;
    const lim = SG.stageLimit(st);
    if (G.s.formation.filter(Boolean).length > lim.max || !G.s.formation.some(Boolean)) autoForm(lim.max);
    go('form');
  },
  hero: el => { V.hero = el.dataset.n; V.view = 'hero'; render(); window.scrollTo(0, 0); },
  filt: el => { V.filt[el.dataset.k] = el.dataset.v; render(); },
  sort: el => { V.sort = el.dataset.v; render(); },
  train: el => { const k = +el.dataset.k; const n = G.train(V.hero, k); if (!n) toast(G.hero(V.hero).lv >= G.maxLv() ? '已到上限' : '钱不够'); save(); render(); },
  star: () => { if (G.starUp(V.hero)) { toast(`${V.hero} 升到 ${G.hero(V.hero).star} 星`); save(); render(); } else toast('碎片加兵符不够'); },
  recruit: () => { if (G.recruit(V.hero)) { save(); render(); } else toast('钱不够或兵是满的'); },
  'recruit-all': () => {
    const L = G.s.formation.filter(Boolean); let ok = 0;
    for (const n of L) if (G.recruitCost(n) > 0 && G.recruit(n)) ok++;
    if (!ok) toast('钱不够或兵是满的'); save(); render();
  },
  slot: el => slotPicker(V.hero, el.dataset.sl),
  equip: el => { G.equip(V.hero, +el.dataset.uid); save(); closeModal(); render(); },
  unequip: el => { G.unequip(V.hero, el.dataset.sl); save(); closeModal(); render(); },
  cell: el => {
    const i = +el.dataset.i, F = G.s.formation;
    if (V.sel === i) { F[i] = null; V.sel = null; }
    else if (V.sel != null && F[V.sel] && !F[i]) { F[i] = F[V.sel]; F[V.sel] = null; V.sel = null; }
    else if (V.sel != null && F[V.sel] && F[i]) { const t = F[i]; F[i] = F[V.sel]; F[V.sel] = t; V.sel = null; }
    else V.sel = i;
    save(); render();
  },
  pick: el => {
    const n = el.dataset.n, F = G.s.formation;
    const lim = !V.cq && V.stage ? SG.stageLimit(D.STAGE[V.stage]).max : 9;
    const at = F.indexOf(n);
    if (at >= 0) { F[at] = null; if (V.sel === at) V.sel = null; save(); render(); return; }
    let i = V.sel != null ? V.sel : F.findIndex(x => !x);
    if (i < 0) { toast('九格满了'); return; }
    if (!F[i] && F.filter(Boolean).length >= lim) { toast(`这关只能带 ${lim} 人`); return; }
    F[i] = n; V.sel = null; save(); render();
  },
  'form-auto': () => { autoForm(!V.cq && V.stage ? SG.stageLimit(D.STAGE[V.stage]).max : 9); save(); render(); },
  'form-clear': () => { G.s.formation = [null, null, null, null, null, null, null, null, null]; V.sel = null; save(); render(); },
  fight: () => {
    const id = V.stage;
    const r = G.fight(id, G.s.formation);
    if (r.err) { toast(r.err); return; }
    glog(`${D.STAGE[id]['关']}：${r.res.win ? `胜${r.rew.first ? '（首通）' : ''}，金 +${r.rew.gold}` : '败'}`);
    quietAch(r.ach); save();
    Play.begin({ res: r.res, rew: r.rew, ach: r.ach, stageId: id });
  },
  spd: el => { Play.speed = +el.dataset.v; store.set('sgqyl_speed', String(Play.speed)); document.querySelectorAll('[data-a="spd"]').forEach(x => x.classList.toggle('main', +x.dataset.v === Play.speed)); },
  skip: () => Play.skip(),
  'blog-full': () => { Play.full = !Play.full; render(); },
  draw: el => { const r = G.draw(+el.dataset.k); if (!r) { toast('钱不够'); return; } save(); render(); pullSheet(r, '招贤'); },
  'draw-gold': () => { const r = G.drawGold(); if (!r) { toast('黄金不够'); return; } save(); render(); pullSheet(r, '黄金求贤'); },
  token: el => { if (G.buyTokens(+el.dataset.k)) { save(); render(); toast(`兵符 ${G.s.tokens} 枚`); } else toast('钱不够'); },
  smith: el => {
    const r = G.smith(+el.dataset.k); if (!r) { toast('钱不够'); return; }
    save(); render();
    openModal(`<div class="shead">出炉<span class="x" data-a="close">关闭</span></div>${r.map(o => `<div class="item">${eqSeal(o.row)}<div class="grow"><div class="en">${esc(o.row['名'])}<span class="tiny muted">　${o.row['槽']}${o.row['归属'] ? '·' + esc(o.row['归属']) + '专属' : ''}</span></div><div class="ed">${eqStatTxt(o.row, '')}</div></div></div>`).join('')}`);
  },
  bagslot: el => { V.bagSlot = el.dataset.v; render(); },
  'crawl-done': () => { const f = V.crawlThen; V.crawlThen = null; if (V.crawlKind === 'epilogue' && G) { G.s.seenEpi = 1; save(); } if (f) f(); else render(); },
  'crawl-intro': () => showCrawl('intro', () => render()),
  'crawl-epi': () => showCrawl('epilogue', () => { if (V.view === 'battle') render(); else go('main'); }),
  'filt-frag': () => { V.filt.frag = !V.filt.frag; render(); },
  'sell-mode': () => { V.sellMode = !V.sellMode; V.sellSel = new Set(); render(); },
  'sell-tog': el => { const u = +el.dataset.uid; V.sellSel.has(u) ? V.sellSel.delete(u) : V.sellSel.add(u); render(); },
  'sell-none': () => { V.sellSel = new Set(); render(); },
  'sell-tier': el => { for (const it of G.s.bag) { const r = D.EQID[it.id]; if (r['档'] === el.dataset.v && !r['归属'] && !G.equippedBy(it.uid) && (V.bagSlot === '全' || r['槽'] === V.bagSlot)) V.sellSel.add(it.uid); } render(); },
  'sell-do': () => {
    const L = [...V.sellSel]; if (!L.length) return;
    const v = L.reduce((a, u) => a + SG.CFG.sell[D.EQID[G.item(u).id]['档']], 0);
    ask('批量出售', `卖掉 ${L.length} 件，得 ${num(v)} 金。`, '卖', () => { let got = 0, k = 0; for (const u of L) { const x = G.sell(u); if (x) { got += x; k++; } } V.sellSel = new Set(); V.sellMode = false; glog(`批量卖了 ${k} 件，得 ${got} 金`); save(); render(); toast(`卖了 ${k} 件，得 ${num(got)} 金`); });
  },
  'eq-info': el => eqInfo(el.dataset.id, el.dataset.uid),
  'src-stage': el => { const id = el.dataset.id; if (G.kind === 'conquest') return; if (!G.stageUnlocked(id)) { toast(`还没打到第${D.STAGE[id]['章']}章「${D.STAGE[id]['关']}」`); return; } closeModal(); stageSheet(id); },
  sell: el => { const v = G.sell(+el.dataset.uid); if (v) { toast(`卖了 ${v} 金`); save(); render(); } },
  'sell-junk': () => {
    const L = G.s.bag.filter(it => { const r = D.EQID[it.id]; return !r['归属'] && !G.equippedBy(it.uid) && (r['档'] === '凡品' || r['档'] === '良品'); });
    let v = 0; L.forEach(it => v += G.sell(it.uid)); toast(`卖了 ${L.length} 件，得 ${v} 金`); save(); render();
  },
  'new-cycle': () => ask('开新周目', '闯过的关卡清零重打，将领、装备、金币都带着。敌方整体变强，所有收入 ×1.5。另抽三颗天象，一好一坏，管这一周目。', '开', () => { G.newCycle(); glog(`第 ${G.s.cycle} 周目，天象：${G.txList().join('、')}`); save(); go('main'); }),
};
SG.ACT = ACT;
document.addEventListener('change', e => {
  if (e.target.id !== 'iofile' || !e.target.files[0]) return;
  const f = e.target.files[0], r = new FileReader();
  r.onload = () => { $('io').value = String(r.result || '').trim(); toast('读进来了，点导入'); };
  r.readAsText(f);
});
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if (!el) { if (e.target.id === 'modal') closeModal(); return; }
  if (el.classList.contains('off')) return;
  const f = ACT[el.dataset.a];
  if (f) f(el);
});

function boot() {
  const app = $('app');
  if (!$('modal')) { const m = document.createElement('div'); m.id = 'modal'; document.body.appendChild(m); }
  if (!$('toast')) { const t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  V.mode = 'title'; render();
  window.addEventListener('pagehide', save);
}
SG.save = save; SG.getGame = () => G; SG.setGame = g => { G = g; }; SG.boot = boot;
SG.VIEWS = VIEWS; SG.go = go; SG.heroCard = heroCard; SG.autoForm = autoForm; SG.sortedHeroes = sortedHeroes;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
