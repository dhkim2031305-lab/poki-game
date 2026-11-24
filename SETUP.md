# 웹게임 프로젝트 — 환경 구성 기록 (멀티 플랫폼)

> 이 문서는 작업할 때마다 계속 업데이트해요. 맨 아래 **작업 기록**에 날짜별로 쌓여요.

## 1. 선택한 방식

**HTML5 + 순수 JavaScript (Canvas)**, 외부 라이브러리 없음. **게임 코드 하나로 여러 사이트에 올려요.**

- 2D 한 손 아케이드라 엔진이 필요 없고, 웹게임 유저는 폰 비중이 높아 **첫 로딩 용량이 작을수록 유리**해요.
- AI(Claude·GPT)가 코드 전부를 직접 수정할 수 있어 반복 작업이 빨라요.
- 사이트마다 광고 SDK가 달라서, **게임은 공통 함수(`Platform`)만 부르고** 빌드할 때 사이트별 SDK를 끼워 넣어요.
- 현재 업로드 ZIP 크기: 사이트별 **약 4KB** (SDK는 각 사이트 CDN에서 불러와서 포함 안 됨).

## 2. 지원 사이트

| id | 사이트 | SDK | 필요한 설정 |
|---|---|---|---|
| `poki` | Poki | Poki SDK v2 | 없음 (업로드 후 Poki for Developers에서 QA) |
| `crazygames` | CrazyGames | CrazyGames SDK v3 | 없음 |
| `gamedistribution` | GameDistribution (여러 포털에 배포) | GD HTML5 SDK | `platforms.config.json`에 **gameId** 입력 |
| `web` | itch.io, 개인 사이트, 데모 | 없음 (광고 없음) | 없음 |

- 각 ZIP에는 **그 사이트 SDK 하나만** 들어가요. 사이트들은 다른 회사 광고 SDK가 섞여 있으면 심사에서 거절해요.
- 사이트마다 **독점 계약 조건**(예: 다른 곳에 먼저 올리면 안 됨)이 있을 수 있으니 올리기 전에 약관 확인하세요.

## 3. 필요한 도구

| 도구 | 용도 | 필수? |
|---|---|---|
| Node.js 18 이상 | 개발 서버(`npm run dev`), ZIP 빌드(`npm run build`) | 필수 |
| VS Code | 코드 편집 | 권장 |
| 각 사이트 개발자 계정 | 게임 등록·업로드·QA | 출시 시 필수 |

> `npm install`은 필요 없어요. 의존성 0개라 Node만 있으면 바로 돌아가요.
> (Live Server 확장은 이제 사이트별 SDK 주입을 못 해서 `npm run dev`를 쓰세요.)

## 4. 폴더 구조

```
poki-game/
├── src/                    ← 공통 게임 본체 (모든 사이트 같은 코드)
│   ├── index.html          ← 진입점. <!-- PLATFORM_SDK --> 자리에 사이트별 SDK가 들어가요
│   ├── style.css           ← 전체화면 캔버스, 스크롤/확대/길게누르기 방지
│   ├── assets/             ← 이미지·소리 (디자인팀)
│   └── game.js             ← 게임 로직 (지금은 테스트용 점프 게임). window.Platform만 사용
├── platforms/              ← 사이트별 어댑터. 빌드 때 선택된 것이 platform.js가 돼요
│   ├── poki.js
│   ├── crazygames.js
│   ├── gamedistribution.js
│   ├── web.js
│   └── README.md           ← 어댑터 공통 함수 설명, 새 사이트 추가법
├── tools/
│   ├── platforms.js        ← 사이트 등록부 (SDK 스크립트 태그 정의)
│   ├── server.js           ← 개발 서버 (localhost:8080/<사이트>/)
│   └── build.js            ← 사이트별 ZIP 만들기
├── platforms.config.json   ← 사이트별 ID 설정 (GameDistribution gameId 등)
├── backup/                 ← 멀티 플랫폼 전환 전 원본 (*.orig.*)
├── dist/                   ← 빌드 결과 (git 제외)
├── package.json            ← npm 스크립트 2개 (dev, build)
├── CLAUDE.md               ← 세션 운영 규칙 (새 세션은 이것부터 읽음)
├── STATUS.md               ← 현황판 (단계·할 일·결정·인수인계)
├── teams/                  ← 1-기획, 2-디자인, 3-개발, 4-QA (README·템플릿·작업기록)
├── .claude/agents/         ← 팀별 서브에이전트 (planner, designer, developer, qa)
└── SETUP.md                ← 이 문서 (기술 환경)
```

## 5. 명령어

```bash
npm run dev                    # http://localhost:8080 → 사이트 고르는 화면
npm run build                  # 모든 사이트 ZIP: dist/poki.zip, crazygames.zip, gamedistribution.zip, web.zip
npm run build -- poki          # 한 사이트만
npm run build -- poki web      # 여러 개
```

개발 서버 주소:
- `http://localhost:8080/poki/` — 포키 테스트 광고까지 떠요 (localhost에서 디버그 모드 자동)
- `http://localhost:8080/crazygames/`
- `http://localhost:8080/gamedistribution/`
- `http://localhost:8080/web/`

⚠️ `index.html`을 더블클릭(file://)으로 열면 동작하지 않아요. 꼭 `npm run dev`로 여세요.

## 6. 공통 함수 (`window.Platform`)

게임 코드는 어떤 사이트인지 몰라도 돼요. 아래 함수만 부르면 어댑터가 사이트에 맞게 바꿔 줘요.

| 게임 시점 | 호출 | Poki | CrazyGames | GameDistribution | web |
|---|---|---|---|---|---|
| 페이지 로드 | `Platform.init()` | `init` + 로컬 디버그 | `init` + `loadingStart` | `SDK_READY` 대기(최대 3초) | 없음 |
| 로딩 끝 | `Platform.loadingFinished()` | `gameLoadingFinished` | `loadingStop` | 없음 | 없음 |
| 플레이 시작 | `Platform.gameplayStart()` | `gameplayStart` | `gameplayStart` | 없음 | 없음 |
| 죽음/멈춤 | `Platform.gameplayStop()` | `gameplayStop` | `gameplayStop` | 없음 | 없음 |
| 판 사이 광고 | `Platform.commercialBreak(소리끄기)` | `commercialBreak` | `requestAd('midgame')` | `showAd()` | 바로 통과 |
| 보상형 광고 | `Platform.rewardedBreak(소리끄기)` → true/false | `rewardedBreak` | `requestAd('rewarded')` | `showAd('rewarded')` | 항상 false |

공통 안전장치:
- SDK가 광고 차단기 등으로 막혀도 **게임은 멈추지 않고** 광고만 건너뛰어요.
- 광고 중엔 **소리 끄고 입력 막음** (`state = 'ad'`, `muted = true`)
- 스페이스·방향키의 **페이지 스크롤 막음**, `localStorage` 막혀도 안 터지게 try/catch
- `web`에서는 보상형 광고가 항상 false → 실제 게임에선 `Platform.name === 'web'`이면 "광고 보고 이어하기" 버튼을 숨기세요.

새 사이트 추가: `platforms/<id>.js` 작성 + `tools/platforms.js`에 SDK 태그 한 항목 추가 → 끝.

## 7. 업로드 ZIP 조건 (확인됨)

- ZIP 루트 바로 아래 `index.html` ✅
- 사이트별 SDK 하나만 포함 ✅ (각 ZIP의 index.html 확인)
- Windows/Mac 어디서든 `npm run build` 동작 (zip 프로그램 불필요)
- GameDistribution은 gameId가 비어 있으면 빌드 때 ⚠ 경고가 떠요

## 8. 검증 결과 (2026-11-23)

헤드리스 크롬(390×700 폰 크기)으로 4개 사이트 모두 실제 실행: 시작 → 플레이 → 충돌 → 다시하기(광고) → 재시작.

| 사이트 | SDK 로드 | 게임 흐름 | 광고 | 비고 |
|---|---|---|---|---|
| poki | ✅ | ✅ | ✅ 테스트 광고 재생 | |
| crazygames | ✅ | ✅ | 로컬이라 광고 없이 통과 ✅ | 실제 광고는 CrazyGames QA 도구에서 확인 |
| gamedistribution | ✅ | ✅ | gameId 없어서 통과 ✅ | SDK 내부 `browsingTopics` 에러는 GD SDK 쪽 문제, 게임 영향 없음 |
| web | — | ✅ | 없음 ✅ | |

## 9. 다음 할 일

- [ ] 실제 게임 기획 확정 후 `src/game.js` 교체 (어댑터·빌드는 그대로 재사용)
- [ ] 올릴 사이트 확정 → 각 개발자 계정 만들기, 독점 조건 확인
- [ ] GameDistribution 쓰면 gameId 발급 후 `platforms.config.json`에 입력
- [ ] 에셋(이미지·소리) 추가 시 로딩 화면 + `loadingFinished` 위치 조정
- [ ] 필요하면 보상형 광고(이어하기 등) 붙이기

---

## 작업 기록

### 2026-11-23
- 방식 결정: Unity/Godot 대신 HTML5 + JS (가벼움, AI 코딩 궁합)
- 프로젝트 생성: `src/`, `tools/`, `.vscode/`, `package.json`
- 의존성 없는 개발 서버(`tools/server.js`)와 ZIP 빌더(`tools/build.js`) 작성
- 포키 SDK v2 연결 + 안전한 어댑터(`poki.js`) 작성
- 테스트용 한 손 점프 게임(`game.js`)으로 SDK 전체 흐름 검증 완료
- 게임 아이디어는 사용자가 직접 기획하기로 함 (AI 브레인스톰 취소). 기획 받는 대로 `game.js` 교체 예정
- 환경만 먼저 전달: 프로젝트 전체를 `poki-game-env.zip`으로 묶음
- **멀티 플랫폼 전환**: 포키 외 다른 사이트에도 올려야 해서 구조 변경
  - `src/poki.js` → `platforms/` 폴더로 분리 (poki, crazygames, gamedistribution, web)
  - 게임 코드의 `Poki.*` 호출을 `Platform.*`로 변경
  - `index.html`에 `<!-- PLATFORM_SDK -->` 자리 표시 → 빌드/개발 서버가 사이트별 SDK를 끼워 넣음
  - 빌드가 사이트별 ZIP을 따로 만듦 (`dist/<id>.zip`)
  - 개발 서버를 `/<사이트>/` 주소로 바꿔 사이트별로 바로 확인 가능
  - Live Server 설정(`.vscode/settings.json`) 제거 — SDK 주입이 안 돼서 `npm run dev`로 통일
  - 바꾸기 전 원본은 `backup/*.orig.*`에 보관
  - 4개 사이트 모두 헤드리스 크롬으로 실행 검증 완료
- **팀 구조 도입**: 세션마다 이어서 일할 수 있게 구성
  - `CLAUDE.md`(세션 규칙), `STATUS.md`(현황판), `teams/1-기획 ~ 4-QA/`(팀별 README·템플릿·작업기록)
  - `.claude/agents/`에 팀별 서브에이전트 (planner, designer, developer, qa)
  - `src/assets/` 에셋 폴더 추가
- 구글 드라이브 `내 꿈이 바랄때까지/poki-game-env/`에 `poki-game-update.zip` 업로드 (드라이브 커넥터가 기존 파일 수정 불가라 ZIP으로 전달, 한글 파일명 UTF-8 플래그 확인)
  - 기존 폴더에서 지울 것: `src/poki.js`, `.vscode/settings.json` (멀티 플랫폼 전환으로 안 씀)
- **팀별 세션 구성 준비**: `CLAUDE.md`에 팀별 세션 규칙(팀별 수정 범위, 시작 시 pull·끝날 때 push) 추가, git 저장소 초기화. 사용자가 만든 GitHub 비공개 저장소에 올린 뒤 팀별 세션 4개 생성 예정

### 2026-11-24
- 팀 안 파트 구성: 기획(핵심·밸런스·수익화), 디자인(UI·오브젝트·사운드), 개발(게임플레이·UI 구현·플랫폼), QA(기능·기기·사이트 심사)
- 출시팀 신설 (`teams/5-출시/`, 에이전트 `releaser`): 사이트별 요구사항, 스토어 자료, 업로드 기록
- 세션은 팀 단위 5개, 파트는 팀 세션 안에서 처리
