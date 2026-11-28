# 22차: 스킬 "살아 움직이기"(사용자 결정: Claude 안) — 스킬마다 주인공 행동 그림 4칸(2×2, 반복 재생).
# 한국 2개 시험. 된 것은 건너뜀, 한도면 exit 3. src 안 건드림.
import os, sys, re, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont
ROOT='/home/user/poki-game'; D=os.path.dirname(os.path.abspath(__file__)); A=ROOT+'/src/assets'
F=ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',18)
LIMIT=re.compile(r'usage_limit_reached|429 Too Many|rate limit|quota|hit your usage limit',re.I)
COMMON="""- 1024×1024, 2×2 칸(512×512), 순서 좌상 1 → 우상 2 → 좌하 3 → 우하 4. **4칸이 0.08초씩 끝없이 반복**되는 동작이라 4칸 다음 1칸이 자연스럽게 이어져야 해요.
- **모든 칸에서 주인공의 위치·크기·방향이 같게**(움직이는 건 주인공의 몸짓과 주변 효과만). 칸 가장자리 28px 비움.
- 주인공은 **오른쪽을 향해 나아가는** 모습, 위에서 비스듬히(약 35°) 내려다보는 시점.
- 이 게임 그림체: 진한 외곽선 없는 반실사 판타지 일러스트, 색이 선명하고 밝은 부분은 빛남.
- 금지: 글자·숫자, 사람 얼굴, 국기, 종교 상징, 피, 보라색, 연두색.
이미지 생성이 한도 등으로 실패하면 코드로 대신 그리지 말고 result 파일에 실패라고만 적어 주세요."""
JOBS={
 'korea-1':dict(name='거북선 돌격',bg='green',refs=['skill/prop/korea-1','skill/u/korea-1'],
  p="""첨부 ref-1.png는 이 게임 스킬 「거북선 돌격」의 거북선 소품 그림, ref-2.png는 이 스킬의 대표 효과 그림이에요. **거북선이 살아 있는 것처럼 앞으로 돌진하는 4칸 반복 동작**을 이미지 생성해 act4.png로 저장해 주세요.
- 주인공: 작은 거북선(철갑 등껍질의 육각 무늬·쇠못, 앞의 용머리, 양옆 노). ref-1과 같은 배 모양·색.
- 동작: 1 노가 앞으로 · 2 노가 물을 힘껏 젓고 뱃머리 물보라 큼 · 3 노가 뒤로, 배가 살짝 앞으로 기울며 용머리 입에서 연기 한 줄 · 4 노를 들어 올림, 물보라 작아짐 → 다시 1.
- 배 아래와 뒤에 흰 물보라·물결 자국(배가 빠르게 나아가는 느낌), 몸체가 위아래로 아주 살짝 출렁임.
- 배경은 순수 초록 #00FF00 한 색(나중에 지워요). 초록이 배·물보라에 섞이지 않게.
"""),
 'korea-2':dict(name='천자총통 포격',bg='black',refs=['skill/u/korea-2','skill/prop/korea-2'],
  p="""첨부 ref-1.png는 이 게임 스킬 「천자총통 포격」의 대표 효과 그림, ref-2.png는 이 스킬의 화포 소품이에요. 화포에서 쏜 **포탄 불덩이가 살아 있는 것처럼 날아가는 4칸 반복 동작**을 이미지 생성해 act4.png로 저장해 주세요.
- 주인공: 검은 쇠 포탄이 주황·노랑 불길에 감싸여 오른쪽으로 날아감. 뒤로 길게 끌리는 불꽃 꼬리와 연기 띠, 튀는 불티.
- 동작: 1 불길이 앞으로 몰림 · 2 꼬리가 길게 펄럭이고 불티가 뒤로 흩어짐 · 3 불길이 크게 일렁이며 포탄이 살짝 회전 · 4 꼬리가 짧게 오므라듦 → 다시 1. 꼬리는 칸 왼쪽 끝까지, 포탄은 칸 오른쪽 1/3 지점.
- 배경 순수 검정 #000000(가산 합성용), 불과 빛만 밝게, 포탄 몸통은 어두운 주황빛 반사로.
"""),
}
def codex(dp,prompt,imgs,out):
  if os.path.exists(f'{dp}/{out}'): return True
  r=subprocess.run(['codex','exec','--skip-git-repo-check','--color','never','-s','workspace-write','-C',dp,'-o',f'{dp}/result.md',prompt]+sum([['-i',i] for i in imgs],[]),stdin=subprocess.DEVNULL,capture_output=True,text=True,timeout=1500)
  log=(r.stdout or '')+(r.stderr or ''); open(f'{dp}/log.txt','w').write(log[-4000:])
  if not os.path.exists(f'{dp}/{out}'):
    if LIMIT.search(log): print('LIMIT',dp,flush=True); sys.exit(3)
    return False
  return True
def ref(p,src,bg):
  if os.path.exists(p): return
  b=Image.new('RGBA',(512,512),bg); b.alpha_composite(Image.open(src).convert('RGBA').resize((512,512),Image.LANCZOS)); b.convert('RGB').save(p)
def key_green(a):
  a=a.astype(float); r,g,b=a[...,0],a[...,1],a[...,2]
  gs=g-np.maximum(r,b); al=np.clip(1-(gs-20)/90,0,1)*255
  a[...,1]=np.minimum(g,np.maximum(r,b)+10)  # 초록 번짐 제거
  a[...,3]=al; return a.clip(0,255).astype(np.uint8)
def key_black(a):
  a=a.astype(float)/255; rgb=a[...,:3]; lum=(rgb*[.299,.587,.114]).sum(-1); al=np.clip((lum-.04)/.22,0,1)
  rgb=np.clip(rgb/np.maximum(al[...,None],1e-3),0,1)*(al[...,None]>0); return (np.dstack([rgb,al])*255).astype(np.uint8)
os.makedirs(D+'/out',exist_ok=True)
for key,j in JOBS.items():
  if sys.argv[1:] and key not in sys.argv[1:]: continue
  dp=f'{D}/{key}'; os.makedirs(dp,exist_ok=True)
  for i,s in enumerate(j['refs']): ref(f'{dp}/ref-{i+1}.png',f'{A}/{s}.webp',(255,255,255,255) if 'prop' in s else (0,0,0,255))
  if not codex(dp,j['p']+COMMON,[f'{dp}/ref-1.png',f'{dp}/ref-2.png'],'act4.png'): print('FAIL',key,flush=True); continue
  a=np.array(Image.open(dp+'/act4.png').convert('RGBA').resize((1024,1024),Image.LANCZOS))
  im=Image.fromarray(key_green(a) if j['bg']=='green' else key_black(a))
  cs=[im.crop((x*512,y*512,x*512+512,y*512+512)).resize((192,192),Image.LANCZOS) for y in (0,1) for x in (0,1)]
  s=Image.new('RGBA',(4*192,192)); [s.alpha_composite(c,(i*192,0)) for i,c in enumerate(cs)]; s.save(f'{D}/out/{key}-act.webp','WEBP',quality=88,method=6)
  print('DONE',key,flush=True)
