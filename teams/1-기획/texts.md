# 번역 문구표 (기획팀)

> 상태: **확정 (2026-11-25, 사용자 "전부 동의")** · 원문은 한국어예요(제목만 영어). 번역은 이 표를 기준으로 해요.
> **영어 69줄 모두 들어 있어요 (2026-11-25, 스킬 이름 30줄 추가).** 다른 19개 언어는 한국어와 영어를 함께 보고 번역해요. 제목 번역도 번역 단계에서 19개 언어로 만들어요.
> **영어는 꼭 있어야 해요** (설정 Language에서 영어를 고를 수 있어야 하고, CrazyGames·GameDistribution 정책도 영어를 요구해요).
> 언어 20개: 영어, 프랑스어, 독일어, 네덜란드어, 덴마크어, 스웨덴어, 핀란드어, 이탈리아어, 한국어, 스페인어, 체코어, 히브리어, 리투아니아어, 일본어, 포르투갈어, 폴란드어, 헝가리어, 슬로바키아어, 그리스어, 튀르키예어
> 번역 검수: GPT 1차 번역 → Gemini 역번역 대조 → 가능하면 원어민 확인 (GDD 5-1)

## 규칙
- `{n}`, `{나라}`는 게임이 채우는 칸이에요. 번역할 때 그대로 둬요. `{나라}`에는 그 나라 언어로 된 나라 이름이 들어가요.
- 버튼은 아이콘으로도 알아볼 수 있어야 해요. 글자가 길어지면 줄이는 쪽을 택해요.
- 말투: 라운드 클리어는 아주 밝게, 엔딩·파산은 담담하고 비꼬듯이 써요. **나라를 탓하지 않고 구조(출발선·돈)를 말해요.** "가난한 나라·부자 나라" 대신 "돈이 적은/많은 나라"라고 써요. 나라 이름에는 부정적인 말을 붙이지 않아요.
- 스킬 외침은 욕설 없이 순하게 써요. 목소리도 20개 언어로 필요해요.

## 문구 (69줄)
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
| `ui.08` | 1인당 GDP(PPP) · OECD 2024 | GDP per capita (PPP) · OECD 2024 | 나라 카드 출처 표시 | 확정 |
| `round.clear.1` | 완벽해요! 세상은 정말 아름다워요! | Perfect! The world is truly beautiful! | 라운드 클리어 (무작위) | 확정 |
| `round.clear.2` | 당신은 뭐든 할 수 있어요! | You can do anything! | 라운드 클리어 (무작위) | 확정 |
| `end.unfair` | …하지만 인생은 불공평해요. | …But life isn't fair. | 6라운드 클리어 뒤, 장수가 쓰러지기 직전 | 확정 |
| `end.after.01` | 쉽게 깼네요. 이번엔 어려운 나라로 해 보세요. | That was easy. Try a harder country next time. | 장수가 쓰러진 뒤 (10개 중 무작위) | 확정 |
| `end.after.02` | 축하해요. 좋은 나라를 골랐네요. 그게 실력은 아니지만요. | Congrats. You picked a good country. That's not skill, though. | 장수가 쓰러진 뒤 (10개 중 무작위) | 확정 |
| `end.after.03` | 어떤 나라는 같은 맵에서 3라운드도 못 가요. 한번 해 볼래요? | Some countries can't even reach Round 3 on the same map. Want to try? | 장수가 쓰러진 뒤 (10개 중 무작위) | 확정 |
| `end.after.04` | 잘했어요. 출발선이 좋았으니까요. | Well done. You had a good starting line. | 장수가 쓰러진 뒤 (10개 중 무작위) | 확정 |
| `end.after.05` | 이번엔 돈이 적은 나라로 해 보세요. 같은 외계인이에요. | Try a country with less money next. Same aliens. | 장수가 쓰러진 뒤 (10개 중 무작위) | 확정 |
| `end.after.06` | 쉬웠죠? 모두에게 쉬운 건 아니에요. | Easy, right? It isn't easy for everyone. | 장수가 쓰러진 뒤 (10개 중 무작위) | 확정 |
| `end.after.07` | 돈이 적은 나라로도 깰 수 있을까요? 직접 확인해 보세요. | Can you clear it with a country that has less money? See for yourself. | 장수가 쓰러진 뒤 (10개 중 무작위) | 확정 |
| `end.after.08` | 당신이 잘한 걸까요, 나라가 잘산 걸까요? | Was it you, or was it your country's wealth? | 장수가 쓰러진 뒤 (10개 중 무작위) | 확정 |
| `end.after.09` | 같은 게임인데 다른 나라는 왜 어려울까요? 골라 보면 알아요. | Same game, so why is it harder for other countries? Pick one and find out. | 장수가 쓰러진 뒤 (10개 중 무작위) | 확정 |
| `end.after.10` | 이긴 건 맞아요. 공평했던 건 아니고요. | You won. It just wasn't fair. | 장수가 쓰러진 뒤 (10개 중 무작위) | 확정 |
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
| `skill.shout` | {나라}! {스킬}! | {country}! {skill}! | 스킬 쓸 때 외침 · 글자 + 목소리 · {스킬}에 아래 스킬 이름이 들어가요 | 확정 (2026-11-25 바뀜) |
| `skill.name.01` | 사자 문장 돌격 | Lion Crest Charge | 룩셈부르크 스킬 이름 (돌진) | [제안·승인] |
| `skill.name.02` | 회오리 도끼 | Whirlwind Axe | 아일랜드 스킬 이름 (범위) | [제안·승인] |
| `skill.name.03` | 창벽 | Pike Wall | 스위스 스킬 이름 (방어) | [제안·승인] |
| `skill.name.04` | 에너지 난사 | Energy Barrage | 미국 스킬 이름 (연사) | [제안·승인] |
| `skill.name.05` | 연속 찌르기 | Flurry Thrust | 네덜란드 스킬 이름 (연사) | [제안·승인] |
| `skill.name.06` | 방패벽 | Shield Wall | 덴마크 스킬 이름 (방어) | [제안·승인] |
| `skill.name.07` | 기병 돌격 | Cavalry Charge | 오스트리아 스킬 이름 (돌진) | [제안·승인] |
| `skill.name.08` | 부메랑 투척 | Boomerang Throw | 호주 스킬 이름 (연사) | [제안·승인] |
| `skill.name.09` | 대검 회전베기 | Greatsword Spin | 독일 스킬 이름 (범위) | [제안·승인] |
| `skill.name.10` | 돌격 대형 | Charge Formation | 스웨덴 스킬 이름 (돌진) | [제안·승인] |
| `skill.name.11` | 도끼 던지기 | Axe Toss | 캐나다 스킬 이름 (연사) | [제안·승인] |
| `skill.name.12` | 설원 질주 | Snowfield Dash | 핀란드 스킬 이름 (돌진) | [제안·승인] |
| `skill.name.13` | 기병검 휩쓸기 | Saber Sweep | 프랑스 스킬 이름 (범위) | [제안·승인] |
| `skill.name.14` | 거북 대형 | Tortoise Formation | 이탈리아 스킬 이름 (방어) | [제안·승인] |
| `skill.name.15` | 화살비 | Arrow Rain | 한국 스킬 이름 (설치) | [제안·승인] |
| `skill.name.16` | 일섬 | Single Flash | 스페인 스킬 이름 (돌진) | [제안·승인] |
| `skill.name.17` | 방패 진지 | Shield Fort | 체코 스킬 이름 (설치) | [제안·승인] |
| `skill.name.18` | 투석 연사 | Sling Volley | 이스라엘 스킬 이름 (연사) | [제안·승인] |
| `skill.name.19` | 기마 창돌격 | Mounted Lance Charge | 리투아니아 스킬 이름 (돌진) | [제안·승인] |
| `skill.name.20` | 은빛 고사리 결계 | Silver Fern Ward | 뉴질랜드 스킬 이름 (설치) | [제안·승인] |
| `skill.name.21` | 발도술 돌진 | Quickdraw Dash | 일본 스킬 이름 (돌진) | [제안·승인] |
| `skill.name.22` | 항해의 바람 | Sailing Wind | 포르투갈 스킬 이름 (범위) | [제안·승인] |
| `skill.name.23` | 날개 기병 돌격 | Winged Cavalry Charge | 폴란드 스킬 이름 (돌진) | [제안·승인] |
| `skill.name.24` | 사브르 연격 | Saber Combo | 헝가리 스킬 이름 (연사) | [제안·승인] |
| `skill.name.25` | 산악 도끼 내려찍기 | Mountain Axe Slam | 슬로바키아 스킬 이름 (범위) | [제안·승인] |
| `skill.name.26` | 방패 밀치기 | Shield Bash | 그리스 스킬 이름 (방어) | [제안·승인] |
| `skill.name.27` | 곡도 회전베기 | Scimitar Spin | 튀르키예 스킬 이름 (범위) | [제안·승인] |
| `skill.name.28` | 산바람 | Mountain Gale | 칠레 스킬 이름 (범위) | [제안·승인] |
| `skill.name.29` | 독수리 일격 | Eagle Strike | 멕시코 스킬 이름 (돌진) | [제안·승인] |
| `skill.name.30` | 함성 | Battle Cry | 콜롬비아 스킬 이름 (범위) | [제안·승인] |

## 나라 이름 (30개)
- 각 나라 이름은 그 나라 언어로만 보여 줘요. 예: 한국 → 대한민국/한국, 일본 → 日本.
- 목록은 `balance.md`의 "시작 돈" 표를 따라요.
