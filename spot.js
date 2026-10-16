// Babbler – "Fehler finden" (spot the mistake), one task inside a round.
// A task shows four sentences; one or two of them contain a deliberate mistake
// (the "wrong" version from data/sentences.json). Tap the faulty ones, then "Prüfen":
// every sentence is marked, and mistakes are shown with the correction and a short rule.
// The task counts as solved when all four sentences were judged correctly.

const SPOT_SIZE = 4;  // sentences per task

let spotEntries = [];  // [{ sentence, wrong, selected }, …] of the current task
let spotChecked = false;

// Build `count` tasks from the given sentences (already filtered by topic).
function makeSpotTasks(sentences, count) {
  // Only use sentences up to your current level – but always at least four.
  const level = unlockedLevel(sentences);
  let usable = sentences.filter((s) => s.level <= level);
  if (usable.length < SPOT_SIZE) {
    usable = sentences.slice().sort((a, b) => a.level - b.level).slice(0, SPOT_SIZE);
  }

  // Draw sentences without repeats until the pool is used up, then start again.
  // The faulty ones are picked with memory: rules you often miss come more often (rules.js).
  let queue = [];
  const result = [];
  for (let t = 0; t < count; t++) {
    if (queue.length < SPOT_SIZE) queue = queue.concat(shuffle(usable.filter((s) => !queue.includes(s))));
    const mistakes = randomInt(1, 2);  // 1 or 2 faulty sentences
    const faulty = takeByRule(queue, mistakes);
    const correct = queue.splice(0, SPOT_SIZE - faulty.length);
    const entries = faulty
      .map((s) => ({ sentence: s, wrong: true, selected: false }))
      .concat(correct.map((s) => ({ sentence: s, wrong: false, selected: false })));
    result.push({ type: "spot", entries: shuffle(entries) });
  }
  return result;
}

function showSpotTask(entries) {
  spotEntries = entries;
  spotChecked = false;
  $("btn-spot").textContent = "Prüfen";
  // Small hint which rule the app is focusing on (only once it knows enough)
  const weak = weakestRuleName();
  $("spot-focus").textContent = weak ? "Mehr Übung bei: " + weak : "";

  const list = $("spot-list");
  list.innerHTML = "";
  entries.forEach((entry, i) => {
    entry.selected = false;
    const tile = document.createElement("button");
    tile.className = "spot-item";
    const text = document.createElement("span");
    text.className = "spot-text";
    text.textContent = entry.wrong ? entry.sentence.wrong : entry.sentence.it;
    tile.append(text);
    tile.addEventListener("click", () => toggleSpot(i));
    list.append(tile);
  });
}

// Mark / unmark a sentence as "has a mistake".
function toggleSpot(i) {
  if (spotChecked) return;
  const entry = spotEntries[i];
  entry.selected = !entry.selected;
  $("spot-list").children[i].classList.toggle("selected", entry.selected);
}

// Show which sentences were judged right, with corrections and rules.
function checkSpot() {
  spotChecked = true;
  const tiles = $("spot-list").children;
  spotEntries.forEach((entry, i) => {
    const judgedRight = entry.selected === entry.wrong;
    tiles[i].classList.add(judgedRight ? "ok" : "bad");
    // Memory: was the mistake of this rule found or overlooked?
    if (entry.wrong) recordRule(entry.sentence.rule, entry.selected);

    let verdict;
    if (entry.wrong) verdict = entry.selected ? "✓ Fehler gefunden" : "✗ Fehler übersehen";
    else verdict = entry.selected ? "✗ Dieser Satz war richtig" : "✓ Richtig";

    const feedback = document.createElement("span");
    feedback.className = "spot-feedback";
    addLine(feedback, "spot-verdict", verdict);
    if (entry.wrong) {
      addLine(feedback, "spot-fix", "Richtig: " + entry.sentence.it);
      addLine(feedback, "spot-why", entry.sentence.why);
    }
    addLine(feedback, "spot-de", entry.sentence.de);
    tiles[i].append(feedback);
  });
  $("btn-spot").textContent = "Weiter";
}

function addLine(parent, className, text) {
  const line = document.createElement("span");
  line.className = className;
  line.textContent = text;
  parent.append(line);
}

// The main button: first "Prüfen", then "Weiter" to the next task of the round.
function spotButton() {
  if (!spotChecked) return checkSpot();
  const misjudged = spotEntries.filter((entry) => entry.selected !== entry.wrong);
  missedSpots.push(...misjudged);
  finishTask(misjudged.length === 0);
}

$("btn-spot").addEventListener("click", spotButton);

// Keyboard (desktop): 1–4 mark a sentence, Enter checks / continues.
document.addEventListener("keydown", (e) => {
  if ($("screen-spot").classList.contains("hidden")) return;
  if (e.key >= "1" && e.key <= String(SPOT_SIZE)) toggleSpot(Number(e.key) - 1);
  else if (e.key === "Enter") {
    e.preventDefault();
    spotButton();
  }
});
