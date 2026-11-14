// Real NASA open data used by the game.
//  - EPIC (DSCOVR satellite): full-disk photos of Earth, almost every day since 2015.
//    https://epic.gsfc.nasa.gov  (API: /api/natural, /api/natural/date/YYYY-MM-DD)
//  - NASA Image and Video Library: https://images.nasa.gov (API: images-api.nasa.gov)
// If the network blocks these (e.g. a sandboxed preview), the game falls back to a
// locally drawn picture and says so in the credit line.

import { t, getLang } from './text.js';

const EPIC = 'https://epic.gsfc.nasa.gov';

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

function epicUrl(item) {
  const [d] = item.date.split(' ');
  const [y, m, dd] = d.split('-');
  return `${EPIC}/archive/natural/${y}/${m}/${dd}/jpg/${item.image}.jpg`;
}

const fmt = (d) => new Date(d.replace(' ', 'T') + 'Z').toLocaleDateString(getLang() === 'fr' ? 'fr-CA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });

/** Latest EPIC Earth photo, or the one for a given date (YYYY-MM-DD). */
export async function epicPhoto(date = null) {
  try {
    const list = await getJSON(date ? `${EPIC}/api/natural/date/${date}` : `${EPIC}/api/natural`);
    if (!list.length) throw new Error('empty');
    const item = list[Math.floor(list.length / 2)];
    const url = await loadImg(epicUrl(item));
    return { url, label: t('photo_earth_on', { date: fmt(item.date) }), credit: t('credit_epic'), real: true };
  } catch {
    return null;
  }
}

/** A real NASA library photo (default: Earthrise, seen from the Moon by Apollo 8). */
export async function libraryPhoto(query = 'earthrise apollo 8') {
  try {
    const data = await getJSON(`https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image`);
    const item = data.collection.items.find((i) => i.links?.[0]?.href);
    const url = await loadImg(item.links[0].href.replace(/~thumb\.jpg$/, '~medium.jpg')).catch(() => loadImg(item.links[0].href));
    const d = item.data[0];
    return { url, label: d.title, credit: t('credit_lib', { id: d.nasa_id }), real: true };
  } catch {
    if (query === 'earthrise apollo 8') {
      // direct link to the Apollo 8 "Earthrise" photo, in case the search API is down
      const url = 'https://images-assets.nasa.gov/image/as08-14-2383/as08-14-2383~medium.jpg';
      try { await loadImg(url); return { url, label: 'Earthrise — Apollo 8', credit: t('credit_lib', { id: 'as08-14-2383' }), real: true }; } catch { /* offline */ }
    }
    return null;
  }
}
