# Space Apps 2026 — project submission text (English)

Copy each section into the matching field of the Project Submission page.
Lines marked **[TO CONFIRM]** must be checked by Lily before submitting.

---

## Project name
You Will Find Me in the Stars

## Challenge
Space Mission Design Game

## High-level summary (short)
A story-driven 3D browser game where the last human on Earth prepares his late mother's spaceship for two missions — recovering a satellite's last photo of Earth, then landing on the Moon. Players design the spacecraft under real constraints (budget, mass vs. launcher capacity, power, data rate, range), live with the consequences during the flight and spacewalk, and get a mission report explaining *why* each choice mattered. Every mission ends with a real NASA photo: today's Earth from DSCOVR/EPIC, and Apollo 8's *Earthrise*.

## Project details
**What it does**
- **Design**: 7 subsystems — launcher, fuel, shielding, power, scientific instrument, antenna, EVA tether. Each has a cost, a mass and (for devices) a power draw. Live gauges show budget, mass / launcher capacity, power needed / produced, share of data sent to Earth, and range.
- **Trade-offs with no single right answer**: the best science (HD camera + spectrometer) needs a large antenna to send its data and extra solar panels to power both — which only fits in the budget if you fly without shielding. Science or safety: the player decides.
- **Simulate**: a flight where every choice has a consequence — solar flares (shielding), Earth's shadow (battery), meteoroids (shield integrity), radio blackout behind the Moon (as Apollo 8 experienced), then a tethered spacewalk (tether length = number of tries).
- **Fail and iterate**: too heavy for the launcher, not enough fuel, not enough power or over budget — the ship computer explains the problem in plain words and the player redesigns.
- **Mission report**: a score out of 100 per mission (objective, science returned, ship integrity, budget saved, first-try bonus) and one line per decision explaining what happened and why.
- **Team mode (1–4 players, one screen)**: roles (mission lead, engineering, science, communications) own different subsystems; every player must approve the design before launch, so the team has to negotiate.
- **Learning by playing**: under each subsystem, one plain-language sentence explains the real-world reason it matters.
- **Bilingual**: French and English.

**Why it matters**
Mission-design trade-offs are usually taught as abstract tables. Here, students *feel* them: the shielding they dropped to afford a better camera is the reason the solar flare hurt. The story gives them a reason to care about getting it right.

**How we built it**
Three.js (WebGL) with procedural 3D models, plain JavaScript modules, no build step; deployed as a static site.

**What's next**
Orbit and launch-window choices, more instruments with different data rates, online multiplayer, and a sandbox mode.

## NASA data
- **EPIC / DSCOVR** (https://epic.gsfc.nasa.gov, API via https://api.nasa.gov): the photo recovered from the satellite in mission 1 is the latest real full-disk image of Earth; on the end screen players pick any date since 2015 and see the real Earth on that day.
- **NASA Image and Video Library** (https://images.nasa.gov): Apollo 8 *Earthrise*, AS08-14-2383 (24 December 1968), shown when the player photographs Earth from the Moon.
- Mission concepts informed by the challenge resources: the systems-engineering view of launch / space / ground segments, and trade-studies as in NASA's Mission Design Lab.

## Space Agency partner data
None.

## References
- Three.js r160 — https://threejs.org (MIT license)
- Google Fonts: Cormorant Garamond, Nunito (SIL Open Font License)
- NASA EPIC — https://epic.gsfc.nasa.gov · https://api.nasa.gov
- NASA Image and Video Library — https://images.nasa.gov — AS08-14-2383 "Earthrise" (public domain)
- Sounds: **[TO CONFIRM — source of each sound / music file, or "none"]**
- Astronaut design: Blender model by Lily **[TO CONFIRM]**

## Use of Artificial Intelligence
**[TO CONFIRM — check against AI_USAGE.md]**
- Code: written with the help of an AI assistant (Claude, Anthropic), directed, tested and reviewed by the team.
- Game text (French/English dialogue): co-written with Claude from Lily's story, characters and direction; reviewed by Lily.
- Storyboard images and astronaut reference images: generated with an AI image tool **[TO CONFIRM: which tool]**; they carry a visible "AI-generated" watermark.
- Story, characters, emotional arc and all final creative decisions: Lily.
- NASA photos are real NASA data, not AI-generated.
- AI use is also stated in the game's credits.

## Demo
Choose ONE: a video of max **30 seconds** (English, or English subtitles) or a slide deck of max **7 slides**.
- Demo link: **[TO ADD]**
- Playable game: **[TO ADD — Vercel URL]**
- Code: https://github.com/AurelieeF/Following-the-stars
