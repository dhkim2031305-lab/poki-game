#!/bin/bash
D="$(cd "$(dirname "$0")" && pwd)"; G="$D/.."
for t in grunt shooter boss; do
  [ -f "$D/alien-$t-jump.png" ] && { echo "$t skip"; continue; }
  if [ $t = boss ]; then SZ="칸 512x512, 전체 7680x512"; else SZ="칸 256x256, 전체 3840x256"; fi
  codex exec --skip-git-repo-check --color never -s workspace-write -C "$D" -i "$G/round11/alien-$t-dir.png" -o "$D/result-$t.md" -- "이 폴더의 지시서.md를 읽고 alien-$t-jump.png를 이미지 생성 기능으로 만들어 저장해 주세요. 첨부는 이 외계인의 5방향(서기·움직임 A·B) 시트예요. 같은 생김새·색·크기·방향 배치로, 방향마다 웅크림·공중·착지 3칸씩 15칸, $SZ, 배경 투명. 끝나면 result-$t.md에 크기·투명 여부를 적어 주세요." < /dev/null > "$D/codex-$t.log" 2>&1
  echo "$t done: $(ls "$D/alien-$t-jump.png" 2>/dev/null)"
done
[ -f "$D/fx-land.png" ] || codex exec --skip-git-repo-check --color never -s workspace-write -C "$D" -i "$G/round8/preview-fx-final.png" -o "$D/result-fx.md" -- "이 폴더의 지시서.md를 읽고 fx-land.png(착지 충격파 6칸, 1536x256, 칸 256x256, 투명)를 이미지 생성 기능으로 만들어 저장해 주세요. 첨부 이펙트와 같은 그림체, 색은 회갈색 먼지 + 보라 한 색만." < /dev/null > "$D/codex-fx.log" 2>&1
ls -la "$D"/*.png
