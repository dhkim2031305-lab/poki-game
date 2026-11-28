# 나노바나나(Gemini 이미지) 시험 1장. 한도·결제 오류면 즉시 멈춤(재시도 없음).
import os, sys, json, base64, urllib.request, urllib.error
D=os.path.dirname(os.path.abspath(__file__)); A='/home/user/poki-game/src/assets'
model=sys.argv[1]; out=sys.argv[2]
def part(p): return {'inline_data':{'mime_type':'image/png' if p.endswith('png') else 'image/webp','data':base64.b64encode(open(p,'rb').read()).decode()}}
prompt="""첫 번째 첨부 그림은 이 게임의 '살아 움직이는 스킬' 그림 예시(거북선 노 젓기 4칸)예요. 같은 그림체·같은 시점·같은 칸 배치로, 두 번째 첨부 그림(룩셈부르크 스킬 「눈먼 기사왕의 돌격」 대표 효과)의 분위기를 살려 새 그림을 만들어 주세요.
- 주인공: **갑옷을 입힌 군마 한 마리가 오른쪽으로 질주**하는 4칸 반복 동작(다리 동작 1→2→3→4가 이어져 반복). 말 등은 비워 두기(장수는 게임에서 따로 올려요). 말 갑옷은 은색·파랑 천, 나라색 파랑을 살짝.
- 1024×1024, 2×2 칸(512×512), 순서 좌상→우상→좌하→우하. 모든 칸에서 말 위치·크기 같게, 칸 가장자리 28px 비움. 위에서 비스듬히(약 35°) 내려다보는 시점.
- 발굽 아래 흙먼지가 살짝 튀게. 배경은 순수 초록 #00FF00 한 색(그림에 초록 섞이지 않게).
- 금지: 글자·숫자, 사람, 피, 보라색, 연두색."""
body={'contents':[{'parts':[{'text':prompt},part(D+'/../round22-alive/korea-1/act4.png'),part(A+'/skill/u/luxembourg-1.webp')]}],
      'generationConfig':{'responseModalities':['IMAGE','TEXT']}}
req=urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',data=json.dumps(body).encode(),headers={'Content-Type':'application/json','x-goog-api-key':'dummy'})
try: r=json.load(urllib.request.urlopen(req,timeout=300))
except urllib.error.HTTPError as e:
  t=e.read().decode()[:600]; print('HTTP',e.code,t); sys.exit(3 if e.code in (429,402,403) or 'quota' in t.lower() or 'billing' in t.lower() else 1)
for c in r.get('candidates',[]):
  for p in c['content'].get('parts',[]):
    if 'inlineData' in p or 'inline_data' in p:
      d=p.get('inlineData') or p.get('inline_data'); open(out,'wb').write(base64.b64decode(d['data'])); print('saved',out)
    elif 'text' in p: print('text',p['text'][:200])
print('usage',r.get('usageMetadata'))
