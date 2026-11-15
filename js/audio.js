// Sound system.
// Drop your own files in assets/sounds/ with these names (mp3, m4a, wav or ogg) and they replace
// the built-in synthesized placeholders automatically:
//   cry.mp3 (him crying on the Moon — record your own!), sob.mp3 (the robot), music.mp3, click.mp3, whoosh.mp3, hit.mp3, shutter.mp3, chime.mp3, launch.mp3, alarm.mp3, box.mp3
const NAMES = ['cry', 'sob', 'music', 'click', 'whoosh', 'hit', 'shutter', 'chime', 'launch', 'alarm', 'box', 'music_end'];

let ctx = null, master = null, musicNode = null;
let muted = false;
const buffers = {};

export function initAudio() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = 0.8;
  master.connect(ctx.destination);
  // mp3 first; m4a / wav / ogg also work (e.g. straight from Windows Voice Recorder or a phone)
  const load = async (n) => {
    for (const ext of ['mp3', 'm4a', 'wav', 'ogg']) {
      const r = await fetch(`./assets/sounds/${n}.${ext}`).catch(() => null);
      if (r?.ok) { buffers[n] = await ctx.decodeAudioData(await r.arrayBuffer()); return; }
    }
  };
  for (const n of NAMES) load(n).catch(() => {});
  const btn = document.getElementById('sound');
  btn.onclick = () => {
    muted = !muted;
    master.gain.value = muted ? 0 : 0.8;
    btn.textContent = muted ? '🔇' : '🔊';
  };
}

function playBuffer(buf, vol = 1, loop = false) {
  const src = ctx.createBufferSource();
  const g = ctx.createGain();
  src.buffer = buf; src.loop = loop; g.gain.value = vol;
  src.connect(g).connect(master); src.start();
  return { src, g };
}

function tone(freq, dur, type = 'sine', vol = 0.2, slideTo = null) {
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
}

function noise(dur, vol = 0.2, from = 1200, to = 200) {
  const t = ctx.currentTime;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass';
  f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master); src.start(t);
}

/** Breath-like noise: band-passed, with its own attack and release (sniffs, shaky exhales). */
function breath(dur, vol, freq, q = 1, attack = 0.03) {
  const t = ctx.currentTime;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master); src.start(t);
}

const SYNTH = {
  click: () => tone(880, 0.08, 'triangle', 0.08),
  whoosh: () => noise(0.9, 0.25, 3000, 150),
  hit: () => { noise(0.4, 0.5, 900, 60); tone(90, 0.4, 'sine', 0.3, 40); },
  shutter: () => { noise(0.05, 0.4, 6000, 3000); setTimeout(() => noise(0.06, 0.3, 5000, 2000), 90); },
  chime: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 1.6, 'sine', 0.09), i * 140)),
  launch: () => { noise(3.5, 0.5, 400, 60); tone(60, 3.5, 'sawtooth', 0.05, 30); },
  alarm: () => [0, 1, 2].forEach((i) => setTimeout(() => tone(740, 0.25, 'square', 0.04, 520), i * 380)),
  box: () => { tone(220, 0.5, 'triangle', 0.12, 180); noise(0.3, 0.1, 800, 200); },
  // placeholder human crying: two quick nasal sniffs, then a shaky, broken exhale (no tones: tones sound robotic)
  cry: () => {
    breath(0.13, 0.22, 2600, 1.6, 0.09);
    setTimeout(() => breath(0.18, 0.26, 2300, 1.6, 0.13), 190);
    [0, 140, 300, 430].forEach((d, i) => setTimeout(() => breath(0.2 + i * 0.05, 0.07 - i * 0.012, 650 - i * 60, 0.7, 0.02), 620 + d));
  },
  // the robot's sob: shaky breaths + a broken, falling hum
  sob: () => {
    [0, 170, 330].forEach((d) => setTimeout(() => noise(0.16, 0.08, 1800, 700), d));
    setTimeout(() => { tone(330, 0.5, 'triangle', 0.035, 240); setTimeout(() => tone(300, 0.7, 'triangle', 0.03, 200), 380); }, 560);
  },
};

export function sfx(name) {
  if (!ctx) return;
  if (buffers[name]) playBuffer(buffers[name], 0.9);
  else SYNTH[name]?.();
}

/** Soft ambient pad. mood: 'calm' | 'sad' | 'end' */
export function music(mood = 'calm') {
  if (!ctx) return;
  stopMusic();
  const key = mood === 'end' && buffers.music_end ? 'music_end' : 'music';
  if (buffers[key]) { musicNode = playBuffer(buffers[key], 0.0, true); musicNode.g.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 3); return; }
  const chords = {
    calm: [196.0, 246.9, 293.7, 370.0],
    sad: [174.6, 220.0, 261.6, 329.6],
    end: [146.8, 220.0, 277.2, 349.2],
  }[mood];
  const g = ctx.createGain(); g.gain.value = 0;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
  g.connect(f).connect(master);
  const oscs = chords.flatMap((fr) => [0, 4].map((det) => {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = fr; o.detune.value = det;
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 0.05 + Math.random() * 0.1; lg.gain.value = 3;
    lfo.connect(lg).connect(o.detune); lfo.start();
    o.connect(g); o.start(); return o;
  }));
  g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 4);
  musicNode = { g, oscs };
}

export function stopMusic(sec = 2) {
  if (!musicNode || !ctx) return;
  const m = musicNode; musicNode = null;
  m.g.gain.cancelScheduledValues(ctx.currentTime);
  m.g.gain.setValueAtTime(m.g.gain.value, ctx.currentTime);
  m.g.gain.linearRampToValueAtTime(0, ctx.currentTime + sec);
  setTimeout(() => { m.src?.stop(); m.oscs?.forEach((o) => o.stop()); }, sec * 1000 + 100);
}
