/*
 * What fibo says. Clicks on him and clicks anywhere else in the hero each
 * work down their own lines, ending on the rage clicks: he complains about
 * being poked, and about empty space being treated as a button. Three clicks
 * in a quick burst skip straight to the rage clicks, and so does any line he
 * would repeat before he has called them out; after that his lines can come
 * round again. A visitor who lingers without clicking gets a hello.
 */
export const FIBO_LINES = {
  poke: "do you always go around poking people? ...",
  miss: "i'm not slow, i'm lazy loaded.",
  button: "this isn't a button. well, i guess it is now.",
  bruise: "careful, i bruise in 8-bit.",
  rage: "i can see those rage clicks. go poke around fibo instead?",
  hello: "oh, hi.",
}

export type FiboLine = keyof typeof FIBO_LINES

const ORDER: Record<"on" | "off", FiboLine[]> = {
  on: ["poke", "bruise", "rage"],
  off: ["button", "miss", "rage"],
}
// A pause this long between clicks lets him cool off and start over.
const STREAK_MS = 4000
// Clicks closer together than this count as one burst, and a burst this
// long is rage clicking.
const BURST_MS = 700
const BURST = 3

/**
 * Picks his reply to each click from where it landed and when. Kept apart
 * from the component so the rules can be run without a browser.
 */
export function createHeckle() {
  let clicks = { on: 0, off: 0 }
  let burst = 0
  let last = -Infinity
  const said = new Set<FiboLine>()

  return ({ onHim, at }: { onHim: boolean; at: number }): FiboLine => {
    if (at - last > STREAK_MS) clicks = { on: 0, off: 0 }
    burst = at - last < BURST_MS ? burst + 1 : 1
    last = at

    const track = onHim ? "on" : "off"
    const lines = ORDER[track]
    let line = lines[Math.min(clicks[track], lines.length - 1)] ?? "rage"
    clicks[track] += 1
    if (burst >= BURST || said.has(line)) line = "rage"

    if (line === "rage") said.clear()
    else said.add(line)
    return line
  }
}
