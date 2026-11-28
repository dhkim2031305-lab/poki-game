# 크게 다시 뽑기 (사용자 "양보단 질"): 원본 sheet(칸 512) → hit·ground·body·blast·dust 512, act·after·aura·burn·fire-ground 384, debris 256
# 사용: python3 hires.py <출력폴더> [이름 ...]   (이름 없으면 전부)  — 가장자리 부드럽게 + 보라 보정 + webp 88
import os, sys, glob, numpy as np
from PIL import Image
G=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,G+'/round23-nano'); import run
SIZE={'hit':512,'ground':512,'body':512,'blast':512,'dust':512,'act':384,'after':384,'aura':384,'burn':384,'fire-ground':384,'debris':256,'shield':512,'ring':512}
def fix(a):
  a=a.astype(float)/255; rgb=a[...,:3]; mx=rgb.max(-1); mn=rgb.min(-1); d=mx-mn+1e-9; r,g,b=rgb[...,0],rgb[...,1],rgb[...,2]
  h=np.where(mx==r,((g-b)/d)%6,np.where(mx==g,(b-r)/d+2,(r-g)/d+4))*60; s=np.where(mx>0,d/(mx+1e-9),0); v=mx
  pur=(h>=275)&(h<=345)&(s>.15); h=np.where(pur&(h<310),232,np.where(pur,356,h))
  C=v*s; X=C*(1-np.abs((h/60)%2-1)); m=v-C; z=np.zeros_like(h); i=(h//60).astype(int)%6
  out=np.select([i[...,None]==k for k in range(6)],[np.stack(t,-1) for t in [(C,X,z),(X,C,z),(z,C,X),(z,X,C),(X,z,C),(C,z,X)]])+m[...,None]
  return (np.dstack([out,a[...,3]])*255).clip(0,255).astype(np.uint8)
def jobs():
  J={}
  R23=G+'/round23-nano'
  for kind in ['act','hit','after','ground','debris','shield','aura','body']:
    for j in run.jobs(kind,[]):
      sp=f"{R23}/w/{j['key']}/sheet.png"
      if os.path.exists(sp): J[j['key']]=dict(j,sheet=sp)
  R22=G+'/round22-alive'
  for key,src,grid,bg in [('korea-1-act','korea-1/act4.png',(2,2),'green'),('korea-2-act','korea-2/act4.png',(2,2),'black'),
      ('korea-1-hit','korea-1-hit/sheet.png',(3,2),'black'),('korea-2-blast','korea-2-blast/sheet.png',(3,2),'black'),('korea-dust','korea-dust/sheet.png',(3,2),'green'),
      ('korea-burn','korea-burn/sheet.png',(2,2),'black'),('korea-fire-ground','korea-fire-ground/sheet.png',(2,2),'black'),('korea-ground','korea-ground/sheet.png',(3,2),'green'),
      ('korea-debris','korea-debris/sheet.png',(3,2),'green'),('aura-fire','korea-2-aura/sheet.png',(2,2),'black')]:
    if os.path.exists(f'{R22}/{src}'): J[key]=dict(key=key,grid=grid,bg=bg,cell=0,sheet=f'{R22}/{src}')
  return J
def size_of(key):
  if key.startswith('aura'): return SIZE['aura']
  if key.startswith('invuln'): return 512
  for s in ['fire-ground','debris','blast','dust','burn','ground','after','body','act','hit']:
    if key.endswith(s): return SIZE[s]
  return 384
if __name__=='__main__':
  out=sys.argv[1]; names=sys.argv[2:]; os.makedirs(out,exist_ok=True)
  J=jobs(); n=0
  for key,j in sorted(J.items()):
    if names and key not in names: continue
    j=dict(j,cell=size_of(key))
    import tempfile; t=tempfile.mkdtemp(); os.makedirs(t+'/w',exist_ok=True); os.makedirs(t+'/out',exist_ok=True)
    os.symlink(j['sheet'],t+'/w/sheet.png'); D0=run.D; run.D=t
    try: run.post(t+'/w',j)
    finally: run.D=D0
    Image.fromarray(fix(np.array(Image.open(f"{t}/out/{key}.webp").convert('RGBA')))).save(f'{out}/{key}.webp','WEBP',quality=88,method=5); n+=1
    print('ok',key,j['cell'],flush=True)
  print('done',n)
