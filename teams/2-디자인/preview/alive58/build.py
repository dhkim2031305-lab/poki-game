# 29개 나라 58개 스킬 '살아 움직이는 스킬' 미리보기 만들기 — 그림을 preview/alive58/a/로 복사하고 index.html 생성
import json, os, shutil, html
R='/home/user/poki-game'; D=os.path.dirname(os.path.abspath(__file__)); O=R+'/teams/2-디자인/gpt-art/round23-nano/out'
rows=json.load(open(R+'/teams/2-디자인/review/alive-58.json')); aura=json.load(open(R+'/teams/2-디자인/review/aura-60.json'))['skills']
KO={'luxembourg':'룩셈부르크','ireland':'아일랜드','switzerland':'스위스','usa':'미국','netherlands':'네덜란드','denmark':'덴마크','austria':'오스트리아','australia':'호주','germany':'독일','sweden':'스웨덴','canada':'캐나다','finland':'핀란드','france':'프랑스','italy':'이탈리아','spain':'스페인','czechia':'체코','israel':'이스라엘','lithuania':'리투아니아','newzealand':'뉴질랜드','japan':'일본','portugal':'포르투갈','poland':'폴란드','hungary':'헝가리','slovakia':'슬로바키아','greece':'그리스','turkiye':'튀르키예','chile':'칠레','mexico':'멕시코','colombia':'콜롬비아'}
A=D+'/a'; os.makedirs(A,exist_ok=True)
for f in os.listdir(O):
  if f.endswith('.webp') and os.path.getsize(O+'/'+f)>0: shutil.copy(O+'/'+f,A+'/'+f)
for k in KO: shutil.copy(f'{R}/src/assets/dir/{k}.webp',f'{A}/dir-{k}.webp')
shutil.copy(R+'/src/assets/alien/grunt-dir.webp',A+'/grunt-dir.webp'); shutil.copy(R+'/src/assets/room.webp',A+'/room.webp')
shutil.copy(R+'/src/assets/skill/seq/aura-fire.webp',A+'/aura-fire.webp')
data=[dict(k=k,n=n,ko=KO[k],name=nm,type=t,sub=s,ride='탐' in h,hero=h,after=a,aura=aura[f'{k}-{n}']) for k,n,nm,t,s,h,a in rows]
EL={'fire':'불','water':'물','lightning':'번개','wind':'바람','ice':'얼음','earth':'대지','gold':'금빛','nature':'자연'}
page=open(D+'/tpl.html').read().replace('/*DATA*/',json.dumps(data,ensure_ascii=False)).replace('/*EL*/',json.dumps(EL,ensure_ascii=False))
open(D+'/index.html','w').write(page)
fs={f'a/{f}':f'{A}/{f}' for f in os.listdir(A)}
json.dump(fs,open(D+'/files.json','w'),ensure_ascii=False)
print(len(data),'skills',len(fs),'files',sum(os.path.getsize(v) for v in fs.values())//1024,'KB')
