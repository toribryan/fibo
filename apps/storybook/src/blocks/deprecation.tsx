import { TriangleAlertIcon } from "lucide-react"

import componentsMeta from "@workspace/ui/components.meta.json" with { type: "json" }

import { DocLink } from "./doc-link.js"
import { CopyButton } from "./install.js"
import { LINKS } from "./links.js"

type Deprecated = {
  since: string
  removal: string
  replacement: string
  reason: string
  codemod?: string
}

type Info = {
  title: string
  tier: string
  group: string
  deprecated?: Deprecated
}

const META = componentsMeta as unknown as Record<string, Info>

const codemodCommand = (name: string) =>
  `pnpm dlx jscodeshift --parser tsx -t ${LINKS.site}/codemods/${name}.js src`

/**
 * The banner at the top of a deprecated part's docs page. Everything it says
 * comes from the part's `deprecated` entry in components.meta.json, which the
 * registry and the catalog read too, so the three never disagree.
 */
function Deprecation({ name }: { name: string }) {
  const info = META[name]?.deprecated
  if (!info) throw new Error(`${name} has no deprecated entry in metadata`)
  const replacement = META[info.replacement]
  if (!replacement) {
    throw new Error(`${name} is replaced by unknown part ${info.replacement}`)
  }

  return (
    <aside
      aria-label="Deprecated"
      className="my-6 overflow-hidden rounded-xl border border-destructive bg-destructive-subtle"
    >
      <div className="flex gap-3 p-4">
        <TriangleAlertIcon
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-destructive"
        />
        <div className="flex min-w-0 flex-col gap-1.5 text-sm leading-6 text-foreground">
          <p className="m-0 font-semibold">
            Deprecated in {info.since}, removed in {info.removal}. Use{" "}
            <DocLink
              to={`${replacement.tier}-${replacement.group.toLowerCase()}-${info.replacement}--docs`}
              className="text-foreground underline underline-offset-4"
            >
              {replacement.title}
            </DocLink>{" "}
            instead.
          </p>
          <p className="m-0 text-muted-foreground">{info.reason}</p>
        </div>
      </div>
      {info.codemod ? (
        <div className="flex items-center gap-4 border-t border-destructive bg-card px-4 py-2">
          <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground">
            Migrate
          </span>
          <code className="min-w-0 flex-1 overflow-x-auto font-mono text-[0.8125rem] whitespace-pre text-foreground">
            {codemodCommand(info.codemod)}
          </code>
          <CopyButton value={codemodCommand(info.codemod)} />
        </div>
      ) : null}
    </aside>
  )
}

export { Deprecation }
