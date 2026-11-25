# 사이트별 제출 요구사항

> 각 사이트 개발자 포털에서 확인한 내용만 적어요. 확인 안 된 칸은 "확인 안 됨"으로 둬요.
> **확인 날짜: 2026-11-25** · 확인 방법: 출처 페이지를 직접 내려받아 원문 문구 대조 (Claude). 정책은 바뀌니 제출 직전에 다시 확인해요.

## 요약 표

| 항목 | Poki | CrazyGames | GameDistribution | itch.io |
|---|---|---|---|---|
| 개발자 포털 | developers.poki.com | docs.crazygames.com · developer.crazygames.com | gamedistribution.com/developers | itch.io/dashboard |
| 계정 상태 | | | | |
| **콘텐츠 정책** | 괴롭힘·학대·**고정관념**·성차별은 범위 밖. "Wholesome and inclusive" 가족 친화. IP 도용·성인 테마는 즉시 거절. 실제 국가·국기 조항은 **확인 안 됨** [P1] | PEGI 12 준수. "inappropriate themes" 거절 사유. 타인의 "rights and dignity" 존중. 실제 국가·국기 조항은 **확인 안 됨** [C1][C2][C5] | **정치(politics)**·차별·편견 콘텐츠 금지. 남의 상표 사용 금지. 실제 국가·국기 조항은 **확인 안 됨** [G2][G3] | 차별·혐오(hate speech) 콘텐츠 금지, 예고 없이 삭제 가능. 실제 국가·국기 조항은 **확인 안 됨** [I3] |
| **가로 화면·두 손 조작** | 모바일은 세로나 가로, 둘 다 중 하나로 화면을 꽉 채워요 (가로만 가능). 태블릿은 모바일 조작으로. 키보드 게임은 **ESC나 스페이스로 일시정지** 필수. 두 손 조작 규칙은 확인 안 됨 [P2] | 지원 방향은 제출할 때 지정. 데스크톱에선 가로로 플레이 가능해야 해요. 마우스·키보드·터치 모두 지원. 모바일 조작 표시는 터치 감지 말고 SDK `device.type`으로 판단. 두 손 조작 규칙은 확인 안 됨 [C3] | 모바일은 선택(강력 권장, 노출 우선). 방향 고정 또는 "기기를 돌리세요" 화면. 터치 친화 조작. 데스크톱 플레이 필수 [G1] | 임베드 설정의 "Mobile Friendly" 체크. 폰에선 전체화면으로 열리고 화면 비율에 따라 방향 고정(2017 공지). 터치 규칙은 확인 안 됨 [I1][I5] |
| **다국어** | `PokiSDK.getLanguage()`로 첫 언어를 정하고, **플레이어가 직접 바꿀 수 있게**. 언어 등록 방식·영어 필수 여부는 확인 안 됨 [P3] | **영어 필수**("Missing English-language support"는 거절 사유). SDK locale을 따르고 없으면 영어로 [C1][C2] | **영어 필수**. 브라우저 언어 감지 또는 시작 전 언어 선택. 등록할 때 해당 언어 모두 선택 [G1][G2][G3] | 실제 번역한 언어만 고르기. 잘못 고르면 검색에서 빠질 수 있어요 [I2] |
| 썸네일 크기·개수 | 정사각 628×628 이상(글자·테두리 없이, #83FFE7 색 피하기) + 움직이는 썸네일 mp4 1080×1080 이상, 4~6초, 소리 없음, 100MB 이하 [P4][P5] | 커버 3장: 1920×1080 · 800×1200 · 800×800 (제목 말고 글자 없음) + 미리보기 영상 15~20초, 50MB 이하, 가로·세로 [C4] | JPG 512×384 · 512×512 · 200×120 필수 (1280×720 · 1280×550 권장), 둥근 모서리 금지 [G2] | 커버 315:250 비율, 630×500 권장. 스크린샷 3~5장 [I4] |
| 제목 글자 수 | 확인 안 됨 | 확인 안 됨 | 20자 이하 권장, 40자 넘으면 안 됨 [G2] | 확인 안 됨 |
| 설명 글자 수·언어 | 확인 안 됨 | 확인 안 됨 | 문서끼리 달라요: 100~500단어 [G2] / 설명·조작법 각 200~500자 [G1] | 확인 안 됨 |
| 태그·카테고리 | 확인 안 됨 | 확인 안 됨 | 장르 최대 2개 + 태그 최대 5개, 연령대 필수 [G1] | 장르 1개 + 태그 최대 10개 [I4] |
| ZIP 용량 제한 | 수치 제한은 확인 안 됨. 10초 안에 로딩되게, 외부 요청 금지 [P2] | 첫 다운로드 50MB 이하(모바일 홈은 20MB), 전체 250MB, 파일 1,500개 [C3] | 확인 안 됨 | 압축 풀어 500MB, 한 파일 200MB, 파일 1,000개 [I1] |
| 독점·선공개 조건 | 기본은 **웹 독점**(다른 웹사이트·Discord·YouTube Playables에 못 올림, Steam·앱스토어는 가능), 기본 5년. 비독점은 1회 고정금만 받고 수익 배분 없음 [P6] | 선택. 정식 출시 후 2개월 동안 웹에서 CrazyGames에만 올리면 보상 +50% [C5] | 비독점. 다른 곳과 같은 최신 버전을 유지해야 해요 [G3] | 확인 안 됨 |
| 수익 배분 | 계약서마다 달라요 (확인 안 됨) [P6] | 비율 공개 안 됨. 트래픽·광고 성과로 매월 정산. 기본 출시(Basic Launch)는 광고·수익 없음 [C5][C6] | 순수익의 33%, 100유로부터 지급 [G3] | 기본 10% (0~100% 조절 가능) [I6] |
| **광고 규칙** | 광고 타이머 직접 만들기 금지, `commercialBreak()`는 게임으로 돌아갈 때만. 보상형 버튼 옆에 **같은 크기 이상의 무료 이어하기 버튼**이 항상 함께 있어야 해요. 보상형 버튼은 초록색 금지, 🎬 아이콘 필수. **광고를 봐야만 진행할 수 있으면 심사 불통과** [P2][P7] | 플레이 중 광고 금지, 중간 광고는 3분에 1번까지(SDK가 조절). **판 사이 광고와 "이어하기 보상형"을 같은 때 함께 내면 안 돼요.** 보상형은 너무 자주 금지, 광고 연속 금지. **보상형 광고로만 깰 수 있는 레벨은 허용 안 됨**. 광고 차단기가 있어도 정상 플레이 [C6] | 프리롤·미드롤 필수, 보상형은 선택. 광고 중 일시정지·음소거, 플레이어 입력 후 재개. 보상은 시청을 끝까지 마쳤을 때만 [G1][G4] | 광고 없는 게임을 선호하지만 금지는 아님. 플레이를 막는 광고는 피하기. 애드웨어 금지 [I2] |
| 확인 날짜 / 출처 | 2026-11-25 · P1~P7 | 2026-11-25 · C1~C6 | 2026-11-25 · G1~G4 | 2026-11-25 · I1~I6 |

## 우리 게임에 걸리는 점 (기획팀 확인 필요)

| # | 걸리는 점 | 사이트 | 원문 |
|---|---|---|---|
| 1 | "고른 나라 언어로만 플레이"는 **영어 필수** 조건에 걸려요 | CrazyGames, GameDistribution | "The game must have English localization" [C1] · "Providing an English version of the game is mandatory" [G2] |
| 2 | 첫 언어는 기기 언어를 따르고 **플레이어가 바꿀 수 있어야** 해요 | Poki (CrazyGames·GD도 비슷) | "Use the detected language as the initial default, but let the player's manual choice override it" [P3] |
| 3 | 실제 경제력 순위로 약한 나라·깰 수 없는 나라를 정하는 설정, 파산 문구("잘난 사람들만 잘나가는 세상" 등)는 정치·고정관념·존엄 조항에 걸릴 수 있어요 (국가·국기 자체를 금지하는 조항은 4곳 모두 없음) | 4곳 모두 | Poki "stereotypes" [P1] · GD "politics" [G2] · CG "dignity of others" [C5] · itch "discriminatory content" [I3] |
| 4 | **가난한 나라가 파산 이어하기 광고로만 앞으로 갈 수 있으면** 심사에서 떨어질 수 있어요. 무제한 반복도 "너무 자주"에 걸려요 | Poki, CrazyGames | "If a player has to watch an ad to progress, it isn't a reward, and it won't pass review" [P7] · "levels that can only be completed by a rewarded ad are not acceptable" · "Do not offer a rewarded ad too often" [C6] |
| 5 | 판 사이 광고와 보상형 이어하기를 같은 때 내면 안 돼요 | CrazyGames | "It's not allowed to combine a midgame ad between levels with a rewarded to keep playing the current level" [C6] |
| 6 | 보상형 버튼 옆에 무료 이어하기 버튼이 항상 있어야 해요 (보상형 버튼은 초록색 금지) | Poki | "there must always be a standard continue button as an alternative to a 🎬 rewarded one" [P2] |
| 7 | PC 조작(WASD+J/K)에 ESC나 스페이스 일시정지를 넣어야 해요 | Poki | "for keyboard-controlled games, implement ESC or spacebar for pause/resume" [P2] |
| 8 | Poki 웹 독점이면 CrazyGames·GD에 못 올려요 → 사이트 확정 때 먼저 정해요 | Poki | "on the open web, your game is published only on Poki" [P6] |

## 출처 (모두 2026-11-25 확인)

- **P1** https://developers.poki.com/guide/content-player-safety
- **P2** https://developers.poki.com/guide/requirements-quality
- **P3** https://developers.poki.com/guide/localization
- **P4** https://developers.poki.com/guide/game-thumbnail
- **P5** https://developers.poki.com/guide/your-game-page
- **P6** https://developers.poki.com/guide/revenue-deal-types
- **P7** https://developers.poki.com/guide/how-monetization-works
- **C1** https://docs.crazygames.com/requirements/gameplay/
- **C2** https://docs.crazygames.com/faq/
- **C3** https://docs.crazygames.com/requirements/technical/
- **C4** https://docs.crazygames.com/requirements/game-covers/
- **C5** https://files.crazygames.com/documents/developer_terms_20250818.pdf (개발자 약관, 2025-08-18판)
- **C6** https://docs.crazygames.com/requirements/ads/
- **G1** https://static.gamedistribution.com/developer/developers-guidelines.html
- **G2** https://gamedistribution.com/developers/quality-guidelines
- **G3** https://static.gamedistribution.com/terms/developer.html (개발자 약관, 2025-06-19판)
- **G4** https://github.com/GameDistribution/GD-HTML5/wiki (Rewarded-Ads, SDK-Implementation)
- **I1** https://itch.io/docs/creators/html5
- **I2** https://itch.io/docs/creators/quality-guidelines
- **I3** https://itch.io/docs/legal/terms
- **I4** https://itch.io/docs/creators/getting-started
- **I5** https://itch.io/updates/better-support-for-mobile-html-games-more (2017 공지)
- **I6** https://itch.io/docs/creators/payments

> 원문 대조 메모: Claude가 출처 페이지에서 직접 원문을 맞춰 본 것 — "걸리는 점" 표의 원문(CG "dignity of others"[C5 PDF]만 빼고), 영어 필수(C1·C2·G2·G3), 언어 변경(P3), 독점(P6·G3), GD 33%(G3), itch 언어·광고·차별(I2·I3). 나머지(썸네일 크기·용량·CG 약관·itch 수익 배분 등)는 조사 담당이 공식 페이지에서 읽은 내용이라 제출 직전에 한 번 더 확인해요.
