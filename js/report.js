// Mission report: a score, and a line per decision explaining what it changed and why.
import { MISSIONS } from './missions.js';
import { state } from './state.js';
import { t, num } from './text.js';
import { html } from './engine.js';

/** Fresh event log for a mission (filled by the hangar, flight and spacewalk scenes). */
export function newLog(mission) {
  state.log = { mission, failedLaunches: 0, flights: 0, hits: 0, livesLeft: 0, events: {}, jumps: 0 };
}
export function log() {
  if (!state.log || state.log.mission !== state.mission) newLog(state.mission);
  return state.log;
}

function score(mission) {
  const b = state.build, L = log(), m = MISSIONS[mission];
  const pts = {
    a: 40,                                                         // mission objective reached
    b: Math.round((b.science / 2) * 25),                           // science that made it home
    c: Math.round((Math.max(0, L.livesLeft) / 3) * 15),            // how intact the ship arrived
    d: Math.round(Math.min(1, ((m.budget - b.cost) / m.budget) * 4) * 10), // saving 25 % of the budget = full points
    e: Math.max(0, 10 - 5 * Math.max(0, L.flights - 1) - 3 * L.failedLaunches - 2 * Math.max(0, L.jumps - 1)),
  };
  const total = Object.values(pts).reduce((s, v) => s + v, 0);
  return { pts, total, stars: total >= 85 ? 3 : total >= 65 ? 2 : 1 };
}

function lines(mission) {
  const b = state.build, L = log(), m = MISSIONS[mission], ev = L.events;
  const out = [];
  const gap = b.lift - b.mass;
  out.push(['🚀', t(gap < 1 ? 'rep_launch_tight' : 'rep_launch', { mass: num(b.mass), lift: b.lift, gap: num(gap) })]);
  if (ev.flare) out.push(['☀️', t(ev.flare === 'ok' ? 'rep_flare_ok' : 'rep_flare_hit')]);
  out.push(['🪨', t('rep_rocks', { hits: L.hits, left: Math.max(0, L.livesLeft) })]);
  if (ev.eclipse) out.push(['🌑', t(ev.eclipse === 'ok' ? 'rep_eclipse_ok' : 'rep_eclipse_bad')]);
  if (ev.blackout) out.push(['📡', t('rep_blackout')]);
  out.push(['⚡', t('rep_power', { draw: b.draw, supply: b.supply })]);
  out.push(['🔬', t('rep_science', { inst: t(b.p.instrument.label), ant: t(b.p.comms.label).toLowerCase(), pct: Math.round(b.sent * 100) })]);
  if (b.sent < 1) out.push(['📦', t('rep_science_lost')]);
  if (mission === 1 && L.jumps) out.push(['🪢', t('rep_tether', { used: L.jumps, tries: b.tries })]);
  out.push(['💰', t('rep_budget', { cost: b.cost, budget: m.budget, left: m.budget - b.cost })]);
  const fails = Math.max(0, L.flights - 1) + L.failedLaunches;
  if (fails) out.push(['🔁', t('rep_retries', { n: fails })]);
  return out;
}

/** The report as HTML (used in the overlay and on the end screen). Also stores the score. */
export function reportCard(mission) {
  const s = score(mission);
  state.scores = { ...(state.scores || {}), [mission]: s.total };
  return `<div class="report">
    <div class="r-head"><h2>${t('rep_title', { n: mission })}</h2>
      <div class="r-score">${'★'.repeat(s.stars)}${'☆'.repeat(3 - s.stars)} <b>${s.total}</b>/100</div></div>
    <ul>${lines(mission).map(([i, txt]) => `<li><span>${i}</span>${txt}</li>`).join('')}</ul>
    <div class="r-pts">${t('rep_pts', s.pts)}</div>
    <div class="r-fact">🔭 ${t('fact_' + mission)}</div>
    <div class="r-tip">${t('rep_tip')}</div>
  </div>`;
}

/** Full-screen report with a button; resolves when the player continues. */
export function showReport(mission) {
  return new Promise((resolve) => {
    const el = html(`<div class="end report-wrap">${reportCard(mission)}<button class="btn">${t('rep_next')}</button></div>`);
    el.querySelector('.btn').onclick = () => { el.remove(); resolve(); };
  });
}
