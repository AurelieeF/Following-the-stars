// Arcade, after the story (and from the title screen): a gallery of real NASA photos
// and a memory game where each pair you find teaches one fact.
import { html } from './engine.js';
import { state } from './state.js';
import { t, getLang } from './text.js';
import { sfx } from './audio.js';

// Real NASA photos (NASA Image and Video Library, public domain). Facts in plain words, FR + EN.
const NASA = [
  { id: 'as08-14-2383', url: 'https://images-assets.nasa.gov/image/as08-14-2383/as08-14-2383~medium.jpg',
    fr: ['Earthrise · Apollo 8, 1968', 'Les premiers humains à faire le tour de la Lune. C’est l’astronaute Bill Anders qui a pris cette photo.'],
    en: ['Earthrise · Apollo 8, 1968', 'The first humans to fly around the Moon. Astronaut Bill Anders took this photo.'] },
  { id: 'as17-148-22727', url: 'https://images-assets.nasa.gov/image/as17-148-22727/as17-148-22727~medium.jpg',
    fr: ['La Bille bleue · Apollo 17, 1972', 'La Terre entière, prise par l’équipage d’Apollo 17 en route vers la Lune.'],
    en: ['The Blue Marble · Apollo 17, 1972', 'The whole Earth, taken by the Apollo 17 crew on their way to the Moon.'] },
  { id: 'as11-40-5903', url: 'https://images-assets.nasa.gov/image/as11-40-5903/as11-40-5903~medium.jpg',
    fr: ['Buzz Aldrin sur la Lune · Apollo 11, 1969', 'Le premier alunissage. Sur la Lune, il n’y a pas de vent : leurs traces de pas y sont encore.'],
    en: ['Buzz Aldrin on the Moon · Apollo 11, 1969', 'The first Moon landing. There is no wind on the Moon, so their footprints are still there.'] },
  { id: 'PIA00452', url: 'https://images-assets.nasa.gov/image/PIA00452/PIA00452~thumb.jpg',
    fr: ['Le Point bleu pâle · Voyager 1, 1990', 'Le petit point dans le rayon de lumière, c’est la Terre, vue à environ 6 milliards de km.'],
    en: ['Pale Blue Dot · Voyager 1, 1990', 'The tiny dot in the ray of light is Earth, seen from about 6 billion km away.'] },
  { id: 'PIA17474', url: 'https://images-assets.nasa.gov/image/PIA17474/PIA17474~medium.jpg',
    fr: ['Saturne · Cassini', 'La sonde Cassini a étudié Saturne et ses anneaux pendant 13 ans, de 2004 à 2017.'],
    en: ['Saturn · Cassini', 'The Cassini probe studied Saturn and its rings for 13 years, from 2004 to 2017.'] },
  { id: 'PIA22946', url: 'https://images-assets.nasa.gov/image/PIA22946/PIA22946~medium.jpg',
    fr: ['Jupiter · Juno', 'Jupiter est si grosse que plus de 1 000 Terres pourraient tenir dedans.'],
    en: ['Jupiter · Juno', 'Jupiter is so big that more than 1,000 Earths could fit inside it.'] },
  { id: 'PIA24420', url: 'https://images-assets.nasa.gov/image/PIA24420/PIA24420~medium.jpg',
    fr: ['Dunes givrées de Mars', 'En hiver sur Mars, du givre de glace carbonique (de la « glace sèche ») recouvre les dunes.'],
    en: ['Frosty dunes on Mars', 'In winter on Mars, frost made of carbon dioxide ice (“dry ice”) covers the dunes.'] },
  { id: 'PIA03149', url: 'https://images-assets.nasa.gov/image/PIA03149/PIA03149~medium.jpg',
    fr: ['Une protubérance du Soleil · SOHO', 'Le Soleil projette parfois d’énormes jets de matière. Ce sont ces radiations que ton blindage arrête dans le jeu.'],
    en: ['A solar prominence · SOHO', 'The Sun sometimes throws out huge jets of material. That is the radiation your shielding stops in the game.'] },
];
const info = (p) => p[getLang() === 'fr' ? 'fr' : 'en'];

function frame(title, body) {
  const el = html(`<div class="end arcade"><div class="a-box">
    <div class="a-head"><h2>${title}</h2><button class="btn ghost a-close">${t('arc_close')}</button></div>
    ${body}</div></div>`);
  el.querySelector('.a-close').onclick = () => { sfx('click'); el.remove(); };
  return el;
}

/** Your photos from the story + the NASA collection, with a line on each. */
export function openGallery() {
  const mine = (state.photos || []).map((p) => `<figure><img src="${p.url}" alt="${p.label}" onerror="this.src='${p.fallback || ''}'"><figcaption><b>${p.label}</b><span>${t('arc_yours')}</span></figcaption></figure>`).join('');
  const nasa = NASA.map((p) => `<figure><img src="${p.url}" alt="${info(p)[0]}" loading="lazy"><figcaption><b>${info(p)[0]}</b><span>${info(p)[1]}</span></figcaption></figure>`).join('');
  frame(t('arc_gallery'), `
    ${mine ? `<h3>${t('arc_mine')}</h3><div class="a-grid">${mine}</div>` : ''}
    <h3>${t('arc_nasa')}</h3><div class="a-grid">${nasa}</div>
    <p class="a-note">${t('arc_credit')}</p>`);
}

/** Memory: 6 pairs of NASA photos. Each pair found shows its fact. */
export function openMemory() {
  const pick = [...NASA].sort(() => Math.random() - 0.5).slice(0, 6);
  const cards = [...pick, ...pick].sort(() => Math.random() - 0.5);
  const el = frame(t('arc_memory'), `
    <p class="a-sub">${t('arc_memory_how')}</p>
    <div class="m-grid">${cards.map((p, i) => `<button class="m-card" data-i="${i}" data-id="${p.id}" aria-label="${t('arc_card')}">
      <span class="m-back">✦</span><img src="${p.url}" alt="${info(p)[0]}"></button>`).join('')}</div>
    <div class="m-fact">${t('arc_memory_start')}</div>
    <div class="m-stats"></div>`);
  let open = [], found = 0, moves = 0, busy = false;
  const fact = el.querySelector('.m-fact'), stats = el.querySelector('.m-stats');
  const show = () => (stats.textContent = t('arc_moves', { n: moves, found, total: pick.length }));
  show();
  el.querySelectorAll('.m-card').forEach((c) => (c.onclick = () => {
    if (busy || c.classList.contains('up')) return;
    c.classList.add('up'); sfx('click'); open.push(c);
    if (open.length < 2) return;
    moves++;
    const [a, b] = open; open = [];
    if (a.dataset.id === b.dataset.id) {
      found++; a.classList.add('done'); b.classList.add('done'); sfx('chime');
      const p = NASA.find((x) => x.id === a.dataset.id);
      fact.innerHTML = `<b>${info(p)[0]}</b><br>${info(p)[1]}`;
      if (found === pick.length) fact.innerHTML += `<br><br><b>${t('arc_win', { n: moves })}</b>`;
    } else {
      busy = true;
      setTimeout(() => { a.classList.remove('up'); b.classList.remove('up'); busy = false; }, 900);
    }
    show();
  }));
}

/** The two arcade buttons, for the end screen and the title screen. */
export function arcadeButtons() {
  return `<div class="a-buttons"><button class="btn ghost b-gallery">${t('arc_gallery')}</button><button class="btn ghost b-memory">${t('arc_memory')}</button></div>`;
}
export function wireArcade(root) {
  root.querySelector('.b-gallery').onclick = () => { sfx('click'); openGallery(); };
  root.querySelector('.b-memory').onclick = () => { sfx('click'); openMemory(); };
}
