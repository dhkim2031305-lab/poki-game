#!/bin/bash
# 4차: 전투용 장수 27명 + 화폐 CI 아이콘 20종
D="$(cd "$(dirname "$0")" && pwd)"; R2="$D/../round2"; R3="$D/../round3"
job(){ name=$1; prompt=$2; shift 2; imgs=(); for f in "$@"; do imgs+=(-i "$f"); done
  codex exec --skip-git-repo-check --color never -s workspace-write -C "$D" "${imgs[@]}" -o "$D/result-$name.md" -- "$prompt" < /dev/null > "$D/codex-$name.log" 2>&1; echo "$name done"; }

# 화폐 (10개씩 2번)
for b in 1 2; do
  LIST=$(sed -n "$(( (b-1)*10+1 )),$(( b*10 ))p" "$D/currency.tsv" | awk -F'\t' '{printf "- cur-%s.png: %s — %s\n",$1,$2,$3}')
  job cur$b "게임 아이템 아이콘을 이미지 생성 기능으로 하나씩 만들어 이 폴더에 저장해 주세요. 각 나라 화폐의 고유한 색과 상징(CI)을 살린 '살짝 접힌 지폐 한 장 + 그 앞에 동전 하나' 아이콘이에요.
공통: 첨부한 그림과 같은 그림체(진지한 판타지 게임 아이콘, 셀 셰이딩, 굵은 어두운 외곽선), 512x512, 배경 완전 투명, 모든 아이콘이 같은 구도·크기.
꼭 지킬 것: 실제 지폐·동전을 그대로 베끼지 말고 색과 상징만 살린 게임용 아이콘. 사람 얼굴·초상 없음, 글자·숫자·일련번호·기호 전혀 없음(기호는 나중에 코드로 넣어요). 동전 가운데는 비워 둠.
$LIST" "$R3/coin-blank.png" "$R3/note-blank.png"
done

# 전투용 장수 27명 (9명씩)
for b in 1 2 3; do
  NAMES=$(sed -n "$(( (b-1)*9+1 )),$(( b*9 ))p" "$R2/countries.tsv" | cut -f1)
  LIST=""; IMGS=()
  for n in $NAMES; do LIST="$LIST sprite-$n.png($n.png를 바탕으로)"; IMGS+=("$R2/$n.png"); done
  job spr$b "첨부한 sprite-*.png 3장(한국·일본·독일)이 확정된 전투용 스프라이트 그림체예요. 같은 그림체로, 첨부한 나머지 장수 원본 그림들을 각각 전투용 스프라이트로 다시 그려 이미지 생성 기능으로 저장해 주세요:$LIST
- 원본의 갑옷·투구·무기·국기 색은 그대로 유지, 머리와 투구가 크고 몸이 작은 약 2.5등신, 외곽선 굵게, 디테일 단순화, 정면(아래쪽)을 봄
- 1024x1024, 배경 완전 투명, 가운데 배치, 얼굴은 투구로 가리고 과장·희화화 금지, 글자 없음" "$R3/sprite-korea.png" "$R3/sprite-japan.png" "$R3/sprite-germany.png" "${IMGS[@]}"
done
