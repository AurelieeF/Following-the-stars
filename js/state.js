// Shared game state across scenes.
export const state = {
  astronaut: null,   // template model (human)
  robot: null,       // template model (robot)
  build: null,       // ship design chosen in the hangar
  photos: [],        // { label, url, credit } collected along the way
  mission: 1,
};
