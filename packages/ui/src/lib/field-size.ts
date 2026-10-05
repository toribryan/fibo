import * as React from "react"

export type FieldSize = "sm" | "default"

/**
 * The size a FieldGroup or Field sets for the controls inside it. It lives
 * here rather than in the Field part so a control can read it without
 * installing Field.
 */
export const FieldSizeContext = React.createContext<FieldSize | undefined>(
  undefined
)

/** A control's own size wins, then the nearest Field's or FieldGroup's. */
export function useFieldSize(size?: FieldSize): FieldSize {
  const inherited = React.useContext(FieldSizeContext)
  return size ?? inherited ?? "default"
}
