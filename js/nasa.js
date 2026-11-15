// Real NASA open data used by the game.
//  - EPIC (DSCOVR satellite): full-disk photos of Earth, almost every day since 2015.
//    https://epic.gsfc.nasa.gov  (API: /api/natural, /api/natural/date/YYYY-MM-DD)
//  - NASA Image and Video Library: https://images.nasa.gov (API: images-api.nasa.gov)
// If the network blocks these (e.g. a sandboxed preview), the game falls back to a
// locally drawn picture and says so in the credit line.

import { t, getLang } from './text.js';

const EPIC = 'https://epic.gsfc.nasa.gov';
// api.nasa.gov serves the same EPIC files WITH CORS headers, so they can become 3D textures.
// DEMO_KEY is rate-limited per visitor; a free key from https://api.nasa.gov lifts the limit.
const NASA_KEY = 'DEMO_KEY';

async function getJSON(url, ms = 7000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } finally { clearTimeout(timer); }
}

function loadImg(url, ms = 9000) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    img.onload = () => { clearTimeout(timer); resolve(url); };
    img.onerror = () => { clearTimeout(timer); reject(new Error('img')); };
    img.src = url;
  });
}

function epicPath(item) {
  const [d] = item.date.split(' ');
  const [y, m, dd] = d.split('-');
  return `/archive/natural/${y}/${m}/${dd}/jpg/${item.image}.jpg`;
}

const fmt = (d) => new Date(d.replace(' ', 'T') + 'Z').toLocaleDateString(getLang() === 'fr' ? 'fr-CA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });

/** Latest EPIC Earth photo, or the one for a given date (YYYY-MM-DD). */
export async function epicPhoto(date = null) {
  try {
    const list = await getJSON(date ? `${EPIC}/api/natural/date/${date}` : `${EPIC}/api/natural`);
    if (!list.length) throw new Error('empty');
    const item = list[Math.floor(list.length / 2)];
    const url = await loadImg(EPIC + epicPath(item));
    const tex = `https://api.nasa.gov/EPIC${epicPath(item)}?api_key=${NASA_KEY}`;
    return { url, tex, label: t('photo_earth_on', { date: fmt(item.date) }), credit: t('credit_epic'), real: true };
  } catch {
    return null;
  }
}

/** A real NASA library photo, by its NASA id (default: Apollo 8 "Earthrise", AS08-14-2383).
 *  A copy of Earthrise ships in assets/ so it can be used as a 3D texture (images-assets.nasa.gov has no CORS). */
export async function libraryPhoto(id = 'as08-14-2383') {
  const local = id === 'as08-14-2383' ? './assets/earthrise.jpg' : null;
  const label = local ? t('earthrise') : null;
  try {
    const data = await getJSON(`https://images-api.nasa.gov/search?nasa_id=${encodeURIComponent(id)}`);
    const item = data.collection.items.find((i) => i.links?.[0]?.href);
    const url = await loadImg(item.links[0].href.replace(/~thumb\.jpg$/, '~medium.jpg')).catch(() => loadImg(item.links[0].href));
    return { url, tex: local || url, label: label || item.data[0].title, credit: t('credit_lib', { id }), real: true };
  } catch {
    // search API down: use the copy shipped with the game
    if (local) return { url: local, tex: local, label, credit: t('credit_lib', { id }), real: true };
    return null;
  }
}
