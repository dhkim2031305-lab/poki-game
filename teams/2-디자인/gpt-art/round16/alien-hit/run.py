# 외계인 맞는 반응(grunt 공통 8칸): 움찔 2 · 밀림 2 · 쓰러짐 4. GPT 2번. 다시 실행하면 된 것은 건너뜀, 한도면 exit 3.
import os, sys, subprocess, re
import numpy as np
from PIL import Image, ImageDraw, ImageFont
ROOT='/home/user/poki-game'; D=os.path.dirname(os.path.abspath(__file__))
F=ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',22)
LIMIT=re.compile(r'usage_limit_reached|429 Too Many|rate limit|quota|hit your usage limit',re.I)
src=Image.open(ROOT+'/src/assets/alien/grunt-dir.webp').convert('RGBA'); cell=lambda i: src.crop((i*192,0,i*192+192,192))
ref=[cell(0),cell(6),cell(7),cell(8)]
if not os.path.exists(D+'/ref-grunt.png'):
  r=Image.new('RGBA',(4*512,560),(255,255,255,255)); d=ImageDraw.Draw(r)
  for i,c in enumerate(ref): r.alpha_composite(c.resize((512,512),Image.LANCZOS),(i*512,48)); d.text((i*512+10,8),['1 아래(정면)','2 오른쪽 걷기','3 오른쪽 걷기','4 오른쪽 걷기'][i],fill='black',font=F)
  r.convert('RGB').save(D+'/ref-grunt.png')
P=open(D+'/p-hit.txt').read()
JOBS=[('hitA.png','1 움찔: 맞은 순간 몸이 뒤(왼쪽)로 젖혀지고 다리가 움츠러듦 · 2 움찔 되찾기: 1과 서기 사이 · 3 밀림: 몸 전체가 왼쪽으로 기울고 앞다리가 들림 · 4 버티기: 뒷다리로 버티며 몸을 낮춤'),
      ('hitB.png','1 균형 잃기: 뒤로 크게 젖혀지며 다리가 허우적 · 2 넘어가는 중 1: 몸이 옆으로 45° 기울어 다리 반이 바닥에서 뜸 · 3 넘어가는 중 2: 거의 뒤집힘 · 4 바닥에 닿음: 등껍질이 바닥에 닿고 다리가 위로 오그라듦')]
def codex(prompt,imgs,out):
  if os.path.exists(f'{D}/{out}'): return True
  cmd=['codex','exec','--skip-git-repo-check','--color','never','-s','workspace-write','-C',D,'-o',f'{D}/result-{out}.md',prompt]+sum([['-i',i] for i in imgs],[])
  r=subprocess.run(cmd,stdin=subprocess.DEVNULL,capture_output=True,text=True,timeout=1500)
  log=(r.stdout or '')+(r.stderr or ''); open(f'{D}/log-{out}.txt','w').write(log[-4000:])
  if LIMIT.search(log) and not os.path.exists(f'{D}/{out}'): print('LIMIT',out,flush=True); sys.exit(3)
  return os.path.exists(f'{D}/{out}')
def to_alpha(im):
  a=np.array(im.convert('RGBA')).astype(float)
  if a[...,3].min()<250: return im.convert('RGBA')
  a[...,3]=np.clip((255-a[...,:3]).max(-1)*6,0,255); return Image.fromarray(a.astype(np.uint8))
def foot(c):  # 지지발: 가장 아래 줄(바닥선) y, 아래 25% 픽셀의 x 평균
  al=np.array(c)[...,3]; ys,xs=np.where(al>40); low=ys>=ys.max()-(ys.max()-ys.min())*.25; return ys.max(),xs[low].mean()
cells=[]
for out,poses in JOBS:
  if not codex(P.replace('{OUT}',out).replace('{POSES}','- '+poses),[D+'/ref-grunt.png'],out): print('FAIL',out,flush=True); sys.exit(1)
  im=to_alpha(Image.open(D+'/'+out)).resize((1024,1024),Image.LANCZOS)
  cells+=[im.crop((x*512,y*512,x*512+512,y*512+512)).resize((192,192),Image.LANCZOS) for y in (0,1) for x in (0,1)]
fy,fx=foot(ref[1]); res=[]
for c in cells:
  y,x=foot(c); o=Image.new('RGBA',(192,192)); o.paste(c,(round(fx-x),round(fy-y)),c); res.append(o)
s=Image.new('RGBA',(8*192,192)); [s.alpha_composite(c,(i*192,0)) for i,c in enumerate(res)]; s.save(D+'/grunt-hit.webp','WEBP',quality=90)
pv=Image.new('RGBA',(9*192*2,192*2+34),(43,42,51,255)); d=ImageDraw.Draw(pv)
d.text((6,4),'외계인 맞는 반응 — 맨 왼쪽 = 지금 오른쪽 걷기 칸 · 1·2 움찔 · 3·4 밀림 · 5~8 쓰러짐 (2배, 빨간 선 = 바닥선)',fill='white',font=F)
for i,c in enumerate([ref[1]]+res): pv.alpha_composite(c.resize((384,384),Image.NEAREST),(i*384,34))
d.line([0,34+fy*2,9*384,34+fy*2],fill=(255,80,80)); pv.convert('RGB').save(D+'/preview-hit.png'); print('DONE hit',flush=True)
