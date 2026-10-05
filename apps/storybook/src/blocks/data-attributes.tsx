import type { ReactNode } from "react"

type DataAttribute = {
  attribute: string
  element: ReactNode
  when: ReactNode
}

const code =
  "rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.8125rem] text-foreground"

/**
 * The attributes a part sets on its own markup, so consumers can style it by
 * slot or state without reaching into its class names. On a phone each
 * attribute stacks above what it marks and when, rather than squeezing three
 * columns side by side.
 */
function DataAttributes({ rows }: { rows: DataAttribute[] }) {
  return (
    <>
      <dl className="my-6 divide-y divide-border text-sm sm:hidden">
        {rows.map((row) => (
          <div
            key={row.attribute}
            className="flex flex-col gap-2 py-3 first:pt-0"
          >
            <dt>
              <code className={`${code} break-all`}>{row.attribute}</code>
            </dt>
            <dd className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Element</span>
              <span className="leading-6 text-foreground">{row.element}</span>
            </dd>
            <dd className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">
                Present when
              </span>
              <span className="leading-6 text-foreground">{row.when}</span>
            </dd>
          </div>
        ))}
      </dl>
      <div className="my-6 overflow-x-auto max-sm:hidden">
        <table className="w-full min-w-lg border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border text-foreground">
              <th className="py-2.5 pr-4 font-medium">Attribute</th>
              <th className="py-2.5 pr-4 font-medium">Element</th>
              <th className="py-2.5 font-medium">Present when</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.attribute}
                className="border-b border-border align-top last:border-b-0"
              >
                <td className="py-3 pr-4">
                  <code className={`${code} whitespace-nowrap`}>
                    {row.attribute}
                  </code>
                </td>
                <td className="py-3 pr-4 leading-6 text-muted-foreground">
                  {row.element}
                </td>
                <td className="py-3 leading-6 text-muted-foreground">
                  {row.when}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export { DataAttributes }
