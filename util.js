// Babbler – small helpers used by all other scripts. Loaded first.

// Shortcut for finding elements by their id in index.html
const $ = (id) => document.getElementById(id);

const SCREENS = ["start", "card", "spot", "done"];

// Show one screen and hide all others.
function showScreen(name) {
  for (const screen of SCREENS) {
    $("screen-" + screen).classList.toggle("hidden", screen !== name);
  }
  window.scrollTo(0, 0);
}

// A random whole number from min to max (both included).
function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// Returns a shuffled copy of the list (Fisher–Yates shuffle).
function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
