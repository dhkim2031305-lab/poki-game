# 22차-3: 사용자 "스킬 뒤에 불타거나 몬스터들이 불타거나" + 팀장 성분 나누기(①바닥 ②세움 ③파편).
import os, sys, re, subprocess
import numpy as np
from PIL import Image
D=os.path.dirname(os.path.abspath(__file__))
LIMIT=re.compile(r'usage_limit_reached|429 Too Many|rate limit|quota|hit your usage limit',re.I)
STYLE="""- 이 게임 그림체: 반실사 판타지, **짙은 윤곽 1~2px + 명암 2~3단**, 잔세부는 큰 면으로. 형광·네온 금지, 화약 주황·흙빛·그을린 갈색·회색 계열로 차분하게.
- 금지: 글자·숫자, 사람, 피, 보라색·분홍색, 연두색.
이미지 생성이 한도 등으로 실패하면 코드로 대신 그리지 말고 result 파일에 실패라고만 적어 주세요."""
G2="- 1024×1024, 2×2 칸(512×512), 순서 좌상 1 → 우상 2 → 좌하 3 → 우하 4. **4칸이 0.08초씩 끝없이 반복**되게 4→1이 자연스럽게. 모든 칸에서 위치·크기 기준이 같게. 칸 가장자리 28px 비움.\n"
JOBS={
 'korea-burn':dict(bg='black',grid=(2,2),cell=192,p="""**몸에 붙어 타오르는 불길 4칸 반복**(②세움 성분: 옆에서 본 모습, 불길의 **아래 가운데가 칸 아래쪽 가운데(바닥선)**)을 이미지 생성해 sheet.png로 저장해 주세요. 적의 몸 위에 겹쳐 그려서 '적이 불타는' 모습이 돼요 — 적은 그리지 말고 **불길만**. 배경 순수 검정 #000000(가산 합성).
- 폭 칸의 절반 정도, 높이 칸의 70%. 주황·노랑 불혀 3~4갈래가 위로 일렁이고 위쪽에 검은 연기 꼬리, 작은 불티.
"""+G2),
 'korea-2-aura':dict(bg='black',grid=(2,2),cell=256,p="""천자총통을 쏘는 장수의 **온몸을 뒤덮는 불길 4칸 반복**(②세움: 옆에서 본 모습)을 이미지 생성해 sheet.png로 저장해 주세요. 게임이 장수 그림 뒤·앞에 겹쳐서 '장수가 불에 휩싸인' 모습이 돼요 — **사람은 그리지 말고 불길만**. 배경 순수 검정 #000000(가산 합성).
- 모양: 서 있는 사람 몸(칸 높이의 75%, 폭 35%)을 감싸는 **세로로 긴 불꽃 덩어리** — 가운데(몸 자리)는 비교적 옅고, 둘레를 따라 주황·노랑 불혀가 위로 크게 치솟아 머리 위로 1.3배까지 솟음. 발밑에 둥글게 퍼지는 작은 불 고리. 위쪽에 불티와 검은 연기 꼬리 약간.
- 아래 가운데가 바닥(칸 아래 가운데). 화약 주황·노랑·붉은색, 흰 심은 조금만.
"""+G2),
 'korea-fire-ground':dict(bg='black',grid=(2,2),cell=192,p="""**땅바닥에 남아 타는 작은 불 4칸 반복**(②세움 성분: 옆에서 본 모습, 불의 **아래 가운데가 칸 아래 가운데(바닥선)**)을 이미지 생성해 sheet.png로 저장해 주세요. 포탄 맞은 자리에 몇 개 흩어져 1~2초 타요. 배경 순수 검정 #000000(가산 합성).
- 낮고 넓은 불(폭 칸의 60%, 높이 40%), 아래에 붉게 달아오른 숯·잔불, 위로 가는 연기 한 줄.
"""+G2),
 'korea-ground':dict(bg='green',grid=(3,2),cell=256,p="""**바닥에 눕힐 성분(①)** 6칸을 이미지 생성해 sheet.png로 저장해 주세요. 코드가 바닥에 눕혀 그리니 **바로 위에서 내려다본 완전한 원형**으로 그려요(납작하게 하지 마세요). 배경은 순수 초록 #00FF00 한 색(나중에 지워요), 그림에 초록 섞이지 않게.
- 1~4칸: 포탄이 떨어진 자리의 **충격파 고리**가 퍼지는 4단계(1 작고 진한 흙먼지 고리 → 4 크고 옅게 흩어짐). 흙빛·회갈색, 고리 안쪽은 비어 있음.
- 5칸: **그을린 착탄 자국**(검게 탄 흙 + 가운데 패인 구덩이 + 사방으로 뻗은 그을음 줄). 6칸: 5칸의 옅은 버전(사라지기 직전).
- 1536×1024, 3×2 칸(512×512) 순서 좌상 1→2→3, 좌하 4→5→6. 모든 칸 중심 같게, 가장자리 24px 비움.
"""),
 'korea-debris':dict(bg='green',grid=(3,2),cell=128,p="""**튀는 파편 낱장(③)** 6개를 이미지 생성해 sheet.png로 저장해 주세요. 코드가 하나씩 포물선으로 던지고 그림자를 붙여요. 배경은 순수 초록 #00FF00 한 색(나중에 지워요), 그림에 초록 섞이지 않게.
- 1 회색 돌 조각 · 2 흙덩이 · 3 쪼개진 나무 조각(갈색) · 4 부러진 노 조각 · 5 빨갛게 달아오른 쇳조각 · 6 불붙은 작은 나무 조각(끝에 작은 불).
- 1536×1024, 3×2 칸(512×512), 칸마다 파편 1개를 **칸 가운데에 칸의 40% 크기**로, 비스듬히 위에서 본 모습.
"""),
}
def codex(dp,prompt,out):
  if os.path.exists(f'{dp}/{out}'): return True
  r=subprocess.run(['codex','exec','--skip-git-repo-check','--color','never','-s','workspace-write','-C',dp,'-o',f'{dp}/result.md',prompt],stdin=subprocess.DEVNULL,capture_output=True,text=True,timeout=1500)
  log=(r.stdout or '')+(r.stderr or ''); open(f'{dp}/log.txt','w').write(log[-4000:])
  if not os.path.exists(f'{dp}/{out}'):
    if LIMIT.search(log): print('LIMIT',dp,flush=True); sys.exit(3)
    return False
  return True
def key_green(a):
  a=a.astype(float); r,g,b=a[...,0],a[...,1],a[...,2]; gs=g-np.maximum(r,b)
  al=np.clip(1-(gs-12)/70,0,1)*255; a[...,1]=np.minimum(g,np.minimum(np.maximum(r,b),r*.55+b*.45+8)); a[...,3]=al; return a.clip(0,255).astype(np.uint8)
def key_black(a):
  a=a.astype(float)/255; rgb=a[...,:3]; lum=(rgb*[.299,.587,.114]).sum(-1); al=np.clip((lum-.04)/.22,0,1)
  rgb=np.clip(rgb/np.maximum(al[...,None],1e-3),0,1)*(al[...,None]>0); return (np.dstack([rgb,al])*255).astype(np.uint8)
os.makedirs(D+'/out',exist_ok=True)
for key,j in JOBS.items():
  if sys.argv[1:] and key not in sys.argv[1:]: continue
  dp=f'{D}/{key}'; os.makedirs(dp,exist_ok=True)
  if not codex(dp,j['p']+STYLE,'sheet.png'): print('FAIL',key,flush=True); continue
  cx,cy=j['grid']; c=j['cell']
  a=np.array(Image.open(dp+'/sheet.png').convert('RGBA').resize((cx*512,cy*512),Image.LANCZOS))
  im=Image.fromarray(key_green(a) if j['bg']=='green' else key_black(a))
  cs=[im.crop((x*512,y*512,x*512+512,y*512+512)).resize((c,c),Image.LANCZOS) for y in range(cy) for x in range(cx)]
  s=Image.new('RGBA',(len(cs)*c,c)); [s.alpha_composite(q,(i*c,0)) for i,q in enumerate(cs)]; s.save(f'{D}/out/{key}.webp','WEBP',quality=86,method=6)
  print('DONE',key,flush=True)
