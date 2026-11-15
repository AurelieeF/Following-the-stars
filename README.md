# Tu me trouveras dans les étoiles / You will find me in the stars

**Team AuFX** — NASA Space Apps Challenge 2026, challenge *Space Mission Design Game*.

A short, story-driven 3D browser game. The last human on Earth leaves his robot at home and takes his mother's ship into space. The player designs the ship (engine, fuel, shielding, power, tether) within a budget and mass limit, then lives with those choices during the flight, the spacewalk and the Moon landing. Each mission ends with a **real NASA photo**.

## Play
Open `index.html` through any static web server (ES modules don't load from `file://`).

```bash
npx serve .          # or: python3 -m http.server
```

Dev shortcut: `index.html?scene=hangar` jumps to a scene (`title`, `home`, `hangar`, `flight`, `satellite`, `moon`, `ending`).

## Deploy (Vercel)
No build step. Import the repo in Vercel → Framework preset **Other** → leave Build Command empty → Output Directory `.` → Deploy.

## Project structure
```
index.html            entry page (import map for Three.js)
style.css             all UI styles
js/
  main.js             boot: loads the characters, starts the first scene
  engine.js           renderer, bloom, scene switching, dialogue/captions/photo UI
  text.js             THE SCRIPT — every line of text, French and English
  missions.js         ship parts and mission data (costs, masses, needs)
  models.js           procedural 3D models (astronaut, robot, ship, satellite, planets…)
  nasa.js             NASA EPIC + NASA Image Library API calls (with offline fallback)
  audio.js            sound effects + music (drop mp3 files in assets/sounds/ to replace)
  state.js            shared game state
  scenes/             title, home, hangar, flight, satellite, moon, ending
assets/
  astronaut.glb       (optional) Blender astronaut — used instead of the built-in one if present
  sounds/*.mp3        (optional) sob, music, music_end, click, whoosh, hit, shutter, chime, launch, alarm, box
vendor/three/         Three.js r160 + the few add-ons used (MIT license)
```

## NASA data used
- **EPIC (Earth Polychromatic Imaging Camera) on DSCOVR** — https://epic.gsfc.nasa.gov — the satellite photo in mission 1 and the "pick a date" Earth photo on the end screen.
- **NASA Image and Video Library** — https://images.nasa.gov — the Apollo 8 *Earthrise* photo in mission 2.
- `assets/earthrise.jpg` is a copy of that photo (AS08-14-2383, public domain): the NASA image servers don't send CORS headers, so the 3D polaroid needs a local copy. EPIC photos become textures through `api.nasa.gov` (`NASA_KEY` in `js/nasa.js`; `DEMO_KEY` is rate-limited — a free key from https://api.nasa.gov lifts the limit).

## Credits
See `AI_USAGE.md` for what was made by hand and what was made with AI tools.
Three.js © three.js authors, MIT license.
