# Subtitles from the voice lines (vo.py) and their word timings (timeline.js).
import json, re, importlib.util
spec = importlib.util.spec_from_file_location("vo", "vo.py"); src = open("vo.py").read()
LINES = eval(src[src.index("LINES = ") + 8 : src.index("}\n", src.index("LINES = ")) + 1])
W = json.load(open("vo/words.json"))
tl = open("timeline.src.js").read()
VO = {k: float(v) for k, v in re.findall(r"(\w+): ([\d.]+)", tl[tl.index("const VO"):tl.index("};", tl.index("const VO"))])}
ts = lambda x: "%02d:%02d:%02d,%03d" % (x // 3600, x // 60 % 60, x % 60, round(x * 1000) % 1000)
out, n = [], 0
for k, text in LINES.items():
    wi = 0
    for s in re.findall(r"[^.?!]+[.?!]", text):
        s = s.strip(); c = len(s.split()); ws = W[k][wi:wi + c]; wi += c; n += 1
        out.append(f"{n}\n{ts(VO[k] + ws[0][1])} --> {ts(VO[k] + ws[-1][2] + 0.15)}\n{s.replace(chr(39), '’')}\n")
open("mirlow-en.srt", "w", encoding="utf-8").write("\n".join(out))
print(n, "cues")
