#!/bin/bash
D="$(cd "$(dirname "$0")" && pwd)"; G="$D/.."
NAMES="${@:-korea}"
for n in $NAMES; do
  [ -f "$D/walk-$n.png" ] && { echo "$n skip"; continue; }
  codex exec --skip-git-repo-check --color never -s workspace-write -C "$D" -i "$G/round7/dir-$n.png" -o "$D/result-$n.md" -- "이 폴더의 지시서.md를 읽고 walk-$n.png를 이미지 생성 기능으로 만들어 저장해 주세요. 첨부(dir-$n.png)는 이 장수의 서 있는 5방향(아래·오른쪽아래·오른쪽·오른쪽위·위)이에요. 같은 사람·같은 갑옷·같은 크기·같은 발 위치로, 방향마다 걷기 2칸(A 오른발 앞, B 왼발 앞)씩 총 10칸(2560x256, 칸 256x256, 투명 배경)을 만들어 주세요. 무기 없음. 끝나면 result-$n.md에 크기와 투명 여부를 적어 주세요." < /dev/null > "$D/codex-$n.log" 2>&1
  echo "$n done: $(ls "$D/walk-$n.png" 2>/dev/null)"
done
