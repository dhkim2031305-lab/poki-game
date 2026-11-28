# 한국판 시험 공개 (itch.io 링크 공개) + WebGL 필수 규정 확인 — 2026-11-28

> 요청: 팀장 (사용자 "관객 반응 보게 한국을 먼저 완성" · 개발 세션 "3d로만 게임 진행할꺼니까 2d는 없애버리세요")
> 확인 방법: 출처 페이지를 직접 내려받아 원문 대조 (Claude). 업로드는 사용자가 직접 해요.

## ① WebGL 필수(2D 없앰) — 사이트 규정

| 사이트 | WebGL 필수가 문제인가 | 저사양 대응 요구 (원문) | 근거 |
|---|---|---|---|
| CrazyGames | WebGL 금지·필수 조항 없음 | "The game must load quickly and play seamlessly without errors or crashes" · (Unity 게임 한정) "For iOS devices and low memory Android devices, we choose DPR value of 1 because these devices crash with higher natively supported DPR" → 저사양에서 해상도 배율을 낮추는 걸 사이트도 하고 있어요 | [C1] [C3] |
| GameDistribution | 문제없음. "Games must be built using engines such as Unity WebGL, Javascript, or Construct 2 & 3" | "The game must be playable on desktop, ensuring smooth performance on popular browsers such as Google Chrome, Firefox and Safari" → **사파리 포함 세 브라우저에서 부드럽게** | [G1] 3.1 · 3.2 |
| itch.io | 조항 없음 | HTML5 게임도 "many of the same performance optimization recommendations still apply" (권장) | [I1] |
| Poki (참고) | 조항 없음 | "Small file size… loading takes more than 10 seconds" | [P2] |

### 결론
- **WebGL 필수 자체는 어느 사이트도 막지 않아요.**
- 다만 심사는 "오류·멈춤 없이 부드럽게"를 봐요. WebGL이 안 되는 기기에서 **안내 화면만 나오면, 심사자 기기에서 그 화면이 뜰 때 반려**될 수 있어요. → 안내 화면은 "게임이 안 돌아가는 이유 + 해결(브라우저 업데이트·하드웨어 가속 켜기)"을 짧게, 그 나라 언어로 [제안].
- 저사양 대응은 요구가 아니라 품질 문제예요. 개발팀의 "느리면 그림자 끄기" 자동 낮춤과 **해상도 배율(DPR) 낮추기**를 같이 쓰면 안전해요 [제안 → 개발].
- QA: **사파리(맥·아이폰)·파이어폭스·크롬** 세 브라우저 확인을 체크리스트에 넣어요 (GameDistribution 3.2).

## ② itch.io 시험판 (링크로만 공개)

### 공개 방식 — 공식 문서 기준
| 방식 | 뜻 (원문) | 시험판에 맞나 |
|---|---|---|
| Draft | "only accessible by people who can edit it, and people with the secret link" · 단 "We don't recommend distributing your project in draft mode" | ❌ 배포용 아님 |
| **Restricted + 비밀번호** (추천) | "Restricted projects will not show up on itch.io's browse pages, search results, or profile pages. They will also not be indexed by external search engines." · "Also allow a password to view page" · "You can also include the password directly in the URL so it's not required to type it in." | ✅ **비밀번호 넣은 링크 하나만 보내면 돼요.** 검색·프로필에 안 나와요 |
| Public + Unlisted | "will not show up on itch.io browse and search pages… The project will show up on your profile" | △ 프로필에는 보여요 |

출처: https://itch.io/docs/creators/access-control (2026-11-28 확인)

### 올리는 순서 (사용자가 할 일)
- [ ] 개발팀에서 한국 완성판 빌드 받기: `npm run build` → `dist/web.zip` (광고 없음, 이어하기 버튼 숨김)
- [ ] itch.io 가입 → 새 프로젝트 → 종류 HTML → `dist/web.zip` 올리고 브라우저에서 플레이하도록 표시
- [ ] 임베드: 1280×720 [제안] · **Mobile Friendly 체크** · **Fullscreen button 체크**
- [ ] 제목·설명: 아래 "설명 문구" 붙여 넣기
- [ ] 커버: `store/itch/cover-630x500.jpg` · 스크린샷: 아래 목록
- [ ] 언어: **Korean**(+ 영어가 들어 있으면 English) — 번역 안 된 언어는 고르지 않기
- [ ] 공개 설정: **Restricted** → "Also allow a password to view page" 켜고 비밀번호 정하기
- [ ] 비밀번호가 들어간 링크 복사 → 직접 폰 두 대(안드로이드·아이폰)와 PC에서 열어 보기
- [ ] 링크를 시험해 줄 사람들에게 보내기 → 받은 반응은 출시팀에 붙여 주기 (`release-log.md` 기록)

### 설명 문구 (시험판용)

**제목**: 강한 놈만 살아남는 세상 (시험판) / A World Where Only the Strong Survive (Test Build)

**한국어**
> ⚠️ 시험판이에요. 지금은 **한국**만 끝까지 다듬었어요. 다른 나라는 아직 만드는 중이라 어색할 수 있어요.
>
> 지구에 외계인이 쳐들어왔어요. 나라를 골라 그 나라 장수로 싸워요. 위에서 내려다보는 전장에 외계인이 사방에서 몰려와요.
> 돈이 곧 힘이에요. 장수의 힘은 실제 경제 자료에서 시작하고, 라운드를 깰 때마다 같은 금액이 줄어요. 같은 외계인, 같은 규칙, 다른 출발선.
>
> **조작**
> - PC: WASD 이동 · 왼쪽 클릭 치기 · 오른쪽 클릭 쏘기 · 오른쪽/왼쪽 두 번 = 스킬 1/2 (마우스 자리에) · 양쪽 동시 = 무적 2초 ("한국! 버텨!" 외침 + 방어막) · Esc 일시정지
> - 폰(가로): 왼쪽 조이스틱 또는 가고 싶은 곳 톡 · 오른쪽 큰 원을 밀면 쏘기 · 화살표 ← 치기 · ↑ 스킬 1 · → 스킬 2 · ↓ 무적 2초
> - 한국 스킬 2 "천자총통 포격": 장수가 화포에 올라타요. 이동은 WASD·왼쪽 조이스틱, 조준은 마우스·오른쪽 조이스틱으로 하고 쏴요. 타고 있는 동안은 무적이에요.
>
> **이것만 알려 주세요**
> 1. 어떤 기기·브라우저로 했나요? 끊기거나 느린 곳이 있었나요?
> 2. 조작이 어렵거나 헷갈린 곳은?
> 3. 몇 라운드까지 갔나요? 다시 하고 싶었나요?
> 4. 기분 나쁘거나 불편한 표현이 있었나요?
>
> 경제 자료: 1인당 GDP(PPP) · OECD 2024 · 이 게임은 3D(WebGL)로 돌아가요. 화면이 안 나오면 브라우저를 최신으로 바꾸거나 하드웨어 가속을 켜 주세요.

**English** (같은 내용, 영어 반응도 받을 때)
> ⚠️ Test build. Only **Korea** is fully polished for now; other countries are still in progress.
>
> Aliens have invaded Earth. Pick a country and fight as its general in a top-down arena, with aliens pouring in from all four sides. Money is power: each general's strength starts from real economic data, and every round you clear costs the same amount. Same aliens, same rules, different starting lines.
>
> Controls — PC: WASD move · left-click strike · right-click shoot · double right/left-click = skill 1/2 at the cursor · both buttons = 2s invincibility (your general shouts and raises a shield) · Esc pause. Mobile (landscape): left stick or tap to move · push the big right circle to shoot · arrows ← strike, ↑ skill 1, → skill 2, ↓ 2s invincibility. Korea's skill 2 (Cheonja Cannon Barrage): your general rides the cannon. Move with WASD or the left stick, aim with the mouse or the right stick, and fire. You are invincible while riding.
>
> Please tell us: your device and browser (any lag?), what felt confusing, how far you got and whether you wanted to play again, and anything that felt offensive or uncomfortable.
>
> Economic data: GDP per capita (PPP) · OECD 2024 · Runs on WebGL (3D). If nothing shows, update your browser or turn on hardware acceleration.

> 반전(1위만 클리어)은 시험판에서도 숨겨요 (사용자 결정 2026-11-26).

### 스크린샷 목록 (가로 1280×720, 3~5장 · itch.io 권장 3~5장 [I4])
| # | 장면 | 왜 |
|---|---|---|
| 1 | 한국 장수가 사방에서 오는 외계인과 싸우는 전투 한가운데 (스킬 이펙트 터지는 순간) | 무슨 게임인지 한눈에 |
| 2 | 보스 외계인과 맞서는 장면 | 긴장감 |
| 3 | 나라 고르기 화면 (30개국 카드) | 실제 나라를 고르는 게임이라는 점 |
| 4 | 폰 가로 화면 + 조작(왼쪽 조이스틱·오른쪽 큰 원·화살표) 보이는 장면 | 폰에서도 된다는 점 |
| 5 | 라운드 클리어 문구 화면 ("완벽해요! 세상은 정말 아름다워요!") | 분위기 |
- **찍지 않을 것**: 파산 화면·끝 화면(반전 노출), 돈 숫자가 크게 보이는 장면(순위 비교로 읽힘), 개발용 표시가 남은 화면.
- 찍는 사람: QA팀이 헤드리스 브라우저로 찍거나 [제안], 사용자가 폰·PC에서 직접.

## 출처
- **C1** https://docs.crazygames.com/requirements/gameplay/ · **C3** https://docs.crazygames.com/requirements/technical/
- **G1** https://static.gamedistribution.com/developer/developers-guidelines.html
- **I1** https://itch.io/docs/creators/html5 · **I4** https://itch.io/docs/creators/getting-started · https://itch.io/docs/creators/access-control
- **P2** https://developers.poki.com/guide/requirements-quality
