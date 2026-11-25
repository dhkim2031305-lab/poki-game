#!/bin/bash
# 체코 3장 다시 그리기: 후스파 성배(종교 상징) 제거
D="$(cd "$(dirname "$0")" && pwd)"; G="$D/.."
RULE="가슴·방패·옷 어디에도 성배(잔) 문양 없음, 종교 상징·글자 없음. 방패는 체코 국기처럼 흰색·빨강 가로 2칸 + 왼쪽 파랑 삼각형 무늬. 나머지(갑옷·둥근 투구·도리깨·색·자세)는 첨부 원본과 똑같이. 배경 완전 투명, 얼굴은 투구로 가림."
codex exec --skip-git-repo-check --color never -s workspace-write -C "$G/round2" -i "$D/czechia.v1.png" -o "$D/result-1.md" -- "첨부 그림(czechia.v1.png)과 완전히 같은 그림체·구도·크기로 czechia.png를 이미지 생성 기능으로 다시 만들어 이 폴더에 덮어써 주세요. 1024x1024. $RULE" < /dev/null > "$D/codex-1.log" 2>&1; echo "1 done"
codex exec --skip-git-repo-check --color never -s workspace-write -C "$G/round4" -i "$D/sprite-czechia.v1.png" -i "$G/round2/czechia.png" -o "$D/result-2.md" -- "첫 첨부(sprite-czechia.v1.png)와 같은 전투용 2.5등신 그림체·크기로 sprite-czechia.png를 이미지 생성 기능으로 다시 만들어 이 폴더에 덮어써 주세요. 두 번째 첨부(새 원본)의 방패·가슴 무늬를 따르세요. 1024x1024. $RULE" < /dev/null > "$D/codex-2.log" 2>&1; echo "2 done"
codex exec --skip-git-repo-check --color never -s workspace-write -C "$G/round5" -i "$D/sheet-czechia.v1.png" -i "$G/round4/sprite-czechia.png" -o "$D/result-3.md" -- "첫 첨부(sheet-czechia.v1.png)는 동작 시트예요(가로 7칸, 칸마다 256x256, 전체 1792x256: 서기, 걷기 4, 공격 준비, 공격). 같은 구성·같은 동작으로 sheet-czechia.png를 이미지 생성 기능으로 다시 만들어 이 폴더에 덮어써 주세요. 캐릭터는 두 번째 첨부(새 전투용 그림)와 똑같이. 7칸 모두 같은 크기·같은 발 위치. $RULE" < /dev/null > "$D/codex-3.log" 2>&1; echo "3 done"
