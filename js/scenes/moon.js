import * as THREE from 'three';
import { go, say, caption, html, hotspot, tween, wait, easeInOut, snapshot, showPhoto } from '../engine.js';
import { cloneChar, idle, makeShip, makeStars, makeEarth, makeLunarGround, makeBox, makeLantern, glowSprite, MAT } from '../models.js';
import { sfx, music, stopMusic } from '../audio.js';
import { state } from '../state.js';
import { libraryPhoto } from '../nasa.js';
import { t } from '../text.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
let built = false, stars, earth, ground, ship, hero, box, lantern, polaroids = [], constellation;
let phase = 'land', keys = {}, target = null, walkT = 0, shipPower = 0, crying = 0, sitting = false;
const SPOT = new THREE.Vector3(5, 0, -7);    // where he photographs the Earth
const SEAT = new THREE.Vector3(1.5, 0, 3);   // where he sits at the end

function build() {
  scene.background = new THREE.Color(0x020106);
  stars = makeStars(6000, 600); scene.add(stars);
  earth = makeEarth(7); earth.position.set(-26, 26, -95); earth.rotation.set(0.3, 0, 0.2); scene.add(earth);
  const eh = glowSprite(0x7fb2ff, 26); eh.position.copy(earth.position); eh.material.opacity = 0.18; scene.add(eh);
  ground = makeLunarGround(260); scene.add(ground);
  const sun = new THREE.DirectionalLight(0xfff3e6, 3.2); sun.position.set(30, 14, 10); sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, far: 120 }); sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0x7a86c8, 0x1a1820, 0.55));
  ship = makeShip(); ship.rotation.x = -Math.PI / 2; ship.scale.setScalar(0.9); scene.add(ship);
  hero = cloneChar(state.astronaut); scene.add(hero);
  // the place he will sit: a rock, a lantern, the box
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9, 1).scale(1.4, 0.55, 1), new THREE.MeshStandardMaterial({ color: 0x8b8682, roughness: 1, flatShading: true }));
  rock.position.copy(SEAT).add(new THREE.Vector3(0, ground.userData.heightAt(SEAT.x, SEAT.z) + 0.2, 0)); rock.castShadow = rock.receiveShadow = true; scene.add(rock);
  box = makeBox(); box.position.set(SEAT.x + 1.5, ground.userData.heightAt(SEAT.x + 1.5, SEAT.z + 0.3) + 0.02, SEAT.z + 0.3); box.rotation.y = -0.4; box.visible = false; scene.add(box);
  lantern = makeLantern(); lantern.position.set(SEAT.x - 1.3, ground.userData.heightAt(SEAT.x - 1.3, SEAT.z + 0.5), SEAT.z + 0.5); lantern.visible = false; scene.add(lantern);
  addEventListener('keydown', (e) => (keys[e.code] = true));
  addEventListener('keyup', (e) => (keys[e.code] = false));
  built = true;
}

const groundY = (x, z) => ground.userData.heightAt(x, z);

export default {
  scene, camera, bloom: 0.75,
  async enter() {
    if (!built) build();
    phase = 'land'; sitting = false; crying = 0; hero.visible = false; this._lookingUp = false; this._lookY = null;
    ship.position.set(-3, 30, -2); shipPower = 1;
    requestAnimationFrame(() => {   // backup picture of the Earth over the horizon, taken while the screen is black
      const shot = new THREE.PerspectiveCamera(22, 1, 0.1, 2000);
      shot.position.set(SPOT.x, groundY(SPOT.x, SPOT.z) + 1.6, SPOT.z); shot.lookAt(earth.position.clone().add(new THREE.Vector3(0, -10, 0)));
      ship.visible = false; this._fallback = snapshot(scene, shot, 384); ship.visible = true;
    });
    camera.position.set(6, 3.2, 14); camera.lookAt(-3, 4, -2);
    music('calm');
    await wait(500);
    sfx('launch');
    await caption(t('cap_dist'), 2600);
    const y0 = groundY(-3, -2) + 2.9;
    await tween(ship.position, { y: y0 }, 5200, (x) => 1 - Math.pow(1 - x, 2.4));
    shipPower = 0; sfx('hit');
    await wait(700);
    hero.visible = true;
    hero.position.set(-1.6, groundY(-1.6, -0.6), -0.6); hero.rotation.y = 0.4;
    await tween(camera.position, { x: 2, y: 3.4, z: 9 }, 1800, easeInOut);
    await say(t('h_moon1'), t('who_him'));
    await say(t('h_moon2'), t('who_him'));
    this.walk();
  },
  walk() {
    phase = 'walk';
    const marker = new THREE.Object3D(); marker.position.copy(SPOT).setY(groundY(SPOT.x, SPOT.z) + 1.2); scene.add(marker);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.04, 8, 64).rotateX(Math.PI / 2), MAT.glowLav);
    ring.position.copy(SPOT).setY(groundY(SPOT.x, SPOT.z) + 0.08); scene.add(ring); this._ring = ring;
    this._hint = html(`<div class="hint">${t('hint_walk')}</div>`);
    this._click = (e) => {
      if (e.target.id !== 'c' || phase !== 'walk') return;
      const ray = new THREE.Raycaster(); const m = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
      ray.setFromCamera(m, camera); const hit = ray.intersectObject(ground)[0];
      if (hit) target = hit.point.clone();
    };
    addEventListener('pointerdown', this._click);
  },
  async photo() {
    phase = 'photo'; removeEventListener('pointerdown', this._click); this._hint?.remove(); scene.remove(this._ring);
    const pPromise = libraryPhoto();
    await tween(hero.rotation, { y: Math.atan2(earth.position.x - hero.position.x, earth.position.z - hero.position.z) }, 900, easeInOut);
    const from = camera.position.clone();
    await tween(camera.position, { x: hero.position.x + 2, y: hero.position.y + 2.6, z: hero.position.z + 4 }, 1800, easeInOut);
    const look = new THREE.Vector3(); const lookAt = earth.position.clone();
    this._look = lookAt;
    await wait(800);
    const fallback = this._fallback;
    sfx('shutter');
    const photo = await pPromise;
    await showPhoto(photo, fallback, t('moon_photo'));
    state.photos.push({ ...(photo || { url: fallback, label: t('moon_photo') }), fallback });
    this._look = null;
    await say(t('h_two'), t('who_him'));
    await say(t('h_sit'), t('who_him'));
    this.reveal();
  },
  async reveal() {
    phase = 'reveal';
    stopMusic(3);
    await new Promise((r) => setTimeout(r, 200));
    const fade = document.getElementById('fade'); fade.style.transitionDuration = '1500ms'; fade.style.opacity = 1;
    await wait(1600);
    // seated by the lantern, the box beside him, the two photos on the rock
    sitting = true; box.visible = true; lantern.visible = true;
    hero.position.copy(SEAT).setY(groundY(SEAT.x, SEAT.z) + 0.22); hero.rotation.y = 1.4; // seen in profile, turned to the box; legs hidden by the rock: he sits
    this.makePolaroids();
    camera.position.set(SEAT.x - 1.5, groundY(SEAT.x, SEAT.z) + 2.4, SEAT.z + 8.5);
    camera.lookAt(SEAT.x + 0.5, groundY(SEAT.x, SEAT.z) + 1.6, SEAT.z - 2);
    music('sad');
    fade.style.opacity = 0; await wait(2200);
    crying = 1;
    // we hear him cry before we understand why
    let sobbing = true;
    (async () => { await wait(900); while (sobbing) { sfx('cry'); await wait(4200 + Math.random() * 1200); } })();
    await tween(camera.position, { x: SEAT.x - 0.6, z: SEAT.z + 6 }, 6000, easeInOut);
    await caption(t('cap_box'), 3400);
    await new Promise((res) => hotspot(t('hs_box'), box, camera, res));
    sobbing = false; crying = 0.4;
    sfx('box');
    await tween(box.userData.lid.rotation, { x: -1.9 }, 1400, easeInOut);
    const halo = glowSprite(0xffc27a, 2.5); halo.position.set(0, 0.6, 0); box.add(halo);
    await wait(700);
    const letter = html(`<div style="position:absolute;inset:0;background:rgba(4,3,10,.5);cursor:pointer">
      <div class="letter"><p>${t('letter')}</p><div class="sig">${t('letter_sig')}</div></div></div>`);
    await wait(4500);
    await new Promise((r) => letter.addEventListener('click', r, { once: true }));
    letter.style.transition = 'opacity 1.5s'; letter.style.opacity = 0; await wait(1500); letter.remove();
    this.ascend();
  },
  makePolaroids() {
    polaroids.forEach((p) => scene.remove(p)); polaroids = [];
    state.photos.slice(-2).forEach((ph, i) => {
      const g = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.02, 0.74), new THREE.MeshStandardMaterial({ color: 0xf2ede4, roughness: 0.7 }));
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.52).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x111122 }));
      pic.position.set(0, 0.012, -0.06);
      const apply = (tx) => { tx.colorSpace = THREE.SRGBColorSpace; pic.material.map = tx; pic.material.color.set(0xffffff); pic.material.needsUpdate = true; };
      const loader = new THREE.TextureLoader().setCrossOrigin('anonymous');
      loader.load(ph.tex || ph.url, apply, undefined, () => ph.fallback && loader.load(ph.fallback, apply));
      g.add(frame, pic);
      g.position.set(SEAT.x - 0.9 + i * 0.75, groundY(SEAT.x, SEAT.z) + 0.62, SEAT.z + 0.35 + i * 0.15); g.rotation.y = -0.3 + i * 0.4;
      scene.add(g); polaroids.push(g);
    });
  },
  async ascend() {
    // he raises his head toward the sky; the photos rise and become stars
    crying = 0; this._lookingUp = true;
    sfx('chime');
    const up = polaroids.map((p, i) => tween(p.position, { y: p.position.y + 9, x: p.position.x - 1 + i * 2 }, 4200, easeInOut));
    polaroids.forEach((p) => tween(p.rotation, { x: -1.2, z: 0.5 }, 4200));
    tween(camera.position, { y: camera.position.y - 0.5 }, 5000, easeInOut);
    const lookFrom = { y: groundY(SEAT.x, SEAT.z) + 1.6 };
    const tilt = tween(lookFrom, { y: 22 }, 6500, easeInOut);
    this._lookY = lookFrom;
    await Promise.all(up);
    polaroids.forEach((p) => {
      const s = glowSprite(0xfff2dd, 1.6); s.position.copy(p.position); scene.add(s);
      tween(s.scale, { x: 0.01, y: 0.01 }, 1800); p.visible = false;
    });
    constellation = makeConstellation(camera, SEAT, groundY(SEAT.x, SEAT.z));
    scene.add(constellation);
    await tilt;
    await tween(constellation.userData, { p: 1 }, 7000, easeInOut);
    await wait(4500);
    // fade to black, then the credits
    const fade = document.getElementById('fade'); fade.style.transitionDuration = '3500ms'; fade.style.opacity = 1;
    await wait(3800);
    go((await import('./ending.js')).default, { fadeOut: 10, fadeIn: 10 });
  },
  update(dt, t) {
    stars.userData.update(t); earth.userData.update(t);
    ship.userData.update(t, shipPower);
    if (constellation) constellation.userData.update(t);
    if (phase === 'walk') {
      const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
      const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0));
      const mv = new THREE.Vector3();
      if (keys.ArrowUp || keys.KeyW || keys.KeyZ) mv.add(fwd);
      if (keys.ArrowDown || keys.KeyS) mv.sub(fwd);
      if (keys.ArrowRight || keys.KeyD) mv.add(right);
      if (keys.ArrowLeft || keys.KeyA || keys.KeyQ) mv.sub(right);
      if (mv.lengthSq() > 0) target = null;
      else if (target) { mv.set(target.x - hero.position.x, 0, target.z - hero.position.z); if (mv.length() < 0.2) { target = null; mv.set(0, 0, 0); } }
      if (mv.lengthSq() > 0) {
        mv.normalize().multiplyScalar(2.6 * dt);
        hero.position.add(mv);
        hero.rotation.y = Math.atan2(mv.x, mv.z);
        walkT += dt * 6;
        hero.userData.body.position.y = Math.abs(Math.sin(walkT)) * 0.25; // low-gravity hop
      } else hero.userData.body.position.y *= 0.9;
      hero.position.y = groundY(hero.position.x, hero.position.z);
      camera.position.lerp(hero.position.clone().add(new THREE.Vector3(1.5, 3.6, 7.5)), 2.5 * dt);
      camera.lookAt(hero.position.x, hero.position.y + 1.2, hero.position.z - 2);
      this._ring.rotation.y = t;
      if (hero.position.distanceTo(new THREE.Vector3(SPOT.x, hero.position.y, SPOT.z)) < 0.9) this.photo();
    } else if (phase === 'photo' && this._look) {
      camera.lookAt(this._look);
    } else if (phase === 'reveal' && sitting) {
      const u = hero.userData;
      // sitting: head bowed when crying, shoulders trembling
      const sob = crying ? Math.max(0, Math.sin(t * 2.4)) : 0; // shoulders shake in waves
      u.head.rotation.x = this._lookingUp ? -0.55 + Math.sin(t * 7) * 0.012 : crying ? 0.4 + Math.sin(t * 13) * 0.035 * sob : -0.2;
      u.body.position.y = crying ? Math.sin(t * 14) * 0.02 * sob : 0;
      u.arms.forEach((a) => a && (a.rotation.x = crying && !this._lookingUp ? -1.4 : -0.4));
      if (this._lookY) camera.lookAt(SEAT.x + 0.5, this._lookY.y, SEAT.z - 2 - (this._lookY.y - 1) * 0.5);
    } else if (phase === 'land') {
      camera.lookAt(-3, Math.max(3, ship.position.y * 0.7), -2);
    }
  },
  exit() { removeEventListener('pointerdown', this._click); },
};

/* Stars that gather into a drawing of a mother and her child, both in spacesuits. */
function makeConstellation(cam, seat, gy) {
  const cv = document.createElement('canvas'); cv.width = 240; cv.height = 160;
  const c = cv.getContext('2d'); c.fillStyle = '#fff';
  const fig = (x, y, s) => {
    c.globalCompositeOperation = 'source-over';
    c.beginPath(); c.arc(x, y, 26 * s, 0, 7); c.fill();                                   // helmet
    c.beginPath(); c.roundRect(x - 22 * s, y + 20 * s, 44 * s, 56 * s, 16 * s); c.fill();  // body, joined to the helmet so it doesn't read as a halo
    c.beginPath(); c.roundRect(x - 20 * s, y + 72 * s, 16 * s, 24 * s, 7 * s); c.fill();   // legs
    c.beginPath(); c.roundRect(x + 4 * s, y + 72 * s, 16 * s, 24 * s, 7 * s); c.fill();
    c.globalCompositeOperation = 'destination-out';
    c.beginPath(); c.ellipse(x - 5 * s, y - 1 * s, 12 * s, 10 * s, 0, 0, 7); c.fill();       // visor (small, or the helmet reads as a halo)
    c.globalCompositeOperation = 'source-over';
  };
  fig(150, 38, 1.05); fig(84, 74, 0.62);
  // holding hands
  c.lineWidth = 7; c.strokeStyle = '#fff'; c.beginPath(); c.moveTo(97, 100); c.quadraticCurveTo(112, 108, 127, 98); c.stroke();
  const d = c.getImageData(0, 0, 240, 160).data;
  const on = (x, y) => x >= 0 && y >= 0 && x < 240 && y < 160 && d[(y * 240 + x) * 4 + 3] > 128;
  const edge = [];
  for (let y = 0; y < 160; y++) for (let x = 0; x < 240; x++) if (on(x, y) && (!on(x + 1, y) || !on(x - 1, y) || !on(x, y + 1) || !on(x, y - 1))) edge.push([x, y]);
  const pts = edge.filter((_, i) => i % 3 === 0);
  // place the drawing in the sky above where the camera ends up looking
  const center = new THREE.Vector3(seat.x + 0.5, gy + 60, seat.z - 45);
  const n = pts.length;
  const start = new Float32Array(n * 3), end = new Float32Array(n * 3), cur = new Float32Array(n * 3), size = new Float32Array(n), phase = new Float32Array(n);
  pts.forEach(([x, y], i) => {
    const s = new THREE.Vector3().randomDirection().multiplyScalar(80); s.y = Math.abs(s.y) + 20; s.add(center).sub(new THREE.Vector3(0, 30, 0));
    start.set([s.x, s.y, s.z], i * 3);
    end.set([center.x + (x - 120) * 0.32, center.y + (80 - y) * 0.32, center.z], i * 3);
    size[i] = 2.2 + Math.random() * 2.8; phase[i] = Math.random() * 6.28;
  });
  cur.set(start);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(cur, 3));
  g.setAttribute('size', new THREE.BufferAttribute(size, 1));
  g.setAttribute('phase', new THREE.BufferAttribute(phase, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, pr: { value: Math.min(devicePixelRatio, 2) }, alpha: { value: 0 } },
    vertexShader: `attribute float size; attribute float phase; uniform float time; uniform float pr; varying float vA;
      void main(){ vA=0.7+0.3*sin(time*2.0+phase); vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=size*pr; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float alpha; varying float vA; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,0.,d);
      gl_FragColor=vec4(vec3(1.0,0.93,0.82)*2.0, a*vA*alpha); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts3 = new THREE.Points(g, m);
  pts3.userData.p = 0;
  pts3.userData.update = (t) => {
    m.uniforms.time.value = t;
    const p = pts3.userData.p;
    m.uniforms.alpha.value = Math.min(1, p * 3);
    for (let i = 0; i < n * 3; i++) cur[i] = start[i] + (end[i] - start[i]) * p;
    g.attributes.position.needsUpdate = true;
  };
  return pts3;
}
