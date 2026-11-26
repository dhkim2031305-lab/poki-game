import numpy as np, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
keys=['luxembourg','ireland','switzerland','usa','netherlands','denmark','austria','australia','germany','sweden','canada','finland','france','italy','korea','spain','czechia','israel','lithuania','newzealand','japan','portugal','poland','hungary','slovakia','greece','turkiye','chile','mexico','colombia']
ko='룩셈부르크 아일랜드 스위스 미국 네덜란드 덴마크 오스트리아 호주 독일 스웨덴 캐나다 핀란드 프랑스 이탈리아 한국 스페인 체코 이스라엘 리투아니아 뉴질랜드 일본 포르투갈 폴란드 헝가리 슬로바키아 그리스 튀르키예 칠레 멕시코 콜롬비아'.split()
R='#F2452E';W='#DDE6F2';B='#3D74D9';G='#2FBF71';Y='#FFC93C';O='#FF8A2E';S='#5FB4EE'
# 나라마다 (주색, 바깥 빛색). 1번은 그대로, 2번은 둘을 바꿔요. 초록은 에메랄드(외계인 연두 #88BD10과 색상 다름), 보라 없음
C={'luxembourg':(Y,S),'ireland':(G,O),'switzerland':(R,W),'usa':(S,R),'netherlands':(O,B),'denmark':(R,W),'austria':(R,W),'australia':(Y,G),
'germany':(Y,R),'sweden':(Y,B),'canada':(R,W),'finland':(W,B),'france':(B,R),'italy':(G,R),'korea':(R,B),'spain':(Y,R),'czechia':(B,R),
'israel':(S,W),'lithuania':(Y,G),'newzealand':(G,W),'japan':(R,W),'portugal':(G,R),'poland':(R,W),'hungary':(R,G),'slovakia':(B,R),
'greece':(S,W),'turkiye':(R,W),'chile':(R,B),'mexico':(Y,G),'colombia':(Y,B)}
def hx(c):return np.array([int(c[i:i+2],16) for i in (1,3,5)],float)/255
def tint(im,a1,a2):
  a=np.array(im.convert('RGBA')).astype(float)/255;rgb=a[...,:3];l=(rgb*[.299,.587,.114]).sum(-1,keepdims=True)
  w=np.clip((l-.30)/.40,0,1)            # 어두운 빛 가장자리 = 바깥색, 밝은 몸 = 주색
  col=hx(a2)*(1-w)+hx(a1)*w
  t=np.clip((l-.86)/.14,0,1)            # 가장 밝은 심지만 흰색
  out=np.clip(col*np.minimum(l*1.45,1),0,1)*(1-t)+np.ones(3)*t
  a[...,:3]=out;core=Image.fromarray((a*255).astype(np.uint8))
  # 바깥 빛(두 번째 색): 밝기×알파를 흐려 퍼뜨려 아래에 깔아요 → 가는 궤적도 두껍게, 두 색이 보이게
  m=Image.fromarray((np.clip(a[...,3]*l[...,0]*1.6,0,1)*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(7))
  g=np.zeros((*a.shape[:2],4));g[...,:3]=hx(a2);g[...,3]=np.array(m)/255*0.75
  glow=Image.fromarray((g*255).astype(np.uint8));glow.alpha_composite(core);return glow
def load(i):
  k=keys[i//2];n=i%2+1;im=Image.open(f'teams/2-디자인/gpt-art/round13/white256/{k}-{n}.webp').convert('RGBA')
  if k=='chile' and n==2:
    a=np.array(im).astype(float)/255;m=Image.fromarray((a[...,3]*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))
    g=np.zeros((*a.shape[:2],4));g[...,:3]=hx('#8FA6C2');g[...,3]=np.array(m)/255*0.55   # Codex: 검은 바람이 바닥에 묻힘 → 회청 테두리 빛
    gl=Image.fromarray((g*255).astype(np.uint8));gl.alpha_composite(im);return gl
  p,q=C[k]; return tint(im,p,q) if n==1 else tint(im,q,p) if q!=W else tint(im,p,q)
if sys.argv[1]=='preview':
  tile=Image.open('src/assets/3d/floor.webp').convert('RGBA').resize((200,200))
  f=ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',15)
  S=200;cols=6;out=Image.new('RGB',(cols*S,10*(S+22)),(30,30,38));d=ImageDraw.Draw(out)
  for i in range(60):
    x=(i%cols)*S;y=(i//cols)*(S+22);ef=load(i).resize((S,S),Image.LANCZOS)
    b=np.array(tile).astype(float);e=np.array(ef).astype(float);al=e[...,3:]/255
    if keys[i//2]=='chile' and i%2: b[...,:3]=b[...,:3]*(1-al)+e[...,:3]*al
    else: b[...,:3]=np.clip(b[...,:3]+e[...,:3]*al,0,255)
    out.paste(Image.fromarray(b.astype(np.uint8)).convert('RGB'),(x,y+22))
    d.text((x+4,y+3),f'{i+1}. {ko[i//2]} {i%2+1}',fill=(225,228,236),font=f)
  out.save(sys.argv[2])
elif sys.argv[1]=='apply':
  for i in range(60): load(i).save(f'src/assets/skill/u/{keys[i//2]}-{i%2+1}.webp','WEBP',quality=85,method=6)
