한국 1번 **거북선 돌격**과 2번 **천자총통 포격**을 구현했습니다. 거북선은 시전 0.22초 뒤 돌진하고, 정지 0.12초 뒤 전방 90°에 연기 피해를 줍니다. 천자총통은 세 발을 0.15·0.35·0.55초에 발사하고, 포탄 경로 피해는 적마다 시전당 한 번 적용합니다.

| 구분 | 변경 내용 |
|---|---|
| 변경 함수 | `countryAssets`, `castPose`, `useSkill`, `updateSkills`, `skillImpact`, `drawSkills`, `drawSkillFx`, `drawHero8`, `drawWeapon`, `linkArtPath`, `updateZoneLink`, `drawField`, `shakeOffset`과 `SKILL_FN`의 돌진·범위·설치 처리 |
| 추가 함수 | `startCannon`, `endTurtle`, `drawCannon`, `drawTurtle`, `skillSequence`, `drawSkillStamp`, `castBody`, `cannonAngle`, `cannonRecoil` |
| 추가 상수 | `TURTLE`, `CANNON`, `POSE_TYPE`, `POSE_HAND` |
| 삭제 함수·효과 | `drawHak`, `hakPath`, `hakFly`, `hakHit`, 학익진 전용 분기 |
| 데이터 | `SKILLS[14]`를 `dash`, `SKILLS2[14]`를 `area`로 변경하고 `SKILL_MOD.korea`에 지정된 피해 배율과 반지름 적용 |

두 파일의 문법 검사와 `git diff --check`를 통과했습니다. 모의 Canvas 테스트에서 발사·착탄 시점, 피해, 일시정지, 움직임 줄이기, 자세 칸 선택, `ellipse` 인자 7개를 확인했습니다. 실제 브라우저에서의 시각 검수는 하지 않았습니다.

[src/game.js](/home/user/poki-game/src/game.js)와 [src/data.js](/home/user/poki-game/src/data.js)만 수정했습니다. 커밋 없이 작업을 마쳤으며, 변경 목록은 별도 파일 대신 위 표에 담았습니다.