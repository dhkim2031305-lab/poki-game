# 14차 보정: 보라(275–345°)→빨강/파랑, 연두(65–110°)→에메랄드 147°, 어두운 테두리·회색 상자 제거(밝기 기반 알파), 칠레1은 redo/cell-55
import numpy as np, colorsys, sys, os
from PIL import Image
R='teams/2-디자인/gpt-art/round14/'
keys=['luxembourg','ireland','switzerland','usa','netherlands','denmark','austria','australia','germany','sweden','canada','finland','france','italy','korea','spain','czechia','israel','lithuania','newzealand','japan','portugal','poland','hungary','slovakia','greece','turkiye','chile','mexico','colombia']
def rgb2hsv(a):
  r,g,b=a[...,0],a[...,1],a[...,2];mx=a.max(-1);mn=a.min(-1);d=mx-mn+1e-9
  h=np.where(mx==r,((g-b)/d)%6,np.where(mx==g,(b-r)/d+2,(r-g)/d+4))*60;s=np.where(mx>0,(mx-mn)/(mx+1e-9),0);return h,s,mx
def hsv2rgb(h,s,v):
  c=v*s;x=c*(1-np.abs((h/60)%2-1));m=v-c;z=np.zeros_like(h);i=(h//60).astype(int)%6
  rgb=np.select([i[...,None]==k for k in range(6)],[np.stack(t,-1) for t in [(c,x,z),(x,c,z),(z,c,x),(z,x,c),(x,z,c),(c,z,x)]]);return rgb+m[...,None]
def fix(cell,graybox=False,keepdark=False):
  a=cell.astype(float)/255;rgb=a[...,:3];al=a[...,3]
  h,s,v=rgb2hsv(rgb)
  pur=(h>=275)&(h<=345)&(s>.15); h=np.where(pur&(h<310),232,np.where(pur,356,h))
  lime=(h>=65)&(h<=110)&(s>.15); h=np.where(lime,147,h)
  rgb=hsv2rgb(h,s,v)
  if not keepdark:
    lum=(rgb*[.299,.587,.114]).sum(-1)
    al=al*np.clip((lum-.10)/.25,0,1)            # 검은 번짐 제거
    if graybox: al=np.where((s<.14)&(al<.5),al*np.clip((al-.25)/.25,0,1),al)   # 회색 상자 제거
  a[...,:3]=rgb;a[...,3]=al;return (np.clip(a,0,1)*255).astype(np.uint8)
out={}
for n in range(1,16):
  im=np.array(Image.open(R+f'sheet-{n:02d}.png').convert('RGBA'))
  for (cx,cy),(ci,num) in zip([(0,0),(1,0),(0,1),(1,1)],[(2*n-2,1),(2*n-2,2),(2*n-1,1),(2*n-1,2)]):
    k=f'{keys[ci]}-{num}'
    if k=='chile-1': c=np.array(Image.open(R+'redo/cell-55.png').convert('RGBA').resize((512,512),Image.LANCZOS))
    else: c=im[cy*512:cy*512+512,cx*512:cx*512+512]
    out[k]=(c,fix(c,graybox=(n==15),keepdark=(k=='chile-2')))
os.makedirs(R+'fixed256',exist_ok=True)
for k,(b,f) in out.items(): Image.fromarray(f).resize((256,256),Image.LANCZOS).save(R+f'fixed256/{k}.webp','WEBP',quality=85,method=6)
import pickle;pickle.dump({k:(b,f) for k,(b,f) in out.items()},open('/tmp/claude-0/-home-user-poki-game/46d369c3-0fa5-5c6f-9489-ae3d463ad221/scratchpad/r14.pkl','wb'))
print(len(out), sum(os.path.getsize(R+'fixed256/'+f) for f in os.listdir(R+'fixed256'))//1024,'KB')
