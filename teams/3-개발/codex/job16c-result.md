Gemini 의견을 읽고 팀장 메모의 수치에 맞춰 작업16c를 완료했습니다. [작업16c 결과 보고서](/home/user/poki-game/teams/3-개발/codex/job16c-result.md)

| 변경 위치 | 적용 내용 |
|---|---|
| [스킬 투사체](/home/user/poki-game/src/game.js:2048) | 지정된 투척물 8종을 스킬 효과 그림으로 교체했습니다. `FLY_WEAPON_PROPS`의 기본값은 `false`입니다. 한국 2의 설치 화포는 유지하고 포탄은 진행 방향으로 정렬한 4칸 불덩이로 바꿨습니다. |
| [효과 재생](/home/user/poki-game/src/game.js:1586) · [프레임 처리](/home/user/poki-game/src/fx.js:240) | 단발 효과는 마지막 칸까지 재생하며 최대 1.3배로 퍼진 뒤 사라집니다. 설치 효과는 3→4→5→4칸을 반복하고 종료 칸을 한 번 재생합니다. |
| [움직임](/home/user/poki-game/src/game.js:1871) · [3D 배치](/home/user/poki-game/src/render3d.js:244) | 등장은 0.15초 동안 0.5→1.15→1배로, 장판은 0.8초 주기로 ±16% 숨쉬며 초당 54° 회전하도록 조정했습니다. 장판과 고리는 바닥에 깔고, 비행 효과에는 고도에 따라 작고 옅어지는 그림자를 적용했습니다. `reduceMotion`에서는 추가 회전과 숨쉬기를 끕니다. |

수정한 JavaScript 3개 파일이 `node --check`를 통과했습니다. `arrive.js`에서 60개 스킬을 검사해 도착 동기화 위반 0개를 확인했습니다. `dmgtime.js`의 조건을 Node에서 재현한 결과, 60개 모두 첫 피해 시각과 프레임별 누적 피해가 수정 전과 일치했습니다.

Chromium 실행이 환경 권한 제한에 막혀 3D는 그리기 호출까지 검증했습니다. 실제 화면은 확인하지 못했습니다.