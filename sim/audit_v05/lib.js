const { SG, DATA } = require('../../test/load_node.js');
SG.init(DATA);
const D = SG.D;
const H = D.H;
const byTier = {}; for (const n of D.HLIST) (byTier[H[n]['品阶']] = byTier[H[n]['品阶']] || []).push(n);
function mk(n, lv = 50, star = 1, gear = null, noskill = false) {
  const u = SG.mkHeroUnit(n, lv, star, gear);
  if (noskill) { u.skill = null; }
  return u;
}
function order(names) { // 武将前排
  const f = names.filter(n => H[n] && H[n]['定位'] === '武将'), b = names.filter(n => !(H[n] && H[n]['定位'] === '武将'));
  return f.concat(b);
}
function fight(A, B, seed) {
  SG.setBattleSeed(seed);
  const bt = new SG.Battle(A, B, false);
  const [w, r] = bt.run();
  const ra = A.reduce((s, u) => s + Math.max(0, u.hp), 0) / A.reduce((s, u) => s + u.maxhp, 0);
  const rb = B.reduce((s, u) => s + Math.max(0, u.hp), 0) / B.reduce((s, u) => s + u.maxhp, 0);
  return { w, r, m: ra - rb, bt };
}
function rng(seed) { return SG.makeRng(seed); }
module.exports = { SG, D, H, byTier, mk, order, fight, rng };
