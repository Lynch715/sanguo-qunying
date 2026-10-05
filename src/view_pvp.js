// PVP 界面沿用闯关的纸色卡片、印章和九宫布局。
(function () {
'use strict';
const SG = window.SG, U = SG.ui, { esc, por, num, stars, TSEAL, eqSeal, $, toast, openModal, closeModal } = U;
const g = () => SG.getGame(), p = () => SG.PVP.state(g());
const title = (text, sub = '') => `<div class="sec"><h2>${text}</h2><span class="line"></span><span class="tp">${sub}</span></div>`;
const back = `<div class="btns"><div class="btn" data-a="go" data-v="pvp">回 PVP</div></div>`;
const earIcon = '<img class="pvp-ear-icon" src="assets/items/pvp_ear.png?v=b3bfa096" alt="耳朵战利品" width="64" height="64">';
const date = t => new Date(t).toLocaleString('zh-CN', { hour12: false });
let opponent = null;
function commit() { SG.save(); SG.render(); }
function teamCards(s) {
  return `<div class="grid9 pvp-grid">${s.team.map((h, i) => `${i % 3 === 0 ? `<div class="rowlab" style="grid-column:1/4">${['前排', '中排', '后排'][i / 3]}</div>` : ''}<div class="hc tb-${SG.D.H[h.n]['品阶']}"><span class="tag">${TSEAL(SG.D.H[h.n]['品阶'])}</span>${por(h.n,'m','',h.form||'normal')}<div class="nm">${esc(h.form==='god'?'神·'+h.n:h.n)}</div><div class="meta">Lv.${h.lv} <span class="stars">${stars(h.star)}</span></div><div class="tiny muted">${h.eq.filter(Boolean).length} 件装备</div></div>`).join('')}</div>`;
}
function details(s) {
  return teamCards(s) + s.team.map(h => `<div class="card small"><b class="kai">${esc(h.n)}</b>　${h.eq.filter(Boolean).map(id => { const e = SG.D.EQID[id]; return `${eqSeal(e)} ${esc(e['名'])}`; }).join('、') || '<span class="muted">无装备</span>'}</div>`).join('');
}
function ownCard(n, i) {
  const h = n && g().hero(n), data = h && SG.D.H[n];
  const eq = h ? SG.SLOTS.map(sl => (p().gear[n] || {})[sl]).map(uid => g().item(uid)).filter(Boolean).map(it => it.id) : [];
  const unit = h ? SG.mkHeroUnit(n, h.lv, h.star, eq,null,h.form) : null;
  return `<div class="hc ${h ? 'tb-' + data['品阶'] : 'empty-c'}" data-a="pvp-cell" data-i="${i}">${h ? `<span class="tag">${TSEAL(data['品阶'])}</span>${por(n)}<div class="nm">${esc(g().hero(n)?.form==='god'?'神·'+n:n)}</div><div class="meta">Lv.${h.lv} <span class="stars">${stars(h.star)}</span></div><div class="meta st"><span>武 ${num(unit.stat('atk'))}</span><span>智 ${num(unit.stat('int'))}</span></div><div class="meta st"><span>统 ${num(unit.stat('def'))}</span><span>速 ${num(unit.stat('agi'))}</span></div><div class="tiny muted">${eq.length} 件装备 · 满兵</div>` : '<div class="por"><span class="ph">空</span></div><div class="nm">点此上阵</div>'}</div>`;
}
SG.VIEWS.pvp = () => {
  const s = p(), cnt = s.cells.filter(Boolean).length;
  return `${title('PVP 对战', '九宫论兵')}<div class="card small">以九位将领迎战天下。对战码记录生成时的阵容，朋友离线也可挑战。</div>
    <div class="stat3"><div><b>${cnt}/9</b><i>上阵</i></div><div><b>${s.records.filter(r => r.result === '胜').length}</b><i>近百场胜绩</i></div><div><b>${s.ears.length}</b><i>耳朵</i></div></div>
    <div class="btns"><div class="btn main" data-a="go" data-v="pvp-form">我的阵容</div><div class="btn" data-a="pvp-code">生成对战码</div></div>
    <div class="btns"><div class="btn main" data-a="pvp-challenge">开始对战</div><div class="btn" data-a="go" data-v="pvp-records">战绩与战利品</div></div>
    <div class="btns"><div class="btn" data-a="go" data-v="main">回大帐</div></div>`;
};
SG.VIEWS['pvp-form'] = () => {
  const s = p();
  return `${title('PVP 阵容', s.cells.filter(Boolean).length + ' / 9 人')}<div class="card small"><label for="pvp-name">主公姓名</label><div class="row" style="gap:8px"><input id="pvp-name" class="pvp-input" value="${esc(s.name)}" placeholder="请输入姓名，最多 16 字" maxlength="32"><div class="btn sm" data-a="pvp-name">保存</div></div><div class="tiny muted">培养实时沿用，站位与配装独立保存。点将领可换人或配装。</div></div>
    <div class="grid9 pvp-grid">${s.cells.map((n, i) => `${i % 3 === 0 ? `<div class="rowlab" style="grid-column:1/4">${['前排', '中排', '后排'][i / 3]}</div>` : ''}${ownCard(n, i)}`).join('')}</div>
    <div class="btns"><div class="btn sm" data-a="pvp-copy-team">复制闯关阵容与配装</div><div class="btn sm" data-a="pvp-auto">补满阵容</div><div class="btn sm" data-a="pvp-auto-equip">一键装备</div></div>
    <div class="btns"><div class="btn main" data-a="pvp-code">生成对战码</div></div>${back}`;
};
SG.VIEWS['pvp-challenge'] = () => `${title('开始对战')}<div class="small muted">粘贴朋友的 PVP 对战码，先查看阵容再开战。</div><textarea id="pvp-import" class="pvp-code" placeholder="把对战码粘贴在这里"></textarea><div class="btns"><div class="btn main" data-a="pvp-preview">查看对手</div></div>${back}`;
SG.VIEWS['pvp-preview'] = () => opponent ? `${title('对手阵容', esc(opponent.name))}${teamCards(opponent)}<div class="card small muted">以你当前保存的 PVP 阵容迎战。满兵上场，最多三十回合。</div><div class="btns"><div class="btn main" data-a="pvp-fight">开战</div><div class="btn" data-a="pvp-foe-detail">查看装备</div></div>${back}` : SG.VIEWS['pvp-challenge']();
SG.VIEWS['pvp-records'] = () => {
  const s = p(), groups = SG.PVP.recordGroups(s);
  return `<details class="pvp-trophies" id="pvp-trophies"${SG.V.pvpTrophiesOpen === false ? '' : ' open'}><summary class="sec"><h2>战利品</h2><span class="line"></span><span class="tp">${s.ears.length} 件 · <span class="pvp-fold-open">收起</span><span class="pvp-fold-closed">展开</span></span></summary>${s.ears.length ? `<div class="pvp-trophy-grid">${s.ears.map((e, i) => `<div class="card pvp-ear-cell" data-a="pvp-ear" data-i="${i}" role="button" tabindex="0" aria-label="查看耳朵战利品" title="${esc(e.foe)}">${earIcon}<div class="pvp-ear-name">${esc(e.foe)}</div></div>`).join('')}</div>` : '<div class="empty">尚未收获耳朵</div>'}
    </details>${title('对战记录', '最近 100 场')}${groups.map(({record:r,index:i,entries}) => `<div class="card small" data-a="pvp-record" data-i="${i}"><div class="row"><b class="kai">${esc(r.foe)}</b><span class="grow"></span><span style="color:var(--${r.result === '胜' ? 'zhu' : 'ink-2'})">${r.result}</span>　${r.rounds} 回合</div><div class="tiny muted">${esc(date(r.time))}${entries.length > 1 ? ' · 挑战 ' + entries.length + ' 次' : ''} · 点此查看详情</div></div>`).join('') || '<div class="empty">尚无对战记录</div>'}${back}`;
};
function selectHero(i) {
  openModal(`<div class="shead">选择将领<span class="x" data-a="close">关闭</span></div><div class="small muted">点击阵上将领可与这个位置交换。</div><div class="hgrid">${Object.keys(g().s.heroes).sort((a, b) => g().power(b) - g().power(a)).map(n => `<div class="hc tb-${SG.D.H[n]['品阶']}" data-a="pvp-pick" data-i="${i}" data-n="${esc(n)}">${por(n)}<div class="nm">${esc(g().hero(n)?.form==='god'?'神·'+n:n)}</div><div class="meta">Lv.${g().hero(n).lv} ${p().cells.includes(n) ? '阵上' : ''}</div></div>`).join('')}</div>`);
}
function cellSheet(i) {
  const n = p().cells[i]; if (!n) { selectHero(i); return; }
  openModal(`<div class="shead">${esc(n)}<span class="x" data-a="close">关闭</span></div><div class="btns"><div class="btn sm" data-a="pvp-change" data-i="${i}">换人 / 换位</div><div class="btn sm" data-a="pvp-remove" data-i="${i}">下阵</div></div>${SG.SLOTS.map(sl => {
    const it = g().item((p().gear[n] || {})[sl]), e = it && SG.D.EQID[it.id];
    return `<div class="card small" data-a="pvp-gear" data-n="${esc(n)}" data-sl="${sl}"><span class="muted">${sl}</span>　${e ? `${eqSeal(e)} ${esc(e['名'])}` : '空'}<span class="tiny muted">　点此更换</span></div>`;
  }).join('')}<div class="tiny muted">同一件装备只供一位 PVP 将领使用；不影响闯关配装。</div>`);
}
function gearSheet(n, sl) {
  openModal(`<div class="shead">${esc(n)} · ${sl}<span class="x" data-a="close">关闭</span></div><div class="btns"><div class="btn sm" data-a="pvp-wear" data-n="${esc(n)}" data-sl="${sl}" data-uid="">卸下</div></div>${g().s.bag.filter(it => SG.D.EQID[it.id]['槽'] === sl).sort((a, b) => g().compareItems(n, a, b)).map(it => {
    const e = SG.D.EQID[it.id], who = Object.keys(p().gear).find(x => p().gear[x][sl] === it.uid);
    return `<div class="card small" data-a="pvp-wear" data-n="${esc(n)}" data-sl="${sl}" data-uid="${it.uid}">${eqSeal(e)} <b>${esc(e['名'])}</b><div class="tiny muted">${U.KEYCN[e['维']] || esc(e['维'])} +${esc(e['固定'])}${+e['百分比'] ? ' +' + esc(e['百分比']) + '%' : ''}${who ? ' · PVP：' + esc(who) + '（选择后转移）' : ''}</div></div>`;
  }).join('') || '<div class="empty">没有此槽位装备</div>'}`);
}
function nameSave(show = true) {
  const el = $('pvp-name'); if (!el) return true;
  const name = el.value.trim();
  if (!name || [...name].length > 16 || /[\u0000-\u001f]/.test(name)) { toast('姓名须为 1 至 16 个字'); return false; }
  p().name = name; SG.save(); if (show) toast('姓名已保存'); return true;
}
Object.assign(SG.ACT, {
  'pvp-name': () => nameSave(),
  'pvp-cell': el => cellSheet(+el.dataset.i),
  'pvp-change': el => selectHero(+el.dataset.i),
  'pvp-pick': el => { const s = p(), i = +el.dataset.i, n = el.dataset.n, j = s.cells.indexOf(n); const next=s.cells.slice();if(j>=0)next[j]=s.cells[i];next[i]=n;s.cells=next; closeModal(); commit(); },
  'pvp-remove': el => { p().cells[+el.dataset.i] = null; closeModal(); commit(); },
  'pvp-gear': el => gearSheet(el.dataset.n, el.dataset.sl),
  'pvp-wear': el => { try { SG.PVP.equip(g(), el.dataset.n, el.dataset.sl, el.dataset.uid === '' ? null : +el.dataset.uid); SG.save(); cellSheet(p().cells.indexOf(el.dataset.n)); SG.render(); } catch (e) { toast(e.message); } },
  'pvp-copy-team': () => U.ask('复制闯关阵容', '替换当前 PVP 站位和配装？', '复制', () => { const s = p(); s.cells = g().s.formation.slice(); s.gear = JSON.parse(JSON.stringify(g().s.gear)); commit(); toast('已复制'); }),
  'pvp-auto-equip': () => { SG.PVP.autoEquip(g()); commit(); toast('专属优先，已按人物能力配装'); },
  'pvp-auto': () => { const s = p(), names = Object.keys(g().s.heroes).filter(n => !s.cells.includes(n)).sort((a, b) => g().power(b) - g().power(a)); for (let i = 0; i < 9; i++) if (!s.cells[i]) {s.cells[i]=names.shift()||null;} commit(); if (s.cells.includes(null)) toast('将领不足九人，先去招贤'); },
  'pvp-code': () => {
    if (!nameSave(false)) return;
    try { const code = SG.PVP.encode(SG.PVP.snapshot(g())); SG.save(); openModal(`<div class="shead">PVP 对战码<span class="x" data-a="close">关闭</span></div><div class="small muted">${esc(p().name)} · 生成时的阵容快照，发给朋友即可挑战。</div><textarea id="pvp-export" class="pvp-code" readonly>${esc(code)}</textarea><div class="tiny muted">${code.length} 字 · 培养或阵容变化后请重新生成</div><div class="btns"><div class="btn main" data-a="pvp-copy">复制对战码</div></div>`); } catch (e) { toast(e.message); }
  },
  'pvp-copy': async () => { const el = $('pvp-export'); el.select(); try { await navigator.clipboard.writeText(el.value); toast('对战码已复制'); } catch (e) { if (document.execCommand('copy')) toast('对战码已复制'); else toast('请长按文本框手动复制'); } },
  'pvp-challenge': () => { opponent = null; SG.go('pvp-challenge'); },
  'pvp-preview': () => { try { opponent = SG.PVP.decode($('pvp-import').value); if (opponent.owner === p().owner) throw new Error('不能挑战自己的对战码'); SG.go('pvp-preview'); } catch (e) { toast(e.message); } },
  'pvp-foe-detail': () => openModal(`<div class="shead">${esc(opponent.name)}<span class="x" data-a="close">关闭</span></div>${details(opponent)}`),
  'pvp-fight': () => {
    if (!opponent) return;
    try { const out = SG.PVP.fight(g(), opponent); out.note = esc(out.note); SG.save(); SG.Play.begin(out); } catch (e) { toast(e.message); }
  },
  'pvp-record': el => {
    const group = SG.PVP.recordGroups(p()).find(x => x.index === +el.dataset.i); if (!group) return;
    if (group.entries.length === 1) { SG.ACT['pvp-record-detail'](el); return; }
    openModal(`<div class="shead">${esc(group.record.foe)}<span class="x" data-a="close">关闭</span></div><div class="small muted">挑战 ${group.entries.length} 次</div>${group.entries.map(({record:r,index:i}) => `<div class="card small" data-a="pvp-record-detail" data-i="${i}"><div class="row"><b class="kai">${r.result}</b><span class="grow"></span>${r.rounds} 回合</div><div class="tiny muted">${esc(date(r.time))}${r.reward ? ' · ' + esc(r.reward) : ''} · 查看本场阵容</div></div>`).join('')}`);
  },
  'pvp-record-detail': el => { const r = p().records[+el.dataset.i], mine = SG.PVP.decode(r.mine), foe = SG.PVP.decode(r.opponent); openModal(`<div class="shead">${esc(foe.name)} · ${r.result}<span class="x" data-a="close">关闭</span></div><div class="small muted">${esc(date(r.time))} · ${r.rounds} 回合${r.reward ? ' · ' + esc(r.reward) : ''}</div>${title('我方', esc(mine.name))}${details(mine)}${title('对方', esc(foe.name))}${details(foe)}`); },
  'pvp-ear': el => { const e = p().ears[+el.dataset.i]; openModal(`<div class="shead">${esc(e.name)}<span class="x" data-a="close">关闭</span></div><div class="pvp-trophy">${earIcon}<div class="small muted">对战时间：${esc(date(e.time))}</div></div>${details(SG.PVP.decode(e.opponent))}`); },
});
document.addEventListener('toggle', e => { if (e.target.id === 'pvp-trophies') SG.V.pvpTrophiesOpen = e.target.open; }, true);
document.addEventListener('keydown', e => {
  const el = e.target.closest('[data-a="pvp-ear"]');
  if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); SG.ACT['pvp-ear'](el); }
});
// 离开输入框时保存合法姓名，避免编辑后切换页面丢失。
document.addEventListener('change', e => { if (e.target.id === 'pvp-name') nameSave(false); });
})();
