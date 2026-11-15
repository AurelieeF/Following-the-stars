import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { go, say, caption, html, tween, wait, easeInOut } from '../engine.js';
import { cloneChar, idle, makeShip, glowSprite, MAT } from '../models.js';
import { sfx } from '../audio.js';
import { state } from '../state.js';
import { PARTS, MISSIONS, evaluate } from '../missions.js';
import { t, getLang } from '../text.js';

const num = (v) => v.toLocaleString(getLang() === 'fr' ? 'fr-CA' : 'en-US'); // 11,5 in French

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
let built = false, ship, hero, shipRig, power = 0, shake = 0, panel;
const cam = { x: 0, y: 0, z: 0 };

function build() {
  scene.background = new THREE.Color(0x07060e);
  scene.fog = new THREE.Fog(0x07060e, 14, 40);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x1b1824, roughness: 0.35, metalness: 0.4 }));
  floor.receiveShadow = true; scene.add(floor);
  // launch pad
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.25, 48), new THREE.MeshStandardMaterial({ color: 0x2c2838, roughness: 0.5, metalness: 0.5 }));
  pad.position.set(0, 0.12, 0); pad.receiveShadow = true; scene.add(pad);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.04, 8, 96).rotateX(Math.PI / 2), MAT.glowLav);
  ring.position.y = 0.26; scene.add(ring);
  // back wall with light strips (hangar)
  for (let i = 0; i < 9; i++) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 6, 0.08), MAT.glowWarm);
    strip.position.set(-12 + i * 3, 4, -10); scene.add(strip);
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.4, 12, 0.6), new THREE.MeshStandardMaterial({ color: 0x24202e }));
    rib.position.set(-12 + i * 3 + 1.5, 6, -10.2); scene.add(rib);
  }
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 20), new THREE.MeshStandardMaterial({ color: 0x15121d }));
  wall.position.set(0, 10, -10.5); scene.add(wall);
  // open roof: a slit of stars
  const slit = new THREE.Mesh(new THREE.PlaneGeometry(6, 40).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x141a3c }));
  slit.position.y = 16; scene.add(slit);
  // console
  const cons = new THREE.Group(); cons.position.set(-4.3, 0, 2); cons.rotation.y = 0.6; scene.add(cons);
  const desk = new THREE.Mesh(new RoundedBoxGeometry(2.2, 1.0, 0.9, 3, 0.08), new THREE.MeshStandardMaterial({ color: 0x2c2838, roughness: 0.5 }));
  desk.position.y = 0.5; desk.castShadow = true; cons.add(desk);
  for (let i = 0; i < 3; i++) {
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.42), new THREE.MeshBasicMaterial({ color: new THREE.Color([0x7fd8ff, 0xb9a3ff, 0x7fffd0][i]).multiplyScalar(0.9) }));
    scr.position.set(-0.7 + i * 0.7, 1.35, -0.2); scr.rotation.x = -0.25; cons.add(scr);
  }
  // ship standing on the pad
  shipRig = new THREE.Group(); scene.add(shipRig);
  ship = makeShip(); ship.rotation.x = -Math.PI / 2; ship.position.y = 3.35; shipRig.add(ship);
  const glow = glowSprite(0xa9c8ff, 3); glow.position.y = 0.4; glow.material.opacity = 0; shipRig.add(glow);
  shipRig.userData.glow = glow;
  hero = cloneChar(state.astronaut); hero.position.set(-3.0, 0, 2.6); hero.rotation.y = 0.9; scene.add(hero);
  // lights
  const key = new THREE.SpotLight(0xffe4c8, 120, 30, 0.5, 0.5, 1.5); key.position.set(4, 12, 6); key.target.position.set(0, 2, 0);
  key.castShadow = true; scene.add(key, key.target);
  const rim = new THREE.SpotLight(0x9c88ff, 80, 30, 0.6, 0.6, 1.5); rim.position.set(-6, 8, -6); rim.target.position.set(0, 3, 0); scene.add(rim, rim.target);
  scene.add(new THREE.AmbientLight(0x2c2640, 1.2));
  built = true;
}

const CAM_HOME = { x: -1.6, y: 3.2, z: 10.5 };

export default {
  scene, camera, bloom: 0.6,
  async enter() {
    if (!built) build();
    shipRig.position.set(0, 0, 0); shipRig.rotation.set(0, 0, 0); power = 0; shake = 0;
    hero.visible = true;
    Object.assign(cam, CAM_HOME);
    const m = MISSIONS[state.mission];
    if (!state.choice) state.choice = { engine: 's', fuel: 1, shield: 0, power: 'sun', cable: 'short' };
    if (!state.seenHangar) {
      state.seenHangar = true;
      await wait(500);
      await caption(t('cap_hangar'), 3000);
      await say(t('h_hangar'), t('who_him'));
    }
    this.showPanel(m);
  },
  showPanel(m) {
    panel = html(`<div class="panel">
      <h2>${t(m.title)}</h2><div class="sub">${t(m.goal)}</div>
      <div class="bar"><label><span>${t('budget')}</span><span class="v-cost"></span></label><div class="track"><div class="fill f-cost"></div></div></div>
      <div class="bar"><label><span>${t('mass')}</span><span class="v-mass"></span></label><div class="track"><div class="fill f-mass"></div></div></div>
      <div class="bar"><label><span>${t('range')}</span><span class="v-range"></span></label><div class="track"><div class="fill f-range"></div></div></div>
      <div class="opts"></div>
      <button class="btn">${t('launch')}</button>
      <div class="msg"></div>
    </div>`);
    const opts = panel.querySelector('.opts');
    for (const [key, part] of Object.entries(PARTS)) {
      const row = document.createElement('div'); row.className = 'opt';
      row.innerHTML = `<div class="name">${t(part.name)}</div><div class="row"></div>`;
      for (const o of part.opts) {
        const c = document.createElement('button'); c.className = 'chip';
        c.innerHTML = `${t(o.label)}<small>${o.cost} k$ · ${num(o.mass)} t</small>`;
        c.onclick = () => { state.choice[key] = o.id; sfx('click'); refresh(); };
        c.dataset.key = key; c.dataset.id = o.id;
        row.lastChild.appendChild(c);
      }
      opts.appendChild(row);
    }
    const refresh = () => {
      const e = evaluate(state.choice, state.mission);
      panel.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', String(state.choice[c.dataset.key]) === c.dataset.id));
      const set = (k, val, max, txt, bad) => {
        panel.querySelector('.f-' + k).style.width = Math.min(100, (val / max) * 100) + '%';
        panel.querySelector('.f-' + k).style.background = bad ? '#ff7a6b' : k === 'range' ? '#8ff3ff' : '#b9a3e8';
        panel.querySelector('.v-' + k).textContent = txt;
      };
      set('cost', e.cost, m.budget, `${e.cost} / ${m.budget} k$`, e.overBudget);
      set('mass', e.mass, e.lift, `${num(e.mass)} t / ${e.lift} t`, e.tooHeavy);
      set('range', e.p.fuel.range, 3, e.shortRange ? t('range_short') : t('range_ok'), e.shortRange);
      panel.querySelector('.msg').textContent = e.overBudget ? t('over_budget') : '';
      return e;
    };
    refresh();
    panel.querySelector('.btn').onclick = () => {
      const e = refresh();
      if (e.overBudget) { panel.querySelector('.msg').textContent = t('over_budget'); sfx('alarm'); return; }
      panel.remove();
      this.launch(e);
    };
  },
  async launch(e) {
    sfx('launch'); hero.visible = false;
    await tween(cam, { x: 4, y: 2, z: 13 }, 1200, easeInOut);
    if (e.tooHeavy) {
      // engine can't lift it: it shudders, rises a little, settles back
      power = 0.6; shake = 0.15;
      await tween(shipRig.position, { y: 0.8 }, 1600, easeInOut);
      power = 0.15; shake = 0.05;
      await tween(shipRig.position, { y: 0 }, 1200, easeInOut);
      power = 0; shake = 0; hero.visible = true;
      await say(t('too_heavy', { mass: num(e.mass), lift: e.lift }), t('who_pc'));
      Object.assign(cam, CAM_HOME);
      return this.showPanel(MISSIONS[state.mission]);
    }
    power = 1; shake = 0.12;
    if (e.shortRange) {
      await tween(shipRig.position, { y: 14 }, 3200, (x) => x * x);
      power = 0; shake = 0;
      await say(t('short_range'), t('who_pc'));
      shipRig.position.y = 0; hero.visible = true;
      Object.assign(cam, CAM_HOME);
      return this.showPanel(MISSIONS[state.mission]);
    }
    state.build = e;
    const p = tween(shipRig.position, { y: 40 }, 4200, (x) => x * x * x);
    await wait(2600);
    const { default: next } = await import('./flight.js');
    go(next, { fadeOut: 1400 });
    await p;
  },
  update(dt, t) {
    idle(hero, t);
    ship.userData.update(t, power);
    shipRig.userData.glow.material.opacity = power * 0.9;
    camera.position.set(cam.x + (Math.random() - 0.5) * shake, cam.y + (Math.random() - 0.5) * shake, cam.z);
    camera.lookAt(0.6, 2.6 + shipRig.position.y * 0.6, 0);
  },
  exit() { panel?.remove(); },
};
