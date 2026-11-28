무적 발동 시 장수 머리 위 말풍선에 해당 나라의 외침 원문이 표시됩니다. [작업 23 결과 보고서](/home/user/poki-game/teams/3-개발/codex/job23-result.md)

| 변경 위치 | 반영 내용 |
|---|---|
| [src/data.js](/home/user/poki-game/src/data.js:9) | 기획표의 30개국 외침을 나라별 `invShout`에 추가했습니다. |
| [src/game.js](/home/user/poki-game/src/game.js:681) | `useInvuln()`이 기존 말풍선으로 외침을 표시합니다. 이스라엘의 오른쪽에서 왼쪽으로 쓰는 방향, 오른쪽 버튼을 피하는 배치, 작업 21의 음성 호출을 유지했습니다. |

두 파일 모두 `node --check`를 통과했습니다. Node VM에서 30개국의 원문, 발동 메시지, 이스라엘의 RTL 설정, 음성 경로를 검증했습니다. 실제 브라우저에서 말풍선 배치와 음성 재생은 확인하지 못했습니다.