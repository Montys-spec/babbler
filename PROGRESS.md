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

## Files
- `index.html` – the page with four screens (start, card, spot, result)
- `style.css` – design (colours defined once at the top)
- `util.js` – small helpers (find element, switch screen, shuffle)
- `progress.js` – saving progress and choosing which cards come next (card box system)
- `cards.js` – turns words/sentences into cards (direction, sentence levels)
- `swipe.js` – the drag/swipe gesture for the card
- `round.js` – a round: runs the mixed tasks, flashcards, result screen
- `spot.js` – one "Fehler finden" task
- `app.js` – start screen, putting a round together, loading the data
- `data/vocab.json` – word list (`{ "it", "de", "cat" }`), order matters (most useful first)
- `data/sentences.json` – sentences (`{ "cat", "level", "it", "de", "wrong", "why" }`)
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

## Next (ideas, not decided)
- iPhone install (PWA, "Zum Home-Bildschirm") and offline mode – progress then lives on the iPhone.
  Needs a decision where the app is hosted (the iPhone cannot reach the Mac's local server on the go).
- More sentences per level (currently 3 per topic and level) and a level 4
- "Fehler finden": remember which rules you often miss
- Show feminine/plural forms for adjectives and nouns

## Open questions
- None right now.
