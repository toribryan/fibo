import {
  BugIcon,
  ChartColumnIcon,
  CirclePlayIcon,
  GlobeIcon,
  PlusIcon,
  SparklesIcon,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Kbd, KbdGroup } from "@workspace/ui/components/kbd"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"

const ROLES = [
  { value: "viewer", label: "Viewer" },
  { value: "editor", label: "Editor" },
  { value: "admin", label: "Admin" },
]

const PRODUCTS = [
  { label: "Product analytics", Icon: ChartColumnIcon, colour: "text-chart-1" },
  { label: "Web analytics", Icon: GlobeIcon, colour: "text-chart-2" },
  { label: "Assistant", Icon: SparklesIcon, colour: "text-chart-3" },
  { label: "Session replay", Icon: CirclePlayIcon, colour: "text-chart-4" },
  { label: "Error tracking", Icon: BugIcon, colour: "text-chart-5" },
]

// The same few parts in one theme. A column sets nothing but data-theme, so
// whatever changes between them is the theme's doing.
function Scene({
  name,
  theme,
}: {
  name: string
  theme?: "mechanical" | "electrical"
}) {
  return (
    <section
      aria-label={name}
      data-theme={theme}
      className={cn(
        "flex min-w-0 flex-col gap-5 rounded-xl border border-border p-5",
        !theme && "bg-background"
      )}
    >
      <h3 className="m-0 text-sm font-medium text-muted-foreground">{name}</h3>
      <div className="flex flex-wrap gap-2">
        <Button>
          <PlusIcon data-icon="inline-start" />
          New
        </Button>
        <Button variant="outline">Share</Button>
        <Button variant="secondary">Export</Button>
        <Button variant="ghost">Cancel</Button>
      </div>
      <Tabs defaultValue="day">
        <TabsList aria-label={`${name} range`}>
          <TabsTrigger value="day">Day</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
        </TabsList>
      </Tabs>
      <FieldGroup size="sm">
        <Field>
          <FieldLabel>Name</FieldLabel>
          <Input defaultValue="Ada Lovelace" />
        </Field>
        <Field>
          <FieldLabel>Role</FieldLabel>
          <Select defaultValue="editor" items={ROLES}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
      <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
        {PRODUCTS.map(({ label, Icon, colour }) => (
          <li key={label} className="m-0 flex items-center gap-2">
            <Icon aria-hidden="true" className={cn("size-4", colour)} />
            {label}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <Badge>Live</Badge>
        <Badge variant="success">Healthy</Badge>
        <Badge variant="outline">Draft</Badge>
        <KbdGroup className="ml-auto">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </div>
    </section>
  )
}

function ThemeCompare() {
  return (
    <div className="my-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Scene name="fibo" />
      <Scene name="Mechanical" theme="mechanical" />
      <Scene name="Electrical" theme="electrical" />
    </div>
  )
}

export { ThemeCompare }
