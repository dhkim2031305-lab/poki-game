// 2.5D 렌더러 (B안 · 사용자 결정 "b안" 2026-11-25) — Three.js r149 (src/vendor/three.min.js, MIT)
// 바닥·벽·문 = 진짜 3D (살짝 기운 원근 카메라, 조명, 그림자)
// 장수·외계인·화폐 = 카메라를 보는 2D 판(빌보드) · 공격 효과·HUD = 2D 캔버스를 위에 겹쳐요 (R3D.proj로 자리·크기를 맞춰요)
(() => {
  const T = window.THREE, FIELD = window.DATA.FIELD, UI = window.UI;
  const R = { ok: false, built: false };
  window.R3D = R;
  if (!T) return;
  const W = FIELD.W, H = FIELD.H;
  // 벽: room 그림의 벽 띠와 같은 자리 (위 46 · 옆 42 · 아래 38), 앞 벽은 낮게 잘라 안이 보이게
  const WALL = { h: 30, top: 46, side: 42, bottom: 352, low: 9, door: 34 };
  const PITCH = 56;                 // 카메라가 내려다보는 각도(도) — 90이면 위에서 똑바로
  let renderer, scene, camera, gl, sun, impactLight;
  const camUp = new T.Vector3(), v1 = new T.Vector3(), v2 = new T.Vector3();
  let pixelCap = 2, view = { x: 0, y: 0, w: 1, h: 1, cw: 1, ch: 1 };

  R.init = gameCanvas => {
    try {
      gl = document.createElement('canvas'); gl.id = 'game3d';
      // WebGL이 없으면 three.js를 만들지 않아요 (만들면 console.error를 여러 번 찍어서 사이트 QA 도구가 에러로 셀 수 있음 — QA 7053b9a)
      { const probe = document.createElement('canvas'); const ok = !!(window.WebGLRenderingContext && (probe.getContext('webgl2') || probe.getContext('webgl') || probe.getContext('experimental-webgl'))); if (!ok) return false; }
      renderer = new T.WebGLRenderer({ canvas: gl, antialias: false, alpha: false, powerPreference: 'high-performance' });
    } catch (e) { console.warn('[3D] WebGL 초기화 실패', e); return false; }
    gameCanvas.parentNode.insertBefore(gl, gameCanvas);
    gl.style.display = 'none';
    // 컨텍스트를 잃으면 game.js가 안내 화면을 표시해요.
    gl.addEventListener('webglcontextlost', () => { R.lost = true; gl.style.display = 'none'; console.warn('[3D] WebGL 컨텍스트 잃음'); });
    renderer.setClearColor(0x0A0B0F, 1);
    renderer.autoClear = false;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFShadowMap;
    // 폰(작은 화면·터치)은 픽셀 배율을 1.5까지만 — 60fps 우선
    try { if (matchMedia('(pointer: coarse)').matches) pixelCap = 1.5; } catch {}
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(30, W / H, 20, 4000);
    R.ok = true;
    return true;
  };

  // ---------- 텍스처 ----------
  const texCache = {};
  function texOf(img, key, mip = true) {
    if (texCache[key]) return texCache[key];
    const t = new T.Texture(img); t.needsUpdate = true;
    t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    if (!mip) { t.generateMipmaps = false; t.minFilter = T.LinearFilter; }
    return (texCache[key] = t);
  }
  // 칸 시트의 한 칸: 같은 그림을 쓰는 복제 텍스처(칸마다 offset만 달라요)
  // 그래픽 카드가 받는 텍스처 최대 폭(iOS는 흔히 4096)보다 넓은 시트(보스 5760)는 칸 하나씩 잘라 올려요 — 쓰는 칸만 올라가 메모리도 아껴요
  const TEST_MAX = (() => { try { const m = /[?&]maxtex=(\d+)/.exec(location.search); return m ? +m[1] : 4096; } catch { return 4096; } })();   // 시험용: ?maxtex=2048
  const maxTex = () => Math.min(TEST_MAX, renderer.capabilities.maxTextureSize || 4096);
  R.cellTex = (name, variant, n, i) => {
    const key = name + '|' + (variant || '') + '#' + i;
    if (texCache[key]) return texCache[key];
    const im = UI.img[name]; if (!im || !im.naturalWidth) return null;
    if (im.naturalWidth > maxTex() || im.naturalHeight > maxTex()) {
      const cw = im.naturalWidth / n, ch = im.naturalHeight, c = document.createElement('canvas'); c.width = cw; c.height = ch;
      const cc = c.getContext('2d'); cc.drawImage(im, i * cw, 0, cw, ch, 0, 0, cw, ch);
      let src = c;
      if (variant) { const v = document.createElement('canvas'); v.width = cw; v.height = ch; paintVariant(v.getContext('2d'), c, cw, ch, variant, ch / 48 * .8); src = v; }
      const t = texOf(src, key); t.userData.aspect = cw / ch; return t;
    }
    const base = R.tex(name, variant); if (!base) return null;
    const t = base.clone(); t.repeat.set(1 / n, 1); t.offset.set(i / n, 0); t.needsUpdate = true;
    t.userData.aspect = base.image.width / n / base.image.height;
    return (texCache[key] = t);
  };
  // 렉 줄이기 (사용자 2026-11-28 "왜 렉이 걸리죠?"): 처음 쓰는 순간 그래픽 카드에 그림을 올리느라 멈칫해요 → 판 시작 때 미리 올려 둬요
  R.warm = names => {
    if (!renderer || !renderer.initTexture) return;
    for (const name of names) {
      const im = UI.img[name]; if (!im || !im.naturalWidth) continue;
      const n = Math.max(1, Math.round(im.naturalWidth / im.naturalHeight));
      for (let i = 0; i < n; i++) { const t = n > 1 ? R.cellTex(name, null, n, i) : R.tex(name); if (t) try { renderer.initTexture(t); } catch {} }
    }
  };
  R.tex = (name, variant) => {
    const key = name + '|' + (variant || '');
    if (texCache[key]) return texCache[key];
    const im = UI.img[name]; if (!im || !im.naturalWidth) return null;
    if (!variant) return texOf(im, key);
    // 맞음 번쩍임(흰) · 몸 색 외곽선 — 처음 한 번만 만들어 둬요
    const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
    const x = c.getContext('2d'), k = im.naturalHeight / 48 * (im.naturalWidth > im.naturalHeight * 4 ? .8 : 1);
    paintVariant(x, im, c.width, c.height, variant, k);
    return texOf(c, key);
  };
  // 판 그림 변형: lit(림 라이트) · white(맞음 번쩍) · 색(몸 색 외곽선) — filter 없는 iOS에서도 같은 모양 (UI.blit)
  function paintVariant(x, im, w, h, variant, k) {
    if (variant === 'lit') return litPaint(x, im, w, h);
    const W0 = im.naturalWidth || im.width, H0 = im.naturalHeight || im.height;
    if (variant === 'white') return UI.blit(x, im, 0, 0, W0, H0, 0, 0, w, h, { white: true });
    if (UI.FILTER_OK) { x.filter = `drop-shadow(0 0 ${1.5 * k}px ${variant}) drop-shadow(0 0 ${0.5 * k}px ${variant})`; x.drawImage(im, 0, 0, w, h); x.filter = 'none'; return; }
    const t = UI.tinted(im, variant), o = 1.4 * k; for (const [ox, oy] of [[-o, 0], [o, 0], [0, -o], [0, o]]) x.drawImage(t, ox, oy, w, h); x.drawImage(im, 0, 0, w, h);
  }
  // 외계인 입체감 (사용자 "몬스터들은 다 2d"): 빛 쪽(왼쪽 위) 가장자리 림 라이트 + 발 쪽 어둡게(접지) — 처음 한 번만 만들어요
  function litPaint(x, im, w, h) {
    x.drawImage(im, 0, 0);
    const k = Math.max(2, Math.round(h / 90));
    const t = document.createElement('canvas'); t.width = w; t.height = h; const y = t.getContext('2d');
    y.drawImage(im, 0, 0); y.globalCompositeOperation = 'source-in'; y.fillStyle = '#FFE9C8'; y.fillRect(0, 0, w, h);   // 실루엣
    y.globalCompositeOperation = 'destination-out'; y.drawImage(im, k, k);                                           // 빛 쪽 가장자리만 남겨요
    x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = .55; x.drawImage(t, 0, 0); x.restore();
    x.save(); x.globalCompositeOperation = 'source-atop';
    const g = x.createLinearGradient(0, h, 0, h * .45); g.addColorStop(0, 'rgba(8,6,14,.45)'); g.addColorStop(1, 'rgba(8,6,14,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const s = x.createLinearGradient(0, 0, w, 0); s.addColorStop(0, 'rgba(255,240,220,.06)'); s.addColorStop(1, 'rgba(8,6,14,.22)');   // 오른쪽(빛 반대) 살짝 어둡게
    x.fillStyle = s; x.fillRect(0, 0, w, h); x.restore();
  }
  function canvasTex(c) { const t = new T.CanvasTexture(c); t.generateMipmaps = false; t.minFilter = T.LinearFilter; return t; }
  function gradTex(stops, w = 64, h = 64, radial = true) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    const g = radial ? x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2) : x.createLinearGradient(0, 0, w, 0);
    stops.forEach(([o, col]) => g.addColorStop(o, col)); x.fillStyle = g; x.fillRect(0, 0, w, h);
    return canvasTex(c);
  }
  // 반복 텍스처 (디자인팀 10차 src/assets/3d/) — 없으면 null
  function repTex(name) {
    const im = UI.img[name]; if (!im || !im.naturalWidth) return null;
    const t = texOf(im, name); t.wrapS = t.wrapT = T.RepeatWrapping; t.needsUpdate = true; return t;
  }
  // 문 앞 바닥 빛: 왼쪽 보라 · 오른쪽 초록 (room 그림에 있던 빛을 코드로)
  function doorGlowTex() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
    for (const [cx, col] of [[104, '202,87,229'], [152, '184,215,39']]) {
      const g = x.createRadialGradient(cx, 0, 0, cx, 0, 100); g.addColorStop(0, `rgba(${col},.5)`); g.addColorStop(.4, `rgba(${col},.18)`); g.addColorStop(1, `rgba(${col},0)`);
      x.fillStyle = g; x.fillRect(0, 0, 256, 128);
    }
    return canvasTex(c);
  }

  // ---------- 방 만들기 (에셋 로딩 뒤 처음 그릴 때 한 번) ----------
  // 벽 상자: 옆면 = wall(가로 60단위마다 반복, 세로 = 높이 30), 윗면 = wall-top(긴 쪽으로 반복, 짧은 쪽 = 두께)
  // pillar = 기둥 그림을 네 옆면에 (그림 가운데 기둥 부분만)
  function wallBox(x0, z0, x1, z1, h, mats, kind = 'wall') {
    const g = new T.BoxGeometry(x1 - x0, h, z1 - z0);
    g.translate((x0 + x1) / 2, h / 2, (z0 + z1) / 2);
    const p = g.attributes.position, uv = g.attributes.uv, alongX = x1 - x0 >= z1 - z0, t = alongX ? z1 - z0 : x1 - x0;
    for (let i = 0; i < p.count; i++) {
      const face = Math.floor(i / 4), X = p.getX(i), Y = p.getY(i), Z = p.getZ(i);
      if (face === 2) {
        if (kind === 'pillar') uv.setXY(i, (X - x0) / (x1 - x0) * .25, (Z - z0) / (z1 - z0));
        else if (alongX) uv.setXY(i, X / (t * 4), (Z - z0) / t);
        else uv.setXY(i, Z / (t * 4), (X - x0) / t);
      } else if (face === 3) uv.setXY(i, 0, 0);
      else if (kind === 'pillar') { const u = face < 2 ? (Z - z0) / (z1 - z0) : (X - x0) / (x1 - x0); uv.setXY(i, .3 + u * .4, .015 + Y / h * .97); }
      else uv.setXY(i, (face < 2 ? Z : X) / 60, Y / WALL.h);
    }
    const m = new T.Mesh(g, mats); m.castShadow = true; m.receiveShadow = true; scene.add(m);
    return m;
  }
  function build() {
    const room = UI.img.room; if (!room || !room.naturalWidth) return false;
    const floorT = repTex('3d/floor'), wallT = repTex('3d/wall'), topT = repTex('3d/wall-top');
    const pilIm = UI.img['3d/pillar'], archIm = UI.img['3d/door-arch'];
    const roomTex = texOf(room, 'room');
    // 바닥: 돌바닥 텍스처 반복(약 260단위) · 없으면 room 그림
    let floorMat;
    if (floorT) { floorT.repeat.set(W / 260, H / 260); floorMat = new T.MeshLambertMaterial({ map: floorT }); }
    else floorMat = new T.MeshLambertMaterial({ map: roomTex });
    const floor = new T.Mesh(new T.PlaneGeometry(W, H), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.position.set(W / 2, 0, H / 2); floor.receiveShadow = true; scene.add(floor);
    // 가장자리 어둡게 (방 조명)
    const vig = new T.Mesh(new T.PlaneGeometry(W, H), new T.MeshBasicMaterial({ map: gradTex([[0, 'rgba(6,5,10,0)'], [.62, 'rgba(6,5,10,.05)'], [1, 'rgba(6,5,10,.55)']], 256, 256), transparent: true, depthWrite: false }));
    vig.rotation.x = -Math.PI / 2; vig.position.set(W / 2, .3, H / 2); vig.scale.set(1.15, 1.25, 1); vig.renderOrder = -5; scene.add(vig);

    const side = new T.MeshLambertMaterial(wallT ? { map: wallT } : { color: 0x5A5560 });
    const top = new T.MeshLambertMaterial(topT ? { map: topT, color: 0xB4ADBA } : { map: roomTex });
    const mats = [side, side, top, side, side, side];
    const d = WALL.door, cx = W / 2, cz = H / 2;
    // 위 벽 (문 자리 비움)
    wallBox(0, 0, cx - d, WALL.top, WALL.h, mats); wallBox(cx + d, 0, W, WALL.top, WALL.h, mats);
    // 양옆 벽
    for (const [x0, x1] of [[0, WALL.side], [W - WALL.side, W]]) {
      wallBox(x0, WALL.top, x1, cz - d, WALL.h, mats); wallBox(x0, cz + d, x1, WALL.bottom, WALL.h * .6, mats);
    }
    // 앞 벽: 낮게 (안이 가려지지 않게)
    wallBox(0, WALL.bottom, cx - d, H, WALL.low, mats); wallBox(cx + d, WALL.bottom, W, H, WALL.low, mats);
    for (const x0 of [0, W - WALL.side]) wallBox(x0, WALL.bottom - 40, x0 + WALL.side, WALL.bottom, WALL.low + 10, mats);
    // 기둥 (room 그림의 기둥 자리) — pillar 그림
    const pilT = pilIm && pilIm.naturalWidth ? texOf(pilIm, '3d/pillar') : null;
    const pm = pilT ? new T.MeshLambertMaterial({ map: pilT, alphaTest: .5 }) : side;
    const pmats = [pm, pm, top, pm, pm, pm];
    const pil = [[.155, 0], [.305, 0], [.695, 0], [.845, 0], [0, .33], [1, .33]];
    for (const [u, v] of pil) {
      const px = u === 0 ? WALL.side / 2 : u === 1 ? W - WALL.side / 2 : W * u, pz = v === 0 ? WALL.top / 2 : H * v;
      wallBox(px - 11, pz - 11, px + 11, pz + 11, WALL.h + 16, pmats, 'pillar');
    }
    // 문: door-arch 그림(아치 + 안쪽 어둠·보라/초록 빛)을 벽 안쪽 면에 세워요 + 바닥에 문 빛
    const archT = archIm && archIm.naturalWidth ? texOf(archIm, '3d/door-arch') : null;
    const archMat = archT ? new T.MeshLambertMaterial({ map: archT, transparent: true, alphaTest: .4, side: T.DoubleSide }) : null;
    const voidMat = new T.MeshBasicMaterial({ color: 0x07060B });
    const glowMat = new T.MeshBasicMaterial({ map: doorGlowTex(), transparent: true, blending: T.AdditiveBlending, depthWrite: false });
    // (x, z) = 벽 안쪽 면의 문 가운데, rotY = 방 안쪽을 보게, t = 벽 두께
    const AW = 108, AH = 70;   // 아치 판: 그림 속 아치 폭(0.785) ≈ 85 → 문 구멍 68을 덮어요. 높이는 벽 위로 조금 솟게 눌러요
    const door = (x, z, rotY, hgt, t, arch) => {
      const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
      const back = new T.Mesh(new T.PlaneGeometry(d * 2, hgt), voidMat); back.position.set(0, hgt / 2, -t * .45); g.add(back);
      if (arch && archMat) {
        const a = new T.Mesh(new T.PlaneGeometry(AW, AH), archMat); a.position.set(0, AH / 2 - AH * (1 - .921), 1.5); a.castShadow = true; a.receiveShadow = true; g.add(a);
      }
      const fl = new T.Mesh(new T.PlaneGeometry(150, 75), glowMat); fl.rotation.x = -Math.PI / 2; fl.position.set(0, .5, 37); fl.renderOrder = -4; g.add(fl);
      return g;
    };
    door(cx, WALL.top, 0, WALL.h, WALL.top, true);
    door(WALL.side, cz, Math.PI / 2, WALL.h, WALL.side, true);
    door(W - WALL.side, cz, -Math.PI / 2, WALL.h, WALL.side, true);
    door(cx, WALL.bottom, Math.PI, WALL.low, WALL.top, false);

    // 조명: 은은한 환경광 + 왼쪽 위 앞에서 오는 따뜻한 빛 (그림자는 오른쪽 뒤로)
    scene.add(new T.HemisphereLight(0xC9C2DC, 0x3A3346, .62));
    sun = new T.DirectionalLight(0xFFE6C4, .62);
    sun.position.set(W * .5 - 260, 520, H * .5 + 180); sun.target.position.set(W / 2, 0, H / 2);
    scene.add(sun); scene.add(sun.target);
    sun.castShadow = !R.low;
    const sc = sun.shadow.camera; sc.left = -470; sc.right = 470; sc.top = 380; sc.bottom = -380; sc.near = 100; sc.far = 1400;
    sun.shadow.mapSize.set(pixelCap < 2 ? 1024 : 2048, pixelCap < 2 ? 1024 : 2048); sun.shadow.bias = -0.0015; sun.shadow.normalBias = .6;
    fitCamera();
    return (R.built = true);
  }

  // 카메라: PITCH도로 내려다보며 방 전체(먼 벽 위 ~ 앞 벽)가 화면에 꼭 차게 거리를 맞춰요
  function fitCamera() {
    const th = PITCH * Math.PI / 180, dir = new T.Vector3(0, -Math.sin(th), -Math.cos(th));
    // 먼 벽은 윗면 앞쪽 모서리까지만 (그 위는 HUD 자리라 조금 잘려도 돼요) → 캐릭터가 더 크게
    const pts = [[WALL.side, WALL.h, WALL.top], [W - WALL.side, WALL.h, WALL.top], [WALL.side * .5, 0, WALL.bottom + 8], [W - WALL.side * .5, 0, WALL.bottom + 8], [W / 2, WALL.h * .6, WALL.top * .5]].map(p => new T.Vector3(...p));
    let zc = H / 2;
    const place = D => { camera.position.set(W / 2, 0, zc).addScaledVector(dir, -D); camera.lookAt(W / 2, 0, zc); camera.updateMatrixWorld(); };
    const ext = () => { let y0 = 9, y1 = -9, xm = 0; for (const p of pts) { v1.copy(p).project(camera); y0 = Math.min(y0, v1.y); y1 = Math.max(y1, v1.y); xm = Math.max(xm, Math.abs(v1.x)); } return { y0, y1, xm }; };
    for (let D = 400; D < 4000; D += 4) {
      for (let i = 0; i < 25; i++) { place(D); const e = ext(); zc -= (e.y0 + e.y1) / 2 * 60; }
      place(D); const e = ext();
      if (e.y1 - e.y0 <= 1.97 && e.xm <= 1.02) break;
    }
    camUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
  }

  // ---------- 판(빌보드)·바닥 무늬 풀 ----------
  const geoUp = new T.PlaneGeometry(1, 1); geoUp.translate(0, .5, 0);     // 아래 가운데가 발
  const geoFlat = new T.PlaneGeometry(1, 1); geoFlat.rotateX(-Math.PI / 2);
  const pool = { s: [], d: [], b: [] }, used = { s: 0, d: 0, b: 0 };
  function getSprite() {
    let o = pool.s[used.s++];
    if (!o) {
      // alphaTest: 그림자를 그림 모양대로 (r149는 그림자 계산에 재질의 map·alphaTest를 그대로 써요)
      const mat = new T.MeshBasicMaterial({ transparent: true, depthWrite: false, side: T.DoubleSide, alphaTest: .12 });
      const m = new T.Mesh(geoUp, mat); m.castShadow = true;
      const g = new T.Group(); g.add(m); scene.add(g);
      o = { g, m }; pool.s.push(o);
    }
    o.g.visible = true; return o;
  }
  // tex 판을 발(x, y)에 세워요. hgt = 게임 단위 키, mo = UI.sprite와 같은 움직임(ox·oy·rot·sx·sy·flip·alpha)
  R.sprite = (tex, x, y, hgt, mo = {}, o = {}) => {
    if (!tex || !R.built) return;
    const s = getSprite(), m = s.m, img = tex.image, asp = o.aspect || tex.userData.aspect || img.width / img.height;
    s.g.position.set(x, o.lift || 0, y);
    if (o.upright != null) s.g.rotation.set(-o.upright * Math.PI / 180, 0, 0);   // 카메라보다 덜 눕혀 세워요 (원근이 판에 걸려 입체감)
    else s.g.quaternion.copy(camera.quaternion);
    m.position.set(mo.ox || 0, -(mo.oy || 0) - (o.below || 0), 0);
    m.rotation.set(0, 0, -(mo.rot || 0));
    m.scale.set(hgt * asp * (mo.sx || 1) * (mo.flip ? -1 : 1), hgt * (mo.sy || 1), 1);
    if (o.center) {
      const half = m.scale.y / 2;
      m.position.x += Math.sin(m.rotation.z) * half;
      m.position.y -= Math.cos(m.rotation.z) * half;
    }
    if (m.material.map !== tex) { m.material.map = tex; m.material.needsUpdate = true; }
    m.material.opacity = mo.alpha != null ? mo.alpha : 1;
    if (mo.color != null) m.material.color.set(mo.color);
    else m.material.color.setScalar(mo.tint != null ? mo.tint : 1);
    m.material.blending = o.add ? T.AdditiveBlending : T.NormalBlending;
    const alphaTest = o.effect ? 0 : .12;
    if (m.material.alphaTest !== alphaTest) {
      m.material.alphaTest = alphaTest;
      m.material.needsUpdate = true;
    }
    // 효과와 벽 뒤 캐릭터는 깊이를 검사하고, 캐릭터와 효과는 발 위치 순서로 겹쳐요.
    m.material.depthTest = o.top ? false : (!!o.effect || y < WALL.top + 4);   // top: 항상 맨 앞 (거북선 접촉 불꽃 — QA M20)
    m.renderOrder = o.renderOrder ?? (100 + y + (o.orderOffset || 0));
    m.castShadow = o.shadow !== false;
  };
  // 바닥 무늬 (발밑 빛·화폐 시간 고리) — 캔버스를 바닥에 깔아요. d = 깊이 (게임 단위)
  R.decal = (tex, x, y, w, d, o = {}) => {
    if (!tex || !R.built) return;
    let s = pool.d[used.d++];
    if (!s) { s = new T.Mesh(geoFlat, new T.MeshBasicMaterial({ transparent: true, depthWrite: false })); scene.add(s); pool.d.push(s); }
    s.visible = true;
    if (s.material.map !== tex) { s.material.map = tex; s.material.needsUpdate = true; }
    s.material.blending = o.add ? T.AdditiveBlending : T.NormalBlending;
    s.material.opacity = o.alpha != null ? o.alpha : 1;
    s.rotation.y = -(o.angle || 0);
    s.position.set(x, .6 + (o.lift || 0), y); s.scale.set(w, 1, d); s.renderOrder = o.order != null ? o.order : 50;
  };
  // 발밑 접촉 그림자 (해 그림자와 별개로 발이 바닥에 붙어 보이게)
  let blobTex = null;
  R.blob = (x, y, r, a) => {
    if (!R.built || R.low) return;
    if (!blobTex) blobTex = gradTex([[0, 'rgba(0,0,0,1)'], [.55, 'rgba(0,0,0,.5)'], [1, 'rgba(0,0,0,0)']]);
    R.decal(blobTex, x, y, r * 2, r * 1.2, { alpha: a, order: 40 });
  };
  R.impactLight = (x, y, intensity) => {
    if (!impactLight) {
      impactLight = new T.PointLight(0xff9b4a, 0, 140, 2);
      scene.add(impactLight);
    }
    if (intensity <= impactLight.intensity) return;
    impactLight.position.set(x, 20, y);
    impactLight.intensity = intensity;
  };
  R.canvasTex = canvasTex;

  // ---------- 그리기 ----------
  R.show = on => { if (gl) gl.style.display = on ? 'block' : 'none'; };
  R.resize = (Wpx, Hpx, dpr) => {
    if (!renderer) return;
    renderer.setPixelRatio(Math.min(dpr, pixelCap)); renderer.setSize(Wpx, Hpx, false);
    view.cw = Wpx; view.ch = Hpx;
  };
  // 한 프레임 시작: 지난 프레임 판을 모두 숨겨요
  R.begin = () => {
    if (!R.built && !build()) return false;
    if (impactLight) impactLight.intensity = 0;
    for (const k in pool) { for (let i = 0; i < used[k]; i++) (k === 's' ? pool[k][i].g : pool[k][i]).visible = false; used[k] = 0; }
    return true;
  };
  // 전장 상자(CSS px, 왼쪽 위 기준)에 그려요. 흔들림은 상자를 옮겨서
  R.render = (x, y, w, h) => {
    if (!R.built) return;
    for (const k in pool) for (let i = used[k]; i < pool[k].length; i++) (k === 's' ? pool[k][i].g : pool[k][i]).visible = false;
    renderer.setViewport(0, 0, view.cw, view.ch); renderer.clear();
    renderer.setViewport(x, view.ch - y - h, w, h);
    renderer.render(scene, camera);
  };
  // 배경용 (나라 고르기·결과 화면): 빈 방을 천천히 도는 카메라로 화면 전체에 그려요
  const savePos = new T.Vector3(), saveQ = new T.Quaternion();
  R.backdrop = (t, cw, ch, still) => {
    if (!R.begin()) return false;
    savePos.copy(camera.position); saveQ.copy(camera.quaternion);
    const a = still ? 0 : Math.sin(t * .12) * .5, r = 760, cxz = [W / 2, H / 2];
    camera.position.set(cxz[0] + Math.sin(a) * r * .55, 520, cxz[1] + Math.cos(a) * r * .55);
    camera.aspect = cw / ch; camera.updateProjectionMatrix(); camera.lookAt(cxz[0], 0, cxz[1]);
    renderer.setViewport(0, 0, view.cw, view.ch); renderer.clear(); renderer.render(scene, camera);
    camera.position.copy(savePos); camera.quaternion.copy(saveQ); camera.aspect = W / H; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    return true;
  };
  // 바닥 점(x, y, 높이 hgt) → 전장 좌표(0~FIELD.W, 0~FIELD.H) + 그 자리에서 게임 단위 1의 크기
  const out = { x: 0, y: 0, s: 1 };
  R.proj = (x, y, hgt = 0) => {
    v1.set(x, hgt, y).project(camera);
    out.x = (v1.x + 1) / 2 * W; out.y = (1 - v1.y) / 2 * H;
    v2.set(x, hgt, y).addScaledVector(camUp, 10).project(camera);
    out.s = Math.hypot((v2.x - v1.x) / 2 * W, (v2.y - v1.y) / 2 * H) / 10;
    return out;
  };
  // 전장 좌표의 화면 점 → 바닥(높이 hgt) 위 점 (마우스 조준)
  const ray = new T.Raycaster(), nd = new T.Vector2();
  R.unproj = (fx, fy, hgt = 0) => {
    if (!camera) return null;
    nd.set(fx / W * 2 - 1, 1 - fy / H * 2); ray.setFromCamera(nd, camera);
    const o = ray.ray.origin, d = ray.ray.direction; if (Math.abs(d.y) < 1e-4) return null;
    const k = (hgt - o.y) / d.y; return { x: o.x + d.x * k, y: o.z + d.z * k };
  };
  // 저사양 대응은 세션 안에서만 적용해요. 화면 크기가 바뀌어도 배율을 유지해요.
  R.low = false;
  R.lowQuality = ratio => {
    R.low = true;
    pixelCap = ratio;
    if (sun) sun.castShadow = false;
    renderer.shadowMap.enabled = false;
    R.resize(view.cw, view.ch, window.devicePixelRatio || 1);
  };
  R.info = () => ({ maxTex: renderer.capabilities.maxTextureSize, low: R.low, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, tex: renderer.info.memory.textures, pitch: PITCH });
})();
