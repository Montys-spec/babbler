// Babbler – screens and round logic.
// Loads the word list, picks the words for a round (see pickRound in progress.js),
// and steps through them. For each card: tap to reveal, then swipe right (knew it)
// or left (didn't). Every answer is saved on the device right away.

const VOCAB_FILE = "data/vocab.json";
const ROUND_SIZE = 10;  // words per round

let words = [];        // all words from the JSON file
let topics = [];       // topic names in file order
let pool = [];         // the words the current round was picked from (all, or one topic)
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
  window.scrollTo(0, 0);
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

// ---------- Start screen ----------

function showStart() {
  const all = statsFor(words);
  $("stat-due").textContent = all.faellig;
  $("stat-new").textContent = all.neu;
  $("stat-learned").textContent = all.sicher + " / " + all.total;
  $("howto").classList.toggle("hidden", all.neu < all.total);  // hide once anything was practised

  // One row per topic: name, progress bar, and how many words are due.
  const list = $("topic-list");
  list.innerHTML = "";
  for (const topic of topics) {
    const topicWords = words.filter((w) => w.cat === topic);
    const s = statsFor(topicWords);
    const row = document.createElement("button");
    row.className = "topic";
    row.innerHTML =
      '<span class="topic-head"><span class="topic-name"></span><span class="topic-count"></span></span>' +
      '<span class="topic-bar"><span class="topic-bar-fill"></span></span>';
    row.querySelector(".topic-name").textContent = topic;
    row.querySelector(".topic-count").textContent =
      (s.faellig ? s.faellig + " fällig · " : "") + s.sicher + " / " + s.total;
    row.querySelector(".topic-bar-fill").style.width = (s.sicher / s.total) * 100 + "%";
    row.addEventListener("click", () => startRound(topicWords));
    list.append(row);
  }
  showScreen("start");
}

// ---------- Rounds ----------

// Start a round with the most important words from the given list.
function startRound(list) {
  pool = list;
  playDeck(pickRound(list, ROUND_SIZE));
}

// Play exactly these words (in random order).
function playDeck(list) {
  deck = shuffle(list);
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
  $("card-cat").textContent = word.cat + (wordStatus(word) === "neu" ? " · neu" : "");
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

// Save the answer and move on to the next card (or the result screen).
function answer(knewIt) {
  const word = deck[position];
  recordAnswer(word, knewIt);
  (knewIt ? known : missed).push(word);
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

// ---------- Loading ----------

// Load the word list. The start button stays disabled until it has loaded.
async function loadWords() {
  $("btn-start").disabled = true;
  try {
    const response = await fetch(VOCAB_FILE);
    if (!response.ok) throw new Error("HTTP " + response.status);
    words = await response.json();
    if (!Array.isArray(words) || words.length === 0) throw new Error("leere Liste");

    // Remember each word's position inside its topic (used to mix new words fairly).
    const seen = {};
    for (const word of words) {
      seen[word.cat] = (seen[word.cat] || 0) + 1;
      word.rank = seen[word.cat];
    }
    topics = Object.keys(seen);

    $("word-count").textContent =
      words.length + " Vokabeln in " + topics.length + " Themen · " + ROUND_SIZE + " pro Runde";
    $("btn-start").disabled = false;
    showStart();
  } catch (err) {
    // Usually happens when index.html is opened directly instead of via start.command.
    $("error").textContent =
      "Die Vokabeln konnten nicht geladen werden. Bitte die App über start.command starten.";
    $("error").classList.remove("hidden");
    console.error(err);
  }
}

// ---------- Buttons & keys ----------

// Only treat a click as "reveal" – after revealing, the card is swiped instead.
$("card").addEventListener("click", reveal);
$("btn-yes").addEventListener("click", () => swiper.fly("right"));
$("btn-no").addEventListener("click", () => swiper.fly("left"));
$("btn-start").addEventListener("click", () => startRound(words));
$("btn-again").addEventListener("click", () => startRound(pool));
$("btn-repeat").addEventListener("click", () => playDeck(missed));
$("btn-home").addEventListener("click", showStart);
$("btn-quit").addEventListener("click", showStart);
$("btn-reset").addEventListener("click", () => {
  if (confirm("Den gesamten Lernfortschritt löschen?")) {
    resetProgress();
    showStart();
  }
});

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
