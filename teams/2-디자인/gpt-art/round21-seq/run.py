# 21차: 스킬마다 연속 그림 6칸(대표 그림이 살아 움직이게). 스킬 1개 = GPT 1번(3×2 시트).
# 인자: A(순서 1~30) / B(31~59) / 'fire'(천자총통 발사 애니) / 나라-번호들. 된 것은 건너뜀, 한도면 exit 3. src 안 건드림.
import os, sys, json, re, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont
ROOT='/home/user/poki-game'; D=os.path.dirname(os.path.abspath(__file__)); A=ROOT+'/src/assets'
F=ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',18)
LIMIT=re.compile(r'usage_limit_reached|429 Too Many|rate limit|quota|hit your usage limit',re.I)
rows=json.load(open(D+'/seq59.json')); arg=sys.argv[1:]
if arg==['A']: todo=[r for r in rows if r['order']<=30]
elif arg==['B']: todo=[r for r in rows if r['order']>30]
elif arg==['fire']: todo=[]
else: todo=[r for r in rows if f"{r['k']}-{r['n']}" in arg] if arg else rows
FLOW={'설치':'1 소품이 내려앉아 바닥에 효과가 생기기 시작 · 2 효과가 펼쳐짐 · 3 다 펼쳐져 살아 움직임(빛 흐름 A) · 4 같은 모습, 빛·무늬가 조금 움직임(B) · 5 같은 모습(C) — 3→4→5가 이어 반복돼도 자연스럽게(깔린 동안 반복 재생) · 6 사라지기 시작',
 '범위':'1 가운데서 효과가 일어남 · 2 퍼지기 시작 · 3 가장 크고 화려한 순간 · 4 퍼지며 끝부분이 흩어짐 · 5 잔불·빛 조각 · 6 거의 사라짐',
 '돌진':'1 앞쪽에 효과가 모이기 시작 · 2 돌진 방향(오른쪽)으로 뻗음 · 3 가장 강하게 앞으로 밀고 나감 · 4 3과 비슷하게 흔들림(돌진 중 반복용) · 5 끝에서 부딪히는 섬광 · 6 흩어지며 사라짐',
 '연사':'1 발사 순간 섬광 · 2 날아가는 모습(오른쪽으로) · 3 가장 밝음 · 4 맞는 순간 터짐 · 5 터진 조각 · 6 사라짐'}
def fix(a):  # 검은 배경 → 밝기 알파 + 보라→빨강/파랑, 연두→에메랄드
  a=a.astype(float)/255; rgb=a[...,:3]; mx=rgb.max(-1); mn=rgb.min(-1); d=mx-mn+1e-9; r,g,b=rgb[...,0],rgb[...,1],rgb[...,2]
  h=np.where(mx==r,((g-b)/d)%6,np.where(mx==g,(b-r)/d+2,(r-g)/d+4))*60; s=np.where(mx>0,d/(mx+1e-9),0); v=mx
  pur=(h>=275)&(h<=345)&(s>.15); h=np.where(pur&(h<310),232,np.where(pur,356,h)); lime=(h>=65)&(h<=110)&(s>.15); h=np.where(lime,147,h)
  C=v*s; X=C*(1-np.abs((h/60)%2-1)); m=v-C; z=np.zeros_like(h); i=(h//60).astype(int)%6
  rgb=np.select([i[...,None]==k for k in range(6)],[np.stack(t,-1) for t in [(C,X,z),(X,C,z),(z,C,X),(z,X,C),(X,z,C),(C,z,X)]])+m[...,None]
  al=a[...,3]
  if al.min()>.98: lum=(rgb*[.299,.587,.114]).sum(-1); al=np.clip((lum-.05)/.25,0,1); rgb=np.clip(rgb/np.maximum(al[...,None],1e-3),0,1)*(al[...,None]>0)
  return (np.dstack([rgb,al])*255).clip(0,255).astype(np.uint8)
def codex(dp,prompt,imgs,out):
  if os.path.exists(f'{dp}/{out}'): return True
  r=subprocess.run(['codex','exec','--skip-git-repo-check','--color','never','-s','workspace-write','-C',dp,'-o',f'{dp}/result.md',prompt]+sum([['-i',i] for i in imgs],[]),stdin=subprocess.DEVNULL,capture_output=True,text=True,timeout=1500)
  log=(r.stdout or '')+(r.stderr or ''); open(f'{dp}/log.txt','w').write(log[-4000:])
  if not os.path.exists(f'{dp}/{out}'):
    if LIMIT.search(log): print('LIMIT',dp,flush=True); sys.exit(3)
    return False
  return True
def ref(p,src,bg=(0,0,0,255)):
  if os.path.exists(p): return
  b=Image.new('RGBA',(512,512),bg); b.alpha_composite(Image.open(src).convert('RGBA').resize((512,512),Image.LANCZOS)); b.convert('RGB').save(p)
os.makedirs(D+'/out',exist_ok=True)
for r in todo:
  key=f"{r['k']}-{r['n']}"; dp=f'{D}/{key}'; os.makedirs(dp,exist_ok=True)
  ref(dp+'/ref-art.png',f"{A}/skill/u/{key}.webp"); ref(dp+'/ref-prop.png',f"{A}/skill/prop/{key}.webp",(255,255,255,255))
  prompt=f"""첨부 ref-art.png는 이 게임 스킬 「{r['name']}」({r['ko']} {r['n']}번, {r['type']})의 대표 효과 그림이고, ref-prop.png는 이 스킬의 소품 그림이에요. 이 대표 그림이 **살아 움직이는 연속 그림 6칸**을 같은 그림체·색·빛 표현으로 이미지 생성해 seq6.png로 저장해 주세요.
- 스킬 모양: {r['shape']} / 특징: {r['feat']}
- 6칸 흐름({r['type']}): {FLOW[r['type']]}
- 1536×1024, 3×2 칸(512×512) 순서 좌상 1 → 2 → 3, 좌하 4 → 5 → 6. 칸 가장자리 24px 비움. **모든 칸에서 효과 중심·크기 기준이 같게**(같은 효과의 다음 순간, 0.06초 간격), 위에서 비스듬히 내려다보는 시점, 바닥 효과는 세로 0.45배 납작.
- 배경 순수 검정 #000000(가산 합성용), 효과만 밝게. 소품은 효과 안에 작게 보여도 되지만 주인공은 효과.
- 금지: 글자·숫자, 국기 모양 그대로, 사람 얼굴, 종교 상징, 피, 보라색, 연두색(초록은 에메랄드만), 초승달 모양.
이미지 생성이 한도 등으로 실패하면 코드로 대신 그리지 말고 result 파일에 실패라고만 적어 주세요."""
  if not codex(dp,prompt,[dp+'/ref-art.png',dp+'/ref-prop.png'],'seq6.png'): print('FAIL',key,flush=True); continue
  im=Image.fromarray(fix(np.array(Image.open(dp+'/seq6.png').convert('RGBA').resize((1536,1024),Image.LANCZOS))))
  cs=[im.crop((x*512,y*512,x*512+512,y*512+512)).resize((256,256),Image.LANCZOS) for y in (0,1) for x in (0,1,2)]
  s=Image.new('RGBA',(6*256,256)); [s.alpha_composite(c,(i*256,0)) for i,c in enumerate(cs)]; s.save(f'{D}/out/{key}.webp','WEBP',quality=85,method=6)
  pv=Image.new('RGBA',(7*256,256+28),(43,42,51,255)); dr=ImageDraw.Draw(pv); dr.text((6,4),f"{r['ko']} {r['n']} 「{r['name']}」 {r['type']} — 맨 왼쪽 대표 그림, 1~6칸",fill='white',font=F)
  pv.alpha_composite(Image.open(f"{A}/skill/u/{key}.webp").convert('RGBA'),(0,28)); [pv.alpha_composite(c,((i+1)*256,28)) for i,c in enumerate(cs)]
  pv.convert('RGB').save(f'{dp}/preview.png'); print('DONE',key,flush=True)
if arg==['fire']:  # 천자총통 화포 발사 애니(소품 위치에서): 보통 합성, 투명
  dp=f'{D}/korea-2-fire'; os.makedirs(dp,exist_ok=True); ref(dp+'/ref-prop.png',f"{A}/skill/prop/korea-2.webp",(255,255,255,255))
  prompt="""첨부 ref-prop.png는 이 게임의 천자총통(조선 청동 화포, 마디 고리 포신 + 낮은 나무 받침·작은 바퀴 4개) 소품 그림이에요. 이 화포가 **한 발 쏘는 6칸**을 같은 그림·같은 크기·같은 위치로 이미지 생성해 fire6.png로 저장해 주세요.
- 1 그대로(심지에 작은 불씨) · 2 심지 불꽃 밝아짐 · 3 쾅: 포구에서 큰 주황·흰 불꽃 + 화포가 뒤로 약간 밀림 · 4 포구 연기 크게, 화포 제자리로 · 5 연기 옅어짐 · 6 거의 1과 같음(작은 연기 한 줄).
- 1536×1024, 3×2 칸(512×512), 칸마다 화포 위치·크기 같게(반동 3칸만 뒤로 약간). 배경 투명(안 되면 순수 흰색 #FFFFFF). 글자·사람 없음.
이미지 생성이 한도 등으로 실패하면 코드로 대신 그리지 말고 result 파일에 실패라고만 적어 주세요."""
  if codex(dp,prompt,[dp+'/ref-prop.png'],'fire6.png'):
    a=np.array(Image.open(dp+'/fire6.png').convert('RGBA').resize((1536,1024),Image.LANCZOS)).astype(float)
    if a[...,3].min()>250: a[...,3]=np.clip((255-a[...,:3]).max(-1)*6,0,255)
    im=Image.fromarray(a.astype(np.uint8)); cs=[im.crop((x*512,y*512,x*512+512,y*512+512)).resize((192,192),Image.LANCZOS) for y in (0,1) for x in (0,1,2)]
    s=Image.new('RGBA',(6*192,192)); [s.alpha_composite(c,(i*192,0)) for i,c in enumerate(cs)]; s.save(f'{D}/out/korea-2-fire.webp','WEBP',quality=88); print('DONE fire',flush=True)
