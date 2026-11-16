import * as THREE from 'three';
import { go, say, html, wait, tween } from '../engine.js';
import { makeShip, makeStars, makeEarth, makeMoon, glowSprite } from '../models.js';
import { sfx } from '../audio.js';
import { state } from '../state.js';
import { MISSIONS, evaluate, DEV_CHOICE } from '../missions.js';
import { t } from '../text.js';
import { log } from '../report.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
let built = false, ship, stars, earth, moon, streaks, rockGeo, rockMat;
let rocks = [], keys = {}, pos = new THREE.Vector2(), vel = new THREE.Vector2();
let run = null, hud, flash;

function build() {
  scene.background = new THREE.Color(0x03020a);
  stars = makeStars(4000, 500); scene.add(stars);
  ship = makeShip(); ship.rotation.y = Math.PI; ship.scale.setScalar(0.62); scene.add(ship);
  const glow = glowSprite(0xa9c8ff, 1.6); glow.position.set(0, 0, 3.0); glow.material.opacity = 0.55; ship.add(glow);
  earth = makeEarth(60); scene.add(earth);
  moon = makeMoon(30); scene.add(moon);
  const sun = new THREE.DirectionalLight(0xfff1e0, 3); sun.position.set(-5, 6, 4); scene.add(sun);
  scene.add(new THREE.AmbientLight(0x3a3360, 1.0));
  const back = new THREE.DirectionalLight(0x9c88ff, 0.8); back.position.set(3, -2, -6); scene.add(back);
  // speed streaks
  const n = 260, p = new Float32Array(n * 6);
  for (let i = 0; i < n; i++) { const x = (Math.random() - 0.5) * 40, y = (Math.random() - 0.5) * 24, z = -Math.random() * 200; p.set([x, y, z, x, y, z - 3], i * 6); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  streaks = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xb9a3ff, transparent: true, opacity: 0.35 }));
  scene.add(streaks);
  rockGeo = new THREE.IcosahedronGeometry(1, 2);
  const rp = rockGeo.attributes.position;
  for (let i = 0; i < rp.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(rp, i); v.multiplyScalar(0.8 + Math.random() * 0.35); rp.setXYZ(i, v.x, v.y, v.z); }
  rockGeo.computeVertexNormals();
  rockMat = new THREE.MeshStandardMaterial({ color: 0x7a6a62, roughness: 0.95, flatShading: true });
  addEventListener('keydown', (e) => { keys[e.code] = true; if (e.code === 'Space') { e.preventDefault(); boost(); } });
  addEventListener('keyup', (e) => { keys[e.code] = false; });
  // touch / mouse drag steering
  let drag = null;
  addEventListener('pointerdown', (e) => { if (run && e.target.id === 'c') drag = { x: e.clientX, y: e.clientY }; });
  addEventListener('pointermove', (e) => { if (drag && run) { vel.x += (e.clientX - drag.x) * 0.004; vel.y -= (e.clientY - drag.y) * 0.004; drag = { x: e.clientX, y: e.clientY }; } });
  addEventListener('pointerup', () => { drag = null; });
  built = true;
}

function boost() {
  if (!run || run.boosts <= 0 || run.dash > 0) return;
  run.boosts--; run.dash = 0.5; sfx('whoosh'); updateHud();
}

function spawnRock(z = -160) {
  const r = new THREE.Mesh(rockGeo, rockMat);
  const s = 0.5 + Math.pow(Math.random(), 2) * 1.6;
  r.scale.setScalar(s); r.userData.r = s;
  r.position.set((Math.random() - 0.5) * 14 + pos.x * 0.6, (Math.random() - 0.5) * 8 + pos.y * 0.6, z);
  r.userData.spin = new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(1.5);
  r.castShadow = false; scene.add(r); rocks.push(r);
}

function updateHud() {
  if (!hud || !run) return;
  hud.querySelector('.lives').textContent = '❤️'.repeat(Math.max(0, run.lives)) + '🖤'.repeat(Math.max(0, run.maxLives - run.lives));
  hud.querySelector('.boosts').textContent = t('boosts', { n: run.boosts });
}

async function event(kind) {
  const b = state.build;
  if (kind === 'flare') {
    sfx('alarm'); flash.style.background = 'rgba(255,150,60,.45)'; flash.style.opacity = 1;
    setTimeout(() => (flash.style.opacity = 0), 900);
    log().events.flare = b.shieldLevel === 0 ? 'hit' : 'ok';
    if (b.shieldLevel === 0) { run.lives--; updateHud(); sfx('hit'); toast(t('flare_hit')); }
    else toast(t('flare_ok'));
  } else if (kind === 'eclipse') {
    run.dark = 1; log().events.eclipse = b.battery ? 'ok' : 'bad';
    if (b.battery) toast(t('eclipse_ok'));
    else { run.sluggish = 6; toast(t('eclipse_bad')); }
    setTimeout(() => (run && (run.dark = 0)), 6000);
  } else if (kind === 'blackout') {
    hud.style.opacity = 0.15; sfx('alarm'); log().events.blackout = 'yes';
    toast(t('blackout'));
    setTimeout(() => hud && (hud.style.opacity = 1), 6000);
  }
}

function toast(text) {
  const el = html(`<div class="caption" style="top:16vh;font-family:Nunito;font-style:normal;font-size:18px;max-width:640px;left:50%;background:rgba(18,14,34,.72);padding:10px 18px;border-radius:14px;width:auto">${text}</div>`);
  setTimeout(() => { el.style.transition = 'opacity .8s'; el.style.opacity = 0; setTimeout(() => el.remove(), 800); }, 4200);
}

export default {
  scene, camera, bloom: 0.8,
  async enter() {
    if (!built) build();
    if (!state.build) state.build = evaluate(DEV_CHOICE, state.mission);
    rocks.forEach((r) => scene.remove(r)); rocks = [];
    pos.set(0, 0); vel.set(0, 0);
    const m = MISSIONS[state.mission];
    earth.visible = state.mission === 1; moon.visible = state.mission === 2;
    earth.position.set(-40, -70, -150); moon.position.set(8, 4, -420);
    camera.position.set(0, 2.0, 8.5); camera.lookAt(0, 0.4, -10);
    flash = html('<div style="position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .6s"></div>');
    const dim = html('<div style="position:absolute;inset:0;pointer-events:none;background:#000;opacity:0;transition:opacity 1.5s"></div>');
    hud = html(`<div class="hud"><div class="lives"></div><div class="boosts"></div>
      <div style="width:220px;height:7px;background:rgba(255,255,255,.12);border-radius:7px;overflow:hidden"><div class="prog" style="height:100%;width:0;background:#8ff3ff"></div></div></div>`);
    hud.style.transition = 'opacity 1s';
    const hint = html(`<div class="hint">${t('hint_fly')}</div>`);
    run = null;
    await wait(1200);
    const easy = state.easy ? 2 : 0;   // easy mode (offered after two crashes): fewer rocks, two extra lives
    run = { t: 0, len: m.flight.seconds, rate: m.flight.rate * (easy ? 0.5 : 1), lives: state.build.lives + easy, maxLives: state.build.lives + easy,
      boosts: state.build.boosts, dash: 0, events: m.flight.events.map((k, i) => ({ k, at: (i + 1) / (m.flight.events.length + 1), done: false })),
      spawn: 0, inv: 0, dark: 0, sluggish: 0, dim };
    log().flights++; log().hits = 0; log().events = {};
    updateHud();
    setTimeout(() => hint.remove(), 6000);
  },
  async update(dt, t) {
    stars.userData.update(t);
    earth.userData.update?.(t);
    ship.userData.update(t, 1);
    // streaks motion
    const sp = streaks.geometry.attributes.position;
    const speed = run ? 60 + (run.dash > 0 ? 50 : 0) : 30;
    for (let i = 0; i < sp.count; i += 2) {
      let z = sp.getZ(i) + speed * dt;
      if (z > 10) { z = -200; const x = (Math.random() - 0.5) * 40, y = (Math.random() - 0.5) * 24; sp.setXY(i, x, y); sp.setXY(i + 1, x, y); }
      sp.setZ(i, z); sp.setZ(i + 1, z - 3 - speed * 0.04);
    }
    sp.needsUpdate = true;
    if (!run) { ship.position.set(pos.x, pos.y, 0); return; }

    run.t += dt;
    const prog = Math.min(run.t / run.len, 1);
    hud.querySelector('.prog').style.width = prog * 100 + '%';
    run.dim.style.opacity = run.dark ? 0.55 : 0;
    // steering
    const acc = (run.sluggish > 0 ? 9 : 26) * (run.dash > 0 ? 2.6 : 1);
    run.sluggish = Math.max(0, run.sluggish - dt);
    const ax = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA || keys.KeyQ ? 1 : 0);
    const ay = (keys.ArrowUp || keys.KeyW || keys.KeyZ ? 1 : 0) - (keys.ArrowDown || keys.KeyS ? 1 : 0);
    vel.x += ax * acc * dt; vel.y += ay * acc * dt;
    vel.multiplyScalar(Math.pow(0.04, dt));
    pos.addScaledVector(vel, dt * 4);
    pos.x = THREE.MathUtils.clamp(pos.x, -7, 7); pos.y = THREE.MathUtils.clamp(pos.y, -3.6, 3.6);
    ship.position.set(pos.x, pos.y, 0);
    ship.rotation.z = -vel.x * 0.12; ship.rotation.x = vel.y * 0.06;
    camera.position.x += (pos.x * 0.6 - camera.position.x) * 4 * dt;
    camera.position.y += (2.0 + pos.y * 0.6 - camera.position.y) * 4 * dt;
    camera.lookAt(pos.x * 0.5, pos.y * 0.5 + 0.4, -10);
    run.dash = Math.max(0, run.dash - dt); run.inv = Math.max(0, run.inv - dt);
    ship.visible = run.inv > 0 ? Math.sin(t * 40) > 0 : true;

    // destination grows
    if (state.mission === 2) { moon.position.z = -420 + prog * 300; }
    else earth.rotation.x = prog * 0.4;

    // spawn rocks (none in the last 8%)
    run.spawn -= dt;
    if (run.spawn <= 0 && prog < 0.92) { spawnRock(); run.spawn = (0.55 - prog * 0.25) / run.rate; }
    for (let i = rocks.length - 1; i >= 0; i--) {
      const r = rocks[i];
      r.position.z += (55 + prog * 25) * dt;
      r.rotation.x += r.userData.spin.x * dt; r.rotation.y += r.userData.spin.y * dt;
      if (run.inv <= 0 && r.position.z > -1.5 && r.position.z < 1.5 &&
          Math.hypot(r.position.x - pos.x, r.position.y - pos.y) < r.userData.r * 0.75 + 0.65) {
        run.lives--; run.inv = 1.4; log().hits++; sfx('hit'); updateHud();
        flash.style.background = 'rgba(255,90,90,.35)'; flash.style.opacity = 1; setTimeout(() => (flash.style.opacity = 0), 250);
      }
      if (r.position.z > 12) { scene.remove(r); rocks.splice(i, 1); }
    }
    for (const ev of run.events) if (!ev.done && prog >= ev.at) { ev.done = true; event(ev.k); }

    if (run.lives <= 0) { const r = run; run = null; return this.fail(r); }
    if (prog >= 1) { log().livesLeft = run.lives; run = null; return this.arrive(); }
  },
  async fail() {
    sfx('hit');
    const el = html(`<div class="end"><div class="title" style="opacity:1;animation:none;font-size:40px">${t('fail_title')}</div>
      <div style="color:var(--dim);max-width:520px">${t('fail_text')}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center"><button class="btn b1">${t('retry_flight')}</button><button class="btn ghost b2">${t('back_hangar')}</button>
      ${log().flights >= 2 && !state.easy ? `<button class="btn ghost b3">${t('easy_mode')}</button>` : ''}</div></div>`);
    el.querySelector('.b3')?.addEventListener('click', () => { state.easy = true; go(this); });
    el.querySelector('.b1').onclick = () => go(this);
    el.querySelector('.b2').onclick = async () => go((await import('./hangar.js')).default);
  },
  async arrive() {
    hud.style.opacity = 0;
    const next = state.mission === 1 ? './satellite.js' : './moon.js';
    await say(t(state.mission === 1 ? 'arrive1' : 'arrive2'), t('who_him'));
    go((await import(next)).default, { fadeOut: 1400 });
  },
  exit() { run = null; },
};
