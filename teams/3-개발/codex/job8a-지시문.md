# Codex 작업 8a (최우선) — 빛번짐 완전 제거 + 화면 번쩍 복구 + 아이폰 캡처 3건

대상: `src/game.js`, `src/audio.js`, `tools/build-single.js`. git commit 금지. 사용자 아이폰 캡처: `teams/3-개발/review-4/user/2026-11-27-usa2-glow-iphone.png`.
기준: style-guide "스킬 빛번짐 정리" 절 + 디자인 정정(main 최신): **장판·덫·고리·설치 구역·조준 원·대표 그림 둘레에 빛 웅덩이(halo)·안쪽 빛 채움·빛무리 없음 — 테두리 선·문양·효과 본체만.** 화면 번쩍·무기 끝 섬광·터질 때 작은 흰 섬광·빛기둥·그림 자체의 빛은 그대로.

1) 빛번짐 제거(60개 공통): 
   - 연결체 빛 덩이의 빛무리(`drawLink`의 radialGradient halo, a8fe8f6에서 넣은 것) 제거 — 빛 덩이 본체·꼬리는 유지.
   - 설치·장판·고리·조준 원 그리기에서 **안쪽 채움(fill)·둘레 그라디언트·가산 빛 웅덩이**가 남아 있으면 모두 제거(`floorRing`, 설치 구역 draw, `arrive`·`ringFx`·`aimFlash`·`link` 조준 원, 대표 그림 zone 모드 등 전부 훑어서). "숨쉬듯 밝아짐"은 문양 선 자체 밝기만.
   - 대표 그림 뒤 `glow()`는 이미 지웠어요(f192bdf) — 다시 생기지 않게.
2) 화면 번쩍 복구: f192bdf에서 지운 `if (layerFx()) G.skillFlash = .06;`(스킬 쓰는 순간 흰 8% 0.06초)을 원래 자리(skillLayers 시작)에 되살려요.
3) 디버그 글자·2D/3D 버튼: 미리보기에서도 **기본 숨김**. `tools/build-single.js`의 preview 추가분(`#rt` 버튼, `window.__DEBUG=true`)과 `game.js`의 `diag`는 **숨은 토글**로만 켜져요: URL `?debug=1` 이거나, 화면 왼쪽 위 모서리(40×40)를 1.5초 안에 5번 톡 → 켜기/끄기(localStorage `aw.debug`, try/catch). 켜지면 지금처럼 진단 글자 + 2D/3D 버튼이 보여요. 출시 빌드(dist zip)에는 지금처럼 아예 없음을 확인.
4) iOS "promise: Failed to start the audio device": `audio.js`에서 AudioContext 시작(resume/start)이 실패하면 조용히 넘어가고, 다음 사용자 터치(pointerdown/touchend)에서 한 번 더 resume 재시도. 이 경고가 `unhandledrejection`으로 화면(diag)에 뜨지 않게 그 Promise를 catch. 소리 실패는 게임 진행을 막지 않음.
5) 외침 말풍선이 폰 오른쪽 스킬 버튼(2번 육각형 등)을 가림: 터치 UI(`G.touchUI`)일 때 말풍선 사각형이 `btnPos()`의 오른쪽 버튼 무리(스틱·화살표·스킬 버튼, 여유 8px) 영역과 겹치지 않게 x를 왼쪽으로 밀고, 그래도 겹치면 y를 위로(HUD 아래까지) 옮겨요. 말풍선 폭 계산(스킬 이름 포함)은 그대로.

확인: `node -e "new Function(require('fs').readFileSync('src/game.js','utf8'))"`(audio.js, tools/build-single.js도). 결과 파일에 지운 빛번짐 목록(함수·줄)과 나머지 항목 처리 방법을 표로.
