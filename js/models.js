import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/* ---------------- Materials (palette from Aurélie's storyboard) ---------------- */
export const MAT = {
  suit: new THREE.MeshStandardMaterial({ color: 0xe8e2da, roughness: 0.55, metalness: 0.05 }),
  suitDark: new THREE.MeshStandardMaterial({ color: 0xcfc7bd, roughness: 0.6 }),
  lav: new THREE.MeshStandardMaterial({ color: 0xa48fd6, roughness: 0.5 }),
  visor: new THREE.MeshPhysicalMaterial({ color: 0x030306, roughness: 0.08, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 }),
  glowCyan: new THREE.MeshBasicMaterial({ color: new THREE.Color(0x9ff6ff).multiplyScalar(2.2) }),
  glowWarm: new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd29a).multiplyScalar(2.4) }),
  glowLav: new THREE.MeshBasicMaterial({ color: new THREE.Color(0xd6c6ff).multiplyScalar(2.0) }),
};

/* Superellipsoid: softly squared shapes (same formula as Aurélie's Blender script). */
function sp(v, p) { return Math.sign(v) * Math.pow(Math.abs(v), p); }
export function roundedForm(rx, ry, rz, e = 0.7, seg = 48, rings = 28) {
  const pos = [], idx = [];
  for (let j = 0; j <= rings; j++) {
    const lat = -Math.PI / 2 + (Math.PI * j) / rings;
    const c = sp(Math.cos(lat), e), s = sp(Math.sin(lat), e);
    for (let i = 0; i <= seg; i++) {
      const lon = (2 * Math.PI * i) / seg;
      pos.push(rx * c * sp(Math.cos(lon), e), ry * s, rz * c * sp(Math.sin(lon), e));
    }
  }
  for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) {
    const a = j * (seg + 1) + i, b = a + seg + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

/* ---------------- Astronaut (the human) ---------------- */
// Procedural version of Aurélie's Blender astronaut. If assets/astronaut.glb exists,
// it is used instead (loadAstronaut).
export function makeAstronaut() {
  const root = new THREE.Group();
  const body = new THREE.Group(); body.name = 'Body';
  root.add(body);
  body.add(mesh(roundedForm(0.6, 0.78, 0.37, 0.72), MAT.suit, 0, 1.35, 0));
  const legs = [];
  for (const s of [-1, 1]) {
    const leg = mesh(roundedForm(0.28, 0.42, 0.34, 0.56), MAT.suit, s * 0.31, 0.42, 0);
    body.add(leg); legs.push(leg);
    body.add(mesh(roundedForm(0.3, 0.08, 0.36, 0.5), MAT.lav, s * 0.31, 0.06, 0.03));
  }
  // belt + chest light
  body.add(mesh(new THREE.TorusGeometry(0.56, 0.05, 12, 48).rotateX(Math.PI / 2).scale(1, 1, 0.66), MAT.lav, 0, 1.0, 0));
  body.add(mesh(new THREE.CircleGeometry(0.07, 24), MAT.glowCyan, 0, 1.45, 0.372));
  // backpack
  body.add(mesh(new RoundedBoxGeometry(0.8, 0.95, 0.35, 4, 0.12), MAT.suitDark, 0, 1.5, -0.42));
  body.add(mesh(new THREE.BoxGeometry(0.3, 0.05, 0.02), MAT.glowWarm, 0, 1.25, -0.6));

  const arms = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.68, 2.05, 0);
    const arm = mesh(roundedForm(0.22, 0.58, 0.27, 0.9), MAT.suit, 0, -0.52, 0);
    pivot.add(arm);
    pivot.add(mesh(new THREE.TorusGeometry(0.2, 0.045, 10, 32).rotateX(Math.PI / 2), MAT.lav, 0, -0.78, 0));
    pivot.rotation.z = s * 0.24; pivot.name = s < 0 ? 'Arm_Left' : 'Arm_Right';
    body.add(pivot); arms.push(pivot);
  }

  const head = new THREE.Group(); head.name = 'Head_Pivot';
  head.position.set(0, 3.03, 0);
  const seam = THREE.MathUtils.degToRad(79);
  const visor = new THREE.SphereGeometry(1, 64, 32, 0, Math.PI * 2, 0, seam).rotateX(Math.PI / 2);
  const shell = new THREE.SphereGeometry(1, 64, 48, 0, Math.PI * 2, seam, Math.PI - seam).rotateX(Math.PI / 2);
  head.add(mesh(visor, MAT.visor), mesh(shell, MAT.suit));
  head.add(mesh(new THREE.TorusGeometry(Math.sin(seam), 0.025, 12, 96), MAT.suit, 0, 0, Math.cos(seam)));
  for (const s of [-1, 1]) {
    head.add(mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.14, 40).rotateZ(Math.PI / 2), MAT.lav, s * 0.98, 0, 0));
  }
  body.add(head);

  root.scale.setScalar(0.5);
  Object.assign(root.userData, { head, arms, legs, body, kind: 'astronaut' });
  return root;
}

export async function loadAstronaut() {
  try {
    const gltf = await new GLTFLoader().loadAsync('./assets/astronaut.glb');
    const root = new THREE.Group();
    const model = gltf.scene;
    model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    // normalize to height 2
    const box = new THREE.Box3().setFromObject(model);
    const h = box.max.y - box.min.y;
    model.scale.setScalar(2 / h);
    model.position.y = -box.min.y * (2 / h);
    model.name = 'Body';
    root.add(model);
    const find = (n) => model.getObjectByName(n);
    root.userData = {
      head: find('Head_Pivot') || new THREE.Group(),
      arms: [find('Arm_Left'), find('Arm_Right')].filter(Boolean),
      legs: [], body: model, kind: 'astronaut',
    };
    return root;
  } catch {
    return makeAstronaut();
  }
}

/* ---------------- Robot (the companion left at home) ---------------- */
export function makeRobot() {
  const root = new THREE.Group();
  const body = new THREE.Group(); body.name = 'Body';
  root.add(body);
  body.add(mesh(roundedForm(0.5, 0.45, 0.42, 0.7), MAT.suit, 0, 0.62, 0));
  body.add(mesh(new RoundedBoxGeometry(0.34, 0.07, 0.04, 2, 0.02), MAT.glowWarm, 0, 0.5, 0.43));
  for (const s of [-1, 1]) {
    body.add(mesh(roundedForm(0.2, 0.16, 0.24, 0.6), MAT.suit, s * 0.24, 0.14, 0.02));
  }
  const arms = [];
  for (const s of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(s * 0.5, 0.8, 0);
    p.add(mesh(roundedForm(0.13, 0.26, 0.14, 0.8), MAT.suit, 0, -0.22, 0));
    p.rotation.z = s * 0.3; p.name = s < 0 ? 'Arm_Left' : 'Arm_Right'; body.add(p); arms.push(p);
  }
  const head = new THREE.Group(); head.name = 'Head_Pivot'; head.position.y = 1.5;
  head.add(mesh(roundedForm(0.78, 0.66, 0.68, 0.65), MAT.suit));
  head.add(mesh(roundedForm(0.6, 0.46, 0.2, 0.6), MAT.visor, 0, -0.02, 0.56));
  for (const s of [-1, 1]) {
    head.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 32).rotateZ(Math.PI / 2), MAT.lav, s * 0.79, 0, 0));
  }
  const eyes = [];
  for (const s of [-1, 1]) {
    const e = mesh(new THREE.CapsuleGeometry(0.06, 0.1, 6, 12), MAT.glowWarm, s * 0.2, 0.02, 0.77);
    e.name = s < 0 ? 'Eye_L' : 'Eye_R';
    head.add(e); eyes.push(e);
  }
  body.add(head);
  root.scale.setScalar(0.7);
  Object.assign(root.userData, { head, arms, body, eyes, kind: 'robot' });
  return root;
}

/** Independent copy of a character, with its animation handles re-linked. */
export function cloneChar(template) {
  const c = template.clone(true);
  const find = (n) => c.getObjectByName(n);
  c.userData = {
    kind: template.userData.kind,
    head: find('Head_Pivot') || new THREE.Group(),
    arms: [find('Arm_Left'), find('Arm_Right')].filter(Boolean),
    body: find('Body') || c.children[0],
    eyes: [find('Eye_L'), find('Eye_R')].filter(Boolean),
  };
  return c;
}

/** Gentle idle animation shared by both characters. */
export function idle(char, t, float = false) {
  const u = char.userData;
  if (!u.body) return;
  if (float) {
    u.body.position.y = Math.sin(t * 0.8) * 0.12;
    u.body.rotation.z = Math.sin(t * 0.5) * 0.06;
  } else {
    u.body.position.y = Math.abs(Math.sin(t * 1.6)) * 0.015;
  }
  u.head.rotation.y = Math.sin(t * 0.45) * 0.18;
  u.head.rotation.x = Math.sin(t * 0.7) * 0.04;
  u.arms?.forEach((a, i) => { if (a) a.rotation.x = Math.sin(t * 1.1 + i * Math.PI) * (float ? 0.25 : 0.06); });
}

/* ---------------- Sky ---------------- */
export function makeStars(count = 5000, radius = 420) {
  const g = new THREE.BufferGeometry();
  const p = new Float32Array(count * 3), c = new Float32Array(count * 3), s = new Float32Array(count), ph = new Float32Array(count);
  const palette = [new THREE.Color(0xffffff), new THREE.Color(0xd8ccff), new THREE.Color(0xffe2bd), new THREE.Color(0xbfe9ff)];
  for (let i = 0; i < count; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(radius * (0.8 + Math.random() * 0.2));
    p.set([v.x, v.y, v.z], i * 3);
    const col = palette[(Math.random() * palette.length) | 0];
    c.set([col.r, col.g, col.b], i * 3);
    s[i] = Math.pow(Math.random(), 3) * 3.2 + 0.6;
    ph[i] = Math.random() * 6.28;
  }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  g.setAttribute('size', new THREE.BufferAttribute(s, 1));
  g.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, pr: { value: Math.min(window.devicePixelRatio, 2) } },
    vertexShader: `attribute float size; attribute float phase; attribute vec3 color; varying vec3 vC; varying float vA;
      uniform float time; uniform float pr;
      void main(){ vC=color; vA=0.6+0.4*sin(time*1.3+phase);
        vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=size*pr*(0.8+0.4*vA); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `varying vec3 vC; varying float vA;
      void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.0,d); gl_FragColor=vec4(vC*1.4,a*vA); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(g, m);
  pts.userData.update = (t) => { m.uniforms.time.value = t; };
  return pts;
}

/* ---------------- Planets (procedural textures, offline) ---------------- */
/* 3D simplex noise (Stefan Gustavson, public domain) */
const GRAD3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
const PERM = (() => { const p = []; let x = 1337; for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) { x = (x * 16807) % 2147483647; const j = x % (i + 1); [p[i], p[j]] = [p[j], p[i]]; }
  return new Uint8Array([...p, ...p]); })();
function simplex3(x, y, z) {
  const F3 = 1 / 3, G3 = 1 / 6;
  const s = (x + y + z) * F3; const i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s);
  const t = (i + j + k) * G3; const x0 = x - i + t, y0 = y - j + t, z0 = z - k + t;
  let i1, j1, k1, i2, j2, k2;
  if (x0 >= y0) { if (y0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=1;k2=0; } else if (x0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=0;k2=1; } else { i1=0;j1=0;k1=1;i2=1;j2=0;k2=1; } }
  else { if (y0 < z0) { i1=0;j1=0;k1=1;i2=0;j2=1;k2=1; } else if (x0 < z0) { i1=0;j1=1;k1=0;i2=0;j2=1;k2=1; } else { i1=0;j1=1;k1=0;i2=1;j2=1;k2=0; } }
  const pts = [[x0, y0, z0, 0, 0, 0], [x0 - i1 + G3, y0 - j1 + G3, z0 - k1 + G3, i1, j1, k1],
    [x0 - i2 + 2 * G3, y0 - j2 + 2 * G3, z0 - k2 + 2 * G3, i2, j2, k2], [x0 - 1 + 0.5, y0 - 1 + 0.5, z0 - 1 + 0.5, 1, 1, 1]];
  const ii = i & 255, jj = j & 255, kk = k & 255; let n = 0;
  for (const [a, b, c, di, dj, dk] of pts) {
    let tt = 0.6 - a * a - b * b - c * c;
    if (tt > 0) { const g = GRAD3[PERM[ii + di + PERM[jj + dj + PERM[kk + dk]]] % 12]; tt *= tt; n += tt * tt * (g[0] * a + g[1] * b + g[2] * c); }
  }
  return 32 * n; // ~[-1,1]
}
function fbm3(x, y, z, oct = 5) { let f = 0, a = 0.5, n = 0; for (let i = 0; i < oct; i++) { f += a * simplex3(x, y, z); n += a; x *= 2.02; y *= 2.02; z *= 2.02; a *= 0.5; } return 0.5 + 0.5 * f / n; }
function fbm(x, y, seed, oct = 5) { return fbm3(x, y, seed * 17.13, oct); }
// Seamless noise on a sphere (u,v = texture coords), value ~[0,1]
function sphereNoise(u, v, seed, scale, oct) {
  const lon = u * Math.PI * 2, lat = (0.5 - v) * Math.PI;
  const x = Math.cos(lat) * Math.cos(lon), y = Math.sin(lat), z = Math.cos(lat) * Math.sin(lon);
  return fbm3(x * scale + seed * 7.1, y * scale + seed * 3.3, z * scale + seed * 5.7, oct);
}

const texCache = {};
function canvasTex(w, h, fn) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d'); const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [r, g, b, a = 255] = fn(x / w, y / h);
    const i = (y * w + x) * 4; img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = a;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function earthTextures() {
  if (texCache.earth) return texCache.earth;
  const W = 1024, H = 512;
  const ss = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const map = canvasTex(W, H, (u, v) => {
    const w = (sphereNoise(u, v, 5, 2.0, 3) - 0.5) * 0.12;
    const n = sphereNoise(u + w, v + w, 3, 1.5, 6);
    const lat = Math.abs(v - 0.5) * 2;
    const sea = 0.53;
    const k = Math.min(1, Math.max(0, (n - sea) * 7));
    const arid = sphereNoise(u, v, 9, 2.4, 4) + (lat < 0.45 ? 0.08 : -0.15);
    const land = lerp3([52 + k * 30, 86 + k * 25, 52 + k * 10], [168 + k * 20, 140 + k * 15, 98], ss(0.45, 0.62, arid));
    const d = Math.min(1, Math.max(0, (sea - n) * 5));
    const ocean = [12 + (1 - d) * 18, 40 + (1 - d) * 40, 92 + (1 - d) * 40];
    let c = lerp3(ocean, land, ss(sea - 0.006, sea + 0.006, n));
    const iceEdge = 0.84 + (sphereNoise(u, v, 2, 6, 3) - 0.5) * 0.12;
    c = lerp3(c, [228, 236, 244], ss(iceEdge - 0.015, iceEdge + 0.015, lat));
    return c;
  });
  const clouds = canvasTex(W, H, (u, v) => {
    const w = (sphereNoise(u, v, 23, 3, 2) - 0.5) * 0.2;
    const n = sphereNoise(u + w, v, 21, 2.6, 6);
    const a = Math.max(0, Math.min(1, (n - 0.55) * 3.5));
    return [255, 255, 255, a * 230];
  });
  return (texCache.earth = { map, clouds });
}

export function makeEarth(r = 1) {
  const g = new THREE.Group();
  const { map, clouds } = earthTextures();
  const planet = new THREE.Mesh(new THREE.SphereGeometry(r, 96, 64), new THREE.MeshStandardMaterial({ map, roughness: 0.8, metalness: 0 }));
  const cl = new THREE.Mesh(new THREE.SphereGeometry(r * 1.012, 96, 64), new THREE.MeshStandardMaterial({ map: clouds, transparent: true, depthWrite: false }));
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(r * 1.025, 64, 48), new THREE.ShaderMaterial({
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `varying vec3 vN; varying vec3 vV; void main(){ float f=pow(1.0-max(dot(vN,vV),0.0),4.0); gl_FragColor=vec4(vec3(0.45,0.68,1.0)*f*0.9,f); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  g.add(planet, cl, atmo);
  g.userData.update = (t) => { planet.rotation.y = t * 0.02; cl.rotation.y = t * 0.026; };
  return g;
}

function moonTexture() {
  if (texCache.moon) return texCache.moon;
  const craters = Array.from({ length: 90 }, () => ({ u: Math.random(), v: 0.1 + Math.random() * 0.8, r: Math.pow(Math.random(), 2.5) * 0.06 + 0.006 }));
  return (texCache.moon = canvasTex(512, 256, (u, v) => {
    let n = sphereNoise(u, v, 41, 3.0, 6);
    const m = sphereNoise(u, v, 77, 1.3, 4);
    const maria = -Math.max(0, Math.min(1, (m - 0.55) * 8)) * 0.2;
    let c = 0.55 + (n - 0.5) * 0.7 + maria;
    for (const k of craters) {
      const du = Math.min(Math.abs(u - k.u), 1 - Math.abs(u - k.u)) * 2, dv = v - k.v;
      const d = Math.sqrt(du * du + dv * dv) / k.r;
      if (d < 1.15) c += d < 0.85 ? -0.12 * (1 - d) : 0.12 * (1.15 - d) * 3;
    }
    const x = Math.max(0, Math.min(1, c)) * 255;
    return [x * 0.98, x * 0.97, x * 0.95];
  }));
}

export function makeMoon(r = 1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 96, 64), new THREE.MeshStandardMaterial({ map: moonTexture(), roughness: 1 }));
  return m;
}

/** Bumpy lunar ground for walking scenes. */
export function makeLunarGround(size = 200) {
  const geo = new THREE.PlaneGeometry(size, size, 220, 220).rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  const craters = Array.from({ length: 40 }, () => ({ x: (Math.random() - 0.5) * size * 0.8, z: -Math.random() * size * 0.45 - 4, r: 1 + Math.random() * 5 }));
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    let y = (fbm(x * 0.05 + 5, z * 0.05 + 5, 3, 5) - 0.5) * 3 + (fbm(x * 0.4, z * 0.4, 8, 3) - 0.5) * 0.25;
    for (const c of craters) {
      const d = Math.hypot(x - c.x, z - c.z) / c.r;
      if (d < 1.3) y += d < 1 ? -0.5 * c.r * 0.25 * (1 - d * d) : 0.35 * c.r * 0.25 * (1.3 - d) * 3;
    }
    // far mountains
    y += Math.max(0, -z - 60) * 0.12 * fbm(x * 0.03, 1, 12, 3);
    p.setY(i, y);
  }
  geo.computeVertexNormals();
  const tex = canvasTex(256, 256, (u, v) => { const n = fbm(u * 40, v * 40, 5, 4); const x = 120 + n * 90; return [x, x * 0.98, x * 0.96]; });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(30, 30);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 1, color: 0xb8b4b0 }));
  m.receiveShadow = true;
  m.userData.heightAt = (x, z) => {
    let y = (fbm(x * 0.05 + 5, z * 0.05 + 5, 3, 5) - 0.5) * 3 + (fbm(x * 0.4, z * 0.4, 8, 3) - 0.5) * 0.25;
    for (const c of craters) { const d = Math.hypot(x - c.x, z - c.z) / c.r; if (d < 1.3) y += d < 1 ? -0.5 * c.r * 0.25 * (1 - d * d) : 0.35 * c.r * 0.25 * (1.3 - d) * 3; }
    return y;
  };
  return m;
}

/* ---------------- Vehicles & props ---------------- */
export function makeShip() {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.9, 2.6, 16, 48).rotateX(Math.PI / 2), MAT.suit);
  hull.castShadow = true; g.add(hull);
  g.add(mesh(new THREE.TorusGeometry(0.91, 0.07, 12, 64), MAT.lav, 0, 0, 0.6));
  g.add(mesh(new THREE.TorusGeometry(0.91, 0.07, 12, 64), MAT.lav, 0, 0, -0.9));
  // cockpit window
  const win = mesh(roundedForm(0.55, 0.32, 0.4, 0.6), new THREE.MeshPhysicalMaterial({ color: 0x0a0a14, roughness: 0.05, clearcoat: 1 }), 0, 0.45, 1.6);
  g.add(win);
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.04, 0.02), MAT.glowWarm, 0, 0.2, 2.25));
  // side windows
  for (const z of [-0.2, 0.2]) for (const s of [-1, 1]) g.add(mesh(new THREE.CircleGeometry(0.13, 24).rotateY(s * Math.PI / 2), MAT.glowWarm, s * 0.91, 0.15, z));
  // fins
  for (let i = 0; i < 3; i++) {
    const fin = mesh(new RoundedBoxGeometry(0.08, 0.9, 0.9, 2, 0.04), MAT.lav, 0, 0, -1.9);
    const piv = new THREE.Group(); piv.rotation.z = (i * Math.PI * 2) / 3; fin.position.y = 0.95; piv.add(fin); g.add(piv);
  }
  // engine + flame
  g.add(mesh(new THREE.CylinderGeometry(0.45, 0.6, 0.4, 32).rotateX(Math.PI / 2), MAT.suitDark, 0, 0, -2.25));
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.6, 24, 1, true).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0xa9c8ff).multiplyScalar(2), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
  flame.position.z = -3.2; g.add(flame);
  g.userData.flame = flame;
  g.userData.update = (t, power = 1) => {
    flame.scale.set(1, 1, power * (0.85 + Math.sin(t * 40) * 0.15));
    flame.visible = power > 0.02;
  };
  return g;
}

function panelTexture() {
  if (texCache.panel) return texCache.panel;
  return (texCache.panel = canvasTex(128, 64, (u, v) => {
    const gx = (u * 8) % 1, gy = (v * 4) % 1;
    const line = gx < 0.06 || gy < 0.1;
    return line ? [190, 200, 230] : [30, 58 + v * 30, 140 + u * 30];
  }));
}

export function makeSatellite() {
  const g = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: 0xd8b56a, metalness: 0.85, roughness: 0.35 });
  g.add(mesh(new RoundedBoxGeometry(1.2, 1.2, 1.6, 3, 0.08), gold));
  const pm = new THREE.MeshStandardMaterial({ map: panelTexture(), metalness: 0.4, roughness: 0.3 });
  for (const s of [-1, 1]) {
    g.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8).rotateZ(Math.PI / 2), MAT.suitDark, s * 1.0, 0, 0));
    g.add(mesh(new THREE.BoxGeometry(2.6, 0.05, 1.2), pm, s * 2.7, 0, 0));
  }
  const dish = mesh(new THREE.SphereGeometry(0.55, 32, 16, 0, Math.PI * 2, 0, Math.PI / 3), MAT.suit, 0, 0.9, 0);
  dish.material = dish.material.clone(); dish.material.side = THREE.DoubleSide; g.add(dish);
  // camera lens (front, +z)
  g.add(mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.4, 32).rotateX(Math.PI / 2), MAT.suitDark, 0, 0, 0.95));
  const lens = mesh(new THREE.CircleGeometry(0.22, 32), MAT.visor, 0, 0, 1.16);
  g.add(lens);
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff5a5a).multiplyScalar(3) }));
  light.position.set(0.45, 0.45, 0.82); g.add(light);
  g.userData.light = light; g.userData.lens = lens;
  g.userData.update = (t, ok = false) => {
    light.material.color.set(ok ? 0x66ffb0 : 0xff5a5a).multiplyScalar(3);
    light.visible = ok || Math.sin(t * 6) > 0;
  };
  return g;
}

function woodTexture() {
  if (texCache.wood) return texCache.wood;
  return (texCache.wood = canvasTex(256, 128, (u, v) => {
    const n = fbm(u * 3, v * 30, 13, 4);
    const k = 0.6 + Math.sin((v * 40 + n * 6)) * 0.12 + n * 0.3;
    return [110 * k + 20, 70 * k + 10, 40 * k + 6];
  }));
}

export function makeBox() {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.7 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc9a25a, metalness: 0.9, roughness: 0.3 });
  g.add(mesh(new RoundedBoxGeometry(0.9, 0.45, 0.6, 3, 0.04), wood, 0, 0.225, 0));
  const lid = new THREE.Group(); lid.position.set(0, 0.45, -0.3);
  lid.add(mesh(new RoundedBoxGeometry(0.92, 0.14, 0.62, 3, 0.05), wood, 0, 0.07, 0.3));
  lid.add(mesh(new THREE.BoxGeometry(0.12, 0.12, 0.03), brass, 0, 0, 0.62));
  g.add(lid);
  g.userData.lid = lid;
  return g;
}

export function makeLantern() {
  const g = new THREE.Group();
  const frame = new THREE.MeshStandardMaterial({ color: 0x3a3340, metalness: 0.6, roughness: 0.5 });
  g.add(mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.05, 16), frame, 0, 0.025, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.28, 16), MAT.glowWarm, 0, 0.19, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.16, 0.08, 16), frame, 0, 0.37, 0));
  const l = new THREE.PointLight(0xffb36b, 3, 6, 1.6); l.position.y = 0.25; l.castShadow = false;
  g.add(l);
  return g;
}

/** A soft glowing sprite (sun, engine glow, light halos). */
export function glowSprite(color = 0xffffff, size = 1) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const c = cv.getContext('2d');
  const gr = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = gr; c.fillRect(0, 0, 128, 128);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.setScalar(size);
  return s;
}
