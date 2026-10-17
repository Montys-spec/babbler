// Babbler – quiz tasks inside a round, all on the same screen (#screen-quiz):
//   { type: "wahl", card, options }  – multiple choice: pick the right translation out of 4
//   { type: "luecke", card }         – fill the gap: pick the missing word out of 3
//   { type: "tippen", card }         – typing: see the German word, type the Italian one
// Answers count for the card's progress just like a swipe (see progress.js).

let quizTask = null;      // the task on screen
let quizAnswered = false;
let quizRight = false;

// ---------- Building tasks ----------

// Multiple choice for a word card. The 3 wrong options use the same direction and the
// same kind of word (noun or not), preferably from the same topic – so the article
// or the word type does not give the answer away.
function makeChoiceTask(card, topicWords) {
  const answerText = (item) => (card.dir === "it-de" ? item.de : item.it);
  const sameKind = (item) => item !== card.item && Boolean(item.g) === Boolean(card.item.g);
  let candidates = topicWords.filter(sameKind);
  if (candidates.length < 3) candidates = words.filter(sameKind);

  const wrong = [];
  for (const item of shuffle(candidates)) {
    const text = answerText(item);
    if (text !== answerText(card.item) && !wrong.some((w) => answerText(w) === text)) wrong.push(item);
    if (wrong.length === 3) break;
  }
  return { type: "wahl", card: card, options: shuffle([card.item].concat(wrong)) };
}

// Gap sentences as cards, so pickRound can choose them (due first, then new).
// Like sentences, harder levels only appear once you have reached that sentence level.
function gapCards(topicGaps, topicSentences) {
  const maxLevel = unlockedLevel(topicSentences);
  return topicGaps
    .map((gap) => ({
      kind: "luecke", item: gap, key: "luecke|" + gap.text, level: gap.level, rank: gap.rank, stufe: gap.stufe,
    }))
    .filter((card) => card.level <= maxLevel || boxOf(card.key) >= 0);
}

// The full sentence with the gap filled in.
function gapSolved(gap) {
  return gap.text.replace("___", gap.answer);
}

// ---------- Showing a task ----------

function showQuizTask(task) {
  quizTask = task;
  quizAnswered = false;
  $("quiz-options").innerHTML = "";
  $("quiz-feedback").innerHTML = "";
  $("quiz-feedback").classList.add("hidden");
  $("quiz-type-form").classList.add("hidden");
  $("btn-quiz").classList.add("hidden");
  if (task.type === "wahl") showChoice(task);
  else if (task.type === "luecke") showGap(task);
  else if (task.type === "tippen") showTyping(task);
}

function addOption(label, onPick) {
  const button = document.createElement("button");
  button.className = "quiz-option";
  if (typeof label === "string") button.textContent = label;
  else button.append(label);
  button.addEventListener("click", () => {
    if (!quizAnswered) onPick(button);
  });
  $("quiz-options").append(button);
  return button;
}

function showChoice(task) {
  const card = task.card;
  $("quiz-label").textContent = card.item.cat + " · Wähle die Übersetzung";
  $("quiz-prompt").className = "quiz-prompt";
  if (card.dir === "it-de") setItalian($("quiz-prompt"), card.item);
  else $("quiz-prompt").textContent = card.item.de;
  $("quiz-hint").textContent = "";

  for (const item of task.options) {
    let label = item.de;
    if (card.dir === "de-it") {
      label = document.createElement("span");
      setItalian(label, item);
    }
    const button = addOption(label, (picked) => answerChoice(item === card.item, picked));
    button.dataset.right = item === card.item ? "1" : "";
  }
}

function showGap(task) {
  const gap = task.card.item;
  $("quiz-label").textContent = gap.cat + " · Lücke füllen";
  $("quiz-prompt").className = "quiz-prompt long";

  // The sentence with a visible blank where the word is missing
  const [before, after] = gap.text.split("___");
  const blank = document.createElement("span");
  blank.id = "quiz-blank";
  blank.className = "gap";
  blank.textContent = " ".repeat(6);  // non-breaking spaces keep the blank visible
  $("quiz-prompt").textContent = "";
  $("quiz-prompt").append(before, blank, after);
  $("quiz-hint").textContent = gap.de;

  for (const option of shuffle(gap.options)) {
    const button = addOption(option, (picked) => answerGap(option === gap.answer, picked));
    button.dataset.right = option === gap.answer ? "1" : "";
  }
}

function showTyping(task) {
  $("quiz-label").textContent = task.card.item.cat + " · Schreib es auf Italienisch";
  $("quiz-prompt").className = "quiz-prompt";
  $("quiz-prompt").textContent = task.card.item.de;
  $("quiz-hint").textContent = task.card.item.g ? "mit Artikel" : "";
  const input = $("quiz-input");
  input.value = "";
  input.disabled = false;
  input.classList.remove("ok", "bad");
  $("quiz-type-form").classList.remove("hidden");
  $("btn-quiz").textContent = "Prüfen";
  $("btn-quiz").classList.remove("hidden");
  input.focus();
}

// ---------- Checking typed answers ----------

// Lower case, straight apostrophes, no end punctuation, single spaces.
function normalizeAnswer(text) {
  return text
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[.!?¿¡…,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function withoutAccents(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// How many single-letter edits turn a into b: add, remove, change a letter,
// or swap two neighbouring letters ("lirbo" → "libro" counts as one).
function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

// Compare the typed text with the Italian word. Any word with exactly the same German
// translation is accepted too. Returns { right, verdict }.
//   exact                → right
//   only accents differ  → right, with a hint
//   article missing      → wrong ("Fast – der Artikel fehlt")
//   one letter off       → wrong ("Fast – ein Buchstabe stimmt nicht")
function checkTyped(typed, item) {
  const got = normalizeAnswer(typed);
  if (!got) return { right: false, verdict: "✗ Keine Antwort – richtig wäre:" };
  const accepted = words.filter((w) => w.de === item.de).map((w) => normalizeAnswer(w.it));
  if (accepted.includes(got)) return { right: true, verdict: "✓ Richtig" };

  const plain = withoutAccents(got);
  const plainAccepted = accepted.map(withoutAccents);
  if (plainAccepted.includes(plain)) {
    return { right: true, verdict: "✓ Richtig – achte auf den Akzent:" };
  }
  const nounOnly = plainAccepted.map((a) => a.replace(/^(il |lo |la |i |gli |le |l')/, ""));
  if (item.g && nounOnly.includes(plain)) {
    return { right: false, verdict: "✗ Fast – der Artikel fehlt:" };
  }
  if (plainAccepted.some((a) => editDistance(plain, a) === 1)) {
    return { right: false, verdict: "✗ Fast – ein Buchstabe stimmt nicht:" };
  }
  return { right: false, verdict: "✗ Richtig wäre:" };
}

function answerTyping() {
  const card = quizTask.card;
  const input = $("quiz-input");
  const result = checkTyped(input.value, card.item);
  input.disabled = true;
  input.blur();  // so Enter now means "Weiter"
  input.classList.add(result.right ? "ok" : "bad");
  recordAnswer(card.key, result.right);
  if (!result.right) missedCards.push(card);

  const answer = document.createElement("span");
  setItalian(answer, card.item);
  const note = card.item.pl ? "Mehrzahl: " + card.item.pl : "";
  showQuizFeedback(result.right, answer, note, card.item.it, result.verdict);
}

// ---------- Answering ----------

// Colour the options: the right one green, a wrongly picked one red.
function markOptions(picked) {
  for (const button of $("quiz-options").children) {
    button.disabled = true;
    if (button.dataset.right) button.classList.add("ok");
  }
  if (!picked.dataset.right) picked.classList.add("bad");
}

function answerChoice(right, picked) {
  const card = quizTask.card;
  markOptions(picked);
  recordAnswer(card.key, right);
  if (!right) missedCards.push(card);

  const answer = document.createElement("span");
  if (card.dir === "de-it") setItalian(answer, card.item);
  else answer.textContent = card.item.de;
  showQuizFeedback(right, answer, card.item.pl ? "Mehrzahl: " + card.item.pl : "", card.item.it);
}

function answerGap(right, picked) {
  const gap = quizTask.card.item;
  markOptions(picked);
  $("quiz-blank").textContent = gap.answer;
  $("quiz-blank").classList.add(right ? "ok" : "bad");
  recordAnswer(quizTask.card.key, right);
  recordRule(gap.rule, right);
  if (!right) missedGaps.push(gap);
  showQuizFeedback(right, gapSolved(gap), gap.why, gapSolved(gap));
}

// The box under the options: verdict, the right answer, a note, and 🔊.
function showQuizFeedback(right, answer, note, italianToSpeak, verdictText) {
  quizAnswered = true;
  quizRight = right;
  const box = $("quiz-feedback");
  box.innerHTML = "";
  box.classList.remove("hidden");
  box.classList.toggle("ok", right);
  box.classList.toggle("bad", !right);

  const head = document.createElement("div");
  head.className = "quiz-feedback-head";
  const verdict = document.createElement("span");
  verdict.className = "quiz-verdict";
  verdict.textContent = verdictText || (right ? "✓ Richtig" : "✗ Richtig wäre:");
  head.append(verdict, makeSpeakButton(() => italianToSpeak));
  box.append(head);

  const answerLine = document.createElement("div");
  answerLine.className = "quiz-answer";
  answerLine.append(answer);
  box.append(answerLine);

  if (note) {
    const noteLine = document.createElement("div");
    noteLine.className = "quiz-note";
    noteLine.textContent = note;
    box.append(noteLine);
  }

  $("btn-quiz").textContent = "Weiter";
  $("btn-quiz").classList.remove("hidden");
}

// On to the next task – guarded, so a double tap cannot skip a task.
function quizNext() {
  if (!quizAnswered) return;
  quizAnswered = false;
  finishTask(quizRight);
}

// The main button: "Prüfen" for an unanswered typing task, otherwise "Weiter".
$("btn-quiz").addEventListener("click", () => {
  if (!quizAnswered && quizTask.type === "tippen") answerTyping();
  else quizNext();
});

// Enter in the text field checks the answer.
$("quiz-type-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!quizAnswered) answerTyping();
});

// Keyboard (desktop): 1–4 pick an option, Enter continues.
document.addEventListener("keydown", (e) => {
  if ($("screen-quiz").classList.contains("hidden")) return;
  if (document.activeElement === $("quiz-input")) return;  // typing tasks handle their own keys
  const options = $("quiz-options").children;
  if (!quizAnswered && e.key >= "1" && e.key <= String(options.length)) {
    options[Number(e.key) - 1].click();
  } else if (e.key === "Enter") {
    e.preventDefault();
    quizNext();
  }
});
