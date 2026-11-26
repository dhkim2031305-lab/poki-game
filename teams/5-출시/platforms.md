# 사이트별 제출 요구사항

> 각 사이트 개발자 포털에서 확인한 내용만 적어요. 확인 안 된 칸은 "확인 안 됨"으로 둬요.
> **확인 날짜: 2026-11-25** · 확인 방법: 출처 페이지를 직접 내려받아 원문 문구 대조 (Claude). 정책은 바뀌니 제출 직전에 다시 확인해요.

## 대상 사이트 (사용자 결정 2026-11-25, GDD 0-6)
- **CrazyGames · GameDistribution · itch.io** (+ 독점 조건 없는 곳) · 휴대폰 앱(앱스토어·구글 플레이)은 `app-stores.md` (2026-11-26 사용자 요청)
- **Poki: 웹 독점 계약은 안 해요.** 비독점 길은 있어요: "For games already live on other web platforms, or with a more niche or short-term fit for our audience, we can offer a one-time flat license fee instead, with no revenue share." [P6] → 한 번만 받는 고정 라이선스비, 수익 배분 없음. Poki가 게임을 보고 제안할 때만 가능해요.
- **CrazyGames 2개월 독점(+50%)은 안 해요** (사용자 확정 2026-11-26 · 다른 웹사이트에도 올리니까). [C5]

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
| 독점·선공개 조건 | (우리는 안 함) 기본은 **웹 독점**(다른 웹사이트·Discord·YouTube Playables에 못 올림, Steam·앱스토어는 가능), 기본 5년. 비독점은 1회 고정금만 받고 수익 배분 없음 [P6] | 선택. 정식 출시 후 2개월 동안 웹에서 CrazyGames에만 올리면 보상 +50% [C5] | 비독점. 다른 곳과 같은 최신 버전을 유지해야 해요 [G3] | 확인 안 됨 |
| 수익 배분 | 계약서마다 달라요 (확인 안 됨) [P6] | 비율 공개 안 됨. 트래픽·광고 성과로 매월 정산. 기본 출시(Basic Launch)는 광고·수익 없음 [C5][C6] | 순수익의 33%, 100유로부터 지급 [G3] | 기본 10% (0~100% 조절 가능) [I6] |
| **광고 규칙** | 광고 타이머 직접 만들기 금지, `commercialBreak()`는 게임으로 돌아갈 때만. 보상형 버튼 옆에 **같은 크기 이상의 무료 이어하기 버튼**이 항상 함께 있어야 해요. 보상형 버튼은 초록색 금지, 🎬 아이콘 필수. **광고를 봐야만 진행할 수 있으면 심사 불통과** [P2][P7] | 플레이 중 광고 금지, 중간 광고는 3분에 1번까지(SDK가 조절). **판 사이 광고와 "이어하기 보상형"을 같은 때 함께 내면 안 돼요.** 보상형은 너무 자주 금지, 광고 연속 금지. **보상형 광고로만 깰 수 있는 레벨은 허용 안 됨**. 광고 차단기가 있어도 정상 플레이 [C6] | 프리롤·미드롤 필수, 보상형은 선택. 광고 중 일시정지·음소거, 플레이어 입력 후 재개. 보상은 시청을 끝까지 마쳤을 때만 [G1][G4] | 광고 없는 게임을 선호하지만 금지는 아님. 플레이를 막는 광고는 피하기. 애드웨어 금지 [I2] |
| 확인 날짜 / 출처 | 2026-11-25 · P1~P7 | 2026-11-25 · C1~C6 | 2026-11-25 · G1~G4 | 2026-11-25 · I1~I6 |

## 심사 위험 → 우리 대응 (2026-11-26 갱신)

| # | 심사 위험 | 사이트 | 우리 대응 | 맡은 팀 | 상태 |
|---|---|---|---|---|---|
| 1 | 영어 필수 | CG · GD | 설정 맨 위 "Language"(지구본)에서 영어로 바꿔요 · 영어 문구 99줄 있음 (GDD 0-6, texts.md) | 기획 ✅ · 개발 ✅ | 해결 |
| 2 | 기본 언어: GD "the default game language should always be English" [G1 4.1] · CG는 SDK locale, 없으면 영어 | GD · CG | 지금은 고른 나라 언어가 기본이에요. **나라 고르기 전 화면(시작·나라 고르기)을 영어로** 보여 주면 맞출 수 있어요 [제안] | 기획 | 👀 사용자 원문 "기본 영어로 출시"(2026-11-26) → 첫 화면만인지 게임 전체인지 기획팀이 확인 |
| 3 | 번역: 실제 번역한 언어만 등록 | itch.io · GD | 지금 번역은 한국어·영어뿐(`src/i18n.js`) → **사용자 결정(2026-11-26): 18개 언어 번역을 마친 뒤 출시** · 등록은 번역 끝난 20개 | 기획 · 개발 | 번역 대기 |
| 4 | 실제 경제 순위로 약한 나라·못 깨는 나라 → 정치(GD "Political bias")·고정관념(Poki)·존엄(CG)·차별(itch) | 4곳 모두 | 적은 외계인 · 모든 장수 똑같이 멋있게 · 문구는 구조(출발선·돈)만 말하고 나라 탓 안 함(GDD 0-7) · 능력치 숨김(0-13) · 스토어 설명은 중립, 출처 표기 | 기획 · 디자인 · 출시 | 대응 중 |
| 5 | 파산·엔딩 문구가 사회 메시지로 읽힘 | GD 위험 큼 | 사용자 문구 유지. 지적받으면 그 사이트 빌드만 문구 바꾸는 안 | 기획 | ⚠️ 위험 알고 유지 |
| 6 | 보상형으로만 진행 | CG "levels that can only be completed by a rewarded ad are not acceptable" · Poki "If a player has to watch an ad to progress… won't pass review" | 파산 이어하기는 **광고로 다음 라운드를 더 할 뿐, 광고로 클리어는 안 돼요**(파산 이어하기로 6라운드를 깨도 또 파산, 개발 해석). 실패·파산 화면에 광고 없는 "다시하기"(1라운드부터 처음 다시)가 같은 크기로 항상 있어요 (monetization.md) | 기획 ✅ | ⚠️ 위험 알고 유지 (조항 문구와 정확히 같진 않지만 심사자 판단) |
| 7 | 보상형을 너무 자주 (무제한 파산 이어하기) | CG "Do not offer a rewarded ad too often" | 사용자 결정으로 무제한 유지. 한 판 횟수 제한 수치는 **어느 사이트 문서에도 없어요** | 기획 | ⚠️ 위험 알고 유지 |
| 8 | 판 사이 광고와 이어하기 보상형을 같은 때 | CG | 판 사이 광고는 클리어 화면 다시하기에서만, 보상형 본 판은 다음 판 사이 광고 건너뜀 (monetization.md) | 기획 ✅ · 개발 ✅ | QA 확인 |
| 9 | 플레이 중 광고 금지 · 광고 중 소리·입력 멈춤 · 보상은 끝까지 봤을 때만 · 광고 차단기에도 정상 플레이 | CG · GD | monetization.md · 개발 회귀 테스트 ads2 | 개발 ✅ | QA 확인 |
| 10 | 게임 안 전체화면 버튼 | CG **금지** | **우리 버튼은 안 넣어요** (사용자 "아니 놔둬", 2026-11-26) · 사이트 전체화면 사용 (`fullscreen.md`) | 개발 | 해결 |
| 11 | 가로 고정 또는 "돌리세요" 화면 | GD 필수 · CG는 사이트가 처리 | 개발 테스트에 `portrait` 있음 → 세로일 때 안내 화면 확인 | 개발 · QA | QA 확인 |
| 12 | PC 일시정지 | Poki (대상 아님) | Esc 일시정지 (GDD 0-14) | 개발 ✅ | 해결 |
| 13 | 첫 다운로드 50MB(모바일 홈 20MB) | CG | 지금 ZIP 약 9.4MB, 파일 275개 (2026-11-26 빌드) | 개발 | 통과 |
| 14 | 제목 20자 권장, 40자 금지 | GD | 37자 → 허용, 두 줄로 보여요 | 출시 | 참고 |
| 15 | 다른 사이트와 같은 최신 버전 | GD | 모든 사이트(앱 포함) 같은 버전으로 올리고 `release-log.md`에 기록 | 출시 | 운영 규칙 |
| 16 | 플레이를 막는 광고 | itch.io | `web` 빌드는 광고 없음 | 개발 ✅ | 해결 |
| 17 | 실제 국가·국기 | 4곳 | **금지 조항 없음**(4곳 모두 확인). 국기는 `src/assets/flag/`(SVG, MIT) 정확한 것 사용 | 디자인 ✅ | 해결 |

## 기획팀이 물은 것 — 답 모음 (2026-11-26)
| 물은 것 | 답 | 근거 |
|---|---|---|
| 파산 때 보상형 무제한 이어하기가 정책에 맞나요? | **한 판 횟수 제한 수치는 어느 사이트에도 없어요.** 다만 CrazyGames는 "too often" 금지와 "보상형으로만 깰 수 있는 레벨" 금지, Poki는 "광고를 봐야만 진행" 불통과가 있어요. 우리는 광고로 클리어가 안 되고 무료 다시하기가 있어서 조항에 정확히 걸리진 않지만, **심사자가 반복 유도로 볼 위험**이 남아요. GD는 보상형 자체가 선택이고 횟수 규칙 없음. | [C6] [P7] [G4] |
| 실제 국가(OECD 30개)·국기 | 4곳 모두 실제 국가·국기를 막는 조항은 없어요. 대신 정치·고정관념·차별 조항에 걸리지 않게 위 4·5번으로 대응해요. | [P1] [C5] [G1] [G2] [I3] |
| 다국어 20개 | 사이트는 언어 수 제한이 없어요. **영어는 필수**(CG·GD), 기기 언어 반영 권장, **번역한 언어만 등록**(itch·GD). 지금은 한국어·영어만 번역돼 있어요. | [C1] [G1] [G2] [I2] |
| 가로 화면·두 손 조작 | 4곳 모두 가로 가능. 두 손 조작 전용 규칙은 없어요. CG는 터치·마우스·키보드 모두 지원, 모바일 조작은 SDK 기기 정보로 판단. | [C3] [G1] [P2] [I1] |
| 전체화면 | `fullscreen.md` 참고 — CG는 게임 안 버튼 금지, 아이폰은 요소 전체화면 불가 | [C1] MDN |

> 앞서(2026-11-25) 적었던 "우리 게임에 걸리는 점" 8개는 위 표로 합쳤어요.

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
- **MDN** https://developer.mozilla.org/docs/Web/API/Element/requestFullscreen (호환성 데이터 `@mdn/browser-compat-data` 8.1.10)

> 원문 대조 메모: Claude가 출처 페이지에서 직접 원문을 맞춰 본 것 — "걸리는 점" 표의 원문(CG "dignity of others"[C5 PDF]만 빼고, GD "Political bias"[G1]는 2026-11-25 추가 확인), 영어 필수(C1·C2·G2·G3), 언어 변경(P3), 독점(P6·G3), GD 33%(G3), itch 언어·광고·차별(I2·I3). 나머지(썸네일 크기·용량·CG 약관·itch 수익 배분 등)는 조사 담당이 공식 페이지에서 읽은 내용이라 제출 직전에 한 번 더 확인해요.
