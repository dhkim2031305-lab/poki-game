# 20차: 공통 연속 그림 5종(무채색, 게임에서 나라 색 입힘). 1종 = GPT 1번(3×2 시트). 인자: 종류들(없으면 전부). 된 것은 건너뜀, 한도면 exit 3. src 안 건드림.
import os, sys, re, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont
D=os.path.dirname(os.path.abspath(__file__)); ROOT='/home/user/poki-game'
F=ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',18)
LIMIT=re.compile(r'usage_limit_reached|429 Too Many|rate limit|quota|hit your usage limit',re.I)
GLOW='배경 순수 검정 #000000(가산 합성용), 효과만 밝게.'; SOLID='배경 투명(안 되면 순수 초록 #00FF00 — 그림 안에는 초록을 쓰지 말 것).'
K={'slash':(GLOW,'칼빛 — 오른쪽 위에서 오른쪽 아래로 휘두른 넓은 부채꼴 칼빛 호(초승달 모양이 아니라 두툼한 부채꼴 띠, 끝은 가늘게). 1 얇게 생김 · 2 넓어짐 · 3 가장 밝음(흰 심 + 옅은 빛 테) · 4 끝부터 빛 조각으로 흩어지기 시작 · 5 반쯤 흩어짐 · 6 거의 사라짐.'),
 'impact':(GLOW,'착탄 — 위에서 떨어진 것이 바닥에 닿는 순간. 1 바닥 닿는 작은 흰 섬광 · 2 바닥에 납작한 충격 원(세로 0.45배) + 위로 솟는 먼지·불꽃 기둥 · 3 기둥이 가장 큼, 돌 조각 몇 개 튐 · 4 기둥이 퍼지며 옅어짐 · 5 불꽃 알갱이만 남음 · 6 거의 사라짐. 효과 중심은 칸 가운데 아래쪽(256,360).'),
 'line':(GLOW,'베기 선 — 가로 한 줄 칼날 섬광. 1 왼쪽에서 가는 선이 그어지기 시작 · 2 선이 오른쪽 끝까지 · 3 선이 굵고 가장 밝음(흰 심) · 4 선 가운데부터 갈라짐 · 5 조각으로 흩어짐 · 6 거의 사라짐. 칸 가로 폭의 90%를 쓰는 수평선.'),
 'smoke':(SOLID,'여운 — 1~5칸: 바닥에서 피어오르는 회색 연기 한 줌이 점점 커지고 옅어짐(1 작고 진함 → 5 크고 거의 투명). 6칸: 위에서 본 바닥 그을음 자국 한 장(어두운 회색 얼룩, 가장자리 부드럽게, 세로 0.45배 납작). 색은 회색·흰색만(무채색).'),
 'ring':(GLOW,'퍼지는 고리 — 바닥에 눕힌 원형 고리(세로 0.45배로 납작한 타원 고리)가 가운데서 바깥으로 퍼짐. 1 작은 밝은 고리 · 2 커짐 · 3 칸의 70% 크기, 가장 밝음(흰 테 + 옅은 빛) · 4 칸의 85%, 옅어짐 · 5 칸 가장자리 근처, 아주 옅음 · 6 거의 사라짐. 고리 중심 = 칸 가운데.')}
P='''이 게임(2D 판타지, 위에서 비스듬히 내려다보는 시점)에서 여러 나라 스킬이 같이 쓰는 **연속 효과 그림 6칸**을 이미지 생성해 {OUT}로 저장해 주세요. 게임에서 이 그림에 나라 색을 입히므로 **흰색·옅은 회색 무채색으로만** 그려요(가장 밝은 심은 흰색, 빛 테는 옅은 회색).
- 1536×1024, 3×2 칸(512×512) 순서 좌상 1 → 2 → 3, 좌하 4 → 5 → 6. 칸 가장자리 24px 비움, 칸끼리 넘치지 않게. 0.06초 간격으로 이어 재생돼요 — 칸마다 크기·위치·모양이 자연스럽게 이어지게.
- {BG}
- {DESC}
- 금지: 색(빨강·파랑 등 유채색), 글자·숫자, 사람·무기·물건, 초승달 모양, 테두리.
이미지 생성이 한도 등으로 실패하면 코드로 대신 그리지 말고 result 파일에 실패라고만 적어 주세요.'''
todo=sys.argv[1:] or list(K)
for k in todo:
  bg,desc=K[k]; out=f'{D}/{k}6.png'
  if not os.path.exists(out):
    r=subprocess.run(['codex','exec','--skip-git-repo-check','--color','never','-s','workspace-write','-C',D,'-o',f'{D}/result-{k}.md',P.replace('{OUT}',f'{k}6.png').replace('{BG}',bg).replace('{DESC}',desc)],stdin=subprocess.DEVNULL,capture_output=True,text=True,timeout=1500)
    log=(r.stdout or '')+(r.stderr or ''); open(f'{D}/log-{k}.txt','w').write(log[-4000:])
    if not os.path.exists(out):
      if LIMIT.search(log): print('LIMIT',k,flush=True); sys.exit(3)
      print('FAIL',k,flush=True); continue
  a=np.array(Image.open(out).convert('RGBA').resize((1536,1024),Image.LANCZOS)).astype(float)
  if a[...,3].min()>250:
    if bg is GLOW:   # 검은 배경 → 밝기 알파, 무채색으로
      lum=(a[...,:3]*[.299,.587,.114]).sum(-1)/255; al=np.clip((lum-.05)/.3,0,1); v=np.clip(lum/np.maximum(al,1e-3),0,1)
    else:            # 초록 배경 키
      g=a[...,1]-np.maximum(a[...,0],a[...,2]); al=np.clip(1-(g-20)/60,0,1); lum=(a[...,:3]*[.299,.587,.114]).sum(-1)/255; v=lum
    a[...,0]=a[...,1]=a[...,2]=v*255; a[...,3]=al*255
  else:
    lum=(a[...,:3]*[.299,.587,.114]).sum(-1); a[...,0]=a[...,1]=a[...,2]=lum
  im=Image.fromarray(a.astype(np.uint8))
  cs=[im.crop((x*512,y*512,x*512+512,y*512+512)).resize((256,256),Image.LANCZOS) for y in (0,1) for x in (0,1,2)]
  os.makedirs(D+'/out',exist_ok=True); s=Image.new('RGBA',(6*256,256)); [s.alpha_composite(c,(i*256,0)) for i,c in enumerate(cs)]; s.save(f'{D}/out/common-{k}.webp','WEBP',quality=88)
  pv=Image.new('RGBA',(6*256,3*256+30),(43,42,51,255)); dr=ImageDraw.Draw(pv); dr.text((6,4),f'common-{k} — 위: 무채색 원본 · 가운데: 한국 빨강 입힘 · 아래: 스웨덴 파랑 입힘',fill='white',font=F)
  for row,col in enumerate([None,(224,65,75),(58,108,220)]):
    for i,c in enumerate(cs):
      t=c if col is None else Image.fromarray((np.array(c).astype(float)*np.array([col[0]/255,col[1]/255,col[2]/255,1])).astype(np.uint8))
      if col is not None: t=Image.alpha_composite(t,Image.fromarray((np.array(c).astype(float)*[1,1,1,.35]).astype(np.uint8)))
      pv.alpha_composite(t,(i*256,30+row*256))
  pv.convert('RGB').save(f'{D}/preview-{k}.png'); print('DONE',k,flush=True)
