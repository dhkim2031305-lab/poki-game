# 외침 60개 — Gemini TTS 무료 한도까지만. 429·결제 오류가 나면 바로 멈춰요 (다시 시도 안 함).
import json, base64, subprocess, sys, time, os, urllib.request, urllib.error
D = os.path.dirname(os.path.abspath(__file__))
items = json.load(open(os.path.join(D, 'list.json')))
FIX = {'01-luxembourg-1': 'Luxembourgish', '03-switzerland-1': 'Swiss German'}
URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-tts:generateContent'
for it in items:
    out = os.path.join(D, it['id'] + '.mp3')
    if os.path.exists(out): continue
    lang = FIX.get(it['id'], it['lang'])
    prompt = f"Shout loudly like a warrior charging into battle, in {lang} as a native speaker from {it['country']}: {it['text']}"
    body = json.dumps({"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseModalities": ["AUDIO"],
        "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": "Fenrir"}}}}}).encode()
    req = urllib.request.Request(URL, body, {'Content-Type': 'application/json', 'x-goog-api-key': 'dummy'})
    try:
        d = json.load(urllib.request.urlopen(req, timeout=120))
    except urllib.error.HTTPError as e:
        print(it['id'], 'HTTP', e.code, e.read()[:300].decode(errors='replace'), flush=True); print('STOP'); sys.exit(1)
    try:
        p = d['candidates'][0]['content']['parts'][0]['inlineData']
    except Exception:
        print(it['id'], 'NO AUDIO', json.dumps(d)[:300], flush=True); print('STOP'); sys.exit(1)
    raw = base64.b64decode(p['data']); mt = p['mimeType']
    src = os.path.join(D, it['id'] + '.raw'); open(src, 'wb').write(raw)
    inp = ['-f', 's16le', '-ar', '24000', '-ac', '1'] if 'L16' in mt or 'pcm' in mt else []
    subprocess.run(['ffmpeg', '-y', '-v', 'error', *inp, '-i', src, '-af',
        'silenceremove=start_periods=1:start_threshold=-45dB:stop_periods=1:stop_threshold=-45dB:stop_duration=0.3,loudnorm=I=-16:TP=-1.5',
        '-ac', '1', '-ar', '24000', '-b:a', '32k', out], check=True)
    os.remove(src)
    dur = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out], capture_output=True, text=True).stdout.strip()
    print(it['id'], mt, dur + 's', os.path.getsize(out), 'B', flush=True)
    time.sleep(21)   # 분당 3번 이하
print('ALL DONE')
