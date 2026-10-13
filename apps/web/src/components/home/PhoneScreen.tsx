/**
 * What is "on the phone" in the site's demonstrations: a made-up, monochrome
 * app with a row of cards that slides along. It is drawn entirely in units of
 * its own width, so the very same component can be the phone's screen and its
 * mirror image on the PC, and the two always match.
 *
 * `tick` selects which card is showing; give two instances the same tick and
 * they move together.
 */
const CARDS = [
  { title: "Lisbon", meta: "24 photos", art: "radial-gradient(120% 90% at 20% 15%, #fff 0%, #cfcfcf 34%, #6b6b6b 68%, #1c1c1c 100%)" },
  { title: "Atlantic", meta: "18 photos", art: "linear-gradient(160deg, #1a1a1a 0%, #5c5c5c 42%, #e9e9e9 58%, #9a9a9a 100%)" },
  { title: "Sintra", meta: "31 photos", art: "radial-gradient(90% 120% at 80% 90%, #f4f4f4 0%, #a3a3a3 38%, #3a3a3a 72%, #0d0d0d 100%)" },
];

const u = (value: number) => `${value}cqw`;

export function PhoneScreen({ tick = 0, time = "9:41" }: { tick?: number; time?: string }) {
  const active = ((tick % CARDS.length) + CARDS.length) % CARDS.length;

  return (
    <div
      className="h-full w-full overflow-hidden bg-[#f4f4f3] text-[#0a0a0a]"
      style={{ containerType: "inline-size" }}
      aria-hidden="true"
    >
      <div className="flex h-full flex-col" style={{ padding: `${u(5)} ${u(6)} ${u(6)}` }}>
        <div
          className="flex items-center justify-between font-semibold"
          style={{ fontSize: u(4.4), paddingInline: u(2) }}
        >
          <span>{time}</span>
          <span className="flex items-center" style={{ gap: u(1.4) }}>
            <i className="block rounded-full bg-current" style={{ width: u(4.6), height: u(2.6), opacity: 0.85 }} />
            <i className="block rounded-[30%] border border-current" style={{ width: u(6.4), height: u(3.2) }} />
          </span>
        </div>

        <p className="text-black/45" style={{ fontSize: u(4.2), marginTop: u(9) }}>
          Tuesday
        </p>
        <p className="font-semibold tracking-tight" style={{ fontSize: u(9.4), lineHeight: 1.05 }}>
          Albums
        </p>

        <div className="overflow-hidden" style={{ marginTop: u(6), borderRadius: u(7) }}>
          <div
            className="flex transition-transform duration-[900ms] ease-[cubic-bezier(0.65,0,0.35,1)]"
            style={{ transform: `translateX(-${active * 100}%)` }}
          >
            {CARDS.map((card) => (
              <div key={card.title} className="relative w-full shrink-0" style={{ aspectRatio: "1 / 1.08" }}>
                <div className="absolute inset-0" style={{ background: card.art }} />
                <div
                  className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent text-white"
                  style={{ padding: `${u(14)} ${u(6)} ${u(5.5)}` }}
                >
                  <p className="font-semibold" style={{ fontSize: u(6.4), lineHeight: 1.1 }}>
                    {card.title}
                  </p>
                  <p className="opacity-70" style={{ fontSize: u(3.9) }}>
                    {card.meta}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center" style={{ gap: u(1.8), marginTop: u(4.5) }}>
          {CARDS.map((card, index) => (
            <i
              key={card.title}
              className="block rounded-full bg-black transition-all duration-500"
              style={{ height: u(1.6), width: u(index === active ? 5 : 1.6), opacity: index === active ? 1 : 0.22 }}
            />
          ))}
        </div>

        <div className="mt-auto flex flex-col" style={{ gap: u(3.4) }}>
          {[62, 78, 48].map((width, index) => (
            <div key={width} className="flex items-center" style={{ gap: u(3.6) }}>
              <i className="block shrink-0 rounded-[28%] bg-black/10" style={{ width: u(10), height: u(10) }} />
              <span className="flex flex-1 flex-col" style={{ gap: u(1.8) }}>
                <i className="block rounded-full bg-black/75" style={{ height: u(2.3), width: `${width}%` }} />
                <i className="block rounded-full bg-black/15" style={{ height: u(1.9), width: `${width - 22 + index * 6}%` }} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
