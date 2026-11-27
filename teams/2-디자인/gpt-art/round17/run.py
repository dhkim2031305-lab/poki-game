# 17차: 장수 스킬 새 대표 그림. 나라당 GPT 1번. 인자: 나라키들 또는 A(앞 12)/B(뒤 12). 된 것은 건너뜀, 한도면 exit 3. 원본(src) 안 건드림.
import os, sys, json, re, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont
ROOT='/home/user/poki-game'; D=os.path.dirname(os.path.abspath(__file__)); U=ROOT+'/src/assets/skill/u'
F=ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',18)
LIMIT=re.compile(r'usage_limit_reached|429 Too Many|rate limit|quota|hit your usage limit',re.I)
rows=json.load(open(D+'/skills45.json')); G={}
for r in rows: G.setdefault(r['k'],[]).append(r)
KS=list(G); arg=sys.argv[1:]
todo=KS[:12] if arg==['A'] else KS[12:] if arg==['B'] else (arg or KS)
def fix(c):  # 14차와 같은 보정: 보라→빨강/파랑, 연두→에메랄드, 밝기 알파
  a=c.astype(float)/255; rgb=a[...,:3]; mx=rgb.max(-1); mn=rgb.min(-1); d=mx-mn+1e-9; r,g,b=rgb[...,0],rgb[...,1],rgb[...,2]
  h=np.where(mx==r,((g-b)/d)%6,np.where(mx==g,(b-r)/d+2,(r-g)/d+4))*60; s=np.where(mx>0,d/(mx+1e-9),0); v=mx
  pur=(h>=275)&(h<=345)&(s>.15); h=np.where(pur&(h<310),232,np.where(pur,356,h)); lime=(h>=65)&(h<=110)&(s>.15); h=np.where(lime,147,h)
  C=v*s; X=C*(1-np.abs((h/60)%2-1)); m=v-C; z=np.zeros_like(h); i=(h//60).astype(int)%6
  rgb=np.select([i[...,None]==k for k in range(6)],[np.stack(t,-1) for t in [(C,X,z),(X,C,z),(z,C,X),(z,X,C),(X,z,C),(C,z,X)]])+m[...,None]
  al=a[...,3]
  if al.min()>.98: lum=(rgb*[.299,.587,.114]).sum(-1); al=np.clip((lum-.06)/.25,0,1); rgb=np.clip(rgb/np.maximum(al[...,None],1e-3),0,1)*(al[...,None]>0)
  return (np.dstack([rgb,al])*255).clip(0,255).astype(np.uint8)
for k in todo:
  dp=f'{D}/{k}'; os.makedirs(dp,exist_ok=True); rs=G[k]
  refs=[]
  for n in (1,2):
    p=f'{dp}/ref-{n}.png'
    if not os.path.exists(p):
      b=Image.new('RGBA',(512,512),(0,0,0,255)); b.alpha_composite(Image.open(f'{U}/{k}-{n}.webp').convert('RGBA').resize((512,512),Image.LANCZOS)); b.convert('RGB').save(p)
    refs.append(p)
  W=512*len(rs); cells='\n'.join(f"- {'왼쪽 칸' if i==0 and len(rs)==2 else '오른쪽 칸' if i==1 else '칸'} = {r['ko']} {r['n']}번 \"{r['name']}\"({r['type']}): {r['shape']}. 색: {r['color']}." for i,r in enumerate(rs))
  prompt=f"""첨부 ref-1.png·ref-2.png는 이 게임에서 {rs[0]['ko']} 장수의 지금 스킬 대표 그림 1·2번이에요(검은 배경, 가산 합성용 효과 그림, 2D 판타지, 위에서 비스듬히 내려다보는 시점). 같은 그림체·빛 표현·선 굵기·채도로 새 대표 그림을 이미지 생성해 rep2.png로 저장해 주세요.
- {W}×512, 칸 512×512 {len(rs)}개, 칸 가장자리 24px 비움, 배경 순수 검정 #000000. 칸이 잘리거나 다른 칸으로 넘어가지 않게.
{cells}
- 칸의 60~75%를 채우는 주인공 모양 + 빛 입자·반짝임으로 화려하게. 주인공 몸은 첫 색, 바깥 빛은 둘째 색, 가장 밝은 심지만 흰색.
- 금지: 글자·숫자, 국기 모양 그대로, 실존 인물 얼굴(사람은 실루엣·투구·뒷모습만), 종교 상징, 피, 보라색(외계인 색), 연두색(초록은 에메랄드만), 튀르키예 초승달 모양.
이미지 생성이 한도 등으로 실패하면 코드로 대신 그리지 말고 result 파일에 실패라고만 적어 주세요."""
  out=f'{dp}/rep2.png'
  if not os.path.exists(out):
    cmd=['codex','exec','--skip-git-repo-check','--color','never','-s','workspace-write','-C',dp,'-o',f'{dp}/result-rep2.md',prompt,'-i',refs[0],'-i',refs[1]]
    r=subprocess.run(cmd,stdin=subprocess.DEVNULL,capture_output=True,text=True,timeout=1500)
    log=(r.stdout or '')+(r.stderr or ''); open(f'{dp}/log-rep2.txt','w').write(log[-4000:])
    if not os.path.exists(out):
      if LIMIT.search(log): print('LIMIT',k,flush=True); sys.exit(3)
      print('FAIL',k,flush=True); continue
  im=Image.open(out).convert('RGBA').resize((W,512),Image.LANCZOS)
  pv=Image.new('RGBA',(len(rs)*2*256+20,256+30),(43,42,51,255)); dr=ImageDraw.Draw(pv)
  for i,r in enumerate(rs):
    c=Image.fromarray(fix(np.array(im.crop((i*512,0,i*512+512,512))))).resize((256,256),Image.LANCZOS)
    c.save(f"{dp}/{k}-{r['n']}.webp",'WEBP',quality=85,method=6)
    old=Image.open(f"{U}/{k}-{r['n']}.webp").convert('RGBA')
    x0=i*(512+20); pv.alpha_composite(old,(x0,30)); pv.alpha_composite(c,(x0+256,30)); dr.text((x0+4,4),f"{r['ko']} {r['n']} 지금 → 새 「{r['name']}」",fill='white',font=F)
  pv.convert('RGB').save(f'{dp}/preview.png'); print('DONE',k,flush=True)
