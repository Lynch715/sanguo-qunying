// 封神试炼与觉醒形态界面。
(function(){
'use strict';
const SG=window.SG,U=SG.ui,{esc,por,num,toast}=U;
const game=()=>SG.getGame();
function skill(n){const m=SG.God.DATA[n];return `<div class="skill"><span class="sn">${esc(m.title)}</span><span class="st">神形态</span><p>${esc(m.skillText)}</p><p>${esc(m.passiveText)}</p></div>`;}
function hero(n){const g=game(),m=SG.God.DATA[n];if(!m)return '';const p=g.godProgress(n),h=g.hero(n);
 return `<div class="card small god-panel"><b class="kai">神话设定 · ${esc(m.title)}</b><p>${esc(m.myth)}</p><div class="muted">架空觉醒设定。普通生平与人物本体保持一致。</div><p>${p.qualified?'试炼资格已取得':'尚未取得试炼资格'} · ${p.awakened?'已觉醒':'未觉醒'}</p>${p.awakened?`<div class="btns"><div class="btn main" data-a="god-form" data-n="${n}" data-form="${h.form==='god'?'normal':'god'}">切为${h.form==='god'?'普通':'神'}形态</div></div>`:`<div class="btns"><div class="btn" data-a="go" data-v="gods">前往封神试炼</div><div class="btn main" data-a="god-awaken" data-n="${n}">觉醒 · 100万金币</div></div>`}<div class="tiny muted">等级、星级、碎片、装备共用；每队最多上阵一位神将。专属装备保留属性加成，神技替换本体技能。</div></div>`;
}
SG.GodUI={skill,hero};
SG.VIEWS.gods=()=>{const g=game();return `<div class="sec"><h2>封神试炼</h2><span class="line"></span></div><div class="card small">二周目闯关开放。原将70级、5星并参加所属阵营试炼，通关获得觉醒资格。取得资格后，消耗100万金币即可觉醒。试炼不消耗兵力，失败不扣资源。觉醒资格和形态随存档跨周目保留。</div><div class="btns"><div class="btn" data-a="go" data-v="main">回主界面</div><div class="btn" data-a="go" data-v="form">调整试炼阵容</div></div>${['魏','蜀','吴','汉'].map(f=>`<div class="sec"><h2>${f} · 五神</h2><span class="line"></span></div><div class="hgrid god-grid">${Object.entries(SG.God.DATA).filter(([n,m])=>m.faction===f).map(([n,m])=>{const h=g.hero(n),p=g.godProgress(n);return `<div class="card god-card">${por('神·'+n,'m','', 'normal')}<b class="kai">神·${n}</b><div class="small">${esc(m.title)}</div><p class="tiny">${esc(m.skillText)}</p><p class="tiny muted">${esc(m.passiveText)}</p><div class="god-card-footer"><div class="tiny god-card-status">${h?`${h.lv}级 · ${h.star}星`:'尚未招募本体'}<br>${p.awakened?'已觉醒':p.qualified?'资格已取得':'等待试炼'}</div><div class="btns god-actions"><div class="btn sm" data-a="god-trial" data-n="${n}">挑战试炼</div>${h?`<div class="btn sm" data-a="hero" data-n="${n}">培养 / 觉醒</div>`:'<div class="god-action-spacer" aria-hidden="true"></div>'}</div></div></div>`;}).join('')}</div>`).join('')}`;};
document.addEventListener('click',e=>{const el=e.target.closest('[data-a]');if(!el)return;const a=el.dataset.a,n=el.dataset.n,g=game();if(!g)return;
 if(a==='god-form'){const out=g.setGodForm(n,el.dataset.form);if(out.err)return toast(out.err);SG.save();SG.go('hero');toast('形态已切换');}
 if(a==='god-awaken')U.ask('觉醒 · '+n,'消耗100万金币取得永久神形态。不会自动提升等级、星级。','觉醒',()=>{const out=g.awaken(n);if(out.err)return toast(out.err);SG.save();SG.go('hero');toast('已觉醒，可切换形态');});
 if(a==='god-trial'){const out=g.godTrial(n,g.s.formation);if(out.err)return toast(out.err);SG.save();SG.Play.begin(out);}
});
})();
