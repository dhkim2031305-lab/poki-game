3326:  function drawField3D() {
3385:      if (e.t < 0 || e.kind === 'corpse' || e.type === 'skillShake' || hidesBasicEffect(e)) continue;
3406:      at(s.x, s.y, () => drawShotS(s, lift));
3488:  function heroBody() {
3495:  function heroBodyPose(skillPose, tipOnly) {
3594:  function drawWeapon(h, c, px, py, a, alpha) {
3759:  function drawHero8(h, c, mo, skillPose, tipOnly) {
 M src/game.js

exec
/bin/bash -lc "cat > teams/3-개발/codex/job10-result.md <<'EOF'
# 작업 10 결과

30개국의 스킬 1·2번을 모두 검토했다. 현행 스킬 60개 중 13개에서 아래 개별 효과를 교체했다. 시전과 직전에 시작한 평타가 겹치는 경우에는 공통 렌더링에서 휘두르기 자세, 검기, 던지기 잔상과 총구 섬광을 숨긴다.

| 나라 | 스킬 번호 | 이전에 보이던 모양 | 변경 후 모양 | 수정 함수 및 줄 |
| --- | --- | --- | --- | --- |
| 스위스 | 1 | 설치 지점으로 날아가는 창 도형 | "'`switzerland-1`이 기존 포물선을 따라 회전 | [drawLaunch](../../../src/game.js#L2640) |
| 스위스 | 2 | `lance`의 `HERO_SHOT.pierce` 화살촉과 발사 섬광 | `switzerland-2`와 스킬 색 꼬리·섬광 | [drawShotS](../../../src/game.js#L1401) |
| 미국 | 1 | `beam`의 `HERO_SHOT.bounce` 총탄, 발사 섬광과 기본 총탄 명중 효과 | `usa-1`이 튕긴 뒤 새 진행 방향으로 회전. 스킬 색 꼬리·섬광과 공통 명중 효과 | [drawShotS](../../../src/game.js#L1401), [damage](../../../src/game.js#L2707) |
| 네덜란드 | 1 | `streak`·`star`의 `HERO_SHOT.lastHit` 탄과 발사 섬광 | `netherlands-1`과 스킬 색 꼬리·섬광. 마지막 탄의 확대 배율 적용 | [drawShotS](../../../src/game.js#L1401) |
| 호주 | 1 | 기본 부메랑 투사체와 발사 섬광 | `australia-1`이 왕복 방향으로 회전. 스킬 색 꼬리·섬광 | [drawShotS](../../../src/game.js#L1401) |
| 캐나다 | 1 | 비행 중 및 바닥에 박힌 기본 도끼와 발사 섬광 | 비행 중과 바닥에서 `canada-1` 표시. 스킬 색 꼬리·섬광 | [drawShotS](../../../src/game.js#L1401), [axeEnt](../../../src/game.js#L696) |
| 이탈리아 | 2 | `streak`의 `HERO_SHOT.stepThrust` 삼각 창날과 발사 섬광 | `italy-2`와 스킬 색 꼬리·섬광 | [drawShotS](../../../src/game.js#L1401) |
| 이스라엘 | 1 | 기본 투석 탄, 손에 드는 투석기와 발사 섬광 | `israel-1`이 기존 포물선을 따라 회전. 스킬 시전 자세와 스킬 색 꼬리·섬광 | [drawShotS](../../../src/game.js#L1401), [drawWeapon](../../../src/game.js#L3594) |
| 리투아니아 | 2 | 위로 던지는 창살과 내려오는 창끝 도형 | `lithuania-2`가 상승·낙하 방향으로 회전. 낙하지점 표시 유지 | [drawSkillFx](../../../src/game.js#L2400) |
| 포르투갈 | 2 | `streak`의 `HERO_SHOT.splash` 칼날과 발사 섬광 | `portugal-2`와 스킬 색 꼬리·섬광 | [drawShotS](../../../src/game.js#L1401) |
| 헝가리 | 1 | 여덟 방향에 나오는 기본 검기와 비슷한 짧은 원호 | `hungary-1`을 기존 타격 순서대로 여덟 방향에 표시 | [drawSkillFx](../../../src/game.js#L2435) |
| 슬로바키아 | 2 | 적 사이를 튕기는 기본 도끼와 발사 섬광 | `slovakia-2`가 연쇄 도탄의 진행 방향으로 회전. 스킬 색 꼬리·섬광 | [drawShotS](../../../src/game.js#L1401) |
| 그리스 | 2 | 돌진 끝에서 날아가는 `HERO_SHOT.spearEnd` 창날 | `greece-2`가 기존 비행 높이와 진행 방향을 따라 표시 | [drawShotS](../../../src/game.js#L1401) |
| 전 국가 | 1·2 | 시전과 겹치는 평타 몸동작, 나라별 검기, 던지기 잔상 및 기본 총구 섬광 | 시전 자세와 스킬 효과를 표시. 연결 판정에 쓰이는 기존 무기 끝 좌표 유지 | [hidesBasicEffect](../../../src/game.js#L754), [heroBody](../../../src/game.js#L3488), [drawHero8](../../../src/game.js#L3759) |

개별 교체 대상이 없었던 현행 스킬 47개는 다음과 같다.

| 번호 | 검토한 나라 |
| --- | --- |
| 1·2 | 룩셈부르크, 아일랜드, 덴마크, 오스트리아, 독일, 스웨덴, 핀란드, 프랑스, 한국, 스페인, 체코, 뉴질랜드, 일본, 폴란드, 튀르키예, 칠레, 멕시코, 콜롬비아 |
| 1 | 이탈리아, 리투아니아, 포르투갈, 슬로바키아, 그리스 |
| 2 | 미국, 네덜란드, 호주, 캐나다, 이스라엘, 헝가리 |

현행 한국 1·2번은 거북선·천자총통이다. 소스에 남아 있는 이전 화살비 분기에도 스킬 이미지 처리를 적용했다.

## 검증

- `node --check src/game.js` 종료 코드 0.
- `git diff --check` 통과.
- 60개 대표 이미지 파일의 존재를 확인했다. Node에서 모의 캔버스로 60개 번호의 이미지 선택, 진행 방향 회전, 크기 배율, 꼬리 색과 길이 제한, 이미지 누락 시 1.5px 테두리의 두 색 원판, 기본 화살 경로, 시전 중 평타 효과 표시 조건을 확인했다.
- 2D와 3D가 같은 `drawShotS`를 호출하고, 3D에서 `R3D.proj`로 투영한 위치에 그리는 경로를 확인했다. 브라우저에서 실제 플레이 화면은 확인하지 않았다.
EOF
node --check src/game.js && git diff --check && git status --short' in /home/user/poki-game
 succeeded in 0ms:
 M src/game.js
?? "teams/3-\352\260\234\353\260\234/codex/job10-result.md"

codex
30개국 스킬 60개를 검토하고, 미국 1번을 포함한 13개 스킬의 투사체와 효과를 스킬 전용 이미지로 바꿨습니다. 2D와 3D에 같은 그림을 적용하고, 시전 중에 겹치는 평타 검기·잔상·총구 섬광을 숨겼습니다. 피해, 판정, 속도, 튕김, 관통 동작은 유지했습니다.

`node --check src/game.js`와 `git diff --check`를 통과했습니다. 브라우저에서 실제 플레이 화면은 확인하지 않았습니다.

[스킬별 변경 전후 표와 검증 결과](/home/user/poki-game/teams/3-개발/codex/job10-result.md)
tokens used
