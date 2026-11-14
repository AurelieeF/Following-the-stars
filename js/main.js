import { go } from './engine.js';
import { loadAstronaut, makeRobot } from './models.js';
import { state } from './state.js';

state.astronaut = await loadAstronaut();
state.robot = makeRobot();

// Dev shortcut: index.html?scene=moon jumps straight to a scene.
const pick = new URLSearchParams(location.search).get('scene') || 'title';
const mod = await import(`./scenes/${pick}.js`);
go(mod.default, { fadeOut: 10 });
