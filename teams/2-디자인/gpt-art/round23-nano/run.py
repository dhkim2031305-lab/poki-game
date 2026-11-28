# 23차: 29개 나라 58개 스킬을 한국 방식으로 (사용자 "한국처럼 전부", "이대로 그려").
# 종류(kind): act(주인공 4칸 반복) · hit(맞는 순간 6칸) · after(맞은 적에 붙는 여운 4칸 반복) · ground(바닥 6칸: 1~4 퍼짐, 5·6 자국) · debris(나라별 파편 6개)
# 엔진: nano(나노바나나, 한도·결제 오류 1번이면 exit 3) / gpt(codex, 한도면 exit 3). 된 것은 건너뜀. src 안 건드림.
# 사용: python3 run.py <engine> <kind[,kind]> [나라-번호 ...]   예) python3 run.py nano act   /  python3 run.py gpt hit
import os, sys, json, re, base64, subprocess, urllib.request, urllib.error
import numpy as np
from PIL import Image
D=os.path.dirname(os.path.abspath(__file__)); ROOT='/home/user/poki-game'; A=ROOT+'/src/assets'
ROWS=json.load(open(ROOT+'/teams/2-디자인/review/alive-58.json'))
KO={'luxembourg':'룩셈부르크','ireland':'아일랜드','switzerland':'스위스','usa':'미국','netherlands':'네덜란드','denmark':'덴마크','austria':'오스트리아','australia':'호주','germany':'독일','sweden':'스웨덴','canada':'캐나다','finland':'핀란드','france':'프랑스','italy':'이탈리아','spain':'스페인','czechia':'체코','israel':'이스라엘','lithuania':'리투아니아','newzealand':'뉴질랜드','japan':'일본','portugal':'포르투갈','poland':'폴란드','hungary':'헝가리','slovakia':'슬로바키아','greece':'그리스','turkiye':'튀르키예','chile':'칠레','mexico':'멕시코','colombia':'콜롬비아'}
LIMIT=re.compile(r'usage_limit_reached|429 Too Many|rate limit|quota|hit your usage limit',re.I)
ENERGY=re.compile(r'바람|회오리|칼빛|칼날|빛|폭풍|오로라|불타|불꽃|번개|음파|정령|물살|물결|신호탄|룬')
STYLE_REF=ROOT+'/teams/2-디자인/gpt-art/round22-alive/korea-1/act4.png'
STYLE="""- 이 게임 그림체(첨부 예시와 같게): 반실사 판타지, **짙은 윤곽 1~2px + 명암 2~3단**, 잔세부는 큰 면으로, 색은 선명하되 형광·네온 금지.
- 금지: 글자·숫자, 사람(장수는 게임이 따로 그려요), 사람 얼굴, 국기, 종교 상징, 피, 보라색·분홍색, 연두색(초록은 에메랄드만)."""
def bgtxt(bg): return '배경은 순수 검정 #000000(빛·불·바람만 밝게, 가산 합성용).' if bg=='black' else '배경은 순수 초록 #00FF00 한 색(나중에 지워요), 그림에 초록이 섞이지 않게.'
G4="1024×1024, 2×2 칸(512×512), 순서 좌상→우상→좌하→우하. **4칸이 0.08초씩 끝없이 반복**되게(4→1 자연스럽게). 모든 칸에서 위치·크기 같게, 칸 가장자리 28px 비움."
G6="1536×1024, 3×2 칸(512×512), 순서 좌상 1→2→3, 좌하 4→5→6. 모든 칸 중심 같게, 칸 가장자리 24px 비움."
# 사용자 "시안 보여줘"(2026-11-28): 물건형 주인공 → 살아 움직이는 사람·동물로 (팀장 제안 방향)
BODY_V2={'switzerland-1':'미늘창을 앞으로 겨눈 산악 보병 3명의 방진(빨강·흰 옷, 눈 덮인 산길을 한 걸음씩 전진)',
 'switzerland-2':'석궁을 겨누고 쏘는 사수 한 명(당기기→쏘기→다시 장전 동작, 화살은 그리지 않음)',
 'usa-1':'등불을 높이 든 기수가 말을 타고 질주(등불 빛이 흔들림)',
 'usa-2':'종소리에 모여 달려오는 민병대 3명 행렬(삼각모·푸른 코트, 머스킷은 메고 달림)'}
def jobs(kind,only):
  out=[]
  if kind=='body':   # 개발 요청 teams/3-개발/디자인요청-body.md — 주인공 물체 6칸·256, 오른쪽 옆모습, 불투명(보통 합성), 발=칸 아래 가운데
    out=[]
    for k,n,name,typ,sub,hero,after in ROWS:
      key=f'{k}-{n}'
      if only and key not in only and k not in only: continue
      ride='탐' in hero
      sub=BODY_V2.get(key,sub)
      if key in BODY_V2: ride=('타고' in sub)
      out.append(dict(key=f'{key}-body',grid=(3,2),cell=256,bg='green',refs=[STYLE_REF,f'{A}/skill/u/{key}.webp'],p=f"""첫 번째 첨부는 이 게임의 한국 스킬 주인공 그림(거북선이 노 젓는 반복 동작) 예시, 두 번째는 {KO[k]} {n}번 스킬 「{name}」({typ})의 대표 효과 그림이에요. 거북선처럼 **스킬의 주인공 물체가 실제로 움직이는 6칸 반복 동작**을 그려 주세요.
- 주인공: **{sub}** — 빛·기운 덩어리가 아니라 **손에 잡힐 듯한 단단한 물체·생물**로(기운은 테두리에 살짝만). 스킬 효과 색을 몸 장식·테두리 빛으로 조금 살려요.
- 방향: **오른쪽을 보는 옆모습 하나**(약간 위에서 내려다본 35° 시점), 6칸 모두 같은 방향·같은 크기·같은 위치. 눕히거나 비틀거나 뒤로 돌리지 마세요.
- 동작: 6칸이 0.08초씩 끝없이 반복(6→1 자연스럽게) — 달리기·날갯짓·흔들림·울림 등 그 물체다운 움직임.
- **바닥에 닿는 곳(발·바퀴·밑면)은 칸 아래 가운데**, 칸 높이의 75~85%를 채우는 크기. {'**등·위쪽은 비워 두기** — 장수가 올라타요.' if ride else '장수는 그리지 마세요.'}
- {G6} {bgtxt('green')}
{STYLE}
- 날아가는 무기·깃발 그림 금지(물체는 제자리에서 움직이는 모습)."""))
    for j in out:
      if j['key'][:-5] in BODY_V2: j['p']=j['p'].replace('사람(장수는 게임이 따로 그려요), 사람 얼굴','장수(게임이 따로 그려요), 얼굴 세부 묘사(투구·그림자로 가림)')
    return out
  if kind=='aura':   # 사용자 "장수 몸에 물·불·번개 등 다양하게, 모든 장수" — 원소 8종 공용(review/aura-60.json)
    EL={'water':'물: 장수 몸을 휘감아 도는 파란·흰 물줄기와 물보라, 발밑에 물결 고리','lightning':'번개: 몸 둘레를 타고 튀는 흰·하늘색·노랑 번개 줄기와 작은 전기 불꽃, 발밑에 번쩍이는 고리',
      'wind':'바람: 몸을 감아 올라가는 흰·옅은 청록 바람 띠와 회오리, 흩날리는 먼지 조각','ice':'얼음·눈: 몸 둘레에서 솟는 옅은 하늘색 얼음 결정과 눈보라, 발밑에 서리 고리',
      'earth':'대지·모래: 몸 둘레에서 솟아 맴도는 흙·돌 조각과 모래 기류(갈색·황토), 발밑에 갈라진 땅 고리','gold':'금빛: 몸을 감싸는 따뜻한 금빛 빛줄기와 떠오르는 금 가루, 발밑에 금빛 고리',
      'nature':'자연: 몸을 감아 올라가는 초록(에메랄드)·은빛 잎과 고사리 덩굴, 흩날리는 잎'}
    out=[]
    for e,desc in EL.items():
      if only and e not in only: continue
      out.append(dict(key=f'aura-{e}',grid=(2,2),cell=256,bg='black',refs=[STYLE_REF],p=f"""스킬을 쓰는 장수의 **온몸을 뒤덮는 기운 4칸 반복**(②세움: 옆에서 본 모습)을 그려 주세요. 게임이 장수 그림 뒤·앞에 겹쳐 '장수가 이 기운에 휩싸인' 모습이 돼요 — **사람은 그리지 말고 기운만**.
- 기운: {desc}.
- 모양: 서 있는 사람 몸(칸 높이의 75%, 폭 35%)을 감싸는 세로로 긴 덩어리 — 가운데(몸 자리)는 옅고 둘레를 따라 크게 일렁이며 머리 위로 1.3배까지 솟음. 아래 가운데가 바닥(칸 아래 가운데).
- {G4} {bgtxt('black')}
{STYLE}"""))
    return out
  if kind=='shield':   # 무적 버튼(2초) 방어막 — GDD 0-25, 사용자 확정
    return [dict(key='invuln-shield',grid=(2,2),cell=256,bg='black',refs=[STYLE_REF],p=f"""이 게임에서 장수가 무적 버튼(2초)을 누르면 **장수를 감싸는 둥근 방어막**이 생겨요. 그 방어막의 **4칸 반복(살짝 일렁임)**을 그려 주세요(②세움: 장수 앞뒤로 겹쳐 보이는 반투명 구슬 모양 막, 장수는 그리지 마세요).
- 색: 흰색 + 은색·옅은 금빛 테두리(나라색 아님). 가장자리는 진하고 가운데는 거의 투명, 표면에 육각 무늬는 쓰지 말고 부드러운 빛 결이 천천히 흐름.
- 크기: 칸 높이의 80%, 아래 가운데가 바닥(칸 아래 가운데에 닿게), 세로로 약간 긴 둥근 모양.
- {G4} {bgtxt('black')}
{STYLE}"""),
     dict(key='invuln-ring',grid=(1,1),cell=256,bg='green',refs=[STYLE_REF],p=f"""무적 방어막 아래 **바닥에 깔리는 고리 1장**(①바닥: 코드가 눕혀요 → **바로 위에서 본 완전한 원형**)을 그려 주세요. 흰색·은색·옅은 금빛의 얇은 이중 고리, 안쪽은 비어 있음, 고리에 짧은 빛 눈금 몇 개.
- 1024×1024 한 장, 고리가 그림의 80% 크기로 가운데. {bgtxt('green')}
{STYLE}""")]
  if kind=='debris':
    for k in dict.fromkeys(r[0] for r in ROWS):
      if only and k not in only: continue
      subs=' / '.join(r[4] for r in ROWS if r[0]==k)
      out.append(dict(key=f'{k}-debris',grid=(3,2),cell=128,bg='green',refs=[STYLE_REF],p=f"""이 게임 {KO[k]} 장수 스킬(주인공: {subs})에서 **튀는 파편 낱장 6개**를 그려 주세요. 코드가 하나씩 포물선으로 던지고 그림자를 붙여요.
- 그 스킬들의 재료에 맞는 파편 6종(돌·흙·나무·쇠·그 나라 스킬다운 조각 등), 칸마다 파편 1개를 칸 가운데에 칸의 40% 크기로, 비스듬히 위에서 본 모습.
- {G6} {bgtxt('green')}
{STYLE}"""))
    return out
  for k,n,name,typ,sub,hero,after in ROWS:
    key=f'{k}-{n}'
    if only and key not in only and k not in only: continue
    en,ground=[s.strip() for s in after.split('·')][:2] if '·' in after else (after,'')
    en=en.replace('적:','').strip(); ground=ground.replace('땅:','').strip()
    ride='탐' in hero
    refs=[STYLE_REF,f'{A}/skill/u/{key}.webp']
    head=f"첫 번째 첨부는 이 게임의 '살아 움직이는 스킬' 그림 예시(거북선 4칸), 두 번째는 {KO[k]} {n}번 스킬 「{name}」({typ})의 대표 효과 그림이에요. 그 그림체·시점(위에서 약 35° 비스듬히)·색감을 따라 이 스킬 그림을 그려 주세요.\n"
    if kind=='act':
      bg='black' if ENERGY.search(sub) and not ride else 'green'
      out.append(dict(key=f'{key}-act',grid=(2,2),cell=192,bg=bg,refs=refs,p=head+f"""- 주인공: **{sub}**. 오른쪽(진행 방향)을 향해 살아 있는 것처럼 움직이는 **4칸 반복 동작**, 스킬 효과 기운이 주인공을 감싸요.
- {'**등·위쪽은 비워 두기** — 장수는 게임에서 따로 올려 태워요.' if ride else '장수: '+hero+' (장수는 그리지 마세요).'}
- {G4} {bgtxt(bg)}
{STYLE}"""))
    elif kind=='hit':
      out.append(dict(key=f'{key}-hit',grid=(3,2),cell=256,bg='black',refs=refs,p=head+f"""- **맞는 순간의 충돌·폭발 6칸**: 주인공({sub})이 적에게 닿는 자리에서 터지는 모습. 1 짧고 강한 섬광 · 2 그 스킬 재료다운 불꽃·조각이 튐 · 3 가장 큰 순간 · 4 줄어듦 · 5 조각·불티 · 6 거의 사라짐. 섬광은 1~2칸만.
- 아래 가운데가 바닥, 진행 방향은 오른쪽 기준.
- {G6} {bgtxt('black')}
{STYLE}"""))
    elif kind=='after':
      bg='black' if re.search(r'불|빛|번개|오로라|불티',en) else 'green'
      out.append(dict(key=f'{key}-after',grid=(2,2),cell=192,bg=bg,refs=refs,p=head+f"""- **맞은 적의 몸에 붙어 남는 여운 4칸 반복**: {en}. 적 몸 위에 겹쳐 그려서 '적이 이렇게 된' 모습이 돼요 — **적은 그리지 말고 여운 효과만**(적 크기 약 칸의 50%를 감싸는 크기), 아래 가운데가 적 발밑(칸 아래 가운데).
- {G4} {bgtxt(bg)}
{STYLE}"""))
    elif kind=='ground':
      out.append(dict(key=f'{key}-ground',grid=(3,2),cell=256,bg='green',refs=refs,p=head+f"""- **바닥에 눕힐 그림 6칸**: 코드가 바닥에 눕혀 그리니 **바로 위에서 내려다본 원형**으로(납작하게 하지 마세요).
- 1~4칸: 스킬이 땅에 닿은 자리에서 퍼지는 고리·흔적 4단계(작고 진함 → 크고 옅음). 5칸: 남는 자국 — {ground or '스킬다운 자국'}. 6칸: 5칸의 옅은 버전.
- {G6} {bgtxt('green')}
{STYLE}"""))
  return out
# ── 엔진 ──
def part(p):
  b=open(p,'rb').read(); return {'inline_data':{'mime_type':'image/png' if p.endswith('png') else 'image/webp','data':base64.b64encode(b).decode()}}
def nano(dp,j,out):
  body={'contents':[{'parts':[{'text':j['p']}]+[part(r) for r in j['refs']]}],'generationConfig':{'responseModalities':['IMAGE','TEXT']}}
  req=urllib.request.Request('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent',data=json.dumps(body).encode(),headers={'Content-Type':'application/json','x-goog-api-key':'dummy'})
  try: r=json.load(urllib.request.urlopen(req,timeout=300))
  except urllib.error.HTTPError as e:
    t=e.read().decode()[:800]; open(dp+'/err.txt','w').write(t); print('HTTP',e.code,dp,t[:200],flush=True)
    if e.code in (429,402,403) or re.search('quota|billing|exhaust|limit',t,re.I): print('LIMIT nano',flush=True); sys.exit(3)
    return False
  except Exception as e: print('ERR',dp,e,flush=True); return False
  for c in r.get('candidates',[]):
    for p in c.get('content',{}).get('parts',[]):
      d=p.get('inlineData') or p.get('inline_data')
      if d: open(f'{dp}/{out}','wb').write(base64.b64decode(d['data'])); return True
  open(dp+'/err.txt','w').write(json.dumps(r)[:800]); return False
def gpt(dp,j,out):
  imgs=[]
  for i,r in enumerate(j['refs']):
    q=f'{dp}/ref-{i+1}.png'
    if not os.path.exists(q):
      b=Image.new('RGBA',(512,512),(0,0,0,255)); b.alpha_composite(Image.open(r).convert('RGBA').resize((512,512),Image.LANCZOS)); b.convert('RGB').save(q)
    imgs+=['-i',q]
  p=j['p'].replace('첨부','첨부(ref-1.png, ref-2.png)')+f'\n이미지 생성해서 {out}로 저장해 주세요. 이미지 생성이 한도 등으로 실패하면 코드로 대신 그리지 말고 result 파일에 실패라고만 적어 주세요.'
  r=subprocess.run(['codex','exec','--skip-git-repo-check','--color','never','-s','workspace-write','-C',dp,'-o',f'{dp}/result.md',p]+imgs,stdin=subprocess.DEVNULL,capture_output=True,text=True,timeout=1500)
  log=(r.stdout or '')+(r.stderr or ''); open(f'{dp}/log.txt','w').write(log[-4000:])
  if not os.path.exists(f'{dp}/{out}'):
    if LIMIT.search(log): print('LIMIT gpt',dp,flush=True); sys.exit(3)
    return False
  return True
# ── 후처리 ──
def key_green(a):
  a=a.astype(float); r,g,b=a[...,0],a[...,1],a[...,2]; gs=g-np.maximum(r,b)
  al=np.clip(1-(gs-12)/70,0,1)*255; a[...,1]=np.minimum(g,np.minimum(np.maximum(r,b),r*.55+b*.45+8)); a[...,3]=al; return a.clip(0,255).astype(np.uint8)
def edge_fill(a,cond):  # 칸 가장자리와 이어진 cond 영역(흰 테두리·여백) 찾기
  import scipy.ndimage as nd
  lab,_=nd.label(cond); e=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
  return np.isin(lab,list(e))
def key_black(a):
  a=a.astype(float)/255; a=a.copy()
  wm=edge_fill(a,(a[...,:3].min(-1)>.9)); a[wm,:3]=0   # 칸 둘레 흰 여백 → 검정
  rgb=a[...,:3]
  dk=(rgb.max(-1)<.3); ring=np.zeros(dk.shape,bool); ring[:48]=ring[-48:]=True; ring[:,:48]=ring[:,-48:]=True
  sel=rgb[ring&dk]; bgc=np.median(sel,0) if len(sel)>50 else np.zeros(3)
  rgb=np.clip((rgb-bgc)/np.maximum(1-bgc,.5),0,1)   # 검정이 아닌 어두운 배경도 빼기
  lum=(rgb*[.299,.587,.114]).sum(-1); al=np.clip((lum-.04)/.22,0,1)
  rgb=np.clip(rgb/np.maximum(al[...,None],1e-3),0,1)*(al[...,None]>0); return (np.dstack([rgb,al])*255).astype(np.uint8)
def post(dp,j):
  gx,gy=j['grid']; c=j['cell']
  # 크게 다시 뽑기: CELL_OVERRIDE='{"hit":512,"ground":512,"act":384,"after":384,"aura":384,"body":512}' (원본 w/*/sheet.png는 칸 512로 남아 있음)
  ov=json.loads(os.environ.get('CELL_OVERRIDE','{}'))
  suf=j['key'].rsplit('-',1)[1] if not j['key'].startswith('aura') else 'aura'
  c=ov.get(suf,c)
  a=np.array(Image.open(dp+'/sheet.png').convert('RGBA').resize((gx*512,gy*512),Image.LANCZOS))
  def proc(t):
    if t[...,3].min()<250: return Image.fromarray(t)
    g=(t[...,1].astype(int)-np.maximum(t[...,0],t[...,2]).astype(int))
    border=np.concatenate([g[:6].ravel(),g[-6:].ravel(),g[:,:6].ravel(),g[:,-6:].ravel()])
    return Image.fromarray(key_green(t) if np.median(border)>80 else key_black(t))   # 실제 배경색으로 판단
  def trim(im):  # 칸 가장자리 20px은 비움(여백 지시 28px) — 칸 테두리 선 제거
    t=np.array(im).astype(float); n=t.shape[0]; d=np.arange(n); e=np.minimum(d,n-1-d)
    r=np.clip((e-16)/32,0,1); r=r*r*(3-2*r)   # 가장자리 16px 투명 → 48px까지 부드럽게(직선 잘림 방지)
    t[...,3]*=r[:,None]*r[None,:]; return Image.fromarray(t.clip(0,255).astype(np.uint8))
  cs=[trim(proc(a[y*512:y*512+512,x*512:x*512+512].copy())).resize((c,c),Image.LANCZOS) for y in range(gy) for x in range(gx)]
  s=Image.new('RGBA',(len(cs)*c,c)); [s.alpha_composite(q,(i*c,0)) for i,q in enumerate(cs)]; s.save(f'{D}/out/{j["key"]}.webp','WEBP',quality=86,method=6)
if __name__=='__main__':
  eng=sys.argv[1]; kinds=sys.argv[2].split(','); only=sys.argv[3:]
  os.makedirs(D+'/out',exist_ok=True)
  for kind in kinds:
    for j in jobs(kind,only):
      dp=f'{D}/w/{j["key"]}'; os.makedirs(dp,exist_ok=True)
      if os.path.exists(f'{D}/out/{j["key"]}.webp'): continue
      if os.path.exists(dp+'/claim') and open(dp+'/claim').read()!=eng: continue   # 다른 엔진이 맡음
      open(dp+'/claim','w').write(eng)
      ok=os.path.exists(dp+'/sheet.png') or (nano if eng=='nano' else gpt)(dp,j,'sheet.png')
      if not ok: print('FAIL',j['key'],flush=True); os.remove(dp+'/claim'); continue
      post(dp,j); print('DONE',j['key'],flush=True)
