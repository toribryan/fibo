import jscodeshift from "jscodeshift"
import { describe, expect, it, vi } from "vitest"

import transform from "./sticker-status-to-child.js"

// The runner's contract: null means the file is untouched.
function run(source, report = () => {}) {
  const j = jscodeshift.withParser("tsx")
  const output = transform(
    { source, path: "app.tsx" },
    { jscodeshift: j, j, stats: () => {}, report }
  )
  return (output ?? source).trim()
}

const IMPORT = `import { StickerAvatar } from "@/components/ui/sticker-avatar"\n`

describe("sticker-status-to-child", () => {
  it("moves a literal status into a StatusDot and adds the import", () => {
    const output =
      run(`${IMPORT}const a = <StickerAvatar name="Ana" status="away" />
`)
    expect(output).toContain(
      `import { StatusDot } from "@/components/ui/status-dot"`
    )
    expect(output).toContain(
      `<StickerAvatar name="Ana"><StatusDot status="away" /></StickerAvatar>`
    )
  })

  it("carries the label, and mono when colour was off", () => {
    const output =
      run(`${IMPORT}const a = <StickerAvatar name="Mei" status="present" statusLabel="Here" statusColor={false} />
`)
    expect(output).toContain(
      `<StatusDot status="present" label="Here" variant="mono" />`
    )
    expect(output).not.toMatch(/statusLabel|statusColor/)
  })

  it("keeps an expression status optional", () => {
    const output =
      run(`${IMPORT}const a = <StickerAvatar name={u.name} status={u.status} />
`)
    expect(output).toContain(
      `{u.status ? <StatusDot status={u.status} /> : null}`
    )
  })

  it("turns an expression colour into a variant", () => {
    const output =
      run(`${IMPORT}const a = <StickerAvatar name="A" status="away" statusColor={tinted} />
`)
    expect(output).toContain(`variant={tinted ? "color" : "mono"}`)
  })

  it("puts the dot before existing children and follows an alias", () => {
    const output =
      run(`import { StickerAvatar as Sticker } from "~/ui/sticker-avatar"
const a = <Sticker name="A" status="offline"><span>x</span></Sticker>
`)
    expect(output).toContain(`from "~/ui/status-dot"`)
    expect(output).toMatch(
      /<Sticker name="A"><StatusDot status="offline" \/><span>x<\/span><\/Sticker>/
    )
  })

  it("leaves stickers without a status alone", () => {
    const source = `${IMPORT}const a = <StickerAvatar name="A" />`
    expect(run(source)).toBe(source.trim())
  })

  it("reports spread props it cannot see into", () => {
    const report = vi.fn()
    run(`${IMPORT}const a = <StickerAvatar name="A" {...rest} />`, report)
    expect(report).toHaveBeenCalledWith(expect.stringContaining("spread"))
  })
})
