"use client"

import { useState } from "react"
import {
  CircleDashedIcon,
  SignalHighIcon,
  TagIcon,
  UserIcon,
  XIcon,
} from "lucide-react"

import {
  FilterMenu,
  type FilterField,
  type FilterValue,
} from "@workspace/ui/components/filter-menu"

const FIELDS: FilterField[] = [
  {
    id: "status",
    label: "Status",
    icon: <CircleDashedIcon />,
    options: [
      { value: "backlog", label: "Backlog" },
      { value: "todo", label: "Todo" },
      { value: "in-progress", label: "In progress" },
      { value: "done", label: "Done" },
    ],
  },
  {
    id: "assignee",
    label: "Assignee",
    icon: <UserIcon />,
    options: [
      { value: "ada", label: "Ada Lovelace" },
      { value: "grace", label: "Grace Hopper" },
      { value: "katherine", label: "Katherine Johnson" },
    ],
  },
  {
    id: "priority",
    label: "Priority",
    icon: <SignalHighIcon />,
    options: [
      { value: "urgent", label: "Urgent" },
      { value: "high", label: "High" },
      { value: "medium", label: "Medium" },
      { value: "low", label: "Low" },
    ],
  },
  {
    id: "label",
    label: "Label",
    icon: <TagIcon />,
    options: [
      { value: "bug", label: "Bug" },
      { value: "design", label: "Design" },
    ],
  },
]

const labelOf = (fieldId: string, optionValue: string) =>
  FIELDS.find((f) => f.id === fieldId)?.options.find(
    (o) => o.value === optionValue
  )?.label ?? optionValue

export default function FilterMenuDemo() {
  const [value, setValue] = useState<FilterValue>({
    status: ["todo", "in-progress"],
    priority: ["urgent"],
  })

  return (
    <div className="flex min-h-96 w-full max-w-2xl flex-wrap items-start gap-2 p-6">
      <FilterMenu fields={FIELDS} value={value} onValueChange={setValue} />
      {Object.entries(value).map(([fieldId, values]) => {
        const field = FIELDS.find((f) => f.id === fieldId)
        return (
          <span
            key={fieldId}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-card pr-1 pl-3 text-sm"
          >
            <span className="text-muted-foreground">{field?.label}</span>
            {values.map((v) => labelOf(fieldId, v)).join(", ")}
            <button
              type="button"
              aria-label={`Remove ${field?.label} filter`}
              onClick={() => {
                const rest = { ...value }
                delete rest[fieldId]
                setValue(rest)
              }}
              className="flex size-6 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring-subtle"
            >
              <XIcon className="size-3.5" />
            </button>
          </span>
        )
      })}
    </div>
  )
}
