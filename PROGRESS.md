# Babbler – Progress

## Done
- **Session 1 (2026-10-17, Claude Code):** smallest working version.
  - Start screen with "Vokabeln üben".
  - Flashcards: Italian word (with article) → tap → German → "Weiter".
    Cards are shuffled each round; counter "3 / 10"; done screen with "Nochmal" / "Zur Startseite".
  - 10 sample words in `data/vocab.json` (greetings, food, numbers).
  - `start.command`: double-click to start a local server (Python, port 8000) and open the browser.
  - Status: tested by Monty with start.command, works. Committed.

## Files
- `index.html` – the page with three screens (start, card, done)
- `style.css` – simple mobile-first layout
- `app.js` – flashcard logic
- `data/vocab.json` – word list (`{ "it": "...", "de": "..." }`)
- `start.command` – local starter
- `.claude/launch.json` – lets Claude Code start the same local server for its own browser tests

## Next (ideas, not decided)
- Sentence exercises (translate a sentence, fill in the missing word)
- Save learning progress on the device
- iPhone install (PWA) and offline mode
- Design polish

## Open questions
- None right now.
