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

function resetRuleStats() {
  ruleStats = {};
  try {
    localStorage.removeItem(RULES_KEY);
  } catch (err) {
    // ignore
  }
}
