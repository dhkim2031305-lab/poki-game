#!/bin/bash
D="$(cd "$(dirname "$0")" && pwd)"; G="$D/.."
codex exec --skip-git-repo-check --color never -s workspace-write -C "$D" -i "$G/round3/preview-ingame.png" -o "$D/result.md" -- "이 폴더의 지시서.md를 읽고 표의 이펙트 시트 5장(fx-slash, fx-thrust, fx-smash, fx-hit, fx-death)을 이미지 생성 기능으로 하나씩 만들어 저장해 주세요. 첨부는 게임 화면(그림체·색 기준)이에요. 칸 수·칸 크기(256x256)·전체 크기·투명 배경·오른쪽 방향을 꼭 지키고, 칸마다 이펙트가 시간 순서로 자연스럽게 이어지게(생김 → 가장 큼 → 사라짐). 끝나면 result.md에 파일별 크기와 투명 여부를 적어 주세요." < /dev/null > "$D/codex.log" 2>&1
ls -la "$D"/fx-*.png
