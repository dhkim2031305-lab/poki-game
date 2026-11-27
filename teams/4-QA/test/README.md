# QA 실행 검사 스크립트 (헤드리스 크롬 · Playwright)

먼저 `npm run dev`(8080)를 켜요. `sdk.js`만 빌드한 ZIP을 풀어 다른 포트(예: `python3 -m http.server 8090`)로 띄워요. OUT은 캡처를 넣을 폴더예요.
이 서버는 GPU가 없어 3D가 초당 4~5장이에요. 입력 타이밍 검사는 `?render=2d`로 해요.

| 파일 | 하는 일 | 예 |
|---|---|---|
| `skills60.js` | 30개국 × 스킬 1·2번 실행 → 외계인별 피해(80×F 배수)·제어 시간·무적·남은 횟수. 2d면 커서를 예전과 같은 자리(돌진 앞 260·범위 장수 자리·설치 앞 120)에 둬요 | `node skills60.js OUT 8080 0,16 2d` (나라 번호 0~29) |
| `boss-control.js` | 제어 스킬(핀란드1·리투아니아2·칠레1·콜롬비아1)이 보스에 0.3초 멈춤만 거는지 | `node boss-control.js` |
| `hero-effects.js` | 이탈리아1·캐나다2·뉴질랜드1 이동, 체코1 피해 절반, 프랑스2 벽 충돌 | `node hero-effects.js` |
| `controls.js` | PC 더블클릭·좌우 동시·L ; Space 횟수, 폰 버튼 크기·두 번 누르기 | `node controls.js OUT 8080 2d` |
| `ranged.js` | 30개국 원거리 탄 종류·부메랑 돌아옴 캡처 | `node ranged.js OUT` |
| `economy.js` | 라운드를 강제로 깨며 돈·파산 시점 | `node economy.js OUT 8080 0 10` |
| `shout-edge.js` | 외침 말풍선이 화면 끝에서 잘리는지 캡처 | `node shout-edge.js OUT` |
| `ios.js` | WebGL 없음 → 2D, `?debug=1`, 한 파일 빌드 바깥 요청 | `node ios.js OUT /절대경로/dist/single.html` |
| `sdk.js` | 빌드 ZIP + 가짜 SDK: 호출 순서, 광고 중 무음·입력 막힘, SDK 막힘 | `node sdk.js OUT poki 8090 [block]` |
| `misc.js` | 기록 저장·저장소 막힘·페이지 스크롤 | `node misc.js` |
| `pause.js` | PC 일시정지 Esc만·클릭은 공격·포커스 잃으면 조용히 멈춤, 터치 일시정지 버튼 (GDD 0-14) | `node pause.js` |
| `recheck.js` | 능력치 ???·무적 시간·1위 보정 다시 보기 | `node recheck.js OUT` |
| `new9.js` | 방어 대체: 덴마크1 표식 2배·그리스1 약화 +30%·스웨덴2 테두리 넘을 때만 | `node new9.js` |
| `quake3d.js` | 체코 충격파가 3D·2D에서 보이는지 프레임별 캡처 | `node quake3d.js OUT` |
| `phone-first.js` | 폰 첫 터치 전 화면·치기+쏘기 같이 = 무적·3D PC 더블클릭 | `node phone-first.js OUT` |
| `aim.js` | GDD 0-17 스킬 자리 지정: PC 커서·전장 밖·폰 끌기/취소/톡·유형별·특수 스킬, 조준 표시 캡처 | `node aim.js OUT` |
| `rpad.js` | GDD 0-18 폰 오른쪽 큰 원 + 화살표 4개: 크기·화면 안·HUD·엄지 거리, 손잡이 쏘기, 스킬 톡/꾹/×3/취소, 치기 톡/누름/끌기, 무적, 예전 조작 없음 | `node rpad.js OUT` |
| `multitouch.js` | 두 손가락: 손잡이 민 채 화살표 누르면 쏘기 멈춤·떼면 다시 (PointerEvent 직접) | `node multitouch.js` |
| `safe.js` | 안전 영역: 스킬2 취소 원 화면 안·무적 아래 ≥12px·?safe= 흉내에서 HUD·일시정지 안쪽·화살표 ≥44px | `node safe.js OUT` |
| `smartbot.js` | 자동 봇 밸런스 (smart 잘함·mid 보통·dumb 서툼): 실제 키·마우스 입력, 게임 시간 1/60초씩 빨리 돌림 · 2026-11-25 사용자 요청으로 중간에 멈춤 | `node smartbot.js OUT 8080 0,1 5 smart` |
| `skillprobe.js` | 1라운드에서 스킬 1·2만 번갈아 5번씩 (30개국): 쓸 때마다 처치 환산·피해 배수·맞힌 수·첫 피해까지 시간·이동·무적. 장수 안 맞게·외계인 체력 9999로 측정 | `node skillprobe.js OUT 8080 0,1,2` |
| `skillframes.js` | 스킬을 누른 순간~0.6초를 0.05초 간격 캡처 (3D 기본) + 시각별 시전 상태·피해·흔들림·멈춤 | `node skillframes.js OUT 8080 "14:1:1,14:2:1" 3d` |
| `cannon.js` | 한국2 천자총통: 움직이는 외계인(속도 0·80·120)에 포탄 3발 명중률 + 장수 둘레 확대 캡처 | `node cannon.js OUT` |
| `conegrid.js` | 프랑스1 부채꼴: 목표 둘레 격자 25마리에 본타·빛구슬만·안 맞음 지도 (속도 0·80) | `node conegrid.js 8080 80` |
| `castinv.js` | 시전 중 무적: 외계인을 장수에 붙이고 사격 탄을 쏘며 60개 스킬마다 시전 중 피격 0·끝난 뒤 다시 맞는지 | `node castinv.js 8080 0,1,2` |
| `sheet.py` | 캡처 여러 장을 한 장으로 | `python3 -I sheet.py out.png 6 300 a.png b.png …` |
| `job8a.js` | 60개 스킬 쓰는 순간 번쩍(G.skillFlash) + 목표 둘레 밝기. 세 번째 인자 1이면 예전 game.js(backup)로 바꿔 끼워 비교 | `node job8a.js OUT 8080 0` / `… 1` |
| `job8a-ui.js` | 미리보기 디버그 숨김·5번 톡 토글·출시 빌드에 없음, iOS 소리 시작 실패 흉내, 폰 외침 말풍선 × 오른쪽 버튼 겹침(4화면×3스킬×16자리) | `node job8a-ui.js OUT 8080` (build:single --preview 뒤) |
| `job8a-ui2.js` | 디버그 톡 간격·자리 경계, 소리 실패 뒤 다음 톡 다시 시도 | `node job8a-ui2.js` |
| `job11.js` | 60개 스킬: 쓴 뒤에만 나오는 캔버스 fill·stroke를 game.js 줄별로 셈(코드 도형 남았는지) + 소품(skill/prop) 그림 위치·복제 수·회전·높이 기록 | `node job11.js OUT 8080 [ci,…] [2d]` |
| `cannon6.js` | 한국2 천자총통 6발: 착탄 시각·발마다 피해 배수·가운데/둘레 합계·장수 이동·화포 사라짐 | `node cannon6.js OUT 8080` |
| `prop3d.js` | 소품 3D 빌보드 캡처(0.1·0.25·0.6·1.2초) | `node prop3d.js OUT 8080 14:2,3:2` |
