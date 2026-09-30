// 装到桌面：Chrome/Edge 走 beforeinstallprompt；Safari 没有安装接口，给图文指引。
// 玩进去 45 秒后问一次；点过「以后再说」或装过就不再问；存档菜单里随时能手动装。
// 更新：放到网上改版后，service worker 换代时提示「有新版本」，点了刷新。
(function () {
  const SG = window.SG;
  const KEY = 'sgqyl_pwa';
  let deferred = null, armed = false;
  const ua = navigator.userAgent;
  const standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Edg|OPR/.test(ua);
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isFirefox = /Firefox|FxiOS/.test(ua);
  const onWeb = location.protocol.startsWith('http');
  const st = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const setSt = v => { try { localStorage.setItem(KEY, v); } catch (e) { } };
  const guide = () => isIOS
    ? '点屏幕底部的<b>分享</b>按钮，往下找<b>「添加到主屏幕」</b>，再点右上角<b>添加</b>。'
    : '菜单栏<b>文件</b> → <b>「添加到程序坞」</b>。';
  function arm() {
    if (armed || standalone || !onWeb || isFirefox) return;
    const s = st(); if (s === 'dismissed' || s === 'installed') return;
    armed = true;
    const wait = () => {   // 等进了游戏（不在标题页）再开始计时
      if (SG.V && SG.V.mode && SG.V.mode !== 'title') setTimeout(offer, 45000);
      else setTimeout(wait, 2000);
    };
    wait();
  }
  function offer() {
    if (standalone || (!deferred && !isSafari)) return;
    if (document.querySelector('#modal.on')) { setTimeout(offer, 15000); return; }
    SG.ui.openModal(`<div class="shead">装到桌面</div>
      <div class="small">装好之后从桌面图标进，全屏，断网也能打。</div>
      ${deferred ? '' : `<div class="small" style="margin-top:6px">${guide()}</div>`}
      <div class="btns"><div class="btn" data-a="pwa-later">以后再说</div>${deferred ? '<div class="btn main" data-a="pwa-install">装</div>' : '<div class="btn main" data-a="pwa-later">知道了</div>'}</div>`);
  }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; arm(); });
  window.addEventListener('appinstalled', () => setSt('installed'));
  if (isSafari) window.addEventListener('load', arm);
  // 新版本提示
  if (onWeb && 'serviceWorker' in navigator) {
    const had = !!navigator.serviceWorker.controller; let shown = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!had || shown) return; shown = true;
      SG.ui.openModal(`<div class="shead">有新版本</div><div class="small">刷新一下就是新版，存档不受影响。</div>
        <div class="btns"><div class="btn" data-a="close">等会儿</div><div class="btn main" data-a="pwa-reload">刷　新</div></div>`);
    });
  }
  SG.pwa = {
    can: () => !standalone && onWeb && (!!deferred || isSafari),
    install: async () => {
      if (deferred) {
        deferred.prompt();
        try { const r = await deferred.userChoice; setSt(r.outcome === 'accepted' ? 'installed' : 'dismissed'); } catch (e) { }
        deferred = null; return;
      }
      SG.ui.openModal(`<div class="shead">装到桌面<span class="x" data-a="close">关闭</span></div><div class="small">${guide()}装好之后从图标进，断网也能打。</div>`);
    },
    later: () => { setSt('dismissed'); SG.ui.closeModal(); },
    reload: () => location.reload(),
  };
})();
