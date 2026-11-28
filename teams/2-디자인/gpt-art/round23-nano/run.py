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
def jobs(kind,only):
  out=[]
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
def key_black(a):
  a=a.astype(float)/255; rgb=a[...,:3]; lum=(rgb*[.299,.587,.114]).sum(-1); al=np.clip((lum-.04)/.22,0,1)
  rgb=np.clip(rgb/np.maximum(al[...,None],1e-3),0,1)*(al[...,None]>0); return (np.dstack([rgb,al])*255).astype(np.uint8)
def post(dp,j):
  gx,gy=j['grid']; c=j['cell']
  a=np.array(Image.open(dp+'/sheet.png').convert('RGBA').resize((gx*512,gy*512),Image.LANCZOS))
  if a[...,3].min()<250: im=Image.fromarray(a)
  else: im=Image.fromarray(key_green(a) if j['bg']=='green' else key_black(a))
  cs=[im.crop((x*512,y*512,x*512+512,y*512+512)).resize((c,c),Image.LANCZOS) for y in range(gy) for x in range(gx)]
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
