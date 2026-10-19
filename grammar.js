// Babbler – grammar: short explanations and exercises (data/grammar.json).
//
// The topics ("units") are learned in file order. A unit counts as done once 70 % of its
// exercises were answered right at least once; then the next unit becomes the current one.
// Each session practises the current unit (plus one due exercise from an earlier unit).
// The "Grammatik" screen lists all units to read up on them at any time.
// Exercises are fill-the-gap tasks and reuse the gap screen from quiz.js.

const GRAMMAR_FILE = "data/grammar.json";
const UNIT_DONE_SHARE = 0.7;
const GRAMMAR_TOPICS = ["Substantive & Adjektive", "Pronomen", "Verben & Adverbien", "Präpositionen"];

let grammarUnits = [];

// Called once after loading: give every exercise what the gap screen and progress need.
function prepareGrammar(units) {
  grammarUnits = units;
  for (const unit of units) {
    unit.exercises.forEach((exercise, i) => {
      exercise.cat = "Grammatik · " + unit.title;  // label on the task screen
      exercise.rule = exercise.rule || unit.rule;   // for the rule memory (rules.js)
      exercise.rank = i + 1;
      exercise.unitId = unit.id;
    });
  }
}

// An exercise as a card, so progress.js can pick it (due first, then new).
function exerciseCard(exercise) {
  return {
    kind: "gram",
    item: exercise,
    key: "gram|" + exercise.unitId + "|" + exercise.text,
    level: 1,
    rank: exercise.rank,
  };
}

function unitCards(unit) {
  return unit.exercises.map(exerciseCard);
}

function unitDone(unit) {
  const cards = unitCards(unit);
  return cards.filter((card) => boxOf(card.key) >= 1).length / cards.length >= UNIT_DONE_SHARE;
}

// The unit to work on: the first one that is not done yet (or -1 when all are done).
function currentUnitIndex() {
  return grammarUnits.findIndex((unit) => !unitDone(unit));
}

// The grammar part of a session: `count` exercises of the current unit; if an exercise of an
// earlier unit is due, it replaces the last one. When all units are done, a random unit is repeated.
function grammarForSession(count) {
  let index = currentUnitIndex();
  const allDone = index < 0;
  if (allDone) index = randomInt(0, grammarUnits.length - 1);
  const unit = grammarUnits[index];
  const cards = pickRound(unitCards(unit), count);

  const earlierDue = grammarUnits
    .slice(0, index)
    .flatMap(unitCards)
    .filter((card) => cardStatus(card.key) === "faellig")
    .sort((a, b) => boxOf(a.key) - boxOf(b.key));
  if (!allDone && earlierDue.length && cards.length) cards[cards.length - 1] = earlierDue[0];

  return { unit: unit, index: index, allDone: allDone, cards: cards };
}

// ---------- Explanation (used in the session and on the Grammatik screen) ----------

function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

// Title, short text, table and tips of a unit.
function renderExplanation(container, unit) {
  container.innerHTML = "";
  container.append(element("h3", "explanation-title", unit.title));
  container.append(element("p", "explanation-intro", unit.intro));

  if (unit.table) {
    // Scrolls sideways if needed; tables with many columns get a compact style ("wide").
    const wrap = element("div", "explanation-table" + (unit.table.head.length > 3 ? " wide" : ""));
    const table = document.createElement("table");
    const headRow = document.createElement("tr");
    for (const cell of unit.table.head) headRow.append(element("th", "", cell));
    table.append(headRow);
    for (const row of unit.table.rows) {
      const tr = document.createElement("tr");
      row.forEach((cell, i) => tr.append(element(i === 0 ? "th" : "td", "", cell)));
      table.append(tr);
    }
    wrap.append(table);
    container.append(wrap);
  }

  if (unit.tips && unit.tips.length) {
    const list = element("ul", "explanation-tips");
    for (const tip of unit.tips) list.append(element("li", "", tip));
    container.append(list);
  }
}

// ---------- Grammatik screen (read up on everything) ----------

// "Thema 3 von 19 · Mehrzahl der Nomen" for the start screen
function grammarStatusText() {
  const index = currentUnitIndex();
  if (index < 0) return "Alle " + grammarUnits.length + " Themen geschafft";
  return "Thema " + (index + 1) + " von " + grammarUnits.length + " · " + grammarUnits[index].title;
}

function showGrammarList() {
  const current = currentUnitIndex();
  const list = $("grammar-list");
  list.innerHTML = "";
  for (const topic of GRAMMAR_TOPICS) {
    list.append(element("h3", "grammar-group", topic));
    grammarUnits.forEach((unit, i) => {
      if (unit.topic !== topic) return;
      const row = element("button", "grammar-row");
      const status = unitDone(unit) ? "✓" : i === current ? "●" : "";
      row.append(element("span", "grammar-number", String(i + 1)));
      row.append(element("span", "grammar-title", unit.title));
      row.append(element("span", "grammar-status" + (status === "●" ? " current" : ""), status));
      row.addEventListener("click", () => showGrammarDetail(unit));
      list.append(row);
    });
  }
  $("grammar-list").classList.remove("hidden");
  $("grammar-detail").classList.add("hidden");
  showScreen("grammar");
}

function showGrammarDetail(unit) {
  renderExplanation($("grammar-detail-body"), unit);
  $("grammar-list").classList.add("hidden");
  $("grammar-detail").classList.remove("hidden");
  window.scrollTo(0, 0);
}

$("btn-grammar").addEventListener("click", showGrammarList);
$("btn-grammar-back").addEventListener("click", showGrammarList);
$("btn-grammar-close").addEventListener("click", () => showStart());
