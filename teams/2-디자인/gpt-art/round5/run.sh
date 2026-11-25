#!/bin/bash
# 5차: 장수 30명 동작 시트 (5명씩 6번)
D="$(cd "$(dirname "$0")" && pwd)"; R1="$D/../round1"; R2="$D/../round2"; R3="$D/../round3"
{ printf 'korea\t한국\n'; printf 'japan\t일본\n'; printf 'germany\t독일\n'; cut -f1,2 "$R2/countries.tsv"; } > "$D/list.tsv"
total=$(wc -l < "$D/list.tsv")
for s in $(seq 1 5 "$total"); do
  e=$((s+4)); IMGS=(); LIST=""
  while IFS=$'\t' read -r n k; do
    src="$R1/$n.png"; [ -f "$src" ] || src="$R2/$n.png"; IMGS+=(-i "$src"); LIST+="- sheet-$n.png: $k (첨부 $n.png와 같은 갑옷·투구·무기·색)"$'\n'
  done < <(sed -n "${s},${e}p" "$D/list.tsv")
  codex exec --skip-git-repo-check --color never -s workspace-write -C "$D" -i "$R3/sprite-korea.png" "${IMGS[@]}" -o "$D/result-$s.md" "첫 번째 첨부(sprite-korea.png)는 확정된 전투용 작은 장수 그림체예요. 나머지 첨부는 각 나라 장수 원본이에요. 지시서.md 규칙대로 아래 장수마다 동작 스프라이트 시트 1장을 이미지 생성 기능으로 만들어 이 폴더에 저장해 주세요.
- 가로 7칸, 칸마다 256x256, 전체 1792x256, 배경 완전 투명. 칸 1 서 있기, 칸 2~5 걷기 4단계, 칸 6 공격 준비, 칸 7 공격
- sprite-korea.png와 같은 2.5등신 그림체, 굵은 어두운 외곽선. 7칸 모두 같은 크기·같은 발 위치(칸 아래 가운데), 정면
- 갑옷·투구·무기·색은 그 나라 원본과 똑같이. 얼굴은 투구로 가림, 희화화 금지, 글자 없음
$LIST
다 만들면 result-$s.md에 파일별 크기와 투명 여부를 적어 주세요." < /dev/null > "$D/codex-$s.log" 2>&1
  echo "batch $s done: $(ls "$D"/sheet-*.png 2>/dev/null | wc -l) sheets"
done
