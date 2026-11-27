# 작업 5 결과

수정 파일은 `src/game.js`, `src/data.js` 두 개입니다. 커밋은 생성하지 않았습니다.

## QA 설계 수정 5개

| 나라·스킬 | 수정 사항 | 위치 |
|---|---|---|
| 프랑스 1 | 조준점에서 장수 쪽으로 꼭짓점을 최대 32px 이동. 문서에 거리 수치가 없어 32px를 적용했습니다. 조준·판정·발동 효과가 같은 위치와 방향을 사용합니다. | `coneOrigin`, `SKILL_FN.area`, `drawAim`, `drawSkillFx` |
| 스웨덴 2 | 원진 도착 시 안쪽에 ×0.3을 한 번 적용합니다. 경계 3회 한도는 별도로 계산합니다. | `updateSkills` 원진 도착·경계 분기 |
| 스위스 1 | 덫을 발동시킨 적의 기존 ×1.2와 주위 적에 대한 50px 내 ×0.5를 적용합니다. | `updateSkills` 덫 분기 |
| 이탈리아 2 | 각 걸음을 목표까지 남은 거리로 제한하고 도착 후 같은 자리에서 나머지 찌르기를 발사합니다. | `updateSkills` 연사 분기 |
| 캐나다 2 | `life` 1.0초. 설치 도착부터 폭발까지의 시간만 끌어당김에 사용합니다. | `SKILL_MOD.canada`, `updateSkills` 소용돌이 분기 |

## 새 연출 45개

| 나라 | 번호 | 새 이름 | 코드 도형과 동작 | 함수 |
|---|---|---|---|---|
| 룩셈부르크 | 1번 | 눈먼 기사왕의 돌격 | 은빛 눈가림 띠·삼각기 2개 | HERO_LOOK.luxembourg |
| 룩셈부르크 | 2번 | 사자 깃발 포효 | 머리 위 깃발·전방 반원 물결 3겹 | HERO_LOOK.luxembourg / drawSkillFx |
| 아일랜드 | 1번 | 광전사 회오리 | 좌우 흔들림·붉은 구심 나선 3줄 | heroBody / drawSkillFx / drawLinkArt |
| 아일랜드 | 2번 | 게 볼그 돌격 | 미늘창·꺾이는 두 지점의 미늘 섬광 | HERO_LOOK.ireland / HERO_EFFECT.barbs |
| 스위스 | 1번 | 알프스 미늘창 덫 | 솟는 미늘창 5개·폭발 다발·50px 고리 | ZONE_LOOK.trap / HERO_EFFECT.halberdBurst |
| 스위스 | 2번 | 사과 과녁 석궁 | 석궁·관통 화살·적마다 빨강/흰 과녁 | HERO_LOOK.switzerland / HERO_SHOT.pierce / HERO_EFFECT.appleTarget |
| 미국 | 1번 | 랜턴 신호탄 튕김 | 등불·금빛 탄·벽 반사 등불 섬광 | HERO_LOOK.usa / HERO_SHOT.bounce / HERO_EFFECT.lanternBounce |
| 미국 | 2번 | 자유의 종 파동 | 금빛 종·흔들림·박자 고리 | ZONE_LOOK.rings / drawLinkArt |
| 네덜란드 | 1번 | 함포 일제 사격 | 대포 5개·차례로 포구 섬광·1.6배 마지막 탄 | HERO_LOOK.netherlands / HERO_SHOT.lastHit |
| 네덜란드 | 2번 | 바닷바람 순간 돌파 | 출발/도착 돛 모양 바람 | HERO_EFFECT.sail |
| 덴마크 | 1번 | 잠든 거인의 표식 돌격 | 돌 거인과 그림자·방패 표식 | HERO_LOOK.denmark / drawSkills |
| 덴마크 | 2번 | 크론보르 수호 회전 | 회전 성벽 돌 6개·확장 시 1.3배 돌 | drawSkillFx |
| 오스트리아 | 1번 | 용기병 돌격 | 전방 기울기·바닥 말발굽 | heroBody / drawSkills |
| 오스트리아 | 2번 | 빈 성벽 이중 베기 | 시간차 안팎 고리·성벽 톱니 | HERO_LOOK.austria / drawSkillFx |
| 독일 | 1번 | 강철 손 회전베기 | 쇠 의수 섬광·대검 원호 | HERO_LOOK.germany / drawSkillFx |
| 독일 | 2번 | 강철 손 내려찍기 | 쇠 주먹·균열선 8개·충격 파편 | HERO_LOOK.germany / drawSkillFx / skillImpact |
| 스웨덴 | 1번 | 캐롤린 돌격 대형 | 파란 제복 덧칠 분신 2명 | drawGhost |
| 스웨덴 | 2번 | 룬스톤 원진 | 순차 상승 룬스톤 6개·경계선 | ZONE_LOOK.ring6 / drawLinkArt |
| 핀란드 | 1번 | 히이시 엘크 스키 질주 | 낮은 자세·스키 두 줄·눈보라 | heroBody / HERO_LOOK.finland |
| 핀란드 | 2번 | 칸텔레 노래 함정 | 칸텔레·연결 음파 3줄·착지 후 파동 | HERO_LOOK.finland / drawLinkArt / ZONE_LOOK.slow |
| 프랑스 | 1번 | 백합 깃발 휩쓸기 | 휘두르는 깃발·부채꼴·금색 꽃잎 점 5개 | HERO_LOOK.france / coneShape / drawSkillFx |
| 프랑스 | 2번 | 오를레앙 돌파 | 벽 충돌 별 섬광·갈색 파편 | updateSkills / drawSkillFx / skillImpact |
| 이탈리아 | 1번 | 군단 진영 | 네 모서리 방패벽과 가운데로 향하는 창 | HERO_EFFECT.command / ZONE_LOOK.corners |
| 이탈리아 | 2번 | 자마 군단 전진 찌르기 | 앞 방패·찌르기 삼각 섬광 | HERO_LOOK.italy / HERO_SHOT.stepThrust |
| 스페인 | 1번 | 티소나 일섬 | 가는 금빛 칼 선·금빛 십자 명중 섬광 | HERO_LOOK.spain / drawSkillFx |
| 스페인 | 2번 | 콜라다 회전베기 | 은빛 회전 원호 | SKILL_FN.area |
| 체코 | 1번 | 전차 요새 | 방패 내려놓기·수레 6개와 바퀴 | HERO_EFFECT.shieldPlant / ZONE_LOOK.half |
| 체코 | 2번 | 후스 도리깨 | 바퀴마다 커지는 사슬 점선·둥근 철퇴 | HERO_EFFECT.flail |
| 리투아니아 | 1번 | 게디미나스 기둥 창돌격 | 세로 금빛 선 방패·긴 창끝 | HERO_LOOK.lithuania |
| 리투아니아 | 2번 | 기마 투창 3연 | 세 차례 상승·낙하 창·바닥 그림자 | SKILL_FN.barrage / drawSkillFx |
| 일본 | 1번 | 노 목검 일격 | 갈색 노 목검·두 번째 베기 선 | HERO_LOOK.japan / drawSkillFx |
| 일본 | 2번 | 이도류 삼연 베기 | 칼 두 자루·도착마다 X자 섬광 | HERO_LOOK.japan / drawSkillFx |
| 포르투갈 | 2번 | 루시타니아 창 찌르기 | 목동 창 찌르기·양옆 물방울 | HERO_SHOT.splash / drawSkillFx |
| 폴란드 | 2번 | 검은 기사 장창 휩쓸기 | 검은 갑옷 가슴판·기존 회전 장창 | HERO_LOOK.poland / SKILL_FN.area |
| 헝가리 | 1번 | 후사르 사브르 연격 | 사방 8회 흰색/붉은색 칼빛 원호 | drawSkillFx |
| 헝가리 | 2번 | 맷돌 장사 돌진 | 구멍 난 돌 맷돌·종료 때 바닥 고리 | HERO_LOOK.hungary / HERO_EFFECT.millEnd |
| 슬로바키아 | 1번 | 타트라 도끼 내려찍기 | 도끼·산 바위 균열·회색 파편 | HERO_LOOK.slovakia / drawSkillFx / skillImpact |
| 그리스 | 1번 | 스파르타 팔랑크스 | 청동 방패 5개와 창 5개 | HERO_LOOK.greece / drawSkillFx |
| 그리스 | 2번 | 아킬레우스 창 돌격 | 끝에서 날아가는 금빛 창·높이와 그림자 | HERO_SHOT.spearEnd / drawShotS1 |
| 튀르키예 | 1번 | 코푸즈 칼날 고리 | 직선 날 3개·음파 호 2개 | SKILL_FN.area / HERO_EFFECT.pluck |
| 튀르키예 | 2번 | 서사시 영웅 돌파 | 곡선 돌진 방향을 따라 도는 칼과 곡면 빛 | HERO_LOOK.turkiye |
| 멕시코 | 1번 | 독수리 전사 일격 | 공중 깃털 투구·기울기·착지 원 | HERO_LOOK.mexico / heroBody / drawSkills |
| 멕시코 | 2번 | 마쿠아우이틀 날개 베기 | 시간차 반원·검은 흑요석 삼각 톱니 6개 | drawSkillFx |
| 콜롬비아 | 1번 | 엘도라도 황금 함성 | 머리 위 금가루·금빛 고리 2개·멈춘 적 별 | HERO_LOOK.colombia / drawSkillFx / drawSkills |
| 콜롬비아 | 2번 | 황금 그림자 돌격 | 1초 뒤 달리는 황금빛 분신 | echoEnt / drawGhost |

## 검증과 남은 확인

- 두 JavaScript 파일의 `new Function` 구문 검사와 `git diff --check`를 통과했습니다.
- Node VM에서 QA 5개에 대해 피해, 도착 시점, 경계 한도, 전진 정지를 검증했습니다. 변경된 스킬 45개를 시전하고 Canvas 모의 객체로 렌더링을 실행했습니다.
- Chromium이 `Operation not permitted` 오류로 종료되어 Playwright 캡처, 실제 2D·3D 화면, 모바일 성능은 확인하지 못했습니다.
- 스킬 이름은 문서에 확정된 한국어·영어를 사용합니다. 교체 번역이 없는 언어에서는 새 영어 이름을 표시합니다. 대표 이미지 45장은 기존 `skill/u/` 경로에서 디자인팀 교체를 기다립니다.
- 자세 시트와 기본 시전 동작을 재사용하고 새 소품과 동작을 코드로 보강했습니다. 세부 자세와 타이밍의 디자인 일치 여부는 실제 화면에서 확인이 필요합니다.
