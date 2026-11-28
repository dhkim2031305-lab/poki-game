# 작업30: 스킬 효과가 경기장 밖으로 넘치지 않게 (3D 깊이·잘라내기)

## 문제 (팀장 캡처 teams/3-개발/review-4/all30-2026-11-28/스킬1-30나라.png, 2bb72a0 위)
큰 스킬 효과가 바닥 밖으로 나가 위쪽 벽 너머(검은 바깥)·HUD 자리 위에 그려져 '스티커'처럼 보여요.
예: 아일랜드1 소용돌이, 오스트리아2·스페인2·포르투갈1 위쪽, 콜롬비아2 금빛 고리.

## 사용자 결정 (2026-11-28)
- 바닥에 깔리는 효과(R3D.decal, drawSkillCell flat 등 ground·ring 성분)는 **경기장 바닥 안쪽에서만** 보이게 잘라요 (바닥 사각형 밖은 안 그림).
- 세워진 효과(R3D.sprite effect:true 빌보드, act·hit·after·debris 등)는 **벽 너머로 넘어간 부분이 벽에 가려지게** 해요. 벽 바깥 빈 곳(벽 바깥 테두리 밖)에는 그리지 않아요.
- 판정·피해·크기·타이밍은 바꾸지 않아요. 효과 그림을 줄이지 않아요.

## 구현 힌트 (판단은 맡겨요)
- src/render3d.js: WALL = { h, top, side, bottom, ... }. 벽 메시가 깊이를 쓰는지 확인하고, 효과 재질은 depthTest로 벽 뒤가 가려지게.
- three.js 재질 clippingPlanes + renderer.localClippingEnabled = true 로 바닥 사각형(decal) / 벽 바깥 테두리 상자(효과 sprite)를 잘라내는 방식 추천. 평면은 한 번 만들어 공유.
- 예외: top:true (한국 거북선 접촉 불꽃 QA M20)는 '맨 앞'이 목적이라 깊이 무시는 유지하되, 바깥 잘라내기는 적용해도 돼요.
- 2D 캔버스(ctx)로 그리는 스킬 효과가 남아 있으면 같은 기준(투영한 경기장 바닥/벽 바깥 테두리)으로 ctx.clip 해요. HUD는 자르지 않아요.
- 캐릭터·외계인·소품 빌보드 동작은 바꾸지 않아요.

## 확인
- node --check src/game.js src/render3d.js
- 서버 8080 (tools/server.js 실행 중). teams/4-QA/test/all60-3d.js OUT 8080 → 30줄 모두 에러 0·404 0.
- teams/3-개발/test/dmgtime.js 총합 9409 그대로.
- 결과를 이 폴더 job30-result.md에: 바꾼 곳(파일:줄), 방식, 시험 결과.
- git commit 하지 마세요.
