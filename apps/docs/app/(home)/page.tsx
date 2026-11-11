import { Button } from "@workspace/ui/components/button"
import Link from "next/link"

import { STORYBOOK } from "@/lib/links"

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-4 py-24">
      <h1 className="text-4xl font-semibold tracking-tight">fibo</h1>
      <p className="text-lg text-muted-foreground">
        An achromatic design system built on shadcn/ui and Base UI. Parts
        install from a shadcn registry as source, and a Figma library is checked
        against the code on every pull request.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          render={<Link href="/docs/getting-started" />}
          nativeButton={false}
        >
          Get started
        </Button>
        <Button
          variant="outline"
          render={<a href={`${STORYBOOK}/`} />}
          nativeButton={false}
        >
          Open Storybook
        </Button>
      </div>
    </main>
  )
}
