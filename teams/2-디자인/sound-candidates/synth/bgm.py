# 배경음악 순수 합성 (외부 샘플·프리셋 없음, numpy+scipy만) — 2026-11-26 디자인팀
# 실행: python3 bgm.py OUTDIR   → wav 렌더 후 ffmpeg(libmp3lame)로 mp3
import numpy as np, sys, os, subprocess
from scipy.signal import butter, lfilter
SR=44100; rng=np.random.default_rng(7)
def hz(n): return 440*2**((n-69)/12)          # MIDI 번호 → Hz
NOTE={'C':0,'C#':1,'Db':1,'D':2,'Eb':3,'E':4,'F':5,'F#':6,'G':7,'Ab':8,'A':9,'Bb':10,'B':11}
def m(s):  # 'D3' → MIDI
  return 12*(int(s[-1])+1)+NOTE[s[:-1]]
def lp(x,fc,o=2): b,a=butter(o,min(fc,SR/2*.95)/(SR/2)); return lfilter(b,a,x)
def hp(x,fc,o=2): b,a=butter(o,fc/(SR/2),'high'); return lfilter(b,a,x)
def bp(x,lo,hi): b,a=butter(2,[lo/(SR/2),hi/(SR/2)],'band'); return lfilter(b,a,x)
def env(n,a,d,s,r,dur):  # ADSR (초)
  t=np.arange(n)/SR; e=np.where(t<a,t/max(a,1e-4),np.where(t<a+d,1-(1-s)*(t-a)/max(d,1e-4),s))
  rel=t>dur; e[rel]=s*np.exp(-(t[rel]-dur)/max(r,1e-4)*5); return e
def saw(f,n,det=0):
  t=np.arange(n)/SR; out=np.zeros(n)
  for dd in ([0] if not det else [-det,0,det]): ph=(t*f*(1+dd))%1; out+=2*ph-1
  return out/(1 if not det else 3)
class Track:
  def __init__(s,sec): s.n=int(round(sec*SR)); s.buf=np.zeros(s.n)
  def add(s,x,t,g=1.0,wrap=True):
    i=int(round(t*SR)); idx=np.arange(i,i+len(x))
    if wrap: idx%=s.n
    else: keep=idx<s.n; idx=idx[keep]; x=x[keep]
    np.add.at(s.buf,idx,x*g)
# --- 악기 ---
def kick(g=1.0):
  n=int(.32*SR); t=np.arange(n)/SR; f=45+80*np.exp(-t*28); ph=2*np.pi*np.cumsum(f)/SR
  return (np.sin(ph)*np.exp(-t*9)+.3*np.exp(-t*300)*rng.standard_normal(n))*g
def taiko():
  n=int(.6*SR); t=np.arange(n)/SR; f=70+60*np.exp(-t*20); ph=2*np.pi*np.cumsum(f)/SR
  return np.sin(ph)*np.exp(-t*6)+.25*lp(rng.standard_normal(n),900)*np.exp(-t*25)
def tom(note):
  n=int(.35*SR); t=np.arange(n)/SR; f=hz(note)*(1+.5*np.exp(-t*30)); ph=2*np.pi*np.cumsum(f)/SR
  return np.sin(ph)*np.exp(-t*10)
def snare():
  n=int(.25*SR); t=np.arange(n)/SR
  return .7*bp(rng.standard_normal(n),900,6000)*np.exp(-t*18)+.4*np.sin(2*np.pi*190*t)*np.exp(-t*30)
def hat(open_=False):
  n=int((.18 if open_ else .05)*SR); t=np.arange(n)/SR
  return hp(rng.standard_normal(n),7000)*np.exp(-t*(12 if open_ else 70))
def anvil():   # 금속 타격 (부분음 합)
  n=int(.5*SR); t=np.arange(n)/SR; x=sum(np.sin(2*np.pi*f*t)*np.exp(-t*k) for f,k in [(820,9),(1310,12),(2230,16),(3170,22)])
  return x/4+.2*hp(rng.standard_normal(n),3000)*np.exp(-t*40)
def crash():
  n=int(1.6*SR); t=np.arange(n)/SR; return hp(rng.standard_normal(n),4000)*np.exp(-t*2.5)*.6
def bass(note,dur):
  n=int((dur+.05)*SR); x=saw(hz(note),n)+.5*np.sin(2*np.pi*hz(note)/2*np.arange(n)/SR)
  return lp(x,420)*env(n,.005,.08,.7,.04,dur)
def cello(note,dur,bright=1400):
  n=int((dur+.15)*SR); t=np.arange(n)/SR; vib=1+.004*np.sin(2*np.pi*5.5*t)*np.clip(t*4,0,1)
  ph=np.cumsum(hz(note)*vib)/SR; x=2*(ph%1)-1+.3*(2*((ph*1.003)%1)-1)
  return lp(x,bright,3)*env(n,.03,.1,.8,.12,dur)
def pad(notes,dur):
  n=int((dur+.4)*SR); x=sum(saw(hz(k),n,det=.006) for k in notes)/len(notes)
  return lp(x,900)*env(n,.35,.2,.8,.4,dur)
def brass(notes,dur,g=1.0):
  n=int((dur+.12)*SR); t=np.arange(n)/SR; x=sum(saw(hz(k),n,det=.004) for k in notes)/len(notes)
  cut=600+2600*np.exp(-t*7)  # 필터가 열렸다 닫힘 (금관 느낌)
  y=np.zeros(n); seg=1024
  for i in range(0,n,seg): y[i:i+seg]=lp(x[max(0,i-256):i+seg],cut[i])[-(min(seg,n-i)):]
  return y*env(n,.02,.15,.75,.1,dur)*g
def pluck(note,dur):   # 류트 느낌
  n=int((dur+.3)*SR); t=np.arange(n)/SR; x=saw(hz(note),n)*np.exp(-t*7)
  return lp(x,2500)*np.clip(t*400,0,1)
def horn(note,dur):  # 살짝 우스꽝스러운 호른(풍자): 끝에서 음이 살짝 처짐
  n=int((dur+.1)*SR); t=np.arange(n)/SR; bend=1-.03*np.clip((t-dur*.7)/(dur*.3),0,1)
  ph=np.cumsum(hz(note)*bend)/SR; x=2*(ph%1)-1
  return lp(x,1500,2)*env(n,.04,.1,.85,.08,dur)
def thunder(sec=1.6):
  n=int(sec*SR); t=np.arange(n)/SR; x=lp(rng.standard_normal(n),260,4)*np.exp(-t*1.8)*3
  crack=hp(rng.standard_normal(n),1500)*np.exp(-t*25)*.8; rumble=np.sin(2*np.pi*38*t)*np.exp(-t*2)*.6
  return x+crack+rumble
def reverb(x,sec=1.1,wet=.16,circular=True):
  n=int(sec*SR); t=np.arange(n)/SR; ir=lp(rng.standard_normal(n),5000)*np.exp(-t*5/sec)
  ir/=np.sqrt((ir**2).sum())
  L=len(x) if circular else len(x)+n
  y=np.fft.irfft(np.fft.rfft(x,L)*np.fft.rfft(ir,L),L)
  return x+wet*y[:len(x)]
def master(x,peak=.89):
  x=np.tanh(x/np.max(np.abs(x))*1.3); return x/np.max(np.abs(x))*peak
def export(x,path,kbps=64):
  w=path.replace('.mp3','.wav'); import wave
  with wave.open(w,'wb') as f: f.setnchannels(1);f.setsampwidth(2);f.setframerate(SR);f.writeframes((x*32767).astype('<i2').tobytes())
  subprocess.run(['ffmpeg','-y','-loglevel','error','-i',w,'-c:a','libmp3lame','-b:a',f'{kbps}k','-ac','1',path],check=True); os.remove(w)

OUT=sys.argv[1] if len(sys.argv)>1 else '.'
# ===== 전투 루프: 132bpm, 16마디, D단조. 층 3개(기본 / +타악 / +금관) =====
BPM=132; B=60/BPM; BAR=4*B; LEN=16*BAR
prog=['D','D','Bb','Bb','C','C','A','A']*2           # 2마디씩
chord={'D':[m('D3'),m('F3'),m('A3')],'Bb':[m('Bb2'),m('D3'),m('F3')],'C':[m('C3'),m('E3'),m('G3')],'A':[m('A2'),m('C#3'),m('E3')]}
root={'D':m('D2'),'Bb':m('Bb1'),'C':m('C2'),'A':m('A1')}
riff=[0,0,7,8,7,5,3,0,  0,0,7,8,10,8,7,5]            # 첼로 리프(8분음표 16개 = 2마디), 루트에서 반음 수
L1=Track(LEN); L2=Track(LEN); L3=Track(LEN)
for bar in range(16):
  t0=bar*BAR; c=prog[bar]
  for bt in [0,2]: L1.add(kick(),t0+bt*B)
  L1.add(kick(.7),t0+2.5*B)
  if bar%2==1: L1.add(tom(m('A2')),t0+3*B,.5); L1.add(tom(m('F2')),t0+3.5*B,.5)
  for e in range(8): L1.add(bass(root[c]+(12 if e%2 else 0),B/2*.9),t0+e*B/2,.55)
  if bar%2==0:
    L1.add(pad(chord[c],2*BAR-.1),t0,.18)
    base=root[c]+24
    for i,s in enumerate(riff): L1.add(cello(base+s,B/2*.85),t0+i*B/2,.32)
  # 층 2: 하이햇 16분 + 스네어 2·4박 + 큰북
  for s in range(16): L2.add(hat(s%4==2),t0+s*B/4,.18 if s%2 else .28)
  for bt in [1,3]: L2.add(snare(),t0+bt*B,.45)
  if bar%4==3: L2.add(taiko(),t0+3*B,.7); L2.add(taiko(),t0+3.5*B,.6)
  if bar%4==0: L2.add(taiko(),t0,.8)
  # 층 3: 금관 — 코드 바뀔 때 찍기 + 뒤 8마디는 거들먹거리는 선율
  if bar%2==0: L3.add(brass([k+12 for k in chord[c]],B*1.5),t0,.45); L3.add(brass([k+12 for k in chord[c]],B*.4),t0+2.5*B,.35)
  if bar==8 or bar==0: L3.add(crash(),t0,.5)
mel=[('D5',2),('F5',1),('E5',.5),('D5',.5),('A4',3),('Bb4',.5),('C5',.5),('D5',2),('C5',1),('Bb4',1),('A4',4),
     ('D5',2),('F5',1),('G5',.5),('A5',.5),('A5',3),('G5',.5),('F5',.5),('E5',2),('C#5',2),('D5',4)]
t=8*BAR
for nm,bt in mel:
  L3.add(horn(m(nm),bt*B*.92),t,.28); t+=bt*B
mix1=reverb(L1.buf); mix2=reverb(L2.buf,.6,.08)*2.6; mix3=reverb(L3.buf,1.3,.2)*2.0
g=np.max(np.abs(mix1))/.62                 # 세 층 모두 같은 배율 → 게임에서 그냥 더하면(볼륨 0.8) 미리듣기와 같은 소리
sc=lambda x,lim: lim*np.tanh(x/g/lim)        # 층마다 부드럽게 눌러 튀는 북소리 정리
b1,b2,b3=sc(mix1,.62),sc(mix2,.32),sc(mix3,.30)
export(b1,f'{OUT}/bgm-battle.mp3',56)
export(b2,f'{OUT}/bgm-battle-perc.mp3',32)
export(b3,f'{OUT}/bgm-battle-brass.mp3',32)
export(np.tanh((b1+b2)*1.0),f'{OUT}/preview-battle-r3.mp3',56)          # 미리듣기: 3~4라운드
export(np.tanh((b1+b2+b3)*1.0),f'{OUT}/preview-battle-r5.mp3',56)     # 미리듣기: 5~6라운드
# ===== 보스 루프: 150bpm, 8마디, D 프리지안(무겁게) =====
BPM=150; B=60/BPM; BAR=4*B; LEN=8*BAR; T=Track(LEN)
bprog=['D','Eb','D','C','D','Eb','Bb','A']
broot={'D':m('D1'),'Eb':m('Eb1'),'C':m('C1'),'Bb':m('Bb0'),'A':m('A0')}
bch={'D':[m('D3'),m('A3'),m('D4')],'Eb':[m('Eb3'),m('Bb3'),m('Eb4')],'C':[m('C3'),m('G3'),m('C4')],'Bb':[m('Bb2'),m('F3'),m('Bb3')],'A':[m('A2'),m('E3'),m('A3')]}
for bar in range(8):
  t0=bar*BAR; c=bprog[bar]
  for e in range(8): T.add(kick(.9 if e%2==0 else .55),t0+e*B/2)
  for bt in [1,3]: T.add(anvil(),t0+bt*B,.35); T.add(snare(),t0+bt*B,.4)
  for s in range(16): T.add(bass(broot[c]+12+(1 if s%4==3 else 0),B/4*.9),t0+s*B/4,.5)
  T.add(brass(bch[c],B*1.2,.9),t0,.5); T.add(brass(bch[c],B*.35),t0+2.5*B,.4)
  for i,k in enumerate([0,1,0,7,6,7,10,12]): T.add(cello(bch[c][0]+k-12,B/2*.8,1800),t0+i*B/2,.3)
  for s in range(8): T.add(hat(),t0+s*B/2,.2)
# 마지막 마디 필인 → 첫 박으로 이어짐
for i in range(6): T.add(tom(m('A2')-i*2),7*BAR+2*B+i*B/3,.6)
T.add(crash(),0,.5)
export(master(reverb(T.buf,1.0,.14)),f'{OUT}/bgm-boss.mp3',56)
th=thunder(); st=np.zeros(len(th)); b=brass(bch['D'],.6,1.0); i0=int(.9*SR); k=min(len(b),len(th)-i0); st[i0:i0+k]=b[:k]
export(master(th+st),f'{OUT}/sfx-boss-thunder.mp3',56)
# ===== 메뉴 루프: 100bpm, 8마디, 류트 아르페지오 + 거들먹 호른(풍자) =====
BPM=100; B=60/BPM; BAR=4*B; LEN=8*BAR; M=Track(LEN)
mprog=['D','D','Bb','C','D','D','G','A']
mch={'D':[m('D3'),m('F3'),m('A3')],'Bb':[m('Bb2'),m('D3'),m('F3')],'C':[m('C3'),m('E3'),m('G3')],'G':[m('G2'),m('Bb2'),m('D3')],'A':[m('A2'),m('C#3'),m('E3')]}
for bar in range(8):
  t0=bar*BAR; ch=mch[mprog[bar]]
  for i,k in enumerate([0,1,2,1,0,1,2,1]): M.add(pluck(ch[k]+12,B/2),t0+i*B/2,.3)
  M.add(kick(.5),t0); M.add(kick(.35),t0+2*B); M.add(tom(m('D3')),t0+3.5*B,.25)
  M.add(pad(ch,BAR-.05),t0,.12)
hm=[('A4',1.5),('D5',.5),('D5',1),('F5',1),('E5',1.5),('D5',.5),('C5',2),('D5',1.5),('A4',.5),('Bb4',1),('C5',1),('A4',4)]
t=4*BAR
for nm,bt in hm: M.add(horn(m(nm),bt*B*.9),t,.25); t+=bt*B
export(master(reverb(M.buf,1.4,.2)),f'{OUT}/bgm-menu.mp3',48)
# ===== 결말 짧은 곡 (반복 안 함) =====
def oneshot(sec): return Track(sec)
B=60/112; V=oneshot(5.0)   # 승리: D장조 팡파르
for i,(nm,bt) in enumerate([('D4',.5),('F#4',.5),('A4',.5),('D5',2.5)]):
  st=sum(b for _,b in [('',.5)]*i)*B; V.add(brass([m(nm),m(nm)-12],bt*B),st,.6,wrap=False)
V.add(brass([m('D4'),m('F#4'),m('A4'),m('D5')],2.2),1.5*B,.5,wrap=False); V.add(crash(),1.5*B,.5,wrap=False); V.add(taiko(),1.5*B,.8,wrap=False)
export(master(reverb(V.buf,1.5,.25,False)[:V.n]),f'{OUT}/bgm-win.mp3',48)
L=oneshot(4.5)            # 실패·파산: 내려가는 '와왕' 트롬본 (풍자)
for i,nm in enumerate(['G3','F#3','F3']): L.add(horn(m(nm),.42),i*.48,.5,wrap=False)
n=int(1.6*SR); tt=np.arange(n)/SR; f=hz(m('E3'))*(1-.06*np.sin(2*np.pi*5*tt)*np.clip(tt,0,1)); ph=np.cumsum(f)/SR
L.add(lp(2*(ph%1)-1,1100)*env(n,.03,.1,.85,.3,1.3)*.5,1.44,wrap=False); L.add(tom(m('D2')),1.44,.5,wrap=False)
export(master(reverb(L.buf,1.2,.2,False)[:L.n]),f'{OUT}/bgm-lose.mp3',48)
print('done')
