#!/bin/bash
D="$(cd "$(dirname "$0")" && pwd)"; G="$D/.."
for t in ${@:-grunt shooter boss}; do
  [ -f "$D/alien-$t-dir.png" ] && { echo "$t skip"; continue; }
  if [ $t = boss ]; then SZ="칸 512x512, 전체 7680x512"; else SZ="칸 256x256, 전체 3840x256"; fi
  codex exec --skip-git-repo-check --color never -s workspace-write -C "$D" -i "$G/round3/alien-$t.png" -i "$G/round7/dir-korea.png" -o "$D/result-$t.md" -- "이 폴더의 지시서.md를 읽고 alien-$t-dir.png를 이미지 생성 기능으로 만들어 저장해 주세요. 첫 첨부는 이 외계인의 확정 그림(정면), 둘째 첨부는 같은 게임의 장수 5방향 예시(방향 배치 참고용)예요. 같은 생김새·색으로 5방향 × (서기, 움직임 A, 움직임 B) = 15칸, $SZ, 배경 투명. 위에서 45도 내려다본 입체감(윗면·옆면 명암), 칸마다 같은 크기·발 위치. 한 번에 어려우면 방향별로 나눠 만든 뒤 코드로 이어 붙여도 돼요. 끝나면 result-$t.md에 크기·투명 여부를 적어 주세요." < /dev/null > "$D/codex-$t.log" 2>&1
  echo "$t done: $(ls "$D/alien-$t-dir.png" 2>/dev/null)"
done
