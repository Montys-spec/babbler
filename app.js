// Babbler – start screen, building a session, loading the lesson data.
// Loaded last: the session itself lives in round.js, "Fehler finden" in spot.js,
// grammar in grammar.js.

// Vocabulary in three Stufen, one file each: 1 = basics, 2 = everyday, 3 = specialist.
const VOCAB_FILES = ["data/vocab.json", "data/vocab-2.json", "data/vocab-3.json"];
const STUFE_NAMES = { 1: "Grundwortschatz", 2: "Alltag", 3: "Fachwortschatz" };
const SENTENCES_FILE = "data/sentences.json";
const GAPS_FILE = "data/gaps.json";
const SETTINGS_KEY = "babbler-settings-v1";

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
  $("grammar-current").textContent = grammarStatusText();
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
// A session has five sections in a fixed order, each with one kind of task, so you only
// switch the kind of exercise between sections:
//   1. Vokabeln        8 word flashcards
//   2. Vokabel-Check   4 tasks: multiple choice, plus up to 2 typing tasks once words are known
//   3. Sätze           3 sentence flashcards
//   4. Grammatik       explanation of the current grammar unit + 3 exercises + 1 topic gap
//   5. Fehler finden   1 task
// Which words/sentences come is decided by pickRound (due first, then new), and both
// directions are mixed in (see buildCards). Empty sections are left out.
const SESSION = { vokabeln: 8, check: 4, maxTyping: 2, saetze: 3, grammatik: 3, luecken: 1, fehler: 1 };

function startPractice() {
  const topicWords = practiceItems(words, "wort");
  const topicSentences = practiceItems(sentences, "satz");
  const allWordCards = buildCards("wort", topicWords);

  // Vokabel-Check: typing only for German→Italian cards – these exist once a word was
  // recognised from the Italian side, so beginners get multiple choice only.
  const typingCards = pickRound(allWordCards.filter((c) => c.dir === "de-it"), SESSION.maxTyping);
  const typed = new Set(typingCards.map((card) => card.item));
  const wordCards = pickRound(
    allWordCards.filter((card) => !typed.has(card.item)),
    SESSION.vokabeln + SESSION.check - typingCards.length
  );
  const flashCards = wordCards.slice(0, SESSION.vokabeln);
  const choiceCards = wordCards.slice(SESSION.vokabeln);

  const sentenceCards = pickRound(buildCards("satz", topicSentences), SESSION.saetze);

  const grammar = grammarForSession(SESSION.grammatik);
  const topicGaps = pickRound(gapCards(practiceItems(gaps, "luecke"), topicSentences), SESSION.luecken);

  // Sentences already on a card this session are left out of "Fehler finden".
  const onCards = new Set(sentenceCards.map((card) => card.item));
  const spotTasks = makeSpotTasks(topicSentences.filter((s) => !onCards.has(s)), SESSION.fehler);

  const asCards = (cards) => cards.map((card) => ({ type: "card", card: card }));
  const sections = [
    {
      name: "Vokabeln",
      text: "Tippen zum Aufdecken, dann wischen: rechts = gewusst, links = nicht gewusst.",
      tasks: shuffle(asCards(flashCards)),
    },
    {
      name: "Vokabel-Check",
      text: "Wähle die richtige Übersetzung" + (typingCards.length ? " oder schreib das Wort auf Italienisch." : "."),
      tasks: choiceCards
        .map((card) => makeChoiceTask(card, topicWords))
        .concat(typingCards.map((card) => ({ type: "tippen", card: card }))),
    },
    {
      name: "Sätze",
      text: "Ganze Sätze: tippen zum Aufdecken, dann wischen.",
      tasks: shuffle(asCards(sentenceCards)),
    },
    {
      name: "Grammatik",
      text: grammar.allDone
        ? "Wiederholung · Thema " + (grammar.index + 1) + " von " + grammarUnits.length
        : "Thema " + (grammar.index + 1) + " von " + grammarUnits.length + " · erst lesen, dann üben.",
      unit: grammar.unit,
      tasks: grammar.cards.concat(topicGaps).map((card) => ({ type: "luecke", card: card })),
    },
    {
      name: "Fehler finden",
      text: "Welche Sätze enthalten einen Fehler? Tippe sie an und prüfe dann.",
      tasks: spotTasks,
    },
  ];
  playSections(sections.filter((section) => section.tasks.length));
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
    let vocabLists, grammarData;
    [vocabLists, sentences, gaps, grammarData] = await Promise.all([
      Promise.all(VOCAB_FILES.map(loadJson)),
      loadJson(SENTENCES_FILE),
      loadJson(GAPS_FILE),
      loadJson(GRAMMAR_FILE),
    ]);
    prepareGrammar(grammarData);
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
$("btn-intro-quit").addEventListener("click", showStart);
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
