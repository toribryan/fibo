import { useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        })
      }}
      className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring-subtle focus-visible:outline-none"
    >
      {copied ? (
        <CheckIcon className="size-4" />
      ) : (
        <CopyIcon className="size-4" />
      )}
    </button>
  )
}

function CommandLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 px-4 py-2">
      <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <code className="min-w-0 flex-1 overflow-x-auto font-mono text-[0.8125rem] whitespace-pre text-foreground">
        {value}
      </code>
      <CopyButton value={value} />
    </div>
  )
}

/**
 * The two lines a consumer needs: the registry install and the import it
 * produces. Components land in the consumer's `components/ui`, so the import
 * path is theirs, not a package name.
 */
function Install({
  name,
  exports,
  className,
}: {
  name: string
  exports: string[]
  className?: string
}) {
  return (
    <div
      className={cn(
        "my-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card",
        className
      )}
    >
      <CommandLine
        label="Install"
        value={`pnpm dlx shadcn@latest add @fibo/${name}`}
      />
      <CommandLine
        label="Import"
        value={`import { ${exports.join(", ")} } from "@/components/ui/${name}"`}
      />
    </div>
  )
}

export { Install, CopyButton }
