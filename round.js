// Babbler – a practice round: a shuffled mix of tasks chosen by the app (see startPractice in app.js).
// A task is one of
//   { type: "card", card }              – a flashcard: tap to reveal, swipe right (knew it) or left (didn't)
//   { type: "spot", entries }           – a "Fehler finden" task (see spot.js)
//   { type: "wahl" | "luecke" | "tippen", … } – a quiz task (see quiz.js)
// Every answer is saved right away (see progress.js).

let tasks = [];        // the tasks of the current round
let taskIndex = 0;     // index of the current task
let solved = 0;        // tasks done right so far
let missedCards = [];  // word/sentence cards answered wrong (for "Fehler wiederholen")
let missedSpots = [];  // "Fehler finden" sentences that were judged wrongly
let missedGaps = [];   // gap sentences answered wrong
let revealed = false;  // has the hidden side of the current card been shown?

// The swipe gesture; answer() runs once the card has flown off screen.
const swiper = makeSwipeable($("card"), {
  canSwipe: () => revealed,
  onSwipe: (direction) => answer(direction === "right"),
});

function playRound(list) {
  tasks = list;
  taskIndex = 0;
  solved = 0;
  missedCards = [];
  missedSpots = [];
  missedGaps = [];
  showTask();
}

// Play only these cards again (used by "Fehler wiederholen").
function playCards(cards) {
  playRound(shuffle(cards).map((card) => ({ type: "card", card: card })));
}

// Every task screen has its own counter and progress bar; keep them all in sync.
function updateProgress(done) {
  const text = Math.min(taskIndex + 1, tasks.length) + " / " + tasks.length;
  const width = (done / tasks.length) * 100 + "%";
  for (const el of document.querySelectorAll(".counter")) el.textContent = text;
  for (const el of document.querySelectorAll(".progress-bar")) el.style.width = width;
}

function showTask() {
  updateProgress(taskIndex);
  const task = tasks[taskIndex];
  if (task.type === "card") {
    showScreen("card");
    showCard(task.card);
  } else if (task.type === "spot") {
    showScreen("spot");
    showSpotTask(task.entries);
  } else {
    showScreen("quiz");
    showQuizTask(task);
  }
}

// Called by both task types when a task is finished.
function finishTask(done) {
  if (done) solved++;
  taskIndex++;
  if (taskIndex < tasks.length) {
    showTask();
  } else {
    showRoundResult();
  }
}

// ---------- Flashcards ----------

// 🔊 in the card's corner, reads the Italian side. On German→Italian cards it only
// appears after revealing (otherwise it would give the answer away) – see style.css.
const cardSpeak = makeSpeakButton(() => tasks[taskIndex].card.item.it);
cardSpeak.classList.add("card-speak");
$("card").append(cardSpeak);

// Fill the card, hidden side still covered.
function showCard(card) {
  revealed = false;
  // Small line on top, e.g. "Zahlen · IT → DE · neu"
  const direction = card.dir === "it-de" ? "IT → DE" : "DE → IT";
  const isNew = boxOf(card.key) < 0;
  $("card-cat").textContent = card.item.cat + " · " + direction + (isNew ? " · neu" : "");
  const italianFace = card.dir === "it-de" ? $("card-front") : $("card-back");
  const germanFace = card.dir === "it-de" ? $("card-back") : $("card-front");
  setItalian(italianFace, card.item);
  germanFace.textContent = card.item.de;
  // Plural, shown after revealing (only for nouns that have one)
  $("card-extra").textContent = card.item.pl ? "Mehrzahl: " + card.item.pl : "";
  $("card").classList.toggle("long", card.kind === "satz");  // smaller text for sentences
  $("card").classList.toggle("italian-hidden", card.dir === "de-it");
  $("card").classList.remove("revealed");
  $("answer-buttons").classList.add("inactive");
  swiper.reset();
}

// Uncover the hidden side and allow swiping.
function reveal() {
  if (revealed) return;
  revealed = true;
  $("card").classList.add("revealed");
  $("answer-buttons").classList.remove("inactive");
}

// Save the answer and move on.
function answer(knewIt) {
  const card = tasks[taskIndex].card;
  recordAnswer(card.key, knewIt);
  if (!knewIt) missedCards.push(card);
  finishTask(knewIt);
}

// ---------- Result ----------

function showRoundResult() {
  updateProgress(tasks.length);
  $("score-num").textContent = solved + " / " + tasks.length;
  $("score-label").textContent = "Aufgaben gelöst · Fortschritt gespeichert";

  // Everything that went wrong: missed cards, then misjudged "Fehler finden" sentences.
  const list = $("missed-list");
  list.innerHTML = "";
  const addItem = (bold, rest) => {
    const item = document.createElement("li");
    const strong = document.createElement("strong");
    strong.textContent = bold;
    item.append(strong, " – " + rest);
    list.append(item);
  };
  for (const card of missedCards) addItem(card.front, card.back);
  for (const gap of missedGaps) addItem(gapSolved(gap), gap.why);
  for (const entry of missedSpots) {
    addItem(entry.sentence.it, entry.wrong ? entry.sentence.why : "Dieser Satz war richtig.");
  }

  const anyMissed = missedCards.length + missedGaps.length + missedSpots.length > 0;
  $("missed-box").classList.toggle("hidden", !anyMissed);
  $("btn-repeat").classList.toggle("hidden", missedCards.length === 0);
  $("btn-repeat").textContent = "Fehler wiederholen (" + missedCards.length + ")";
  showScreen("done");
}

// Only treat a click as "reveal" – after revealing, the card is swiped instead.
$("card").addEventListener("click", reveal);
$("btn-yes").addEventListener("click", () => swiper.fly("right"));
$("btn-no").addEventListener("click", () => swiper.fly("left"));
$("btn-repeat").addEventListener("click", () => playCards(missedCards));

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
