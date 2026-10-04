import * as React from "react"

/**
 * One callback ref that sets every ref given, so a part can keep its own
 * ref on an element and still hand the element to a caller's `ref`. Undo
 * runs through React 19's ref cleanup, which calls a function ref with
 * null and empties an object ref.
 */
export function mergeRefs<T>(
  ...refs: (React.Ref<T> | undefined)[]
): React.RefCallback<T> {
  return (node) => {
    const cleanups = refs.map((ref) => {
      if (typeof ref === "function") {
        const cleanup = ref(node)
        return typeof cleanup === "function" ? cleanup : () => ref(null)
      }
      if (ref) {
        ref.current = node
        return () => {
          ref.current = null
        }
      }
      return undefined
    })
    return () => {
      for (const cleanup of cleanups) cleanup?.()
    }
  }
}
