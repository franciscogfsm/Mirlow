# Voice-over: one clip per line, with word timings, so the picture can sync to the words.
import asyncio, json, sys, edge_tts

VOICE = sys.argv[1] if len(sys.argv) > 1 else "en-US-AndrewNeural"
RATE = "+6%"
LINES = {
    "hook": "Your iPhone has a button that can put its screen on your PC. Almost nobody uses it.",
    "no": "No cable. No app on your phone. No account. No subscription.",
    "just": "Just this.",
    "name": "It's called Mirlow.",
    "step1": "Open Mirlow on your PC.",
    "step2": "On your iPhone, tap Screen Mirroring.",
    "step3": "Pick your PC.",
    "done": "And that's it. Sound included.",
    "ctlA": "And here's the part nobody expects.",
    "ctlB": "You can control your iPhone with your PC's mouse and keyboard.",
    "ctlC": "Click. Scroll. Type.",
    "ctlD": "It pairs like a real Bluetooth mouse, so there's almost no delay.",
    "feats": "Plus full screen, it stays private, and it works on iPhone, iPad and Android.",
    "catch": "So what's the catch?",
    "free": "There isn't one. It's free. No trial, no watermark, and it's open source.",
    "cta": "Search Mirlow. Thank me later.",
}

async def one(key, text):
  for attempt in range(5):
   try:
    return await one_(key, text)
   except Exception as e:
    print("retry", key, e); await asyncio.sleep(2)
  raise SystemExit("failed " + key)

async def one_(key, text):
    c = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary")
    words = []
    with open(f"vo/{key}.mp3", "wb") as f:
        async for ch in c.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                words.append([ch["text"], round(ch["offset"] / 1e7, 3), round((ch["offset"] + ch["duration"]) / 1e7, 3)])
    return key, words

async def main():
    # With keys on the command line, only those lines are made again.
    only = sys.argv[2:]
    try:
        out = json.load(open("vo/words.json"))
    except FileNotFoundError:
        out = {}
    for k, v in LINES.items():
        if only and k not in only:
            continue
        out[k] = (await one(k, v))[1]
    out = {k: out[k] for k in LINES}
    json.dump(out, open("vo/words.json", "w"), indent=1)
    for k, w in out.items():
        print(k, w[-1][2], " ".join(f"{x[0]}@{x[1]}" for x in w))

asyncio.run(main())
