# QA ee692d0: 칸 가장자리 직선 잘림 → 부드러운 가장자리로 다시 처리 → 보라 보정 → 품질 80 → final/ (src 반영은 따로)
import os, sys, glob, numpy as np
from PIL import Image
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); import run
D=os.path.dirname(os.path.abspath(__file__)); F=D+'/final'
def fix(a):
  a=a.astype(float)/255; rgb=a[...,:3]; mx=rgb.max(-1); mn=rgb.min(-1); d=mx-mn+1e-9; r,g,b=rgb[...,0],rgb[...,1],rgb[...,2]
  h=np.where(mx==r,((g-b)/d)%6,np.where(mx==g,(b-r)/d+2,(r-g)/d+4))*60; s=np.where(mx>0,d/(mx+1e-9),0); v=mx
  pur=(h>=275)&(h<=345)&(s>.15); h=np.where(pur&(h<310),232,np.where(pur,356,h))
  C=v*s; X=C*(1-np.abs((h/60)%2-1)); m=v-C; z=np.zeros_like(h); i=(h//60).astype(int)%6
  out=np.select([i[...,None]==k for k in range(6)],[np.stack(t,-1) for t in [(C,X,z),(X,C,z),(z,C,X),(z,X,C),(X,z,C),(C,z,X)]])+m[...,None]
  return (np.dstack([out,a[...,3]])*255).clip(0,255).astype(np.uint8)
n=0
for f in sorted(glob.glob(F+'/*.webp')):
  key=os.path.basename(f)[:-5]
  if key.startswith('invuln'): js=[j for j in run.jobs('shield',[]) if j['key']==key]
  elif key.endswith('-debris'): js=run.jobs('debris',[key[:-7]])
  else: kind=key.rsplit('-',1)[1]; js=[j for j in run.jobs(kind,[key.rsplit('-',1)[0]]) if j['key']==key]
  if not js or not os.path.exists(f'{D}/w/{key}/sheet.png'): print('skip',key); continue
  run.post(f'{D}/w/{key}',js[0])
  Image.fromarray(fix(np.array(Image.open(f'{D}/out/{key}.webp').convert('RGBA')))).save(f,'WEBP',quality=80,method=6); n+=1
print('done',n)
