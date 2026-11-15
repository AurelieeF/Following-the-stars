import * as THREE from 'three';
import { go, say, caption, html, hotspot, tween, wait, easeInOut, snapshot, showPhoto } from '../engine.js';
import { cloneChar, makeShip, makeSatellite, makeStars, makeEarth, MAT, glowSprite } from '../models.js';
import { sfx, music } from '../audio.js';
import { state } from '../state.js';
import { evaluate } from '../missions.js';
import { epicPhoto } from '../nasa.js';
import { t } from '../text.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
let built = false, stars, earth, ship, sat, hero, tether, arrow, hatch;
let held = false, phase = 'intro', angle = 0, power = 0, tries = 0, heroVel = new THREE.Vector3(), satOk = false, ui = {};
const START = new THREE.Vector3(-3.6, 0.4, 0.3);
const CABLE = { short: 9.5, long: 13 };
let photoPromise = null;

function build() {
  scene.background = new THREE.Color(0x020108);
  stars = makeStars(4000, 500); scene.add(stars);
  earth = makeEarth(40); earth.position.set(6, -47, -18); earth.rotation.set(-1.1, 0, 0.4); scene.add(earth);
  const sun = new THREE.DirectionalLight(0xfff1e0, 3.2); sun.position.set(-8, 6, 6); scene.add(sun);
  scene.add(new THREE.AmbientLight(0x30285a, 0.9));
  const bounce = new THREE.DirectionalLight(0x6fa8ff, 0.9); bounce.position.set(0, -6, 2); scene.add(bounce);
  ship = makeShip(); ship.position.set(-6.5, 0.6, -0.5); ship.rotation.set(0.1, 1.2, 0.05); ship.scale.setScalar(0.9); scene.add(ship);
  hatch = new THREE.Object3D(); hatch.position.set(0.9, 0.1, 0.2); ship.add(hatch);
  sat = makeSatellite(); sat.position.set(5, 0.5, -0.5); sat.rotation.y = -0.5; sat.scale.setScalar(0.8); scene.add(sat);
  hero = cloneChar(state.astronaut); hero.scale.multiplyScalar(0.85); scene.add(hero);
  tether = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 33 }, () => new THREE.Vector3())),
    new THREE.LineBasicMaterial({ color: new THREE.Color(0xffcf8a).multiplyScalar(1.6) }));
  tether.frustumCulled = false;
  scene.add(tether);
  arrow = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 8), MAT.glowLav); shaft.rotation.z = -Math.PI / 2; shaft.position.x = 1.3;
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 16), MAT.glowLav); head.rotation.z = -Math.PI / 2; head.position.x = 2.55;
  arrow.add(shaft, head); scene.add(arrow);
  built = true;
}

function updateTether() {
  const a = new THREE.Vector3(); hatch.getWorldPosition(a);
  const b = hero.position.clone().add(new THREE.Vector3(0, 0.85, -0.2));
  const mid = a.clone().lerp(b, 0.5); mid.y -= 0.6 * Math.max(0.2, 1 - a.distanceTo(b) / 12);
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  const pos = tether.geometry.attributes.position;
  for (let i = 0; i <= 32; i++) { const p = curve.getPoint(i / 32); pos.setXYZ(i, p.x, p.y, p.z); }
  pos.needsUpdate = true;
}

function setHint(text) { ui.hint && (ui.hint.innerHTML = text); }

export default {
  scene, camera, bloom: 0.7,
  async enter() {
    if (!built) build();
    if (!state.build) state.build = evaluate({ engine: 'm', fuel: 2, shield: 1, power: 'bat', cable: 'long' }, 1);
    tries = state.build.tries; satOk = false; held = false; phase = 'intro';
    hero.position.copy(START); hero.rotation.set(0, 1.2, 0); arrow.visible = false;
    camera.position.set(-0.5, 2.2, 13); camera.lookAt(0.4, 0.2, 0);
    photoPromise = epicPhoto(); // start loading the real photo now
    this._fallback = null;
    requestAnimationFrame(() => {   // backup picture, taken once while the screen is still black
      const earthCam = new THREE.PerspectiveCamera(36, 1, 0.1, 1000);
      earthCam.position.copy(earth.position).add(new THREE.Vector3(30, 50, 140)); earthCam.lookAt(earth.position);
      hero.visible = sat.visible = ship.visible = tether.visible = false;
      this._fallback = snapshot(scene, earthCam, 384);
      hero.visible = sat.visible = ship.visible = tether.visible = true;
    });
    ui.hud = html('<div class="hud"><div class="tries"></div></div>');
    ui.hint = html('<div class="hint"></div>');
    this.updateTries();
    await wait(600);
    await caption(t('cap_eva'), 3400);
    await say(t('h_eva'), t('who_him'));
    this.aim();
  },
  updateTries() { ui.hud.querySelector('.tries').textContent = t('tries', { n: tries }); },
  aim() {
    phase = 'aim'; arrow.visible = true;
    setHint(t('hint_dir'));
    const onAct = () => {
      if (phase === 'aim') { phase = 'power'; sfx('click'); this.showPower(); setHint(t('hint_pow')); }
      else if (phase === 'power') { phase = 'fly'; sfx('whoosh'); ui.power.remove(); this.jump(); }
    };
    this._act = onAct;
    this._click = (e) => { if (e.target.id === 'c' || e.target.closest?.('.hint')) onAct(); };
    this._key = (e) => { if (e.code === 'Space') { e.preventDefault(); onAct(); } };
    addEventListener('pointerdown', this._click); addEventListener('keydown', this._key);
  },
  showPower() {
    ui.power = html(`<div style="position:absolute;left:50%;bottom:11vh;transform:translateX(-50%);width:min(340px,80vw)">
      <div style="height:16px;border-radius:9px;background:linear-gradient(90deg,#5b4a8a 0%,#5b4a8a 30%,#3fbf98 30%,#3fbf98 82%,#ff7a6b 82%);position:relative;box-shadow:0 0 0 1px rgba(255,255,255,.3) inset">
      <div class="needle" style="position:absolute;top:-6px;width:4px;height:28px;background:#fff;border-radius:2px;left:0"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--dim);margin-top:4px"><span>${t('pow_low')}</span><span>${t('pow_ok')}</span><span>${t('pow_high')}</span></div></div>`);
  },
  jump() {
    arrow.visible = false;
    const dir = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
    heroVel.copy(dir).multiplyScalar(2 + power * 6);
    hero.rotation.z = angle - 0.2;
  },
  async resolveJump(result) {
    phase = 'busy'; setHint('');
    if (result === 'hit') {
      sfx('chime'); heroVel.set(0, 0, 0); held = true;
      removeEventListener('pointerdown', this._click); removeEventListener('keydown', this._key);
      setHint('');
      await say(t('got_it'), t('who_him'));
      return this.repair();
    }
    tries--; this.updateTries();
    // the tether pulls him back while he talks, so he never stays off-screen
    heroVel.set(0, 0, 0);
    const back = tween(hero.position, { x: START.x, y: START.y, z: START.z }, 1800, easeInOut);
    if (result === 'bounce') { sfx('hit'); await say(t('bounce'), t('who_him')); }
    else { await say(t(power < 0.3 ? 'weak' : 'miss'), t('who_him')); }
    await back;
    if (tries <= 0) {
      setHint('');
      const el = html(`<div class="end"><div class="title" style="opacity:1;animation:none;font-size:38px">${t('no_tries')}</div>
        <div style="color:var(--dim);max-width:520px">${t('no_tries_text')}</div>
        <div style="display:flex;gap:10px"><button class="btn b1">${t('retry')}</button><button class="btn ghost b2">${t('back_hangar')}</button></div></div>`);
      el.querySelector('.b1').onclick = () => { el.remove(); tries = state.build.tries; this.updateTries(); phase = 'aim'; arrow.visible = true; setHint(t('hint_dir')); };
      el.querySelector('.b2').onclick = async () => { removeEventListener('pointerdown', this._click); removeEventListener('keydown', this._key); go((await import('./hangar.js')).default); };
      return;
    }
    phase = 'aim'; arrow.visible = true; setHint(t('hint_dir'));
  },
  async repair() {
    await tween(camera.position, { x: 3.2, y: 1.6, z: 6.5 }, 1800, easeInOut);
    await new Promise((res) => hotspot(t('hs_repair'), sat, camera, res));
    sfx('click'); await wait(300); sfx('click'); await wait(300); sfx('chime');
    satOk = true;
    await caption(t('cap_cam'), 1700);
    // the satellite turns its camera toward Earth
    await tween(sat.rotation, { x: 1.2, y: -0.3 }, 1500, easeInOut);
    const fallback = this._fallback;
    sfx('shutter');
    await wait(400);
    const photo = await photoPromise;
    await showPhoto(photo, fallback, t('sat_photo'));
    state.photos.push({ ...(photo || { url: fallback, label: t('sat_photo') }), fallback });
    await say(t('h_sat1'), t('who_him'));
    await say(t('h_sat2'), t('who_him'));
    state.mission = 2;
    go((await import('./hangar.js')).default, { fadeOut: 1500 });
  },
  update(dt, t) {
    stars.userData.update(t); earth.userData.update(t);
    sat.position.y = 0.5 + Math.sin(t * 0.5) * 0.9;
    sat.rotation.z = Math.sin(t * 0.3) * 0.1;
    sat.userData.update(t, satOk);
    if (phase === 'aim') {
      // aim from the astronaut toward the satellite region, sweeping up and down
      const base = Math.atan2(sat.position.y - hero.position.y, sat.position.x - hero.position.x);
      angle = base * 0 + Math.sin(t * 1.3) * 0.42;
      arrow.position.copy(hero.position).add(new THREE.Vector3(0, 0.9, 0));
      arrow.rotation.z = angle;
    }
    if (phase === 'power' && ui.power) {
      power = (Math.sin(t * 2.4) + 1) / 2;
      ui.power.querySelector('.needle').style.left = `calc(${power * 100}% - 2px)`;
    }
    if (phase === 'fly') {
      hero.position.addScaledVector(heroVel, dt);
      const center = sat.position.clone();
      const d = hero.position.clone().add(new THREE.Vector3(0, 0.8, 0)).distanceTo(center);
      if (d < 1.6) { this.resolveJump(power > 0.82 ? 'bounce' : 'hit'); }
      else if (hero.position.distanceTo(START) > CABLE[state.build.p?.cable?.id || 'long'] * (power < 0.3 ? 0.45 : 1)) this.resolveJump('miss');
    }
    if (phase !== 'fly') hero.position.y += Math.sin(t * 1.1) * 0.002;
    if (held) {
      // hold on to the satellite
      hero.position.lerp(sat.position.clone().add(new THREE.Vector3(-1.1, -0.9, 0.6)), 0.08);
    }
    hero.userData.arms.forEach((a, i) => a && (a.rotation.x = Math.sin(t * 1.2 + i * 3) * 0.4));
    hero.userData.head.rotation.y = Math.sin(t * 0.5) * 0.25;
    updateTether();
  },
  exit() {
    removeEventListener('pointerdown', this._click); removeEventListener('keydown', this._key);
  },
};
