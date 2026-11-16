# Space Apps 2026 — project submission text (English)

Copy each section into the matching field of the Project Submission page.
Lines marked **[TO CONFIRM]** must be checked by Aurélie before submitting.

---

## Project name
You Will Find Me in the Stars

## Challenge
Space Mission Design Game

## High-level summary (short)
It's a small 3D game you play in the browser. His mom was an astronaut, and since she left for the stars he lives alone with his little robot. She left him her ship, so he goes on the trip they always promised each other, to bring back photos of Earth from up there. You build the ship yourself, and you have to stay under budget, under the launcher's weight limit and within your power supply. Then you fly it and see what your choices did. There are two missions: fixing his mom's old satellite, then landing on the Moon, where she said they would walk together one day. Each one ends with a real NASA photo of Earth: today's Earth from DSCOVR/EPIC, and Apollo 8's *Earthrise*.

## Project details
**What it does**

You pick 7 parts for the ship: launcher, fuel, shielding, power, a science instrument, an antenna and a tether for the spacewalk. Every part costs money and adds weight, and the instrument and antenna use power. Bars on the side show your budget, weight, power, how much of your data will actually reach Earth, and whether you have enough fuel to get there.

You can't have everything. The best science needs the big antenna (or half your data never makes it home) and extra solar panels to run both. The only way that fits the budget is flying with no shield. So it's science or safety, and it's up to you.

Then you fly what you built:
- a solar flare hurts you if you skipped the shield
- in Earth's shadow the solar panels stop, so without a battery the engines slow down
- meteoroids: more shielding means you can take more hits
- on the spacewalk, a longer tether gives you more tries to grab the satellite
- behind the Moon you lose the radio no matter what, like Apollo 8 did in 1968

If the ship is too heavy, runs out of fuel or doesn't have enough power, the ship's computer tells you why, and you go back and change it.

After each mission you get a score out of 100 and a short report. Each line is one of your choices and what it did, for example: "The instrument made more data than the antenna could send: some science stayed on board." There's no single right answer, so it's worth playing again with a different ship.

Up to 4 people can play together on one screen. Each player gets a role (mission lead, engineering, science, communications) and is in charge of some of the parts, and the ship can't launch until everyone agrees.

Each part also has a one-line note explaining why it matters in real life, and each mission report ends with a "Did you know?" fact. The game is in French and English.

There's also a little arcade, on the title screen and after the ending: a gallery of famous NASA photos (Earthrise, the Blue Marble, Pale Blue Dot, Saturn, Jupiter, Mars, the Sun…) with your own photos from the journey, and a memory game where every pair you find teaches you one fact.

**Why I made it**

When you read about mission design, budget vs. weight vs. power is just a table. I wanted people to feel it. If you care about the guy and his robot, you care about getting the ship right.

**How I built it**

Three.js for the 3D, plain JavaScript, no build step. It runs as a static website.

**What's next**

Choosing an orbit and a launch window, more instruments, online team play and a sandbox mode.

## NASA data
- **EPIC / DSCOVR** (https://epic.gsfc.nasa.gov, and https://api.nasa.gov): when you fix the satellite in mission 1, it sends back the latest real photo of the whole Earth. On the last screen you can pick any date since 2015 and see the real Earth on that day.
- **NASA Image and Video Library** (https://images.nasa.gov): Apollo 8's *Earthrise*, AS08-14-2383 (December 24, 1968). It's the photo he takes from the Moon.
- The mission design side was inspired by the challenge resources, especially the launch / space / ground segments and the idea of trade studies from NASA's Mission Design Lab.

## Space Agency partner data
None.

## References
- Three.js r160 — https://threejs.org (MIT license)
- Google Fonts: Cormorant Garamond, Nunito (SIL Open Font License)
- NASA EPIC — https://epic.gsfc.nasa.gov · https://api.nasa.gov
- NASA Image and Video Library — https://images.nasa.gov — AS08-14-2383 "Earthrise" (public domain)
- Sounds: the crying is my own recording; all other sounds and the music are generated in code (Web Audio API)
- Astronaut design and renders: Aurélie, in Blender

## Use of Artificial Intelligence
I wrote the base code and came up with the story, the characters and the game design, and I used Blender for the astronaut renders. AI (Claude) supported me along the way: it helped fix and clean up my code, add comments, smooth out the animations, and build some of the features I asked for after playtesting. It also helped me write the French and English dialogue from my story.

The NASA photos in the game are real NASA data.

## Demo
Choose ONE: a video of max **30 seconds** (English, or English subtitles) or a slide deck of max **7 slides**.
- Demo link: **[TO ADD]**
- Playable game: https://following-the-stars.vercel.app/
- Code: https://github.com/AurelieeF/Following-the-stars
