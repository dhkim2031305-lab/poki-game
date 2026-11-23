# 개발팀

## 맡는 일
- 기획서와 스타일 가이드대로 `src/game.js`를 구현해요.
- 기술 환경은 `../../SETUP.md`를 따르고, 바꾸면 그 문서에 기록해요.

## 코드 규칙
- 광고·SDK는 **`window.Platform`만** 불러요. `PokiSDK`, `CrazyGames` 같은 SDK를 직접 부르지 않아요.
  - 시작: `Platform.gameplayStart()` / 죽음: `Platform.gameplayStop()`
  - 판 사이: `await Platform.commercialBreak(() => 소리끄기)`
  - 보상형: `if (await Platform.rewardedBreak(() => 소리끄기)) 보상주기()`
  - `Platform.name === 'web'`이면 보상형 광고 버튼을 숨겨요.
- 외부 라이브러리를 넣지 않아요. 넣어야 하면 기획팀과 사용자 승인부터 받아요.
- 광고 중에는 소리를 끄고 입력을 막아요. 게임 키를 누를 때 페이지가 스크롤되면 안 돼요.
- 고치기 전에 `backup/`에 `*.orig.*`로 백업해요.

## 작업 흐름
1. GPT(Codex)에게 구현을 맡겨요. 지시문에 GDD와 스타일 가이드 경로를 적어 줘요.
2. Claude가 `npm run dev`로 실제 실행해 기획서와 대조해 점검해요.
3. 점검 결과를 표로 사용자에게 보여주고 승인을 받아요.

## 완료 기준
- [ ] GDD 1~7의 모든 항목이 동작함
- [ ] 4개 사이트(`/poki/` `/crazygames/` `/gamedistribution/` `/web/`)에서 에러 없이 실행됨
- [ ] `npm run build` 성공 → QA로 넘김
