# Codex 작업23 — 무적 외침 말풍선 (GDD 0-25)

src/data.js · src/game.js만. 
- teams/1-기획/invuln-shout.md 표 '무적 외침 (그 나라 말)' 열 30개를 나라 데이터에 `invShout`로 넣어요(스킬 외침 SK의 shout처럼 나라마다 고정, 번역 안 함). 이스라엘은 "ישראל! תחזיק מעמד!"(rtl — 기존 히브리어 외침과 같은 처리).
- 무적 버튼(useInvuln) 누를 때 장수 머리 위 말풍선으로 invShout(기존 외침 말풍선 그리기 재사용, 오른쪽 버튼 피하기 유지). 목소리는 작업21 연결 그대로.
- 결과(-o, 한국어): 바꾼 곳, node --check.
