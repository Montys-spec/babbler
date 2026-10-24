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
    Monty clicked through it afterwards and liked it.

- **Session 6 (2026-10-18, Claude Code):** Etappen + topic fold-out (Monty's feedback).
  - The "0 / 537 sicher" overview is replaced by **Etappen** (`journey.js`): every solved task is one
    step, 30 steps = one Etappe, shown as 10 blocks ("Etappe 3 · 18 / 30", "Noch 12 gelöste Aufgaben
    bis Etappe 4"). Below it one thin overall bar: words & sentences answered right at least once.
    On first start, earlier practice is counted (sum of all card boxes), so nobody starts at zero.
    Result screen shows the Etappe after the round, or "Etappe 2 geschafft – weiter mit Etappe 3".
    Kept calm on purpose: no points, badges or streaks (AGENTS.md: no gamification).
  - **Topic fold-out** instead of the native dropdown: one row "Thema · Alle Themen ⌄"; tapping opens
    the list of all topics inline, tapping a topic selects it and closes the list.
  - Status: tested by Claude in the browser and by Monty, works. Committed.

- **Session 7 (2026-10-18, Claude Code):** vocabulary Stufen (Monty's wish).
  - Words now in three files: `data/vocab.json` = Stufe 1 Grundwortschatz (537, unchanged),
    `data/vocab-2.json` = Stufe 2 Alltag (625: extends the 14 topics + new topics
    Gefühle & Charakter, Freizeit & Hobbys, Einkaufen), `data/vocab-3.json` = Stufe 3
    Fachwortschatz (336: Finanzen, Recht & Regulierung, Technik & IT). Total 1,498 words.
    The Stufe comes from the file (set when loading); all nouns have gender/plural.
  - Specialist topics got 9 sentences (3 levels) and 5 gaps each (in `sentences.json` / `gaps.json`).
    Sentences and gaps belong to the Stufe of their topic.
  - Unlocking (`unlockedStufe` in `cards.js`): with "Alle Themen", Stufe 2 opens once 70 % of the
    Stufe 1 words were answered right at least once (376 words); Stufe 3 likewise after Stufe 2 (438).
    **A topic picked in the fold-out is fully open** (all Stufen), so specialist topics can be
    practised any time. Fold-out shows tags "Stufe 2" / "Fachwortschatz".
  - New cards: two queues (first-time items / German→Italian of known items), each sorted by
    Stufe → level → rank, merged 2 : 1 (`mixNewCards` in `progress.js`), so reversed old words
    never block new ones. Ranks are counted per topic *and* Stufe, so a new Stufe mixes all topics.
  - Start screen: the "Gesamt" bar is replaced by "Stufe 1 · Grundwortschatz · 12 / 376" with
    "Noch 364 Wörter bis Stufe 2".
  - Status: tested by Claude in the browser (unlocking simulated for all Stufen, 30 mixed rounds)
    and by Monty, works. Committed.

- **Session 8 (2026-10-17, Claude Code):** iPhone version (PWA) + backup/transfer.
  - Hosting decision (Monty): **GitHub Pages**, with his existing GitHub account. GitHub CLI (`gh`)
    installed via Homebrew with his OK; Homebrew had to build it from source and installed Go
    (~250 MB) as a build tool – Claude offered to remove Go afterwards.
  - `manifest.json` + `icons/` (512, 192, 180 px; "B." on dark green) + iPhone meta tags in
    `index.html` → "Zum Home-Bildschirm" opens Babbler full screen with its own icon.
  - `sw.js` (service worker) = offline mode, strategy "network first": online every file is fetched
    fresh (so updates arrive immediately – this also fixes the old browser-cache problem), offline the
    stored copy is used. All app files are stored on install. **New files must be added to FILES in sw.js.**
  - `backup.js`: "Sicherung speichern" (share sheet on iPhone/Mac Safari → AirDrop/Dateien; download
    elsewhere) and "Sicherung laden" (file picker, checks the file, asks before replacing, reloads).
    The file contains all `babbler-…` keys (progress, rule memory, Etappen, topic).
    Transfer Mac → iPhone: on the Mac "Sicherung speichern" → AirDrop → on the iPhone app "Sicherung laden".
  - `.claude/launch.json`: extra test server "babbler-test" on port 8002 (the in-app browser only allows
    service workers on servers it started itself).
  - Tested by Claude: all 24 files stored; with the server switched off the app loads and a round starts;
    backup saved and restored on an empty device; foreign files are refused.
  - Status: tested by Monty on the Mac, works. Committed.
  - Publishing: GitHub account "Montys-spec", public repository "babbler", GitHub Pages from `main`.
    Commits use GitHub's private address (343699428+Montys-spec@users.noreply.github.com, set only for
    this repository); the email in all earlier commits was replaced before the first upload (Monty's choice).
    To publish an update later: commit, then `git push` – GitHub Pages updates within about a minute.
  - **Live: https://montys-spec.github.io/babbler/** (repo: https://github.com/Montys-spec/babbler).
    Checked by Claude: all files online, service worker active on the live site, 24 files stored for offline use.
  - Local leftovers on Monty's Mac only (not uploaded): tag `backup-before-email-change` and
    `refs/original/…` from the email rewrite – they still contain the old email; can be deleted later.

- **Session 9 (2026-10-19, Claude Code):** grammar + sessions in sections (Monty's wish).
  - **Sessions in 5 sections** instead of a random mix, fixed order, one kind of task per section,
    each with a title screen ("Abschnitt 2 von 5 · Vokabel-Check" + one line what to do):
    1 Vokabeln (8 word cards) · 2 Vokabel-Check (4: multiple choice + up to 2 typing) ·
    3 Sätze (3 sentence cards) · 4 Grammatik (explanation + 3 unit exercises + 1 topic gap) ·
    5 Fehler finden (1). 20 tasks ≈ 10 minutes. Sizes in `SESSION` in `app.js`; empty sections are skipped.
    Result screen shows the score per section. Title screens don't count as tasks.
  - **Grammar** (`data/grammar.json`, `grammar.js`): 19 units in learning order, 152 exercises (gap with
    3 options, German translation as hint, rule afterwards). Topics: Substantive & Adjektive (Geschlecht,
    Artikel, Mehrzahl, Adjektive), Pronomen (Subjekt, Possessiv, reflexiv, Objekt direkt/indirekt + piacere),
    Verben & Adverbien (essere/avere, Präsens -are/-ere/-ire, andare/fare/stare/venire, Modalverben,
    Perfekt mit avere/essere, Adverbien -mente/bene/male), Präpositionen (Gebrauch, + Artikel).
    Each unit: short German explanation, table, tips. A unit is done at 70 % of its exercises answered
    right once; then the next one is current (≈ 3–4 sessions per unit). One due exercise of an earlier
    unit replaces one exercise. After all units: random repetition.
  - Start screen: row "Grammatik · Thema 3 von 19 · …" opens the Grammatik screen (all units by topic,
    ✓ done / ● current; tap = explanation). Text under "Üben": the 5 sections.
  - `sw.js`: cache "babbler-v2", new files grammar.js and data/grammar.json in FILES.
  - Status: tested by Claude in the browser (structure, explanations on phone width, unit progression,
    15 simulated sessions without errors) and by Monty, works. Committed and published.

- **Session 10 (2026-10-24, Claude Code):** listening, speaking, Niveau (Monty's ideas + Claude's plan).
  Monty's decisions: speaking is **self-check** (no speech recognition – offline, nothing leaves the
  phone); sessions stay **about 20 tasks** (fewer plain word cards at higher levels).
  - **Niveau 1–5** (`level.js`): from known words (answered right once) + finished grammar units –
    1 Einstieg (0/0) · 2 Grundlagen (80 words, 2 units) · 3 Aufbau (200, 5) · 4 Fortgeschritten (400, 9)
    · 5 Sicher (700, 14). `SESSION_PLANS` sets per Niveau: word cards 8→4, check 4→3, typing 1→3,
    listening tasks, sentence cards 3→2, highest conversation level (0 → 1 → 2 → 3).
    Start screen: "Niveau 2 · Grundlagen", bar, "Für Niveau 3: x/200 Wörter · y/5 Grammatik-Themen ·
    neu: Sprechen" (replaces the Stufe line; Stufen still open by themselves). Line under "Üben" lists
    the sections. Result screen: "Niveau 3 erreicht: Aufbau · neu: Sprechen" when it happens.
  - **Hören** (`listen.js`, from Niveau 2): ▶ Anhören / 🐢 Langsam instead of the text; only known items.
    N2: 3 words → choose meaning · N3: 1 word + 2 sentences · N4: 2 sentences + dictation of a word ·
    N5: 1 sentence + dictation of a word and a short sentence. Dictation check: accents optional,
    small slips in a sentence count as right ("Fast perfekt"). Own progress keys `hoeren|…`.
    Skipped automatically if the device has no speech output.
  - **Sprechen** (`speak.js`, `data/dialogues.json`, from Niveau 3): 12 conversations, 44 turns,
    levels 1–3 (Kennenlernen, Café, Verabredung, Über dich · Restaurant, Bahnhof, Weg, Arzt ·
    Wochenende, Vorstellungsgespräch, Meinung, Hotel). One conversation per session, turns in order,
    on the card screen: question read aloud + German hint → answer out loud → tap: model answer,
    meaning of the question, other possible answers → "✓ Konnte ich / ✗ Noch nicht". Due conversations
    first, then the next new one. Progress keys `sprechen|<id>|<turn>`.
  - Session order: Vokabeln → Vokabel-Check → Hören → Sätze → Grammatik → Sprechen → Fehler finden.
  - `sw.js`: cache "babbler-v3" with the new files.
  - Status: tested by Claude in the browser (all 5 Niveaus, 40 random sessions, level-up, dictation
    check, screens at phone width) and by Monty, works. Committed and published.

## iPhone: install & transfer progress
1. On the iPhone open **Safari** → https://montys-spec.github.io/babbler/ → Teilen (□↑) →
   **"Zum Home-Bildschirm"** → Hinzufügen. Then always start Babbler from the home-screen icon.
2. Transfer from the Mac: open Babbler on the Mac as before (start.command) → **"Sicherung speichern"**
   → AirDrop to the iPhone (in Chrome the file is downloaded; then Finder → right-click → Teilen → AirDrop).
3. On the iPhone, **in the home-screen app** (not in a Safari tab – they have separate storage):
   **"Sicherung laden"** → choose the file (Dateien → Downloads) → confirm.

## Files
- `index.html` – the page with five screens (start, card, spot, quiz, result)
- `style.css` – design (colours defined once at the top)
- `util.js` – small helpers (find element, switch screen, shuffle, random number)
- `progress.js` – saving progress and choosing which cards come next (card box system)
- `rules.js` – counting right/wrong per grammar rule, weighted picking
- `journey.js` – Etappen: counting solved tasks
- `cards.js` – turns words/sentences into cards (direction, sentence levels), coloured articles
- `audio.js` – pronunciation (🔊)
- `swipe.js` – the drag/swipe gesture for the card
- `round.js` – a round: runs the mixed tasks, flashcards, result screen
- `spot.js` – one "Fehler finden" task
- `quiz.js` – multiple choice, fill the gap, typing
- `grammar.js` – grammar units: current unit, explanations, Grammatik screen
- `level.js` – Niveau 1–5 and the session plan per Niveau
- `listen.js` – listening tasks (hear → choose, dictation)
- `speak.js` – speaking: conversations as self-check cards
- `app.js` – start screen, putting a round together, loading the data, registers the service worker
- `backup.js` – backup & transfer of the progress (file)
- `sw.js` – service worker: offline mode (list of all app files inside)
- `manifest.json`, `icons/` – iPhone app name and icons
- `data/vocab.json`, `data/vocab-2.json`, `data/vocab-3.json` – words of Stufe 1 / 2 / 3
  (`{ "it", "de", "cat", "g"?, "pl"? }`), order matters (most useful first); every `it` unique across all three
- `data/sentences.json` – sentences (`{ "cat", "level", "it", "de", "wrong", "why", "rule" }`)
- `data/gaps.json` – gap sentences (`{ "cat", "level", "text" with ___, "answer", "options", "de", "why", "rule" }`)
- `data/dialogues.json` – conversations (`{ "id", "level", "title", "situation",
  "turns": [{ "q", "qDe", "hint", "answers": [model answer, alternatives…] }] }`)
- `data/grammar.json` – grammar units in learning order (`{ "id", "topic", "rule", "title", "intro",
  "table": { "head", "rows" }, "tips", "exercises": [gap-like objects] }`); progress keys `gram|<id>|<text>`
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
- Stufe 3 – worth knowing / please double-check if it matters professionally:
  - English loanwords used in Italian: la compliance, il rating, la privacy, il budget, il backup,
    il cloud, la mail (also "l'e-mail"), i social media (colloquially "i social").
  - "il consiglio di amministrazione" is translated "Verwaltungsrat / Vorstand"; Italian and
    German/Swiss board structures don't map one to one.
  - "il codice fiscale" is the Italian personal tax code, translated "Steuernummer".
  - "la Borsa" (stock exchange) is written with a capital B, unlike "la borsa" (bag).

## Next
- Monty: install on the iPhone and transfer the progress (see "iPhone: install & transfer progress").
- Ideas, not decided: progress backup as a file; more sentences/gaps per level and a level 4;
  feminine/plural forms for adjectives.
- Other ideas from session 6, not decided: progress backup/transfer (do with the PWA),
  verb trainer (present tense), listening task, more sentences/gaps and a level 4.

## Open questions
- None right now.
