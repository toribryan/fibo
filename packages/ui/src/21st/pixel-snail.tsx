"use client"

import {
  motion,
  useReducedMotion as usePrefersReducedMotion,
} from "motion/react"

import { PixelSnail } from "@workspace/ui/components/pixel-snail"

// A highlight sweeps across the caption so it reads as work in progress.
function Shimmer({ children }: { children: string }) {
  const reduceMotion = usePrefersReducedMotion()
  if (reduceMotion) {
    return <span className="text-sm text-muted-foreground">{children}</span>
  }
  return (
    <motion.span
      className="bg-clip-text text-sm text-transparent"
      style={{
        backgroundImage:
          "linear-gradient(90deg, var(--color-muted-foreground) 35%, var(--color-foreground) 50%, var(--color-muted-foreground) 65%)",
        backgroundSize: "250% 100%",
      }}
      initial={{ backgroundPosition: "100% 0" }}
      animate={{ backgroundPosition: "0% 0" }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
    >
      {children}
    </motion.span>
  )
}

export default function PixelSnailDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border border-border bg-card p-10 text-center">
      <PixelSnail size="lg" pace="fast" label="Loading your projects" />
      <Shimmer>Fetching your projects</Shimmer>
    </div>
  )
}
