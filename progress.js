// Babbler – learning progress, stored on this device only (localStorage).
//
// Uses a simple "card box" system (Leitner system):
// - Every card you have practised sits in a box from 0 to 5.
// - Swiped right ("gewusst")       → one box up, comes back later.
// - Swiped left ("nicht gewusst")  → back to box 0, comes back today.
// - The box decides how many days until the card is due again.
// Cards that were never shown have no entry yet and count as "neu".
// What a "card" is (word or sentence, which direction) is defined in cards.js.

const STORAGE_KEY = "babbler-progress-v1";
const DAYS_UNTIL_DUE = [0, 1, 3, 7, 14, 30];  // index = box number
const MAX_BOX = DAYS_UNTIL_DUE.length - 1;
const LEARNED_BOX = 3;  // from box 3 on (known 3× in a row) a card counts as "sicher"

// Shape: { "<card key>": { box: 2, due: "2026-10-18" }, ... }
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

// A date as "YYYY-MM-DD" in local time (strings of this form sort correctly).
function dateString(daysFromToday) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  const pad = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

// Box of a card, or -1 if it was never practised.
function boxOf(key) {
  const entry = progress[key];
  return entry ? entry.box : -1;
}

// Record one answer and save immediately.
function recordAnswer(key, knewIt) {
  const oldBox = Math.max(boxOf(key), 0);  // a new card starts like box 0
  const box = knewIt ? Math.min(oldBox + 1, MAX_BOX) : 0;
  progress[key] = { box: box, due: dateString(DAYS_UNTIL_DUE[box]) };
  saveProgress();
}

// "neu", "faellig" (due today or earlier), "spaeter" (practised, not due yet)
function cardStatus(key) {
  const entry = progress[key];
  if (!entry) return "neu";
  return entry.due <= dateString(0) ? "faellig" : "spaeter";
}

// Pick the cards for the next round, most important first:
// 1. due cards (lowest box first), 2. new cards (easiest level, most useful first),
// 3. if nothing else is left: the cards that are due soonest.
function pickRound(cards, size) {
  const due = [], fresh = [], later = [];
  for (const card of cards) {
    const status = cardStatus(card.key);
    if (status === "faellig") due.push(card);
    else if (status === "neu") fresh.push(card);
    else later.push(card);
  }
  due.sort((a, b) => boxOf(a.key) - boxOf(b.key));
  fresh.sort((a, b) => a.level - b.level || a.rank - b.rank);
  later.sort((a, b) => (progress[a.key].due < progress[b.key].due ? -1 : 1));
  return due.concat(fresh, later).slice(0, size);
}

function resetProgress() {
  progress = {};
  saveProgress();
}
