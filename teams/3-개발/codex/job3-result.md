[src/game.js](/home/user/poki-game/src/game.js)만 수정했습니다. 새 이미지나 별도 결과 파일을 만들지 않았고, Git 커밋도 하지 않았습니다. 피해 판정의 위치·범위·피해량·타이밍과 `NO_AFTER`, `BASIC_TRAIL` 규칙을 유지했습니다.

| 적용 대상 | 변경·추가한 주요 함수 | 적용 내용 |
|---|---|---|
| 범위 연결체와 설치 비행 | `linkArtPath`, `drawLink`, `drawLinkFlight`, `drawAreaLink`, `drawLaunch`, `drawVortexFlight`, `drawHak` | 포물선 높이, 높이에 따른 크기, 바닥 그림자를 적용했습니다. 스위스 1 미늘창, 칠레 2 검은 바람, 한국 1 학익진을 포함합니다. |
| 스킬 바닥 고리·장판·조준 원·섬광 | `floorRing`, `gEll`, `drawAim`, `drawSkills`, `drawSkillFx` | 2D 고리의 세로 비율을 0.45로 조정하고 앞뒤 테두리를 구분했습니다. 3D는 기존 `GK()`를 사용하고, 중심·도착 섬광을 바닥에서 6px 올렸습니다. |
| 범위 발동·연결체 도착·설치 도착·돌진 종료 | `skillImpact`, `updateSkillShard`, `skillLayers`, `updateSkills`, `updateEffects` | 빛기둥과 한 번 튀는 파편 8개를 추가했습니다. 동시 파편은 최대 40개이며, 움직임 줄이기에서는 파편 4개와 절반 높이의 빛기둥을 사용합니다. |
| 스킬에 맞은 외계인 | `damage`, `alienLook`, `drawAlien` 및 3D 외계인 렌더링 | 0.25초 동안 최대 4px 떠올랐다 내려오며, 바닥 그림자 크기도 높이에 맞춰 바뀝니다. |

새 상수는 `LINK_START_Z`, `LINK_SCALE_Z`, `PILLAR_RISE`, `PILLAR_HEIGHT`, `SKILL_SHARD_LIMIT`, `SKILL_SHARD_GRAVITY`, `SKILL_SHARD_LIFE`, `SKILL_HIT_LIFT_TIME`, `SKILL_HIT_LIFT_HEIGHT`입니다.

요청한 Node 문법 검사와 `git diff --check`를 통과했습니다. 별도 동작 검사에서 포물선 높이, 2D·3D 고리 비율, 파편 반동·상한·만료, 움직임 줄이기를 확인했습니다. 실제 브라우저에서의 화면 확인은 하지 않았습니다.