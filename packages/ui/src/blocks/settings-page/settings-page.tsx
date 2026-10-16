"use client"

import * as React from "react"

import { Button } from "@workspace/ui/components/button"
import { Kbd, KbdGroup } from "@workspace/ui/components/kbd"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { toast, Toaster } from "@workspace/ui/components/toast"
import { cn } from "@workspace/ui/lib/utils"

import { initialSettings, type Settings } from "./data.js"
import {
  AccountSection,
  NotificationsSection,
  ProfileSection,
} from "./sections.js"

type Tab = "profile" | "notifications" | "account"

type SettingsPageProps = Omit<
  React.ComponentProps<"form">,
  "children" | "onSubmit"
> & {
  /** The settings the page opens with. Defaults to the placeholder in `data.ts`. */
  initialValues?: Settings
  /** Called with every setting when they're saved. Persist them here. */
  onSave?: (settings: Settings) => void
  /** Where the delete confirmation portals to. Defaults to the body. */
  container?: HTMLElement | null
}

const noSubscription = () => () => {}

// Matches the key the shortcut listens for: Cmd on Apple devices, Ctrl
// elsewhere. The server snapshot keeps the first render hydration-safe.
function useIsMac() {
  return React.useSyncExternalStore(
    noSubscription,
    () => /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent),
    () => false
  )
}

const changed = (a: Settings, b: Settings) =>
  (Object.keys(a) as (keyof Settings)[]).some((key) => a[key] !== b[key])

/**
 * A settings screen in three tabs. Edits collect in one form, a save bar
 * appears once anything differs from what was last saved, and Cmd+S or
 * Ctrl+S saves from any field.
 */
function SettingsPage({
  initialValues = initialSettings,
  onSave,
  container,
  className,
  ...props
}: SettingsPageProps) {
  const [saved, setSaved] = React.useState(initialValues)
  const [settings, setSettings] = React.useState(initialValues)
  const [tab, setTab] = React.useState<Tab>("profile")
  const [nameMissing, setNameMissing] = React.useState(false)
  const mac = useIsMac()
  const dirty = changed(settings, saved)

  const update = <Key extends keyof Settings>(
    key: Key,
    value: Settings[Key]
  ) => {
    setSettings((current) => ({ ...current, [key]: value }))
    if (key === "name" && String(value).trim()) setNameMissing(false)
  }

  const save = () => {
    if (!settings.name.trim()) {
      setNameMissing(true)
      setTab("profile")
      return
    }
    // onSave first: if it throws, the values stay unsaved and the bar stays.
    onSave?.(settings)
    setSaved(settings)
    toast.add({ title: "Settings saved" })
  }

  return (
    <form
      data-slot="settings-page"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
      onKeyDown={(event) => {
        if (event.key === "s" && (event.metaKey || event.ctrlKey)) {
          event.preventDefault()
          if (dirty) event.currentTarget.requestSubmit()
        }
      }}
      className={cn(
        "@container/settings flex min-h-svh flex-col bg-background text-foreground",
        className
      )}
      {...props}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 pt-10 pb-28 @2xl/settings:px-8">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-2xl font-semibold tracking-tight">
            Settings
          </h1>
          <p className="m-0 text-sm text-muted-foreground">
            Manage your profile, what you hear about and your account.
          </p>
        </div>

        <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
          <TabsList variant="line">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="pt-8">
            <ProfileSection
              settings={settings}
              update={update}
              nameMissing={nameMissing}
            />
          </TabsContent>
          <TabsContent value="notifications" className="pt-8">
            <NotificationsSection settings={settings} update={update} />
          </TabsContent>
          <TabsContent value="account" className="pt-8">
            <AccountSection
              settings={settings}
              update={update}
              container={container}
              onDelete={() =>
                toast.add({
                  title: "Account scheduled for deletion",
                  description: "We'll email you a link to confirm.",
                })
              }
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Mounted while clean too, so the change is announced when it comes. */}
      <p role="status" className="sr-only">
        {dirty ? "You have unsaved changes." : ""}
      </p>
      {dirty ? (
        <div className="sticky bottom-4 z-10 animate-in px-4 duration-150 fade-in-0 slide-in-from-bottom-2 motion-reduce:animate-none">
          <div className="mx-auto flex max-w-4xl flex-col gap-3 rounded-xl border border-border bg-popover p-3 shadow-lg @lg/settings:flex-row @lg/settings:items-center">
            <span className="flex flex-1 items-center gap-2 px-1 text-sm">
              Unsaved changes
              <KbdGroup className="hidden @lg/settings:inline-flex">
                <Kbd>{mac ? "⌘" : "Ctrl"}</Kbd>
                <Kbd>S</Kbd>
              </KbdGroup>
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 @lg/settings:flex-none"
                onClick={() => {
                  setSettings(saved)
                  setNameMissing(false)
                }}
              >
                Discard
              </Button>
              <Button type="submit" className="flex-1 @lg/settings:flex-none">
                Save changes
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Remove this if your app already mounts a Toaster near its root. */}
      <Toaster />
    </form>
  )
}

export { SettingsPage }
export type { SettingsPageProps }
