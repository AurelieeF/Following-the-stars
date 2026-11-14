import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { go, say, caption, hotspot, tween, wait, easeInOut, html } from '../engine.js';
import { cloneChar, idle, makeStars, glowSprite, MAT } from '../models.js';
import { sfx, music } from '../audio.js';
import { state } from '../state.js';
import { t } from '../text.js';

/* A small, warm room on an empty Earth. Reused at the end (mode 'end'). */
export function buildRoom() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0812);
  scene.fog = new THREE.Fog(0x0a0812, 12, 26);
  const m = (geo, color, x, y, z, rough = 0.85) => {
    const o = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: rough }));
    o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; scene.add(o); return o;
  };
  // floor, walls
  m(new THREE.PlaneGeometry(14, 10).rotateX(-Math.PI / 2), 0x4a3a33, 0, 0, 0);
  m(new THREE.PlaneGeometry(14, 6), 0x3b3047, 0, 3, -3.5);
  m(new THREE.PlaneGeometry(10, 6).rotateY(Math.PI / 2), 0x342a40, -5.5, 3, 1);
  // rug
  m(new THREE.CircleGeometry(1.8, 48).rotateX(-Math.PI / 2), 0x6d5d82, 0.4, 0.01, 0.6, 1);
  // window with night sky
  const win = new THREE.Group(); win.position.set(2.6, 2.6, -3.48); scene.add(win);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.2), new THREE.MeshBasicMaterial({ color: 0x0b1030 }));
  win.add(sky);
  const starsGeo = new THREE.BufferGeometry();
  const sp = []; for (let i = 0; i < 90; i++) sp.push((Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 2.1, 0.01);
  starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  win.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xe9e2ff, size: 0.035 })));
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2233, roughness: 0.6 });
  for (const [w, h, x, y] of [[2.8, 0.1, 0, 1.15], [2.8, 0.1, 0, -1.15], [0.1, 2.4, 1.35, 0], [0.1, 2.4, -1.35, 0], [0.06, 2.3, 0, 0], [2.7, 0.06, 0, 0]]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), frameMat); f.position.set(x, y, 0.05); win.add(f);
  }
  // curtain
  m(new RoundedBoxGeometry(0.5, 2.8, 0.08, 2, 0.03), 0x5a4a6e, 4.2, 2.5, -3.35);
  // moonlight through window
  const moonL = new THREE.SpotLight(0x8f9cff, 18, 14, 0.5, 0.6, 1.4);
  moonL.position.set(2.6, 3.4, -4.5); moonL.target.position.set(0.5, 0, 1.5); moonL.castShadow = true;
  scene.add(moonL, moonL.target);

  // shelf with books + mom's photo frame
  m(new THREE.BoxGeometry(2.2, 0.08, 0.5), 0x5b4636, -2.6, 2.2, -3.2);
  const bookCols = [0x7e6aa8, 0xc9b28a, 0x58708f, 0x9a5c6a, 0xd8d0c4];
  for (let i = 0; i < 7; i++) m(new THREE.BoxGeometry(0.14, 0.4 + (i % 3) * 0.07, 0.34), bookCols[i % 5], -3.5 + i * 0.17, 2.45 + (i % 3) * 0.035, -3.2, 0.9);
  const frame = new THREE.Group(); frame.position.set(-2.0, 2.52, -3.15); frame.rotation.y = 0.15; scene.add(frame);
  frame.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.04), new THREE.MeshStandardMaterial({ color: 0xd8c39a, metalness: 0.6, roughness: 0.4 })));
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.48), new THREE.MeshStandardMaterial({ map: momPhotoTexture(), roughness: 0.6 }));
  pic.position.z = 0.025; frame.add(pic);

  // star lamp
  const lamp = new THREE.Group(); lamp.position.set(-3.7, 0, -1.6); scene.add(lamp);
  lamp.add(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.9, 24), new THREE.MeshStandardMaterial({ color: 0x3d3346 })));
  lamp.children[0].position.y = 0.45;
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffc47a).multiplyScalar(1.8) }));
  globe.position.y = 1.3; lamp.add(globe);
  const warm = new THREE.PointLight(0xffa860, 14, 10, 1.6); warm.position.y = 1.4; warm.castShadow = true; lamp.add(warm);
  const halo = glowSprite(0xffb070, 2.6); halo.position.y = 1.3; halo.material.opacity = 0.5; lamp.add(halo);
  // plant
  const pot = m(new THREE.CylinderGeometry(0.28, 0.22, 0.45, 20), 0x8a6d5c, 4.6, 0.22, -2.6);
  for (let i = 0; i < 7; i++) {
    const leaf = m(new THREE.SphereGeometry(0.25, 12, 8).scale(0.6, 1.4, 0.3), 0x4e7a52, 4.6 + Math.cos(i) * 0.18, 0.75 + (i % 3) * 0.2, -2.6 + Math.sin(i) * 0.18);
    leaf.rotation.z = Math.cos(i * 2) * 0.6;
  }
  // table, two cups, two chairs (one will stay empty)
  m(new THREE.CylinderGeometry(0.75, 0.75, 0.06, 32), 0x5b4636, 1.2, 0.85, -1.2);
  m(new THREE.CylinderGeometry(0.07, 0.1, 0.85, 12), 0x3e2f25, 1.2, 0.42, -1.2);
  for (const x of [0.95, 1.4]) m(new THREE.CylinderGeometry(0.09, 0.08, 0.17, 16), 0xe8e2da, x, 0.96, -1.15, 0.4);
  const chair = new THREE.Group(); chair.position.set(2.5, 0, -1.4); chair.rotation.y = -0.6; scene.add(chair);
  const wood = new THREE.MeshStandardMaterial({ color: 0x4a362a, roughness: 0.8 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.07, 0.7), wood); seat.position.y = 0.6; chair.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.07), wood); back.position.set(0, 1.02, -0.32); chair.add(back);
  for (const [x, z] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.06), wood); l.position.set(x, 0.3, z); chair.add(l); }
  chair.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  scene.add(new THREE.AmbientLight(0x3a3058, 0.9));
  const hemi = new THREE.HemisphereLight(0x6f62a0, 0x2a1d18, 0.5); scene.add(hemi);
  return { scene, frame, chair, lamp, globe, win };
}

function momPhotoTexture() {
  const cv = document.createElement('canvas'); cv.width = 160; cv.height = 200;
  const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, '#2c2a4a'); g.addColorStop(1, '#7d6a8e');
  c.fillStyle = g; c.fillRect(0, 0, 160, 200);
  // a big astronaut (mom) and a little one, both waving
  const fig = (x, y, s) => {
    c.fillStyle = '#ece6dc'; c.beginPath(); c.arc(x, y, 26 * s, 0, 7); c.fill();
    c.fillStyle = '#121218'; c.beginPath(); c.arc(x - 2 * s, y, 20 * s, 0, 7); c.fill();
    c.fillStyle = '#ece6dc'; c.beginPath(); c.roundRect(x - 22 * s, y + 22 * s, 44 * s, 56 * s, 16 * s); c.fill();
  };
  fig(98, 70, 1.1); fig(52, 112, 0.65);
  c.fillStyle = 'rgba(255,220,170,.18)'; c.fillRect(0, 0, 160, 200);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
let room, hero, robot, phase = 'idle';

export default {
  camera, bloom: 0.45,
  get scene() { return room.scene; },
  async enter() {
    room = buildRoom();
    hero = cloneChar(state.astronaut); hero.position.set(-0.7, 0, 0.6); hero.rotation.y = 1.05; room.scene.add(hero);
    robot = cloneChar(state.robot); robot.position.set(1.0, 0, 0.9); robot.rotation.y = -0.9; room.scene.add(robot);
    camera.position.set(0.6, 2.3, 6.6); camera.lookAt(0.2, 1.3, 0);
    phase = 'idle';
    this.story();
  },
  async story() {
    await wait(800);
    await caption(t('cap_home'), 3600);
    await say(t('robot_beep'), t('who_robot'));
    await say(t('h_dream'), t('who_him'));
    // optional clue: the photo on the shelf
    let looked = false;
    const spot = hotspot(t('hs_photo'), room.frame, camera, async () => {
      looked = true; sfx('click');
      await tween(camera.position, { x: -1.4, y: 2.5, z: 0.6 }, 1600, easeInOut);
      camera.lookAt(-2.0, 2.5, -3.15);
      await say(t('h_photo'), t('who_him'));
      await tween(camera.position, { x: 0.6, y: 2.3, z: 6.6 }, 1600, easeInOut);
      leave();
    });
    const go2 = html(`<div class="hint">${t('hint_photo')}</div>`);
    const skip = setTimeout(() => { if (!looked) { spot.remove(); leave(); } }, 9000);
    const leave = async () => {
      clearTimeout(skip); go2.remove(); spot.remove();
      camera.lookAt(0.2, 1.3, 0);
      await say(t('h_leave1'), t('who_him'));
      await say(t('h_leave2'), t('who_him'));
      await say(t('robot_ok'), t('who_robot'));
      phase = 'leaving'; sfx('whoosh');
      await tween(hero.rotation, { y: -1.6 }, 900, easeInOut);
      await tween(hero.position, { x: -4.6 }, 2600, easeInOut);
      const { default: next } = await import('./hangar.js');
      go(next);
    };
  },
  update(dt, t) {
    idle(hero, t);
    idle(robot, t + 1.3);
    if (phase === 'leaving') {
      // robot waves goodbye
      robot.userData.arms[1].rotation.z = -1.9 + Math.sin(t * 8) * 0.35;
      hero.userData.body.position.y = Math.abs(Math.sin(t * 7)) * 0.05;
    }
    room.globe.material.color.setScalar(1).multiply(new THREE.Color(0xffc47a)).multiplyScalar(1.7 + Math.sin(t * 1.3) * 0.15);
  },
};
