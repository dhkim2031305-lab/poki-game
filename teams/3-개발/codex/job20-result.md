작업 20을 완료했습니다. 게임은 WebGL 3D로만 실행됩니다. WebGL을 초기화할 수 없거나 실행 중 연결이 끊기면 게임을 멈추고 영어 안내 한 줄을 표시합니다. `ui.nowebgl`은 영어와 한국어에 추가했고, [SETUP.md](/home/user/poki-game/SETUP.md:12)에 3D 전용 결정을 기록했습니다.

**삭제한 코드**

- 기존 2D `drawField` 경로 약 80줄을 삭제했습니다. 바닥·벽·방, 화폐, 장수·외계인, 투사체의 2D 배치가 포함됩니다.
- `drawRoomLight`, `drawWallStrip`, `castHero`, `castAlien`, `softShadow`, `drawHero`, `drawAlien`과 전용 상수·원근 계산 약 75줄을 삭제했습니다.
- `drawJumps`, `at2d`, `isGroundSkillFx`, `tintedSkillCell`과 스킬·포탄의 2D 분기를 삭제했습니다. `use3d`, `?render=2d`, 저장 설정의 렌더러 선택, 미리보기 전환 버튼도 제거했습니다.

**유지한 캔버스 그리기**

HUD, 메뉴, 말풍선, 무적 타이머, 조준 원과 범위 표시, 기본 공격·탄환·스킬 효과를 유지했습니다. 3D 빌보드와 바닥 데칼에 쓰이는 캔버스 그리기도 유지했습니다. 피해량·판정·시간표는 기존 3D 경로와 같습니다.

**검증**

- `src/game.js`가 267,191바이트에서 252,409바이트로 **14,782바이트(5.5%), 210줄** 줄었습니다.
- 변경한 JavaScript 5개 파일의 `node --check`와 `git diff --check`를 통과했습니다.
- Node VM에서 WebGL 초기화 실패, 실행 중 컨텍스트 손실, 기존 2D 주소·설정 무시를 확인했습니다. 일반·미리보기 단일 HTML 빌드도 성공했습니다. 두 파일 모두 23.46MB로 기존 16MB 한도 경고가 표시됐습니다. 실행 환경에서 Chromium 시작이 차단되어 실제 화면 검증은 하지 못했습니다.

**2D 모드를 가정하는 기존 테스트 13개**

`teams/3-개발/test/`의 `arrows.js`, `arrive.js`, `bgm.js`, `boost.js`, `controls.js`, `fstat.js`, `quake.js`, `safe.js`, `stick.js`, `tapmove.js`, `tip.js`, `voice.js`, `zone6.js`입니다.