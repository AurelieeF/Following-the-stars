import * as THREE from 'three';
import { go, say, caption, html, tween, wait, easeInOut, showPhoto } from '../engine.js';
import { cloneChar, idle, MAT, glowSprite } from '../models.js';
import { sfx, music, stopMusic } from '../audio.js';
import { state } from '../state.js';
import { buildRoom } from './home.js';
import { epicPhoto } from '../nasa.js';
import { t } from '../text.js';
import { reportCard } from '../report.js';
import { arcadeButtons, wireArcade } from '../arcade.js';

const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
let room, robot, photo, tears = [], phase = 'sit', look = null;

function photoOfUsTexture() {
  // polaroid: the human and the robot, side by side
  const cv = document.createElement('canvas'); cv.width = 200; cv.height = 240;
  const c = cv.getContext('2d');
  c.fillStyle = '#f2ede4'; c.fillRect(0, 0, 200, 240);
  const g = c.createLinearGradient(0, 0, 0, 180); g.addColorStop(0, '#3a3050'); g.addColorStop(1, '#8a6e7e');
  c.fillStyle = g; c.fillRect(12, 12, 176, 176);
  c.fillStyle = 'rgba(255,200,130,.5)'; c.beginPath(); c.arc(40, 50, 16, 0, 7); c.fill();
  // human
  c.fillStyle = '#ece6dc'; c.beginPath(); c.arc(128, 92, 34, 0, 7); c.fill();
  c.fillStyle = '#111'; c.beginPath(); c.arc(124, 92, 27, 0, 7); c.fill();
  c.fillStyle = '#ece6dc'; c.beginPath(); c.roundRect(98, 122, 60, 70, 20); c.fill();
  // robot
  c.fillStyle = '#ece6dc'; c.beginPath(); c.ellipse(68, 128, 30, 26, 0, 0, 7); c.fill();
  c.fillStyle = '#111'; c.beginPath(); c.ellipse(68, 130, 22, 16, 0, 0, 7); c.fill();
  c.strokeStyle = '#ffd29a'; c.lineWidth = 3;
  for (const x of [60, 76]) { c.beginPath(); c.arc(x, 132, 5, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
  c.fillStyle = '#ece6dc'; c.beginPath(); c.roundRect(48, 152, 40, 36, 12); c.fill();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export default {
  camera, bloom: 0.55,
  get scene() { return room.scene; },
  async enter() {
    room = buildRoom();
    room.scene.background = new THREE.Color(0x06050c);
    robot = cloneChar(state.robot);
    robot.position.set(0.5, 0, 1.2); robot.rotation.y = -0.2; room.scene.add(robot);
    // he is holding the photo of the two of them
    photo = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), new THREE.MeshStandardMaterial({ map: photoOfUsTexture(), roughness: 0.7, side: THREE.DoubleSide }));
    photo.position.set(0, 0.95, 0.62); photo.rotation.x = -0.5; robot.add(photo);
    robot.userData.eyes.forEach((e) => { e.scale.set(1.6, 0.35, 1); }); // closed, happy-sad eyes
    tears = [];
    for (let i = 0; i < 2; i++) {
      const tear = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8).scale(1, 1.6, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x9ff6ff).multiplyScalar(1.6), transparent: true }));
      room.scene.add(tear); tears.push({ m: tear, t: Math.random(), side: i ? 1 : -1 });
    }
    const soft = new THREE.PointLight(0xc8b8ff, 5, 7, 1.5); soft.position.set(1.6, 2.4, 3.2); room.scene.add(soft);
    camera.position.set(1.1, 1.9, 5.6); look = { x: 0.5, y: 0.9, z: 1.0 }; camera.lookAt(look.x, look.y, look.z);
    phase = 'credits';
    this.story();
  },
  async story() {
    // 1) credits on black (the fade layer stays black underneath)
    const fade = document.getElementById('fade');
    fade.style.transitionDuration = '10ms'; fade.style.opacity = 1;
    music('end');
    const cr = html(`<div class="credits" style="z-index:3"><div class="roll">
      <p class="big">${t('title')}</p>
      <div><h3>${t('cr_game')}</h3><p>${t('cr_by')}</p></div>
      <div><h3>${t('cr_story')}</h3><p>Lily</p></div>
      <div><p style="font-size:18px">${t('cr_challenge')}</p></div>
      <div><h3>${t('cr_data')}</h3><p style="font-size:18px">${t('cr_data_list')}</p></div>
      <div><h3>${t('cr_tools')}</h3><p style="font-size:18px">${t('cr_tools_list')}</p></div>
      <div><p style="font-style:italic">${t('cr_thanks')}</p></div>
    </div></div>`);
    document.body.appendChild(cr); // above the fade layer
    await wait(26500);
    cr.style.transition = 'opacity 1.2s'; cr.style.opacity = 0; await wait(1300); cr.remove();
    // 2) after the credits: the robot, alone, with the photo
    phase = 'sit';
    fade.style.transitionDuration = '2500ms'; fade.style.opacity = 0;
    await caption(t('cap_after'), 3500);
    await wait(5500);
    sfx('sob');
    await wait(5000);
    // he turns to the window and looks up at the stars; both stay in frame
    phase = 'look';
    tween(look, { x: 0.6, y: 1.4, z: -1.5 }, 4500, easeInOut);
    await tween(camera.position, { x: 2.6, y: 1.2, z: 5.6 }, 4500, easeInOut);
    await wait(1800);
    // a shooting star crosses the window, as if she answered; the robot opens its eyes and stops crying
    await this.shootingStar();
    tears.forEach((tr) => (tr.m.visible = false));
    robot.userData.eyes.forEach((e) => tween(e.scale, { x: 1, y: 1 }, 700, easeInOut));
    await tween(robot.position, { y: 0.18 }, 260, easeInOut); await tween(robot.position, { y: 0 }, 320, easeInOut);   // a little hop of joy
    await wait(2000);
    stopMusic(4);
    fade.style.transitionDuration = '3000ms'; fade.style.opacity = 1;
    await wait(3200);
    this.endScreen();
    fade.style.opacity = 0;
  },
  shootingStar() {
    // drawn on the window's sky, top-left to bottom-right, with a fading tail
    const star = new THREE.Group(); star.position.set(-1.35, 0.95, 0.04); star.rotation.z = -0.38;
    const glow = new THREE.Color(0xfff2dd).multiplyScalar(3);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshBasicMaterial({ color: glow }));
    const tail = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.022), new THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: 0.75 }));
    tail.position.x = -0.45;
    const halo = glowSprite(0xfff2dd, 0.45);
    star.add(tail, head, halo); room.win.add(star);
    sfx('chime');
    return tween(star.position, { x: 1.35, y: -0.1 }, 1400, (x) => x).then(() => room.win.remove(star));
  },
  endScreen() {
    const card = state.build ? reportCard(2) : '';   // score of the Moon mission (+ total with mission 1)
    const total = Object.values(state.scores || {}).reduce((s, v) => s + v, 0);
    const el = html(`<div class="end report-wrap" style="background:#05040c;justify-content:flex-start">
      <div class="title" style="opacity:1;animation:rise 2s ease both;font-size:clamp(28px,4.5vw,48px);margin-top:4vh">${t('title')}</div>
      ${card}${state.scores?.[1] ? `<div style="font-weight:800">${t('rep_total')} ${total} / 200</div>` : ''}
      <div style="max-width:560px;width:100%;background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:18px">
        <div style="font-weight:800;margin-bottom:8px">${t('end_q')}</div>
        <div style="color:var(--dim);font-size:13px;margin-bottom:10px">${t('end_q_sub')}</div>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          <input type="date" min="2015-07-01" style="font:600 15px Nunito,sans-serif;padding:9px 12px;border-radius:12px;border:1px solid var(--line);background:#120e22;color:var(--ink)">
          <button class="btn b-date">${t('end_btn')}</button></div>
        <div class="msg"></div>
      </div>
      ${arcadeButtons()}
      <button class="btn ghost b-replay">${t('replay')}</button></div>`);
    wireArcade(el);
    const input = el.querySelector('input');
    input.max = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);
    el.querySelector('.b-date').onclick = async () => {
      const msg = el.querySelector('.msg');
      if (!input.value) { msg.textContent = t('end_pick'); return; }
      msg.textContent = t('end_loading');
      const p = await epicPhoto(input.value);
      msg.textContent = p ? '' : t('end_none');
      if (p) { sfx('shutter'); await showPhoto(p); }
    };
    el.querySelector('.b-replay').onclick = () => location.reload();
  },
  update(dt, tt) {
    idle(robot, tt * 0.6);
    const u = robot.userData;
    if (phase === 'sit' || phase === 'credits') { u.head.rotation.x = 0.35 + Math.sin(tt * 6) * 0.02; u.arms.forEach((a) => a && (a.rotation.x = -1.1)); }
    if (phase === 'look') {
      // window is at (2.6, 2.6, -3.5): turn toward it, head tilted up
      u.head.rotation.x += (-0.4 - u.head.rotation.x) * 0.03; u.head.rotation.y *= 0.95;
      robot.rotation.y += (2.6 - robot.rotation.y) * 0.02;
      u.arms.forEach((a) => a && (a.rotation.x += (-0.5 - a.rotation.x) * 0.03));
    }
    camera.lookAt(look.x, look.y, look.z);
    for (const tr of tears) {
      tr.t += dt * 0.8; if (tr.t > 1) tr.t = 0;
      const eye = new THREE.Vector3(tr.side * 0.24, -0.08, 0.8); u.head.updateWorldMatrix(true, false); u.head.localToWorld(eye);
      tr.m.position.copy(eye).add(new THREE.Vector3(0, -tr.t * 0.28, 0));
      tr.m.material.opacity = 1 - tr.t;
    }
    room.globe.material.color.set(0xffc47a).multiplyScalar(1.5 + Math.sin(tt) * 0.1);
  },
  exit() { document.querySelector('.credits')?.remove(); },
};
