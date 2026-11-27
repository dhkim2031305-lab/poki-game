# 16차 "나"안 시험 3개: 시전 자세(3나라 × 3방향 × 4자세, 빈손) + 스킬 효과 연속 그림(3개 × 6칸)
# 다시 실행하면 이미 된 것은 건너뜀. 한도 오류면 즉시 멈춤(exit 3). 원본(src/assets)은 건드리지 않음.
import os, sys, subprocess, re
import numpy as np
from PIL import Image, ImageDraw, ImageFont
ROOT='/home/user/poki-game'; A=ROOT+'/src/assets'; D=os.path.dirname(os.path.abspath(__file__))
F=ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',22)
LIMIT=re.compile(r'usage_limit_reached|429 Too Many|rate limit|quota',re.I)
KS=['korea','switzerland','luxembourg']; KO={'korea':'한국','switzerland':'스위스','luxembourg':'룩셈부르크'}
DIRS=[('down','아래(정면)',1,0),('side','오른쪽(옆)',3,2),('up','위(뒤)',5,4)]   # 이름, 설명, ref 칸 번호(1~5), dir 시트 칸
POSES=['A 돌진','B 범위','C 연사','D 설치']
def codex(dirp,prompt,imgs,out):
  if os.path.exists(f'{dirp}/{out}'): return True
  cmd=['codex','exec','--skip-git-repo-check','--color','never','-s','workspace-write','-C',dirp,'-o',f'{dirp}/result-{out}.md',prompt]+sum([['-i',i] for i in imgs],[])
  r=subprocess.run(cmd,stdin=subprocess.DEVNULL,capture_output=True,text=True,timeout=1500)
  log=(r.stdout or '')+(r.stderr or ''); open(f'{dirp}/log-{out}.txt','w').write(log[-4000:])
  if LIMIT.search(log) and not os.path.exists(f'{dirp}/{out}'): print('LIMIT',dirp,out,flush=True); sys.exit(3)
  return os.path.exists(f'{dirp}/{out}')
def ref_sheet(cs,labels,path):
  r=Image.new('RGBA',(len(cs)*512,560),(255,255,255,255));d=ImageDraw.Draw(r)
  for i,c in enumerate(cs): r.alpha_composite(c.resize((512,512),Image.LANCZOS),(i*512,48)); d.text((i*512+10,8),labels[i],fill='black',font=F)
  r.convert('RGB').save(path)
def to_alpha(im):  # 흰 배경이면 투명으로
  a=np.array(im.convert('RGBA')).astype(float)
  if a[...,3].min()<250: return im.convert('RGBA')
  rgb=a[...,:3]; wd=(255-rgb).max(-1); a[...,3]=np.clip(wd*6,0,255); return Image.fromarray(a.astype(np.uint8))
def foot_cx(c):
  al=np.array(c)[...,3]; ys,xs=np.where(al>40)
  if len(ys)==0: return None,None
  low=ys>=ys.max()-(ys.max()-ys.min())*0.35
  return ys.max(), xs[low].mean()
def place(c512,cx,fy=186):  # 512칸 → 192 (같은 배율 0.375) 후 발바닥 y=186, 다리 가운데 x=cx
  c=c512.resize((192,192),Image.LANCZOS); y,x=foot_cx(c)
  if y is None: return c
  out=Image.new('RGBA',(192,192)); out.alpha_composite(c,(0,0)); out=Image.new('RGBA',(192,192)); out.paste(c,(round(cx-x),round(fy-y)),c); return out
P_POSE=open(D+'/p-pose.txt').read(); P_FX=open(D+'/p-fx.txt').read()
only=sys.argv[1:] or ['pose','fx']
if 'pose' in only:
  for k in KS:
    dp=f'{D}/pose/{k}'; os.makedirs(dp,exist_ok=True)
    dirc=[Image.open(f'{A}/dir/{k}.webp').convert('RGBA').crop((i*192,0,i*192+192,192)) for i in range(5)]
    if not os.path.exists(dp+'/ref-dir.png'): ref_sheet(dirc,['1 아래(정면)','2 오른아래','3 오른쪽','4 오른위','5 위(뒤)'],dp+'/ref-dir.png')
    rows=[]
    for name,desc,n,ci in DIRS:
      out=f'pose-{name}.png'
      if not codex(dp,P_POSE.replace('{DIR}',desc).replace('{N}',str(n)).replace('{OUT}',out),[dp+'/ref-dir.png'],out): print('FAIL pose',k,name,flush=True); continue
      im=to_alpha(Image.open(dp+'/'+out)).resize((1024,1024),Image.LANCZOS)
      cs=[im.crop((x*512,y*512,x*512+512,y*512+512)) for y in (0,1) for x in (0,1)]
      _,scx=foot_cx(dirc[ci]); cs=[place(c,scx) for c in cs]
      s=Image.new('RGBA',(4*192,192)); [s.alpha_composite(c,(i*192,0)) for i,c in enumerate(cs)]; s.save(f'{dp}/{k}-pose-{name}.webp','WEBP',quality=90)
      rows.append((desc,dirc[ci],cs))
    if rows:
      pv=Image.new('RGBA',(5*192*2,len(rows)*(384+28)+34),(52,51,61,255)); d=ImageDraw.Draw(pv)
      d.text((6,4),f'{KO[k]} — 맨 왼쪽 = 지금 서기 칸, 오른쪽 4칸 = 새 자세(빈손, 무기는 코드로). 2배 확대, 빨간 선 = 발 y·서기 머리 y',fill='white',font=F)
      for r,(desc,st,cs) in enumerate(rows):
        y0=34+r*412; d.text((6,y0),desc,fill=(255,214,102),font=F)
        for i,c in enumerate([st]+cs):
          pv.alpha_composite(c.resize((384,384),Image.NEAREST),(i*384,y0+28)); d.rectangle([i*384,y0+28,i*384+383,y0+411],outline=(90,90,100))
          if i: d.text((i*384+6,y0+30),POSES[i-1],fill='white',font=F)
        hy=np.where(np.array(st)[...,3]>40)[0].min()
        d.line([0,y0+28+186*2,1920,y0+28+186*2],fill=(255,80,80)); d.line([0,y0+28+hy*2,1920,y0+28+hy*2],fill=(255,80,80))
      pv.convert('RGB').save(f'{dp}/preview-pose-{k}.png'); print('DONE pose',k,flush=True)
if 'fx' in only:
  for k in KS:
    dp=f'{D}/fx/{k}'; os.makedirs(dp,exist_ok=True)
    refs=[f'{A}/skill/u/{k}-1.webp',f'{A}/skill/u/{k}-2.webp']
    for i,r in enumerate(refs):
      if not os.path.exists(f'{dp}/ref-{i+1}.png'):
        b=Image.new('RGBA',(512,512),(40,40,48,255)); b.alpha_composite(Image.open(r).convert('RGBA').resize((512,512),Image.LANCZOS)); b.convert('RGB').save(f'{dp}/ref-{i+1}.png')
    p=open(f'{D}/p-fx-{k}.txt').read()
    if not codex(dp,P_FX.replace('{SKILL}',p),[f'{dp}/ref-1.png',f'{dp}/ref-2.png'],'fx6.png'): print('FAIL fx',k,flush=True); continue
    im=Image.open(dp+'/fx6.png').convert('RGBA').resize((1536,1024),Image.LANCZOS)
    a=np.array(im).astype(float)
    if a[...,3].min()>250:  # 검은 배경 → 밝기 알파
      lum=(a[...,:3]*[.299,.587,.114]).sum(-1)/255; a[...,3]=np.clip((lum-.06)/.25,0,1)*255
    im=Image.fromarray(a.astype(np.uint8))
    cs=[im.crop((x*512,y*512,x*512+512,y*512+512)).resize((256,256),Image.LANCZOS) for y in (0,1) for x in (0,1,2)]
    s=Image.new('RGBA',(6*256,256)); [s.alpha_composite(c,(i*256,0)) for i,c in enumerate(cs)]; s.save(f'{dp}/{k}-1-fx6.webp','WEBP',quality=88)
    pv=Image.new('RGBA',(6*256,256+30),(43,42,51,255)); d=ImageDraw.Draw(pv); d.text((6,4),f'{KO[k]} 1번 효과 6칸 (게임 바닥색 위, 0.06초씩)',fill='white',font=F)
    for i,c in enumerate(cs): pv.alpha_composite(c,(i*256,30)); d.text((i*256+6,34),str(i+1),fill='white',font=F)
    pv.convert('RGB').save(f'{dp}/preview-fx-{k}.png'); print('DONE fx',k,flush=True)
