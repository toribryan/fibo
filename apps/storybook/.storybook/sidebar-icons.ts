import {
  BellIcon,
  CompassIcon,
  ComponentIcon,
  ContrastIcon,
  DiamondIcon,
  FileTextIcon,
  FolderIcon,
  HashIcon,
  LayersIcon,
  LayoutGridIcon,
  MousePointerClickIcon,
  RabbitIcon,
  RulerIcon,
  SplineIcon,
  SquareStackIcon,
  TextCursorInputIcon,
  TypeIcon,
  WorkflowIcon,
  type LucideIcon,
} from "lucide-react"

// Lucide icons stand in for Storybook's own sidebar icons, which are hidden
// in manager-head.html. They are picked to echo Figma's layers panel, so the
// tree reads like the Figma file: frames, components and their instances.
// Foundations pages get the icon for the kind of token they document; every
// other entry gets one for its type.
const ICON_BY_ID: Record<string, LucideIcon> = {
  "about-fibo--docs": RabbitIcon,
  "foundations-colors--docs": ContrastIcon,
  "foundations-typography--docs": TypeIcon,
  "foundations-spacing--docs": RulerIcon,
  "foundations-elevation--docs": SquareStackIcon,
  "foundations-motion--docs": SplineIcon,
}

// Each group inside a shelf has an icon for what its parts do.
const ICON_BY_GROUP: Record<string, LucideIcon> = {
  Actions: MousePointerClickIcon,
  Forms: TextCursorInputIcon,
  Display: LayoutGridIcon,
  Navigation: CompassIcon,
  Overlays: LayersIcon,
  Feedback: BellIcon,
  Diagrams: WorkflowIcon,
}

const ICON_BY_TYPE: Record<string, LucideIcon> = {
  root: HashIcon,
  group: FolderIcon,
  component: ComponentIcon,
  docs: FileTextIcon,
  story: DiamondIcon,
}

// Top-level pages sit on the canvas like frames; a docs page under a
// component or section is a page of that part.
function iconFor(item: {
  id: string
  name: string
  type: string
  parent?: string
}) {
  if (ICON_BY_ID[item.id]) return ICON_BY_ID[item.id]
  if (item.type === "group" && ICON_BY_GROUP[item.name])
    return ICON_BY_GROUP[item.name]
  if (item.type === "docs" && !item.parent) return HashIcon
  return ICON_BY_TYPE[item.type]
}

export { iconFor }
