// 번역 문구 — teams/1-기획/texts.md 기준. 1차는 한국어·영어만 있어요.
// 아직 번역이 없는 언어는 영어로 보여 줘요 (번역이 오면 여기에 언어를 더해요).
(() => {
  const T = {
    en: {
      'title': 'A World Where Only the Strong Survive',
      'ui.01': 'Start', 'ui.02': 'Choose a Country', 'ui.03': 'Round {n}', 'ui.04': 'Aliens left: {n}',
      'ui.05': 'Restart', 'ui.06': 'Watch an ad to continue', 'ui.07': 'Bankrupt',
      'ui.08': 'GDP per capita (PPP) · OECD 2024', 'ui.09': 'Settings', 'ui.10': 'Language',
      'round.clear.1': 'Perfect! The world is truly beautiful!', 'round.clear.2': 'You can do anything!',
      'end.unfair': '…But life isn\'t fair.',
      'end.after.01': 'That was easy. Try a harder country next time.',
      'end.after.02': 'Congrats. You picked a good country. That\'s not skill, though.',
      'end.after.03': 'Some countries can\'t even reach Round 3 on the same map. Want to try?',
      'end.after.04': 'Well done. You had a good starting line.',
      'end.after.05': 'Try a country with less money next. Same aliens.',
      'end.after.06': 'Easy, right? It isn\'t easy for everyone.',
      'end.after.07': 'Can you clear it with a country that has less money? See for yourself.',
      'end.after.08': 'Was it you, or was it your country\'s wealth?',
      'end.after.09': 'Same game, so why is it harder for other countries? Pick one and find out.',
      'end.after.10': 'You won. It just wasn\'t fair.',
      'bankrupt.first.01': 'Ah… a world where only the privileged get ahead.',
      'bankrupt.first.02': 'I worked so hard… and still no money.',
      'bankrupt.first.03': 'The starting line was different from the start.',
      'bankrupt.first.04': 'Those who have get more; those who don\'t, get less.',
      'bankrupt.first.05': 'Some things effort alone can\'t fix.',
      'bankrupt.first.06': 'With a richer country, I\'d have cleared it by now.',
      'bankrupt.first.07': 'That\'s just how the world is.',
      'bankrupt.first.08': 'Same aliens… so why is it only hard for me?',
      'bankrupt.first.09': 'No money, no hero.',
      'bankrupt.first.10': 'Life really isn\'t fair.',
      'bankrupt.again.01': 'Another ad?',
      'bankrupt.again.02': 'Watching ads won\'t make you rich.',
      'bankrupt.again.03': 'Your bank balance hasn\'t changed.',
      'continue.ad': 'Think this will make money appear out of nowhere?',
      'skill.shout': '{country}! Hold on!',
      'skill.name.01': 'Lion Crest Charge', 'skill.name.02': 'Whirlwind Axe', 'skill.name.03': 'Pike Wall', 'skill.name.04': 'Energy Barrage', 'skill.name.05': 'Flurry Thrust', 'skill.name.06': 'Shield Wall', 'skill.name.07': 'Cavalry Charge', 'skill.name.08': 'Boomerang Throw', 'skill.name.09': 'Greatsword Spin', 'skill.name.10': 'Charge Formation', 'skill.name.11': 'Axe Toss', 'skill.name.12': 'Snowfield Dash', 'skill.name.13': 'Saber Sweep', 'skill.name.14': 'Tortoise Formation', 'skill.name.15': 'Arrow Rain', 'skill.name.16': 'Single Flash', 'skill.name.17': 'Shield Fort', 'skill.name.18': 'Sling Volley', 'skill.name.19': 'Mounted Lance Charge', 'skill.name.20': 'Silver Fern Ward', 'skill.name.21': 'Quickdraw Dash', 'skill.name.22': 'Sailing Wind', 'skill.name.23': 'Winged Cavalry Charge', 'skill.name.24': 'Saber Combo', 'skill.name.25': 'Mountain Axe Slam', 'skill.name.26': 'Shield Bash', 'skill.name.27': 'Scimitar Spin', 'skill.name.28': 'Mountain Gale', 'skill.name.29': 'Eagle Strike', 'skill.name.30': 'Battle Cry',
      // ↓ texts.md에 없는 글자 [개발팀 임시 · 기획팀에 추가 요청]
      'x.clear': 'Clear!', 'x.fail': 'Mission over', 'x.roundClear': 'Round {n} clear',
      'x.nextRound': 'Next round', 'x.here': 'Right here', 'x.resume': 'Resume', 'x.exit': 'Quit', 'x.quit': 'Quit',
      'x.sound': 'Sound', 'x.keys': 'WASD move · Click/J strike · Right-click/K throw · Right ×2/L skill 1 · Left ×2/; skill 2 · Both/Space guard · ESC pause',
      'x.loading': 'Loading…', 'x.rotate': '',
    },
    ko: {
      'title': '강한 놈만 살아남는 세상',
      'ui.01': '시작', 'ui.02': '나라 고르기', 'ui.03': '라운드 {n}', 'ui.04': '남은 외계인 {n}',
      'ui.05': '다시하기', 'ui.06': '광고 보고 이어하기', 'ui.07': '파산',
      'ui.08': '1인당 GDP(PPP) · OECD 2024', 'ui.09': '설정', 'ui.10': 'Language',
      'round.clear.1': '완벽해요! 세상은 정말 아름다워요!', 'round.clear.2': '당신은 뭐든 할 수 있어요!',
      'end.unfair': '…하지만 인생은 불공평해요.',
      'end.after.01': '쉽게 깼네요. 이번엔 어려운 나라로 해 보세요.',
      'end.after.02': '축하해요. 좋은 나라를 골랐네요. 그게 실력은 아니지만요.',
      'end.after.03': '어떤 나라는 같은 맵에서 3라운드도 못 가요. 한번 해 볼래요?',
      'end.after.04': '잘했어요. 출발선이 좋았으니까요.',
      'end.after.05': '이번엔 돈이 적은 나라로 해 보세요. 같은 외계인이에요.',
      'end.after.06': '쉬웠죠? 모두에게 쉬운 건 아니에요.',
      'end.after.07': '돈이 적은 나라로도 깰 수 있을까요? 직접 확인해 보세요.',
      'end.after.08': '당신이 잘한 걸까요, 나라가 잘산 걸까요?',
      'end.after.09': '같은 게임인데 다른 나라는 왜 어려울까요? 골라 보면 알아요.',
      'end.after.10': '이긴 건 맞아요. 공평했던 건 아니고요.',
      'bankrupt.first.01': '아… 잘난 사람들만 잘나가는 세상.',
      'bankrupt.first.02': '열심히 했는데… 돈이 없네.',
      'bankrupt.first.03': '출발선부터 달랐던 거야.',
      'bankrupt.first.04': '가진 사람은 더 가지고, 없는 사람은 더 없고.',
      'bankrupt.first.05': '노력만으론 안 되는 게 있더라.',
      'bankrupt.first.06': '돈이 많은 나라였으면 지금쯤 깼겠지?',
      'bankrupt.first.07': '세상은 원래 이런 거야.',
      'bankrupt.first.08': '같은 외계인인데… 왜 나만 힘들어?',
      'bankrupt.first.09': '돈 없으면 영웅도 못 해.',
      'bankrupt.first.10': '역시 인생은 공평하지 않아.',
      'bankrupt.again.01': '또 광고 보게?',
      'bankrupt.again.02': '광고 본다고 부자 되는 거 아니에요.',
      'bankrupt.again.03': '통장은 그대로예요.',
      'continue.ad': '이런다고 없던 돈이 생길까?',
      'skill.shout': '{country}! 버텨!',
      'skill.name.01': '사자 문장 돌격', 'skill.name.02': '회오리 도끼', 'skill.name.03': '창벽', 'skill.name.04': '에너지 난사', 'skill.name.05': '연속 찌르기', 'skill.name.06': '방패벽', 'skill.name.07': '기병 돌격', 'skill.name.08': '부메랑 투척', 'skill.name.09': '대검 회전베기', 'skill.name.10': '돌격 대형', 'skill.name.11': '도끼 던지기', 'skill.name.12': '설원 질주', 'skill.name.13': '기병검 휩쓸기', 'skill.name.14': '거북 대형', 'skill.name.15': '화살비', 'skill.name.16': '일섬', 'skill.name.17': '방패 진지', 'skill.name.18': '투석 연사', 'skill.name.19': '기마 창돌격', 'skill.name.20': '은빛 고사리 결계', 'skill.name.21': '발도술 돌진', 'skill.name.22': '항해의 바람', 'skill.name.23': '날개 기병 돌격', 'skill.name.24': '사브르 연격', 'skill.name.25': '산악 도끼 내려찍기', 'skill.name.26': '방패 밀치기', 'skill.name.27': '곡도 회전베기', 'skill.name.28': '산바람', 'skill.name.29': '독수리 일격', 'skill.name.30': '함성',
      'x.clear': '클리어!', 'x.fail': '작전 종료', 'x.roundClear': '라운드 {n} 클리어',
      'x.nextRound': '다음 라운드', 'x.here': '그 자리에서', 'x.resume': '계속', 'x.exit': '나가기', 'x.quit': '종료',
      'x.sound': '소리', 'x.keys': 'WASD 이동 · 클릭/J 치기 · 우클릭/K 쏘기 · 우클릭 두 번/L 스킬1 · 클릭 두 번/; 스킬2 · 양쪽 동시/Space 무적 · ESC 일시정지',
      'x.loading': '불러오는 중…', 'x.rotate': '',
    },
  };

  // 설정 Language 목록 20개 (자기 표기). 번역이 아직 없는 언어는 고르면 글자가 영어로 나와요.
  const LANG_NAMES = { en: 'English', fr: 'Français', de: 'Deutsch', nl: 'Nederlands', da: 'Dansk', sv: 'Svenska',
    fi: 'Suomi', it: 'Italiano', ko: '한국어', es: 'Español', cs: 'Čeština', he: 'עברית', lt: 'Lietuvių', ja: '日本語',
    pt: 'Português', pl: 'Polski', hu: 'Magyar', sk: 'Slovenčina', el: 'Ελληνικά', tr: 'Türkçe' };

  const has = l => !!T[l];
  const I18N = {
    lang: 'en',
    LANG_NAMES,
    available: () => Object.keys(LANG_NAMES),
    translated: has,
    set(l) { this.lang = LANG_NAMES[l] ? l : 'en'; },
    t(key, vars) {
      let s = (T[this.lang] && T[this.lang][key]) ?? T.en[key] ?? key;
      if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
      return s;
    },
    // 나라 이름: 그 나라 말을 쓰는 중이면 그 나라 표기, 아니면 지금 언어 표기
    countryName(c) { return this.lang === c.lang ? c.native : this.lang === 'ko' ? c.ko : c.en; },
    deviceLang() {
      const l = ((navigator.languages && navigator.languages[0]) || navigator.language || 'en').slice(0, 2).toLowerCase();
      return LANG_NAMES[l] ? l : 'en';
    },
  };
  window.I18N = I18N;
})();
