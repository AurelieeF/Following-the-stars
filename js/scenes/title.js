import * as THREE from 'three';
import { html, go } from '../engine.js';
import { makeStars, makeEarth, makeMoon, idle, glowSprite, cloneChar } from '../models.js';
import { initAudio, music, sfx } from '../audio.js';
import { state } from '../state.js';
import { t, getLang, setLang } from '../text.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 2000);
let stars, earth, moon, hero;

export default {
  scene, camera, bloom: 0.7,
  async enter() {
    if (!stars) {
      scene.background = new THREE.Color(0x04030a);
      stars = makeStars(); scene.add(stars);
      earth = makeEarth(8); earth.position.set(9.5, -9.5, -16); earth.rotation.z = 0.3; scene.add(earth);
      moon = makeMoon(1.4); moon.position.set(15, 3.5, -34); scene.add(moon);
      const sun = new THREE.DirectionalLight(0xfff1e0, 2.8); sun.position.set(-10, 4, 3); scene.add(sun);
      const fill = new THREE.DirectionalLight(0x9c88ff, 0.35); fill.position.set(8, -2, 4); scene.add(fill);
      scene.add(new THREE.AmbientLight(0x2a2440, 0.6));
      
      hero = cloneChar(state.astronaut);
      scene.add(hero);
    }
    hero.position.set(-2.4, -1.6, 0);
    hero.rotation.set(0.1, 0.5, 0.15);
    camera.position.set(0, 0.3, 9);
    camera.lookAt(0, 0.3, 0);

    const wrap = html(`<div class="title-wrap">
      <div class="title">${t('title')}</div>
      <div class="subtitle">${t('subtitle')}</div>
      <button class="btn">${t('start')}</button>
      <div class="langs"><button data-l="fr">FR</button><button data-l="en">EN</button></div>
    </div>`);
    wrap.querySelectorAll('.langs button').forEach((b) => {
      b.classList.toggle('on', b.dataset.l === getLang());
      b.onclick = () => { setLang(b.dataset.l); wrap.remove(); this.enter(); };
    });
    wrap.querySelector('.btn').onclick = async () => {
      initAudio(); sfx('click'); music('calm');
      try {
        const { default: next } = await import('./home.js');
        go(next);
      } catch { wrap.querySelector('.btn').textContent = 'La suite arrive bientôt…'; }
    };
  },
  update(dt, t) {
    stars.userData.update(t);
    earth.userData.update(t);
    moon.rotation.y = t * 0.01;
    hero.position.y = -1.6 + Math.sin(t * 0.6) * 0.15;
    hero.rotation.z = 0.15 + Math.sin(t * 0.4) * 0.05;
    hero.rotation.y = 0.5 + Math.sin(t * 0.25) * 0.15;
    camera.position.x = Math.sin(t * 0.08) * 0.4;
    camera.lookAt(0, 0.3, 0);
  },
};
