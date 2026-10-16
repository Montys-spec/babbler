// Babbler – pronunciation.
// Uses the voice that is built into the device/browser (Web Speech API):
// no internet, no extra files. On iPhone and Mac an Italian voice is preinstalled.

const CAN_SPEAK = "speechSynthesis" in window;

// The best Italian voice the device offers (or null – then the browser picks one for "it-IT").
function italianVoice() {
  const voices = speechSynthesis.getVoices();
  return voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("it")) || null;
}

// Read an Italian text out loud. Stops anything that is still speaking first.
function speak(text) {
  if (!CAN_SPEAK) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/…/g, ""));
  utterance.lang = "it-IT";
  const voice = italianVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = 0.9;  // a little slower than normal, easier to follow
  speechSynthesis.speak(utterance);
}

// A round 🔊 button that reads `getText()` aloud. Taps on it never reach the
// element underneath (so tapping 🔊 on a card does not reveal or drag the card).
function makeSpeakButton(getText) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "speak-btn";
  button.setAttribute("aria-label", "Aussprache anhören");
  button.textContent = "🔊";
  if (!CAN_SPEAK) button.classList.add("hidden");
  button.addEventListener("pointerdown", (e) => e.stopPropagation());
  button.addEventListener("click", (e) => {
    e.stopPropagation();
    speak(getText());
  });
  return button;
}
