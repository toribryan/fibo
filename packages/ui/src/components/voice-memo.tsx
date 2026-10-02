"use client"

import * as React from "react"
import { cva } from "class-variance-authority"
import {
  BatteryFullIcon,
  BatteryLowIcon,
  BatteryMediumIcon,
  MessageSquarePlusIcon,
  MicIcon,
  PauseIcon,
  PlayIcon,
  SquareIcon,
} from "lucide-react"
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react"

import { cn } from "@workspace/ui/lib/utils"

type VoiceMemoState = "idle" | "recording" | "paused"

type VoiceMemoResult = {
  /** Milliseconds recorded, pauses left out. */
  duration: number
  /** Where each mark fell, in milliseconds from the start. */
  marks: number[]
}

type VoiceMemoProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** The memo's name, shown above the clock and naming the group. */
  title?: string
  /** `idle` before a take, `recording` or `paused` during one, when controlled. */
  state?: VoiceMemoState
  /** Where an uncontrolled recorder starts. */
  defaultState?: VoiceMemoState
  /** Called when the state changes, by a control, the device or stopping. */
  onStateChange?: (state: VoiceMemoState) => void
  /** Called when a take is stopped, with its length and marks. */
  onStop?: (memo: VoiceMemoResult) => void
  /** Called when someone marks a moment, with the time it fell at. */
  onMark?: (time: number) => void
  /** A live microphone stream. The waveform and the device's light follow its loudness. */
  stream?: MediaStream | null
  /** Loudness from 0 to 1, for audio you measure yourself. Takes over from `stream`. */
  level?: number
  /** With no `stream` or `level`, draws a made-up voice so previews have something to show. */
  simulate?: boolean
  /** Shows the aluminium recorder docked on the left edge. Click it to record or pause, or pull it out. */
  device?: boolean
  /** The word stamped into the device. */
  wordmark?: string
  /** Whether the recording device is reachable. Leave unset to hide the status line. */
  connection?: "connected" | "connecting" | "disconnected"
  /** The device's charge from 0 to 100, shown beside the connection. */
  battery?: number
  /** `sm` for a sheet or sidebar, `default` for a screen of its own. */
  size?: "sm" | "default"
}

const voiceMemoVariants = cva(
  "group/voice-memo relative isolate flex w-full flex-col items-center overflow-hidden rounded-3xl border border-border bg-card text-card-foreground",
  {
    variants: {
      size: {
        sm: "max-w-72 gap-4 px-4 pt-5 pb-4",
        default: "max-w-96 gap-6 px-6 pt-8 pb-6",
      },
    },
    defaultVariants: { size: "default" },
  }
)

const BARS = { sm: 36, default: 48 } as const
// How often a bar enters from the right. Slow enough to read as speech, fast
// enough that a pause in talking shows as a gap.
const SAMPLE_MS = 90
const QUIET = 0.04

// The device is 56 by 85, the proportions of a bank card, stood on its end.
const DEVICE = { width: 112, height: 170, radius: 12 }

function formatElapsed(ms: number) {
  const total = Math.max(0, Math.floor(ms / 10))
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(Math.floor(total / 6000))}:${pad(Math.floor(total / 100) % 60)}.${pad(total % 100)}`
}

// Spoken times leave out the hundredths, which nobody needs read aloud.
function speakElapsed(ms: number) {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  const parts = []
  if (minutes) parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`)
  parts.push(`${rest} second${rest === 1 ? "" : "s"}`)
  return parts.join(" ")
}

/*
 * A made-up voice: syllables inside words, inside phrases, with breaths
 * between, so a preview reads as someone talking rather than noise.
 */
function simulatedLevel(t: number) {
  const phrase = Math.sin(t / 2300) * 0.5 + 0.5
  const word = Math.max(0, Math.sin(t / 310 + Math.sin(t / 900)))
  const syllable = Math.abs(Math.sin(t / 73)) * 0.6 + Math.random() * 0.4
  const breath = phrase < 0.18 ? 0 : 1
  return Math.min(1, breath * word * syllable * (0.4 + phrase * 0.8))
}

function useStreamLevel(stream: MediaStream | null | undefined) {
  const read = React.useRef<() => number>(() => 0)
  React.useEffect(() => {
    if (!stream || typeof AudioContext === "undefined") return
    const context = new AudioContext()
    const source = context.createMediaStreamSource(stream)
    const analyser = context.createAnalyser()
    analyser.fftSize = 512
    source.connect(analyser)
    const data = new Uint8Array(analyser.fftSize)
    read.current = () => {
      analyser.getByteTimeDomainData(data)
      let sum = 0
      for (const value of data) {
        const centred = (value - 128) / 128
        sum += centred * centred
      }
      // The RMS of speech sits low; the curve lifts it into a readable height.
      return Math.min(1, Math.sqrt(Math.sqrt(sum / data.length)) * 1.4)
    }
    return () => {
      read.current = () => 0
      source.disconnect()
      void context.close()
    }
  }, [stream])
  return read
}

// Overshoot shrinks as it grows and never passes `dimension`. The curve and
// the drag around it follow the JPG card holder at chanhdai.com.
function rubberBand(overshoot: number, dimension: number) {
  return (overshoot * dimension * 0.55) / (dimension + 0.55 * overshoot)
}

/**
 * A voice recorder after the clip-on memo devices that hold to the back of a
 * phone: a title, a running clock, a waveform that glides in from the right
 * as you talk, and controls to mark a moment, pause and stop. The aluminium
 * device docks on the left edge, its light following your voice. It records
 * nothing itself; pair it with a MediaRecorder and pass the stream in.
 */
function VoiceMemo({
  title = "New memory",
  state: stateProp,
  defaultState = "idle",
  onStateChange,
  onStop,
  onMark,
  stream,
  level,
  simulate = true,
  device = true,
  wordmark = "fibo",
  connection,
  battery,
  size = "default",
  className,
  ...props
}: VoiceMemoProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultState)
  const state = stateProp ?? uncontrolled
  const setState = (next: VoiceMemoState) => {
    if (stateProp === undefined) setUncontrolled(next)
    onStateChange?.(next)
  }

  const count = BARS[size]
  // One slot more than fits, so the newest bar slides in from past the edge.
  type Bar = { level: number; marked: boolean }
  const blank = React.useCallback(
    () =>
      Array.from({ length: count + 1 }, () => ({ level: 0, marked: false })),
    [count]
  )
  const [bars, setBars] = React.useState<Bar[]>(blank)
  const [announcement, setAnnouncement] = React.useState("")

  // Time is what's banked from earlier stretches plus the current stretch,
  // so pausing never drifts the clock.
  const banked = React.useRef(0)
  const since = React.useRef<number | null>(null)
  const marks = React.useRef<number[]>([])
  const pendingMark = React.useRef(false)

  // The clock, the glide and the light change every frame. They're written
  // straight to the DOM and to motion values, so React renders only when a
  // new bar arrives.
  const clock = React.useRef<HTMLSpanElement>(null)
  const row = React.useRef<HTMLDivElement>(null)
  const glow = useMotionValue(0)

  const readStream = useStreamLevel(stream)
  // Read fresh each sample, so a new level doesn't restart the loop.
  const measure = React.useEffectEvent((time: number) =>
    level !== undefined
      ? level
      : stream
        ? readStream.current()
        : simulate
          ? simulatedLevel(time)
          : 0
  )
  const reduced = useReducedMotion() ?? false

  const now = React.useCallback(
    () =>
      banked.current +
      (since.current === null ? 0 : performance.now() - since.current),
    []
  )

  const paintClock = React.useCallback(() => {
    if (clock.current) clock.current.textContent = formatElapsed(now())
  }, [now])

  React.useEffect(() => {
    if (state !== "recording") {
      if (since.current !== null) {
        banked.current += performance.now() - since.current
        since.current = null
      }
      paintClock()
      glow.set(0)
      if (row.current) row.current.style.transform = ""
      return
    }
    since.current = performance.now()
    // Reduced motion still shows the voice, in fewer, calmer steps that
    // don't glide.
    const every = reduced ? SAMPLE_MS * 5 : SAMPLE_MS
    let frame = 0
    let last = performance.now()
    const tick = (time: number) => {
      paintClock()
      if (time - last >= every) {
        last = time
        const value = measure(time)
        const marked = pendingMark.current
        pendingMark.current = false
        glow.set(value)
        setBars((previous) => [...previous.slice(1), { level: value, marked }])
      }
      if (row.current && !reduced) {
        const step = row.current.offsetWidth / (count + 1)
        const progress = Math.min(1, (time - last) / every)
        row.current.style.transform = `translateX(${-progress * step}px)`
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [state, reduced, count, glow, paintClock])

  const start = () => {
    banked.current = 0
    since.current = null
    marks.current = []
    setBars(blank())
    paintClock()
    setAnnouncement("Recording")
    setState("recording")
  }

  const togglePause = () => {
    if (state === "recording") {
      setAnnouncement(`Paused at ${speakElapsed(now())}`)
      setState("paused")
    } else {
      setAnnouncement("Recording")
      setState("recording")
    }
  }

  const stop = () => {
    const duration = now()
    if (since.current !== null) {
      banked.current = duration
      since.current = null
    }
    setAnnouncement(`Saved, ${speakElapsed(duration)}`)
    setState("idle")
    onStop?.({ duration, marks: marks.current })
  }

  const mark = () => {
    const time = now()
    marks.current = [...marks.current, time]
    // Recording, the tick lands on the next bar to come in; paused, on the
    // newest, since nothing else is coming.
    if (state === "recording") {
      pendingMark.current = true
    } else {
      setBars((previous) => [
        ...previous.slice(0, -1),
        { ...previous.at(-1)!, marked: true },
      ])
    }
    setAnnouncement(`Marked at ${speakElapsed(time)}`)
    onMark?.(time)
  }

  const live = state !== "idle"
  const BatteryGlyph =
    battery === undefined || battery > 66
      ? BatteryFullIcon
      : battery > 33
        ? BatteryMediumIcon
        : BatteryLowIcon

  return (
    <div
      role="group"
      aria-label={title}
      data-slot="voice-memo"
      data-state={state}
      data-size={size}
      className={cn(voiceMemoVariants({ size }), className)}
      {...props}
    >
      <div
        data-slot="voice-memo-header"
        className="flex flex-col items-center gap-1 text-center"
      >
        <span
          data-slot="voice-memo-title"
          className={cn(
            "font-semibold tracking-tight",
            size === "sm" ? "text-base" : "text-lg"
          )}
        >
          {title}
        </span>
        <span
          className={cn(
            "flex items-center gap-1.5 font-mono text-muted-foreground tabular-nums",
            size === "sm" ? "text-xs" : "text-sm"
          )}
        >
          <span
            aria-hidden
            data-slot="voice-memo-light"
            className={cn(
              "size-1.5 rounded-full transition-colors",
              state === "recording"
                ? "bg-destructive"
                : state === "paused"
                  ? "bg-warning"
                  : "bg-border"
            )}
          />
          <span ref={clock} role="timer" data-slot="voice-memo-time">
            {formatElapsed(0)}
          </span>
        </span>
      </div>

      {/* Bleeds to the card's edges so the device can dock against one. */}
      <div
        className={cn(
          "relative flex w-[calc(100%+--spacing(12))] items-center justify-center",
          size === "sm" && "w-[calc(100%+--spacing(8))]",
          device && (size === "sm" ? "min-h-32 pl-10" : "min-h-44 pl-14"),
          size === "sm" ? "px-4" : "px-6"
        )}
      >
        {device ? (
          <VoiceMemoDevice
            size={size}
            state={state}
            glow={glow}
            wordmark={wordmark}
            reduced={reduced}
            onPress={live ? togglePause : start}
          />
        ) : null}
        <div
          aria-hidden
          data-slot="voice-memo-waveform"
          className={cn(
            "relative w-full overflow-hidden",
            // The oldest sound fades off the left, into the device.
            "[mask-image:linear-gradient(to_right,transparent,black_35%,black_95%,transparent)]",
            size === "sm" ? "h-14" : "h-20"
          )}
        >
          <div
            ref={row}
            className="flex h-full items-center will-change-transform"
            style={{ width: `${((count + 1) / count) * 100}%` }}
          >
            {bars.map((bar, index) => {
              const quiet = bar.level < QUIET
              return (
                <span
                  key={index}
                  className="relative flex h-full flex-1 items-center justify-center"
                >
                  {bar.marked ? (
                    <span
                      data-slot="voice-memo-mark-tick"
                      className="absolute inset-y-0 w-px bg-warning"
                    />
                  ) : null}
                  <span
                    data-slot="voice-memo-bar"
                    data-marked={bar.marked ? "" : undefined}
                    className={cn(
                      "relative rounded-full transition-colors",
                      size === "sm" ? "w-[2px]" : "w-[3px]",
                      quiet
                        ? cn(
                            size === "sm" ? "h-[2px]" : "h-[3px]",
                            state === "recording"
                              ? "bg-muted-foreground"
                              : "bg-border"
                          )
                        : state === "recording"
                          ? "bg-foreground"
                          : "bg-muted-foreground"
                    )}
                    style={
                      quiet ? undefined : { height: `${8 + bar.level * 92}%` }
                    }
                  />
                </span>
              )
            })}
          </div>
        </div>
      </div>

      <div
        data-slot="voice-memo-controls"
        className={cn("flex items-center", size === "sm" ? "gap-4" : "gap-6")}
      >
        <ControlButton
          data-slot="voice-memo-mark"
          aria-label="Mark this moment"
          disabled={!live}
          onClick={mark}
          size={size}
        >
          <MessageSquarePlusIcon />
        </ControlButton>
        <ControlButton
          data-slot="voice-memo-toggle"
          aria-label={
            state === "recording"
              ? "Pause recording"
              : state === "paused"
                ? "Resume recording"
                : "Start recording"
          }
          onClick={live ? togglePause : start}
          size={size}
          primary
        >
          {state === "recording" ? (
            <PauseIcon className="fill-current" />
          ) : state === "paused" ? (
            <PlayIcon className="fill-current" />
          ) : (
            <MicIcon />
          )}
        </ControlButton>
        <ControlButton
          data-slot="voice-memo-stop"
          aria-label="Stop and save"
          disabled={!live}
          onClick={stop}
          size={size}
        >
          <SquareIcon className="fill-current" />
        </ControlButton>
      </div>

      {connection !== undefined ? (
        <div
          data-slot="voice-memo-status"
          data-connection={connection}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span
            className={cn(
              connection === "connected" && "text-success",
              connection === "disconnected" && "text-destructive"
            )}
          >
            {connection === "connected"
              ? "Connected"
              : connection === "connecting"
                ? "Connecting…"
                : "Disconnected"}
          </span>
          {battery !== undefined ? (
            <>
              <span aria-hidden>·</span>
              <span className="flex items-center gap-1 tabular-nums">
                {`${Math.round(battery)}%`}
                <BatteryGlyph aria-hidden className="size-3.5" />
                <span className="sr-only">battery</span>
              </span>
            </>
          ) : null}
        </div>
      ) : null}

      <span role="status" data-slot="voice-memo-announcer" className="sr-only">
        {announcement}
      </span>
    </div>
  )
}

/*
 * The aluminium recorder, docked against the card's left edge with most of
 * it out of view. It's the same control as the toggle, for a pointer: a
 * click records or pauses, and it can be pulled out and let go, when it
 * springs back as if a magnet caught it. Screen readers skip it; the toggle
 * says the same thing in words.
 */
function VoiceMemoDevice({
  size,
  state,
  glow,
  wordmark,
  reduced,
  onPress,
}: {
  size: "sm" | "default"
  state: VoiceMemoState
  glow: MotionValue<number>
  wordmark: string
  reduced: boolean
  onPress: () => void
}) {
  const id = React.useId()
  const ids = {
    brush: `${id}-brush`,
    shade: `${id}-shade`,
    sheen: `${id}-sheen`,
    clip: `${id}-clip`,
  }

  // Travel out of the dock: positive is out, into the card.
  const x = useMotionValue(0)
  // The reflection slides as the device moves, the way light slides across
  // metal when you tilt it.
  const sheenY = useTransform(x, [-20, 80], [-30, 50])
  // A level of zero still shows a dim light, so it reads as on.
  const light = useTransform(glow, [0, 1], [0.35, 1])

  const drag = React.useRef<{
    id: number
    startX: number
    from: number
    width: number
    moved: boolean
  } | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const [pressed, setPressed] = React.useState(false)

  const resist = (offset: number, width: number) => {
    const max = width * 0.55
    if (offset > max) return max + rubberBand(offset - max, width * 0.4)
    // It's against the edge already, so pushing it in barely moves it.
    if (offset < 0) return -rubberBand(-offset, 10)
    return offset
  }

  const release = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = drag.current
    if (!current || current.id !== event.pointerId) return
    drag.current = null
    setDragging(false)
    setPressed(false)
    if (!current.moved && event.type === "pointerup") onPress()
    animate(
      x,
      0,
      reduced
        ? { duration: 0.15, ease: "easeOut" }
        : // Quick and a little bouncy: it snaps home rather than drifting.
          { type: "spring", visualDuration: 0.3, bounce: 0.3 }
    )
  }

  const { width, height, radius } = DEVICE

  return (
    <motion.div
      aria-hidden
      data-slot="voice-memo-device"
      data-dragging={dragging || undefined}
      data-pressed={pressed || undefined}
      className={cn(
        "group/device absolute top-1/2 left-0 z-10 -translate-y-1/2 cursor-grab touch-pan-y select-none data-dragging:cursor-grabbing",
        // Mostly out of view, as if clipped to the back of the card.
        size === "sm" ? "-ml-14 h-32 w-20" : "-ml-20 h-44 w-28"
      )}
      style={{ x }}
      onPointerDown={(event) => {
        if (event.button !== 0) return
        event.currentTarget.setPointerCapture(event.pointerId)
        x.stop()
        drag.current = {
          id: event.pointerId,
          startX: event.clientX,
          from: x.get(),
          width: event.currentTarget.offsetWidth,
          moved: false,
        }
        setPressed(true)
      }}
      onPointerMove={(event) => {
        const current = drag.current
        if (!current || current.id !== event.pointerId) return
        const dx = event.clientX - current.startX
        if (!current.moved && Math.abs(dx) < 4) return
        if (!current.moved) {
          current.moved = true
          setDragging(true)
          setPressed(false)
        }
        x.set(resist(current.from + dx, current.width))
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      {/* The peek and the press live on an inner box, so the hit area
          stays put while the device moves. */}
      <div
        className={cn(
          "relative size-full transition-[translate,scale] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "motion-safe:group-hover/device:translate-x-2 motion-safe:group-data-dragging/device:translate-x-2",
          "motion-safe:group-data-pressed/device:scale-[0.97] motion-safe:group-data-pressed/device:duration-100"
        )}
      >
        {/* Two fixed shadows crossfade, so lifting animates only opacity. */}
        <span className="absolute inset-0 rounded-[11%/7%] shadow-sm transition-opacity duration-300 group-hover/device:opacity-0 group-data-dragging/device:opacity-0" />
        <span className="absolute inset-0 rounded-[11%/7%] opacity-0 shadow-xl transition-opacity duration-300 group-hover/device:opacity-100 group-data-dragging/device:opacity-100 group-data-pressed/device:opacity-0" />

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="absolute inset-0 size-full overflow-visible"
        >
          <defs>
            {/* Noise stretched along the length reads as brushing. Its red
                channel becomes alpha, so the streaks take the fill's colour. */}
            <filter id={ids.brush} x="0" y="0" width="100%" height="100%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.9 0.012"
                numOctaves="2"
                seed="4"
              />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.4 0 0 0 -0.45"
              />
              <feComposite in="SourceGraphic" operator="in" />
            </filter>
            {/* Lit from the top left. In user space, so the wordmark picks
                up the same shading as the face it's stamped into. */}
            <linearGradient
              id={ids.shade}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2={width}
              y2={height}
            >
              <stop
                offset="0"
                style={{
                  stopColor: "var(--color-background)",
                  stopOpacity: 0.6,
                }}
              />
              <stop
                offset="0.45"
                style={{ stopColor: "var(--color-background)", stopOpacity: 0 }}
              />
              <stop
                offset="1"
                style={{
                  stopColor: "var(--color-foreground)",
                  stopOpacity: 0.26,
                }}
              />
            </linearGradient>
            <linearGradient id={ids.sheen} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0"
                style={{ stopColor: "var(--color-background)", stopOpacity: 0 }}
              />
              <stop
                offset="0.5"
                style={{
                  stopColor: "var(--color-background)",
                  stopOpacity: 0.55,
                }}
              />
              <stop
                offset="1"
                style={{ stopColor: "var(--color-background)", stopOpacity: 0 }}
              />
            </linearGradient>
            <clipPath id={ids.clip}>
              <rect width={width} height={height} rx={radius} />
            </clipPath>
          </defs>

          {/* The button on the inner edge, pressed in while held. */}
          <rect
            x={width - 1}
            y={height * 0.36}
            width={3}
            height={18}
            rx={1.25}
            className="fill-muted stroke-border transition-transform duration-100 group-data-pressed/device:-translate-x-[1.5px]"
            strokeWidth={0.75}
          />

          <rect
            width={width}
            height={height}
            rx={radius}
            className="fill-muted"
          />
          <rect
            width={width}
            height={height}
            rx={radius}
            fill={`url(#${ids.shade})`}
          />
          <rect
            width={width}
            height={height}
            rx={radius}
            filter={`url(#${ids.brush})`}
            className="fill-foreground opacity-10"
          />

          <g clipPath={`url(#${ids.clip})`}>
            <motion.rect
              x={-width}
              y={height * 0.2}
              width={width * 3}
              height={34}
              fill={`url(#${ids.sheen})`}
              transform={`rotate(-28 ${width / 2} ${height / 2})`}
              style={{ y: sheenY }}
            />
          </g>

          {/* Raised lettering: a lit edge above, a shadow below, and the
              face itself in the body's own shading. Turned to read up the
              length, like the edge of a book. */}
          <g
            transform={`rotate(-90 ${width / 2} ${height / 2})`}
            fontSize={34}
            textAnchor="middle"
            dominantBaseline="central"
            className="font-serif"
          >
            {[
              { dx: 0.9, className: "fill-background opacity-90" },
              { dx: -0.9, className: "fill-foreground opacity-20" },
              { dx: 0, className: "fill-muted" },
            ].map((layer) => (
              <text
                key={layer.dx}
                x={width / 2 + layer.dx}
                y={height / 2}
                className={layer.className}
              >
                {wordmark}
              </text>
            ))}
            <text x={width / 2} y={height / 2} fill={`url(#${ids.shade})`}>
              {wordmark}
            </text>
          </g>

          {/* A machined chamfer: a bright line just inside the edge and a
              dark one on it. */}
          <rect
            x={0.9}
            y={0.9}
            width={width - 1.8}
            height={height - 1.8}
            rx={radius - 0.9}
            fill="none"
            strokeWidth={1.2}
            className="stroke-background opacity-80"
          />
          <rect
            width={width}
            height={height}
            rx={radius}
            fill="none"
            strokeWidth={0.75}
            className="stroke-foreground opacity-15"
          />

          {/* The microphone pinhole, which doubles as the recording light. */}
          <circle
            cx={width - 16}
            cy={16}
            r={2}
            className="fill-foreground opacity-50"
          />
          {state !== "idle" ? (
            <motion.g style={{ opacity: state === "recording" ? light : 1 }}>
              <circle
                cx={width - 16}
                cy={16}
                r={5}
                className={cn(
                  "blur-[3px]",
                  state === "recording" ? "fill-destructive" : "fill-warning"
                )}
              />
              <circle
                cx={width - 16}
                cy={16}
                r={1.6}
                className={
                  state === "recording" ? "fill-destructive" : "fill-warning"
                }
              />
            </motion.g>
          ) : null}
        </svg>
      </div>
    </motion.div>
  )
}

function ControlButton({
  primary,
  size,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  primary?: boolean
  size: "sm" | "default"
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full transition-[background-color,scale,opacity] duration-150 outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100 [&_svg]:shrink-0",
        primary
          ? "bg-primary text-primary-foreground hover:bg-primary-hover"
          : "bg-secondary text-secondary-foreground hover:not-disabled:bg-secondary-hover",
        primary
          ? size === "sm"
            ? "size-12 [&_svg]:size-5"
            : "size-16 [&_svg]:size-6"
          : size === "sm"
            ? "size-9 [&_svg]:size-4"
            : "size-12 [&_svg]:size-5",
        className
      )}
      {...props}
    />
  )
}

export {
  VoiceMemo,
  voiceMemoVariants,
  formatElapsed,
  type VoiceMemoProps,
  type VoiceMemoState,
  type VoiceMemoResult,
}
