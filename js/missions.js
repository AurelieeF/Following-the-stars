// Mission design data. Each part trades money and mass against what it protects.
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
    { id: 'sun', label: 'o_sun', cost: 10, mass: 1, battery: false },
    { id: 'bat', label: 'o_bat', cost: 20, mass: 2, battery: true },
  ] },
  cable: { name: 'p_cable', opts: [
    { id: 'short', label: 'o_short', cost: 5, mass: 0.5, tries: 2 },
    { id: 'long', label: 'o_long', cost: 10, mass: 1, tries: 4 },
  ] },
};
export const BASE_MASS = 3;

export const MISSIONS = {
  1: {
    title: 'm1_title', goal: 'm1_goal',
    budget: 70, rangeNeeded: 1,   // can't have shield + battery + long tether all at once
    flight: { seconds: 32, rate: 1.0, events: ['flare', 'eclipse'] },
  },
  2: {
    title: 'm2_title', goal: 'm2_goal',
    budget: 90, rangeNeeded: 2,   // the big engine fits only if you drop what the Moon doesn't need
    flight: { seconds: 38, rate: 1.5, events: ['flare', 'blackout'] },
  },
};

export function evaluate(choice, mission) {
  const p = Object.fromEntries(Object.entries(PARTS).map(([k, v]) => [k, v.opts.find((o) => o.id === choice[k])]));
  const cost = Object.values(p).reduce((s, o) => s + o.cost, 0);
  const mass = BASE_MASS + Object.values(p).reduce((s, o) => s + o.mass, 0);
  const m = MISSIONS[mission];
  return {
    p, cost, mass, lift: p.engine.lift,
    overBudget: cost > m.budget,
    tooHeavy: mass > p.engine.lift,
    shortRange: p.fuel.range < m.rangeNeeded,
    lives: p.shield.lives, boosts: p.fuel.range + 1, battery: p.power.battery, tries: p.cable.tries,
    shieldLevel: p.shield.id,
  };
}
