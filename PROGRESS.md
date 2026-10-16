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
  - Status: tested by Claude (phone size, dark + light) and by Monty, works. Committed.

## Files
- `index.html` – the page with three screens (start, card, result)
- `style.css` – design (colours defined once at the top)
- `app.js` – round logic: picking words, reveal, scoring, result screen
- `swipe.js` – the drag/swipe gesture for the card
- `data/vocab.json` – word list (`{ "it": "...", "de": "...", "cat": "..." }`)
- `start.command` – local starter (double-click)
- `.claude/launch.json` – lets Claude Code start the same local server for its own browser tests

## Next (ideas, not decided)
- Save progress on the device (which words you know), and show weak words more often
- Choose a category before starting
- Sentence exercises (translate a sentence, fill in the missing word)
- iPhone install (PWA) and offline mode

## Open questions
- Should "gewusst / nicht gewusst" be remembered between sessions (spaced repetition)?
- Some German translations carry a note in brackets, e.g. "prego" = "bitte (als Antwort auf „danke“)".
  Is that format OK?
