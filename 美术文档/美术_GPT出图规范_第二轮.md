# 美术出图规范 · 第二轮（43 张新出重做）

> **2026-10-01 起立绘原图按档放在 `assets/立绘/<档>/<中文名>.png`**（无双、虎、名、骁、校_范式、杂兵）。下文写的 `assets/portraits/source/...`、`gongbi/...` 路径作废：出好的图直接存成对应档文件夹里的中文名，覆盖旧图，再跑 `python3 build_portraits.py`。


第一轮的 79 张里，36 张重出的都合格，不用再动。43 张新出的全跑偏了：纸色发黄发褐，画法像油画，而且大多是全身像，人小、腿脚都画出来了，跟已有的白纸半身像放在一起像两个游戏。这一轮只重出这 43 张，规则把画风和取景卡死了。

## 跟上一轮比改了什么

- **附参考图。** 这是最管用的一条。第一条消息里同时上传 3 张已经合格的图当样板：`assets/portraits/gongbi/sunce.png`（孙策）、`assets/portraits/gongbi/tiger/tianfeng.png`（田丰）、`assets/portraits/source/guan_hai.png`（管亥）。GPT 照着图对齐纸色和取景，比读文字准得多。
- **画风锁死。** 写明纸要接近白色，不准米色、羊皮纸、发黄、做旧；不准画成油画或写实插画；背景要稀疏。
- **取景锁死。** 只画到腰，不准出现腿、膝盖、脚；坐着的、跪着的、骑马的也只画到腰；头加上身要占画面高度的 75% 到 90%。
- **每段描述的 BEARING（姿势）前都加了「只画到腰」**，因为描述里写了「站着、坐着、蹲着」，GPT 就画成了全身。

## 怎么用

1. 开新对话。第一条消息先上传上面那 3 张参考图，再贴下面「第一条消息」整段，等它回 ready。
2. 按顺序贴各批，每批 3 张。每出完 3、4 批就开新对话，重新传参考图、重新贴第一条消息。
3. 出完一张先跟参考图并排看一眼：纸发黄、出了腿脚、人小的，当场让它重画，别存。
4. 存为批里写的文件名，放到对应位置，会覆盖这次跑偏的那张。
5. 放好几批就叫我，我检查完接进游戏。

## 第一条消息（整段复制，记得先传 3 张参考图）

```
You are painting character portraits for a Chinese Three Kingdoms strategy game. I attached 3 reference images. Every new image must look like it belongs to the SAME SET as the references. The rules below beat anything in a character description.

1. STYLE LOCK — most important
- Paper is clean, bright, near-white (like the references). NOT beige, NOT parchment, NOT tan, NOT yellowed, NOT sepia, no vignette, no stains. If the whole image looks brown, golden or old, it is WRONG — redraw.
- It is a gongbi painting: fine even ink outlines and flat, saturated mineral colors (azurite blue, malachite green, cinnabar red, gamboge yellow). NOT an oil painting, NOT a realistic illustration, NOT 3D, no cinematic or sunset lighting, no heavy shading.
- Background is light, simple and sparse, lighter than the figure, with lots of white paper showing. No dense scenery filling the frame.

2. FRAMING LOCK
- Canvas exactly 3:4 portrait (e.g. 1086x1448). Never square, never landscape.
- FULL BLEED: the painting fills the whole canvas edge to edge. No white margin, no blank paper border, no frame, no mount around the picture.
- WAIST-UP ONLY: crop at the hips. Legs, knees and feet must NOT appear in the image. A seated or kneeling figure is cropped at the lap. A rider shows only the horse's head and neck at most.
- The figure is BIG: head plus torso fill 75–90% of the image height. Top of the head/helmet 4–8% below the top edge.
- One figure only, three-quarter view, centered. Background people, if any, tiny and far.
- Both hands and anything held stay inside the frame, at least 6% from the left and right edges.
- Compact poses: bows held upright, spears upright or diagonal, blades raised vertically; pointing arms bent. If a description says standing / walking / seated / kneeling / crouching / riding, still show waist-up only.

3. HANDS, BODY, WEAPONS
- Two arms, two hands, five fingers each, no fused or extra fingers, no third hand. Each hand does one thing.
- Spear and polearm shafts are continuous and straight through the hand; bows have one string attached to both tips; only one weapon in active use.

4. STYLE TEXT (apply to every image)
STYLE: Tang–Song court academy "gongbi" painting on bright white xuan paper. Extremely fine, even "iron-wire" ink outlines; every fold and armor scale delineated. Opaque mineral pigments in layers: azurite blue, malachite green, cinnabar red, gamboge yellow, shell-white, fine gold outlining on metal. Bright, clean, luminous, like a freshly painted court scroll — not aged. Face modeled with the traditional "three whites" (forehead, nose bridge, chin) and a touch of pink on the cheeks; no western shadow. The face must be a specific East Asian adult with real bone structure, drawn to the description below, not a generic handsome face.
COMPOSITION: single figure, waist-up, three-quarter view, centered, head in the upper third, vertical 3:4 canvas, cropped at the hips. Background is painted in the same flat gongbi manner, simplified, lighter in value than the figure, and must never overlap the face.
FINISH: fine paper texture, colors flat and rich. No text, no seal, no signature, no border, no frame.

NEGATIVE: aged paper, yellowed silk, sepia, muted, desaturated, ink wash, loose brushwork, anime, manga, chibi, big eyes, small pointed chin, beauty-filter face, idealized symmetrical face, generic handsome man, generic pretty woman, same face, western features, photorealistic, 3D render, glossy skin, bloom, lens flare, chiaroscuro, full body, multiple figures, text, watermark, signature, frame, border
Extra negative: white border, margin, frame, mat, beige paper, parchment, tan background, sepia tone, golden haze, oil painting, realistic rendering, 3D, full body, legs, knees, feet, shoes, small figure, distant figure, dense landscape.

5. OUTPUT PROTOCOL
- I send batches of 3 characters. Make exactly 3 SEPARATE images, in the order given, never a sheet or grid.
- Before showing each image, compare it with the reference images: same white paper, same saturation, same waist-up framing, same figure size. If it differs, redraw it.
- After each image write one line: the file name I gave, then "checked".

Reply "ready" and wait for the first batch.
```

## 第 1 批

存为：
- 图 1：傅士仁 → `assets/portraits/source/fu_shi_ren.png`
- 图 2：雷铜 → `assets/portraits/source/lei_tong.png`
- 图 3：吴兰 → `assets/portraits/source/wu_lan.png`

```
BATCH 01 — make 3 separate images, in this order. Match the reference images: near-white paper, waist-up, big figure. Follow all rules from my first message.

IMAGE 1 — file name: fu_shi_ren.png
SUBJECT: Fu Shiren, 42, medium height, thick around the waist, a short neck.
FACE: heavy-jowled face with a low forehead; skin pale sallow; brows sparse; eyes puffy and sullen; a broad flat nose; a mouth turned down at both corners; a sparse patchy beard. Expression: resentful, nursing an old grudge.
HEAD: hair loosely bound, a plain iron helmet held under one arm instead of worn.
DRESS: cinnabar-red battle robe stained at the hem, brown leather lamellar armor with a broken cord, a grey cloak.
WEAPON: a sabre laid flat across both open palms, offered forward.
BEARING: (show waist-up only) kneeling on one knee, sabre held out in surrender, eyes raised sideways.
BACKGROUND: the walls of Gong'an in flat ochre with a white flag on the tower, low water in bands.

IMAGE 2 — file name: lei_tong.png
SUBJECT: Lei Tong, 33, tall and bony, long arms and legs, a thin neck.
FACE: narrow face with hollow cheeks; skin dark reddish; brows thin and raised in alarm; eyes wide, whites showing; a long thin nose; a mouth open; stubble on the jaw. Expression: startled, cornered, no time to think.
HEAD: a leather helmet knocked askew, hair coming loose.
DRESS: cinnabar-red battle robe torn at one shoulder, iron lamellar armor, a quiver half-empty.
WEAPON: a spear raised across the body in a parry, both hands.
BEARING: (show waist-up only) falling back a step, spear up, head turned toward the attack.
BACKGROUND: a mountain pass at Wudu, flat grey cliffs, a fan of thin arrow lines from one side.

IMAGE 3 — file name: wu_lan.png
SUBJECT: Wu Lan, 30, short, compact, muscular.
FACE: flat wide face, skin weathered brown; brows short and thick; eyes small, wary, red-rimmed; a broad nose; a wide thin mouth; a thin mustache only. Expression: exhausted, distrusting the hills.
HEAD: hair tied with a strip of cloth, no helmet, dust in the hair.
DRESS: cinnabar-red battle robe faded and mud-splashed, a leather cuirass with straps cut, a short cape.
WEAPON: a sabre laid on the ground beside him; both hands cupped, lifting water.
BEARING: (show waist-up only) kneeling at a stream, drinking from his hands, eyes lifted to the viewer.
BACKGROUND: the Yinping valley, flat green, a row of Di tribal felt tents on the slope.

```

## 第 2 批

存为：
- 图 1：高翔 → `assets/portraits/source/gao_xiang.png`
- 图 2：陈式 → `assets/portraits/source/chen_shi.png`
- 图 3：句扶 → `assets/portraits/source/ju_fu.png`

```
BATCH 02 — make 3 separate images, in this order. Match the reference images: near-white paper, waist-up, big figure. Follow all rules from my first message.

IMAGE 1 — file name: gao_xiang.png
SUBJECT: Gao Xiang, 42, medium height, sturdy, thick thighs.
FACE: heart-shaped face with a wide forehead and a narrow chin; skin olive; brows level; eyes round, stunned, unblinking; a short straight nose; a slack mouth; a dark goatee. Expression: disbelieving, still counting the loss.
HEAD: an iron helmet with the tassel torn off.
DRESS: cinnabar-red robe, iron plate cuirass dented at the chest, a dark cloak dragging.
WEAPON: a sabre held loosely, point trailing on the ground.
BEARING: (show waist-up only) standing among broken stakes, shoulders dropped, sabre hanging.
BACKGROUND: the Liuliu stockade in flat ochre, wooden palisade broken in a gap, a fallen banner.

IMAGE 2 — file name: chen_shi.png
SUBJECT: Chen Shi, 28, lean and wiry, long arms, narrow hips.
FACE: long rectangular face, skin sun-tanned; brows dark and straight; eyes bright, quick, cocky; a straight nose; a mouth pulled up at one corner; a sparse patchy young beard. Expression: impatient, sure of himself.
HEAD: hair in a high topknot under a small iron cap with a red plume.
DRESS: cinnabar-red battle robe, light leather armor with iron studs, a short red cloak.
WEAPON: a spear laid across the saddle, one hand on it.
BEARING: (show waist-up only) riding, leaning forward, looking straight ahead past the viewer.
BACKGROUND: a river valley with two small county towns of Wudu and Yinping, flat green and ochre.

IMAGE 3 — file name: ju_fu.png
SUBJECT: Ju Fu, 40, big-boned, heavy shoulders, thick wrists, a Ba mountain man.
FACE: bony face with high cheekbones; skin dark reddish; brows thick; eyes deep-set, mild, avoiding the viewer; a strong nose; a firm mouth; a long coarse dark beard. Expression: humble, uncomfortable with praise.
HEAD: hair in a plain knot with a bone pin, a strip of cloth around the brow.
DRESS: cinnabar-red battle robe over Ba-style bronze breastplate with tiger pattern, leather leggings, a hemp sash.
WEAPON: none; an awl and a leather strap in his hands, mending an armor cord.
BEARING: (show waist-up only) seated on a rock, bent over the strap, glancing up.
BACKGROUND: the Dangqu river gorge, flat blue water, stilt houses on the bank.

```

## 第 3 批

存为：
- 图 1：向宠 → `assets/portraits/source/xiang_chong.png`
- 图 2：阎宇 → `assets/portraits/source/yan_yu.png`
- 图 3：王甫 → `assets/portraits/source/wang_fu.png`

```
BATCH 03 — make 3 separate images, in this order. Match the reference images: near-white paper, waist-up, big figure. Follow all rules from my first message.

IMAGE 1 — file name: xiang_chong.png
SUBJECT: Xiang Chong, 35, medium height, upright, compact and tidy.
FACE: oval face, skin fair; brows even and neat; eyes attentive, level, taking in every face; a straight nose; a closed mouth; a full short beard along the jaw. Expression: listening, missing nothing.
HEAD: hair in a topknot under a black lacquered helmet with a narrow gold band.
DRESS: cinnabar-red brocade robe, polished iron plate cuirass with gold edging, a white inner collar, a jade tally at the belt.
WEAPON: a sword at the hip; holding a bundle of bamboo slips, a roster.
BEARING: (show waist-up only) standing at attention, roster open in both hands, looking along a line of men off-canvas.
BACKGROUND: the Chengdu palace gate in flat red and white, spear tips of guards in a row.

IMAGE 2 — file name: yan_yu.png
SUBJECT: Yan Yu, 50, thin and tall, stooped, a long neck.
FACE: narrow face with hollow cheeks; skin pale sallow; brows thin and raised; eyes small and darting; a long nose; a mouth stretched in an ingratiating smile; a thin mustache only. Expression: fawning, calculating his next favor.
HEAD: a black gauze official's cap tilted toward the listener.
DRESS: cinnabar-red court robe with too much gold embroidery, a lacquered breastplate worn for show, a heavy jade belt.
WEAPON: none; one hand cupped beside the mouth.
BEARING: (show waist-up only) bent forward in a half-bow, whispering toward someone off-canvas, eyes on the viewer.
BACKGROUND: the White Emperor city at Yong'an on a cliff, flat grey rock and the river far below.

IMAGE 3 — file name: wang_fu.png
SUBJECT: Wang Fu, 61, medium height, spare and dry, straight-backed.
FACE: long face with a jutting chin; skin olive; brows grey and heavy; eyes hooded, wet, seeing what is coming; a thin nose; a mouth pressed to a line; a grey goatee. Expression: grieving in advance, resolved.
HEAD: a black cloth cap, grey hair at the temples.
DRESS: a dark grey robe with a cinnabar-red collar, a black sash, no armor, sleeves wet with dew.
WEAPON: none; both hands gripping the stone edge of a parapet.
BEARING: (show waist-up only) standing on a wall top, leaning over the parapet, looking down.
BACKGROUND: the small walled town of Maicheng at dawn, flat pale grey, malachite-green banners ringing it.

```

## 第 4 批

存为：
- 图 1：赵累 → `assets/portraits/source/zhao_lei.png`
- 图 2：黄权 → `assets/portraits/source/huang_quan.png`
- 图 3：马忠（吴） → `assets/portraits/source/ma_zhong_wu.png`

```
BATCH 04 — make 3 separate images, in this order. Match the reference images: near-white paper, waist-up, big figure. Follow all rules from my first message.

IMAGE 1 — file name: zhao_lei.png
SUBJECT: Zhao Lei, 32, short and stocky, thick calves, a soldier's stance.
FACE: round face, skin sun-tanned; brows thick and short; eyes frightened but fixed forward; a snub nose; a wide mouth shut tight; clean-shaven. Expression: scared, staying anyway.
HEAD: hair in a topknot, a leather helmet with a torn red cord.
DRESS: cinnabar-red battle robe, leather lamellar armor, a rope coiled at the belt.
WEAPON: a short sabre at the hip; holding a horse's bridle.
BEARING: (show waist-up only) walking, bridle in hand, looking back over the shoulder.
BACKGROUND: the winter hills of Linju, bare trees in flat black, a rope stretched between two trunks.

IMAGE 2 — file name: huang_quan.png
SUBJECT: Huang Quan, 46, medium-tall, solid, a heavy dignified frame.
FACE: heavy-jowled face with a strong jaw; skin fair; brows thick and level; eyes honest and sorrowful, meeting the viewer; a broad nose; a full mouth; a long dark beard, combed. Expression: sad, refusing to pretend otherwise.
HEAD: a black gauze official's cap with a jade pin.
DRESS: cinnabar-red court robe with dark green borders, a lacquered plate cuirass beneath, a leather belt with an iron buckle.
WEAPON: none; holding up a memorial of bamboo slips in both hands.
BEARING: (show waist-up only) kneeling upright, memorial raised to eye level, back straight.
BACKGROUND: the Yangtze at Yiling, flat blue bands, Shu camps on the north bank and Wei tents small on the far side.

IMAGE 3 — file name: ma_zhong_wu.png
SUBJECT: Ma Zhong of Wu, 33, short, stocky, low to the ground.
FACE: flat wide face; skin dark reddish; brows short and thick; eyes narrow, sly, patient; a flat nose; a thin mouth; stubble. Expression: sly, a hunter waiting.
HEAD: hair tied under a green cloth wrap, no helmet.
DRESS: malachite-green short battle robe, leather cuirass with cinnabar-red cords, trousers bound at the calf.
WEAPON: a coiled hemp rope with iron hooks in both hands.
BEARING: (show waist-up only) crouched in reeds, coiling the trip-rope, eyes lifted.
BACKGROUND: a narrow path through reeds at Linju, flat ochre reeds, a hook set low across the path.

```

## 第 5 批

存为：
- 图 1：谢旌 → `assets/portraits/source/xie_jing.png`
- 图 2：谭雄 → `assets/portraits/source/tan_xiong.png`
- 图 3：宋谦 → `assets/portraits/source/song_qian.png`

```
BATCH 05 — make 3 separate images, in this order. Match the reference images: near-white paper, waist-up, big figure. Follow all rules from my first message.

IMAGE 1 — file name: xie_jing.png
SUBJECT: Xie Jing, 30, tall, lean, long limbs.
FACE: long rectangular face, jaw wider than the temples; skin olive; dark brows slanting inward; bright, eager, wide-open eyes; a straight nose with flared nostrils; teeth showing in a shout; a thin mustache only, no beard. Expression: brash, certain of a quick win.
HEAD: hair in a topknot under an iron helmet with a green plume.
DRESS: malachite-green battle robe, iron scale cuirass with cinnabar-red trim, a short cloak.
WEAPON: a spear leveled forward with both hands.
BEARING: (show waist-up only) riding, leaning into the charge.
BACKGROUND: the hills at Yiling in flat green, small cinnabar-red Shu tents on the ridge.

IMAGE 2 — file name: tan_xiong.png
SUBJECT: Tan Xiong, 36, medium height, thick arms, an archer's chest.
FACE: broad square face with a low hairline; skin sun-tanned; one brow flat, the other pulled up over the sighting eye, the left eye squeezed shut; a broken nose bent to one side; lips pressed around the bowstring's line; a full short beard cropped close. Expression: cunning, patient, aiming low.
HEAD: a leather cap with a green cord, hair tucked.
DRESS: malachite-green robe, leather lamellar armor with cinnabar-red lacing, a quiver at the hip.
WEAPON: a bow drawn, arrow aimed downward off-canvas.
BEARING: (show waist-up only) on horseback, twisted in the saddle, bow drawn low.
BACKGROUND: the riverside battlefield at Xiaoting, flat blue water and ochre bank, spear tips.

IMAGE 3 — file name: song_qian.png
SUBJECT: Song Qian, 40, big, broad, a wall of a man.
FACE: round face; skin ruddy; brows thick; eyes dogged, protective, looking past the viewer; a broad nose; a wide mouth shut; a long dark beard. Expression: dogged, standing between danger and his lord.
HEAD: an iron helmet with a cinnabar-red tassel.
DRESS: malachite-green battle robe, heavy iron plate armor with cinnabar-red cords, a green cloak.
WEAPON: a halberd held crosswise in both hands, as a barrier.
BEARING: (show waist-up only) standing square, feet planted, halberd across, shielding someone behind.
BACKGROUND: the walls of Hefei in flat ochre, dust, azurite Wei banners small.

```

## 第 6 批

存为：
- 图 1：贾华 → `assets/portraits/source/jia_hua.png`
- 图 2：周善 → `assets/portraits/source/zhou_shan.png`
- 图 3：韩综 → `assets/portraits/source/han_zong.png`

```
BATCH 06 — make 3 separate images, in this order. Match the reference images: near-white paper, waist-up, big figure. Follow all rules from my first message.

IMAGE 1 — file name: jia_hua.png
SUBJECT: Jia Hua, 38, wiry, medium height, tense shoulders.
FACE: narrow face with hollow cheeks; skin pale sallow; brows thin; eyes nervous, flicking sideways; a thin nose; a mouth chewed at the corner; a dark goatee. Expression: nervous, waiting for a signal that does not come.
HEAD: hair under a small green cap.
DRESS: malachite-green robe with cinnabar-red inner sleeves, a light leather cuirass hidden under it.
WEAPON: a sabre, hand on the hilt, blade still sheathed.
BEARING: (show waist-up only) hidden behind a curtain, peeking around its edge.
BACKGROUND: a corridor of Ganlu Temple, flat green pillars and a heavy cinnabar-red curtain.

IMAGE 2 — file name: zhou_shan.png
SUBJECT: Zhou Shan, 35, medium height, sleek, oily, a courtier's softness.
FACE: heart-shaped face with a wide forehead; skin fair; brows arched; eyes calculating under a bow; a small nose; a smiling mouth; a thin mustache only. Expression: sycophantic, already counting the reward.
HEAD: a green silk cap with a cinnabar-red cord.
DRESS: malachite-green brocade robe with cinnabar-red trim, a light silk cloak, a gold belt hook.
WEAPON: a short sabre hidden at the back of the belt; one sleeve raised in a bow, the other hand pointing to the river.
BEARING: (show waist-up only) standing on a boat deck, bowing, pointing.
BACKGROUND: the Yangtze in flat blue bands, one boat with a red sail, the Jing zhou bank.

IMAGE 3 — file name: han_zong.png
SUBJECT: Han Zong, 32, tall, dissolute, a soft belly on a big frame.
FACE: heavy-jowled face; skin pale; brows thick and uneven; eyes bloodshot, resentful; a broad nose; a loose mouth; a sparse patchy beard. Expression: resentful, debauched, turning his back.
HEAD: hair loose and untidy, a green cap pushed back.
DRESS: malachite-green robe open at the chest, a cuirass with cinnabar-red cords worn over one shoulder only, wine on the sleeve.
WEAPON: a sabre thrown down; one hand resting on an azurite-blue Wei seal box.
BEARING: (show waist-up only) seated among wine jars, turned away, hand on the seal.
BACKGROUND: a river crossing on the Wei border, flat ochre bank, boats of defectors small.

```

## 第 7 批

存为：
- 图 1：孙翊 → `assets/portraits/source/sun_yi.png`
- 图 2：谷利 → `assets/portraits/source/gu_li.png`
- 图 3：孙静 → `assets/portraits/source/sun_jing.png`

```
BATCH 07 — make 3 separate images, in this order. Match the reference images: near-white paper, waist-up, big figure. Follow all rules from my first message.

IMAGE 1 — file name: sun_yi.png
SUBJECT: Sun Yi, 20, tall, powerful, hot blood in a young frame.
FACE: bony face with high cheekbones; skin tanned gold; brows thick and upswept like his brother's; eyes furious, wide; a straight nose; a mouth bared; clean-shaven. Expression: furious, quick to draw.
HEAD: hair in a high topknot with a red cord, no cap.
DRESS: malachite-green brocade robe with cinnabar-red lining, a light scale cuirass unlaced for the feast.
WEAPON: a sword half-drawn from its scabbard, a wine cup smashed at his feet.
BEARING: (show waist-up only) rising from a mat, one knee up, sword half out.
BACKGROUND: a feast hall at Danyang, flat lanterns and low tables, a spilled wine vessel.

IMAGE 2 — file name: gu_li.png
SUBJECT: Gu Li, 30, small, lean, a servant's quickness.
FACE: oval face; skin weathered brown; brows short; eyes fierce with devotion, shouting; a small nose; a mouth open; stubble. Expression: desperate, devoted, shouting "jump".
HEAD: hair tied with a plain cord, no helmet.
DRESS: a short malachite-green servant's jacket with cinnabar-red cuffs, no armor, trousers bound.
WEAPON: a riding whip raised high.
BEARING: (show waist-up only) running beside a horse, whip up, looking forward.
BACKGROUND: the broken bridge at Xiaoyao Ford, flat blue river, a gap in the planks.

IMAGE 3 — file name: sun_jing.png
SUBJECT: Sun Jing, 55, medium height, portly, mild and unhurried.
FACE: flat wide face with the family's broad jaw; skin ruddy; brows thick; eyes content, sleepy, unambitious; a broad nose; a mouth at rest; a long grey beard. Expression: content, wanting nothing more.
HEAD: a plain cloth cap, grey hair loose at the sides.
DRESS: a malachite-green everyday robe with cinnabar-red cuffs, no armor, a straw rain cape over the shoulders.
WEAPON: none; a fishing rod held loosely.
BEARING: (show waist-up only) seated on a riverbank, rod out, leaning back.
BACKGROUND: the Fuchun river in flat blue with mulberry trees and a village wall.

```

## 第 8 批

存为：
- 图 1：张温 → `assets/portraits/source/zhang_wen.png`
- 图 2：薛综 → `assets/portraits/source/xue_zong.png`
- 图 3：严畯 → `assets/portraits/source/yan_jun.png`

```
BATCH 08 — make 3 separate images, in this order. Match the reference images: near-white paper, waist-up, big figure. Follow all rules from my first message.

IMAGE 1 — file name: zhang_wen.png
SUBJECT: Zhang Wen, 32, tall, handsome, elegant, long fingers.
FACE: long rectangular face; skin fair; brows long and fine; eyes brilliant, a touch vain; a straight nose; a well-cut mouth; a small dark goatee. Expression: brilliant, enjoying his own phrasing.
HEAD: a scholar's black gauze cap with a jade pin.
DRESS: malachite-green brocade robe with cinnabar-red borders, white inner sleeves, a jade belt.
WEAPON: none; an open scroll in one hand, the other sleeve raised in a gesture.
BEARING: (show waist-up only) standing, mid-sentence, sleeve raised.
BACKGROUND: the Chengdu palace gate in flat white and cinnabar red, Shu banners.

IMAGE 2 — file name: xue_zong.png
SUBJECT: Xue Zong, 50, medium height, well-fed, quick-witted.
FACE: round face; skin olive; brows raised; eyes twinkling with a joke; a short nose; a mouth open mid-quip; a full short grey beard. Expression: teasing, about to land the punchline.
HEAD: a black gauze cap tilted.
DRESS: malachite-green court robe with cinnabar-red cuffs, a white inner robe, a gold belt hook.
WEAPON: none; chopsticks raised in one hand.
BEARING: (show waist-up only) seated at a banquet, chopsticks up, eyes on the viewer.
BACKGROUND: a banquet hall at Jianye, flat green pillars and a bronze wine vessel.

IMAGE 3 — file name: yan_jun.png
SUBJECT: Yan Jun, 45, stocky, clumsy in the body, a scholar's soft hands.
FACE: heavy-jowled face; skin pale sallow; brows thick; eyes embarrassed, laughing at himself; a broad nose; a wide sheepish mouth; a sparse patchy beard. Expression: embarrassed, honest about it.
HEAD: a black cloth cap knocked sideways.
DRESS: malachite-green scholar's robe with cinnabar-red trim, mud on one sleeve, a borrowed sword belt.
WEAPON: none; one hand raised in apology.
BEARING: (show waist-up only) sitting on the ground after falling from a horse, one hand up.
BACKGROUND: the camp gate at Lukou in flat green with a saddled horse standing riderless.

```

## 第 9 批

存为：
- 图 1：程秉 → `assets/portraits/source/cheng_bing.png`
- 图 2：是仪 → `assets/portraits/source/shi_yi.png`
- 图 3：程远志 → `assets/portraits/source/cheng_yuan_zhi.png`

```
BATCH 09 — make 3 separate images, in this order. Match the reference images: near-white paper, waist-up, big figure. Follow all rules from my first message.

IMAGE 1 — file name: cheng_bing.png
SUBJECT: Cheng Bing, 60, thin, tall, stooped from books.
FACE: narrow face with hollow cheeks; skin pale; brows white; eyes kindly, lecturing; a long nose; a mouth shaped around a word; a long white beard. Expression: kindly, in the middle of a lesson.
HEAD: a scholar's cloth cap in dark green.
DRESS: a malachite-green scholar's robe with cinnabar-red collar, wide sleeves, a plain sash.
WEAPON: none; a book open on the knee, one finger raised.
BEARING: (show waist-up only) seated, finger raised, teaching.
BACKGROUND: a prince's study at Jianye, flat bookshelves and a lattice window.

IMAGE 2 — file name: shi_yi.png
SUBJECT: Shi Yi, 62, small, thin, frugal to the bone.
FACE: oval face; skin olive; brows grey; eyes modest, unruffled, incorruptible; a thin nose; a small mouth; a grey goatee. Expression: modest, unbothered by wealth.
HEAD: a plain cloth cap, patched.
DRESS: a malachite-green robe patched at the elbows with cinnabar-red thread, a rope belt.
WEAPON: none; holding a small clay bowl of plain rice.
BEARING: (show waist-up only) standing in a doorway, bowl held in both hands.
BACKGROUND: a small thatched house beside the high wall of a grand mansion, flat ochre and white.

IMAGE 3 — file name: cheng_yuan_zhi.png
SUBJECT: Cheng Yuanzhi, 35, big, coarse, thick arms, a bandit's swagger.
FACE: broad square face scarred across one cheek; skin dark reddish; brows tangled, meeting over the bridge; small pig-like eyes half-buried in flesh; a flattened nose; the lower lip stuck out; a full short beard growing in every direction. Expression: swaggering, sizing up easy prey.
HEAD: a yellow headscarf tied tight, hair spilling below.
DRESS: a purple sleeveless jacket over a bare chest, an ochre sash, a stolen leather cuirass over one shoulder.
WEAPON: a sabre raised high in one hand.
BEARING: (show waist-up only) riding, sabre up, roaring.
BACKGROUND: the plain at Zhuo county in flat ochre, a horde of small yellow-scarfed figures as dots.

```

## 第 10 批

存为：
- 图 1：波才 → `assets/portraits/source/bo_cai.png`
- 图 2：孟优 → `assets/portraits/source/meng_you.png`
- 图 3：迷当大王 → `assets/portraits/source/mi_dang_da_wang.png`

```
BATCH 10 — make 3 separate images, in this order. Match the reference images: near-white paper, waist-up, big figure. Follow all rules from my first message.

IMAGE 1 — file name: bo_cai.png
SUBJECT: Bo Cai, 42, lean, ragged, a preacher's fire in a thin body.
FACE: narrow face with hollow cheeks and a bulging forehead; skin weathered brown; thin brows lifted to the middle; burning, unblinking eyes rolled upward; a beak of a nose; lips cracked, open on a chant; a sparse patchy beard in tufts. Expression: fervent, hearing heaven, preaching to thousands.
HEAD: a yellow headscarf with a talisman tucked in it.
DRESS: a patched purple robe with an ochre sash, a rope belt, no armor, a bundle of charm papers at the waist.
WEAPON: none; a Taiping scroll raised in one hand.
BEARING: (show waist-up only) standing on a cart, one arm high, chest out.
BACKGROUND: the camp at Changshe, straw huts in flat ochre with fire starting at the edges, night.

IMAGE 2 — file name: meng_you.png
SUBJECT: Meng You, 30, stocky, bare-armed, tattooed, a heavy belly.
FACE: round face; skin sun-dark; brows thick; eyes sheepish, drunk, half-closed; a flat nose; a loose grin; clean-shaven. Expression: sheepish, drunk, caught again.
HEAD: hair in braids with feathers and beads, a bronze band on the brow.
DRESS: a purple woven vest open over a tattooed chest, an ochre cloth wrap, bone necklaces, a rope around both wrists.
WEAPON: none; hands loosely tied in front, a wine gourd tipped over beside him.
BEARING: (show waist-up only) sitting on the ground, tied, grinning up.
BACKGROUND: a Nanzhong valley with hanging vines in flat green, a bamboo cage.

IMAGE 3 — file name: mi_dang_da_wang.png
SUBJECT: King Midang, 50, broad, heavy, a Qiang chieftain, thick shoulders under fur.
FACE: bony face with high cheekbones; skin ruddy and wind-burned; brows thick and coarse; eyes greedy, weighing the offer; a strong nose; a wide mouth; a long braided beard. Expression: greedy, calculating what the gold buys.
HEAD: a fur hat with a gold ornament, hair in thick braids with silver rings.
DRESS: a purple wool coat with ochre trim over a sheepskin, a bronze breastplate, a heavy silver belt.
WEAPON: a sabre laid across the lap; one hand weighing a gold ingot.
BEARING: (show waist-up only) seated cross-legged on a fur, ingot held up, eyes on it.
BACKGROUND: Qiang felt tents on a snowy plateau near Longxi, flat white, a yak.

```

## 第 11 批

存为：
- 图 1：范式 X01（范疆、张达、马邈） → `assets/portraits/source/x01.png`
- 图 2：范式 X02（黄皓） → `assets/portraits/source/x02.png`
- 图 3：范式 X03（樊建、郤正） → `assets/portraits/source/x03.png`

```
BATCH 11 — make 3 separate images, in this order. Match the reference images: near-white paper, waist-up, big figure. Follow all rules from my first message.

IMAGE 1 — file name: x01.png
SUBJECT: a Shu officer, 40, medium height, thick-waisted, sloping shoulders, short neck.
FACE: flat wide face, skin weathered brown; brows short and bushy, set far apart; eyes small, puffy-lidded, looking sideways; short nose with wide nostrils; mouth thick-lipped and pulled down at one corner; a sparse patchy beard that grows only on the chin and jaw. Expression: sullen, nursing a grudge.
HEAD: hair in a low topknot under a plain leather cap with a short cinnabar-red cord, cap slightly askew.
DRESS: cinnabar-red battle robe, faded and patched at one elbow, over a cuirass of small iron plates laced with dark cord; a rough hemp cloak; no gold.
WEAPON: a ring-pommel sabre drawn halfway from its scabbard at the hip.
BEARING: (show waist-up only) standing with one shoulder against a gatepost, arms crossed, chin tucked.
BACKGROUND: a camp gate of upright logs in flat ochre, a single limp red banner, evening sky in pale gamboge.

IMAGE 2 — file name: x02.png
SUBJECT: a Shu palace eunuch, 50, short, soft-bodied, round-shouldered, a small paunch.
FACE: heavy-jowled face, skin pale sallow with pouches under the eyes; brows sparse and faint; eyes small, bright, darting to one side; a short upturned nose; a small wet mouth with the corners tucked in; clean-shaven, smooth as a woman's. Expression: sly, ingratiating.
HEAD: hair fully covered by a black gauze eunuch's cap with a cinnabar-red inner lining showing at the edge.
DRESS: a dark purple-brown silk robe with a cinnabar-red collar and cuffs, an embroidered pouch and a bunch of keys at the belt, sleeves long over the hands.
WEAPON: none; a horsetail whisk with an ivory handle in one hand.
BEARING: (show waist-up only) bent forward at the waist in a half-bow, head tilted up, whisk held across the chest.
BACKGROUND: a palace corridor in Chengdu, flat red pillars receding, a gamboge-yellow curtain half drawn.

IMAGE 3 — file name: x03.png
SUBJECT: a Shu court scholar, 45, tall, thin, long neck, narrow shoulders.
FACE: long rectangular face, skin fair; brows straight and dark, drawn together; eyes long, tired, red-rimmed, fixed on something in his hands; a long straight nose; a thin mouth; a thin dark mustache and a small pointed goatee. Expression: worried, reading bad news.
HEAD: a scholar's black cloth cap with a flat top, hair tidy.
DRESS: a plain grey-green robe with a cinnabar-red inner collar and a black sash, a bamboo-slip case on a cord over one shoulder.
WEAPON: none; an unrolled bundle of bamboo slips held open in both hands.
BEARING: (show waist-up only) seated on a mat, hunched over the slips, one finger tracing a line.
BACKGROUND: a walled archive in a Shu county town, flat shelves of scroll ends, a lattice window in pale gamboge.

```

## 第 12 批

存为：
- 图 1：范式 X04（刘禅） → `assets/portraits/source/x04.png`
- 图 2：范式 X05（曹安民、许仪、成济） → `assets/portraits/source/x05.png`
- 图 3：范式 X06（孔秀、孟坦、卞喜） → `assets/portraits/source/x06.png`

```
BATCH 12 — make 3 separate images, in this order. Match the reference images: near-white paper, waist-up, big figure. Follow all rules from my first message.

IMAGE 1 — file name: x04.png
SUBJECT: a Shu lord, 50, fat, short, round-shouldered, thick soft arms.
FACE: round face with full cheeks and a double chin; skin fair with pink patches on the cheeks; brows thin and arched high; eyes small, round, wide open and unfocused; a short round nose; mouth slightly open in a contented half-smile; a full soft short beard, brown. Expression: contented, vacant, pleased with the food.
HEAD: a lord's black cap with a small gold ornament, tilted back on the head, a strand of hair loose.
DRESS: a cinnabar-red brocade robe embroidered with gold peonies, straining across the belly, a wide jade belt, a fur collar.
WEAPON: none; a wine cup held in one hand, a half-eaten fruit in the other.
BEARING: (show waist-up only) seated on a low couch, leaning back on one elbow, both hands full.
BACKGROUND: a banquet hall in flat gamboge yellow, a row of dancers as small pale shapes, a red lacquer table with dishes.

IMAGE 2 — file name: x05.png
SUBJECT: a young Wei officer, 22, tall, lean, long neck, narrow hips.
FACE: heart-shaped face with a wide smooth forehead and a narrow chin; skin sun-tanned; brows thick and upswept; eyes large, wide-set, bright and impatient; a straight nose with a thin bridge; a mouth with full lips pressed together; clean-shaven, a faint blue shadow on the upper lip. Expression: eager, over-confident, waiting to be noticed.
HEAD: hair in a high topknot under an iron helmet with an azurite-blue tassel, brow-guard polished.
DRESS: azurite-blue battle robe with gold-thread trim at the collar, a cuirass of small iron scales edged in gold, a short dark cloak, leather bracers.
WEAPON: a long dagger-axe (ge) held upright, the hooked blade above the head.
BEARING: (show waist-up only) standing on the balls of the feet, weight forward, shaft gripped in both hands.
BACKGROUND: the gate of a Wei county town in flat grey-blue, a gold-edged blue banner, a paved road.

IMAGE 3 — file name: x06.png
SUBJECT: a Wei garrison commander, 42, stocky, thick chest, short thick neck, bow-legged.
FACE: broad square face, skin ruddy; brows thick, black, joined at the middle; eyes narrow, suspicious, looking up from under the brows; a broad flat nose; a wide mouth closed hard; a full short black beard covering the jaw. Expression: suspicious, blocking the way.
HEAD: an iron helmet with a neck-guard of leather strips and a short blue cord, no plume.
DRESS: azurite-blue robe, a heavy cuirass of large black-lacquered plates with gold rivets, a wide leather belt, a rough wool cloak.
WEAPON: a long-handled broad sabre planted butt-down across the path, one hand on the shaft.
BEARING: (show waist-up only) standing square with feet apart, blocking, the other hand raised palm out to stop the viewer.
BACKGROUND: a mountain pass gate in flat ochre and azurite, a wooden barrier across the road, a single pine on the cliff.

```

## 第 13 批

存为：
- 图 1：范式 X07（韩福、王植、夏侯杰） → `assets/portraits/source/x07.png`
- 图 2：范式 X08（贾充） → `assets/portraits/source/x08.png`
- 图 3：范式 X09（沈莹） → `assets/portraits/source/x09.png`

```
BATCH 13 — make 3 separate images, in this order. Match the reference images: near-white paper, waist-up, big figure. Follow all rules from my first message.

IMAGE 1 — file name: x07.png
SUBJECT: an old Wei officer, 58, thin, stooped, narrow shoulders, long arms.
FACE: long face with a jutting chin; skin pale sallow with deep lines from nose to mouth; brows grey, thin, drooping; eyes small and rheumy, half-closed against the light; a long nose with a drooping tip; a thin mouth pulled in over missing teeth; a thin white goatee only, upper lip bare. Expression: fretful, tired, wanting this to be over.
HEAD: grey hair in a thin topknot under a battered iron helmet with a faded azurite cloth wrapped round it.
DRESS: azurite-blue robe worn to grey at the seams, an old cuirass of leather lamellar with a few gold-edged plates at the chest, a heavy cloak pulled tight.
WEAPON: a straight sword sheathed and used as a walking stick, point to the ground.
BEARING: (show waist-up only) seated on a mooring post, hunched, both hands on the sword pommel, looking up.
BACKGROUND: a Yellow River ferry crossing in flat pale ochre, a flat-bottomed boat pulled up, reeds.

IMAGE 2 — file name: x08.png
SUBJECT: a senior Wei minister, 55, medium height, slight paunch, soft hands, upright.
FACE: narrow face with hollow cheeks; skin olive; brows thin and long, arched; eyes long, hooded, glittering, looking at the viewer sideways; a thin high-bridged nose; a thin-lipped mouth with a fixed small smile; a thin dark mustache only, chin shaved. Expression: smug, listening, already decided.
HEAD: a minister's black gauze cap with wings and a gold hairpin, hair perfectly tidy, grey at the temples.
DRESS: a formal deep-azurite court robe with wide gold-embroidered borders, a white inner robe, a gold seal on a purple cord at the waist.
WEAPON: none; an ivory tablet held at the chest in both hands.
BEARING: (show waist-up only) standing with the body turned away and the head turned back, tablet raised a little too high.
BACKGROUND: a Luoyang palace gate in flat grey-blue with gold nail-heads, a red lacquer railing.

IMAGE 3 — file name: x09.png
SUBJECT: a Wu field officer, 38, wiry, tall, long arms, hard flat stomach.
FACE: bony face with high cheekbones and a hollow under them; skin dark reddish from sun and wind; brows thick and straight, one cut by a short scar; eyes deep-set, wide open, fierce; a strong nose with a high bridge; a wide mouth showing the lower teeth; a dark stubble beard, two days old. Expression: defiant, ready to die on this spot.
HEAD: a malachite-green cloth headscarf tied tight over the hair and knotted at the back, no helmet.
DRESS: a malachite-green short battle robe with cinnabar-red cords at the chest, a cuirass of dark leather lamellar, forearms bare and wrapped in cord.
WEAPON: a short broad sabre in the right hand and a small round rattan shield on the left forearm.
BEARING: (show waist-up only) crouched low behind the shield, sabre drawn back, looking over the rim.
BACKGROUND: a river palisade of stakes in flat malachite green, a wide band of pale blue water, a war junk's stern.

```

## 第 14 批

存为：
- 图 1：范式 X10（岑昏） → `assets/portraits/source/x10.png`
- 图 2：范式 X11（万彧、张悌） → `assets/portraits/source/x11.png`
- 图 3：范式 X12（孙皓） → `assets/portraits/source/x12.png`

```
BATCH 14 — make 3 separate images, in this order. Match the reference images: near-white paper, waist-up, big figure. Follow all rules from my first message.

IMAGE 1 — file name: x10.png
SUBJECT: a Wu palace favourite, 40, short, plump, narrow shoulders, wide hips.
FACE: oval face with a small soft chin; skin pale with a greasy shine on the forehead; brows sparse and pale; eyes small, round, darting to the side; a short nose with a fleshy tip; a small pursed mouth; a few wispy hairs at the corners of the mouth, no real beard. Expression: fawning, watching the lord's face for a sign.
HEAD: a tall black gauze cap with a cinnabar-red silk ribbon, hair oiled flat.
DRESS: a malachite-green silk robe with wide cinnabar-red borders and a gold-thread hem, a gilt belt, a perfume sachet swinging.
WEAPON: none; a gilt bronze incense burner carried in both hands, smoke rising.
BEARING: (show waist-up only) shuffling forward in small steps, shoulders hunched, burner held out ahead.
BACKGROUND: a palace hall in Jianye, flat green pillars, a cinnabar-red screen, a gold censer stand.

IMAGE 2 — file name: x11.png
SUBJECT: an old Wu chancellor, 55, medium height, spare, straight-backed, knotted hands.
FACE: long rectangular face, skin fair and dry with fine lines; brows grey, thick, level; eyes long and steady, looking straight at the viewer; a straight nose; a firm mouth; a long grey beard reaching the belt, mustache grey. Expression: grieving, resolved.
HEAD: a chancellor's black gauze cap with a jade pin, hair white at the temples.
DRESS: a formal malachite-green court robe with cinnabar-red inner sleeves and a black sash, a jade tablet on a cord, a sword belt over the robe.
WEAPON: a straight sword held horizontally in both hands as if just handed to him.
BEARING: (show waist-up only) standing with feet together, sword held level, head bowed a little.
BACKGROUND: a Yangtze crossing in flat pale blue, a line of green banners on the far bank, low hills.

IMAGE 3 — file name: x12.png
SUBJECT: a young Wu lord, 30, medium height, narrow-shouldered, restless, thin wrists.
FACE: heart-shaped face with a wide forehead and a small pointed chin; skin fair with a flush high on the cheeks; brows thin and slanting up sharply; eyes narrow, bright, cold, with the whites showing under the pupils; a thin curved nose; a small hard mouth, lips pale; a short black beard trimmed to a point. Expression: cruel, amused at someone's fear.
HEAD: a lord's black cap with a gold dragon ornament, worn tipped forward over the brow.
DRESS: a malachite-green brocade robe with gold dragon pattern and cinnabar-red lining, a jade belt hung with a gilt dagger, a fur collar.
WEAPON: a jeweled dagger drawn and held loosely, tapping the palm.
BEARING: (show waist-up only) sprawled sideways on a throne, one leg over the armrest, head turned to the viewer.
BACKGROUND: a Jianye throne hall in flat green and gold, a cinnabar-red curtain, a bronze crane lamp.

```

## 第 15 批

存为：
- 图 1：南蛮兵（杂兵） → `assets/portraits/source/mob_nanman.png`

```
BATCH 15 — make 1 separate images, in this order. Match the reference images: near-white paper, waist-up, big figure. Follow all rules from my first message.

IMAGE 1 — file name: mob_nanman.png
SUBJECT: a Nanman tribal warrior, 25, tall, lean, long limbs, bare-chested.
FACE: long face with a jutting chin, skin dark bronze; brows thin; eyes large and bright; a broad nose; a wide mouth with parted lips; clean-shaven, blue tattoo lines on the cheeks. Expression: wild, whooping.
HEAD: hair standing up in a stiff crest with two red parrot feathers and a purple cord across the brow.
DRESS: bare chest and arms with ochre paint, a short skirt of hide and bark with a purple sash, a necklace of teeth, bare feet, a bamboo tube at the belt.
WEAPON: a short spear in one hand and a long bamboo blowpipe in the other.
BEARING: (show waist-up only) running low through grass, spear back, blowpipe held ahead.
BACKGROUND: a jungle in flat malachite green with tall ferns and a purple-grey rock.

```

## 第 16 批（曹昂重出）

原提示词写了「圆脸、脸颊饱满、小下巴、皮肤很白、两颊泛红、小鼻子、没胡子」，GPT 画成了女相。这次把男相写死：方下巴、浓眉、喉结、唇上一层薄胡茬、肩宽。

存为：
- 图 1：曹昂 → `assets/portraits/source/cao_ang.png`（覆盖原图）

```
BATCH 16 — make 1 separate image. Match the reference images: near-white paper, waist-up, big figure. Follow all rules from my first message.

IMAGE 1 — file name: cao_ang.png
SUBJECT: Cao Ang, a young MAN of 20, clearly male, tall, broad-shouldered, athletic, a soldier's build.
FACE: a strong young man's face: square jaw, firm chin, visible Adam's apple; skin light with a warm tan, NOT pale or rosy; thick straight dark brows; eyes steady and urgent; a straight nose with a firm bridge; a wide mouth open mid-shout; a faint dark shadow of a first mustache on the upper lip. Masculine, NOT feminine, no makeup, no blush. Expression: urgent, selfless.
HEAD: hair in a topknot under a light iron helmet with a gold band, chin strap undone.
DRESS: azurite-blue brocade battle robe with gold edging, a light lamellar cuirass, a white silk cloak.
WEAPON: a sword at the hip; holding a horse's reins out toward the viewer.
BEARING: (show waist-up only) reins thrust forward with both hands, head turned to the danger behind.
BACKGROUND: the camp at Wancheng at night, flat ink-blue, thin white arrow lines, a torch.
```
