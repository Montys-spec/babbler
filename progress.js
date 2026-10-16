// Babbler – learning progress, stored on this device only (localStorage).
//
// Uses a simple "card box" system (Leitner system):
// - Every word you have seen sits in a box from 0 to 5.
// - Swiped right ("gewusst")       → one box up, comes back later.
// - Swiped left ("nicht gewusst")  → back to box 0, comes back today.
// - The box decides how many days until the word is due again.
// Words that were never shown have no entry yet and count as "neu".

const STORAGE_KEY = "babbler-progress-v1";
const DAYS_UNTIL_DUE = [0, 1, 3, 7, 14, 30];  // index = box number
const MAX_BOX = DAYS_UNTIL_DUE.length - 1;
const LEARNED_BOX = 3;  // from box 3 on (known 3× in a row) a word counts as "sicher"

// Shape: { "il pane": { box: 2, due: "2026-10-18" }, ... } – keyed by the Italian word.
let progress = loadProgress();

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (err) {
    return {};  // storage blocked or broken → start fresh, the app still works
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (err) {
    console.warn("Fortschritt konnte nicht gespeichert werden", err);
  }
}

// Today's date as "YYYY-MM-DD" in local time (strings of this form sort correctly).
function dateString(daysFromToday) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  const pad = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

// Record one answer and save immediately.
function recordAnswer(word, knewIt) {
  const entry = progress[word.it];
  const oldBox = entry ? entry.box : 0;  // a new word starts like box 0
  const box = knewIt ? Math.min(oldBox + 1, MAX_BOX) : 0;
  progress[word.it] = { box: box, due: dateString(DAYS_UNTIL_DUE[box]) };
  saveProgress();
}

// "neu", "faellig" (due today or earlier), "spaeter" (seen, not due yet)
function wordStatus(word) {
  const entry = progress[word.it];
  if (!entry) return "neu";
  return entry.due <= dateString(0) ? "faellig" : "spaeter";
}

function isLearned(word) {
  const entry = progress[word.it];
  return Boolean(entry && entry.box >= LEARNED_BOX);
}

// Counts for a list of words, used on the start screen.
function statsFor(list) {
  const stats = { total: list.length, neu: 0, faellig: 0, sicher: 0 };
  for (const word of list) {
    const status = wordStatus(word);
    if (status !== "spaeter") stats[status]++;
    if (isLearned(word)) stats.sicher++;
  }
  return stats;
}

// Pick the words for the next round, most important first:
// 1. due words (lowest box first), 2. new words, 3. if nothing else: the soonest-due words.
// "rank" is the word's position inside its topic, so new words from all topics get mixed.
function pickRound(list, size) {
  const due = [], fresh = [], later = [];
  for (const word of list) {
    const status = wordStatus(word);
    if (status === "faellig") due.push(word);
    else if (status === "neu") fresh.push(word);
    else later.push(word);
  }
  due.sort((a, b) => progress[a.it].box - progress[b.it].box);
  fresh.sort((a, b) => a.rank - b.rank);
  later.sort((a, b) => (progress[a.it].due < progress[b.it].due ? -1 : 1));
  return due.concat(fresh, later).slice(0, size);
}

function resetProgress() {
  progress = {};
  saveProgress();
}
