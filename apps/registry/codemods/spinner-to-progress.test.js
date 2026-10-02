import jscodeshift from "jscodeshift"
import { describe, expect, it, vi } from "vitest"

import transform from "./spinner-to-progress.js"

// The runner's contract: null means the file is untouched.
function run(source, report = () => {}) {
  const j = jscodeshift.withParser("tsx")
  const output = transform(
    { source, path: "app.tsx" },
    { jscodeshift: j, j, stats: () => {}, report }
  )
  return (output ?? source).trim()
}

describe("spinner-to-progress", () => {
  it("swaps the import and the element, keeping the alias", () => {
    const output = run(`import { Spinner } from "@/components/ui/spinner"

export const Loading = () => <Spinner />
`)
    expect(output).toBe(`import { Progress } from "@/components/ui/progress"

export const Loading = () => <Progress value={null} aria-label="Loading" />`)
  })

  it("turns label into aria-label and drops size", () => {
    const output = run(`import { Spinner } from "~/ui/spinner"
const a = <Spinner size="lg" label="Saving" className="mx-auto" />
`)
    expect(output).toContain(
      `<Progress value={null} label="Saving" className="mx-auto" />`.replace(
        "label",
        "aria-label"
      )
    )
    expect(output).toContain(`from "~/ui/progress"`)
  })

  it("joins an existing Progress import", () => {
    const output = run(`import { Spinner } from "@/components/ui/spinner"
import { Progress, ProgressLabel } from "@/components/ui/progress"
const a = <Spinner />
const b = <Progress value={1}><ProgressLabel>x</ProgressLabel></Progress>
`)
    expect(output).not.toContain("spinner")
    expect(output.match(/from "@\/components\/ui\/progress"/g)).toHaveLength(1)
  })

  it("follows a renamed import", () => {
    const output =
      run(`import { Spinner as Loader } from "@/components/ui/spinner"
const a = <Loader label={busyLabel} />
`)
    expect(output).toContain(`<Progress value={null} aria-label={busyLabel} />`)
  })

  it("leaves a value use alone and reports it", () => {
    const report = vi.fn()
    const source = `import { Spinner } from "@/components/ui/spinner"
const icon = Spinner
const a = <Spinner />
`
    expect(run(source, report)).toBe(source.trim())
    expect(report).toHaveBeenCalledWith(
      expect.stringContaining("app.tsx:2 Spinner is used as a value")
    )
  })

  it("keeps other imports from spinner and reports them", () => {
    const report = vi.fn()
    const output = run(
      `import { Spinner, spinnerVariants } from "@/components/ui/spinner"
const a = <Spinner />
const b = spinnerVariants()
`,
      report
    )
    expect(output).toContain(
      `import { spinnerVariants } from "@/components/ui/spinner"`
    )
    expect(report).toHaveBeenCalledWith(
      expect.stringContaining("still has other imports")
    )
  })

  it("asks for a check when a spread may carry the label", () => {
    const report = vi.fn()
    const output = run(
      `import { Spinner } from "@/components/ui/spinner"
const a = <Spinner {...props} />
`,
      report
    )
    expect(output).toContain(`<Progress value={null} {...props} />`)
    expect(report).toHaveBeenCalledWith(expect.stringContaining("spread"))
  })

  it("does nothing to a file without Spinner", () => {
    const source = `import { Button } from "@/components/ui/button"`
    expect(run(source)).toBe(source)
  })
})
