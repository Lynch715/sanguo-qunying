// 异步 PVP：阵容快照独立于闯关；不结算闯关资源。对战码只有 SGP3 一种格式，全部同步、不依赖 crypto.subtle。
(function () {
'use strict';
const SG = globalThis.SG;
const PREFIX = 'SGP3:', RULE = 1, FMT = 2;
const fail = m => { throw new Error(m); };
const int = (v, a, b) => Number.isInteger(v) && v >= a && v <= b;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function uuid() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // http 局域网没有 randomUUID，用 getRandomValues 拼一个 v4。
  const b = crypto.getRandomValues(new Uint8Array(16)); b[6] = b[6] & 15 | 64; b[8] = b[8] & 63 | 128;
  const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
  return [h.slice(0, 8), h.slice(8, 12), h.slice(12, 16), h.slice(16, 20), h.slice(20)].join('-');
}
// FNV-1a 32 位：码的完整性校验和奖励身份都用它，哪里都能跑。
function fnv(bytes, seed) { let h = seed; for (const b of bytes) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
const hex8 = n => n.toString(16).padStart(8, '0');
const checksum = bytes => { const h = fnv(bytes, 0x811c9dc5); return [h >>> 24, h >>> 16 & 255, h >>> 8 & 255, h & 255]; };

function state(g) {
  if (g.kind === 'conquest') fail('PVP 只在闯关模式开放');
  const p = g.s.pvp || (g.s.pvp = { owner: uuid(), name: '', cells: Array(9).fill(null), gear: {}, claimed: {}, ears: [], records: [] });
  if (!p.owner) p.owner = uuid();
  p.cells = Array.from({ length: 9 }, (_, i) => g.hero((p.cells || [])[i]) ? p.cells[i] : null);
  p.gear = p.gear || {}; p.claimed = p.claimed || {}; p.ears = p.ears || []; p.records = p.records || [];
  for (const n of Object.keys(p.gear)) {
    if (!p.gear[n] || typeof p.gear[n] !== 'object') { delete p.gear[n]; continue; }
    for (const sl of SG.SLOTS) {
      const it = g.item(p.gear[n][sl]);
      if (!it || !SG.D.EQID[it.id] || SG.D.EQID[it.id]['槽'] !== sl) p.gear[n][sl] = null;
    }
  }
  if (p.fmt !== FMT) migrate(p);
  return p;
}
// 旧档的战绩和耳朵存的是整份阵容 JSON，改成只存对战码；奖励身份也按新算法重算。
function migrate(p) {
  const pack = s => typeof s === 'string' ? decode(s) && s : encode({ ...s, v: RULE });
  p.records = p.records.flatMap(r => { try {
    const mine = pack(r.mine), opponent = pack(r.opponent), foe = decode(opponent);
    return [{ time: r.time, result: r.result, rounds: r.rounds, foe: foe.name, mine, opponent, key: identity(foe), reward: r.reward || null }];
  } catch { return []; } });
  p.claimed = {};
  p.ears = p.ears.flatMap(e => { try {
    const opponent = pack(e.opponent), foe = decode(opponent), key = identity(foe);
    p.claimed[key] = true;
    return [{ key, name: e.name || foe.name + '的耳朵', foe: foe.name, time: e.time, opponent }];
  } catch { return []; } });
  p.fmt = FMT;
}
function validate(raw) {
  if (!raw || raw.kind !== 'pvp' || raw.v !== RULE) fail('这不是兼容的 PVP 对战码');
  if (typeof raw.owner !== 'string' || !UUID.test(raw.owner)) fail('对战码缺少玩家身份');
  if (typeof raw.name !== 'string' || !raw.name.trim() || [...raw.name.trim()].length > 16 || /[\u0000-\u001f]/.test(raw.name)) fail('姓名须为 1 至 16 个字');
  if (!Array.isArray(raw.team) || raw.team.length !== 9) fail('必须上阵九位将领');
  const seen = new Set();
  const team = raw.team.map(h => {
    if (!h || !Object.hasOwn(SG.D.H, h.n) || seen.has(h.n)) fail('将领无效或重复');
    seen.add(h.n);
    if (!int(h.lv, 1, 100) || !int(h.star, 1, 7)) fail('将领等级或星级无效');
    if (!Array.isArray(h.eq) || h.eq.length !== SG.SLOTS.length) fail('装备资料不全');
    const eq = h.eq.map((id, i) => {
      if (id === null) return null;
      if (typeof id !== 'string' || !Object.hasOwn(SG.D.EQID, id) || SG.D.EQID[id]['槽'] !== SG.SLOTS[i]) fail('装备无效或槽位不符');
      return id;
    });
    if (h.form != null && !['normal', 'god'].includes(h.form)) fail('形态无效');
    if (h.form === 'god' && !SG.God?.DATA[h.n]) fail('神形态资料无效');
    return { n: h.n, lv: h.lv, star: h.star, eq, ...(h.form === 'god' ? { form: 'god' } : {}) };
  });
  return { kind: 'pvp', v: RULE, owner: raw.owner, name: raw.name.trim(), team };
}
function snapshot(g) {
  const p = state(g), used = new Set();
  return validate({ kind: 'pvp', v: RULE, owner: p.owner, name: p.name, team: p.cells.map(n => {
    const h = n && g.hero(n); if (!h) fail('先上满九位将领');
    return { n, lv: h.lv, star: h.star, ...(h.form === 'god' ? { form: 'god' } : {}), eq: SG.SLOTS.map(sl => {
      const uid = (p.gear[n] || {})[sl]; if (uid == null) return null;
      const it = g.item(uid); if (!it) return null;
      if (used.has(uid)) fail('同一件装备不能重复使用'); used.add(uid);
      return String(it.id);
    }) };
  }) });
}
// 码的字节布局：[字典版][布局位：bit0 稀疏装备、bit1 单神将、bit2 多神将][姓名字节数] UUID 16 字节 姓名 位字段阵容 校验 4 字节。
// 位字段：单神将先 4 位神将位置，多神将先 9 位形态标记；每人 将领 9 位、等级 7 位、星级 3 位、四槽装备（稀疏：1 位有无 + 编号；全量：编号+1）。
const CAT = SG.PVP_CATALOG;
const widths = CAT.gear.map(ids => Math.ceil(Math.log2(ids.length + 1)));
const GEAR_BITS = 9 * widths.reduce((a, b) => a + b, 0);
const MAX_BYTES = 3 + 16 + 64 + Math.ceil((9 + 9 * 19 + GEAR_BITS) / 8) + 4;
const to64 = bytes => btoa(String.fromCharCode(...bytes));
function encode(raw) {
  const s = validate(raw);
  if (s.team.some(h => !CAT.heroes.includes(h.n) || h.eq.some((id, i) => id !== null && !CAT.gear[i].includes(id)))) fail('阵容里有对战码暂不支持的将领或装备');
  const name = new TextEncoder().encode(s.name);
  const sparseBits = 36 + s.team.reduce((a, h) => a + h.eq.reduce((n, id, i) => n + (id === null ? 0 : widths[i]), 0), 0);
  const sparse = sparseBits < GEAR_BITS, godIndex = s.team.findIndex(h => h.form === 'god'), multiGod = s.team.filter(h => h.form === 'god').length > 1;
  const bits = [];
  const put = (value, width) => { for (let i = width - 1; i >= 0; i--) bits.push((value >>> i) & 1); };
  if (multiGod) s.team.forEach(h => put(h.form === 'god' ? 1 : 0, 1));
  else if (godIndex >= 0) put(godIndex, 4);
  for (const h of s.team) {
    put(CAT.heroes.indexOf(h.n), 9); put(h.lv - 1, 7); put(h.star - 1, 3);
    h.eq.forEach((id, i) => {
      if (sparse) { put(id === null ? 0 : 1, 1); if (id !== null) put(CAT.gear[i].indexOf(id), widths[i]); }
      else put(id === null ? 0 : CAT.gear[i].indexOf(id) + 1, widths[i]);
    });
  }
  const bytes = new Uint8Array(3 + 16 + name.length + Math.ceil(bits.length / 8));
  bytes.set([CAT.v, (sparse ? 1 : 0) + (multiGod ? 4 : godIndex >= 0 ? 2 : 0), name.length]);
  const hex = s.owner.replace(/-/g, '');
  for (let i = 0; i < 16; i++) bytes[3 + i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  bytes.set(name, 19);
  bits.forEach((bit, i) => { bytes[19 + name.length + (i >>> 3)] |= bit << (7 - (i % 8)); });
  const signed = new Uint8Array(bytes.length + 4); signed.set(bytes); signed.set(checksum(bytes), bytes.length);
  return PREFIX + to64(signed);
}
function decode(code) {
  if (typeof code !== 'string' || code.length > 2000) fail('对战码过长');
  code = code.replace(/\s/g, '');
  if (!/^sgp3:/i.test(code)) fail('请粘贴完整的 PVP 对战码');
  let bytes;
  try { bytes = Uint8Array.from(atob(code.slice(PREFIX.length)), c => c.charCodeAt(0)); } catch { fail('对战码损坏或不完整'); }
  if (bytes.length < 24 || bytes.length > MAX_BYTES) fail('对战码长度无效');
  const body = bytes.slice(0, -4);
  if (!checksum(body).every((b, i) => b === bytes[bytes.length - 4 + i])) fail('对战码不完整或已损坏');
  if (body[0] !== CAT.v || body[1] > 5 || body[2] < 1 || body[2] > 64) fail('对战码版本或姓名无效');
  const hex = Array.from(body.slice(3, 19), b => b.toString(16).padStart(2, '0')).join('');
  const owner = [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
  let name;
  try { name = new TextDecoder('utf-8', { fatal: true }).decode(body.slice(19, 19 + body[2])); } catch { fail('对战码姓名损坏'); }
  let pos = (19 + body[2]) * 8;
  const get = width => {
    if (pos + width > body.length * 8) fail('对战码阵容不全');
    let value = 0; for (let i = 0; i < width; i++, pos++) value = (value << 1) | ((body[pos >>> 3] >>> (7 - pos % 8)) & 1);
    return value;
  };
  const sparse = !!(body[1] & 1), godMask = body[1] & 4 ? Array.from({length:9},()=>get(1)) : null, godIndex = body[1] & 2 ? get(4) : -1;
  if (godIndex > 8) fail('神将位置无效');
  const team = Array.from({ length: 9 }, (_, position) => {
    const n = CAT.heroes[get(9)], lv = get(7) + 1, star = get(3) + 1;
    const eq = CAT.gear.map((ids, i) => {
      const index = sparse ? (get(1) ? get(widths[i]) + 1 : 0) : get(widths[i]);
      if (index > ids.length) fail('对战码装备编号无效');
      return index === 0 ? null : ids[index - 1];
    });
    return { n, lv, star, eq, ...((godMask ? godMask[position] : position === godIndex) ? { form: 'god' } : {}) };
  });
  if (Math.ceil(pos / 8) !== body.length || (pos % 8 && (body[body.length - 1] & ((1 << (8 - pos % 8)) - 1)))) fail('对战码含多余资料');
  return validate({ kind: 'pvp', v: RULE, owner, name, team });
}
// 奖励身份：玩家身份 + 阵容，不含姓名；改名不重置奖励。
function identity(raw) {
  const s = validate(raw), bytes = new TextEncoder().encode(JSON.stringify({ owner: s.owner, team: s.team }));
  return hex8(fnv(bytes, 0x811c9dc5)) + hex8(fnv(bytes, 0x2f6b7a33));
}
function fight(g, opponent) {
  const mine = snapshot(g), foe = validate(opponent), p = state(g);
  if (mine.owner === foe.owner) fail('不能挑战自己的对战码');
  const myKey = identity(mine), key = identity(foe);
  SG.setBattleSeed(parseInt(myKey.slice(0, 8), 16) ^ parseInt(key.slice(8, 16), 16));
  const units = s => s.team.map(h => SG.mkHeroUnit(h.n, h.lv, h.star, h.eq.filter(x => x !== null), null, h.form));
  const battle = new SG.Battle(units(mine), units(foe), true);
  const [winner, rounds] = battle.run(30);
  const result = winner === 0 ? '胜' : winner === 1 ? '败' : '平';
  const time = Date.now(), foeCode = encode(foe);
  let ear = null;
  if (winner === 0 && !Object.hasOwn(p.claimed, key)) {
    p.claimed[key] = true;
    ear = { key, name: foe.name + '的耳朵', foe: foe.name, time, opponent: foeCode };
    p.ears.unshift(ear);
  }
  p.records.unshift({ time, result, rounds, foe: foe.name, mine: encode(mine), opponent: foeCode, key, reward: ear ? ear.name : null });
  p.records = p.records.slice(0, 100);
  return { res: { win: winner === 0, rounds, battles: [battle] }, rew: {}, title: 'PVP · ' + foe.name, winTxt: result,
    note: ear ? ear.name : winner === 0 ? '已战胜这个阵容，耳朵已领取。' : winner === -1 ? '三十回合未分胜负。' : '此战败退，再整阵容。', back: 'pvp', backTxt: '回 PVP' };
}
function equip(g, n, sl, uid) {
  const p = state(g);
  if (!p.cells.includes(n) || !SG.SLOTS.includes(sl)) fail('请先选择阵上将领');
  if (uid != null) {
    const it = g.item(uid);
    if (!it || !SG.D.EQID[it.id] || SG.D.EQID[it.id]['槽'] !== sl) fail('装备不存在或槽位不符');
    for (const gear of Object.values(p.gear)) for (const k of SG.SLOTS) if (gear[k] === uid) gear[k] = null;
  }
  (p.gear[n] || (p.gear[n] = {}))[sl] = uid;
}
// 仅合并列表展示，保留每一次实战和当时阵容。
function recordGroups(p) {
  const map = new Map();
  (p.records || []).forEach((record, index) => {
    const key = record.key;
    if (!map.has(key)) map.set(key, { key, index, record, entries: [] });
    map.get(key).entries.push({ index, record });
  });
  return [...map.values()];
}
SG.PVP = { state, snapshot, validate, encode, decode, identity, fight, equip, recordGroups, autoEquip: g => g.autoEquip(state(g).cells, state(g).gear), PREFIX, RULE };
})();
