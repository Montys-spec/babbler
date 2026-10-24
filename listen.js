// Babbler – listening tasks ("Hören"), shown on the quiz screen (see quiz.js):
//   { type: "hoeren", card, options } – hear an Italian word or sentence, pick the German meaning
//   { type: "diktat", card }          – hear a word or a short sentence and type it in Italian
// Only words and sentences you already know (answered right once) are used, and the text is
// hidden until you have answered. Listening has its own progress (keys "hoeren|…").

// Known items as listening cards, so pickRound can choose them (due first, then new).
function listeningCards(kind, items, mode) {
  return items
    .filter((item) => itemPractised(kind, item))
    .map((item) => ({
      kind: kind,
      item: item,
      dir: "it-de",
      key: "hoeren|" + mode + "|" + kind + "|" + item.it,
      front: item.it,
      back: item.de,
      level: item.level || 1,
      rank: item.rank,
      stufe: item.stufe,
    }));
}

// Short sentences only for dictation (level 1, at most 6 words).
function shortSentences(list) {
  return list.filter((s) => s.level === 1 && s.it.split(" ").length <= 6);
}

// plan: e.g. ["wort", "satz", "diktat-wort"] (from SESSION_PLANS in level.js).
// If there are not enough known sentences yet, known words step in.
function makeListeningTasks(plan, topicWords, topicSentences) {
  if (!CAN_SPEAK || !plan.length) return [];
  const count = (type) => plan.filter((p) => p === type).length;
  const tasks = [];
  const used = new Set();
  const take = (cards, n) => {
    const picked = pickRound(cards.filter((c) => !used.has(c.item)), n);
    picked.forEach((c) => used.add(c.item));
    return picked;
  };

  // Hear a sentence → choose the meaning (missing ones are filled with words)
  const sentenceCards = take(listeningCards("satz", topicSentences, "wahl"), count("satz"));
  const wordCards = take(listeningCards("wort", topicWords, "wahl"), count("wort") + count("satz") - sentenceCards.length);
  for (const card of wordCards) tasks.push(Object.assign(makeChoiceTask(card, topicWords), { type: "hoeren" }));
  for (const card of sentenceCards) tasks.push(Object.assign(makeChoiceTask(card, topicSentences), { type: "hoeren" }));

  // Dictation (word / short sentence)
  const dictSentences = take(listeningCards("satz", shortSentences(topicSentences), "diktat"), count("diktat-satz"));
  const dictWords = take(
    listeningCards("wort", topicWords, "diktat"),
    count("diktat-wort") + count("diktat-satz") - dictSentences.length
  );
  for (const card of dictWords.concat(dictSentences)) tasks.push({ type: "diktat", card: card });
  return tasks;
}

// ▶ Anhören / 🐢 Langsam – replaces the written prompt on the quiz screen.
function audioPrompt(text) {
  const box = document.createElement("div");
  box.className = "audio-prompt";
  const play = document.createElement("button");
  play.type = "button";
  play.className = "btn btn-primary audio-play";
  play.textContent = "▶ Anhören";
  play.addEventListener("click", () => speak(text));
  const slow = document.createElement("button");
  slow.type = "button";
  slow.className = "btn btn-ghost audio-slow";
  slow.textContent = "🐢 Langsam";
  slow.addEventListener("click", () => speak(text, 0.6));
  box.append(play, slow);
  return box;
}

// Check a dictation: exact (ignoring case and punctuation) is right; only accents
// missing is right with a hint; small slips in a sentence count as right with a note.
function checkDictation(typed, item) {
  const got = normalizeAnswer(typed);
  const want = normalizeAnswer(item.it);
  if (!got) return { right: false, verdict: "✗ Keine Antwort – gehört hast du:" };
  if (got === want) return { right: true, verdict: "✓ Richtig" };
  const plainGot = withoutAccents(got);
  const plainWant = withoutAccents(want);
  if (plainGot === plainWant) return { right: true, verdict: "✓ Richtig – achte auf die Akzente:" };
  const distance = editDistance(plainGot, plainWant);
  const isSentence = want.includes(" ");
  if (isSentence && distance <= Math.max(2, Math.round(want.length * 0.08))) {
    return { right: true, verdict: "✓ Fast perfekt – kleine Fehler:" };
  }
  if (distance === 1) return { right: false, verdict: "✗ Fast – ein Buchstabe stimmt nicht:" };
  return { right: false, verdict: "✗ Gehört hast du:" };
}
