// Babbler – start screen, building a round, loading the lesson data.
// Loaded last: the round itself lives in round.js, "Fehler finden" in spot.js.

const VOCAB_FILE = "data/vocab.json";
const SENTENCES_FILE = "data/sentences.json";
const GAPS_FILE = "data/gaps.json";
const SETTINGS_KEY = "babbler-settings-v1";
const ROUND_SIZE = 10;  // tasks per round

let words = [];      // from data/vocab.json
let sentences = [];  // from data/sentences.json
let gaps = [];       // from data/gaps.json

// The only choice on the start screen: the topic ("alle" or a topic name).
// Remembered on this device.
let settings = loadSettings();

function loadSettings() {
  const defaults = { topic: "alle" };
  try {
    return Object.assign(defaults, JSON.parse(localStorage.getItem(SETTINGS_KEY)));
  } catch (err) {
    return defaults;
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ topic: settings.topic }));
  } catch (err) {
    // not saved – the app still works, it just forgets the choice
  }
}

// Only the items of the chosen topic.
function inTopic(list) {
  return settings.topic === "alle" ? list : list.filter((item) => item.cat === settings.topic);
}

// ---------- Start screen ----------

// One progress line: "12 / 537 sicher" plus bar.
function showLearned(id, kind, list) {
  const learned = list.filter((item) => itemLearned(kind, item)).length;
  $(id).textContent = learned + " / " + list.length + " sicher";
  $(id + "-bar").style.width = (learned / list.length) * 100 + "%";
}

function showStart() {
  showLearned("learned-words", "wort", words);
  showLearned("learned-sentences", "satz", sentences);
  $("sel-topic").value = settings.topic;
  showScreen("start");
}

function fillTopicSelect(topics) {
  const select = $("sel-topic");
  for (const topic of ["alle"].concat(topics)) {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = topic === "alle" ? "Alle Themen" : topic;
    select.append(option);
  }
}

// ---------- Building a round ----------

// The app decides what comes next – you just press "Üben".
// Every task slot of a round is drawn by chance with these weights:
//   wort   = word flashcard        satz   = sentence flashcard
//   wahl   = multiple choice       luecke = fill the gap
//   fehler = "Fehler finden"
// Which words/sentences come is decided by pickRound (due first, then new),
// and both directions are mixed in (see buildCards).
const TASK_WEIGHTS = { wort: 35, satz: 20, wahl: 15, luecke: 15, fehler: 15 };
const TASK_MAX = { fehler: 2, luecke: 3 };  // these take longer – not too many per round

function drawTaskTypes(count) {
  const wanted = { wort: 0, satz: 0, wahl: 0, luecke: 0, fehler: 0 };
  for (let i = 0; i < count; i++) {
    const open = Object.keys(TASK_WEIGHTS).filter((t) => !(wanted[t] >= TASK_MAX[t]));
    const total = open.reduce((sum, t) => sum + TASK_WEIGHTS[t], 0);
    let roll = Math.random() * total;
    const type = open.find((t) => (roll -= TASK_WEIGHTS[t]) < 0) || "wort";
    wanted[type]++;
  }
  return wanted;
}

function startPractice() {
  const topicWords = inTopic(words);
  const topicSentences = inTopic(sentences);
  const wanted = drawTaskTypes(ROUND_SIZE);

  const sentenceCards = pickRound(buildCards("satz", topicSentences), wanted.satz);
  const gapPicks = pickRound(gapCards(inTopic(gaps), topicSentences), wanted.luecke);
  // Sentences already on a card this round are left out of "Fehler finden".
  const onCards = new Set(sentenceCards.map((card) => card.item));
  const spotTasks = makeSpotTasks(topicSentences.filter((s) => !onCards.has(s)), wanted.fehler);

  // Words fill all remaining slots (also any slot the others could not fill).
  const wordCount = ROUND_SIZE - sentenceCards.length - gapPicks.length - spotTasks.length;
  const wordCards = shuffle(pickRound(buildCards("wort", topicWords), wordCount));
  const choiceCount = Math.min(wanted.wahl, wordCards.length);

  const roundTasks = [].concat(
    wordCards.slice(0, choiceCount).map((card) => makeChoiceTask(card, topicWords)),
    wordCards.slice(choiceCount).concat(sentenceCards).map((card) => ({ type: "card", card: card })),
    gapPicks.map((card) => ({ type: "luecke", card: card })),
    spotTasks
  );
  playRound(shuffle(roundTasks));
}

// ---------- Loading ----------

async function loadJson(file) {
  const response = await fetch(file);
  if (!response.ok) throw new Error(file + ": HTTP " + response.status);
  return response.json();
}

// Number the items inside each topic (1, 2, 3 …) – the file lists the most useful first.
// Returns the topic names in file order.
function addRanks(list) {
  const count = {};
  for (const item of list) {
    count[item.cat] = (count[item.cat] || 0) + 1;
    item.rank = count[item.cat];
  }
  return Object.keys(count);
}

async function init() {
  $("btn-start").disabled = true;
  try {
    [words, sentences, gaps] = await Promise.all([
      loadJson(VOCAB_FILE),
      loadJson(SENTENCES_FILE),
      loadJson(GAPS_FILE),
    ]);
    const topics = addRanks(words);
    addRanks(sentences);
    addRanks(gaps);
    fillTopicSelect(topics);
    if (!topics.includes(settings.topic)) settings.topic = "alle";
    $("btn-start").disabled = false;
    showStart();
  } catch (err) {
    // Usually happens when index.html is opened directly instead of via start.command.
    $("error").textContent =
      "Die Übungen konnten nicht geladen werden. Bitte die App über start.command starten.";
    $("error").classList.remove("hidden");
    console.error(err);
  }
}

// ---------- Buttons & dropdown ----------

$("sel-topic").addEventListener("change", (e) => {
  settings.topic = e.target.value;
  saveSettings();
});

$("btn-start").addEventListener("click", startPractice);
$("btn-again").addEventListener("click", startPractice);
$("btn-home").addEventListener("click", showStart);
$("btn-quit").addEventListener("click", showStart);
$("btn-spot-quit").addEventListener("click", showStart);
$("btn-quiz-quit").addEventListener("click", showStart);
$("btn-reset").addEventListener("click", () => {
  if (confirm("Den gesamten Lernfortschritt löschen?")) {
    resetProgress();
    resetRuleStats();
    showStart();
  }
});

init();
