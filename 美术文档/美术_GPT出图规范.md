# 美术出图规范（交给 GPT 出图用）

> **2026-10-01 起立绘原图按档放在 `assets/立绘/<档>/<中文名>.png`**（无双、虎、名、骁、校_范式、杂兵）。下文写的 `assets/portraits/source/...`、`gongbi/...` 路径作废：出好的图直接存成对应档文件夹里的中文名，覆盖旧图，再跑 `python3 build_portraits.py`。


这份规范放在一起交给 GPT：还没出的 43 张，加上要重出的 36 张，共 79 张，分成 27 批，每批 3 张。

## 怎么用

1. 开一个新的 ChatGPT 对话，先把下面「第一条消息」整段贴进去，等它回 ready。
2. 再按顺序一批一批贴「第 N 批」。每批出 3 张，一张一张下载。
3. 下载后按批里写的「存为」改名，放到对应位置。重出的会覆盖现在裁坏的那张，原件在 `assets/_原图备份/` 里留着。
4. 每出完 4、5 批就开一个新对话，重新贴第一条消息。对话一长 GPT 会忘规则，比例和手又会出问题。
5. GPT 出的图只能是 1024×1536（2:3）的话也行，规则里已经要求它把下面 12% 空出来，我接图时从底部裁成 3:4。只要出了方图或横图，直接让它重画，别存。
6. 每放好几批就跟我说一声，我检查完接进游戏。

## 第一条消息（整段复制）

```
You are painting character portraits for a Chinese Three Kingdoms strategy game. Every image must follow ALL rules below. The rules beat any pose described later.

CANVAS
- Portrait orientation only. Best: exactly 3:4 (e.g. 1086x1448). If only 1024x1536 is available, use it, and treat the bottom 12% as a crop zone: nothing important there (no hands, no weapon tips, no props) — only robe, armor skirt or background. Never square, never landscape.

FRAME RULES
- One figure only, waist-up (head to hips), three-quarter view, centered. Top of the head/helmet/plume at least 4% below the top edge.
- Safe zone: the figure, BOTH hands and everything held must stay at least 6% away from the left and right edges. Nothing important touches or crosses any edge.
- The pose must be compact and vertical. If a description asks for a wide pose, adapt it:
  - drawing a bow: figure turned toward the viewer, bow held upright, the whole bow inside the frame;
  - pointing: arm bent, hand near chest or shoulder, pointing toward the viewer or upward;
  - spear / polearm: held upright or diagonally upward, never level and sideways; the blade inside the frame;
  - sword / sabre / axe: raised vertically beside or above the shoulder, or resting on the shoulder;
  - throwing / swinging: show the moment before, weapon raised close to the body.

HANDS AND BODY
- Exactly two arms and two hands, both visible unless the description hides one in a sleeve. Five fingers per hand, natural joints. No fused, extra or missing fingers. No third hand.
- Each hand does one thing: grips ONE object or rests. A hand holding a dagger cannot also draw a bow.
- Head, neck, shoulders and arms connect correctly; normal head size.

WEAPONS AND PROPS
- Spears and polearms: one continuous straight shaft; the parts above and below each hand line up exactly; the shaft continues behind the hand; the head is visible inside the frame.
- Bows: exactly ONE string attached to both tips. If drawn, the drawing hand pinches string and arrow nock together at the cheek or chin, the arrow rests on the bow hand. If not drawn, the string is straight.
- Crossbows: the whole crossbow inside the frame.
- Only one weapon in active use; any other weapon sheathed or slung. No duplicated objects, no floating weapon heads, no extra restraints or props that are not described.
- No other people in the foreground. Background soldiers, if any, are tiny and far away.

STYLE (apply to every image)
STYLE: Tang–Song court academy "gongbi" painting on bright white xuan paper. Extremely fine, even "iron-wire" ink outlines; every fold and armor scale delineated. Opaque mineral pigments in layers: azurite blue, malachite green, cinnabar red, gamboge yellow, shell-white, fine gold outlining on metal. Bright, clean, luminous, like a freshly painted court scroll — not aged. Face modeled with the traditional "three whites" (forehead, nose bridge, chin) and a touch of pink on the cheeks; no western shadow. The face must be a specific East Asian adult with real bone structure, drawn to the description below, not a generic handsome face.
COMPOSITION: single figure, waist-up, three-quarter view, centered, head in the upper third, vertical portrait canvas (see FRAME RULES). Background is painted in the same flat gongbi manner, simplified, lighter in value than the figure, and must never overlap the face.
FINISH: fine paper texture, colors flat and rich. No text, no seal, no signature, no border, no frame.

NEGATIVE: aged paper, yellowed silk, sepia, muted, desaturated, ink wash, loose brushwork, anime, manga, chibi, big eyes, small pointed chin, beauty-filter face, idealized symmetrical face, generic handsome man, generic pretty woman, same face, western features, photorealistic, 3D render, glossy skin, bloom, lens flare, chiaroscuro, full body, multiple figures, landscape orientation, square image, wide shot, hands cut off by the frame, weapon cut off by the frame, extra fingers, fused fingers, missing fingers, extra hand, extra arm, broken or misaligned spear shaft, shaft ending at the fist, two bowstrings, loose strings, floating weapon head, duplicated prop, text, watermark, signature, frame, border

OUTPUT PROTOCOL
- I will send batches of 3 characters. Make exactly 3 SEPARATE images, one per character, in the order given. Never put two characters in one image. Never make a sheet or grid.
- Before showing each image, check it against this list and redraw if any item fails:
  1. portrait orientation, not square, not landscape;
  2. both hands fully visible, 5 fingers each, nothing crossing the left/right edge;
  3. weapon complete and inside the frame, shaft continuous, bow has one string;
  4. bottom 12% has no hands or weapon tips (if the canvas is 1024x1536);
  5. single figure, face matches the description, bright white-paper gongbi style.
- After each image write one line: the file name I gave, then "checked".

Reply "ready" and wait for the first batch.
```

## 第 1 批

存为：
- 图 1：孙策（重出）→ `assets/portraits/gongbi/sunce.png`
- 图 2：祝融（重出）→ `assets/portraits/source/zhu_rong.png`
- 图 3：关银屏（重出）→ `assets/portraits/source/guan_yin_ping.png`

```
BATCH 01 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: sunce.png
SUBJECT: Sun Ce, 24, tall, athletic, long legs.
FACE: handsome open face with a strong jaw and high cheekbones; skin tanned gold; brows thick and upswept; eyes large, bright, laughing; straight nose; a wide mouth grinning; clean-shaven. Expression: joyful, reckless.
HEAD: hair in a high topknot with a red cord, no helmet, a few strands blown loose.
DRESS: cinnabar-red robe with malachite-green scale armor, sleeves pushed up, a green cloak flying.
WEAPON: a spear held one-handed, pointed forward.
BEARING: riding — leaning forward, hair and cloak streaming back.
BACKGROUND: the Yangtze at Jiangdong, flat blue water bands and a red sun.
NOTE: Last attempt: the spear shaft stopped at his fist. The spear must be one continuous long shaft running through the hand and continuing behind it.

IMAGE 2 — file name: zhu_rong.png
SUBJECT: Zhurong, 30, a strong stocky woman, broad shoulders, thick arms, a fighter's stance.
FACE: bony face with high cheekbones and a heavy jaw; copper-red skin; brows black and slanting hard upward; eyes long, narrowed, cold; a hooked nose with a gold ring; a wide flat mouth with the lower lip painted red; a scar across the left cheekbone. A southern warrior's face, not a court beauty. Expression: cold contempt, having just picked her target.
HEAD: hair in many small braids gathered with red cord, a headdress of feathers and silver coins.
DRESS: a purple short jacket with ochre trim, a breastplate of silver disks, bare arms with silver bands, a wrapped skirt.
WEAPON: a flying knife caught mid-throw, arm extended; four more knives in a leather bandolier.
BEARING: half-turned, one arm extended having just thrown, eyes following the blade.
BACKGROUND: the Silver Pit cave mouth — flat ochre rock with red-flowering trees, a stone drum.
NOTE: Last attempt: she held a dagger in the hand that should draw the bow, and the arrow floated with no hand on the string. Use ONE weapon: the bow, drawn properly (drawing hand pinches string and nock at the cheek), dagger sheathed at the waist.

IMAGE 3 — file name: guan_yin_ping.png
SUBJECT: Guan Yinping, 21, medium height, athletic, straight shoulders, strong hands.
FACE: heart-shaped face with a wide forehead, fair skin with color in the cheeks; brows long and slightly upswept like her father's; eyes long, keen, attentive; a straight nose; a firm small mouth. A young woman with a real jaw, not a doll. Expression: keen, listening to a report, about to ask a question.
HEAD: hair in a single high tail bound with green cord, a narrow silver band across the brow.
DRESS: a cinnabar-red fitted battle jacket with green edging, light silver scale armor over the chest, leather bracers, a short cloak.
WEAPON: a bow held across one knee while she loops the string onto it; a quiver at the back.
BEARING: down on one knee, stringing the bow, face turned up to the viewer.
BACKGROUND: the Jiangling river tower in flat green and ochre, the Yangtze as a pale band, a green Guan banner.
NOTE: Last attempt: several loose strings around the bow, one entering from outside the frame. The bow has exactly one string attached to both tips.

```

## 第 2 批

存为：
- 图 1：田丰（重出）→ `assets/portraits/gongbi/tiger/tianfeng.png`
- 图 2：鲍信（重出）→ `assets/portraits/source/bao_xin.png`
- 图 3：管亥（重出）→ `assets/portraits/source/guan_hai.png`

```
BATCH 02 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: tianfeng.png
SUBJECT: Tian Feng, 52, tall, rigid, thin, a stiff straight back.
FACE: bony face with high cheekbones; skin pale olive; brows thick, dark and drawn together; eyes hard, unblinking, fixed on the viewer; a thin straight nose; a mouth pressed into a hard line, corners turned down; a sparse grey beard and moustache. Expression: stern, unyielding, warning a lord who will not listen.
HEAD: a black scholar-official's cap (jinxian guan), hair neatly bound.
DRESS: a gamboge-yellow official robe with wide black borders, a black sash, a jade pendant at the waist.
WEAPON: none; both hands hold a bamboo-slip memorial upright in front of the chest, half unrolled.
BEARING: standing, three-quarter view, body leaning slightly forward as if pressing his advice.
BACKGROUND: the inside of a commander's tent in flat ochre and gamboge, a low desk with a map, a yellow banner at the tent door, the Yellow River camp faintly beyond.
NOTE: No prison, no cangue, no restraints of any kind. Both hands visible holding the bamboo memorial at chest height.

IMAGE 2 — file name: bao_xin.png
SUBJECT: Bao Xin, 40, broad, tall, straightforward, thick chest.
FACE: bony face with high cheekbones; skin ruddy; brows thick; eyes brave, fixed on the danger; a strong nose; a mouth open; a long dark beard. Expression: brave, self-sacrificing, no hesitation.
HEAD: an iron helmet with a gamboge-yellow tassel, strap cut.
DRESS: gamboge-yellow battle robe with black borders, iron plate armor with a cracked shoulder guard, a cloak torn.
WEAPON: a sabre mid-swing.
BEARING: on foot, body turned to shield someone behind, sabre swinging.
BACKGROUND: the Yellow Turban camp at Shouzhang, flat orange fire and yellow scarves flying.
NOTE: Last attempt was a wide landscape shot with an outstretched open hand. Keep both arms close; whole figure inside a vertical frame.

IMAGE 3 — file name: guan_hai.png
SUBJECT: Guan Hai, 40, huge and wide, a hanging belly, thick arms, a bull's neck.
FACE: flat wide face, skin sun-blackened and greasy; brows tangled and low; eyes small, hungry, set close; a flat nose broken sideways; a big loose mouth, lower teeth showing; a long matted beard with grain husks in it. Expression: hungry and brutal, demanding grain from a city that will not open.
HEAD: a yellow turban wrapped thick, a bronze ring in one ear.
DRESS: a purple sleeveless coat over a bare chest, a leather belt with an ochre cloth wrap, rough cloth leg wrappings.
WEAPON: a big broad-bladed sabre held over the shoulder in one hand.
BEARING: standing before a gate, sabre on the shoulder, the other fist shaking at the wall above.
BACKGROUND: the Beihai city gate — flat ochre walls with a closed red gate, a few yellow banners at the base.
NOTE: Last attempt: the hand holding the axe was outside the frame. Axe held upright against the shoulder, inside the frame.

```

## 第 3 批

存为：
- 图 1：何进（重出）→ `assets/portraits/source/he_jin.png`
- 图 2：侯成（重出）→ `assets/portraits/source/hou_cheng.png`
- 图 3：花鬘（重出）→ `assets/portraits/source/hua_man.png`

```
BATCH 03 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: he_jin.png
SUBJECT: He Jin, 50, huge, fat, coarse, a butcher's forearms.
FACE: flat wide face; skin ruddy; brows thick and low; eyes small, self-satisfied, slow; a broad nose; a thick-lipped mouth; a full short coarse beard. Expression: puffed-up, dim, pleased.
HEAD: a general's black cap with gold, worn crooked.
DRESS: gamboge-yellow brocade robe with black dragons, too tight at the belly, a gold breastplate, a butcher's cleaver still at the belt.
WEAPON: a jeweled sword lying across the knees, unfamiliar in his hands.
BEARING: seated on a high chair, both hands flat on the knees, chin up.
BACKGROUND: a corridor of the Luoyang palace, flat red doors closed behind him.
NOTE: Last attempt: his hands on the armrests were outside the frame. Hands rest on his belly or knees, inside the frame.

IMAGE 2 — file name: hou_cheng.png
SUBJECT: Hou Cheng, 38, medium height, thick, a bruise on the cheek.
FACE: broad square face; skin ruddy from wine; brows thick; eyes vindictive, drunk-brave; a broad nose; a mouth twisted; a full short beard. Expression: vindictive, drunk enough to dare.
HEAD: hair in a rough knot, no helmet.
DRESS: gamboge-yellow battle robe with black borders, leather lamellar armor, a wine stain down the chest.
WEAPON: a wine jar under one arm; the other hand gripping a stolen halberd and a horse's rein.
BEARING: standing, jar clamped under the arm, leading a horse off-canvas.
BACKGROUND: the stables at Xiapi, flat ochre, a red horse tethered small.
NOTE: Last attempt: the hand holding the glaive was outside the frame. Glaive held upright close to the body.

IMAGE 3 — file name: hua_man.png
SUBJECT: Huaman, 19, small and wiry, narrow shoulders, quick feet.
FACE: round face, plump at the cheeks, skin a deep tea-brown; brows short and arched; eyes round, quick, mocking, with a fold at the lid; a snub nose with a small silver stud; a small full mouth twisted in a smirk, one tooth chipped. A hill girl, a real face. Expression: mocking and defiant, daring the viewer to catch her.
HEAD: hair in a high tail with red cord and a silver crescent ornament, small silver bells at the ears.
DRESS: a purple short jacket with ochre embroidery, a breastplate of silver coins, a wrapped skirt, bare feet on rock.
WEAPON: a small crossbow held in one hand, a quiver of short bolts at the hip.
BEARING: standing on one foot on a rock, the other foot raised, crossbow held loosely, leaning back.
BACKGROUND: a Nanzhong waterfall — flat white water bands on azurite rock, a red-flowering vine.
NOTE: Last attempt: the hand holding the crossbow touched the frame edge. Crossbow held across the body, fully inside.

```

## 第 4 批

存为：
- 图 1：刘岱（重出）→ `assets/portraits/source/liu_dai.png`
- 图 2：吕虔（重出）→ `assets/portraits/source/lv_qian.png`
- 图 3：黄巾兵（杂兵）（重出）→ `assets/portraits/source/mob_huangjin.png`

```
BATCH 04 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: liu_dai.png
SUBJECT: Liu Dai, 55, medium-tall, comfortable, aristocratic, a soft belly.
FACE: oval face; skin pale; brows well-kept; eyes dismissive, not looking at the danger; a fine nose; a mouth pursed; a long dark beard. Expression: dismissive, waving off advice.
HEAD: a black gauze cap with a tall jade ornament.
DRESS: gamboge-yellow brocade robe with black cloud pattern, gilded plate armor for show, a fur-lined cloak.
WEAPON: a jeweled sword at the hip; one hand waving off.
BEARING: riding, hand raised in dismissal, looking away from the horizon.
BACKGROUND: the fields of Yanzhou in flat green, a line of yellow scarves on the horizon.
NOTE: Last attempt: a raised hand was outside the frame. Both hands near the body.

IMAGE 2 — file name: lv_qian.png
SUBJECT: Lü Qian, 48, medium height, solid, thick-set.
FACE: flat wide face, skin sallow; brows short; eyes narrow, shrewd, guarded; a broad nose; a tight mouth; a dark goatee. Expression: suspicious, hearing a report he doubts.
HEAD: hair in a topknot under an iron cap with an azurite cord.
DRESS: azurite-blue robe, iron lamellar armor with gold edging, a fur-lined cloak, a leather belt.
WEAPON: a sabre laid across the knee, one hand on the hilt.
BEARING: seated on a rock, head cocked, listening to a scout off-canvas.
BACKGROUND: Mount Tai in flat azurite with a single winding path and a bandit fire small.
NOTE: Last attempt: the hand on the sword hilt was outside the frame. Keep it inside.

IMAGE 3 — file name: mob_huangjin.png
SUBJECT: a Yellow Turban rebel foot soldier, 30, thin, sun-scorched, a farmer's build with long forearms.
FACE: flat wide face, skin sun-blackened; brows thin; eyes hollow and hungry; a broad nose; a wide mouth; a sparse patchy beard. Expression: desperate, angry.
HEAD: a bright gamboge-yellow cloth headscarf knotted at the front, ends hanging, hair loose.
DRESS: a ragged undyed hemp jacket with a purple-brown patch, no armor, a rope belt, trousers rolled to the knee, straw sandals.
WEAPON: a sharpened bamboo spear with a fire-hardened point, a wooden hoe-blade tied at the belt.
BEARING: running forward, spear leveled, mouth open.
BACKGROUND: a field of stubble in flat pale ochre, a burning farmhouse as orange shapes.
NOTE: Last attempt: spear leveled horizontally, front hand and spearhead cut off. Hold the spear diagonally upward, both hands and the blade inside the frame.

```

## 第 5 批

存为：
- 图 1：羌胡骑（杂兵）（重出）→ `assets/portraits/source/mob_qianghu.png`
- 图 2：蜀卒·长枪（杂兵）（重出）→ `assets/portraits/source/mob_shu_changqiang.png`
- 图 3：蜀卒·弩手（杂兵）（重出）→ `assets/portraits/source/mob_shu_nushou.png`

```
BATCH 05 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: mob_qianghu.png
SUBJECT: a Qiang mounted raider, 30, compact, thick-chested, bandy-legged, weathered hands.
FACE: bony face with high cheekbones, skin olive and wind-burnt; brows thick; eyes narrow and deep-set; a hooked nose; a firm mouth; a short braided beard. Expression: watchful, hungry.
HEAD: a pointed felt cap with a fur brim and a purple crown, hair in thin braids, a bone earring.
DRESS: a sheepskin coat with the fleece turned out over a purple-and-ochre striped tunic, a leather belt with bronze plaques, felt boots, a bow-case at the hip.
WEAPON: a curved sabre in one hand, a recurved horn bow in the case, a lasso pole strapped to the saddle.
BEARING: mounted on a shaggy grey horse, standing in the stirrups, sabre raised.
BACKGROUND: a dry yellow-ochre valley with purple mountains and a felt tent.
NOTE: Last attempt: the hand holding the sabre was outside the frame. Sabre raised vertically beside the shoulder, inside the frame.

IMAGE 2 — file name: mob_shu_changqiang.png
SUBJECT: a Shu spearman, 28, medium height, lean, sinewy, long neck.
FACE: heart-shaped face with a wide forehead, skin sun-tanned; brows straight; eyes wide and earnest; a straight nose; a firm mouth; clean-shaven. Expression: earnest, nervous.
HEAD: an iron cap with a cinnabar-red tassel and a red cloth tied under it.
DRESS: a cinnabar-red padded jacket under a cuirass of small iron scales laced with red cord, cloth leg-wraps, straw sandals, a rolled straw rain-cape on the back.
WEAPON: a very long spear with a narrow leaf blade and a small red tassel held in both hands, leveled.
BEARING: braced in a spear-wall stance, one knee bent, spear pointed forward and up.
BACKGROUND: a mountain road cut into a cliff in flat azurite and ochre, a red banner, plank road on the cliffside.
NOTE: Last attempt: spear leveled horizontally and the blade was cut off. Spear angled steeply upward, blade inside the frame.

IMAGE 3 — file name: mob_shu_nushou.png
SUBJECT: a Shu crossbowman, 35, short, thick-shouldered, bow-legged.
FACE: round face, skin weathered brown; brows thick and short; eyes small and squinting; a flat nose; a thin mouth; a sparse patchy beard. Expression: patient, waiting.
HEAD: a wide-brimmed bamboo hat over a cinnabar-red headcloth, no helmet.
DRESS: a cinnabar-red jacket under a leather cuirass, a wooden bolt-box slung on the belt, cloth leg-wraps, a short grey cloak.
WEAPON: a repeating crossbow with a magazine box on top, held at the shoulder, aimed to the left.
BEARING: kneeling on one knee behind a rock, crossbow braced, eye along the stock.
BACKGROUND: a narrow pass in flat azurite with a red banner and a stone wall of loose rocks.
NOTE: Last attempt: the front of the crossbow was cut off. Aim the crossbow toward the viewer at a three-quarter angle so all of it is inside.

```

## 第 6 批

存为：
- 图 1：藤甲兵（杂兵）（重出）→ `assets/portraits/source/mob_tengjia.png`
- 图 2：魏卒·弓手（杂兵）（重出）→ `assets/portraits/source/mob_wei_gongshou.png`
- 图 3：吴卒·水军（杂兵）（重出）→ `assets/portraits/source/mob_wu_shuijun.png`

```
BATCH 06 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: mob_tengjia.png
SUBJECT: a rattan-armored warrior of the Wugou country, 30, thick-set, broad, short legs.
FACE: broad square face, skin dark brown; brows heavy; eyes small and dull; a flat nose; a thick-lipped mouth; a short coarse beard. Expression: fearless, blank.
HEAD: a domed helmet of woven rattan, oil-dark and glossy, with a purple cord under the chin.
DRESS: full armor of woven rattan soaked in oil, dark amber and glossy, covering chest, shoulders and thighs, an ochre cloth beneath, a purple sash.
WEAPON: a large round rattan shield on the left arm, a heavy curved chopping sword in the right.
BEARING: wading through water to the chest, shield held up, sword ready.
BACKGROUND: a river in flat pale blue with a stone bank and a burnt black hillside.
NOTE: Last attempt: the hand holding the dao was outside the frame. Dao held upright, inside.

IMAGE 2 — file name: mob_wei_gongshou.png
SUBJECT: a Wei archer, 27, tall, thin, long arms, narrow shoulders.
FACE: oval face, skin pale sallow; brows fine; eyes long and one squinted; a thin nose; a thin mouth; clean-shaven. Expression: concentrated, holding breath.
HEAD: a soft leather cap with an azurite-blue crown and a gold-edged brim, no helmet.
DRESS: an azurite-blue robe with gold borders, a light cuirass of leather lamellar over the chest, a leather bracer on the left forearm, a large quiver on the right hip.
WEAPON: a long composite bow drawn fully, arrow at the cheek.
BEARING: standing side-on, bow arm straight, drawing hand at the ear.
BACKGROUND: a palisade of sharpened stakes in flat grey with a row of azurite banners.
NOTE: Last attempt: drawn side-on in a landscape frame and the bow was cut off. Turn him toward the viewer, bow upright, whole bow inside the frame.

IMAGE 3 — file name: mob_wu_shuijun.png
SUBJECT: a Wu naval boarder, 24, small, wiry, dark, barefoot, a swimmer's shoulders.
FACE: narrow face with hollow cheeks, skin sun-tanned; brows thin; eyes long and lively; a small nose; a wide mouth; clean-shaven. Expression: quick, delighted.
HEAD: a malachite-green headband, hair cut short, a red cord at the wrist.
DRESS: a short green sleeveless jacket open at the chest, short trousers above the knee, bare feet, bare arms, a cinnabar-red sash, a knife at the belt, no armor.
WEAPON: a long grappling hook on a rope in both hands, a short sabre at the hip.
BEARING: crouched on a boat's prow, hook swinging back, ready to throw.
BACKGROUND: the Yangtze in flat pale blue with a war junk's side and a row of green banners.
NOTE: Last attempt: the raised hand with the grappling hook was outside the frame. Hook held at shoulder height, inside.

```

## 第 7 批

存为：
- 图 1：牛金（重出）→ `assets/portraits/source/niu_jin.png`
- 图 2：沙摩柯（重出）→ `assets/portraits/source/sha_mo_ke.png`
- 图 3：宋宪（重出）→ `assets/portraits/source/song_xian.png`

```
BATCH 07 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: niu_jin.png
SUBJECT: Niu Jin, 34, short, extremely muscular, thick neck, no waist.
FACE: round face, skin ruddy; brows heavy; eyes small and fearless, laughing; a flat nose; a wide mouth grinning; stubble. Expression: cheerful under fire.
HEAD: bare head, hair in a short knot, a cloth headband.
DRESS: azurite-blue battle robe with the sleeves torn off, an iron breastplate edged in gold, bare arms wrapped in cord.
WEAPON: a long sabre raised over one shoulder with both hands.
BEARING: charging on foot out of a gate, one leg forward, mouth open.
BACKGROUND: the Jiangling city gate in flat ochre with a row of Wu tents beyond, green and small.
NOTE: Last attempt: both hands on the sword touched the edge. Sword raised vertically above the shoulder, hands inside.

IMAGE 2 — file name: sha_mo_ke.png
SUBJECT: Shamoke, 35, huge and heavy, a wide chest, arms like beams.
FACE: long face with a jutting chin, skin dark like iron with a red flush across the cheeks; brows thick and black; eyes bloodshot, savage; a wide nose; a mouth showing teeth; a black beard woven into braids. Expression: savage, fixed on a boat he means to sink.
HEAD: hair in a topknot bound with bone, a headdress with two curved horns.
DRESS: a purple wrapped tunic with ochre patterns, a breastplate of layered hide, a necklace of animal teeth, bare forearms with copper bands.
WEAPON: a great bow drawn to the ear, a heavy arrow nocked.
BEARING: drawing the bow, body turned, aiming down-river.
BACKGROUND: the Five Streams gorge — flat green cliffs, a river in pale bands, a small boat with a white sail.
NOTE: Last attempt: the bow hand was cut off. Turn him toward the viewer, bow upright, whole bow inside.

IMAGE 3 — file name: song_xian.png
SUBJECT: Song Xian, 33, tall, lean, sour-faced.
FACE: long face with a jutting chin; skin sallow; brows drawn down; eyes shifty, deciding; a thin nose; a mouth gritted; a thin mustache only. Expression: shifty, teeth clenched with effort.
HEAD: an iron helmet with the strap undone.
DRESS: gamboge-yellow battle robe, black leather cuirass with iron studs, sleeves pushed up.
WEAPON: a thick rope pulled tight in both hands.
BEARING: leaning back, hauling on the rope, teeth bared.
BACKGROUND: the inside of the White Gate tower, flat grey pillar with a rope knotted around it.
NOTE: Last attempt: the hand pulling the rope touched the edge. Keep both hands near the body.

```

## 第 8 批

存为：
- 图 1：蹋顿（重出）→ `assets/portraits/source/ta_dun.png`
- 图 2：王匡（重出）→ `assets/portraits/source/wang_kuang.png`
- 图 3：吴班（重出）→ `assets/portraits/source/wu_ban.png`

```
BATCH 08 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: ta_dun.png
SUBJECT: Tadun, 40, medium height, bandy-legged, a rider's compact body.
FACE: round face, weathered skin with wind-cracks on the cheeks; brows thick and straight; eyes narrow and alert, scanning the ridge; a short broad nose; a firm mouth; a thin dark mustache only. Expression: alert, sensing the trap on the mountain.
HEAD: hair shaved at the front and braided at the back, a fur cap with a hawk feather.
DRESS: a purple wool riding coat with ochre trim, leather lamellar armor, a fur collar, a bow-case at the hip.
WEAPON: a short recurve bow in one hand, an arrow drawn halfway.
BEARING: mounted, twisted in the saddle to look back, bow half-drawn.
BACKGROUND: the White Wolf mountain — flat ochre ridges with a pass, a line of small blue Wei banners on the crest.
NOTE: Last attempt: the bow hand was cut off. Bow upright, whole bow inside the frame.

IMAGE 2 — file name: wang_kuang.png
SUBJECT: Wang Kuang, 42, medium height, hard, ambitious.
FACE: long face with a jutting chin; skin olive; brows sharp; eyes rash, over-eager; a straight nose; a mouth open in a command; a dark goatee. Expression: rash, seeing glory and not the ford.
HEAD: an iron helmet with a gamboge-yellow plume.
DRESS: gamboge-yellow battle robe with black trim, iron lamellar armor, a cloak blown sideways.
WEAPON: a halberd raised in one hand.
BEARING: standing on a riverbank, halberd up, cloak flying.
BACKGROUND: the Yellow River ford at Heyang, flat yellow bands, dust of cavalry on the far bank.
NOTE: Last attempt: the hand holding the halberd was outside the frame. Halberd upright beside him, hand inside.

IMAGE 3 — file name: wu_ban.png
SUBJECT: Wu Ban, 40, stocky, broad-chested, thick short arms.
FACE: broad square face, skin sun-tanned; heavy straight brows; eyes wide-set and hot; a wide nose; a big mouth open mid-shout; a full short black beard. Expression: provoked, spoiling for a fight.
HEAD: an iron helmet with a cinnabar-red tassel, chin strap loose.
DRESS: cinnabar-red battle robe, iron scale cuirass with a bronze chest plate, leather bracers, sleeves rolled.
WEAPON: a long sabre pointed across a river at the viewer, the other arm flung wide.
BEARING: standing on a riverbank, leaning forward, shouting a challenge.
BACKGROUND: the plain at Yiling, a row of empty camp tents in flat ochre with the flaps open.
NOTE: Last attempt: sword arm and open hand stretched out of the frame. Sword raised close to the body, other hand on the belt.

```

## 第 9 批

存为：
- 图 1：范式 X13（曹性、郝萌、俞涉）（重出）→ `assets/portraits/source/x13.png`
- 图 2：范式 X14（蒋义渠、邢道荣、潘凤）（重出）→ `assets/portraits/source/x14.png`
- 图 3：范式 X15（杨昂、杨任、韩猛）（重出）→ `assets/portraits/source/x15.png`

```
BATCH 09 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: x13.png
SUBJECT: a young Han cavalry officer, 24, lean, medium-tall, long arms, a bowman's shoulders.
FACE: narrow face with hollow cheeks; skin sun-tanned; brows thin, dark, arched high; eyes long and narrow with a quick sideways look; a thin nose with a slight bump at the bridge; a wide thin mouth; clean-shaven. Expression: sharp, sizing up a target.
HEAD: hair in a topknot under a leather cap with a gamboge-yellow tassel, a black cord under the chin.
DRESS: a gamboge-yellow battle robe with black borders, a light cuirass of black leather scales, bracers, a quiver of arrows at the right hip.
WEAPON: a bow drawn to the cheek, arrow nocked, aimed off-canvas to the left.
BEARING: on horseback, twisted in the saddle to shoot back over the horse's rump.
BACKGROUND: a dusty plain in flat pale ochre, a low walled town on the horizon, a yellow banner.
NOTE: Last attempt: drawn side-on in a landscape frame and the bow was cut off. Turn toward the viewer, bow upright, whole bow inside the frame.

IMAGE 2 — file name: x14.png
SUBJECT: a Han warlord's champion, 38, huge, barrel-chested, thick neck, arms like posts.
FACE: flat wide face, skin dark reddish; brows heavy and straight, set low; eyes round, bulging, staring straight ahead; a broad nose with a crooked bridge; a wide mouth open in a boast; a full black beard, thick and short, spreading to the ears. Expression: boastful, loud, sure of himself.
HEAD: a bronze helmet with two short black ox-horns and a gamboge-yellow tassel.
DRESS: a gamboge-yellow battle robe with black cloud pattern, a heavy cuirass of bronze plates over a black leather vest, a tiger-skin over one shoulder.
WEAPON: a great long-handled battle-axe with a crescent blade held over the shoulder in one hand.
BEARING: standing with legs wide, free hand slapping the chest, chin up.
BACKGROUND: a camp gate of two tall poles with a yellow-and-black banner between them, flat ochre ground, a drum.
NOTE: Last attempt: the hand holding the axe was outside the frame. Axe resting on the shoulder, hand inside.

IMAGE 3 — file name: x15.png
SUBJECT: an old Han garrison general, 60, medium height, still broad, thick forearms, a slight stoop.
FACE: bony face with high cheekbones; skin weathered brown with deep creases; brows white and thick; eyes small, sharp, patient under heavy lids; a strong straight nose; a wide mouth turned down; a full white beard cut square at the chest, mustache white. Expression: patient, has seen this before.
HEAD: an iron helmet with a black cloth wrap and a gamboge-yellow cord, white hair at the temples.
DRESS: a gamboge-yellow robe with black borders, a cuirass of black iron lamellar edged with a worn line of gold, a wool cloak with a fur collar.
WEAPON: a long spear held in both hands at the level of the hips, blade to the right.
BEARING: standing on a rampart, weight back, looking out over the wall.
BACKGROUND: a mountain road winding up in flat azurite and ochre, a small watchtower, a single gamboge banner.
NOTE: Last attempt: the right hand on the spear was outside the frame. Spear held diagonally, both hands inside.

```

## 第 10 批

存为：
- 图 1：范式 X23（忙牙长、阿会喃）（重出）→ `assets/portraits/source/x23.png`
- 图 2：范式 X24（徹里吉）（重出）→ `assets/portraits/source/x24.png`
- 图 3：张燕（重出）→ `assets/portraits/source/zhang_yan.png`

```
BATCH 10 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: x23.png
SUBJECT: a young Nanman war-captain, 28, very tall, long-limbed, lean hard muscle, big hands.
FACE: long face with a jutting chin; skin dark bronze; brows thin and straight; eyes large, wide-set, bright, staring; a long straight nose; a wide mouth with the lips parted, teeth filed to points; clean-shaven, tattooed with blue lines from the cheekbones to the jaw. Expression: wild, exultant.
HEAD: hair shaved at the sides and standing up in a stiff ochre-dyed crest, a purple cord across the brow with a boar tusk.
DRESS: bare chest and arms with blue tattoos, a purple sash, a short skirt of ochre hide and bark, a necklace of bear claws, bare feet.
WEAPON: a long throwing spear with a barbed head held back over the shoulder, ready to throw.
BEARING: on the balls of the feet, body twisted, spear arm cocked, the other arm pointing.
BACKGROUND: a jungle river bend in flat malachite green with a yellow-ochre sand bank and a war elephant's grey flank at the edge.
NOTE: Last attempt: one arm threw a spear and the other pointed, both outside the frame. Spear raised overhead in one hand, other arm close to the body.

IMAGE 2 — file name: x24.png
SUBJECT: a Qiang chieftain, 50, medium height, thick-chested, bandy-legged from the saddle, weathered hands.
FACE: bony face with high cheekbones and a broad forehead; skin olive, wind-burnt red at the cheeks; brows thick and grey-streaked, low over the eyes; eyes narrow, deep-set, watchful; a broad hooked nose; a firm mouth; a long grey-streaked beard plaited into one thick braid with a silver ring. Expression: watchful, patient as a hunter.
HEAD: hair in many thin braids under a fur-trimmed felt cap with a purple crown and a hawk feather, a silver earring.
DRESS: a sheepskin coat with the fleece turned out, a purple woven over-vest with ochre stripes, a wide belt with silver plaques, a bow-case at the hip.
WEAPON: a recurved horn bow in one hand, a curved sabre at the belt.
BEARING: on horseback, one hand shading the eyes, looking into the distance.
BACKGROUND: a dry yellow-ochre valley with a band of purple mountains, a felt tent, a line of sheep as small white shapes.
NOTE: Last attempt: the bow hand was cut off. Bow upright, whole bow inside the frame.

IMAGE 3 — file name: zhang_yan.png
SUBJECT: Zhang Yan, 30, thin and quick, narrow hips, light as a swallow.
FACE: oval face, sharp-featured, sun-tanned skin; brows thin and slanting; eyes watchful and feral, never still; a thin nose; a small hard mouth; clean-shaven. Expression: watchful, feral, ready to be gone.
HEAD: hair in a tight knot under a black cloth wrap, a strip of purple cloth as a headband.
DRESS: a short purple jacket bound tight at the wrists, an ochre leather vest, cloth leg wrappings, a coil of rope at the belt.
WEAPON: a short sabre in one hand, a throwing dart held between two fingers of the other.
BEARING: crouched on a rock, one hand down, about to spring sideways off the frame.
BACKGROUND: the Taihang black mountains — flat dark grey ridges in layers, one pine, a white sky.
NOTE: Last attempt: the hand holding the blade was outside the frame. Keep it inside.

```

## 第 11 批

存为：
- 图 1：张允（重出）→ `assets/portraits/source/zhang_yun.png`
- 图 2：周鲂（重出）→ `assets/portraits/source/zhou_fang.png`
- 图 3：朱桓（重出）→ `assets/portraits/source/zhu_huan.png`

```
BATCH 11 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: zhang_yun.png
SUBJECT: Zhang Yun, 40, medium height, sleek, well-groomed.
FACE: oval face; skin fair; brows even; eyes complacent, half-closed; a straight nose; a satisfied mouth; a dark goatee. Expression: smug, proud of his fleet.
HEAD: a black gauze cap with a gold pin.
DRESS: gamboge-yellow brocade robe with black cloud pattern, a light lacquered breastplate, a gold belt.
WEAPON: none; a bamboo roster in one hand, the other pointing at the boats.
BEARING: seated on a ship's deck, pointing out.
BACKGROUND: the river at Jing zhou with warships chained side by side, flat blue bands.
NOTE: Last attempt: his pointing arm stretched out of the frame. Point with a bent arm, hand near the chest.

IMAGE 2 — file name: zhou_fang.png
SUBJECT: Zhou Fang, 45, medium height, compact, a still body.
FACE: round face, fair skin; brows dark and even; eyes crafty, wet with performed grief, dry underneath; a short nose; a mouth trembling on purpose; clean-shaven. Expression: crafty, acting sorrow for an audience that cannot see the trap.
HEAD: hair hacked short at the shoulder, no cap, a cut lock held in one hand.
DRESS: a malachite-green official's robe with cinnabar-red cuffs, the collar disordered, a cloth sash loose.
WEAPON: none; the cut lock of his own hair held up in one hand, a letter in the other.
BEARING: standing, holding up the cut hair, head slightly bowed, eyes lifted to the viewer.
BACKGROUND: the Shiting valley — flat green hills with a narrow road and rows of small green banners hidden along the ridge.
NOTE: Last attempt: the hand holding the letter touched the edge. Letter held in front of the chest.

IMAGE 3 — file name: zhu_huan.png
SUBJECT: Zhu Huan, 40, medium height, proud posture, chest lifted, shoulders squared.
FACE: long face with a jutting chin, fair skin; brows arched and sharp; eyes narrow, haughty, impatient with everyone; a high thin nose; a mouth with a proud curl; a thin mustache and a small pointed goatee. Expression: haughty and impatient, certain he is the only general worth the name.
HEAD: a silver helmet with a tall malachite-green plume and a gold brow-plate.
DRESS: a malachite-green brocade battle robe with cinnabar-red cuffs, silver lamellar armor, a white cloak with gold edge.
WEAPON: a command baton pointed straight forward in one hand, a sword at the hip.
BEARING: standing with the baton thrust forward, the other hand on the sword, chin raised.
BACKGROUND: the Ruxu fortress on the river — flat grey walls with a green banner, a river bend in pale blue.
NOTE: Last attempt: his pointing arm stretched out of the frame. Baton held upright near the chest.

```

## 第 12 批

存为：
- 图 1：凌操（重出）→ `assets/portraits/source/ling_cao.png`
- 图 2：诸葛恪（重出）→ `assets/portraits/source/zhuge_ke.png`
- 图 3：顾雍（重出）→ `assets/portraits/source/gu_yong.png`

```
BATCH 12 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: ling_cao.png
SUBJECT: Ling Cao, 45, lean and hard, a bowman's shoulders, a long neck.
FACE: bony face with high cheekbones, sun-tanned skin; brows thick and straight; eyes wide, stunned, still fixed forward; a straight nose; a mouth open in surprise; a sparse patchy beard. Expression: stunned, struck mid-charge and refusing to fall.
HEAD: an iron helmet with a malachite-green tassel knocked crooked.
DRESS: a malachite-green battle robe, leather lamellar armor with cinnabar-red cords, an arrow standing in the left shoulder plate.
WEAPON: a ring-pommel sabre still gripped in the right hand, point down.
BEARING: standing on a boat prow, half-turned, one hand going to the arrow in his shoulder, the other still holding the sabre.
BACKGROUND: the Xiakou river bend in flat grey-blue, a line of enemy boats as small dark shapes, reeds on the bank.
NOTE: Last attempt: the hand holding the blade touched the edge. Keep it inside.

IMAGE 2 — file name: zhuge_ke.png
SUBJECT: Zhuge Ke, 45, tall and portly, a big chest, a heavy stride.
FACE: round face, fair skin; brows thick and arched high; eyes brilliant and dismissive, already bored with your answer; a broad nose; a wide mouth laughing; a thin dark mustache only. Expression: brilliant and dismissive, having just won a joke and about to lose a war.
HEAD: a black lacquered cap with a gold ornament and a malachite-green cord.
DRESS: a malachite-green brocade court robe with cinnabar-red trim and gold clouds, a jade belt, a rich cloak.
WEAPON: none; an ink brush in one hand, finishing writing on a wooden tag.
BEARING: standing, brush raised from a wooden tag held in the other hand, laughing at the viewer.
BACKGROUND: the Jianye hall — flat green pillars, and a donkey with a wooden tag hanging on its face, drawn small and flat.
NOTE: Last attempt: the hand holding the tablet touched the edge. Tablet held in front of the chest.

IMAGE 3 — file name: gu_yong.png
SUBJECT: Gu Yong, 58, medium height, thin, very still, hands on the knees.
FACE: narrow face with hollow cheeks, pale skin; brows grey and even; eyes quiet, listening, saying nothing; a thin nose; a mouth closed and calm; a thin grey goatee. Expression: silent and listening, the one man at the feast who has not touched his cup.
HEAD: a black gauze minister's cap, grey hair smooth.
DRESS: a formal malachite-green court robe with a black border and cinnabar-red inner collar, a plain jade belt, sleeves straight.
WEAPON: none; a full wine cup untouched on the mat beside his knee.
BEARING: seated upright, both hands on the knees, looking at the viewer without moving.
BACKGROUND: a quiet Wu commandery study — a flat white wall, one plum branch in a vase, a closed lattice window.
NOTE: Last attempt: his hands on the desk touched the bottom edge. Hands higher, holding a scroll at chest height.

```

## 第 13 批

存为：
- 图 1：傅士仁（新出）→ `assets/portraits/source/fu_shi_ren.png`
- 图 2：雷铜（新出）→ `assets/portraits/source/lei_tong.png`
- 图 3：吴兰（新出）→ `assets/portraits/source/wu_lan.png`

```
BATCH 13 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: fu_shi_ren.png
SUBJECT: Fu Shiren, 42, medium height, thick around the waist, a short neck.
FACE: heavy-jowled face with a low forehead; skin pale sallow; brows sparse; eyes puffy and sullen; a broad flat nose; a mouth turned down at both corners; a sparse patchy beard. Expression: resentful, nursing an old grudge.
HEAD: hair loosely bound, a plain iron helmet held under one arm instead of worn.
DRESS: cinnabar-red battle robe stained at the hem, brown leather lamellar armor with a broken cord, a grey cloak.
WEAPON: a sabre laid flat across both open palms, offered forward.
BEARING: kneeling on one knee, sabre held out in surrender, eyes raised sideways.
BACKGROUND: the walls of Gong'an in flat ochre with a white flag on the tower, low water in bands.

IMAGE 2 — file name: lei_tong.png
SUBJECT: Lei Tong, 33, tall and bony, long arms and legs, a thin neck.
FACE: narrow face with hollow cheeks; skin dark reddish; brows thin and raised in alarm; eyes wide, whites showing; a long thin nose; a mouth open; stubble on the jaw. Expression: startled, cornered, no time to think.
HEAD: a leather helmet knocked askew, hair coming loose.
DRESS: cinnabar-red battle robe torn at one shoulder, iron lamellar armor, a quiver half-empty.
WEAPON: a spear raised across the body in a parry, both hands.
BEARING: falling back a step, spear up, head turned toward the attack.
BACKGROUND: a mountain pass at Wudu, flat grey cliffs, a fan of thin arrow lines from one side.

IMAGE 3 — file name: wu_lan.png
SUBJECT: Wu Lan, 30, short, compact, muscular.
FACE: flat wide face, skin weathered brown; brows short and thick; eyes small, wary, red-rimmed; a broad nose; a wide thin mouth; a thin mustache only. Expression: exhausted, distrusting the hills.
HEAD: hair tied with a strip of cloth, no helmet, dust in the hair.
DRESS: cinnabar-red battle robe faded and mud-splashed, a leather cuirass with straps cut, a short cape.
WEAPON: a sabre laid on the ground beside him; both hands cupped, lifting water.
BEARING: kneeling at a stream, drinking from his hands, eyes lifted to the viewer.
BACKGROUND: the Yinping valley, flat green, a row of Di tribal felt tents on the slope.

```

## 第 14 批

存为：
- 图 1：高翔（新出）→ `assets/portraits/source/gao_xiang.png`
- 图 2：陈式（新出）→ `assets/portraits/source/chen_shi.png`
- 图 3：句扶（新出）→ `assets/portraits/source/ju_fu.png`

```
BATCH 14 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: gao_xiang.png
SUBJECT: Gao Xiang, 42, medium height, sturdy, thick thighs.
FACE: heart-shaped face with a wide forehead and a narrow chin; skin olive; brows level; eyes round, stunned, unblinking; a short straight nose; a slack mouth; a dark goatee. Expression: disbelieving, still counting the loss.
HEAD: an iron helmet with the tassel torn off.
DRESS: cinnabar-red robe, iron plate cuirass dented at the chest, a dark cloak dragging.
WEAPON: a sabre held loosely, point trailing on the ground.
BEARING: standing among broken stakes, shoulders dropped, sabre hanging.
BACKGROUND: the Liuliu stockade in flat ochre, wooden palisade broken in a gap, a fallen banner.

IMAGE 2 — file name: chen_shi.png
SUBJECT: Chen Shi, 28, lean and wiry, long arms, narrow hips.
FACE: long rectangular face, skin sun-tanned; brows dark and straight; eyes bright, quick, cocky; a straight nose; a mouth pulled up at one corner; a sparse patchy young beard. Expression: impatient, sure of himself.
HEAD: hair in a high topknot under a small iron cap with a red plume.
DRESS: cinnabar-red battle robe, light leather armor with iron studs, a short red cloak.
WEAPON: a spear laid across the saddle, one hand on it.
BEARING: riding, leaning forward, looking straight ahead past the viewer.
BACKGROUND: a river valley with two small county towns of Wudu and Yinping, flat green and ochre.

IMAGE 3 — file name: ju_fu.png
SUBJECT: Ju Fu, 40, big-boned, heavy shoulders, thick wrists, a Ba mountain man.
FACE: bony face with high cheekbones; skin dark reddish; brows thick; eyes deep-set, mild, avoiding the viewer; a strong nose; a firm mouth; a long coarse dark beard. Expression: humble, uncomfortable with praise.
HEAD: hair in a plain knot with a bone pin, a strip of cloth around the brow.
DRESS: cinnabar-red battle robe over Ba-style bronze breastplate with tiger pattern, leather leggings, a hemp sash.
WEAPON: none; an awl and a leather strap in his hands, mending an armor cord.
BEARING: seated on a rock, bent over the strap, glancing up.
BACKGROUND: the Dangqu river gorge, flat blue water, stilt houses on the bank.

```

## 第 15 批

存为：
- 图 1：向宠（新出）→ `assets/portraits/source/xiang_chong.png`
- 图 2：阎宇（新出）→ `assets/portraits/source/yan_yu.png`
- 图 3：王甫（新出）→ `assets/portraits/source/wang_fu.png`

```
BATCH 15 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: xiang_chong.png
SUBJECT: Xiang Chong, 35, medium height, upright, compact and tidy.
FACE: oval face, skin fair; brows even and neat; eyes attentive, level, taking in every face; a straight nose; a closed mouth; a full short beard along the jaw. Expression: listening, missing nothing.
HEAD: hair in a topknot under a black lacquered helmet with a narrow gold band.
DRESS: cinnabar-red brocade robe, polished iron plate cuirass with gold edging, a white inner collar, a jade tally at the belt.
WEAPON: a sword at the hip; holding a bundle of bamboo slips, a roster.
BEARING: standing at attention, roster open in both hands, looking along a line of men off-canvas.
BACKGROUND: the Chengdu palace gate in flat red and white, spear tips of guards in a row.

IMAGE 2 — file name: yan_yu.png
SUBJECT: Yan Yu, 50, thin and tall, stooped, a long neck.
FACE: narrow face with hollow cheeks; skin pale sallow; brows thin and raised; eyes small and darting; a long nose; a mouth stretched in an ingratiating smile; a thin mustache only. Expression: fawning, calculating his next favor.
HEAD: a black gauze official's cap tilted toward the listener.
DRESS: cinnabar-red court robe with too much gold embroidery, a lacquered breastplate worn for show, a heavy jade belt.
WEAPON: none; one hand cupped beside the mouth.
BEARING: bent forward in a half-bow, whispering toward someone off-canvas, eyes on the viewer.
BACKGROUND: the White Emperor city at Yong'an on a cliff, flat grey rock and the river far below.

IMAGE 3 — file name: wang_fu.png
SUBJECT: Wang Fu, 61, medium height, spare and dry, straight-backed.
FACE: long face with a jutting chin; skin olive; brows grey and heavy; eyes hooded, wet, seeing what is coming; a thin nose; a mouth pressed to a line; a grey goatee. Expression: grieving in advance, resolved.
HEAD: a black cloth cap, grey hair at the temples.
DRESS: a dark grey robe with a cinnabar-red collar, a black sash, no armor, sleeves wet with dew.
WEAPON: none; both hands gripping the stone edge of a parapet.
BEARING: standing on a wall top, leaning over the parapet, looking down.
BACKGROUND: the small walled town of Maicheng at dawn, flat pale grey, malachite-green banners ringing it.

```

## 第 16 批

存为：
- 图 1：赵累（新出）→ `assets/portraits/source/zhao_lei.png`
- 图 2：黄权（新出）→ `assets/portraits/source/huang_quan.png`
- 图 3：马忠（吴）（新出）→ `assets/portraits/source/ma_zhong_wu.png`

```
BATCH 16 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: zhao_lei.png
SUBJECT: Zhao Lei, 32, short and stocky, thick calves, a soldier's stance.
FACE: round face, skin sun-tanned; brows thick and short; eyes frightened but fixed forward; a snub nose; a wide mouth shut tight; clean-shaven. Expression: scared, staying anyway.
HEAD: hair in a topknot, a leather helmet with a torn red cord.
DRESS: cinnabar-red battle robe, leather lamellar armor, a rope coiled at the belt.
WEAPON: a short sabre at the hip; holding a horse's bridle.
BEARING: walking, bridle in hand, looking back over the shoulder.
BACKGROUND: the winter hills of Linju, bare trees in flat black, a rope stretched between two trunks.

IMAGE 2 — file name: huang_quan.png
SUBJECT: Huang Quan, 46, medium-tall, solid, a heavy dignified frame.
FACE: heavy-jowled face with a strong jaw; skin fair; brows thick and level; eyes honest and sorrowful, meeting the viewer; a broad nose; a full mouth; a long dark beard, combed. Expression: sad, refusing to pretend otherwise.
HEAD: a black gauze official's cap with a jade pin.
DRESS: cinnabar-red court robe with dark green borders, a lacquered plate cuirass beneath, a leather belt with an iron buckle.
WEAPON: none; holding up a memorial of bamboo slips in both hands.
BEARING: kneeling upright, memorial raised to eye level, back straight.
BACKGROUND: the Yangtze at Yiling, flat blue bands, Shu camps on the north bank and Wei tents small on the far side.

IMAGE 3 — file name: ma_zhong_wu.png
SUBJECT: Ma Zhong of Wu, 33, short, stocky, low to the ground.
FACE: flat wide face; skin dark reddish; brows short and thick; eyes narrow, sly, patient; a flat nose; a thin mouth; stubble. Expression: sly, a hunter waiting.
HEAD: hair tied under a green cloth wrap, no helmet.
DRESS: malachite-green short battle robe, leather cuirass with cinnabar-red cords, trousers bound at the calf.
WEAPON: a coiled hemp rope with iron hooks in both hands.
BEARING: crouched in reeds, coiling the trip-rope, eyes lifted.
BACKGROUND: a narrow path through reeds at Linju, flat ochre reeds, a hook set low across the path.

```

## 第 17 批

存为：
- 图 1：谢旌（新出）→ `assets/portraits/source/xie_jing.png`
- 图 2：谭雄（新出）→ `assets/portraits/source/tan_xiong.png`
- 图 3：宋谦（新出）→ `assets/portraits/source/song_qian.png`

```
BATCH 17 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: xie_jing.png
SUBJECT: Xie Jing, 30, tall, lean, long limbs.
FACE: long rectangular face, jaw wider than the temples; skin olive; dark brows slanting inward; bright, eager, wide-open eyes; a straight nose with flared nostrils; teeth showing in a shout; a thin mustache only, no beard. Expression: brash, certain of a quick win.
HEAD: hair in a topknot under an iron helmet with a green plume.
DRESS: malachite-green battle robe, iron scale cuirass with cinnabar-red trim, a short cloak.
WEAPON: a spear leveled forward with both hands.
BEARING: riding, leaning into the charge.
BACKGROUND: the hills at Yiling in flat green, small cinnabar-red Shu tents on the ridge.

IMAGE 2 — file name: tan_xiong.png
SUBJECT: Tan Xiong, 36, medium height, thick arms, an archer's chest.
FACE: broad square face with a low hairline; skin sun-tanned; one brow flat, the other pulled up over the sighting eye, the left eye squeezed shut; a broken nose bent to one side; lips pressed around the bowstring's line; a full short beard cropped close. Expression: cunning, patient, aiming low.
HEAD: a leather cap with a green cord, hair tucked.
DRESS: malachite-green robe, leather lamellar armor with cinnabar-red lacing, a quiver at the hip.
WEAPON: a bow drawn, arrow aimed downward off-canvas.
BEARING: on horseback, twisted in the saddle, bow drawn low.
BACKGROUND: the riverside battlefield at Xiaoting, flat blue water and ochre bank, spear tips.

IMAGE 3 — file name: song_qian.png
SUBJECT: Song Qian, 40, big, broad, a wall of a man.
FACE: round face; skin ruddy; brows thick; eyes dogged, protective, looking past the viewer; a broad nose; a wide mouth shut; a long dark beard. Expression: dogged, standing between danger and his lord.
HEAD: an iron helmet with a cinnabar-red tassel.
DRESS: malachite-green battle robe, heavy iron plate armor with cinnabar-red cords, a green cloak.
WEAPON: a halberd held crosswise in both hands, as a barrier.
BEARING: standing square, feet planted, halberd across, shielding someone behind.
BACKGROUND: the walls of Hefei in flat ochre, dust, azurite Wei banners small.

```

## 第 18 批

存为：
- 图 1：贾华（新出）→ `assets/portraits/source/jia_hua.png`
- 图 2：周善（新出）→ `assets/portraits/source/zhou_shan.png`
- 图 3：韩综（新出）→ `assets/portraits/source/han_zong.png`

```
BATCH 18 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: jia_hua.png
SUBJECT: Jia Hua, 38, wiry, medium height, tense shoulders.
FACE: narrow face with hollow cheeks; skin pale sallow; brows thin; eyes nervous, flicking sideways; a thin nose; a mouth chewed at the corner; a dark goatee. Expression: nervous, waiting for a signal that does not come.
HEAD: hair under a small green cap.
DRESS: malachite-green robe with cinnabar-red inner sleeves, a light leather cuirass hidden under it.
WEAPON: a sabre, hand on the hilt, blade still sheathed.
BEARING: hidden behind a curtain, peeking around its edge.
BACKGROUND: a corridor of Ganlu Temple, flat green pillars and a heavy cinnabar-red curtain.

IMAGE 2 — file name: zhou_shan.png
SUBJECT: Zhou Shan, 35, medium height, sleek, oily, a courtier's softness.
FACE: heart-shaped face with a wide forehead; skin fair; brows arched; eyes calculating under a bow; a small nose; a smiling mouth; a thin mustache only. Expression: sycophantic, already counting the reward.
HEAD: a green silk cap with a cinnabar-red cord.
DRESS: malachite-green brocade robe with cinnabar-red trim, a light silk cloak, a gold belt hook.
WEAPON: a short sabre hidden at the back of the belt; one sleeve raised in a bow, the other hand pointing to the river.
BEARING: standing on a boat deck, bowing, pointing.
BACKGROUND: the Yangtze in flat blue bands, one boat with a red sail, the Jing zhou bank.

IMAGE 3 — file name: han_zong.png
SUBJECT: Han Zong, 32, tall, dissolute, a soft belly on a big frame.
FACE: heavy-jowled face; skin pale; brows thick and uneven; eyes bloodshot, resentful; a broad nose; a loose mouth; a sparse patchy beard. Expression: resentful, debauched, turning his back.
HEAD: hair loose and untidy, a green cap pushed back.
DRESS: malachite-green robe open at the chest, a cuirass with cinnabar-red cords worn over one shoulder only, wine on the sleeve.
WEAPON: a sabre thrown down; one hand resting on an azurite-blue Wei seal box.
BEARING: seated among wine jars, turned away, hand on the seal.
BACKGROUND: a river crossing on the Wei border, flat ochre bank, boats of defectors small.

```

## 第 19 批

存为：
- 图 1：孙翊（新出）→ `assets/portraits/source/sun_yi.png`
- 图 2：谷利（新出）→ `assets/portraits/source/gu_li.png`
- 图 3：孙静（新出）→ `assets/portraits/source/sun_jing.png`

```
BATCH 19 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: sun_yi.png
SUBJECT: Sun Yi, 20, tall, powerful, hot blood in a young frame.
FACE: bony face with high cheekbones; skin tanned gold; brows thick and upswept like his brother's; eyes furious, wide; a straight nose; a mouth bared; clean-shaven. Expression: furious, quick to draw.
HEAD: hair in a high topknot with a red cord, no cap.
DRESS: malachite-green brocade robe with cinnabar-red lining, a light scale cuirass unlaced for the feast.
WEAPON: a sword half-drawn from its scabbard, a wine cup smashed at his feet.
BEARING: rising from a mat, one knee up, sword half out.
BACKGROUND: a feast hall at Danyang, flat lanterns and low tables, a spilled wine vessel.

IMAGE 2 — file name: gu_li.png
SUBJECT: Gu Li, 30, small, lean, a servant's quickness.
FACE: oval face; skin weathered brown; brows short; eyes fierce with devotion, shouting; a small nose; a mouth open; stubble. Expression: desperate, devoted, shouting "jump".
HEAD: hair tied with a plain cord, no helmet.
DRESS: a short malachite-green servant's jacket with cinnabar-red cuffs, no armor, trousers bound.
WEAPON: a riding whip raised high.
BEARING: running beside a horse, whip up, looking forward.
BACKGROUND: the broken bridge at Xiaoyao Ford, flat blue river, a gap in the planks.

IMAGE 3 — file name: sun_jing.png
SUBJECT: Sun Jing, 55, medium height, portly, mild and unhurried.
FACE: flat wide face with the family's broad jaw; skin ruddy; brows thick; eyes content, sleepy, unambitious; a broad nose; a mouth at rest; a long grey beard. Expression: content, wanting nothing more.
HEAD: a plain cloth cap, grey hair loose at the sides.
DRESS: a malachite-green everyday robe with cinnabar-red cuffs, no armor, a straw rain cape over the shoulders.
WEAPON: none; a fishing rod held loosely.
BEARING: seated on a riverbank, rod out, leaning back.
BACKGROUND: the Fuchun river in flat blue with mulberry trees and a village wall.

```

## 第 20 批

存为：
- 图 1：张温（新出）→ `assets/portraits/source/zhang_wen.png`
- 图 2：薛综（新出）→ `assets/portraits/source/xue_zong.png`
- 图 3：严畯（新出）→ `assets/portraits/source/yan_jun.png`

```
BATCH 20 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: zhang_wen.png
SUBJECT: Zhang Wen, 32, tall, handsome, elegant, long fingers.
FACE: long rectangular face; skin fair; brows long and fine; eyes brilliant, a touch vain; a straight nose; a well-cut mouth; a small dark goatee. Expression: brilliant, enjoying his own phrasing.
HEAD: a scholar's black gauze cap with a jade pin.
DRESS: malachite-green brocade robe with cinnabar-red borders, white inner sleeves, a jade belt.
WEAPON: none; an open scroll in one hand, the other sleeve raised in a gesture.
BEARING: standing, mid-sentence, sleeve raised.
BACKGROUND: the Chengdu palace gate in flat white and cinnabar red, Shu banners.

IMAGE 2 — file name: xue_zong.png
SUBJECT: Xue Zong, 50, medium height, well-fed, quick-witted.
FACE: round face; skin olive; brows raised; eyes twinkling with a joke; a short nose; a mouth open mid-quip; a full short grey beard. Expression: teasing, about to land the punchline.
HEAD: a black gauze cap tilted.
DRESS: malachite-green court robe with cinnabar-red cuffs, a white inner robe, a gold belt hook.
WEAPON: none; chopsticks raised in one hand.
BEARING: seated at a banquet, chopsticks up, eyes on the viewer.
BACKGROUND: a banquet hall at Jianye, flat green pillars and a bronze wine vessel.

IMAGE 3 — file name: yan_jun.png
SUBJECT: Yan Jun, 45, stocky, clumsy in the body, a scholar's soft hands.
FACE: heavy-jowled face; skin pale sallow; brows thick; eyes embarrassed, laughing at himself; a broad nose; a wide sheepish mouth; a sparse patchy beard. Expression: embarrassed, honest about it.
HEAD: a black cloth cap knocked sideways.
DRESS: malachite-green scholar's robe with cinnabar-red trim, mud on one sleeve, a borrowed sword belt.
WEAPON: none; one hand raised in apology.
BEARING: sitting on the ground after falling from a horse, one hand up.
BACKGROUND: the camp gate at Lukou in flat green with a saddled horse standing riderless.

```

## 第 21 批

存为：
- 图 1：程秉（新出）→ `assets/portraits/source/cheng_bing.png`
- 图 2：是仪（新出）→ `assets/portraits/source/shi_yi.png`
- 图 3：程远志（新出）→ `assets/portraits/source/cheng_yuan_zhi.png`

```
BATCH 21 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: cheng_bing.png
SUBJECT: Cheng Bing, 60, thin, tall, stooped from books.
FACE: narrow face with hollow cheeks; skin pale; brows white; eyes kindly, lecturing; a long nose; a mouth shaped around a word; a long white beard. Expression: kindly, in the middle of a lesson.
HEAD: a scholar's cloth cap in dark green.
DRESS: a malachite-green scholar's robe with cinnabar-red collar, wide sleeves, a plain sash.
WEAPON: none; a book open on the knee, one finger raised.
BEARING: seated, finger raised, teaching.
BACKGROUND: a prince's study at Jianye, flat bookshelves and a lattice window.

IMAGE 2 — file name: shi_yi.png
SUBJECT: Shi Yi, 62, small, thin, frugal to the bone.
FACE: oval face; skin olive; brows grey; eyes modest, unruffled, incorruptible; a thin nose; a small mouth; a grey goatee. Expression: modest, unbothered by wealth.
HEAD: a plain cloth cap, patched.
DRESS: a malachite-green robe patched at the elbows with cinnabar-red thread, a rope belt.
WEAPON: none; holding a small clay bowl of plain rice.
BEARING: standing in a doorway, bowl held in both hands.
BACKGROUND: a small thatched house beside the high wall of a grand mansion, flat ochre and white.

IMAGE 3 — file name: cheng_yuan_zhi.png
SUBJECT: Cheng Yuanzhi, 35, big, coarse, thick arms, a bandit's swagger.
FACE: broad square face scarred across one cheek; skin dark reddish; brows tangled, meeting over the bridge; small pig-like eyes half-buried in flesh; a flattened nose; the lower lip stuck out; a full short beard growing in every direction. Expression: swaggering, sizing up easy prey.
HEAD: a yellow headscarf tied tight, hair spilling below.
DRESS: a purple sleeveless jacket over a bare chest, an ochre sash, a stolen leather cuirass over one shoulder.
WEAPON: a sabre raised high in one hand.
BEARING: riding, sabre up, roaring.
BACKGROUND: the plain at Zhuo county in flat ochre, a horde of small yellow-scarfed figures as dots.

```

## 第 22 批

存为：
- 图 1：波才（新出）→ `assets/portraits/source/bo_cai.png`
- 图 2：孟优（新出）→ `assets/portraits/source/meng_you.png`
- 图 3：迷当大王（新出）→ `assets/portraits/source/mi_dang_da_wang.png`

```
BATCH 22 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: bo_cai.png
SUBJECT: Bo Cai, 42, lean, ragged, a preacher's fire in a thin body.
FACE: narrow face with hollow cheeks and a bulging forehead; skin weathered brown; thin brows lifted to the middle; burning, unblinking eyes rolled upward; a beak of a nose; lips cracked, open on a chant; a sparse patchy beard in tufts. Expression: fervent, hearing heaven, preaching to thousands.
HEAD: a yellow headscarf with a talisman tucked in it.
DRESS: a patched purple robe with an ochre sash, a rope belt, no armor, a bundle of charm papers at the waist.
WEAPON: none; a Taiping scroll raised in one hand.
BEARING: standing on a cart, one arm high, chest out.
BACKGROUND: the camp at Changshe, straw huts in flat ochre with fire starting at the edges, night.

IMAGE 2 — file name: meng_you.png
SUBJECT: Meng You, 30, stocky, bare-armed, tattooed, a heavy belly.
FACE: round face; skin sun-dark; brows thick; eyes sheepish, drunk, half-closed; a flat nose; a loose grin; clean-shaven. Expression: sheepish, drunk, caught again.
HEAD: hair in braids with feathers and beads, a bronze band on the brow.
DRESS: a purple woven vest open over a tattooed chest, an ochre cloth wrap, bone necklaces, a rope around both wrists.
WEAPON: none; hands loosely tied in front, a wine gourd tipped over beside him.
BEARING: sitting on the ground, tied, grinning up.
BACKGROUND: a Nanzhong valley with hanging vines in flat green, a bamboo cage.

IMAGE 3 — file name: mi_dang_da_wang.png
SUBJECT: King Midang, 50, broad, heavy, a Qiang chieftain, thick shoulders under fur.
FACE: bony face with high cheekbones; skin ruddy and wind-burned; brows thick and coarse; eyes greedy, weighing the offer; a strong nose; a wide mouth; a long braided beard. Expression: greedy, calculating what the gold buys.
HEAD: a fur hat with a gold ornament, hair in thick braids with silver rings.
DRESS: a purple wool coat with ochre trim over a sheepskin, a bronze breastplate, a heavy silver belt.
WEAPON: a sabre laid across the lap; one hand weighing a gold ingot.
BEARING: seated cross-legged on a fur, ingot held up, eyes on it.
BACKGROUND: Qiang felt tents on a snowy plateau near Longxi, flat white, a yak.

```

## 第 23 批

存为：
- 图 1：范式 X01（范疆、张达、马邈）（新出）→ `assets/portraits/source/x01.png`
- 图 2：范式 X02（黄皓）（新出）→ `assets/portraits/source/x02.png`
- 图 3：范式 X03（樊建、郤正）（新出）→ `assets/portraits/source/x03.png`

```
BATCH 23 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: x01.png
SUBJECT: a Shu officer, 40, medium height, thick-waisted, sloping shoulders, short neck.
FACE: flat wide face, skin weathered brown; brows short and bushy, set far apart; eyes small, puffy-lidded, looking sideways; short nose with wide nostrils; mouth thick-lipped and pulled down at one corner; a sparse patchy beard that grows only on the chin and jaw. Expression: sullen, nursing a grudge.
HEAD: hair in a low topknot under a plain leather cap with a short cinnabar-red cord, cap slightly askew.
DRESS: cinnabar-red battle robe, faded and patched at one elbow, over a cuirass of small iron plates laced with dark cord; a rough hemp cloak; no gold.
WEAPON: a ring-pommel sabre drawn halfway from its scabbard at the hip.
BEARING: standing with one shoulder against a gatepost, arms crossed, chin tucked.
BACKGROUND: a camp gate of upright logs in flat ochre, a single limp red banner, evening sky in pale gamboge.

IMAGE 2 — file name: x02.png
SUBJECT: a Shu palace eunuch, 50, short, soft-bodied, round-shouldered, a small paunch.
FACE: heavy-jowled face, skin pale sallow with pouches under the eyes; brows sparse and faint; eyes small, bright, darting to one side; a short upturned nose; a small wet mouth with the corners tucked in; clean-shaven, smooth as a woman's. Expression: sly, ingratiating.
HEAD: hair fully covered by a black gauze eunuch's cap with a cinnabar-red inner lining showing at the edge.
DRESS: a dark purple-brown silk robe with a cinnabar-red collar and cuffs, an embroidered pouch and a bunch of keys at the belt, sleeves long over the hands.
WEAPON: none; a horsetail whisk with an ivory handle in one hand.
BEARING: bent forward at the waist in a half-bow, head tilted up, whisk held across the chest.
BACKGROUND: a palace corridor in Chengdu, flat red pillars receding, a gamboge-yellow curtain half drawn.

IMAGE 3 — file name: x03.png
SUBJECT: a Shu court scholar, 45, tall, thin, long neck, narrow shoulders.
FACE: long rectangular face, skin fair; brows straight and dark, drawn together; eyes long, tired, red-rimmed, fixed on something in his hands; a long straight nose; a thin mouth; a thin dark mustache and a small pointed goatee. Expression: worried, reading bad news.
HEAD: a scholar's black cloth cap with a flat top, hair tidy.
DRESS: a plain grey-green robe with a cinnabar-red inner collar and a black sash, a bamboo-slip case on a cord over one shoulder.
WEAPON: none; an unrolled bundle of bamboo slips held open in both hands.
BEARING: seated on a mat, hunched over the slips, one finger tracing a line.
BACKGROUND: a walled archive in a Shu county town, flat shelves of scroll ends, a lattice window in pale gamboge.

```

## 第 24 批

存为：
- 图 1：范式 X04（刘禅）（新出）→ `assets/portraits/source/x04.png`
- 图 2：范式 X05（曹安民、许仪、成济）（新出）→ `assets/portraits/source/x05.png`
- 图 3：范式 X06（孔秀、孟坦、卞喜）（新出）→ `assets/portraits/source/x06.png`

```
BATCH 24 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: x04.png
SUBJECT: a Shu lord, 50, fat, short, round-shouldered, thick soft arms.
FACE: round face with full cheeks and a double chin; skin fair with pink patches on the cheeks; brows thin and arched high; eyes small, round, wide open and unfocused; a short round nose; mouth slightly open in a contented half-smile; a full soft short beard, brown. Expression: contented, vacant, pleased with the food.
HEAD: a lord's black cap with a small gold ornament, tilted back on the head, a strand of hair loose.
DRESS: a cinnabar-red brocade robe embroidered with gold peonies, straining across the belly, a wide jade belt, a fur collar.
WEAPON: none; a wine cup held in one hand, a half-eaten fruit in the other.
BEARING: seated on a low couch, leaning back on one elbow, both hands full.
BACKGROUND: a banquet hall in flat gamboge yellow, a row of dancers as small pale shapes, a red lacquer table with dishes.

IMAGE 2 — file name: x05.png
SUBJECT: a young Wei officer, 22, tall, lean, long neck, narrow hips.
FACE: heart-shaped face with a wide smooth forehead and a narrow chin; skin sun-tanned; brows thick and upswept; eyes large, wide-set, bright and impatient; a straight nose with a thin bridge; a mouth with full lips pressed together; clean-shaven, a faint blue shadow on the upper lip. Expression: eager, over-confident, waiting to be noticed.
HEAD: hair in a high topknot under an iron helmet with an azurite-blue tassel, brow-guard polished.
DRESS: azurite-blue battle robe with gold-thread trim at the collar, a cuirass of small iron scales edged in gold, a short dark cloak, leather bracers.
WEAPON: a long dagger-axe (ge) held upright, the hooked blade above the head.
BEARING: standing on the balls of the feet, weight forward, shaft gripped in both hands.
BACKGROUND: the gate of a Wei county town in flat grey-blue, a gold-edged blue banner, a paved road.

IMAGE 3 — file name: x06.png
SUBJECT: a Wei garrison commander, 42, stocky, thick chest, short thick neck, bow-legged.
FACE: broad square face, skin ruddy; brows thick, black, joined at the middle; eyes narrow, suspicious, looking up from under the brows; a broad flat nose; a wide mouth closed hard; a full short black beard covering the jaw. Expression: suspicious, blocking the way.
HEAD: an iron helmet with a neck-guard of leather strips and a short blue cord, no plume.
DRESS: azurite-blue robe, a heavy cuirass of large black-lacquered plates with gold rivets, a wide leather belt, a rough wool cloak.
WEAPON: a long-handled broad sabre planted butt-down across the path, one hand on the shaft.
BEARING: standing square with feet apart, blocking, the other hand raised palm out to stop the viewer.
BACKGROUND: a mountain pass gate in flat ochre and azurite, a wooden barrier across the road, a single pine on the cliff.

```

## 第 25 批

存为：
- 图 1：范式 X07（韩福、王植、夏侯杰）（新出）→ `assets/portraits/source/x07.png`
- 图 2：范式 X08（贾充）（新出）→ `assets/portraits/source/x08.png`
- 图 3：范式 X09（沈莹）（新出）→ `assets/portraits/source/x09.png`

```
BATCH 25 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: x07.png
SUBJECT: an old Wei officer, 58, thin, stooped, narrow shoulders, long arms.
FACE: long face with a jutting chin; skin pale sallow with deep lines from nose to mouth; brows grey, thin, drooping; eyes small and rheumy, half-closed against the light; a long nose with a drooping tip; a thin mouth pulled in over missing teeth; a thin white goatee only, upper lip bare. Expression: fretful, tired, wanting this to be over.
HEAD: grey hair in a thin topknot under a battered iron helmet with a faded azurite cloth wrapped round it.
DRESS: azurite-blue robe worn to grey at the seams, an old cuirass of leather lamellar with a few gold-edged plates at the chest, a heavy cloak pulled tight.
WEAPON: a straight sword sheathed and used as a walking stick, point to the ground.
BEARING: seated on a mooring post, hunched, both hands on the sword pommel, looking up.
BACKGROUND: a Yellow River ferry crossing in flat pale ochre, a flat-bottomed boat pulled up, reeds.

IMAGE 2 — file name: x08.png
SUBJECT: a senior Wei minister, 55, medium height, slight paunch, soft hands, upright.
FACE: narrow face with hollow cheeks; skin olive; brows thin and long, arched; eyes long, hooded, glittering, looking at the viewer sideways; a thin high-bridged nose; a thin-lipped mouth with a fixed small smile; a thin dark mustache only, chin shaved. Expression: smug, listening, already decided.
HEAD: a minister's black gauze cap with wings and a gold hairpin, hair perfectly tidy, grey at the temples.
DRESS: a formal deep-azurite court robe with wide gold-embroidered borders, a white inner robe, a gold seal on a purple cord at the waist.
WEAPON: none; an ivory tablet held at the chest in both hands.
BEARING: standing with the body turned away and the head turned back, tablet raised a little too high.
BACKGROUND: a Luoyang palace gate in flat grey-blue with gold nail-heads, a red lacquer railing.

IMAGE 3 — file name: x09.png
SUBJECT: a Wu field officer, 38, wiry, tall, long arms, hard flat stomach.
FACE: bony face with high cheekbones and a hollow under them; skin dark reddish from sun and wind; brows thick and straight, one cut by a short scar; eyes deep-set, wide open, fierce; a strong nose with a high bridge; a wide mouth showing the lower teeth; a dark stubble beard, two days old. Expression: defiant, ready to die on this spot.
HEAD: a malachite-green cloth headscarf tied tight over the hair and knotted at the back, no helmet.
DRESS: a malachite-green short battle robe with cinnabar-red cords at the chest, a cuirass of dark leather lamellar, forearms bare and wrapped in cord.
WEAPON: a short broad sabre in the right hand and a small round rattan shield on the left forearm.
BEARING: crouched low behind the shield, sabre drawn back, looking over the rim.
BACKGROUND: a river palisade of stakes in flat malachite green, a wide band of pale blue water, a war junk's stern.

```

## 第 26 批

存为：
- 图 1：范式 X10（岑昏）（新出）→ `assets/portraits/source/x10.png`
- 图 2：范式 X11（万彧、张悌）（新出）→ `assets/portraits/source/x11.png`
- 图 3：范式 X12（孙皓）（新出）→ `assets/portraits/source/x12.png`

```
BATCH 26 — make 3 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: x10.png
SUBJECT: a Wu palace favourite, 40, short, plump, narrow shoulders, wide hips.
FACE: oval face with a small soft chin; skin pale with a greasy shine on the forehead; brows sparse and pale; eyes small, round, darting to the side; a short nose with a fleshy tip; a small pursed mouth; a few wispy hairs at the corners of the mouth, no real beard. Expression: fawning, watching the lord's face for a sign.
HEAD: a tall black gauze cap with a cinnabar-red silk ribbon, hair oiled flat.
DRESS: a malachite-green silk robe with wide cinnabar-red borders and a gold-thread hem, a gilt belt, a perfume sachet swinging.
WEAPON: none; a gilt bronze incense burner carried in both hands, smoke rising.
BEARING: shuffling forward in small steps, shoulders hunched, burner held out ahead.
BACKGROUND: a palace hall in Jianye, flat green pillars, a cinnabar-red screen, a gold censer stand.

IMAGE 2 — file name: x11.png
SUBJECT: an old Wu chancellor, 55, medium height, spare, straight-backed, knotted hands.
FACE: long rectangular face, skin fair and dry with fine lines; brows grey, thick, level; eyes long and steady, looking straight at the viewer; a straight nose; a firm mouth; a long grey beard reaching the belt, mustache grey. Expression: grieving, resolved.
HEAD: a chancellor's black gauze cap with a jade pin, hair white at the temples.
DRESS: a formal malachite-green court robe with cinnabar-red inner sleeves and a black sash, a jade tablet on a cord, a sword belt over the robe.
WEAPON: a straight sword held horizontally in both hands as if just handed to him.
BEARING: standing with feet together, sword held level, head bowed a little.
BACKGROUND: a Yangtze crossing in flat pale blue, a line of green banners on the far bank, low hills.

IMAGE 3 — file name: x12.png
SUBJECT: a young Wu lord, 30, medium height, narrow-shouldered, restless, thin wrists.
FACE: heart-shaped face with a wide forehead and a small pointed chin; skin fair with a flush high on the cheeks; brows thin and slanting up sharply; eyes narrow, bright, cold, with the whites showing under the pupils; a thin curved nose; a small hard mouth, lips pale; a short black beard trimmed to a point. Expression: cruel, amused at someone's fear.
HEAD: a lord's black cap with a gold dragon ornament, worn tipped forward over the brow.
DRESS: a malachite-green brocade robe with gold dragon pattern and cinnabar-red lining, a jade belt hung with a gilt dagger, a fur collar.
WEAPON: a jeweled dagger drawn and held loosely, tapping the palm.
BEARING: sprawled sideways on a throne, one leg over the armrest, head turned to the viewer.
BACKGROUND: a Jianye throne hall in flat green and gold, a cinnabar-red curtain, a bronze crane lamp.

```

## 第 27 批

存为：
- 图 1：南蛮兵（杂兵）（新出）→ `assets/portraits/source/mob_nanman.png`

```
BATCH 27 — make 1 separate images, in this order. Follow all rules from my first message.

IMAGE 1 — file name: mob_nanman.png
SUBJECT: a Nanman tribal warrior, 25, tall, lean, long limbs, bare-chested.
FACE: long face with a jutting chin, skin dark bronze; brows thin; eyes large and bright; a broad nose; a wide mouth with parted lips; clean-shaven, blue tattoo lines on the cheeks. Expression: wild, whooping.
HEAD: hair standing up in a stiff crest with two red parrot feathers and a purple cord across the brow.
DRESS: bare chest and arms with ochre paint, a short skirt of hide and bark with a purple sash, a necklace of teeth, bare feet, a bamboo tube at the belt.
WEAPON: a short spear in one hand and a long bamboo blowpipe in the other.
BEARING: running low through grass, spear back, blowpipe held ahead.
BACKGROUND: a jungle in flat malachite green with tall ferns and a purple-grey rock.

```
