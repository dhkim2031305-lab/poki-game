# 소품 한 개만 다시 그리기: python3 redo.py <나라>-<n> ... (redo/<k>-<n>.png → s<nn>/<k>-<n>.webp 교체, 예전 것은 s<nn>/<k>-<n>.v1.webp). 한도면 exit 3.
import os, sys, json, re, subprocess
import numpy as np
from PIL import Image
D=os.path.dirname(os.path.abspath(__file__)); rows={f"{r['k']}-{r['n']}":r for r in json.load(open(D+'/props60.json'))}
LIMIT=re.compile(r'usage_limit_reached|429 Too Many|rate limit|quota|hit your usage limit',re.I)
NEW={'korea-2':'천자총통 — 조선 시대 청동 화포. **짧고 굵은 청동 포신에 대나무 마디처럼 볼록한 고리(죽절) 5~6개**, 포구가 살짝 넓고 뒤끝은 둥근 손잡이 꼭지. **낮고 네모난 나무 받침틀(동차)** 위에 얹혔고, 받침 아래 작은 나무 바퀴 4개. 포신은 하늘로 25° 들림. 서양식 포가(긴 꼬리 다리·큰 바퀴 2개)처럼 보이면 안 돼요.',
     'colombia-2':'황금빛 기병 사브르 — 곧고 가는 칼날에 금빛 그림자 기운이 칼날을 따라 흐름, 손잡이는 노랑·파랑·빨강 끈으로 감은 단순한 금속 손잡이. 원주민 공예·문양·원반·가면 같은 유물 느낌은 넣지 않아요.'}
os.makedirs(D+'/redo',exist_ok=True)
for key in sys.argv[1:]:
  r=rows[key]; dp=f"{D}/s{r['sheet']:02d}"; out=f'{D}/redo/{key}.png'
  prompt=f"""첨부 ref.png 위쪽은 이 게임 장수 그림(그림체 기준)이에요. 같은 그림체로 소품 그림 1개를 이미지 생성해 {key}.png로 저장해 주세요.
- 소품: {r['ko']} {r['n']}번 스킬 「{r['name']}」 — **{NEW.get(key,r['prop'])}**
- 1024×1024, 배경 투명(안 되면 순수 흰색 #FFFFFF), 물건 하나만(사람·손 없음), 위에서 비스듬히(3/4) 본 모습, 오른쪽을 향함, 아래 가운데에 놓인 듯, 긴 변이 그림의 70~80%. 두꺼운 어두운 외곽선, 장수 그림과 같은 채색·명암, 재료 질감. 빛 효과·그림자·바닥 없음.
- 금지: 글자·숫자, 국기 모양 그대로, 사람 얼굴, 종교 상징, 피, 보라색, 연두색, 초승달 모양.
이미지 생성이 한도 등으로 실패하면 코드로 대신 그리지 말고 result 파일에 실패라고만 적어 주세요."""
  if not os.path.exists(out):
    p=subprocess.run(['codex','exec','--skip-git-repo-check','--color','never','-s','workspace-write','-C',D+'/redo','-o',f'{D}/redo/result-{key}.md',prompt,'-i',dp+'/ref.png'],stdin=subprocess.DEVNULL,capture_output=True,text=True,timeout=1500)
    log=(p.stdout or '')+(p.stderr or ''); open(f'{D}/redo/log-{key}.txt','w').write(log[-4000:])
    if not os.path.exists(out):
      if LIMIT.search(log): print('LIMIT',key,flush=True); sys.exit(3)
      print('FAIL',key,flush=True); continue
  a=np.array(Image.open(out).convert('RGBA')).astype(float)
  if a[...,3].min()>250: a[...,3]=np.clip((255-a[...,:3]).max(-1)*6,0,255)
  c=Image.fromarray(a.astype(np.uint8)); al=np.array(c)[...,3]; ys,xs=np.where(al>40)
  box=c.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1)); s=176/max(box.size); box=box.resize((max(1,round(box.width*s)),max(1,round(box.height*s))),Image.LANCZOS)
  o=Image.new('RGBA',(192,192)); o.alpha_composite(box,(96-box.width//2,184-box.height))
  w=f"{dp}/{key}.webp"
  if os.path.exists(w) and not os.path.exists(f"{dp}/{key}.v1.webp"): os.rename(w,f"{dp}/{key}.v1.webp")
  o.save(w,'WEBP',quality=90); print('DONE',key,flush=True)
