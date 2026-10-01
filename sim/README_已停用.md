# sim/ 下的 Python 模拟器已停用

停在 V0.5 规则（发技能不普攻、速度只管先手、输了回满等）。V0.6 起规则只改 JS（`src/`），对照测试 `test/parity.js` 会把新规则关掉再比。

现在的模拟都用 JS：`test/playthrough.js`（一周目）、`test/conquest.js`（霸业）、`sim/audit_v05/`（审计和数值测算，`gen_skill_power.js` 出战力用的技能系数表）。
