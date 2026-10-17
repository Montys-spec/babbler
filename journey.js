// Babbler – "Etappen": progress in small steps, so you always see that you are moving forward.
// Every task you solve counts one step; ETAPPE_SIZE steps complete an Etappe, then the next begins.
// Kept calm on purpose: no points, no badges, no streaks (AGENTS.md: no gamification).
// Stored on this device only.

const JOURNEY_KEY = "babbler-journey-v1";
const ETAPPE_SIZE = 30;  // solved tasks per Etappe (about 3–4 rounds)

// Shape: { steps: 87 } – the total number of solved tasks so far
let journey = loadJourney();

function loadJourney() {
  try {
    const saved = JSON.parse(localStorage.getItem(JOURNEY_KEY));
    if (saved) return saved;
  } catch (err) {
    // fall through and start fresh
  }
  // First start with Etappen: count earlier practice, so it is not lost.
  // Every box a card has climbed stands for one right answer (see progress.js).
  const earlier = { steps: Object.values(progress).reduce((sum, entry) => sum + entry.box, 0) };
  saveJourney(earlier);
  return earlier;
}

function saveJourney(data) {
  try {
    localStorage.setItem(JOURNEY_KEY, JSON.stringify(data));
  } catch (err) {
    // not saved – the app still works
  }
}

// One solved task.
function addStep() {
  journey.steps++;
  saveJourney(journey);
}

// { number: 3, done: 18, size: 30 } – the current Etappe and how far into it you are
function etappeInfo() {
  return {
    number: Math.floor(journey.steps / ETAPPE_SIZE) + 1,
    done: journey.steps % ETAPPE_SIZE,
    size: ETAPPE_SIZE,
  };
}

function resetJourney() {
  journey = { steps: 0 };
  saveJourney(journey);
}
