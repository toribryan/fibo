import { describe, expect, it } from "vitest"

import { mergeImports } from "./merge-imports.mjs"

const lucide = (text) => ({ text, spec: "lucide-react" })

describe("mergeImports", () => {
  it("keeps a lone statement as written", () => {
    const text = 'import {\n  XIcon,\n} from "lucide-react"'
    expect(mergeImports([lucide(text), lucide(text)])).toEqual([text])
  })

  it("merges named imports from one package, once each", () => {
    expect(
      mergeImports([
        lucide('import { SearchIcon, CheckIcon } from "lucide-react"'),
        lucide('import { CheckIcon, MinusIcon } from "lucide-react"'),
      ])
    ).toEqual([
      'import {\n  SearchIcon,\n  CheckIcon,\n  MinusIcon,\n} from "lucide-react"',
    ])
  })

  it("keeps aliases and lets a value import cover a type", () => {
    expect(
      mergeImports([
        {
          text: 'import { cva, type VariantProps } from "class-variance-authority"',
          spec: "class-variance-authority",
        },
        {
          text: 'import { cva as variants, VariantProps } from "class-variance-authority"',
          spec: "class-variance-authority",
        },
      ])
    ).toEqual([
      'import {\n  cva,\n  VariantProps,\n  cva as variants,\n} from "class-variance-authority"',
    ])
  })

  it("leaves a namespace import beside named ones", () => {
    const namespace = { text: 'import * as React from "react"', spec: "react" }
    const named = { text: 'import { useState } from "react"', spec: "react" }
    expect(mergeImports([namespace, named, namespace])).toEqual([
      namespace.text,
      named.text,
    ])
  })

  it("refuses one local name for two imports", () => {
    expect(() =>
      mergeImports([
        lucide('import { XIcon as Icon } from "lucide-react"'),
        lucide('import { CheckIcon as Icon } from "lucide-react"'),
      ])
    ).toThrow(/Icon names both XIcon and CheckIcon/)
  })
})
