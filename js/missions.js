// Mission design data. Each part trades money, mass and power against what it protects or enables.
export const PARTS = {
  engine: { name: 'p_engine', opts: [
    { id: 's', label: 'o_small', cost: 15, mass: 1, lift: 9 },
    { id: 'm', label: 'o_medium', cost: 30, mass: 2, lift: 14 },
    { id: 'l', label: 'o_big', cost: 45, mass: 3, lift: 20 },
  ] },
  fuel: { name: 'p_fuel', opts: [
    { id: 1, label: '40 %', cost: 5, mass: 2, range: 1 },
    { id: 2, label: '60 %', cost: 10, mass: 4, range: 2 },
    { id: 3, label: '80 %', cost: 15, mass: 6, range: 3 },
  ] },
  shield: { name: 'p_shield', opts: [
    { id: 0, label: 'o_none', cost: 0, mass: 0, lives: 1 },
    { id: 1, label: 'o_light', cost: 10, mass: 2, lives: 2 },
    { id: 2, label: 'o_heavy', cost: 20, mass: 4, lives: 3 },
  ] },
  power: { name: 'p_power', opts: [
    { id: 'sun', label: 'o_sun', cost: 10, mass: 1, supply: 3, battery: false },
    { id: 'bat', label: 'o_bat', cost: 20, mass: 2, supply: 4, battery: true },
    { id: 'big', label: 'o_bigpow', cost: 30, mass: 3, supply: 5, battery: true },
  ] },
  instrument: { name: 'p_instrument', opts: [
    { id: 'cam', label: 'o_cam', cost: 5, mass: 0.5, draw: 1, science: 1, data: 1 },
    { id: 'hd', label: 'o_hd', cost: 15, mass: 1.5, draw: 2, science: 2, data: 2 },
  ] },
  comms: { name: 'p_comms', opts: [
    { id: 'low', label: 'o_ant_low', cost: 5, mass: 0.5, draw: 1, rate: 1 },
    { id: 'high', label: 'o_ant_high', cost: 15, mass: 1.5, draw: 2, rate: 2 },
  ] },
  cable: { name: 'p_cable', opts: [
    { id: 'short', label: 'o_short', cost: 5, mass: 0.5, tries: 2 },
    { id: 'long', label: 'o_long', cost: 10, mass: 1, tries: 4 },
  ] },
};
export const BASE_MASS = 3;
export const BASE_DRAW = 1;   // computer, heaters, attitude control: always on

export const MISSIONS = {
  1: {
    title: 'm1_title', goal: 'm1_goal',
    budget: 100, rangeNeeded: 1,   // top science only fits if you fly with no shielding
    flight: { seconds: 32, rate: 1.0, events: ['flare', 'eclipse'] },
  },
  2: {
    title: 'm2_title', goal: 'm2_goal',
    budget: 120, rangeNeeded: 2,   // same dilemma, further away: science or safety
    flight: { seconds: 38, rate: 1.5, events: ['flare', 'blackout'] },
  },
};

export function evaluate(choice, mission) {
  const p = Object.fromEntries(Object.entries(PARTS).map(([k, v]) => [k, v.opts.find((o) => o.id === choice[k])]));
  const cost = Object.values(p).reduce((s, o) => s + o.cost, 0);
  const mass = BASE_MASS + Object.values(p).reduce((s, o) => s + o.mass, 0);
  const m = MISSIONS[mission];
  const draw = BASE_DRAW + p.instrument.draw + p.comms.draw;
  // a better instrument makes more data; the antenna decides how much of it reaches Earth
  const sent = Math.min(1, p.comms.rate / p.instrument.data);
  return {
    p, cost, mass, lift: p.engine.lift, draw, supply: p.power.supply,
    noPower: draw > p.power.supply,
    science: p.instrument.science * sent, sent,
    overBudget: cost > m.budget,
    tooHeavy: mass > p.engine.lift,
    shortRange: p.fuel.range < m.rangeNeeded,
    lives: p.shield.lives, boosts: p.fuel.range + 1, battery: p.power.battery, tries: p.cable.tries,
    shieldLevel: p.shield.id,
  };
}

// Starting design in the hangar, and the one used when a scene is opened directly (?scene=…).
export const START_CHOICE = { engine: 's', fuel: 1, shield: 0, power: 'sun', instrument: 'cam', comms: 'low', cable: 'short' };
export const DEV_CHOICE = { engine: 'm', fuel: 1, shield: 1, power: 'bat', instrument: 'cam', comms: 'low', cable: 'long' };

// Team mode: each role owns some parts; with fewer than 4 players, roles are shared out in turn.
export const ROLES = [
  { id: 'lead', parts: ['engine', 'fuel'] },
  { id: 'eng', parts: ['shield', 'power'] },
  { id: 'sci', parts: ['instrument'] },
  { id: 'com', parts: ['comms', 'cable'] },
];
export const playerFor = (part, players) => (ROLES.findIndex((r) => r.parts.includes(part)) % players) + 1;
