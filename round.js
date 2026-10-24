// Babbler – a practice session, put together by the app (see startPractice in app.js).
// A session consists of sections ("Vokabeln", "Sätze", …); each section starts with a short
// title screen and then has tasks of one kind only. A task is one of
//   { type: "intro", … }                – the title screen of a section (not counted as a task)
//   { type: "card", card }              – a flashcard: tap to reveal, swipe right (knew it) or left (didn't)
//   { type: "spot", entries }           – a "Fehler finden" task (see spot.js)
//   { type: "wahl" | "luecke" | "tippen", … } – a quiz task (see quiz.js)
// Every answer is saved right away (see progress.js).

let tasks = [];        // the tasks of the current session (including the section title screens)
let taskIndex = 0;     // index of the current task
let solved = 0;        // tasks done right so far
let sectionScores = []; // [{ name, done, total }] for the result screen
let missedCards = [];  // word/sentence cards answered wrong (for "Fehler wiederholen")
let missedSpots = [];  // "Fehler finden" sentences that were judged wrongly
let missedGaps = [];   // gap sentences answered wrong
let revealed = false;  // has the hidden side of the current card been shown?
let etappeAtStart = 1; // to notice when an Etappe was completed during the round
let levelAtStart = 1;  // to notice when a new Niveau was reached (level.js)

// The swipe gesture; answer() runs once the card has flown off screen.
const swiper = makeSwipeable($("card"), {
  canSwipe: () => revealed,
  onSwipe: (direction) => answer(direction === "right"),
});

function playRound(list) {
  tasks = list;
  taskIndex = 0;
  solved = 0;
  sectionScores = [];
  missedCards = [];
  missedSpots = [];
  missedGaps = [];
  etappeAtStart = etappeInfo().number;
  levelAtStart = currentLevel();
  showTask();
}

// A session made of sections: [{ name, text, unit?, tasks }]. Each section gets a title screen.
function playSections(sections) {
  const list = [];
  sections.forEach((section, i) => {
    list.push({ type: "intro", section: section, step: i + 1, steps: sections.length });
    for (const task of section.tasks) list.push(Object.assign(task, { sectionName: section.name }));
  });
  playRound(list);
  sectionScores = sections.map((section) => ({ name: section.name, done: 0, total: section.tasks.length }));
}

// Play only these cards again (used by "Fehler wiederholen").
function playCards(cards) {
  playRound(shuffle(cards).map((card) => ({ type: "card", card: card })));
}

// Every task screen has its own counter and progress bar; keep them all in sync.
// Section title screens do not count as tasks.
function updateProgress() {
  const real = tasks.filter((task) => task.type !== "intro");
  const before = tasks.slice(0, taskIndex).filter((task) => task.type !== "intro").length;
  const text = Math.min(before + 1, real.length) + " / " + real.length;
  const width = (before / real.length) * 100 + "%";
  for (const el of document.querySelectorAll(".counter")) el.textContent = text;
  for (const el of document.querySelectorAll(".progress-bar")) el.style.width = width;
}

function showTask() {
  updateProgress();
  const task = tasks[taskIndex];
  if (task.type === "intro") {
    showScreen("intro");
    showIntro(task);
  } else if (task.type === "card") {
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

// Called by every task type when it is finished (done = true / false; null for a title screen).
function finishTask(done) {
  if (done) {
    solved++;
    addStep();  // one step forward in the current Etappe (journey.js)
    const score = sectionScores.find((s) => s.name === tasks[taskIndex].sectionName);
    if (score) score.done++;
  }
  taskIndex++;
  if (taskIndex < tasks.length) {
    showTask();
  } else {
    showRoundResult();
  }
}

// ---------- Section title screens ----------

// "Abschnitt 2 von 5 · Vokabel-Check" with a one-line explanation of the task type.
// The grammar section shows the explanation of its unit here.
function showIntro(task) {
  const section = task.section;
  $("intro-step").textContent = "Abschnitt " + task.step + " von " + task.steps;
  $("intro-title").textContent = section.name;
  $("intro-text").textContent = section.text;
  const box = $("intro-explanation");
  box.classList.toggle("hidden", !section.unit);
  if (section.unit) renderExplanation(box, section.unit);
  $("btn-intro").textContent = section.unit ? "Übungen starten" : "Los geht's";
}

function leaveIntro() {
  if (tasks[taskIndex] && tasks[taskIndex].type === "intro") finishTask(null);
}

$("btn-intro").addEventListener("click", leaveIntro);
document.addEventListener("keydown", (e) => {
  if ($("screen-intro").classList.contains("hidden") || e.key !== "Enter") return;
  e.preventDefault();
  e.stopImmediatePropagation();  // otherwise the same Enter would also reveal the first card
  leaveIntro();
});

// ---------- Flashcards ----------

// 🔊 in the card's corner, reads the Italian side. On German→Italian cards it only
// appears after revealing (otherwise it would give the answer away) – see style.css.
// On speaking cards it reads the question first and the model answer after revealing.
const cardSpeak = makeSpeakButton(() => {
  const card = tasks[taskIndex].card;
  return card.kind === "sprechen" && !revealed ? card.item.q : card.item.it;
});
cardSpeak.classList.add("card-speak");
$("card").append(cardSpeak);

// Fill the card, hidden side still covered.
function showCard(card) {
  revealed = false;
  const isNew = boxOf(card.key) < 0;
  if (card.kind === "sprechen") {
    showSpeakingCard(card, isNew);
  } else {
    // Small line on top, e.g. "Zahlen · IT → DE · neu"
    const direction = card.dir === "it-de" ? "IT → DE" : "DE → IT";
    $("card-cat").textContent = card.item.cat + " · " + direction + (isNew ? " · neu" : "");
    const italianFace = card.dir === "it-de" ? $("card-front") : $("card-back");
    const germanFace = card.dir === "it-de" ? $("card-back") : $("card-front");
    setItalian(italianFace, card.item);
    germanFace.textContent = card.item.de;
    // Plural, shown after revealing (only for nouns that have one)
    $("card-extra").textContent = card.item.pl ? "Mehrzahl: " + card.item.pl : "";
    $("card-hint").textContent = "";
    $("hint-before").textContent = "Tippen zum Aufdecken";
  }
  // Speaking is judged differently: did you manage to say it?
  const speaking = card.kind === "sprechen";
  $("btn-yes").textContent = speaking ? "✓ Konnte ich" : "✓ Gewusst";
  $("btn-no").textContent = speaking ? "✗ Noch nicht" : "✗ Nicht gewusst";
  $("card").classList.toggle("long", card.kind !== "wort");  // smaller text for sentences
  $("card").classList.toggle("italian-hidden", card.dir === "de-it");
  $("card").classList.remove("revealed");
  $("answer-buttons").classList.add("inactive");
  swiper.reset();
}

// A conversation turn (speak.js): question + German hint what to say; after tapping
// the model answer, the German meaning of the question and other possible answers.
function showSpeakingCard(card, isNew) {
  const turn = card.item;
  $("card-cat").textContent = turn.cat + " · " + turn.step + (isNew ? " · neu" : "");
  $("card-front").textContent = turn.q;
  $("card-hint").textContent = "🗣 " + turn.hint;
  $("card-back").textContent = turn.answers[0];
  const others = turn.answers.slice(1);
  $("card-extra").textContent = "„" + turn.qDe + "“" + (others.length ? " · auch: " + others.join(" / ") : "");
  $("hint-before").textContent = "Laut antworten, dann tippen";
  speak(turn.q);
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
  updateProgress();
  const total = tasks.filter((task) => task.type !== "intro").length;
  $("score-num").textContent = solved + " / " + total;
  $("score-label").textContent = "Aufgaben gelöst · Fortschritt gespeichert";

  // How each section went, e.g. "Vokabeln 7 / 8"
  const sectionList = $("section-results");
  sectionList.innerHTML = "";
  for (const score of sectionScores) {
    const row = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = score.name;
    const value = document.createElement("span");
    value.className = "section-score";
    value.textContent = score.done + " / " + score.total;
    row.append(name, value);
    sectionList.append(row);
  }
  sectionList.classList.toggle("hidden", sectionScores.length === 0);

  // Etappe: completed during this round, or how far into it you are now
  const etappe = etappeInfo();
  $("etappe-result-text").textContent =
    etappe.number > etappeAtStart
      ? "Etappe " + (etappe.number - 1) + " geschafft – weiter mit Etappe " + etappe.number
      : "Etappe " + etappe.number + " · " + etappe.done + " / " + etappe.size;
  $("etappe-result-bar").style.width = (etappe.done / etappe.size) * 100 + "%";

  // New Niveau reached during this session? Say what it brings.
  const level = currentLevel();
  $("level-up").classList.toggle("hidden", level <= levelAtStart);
  if (level > levelAtStart) {
    const step = LEVELS[level - 1];
    $("level-up").textContent =
      "Niveau " + level + " erreicht: " + step.name + (step.unlocks ? " · neu: " + step.unlocks : "");
  }

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
