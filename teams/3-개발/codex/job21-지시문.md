# Codex 작업21 — 한국 v7 고침 2개 + 무적 외침 + WebGL 안내·저사양 자동 대응

작업 트리(작업15~20 포함) 위에 이어서. src/game.js · src/render3d.js · src/audio.js · src/i18n.js. 피해·판정·시간표 그대로.

## 1. 거북선 둘레 '감싸는 불꽃' 색 (팀장 점검, k1.png)
- 한국1 거북선 둘레 seq/korea-1(가산 0.8 + 0.3 겹침)이 분홍·보라·파랑 무지개로 보여요. 보라·분홍은 외계인 색이라 금지.
- 원소 기운 aura-water(src/assets/skill/seq/aura-water.webp, 4칸·256·가산, 장수 뒤 층 + 앞 층 0.55) 파일이 있으면 그걸 쓰고, 없으면 korea-1 둘레 불꽃은 그리지 않아요(끔). 가산 합성 겹침으로 분홍이 생기는지 확인.

## 2. 거북선 먼지가 맞은 적을 가림
- korea-dust: 3D는 적 뒤 층(깊이 정렬에서 적보다 뒤), 2D 겹치기면 적보다 먼저 그림. 크기 0.6배, 0.3초 안에 옅어지기 시작(투명도 0.5 이하).
- 맞은 적은 흰 번쩍 1칸(0.05초)으로 먼지 위에서 보이게.

## 3. 무적 버튼 외침 (GDD 0-25, 디자인 76be2ec)
- 무적 버튼(useInvuln) 누르면 AUDIO.voice('assets/sound/shout/<순위2자리>-<나라>-inv.mp3') — 기존 외침과 같은 규칙(같은 외침 0.8초 안 재생 금지, 광고 중 무음, 덕킹).
- 말풍선 "{나라}! 버텨!"(texts invuln.shout — i18n 키가 있으면 사용, 없으면 말풍선은 생략하고 결과에 적기). 방어막 그림은 아직 없음(오면 연결).

## 4. WebGL 안내·저사양 (출시팀 eb7ff4b)
- 작업20의 WebGL 안내 화면에 이유 + 해결 방법(브라우저 업데이트·하드웨어 가속 켜기)을 짧게. 키 ui.nowebgl.title/ui.nowebgl.body (en/ko 임시, 기획팀 정식 문구 오면 교체).
- 저사양 자동 대응: 처음 3초 평균 프레임이 40fps 아래면 그림자 끄기 + 렌더 해상도 배율(pixelRatio) 낮추기(예 0.75), 그래도 30 아래면 0.6. 설정 저장은 하지 않음(매번 측정).

## 결과(-o, 한국어): 바꾼 곳 표, node --check.

## 4-추가 (팀장 2026-11-28 07:26): WebGL 안내 정식 문구
- 키 ui.nowebgl.title · why · fix1 · fix2 · retry (임시 키 title/body 대신). en·ko 값은 teams/1-기획/texts.md에서 그대로 src/i18n.js T.en·T.ko에 넣고, 18개 언어는 teams/1-기획/translations/nowebgl-2026-11-28/<언어>.json → node tools/i18n-merge.js (하위 폴더 지원됨).
- 안내 화면은 WebGL이 없을 때 i18n·폰트만으로 떠야 해요 → 3D 초기화(R3D.init) 전에/실패와 상관없이 그릴 수 있게(2D 캔버스 컨텍스트로 글자만). retry = 다시 시도(새로고침).
