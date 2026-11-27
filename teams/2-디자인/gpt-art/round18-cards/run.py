# 18차: 아이템 카드 아이콘 8종 (GPT 2번: cardsA 4개 + cardsB 4개). 된 것은 건너뜀, 한도면 exit 3. src 안 건드림.
import os, sys, subprocess, re
import numpy as np
from PIL import Image, ImageDraw, ImageFont
D=os.path.dirname(os.path.abspath(__file__)); ROOT='/home/user/poki-game'
LIMIT=re.compile(r'usage_limit_reached|429 Too Many|rate limit|quota|hit your usage limit',re.I)
F=ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',20)
NAMES=['atk','aspd','small','big','move','pierce','split','skill']; KO=['공격력','공격 속도','작아지기','커지기','이동 속도','관통 쏘기','세 갈래 쏘기','스킬 +1']
JOBS=[('cardsA.png','- 1 공격력: 위로 곧게 선 금빛 장검 + 칼날 뒤 위쪽을 향한 빨강 #F2452E 갈매기 화살표(▲ 두 겹).\n- 2 공격 속도: 비스듬히 엇갈린 칼 두 자루 + 뒤로 흐르는 하늘 #5FB4EE 속도선 3줄.\n- 3 작아지기: 작은 투구 쓴 기사 실루엣(얼굴 없음) + 바깥에서 안으로 향한 에메랄드 #2FBF71 화살표 4개.\n- 4 커지기: 큰 투구 쓴 기사 실루엣(얼굴 없음) + 안에서 바깥으로 향한 주황 #FF8A2E 화살표 4개.'),
      ('cardsB.png','- 1 이동 속도: 철 장화 한 짝(옆모습) + 뒤로 흐르는 하늘 #5FB4EE 바람 줄 3개.\n- 2 관통 쏘기: 화살 한 발이 둥근 과녁 두 개를 한 줄로 꿰뚫음(흰 섬광 #FFFFFF, 과녁 철색).\n- 3 세 갈래 쏘기: 화살 세 발이 부채꼴로 퍼짐(가운데 금, 양옆 하늘 #5FB4EE).\n- 4 스킬 +1: 금빛 번개 모양 보석 + 오른쪽 위 작은 금빛 더하기(+) 모양.')]
def codex(prompt,imgs,out):
  if os.path.exists(f'{D}/{out}'): return True
  r=subprocess.run(['codex','exec','--skip-git-repo-check','--color','never','-s','workspace-write','-C',D,'-o',f'{D}/result-{out}.md',prompt]+sum([['-i',i] for i in imgs],[]),stdin=subprocess.DEVNULL,capture_output=True,text=True,timeout=1500)
  log=(r.stdout or '')+(r.stderr or ''); open(f'{D}/log-{out}.txt','w').write(log[-4000:])
  if LIMIT.search(log) and not os.path.exists(f'{D}/{out}'): print('LIMIT',out,flush=True); sys.exit(3)
  return os.path.exists(f'{D}/{out}')
P=open(D+'/p-cards.txt').read(); cells=[]
for out,icons in JOBS:
  if not codex(P.replace('{OUT}',out).replace('{ICONS}',icons),[D+'/ref-ui.png'],out): print('FAIL',out); sys.exit(1)
  im=Image.open(D+'/'+out).convert('RGBA').resize((1024,1024),Image.LANCZOS); a=np.array(im).astype(float)
  if a[...,3].min()>250:  # 검은 배경 → 투명(어두운 외곽선은 살림: 거의 검정만 뺌)
    m=a[...,:3].max(-1); a[...,3]=np.clip((m-8)/30,0,1)*255
  im=Image.fromarray(a.astype(np.uint8)); cells+=[im.crop((x*512,y*512,x*512+512,y*512+512)) for y in (0,1) for x in (0,1)]
os.makedirs(D+'/out',exist_ok=True)
for n,c in zip(NAMES,cells): c.resize((192,192),Image.LANCZOS).save(f'{D}/out/card-{n}.webp','WEBP',quality=88)
pv=Image.new('RGBA',(8*200,260),(15,17,22,255)); d=ImageDraw.Draw(pv)
for i,(n,k) in enumerate(zip(NAMES,KO)):
  d.rounded_rectangle([i*200+8,8,i*200+192,250],12,fill=(30,28,31),outline=(140,107,50),width=2)
  pv.alpha_composite(Image.open(f'{D}/out/card-{n}.webp').resize((128,128),Image.LANCZOS),(i*200+36,24)); d.text((i*200+100,200),k,fill=(242,227,198),font=F,anchor='mm')
pv.convert('RGB').save(D+'/preview-cards.png'); print('DONE cards',flush=True)
