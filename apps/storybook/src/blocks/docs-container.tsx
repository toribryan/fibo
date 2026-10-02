import {
  useMemo,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react"
import {
  DocsContainer,
  Unstyled,
  type DocsContainerProps,
} from "@storybook/addon-docs/blocks"
import { ArrowUpRightIcon, BugIcon } from "lucide-react"

import componentsMeta from "@workspace/ui/components.meta.json" with { type: "json" }

import { darkTheme, lightTheme } from "../../.storybook/theme.js"
import { FigmaIcon } from "./brand-icons.js"
import { DocTabsContext, useDocTabsState } from "./doc-tabs.js"
import { LINKS } from "./links.js"
import { SiteNav } from "./site-nav.js"

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  })
  return () => observer.disconnect()
}

/*
 * The preview flips `.dark` on the document when the toolbar changes. The
 * container reads that class so Storybook's own blocks (canvases, the props
 * table, code) switch with the page.
 */
function useIsDark() {
  return useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false
  )
}

function Footer() {
  const cards = [
    {
      href: `${LINKS.github}/issues/new`,
      icon: BugIcon,
      title: "Report a bug",
      body: "Something broken or off-spec? Open an issue on GitHub.",
    },
    {
      href: LINKS.figma,
      icon: FigmaIcon,
      title: "Open the Figma library",
      body: "Most components here have a Figma page of their own, linked at the top of their docs.",
    },
  ]
  return (
    <footer className="mt-28 flex flex-col gap-6 border-t border-border pt-10">
      <div className="flex flex-col gap-1">
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Found something off?
        </span>
        <span className="text-sm text-muted-foreground">
          fibo is small on purpose. Feedback shapes what gets added next.
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map(({ href, icon: Icon, title, body }) => (
          <a
            key={title}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-4 rounded-2xl border border-border p-5 no-underline transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring-subtle focus-visible:outline-none"
          >
            <Icon className="mt-0.5 size-5 shrink-0 text-foreground" />
            <span className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-foreground">
                {title}
              </span>
              <span className="text-sm text-muted-foreground">{body}</span>
            </span>
          </a>
        ))}
      </div>
    </footer>
  )
}

type Context = DocsContainerProps["context"]

const META = componentsMeta as unknown as Record<
  string,
  { title: string; tier: string; figma?: string }
>

/*
 * The Figma page for the component a docs page is about, found from the
 * page's title ("Special components/Map pin") and the part's `figma` node in
 * components.meta.json. Pages that aren't about a component, and parts with
 * no Figma page yet, get nothing.
 */
function figmaUrl(context: Context) {
  let title: string | undefined
  try {
    const resolved = context.resolveOf("meta", ["meta"])
    title = "preparedMeta" in resolved ? resolved.preparedMeta.title : undefined
  } catch {
    return undefined
  }
  if (!title) return undefined
  const [shelf, name] = title.split("/")
  const tier = shelf?.trim().toLowerCase().replace(/\s+/g, "-")
  const part = Object.values(META).find(
    (info) => info.tier === tier && info.title === name?.trim()
  )
  return part?.figma ? `${LINKS.figma}?node-id=${part.figma}` : undefined
}

function FigmaLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="float-right mt-2 ml-4 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground no-underline transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring-subtle focus-visible:outline-none"
    >
      <FigmaIcon className="size-3.5" />
      Open in Figma
      <ArrowUpRightIcon
        aria-hidden
        className="size-3.5 text-muted-foreground"
      />
    </a>
  )
}

/*
 * Storybook builds "On this page" from the headings that don't match its
 * ignore selector, and rebuilds it when that selector changes. So the context
 * handed to DocsContainer adds the headings of every doc tab but the open
 * one. It goes by which panel a heading sits in, not whether it's visible,
 * because the list rebuilds before the old panel is hidden; and it matches
 * nothing on a page without tabs. The context object itself stays stable,
 * so switching tabs never re-renders the stories.
 */
function useTabAwareContext(
  context: Context,
  tabRef: RefObject<string | null>
) {
  return useMemo(() => {
    const proxy: Context = Object.create(context)
    proxy.resolveOf = ((...args: Parameters<Context["resolveOf"]>) => {
      const resolved = context.resolveOf(...args)
      // Only the container asks for "meta" by name; blocks pass a module,
      // and keep getting Storybook's own answer.
      if (args[0] !== "meta" || !("preparedMeta" in resolved)) return resolved
      const parameters = resolved.preparedMeta.parameters
      const toc = parameters?.docs?.toc
      if (!toc) return resolved
      const tab = tabRef.current
      // With no tab chosen yet, DocTabs opens the first.
      const others = tab
        ? `[data-doc-tab]:not([data-doc-tab="${tab}"]) *`
        : "[data-doc-tab] ~ [data-doc-tab] *"
      const ignoreSelector = `${toc.ignoreSelector ?? ".docs-story *, .skip-toc"}, ${others}`
      return {
        ...resolved,
        preparedMeta: {
          ...resolved.preparedMeta,
          parameters: {
            ...parameters,
            docs: { ...parameters.docs, toc: { ...toc, ignoreSelector } },
          },
        },
      }
    }) as Context["resolveOf"]
    return proxy
  }, [context, tabRef])
}

function FiboDocsContainer({
  children,
  context,
}: DocsContainerProps & { children: ReactNode }) {
  const dark = useIsDark()
  const tabs = useDocTabsState()
  const tabAwareContext = useTabAwareContext(context, tabs.tabRef)
  const figma = useMemo(() => figmaUrl(context), [context])
  return (
    <DocTabsContext value={tabs}>
      <DocsContainer
        context={tabAwareContext}
        theme={dark ? darkTheme : lightTheme}
      >
        <Unstyled>
          <div className="fibo-docs font-sans text-foreground antialiased">
            {figma ? <FigmaLink href={figma} /> : null}
            {children}
            <Footer />
          </div>
          <SiteNav />
        </Unstyled>
      </DocsContainer>
    </DocTabsContext>
  )
}

export { FiboDocsContainer }
