# 19차: 스킬 소품 그림 60개 = 2×2 시트 15장(시트 n = 4개). 인자 A(시트 1~8) / B(9~15) / 시트 번호들. 된 것은 건너뜀, 한도면 exit 3. src 안 건드림.
import os, sys, json, re, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont
ROOT='/home/user/poki-game'; D=os.path.dirname(os.path.abspath(__file__)); A=ROOT+'/src/assets'
F=ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',18)
LIMIT=re.compile(r'usage_limit_reached|429 Too Many|rate limit|quota|hit your usage limit',re.I)
rows=json.load(open(D+'/props60.json')); arg=sys.argv[1:]
sheets=list(range(1,9)) if arg==['A'] else list(range(9,16)) if arg==['B'] else ([int(x) for x in arg] or list(range(1,16)))
def ref(sh,rs,p):
  if os.path.exists(p): return
  ks=list(dict.fromkeys(r['k'] for r in rs)); r=Image.new('RGBA',(1024,560),(255,255,255,255)); d=ImageDraw.Draw(r)
  for i,k in enumerate(ks):  # 장수 정면 + 옆 (그림체 참고)
    dc=Image.open(f'{A}/dir/{k}.webp').convert('RGBA')
    for j,ci in enumerate((0,2)): r.alpha_composite(dc.crop((ci*192,0,ci*192+192,192)).resize((240,240),Image.LANCZOS),(i*512+j*256,40))
  for i,x in enumerate(rs):
    b=Image.new('RGBA',(240,240),(0,0,0,255)); b.alpha_composite(Image.open(f"{A}/skill/u/{x['k']}-{x['n']}.webp").convert('RGBA').resize((240,240))); r.alpha_composite(b,(i*256,300))
  d.text((8,8),'위: 장수 그림체 · 아래: 각 칸 스킬의 대표 효과 그림(색 참고)',fill='black',font=F); r.convert('RGB').save(p)
for n in sheets:
  rs=[r for r in rows if r['sheet']==n]; dp=f'{D}/s{n:02d}'; os.makedirs(dp,exist_ok=True); out=f'{dp}/sheet.png'
  ref(n,rs,dp+'/ref.png')
  pos=['좌상','우상','좌하','우하']
  items='\n'.join(f"- {pos[i]} 칸: {r['ko']} {r['n']}번 스킬 「{r['name']}」의 소품 — **{r['prop']}**." for i,r in enumerate(rs))
  prompt=f"""첨부 ref.png 위쪽은 이 게임 장수 그림(그림체 기준), 아래쪽은 각 칸 스킬의 효과 그림(색 참고)이에요. 스킬 때 장수가 쓰거나 날려 보내는 **소품 그림 4개**를 같은 그림체로 이미지 생성해 sheet.png로 저장해 주세요.
- 1024×1024, 배경 투명(안 되면 순수 흰색 #FFFFFF), 2×2 칸(512×512). 칸 가장자리 32px 비움, 칸끼리 넘치지 않게.
{items}
- 모든 소품: 물건 하나만(사람·장수·손 없음), 위에서 비스듬히(3/4) 본 모습, 오른쪽을 향함, 칸 가운데 아래에 놓인 듯(바닥 닿는 곳이 칸 아래쪽 1/6 지점), 긴 변이 칸의 70~80%. 두꺼운 어두운 외곽선, 장수 그림과 같은 채색·명암, 재료 질감(쇠·청동·나무·천·돌)이 보이게. 빛 효과·그림자·바닥은 그리지 않아요.
- 금지: 글자·숫자, 국기 모양 그대로, 사람 얼굴, 종교 상징, 피, 보라색, 연두색, 초승달 모양.
이미지 생성이 한도 등으로 실패하면 코드로 대신 그리지 말고 result 파일에 실패라고만 적어 주세요."""
  if not os.path.exists(out):
    r=subprocess.run(['codex','exec','--skip-git-repo-check','--color','never','-s','workspace-write','-C',dp,'-o',f'{dp}/result.md',prompt,'-i',dp+'/ref.png'],stdin=subprocess.DEVNULL,capture_output=True,text=True,timeout=1500)
    log=(r.stdout or '')+(r.stderr or ''); open(f'{dp}/log.txt','w').write(log[-4000:])
    if not os.path.exists(out):
      if LIMIT.search(log): print('LIMIT',n,flush=True); sys.exit(3)
      print('FAIL',n,flush=True); continue
  im=Image.open(out).convert('RGBA').resize((1024,1024),Image.LANCZOS); a=np.array(im).astype(float)
  if a[...,3].min()>250: a[...,3]=np.clip((255-a[...,:3]).max(-1)*6,0,255)   # 흰 배경 → 투명
  im=Image.fromarray(a.astype(np.uint8)); pv=Image.new('RGBA',(4*200,240),(43,42,51,255)); d=ImageDraw.Draw(pv)
  for i,r in enumerate(rs):
    c=im.crop(((i%2)*512,(i//2)*512,(i%2)*512+512,(i//2)*512+512)); al=np.array(c)[...,3]; ys,xs=np.where(al>40)
    if len(ys)==0: continue
    box=c.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1)); s=176/max(box.size); box=box.resize((max(1,round(box.width*s)),max(1,round(box.height*s))),Image.LANCZOS)
    o=Image.new('RGBA',(192,192)); o.alpha_composite(box,(96-box.width//2,184-box.height)); o.save(f"{dp}/{r['k']}-{r['n']}.webp",'WEBP',quality=90)
    pv.alpha_composite(o,(i*200+4,4)); d.text((i*200+6,200),f"{r['ko']} {r['n']} {r['px']}px",fill='white',font=F)
  pv.convert('RGB').save(f'{dp}/preview.png'); print('DONE',n,flush=True)
