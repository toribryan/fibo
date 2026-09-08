import { getRegistry } from "@/lib/registry"

export default async function Page() {
  const registry = await getRegistry()

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">fibo-ds</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A design system for experimental projects, built on shadcn/ui and Base
          UI. Every component below installs into any shadcn project with one
          command.
        </p>
      </header>

      <ul className="flex flex-col gap-6">
        {registry.items.map((item) => (
          <li key={item.name} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-medium">{item.title}</h2>
              {item.dependencies && item.dependencies.length > 0 && (
                <span className="font-mono text-xs text-muted-foreground">
                  {item.dependencies.join(", ")}
                </span>
              )}
            </div>
            <pre className="overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-xs">
              pnpm dlx shadcn@latest add {registry.homepage}/r/{item.name}.json
            </pre>
          </li>
        ))}
      </ul>
    </main>
  )
}
