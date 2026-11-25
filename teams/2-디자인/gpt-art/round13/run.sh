#!/bin/bash
# 13차: 스킬 60개 대표 이펙트 그림 — 2×2 시트 15장 (지시서.md)
# GPT 이미지 한도가 풀린 뒤(2026-11-26 09:17 KST) 팀장이 실행해요. 한도에 걸리면 그 자리에서 멈춰요.
D="$(cd "$(dirname "$0")" && pwd)"; G="$D/.."
REF1="$G/round8/preview-fx-final.png"; REF2="$G/round10/skill-area.png"
for n in $(seq -w 1 15); do
  OUT="sheet-$n.png"
  [ -f "$D/$OUT" ] && { echo "$n skip"; continue; }
  codex exec --skip-git-repo-check --color never -s workspace-write -C "$D" -i "$REF1" -i "$REF2" -o "$D/result-$n.md" -- \
    "이 폴더의 지시서.md를 읽고, 60개 표에서 '시트·칸' 번호가 $n 인 4칸만 그려서 $OUT 으로 저장해 주세요. 1024x1024, 2x2 칸(512x512), 칸 가장자리 24px 비움, 배경 투명(안 되면 순수 검정, 칠레 2번 칸만 회색 #808080). 첨부 두 장은 그림체·색 참고예요. 흰 중심 + 은 #C9CED6 + 옅은 금 #E8D9A8만, 글자·국기·종교 상징 없음. 이미지 생성이 한도 등으로 실패하면 다른 방법으로 대신 만들지 말고 result-$n.md에 실패라고만 적어 주세요. 성공하면 크기와 투명 여부를 적어 주세요." \
    < /dev/null > "$D/codex-$n.log" 2>&1
  if grep -q "usage_limit_reached\|429 Too Many" "$D/codex-$n.log"; then echo "$n LIMIT — 멈춤"; break; fi
  echo "$n done: $(ls "$D/$OUT" 2>/dev/null || echo 없음)"
done
ls -la "$D"/sheet-*.png 2>/dev/null
