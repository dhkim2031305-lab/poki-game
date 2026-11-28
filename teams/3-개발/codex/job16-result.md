작업 16을 반영했습니다. [측정 결과표](/home/user/poki-game/teams/3-개발/review-4/early-burst-2026-11-28/after.txt)에서 **60개 스킬의 타이밍 위반은 0건**입니다.

| 변경 위치 | 수정 내용 |
|---|---|
| [비행과 착탄](/home/user/poki-game/src/game.js:2410) | 연결체 피해를 비행 종료 프레임에 적용하고, 리투아니아 2의 투창은 세 지점에 각각 도착할 때 그림과 타격을 함께 처리했습니다. |
| [설치형 스킬](/home/user/poki-game/src/game.js:1367) | 도착 프레임에 장판 그림을 켜고 첫 피해를 동기화했습니다. 캐나다 2의 모으기와 스위스 1의 덫 발동은 기존 동작을 유지했습니다. |
| [도착 그림](/home/user/poki-game/src/game.js:1098) | 스페인 2와 일본 2는 실제 타격 위치에, 폴란드 2는 장수 위치에 그림을 표시합니다. 멕시코 1은 착지와 같은 프레임에 그림이 뜹니다. |
| [돌진 소품과 잔상](/home/user/poki-game/src/game.js:1753) | 돌진 중 장수에게 붙는 소품을 제거했습니다. 한국 1의 거북선 그림은 유지했고, 돌진 경로 그림과 잔상은 종료 후 0.15초 안에 사라집니다. |

기본 배치에서 미적중한 호주 1과 캐나다 1은 표적을 사거리 안으로 옮겨 재측정했고, 둘 다 착탄·그림·첫 피해가 같은 프레임이었습니다. Chromium이 실행 권한 오류로 종료되어 [arrive.js](/home/user/poki-game/teams/3-개발/test/arrive.js)로 전투와 2D 그리기 호출을 검증했습니다. `node --check`는 `src/game.js`, `src/render3d.js`, `arrive.js` 모두 통과했고, `git diff --check`도 통과했습니다.