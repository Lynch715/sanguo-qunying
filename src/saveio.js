// 存档码：压缩（浏览器自带 deflate-raw）+ base64，前缀 SG1:；老码（V0.3 以前，JSON 直接 base64）照样认
(function () {
const SG = globalThis.SG;
const PREFIX = 'SG1:';
const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = s => { const t = atob(s); const u = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) u[i] = t.charCodeAt(i); return u; };
async function pipe(u8, stream) {
  const r = new Response(new Blob([u8]).stream().pipeThrough(stream));
  return new Uint8Array(await r.arrayBuffer());
}
const canZip = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';
async function encode(json) {
  const raw = new TextEncoder().encode(json);
  if (!canZip()) return b64(raw);
  return PREFIX + b64(await pipe(raw, new CompressionStream('deflate-raw')));
}
async function decode(code) {
  code = (code || '').replace(/\s+/g, '');
  if (!code) throw new Error('空的');
  if (code.startsWith(PREFIX)) {
    if (!canZip()) throw new Error('这个浏览器解不开压缩存档，换 Chrome 或 Safari 新版');
    return new TextDecoder().decode(await pipe(unb64(code.slice(PREFIX.length)), new DecompressionStream('deflate-raw')));
  }
  return new TextDecoder().decode(unb64(code));
}
// 看一眼存档里是什么：{ kind:'camp'|'conquest', s, sum } 或 { err }
function inspect(json) {
  let s;
  try { s = JSON.parse(json); } catch (e) { return { err: '码不全，或者不是本游戏的存档' }; }
  if (!s || typeof s !== 'object' || !s.heroes || !s.formation) return { err: '这不是三国群英录的存档' };
  if (s.v !== 1) return { err: `存档版本对不上（${s.v}）` };
  const n = Object.keys(s.heroes).length;
  if (!n) return { err: '存档里一个将领也没有' };
  if (s.kind === 'conquest') {
    if (!s.world) return { err: '霸业存档不全，缺地图' };
    const me = s.world.me, cities = Object.values(s.world.city || {}).filter(c => c.owner === me).length;
    return { kind: 'conquest', s, sum: `霸业 ${me}　第 ${s.world.turn} 回合　${cities} 城　${n} 将` };
  }
  return { kind: 'camp', s, sum: `闯关 ${s.cycle || 1} 周目　${n} 将　本周目通 ${Object.keys(s.cleared || {}).length} 关` };
}
SG.SaveIO = { encode, decode, inspect, PREFIX };
})();
