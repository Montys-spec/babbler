// Babbler – flashcard logic.
// Loads the word list, shuffles it, and steps through the cards one by one.

const VOCAB_FILE = "data/vocab.json";

let words = [];    // all words from the JSON file
let deck = [];     // shuffled copy for the current round
let position = 0;  // index of the current card in the deck

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

// Fill the card with the current word, German side still covered.
function showCard() {
  const word = deck[position];
  $("counter").textContent = (position + 1) + " / " + deck.length;
  $("word-it").textContent = word.it;
  $("word-de").textContent = word.de;
  $("word-de").classList.add("hidden");
  $("hint").classList.remove("hidden");
  $("btn-next").classList.add("hidden");
}

// Uncover the German translation and offer the "Weiter" button.
function reveal() {
  $("word-de").classList.remove("hidden");
  $("hint").classList.add("hidden");
  $("btn-next").classList.remove("hidden");
}

function startRound() {
  deck = shuffle(words);
  position = 0;
  showCard();
  showScreen("card");
}

function nextCard() {
  position++;
  if (position < deck.length) {
    showCard();
  } else {
    $("done-text").textContent = "Du hast alle " + deck.length + " Vokabeln geübt.";
    showScreen("done");
  }
}

// Load the word list. The start button stays disabled until it has loaded.
async function loadWords() {
  $("btn-start").disabled = true;
  try {
    const response = await fetch(VOCAB_FILE);
    if (!response.ok) throw new Error("HTTP " + response.status);
    words = await response.json();
    if (!Array.isArray(words) || words.length === 0) throw new Error("leere Liste");
    $("btn-start").disabled = false;
  } catch (err) {
    // Usually happens when index.html is opened directly instead of via start.command.
    $("error").textContent =
      "Die Vokabeln konnten nicht geladen werden. Bitte die App über start.command starten.";
    $("error").classList.remove("hidden");
    console.error(err);
  }
}

$("btn-start").addEventListener("click", startRound);
$("card").addEventListener("click", reveal);
$("btn-next").addEventListener("click", nextCard);
$("btn-again").addEventListener("click", startRound);
$("btn-home").addEventListener("click", () => showScreen("start"));

loadWords();
