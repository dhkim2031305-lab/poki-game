#!/bin/bash
# 10차: A 텍스처 / B 스킬 아이콘 / C 스킬 이펙트 (지시서.md 기준)
D="$(cd "$(dirname "$0")" && pwd)"; G="$D/.."
job(){ name=$1; prompt=$2; shift 2; imgs=(); for f in "$@"; do imgs+=(-i "$f"); done
  codex exec --skip-git-repo-check --color never -s workspace-write -C "$D" "${imgs[@]}" -o "$D/result-$name.md" -- "$prompt" < /dev/null > "$D/codex-$name.log" 2>&1; echo "$name done"; }
job A "이 폴더의 지시서.md를 읽고 'A. 3D 텍스처' 표의 5개 파일(tex-floor.png, tex-wall.png, tex-wall-top.png, door-arch.png, pillar.png)을 이미지 생성 기능으로 하나씩 만들어 저장해 주세요. 첨부 room.png는 같은 성채 그림체·색 기준이에요. 크기·불투명/투명·이음매 없는 반복(seamless) 조건을 꼭 지키고, 강한 그림자 없이 고른 밝기로. 반복 텍스처는 저장 뒤 2x2로 이어 붙였을 때 이음매가 보이면 다시 만들어 주세요. 끝나면 result-A.md에 파일별 크기·투명 여부·이음매 확인 결과를 적어 주세요." "$G/round3/room.png"
job B "이 폴더의 지시서.md를 읽고 'B. 스킬 아이콘 5개'(skill-icon-dash/area/barrage/guard/zone.png, 512x512, 투명)를 이미지 생성 기능으로 하나씩 만들어 저장해 주세요. 흰·은·옅은 금 한 계열만, 유형마다 모양만 다르게, 글자 없음. 첨부는 색 톤 기준(round8 final 이펙트)이에요. 끝나면 result-B.md에 기록." "$G/round8/preview-fx-final.png"
job C "이 폴더의 지시서.md를 읽고 'C. 스킬 이펙트 시트 5개'(skill-dash/area/barrage/guard.png 6칸 1536x256, skill-zone.png 8칸 2048x256, 칸 256x256, 투명, +x 방향, 발생→최대→소멸)를 이미지 생성 기능으로 하나씩 만들어 저장해 주세요. 흰 중심 + 은/옅은 금 한 계열(첨부 톤과 같게), 칸 경계는 완전 투명, 무기 그림 없음. 끝나면 result-C.md에 기록." "$G/round8/preview-fx-final.png"
ls -la "$D"/*.png
