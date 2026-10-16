# Babbler – Progress

## Done
- **Session 1 (2026-10-17, Claude Code):** smallest working version.
  - Start screen, flashcards (tap to reveal, "Weiter"), done screen, 10 words.
  - `start.command` to run it locally. Tested by Monty, committed (e722cb1).

- **Session 2 (2026-10-17, Claude Code):** swipe cards + new design.
  - 50 words in 5 categories (Begrüßung, Essen & Trinken, Zahlen, Familie & Freunde, Alltag).
    Each word now has a `cat` field, shown small on the card.
  - Each round = 10 random words from the list.
  - Tap card → German appears → swipe right = "gewusst", swipe left = "nicht gewusst".
    Same via buttons (✓ / ✗) or arrow keys on desktop (Space/Enter reveals).
  - Card tilts while dragging and shows a "Gewusst" / "Nicht gewusst" stamp.
  - Result screen: score (e.g. 7 / 10), list of missed words, "Fehler wiederholen".
  - Progress bar on top, ✕ button back to the start.
  - New design: dark green + mint, dark mode by default; light version if the device is in light mode.
  - Results are NOT saved yet – they are gone after closing the app.
  - Status: tested by Claude (phone size, dark + light) and by Monty, works. Committed (065783a).

- **Session 3 (2026-10-17, Claude Code):** 537 words + saved progress + topics.
  - 537 words (≈ A1–A2 basic vocabulary) in 14 topics, incl. verbs (infinitive),
    adjectives (masculine form) and small words (pronouns, question words, prepositions).
    Within each topic the most useful words come first.
  - Progress is saved on the device (localStorage, key `babbler-progress-v1`) – see `progress.js`.
    Card box system: right → next box (due again after 1, 3, 7, 14, 30 days), wrong → due today again.
    "sicher" = box 3 or higher (known 3× in a row).
  - Each round: due words first, then new words (mixed across topics), max. 10.
  - Start screen: stats (heute fällig / neu / sicher), "Vokabeln üben" = all topics,
    topic list with progress bar – tap a topic to practise only that one. "Fortschritt zurücksetzen" link.
  - Card shows "· neu" next to the topic for words never seen before.
  - Status: tested by Claude in the browser and by Monty, works. Committed (ffe7afe).

- **Session 4 (2026-10-17, Claude Code):** sentences, both directions, "Fehler finden", new start screen.
  - 126 sentences (`data/sentences.json`), 9 per topic in 3 levels (1 = very short, 3 = past tense,
    longer sentences). A level opens once 70 % of the level below were answered right at least once
    (per chosen topic). Every sentence also has a deliberately wrong version + a one-line rule.
  - Both directions: IT → DE and DE → IT, for words and sentences. Each direction has its own progress.
    "Gemischt": the DE → IT card of an item only appears once its IT → DE card was answered right
    (recognise first, then recall); it queues a little later so it mixes with new words.
  - Fehler finden: 4 sentences, 1–2 contain a mistake (spelling or grammar).
    Tap the faulty ones → "Prüfen" shows correction, rule and German translation.
    Not stored in the card progress.
  - Code split into small files (see below). Old progress stays valid.
  - After Monty's feedback (same session): **no choosing of exercise type or direction** –
    Monty wants to just press "Üben" and do what the app says.
    - Each round = 10 tasks in random order: 1–2 "Fehler finden", 2–4 sentence cards, rest word cards
      (numbers vary randomly). Both directions mixed in automatically (DE → IT from about round 3).
    - A "Fehler finden" task counts as solved when all 4 sentences were judged correctly.
    - Result: "x / 10 Aufgaben gelöst", list of everything that went wrong,
      "Fehler wiederholen" replays the missed cards.
    - Start screen: "sicher" for Vokabeln and Sätze, "Üben", "10 pro Runde", swipe instructions,
      then the Thema dropdown (remembered on the device, `babbler-settings-v1`).
  - Status: tested by Claude in the browser (mixed rounds, topic filter, result screen) and by Monty,
    works. Committed.
  - Claude's suggestions for next steps (Monty decides): PWA + hosting, pronunciation button,
    new task types (multiple choice, fill the gap), article colours + plural, "Fehler finden" that
    remembers weak rules, progress backup, typing answers for DE → IT.
    Monty picked: pronunciation, new task types, article colours + plural, rule memory, typing.

- **Session 5 (2026-10-17, Claude Code, overnight):** Monty's five picks. Monty allowed committing
  without his test this time; each feature was tested by Claude in the browser and committed separately.
  1. **Pronunciation** (`audio.js`, 2719e9e): 🔊 on flashcards and in quiz feedback reads the Italian
     with the device's built-in Italian voice (Web Speech API, offline). On DE → IT cards only after revealing.
  2. **Article colours + plural** (4697247): all 259 nouns in `vocab.json` got `"g"` (m / f / mf) and,
     where sensible, `"pl"` (irregular plurals checked by hand: le uova, le braccia, gli uomini …;
     no plural for mass nouns like il latte). Article shown blue (masculine) / pink (feminine),
     plural shown after revealing. Legend on the start screen.
  3. **Multiple choice + fill the gap** (`quiz.js`, `data/gaps.json`, c353449): new quiz screen.
     Multiple choice = right translation out of 4 (same kind of word, same topic).
     Fill the gap = 70 new sentences (5 per topic, levels like the sentences), 3 options,
     German translation as hint, rule afterwards.
  4. **Typing** (af416e4): German word shown, type the Italian. Only for words already recognised
     IT → DE. Accents missing = right with hint; article missing or one typo (incl. swapped letters)
     = wrong with a "Fast" hint.
  5. **Rule memory** (`rules.js`, c1a4a3b): every sentence and gap has a `"rule"` tag. Found/overlooked
     mistakes and gap answers are counted per rule (`babbler-rules-v1`). "Fehler finden" picks faulty
     sentences weighted by weakness (up to 8×) and shows "Mehr Übung bei: …" once it knows enough.
  - Round mix now: each of the 10 slots is drawn by chance – word card 30, sentence card 18,
    multiple choice 13, gap 13, typing 13, Fehler finden 13 (max. 2 Fehler finden, 3 gaps, 3 typing).
  - Multiple choice, gap and typing answers count for the card progress like a swipe.
  - Status: all tested by Claude (dark + light, phone size, many simulated rounds). Committed.
    **Monty has not tested this version yet.**

## Files
- `index.html` – the page with five screens (start, card, spot, quiz, result)
- `style.css` – design (colours defined once at the top)
- `util.js` – small helpers (find element, switch screen, shuffle, random number)
- `progress.js` – saving progress and choosing which cards come next (card box system)
- `rules.js` – counting right/wrong per grammar rule, weighted picking
- `cards.js` – turns words/sentences into cards (direction, sentence levels), coloured articles
- `audio.js` – pronunciation (🔊)
- `swipe.js` – the drag/swipe gesture for the card
- `round.js` – a round: runs the mixed tasks, flashcards, result screen
- `spot.js` – one "Fehler finden" task
- `quiz.js` – multiple choice, fill the gap, typing
- `app.js` – start screen, putting a round together, loading the data
- `data/vocab.json` – word list (`{ "it", "de", "cat", "g"?, "pl"? }`), order matters (most useful first)
- `data/sentences.json` – sentences (`{ "cat", "level", "it", "de", "wrong", "why", "rule" }`)
- `data/gaps.json` – gap sentences (`{ "cat", "level", "text" with ___, "answer", "options", "de", "why", "rule" }`)
- `start.command` – local starter (double-click)
- `.claude/launch.json` – lets Claude Code start the same local server for its own browser tests

## Notes on the content
- Progress is keyed by the Italian text (`it`), so every `it` must be unique within its file.
  Changing an `it` text later resets that item's progress.
- Months are given without article (Italian normally uses none: "a gennaio"); days with article (il lunedì).
- Adjectives are listed in the masculine singular form only (e.g. "piccolo", not "piccola").
- Each "wrong" sentence contains exactly one mistake, chosen so that it is clearly wrong in standard
  Italian (no colloquial variants that some speakers accept).
- No translation is uncertain; words with several meanings have a note in brackets.

## Next
- **Planned for the next session (2026-10-18): iPhone version** – PWA ("Zum Home-Bildschirm"),
  offline mode, hosting. Needs a decision where the app is hosted (the iPhone cannot reach the
  Mac's local server on the go).
  - Note: the local Python server lets browsers cache files for a while, so after an update a
    browser can briefly show an old version (reload helps). The PWA step should handle updates
    properly (service worker with versioned cache).
- Ideas, not decided: progress backup as a file; more sentences/gaps per level and a level 4;
  feminine/plural forms for adjectives.

## Open questions
- None right now.
