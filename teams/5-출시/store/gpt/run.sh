#!/bin/bash
D="$(cd "$(dirname "$0")" && pwd)"; cd "$D"
job(){ n=$1; size=$2; heroes=$3; desc=$4; args=()
  for h in $heroes; do args+=(-i "ref-$h.png"); done
  [ -f "$n.png" ] && { echo "$n skip"; return 0; }
  codex exec --skip-git-repo-check --color never -s workspace-write -C "$D" "${args[@]}" -i ref-boss.png -i ref-grunt.png -i ref-shooter.png -o "result-$n.md" -- "이 폴더의 지시서.md(게임 썸네일 지시서)를 읽고 원본 $n 을 이미지 생성 기능으로 그려 $n.png 로 저장해 주세요. 크기 $size. 첨부는 게임 속 장수(${heroes}) 그림과 보스·외계인 그림이에요. 장수의 갑옷·무기·색을 첨부와 똑같이 살려 주세요. $desc 글자·로고·숫자·국기 깃발·금빛 효과 없음, 장수 크기 모두 같게, 피 없음, 게임과 같은 그림체(손그림 느낌의 판타지 일러스트). 실패하면 대신 만들지 말고 result-$n.md에 실패라고만 적어 주세요." < /dev/null > "codex-$n.log" 2>&1
  grep -q "usage_limit_reached\|429 Too Many" "codex-$n.log" && { echo "$n LIMIT"; return 1; }
  echo "$n: $(ls $n.png 2>/dev/null || echo 없음)"; }
job M1 "가로 16:9, 1920x1080 이상" "usa germany korea japan mexico" "장수 5명이 화면 아래쪽에 한 줄로 외계인을 향해 서고, 위쪽 가운데에 보스 외계인이 크게, 주변에 작은 외계인 몇 마리, 장수들 앞에서 흰·은빛 스킬 빛 1~2개가 터지는 순간. 위에서 비스듬히 본 돌바닥 전장. 주인공은 가운데 60% 안에." &&
job M2 "정사각 1:1, 1024x1024 이상" "usa korea japan" "아래쪽에 장수 3명, 위쪽에 보스 외계인을 크게. 200x120으로 줄여도 알아보게 굵은 실루엣." &&
job M3 "세로 2:3, 1024x1536 이상" "usa germany korea japan mexico" "위쪽 2/3에 보스 외계인을 크게(외계인이 주인공), 아래에 장수 5명이 작게 나란히. 장수 한 명만 크게 그리지 않아요."
