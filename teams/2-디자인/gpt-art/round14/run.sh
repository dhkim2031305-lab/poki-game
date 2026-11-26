#!/bin/bash
# 14차: 스킬 60개 화려하게 — 13차 시트를 모양 참고로 넣고 나라 색 + 유형별 요소를 더해요. 한도에 걸리면 멈춰요.
D="$(cd "$(dirname "$0")" && pwd)"; G="$D/.."
for n in $(seq -w 1 15); do
  OUT="sheet-$n.png"
  [ -f "$D/$OUT" ] && { echo "$n skip"; continue; }
  REF="$G/round13/sheet-$n.png"
  codex exec --skip-git-repo-check --color never -s workspace-write -C "$D" -i "$REF" -i "$G/round13/color-preview-v3.png" -o "$D/result-$n.md" -- \
    "이 폴더의 지시서.md를 읽고, 60개 표에서 '시트·칸' 번호가 $n 인 4칸만 그려서 $OUT 으로 저장해 주세요. 첨부 1은 같은 번호의 13차 시트예요. 칸마다 그 모양(주인공 모양·위치·방향)을 그대로 살리고, 표의 '더할 것'과 '색'을 더해 훨씬 화려하게 그려요. 첨부 2는 색 시안 참고예요. 1024x1024, 2x2 칸(512x512), 칸 가장자리 24px 비움, 배경 투명(안 되면 순수 검정, 칠레 2번 칸만 회색 #808080). 보라색·연두색 금지(초록은 에메랄드만), 국기 모양·글자·종교 상징 없음, 튀르키예 초승달 모양 금지. 칸이 잘리거나 다른 칸으로 넘어가지 않게. 이미지 생성이 한도 등으로 실패하면 다른 방법으로 대신 만들지 말고 result-$n.md에 실패라고만 적어 주세요. 성공하면 크기와 투명 여부를 적어 주세요." \
    < /dev/null > "$D/codex-$n.log" 2>&1
  if grep -q "usage_limit_reached\|429 Too Many" "$D/codex-$n.log"; then echo "$n LIMIT — 멈춤"; break; fi
  echo "$n done: $(ls "$D/$OUT" 2>/dev/null || echo 없음)"
done
