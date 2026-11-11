"use client"

import { useState, type ReactNode } from "react"

import { Button } from "@workspace/ui/components/button"
import { Toaster, createToastManager } from "@workspace/ui/components/toast"

type ToastManager = ReturnType<typeof createToastManager>

// Each demo gets its own queue and Toaster. With the shared `toast` manager,
// every Toaster on the page would render every toast, so one click would
// stack duplicates.
function ToastDemo({
  children,
}: {
  children: (toast: ToastManager) => ReactNode
}) {
  const [toast] = useState(createToastManager)
  return <Toaster toastManager={toast}>{children(toast)}</Toaster>
}

export function ToastDefaultDemo() {
  return (
    <ToastDemo>
      {(toast) => (
        <Button
          variant="outline"
          onClick={() =>
            toast.add({
              title: "Changes saved",
              description: "Your profile is up to date.",
            })
          }
        >
          Save changes
        </Button>
      )}
    </ToastDemo>
  )
}

const TYPES = [
  ["success", "Invoice sent", "Ada will get it in a minute."],
  ["info", "New version", "Reload to get the latest changes."],
  ["warning", "Storage almost full", "You've used 92% of 10 GB."],
  ["error", "Upload failed", "The file is over the 25 MB limit."],
] as const

export function ToastTypesDemo() {
  return (
    <ToastDemo>
      {(toast) =>
        TYPES.map(([type, title, description]) => (
          <Button
            key={type}
            variant="outline"
            onClick={() => toast.add({ type, title, description })}
          >
            Show {type}
          </Button>
        ))
      }
    </ToastDemo>
  )
}

export function ToastActionDemo() {
  return (
    <ToastDemo>
      {(toast) => (
        <Button
          variant="outline"
          onClick={() => {
            const id = toast.add({
              title: "Message archived",
              timeout: 8000,
              actionProps: {
                children: "Undo",
                onClick: () => toast.close(id),
              },
            })
          }}
        >
          Archive message
        </Button>
      )}
    </ToastDemo>
  )
}

export function ToastPromiseDemo() {
  return (
    <ToastDemo>
      {(toast) => (
        <Button
          variant="outline"
          onClick={() =>
            toast.promise(
              new Promise((resolve) => window.setTimeout(resolve, 2000)),
              {
                loading: {
                  title: "Publishing",
                  description: "Uploading files.",
                },
                success: {
                  title: "Published",
                  description: "Your site is live.",
                },
                error: { title: "Couldn't publish", description: "Try again." },
              }
            )
          }
        >
          Publish site
        </Button>
      )}
    </ToastDemo>
  )
}
