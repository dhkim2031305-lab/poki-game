// 게임 데이터 — teams/1-기획/balance.md 를 그대로 옮긴 상수예요.
// 수치를 바꾸려면 balance.md 를 먼저 고치고(기획팀) 여기에 맞춰요.
(() => {
  // 30개국 (게임 순위 순서). gdp = 1인당 GDP USD PPP 2024, money = 시작 돈(1위=100)
  // lang = 대표 언어, cur = 통화 코드(아이템 그림 이름), sym = 통화 기호, iso = 국기 파일
  // melee = 치기 효과, ranged = 쏘기 (style-guide.md "나라별 치기·쏘기")
  //   탄: arrow(활)·beam(미국 에너지 소총)·bullet(핀란드 소총)·sling(투석기) — 물총은 사용자가 취소 / 던지기: axe·mace(회전), polearm(곧게), boomerang(돌아옴)
  //   wave = 검 나라: 칼은 손에 둔 채 휘둘러 초승달 은빛 검기를 날려요 (사용자 확정 2026-11-25, 팀장 전달 — 예전엔 칼을 던졌어요 'blade')
  const C = (key, iso, gdp, money, lang, cur, sym, native, en, ko, melee, ranged) =>
    ({ key, iso, gdp, money, lang, cur, sym, native, en, ko, melee, ranged });
  const COUNTRIES = [
    C('luxembourg', 'lu', 157809, 100.0, 'fr', 'EUR', '€', 'Luxembourg', 'Luxembourg', '룩셈부르크', 'slash', 'wave'),
    C('ireland', 'ie', 140848, 89.3, 'en', 'EUR', '€', 'Ireland', 'Ireland', '아일랜드', 'smash', 'axe'),
    C('switzerland', 'ch', 97357, 61.7, 'de', 'CHF', 'CHF', 'Schweiz', 'Switzerland', '스위스', 'thrust', 'polearm'),
    C('usa', 'us', 86147, 54.6, 'en', 'USD', '$', 'United States', 'United States', '미국', 'thrust', 'beam'),
    C('netherlands', 'nl', 84738, 53.7, 'nl', 'EUR', '€', 'Nederland', 'Netherlands', '네덜란드', 'rapid', 'wave'),
    C('denmark', 'dk', 82563, 52.3, 'da', 'DKK', 'kr', 'Danmark', 'Denmark', '덴마크', 'smash', 'axe'),
    C('austria', 'at', 76674, 48.6, 'de', 'EUR', '€', 'Österreich', 'Austria', '오스트리아', 'slash', 'wave'),
    C('australia', 'au', 75044, 47.6, 'en', 'AUD', '$', 'Australia', 'Australia', '호주', 'spin', 'boomerang'),
    C('germany', 'de', 74947, 47.5, 'de', 'EUR', '€', 'Deutschland', 'Germany', '독일', 'bigslash', 'wave'),
    C('sweden', 'se', 71381, 45.2, 'sv', 'SEK', 'kr', 'Sverige', 'Sweden', '스웨덴', 'slash', 'wave'),
    C('canada', 'ca', 65483, 41.5, 'en', 'CAD', '$', 'Canada', 'Canada', '캐나다', 'smash', 'axe'),
    C('finland', 'fi', 65163, 41.3, 'fi', 'EUR', '€', 'Suomi', 'Finland', '핀란드', 'thrust', 'bullet'),
    C('france', 'fr', 62648, 39.7, 'fr', 'EUR', '€', 'France', 'France', '프랑스', 'slash', 'wave'),
    C('italy', 'it', 62530, 39.6, 'it', 'EUR', '€', 'Italia', 'Italy', '이탈리아', 'thrust', 'wave'),
    C('korea', 'kr', 61227, 38.8, 'ko', 'KRW', '₩', '한국', 'Korea', '한국', 'slash', 'arrow'),
    C('spain', 'es', 58189, 36.9, 'es', 'EUR', '€', 'España', 'Spain', '스페인', 'slash', 'wave'),
    C('czechia', 'cz', 57723, 36.6, 'cs', 'CZK', 'Kč', 'Česko', 'Czechia', '체코', 'smash', 'quake'),   // 체코: 도리깨 내려찍기 충격파 (사용자 확정 GDD 0-12)
    C('israel', 'il', 57357, 36.3, 'he', 'ILS', '₪', 'ישראל', 'Israel', '이스라엘', 'slash', 'sling'),
    C('lithuania', 'lt', 56261, 35.7, 'lt', 'EUR', '€', 'Lietuva', 'Lithuania', '리투아니아', 'thrust', 'polearm'),
    C('newzealand', 'nz', 55692, 35.3, 'en', 'NZD', '$', 'New Zealand', 'New Zealand', '뉴질랜드', 'thrust', 'polearm'),
    C('japan', 'jp', 54232, 34.4, 'ja', 'JPY', '¥', '日本', 'Japan', '일본', 'slash', 'wave'),
    C('portugal', 'pt', 52761, 33.4, 'pt', 'EUR', '€', 'Portugal', 'Portugal', '포르투갈', 'rapid', 'wave'),
    C('poland', 'pl', 50162, 31.8, 'pl', 'PLN', 'zł', 'Polska', 'Poland', '폴란드', 'thrust', 'polearm'),
    C('hungary', 'hu', 48548, 30.8, 'hu', 'HUF', 'Ft', 'Magyarország', 'Hungary', '헝가리', 'slash', 'wave'),
    C('slovakia', 'sk', 48190, 30.5, 'sk', 'EUR', '€', 'Slovensko', 'Slovakia', '슬로바키아', 'smash', 'axe'),
    C('greece', 'gr', 44497, 28.2, 'el', 'EUR', '€', 'Ελλάδα', 'Greece', '그리스', 'thrust', 'polearm'),
    C('turkiye', 'tr', 43626, 27.6, 'tr', 'TRY', '₺', 'Türkiye', 'Türkiye', '튀르키예', 'slash', 'wave'),
    C('chile', 'cl', 35493, 22.5, 'es', 'CLP', '$', 'Chile', 'Chile', '칠레', 'slash', 'wave'),
    C('mexico', 'mx', 26110, 16.5, 'es', 'MXN', '$', 'México', 'Mexico', '멕시코', 'slash', 'wave'),
    C('colombia', 'co', 23021, 14.6, 'es', 'COP', '$', 'Colombia', 'Colombia', '콜롬비아', 'slash', 'wave'),
  ];
  COUNTRIES.forEach((c, i) => { c.rank = i + 1; });

  // 통화 아이템 환율 순위 (1위 ×5.00 … 20위 ×1.50) · 배율 = 5.0 − (순위−1) × 3.5/19
  const CURRENCY_ORDER = 'GBP CHF EUR USD CAD AUD NZD ILS PLN CNY DKK SEK MXN CZK TRY JPY HUF CLP KRW COP'.split(' ');
  const CURRENCY_MUL = {};
  CURRENCY_ORDER.forEach((c, i) => { CURRENCY_MUL[c] = +(5.0 - i * 3.5 / 19).toFixed(2); });
  const CURRENCY_SYM = { GBP: '£', CHF: 'CHF', EUR: '€', USD: '$', CAD: '$', AUD: '$', NZD: '$', ILS: '₪', PLN: 'zł', CNY: '¥',
    DKK: 'kr', SEK: 'kr', MXN: '$', CZK: 'Kč', TRY: '₺', JPY: '¥', HUF: 'Ft', CLP: '$', KRW: '₩', COP: '$' };

  const BAL = {
    ROUNDS: 6,
    D: 7.5,                       // 라운드당 감소량 (1~5라운드를 깰 때마다)
    BANKRUPT_GIFT: 3.75,          // 파산 이어하기로 받는 돈 = D × 0.5
    // 돈 M → 배율: F = 0.4 + 0.6·M/100 (HP·공격력), S = 0.7 + 0.3·M/100 (이동 속도)
    BASE: { hp: 100, melee: 15, ranged: 8, speed: 220 },
    TOP1: { F: 2, S: 1.2 },   // 1위만 압도적으로: 체력·공격·스킬 ×2, 이동 ×1.2, 돈이 줄어도 끝까지 (사용자 "1위는 압도적으로 쌔게" → "2배", 2026-11-25)
    MELEE_CD: 0.4, RANGED_CD: 0.3,
    SKILL_TIME: 2,                // 무적 2초 (사용자 "무적 2초로 바꿔", 2026-11-26 · 전 3초 · 무적 중 공속 2.5배 그대로)
    INVULN_ATK_SPEED: 2.5,        // 무적인 동안 치기·쏘기 쿨타임 ÷2.5 (피해·스킬은 그대로)
    SKILL_PER_RUN: 5,             // 고유 스킬 한 판 5번 (사용자 "스킬은 모든 라운드에서 총 5번")
    SKILL_SHARED: false,          // false = 1번·2번 **각각** 5번 (사용자 "1. 각각 5번") · true면 합쳐서 5번
    INVULN_PER_ROUND: 2,          // 무적은 라운드마다 2번 (사용자 "무적스킬은 라운드당 2번")
    REVIVE_INVULN: 2.0,
    // 고유 스킬 유형별 수치 (balance.md 확정, 사용자 "추천대로"): 피해 = 80 × F
    SKILL: { DMG: 80,   // 40 → 80 (사용자 확정 2026-11-25, 팀장 전달) · 범위·시간 그대로
      DASH_DIST: 260, DASH_TIME: 0.35, AREA_R: 140, BARRAGE_TIME: 1.5, BARRAGE_N: 8, BARRAGE_DIV: 4,
      ZONE_D: 180, ZONE_TIME: 3, ZONE_TICK: 0.5, ZONE_DIV: 3 },
    ITEM_TIME: 8, ITEM_LIFE: 10, ITEMS_PER_ROUND: 2,
    CONTACT_DMG: 10, BOSS_CONTACT_DMG: 20,
    // 라운드별 외계인: n = 외계인 수(보스 제외), hp·speed, boss = 보스 체력
    WAVES: [
      { n: 8, hp: 30, speed: 80, boss: 150 },
      { n: 11, hp: 30, speed: 90, boss: 200 },
      { n: 14, hp: 40, speed: 100, boss: 260 },
      { n: 17, hp: 40, speed: 110, boss: 320 },
      { n: 20, hp: 50, speed: 120, boss: 400 },
      { n: 24, hp: 50, speed: 130, boss: 500 },
    ],
  };

  // 나라별 고유 스킬 — teams/1-기획/skills.md (전부 확정 2026-11-25) · 순위 순서
  // type: dash 돌진 · area 범위 · barrage 연사 · zone 설치 (방어는 GDD 0-15로 없앰) / shout: 그 나라에서 유명한 말 (번역 안 함)
  const SK = (type, shout, mod = {}) => ({ type, shout, mod });   // mod = 나라별 특징 (기획 승인 뒤 채워요)
  const SKILLS = [
    SK('dash', 'Hopp Lëtzebuerg!'), SK('area', "G'wan!"), SK('zone', 'Hopp Schwiiz!'), SK('barrage', "Let's go!"), SK('barrage', "Zet 'm op!"),
    SK('dash', 'Kom så!'), SK('dash', "Auf geht's!"), SK('barrage', 'Give it a burl!'), SK('area', "Los geht's!"), SK('dash', 'Heja!'),
    SK('barrage', "Giv'er!"), SK('dash', 'Tsemppiä!'), SK('area', 'Allez !'), SK('zone', 'Andiamo!'), SK('zone', '파이팅!'),
    SK('dash', '¡Vamos!'), SK('zone', 'Do toho!'), SK('barrage', 'יאללה!'), SK('dash', 'Pirmyn!'), SK('zone', 'Good on ya!'),
    SK('dash', '頑張れ！'), SK('area', 'Vamos lá!'), SK('dash', 'Dajesz!'), SK('barrage', 'Hajrá!'), SK('area', 'Poďme!'),
    SK('area', 'Πάμε!'), SK('area', 'Haydi!'), SK('area', '¡Dale, po!'), SK('dash', '¡Échale ganas!'), SK('area', '¡Hágale!'),
  ];
  COUNTRIES.forEach((c, i) => { c.skill = SKILLS[i]; });

  // 두 번째 고유 스킬 — teams/1-기획/skills2.md (이름·유형 확정 2026-11-25) · 외침 = texts.md skill2.shout ("내가 돈이 없지 가오가 없나"를 그 나라 말로)
  const SKILLS2 = [
    SK('area', "Je suis peut-être fauché, mais j'ai ma fierté !"),
    SK('dash', "I may be broke, but I've got my pride!"),
    SK('barrage', 'Ich bin vielleicht pleite, aber ich hab meinen Stolz!'),
    SK('zone', "I may be broke, but I've got my pride!"),
    SK('dash', 'Ik ben misschien blut, maar ik heb mijn trots!'),
    SK('area', 'Jeg er måske flad, men jeg har min stolthed!'),
    SK('area', 'Ich bin vielleicht pleite, aber ich hab meinen Stolz!'),
    SK('zone', "I may be broke, but I've got my pride!"),
    SK('dash', 'Ich bin vielleicht pleite, aber ich hab meinen Stolz!'),
    SK('zone', 'Jag må vara pank, men jag har min stolthet!'),
    SK('zone', "I may be broke, but I've got my pride!"),
    SK('zone', 'Rahaa ei ole, mutta ylpeyttä on!'),
    SK('dash', "Je suis peut-être fauché, mais j'ai ma fierté !"),
    SK('barrage', 'Sarò anche al verde, ma ho il mio orgoglio!'),
    SK('barrage', '내가 돈이 없지 가오가 없나!'),
    SK('area', '¡Estaré sin un duro, pero tengo mi orgullo!'),
    SK('area', 'Možná nemám peníze, ale mám svou hrdost!'),
    SK('dash', 'אולי אין לי כסף, אבל יש לי כבוד!'),
    SK('barrage', 'Gal ir neturiu pinigų, bet turiu savigarbą!'),
    SK('dash', "I may be broke, but I've got my pride!"),
    SK('area', '金はなくても、プライドはある！'),
    SK('barrage', 'Posso estar teso, mas tenho o meu orgulho!'),
    SK('area', 'Może nie mam kasy, ale mam honor!'),
    SK('dash', 'Lehet, hogy nincs pénzem, de büszkeségem az van!'),
    SK('barrage', 'Možno nemám peniaze, ale hrdosť mám!'),
    SK('dash', 'Μπορεί να μην έχω λεφτά, αλλά έχω αξιοπρέπεια!'),
    SK('dash', 'Param olmayabilir ama gururum var!'),
    SK('zone', '¡Estaré sin plata, pero tengo mi orgullo!'),
    SK('area', '¡Estaré sin lana, pero tengo mi orgullo!'),
    SK('dash', '¡Estaré sin plata, pero tengo mi orgullo!'),
  ];
  COUNTRIES.forEach((c, i) => { c.skill2 = SKILLS2[i]; });

  // 스킬 60개 고유 특징 — teams/1-기획/skills-unique.md (확정 2026-11-25, 사용자 "이대로 확정") · [1번, 2번]
  // k = 특징 꼬리표 (game.js SKILL_FN이 읽어요), mul·div 등 = 표의 피해 칸 그대로 (기준 피해 80 × F)
  const SKILL_MOD = {
    luxembourg: [{ k: 'dashInv', mul: .9, inv: 1 }, { k: 'fear', mul: .5, t: 1 }],
    ireland: [{ k: 'pull', mul: .8 }, { k: 'zigzag', mul: .9 }],
    switzerland: [{ k: 'trap', mul: 1.2, life: 6 }, { k: 'pierce', div: 5 }],
    usa: [{ k: 'bounce', div: 4 }, { k: 'rings', div: 3 }],
    netherlands: [{ k: 'lastHit', div: 8, last: .4, n: 5 }, { k: 'blink', mul: .9 }],
    denmark: [{ k: 'mark', mul: .6, t: 2, x: 2 }, { k: 'grow', mul1: .6, mul2: .4 }],
    austria: [{ k: 'prints', mul: .7, div: 8 }, { k: 'twoRings', mul: .5 }],
    australia: [{ k: 'boomer', out: .2, back: .2, fan: .22 }, { k: 'cross', div: 4 }],
    germany: [{ k: 'blast', mul: .9 }, { k: 'endSmash', mul: .5, smash: .5 }],
    sweden: [{ k: 'clones', mul: .7 }, { k: 'ring6', mul: .3, max: 3 }],
    canada: [{ k: 'stick', mul: .5, div: 8 }, { k: 'gather', mul: .9, life: 1.5 }],
    finland: [{ k: 'seal', mul: .5 }, { k: 'slow', div: 6 }],
    france: [{ k: 'cone', mul: 1 }, { k: 'wallSlam', mul: .6, slam: .4 }],
    italy: [{ k: 'corners', mul: 1, edge: .5, life: .7 }, { k: 'stepThrust', div: 5 }],
    korea: [{ k: 'sky', div: 3 }, { k: 'spread3', div: 6 }],
    spain: [{ k: 'focus', first: 1.6, rest: .3 }, { k: 'spinMove', mul: .8 }],
    czechia: [{ k: 'half', div: 8 }, { k: 'widen', mul: .35 }],
    israel: [{ k: 'lob', div: 4 }, { k: 'returnDash', mul: .4 }],
    lithuania: [{ k: 'long', mul: .7 }, { k: 'javelin3', mul: .35 }],
    newzealand: [{ k: 'speedZone', div: 8 }, { k: 'seeds', mul: .4, seed: .2 }],
    japan: [{ k: 'iai', mul: .5, cut: .5 }, { k: 'chain3', mul: .4 }],
    portugal: [{ k: 'gust', mul: .6 }, { k: 'splash', div: 6, sdiv: 12 }],
    poland: [{ k: 'accel', from: .5, to: 1 }, { k: 'pole', mul: .8 }],
    hungary: [{ k: 'arcs8', div: 8, n: 8, time: .8 }, { k: 'invHit', mul: .8, per: .2, max: 1 }],
    slovakia: [{ k: 'crack', mul: .9 }, { k: 'ricochet', mul: .3, n: 3 }],
    greece: [{ k: 'phalanx', mul: .7, weak: .3, t: 3 }, { k: 'spearEnd', mul: .6, spear: .4 }],
    turkiye: [{ k: 'orbit', div: 5 }, { k: 'curve', mul: .9 }],
    chile: [{ k: 'lift', mul: .5 }, { k: 'vortex', div: 4 }],
    mexico: [{ k: 'leap', mul: 1 }, { k: 'wings', mul: .45 }],
    colombia: [{ k: 'roar', mul: .3 }, { k: 'echo', mul: .5, clone: .4 }],
  };
  // 스킬 이펙트 나라 색 [1번, 2번] = [몸 색, 바깥 빛 색] (디자인 gpt-art/round14/지시서.md · 칠레 2는 회청 테두리)
  const SKILL_COL = {luxembourg: [["#FFC93C", "#5FB4EE"], ["#5FB4EE", "#FFC93C"]], ireland: [["#2FBF71", "#FF8A2E"], ["#FF8A2E", "#2FBF71"]], switzerland: [["#F2452E", "#DDE6F2"], ["#F2452E", "#DDE6F2"]], usa: [["#5FB4EE", "#F2452E"], ["#F2452E", "#5FB4EE"]], netherlands: [["#FF8A2E", "#3D74D9"], ["#3D74D9", "#FF8A2E"]], denmark: [["#F2452E", "#DDE6F2"], ["#F2452E", "#DDE6F2"]], austria: [["#F2452E", "#DDE6F2"], ["#F2452E", "#DDE6F2"]], australia: [["#FFC93C", "#2FBF71"], ["#2FBF71", "#FFC93C"]], germany: [["#FFC93C", "#F2452E"], ["#F2452E", "#FFC93C"]], sweden: [["#FFC93C", "#3D74D9"], ["#3D74D9", "#FFC93C"]], canada: [["#F2452E", "#DDE6F2"], ["#F2452E", "#DDE6F2"]], finland: [["#DDE6F2", "#3D74D9"], ["#3D74D9", "#DDE6F2"]], france: [["#3D74D9", "#F2452E"], ["#F2452E", "#3D74D9"]], italy: [["#2FBF71", "#F2452E"], ["#F2452E", "#2FBF71"]], korea: [["#F2452E", "#3D74D9"], ["#3D74D9", "#F2452E"]], spain: [["#FFC93C", "#F2452E"], ["#F2452E", "#FFC93C"]], czechia: [["#3D74D9", "#F2452E"], ["#F2452E", "#3D74D9"]], israel: [["#5FB4EE", "#DDE6F2"], ["#5FB4EE", "#DDE6F2"]], lithuania: [["#FFC93C", "#2FBF71"], ["#2FBF71", "#FFC93C"]], newzealand: [["#2FBF71", "#DDE6F2"], ["#2FBF71", "#DDE6F2"]], japan: [["#F2452E", "#DDE6F2"], ["#F2452E", "#DDE6F2"]], portugal: [["#2FBF71", "#F2452E"], ["#F2452E", "#2FBF71"]], poland: [["#F2452E", "#DDE6F2"], ["#F2452E", "#DDE6F2"]], hungary: [["#F2452E", "#2FBF71"], ["#2FBF71", "#F2452E"]], slovakia: [["#3D74D9", "#F2452E"], ["#F2452E", "#3D74D9"]], greece: [["#5FB4EE", "#DDE6F2"], ["#5FB4EE", "#DDE6F2"]], turkiye: [["#F2452E", "#DDE6F2"], ["#F2452E", "#DDE6F2"]], chile: [["#F2452E", "#3D74D9"], ["#8FA6C2", "#8FA6C2"]], mexico: [["#FFC93C", "#2FBF71"], ["#2FBF71", "#FFC93C"]], colombia: [["#FFC93C", "#3D74D9"], ["#3D74D9", "#FFC93C"]]};
  COUNTRIES.forEach(c => { const m = SKILL_MOD[c.key]; if (m) { c.skill.mod = m[0]; c.skill2.mod = m[1]; } });

  // ---- 기획서에 수치가 없어서 개발팀이 넣은 임시 값 [제안 · 기획팀 확인 필요] ----
  const TEMP = {
    HURT_INVULN: 0.7,             // 외계인에 닿은 뒤 다시 맞기까지 (없으면 닿는 순간 HP가 녹아요)
    SPAWN_GAP: [1.3, 1.2, 1.1, 1.0, 0.9, 0.8], // 라운드별 외계인 나오는 간격(초)
    MAX_ALIVE: 7,                 // 한 번에 전장에 있는 외계인 최대 수
    SHOOTER_EVERY: 4,             // 4마리 중 1마리가 사격 외계인 (1라운드는 없음)
    SHOOTER_GAP: 2.0, ENEMY_SHOT_DMG: 6, ENEMY_SHOT_SPEED: 170,
    BOSS_SPEED_MUL: 0.55, BOSS_RING_GAP: 4.5, BOSS_RING_N: 8, BOSS_SHOT_DMG: 8,
    MELEE_RANGE: 62, MELEE_ARC: Math.PI * 2 / 3, SHOT_SPEED: 430,
    ITEM_TIMES: [5, 15],          // 라운드 시작 뒤 화폐가 나오는 시간(초)
    ITEM_SPOTS: [[0.3, 0.35], [0.7, 0.65], [0.7, 0.35], [0.3, 0.65], [0.5, 0.3], [0.5, 0.7]],
    // 라운드마다 나오는 화폐 2개 (모든 나라 같음) — 약한 것에서 강한 것으로
    SKILL_ZONE_AHEAD: 120,   // 설치 구역을 놓는 앞 거리 (기획서에 없음)
    // 외계인 점프 (GDD 0-11 확정: 졸개 일부 + 4라운드부터 보스 · 수치는 alien-jump.md [제안])
    JUMP: { n: [0, 0, 2, 3, 4, 5], gap: [0, 0, 6, 5, 5, 4], crouch: 0.5, air: 0.6, r: 70, dmg: 15, lift: 46 },
    BOSS_JUMP: { from: 4, gap: 10, crouch: 0.7, air: 0.8, r: 120, dmg: 25, lift: 90 },
    ITEM_CURS: [['KRW', 'JPY'], ['MXN', 'SEK'], ['PLN', 'NZD'], ['CAD', 'USD'], ['EUR', 'CHF'], ['GBP', 'CNY']],
  };

  // 전장: room.webp(1280×720)를 기준 화면 높이 390에 맞춘 좌표. 바닥은 벽 안쪽
  const FIELD = { W: 1280 * 390 / 720, H: 390 };
  FIELD.floor = { x0: 50, y0: 52, x1: FIELD.W - 50, y1: FIELD.H - 42 };
  FIELD.doors = [
    { x: FIELD.W / 2, y: 30, dx: 0, dy: 1 },            // 위
    { x: FIELD.W - 30, y: FIELD.H / 2, dx: -1, dy: 0 }, // 오른쪽
    { x: FIELD.W / 2, y: FIELD.H - 22, dx: 0, dy: -1 }, // 아래
    { x: 30, y: FIELD.H / 2, dx: 1, dy: 0 },            // 왼쪽
  ];

  window.DATA = { COUNTRIES, SKILLS, SKILLS2, SKILL_MOD, SKILL_COL, CURRENCY_ORDER, CURRENCY_MUL, CURRENCY_SYM, BAL, TEMP, FIELD };
})();
