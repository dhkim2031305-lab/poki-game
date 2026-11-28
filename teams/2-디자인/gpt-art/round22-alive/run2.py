# 22차-2: 개발팀 작업15 요청(한국 샘플) — 착탄 폭발·뱃머리 충돌·먼지 여운. 6칸(3×2 시트) → 한 줄 6칸 256px.
# 팀장 전달 스타일 진단 반영: 형광 금지, 돌·강철·낡은 금 + 나라색 눌러서, 짙은 윤곽·명암 2~3단, 바닥 효과 세로 0.5.
import os, sys, re, subprocess
import numpy as np
from PIL import Image
D=os.path.dirname(os.path.abspath(__file__))
LIMIT=re.compile(r'usage_limit_reached|429 Too Many|rate limit|quota|hit your usage limit',re.I)
STYLE="""- 이 게임 그림체에 맞춰요: 반실사 판타지지만 **짙은 윤곽 1~2px + 명암 2~3단**, 잔세부는 큰 면으로. **형광·네온 금지**, 색은 화약 주황·흙빛·그을린 갈색·낡은 금·회색 돌 계열로 차분하게.
- 바닥에 퍼지는 부분은 위에서 비스듬히 본 것처럼 **세로 0.5배로 납작**하게.
- 1536×1024, 3×2 칸(512×512) 순서 좌상 1 → 2 → 3, 좌하 4 → 5 → 6. 칸 가장자리 24px 비움. **모든 칸에서 중심 위치·크기 기준이 같게**.
- 금지: 글자·숫자, 사람, 피, 보라색·분홍색, 연두색.
이미지 생성이 한도 등으로 실패하면 코드로 대신 그리지 말고 result 파일에 실패라고만 적어 주세요."""
JOBS={
 'korea-2-blast':dict(bg='black',p="""조선 천자총통 포탄이 땅에 떨어져 **터지는 폭발 6칸**을 이미지 생성해 sheet.png로 저장해 주세요(가산 합성용 순수 검정 #000000 배경).
- 1 땅에 닿는 순간 작고 강한 흰·노랑 섬광 · 2 주황 화약 불덩이가 둥글게 부풀고 흙덩이·돌 조각이 튐 · 3 가장 큰 순간: 주황·붉은 불길 + 바닥에 납작한 충격 고리(흙먼지) · 4 불길이 꺼지며 검붉은 연기, 파편이 떨어짐 · 5 그을린 연기와 남은 불씨 · 6 거의 사라진 연기 조각.
- 섬광은 1~2칸만. 색은 화약 주황·흙빛, 분홍 고리 금지.
"""),
 'korea-1-hit':dict(bg='black',p="""철갑 거북선의 뱃머리(용머리)가 적에게 **들이받는 순간의 충돌 6칸**을 이미지 생성해 sheet.png로 저장해 주세요(가산 합성용 순수 검정 #000000 배경). 진행 방향은 **오른쪽**(충돌 면이 칸 가운데, 파편은 오른쪽·위아래로 튐).
- 1 부딪히는 점에 짧은 흰·노랑 섬광 · 2 부채꼴로 터지는 불꽃 + 쪼개진 나무 파편(갈색, 진한 윤곽) · 3 파편이 멀리, 물보라 몇 방울 · 4 불꽃 줄어듦 · 5 파편 몇 개와 불티 · 6 거의 사라짐.
- 섬광은 1~2칸만. 주황·노랑 불꽃 + 갈색 나무 + 흰 물보라.
"""),
 'korea-dust':dict(bg='green',p="""포격·돌진 뒤 바닥에 남는 **먼지·그을음 여운 6칸**을 이미지 생성해 sheet.png로 저장해 주세요. 배경은 순수 초록 #00FF00 한 색(나중에 지워요), 먼지에 초록이 섞이지 않게.
- 무채색(회색·검회색·옅은 흙빛 회색)의 불투명한 먼지 구름, 바닥에 납작하게 깔림.
- 1 먼지가 크게 일어남 · 2 퍼짐 · 3 가라앉기 시작 · 4 옅어짐 · 5 바닥에 그을린 자국 + 옅은 연기 · 6 그을린 자국만(이 칸이 오래 보임).
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
  a=np.array(Image.open(dp+'/sheet.png').convert('RGBA').resize((1536,1024),Image.LANCZOS))
  im=Image.fromarray(key_green(a) if j['bg']=='green' else key_black(a))
  cs=[im.crop((x*512,y*512,x*512+512,y*512+512)).resize((256,256),Image.LANCZOS) for y in (0,1) for x in (0,1,2)]
  s=Image.new('RGBA',(6*256,256)); [s.alpha_composite(c,(i*256,0)) for i,c in enumerate(cs)]; s.save(f'{D}/out/{key}.webp','WEBP',quality=86,method=6)
  print('DONE',key,flush=True)
