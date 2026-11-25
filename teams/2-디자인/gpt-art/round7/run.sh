#!/bin/bash
# 사용법: run.sh 나라1 나라2 ...  (없으면 korea 시험)
D="$(cd "$(dirname "$0")" && pwd)"; G="$D/.."
NAMES="${@:-korea}"
for n in $NAMES; do
  src="$G/round1/$n.png"; [ -f "$src" ] || src="$G/round2/$n.png"
  spr="$G/round3/sprite-$n.png"; [ -f "$spr" ] || spr="$G/round4/sprite-$n.png"
  codex exec --skip-git-repo-check --color never -s workspace-write -C "$D" -i "$spr" -i "$src" -o "$D/result-$n.md" -- "이 폴더의 지시서.md를 읽고 그대로 dir-$n.png 와 weapon-$n.png 2장을 이미지 생성 기능으로 만들어 저장해 주세요. 첫 첨부는 이 나라의 확정된 전투용 그림(정면, 무기 든 모습), 둘째 첨부는 원본 일러스트예요. 같은 사람·같은 갑옷·같은 색으로, dir은 무기 없는 몸 5방향(아래, 오른쪽 아래, 오른쪽, 오른쪽 위, 위 뒷모습), weapon은 그 무기만 오른쪽을 향해 눕힌 그림(손잡이 끝이 왼쪽 가운데). 크기·투명 배경·칸 규칙을 꼭 지키고, 끝나면 result-$n.md에 크기와 투명 여부를 적어 주세요." < /dev/null > "$D/codex-$n.log" 2>&1
  echo "$n done"
done
