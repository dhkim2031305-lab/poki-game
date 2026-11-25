// 2.5D 렌더러 (B안 · 사용자 결정 "b안" 2026-11-25) — Three.js r149 (src/vendor/three.min.js, MIT)
// 바닥·벽·문 = 진짜 3D (살짝 기운 원근 카메라, 조명, 그림자)
// 장수·외계인·화폐 = 카메라를 보는 2D 판(빌보드) · 공격 효과·HUD = 2D 캔버스를 위에 겹쳐요 (R3D.proj로 자리·크기를 맞춰요)
// 되돌리기: 주소 ?render=2d (또는 저장된 설정 render: '2d') → 예전 2D 렌더러
(() => {
  const T = window.THREE, FIELD = window.DATA.FIELD, UI = window.UI;
  const R = { ok: false, built: false };
  window.R3D = R;
  if (!T) return;
  const W = FIELD.W, H = FIELD.H;
  // 벽: room 그림의 벽 띠와 같은 자리 (위 46 · 옆 42 · 아래 38), 앞 벽은 낮게 잘라 안이 보이게
  const WALL = { h: 30, top: 46, side: 42, bottom: 352, low: 9, door: 34 };
  const PITCH = 56;                 // 카메라가 내려다보는 각도(도) — 90이면 위에서 똑바로
  let renderer, scene, camera, gl, sun;
  const camUp = new T.Vector3(), v1 = new T.Vector3(), v2 = new T.Vector3();
  let pixelCap = 2, view = { x: 0, y: 0, w: 1, h: 1, cw: 1, ch: 1 };

  R.init = gameCanvas => {
    try {
      gl = document.createElement('canvas'); gl.id = 'game3d';
      renderer = new T.WebGLRenderer({ canvas: gl, antialias: false, alpha: false, powerPreference: 'high-performance' });
    } catch (e) { console.warn('[3D] WebGL 안 됨 → 2D로', e); return false; }
    gameCanvas.parentNode.insertBefore(gl, gameCanvas);
    gl.style.display = 'none';
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
  R.tex = (name, variant) => {
    const key = name + '|' + (variant || '');
    if (texCache[key]) return texCache[key];
    const im = UI.img[name]; if (!im || !im.naturalWidth) return null;
    if (!variant) return texOf(im, key);
    // 맞음 번쩍임(흰) · 몸 색 외곽선 — 처음 한 번만 만들어 둬요
    const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
    const x = c.getContext('2d'), k = im.naturalHeight / 48;
    if (variant === 'white') x.filter = 'brightness(2.4)';
    else x.filter = `drop-shadow(0 0 ${1.5 * k}px ${variant}) drop-shadow(0 0 ${0.5 * k}px ${variant})`;
    x.drawImage(im, 0, 0);
    return texOf(c, key);
  };
  function canvasTex(c) { const t = new T.CanvasTexture(c); t.generateMipmaps = false; t.minFilter = T.LinearFilter; return t; }
  function gradTex(stops, w = 64, h = 64, radial = true) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
    const g = radial ? x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2) : x.createLinearGradient(0, 0, w, 0);
    stops.forEach(([o, col]) => g.addColorStop(o, col)); x.fillStyle = g; x.fillRect(0, 0, w, h);
    return canvasTex(c);
  }
  // 벽돌 (임시: 디자인팀 10차 tex-wall이 오면 바꿔요) — room 그림 벽 색에 맞춘 어두운 돌
  function brickTex() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
    x.fillStyle = '#2A2731'; x.fillRect(0, 0, 256, 128);
    let seed = 7; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let row = 0; row < 4; row++) {
      const off = row % 2 ? 32 : 0;
      for (let i = -1; i < 4; i++) {
        const bx = i * 64 + off + 2, by = row * 32 + 2, l = 88 + r() * 26 | 0;
        x.fillStyle = `rgb(${l},${l - 6},${l + 4})`; x.fillRect(bx, by, 60, 28);
        x.fillStyle = 'rgba(255,255,255,.10)'; x.fillRect(bx, by, 60, 3);
        x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(bx, by + 24, 60, 4);
      }
    }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4;
    return t;
  }

  // ---------- 방 만들기 (에셋 로딩 뒤 처음 그릴 때 한 번) ----------
  const UVK = 48;   // 벽돌 한 장(64px)이 게임 단위 48에 맞게
  function wallBox(x0, z0, x1, z1, h, mats) {
    const g = new T.BoxGeometry(x1 - x0, h, z1 - z0);
    g.translate((x0 + x1) / 2, h / 2, (z0 + z1) / 2);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const face = Math.floor(i / 4), X = p.getX(i), Y = p.getY(i), Z = p.getZ(i);
      if (face === 2) uv.setXY(i, X / W, 1 - Z / H);            // 윗면 = room 그림의 그 자리 (갓돌)
      else if (face < 2) uv.setXY(i, Z / UVK, Y / UVK * 2);      // 옆면
      else uv.setXY(i, X / UVK, Y / UVK * 2);                    // 앞·뒷면
    }
    const m = new T.Mesh(g, mats); m.castShadow = true; m.receiveShadow = true; scene.add(m);
    return m;
  }
  function build() {
    const room = UI.img.room; if (!room || !room.naturalWidth) return false;
    const roomTex = texOf(room, 'room');
    // 바닥: room 그림 전체 (문 앞 보라·초록 빛도 그림에 있어요)
    const floor = new T.Mesh(new T.PlaneGeometry(W, H), new T.MeshLambertMaterial({ map: roomTex }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(W / 2, 0, H / 2); floor.receiveShadow = true; scene.add(floor);
    // 가장자리 어둡게 (방 조명)
    const vig = new T.Mesh(new T.PlaneGeometry(W, H), new T.MeshBasicMaterial({ map: gradTex([[0, 'rgba(6,5,10,0)'], [.62, 'rgba(6,5,10,.05)'], [1, 'rgba(6,5,10,.55)']], 256, 256), transparent: true, depthWrite: false }));
    vig.rotation.x = -Math.PI / 2; vig.position.set(W / 2, .3, H / 2); vig.scale.set(1.15, 1.25, 1); vig.renderOrder = -5; scene.add(vig);

    const brick = brickTex();
    const side = new T.MeshLambertMaterial({ map: brick, color: 0xC8C0D4 });
    const top = new T.MeshLambertMaterial({ map: roomTex });
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
    // 기둥 (room 그림의 기둥 자리)
    const pil = [[.155, 0], [.305, 0], [.695, 0], [.845, 0], [0, .33], [1, .33]];
    for (const [u, v] of pil) {
      const px = u === 0 ? WALL.side / 2 : u === 1 ? W - WALL.side / 2 : W * u, pz = v === 0 ? WALL.top / 2 : H * v;
      wallBox(px - 13, pz - 13, px + 13, pz + 13, WALL.h + 8, mats);
    }
    // 문: 안쪽은 어둡고 보라·초록 빛이 새어 나와요
    const glow = gradTex([[0, 'rgba(202,87,229,.95)'], [.48, 'rgba(160,70,200,.5)'], [.52, 'rgba(150,200,40,.5)'], [1, 'rgba(184,215,39,.95)']], 128, 8, false);
    const voidMat = new T.MeshBasicMaterial({ color: 0x07060B });
    const glowMat = new T.MeshBasicMaterial({ map: glow, transparent: true, blending: T.AdditiveBlending, depthWrite: false, opacity: .8 });
    const archMat = new T.MeshLambertMaterial({ map: brick, color: 0xB8B0C4 });
    // (x, z) = 벽 안쪽 면의 문 가운데, rotY = 방 안쪽을 보게, t = 벽 두께
    const door = (x, z, rotY, hgt, t) => {
      const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = rotY; scene.add(g);
      const back = new T.Mesh(new T.PlaneGeometry(d * 2, hgt), voidMat); back.position.set(0, hgt / 2, -t * .45); g.add(back);
      const gl = new T.Mesh(new T.PlaneGeometry(d * 2, hgt), glowMat); gl.position.set(0, hgt / 2, -t * .4); g.add(gl);
      if (hgt > 12) {
        const arch = new T.Mesh(new T.TorusGeometry(d + 3, 5, 6, 14, Math.PI), archMat); arch.position.set(0, hgt * .62, -5); arch.castShadow = true; g.add(arch);
        for (const s of [-1, 1]) { const p = new T.Mesh(new T.BoxGeometry(10, hgt * .62, 12), archMat); p.position.set(s * (d + 3), hgt * .31, -5); p.castShadow = true; g.add(p); }
      }
      return g;
    };
    door(cx, WALL.top, 0, WALL.h, WALL.top);
    door(WALL.side, cz, Math.PI / 2, WALL.h, WALL.side);
    door(W - WALL.side, cz, -Math.PI / 2, WALL.h, WALL.side);

    // 조명: 은은한 환경광 + 왼쪽 위 앞에서 오는 따뜻한 빛 (그림자는 오른쪽 뒤로)
    scene.add(new T.HemisphereLight(0xC9C2DC, 0x3A3346, .62));
    sun = new T.DirectionalLight(0xFFE6C4, .62);
    sun.position.set(W * .5 - 260, 520, H * .5 + 180); sun.target.position.set(W / 2, 0, H / 2);
    scene.add(sun); scene.add(sun.target);
    sun.castShadow = true;
    const sc = sun.shadow.camera; sc.left = -470; sc.right = 470; sc.top = 380; sc.bottom = -380; sc.near = 100; sc.far = 1400;
    sun.shadow.mapSize.set(pixelCap < 2 ? 1024 : 2048, pixelCap < 2 ? 1024 : 2048); sun.shadow.bias = -0.0015; sun.shadow.normalBias = .6;
    fitCamera();
    return (R.built = true);
  }

  // 카메라: PITCH도로 내려다보며 방 전체(먼 벽 위 ~ 앞 벽)가 화면에 꼭 차게 거리를 맞춰요
  function fitCamera() {
    const th = PITCH * Math.PI / 180, dir = new T.Vector3(0, -Math.sin(th), -Math.cos(th));
    const pts = [[0, WALL.h, 0], [W, WALL.h, 0], [0, 0, H], [W, 0, H], [WALL.side, 0, H - 30], [W / 2, WALL.h + 8, 0]].map(p => new T.Vector3(...p));
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
    const s = getSprite(), m = s.m, img = tex.image, asp = o.aspect || img.width / img.height;
    s.g.position.set(x, 0, y); s.g.quaternion.copy(camera.quaternion);
    m.position.set(mo.ox || 0, -(mo.oy || 0) - (o.below || 0), 0);
    m.rotation.set(0, 0, -(mo.rot || 0));
    m.scale.set(hgt * asp * (mo.sx || 1) * (mo.flip ? -1 : 1), hgt * (mo.sy || 1), 1);
    if (m.material.map !== tex) { m.material.map = tex; m.material.needsUpdate = true; }
    m.material.opacity = mo.alpha != null ? mo.alpha : 1;
    // 벽 앞(방 안)에 있으면 화면 순서대로 칠하고, 위쪽 벽 너머(들어오는 중)면 벽에 가려져요
    m.material.depthTest = y < WALL.top + 4;
    m.renderOrder = 100 + y;
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
    s.position.set(x, .6 + (o.lift || 0), y); s.scale.set(w, 1, d); s.renderOrder = o.order != null ? o.order : 50;
  };
  // 발밑 접촉 그림자 (해 그림자와 별개로 발이 바닥에 붙어 보이게)
  let blobTex = null;
  R.blob = (x, y, r, a) => {
    if (!R.built) return;
    if (!blobTex) blobTex = gradTex([[0, 'rgba(0,0,0,1)'], [.55, 'rgba(0,0,0,.5)'], [1, 'rgba(0,0,0,0)']]);
    R.decal(blobTex, x, y, r * 2, r * 1.2, { alpha: a, order: 40 });
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
  // 느린 기기: 3초 넘게 40fps 아래면 해 그림자를 끄고 픽셀 배율을 1로 (발밑 그림자는 남아요)
  R.low = false;
  R.lowQuality = () => {
    if (R.low || !renderer) return; R.low = true; pixelCap = 1;
    if (sun) sun.castShadow = false; renderer.shadowMap.enabled = false;
    renderer.setPixelRatio(1); renderer.setSize(view.cw, view.ch, false);
    console.info('[3D] 느린 기기 → 그림자 끄고 픽셀 배율 1');
  };
  R.info = () => ({ low: R.low, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, tex: renderer.info.memory.textures, pitch: PITCH });
})();
