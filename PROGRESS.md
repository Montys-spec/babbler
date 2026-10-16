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
  - Status: tested by Claude in the browser and by Monty, works. Committed.

## Files
- `index.html` – the page with three screens (start, card, result)
- `style.css` – design (colours defined once at the top)
- `app.js` – screens and round logic
- `progress.js` – saving progress and choosing which words come next
- `swipe.js` – the drag/swipe gesture for the card
- `data/vocab.json` – word list (`{ "it": "...", "de": "...", "cat": "..." }`), order matters (most useful first)
- `start.command` – local starter (double-click)
- `.claude/launch.json` – lets Claude Code start the same local server for its own browser tests

## Notes on the word list
- Progress is keyed by the Italian word (`it`), so every `it` must be unique. Changing an `it`
  text later resets that word's progress.
- Months are given without article (Italian normally uses none: "a gennaio"); days with article (il lunedì).
- Adjectives are listed in the masculine singular form only (e.g. "piccolo", not "piccola").
- No translation is uncertain; words with several meanings have a note in brackets.

## Next (ideas, not decided)
- iPhone install (PWA, "Zum Home-Bildschirm") and offline mode – progress then lives on the iPhone
- Practise in the other direction (German → Italian)
- Sentence exercises (translate a sentence, fill in the missing word)
- Show feminine/plural forms for adjectives and nouns

## Open questions
- None right now.
