import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { t } from './text.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const canvas = document.getElementById('c');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.6, 0.82);
composer.addPass(renderPass);
composer.addPass(bloom);
composer.addPass(new OutputPass());

export const ui = document.getElementById('ui');
const fadeEl = document.getElementById('fade');
const clock = new THREE.Clock();
let current = null;
let switching = false;

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  if (current?.camera) { current.camera.aspect = w / h; current.camera.updateProjectionMatrix(); }
}
window.addEventListener('resize', resize);

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function fade(to, ms = 1200) {
  fadeEl.style.transitionDuration = ms + 'ms';
  fadeEl.style.opacity = to;
  return wait(ms);
}

/** Switch to a scene module: { scene, camera, enter(), update(dt,t), exit(), bloom? } */
export async function go(next, opts = {}) {
  if (switching) return;
  switching = true;
  await fade(1, opts.fadeOut ?? 900);
  current?.exit?.();
  ui.innerHTML = '';
  current = next;
  // enter() builds the scene synchronously; its story keeps running after the fade-in
  await Promise.race([next.enter?.(opts.data), wait(60)]);
  renderPass.scene = next.scene;
  renderPass.camera = next.camera;
  bloom.strength = next.bloom ?? 0.55;
  resize();
  await fade(0, opts.fadeIn ?? 1400);
  switching = false;
}

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  if (current) {
    current.update?.(dt, t);
    composer.render();
  }
});

/** Square picture of what a camera sees (used when NASA images can't load). */
export function snapshot(scene, cam, size = 512) {
  const src = renderer.domElement;
  cam.aspect = src.width / src.height; cam.updateProjectionMatrix();
  renderer.render(scene, cam);
  const s = Math.min(src.width, src.height);
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  cv.getContext('2d').drawImage(src, (src.width - s) / 2, (src.height - s) / 2, s, s, 0, 0, size, size);
  return cv.toDataURL('image/jpeg', 0.85);
}

/** Polaroid-style photo reveal. Resolves on click. */
export function showPhoto(photo, fallbackUrl, fallbackLabel) {
  return new Promise((resolve) => {
    const url = photo?.url || fallbackUrl;
    const label = photo?.label || fallbackLabel;
    const credit = photo?.credit || t('credit_fallback');
    const el = html(`<div style="position:absolute;inset:0;background:rgba(5,4,12,.55);cursor:pointer">
      <div class="photo"><img src="${url}" alt="${label}"><div class="cap">${label}</div></div>
      <div class="credit">${credit}<br><span style="opacity:.7">${t('next')}</span></div></div>`);
    setTimeout(() => el.addEventListener('click', () => { el.remove(); resolve(); }), 900);
  });
}

/* ---------- UI helpers ---------- */
export function html(str) {
  const d = document.createElement('div');
  d.innerHTML = str.trim();
  const el = d.firstElementChild;
  ui.appendChild(el);
  return el;
}

/** Show a line of dialogue; resolves on click / space / enter. */
export function say(text, who = '', ms = 0) {
  return new Promise((resolve) => {
    const el = html(`<div class="dialog">${who ? `<span class="who">${who}</span>` : ''}${text}
      <span class="next">${ms ? '' : t('next')}</span></div>`);
    let done = false;
    const finish = () => {
      if (done) return; done = true;
      window.removeEventListener('keydown', key);
      el.remove(); resolve();
    };
    const key = (e) => { if (e.code === 'Space' || e.code === 'Enter') finish(); };
    if (ms) setTimeout(finish, ms);
    else { el.addEventListener('click', finish); window.addEventListener('keydown', key); }
  });
}

export function caption(text, ms = 3500) {
  const el = html(`<div class="caption">${text}</div>`);
  return wait(ms).then(() => { el.style.transition = 'opacity .8s'; el.style.opacity = 0; return wait(800); })
    .then(() => el.remove());
}

/** A clickable label pinned to a 3D object. */
export function hotspot(label, object3d, camera, onClick) {
  const el = html(`<div class="hotspot">${label}</div>`);
  const v = new THREE.Vector3();
  const tick = () => {
    if (!el.isConnected) return;
    object3d.getWorldPosition(v).project(camera);
    el.style.left = ((v.x + 1) / 2) * window.innerWidth + 'px';
    el.style.top = ((1 - v.y) / 2) * window.innerHeight + 'px';
    requestAnimationFrame(tick);
  };
  tick();
  el.addEventListener('click', () => { el.remove(); onClick(); });
  return el;
}

/** Smoothly animate any numeric props with easing. */
export function tween(obj, to, ms = 1000, ease = (x) => 1 - Math.pow(1 - x, 3)) {
  const from = {};
  for (const k in to) from[k] = obj[k];
  const start = performance.now();
  return new Promise((resolve) => {
    const step = () => {
      const p = Math.min((performance.now() - start) / ms, 1);
      const e = ease(p);
      for (const k in to) obj[k] = from[k] + (to[k] - from[k]) * e;
      if (p < 1) requestAnimationFrame(step); else resolve();
    };
    step();
  });
}
export const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
