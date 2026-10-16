# Babbler – project rules

## What Babbler is
- A personal app that teaches Italian to a German speaker.
- Version 1: vocabulary flashcards and simple sentences
  (e.g. translate a sentence, fill in the missing word).
- No gamification, no accounts, no login.
- Runs on iPhone as a Progressive Web App (installed via Safari
  "Add to Home Screen"); also works in a desktop browser.

## The owner
- Monty reads code but does not write it.
- After every change, explain in plain English: what changed,
  which files, and why.
- If a requirement is unclear, ask before building.

## Tech rules
- Plain HTML, CSS and JavaScript. No frameworks, no build step,
  no new dependencies without asking first.
- Mobile-first: designed for an iPhone screen, works offline.
- Lesson content lives in separate data files (JSON), not in the code.
- Learning progress is stored on the device only. No servers,
  no tracking.
- Keep files small and readable; comment anything non-obvious.

## Content rules
- App interface in German; lessons are Italian <-> German.
- Use correct standard Italian; always give nouns with their
  article (il, la, lo, l', i, le, gli).
- Flag any translation you are not sure about.

## Working rules
- One small feature at a time; make sure it runs before moving on.
- Commit to Git only after Monty confirms a step works.
- Never delete or rename files without asking. Stay inside this folder.
- The machine is an Intel Mac with 8 GB RAM: prefer lightweight
  tools, never install heavy software (Xcode, Docker) without asking.
- Two agents work on this project (Claude Code and Antigravity),
  one at a time. Keep PROGRESS.md up to date: what was done,
  what is next, open questions.