# Codex 작업 2 — 전투 코드 리뷰 반영 (사용자 "조언 수용해", 2026-11-27)

리뷰 전문: `teams/3-개발/review-4/skill-feel/codex-combat-review.md`. 대상 파일: `src/game.js`만. git commit 금지.
작업 1(스킬 뒤 일반 공격 ①+② `lockNormalAttacks`/`normalAttackLocked`, 연결체 길 피해 `sweepLink`/`updateZoneLink`/`LINK_DMG`)은 이미 들어가 있어요. 그 위에 고쳐요. 스킬 자리(GDD 0-17)·본 피해 수치·판정 범위는 바꾸지 않아요.

## A. 확인된 것 — 반드시 고쳐요
3) 일시정지·광고·사망(부활 대기) 중에도 `G.fx`의 `e.t`가 흘러요(update 안 `for (const e of G.fx) ... e.t += dt`). 전투 효과(kind 'skill', 'ghost', 연결체 'link' 등)와 `G.timers`·판정은 **같은 시계**로: 정지·광고·사망 중엔 둘 다 멈춰요. 사망 시(광고 부활 전) 아직 안 나간 공격(throwM/bowM/swing 예약)과 날아가는 연결체는 함께 정리해요. 메뉴 화면 효과(UI)는 기존대로 흘러도 돼요.
4) `clearInput()`이 `MC.pend`·`MC.mute`·`MC.last`·`buf.melee`·`buf.ranged`를 비우지 않아요 → 비우기. 그리고 라운드 시작(`startRound` 또는 라운드 패널 → play 전환)에서도 `clearInput()` 호출.
5) 설치 구역이 비행 중(`z.t < 0`)일 때 `heroSpd`의 뉴질랜드1 speedZone, `heroDmgMul`의 체코1 half, 외계인 둔화(핀란드2 `z.slow`)가 이미 적용돼요 → **도착 뒤(z.t >= 0)에만** 적용.
6) `NO_AFTER`가 무적 중 평타 `boostSlash`까지 꺼요(평타 쪽 `if (h.boostT > 0 && !reduceMotion && !NO_AFTER)`). 사용자는 **평타 휘두름 호·공속 잔상은 그대로** 두기로 했어요 → 평타 잔상(boostSlash, 기본 던지기 `throwTrail`)은 `NO_AFTER`와 분리해 다시 켜요(새 상수 `BASIC_TRAIL = true`).

## B. 리뷰가 지적했지만 아직 확인 안 된 것 — 코드로 확인하고, 맞으면 고쳐요 (아니면 결과 파일에 "문제 없음 + 이유")
- 폴란드2: `pole` ent update가 매 프레임 `castStart('follow')`를 불러 다른 스킬의 시전 자세·잠금(`pending`)을 덮어요 → 자세만 바꾸는 별도 값(예: `h.poseFollow = {ang, t}`)으로 분리하고 `castStart`/잠금을 건드리지 않게. 헝가리1(arcs8)·스페인2(spinMove)의 follow도 같은 방식으로.
- 스킬 횟수 차감: 입력이 받아들여지면 바로 차감돼요. 시전 대기(`h.cast.pending`)로 실제로 안 나간 경우(예: 사망)엔 되돌려요.
- 이스라엘1(lob): 피해는 그때의 탄 좌표에서 나는데 대표 그림은 목표 좌표 → 발마다 착탄 좌표를 쏠 때 확정(`sh.landX/landY`)하고 탄 궤적·피해·그림이 같은 좌표를 쓰게.
- 일본2(chain3): 예약한 적이 먼저 죽으면 그 순서를 건너뛰어요 → 타격 순간 목표점 근처의 살아 있는 미타격 적으로 다시 고르기. 후보가 처음부터 없으면 대표 그림도 내지 않고 장수가 목표 자리로 한 번 베고 지나가게(기존 blink처럼 hitSeg).
- `h.tip`은 그리기에서 저장한 이전 프레임 값이에요. `tipFlash()`에 좌표도 팁도 없으면 `undefined`가 그라디언트에 들어가요 → 유한한 값이 없으면 장수 손(없으면 h.x, h.y-30)으로 대체.
- 돌진 뒤 90px 그림·분신: 돌진이 끝나는 프레임에 돌진 대표 그림(trail/front)과 NO_AFTER 분신이 함께 사라지게(남는 마지막 표본 없음).
- 범위 스킬 화면 흔들림(`G.shake` 4px)이 타격 전(useSkill 즉시)에 시작돼요 → 실제 발동 순간으로 옮기기.
- 폰 성능(가벼운 것만): 탄 개수 상한(`G.shots` 120개 넘으면 가장 오래된 것 제거), 파편류 상한 유지. 그라디언트 캐시는 손대지 않아도 돼요.

## 공통
- 주석은 한국어 한 줄 끝 주석 스타일.
- 끝나면 `node -e "new Function(require('fs').readFileSync('src/game.js','utf8'))"`.
- 결과 파일에 항목마다 "고침/문제 없음 + 함수 이름" 표로.
