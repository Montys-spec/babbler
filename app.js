// Babbler – start screen, building a round, loading the lesson data.
// Loaded last: the round itself lives in round.js, "Fehler finden" in spot.js.

// Vocabulary in three Stufen, one file each: 1 = basics, 2 = everyday, 3 = specialist.
const VOCAB_FILES = ["data/vocab.json", "data/vocab-2.json", "data/vocab-3.json"];
const STUFE_NAMES = { 1: "Grundwortschatz", 2: "Alltag", 3: "Fachwortschatz" };
const SENTENCES_FILE = "data/sentences.json";
const GAPS_FILE = "data/gaps.json";
const SETTINGS_KEY = "babbler-settings-v1";
const ROUND_SIZE = 10;  // tasks per round

let words = [];       // all vocab files together; each word gets "stufe" (1–3) when loading
let sentences = [];   // from data/sentences.json
let gaps = [];        // from data/gaps.json
let topicStufe = {};  // topic → the Stufe it starts in (sentences and gaps follow their topic)

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

// The items to practise. A topic you pick yourself is fully open (all Stufen).
// With "Alle Themen", only items up to your open Stufe – plus anything already started.
function practiceItems(list, kind) {
  if (settings.topic !== "alle") return list.filter((item) => item.cat === settings.topic);
  const open = unlockedStufe(words);
  return list.filter((item) => item.stufe <= open || itemStarted(kind, item));
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

// Your vocabulary Stufe and how far it is to the next one
// (words answered right at least once, out of the 70 % needed).
function showStufe() {
  const open = unlockedStufe(words);
  const maxStufe = Math.max(...words.map((w) => w.stufe));
  $("stufe-title").textContent = "Stufe " + open + " · " + STUFE_NAMES[open];

  let have, need, hint;
  if (open < maxStufe) {
    const atStufe = words.filter((w) => w.stufe === open);
    need = Math.ceil(atStufe.length * STUFE_UNLOCK);
    have = Math.min(atStufe.filter((w) => itemPractised("wort", w)).length, need);
    const left = need - have;
    hint = "Noch " + left + (left === 1 ? " Wort" : " Wörter") + " bis Stufe " + (open + 1);
  } else {
    need = words.length;
    have = words.filter((w) => itemPractised("wort", w)).length;
    hint = "Alle Stufen offen";
  }
  $("stufe-count").textContent = have + " / " + need;
  $("stufe-hint").textContent = hint;
  $("stufe-bar").style.width = (have / need) * 100 + "%";
}

function showStart() {
  showEtappe();
  showStufe();
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
    const label = document.createElement("span");
    label.className = "topic-option-label";
    label.textContent = topicLabel(topic);
    row.append(label);
    // Topics that start in a higher Stufe get a small tag (choosing them opens them right away)
    if (topicStufe[topic] > 1) {
      const tag = document.createElement("span");
      tag.className = "topic-tag";
      tag.textContent = topicStufe[topic] === 3 ? "Fachwortschatz" : "Stufe " + topicStufe[topic];
      row.append(tag);
    }
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
  const topicWords = practiceItems(words, "wort");
  const topicSentences = practiceItems(sentences, "satz");
  const wanted = drawTaskTypes(ROUND_SIZE);

  const sentenceCards = pickRound(buildCards("satz", topicSentences), wanted.satz);
  const gapPicks = pickRound(gapCards(practiceItems(gaps, "luecke"), topicSentences), wanted.luecke);
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

// Number the items inside each topic and Stufe (1, 2, 3 …) – the files list the most useful
// first. So when a new Stufe opens, its words are mixed evenly across all topics.
// Returns the topic names in file order.
function addRanks(list) {
  const count = {};
  const topics = [];
  for (const item of list) {
    const group = item.cat + "|" + (item.stufe || 1);
    count[group] = (count[group] || 0) + 1;
    item.rank = count[group];
    if (!topics.includes(item.cat)) topics.push(item.cat);
  }
  return topics;
}

async function init() {
  $("btn-start").disabled = true;
  try {
    let vocabLists;
    [vocabLists, sentences, gaps] = await Promise.all([
      Promise.all(VOCAB_FILES.map(loadJson)),
      loadJson(SENTENCES_FILE),
      loadJson(GAPS_FILE),
    ]);
    // File 1 → Stufe 1, file 2 → Stufe 2, …
    words = vocabLists.flatMap((list, i) => list.map((word) => Object.assign(word, { stufe: i + 1 })));
    topicNames = addRanks(words);
    addRanks(sentences);
    addRanks(gaps);

    // A topic belongs to the first Stufe it appears in; its sentences and gaps follow it.
    topicStufe = {};
    for (const word of words) if (!(word.cat in topicStufe)) topicStufe[word.cat] = word.stufe;
    for (const item of sentences.concat(gaps)) item.stufe = topicStufe[item.cat] || 1;
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

// Offline support for the iPhone app (sw.js). Browsers only allow it over https or on localhost.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch((err) => console.warn("Offline-Modus nicht verfügbar", err));
}

init();
