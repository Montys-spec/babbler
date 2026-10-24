// Babbler – Niveau: one overall level (1–5) that makes the sessions harder step by step.
// It is worked out from what you know: words answered right at least once (any direction)
// and finished grammar units. Both thresholds of a Niveau must be reached.
// The Niveau decides which sections a session has and how hard they are (SESSION_PLANS).

const LEVELS = [
  { name: "Einstieg", words: 0, grammar: 0, unlocks: "" },
  { name: "Grundlagen", words: 80, grammar: 2, unlocks: "Hören" },
  { name: "Aufbau", words: 200, grammar: 5, unlocks: "Sprechen" },
  { name: "Fortgeschritten", words: 400, grammar: 9, unlocks: "Diktat" },
  { name: "Sicher", words: 700, grammar: 14, unlocks: "schwierigere Gespräche" },
];

// What a session contains per Niveau (index 0 = Niveau 1); about 20 tasks each.
//   hoeren:   listening tasks – "wort" / "satz" = hear and choose the meaning,
//             "diktat-wort" / "diktat-satz" = hear and type it
//   sprechen: highest conversation level (0 = no speaking yet); one conversation per session
// Always added: Grammatik (3 exercises + 1 topic gap) and Fehler finden (1).
const SESSION_PLANS = [
  { vokabeln: 8, check: 4, typing: 1, hoeren: [], saetze: 3, sprechen: 0 },
  { vokabeln: 6, check: 4, typing: 2, hoeren: ["wort", "wort", "wort"], saetze: 2, sprechen: 0 },
  { vokabeln: 4, check: 3, typing: 2, hoeren: ["wort", "satz", "satz"], saetze: 2, sprechen: 1 },
  { vokabeln: 4, check: 3, typing: 3, hoeren: ["satz", "satz", "diktat-wort"], saetze: 2, sprechen: 2 },
  { vokabeln: 4, check: 3, typing: 3, hoeren: ["satz", "diktat-wort", "diktat-satz"], saetze: 2, sprechen: 3 },
];

function knownWordCount() {
  return words.filter((word) => itemPractised("wort", word)).length;
}

function finishedGrammarCount() {
  return grammarUnits.filter(unitDone).length;
}

function currentLevel() {
  const known = knownWordCount();
  const grammar = finishedGrammarCount();
  let level = 1;
  LEVELS.forEach((step, i) => {
    if (known >= step.words && grammar >= step.grammar) level = i + 1;
  });
  return level;
}

// Everything the start screen needs: current Niveau and the way to the next one.
function levelInfo() {
  const level = currentLevel();
  const next = LEVELS[level];  // undefined at the highest Niveau
  const known = knownWordCount();
  const grammar = finishedGrammarCount();
  return {
    level: level,
    name: LEVELS[level - 1].name,
    next: next && {
      level: level + 1,
      unlocks: next.unlocks,
      words: { have: Math.min(known, next.words), need: next.words },
      grammar: { have: Math.min(grammar, next.grammar), need: next.grammar },
    },
  };
}

function sessionPlan() {
  return SESSION_PLANS[currentLevel() - 1];
}
