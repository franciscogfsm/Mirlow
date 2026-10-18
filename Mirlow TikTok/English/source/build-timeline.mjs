import fs from "node:fs";
const words = fs.readFileSync("vo/words.json", "utf8");
fs.writeFileSync("timeline.js", fs.readFileSync("timeline.src.js", "utf8").replace("__WORDS__", words.trim()));
await import("./timeline.js");
const { T, VO, end } = globalThis.TL;
for (const k in VO) console.log(k.padEnd(6), VO[k].toFixed(2), "->", end(k).toFixed(2));
console.log(T);
