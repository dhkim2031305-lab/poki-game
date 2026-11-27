# 번역 문구표 (기획팀)

> 상태: **확정 (2026-11-25, 사용자 "전부 동의")** · 원문은 한국어예요(제목만 영어). 번역은 이 표를 기준으로 해요.
> **영어 99줄 모두 들어 있어요 (2026-11-25, 1번·2번 스킬 이름 포함).** 다른 19개 언어는 한국어와 영어를 함께 보고 번역해요. 제목 번역도 번역 단계에서 19개 언어로 만들어요.
> **영어는 꼭 있어야 해요** (설정 Language에서 영어를 고를 수 있어야 하고, CrazyGames·GameDistribution 정책도 영어를 요구해요).
> 언어 20개: 영어, 프랑스어, 독일어, 네덜란드어, 덴마크어, 스웨덴어, 핀란드어, 이탈리아어, 한국어, 스페인어, 체코어, 히브리어, 리투아니아어, 일본어, 포르투갈어, 폴란드어, 헝가리어, 슬로바키아어, 그리스어, 튀르키예어
> 번역 검수: GPT 1차 번역 → Gemini 역번역 대조 → 가능하면 원어민 확인 (GDD 5-1)
> **18개 언어 번역 완료 (GPT 1차, 2026-11-26)**: `teams/1-기획/translations/<언어>.json` · 키 119개·자리표시자 팀장 점검 · 기획팀 점검 `translations/기획팀-점검.md` · Gemini 역번역은 일부 언어만 (아래 점검 파일)

## 규칙
- `skill2.shout.*`는 원문 열에 **그 나라 말 외침**을, 영어 열에 **한국어 뜻**을 적었어요. 번역하지 않고 그 나라 말 그대로 써요. 2026-11-25에 검수했어요. 고칠 건 없었어요. 원어민 확인은 아직이에요. 선택해서 바꿀 만한 안은 아래 "2번 외침 선택안"에 있어요.
- `{n}`, `{나라}`는 게임이 채우는 칸이에요. 번역할 때 그대로 둬요. `{나라}`에는 그 나라 언어로 된 나라 이름이 들어가요.
- 버튼은 아이콘으로도 알아볼 수 있어야 해요. 글자가 길어지면 줄이는 쪽을 택해요.
- 말투: 라운드 클리어는 아주 밝게, 엔딩·파산은 담담하고 비꼬듯이 써요. **나라를 탓하지 않고 구조(출발선·돈)를 말해요.** "가난한 나라·부자 나라" 대신 "돈이 적은/많은 나라"라고 써요. 나라 이름에는 부정적인 말을 붙이지 않아요.
- 스킬 외침은 욕설 없이 순하게 써요. 목소리도 20개 언어로 필요해요.

## 문구 (131줄)
| ID | 원문 (한국어) | 영어 | 나오는 곳 | 상태 |
|---|---|---|---|---|
| `title` | A World Where Only the Strong Survive | A World Where Only the Strong Survive | 시작 화면 제목 (영어 원문, 나라마다 번역) | 확정 |
| `ui.01` | 시작 | Start | 시작 화면 버튼 | 확정 |
| `ui.02` | 나라 고르기 | Choose a Country | 나라 선택 화면 제목 | 확정 |
| `ui.03` | 라운드 {n} | Round {n} | 라운드 시작 표시 | 확정 |
| `ui.04` | 남은 외계인 {n} | Aliens left: {n} | 플레이 화면 위쪽 | 확정 |
| `ui.05` | 다시하기 | Restart | 결과 화면 버튼 | 확정 |
| `ui.06` | 광고 보고 이어하기 | Watch an ad to continue | 실패·파산 화면 버튼 | 확정 |
| `ui.07` | 파산 | Bankrupt | 파산 화면 제목 | 확정 |
| `ui.09` | 설정 | Settings | 설정 버튼·화면 제목 | 확정 |
| `ui.10` | Language | Language | 설정 화면 맨 위 (모든 언어에서 영어 그대로 + 지구본 아이콘) | 확정 |
| `ui.08` | 1인당 GDP(PPP) · OECD 2024 | GDP per capita (PPP) · OECD 2024 | ~~나라 카드 출처 표시~~ → 화면에서 가림(GDD 0-13). 게임 설명 페이지용으로만 남겨요 | 확정 |
| `x.keys` | WASD 이동 · 클릭/J 치기 · 우클릭/K 쏘기 · 우클릭 두 번/L 스킬1 · 클릭 두 번/; 스킬2 · 양쪽 동시/Space 무적 · ESC 일시정지 | WASD move · Click/J strike · Right-click/K ranged · Right ×2/L skill 1 · Left ×2/; skill 2 · Both/Space invincible · ESC pause | PC 조작 안내 (폰에서는 숨김) · 코드 `src/i18n.js` 같은 키. 영어는 나라와 상관없는 말로 써요("throw" 대신 "ranged", "guard" 대신 "invincible"). 일시정지는 Esc만(GDD 0-14) | 확정 (2026-11-25, QA 973fdd4 A3) |
| `x.cancel` | 취소 | Cancel | 스킬 끌어서 쓰기의 취소 원 안 글자 (GDD 0-17, 개발 2189380) | 확정 (2026-11-25) |
| `round.clear.1` | 완벽해요! 세상은 정말 아름다워요! | Perfect! The world is truly beautiful! | 라운드 클리어 (무작위) | 확정 |
| `round.clear.2` | 당신은 뭐든 할 수 있어요! | You can do anything! | 라운드 클리어 (무작위) | 확정 |
| `end.unfair` | …하지만 인생은 불공평해요. | …But life isn't fair. | ~~6라운드 클리어 뒤, 장수가 쓰러지기 직전~~ → **안 써요** (2026-11-26 끝 화면 바뀜, GDD 0-4) | 안 씀 |
| `end.clear.title` | 클리어! | Clear! | 1위가 6라운드를 깼을 때 제목. 장수는 안 쓰러지고, 아래에 `end.after.*` 10개 중 하나 (GDD 0-4 "가") | 확정 (2026-11-26) |
| `end.far.title` | 여기까지 | This Far | 2~15위가 6라운드를 깼을 때 제목 (클리어도 실패도 아님) | 확정 (2026-11-26) |
| `end.far.01` | 당신은 뭐든 할 수 있어요! …이 나라로는 빼고요. 진짜 클리어는 다른 나라로 해 보세요. | You can do anything! …Except with this country. For a real clear, try another one. | 2~15위 6라운드 클리어 화면 문구. 장수는 서 있어요 (GDD 0-4 "2번") | 확정 (2026-11-26) · 18개 언어는 번역 단계 |
| `end.time` | 걸린 시간 {t}초 | Time {t}s | 6라운드를 깬 끝 화면(클리어!·여기까지)에 걸린 시간, **60초 아래일 때**. {t} = 소수 첫째 자리 (예: 42.3) · 파산 화면엔 없음 (GDD 0-4) | 확정 (2026-11-26) · 60초 아래일 때 |
| `end.time.min` | 걸린 시간 {m}분 {s}초 | Time {m}m {s}s | 60초가 넘을 때 (표시 방식 "나"). {s} = 소수 첫째 자리 (예: 2분 22.3초) · 60초 아래는 `end.time` | 확정 (2026-11-26, "나") |
| `end.after.01` | 쉽게 깼네요. 이번엔 어려운 나라로 해 보세요. | That was easy. Try a harder country next time. | 1위 클리어 화면 아래 (10개 중 무작위) | 확정 |
| `end.after.02` | 축하해요. 좋은 나라를 골랐네요. 그게 실력은 아니지만요. | Congrats. You picked a good country. That's not skill, though. | 1위 클리어 화면 아래 (10개 중 무작위) | 확정 |
| `end.after.03` | 어떤 나라는 같은 맵에서 3라운드도 못 가요. 한번 해 볼래요? | Some countries can't even reach Round 3 on the same map. Want to try? | 1위 클리어 화면 아래 (10개 중 무작위) | 확정 |
| `end.after.04` | 잘했어요. 출발선이 좋았으니까요. | Well done. You had a good starting line. | 1위 클리어 화면 아래 (10개 중 무작위) | 확정 |
| `end.after.05` | 이번엔 돈이 적은 나라로 해 보세요. 같은 외계인이에요. | Try a country with less money next. Same aliens. | 1위 클리어 화면 아래 (10개 중 무작위) | 확정 |
| `end.after.06` | 쉬웠죠? 모두에게 쉬운 건 아니에요. | Easy, right? It isn't easy for everyone. | 1위 클리어 화면 아래 (10개 중 무작위) | 확정 |
| `end.after.07` | 돈이 적은 나라로도 깰 수 있을까요? 직접 확인해 보세요. | Can you clear it with a country that has less money? See for yourself. | 1위 클리어 화면 아래 (10개 중 무작위) | 확정 |
| `end.after.08` | 당신이 잘한 걸까요, 나라가 잘산 걸까요? | Was it you, or was it your country's wealth? | 1위 클리어 화면 아래 (10개 중 무작위) | 확정 |
| `end.after.09` | 같은 게임인데 다른 나라는 왜 어려울까요? 골라 보면 알아요. | Same game, so why is it harder for other countries? Pick one and find out. | 1위 클리어 화면 아래 (10개 중 무작위) | 확정 |
| `end.after.10` | 이긴 건 맞아요. 공평했던 건 아니고요. | You won. It just wasn't fair. | 1위 클리어 화면 아래 (10개 중 무작위) | 확정 |
| `bankrupt.first.01` | 아… 잘난 사람들만 잘나가는 세상. | Ah… a world where only the privileged get ahead. | 첫 파산 (10개 중 무작위) | 확정 |
| `bankrupt.first.02` | 열심히 했는데… 돈이 없네. | I worked so hard… and still no money. | 첫 파산 (10개 중 무작위) | 확정 |
| `bankrupt.first.03` | 출발선부터 달랐던 거야. | The starting line was different from the start. | 첫 파산 (10개 중 무작위) | 확정 |
| `bankrupt.first.04` | 가진 사람은 더 가지고, 없는 사람은 더 없고. | Those who have get more; those who don't, get less. | 첫 파산 (10개 중 무작위) | 확정 |
| `bankrupt.first.05` | 노력만으론 안 되는 게 있더라. | Some things effort alone can't fix. | 첫 파산 (10개 중 무작위) | 확정 |
| `bankrupt.first.06` | 돈이 많은 나라였으면 지금쯤 깼겠지? | With a richer country, I'd have cleared it by now. | 첫 파산 (10개 중 무작위) | 확정 |
| `bankrupt.first.07` | 세상은 원래 이런 거야. | That's just how the world is. | 첫 파산 (10개 중 무작위) | 확정 |
| `bankrupt.first.08` | 같은 외계인인데… 왜 나만 힘들어? | Same aliens… so why is it only hard for me? | 첫 파산 (10개 중 무작위) | 확정 |
| `bankrupt.first.09` | 돈 없으면 영웅도 못 해. | No money, no hero. | 첫 파산 (10개 중 무작위) | 확정 |
| `bankrupt.first.10` | 역시 인생은 공평하지 않아. | Life really isn't fair. | 첫 파산 (10개 중 무작위) | 확정 |
| `bankrupt.again.01` | 또 광고 보게? | Another ad? | 두 번째 파산부터 (3개 중 무작위) | 확정 |
| `bankrupt.again.02` | 광고 본다고 부자 되는 거 아니에요. | Watching ads won't make you rich. | 두 번째 파산부터 (3개 중 무작위) | 확정 |
| `bankrupt.again.03` | 통장은 그대로예요. | Your bank balance hasn't changed. | 두 번째 파산부터 (3개 중 무작위) | 확정 |
| `continue.ad` | 이런다고 없던 돈이 생길까? | Think this will make money appear out of nowhere? | 광고를 보고 이어 갈 때 | 확정 |
| `skill.shout` | (나라별) `skills.md` "skill-shout" 표의 그 나라 말 | (나라별, 번역 안 함) | 스킬 쓸 때 외침 · 글자 + 목소리 · **번역하지 않고 그 나라 말 그대로** 보여 줘요. 다른 언어 설정에서는 한 줄 뜻풀이를 작게 덧붙일 수 있어요 [제안] | 확정 (2026-11-25, 외침 방식) |
| `skill.name.01` | 사자 문장 돌격 | Lion Crest Charge | 룩셈부르크 스킬 이름 (돌진) | 확정 |
| `skill.name.02` | 회오리 도끼 | Whirlwind Axe | 아일랜드 스킬 이름 (범위) | 확정 |
| `skill.name.03` | 미늘창 덫 | Halberd Trap | 스위스 스킬 이름 (설치) | 확정 (2026-11-25 방어 대체) |
| `skill.name.04` | 에너지 난사 | Energy Barrage | 미국 스킬 이름 (연사) | 확정 |
| `skill.name.05` | 연속 찌르기 | Flurry Thrust | 네덜란드 스킬 이름 (연사) | 확정 |
| `skill.name.06` | 표식 돌격 | Marked Charge | 덴마크 스킬 이름 (돌진) | 확정 (2026-11-25 방어 대체) |
| `skill.name.07` | 기병 돌격 | Cavalry Charge | 오스트리아 스킬 이름 (돌진) | 확정 |
| `skill.name.08` | 부메랑 투척 | Boomerang Throw | 호주 스킬 이름 (연사) | 확정 |
| `skill.name.09` | 대검 회전베기 | Greatsword Spin | 독일 스킬 이름 (범위) | 확정 |
| `skill.name.10` | 돌격 대형 | Charge Formation | 스웨덴 스킬 이름 (돌진) | 확정 |
| `skill.name.11` | 도끼 던지기 | Axe Toss | 캐나다 스킬 이름 (연사) | 확정 |
| `skill.name.12` | 설원 질주 | Snowfield Dash | 핀란드 스킬 이름 (돌진) | 확정 |
| `skill.name.13` | 기병검 휩쓸기 | Saber Sweep | 프랑스 스킬 이름 (범위) | 확정 |
| `skill.name.14` | 로마 진영 | Roman Camp | 이탈리아 스킬 이름 (설치) | 확정 (2026-11-25 방어 대체) |
| `skill.name.15` | 화살비 | Arrow Rain | 한국 스킬 이름 (설치) | 확정 |
| `skill.name.16` | 일섬 | Single Flash | 스페인 스킬 이름 (돌진) | 확정 |
| `skill.name.17` | 방패 진지 | Shield Fort | 체코 스킬 이름 (설치) | 확정 |
| `skill.name.18` | 투석 연사 | Sling Volley | 이스라엘 스킬 이름 (연사) | 확정 |
| `skill.name.19` | 기마 창돌격 | Mounted Lance Charge | 리투아니아 스킬 이름 (돌진) | 확정 |
| `skill.name.20` | 은빛 고사리 결계 | Silver Fern Ward | 뉴질랜드 스킬 이름 (설치) | 확정 |
| `skill.name.21` | 발도술 돌진 | Quickdraw Dash | 일본 스킬 이름 (돌진) | 확정 |
| `skill.name.22` | 항해의 바람 | Sailing Wind | 포르투갈 스킬 이름 (범위) | 확정 |
| `skill.name.23` | 날개 기병 돌격 | Winged Cavalry Charge | 폴란드 스킬 이름 (돌진) | 확정 |
| `skill.name.24` | 사브르 연격 | Saber Combo | 헝가리 스킬 이름 (연사) | 확정 |
| `skill.name.25` | 산악 도끼 내려찍기 | Mountain Axe Slam | 슬로바키아 스킬 이름 (범위) | 확정 |
| `skill.name.26` | 팔랑크스 창끝 | Phalanx Spearpoints | 그리스 스킬 이름 (범위) | 확정 (2026-11-25 방어 대체) |
| `skill.name.27` | 곡도 칼날 고리 | Scimitar Blade Ring | 튀르키예 스킬 이름 (범위) | 확정 (2026-11-25 이름 바꿈) |
| `skill.name.28` | 산바람 | Mountain Gale | 칠레 스킬 이름 (범위) | 확정 |
| `skill.name.29` | 독수리 일격 | Eagle Strike | 멕시코 스킬 이름 (돌진) | 확정 |
| `skill.name.30` | 함성 | Battle Cry | 콜롬비아 스킬 이름 (범위) | 확정 |
| `skill2.name.01` | 사자의 포효 | Lion's Roar | 룩셈부르크 2번 스킬 이름 (범위) | 확정 (2026-11-25 방어 대체) |
| `skill2.name.02` | 도끼 돌격 | Axe Rush | 아일랜드 2번 스킬 이름 (돌진) | 확정 |
| `skill2.name.03` | 미늘창 연속 찌르기 | Halberd Flurry | 스위스 2번 스킬 이름 (연사) | 확정 |
| `skill2.name.04` | 에너지 파동 | Energy Pulse | 미국 2번 스킬 이름 (설치) | 확정 (2026-11-25 이름 바꿈) |
| `skill2.name.05` | 레이피어 돌파 | Rapier Breakthrough | 네덜란드 2번 스킬 이름 (돌진) | 확정 |
| `skill2.name.06` | 도끼 회전 | Axe Spin | 덴마크 2번 스킬 이름 (범위) | 확정 |
| `skill2.name.07` | 기병검 원베기 | Cavalry Circle Slash | 오스트리아 2번 스킬 이름 (범위) | 확정 |
| `skill2.name.08` | 부메랑 회오리 | Boomerang Whirl | 호주 2번 스킬 이름 (설치) | 확정 |
| `skill2.name.09` | 대검 돌파 | Greatsword Breakthrough | 독일 2번 스킬 이름 (돌진) | 확정 |
| `skill2.name.10` | 장검 원진 | Longsword Circle | 스웨덴 2번 스킬 이름 (설치) | 확정 (2026-11-25 방어 대체) |
| `skill2.name.11` | 단풍 소용돌이 | Maple Vortex | 캐나다 2번 스킬 이름 (설치) | 확정 (2026-11-25 방어 대체) |
| `skill2.name.12` | 눈 함정 | Snow Trap | 핀란드 2번 스킬 이름 (설치) | 확정 |
| `skill2.name.13` | 흉갑기병 돌격 | Cuirassier Charge | 프랑스 2번 스킬 이름 (돌진) | 확정 |
| `skill2.name.14` | 글라디우스 연속 찌르기 | Gladius Flurry | 이탈리아 2번 스킬 이름 (연사) | 확정 |
| `skill2.name.15` | 연발 화살 | Rapid Arrows | 한국 2번 스킬 이름 (연사) | 확정 |
| `skill2.name.16` | 톨레도 회전베기 | Toledo Spin Slash | 스페인 2번 스킬 이름 (범위) | 확정 |
| `skill2.name.17` | 도리깨 휘두르기 | Flail Swing | 체코 2번 스킬 이름 (범위) | 확정 |
| `skill2.name.18` | 검 돌격 | Sword Rush | 이스라엘 2번 스킬 이름 (돌진) | 확정 |
| `skill2.name.19` | 투창 3연 | Triple Javelin | 리투아니아 2번 스킬 이름 (연사) | 확정 (2026-11-25 방어 대체) |
| `skill2.name.20` | 고사리 씨앗 질주 | Fern Seed Dash | 뉴질랜드 2번 스킬 이름 (돌진) | 확정 (2026-11-25 이름 바꿈) |
| `skill2.name.21` | 삼연 베기 | Triple Cut | 일본 2번 스킬 이름 (범위) | 확정 (2026-11-25 이름 바꿈) |
| `skill2.name.22` | 물보라 찌르기 | Spray Thrust | 포르투갈 2번 스킬 이름 (연사) | 확정 |
| `skill2.name.23` | 기병창 휩쓸기 | Lance Sweep | 폴란드 2번 스킬 이름 (범위) | 확정 |
| `skill2.name.24` | 경기병 돌진 | Hussar Dash | 헝가리 2번 스킬 이름 (돌진) | 확정 |
| `skill2.name.25` | 발라슈카 연속 던지기 | Valaška Volley | 슬로바키아 2번 스킬 이름 (연사) | 확정 |
| `skill2.name.26` | 창 돌격 | Spear Rush | 그리스 2번 스킬 이름 (돌진) | 확정 |
| `skill2.name.27` | 곡도 돌파 | Scimitar Breakthrough | 튀르키예 2번 스킬 이름 (돌진) | 확정 |
| `skill2.name.28` | 산바람 소용돌이 | Mountain Wind Vortex | 칠레 2번 스킬 이름 (설치) | 확정 |
| `skill2.name.29` | 독수리 날개 베기 | Eagle Wing Slash | 멕시코 2번 스킬 이름 (범위) | 확정 (2026-11-25 방어 대체) |
| `skill2.name.30` | 잔상 돌격 | Afterimage Rush | 콜롬비아 2번 스킬 이름 (돌진) | 확정 (2026-11-25 이름 바꿈) |
| `skill2.shout.01` | 룩셈부르크: Je suis peut-être fauché, mais j'ai ma fierté ! | 돈은 없어도 자존심(체면)은 있다 | 룩셈부르크 2번 스킬 외침 · 의역 | 웹·사전 확인함 (2026-11-25) |
| `skill2.shout.02` | 아일랜드: I may be skint, but I've got my pride! | 돈은 없어도 자존심(체면)은 있다 | 아일랜드 2번 스킬 외침 · 의역 | 웹·사전 확인함 (2026-11-25) |
| `skill2.shout.03` | 스위스: Ich bin vielleicht pleite, aber ich hab meinen Stolz! | 돈은 없어도 자존심(체면)은 있다 | 스위스 2번 스킬 외침 · 의역 | 웹·사전 확인함 (2026-11-25) |
| `skill2.shout.04` | 미국: I may be broke, but I've got my pride! | 돈은 없어도 자존심(체면)은 있다 | 미국 2번 스킬 외침 · 의역 | 웹·사전 확인함 (2026-11-25) |
| `skill2.shout.05` | 네덜란드: Ik ben misschien blut, maar ik heb mijn trots! | 돈은 없어도 자존심(체면)은 있다 | 네덜란드 2번 스킬 외침 · 의역 | 웹·사전 확인함 (2026-11-25) |
| `skill2.shout.06` | 덴마크: Jeg er måske flad, men jeg har min stolthed! | 돈은 없어도 자존심(체면)은 있다 | 덴마크 2번 스킬 외침 · 의역 | 웹·사전 확인함 (2026-11-25) |
| `skill2.shout.07` | 오스트리아: Ich bin vielleicht pleite, aber ich hab meinen Stolz! | 돈은 없어도 자존심(체면)은 있다 | 오스트리아 2번 스킬 외침 · 의역 | 웹·사전 확인함 (2026-11-25) |
| `skill2.shout.08` | 호주: I might be flat broke, but I've got my pride! | 돈은 없어도 자존심(체면)은 있다 | 호주 2번 스킬 외침 · 의역 | 웹·사전 확인함 (2026-11-25) |
| `skill2.shout.09` | 독일: Ich bin vielleicht pleite, aber ich hab meinen Stolz! | 돈은 없어도 자존심(체면)은 있다 | 독일 2번 스킬 외침 · 의역 | 웹·사전 확인함 (2026-11-25) |
| `skill2.shout.10` | 스웨덴: Jag må vara pank, men jag har min stolthet! | 돈은 없어도 자존심(체면)은 있다 | 스웨덴 2번 스킬 외침 · 의역 | 웹·사전 확인함 (2026-11-25) |
| `skill2.shout.11` | 캐나다: I may be broke, but I've got my pride! | 돈은 없어도 자존심(체면)은 있다 | 캐나다 2번 스킬 외침 · 의역 | 웹·사전 확인함 (2026-11-25) |
| `skill2.shout.12` | 핀란드: Rahaa ei ole, mutta ylpeyttä on! | 돈은 없어도 자존심(체면)은 있다 | 핀란드 2번 스킬 외침 · 의역 | 검수 OK · 검색 안 함 |
| `skill2.shout.13` | 프랑스: Je suis peut-être fauché, mais j'ai ma fierté ! | 돈은 없어도 자존심(체면)은 있다 | 프랑스 2번 스킬 외침 · 의역 | 웹·사전 확인함 (2026-11-25) |
| `skill2.shout.14` | 이탈리아: Sarò anche al verde, ma ho il mio orgoglio! | 돈은 없어도 자존심(체면)은 있다 | 이탈리아 2번 스킬 외침 · 의역 | 웹·사전 확인함 (2026-11-25) |
| `skill2.shout.15` | 한국: 내가 돈이 없지 가오가 없나! | 돈은 없어도 자존심(체면)은 있다 | 한국 2번 스킬 외침 · 원문 그대로 ("가오"는 한국어판에만) | 검수 OK · 검색 안 함 |
| `skill2.shout.16` | 스페인: ¡Estaré sin un duro, pero tengo mi orgullo! | 돈은 없어도 자존심(체면)은 있다 | 스페인 2번 스킬 외침 · "sin un duro" = 스페인식 "빈털터리" | 웹·사전 확인함 (2026-11-25) |
| `skill2.shout.17` | 체코: Možná nemám peníze, ale mám svou hrdost! | 돈은 없어도 자존심(체면)은 있다 | 체코 2번 스킬 외침 · 의역 | 검수 OK · 검색 안 함 |
| `skill2.shout.18` | 이스라엘: אולי אין לי כסף, אבל יש לי כבוד עצמי! | 돈은 없어도 자존심(체면)은 있다 | 이스라엘 2번 스킬 외침 · "kavod" = 체면·존중 | 검수 OK · 검색 안 함 |
| `skill2.shout.19` | 리투아니아: Gal ir neturiu pinigų, bet turiu savigarbą! | 돈은 없어도 자존심(체면)은 있다 | 리투아니아 2번 스킬 외침 · "savigarba" = 자존심 | 검수 OK · 검색 안 함 |
| `skill2.shout.20` | 뉴질랜드: I might be flat broke, but I've got my pride! | 돈은 없어도 자존심(체면)은 있다 | 뉴질랜드 2번 스킬 외침 · 의역 | 웹·사전 확인함 (2026-11-25) |
| `skill2.shout.21` | 일본: 金はねえけど、プライドはある！ | 돈은 없어도 자존심(체면)은 있다 | 일본 2번 스킬 외침 · "金" = 돈(구어) | 검수 OK · 검색 안 함 |
| `skill2.shout.22` | 포르투갈: Posso estar sem cheta, mas tenho o meu orgulho! | 돈은 없어도 자존심(체면)은 있다 | 포르투갈 2번 스킬 외침 · "teso" = 포르투갈 구어 "빈털터리" | 웹·사전 확인함 (2026-11-25) |
| `skill2.shout.23` | 폴란드: Może nie mam kasy, ale mam honor! | 돈은 없어도 자존심(체면)은 있다 | 폴란드 2번 스킬 외침 · "honor" = 자존심·명예 | 웹·사전 확인함 (2026-11-25) |
| `skill2.shout.24` | 헝가리: Lehet, hogy nincs pénzem, de büszkeségem az van! | 돈은 없어도 자존심(체면)은 있다 | 헝가리 2번 스킬 외침 · 의역 | 검수 OK · 검색 안 함 |
| `skill2.shout.25` | 슬로바키아: Možno nemám peniaze, ale hrdosť mám! | 돈은 없어도 자존심(체면)은 있다 | 슬로바키아 2번 스킬 외침 · 의역 | 검수 OK · 검색 안 함 |
| `skill2.shout.26` | 그리스: Μπορεί να μην έχω λεφτά, αλλά έχω αξιοπρέπεια! | 돈은 없어도 자존심(체면)은 있다 | 그리스 2번 스킬 외침 · "αξιοπρέπεια" = 체면·품위 | 검수 OK · 검색 안 함 |
| `skill2.shout.27` | 튀르키예: Cebimde beş kuruş yok ama gururum var! | 돈은 없어도 자존심(체면)은 있다 | 튀르키예 2번 스킬 외침 · 의역 | 검수 OK · 검색 안 함 |
| `skill2.shout.28` | 칠레: ¡Estaré sin plata, pero tengo mi orgullo! | 돈은 없어도 자존심(체면)은 있다 | 칠레 2번 스킬 외침 · "sin plata" = 중남미식 "돈 없이" | 검수 OK · 검색 안 함 |
| `skill2.shout.29` | 멕시코: ¡Estaré sin lana, pero tengo mi orgullo! | 돈은 없어도 자존심(체면)은 있다 | 멕시코 2번 스킬 외침 · "sin lana" = 멕시코식 "돈 없이" | 웹·사전 확인함 (2026-11-25) |
| `skill2.shout.30` | 콜롬비아: ¡Estaré sin plata, pero tengo mi orgullo! | 돈은 없어도 자존심(체면)은 있다 | 콜롬비아 2번 스킬 외침 · "sin plata" = 중남미식 | 검수 OK · 검색 안 함 |

## 나라 이름 (30개)
- 각 나라 이름은 그 나라 언어로만 보여 줘요. 예: 한국 → 대한민국/한국, 일본 → 日本.
- 목록은 `balance.md`의 "시작 돈" 표를 따라요.

## 2번 외침 선택안 → ✅ 모두 반영 (2026-11-25, 사용자 "반영")
| 나라 | 지금 | 바꿀 만한 안 | 이유 |
|---|---|---|---|
| 이스라엘 | …יש לי כבוד! | …יש לי כבוד עצמי! | "כבוד"만 쓰면 "명예·존경"으로도 읽혀요. "자존심"이 분명해져요 |
| 포르투갈 | Posso estar teso… | Posso estar sem cheta… | 브라질에서 "teso"가 다른 뜻으로 읽힐 수 있다는 의견이 있어요(확인은 못 했어요) |
| 튀르키예 | Param olmayabilir… | Cebimde beş kuruş yok ama gururum var! | "주머니에 한 푼도 없지만"이라 맛이 살아요 |
| 일본 | 金はなくても… | 金はねえけど、プライドはある！ | 더 거친 장수 말투예요 |
| 아일랜드 / 호주·뉴질랜드 | I may be broke… | I may be skint… / I might be flat broke… | 그 지역 맛이 나요 |
