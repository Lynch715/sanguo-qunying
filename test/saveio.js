// 存档码：压缩往返、老码、坏码、别家的码、空档
const { SG, DATA } = require('./load_node');
require('../src/saveio.js');
SG.init(DATA);
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('✗', m); } else console.log('✓', m); };
(async () => {
  const g = SG.Game.fresh(5); for (const n of SG.D.HLIST.slice(0, 80)) g.addHero(n); for (const s of SG.D.STAGES.slice(0, 60)) g.s.cleared[s.id] = 1;
  const json = g.toJSON();
  const code = await SG.SaveIO.encode(json);
  const old = Buffer.from(json, 'utf8').toString('base64');
  ok(code.startsWith('SG1:'), `压缩码 ${code.length} 字，老码 ${old.length} 字`);
  ok(await SG.SaveIO.decode(code) === json, '压缩码往返');
  ok(await SG.SaveIO.decode(old) === json, '老码能读');
  ok(await SG.SaveIO.decode(code.slice(0, 5) + '\n' + code.slice(5)) === json, '码里夹了换行也能读');
  let e = null; try { await SG.SaveIO.decode(code.slice(0, code.length - 40)); } catch (x) { e = x; }
  ok(e || SG.SaveIO.inspect('').err, '截断的码拒收');
  ok(!!SG.SaveIO.inspect('{"a":1}').err, '别家的 JSON 拒收');
  const s = JSON.parse(json); s.heroes = {}; ok(/一个将领也没有/.test(SG.SaveIO.inspect(JSON.stringify(s)).err), '空档拒收');
  const s2 = JSON.parse(json); s2.v = 9; ok(/版本/.test(SG.SaveIO.inspect(JSON.stringify(s2)).err), '版本不对拒收');
  const r = SG.SaveIO.inspect(json); ok(r.kind === 'camp' && /\d+ 将/.test(r.sum), r.sum);
  const cg = SG.ConquestGame.fresh('蜀', 3); const rc = SG.SaveIO.inspect(cg.toJSON()); ok(rc.kind === 'conquest', rc.sum);
  console.log(fail ? `✗ ${fail}` : '全过');
})();
