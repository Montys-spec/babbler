// Babbler – which grammar rules you get right or wrong, stored on this device only.
// Every gap sentence and every "Fehler finden" sentence has a "rule" tag, e.g.
// "artikel", "angleichung", "verbform", "hilfsverb", "praeposition", "mehrzahl",
// "schreibung", "wortwahl". Each answer is counted here.

const RULES_KEY = "babbler-rules-v1";

// Shape: { "artikel": { seen: 12, missed: 4 }, … }
let ruleStats = loadRuleStats();

function loadRuleStats() {
  try {
    return JSON.parse(localStorage.getItem(RULES_KEY)) || {};
  } catch (err) {
    return {};
  }
}

function recordRule(rule, right) {
  if (!rule) return;
  const stats = ruleStats[rule] || { seen: 0, missed: 0 };
  stats.seen++;
  if (!right) stats.missed++;
  ruleStats[rule] = stats;
  try {
    localStorage.setItem(RULES_KEY, JSON.stringify(ruleStats));
  } catch (err) {
    // not saved – the app still works
  }
}

// German names, for the hint on the "Fehler finden" screen
const RULE_NAMES = {
  artikel: "Artikel",
  angleichung: "Endungen anpassen",
  verbform: "Verbformen",
  hilfsverb: "essere oder avere",
  praeposition: "Präpositionen",
  mehrzahl: "Mehrzahl",
  schreibung: "Rechtschreibung & Akzente",
  wortwahl: "Wortwahl",
};

// How often a rule goes wrong (0 … 1). Smoothed: a rule without answers counts as 0.5,
// and a single answer does not swing it all the way.
function ruleWeakness(rule) {
  const stats = ruleStats[rule] || { seen: 0, missed: 0 };
  return (stats.missed + 1) / (stats.seen + 2);
}

// Picking weight: a weak rule comes up to 8× as often as a mastered one.
function ruleWeight(rule) {
  return 0.5 + 3.5 * ruleWeakness(rule);
}

// Take `count` items out of `pool` (which shrinks), weak rules more likely.
function takeByRule(pool, count) {
  const picked = [];
  while (picked.length < count && pool.length) {
    const total = pool.reduce((sum, item) => sum + ruleWeight(item.rule), 0);
    let roll = Math.random() * total;
    let index = pool.findIndex((item) => (roll -= ruleWeight(item.rule)) < 0);
    if (index < 0) index = pool.length - 1;
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

// The rule you currently miss most – only once there is enough data (3+ answers)
// and it really goes wrong often. Returns its German name or "".
function weakestRuleName() {
  let worst = "";
  let worstValue = 0.5;
  for (const rule of Object.keys(ruleStats)) {
    if (ruleStats[rule].seen >= 3 && ruleWeakness(rule) > worstValue) {
      worst = rule;
      worstValue = ruleWeakness(rule);
    }
  }
  return RULE_NAMES[worst] || "";
}

function resetRuleStats() {
  ruleStats = {};
  try {
    localStorage.removeItem(RULES_KEY);
  } catch (err) {
    // ignore
  }
}
