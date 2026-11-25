# 개발팀 실행 점검 스크립트 (헤드리스 크롬 · Playwright)

먼저 `npm run dev`를 켜 두고, 결과를 저장할 폴더(예: `out`, 안에 `shots/` 폴더 필요)를 첫 인자로 줘요.

| 파일 | 하는 일 | 예 |
|---|---|---|
| `sites.js` | 4개 사이트가 에러 없이 열리고 플레이까지 가는지 | `node sites.js` |
| `shots.js` | 폰 가로(844×390) 시작·나라 고르기·플레이 화면 캡처 | `node shots.js out web` |
| `ads.js` | (1차 첫 버전 기준, 지금은 `ads2.js` 사용) 광고 흐름: 파산 이어하기·쓰러짐 이어하기 1회·판 사이 광고 건너뛰기·ESC | `node ads.js out poki` |
| `ads2.js` | (리뷰 반영 후) 결과 버튼 3개·다시하기 광고 규칙·보상형 거부·SDK 막힘 | `node ads2.js out poki` |
| `portrait.js` | 세로 폰 회전 안내(첫 터치 전) → 가로로 돌리면 복귀 | `node portrait.js out` |
| `ending.js` | 라운드를 강제로 넘겨 6라운드 클리어 엔딩 확인 | `node ending.js out 14 korea` |
| `fxtest.js` | 12개국 치기·쏘기 효과 캡처 + 설정 언어 20개 | `node fxtest.js out` |
| `mouse.js` | 마우스: 커서 조준·좌클릭 치기·우클릭 쏘기/던지기, 던지는 무기 모양 | `node mouse.js out` |
| `guns.js` | 코드로 그린 총 2종(미국·핀란드) 각도별 캡처 | `node guns.js out` |
| `strip.js` | 치기 한 번을 30ms씩 캡처 (전/후 비교, 포트로 버전 선택) | `node strip.js out 8080 after` |
| `bot.js` | 자동 플레이 봇 (거리 두고 쏘기). 밸런스 감 잡기용, 사람보다 서툴러요 | `node bot.js out web 0 lux` (0 = 1위 룩셈부르크) |

- `G`(게임 상태), `UI.hits`(누를 수 있는 곳), `Platform`을 페이지에서 읽어요. 게임 코드에 테스트 전용 장치는 없어요.
