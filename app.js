// Babbler – flashcard logic.
// Loads the word list, picks a random round of words, and steps through them.
// For each card: tap to reveal, then swipe right (knew it) or left (didn't).

const VOCAB_FILE = "data/vocab.json";
const ROUND_SIZE = 10;  // words per round

let words = [];        // all words from the JSON file
let deck = [];         // the words of the current round
let position = 0;      // index of the current card in the deck
let revealed = false;  // has the German side of the current card been shown?
let known = [];        // words swiped right this round
let missed = [];       // words swiped left this round

// Shortcut for finding elements by their id in index.html
const $ = (id) => document.getElementById(id);

// Show one screen and hide the other two.
function showScreen(name) {
  for (const screen of ["start", "card", "done"]) {
    $("screen-" + screen).classList.toggle("hidden", screen !== name);
  }
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

// The swipe gesture; answer() runs once the card has flown off screen.
const swiper = makeSwipeable($("card"), {
  canSwipe: () => revealed,
  onSwipe: (direction) => answer(direction === "right"),
});

// Start a round with up to ROUND_SIZE random words from the given list.
function startRound(list) {
  deck = shuffle(list).slice(0, ROUND_SIZE);
  position = 0;
  known = [];
  missed = [];
  showScreen("card");
  showCard();
}

// Fill the card with the current word, German side still covered.
function showCard() {
  const word = deck[position];
  revealed = false;
  $("counter").textContent = (position + 1) + " / " + deck.length;
  $("progress-bar").style.width = (position / deck.length) * 100 + "%";
  $("card-cat").textContent = word.cat || "";
  $("word-it").textContent = word.it;
  $("word-de").textContent = word.de;
  $("card").classList.remove("revealed");
  $("answer-buttons").classList.add("inactive");
  swiper.reset();
}

// Uncover the German translation and allow swiping.
function reveal() {
  if (revealed) return;
  revealed = true;
  $("card").classList.add("revealed");
  $("answer-buttons").classList.remove("inactive");
}

// Record the answer and move on to the next card (or the result screen).
function answer(knewIt) {
  (knewIt ? known : missed).push(deck[position]);
  position++;
  if (position < deck.length) {
    showCard();
  } else {
    showResult();
  }
}

function showResult() {
  $("progress-bar").style.width = "100%";
  $("score-num").textContent = known.length + " / " + deck.length;

  // List the words that were swiped left.
  const list = $("missed-list");
  list.innerHTML = "";
  for (const word of missed) {
    const item = document.createElement("li");
    const it = document.createElement("strong");
    it.textContent = word.it;
    item.append(it, " – " + word.de);
    list.append(item);
  }
  $("missed-box").classList.toggle("hidden", missed.length === 0);
  $("btn-repeat").classList.toggle("hidden", missed.length === 0);
  $("btn-repeat").textContent = "Fehler wiederholen (" + missed.length + ")";
  showScreen("done");
}

// Load the word list. The start button stays disabled until it has loaded.
async function loadWords() {
  $("btn-start").disabled = true;
  try {
    const response = await fetch(VOCAB_FILE);
    if (!response.ok) throw new Error("HTTP " + response.status);
    words = await response.json();
    if (!Array.isArray(words) || words.length === 0) throw new Error("leere Liste");
    $("word-count").textContent =
      words.length + " Vokabeln · " + Math.min(ROUND_SIZE, words.length) + " pro Runde";
    $("btn-start").disabled = false;
  } catch (err) {
    // Usually happens when index.html is opened directly instead of via start.command.
    $("error").textContent =
      "Die Vokabeln konnten nicht geladen werden. Bitte die App über start.command starten.";
    $("error").classList.remove("hidden");
    console.error(err);
  }
}

// Only treat a click as "reveal" – after revealing, the card is swiped instead.
$("card").addEventListener("click", reveal);
$("btn-yes").addEventListener("click", () => swiper.fly("right"));
$("btn-no").addEventListener("click", () => swiper.fly("left"));
$("btn-start").addEventListener("click", () => startRound(words));
$("btn-again").addEventListener("click", () => startRound(words));
$("btn-repeat").addEventListener("click", () => startRound(missed));
$("btn-home").addEventListener("click", () => showScreen("start"));
$("btn-quit").addEventListener("click", () => showScreen("start"));

// Keyboard (desktop): Space/Enter reveals, arrow keys answer.
document.addEventListener("keydown", (e) => {
  if ($("screen-card").classList.contains("hidden")) return;
  if (!revealed && (e.key === " " || e.key === "Enter")) {
    e.preventDefault();
    reveal();
  } else if (revealed && e.key === "ArrowRight") {
    swiper.fly("right");
  } else if (revealed && e.key === "ArrowLeft") {
    swiper.fly("left");
  }
});

loadWords();
