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

const SEGMENTS = 10;  // the Etappe bar is drawn as 10 small blocks

// The current Etappe as 10 blocks; the block you are working on fills partly.
function showEtappe() {
  const etappe = etappeInfo();
  $("etappe-title").textContent = "Etappe " + etappe.number;
  $("etappe-count").textContent = etappe.done + " / " + etappe.size;
  const left = etappe.size - etappe.done;
  $("etappe-hint").textContent =
    "Noch " + left + (left === 1 ? " gelöste Aufgabe" : " gelöste Aufgaben") + " bis Etappe " + (etappe.number + 1);

  const perSegment = etappe.size / SEGMENTS;
  const segments = $("etappe-segments");
  segments.innerHTML = "";
  for (let i = 0; i < SEGMENTS; i++) {
    const fill = Math.min(Math.max((etappe.done - i * perSegment) / perSegment, 0), 1);
    const segment = document.createElement("span");
    segment.className = "segment";
    const inner = document.createElement("span");
    inner.className = "segment-fill";
    inner.style.width = fill * 100 + "%";
    segment.append(inner);
    segments.append(segment);
  }
}

// Overall: how many words and sentences you have answered right at least once.
function showTotal() {
  const all = words.length + sentences.length;
  const known =
    words.filter((item) => itemPractised("wort", item)).length +
    sentences.filter((item) => itemPractised("satz", item)).length;
  $("total-count").textContent = known + " / " + all + " Wörter & Sätze";
  $("total-bar").style.width = (known / all) * 100 + "%";
}

function showStart() {
  showEtappe();
  showTotal();
  showTopicPicker(false);
  showScreen("start");
}

// ---------- Topic fold-out ----------

let topicNames = [];  // filled when the data has loaded

function topicLabel(topic) {
  return topic === "alle" ? "Alle Themen" : topic;
}

// Closed: one row "Thema · <current> ⌄". Open: the list of all topics below it.
function showTopicPicker(open) {
  $("topic-current").textContent = topicLabel(settings.topic);
  $("topic-toggle").setAttribute("aria-expanded", String(open));
  $("topic-toggle").classList.toggle("open", open);
  const list = $("topic-list");
  list.classList.toggle("hidden", !open);
  if (!open) return;

  list.innerHTML = "";
  for (const topic of ["alle"].concat(topicNames)) {
    const row = document.createElement("button");
    row.className = "topic-option";
    row.setAttribute("role", "option");
    row.setAttribute("aria-selected", String(topic === settings.topic));
    row.textContent = topicLabel(topic);
    row.addEventListener("click", () => {
      settings.topic = topic;
      saveSettings();
      showTopicPicker(false);
    });
    list.append(row);
  }
}

// ---------- Building a round ----------

// The app decides what comes next – you just press "Üben".
// Every task slot of a round is drawn by chance with these weights:
//   wort   = word flashcard        satz   = sentence flashcard
//   wahl   = multiple choice       luecke = fill the gap
//   tippen = type the Italian word fehler = "Fehler finden"
// Which words/sentences come is decided by pickRound (due first, then new),
// and both directions are mixed in (see buildCards).
const TASK_WEIGHTS = { wort: 30, satz: 18, wahl: 13, luecke: 13, tippen: 13, fehler: 13 };
const TASK_MAX = { fehler: 2, luecke: 3, tippen: 3 };  // these take longer – not too many per round

function drawTaskTypes(count) {
  const wanted = { wort: 0, satz: 0, wahl: 0, luecke: 0, tippen: 0, fehler: 0 };
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

  // Typing only for German→Italian word cards – these exist once a word was
  // recognised from the Italian side (see buildCards), so beginners get none yet.
  const allWordCards = buildCards("wort", topicWords);
  const typingCards = pickRound(allWordCards.filter((c) => c.dir === "de-it"), wanted.tippen);
  const typed = new Set(typingCards.map((card) => card.item));

  // Words fill all remaining slots (also any slot the others could not fill).
  const used = sentenceCards.length + gapPicks.length + spotTasks.length + typingCards.length;
  const otherWordCards = allWordCards.filter((card) => !typed.has(card.item));
  const wordCards = shuffle(pickRound(otherWordCards, ROUND_SIZE - used));
  const choiceCount = Math.min(wanted.wahl, wordCards.length);

  const roundTasks = [].concat(
    wordCards.slice(0, choiceCount).map((card) => makeChoiceTask(card, topicWords)),
    wordCards.slice(choiceCount).concat(sentenceCards).map((card) => ({ type: "card", card: card })),
    typingCards.map((card) => ({ type: "tippen", card: card })),
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
    topicNames = addRanks(words);
    addRanks(sentences);
    addRanks(gaps);
    if (!topicNames.includes(settings.topic)) settings.topic = "alle";
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

// ---------- Buttons ----------

$("topic-toggle").addEventListener("click", () => {
  showTopicPicker($("topic-list").classList.contains("hidden"));
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
    resetJourney();
    showStart();
  }
});

init();
