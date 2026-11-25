# 개발팀 실행 점검 스크립트 (헤드리스 크롬 · Playwright)

먼저 `npm run dev`를 켜 두고, 결과를 저장할 폴더(예: `out`, 안에 `shots/` 폴더 필요)를 첫 인자로 줘요.

| 파일 | 하는 일 | 예 |
|---|---|---|
| `sites.js` | 4개 사이트가 에러 없이 열리고 플레이까지 가는지 | `node sites.js` |
| `shots.js` | 폰 가로(844×390) 시작·나라 고르기·플레이 화면 캡처 | `node shots.js out web` |
| `ads.js` | 광고 흐름: 파산 이어하기·쓰러짐 이어하기 1회·판 사이 광고 건너뛰기·ESC | `node ads.js out poki` |
| `ending.js` | 라운드를 강제로 넘겨 6라운드 클리어 엔딩 확인 | `node ending.js out 14 korea` |
| `fxtest.js` | 12개국 치기·쏘기 효과 캡처 + 설정 언어 20개 | `node fxtest.js out` |
| `bot.js` | 자동 플레이 봇 (거리 두고 쏘기). 밸런스 감 잡기용, 사람보다 서툴러요 | `node bot.js out web 0 lux` (0 = 1위 룩셈부르크) |

- `G`(게임 상태), `UI.hits`(누를 수 있는 곳), `Platform`을 페이지에서 읽어요. 게임 코드에 테스트 전용 장치는 없어요.
