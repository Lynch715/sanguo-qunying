// node 端载入 tsv 数据与引擎
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
function tsv(name) {
  const lines = fs.readFileSync(path.join(ROOT, 'data', name), 'utf8').replace(/\r/g, '').split('\n').filter(l => l.length);
  const h = lines[0].split('\t');
  return lines.slice(1).map(l => { const c = l.split('\t'); const o = {}; h.forEach((k, i) => o[k] = c[i] == null ? '' : c[i]); return o; });
}
const DATA = { heroes: tsv('heroes_all.tsv'), skills: tsv('skills_dsl.tsv'), equip: tsv('equip.tsv'), set4: tsv('set4.tsv'), stages: tsv('stages.tsv'), cities: tsv('cities.tsv'), bonds: tsv('bonds.tsv') };
globalThis.SGDATA = DATA;
for (const f of ['engine_battle.js', 'engine_game.js', 'engine_ach.js', 'engine_conquest.js']) { const p = path.join(ROOT, 'src', f); if (fs.existsSync(p)) require(p); }
if (globalThis.SG && globalThis.SG.setBonds) globalThis.SG.setBonds(DATA.bonds);
module.exports = { SG: globalThis.SG, DATA, tsv };
