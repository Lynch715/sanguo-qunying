// 验证首次安装预缓存的地图在离线图片请求中仍能取到。
const assert = require('assert'), fs = require('fs'), vm = require('vm');
(async () => {
  const events = {}, stores = new Map();
  const key = r => new URL(typeof r === 'string' ? r : r.url, 'https://game.test/').href;
  const caches = {
    async open(name) {
      if(!stores.has(name)) stores.set(name,new Map());
      const data = stores.get(name);
      return {async addAll(urls) {for(const u of urls) data.set(key(u),new Response('cached '+u));},async match(r) {return data.get(key(r));}};
    },
    async match(r) {for(const data of stores.values()) if(data.has(key(r))) return data.get(key(r));},
    async keys() {return [...stores.keys()];}, async delete(n) {return stores.delete(n);}
  };
  const url='./assets/maps/conquest-terrain-v1.webp?v=test';
  const code=fs.readFileSync('src/sw_template.js','utf8').replace('__VERSION__','offline-test').replace('__MAP_SHELL__',', '+JSON.stringify(url));
  vm.runInNewContext(code,{self:{addEventListener:(n,f)=>events[n]=f,skipWaiting:async()=>{},clients:{claim:async()=>{}}},location:{origin:'https://game.test'},URL,caches,fetch:async()=>{throw Error('offline');}});
  let installed; events.install({waitUntil:p=>installed=p}); await installed;
  let received; events.fetch({request:new Request('https://game.test/assets/maps/conquest-terrain-v1.webp?v=test'),respondWith:p=>received=p});
  assert.equal(await (await received).text(),'cached '+url);
  console.log('地图安装预缓存 → 离线图片读取通过');
})().catch(e=>{console.error(e);process.exitCode=1;});
