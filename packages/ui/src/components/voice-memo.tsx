"use client"

import * as React from "react"
import { cva } from "class-variance-authority"
import { CheckIcon, CopyIcon, FileDownIcon, XIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type VoiceMemoSegment = {
  /** Milliseconds from the start, when the phrase was settled. Unknown for text from your own service. */
  at?: number
  /** The phrase. */
  text: string
}

type VoiceMemoResult = {
  /** The memo's title, the Markdown heading. */
  title: string
  /** The whole transcript as one string. */
  transcript: string
  /** The transcript a phrase at a time, with when each was said. */
  segments: VoiceMemoSegment[]
  /** When listening started. */
  startedAt: Date
  /** Milliseconds spent listening. */
  duration: number
  /** The transcript as a Markdown document, ready to save as a .md file. */
  markdown: string
  /** A file name for it, such as voice-memo-2026-10-02-1405.md. */
  filename: string
}

type VoiceMemoProps = Omit<
  React.ComponentProps<"div">,
  "onChange" | "title"
> & {
  /** The memo's name, used as the Markdown heading and the file name. */
  title?: string
  /** Whether it's listening, when controlled. */
  recording?: boolean
  /** Whether an uncontrolled device starts listening. */
  defaultRecording?: boolean
  /** Called when the device is pressed to start or stop. */
  onRecordingChange?: (recording: boolean) => void
  /** The finished text so far, when you transcribe with your own service. The browser's recogniser stays off. */
  transcript?: string
  /** Words still being worked out, shown fainter after `transcript`. */
  interim?: string
  /** Called as each phrase is settled, with the whole transcript so far. */
  onTranscriptChange?: (transcript: string) => void
  /** Called once listening stops, with the finished transcript and the memo, Markdown included. */
  onComplete?: (transcript: string, memo: VoiceMemoResult) => void
  /** The language spoken, as a BCP 47 tag, for the browser's recogniser. */
  lang?: string
  /** Text to speak in place of a microphone, a word at a time. For previews and demos. */
  simulate?: string
  /** The word raised on the device. */
  wordmark?: string
  /** Which side of the device the transcript opens on. */
  side?: "right" | "bottom"
  /** `sm` for a toolbar or sidebar, `default` on its own. */
  size?: "sm" | "default"
}

const voiceMemoVariants = cva(
  "group/device relative block shrink-0 cursor-pointer touch-manipulation rounded-[7%/11%] outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle",
  {
    variants: {
      size: {
        sm: "w-40",
        default: "w-56",
      },
    },
    defaultVariants: { size: "default" },
  }
)

// 85 by 55, a bank card's proportions, in a unit of 2.
const DEVICE = { width: 170, height: 110, radius: 12 }

// The parts of the Web Speech API this uses, declared here: TypeScript's DOM
// library leaves the recogniser out, since only some browsers ship it, and
// older versions of the library lack its events too.
type RecognitionEvent = {
  resultIndex: number
  results: ArrayLike<{ isFinal: boolean } & ArrayLike<{ transcript: string }>>
}

type RecognitionErrorEvent = { error: string }

type Recogniser = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: RecognitionEvent) => void) | null
  onerror: ((event: RecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

function getRecogniser() {
  if (typeof window === "undefined") return undefined
  const scope = window as unknown as {
    SpeechRecognition?: new () => Recogniser
    webkitSpeechRecognition?: new () => Recogniser
  }
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition
}

function noop() {
  return () => {}
}

function formatElapsed(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`
}

function join(...parts: string[]) {
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ")
}

function countWords(text: string) {
  return text.split(/\s+/).filter(Boolean).length
}

function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "voice-memo"
  )
}

/**
 * Writes a memo as Markdown: the title, a line saying when and how long, then
 * a paragraph per phrase, each led by when it was said if that's known.
 */
function transcriptToMarkdown(
  memo: Pick<VoiceMemoResult, "title" | "segments" | "startedAt" | "duration">,
  locale = "en-US"
) {
  const when = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(memo.startedAt)
  const words = countWords(memo.segments.map((s) => s.text).join(" "))
  const body = memo.segments.length
    ? memo.segments
        .map((segment) =>
          segment.at === undefined
            ? segment.text
            : `**${formatElapsed(segment.at)}** ${segment.text}`
        )
        .join("\n\n")
    : "_Nothing was heard._"
  return `# ${memo.title}\n\n${when} · ${formatElapsed(memo.duration)} · ${words} ${words === 1 ? "word" : "words"}\n\n${body}\n`
}

function memoFilename(title: string, startedAt: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  const date = `${startedAt.getFullYear()}-${pad(startedAt.getMonth() + 1)}-${pad(startedAt.getDate())}`
  const time = `${pad(startedAt.getHours())}${pad(startedAt.getMinutes())}`
  return `${slugify(title)}-${date}-${time}.md`
}

function download(markdown: string, filename: string) {
  const url = URL.createObjectURL(
    new Blob([markdown], { type: "text/markdown;charset=utf-8" })
  )
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  // Revoked a beat later; Safari cancels a download whose URL goes at once.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * A bead-blasted aluminium recorder that writes down what you say. Press it and a
 * transcript opens beside it, filling in as you talk; press it again and the
 * transcript stays, ready to copy. It uses the browser's own speech
 * recognition, or shows text from your own service through `transcript`.
 */
function VoiceMemo({
  title = "Voice memo",
  recording: recordingProp,
  defaultRecording = false,
  onRecordingChange,
  transcript: transcriptProp,
  interim: interimProp,
  onTranscriptChange,
  onComplete,
  lang = "en-US",
  simulate,
  wordmark = "fibo",
  side = "right",
  size = "default",
  className,
  ...props
}: VoiceMemoProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultRecording)
  const recording = recordingProp ?? uncontrolled

  const external = transcriptProp !== undefined
  const [heard, setHeard] = React.useState("")
  const [guess, setGuess] = React.useState("")
  const transcript = external ? transcriptProp : heard
  const interim = external ? (interimProp ?? "") : guess

  const [dismissed, setDismissed] = React.useState(false)
  const [failure, setFailure] = React.useState("")
  // The server can't tell, so it assumes support and the browser corrects it.
  const supported = React.useSyncExternalStore(
    noop,
    () => getRecogniser() !== undefined,
    () => true
  )
  const usesRecogniser = !external && simulate === undefined
  const error =
    failure ||
    (recording && usesRecogniser && !supported
      ? "Transcription isn't available in this browser."
      : "")
  const [announcement, setAnnouncement] = React.useState("")
  const [memo, setMemo] = React.useState<VoiceMemoResult | null>(null)
  const open =
    recording ||
    (!dismissed && (memo !== null || transcript !== "" || error !== ""))

  // The latest text, for handlers that outlive the render they were made in.
  const latest = React.useRef({ transcript, interim })
  React.useEffect(() => {
    latest.current = { transcript, interim }
  })

  const settle = React.useEffectEvent((text: string) => {
    setHeard(text)
    onTranscriptChange?.(text)
  })

  // Each settled phrase and when it came, for the timestamps in the file.
  const segments = React.useRef<VoiceMemoSegment[]>([])
  const started = React.useRef({ at: 0, date: new Date(0) })
  const elapsed = React.useCallback(
    () => performance.now() - started.current.at,
    []
  )

  const setRecording = (next: boolean) => {
    if (recordingProp === undefined) setUncontrolled(next)
    onRecordingChange?.(next)
    if (next) {
      segments.current = []
      started.current = { at: performance.now(), date: new Date() }
      setMemo(null)
      setHeard("")
      setGuess("")
      setFailure("")
      setDismissed(false)
      setAnnouncement("Listening")
    } else {
      // Whatever was still being worked out is the best guess there is.
      const final = join(latest.current.transcript, latest.current.interim)
      if (!external && latest.current.interim) settle(final)
      setGuess("")
      setAnnouncement(
        final
          ? `Transcript ready, ${countWords(final)} words`
          : "Stopped, nothing heard"
      )
      // Text the phrases don't cover, from your own service or a last guess,
      // goes in as one more phrase.
      const covered = join(...segments.current.map((s) => s.text))
      const rest = final.startsWith(covered)
        ? final.slice(covered.length).trim()
        : final
      const all = final.startsWith(covered) ? [...segments.current] : []
      if (rest) all.push({ at: external ? undefined : elapsed(), text: rest })
      const base = {
        title,
        transcript: final,
        segments: all,
        startedAt: started.current.date,
        duration: elapsed(),
      }
      const result: VoiceMemoResult = {
        ...base,
        markdown: transcriptToMarkdown(base, lang),
        filename: memoFilename(title, base.startedAt),
      }
      setMemo(result)
      onComplete?.(final, result)
    }
  }

  // The browser's recogniser, unless the text comes from elsewhere.
  React.useEffect(() => {
    const Recogniser = getRecogniser()
    if (!recording || !usesRecogniser || !Recogniser) return
    const recogniser = new Recogniser()
    recogniser.continuous = true
    recogniser.interimResults = true
    recogniser.lang = lang
    let settled = ""
    let stopped = false
    recogniser.onresult = (event) => {
      let pending = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]!
        if (result.isFinal) {
          const text = result[0]!.transcript.trim()
          settled = join(settled, text)
          if (text) segments.current.push({ at: elapsed(), text })
        } else pending = join(pending, result[0]!.transcript)
      }
      settle(settled)
      setGuess(pending)
    }
    recogniser.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return
      stopped = true
      setFailure(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Allow the microphone to transcribe."
          : event.error === "audio-capture"
            ? "No microphone was found."
            : event.error === "network"
              ? "Transcription needs a connection. Press the device to try again."
              : "Transcription stopped. Press the device to try again."
      )
    }
    // Recognisers end on their own after a silence; a device that's still
    // switched on keeps listening.
    recogniser.onend = () => {
      if (!stopped) recogniser.start()
    }
    recogniser.start()
    // Aborted rather than stopped: a stop sends one last result after
    // onComplete has already had the text. The guess on screen stands in.
    return () => {
      stopped = true
      recogniser.onresult = null
      recogniser.onerror = null
      recogniser.onend = null
      recogniser.abort()
    }
  }, [recording, usesRecogniser, lang, elapsed])

  // A script spoken a word at a time, the newest word still a guess.
  React.useEffect(() => {
    if (!recording || external || simulate === undefined) return
    const words = simulate.split(/\s+/).filter(Boolean)
    let index = 0
    let from = 0
    const id = window.setInterval(() => {
      if (index > words.length) return
      const done = Math.max(0, index - 1)
      // A sentence settles as a phrase, as the browser's recogniser would.
      if (done > from && /[.?!]$/.test(words[done - 1]!)) {
        segments.current.push({
          at: elapsed(),
          text: words.slice(from, done).join(" "),
        })
        from = done
      }
      settle(words.slice(0, done).join(" "))
      setGuess(index > 0 ? (words[index - 1] ?? "") : "")
      index++
    }, 240)
    return () => window.clearInterval(id)
  }, [recording, external, simulate, elapsed])

  // The clock is written straight to the page, so it costs no renders.
  const clock = React.useRef<HTMLSpanElement>(null)
  React.useEffect(() => {
    if (!recording) return
    const started = performance.now()
    const paint = () => {
      if (clock.current)
        clock.current.textContent = formatElapsed(performance.now() - started)
    }
    paint()
    const id = window.setInterval(paint, 250)
    return () => window.clearInterval(id)
  }, [recording])

  // Follows the newest words, unless someone has scrolled up to reread.
  const body = React.useRef<HTMLDivElement>(null)
  const pinned = React.useRef(true)
  React.useLayoutEffect(() => {
    const element = body.current
    if (element && pinned.current) element.scrollTop = element.scrollHeight
  }, [transcript, interim])

  const [copied, setCopied] = React.useState(false)
  React.useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(id)
  }, [copied])

  const transcriptId = React.useId()

  return (
    <div
      data-slot="voice-memo"
      data-recording={recording ? "" : undefined}
      data-side={side}
      data-size={size}
      className={cn(
        "relative inline-flex",
        side === "bottom" && "flex-col items-start",
        className
      )}
      {...props}
    >
      <button
        type="button"
        aria-pressed={recording}
        aria-label="Transcribe"
        aria-controls={open ? transcriptId : undefined}
        data-slot="voice-memo-device"
        onClick={() => setRecording(!recording)}
        className={voiceMemoVariants({ size })}
      >
        <Device wordmark={wordmark} recording={recording} />
      </button>

      {open ? (
        <div
          id={transcriptId}
          role="region"
          aria-label="Transcript"
          data-slot="voice-memo-transcript"
          className={cn(
            "absolute z-10 flex w-72 max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-border bg-popover text-popover-foreground shadow-lg",
            // Grows out of the device, and holds still under reduced motion.
            "origin-left transition-[opacity,scale,translate] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-opacity starting:scale-95 starting:opacity-0 motion-reduce:starting:scale-100",
            // A notch pointing back at the device.
            "before:absolute before:size-3 before:rotate-45 before:border-border before:bg-popover",
            side === "right"
              ? "top-3 left-full ml-4 before:top-5 before:-left-[7px] before:border-b before:border-l starting:-translate-x-2 motion-reduce:starting:translate-x-0"
              : "top-full mt-4 origin-top before:-top-[7px] before:left-6 before:border-t before:border-l starting:-translate-y-2 motion-reduce:starting:translate-y-0"
          )}
        >
          <div
            data-slot="voice-memo-header"
            className="relative flex items-center justify-between gap-2 px-3 pt-3 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className={cn(
                  "size-1.5 rounded-full",
                  recording
                    ? "animate-pulse bg-destructive motion-reduce:animate-none"
                    : "bg-border"
                )}
              />
              {recording ? "Listening…" : "Transcript"}
            </span>
            {recording ? (
              <span
                ref={clock}
                data-slot="voice-memo-time"
                className="font-mono tabular-nums"
              >
                00:00
              </span>
            ) : (
              <span className="-my-1 -mr-1.5 flex items-center">
                {transcript ? (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={copied ? "Copied" : "Copy transcript"}
                    data-slot="voice-memo-copy"
                    onClick={() => {
                      void navigator.clipboard
                        ?.writeText(transcript)
                        .then(() => setCopied(true))
                    }}
                  >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                  </Button>
                ) : null}
                {memo && transcript ? (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Download as Markdown"
                    data-slot="voice-memo-download"
                    onClick={() => download(memo.markdown, memo.filename)}
                  >
                    <FileDownIcon />
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Close transcript"
                  data-slot="voice-memo-close"
                  onClick={() => setDismissed(true)}
                >
                  <XIcon />
                </Button>
              </span>
            )}
          </div>
          <div
            ref={body}
            tabIndex={0}
            role="log"
            aria-label="Transcript text"
            data-slot="voice-memo-text"
            onScroll={(event) => {
              const element = event.currentTarget
              pinned.current =
                element.scrollHeight -
                  element.scrollTop -
                  element.clientHeight <
                8
            }}
            className="relative max-h-40 min-h-16 overflow-y-auto rounded-b-2xl px-3 pt-1.5 pb-3 text-sm leading-relaxed outline-none focus-visible:ring-[3px] focus-visible:ring-ring-subtle"
          >
            {error ? (
              <p className="m-0 text-muted-foreground">{error}</p>
            ) : transcript || interim ? (
              <p className="m-0">
                {transcript}
                {interim ? (
                  <span className="text-muted-foreground">
                    {transcript ? " " : ""}
                    {interim}
                  </span>
                ) : null}
              </p>
            ) : (
              <p className="m-0 text-muted-foreground">
                {recording ? "Start talking…" : "Nothing was heard."}
              </p>
            )}
          </div>
        </div>
      ) : null}

      <span role="status" data-slot="voice-memo-announcer" className="sr-only">
        {error || announcement}
      </span>
    </div>
  )
}

/*
 * The aluminium face, drawn rather than photographed so it takes the theme:
 * silver in light, space grey in dark. Hover lifts it and slides the
 * reflection along; pressing pushes it in.
 */
function Device({
  wordmark,
  recording,
}: {
  wordmark: string
  recording: boolean
}) {
  const id = React.useId()
  const ids = {
    pits: `${id}-pits`,
    glints: `${id}-glints`,
    shade: `${id}-shade`,
    sheen: `${id}-sheen`,
    clip: `${id}-clip`,
  }
  const { width, height, radius } = DEVICE

  return (
    <span
      aria-hidden
      className={cn(
        "relative block aspect-[85/55] transition-[translate,scale] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "motion-safe:group-hover/device:-translate-y-0.5 motion-safe:group-active/device:translate-y-px motion-safe:group-active/device:scale-[0.985] motion-safe:group-active/device:duration-100"
      )}
    >
      {/* Fixed shadows crossfade, so lifting and pressing animate only
          opacity. */}
      <span className="absolute inset-0 rounded-[7%/11%] shadow-sm transition-opacity duration-300 group-hover/device:opacity-0" />
      <span className="absolute inset-0 rounded-[7%/11%] opacity-0 shadow-lg transition-opacity duration-300 group-hover/device:opacity-100 group-active/device:opacity-0" />
      <span className="absolute inset-0 rounded-[7%/11%] opacity-0 shadow-xs transition-opacity duration-100 group-active/device:opacity-100" />

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0 size-full overflow-visible"
      >
        <defs>
          {/* Bead-blasted grain: fine noise, the same in every direction,
              pushed hard so only its peaks survive as specks. The red
              channel becomes alpha, so the specks take the fill's colour.
              Two seeds give dark pits and bright glints that don't line up. */}
          {[
            { id: ids.pits, seed: 4 },
            { id: ids.glints, seed: 11 },
          ].map((grain) => (
            <filter
              key={grain.id}
              id={grain.id}
              x="0"
              y="0"
              width="100%"
              height="100%"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="1.6"
                numOctaves="2"
                seed={grain.seed}
              />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -1.05"
              />
              <feComposite in="SourceGraphic" operator="in" />
            </filter>
          ))}
          {/* Lit from the top left. In user space, so the wordmark picks up
              the same shading as the face it's raised from. */}
          <linearGradient
            id={ids.shade}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2={width * 0.6}
            y2={height}
          >
            <stop
              offset="0"
              style={{ stopColor: "var(--color-background)", stopOpacity: 0.6 }}
            />
            <stop
              offset="0.45"
              style={{ stopColor: "var(--color-background)", stopOpacity: 0 }}
            />
            <stop
              offset="1"
              style={{
                stopColor: "var(--color-foreground)",
                stopOpacity: 0.13,
              }}
            />
          </linearGradient>
          <linearGradient id={ids.sheen} x1="0" y1="0" x2="1" y2="0">
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

        {/* The button on the bottom edge, pushed in with the press. */}
        <rect
          x={width - 58}
          y={height - 1}
          width={22}
          height={3}
          rx={1.25}
          strokeWidth={0.75}
          className="fill-muted stroke-border transition-transform duration-100 group-active/device:-translate-y-[1.5px]"
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
        {/* Raised lettering: a lit edge above, a shadow below, and the face
            itself in the body's own shading. Drawn before the grey and the
            grain, which cover it like the rest of the metal. */}
        <g fontSize={50} className="font-serif">
          {[
            { dy: -0.9, className: "fill-background opacity-90" },
            { dy: 0.9, className: "fill-foreground opacity-25" },
            { dy: 0, className: "fill-muted" },
          ].map((layer) => (
            <text
              key={layer.dy}
              x={14}
              y={height - 16 + layer.dy}
              className={layer.className}
            >
              {wordmark}
            </text>
          ))}
          <text x={14} y={height - 16} fill={`url(#${ids.shade})`}>
            {wordmark}
          </text>
        </g>
        {/* Anodised aluminium is a mid grey; the muted role alone is near
            white in the light theme. */}
        <rect
          width={width}
          height={height}
          rx={radius}
          className="fill-foreground opacity-[0.12] dark:opacity-0"
        />
        <rect
          width={width}
          height={height}
          rx={radius}
          filter={`url(#${ids.pits})`}
          className="fill-foreground opacity-20"
        />
        <rect
          width={width}
          height={height}
          rx={radius}
          filter={`url(#${ids.glints})`}
          className="fill-background opacity-35"
        />

        {/* The lettering's edges again, over the grain: speckle would
            otherwise break up the only thing that says the letters are
            raised. */}
        <g fontSize={50} fill="none" strokeWidth={0.7} className="font-serif">
          <text
            x={14}
            y={height - 16.5}
            className="stroke-background opacity-80"
          >
            {wordmark}
          </text>
          <text
            x={14}
            y={height - 15.5}
            className="stroke-foreground opacity-25"
          >
            {wordmark}
          </text>
        </g>

        {/* The reflection slides along as the device lifts, the way light
            moves across metal you tilt. */}
        <g clipPath={`url(#${ids.clip})`}>
          <rect
            x={-20}
            y={-height}
            width={36}
            height={height * 3}
            fill={`url(#${ids.sheen})`}
            transform={`rotate(24 ${width / 2} ${height / 2})`}
            className="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover/device:translate-x-[60px]"
          />
        </g>

        {/* A machined chamfer: a bright line just inside the edge, a dark
            one on it. */}
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

        {/* The microphone pinhole, which glows while it listens. */}
        <circle
          cx={width - 16}
          cy={16}
          r={1.8}
          className="fill-foreground opacity-50"
        />
        {recording ? (
          <g
            data-slot="voice-memo-light"
            className="animate-pulse motion-reduce:animate-none"
          >
            <circle
              cx={width - 16}
              cy={16}
              r={5}
              className="fill-destructive blur-[3px]"
            />
            <circle
              cx={width - 16}
              cy={16}
              r={1.6}
              className="fill-destructive"
            />
          </g>
        ) : null}
      </svg>
    </span>
  )
}

export {
  VoiceMemo,
  voiceMemoVariants,
  formatElapsed,
  transcriptToMarkdown,
  type VoiceMemoProps,
  type VoiceMemoResult,
  type VoiceMemoSegment,
}
