/* 三国群英录 · service worker（照水浒群星录的做法）
   代码（html/js/manifest）网络优先：联网打开永远是新版，断网才用缓存。
   图片缓存优先：地址都带 ?v=内容哈希，换了图地址就变，缓存里有就一定是对的。
   VER 由 build.py 按版本号和页面哈希写入，改版旧缓存自动清掉。 */
const VER = 'sgqyl-0.6-904b777d';
const SHELL = ['./', './index.html', './site.webmanifest', './favicon.ico', './assets/icons/icon-192.png', './assets/icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
const isImg = u => /\.(webp|png|jpg|jpeg|ico|svg)$/i.test(u.pathname);
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin !== location.origin) return;
  if (isImg(u)) {
    e.respondWith(caches.open(VER).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      return fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; });
    }));
    return;
  }
  e.respondWith(fetch(req).then(r => {
    if (r.ok) { const cp = r.clone(); caches.open(VER).then(c => c.put(req, cp)); }
    return r;
  }).catch(async () => (await caches.match(req)) || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)));
});
