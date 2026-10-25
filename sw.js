// Babbler – service worker: lets the app work offline (e.g. on the iPhone without internet).
//
// Strategy "network first": with internet, every file is fetched fresh – so updates arrive
// right away – and a copy is kept. Without internet (or if the network takes too long),
// the kept copy is used. All app files are copied once when the service worker is installed.
//
// When you add a new file to the app, add it to FILES below.

const CACHE = "babbler-v4";
const NETWORK_TIMEOUT = 4000;  // ms – after this, use the kept copy instead of waiting

const FILES = [
  "./",
  "index.html",
  "style.css",
  "manifest.json",
  "util.js",
  "progress.js",
  "rules.js",
  "journey.js",
  "cards.js",
  "audio.js",
  "swipe.js",
  "round.js",
  "spot.js",
  "quiz.js",
  "grammar.js",
  "listen.js",
  "speak.js",
  "level.js",
  "backup.js",
  "app.js",
  "data/vocab.json",
  "data/vocab-2.json",
  "data/vocab-3.json",
  "data/sentences.json",
  "data/gaps.json",
  "data/grammar.json",
  "data/dialogues.json",
  "data/core.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
];

// Install: copy all files, then take over straight away.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting())
  );
});

// Activate: remove copies from older versions.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Fetch from the network, but give up after NETWORK_TIMEOUT.
function fromNetwork(url) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), NETWORK_TIMEOUT);
    fetch(url, { cache: "no-cache" }).then(
      (response) => {
        clearTimeout(timer);
        resolve(response);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Only our own files; everything else goes its normal way.
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  url.search = "";  // "index.html?x=1" and "index.html" are the same file

  event.respondWith(
    fromNetwork(url.href)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(url.href, copy));
        }
        return response;
      })
      .catch(() =>
        caches
          .match(url.href)
          .then((kept) => kept || caches.match("index.html"))
          .then((kept) => kept || fetch(event.request))  // nothing kept yet: try the network after all
      )
  );
});
