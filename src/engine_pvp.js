// 异步 PVP：阵容快照独立于闯关；不结算闯关资源。
(function () {
'use strict';
const SG = globalThis.SG;
const PREFIX = 'SGP3:', ZIP = 'SGP2:', LEGACY = 'SGP1:', RULE = 1, LIMIT = 16000;
const fail = m => { throw new Error(m); };
const int = (v, a, b) => Number.isInteger(v) && v >= a && v <= b;
function state(g) {
  if (g.kind === 'conquest') fail('PVP 只在闯关模式开放');
  const p = g.s.pvp || (g.s.pvp = { owner: crypto.randomUUID(), name: '', cells: Array(9).fill(null), gear: {}, claimed: {}, ears: [], records: [] });
  if (!p.owner) p.owner = crypto.randomUUID();
  p.cells = Array.from({ length: 9 }, (_, i) => g.hero((p.cells || [])[i]) ? p.cells[i] : null);
  p.gear = p.gear || {}; p.claimed = p.claimed || {}; p.ears = p.ears || []; p.records = p.records || [];
  for (const n of Object.keys(p.gear)) for (const sl of SG.SLOTS) {
    const it = g.item(p.gear[n][sl]);
    if (!it || !SG.D.EQID[it.id] || SG.D.EQID[it.id]['槽'] !== sl) p.gear[n][sl] = null;
  }
  return p;
}
function validate(raw) {
  if (!raw || raw.kind !== 'pvp' || raw.v !== RULE) fail('这不是兼容的 PVP 对战码');
  if (typeof raw.owner !== 'string' || !/^[a-zA-Z0-9-]{16,64}$/.test(raw.owner)) fail('对战码缺少玩家身份');
  if (typeof raw.name !== 'string' || !raw.name.trim() || [...raw.name.trim()].length > 16 || /[\u0000-\u001f]/.test(raw.name)) fail('姓名须为 1 至 16 个字');
  if (!Array.isArray(raw.team) || raw.team.length !== 9) fail('必须上阵九位将领');
  const seen = new Set();
  const team = raw.team.map(h => {
    if (!h || !Object.hasOwn(SG.D.H, h.n) || seen.has(h.n)) fail('将领无效或重复');
    seen.add(h.n);
    if (!int(h.lv, 1, 70) || !int(h.star, 1, 5)) fail('将领等级或星级无效');
    if (!Array.isArray(h.eq) || h.eq.length !== SG.SLOTS.length) fail('装备资料不全');
    const eq = h.eq.map((id, i) => {
      if (id === null) return null;
      if (typeof id !== 'string' || !Object.hasOwn(SG.D.EQID, id) || SG.D.EQID[id]['槽'] !== SG.SLOTS[i]) fail('装备无效或槽位不符');
      return id;
    });
    return { n: h.n, lv: h.lv, star: h.star, eq };
  });
  return { kind: 'pvp', v: RULE, owner: raw.owner, name: raw.name.trim(), team };
}
function snapshot(g) {
  const p = state(g), used = new Set();
  return validate({ kind: 'pvp', v: RULE, owner: p.owner, name: p.name, team: p.cells.map(n => {
    const h = n && g.hero(n); if (!h) fail('先上满九位将领');
    return { n, lv: h.lv, star: h.star, eq: SG.SLOTS.map(sl => {
      const uid = (p.gear[n] || {})[sl]; if (uid == null) return null;
      const it = g.item(uid); if (!it) return null;
      if (used.has(uid)) fail('同一件装备不能重复使用'); used.add(uid);
      return String(it.id);
    }) };
  }) });
}
// SGP3 用冻结字典和位字段保存资料，不依赖 JSON 键名或中文将领装备名。
const CAT = SG.PVP_CATALOG;
const widths = CAT.gear.map(ids => Math.ceil(Math.log2(ids.length + 1)));
const to64 = bytes => btoa(String.fromCharCode(...bytes));
async function checksum(bytes) { return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)).slice(0, 4); }
async function compact(s) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(s.owner)) return null;
  if (s.team.some(h => !CAT.heroes.includes(h.n) || h.eq.some((id, i) => id !== null && !CAT.gear[i].includes(id)))) return null;
  const name = new TextEncoder().encode(s.name);
  const denseBits = 9 * widths.reduce((a, b) => a + b, 0);
  const sparseBits = 36 + s.team.reduce((a, h) => a + h.eq.reduce((n, id, i) => n + (id === null ? 0 : widths[i]), 0), 0);
  const sparse = sparseBits < denseBits;
  const bits = [];
  const put = (value, width) => { for (let i = width - 1; i >= 0; i--) bits.push((value >>> i) & 1); };
  for (const h of s.team) {
    put(CAT.heroes.indexOf(h.n), 9); put(h.lv - 1, 7); put(h.star - 1, 3);
    h.eq.forEach((id, i) => {
      if (sparse) { put(id === null ? 0 : 1, 1); if (id !== null) put(CAT.gear[i].indexOf(id), widths[i]); }
      else put(id === null ? 0 : CAT.gear[i].indexOf(id) + 1, widths[i]);
    });
  }
  const bytes = new Uint8Array(3 + 16 + name.length + Math.ceil(bits.length / 8));
  bytes.set([CAT.v, sparse ? 1 : 0, name.length]);
  const hex = s.owner.replace(/-/g, '');
  for (let i = 0; i < 16; i++) bytes[3 + i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  bytes.set(name, 19);
  bits.forEach((bit, i) => { bytes[19 + name.length + (i >>> 3)] |= bit << (7 - (i % 8)); });
  const signed = new Uint8Array(bytes.length + 4); signed.set(bytes); signed.set(await checksum(bytes), bytes.length);
  return PREFIX + to64(signed);
}
async function expand(bytes) {
  if (bytes.length < 24 || bytes.length > 137) fail('短码长度无效');
  const body = bytes.slice(0, -4), sum = await checksum(body);
  if (!sum.every((b, i) => b === bytes[bytes.length - 4 + i])) fail('短码不完整或已损坏');
  if (body[0] !== CAT.v || body[1] > 1 || body[2] < 1 || body[2] > 64) fail('短码版本或姓名无效');
  const hex = Array.from(body.slice(3, 19), b => b.toString(16).padStart(2, '0')).join('');
  const owner = [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
  const name = new TextDecoder('utf-8', { fatal: true }).decode(body.slice(19, 19 + body[2]));
  let pos = (19 + body[2]) * 8;
  const get = width => {
    if (pos + width > body.length * 8) fail('短码阵容不全');
    let value = 0; for (let i = 0; i < width; i++, pos++) value = (value << 1) | ((body[pos >>> 3] >>> (7 - pos % 8)) & 1);
    return value;
  };
  const team = Array.from({ length: 9 }, () => {
    const n = CAT.heroes[get(9)], lv = get(7) + 1, star = get(3) + 1;
    const eq = CAT.gear.map((ids, i) => {
      const index = body[1] ? (get(1) ? get(widths[i]) + 1 : 0) : get(widths[i]);
      if (index > ids.length) fail('短码装备编号无效');
      return index === 0 ? null : ids[index - 1];
    });
    return { n, lv, star, eq };
  });
  if (Math.ceil(pos / 8) !== body.length || (pos % 8 && (body[body.length - 1] & ((1 << (8 - pos % 8)) - 1)))) fail('短码含多余资料');
  return validate({ kind: 'pvp', v: RULE, owner, name, team });
}
async function encode(raw) {
  const s = validate(raw), short = await compact(s); if (short) return short;
  // 非 UUID 旧身份或字典外新将领装备继续使用兼容的压缩格式。
  const bytes = new TextEncoder().encode(JSON.stringify(s));
  if (typeof CompressionStream !== 'function') return LEGACY + to64(bytes);
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return ZIP + to64(new Uint8Array(await new Response(stream).arrayBuffer()));
}
async function decode(code) {
  if (typeof code !== 'string' || code.length > LIMIT * 2) fail('对战码过长');
  code = code.replace(/\s/g, '').replace(/^sgp([123]):/i, (_, v) => 'SGP' + v + ':');
  const short = code.startsWith(PREFIX), zipped = code.startsWith(ZIP);
  if ((!short && !zipped && !code.startsWith(LEGACY)) || code.length > LIMIT) fail('请粘贴完整的 PVP 对战码');
  try {
    let bytes = Uint8Array.from(atob(code.slice(PREFIX.length)), c => c.charCodeAt(0));
    if (short) return await expand(bytes);
    if (zipped) {
      if (typeof DecompressionStream !== 'function') fail('浏览器不支持压缩对战码，请更新浏览器');
      const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
      const chunks = []; let size = 0;
      try {
        while (true) {
          const { done, value } = await reader.read(); if (done) break;
          size += value.length; if (size > LIMIT) fail('对战码资料过长'); chunks.push(value);
        }
      } finally { await reader.cancel().catch(() => {}); }
      bytes = new Uint8Array(size); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    }
    return validate(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
  } catch (e) { fail('对战码损坏或不兼容：' + e.message); }
}
// 姓名不参与奖励身份和随机种子；按规范化内容识别，不受 JSON 顺序和空格影响。
async function identity(raw) {
  const s = validate(raw);
  const bytes = new TextEncoder().encode(JSON.stringify({ v: s.v, owner: s.owner, team: s.team }));
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
}
async function fight(g, opponent) {
  const mine = snapshot(g), foe = validate(opponent), p = state(g);
  if (mine.owner === foe.owner) fail('不能挑战自己的对战码');
  const [myKey, key] = await Promise.all([identity(mine), identity(foe)]);
  SG.setBattleSeed(parseInt(myKey.slice(0, 8), 16) ^ parseInt(key.slice(8, 16), 16));
  const units = s => s.team.map(h => SG.mkHeroUnit(h.n, h.lv, h.star, h.eq.filter(x => x !== null)));
  const battle = new SG.Battle(units(mine), units(foe), true);
  const [winner, rounds] = battle.run(30);
  const result = winner === 0 ? '胜' : winner === 1 ? '败' : '平';
  let ear = null;
  const time = Date.now();
  if (winner === 0 && !Object.hasOwn(p.claimed, key)) {
    p.claimed[key] = true;
    ear = { key, name: foe.name + '的耳朵', time, opponent: foe };
    p.ears.unshift(ear);
  }
  p.records.unshift({ time, result, rounds, mine, opponent: foe, key, reward: ear ? ear.name : null });
  p.records = p.records.slice(0, 100);
  return { res: { win: winner === 0, rounds, battles: [battle] }, rew: {}, title: 'PVP · ' + foe.name, winTxt: result,
    note: ear ? ear.name : winner === 0 ? '已战胜这个阵容，耳朵已领取。' : winner === -1 ? '三十回合未分胜负。' : '此战败退，再整阵容。', back: 'pvp', backTxt: '回 PVP' };
}
function equip(g, n, sl, uid) {
  const p = state(g);
  if (!p.cells.includes(n) || !SG.SLOTS.includes(sl)) fail('请先选择阵上将领');
  if (uid != null) {
    const it = g.item(uid);
    if (!it || SG.D.EQID[it.id]['槽'] !== sl) fail('装备不存在或槽位不符');
    for (const gear of Object.values(p.gear)) for (const k of SG.SLOTS) if (gear[k] === uid) gear[k] = null;
  }
  (p.gear[n] || (p.gear[n] = {}))[sl] = uid;
}
// 仅合并列表展示，保留每一次实战和当时阵容，旧存档立即生效。
function recordGroups(p) {
  const map = new Map();
  (p.records || []).forEach((record, index) => {
    const key = record.key || JSON.stringify({ owner: record.opponent.owner, team: record.opponent.team });
    if (!map.has(key)) map.set(key, { key, index, record, entries: [] });
    map.get(key).entries.push({ index, record });
  });
  return [...map.values()];
}
SG.PVP = { state, snapshot, validate, encode, decode, identity, fight, equip, recordGroups, autoEquip: g => g.autoEquip(state(g).cells, state(g).gear), PREFIX, RULE };
})();
