# 휴대폰 앱 출시 (앱스토어 · 구글 플레이) — 조사 (2026-11-26)

> 사용자 원문: "휴대폰 게임으로도 내버려라 앱스토어나 머 구글스토어? 그런대에다가도 올려버려"
> 확인 날짜 2026-11-26 · 출처 페이지를 직접 내려받아 원문 대조 (Claude)

## 등록 조건

| 항목 | 애플 앱스토어 | 구글 플레이 |
|---|---|---|
| 개발자 등록비 | **연 99 USD** (지역마다 현지 통화로 다를 수 있음): "The Apple Developer Program is 99 USD per membership year." [A1] | **한 번 25 USD**: "There is a US$25 one-time registration fee." [GP1] |
| 출시 전 시험 | 확인 안 됨 (TestFlight는 선택) | **개인 계정은 비공개 테스트 필수**: "a closed test for their app with a minimum of 12 testers who have been opted in continuously for at least 14 days" (2023-11-13 이후 만든 개인 계정) [GP2] → 테스터 12명을 14일 동안 모아야 해요 |
| 웹 게임을 앱으로 감싸기 | ⚠️ **4.2 최소 기능**: "Your app should include features, content, and UI that elevate it beyond a repackaged website." [A2] → 웹사이트를 그대로 감싼 앱으로 보이면 거절될 수 있어요 | 확인 안 됨 (정책 페이지는 다음에 확인) |
| 게임 파일 | **2.5.2**: 앱은 자기 묶음 안에서 돌아야 하고, 기능을 바꾸는 코드를 내려받으면 안 돼요 [A2] → 게임 파일을 앱 안에 다 넣어야 해요(인터넷 주소를 띄우는 방식 X) | 확인 안 됨 |
| 광고 | 지금 게임은 사이트 SDK(CrazyGames·GameDistribution) 광고라 **앱에선 동작하지 않아요** → 앱용 광고는 아래 "앱 광고: 구글 AdMob" | 같아요 |

## 우리 게임에 걸리는 점
1. **비용**: 애플 연 99 USD + 구글 25 USD(한 번). 사용자가 결제해요.
2. **구글 테스터 12명 · 14일**: 개인 계정이면 출시까지 최소 2주가 더 걸려요. 테스터를 모을 사람(사용자)이 필요해요.
3. **애플 4.2 "웹사이트를 감싼 앱"**: 게임이라 기능은 충분하지만, 앱다운 것(오프라인 플레이, 진동, 앱 아이콘·시작 화면, 홈 막대·노치 처리)이 있어야 안전해요.
4. **아이폰 앱은 Mac이 필요할 가능성이 커요** (앱을 만드는 도구가 Mac용). 공식 확인은 개발팀이 해요 — 확인 안 됨.
5. **광고·결제가 바뀌어요**: 사이트 SDK 대신 앱용 광고 SDK가 필요하고, 그러면 개인정보 안내(추적 동의, 데이터 안전 양식)도 새로 써야 해요.
6. **앱스토어 국가·연령 등급** 설문, **개인정보처리방침 주소**(웹 페이지 하나)가 필요해요 — 세부는 다음 조사.
7. GameDistribution은 "다른 곳과 같은 최신 버전"을 요구해요. 앱도 같은 버전으로 맞춰요. CrazyGames·Poki 독점 조건은 앱스토어를 빼 주니 앱 출시와 안 부딪혀요.

## 앱 광고: 구글 AdMob (2026-11-26 사용자 요청 "구글 애드몹 통해서 광고넣는법도 알아봐 앱으로 만들때")

### 방법 두 가지
| | **가. 네이티브 AdMob (추천 [제안])** | 나. H5 Games Ads (Ad Placement API) |
|---|---|---|
| 하는 법 | 게임은 앱 안 웹 화면에서 돌고, 광고 순간에 게임이 앱에 "광고 띄워" 신호를 보내요 → 앱의 Google Mobile Ads SDK가 전면·보상형 광고를 띄워요 | 게임 안에서 `adBreak()`를 부르고, 앱은 웹 화면을 Google Mobile Ads SDK에 등록하고 AdMob 광고 단위를 넘겨요 |
| 공식 근거 | 보상형·전면 광고 SDK 문서 [AM1] | "you must register the WebView displaying your game with the Google Mobile Ads SDK and pass AdMob ad units via tag parameters" [AM2] |
| 신청·승인 | AdMob 계정만 | **따로 신청 승인 필요**: "It is a by-application product… Account approval is not guaranteed" + "You need an approved AdSense account" [AM3] |
| 애플 2.5.2와 궁합 | 좋아요 (게임 파일을 앱 안에 넣어도 됨) | ⚠️ 구글은 웹 화면에 "network-based URLs"를 쓰고 "Avoid using WebViewAssetLoader"를 권해요 [AM4] → 게임을 인터넷 주소로 띄우는 쪽이라 애플 "앱 안에 다 넣기"와 부딪힐 수 있어요 |
| 우리 코드 | 지금 광고 코드(판 사이·보상형 자리)에 "앱 빌드" 한 갈래만 더하면 돼요 | 같아요 (`adBreak` 갈래) |
| 남는 일 | 앱 포장 도구의 AdMob 연결 플러그인은 대부분 구글 공식이 아니라 개발팀이 골라 확인해야 해요 — 확인 안 됨 | 승인 기다리기 |

### AdMob 규칙 중 우리 게임에 걸리는 것
| 규칙 | 원문 | 우리 상태 |
|---|---|---|
| 전면 광고는 자연스러운 전환 지점에서 | "best placed at natural app transition points" · "Surprising users, presenting the users with too many ads… may lead to an overall poor user experience" [AM5] | 판 사이 광고는 클리어 화면 "다시하기"에서만 (monetization.md) ✅ |
| 보상형은 사용자가 고를 때만 | "must only be served after a user affirmatively and unambiguously opts in" [AM6] | 광고보기 버튼을 눌러야만 ✅ |
| 보상과 할 일을 미리 알리기 | "clear, accurate and conspicuous disclosure of the action(s) required and reward(s) offered prior to each instance" [AM6] | ✅ 적용(사용자 "새로 필요한 거 적용해") → **디자인·개발 인수인계**: 광고보기 버튼에 보상을 적어요 (HP 0: "그 자리에서 이어하기" · 파산: "돈을 조금 받고 다음 라운드로") |
| 안 봐도 정상 이용 | "Skipping the Rewarded Ad… must not impede or interfere with the normal usage" [AM6] | 광고 없는 "다시하기"가 같은 크기로 항상 있어요. 이건 그 자리에서 살아나는 게 아니라 **1라운드부터 처음 다시**예요(사용자 2026-11-26). 광고를 안 봐도 게임은 계속 할 수 있어요 ✅ |
| 개인정보 동의 (유럽 등) | UMP SDK로 "at every app launch using requestConsentInfoUpdate() to check if consent is required" [AM7] | ✅ 적용 → **개발 인수인계**: 앱 빌드에 UMP 동의 창(앱 켤 때마다 확인 + 설정에 개인정보 옵션 입구) |
| app-ads.txt | "You must have a developer website to use app-ads.txt" · 스토어 등록 정보에 개발자 웹사이트를 연결 [AM8] | ✅ 적용 → 개발자 웹사이트가 필요해요. app-ads.txt는 사이트 **맨 위 주소(루트)**에 올려야 해서 itch.io 게임 페이지로는 안 돼요 → 무료 GitHub Pages 개인 주소(`아이디.github.io`) [제안] · 개인정보처리방침 페이지도 같이 둬요 (개발·출시, 앱 출시 때) |

### 사용자가 할 일 (AdMob)
- [ ] AdMob 계정 만들기 (구글 계정 · 지급 정보 · 세금 정보)
- [ ] 앱 등록 → 광고 단위 2개 만들기: 전면(판 사이) · 보상형(이어하기·파산 이어하기)
- [ ] 개발자 웹사이트 정하기 → app-ads.txt 올리기
- [ ] 광고 단위 ID를 개발팀에 전달

### 꼭 지킬 것 (✅ 적용, 사용자 2026-11-26 · 개발 인수인계)
- 개발·시험 중에는 **구글 테스트 광고 ID**로만 시험: "If you don't use the test ad unit ID, Google can suspend your account." [AM1]

### 출처 (모두 2026-11-26 확인)
- **AM1** https://developers.google.com/admob/android/rewarded
- **AM2** https://developers.google.com/ad-placement/docs/example ("Support mobile apps")
- **AM3** https://developers.google.com/ad-placement/docs/signup
- **AM4** https://developers.google.com/admob/android/browser/webview
- **AM5** https://support.google.com/admob/answer/6066980 (Interstitial ad guidance)
- **AM6** https://support.google.com/admob/answer/7313578 (Policies for ad units that offer rewards)
- **AM7** https://developers.google.com/admob/android/privacy (UMP SDK)
- **AM8** https://support.google.com/admob/answer/9363762 (app-ads.txt)

## 순서 (사용자 확정 2026-11-26 "추천방식대로 진행해")
1. 웹 사이트(itch.io → GameDistribution → CrazyGames) 먼저 올려서 반응 보기
2. 그동안 개발팀이 앱 포장 시제품(안드로이드 먼저) → 구글 비공개 테스트 14일 시작
3. 아이폰은 Mac 준비 여부를 보고 나중에

## 출처
- **A1** https://developer.apple.com/help/account/membership/program-enrollment/
- **A2** https://developer.apple.com/app-store/review/guidelines/ (2.5.2, 4.2)
- **GP1** https://support.google.com/googleplay/android-developer/answer/6112435
- **GP2** https://support.google.com/googleplay/android-developer/answer/14151465
