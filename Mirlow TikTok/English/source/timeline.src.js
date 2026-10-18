// Shared by index.html (picture) and audio.mjs (sound). Everything hangs off the voice.
// Built into timeline.js by `node build-timeline.mjs` (it inlines vo/words.json).
(() => {
  const W = __WORDS__;
  // When each voice line starts, in seconds.
  const VO = {
    hook: 0.15, no: 4.85, just: 9.0, name: 10.45,
    step1: 12.5, step2: 14.05, step3: 16.15, done: 17.5,
    feats: 20.7, catch: 26.9, free: 28.05, cta: 33.0,
  };
  // Start of a word in a line, by text (nth occurrence).
  const find = (line, word, nth) => {
    const hits = W[line].filter((w) => w[0].toLowerCase() === word.toLowerCase());
    if (!hits[nth]) throw new Error(`no "${word}" #${nth} in ${line}`);
    return hits[nth];
  };
  const at = (line, word, nth = 0) => VO[line] + find(line, word, nth)[1];
  const atEnd = (line, word, nth = 0) => VO[line] + find(line, word, nth)[2];
  const end = (line) => VO[line] + W[line][W[line].length - 1][2];
  const T = { s2: 4.7, s3: 9.95, s4: 12.25, s5: 20.5, s6: 26.75, s7: 32.8, end: 36.4 };
  T.tap1 = at("step2", "Mirroring") + 0.05;
  T.tap2 = at("step3", "PC") + 0.02;
  T.mirror = T.tap2 + 0.8;
  globalThis.TL = { W, VO, T, at, atEnd, end };
})();
