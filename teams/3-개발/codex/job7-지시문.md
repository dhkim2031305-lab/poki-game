# Codex 작업 7 — 스킬 수치 조정 반영 (사용자 "추천대로" 2026-11-27, 기획 41ee110)

대상: `src/data.js`(주로 `SKILL_MOD`), 필요하면 `src/game.js`. git commit 금지.
기준: `teams/1-기획/skills-unique.md` 피해 칸(바뀐 15개) + `teams/1-기획/balance.md` 맨 아래 "조정 기록"(약함 11개 올림 · 셈 5개 조금 내림 · 이탈리아2는 QA 고침 뒤 재측정 표시).
- 문서의 숫자를 `SKILL_MOD`의 `mul`·`div`·`first`·`rest`·`out`·`back`·`mid`·`side`·`smoke` 등 그 스킬이 실제로 쓰는 필드에 그대로 옮겨요. 각 줄에 `// 수치 조정 2026-11-27 (41ee110): 전 → 후` 주석.
- 문서에 수치가 있는데 코드에 그 필드가 없으면(피해가 game.js 안 상수로 박혀 있으면) game.js 그 자리를 같은 이름의 SKILL_MOD 필드로 바꿔 읽게 해요.
- 바꾸지 않을 것: 유형·꼬리표·범위·시간(문서가 시간도 바꿨으면 그건 반영), 한국 1·2는 문서에 조정이 있으면만.
- 결과 파일에 표: 나라·번호·스킬·필드·전→후·문서 근거 줄. 문서와 코드가 어긋나서 판단이 필요한 건 "확인 필요"로 따로.
- 끝나면 `node -e "new Function(require('fs').readFileSync('src/data.js','utf8'))"`(game.js도).
