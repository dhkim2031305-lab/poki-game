# 출시 전 체크리스트

## 공통
- [ ] 첫 화면이 3초 안에 뜸
- [ ] 폰 세로·가로, PC에서 화면이 잘리지 않음
- [ ] 탭·클릭·스페이스 모두 동작, 페이지 스크롤이나 확대가 안 됨
- [ ] 죽음 → 다시하기 흐름이 끊기지 않음 (10판 연속)
- [ ] 광고 중 소리 꺼짐 + 입력 막힘, 광고 끝나면 소리 복구
- [ ] 광고 차단 상태에서도 게임이 진행됨
- [ ] 최고 기록이 새로고침 뒤에도 남음 (시크릿 모드에서도 에러 없음)
- [ ] 콘솔에 우리 코드 에러 0개
- [ ] 외부 링크 없음, 다른 사이트 로고·이름 없음
- [ ] ZIP 루트에 `index.html`, 용량 확인

## Poki
- [ ] `gameLoadingFinished` → `gameplayStart`/`Stop` 순서가 맞음
- [ ] Poki for Developers 업로드 후 Inspector QA 통과

## CrazyGames
- [ ] `loadingStart`/`loadingStop`, `gameplayStart`/`Stop` 호출
- [ ] CrazyGames 개발자 포털 QA 도구로 광고 확인

## GameDistribution
- [ ] `platforms.config.json`에 gameId 입력됨
- [ ] GD 대시보드 테스트에서 광고 재생 확인

## 일반 웹 (itch.io 등)
- [ ] 보상형 광고 버튼이 숨겨짐
- [ ] itch.io 설정: "This file will be played in the browser", 화면 크기 지정
