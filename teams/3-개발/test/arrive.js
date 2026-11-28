// node teams/3-개발/test/arrive.js
// 이미지 헤더를 읽고 실제 게임의 전투 및 2D 그리기 함수를 16ms 단위로 실행해요.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const src = path.resolve(__dirname, '../../../src');
const noop = () => {};
const images = {};
for (const folder of ['u', 'seq', 'prop']) {
  for (const file of fs.readdirSync(path.join(src, 'assets/skill', folder))) {
    if (!file.endsWith('.webp')) continue;
    const data = fs.readFileSync(path.join(src, 'assets/skill', folder, file));
    let width, height;
    for (let i = 12; i + 8 < data.length; ) {
      const chunk = data.toString('ascii', i, i + 4), p = i + 8;
      if (chunk === 'VP8X') {
        width = 1 + data.readUIntLE(p + 4, 3);
        height = 1 + data.readUIntLE(p + 7, 3);
      } else if (chunk === 'VP8 ') {
        width = data.readUInt16LE(p + 6) & 0x3fff;
        height = data.readUInt16LE(p + 8) & 0x3fff;
      } else if (chunk === 'VP8L') {
        const bits = data.readUInt32LE(p + 1);
        width = 1 + (bits & 0x3fff);
        height = 1 + ((bits >>> 14) & 0x3fff);
      }
      if (width) break;
      const length = data.readUInt32LE(i + 4);
      i = p + length + (length % 2);
    }
    if (!width || !height) throw Error(file + ' 이미지 크기 확인 실패');
    images['skill/' + folder + '/' + path.basename(file, '.webp')] = { naturalWidth: width, naturalHeight: height };
  }
}
let draws = 0, xy;
const ctx = new Proxy({
  translate(x, y) { xy = [x, y]; },
  drawImage() { draws++; },
}, { get: (obj, key) => obj[key] ?? noop });
const canvas = { getContext: () => ctx, addEventListener: noop };
const context = vm.createContext({
  console, process, URLSearchParams, location: { search: '?render=2d' },
  performance, setTimeout, clearTimeout,
  document: { getElementById: () => canvas, createElement: () => canvas, addEventListener: noop },
  addEventListener: noop, innerWidth: 844, innerHeight: 390,
  UI: { img: images, COL: {}, dirBody: noop },
  I18N: { set: noop, t: x => x },
  AUDIO: { play: noop, voice: noop, music: noop },
  Platform: { gameplayStart: noop }, FX: { GUN: { usa: {}, finland: {} } },
  drawing: () => ({ draws, xy }),
});
context.window = context;
vm.runInContext(fs.readFileSync(path.join(src, 'data.js'), 'utf8'), context);
const game = fs.readFileSync(path.join(src, 'game.js'), 'utf8');
const boot = game.indexOf('  // 시작 순서: SDK 초기화');
if (boot < 0) throw Error('게임 시작 지점 확인 실패');
vm.runInContext(game.slice(0, boot) + '(' + measure.toString() + ')();\n})();', context);

function measure() {
  let frame, flights, art, arrivals, active, firstDamage, issues, castCount;
  const launch = drawSkillFlight;
  drawSkillFlight = (id, pos, ...args) => {
    const before = drawing().draws;
    launch(id, pos, ...args);
    if (drawing().draws > before) {
      if (!flights.length) flights.push([frame, drawing().xy]);
      active?.add(frame);
    }
  };
  const observeArt = draw => (...args) => {
    const before = drawing().draws;
    draw(...args);
    if (drawing().draws > before && !art) art = [frame, drawing().xy];
  };
  drawRepresentative = observeArt(drawRepresentative);
  drawTurtleArt = observeArt(drawTurtleArt);

  let projectileDamage;
  const dealDamage = damage;
  damage = (alien, amount, nx, ny, heavy, opts) => {
    const hp = alien.hp;
    dealDamage(alien, amount, nx, ny, heavy, opts);
    if (G.hero.heroSkill && skillOf(G.country, G.hero.heroSkill.n).mod.k === 'spearEnd' &&
        opts?.skill && !opts.finisher && alien.hp < hp) projectileDamage ??= frame;
  };
  const prop = drawProp;
  drawProp = (...args) => { castCount++; prop(...args); };
  const hit = barrageImpact;
  barrageImpact = (shot, x, y) => {
    if (shot.skill && !shot.artHit) arrivals.push(frame);
    hit(shot, x, y);
  };
  const launchEffect = launchSkillArt;
  launchSkillArt = (...args) => {
    const e = launchEffect(...args), arrive = e.arrive;
    e.arrive = () => { arrivals.push(frame); arrive?.(); };
    return e;
  };
  const common = commonSkillFx;
  commonSkillFx = (kind, ...args) => {
    if (kind === 'impact' && G.country.key === 'korea' && G.hero.heroSkill.n === 2 && !arrivals.includes(frame)) arrivals.push(frame);
    return common(kind, ...args);
  };
  const seconds = f => f == null ? '—' : (f * .016).toFixed(3);
  const event = e => e ? seconds(e[0]) + ' @ ' + e[1].map(Math.round).join(',') : '—';
  let failures = 0, misses = 0, flightCases = 0, dashes = 0;
  const targetX = Number(process.argv[2] || 560);
  const filter = process.argv.slice(3);
  let cases = 0;
  console.log('Node 2D 그리기 호출 · 16 ms · 장수 (200,230) · 외계인 (' + targetX + ',230) · 4.8초');
  console.log('복수 착탄은 각각 기록. 피해 시각은 해당 표적의 첫 피해. 그리스 2는 돌진과 투창 피해를 둘 다 기록.');
  console.log('스킬\t유형\tlaunch (초 @ x,y)\tarrive (초)\tart (초 @ x,y)\tdmg (초)\t판정');
  for (const country of COUNTRIES) for (const n of [1, 2]) {
    const id = country.key + '-' + n;
    if (filter.length && !filter.includes(id)) continue;
    cases++;
    const sk = skillOf(country, n), kind = sk.mod.k;
    const cannon = kind === 'cannon';
    const flying = sk.type === 'zone' || sk.type === 'area' && !AREA_AT_HERO.includes(kind)
      || sk.type === 'barrage' && kind !== 'arcs8' || kind === 'spearEnd';
    if (flying) flightCases++;
    if (sk.type === 'dash' && kind !== 'spearEnd') dashes++;
    Object.assign(G, {
      scene: 'play', country, hitstop: 0, slow: 0, koreaSlow: 0, cutin: null,
      t: 0, combatT: 0, fx: [], shots: [], zones: [], marks: [], timers: [],
      ents: [], parts: [], msgs: [], items: [], eshots: [],
      run: { round: 1, wave: { n: 99 }, spawned: 0, killsRound: 0, itemIdx: 99,
        roundT: 0, spawnT: 99, clearT: -1, skillsLeft: { 1: 5, 2: 5 }, st: stats(country.money, country) },
      hero: { x: 200, y: 230, dir: { x: 1, y: 0 }, inv: 99, r: 15, skillT: 0, atkT: 0, hitT: 0, meleeCd: 0, rangedCd: 0 },
    });
    const alien = { type: 'grunt', x: targetX, y: 230, entering: false, hp: 99999, max: 99999,
      speed: 0, r: 15, flash: 0, shootT: 99, seed: 0, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 };
    G.aliens = [alien];
    flights = []; arrivals = []; art = null; firstDamage = null; projectileDamage = null; issues = [];
    active = new Set();
    frame = 0;
    useSkill(n);
    let dashEnd, finishedDash, impactArt, zoneStarted, firstImpactArt, firstShotEnd, skillShot;
    const visibleImpactFrames = new Set();
    for (; frame <= 300; frame++) {
      const wasDashing = G.hero.dash;
      if (frame) update(.016);
      if (wasDashing && !G.hero.dash) { dashEnd = frame; finishedDash = wasDashing; }
      skillShot ??= G.shots.find(s => s.skill);
      if (skillShot && firstShotEnd == null && !G.shots.includes(skillShot)) firstShotEnd = frame;
      if (firstDamage == null && alien.hp < 99999) firstDamage = frame;
      if (!zoneStarted && G.zones.some(z => z.impact)) {
        zoneStarted = true;
        arrivals.push(frame);
      }
      for (const e of G.fx) {
        if (e.type === 'flight' && e.t >= 0 && e.t < e.life) drawLaunchedSkill(e, e.t / e.life, at2d);
        if (e.type === 'art') {
          const before = drawing().draws;
          drawRepresentative(e);
          if (drawing().draws > before && (e.landed || e.z)) {
            visibleImpactFrames.add(frame);
            impactArt ??= [frame, drawing().xy];
          }
        }
        if (cannon && e.type === 'common' && e.name.endsWith('-impact') && !firstImpactArt) {
          const before = drawing().draws;
          drawCommonSkillFx(e);
          if (drawing().draws > before) firstImpactArt = [frame, drawing().xy];
        }
        if (dashEnd != null && (frame - dashEnd) * .016 > .15 && finishedDash && e.dash === finishedDash) {
          issues.push('돌진 잔상');
        }
      }
      for (const z of G.zones) drawZoneFlight(z, at2d);
      for (const shot of G.shots) if (shot.skill) drawSkillShot(shot);
      for (const entity of G.ents) if (cannon) entity.draw?.(at2d);
      castCount = 0;
      drawHeroProp(G.hero, at2d);
      if (sk.type === 'dash' && castCount > 0) issues.push('돌진 소품');
      if (kind === 'turtle') drawTurtleArt(G.hero, at2d);
    }
    if (cannon) art = firstImpactArt;
    if (kind === 'spearEnd') art = impactArt;
    if (kind === 'turtle' && !art) issues.push('거북선 그림 누락');
    const flightDamage = kind === 'spearEnd' ? projectileDamage : firstDamage;
    if (flying) {
      if (active.size < (kind === 'spearEnd' ? 1 : 2)) issues.push('비행 그림 누락');
      if (arrivals.length && flights[0]?.[0] >= arrivals[0]) issues.push('도착 전 비행 그림 누락');
      if (!cannon && arrivals.some(f => !visibleImpactFrames.has(f))) issues.push('도착 프레임 그림 누락');
      if (arrivals.length && (!art || art[0] < arrivals[0])) issues.push('도착 그림 시각');
      if (flightDamage != null && !arrivals.some(f => Math.abs(flightDamage - f) * .016 <= .05)) issues.push('첫 피해 시각');
      if (flightDamage == null) misses++;
    }
    if (kind === 'leap' && art?.[0] !== dashEnd) issues.push('착지 그림 시각');
    if (kind === 'spinMove' && art?.[0] !== firstDamage) issues.push('회전 타격 그림 시각');
    if (issues.length) failures++;
    const result = issues.length ? [...new Set(issues)].join(', ') : flying && flightDamage == null ? '표적 미적중' : '통과';
    console.log([country.key + '-' + n, sk.type, event(flights[0]),
      arrivals.map(seconds).join(', ') || (firstShotEnd == null ? '—' : seconds(firstShotEnd) + ' (소멸)'), event(art),
      kind === 'spearEnd' ? seconds(firstDamage) + ' (돌진), ' + seconds(projectileDamage) + ' (투창)' : seconds(firstDamage),
      result].join('\t'));
  }
  console.log('합계 ' + cases + '개 · 비행 검증 ' + flightCases + '개 · 돌진 ' + dashes + '개 · 비행 표적 미적중 ' + misses + '개 · 위반 ' + failures + '개');
  if (failures) process.exitCode = 1;
}
