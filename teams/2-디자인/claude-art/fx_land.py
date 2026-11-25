# Claude가 코드로 그린 착지 충격파 (6칸, 칸 256, 투명). python3 fx_land.py
import numpy as np, math, random
from PIL import Image, ImageFilter, ImageDraw
random.seed(7); np.random.seed(7)
C=256; N=6; VIOLET=(202,87,229); DUST=(177,165,153); CORE=(255,240,255)
def ellipse_ring(cx,cy,rx,ry,width,alpha,col,blur):
    lay=Image.new('RGBA',(C,C),(0,0,0,0)); d=ImageDraw.Draw(lay)
    d.ellipse([cx-rx,cy-ry,cx+rx,cy+ry],outline=col+(int(255*alpha),),width=max(1,int(width)))
    return lay.filter(ImageFilter.GaussianBlur(blur))
frames=[]
debris=[(random.uniform(0,2*math.pi),random.uniform(0.6,1.0),random.uniform(2,4.5)) for _ in range(14)]
puffs=[(random.uniform(0,2*math.pi),random.uniform(0.75,1.05),random.uniform(9,15)) for _ in range(10)]
for f in range(N):
    t=f/(N-1)                       # 0 → 1
    img=Image.new('RGBA',(C,C),(0,0,0,0))
    cx,cy=C/2,C*0.58
    R=18+100*(1-(1-t)**2)           # 빠르게 퍼졌다가 느려짐
    fade=1-t**1.4
    # 1. 바닥 그을림 (어두운 납작 타원)
    sc=Image.new('RGBA',(C,C),(0,0,0,0)); ImageDraw.Draw(sc).ellipse([cx-R*0.55,cy-R*0.2,cx+R*0.55,cy+R*0.2],fill=(40,30,45,int(120*fade)))
    img.alpha_composite(sc.filter(ImageFilter.GaussianBlur(6)))
    # 2. 먼지 뭉치 (회갈색, 고리 둘레에서 바깥으로)
    for a,k,s in puffs:
        r=R*k; px=cx+math.cos(a)*r; py=cy+math.sin(a)*r*0.38-6*t
        ss=s*(0.7+t*1.2); al=int(150*fade*(0.6+0.4*math.sin(a*3)**2))
        p=Image.new('RGBA',(C,C),(0,0,0,0)); ImageDraw.Draw(p).ellipse([px-ss,py-ss*0.7,px+ss,py+ss*0.7],fill=DUST+(al,))
        img.alpha_composite(p.filter(ImageFilter.GaussianBlur(3+3*t)))
    # 3. 보라 빛 고리 (바깥 번짐 + 진한 선 + 흰 심)
    img.alpha_composite(ellipse_ring(cx,cy,R,R*0.38,10,0.55*fade,VIOLET,7))
    img.alpha_composite(ellipse_ring(cx,cy,R,R*0.38,4,0.95*fade,VIOLET,1.2))
    if f<=2: img.alpha_composite(ellipse_ring(cx,cy,R,R*0.38,2,0.9*(1-f/3),CORE,0.6))
    # 4. 첫 칸들: 가운데 충격 섬광
    if f<=1:
        fl=Image.new('RGBA',(C,C),(0,0,0,0)); rr=26-8*f
        ImageDraw.Draw(fl).ellipse([cx-rr,cy-rr*0.6,cx+rr,cy+rr*0.6],fill=VIOLET+(200,))
        img.alpha_composite(fl.filter(ImageFilter.GaussianBlur(8)))
        ImageDraw.Draw(img).ellipse([cx-rr*0.4,cy-rr*0.25,cx+rr*0.4,cy+rr*0.25],fill=CORE+(230,))
    # 5. 돌 파편 (튀어 올랐다 떨어짐, 회갈색 + 어두운 외곽선)
    if f>=1:
        d=ImageDraw.Draw(img)
        for a,k,s in debris:
            r=R*k*0.95; h=math.sin(min(1,t*1.3)*math.pi)*28*k
            px=cx+math.cos(a)*r; py=cy+math.sin(a)*r*0.38-h
            al=int(255*min(1,fade*1.4))
            d.polygon([(px-s,py),(px,py-s*0.8),(px+s,py),(px,py+s*0.7)],fill=(120,105,95,al),outline=(40,32,30,al))
    # 칸 가장자리 투명 보장
    a=np.array(img).astype(np.float32); m=12
    yy,xx=np.mgrid[:C,:C]; e=np.minimum(np.minimum(xx,C-1-xx),np.minimum(yy,C-1-yy)); a[...,3]*=np.clip(e/m,0,1)
    frames.append(Image.fromarray(a.astype(np.uint8),'RGBA'))
sheet=Image.new('RGBA',(C*N,C),(0,0,0,0))
for i,fr in enumerate(frames): sheet.alpha_composite(fr,(i*C,0))
sheet.save('fx-land-claude.png',optimize=True); print('ok', sheet.size)
