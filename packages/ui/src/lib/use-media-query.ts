import * as React from "react"

/**
 * Whether a media query matches, kept in step as it changes. False on the
 * server and during hydration, so server markup never depends on it.
 */
export function useMediaQuery(query: string) {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener("change", onChange)
      return () => list.removeEventListener("change", onChange)
    },
    [query]
  )
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  )
}
