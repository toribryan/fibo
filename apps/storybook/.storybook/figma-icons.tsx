import React, { type ReactNode } from "react"

// Sidebar glyphs drawn after Figma's layers panel, so the Storybook tree reads
// like the file it mirrors: sections hold frames, components hold instances.
// Drawn on a 16px grid with 1px strokes on half pixels so they stay crisp.

export type FigmaIcon = (props: { className?: string }) => ReactNode

function glyph(children: ReactNode, filled = false): FigmaIcon {
  return function Glyph({ className }) {
    return (
      <svg
        className={className}
        width={16}
        height={16}
        viewBox="0 0 16 16"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1}
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    )
  }
}

/** A top-level page, like a frame on the canvas. */
export const FrameIcon = glyph(
  <path d="M5.5 2v12M10.5 2v12M2 5.5h12M2 10.5h12" />
)

/** A top-level section, drawn as a folder in the Figma file browser. */
export const FolderIcon = glyph(
  <path d="M1.5 2.5h5l1.5 1.5h6.5v9h-13ZM1.5 6h13" />
)

/** A group of entries inside a section. */
export const GroupIcon = glyph(
  <rect x={2.5} y={2.5} width={11} height={11} strokeDasharray="2 2" />
)

/** A component, which holds its stories the way a main component holds variants. */
export const ComponentIcon = glyph(
  <path d="M8 1.5 10 3.5 8 5.5 6 3.5ZM12.5 6 14.5 8 12.5 10 10.5 8ZM8 10.5 10 12.5 8 14.5 6 12.5ZM3.5 6 5.5 8 3.5 10 1.5 8Z" />
)

/** A story, an instance of its component. */
export const InstanceIcon = glyph(<path d="M8 2 14 8 8 14 2 8Z" />)

/** A component's docs page. */
export const PageIcon = glyph(
  <path d="M3.5 1.5h6l3 3v10h-9ZM9.5 1.5v3h3M5.5 8.5h5M5.5 11h5" />
)

/** Colour tokens, drawn as a paint style swatch. */
export const PaintStyleIcon = glyph(
  <>
    <circle cx={8} cy={8} r={5.5} />
    <path d="M8 2.5a5.5 5.5 0 0 0 0 11Z" fill="currentColor" />
  </>
)

/** Type tokens, drawn as a text layer. */
export const TextIcon = glyph(<path d="M3.5 4.5v-1h9v1M8 3.5v9M6 12.5h4" />)

/** The theme creator, which edits tokens the way Figma edits variables. */
export const VariablesIcon = glyph(
  <>
    <path d="M8 1.5 13.5 4.75v6.5L8 14.5 2.5 11.25v-6.5Z" />
    <circle cx={8} cy={8} r={1.5} fill="currentColor" />
  </>
)
