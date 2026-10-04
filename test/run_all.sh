#!/bin/bash
# 一键跑全部验收。快档（默认）几分钟；FULL=1 连一周目 120 局、霸业 64 局、对照一万场一起跑
# 界面测试要先起本地服务：python3 -m http.server 8765（在项目根目录）
cd "$(dirname "$0")/.." || exit 1
R=(); ok() { R+=("✓ $1"); }; bad() { R+=("✗ $1"); }
run() { local name="$1"; shift; local out; out=$("$@" 2>&1); local rc=$?; local last; last=$(echo "$out" | tail -1)
  if [ $rc -eq 0 ] && ! echo "$out" | grep -q "✗"; then ok "$name　$last"; else bad "$name　$last"; echo "$out" | grep "✗" | head -5; fi; }
run "构建"         python3 build.py --noassets
run "技能解析"     node test/parse_all.js
run "闯关规则"     node test/game_unit.js
run "功名"         node test/ach_unit.js
run "神将"         node test/gods.js
run "PVP"          node test/pvp.js
run "神将短码"     node test/pvp_gods_short.js
run "成长与周目"   node test/progression.js
run "存档码"       node test/saveio.js
if [ -n "$FULL" ]; then
  run "对照 Python" python3 test/parity_py.py 50
  run "对照 JS"     node test/parity.js 50
  run "对照比较"    python3 test/parity_cmp.py
  run "一周目 120 局" node test/playthrough.js 120
  run "霸业 64 局"  node test/conquest.js 16
  run "羁绊平衡"    node test/bond_balance.js 20 40
else
  run "一周目 20 局" node test/playthrough.js 20
  run "霸业 4 局"   node test/conquest.js 1
fi
if curl -s -o /dev/null localhost:8765; then
  for t in ui_smoke ui_play ui_conq ui_v03 ui_v04; do [ -f test/$t.py ] && run "界面 $t" python3 test/$t.py; done
else R+=("… 界面测试跳过：本地服务没起"); fi
echo; echo "==== 汇总 ===="; printf '%s\n' "${R[@]}"
python3 build.py >/dev/null 2>&1   # 恢复带图构建
