# 16방향 30개국: 나라마다 GPT 3번 (dir 중간 4칸 / walk A·B 2장) → 정리·이어 붙이기. 다시 실행하면 이미 된 것은 건너뜀. 한도 오류면 즉시 멈춤.
import os, sys, subprocess, json, re
import numpy as np
from PIL import Image, ImageDraw, ImageFont
ROOT='/home/user/poki-game'; A=ROOT+'/src/assets'; D=os.path.dirname(os.path.abspath(__file__))
src=open(ROOT+'/src/data.js').read()
KEYS=[l.split("'")[1] for l in src.split('\n') if l.strip().startswith("C('")]
KO={l.split("'")[1]:l.split("'")[15] for l in src.split('\n') if l.strip().startswith("C('")}
F=ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',26)
LIMIT=re.compile(r'usage_limit_reached|429 Too Many|rate limit|quota',re.I)
def cells(img,n): return [img.crop((i*192,0,i*192+192,192)) for i in range(n)]
def ref_sheet(cs,labels,path):
  r=Image.new('RGBA',(len(cs)*512,560),(255,255,255,255));d=ImageDraw.Draw(r)
  for i,c in enumerate(cs): r.alpha_composite(c.resize((512,512),Image.LANCZOS),(i*512,48)); d.text((i*512+10,8),labels[i],fill='black',font=F)
  r.convert('RGB').save(path)
def codex(dirp,prompt,imgs,out):
  if os.path.exists(f'{dirp}/{out}'): return True
  cmd=['codex','exec','--skip-git-repo-check','--color','never','-s','workspace-write','-C',dirp,'-o',f'{dirp}/result-{out}.md',prompt]+sum([['-i',i] for i in imgs],[])
  r=subprocess.run(cmd,stdin=subprocess.DEVNULL,capture_output=True,text=True,timeout=1500)
  log=(r.stdout or '')+(r.stderr or ''); open(f'{dirp}/log-{out}.txt','w').write(log[-4000:])
  if LIMIT.search(log) and not os.path.exists(f'{dirp}/{out}'): print('LIMIT',dirp,out,flush=True); sys.exit(3)
  return os.path.exists(f'{dirp}/{out}')
def norm(c,cx):  # 칸 하나를 키 167·발 185·가로 중심 cx로
  a=np.array(c)[...,3]; ys,xs=np.where(a>40)
  if len(ys)==0: return c
  box=c.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1)); s=168/(ys.max()-ys.min()+1)
  box=box.resize((max(1,round(box.width*s)),168),Image.LANCZOS)
  out=Image.new('RGBA',(192,192)); x0=round(cx-(xs.mean()-xs.min())*s); out.alpha_composite(box,(max(0,min(192-box.width,x0)),186-168)); return out
def grid4(p): im=Image.open(p).convert('RGBA'); return [im.crop((x*512,y*512,x*512+512,y*512+512)).resize((192,192),Image.LANCZOS) for y in (0,1) for x in (0,1)]
DIRN=['1 아래(정면)','2 오른아래','3 오른쪽','4 오른위','5 위(뒤)']
P_DIR=open(D+'/p-dir.txt').read(); P_WALK=open(D+'/p-walk.txt').read()
only=sys.argv[1:] or KEYS
for k in only:
  dp=f'{D}/{k}'; os.makedirs(dp,exist_ok=True)
  dirc=cells(Image.open(f'{A}/dir/{k}.webp').convert('RGBA'),5); walkc=cells(Image.open(f'{A}/walk/{k}.webp').convert('RGBA'),10)
  if not os.path.exists(dp+'/ref-dir.png'): ref_sheet(dirc,DIRN,dp+'/ref-dir.png')
  if not os.path.exists(dp+'/ref-walk.png'): ref_sheet(walkc,[f'{DIRN[i//2]} {"AB"[i%2]}' for i in range(10)],dp+'/ref-walk.png')
  if k=='korea' and not os.path.exists(dp+'/mid4.png'): Image.open(D+'/../korea-dir16/mid4.png').save(dp+'/mid4.png')
  if not codex(dp,P_DIR,[dp+'/ref-dir.png'],'mid4.png'): print('FAIL dir',k,flush=True); continue
  mids=grid4(dp+'/mid4.png')
  # 새 dir 9칸 (정리)
  cx=[float(np.where(np.array(c)[...,3]>40)[1].mean()) for c in dirc]
  dir9=[dirc[0],None,dirc[1],None,dirc[2],None,dirc[3],None,dirc[4]]
  for j in range(4): dir9[2*j+1]=norm(mids[j],(cx[j]+cx[j+1])/2)
  if not os.path.exists(dp+'/ref-dir9.png'): ref_sheet(dir9,['0°','A 22.5°','45°','B 67.5°','90°','C 112.5°','135°','D 157.5°','180°'],dp+'/ref-dir9.png')
  ok=codex(dp,P_WALK.replace('{X}','A').replace('{Y}','B'),[dp+'/ref-dir9.png',dp+'/ref-walk.png'],'walkAB.png') and codex(dp,P_WALK.replace('{X}','C').replace('{Y}','D'),[dp+'/ref-dir9.png',dp+'/ref-walk.png'],'walkCD.png')
  if not ok: print('FAIL walk',k,flush=True); continue
  w=grid4(dp+'/walkAB.png')+grid4(dp+'/walkCD.png')   # A걷A, A걷B, B걷A, B걷B, C걷A, C걷B, D걷A, D걷B
  walk18=[]
  for d in range(9):
    if d%2==0: walk18+= [walkc[d//2*2], walkc[d//2*2+1]]
    else:
      m=d//2; c0=dir9[d]; ccx=float(np.where(np.array(c0)[...,3]>40)[1].mean())
      walk18+= [norm(w[m*2],ccx), norm(w[m*2+1],ccx)]
  s9=Image.new('RGBA',(9*192,192)); [s9.alpha_composite(c,(i*192,0)) for i,c in enumerate(dir9)]; s9.save(dp+f'/{k}-dir9.webp','WEBP',quality=90)
  s18=Image.new('RGBA',(18*192,192)); [s18.alpha_composite(c,(i*192,0)) for i,c in enumerate(walk18)]; s18.save(dp+f'/{k}-walk18.webp','WEBP',quality=90)
  pv=Image.new('RGBA',(18*192,192*2+30),(52,51,61,255)); d=ImageDraw.Draw(pv); d.text((6,2),f'{KO[k]} ({k}) — 위: 서기 9칸 · 아래: 걷기 18칸 (노랑 = 새 칸)',fill='white',font=F)
  for i,c in enumerate(dir9): pv.alpha_composite(c,(i*384,30)); d.rectangle([i*384,30,i*384+191,221],outline=(255,214,102,255) if i%2 else (90,90,100,255))
  for i,c in enumerate(walk18): pv.alpha_composite(c,(i*192,222)); d.rectangle([i*192,222,i*192+191,413],outline=(255,214,102,255) if (i//2)%2 else (90,90,100,255))
  pv.convert('RGB').save(dp+f'/preview-{k}.png'); print('DONE',k,flush=True)
