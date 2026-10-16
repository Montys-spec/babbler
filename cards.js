// Babbler – turns words and sentences into practice "cards".
// A card is one item (a word or a sentence) asked in one direction:
//   "it-de" = Italian is shown, German is hidden
//   "de-it" = German is shown, Italian is hidden
// Each card has its own progress, so you can know a word one way but not the other.

const UNLOCK_SHARE = 0.7;  // a sentence level opens once 70 % of the level below were answered right
const REVERSE_DELAY = 1;   // German→Italian cards queue a bit later, so they mix with new words

// The storage key of a card. Italian→German words keep the plain Italian word as key,
// so the progress saved before directions existed stays valid.
function cardKey(kind, item, dir) {
  if (kind === "wort" && dir === "it-de") return item.it;
  return kind + "|" + dir + "|" + item.it;
}

// kind: "wort" or "satz"
function makeCard(kind, item, dir) {
  return {
    kind: kind,
    item: item,
    dir: dir,
    key: cardKey(kind, item, dir),
    front: dir === "it-de" ? item.it : item.de,
    back: dir === "it-de" ? item.de : item.it,
    level: item.level || 1,  // words have no level → all count as level 1
    rank: dir === "it-de" ? item.rank : item.rank + REVERSE_DELAY,
  };
}

// Has the item been answered right at least once (in either direction)?
function itemPractised(kind, item) {
  return boxOf(cardKey(kind, item, "it-de")) >= 1 || boxOf(cardKey(kind, item, "de-it")) >= 1;
}

// Is the item "sicher" in at least one direction?
function itemLearned(kind, item) {
  return (
    boxOf(cardKey(kind, item, "it-de")) >= LEARNED_BOX ||
    boxOf(cardKey(kind, item, "de-it")) >= LEARNED_BOX
  );
}

// The highest sentence level that may bring in new sentences.
// Level 2 opens when 70 % of level 1 were answered right at least once, and so on.
function unlockedLevel(sentences) {
  const maxLevel = Math.max(1, ...sentences.map((s) => s.level));
  for (let level = 1; level < maxLevel; level++) {
    const atLevel = sentences.filter((s) => s.level === level);
    const practised = atLevel.filter((s) => itemPractised("satz", s)).length;
    if (atLevel.length && practised / atLevel.length < UNLOCK_SHARE) return level;
  }
  return maxLevel;
}

// All cards for a list of items, in both directions.
// An item's German→Italian card only joins once its Italian→German card was answered
// right – first you learn to recognise a word, then to recall it.
function buildCards(kind, items) {
  const cards = [];
  for (const item of items) {
    const forward = makeCard(kind, item, "it-de");
    const backward = makeCard(kind, item, "de-it");
    cards.push(forward);
    if (boxOf(forward.key) >= 1 || boxOf(backward.key) >= 0) cards.push(backward);
  }
  if (kind !== "satz") return cards;

  // Sentences above the unlocked level stay hidden until you get there
  // (unless they were already practised, e.g. before the level rules existed).
  const maxLevel = unlockedLevel(items);
  return cards.filter((card) => card.level <= maxLevel || boxOf(card.key) >= 0);
}
