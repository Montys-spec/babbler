// Babbler – speaking: short everyday conversations (data/dialogues.json).
// Each turn of a conversation is a card on the card screen: the question is read aloud and
// shown, with a German hint what to answer. You answer out loud, tap to see and hear a model
// answer, then judge yourself (swipe right / left) – like the flashcards. Nothing is recorded.
// Conversations have levels 1–3; which levels you get depends on your Niveau (level.js).

const DIALOGUES_FILE = "data/dialogues.json";

let dialogues = [];

// Called once after loading: give every turn what the card screen needs.
function prepareDialogues(list) {
  dialogues = list;
  for (const dialogue of list) {
    dialogue.turns.forEach((turn, i) => {
      turn.cat = "Sprechen · " + dialogue.title;
      turn.it = turn.answers[0];  // the model answer (read aloud after revealing)
      turn.de = turn.qDe;
      turn.step = (i + 1) + " / " + dialogue.turns.length;
    });
  }
}

function turnCard(dialogue, turn, i) {
  return {
    kind: "sprechen",
    item: turn,
    dir: "it-de",
    key: "sprechen|" + dialogue.id + "|" + i,
    front: turn.q,
    back: turn.answers[0],
    level: dialogue.level,
    rank: i + 1,
  };
}

function dialogueCards(dialogue) {
  return dialogue.turns.map((turn, i) => turnCard(dialogue, turn, i));
}

function dialogueDone(dialogue) {
  return dialogueCards(dialogue).every((card) => boxOf(card.key) >= 1);
}

// One conversation for a session, up to the given level:
// one with due turns first, then the next new one, otherwise a random repeat.
function dialogueForSession(maxLevel) {
  const allowed = dialogues.filter((d) => d.level <= maxLevel);
  if (!allowed.length) return null;
  const due = allowed.find((d) => dialogueCards(d).some((card) => cardStatus(card.key) === "faellig"));
  const fresh = allowed.find((d) => !dialogueDone(d));
  const dialogue = due || fresh || allowed[randomInt(0, allowed.length - 1)];
  return { dialogue: dialogue, cards: dialogueCards(dialogue) };
}
