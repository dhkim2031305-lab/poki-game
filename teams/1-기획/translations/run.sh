#!/bin/bash
# 18개 언어 번역: src/i18n.js의 en·ko 블록 기준 → <lang>.json (기획팀 점검 → 개발팀 반영)
D="$(cd "$(dirname "$0")" && pwd)"; R="$D/../../.."
for grp in "fr de nl da sv fi" "it es cs he lt ja" "pt pl hu sk el tr"; do
  miss=""; for l in $grp; do [ -f "$D/$l.json" ] || miss="$miss $l"; done
  [ -z "$miss" ] && { echo "skip $grp"; continue; }
  codex exec --skip-git-repo-check --color never -s workspace-write -C "$R" -o "$D/result-${miss// /_}.md" -- "웹 액션 게임 문구 번역이에요. src/i18n.js 안의 en 블록(영어)과 ko 블록(한국어 원문)을 읽고, teams/1-기획/texts.md의 설명 칸(맥락·말투 메모)도 참고해서, 다음 언어로 번역한 JSON 파일을 만들어 주세요:$miss. 파일 이름은 teams/1-기획/translations/<언어코드>.json 이고, 내용은 en 블록과 **같은 키 전부**를 가진 {\"키\": \"번역\"} 객체예요. 규칙: (1) {n} {t} {m} {s} 같은 자리표시자는 그대로 둬요. (2) 짧은 버튼·UI 문구는 그 언어 게임에서 흔히 쓰는 짧은 말로. (3) 말투는 원문 톤 유지(행복 가득 → 비꼬는 반전, 풍자). (4) shout(외침)·나라 이름·통화 기호처럼 en 블록에 없는 키는 만들지 마세요. (5) 스킬 이름(skill.name.*, skill2.name.*)은 짧고 멋있게. (6) 히브리어는 오른쪽→왼쪽 글이지만 문자열만 쓰면 돼요. (7) JSON이 올바른지 확인해 주세요. 끝나면 결과에 언어별 키 수를 적어 주세요." < /dev/null > "$D/codex-${miss// /_}.log" 2>&1
  grep -q "usage_limit_reached\|429 Too Many" "$D/codex-${miss// /_}.log" && { echo "LIMIT at$miss"; break; }
  echo "done:$miss"
done
ls "$D"/*.json
