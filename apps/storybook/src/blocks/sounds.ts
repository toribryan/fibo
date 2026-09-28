import type { FiboLine } from "./lines.js"

/*
 * fibo's chiptune sounds, synthesised so there is nothing to load. Browsers
 * keep audio off until the visitor clicks or presses a key, so the context
 * is made on the first of those anywhere on the page, and any sound asked
 * for before then is skipped. Sounds asked for while it is still waking are
 * scheduled anyway and play as it starts, so a first click is not silent.
 */
let audio: AudioContext | null = null
let listening = false

function unlock() {
  audio ??= new AudioContext()
  void audio.resume()
}

/** Wakes the audio on the visitor's first click or key press on the page. */
export function listenForUnlock() {
  if (listening) return
  listening = true
  window.addEventListener("pointerdown", unlock, { once: true })
  window.addEventListener("keydown", unlock, { once: true })
}

type Tone = {
  from: number
  to?: number
  ms: number
  volume: number
  wave?: OscillatorType
  /** Seconds from now. */
  at?: number
}

// One oscillator sliding between two pitches and fading out.
function tone({ from, to = from, ms, volume, wave = "square", at = 0 }: Tone) {
  if (!audio) return
  const start = audio.currentTime + at
  const end = start + ms / 1000
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = wave
  osc.frequency.setValueAtTime(from, start)
  osc.frequency.exponentialRampToValueAtTime(to, end)
  gain.gain.setValueAtTime(volume, start)
  gain.gain.exponentialRampToValueAtTime(0.0001, end)
  osc.connect(gain).connect(audio.destination)
  osc.start(start)
  osc.stop(end)
}

// Each line opens with its own tone of voice.
const VOICES: Record<FiboLine, () => void> = {
  poke: () => tone({ from: 880, to: 220, ms: 90, volume: 0.04 }),
  button: () => {
    tone({ from: 660, ms: 60, volume: 0.03 })
    tone({ from: 440, ms: 80, volume: 0.03, at: 0.08 })
  },
  miss: () =>
    tone({ from: 330, to: 165, ms: 320, volume: 0.05, wave: "triangle" }),
  bruise: () => tone({ from: 520, to: 110, ms: 160, volume: 0.04 }),
  rage: () => {
    for (const step of [0, 0.09, 0.18])
      tone({
        from: 150,
        to: 120,
        ms: 70,
        volume: 0.03,
        wave: "sawtooth",
        at: step,
      })
  },
  hello: () => {
    tone({ from: 523, ms: 90, volume: 0.04, wave: "triangle" })
    tone({ from: 784, ms: 140, volume: 0.04, wave: "triangle", at: 0.1 })
  },
}

export const sfx = {
  /** The opening sound for one of his lines. */
  voice: (line: FiboLine) => VOICES[line](),
  /** A letter typing into his speech bubble. */
  blip: () =>
    tone({ from: 440 + Math.random() * 160, to: 400, ms: 40, volume: 0.02 }),
  /** Turning round to face the pointer. */
  turn: () =>
    tone({ from: 220, to: 660, ms: 70, volume: 0.015, wave: "triangle" }),
  /**
   * A batch of blocks landing as he builds up: a crunchy blip that climbs
   * as more of him arrives, and a brighter one as the blocks split finer.
   */
  pixels: ({ block, shown }: { block: number; shown: number }) =>
    block > 2
      ? tone({ from: 160 + shown * 520, ms: 45, volume: 0.035 })
      : tone({
          from: 900 + Math.random() * 300,
          to: 1400,
          ms: 60,
          volume: 0.03,
          wave: "triangle",
        }),
  /** The last pixels settling: a chord. */
  settle: () => {
    for (const note of [523, 659, 784])
      tone({ from: note, ms: 420, volume: 0.03, wave: "triangle" })
  },
}
