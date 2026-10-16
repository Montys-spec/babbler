// Babbler – swipe gesture for the flashcard.
// Lets the user drag the card left or right with a finger or the mouse.
// Far enough → the card flies off screen; not far enough → it snaps back.
// Works with touch (iPhone) and mouse (desktop) via "pointer" events.

const SWIPE_THRESHOLD = 90;  // pixels the card must be dragged to count as a swipe
const FLY_DURATION = 250;    // milliseconds; must match the transition in style.css

// card:              the element to make swipeable
// options.canSwipe:  function → true when swiping is allowed (after revealing)
// options.onSwipe:   function("left" | "right"), called after the card has flown out
// Returns { fly, reset } so buttons and keyboard can trigger the same animation.
function makeSwipeable(card, options) {
  let startX = null;  // finger position when the drag started (null = not dragging)
  let dx = 0;         // how far the card has been dragged so far
  let busy = false;   // true while the fly-out animation runs

  // Move and tilt the card; "--swipe" (-1 … 1) lets CSS fade in the stamps.
  function moveTo(x) {
    card.style.transform = "translateX(" + x + "px) rotate(" + x / 18 + "deg)";
    const strength = Math.max(-1, Math.min(1, x / SWIPE_THRESHOLD));
    card.style.setProperty("--swipe", strength);
  }

  card.addEventListener("pointerdown", (e) => {
    if (busy || !options.canSwipe()) return;
    startX = e.clientX;
    dx = 0;
    card.setPointerCapture(e.pointerId);  // keep receiving moves even outside the card
    card.classList.add("dragging");       // disables the CSS transition while dragging
  });

  card.addEventListener("pointermove", (e) => {
    if (startX === null) return;
    dx = e.clientX - startX;
    moveTo(dx);
  });

  function endDrag() {
    if (startX === null) return;
    startX = null;
    card.classList.remove("dragging");
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      fly(dx > 0 ? "right" : "left");
    } else {
      moveTo(0);  // snap back to the middle
    }
  }
  card.addEventListener("pointerup", endDrag);
  card.addEventListener("pointercancel", endDrag);

  // Animate the card off screen, then report the direction.
  function fly(direction) {
    if (busy) return;
    busy = true;
    const sign = direction === "right" ? 1 : -1;
    moveTo(sign * window.innerWidth * 1.2);
    setTimeout(() => {
      busy = false;
      options.onSwipe(direction);
    }, FLY_DURATION);
  }

  // Put the card back in the middle instantly (no animation) and play the "enter" pop.
  function reset() {
    card.classList.add("dragging");
    moveTo(0);
    void card.offsetWidth;  // force the browser to apply the jump before re-enabling animation
    card.classList.remove("dragging");
    card.classList.remove("enter");
    void card.offsetWidth;  // restart the CSS animation
    card.classList.add("enter");
  }

  return { fly, reset };
}
