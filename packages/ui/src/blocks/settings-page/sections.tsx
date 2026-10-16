import * as React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldItem,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Switch } from "@workspace/ui/components/switch"
import { Textarea } from "@workspace/ui/components/textarea"

import {
  languages,
  pushOptions,
  type PushSetting,
  type Settings,
} from "./data.js"

type SectionProps = {
  settings: Settings
  update: <Key extends keyof Settings>(key: Key, value: Settings[Key]) => void
}

/** A titled group of settings, with a rule between groups. */
function SettingsGroup({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="grid gap-6 border-b border-border py-8 first:pt-0 last:border-b-0 @3xl/settings:grid-cols-[16rem_1fr] @3xl/settings:gap-12">
      <div className="flex flex-col gap-1">
        <h2 className="m-0 text-base font-semibold text-foreground">{title}</h2>
        <p className="m-0 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex min-w-0 flex-col gap-6">{children}</div>
    </section>
  )
}

function ProfileSection({
  settings,
  update,
  nameMissing,
}: SectionProps & { nameMissing: boolean }) {
  const initials = settings.name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  return (
    <SettingsGroup
      title="Profile"
      description="How you appear to the people in your workspace."
    >
      <div className="flex items-center gap-4">
        <Avatar size="lg">
          <AvatarFallback>{initials || "?"}</AvatarFallback>
        </Avatar>
        <p className="m-0 text-sm text-muted-foreground">
          Your initials stand in until you add a photo.
        </p>
      </div>
      <FieldGroup>
        <Field invalid={nameMissing}>
          <FieldLabel>Name</FieldLabel>
          <Input
            value={settings.name}
            onChange={(event) => update("name", event.target.value)}
            autoComplete="name"
          />
          <FieldError>Enter your name.</FieldError>
        </Field>
        <Field>
          <FieldLabel>Username</FieldLabel>
          <Input
            value={settings.username}
            onChange={(event) => update("username", event.target.value)}
            autoComplete="username"
          />
          <FieldDescription>
            People mention you with @{settings.username || "username"}.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel>Bio</FieldLabel>
          <Textarea
            value={settings.bio}
            onChange={(event) => update("bio", event.target.value)}
            maxLength={160}
          />
          <FieldDescription>
            {160 - settings.bio.length} characters left.
          </FieldDescription>
        </Field>
      </FieldGroup>
    </SettingsGroup>
  )
}

function NotificationsSection({ settings, update }: SectionProps) {
  const toggles = [
    {
      key: "mentionEmails",
      label: "Mentions and replies",
      description: "An email when someone mentions you or replies to you.",
    },
    {
      key: "weeklyDigest",
      label: "Weekly digest",
      description: "A Monday summary of what changed in your projects.",
    },
    {
      key: "productUpdates",
      label: "Product updates",
      description: "New features, at most once a month.",
    },
  ] as const
  return (
    <>
      <SettingsGroup title="Email" description="What lands in your inbox.">
        <FieldGroup>
          {toggles.map((toggle) => (
            <Field key={toggle.key} orientation="horizontal">
              <FieldContent>
                <FieldLabel>{toggle.label}</FieldLabel>
                <FieldDescription>{toggle.description}</FieldDescription>
              </FieldContent>
              <Switch
                checked={settings[toggle.key]}
                onCheckedChange={(checked) => update(toggle.key, checked)}
              />
            </Field>
          ))}
        </FieldGroup>
      </SettingsGroup>
      <SettingsGroup
        title="Push"
        description="What reaches your phone and desktop."
      >
        <Field>
          <RadioGroup
            aria-label="Push notifications"
            value={settings.push}
            onValueChange={(value) => update("push", value as PushSetting)}
            className="gap-4"
          >
            {pushOptions.map((option) => (
              <FieldItem key={option.value}>
                <RadioGroupItem value={option.value} className="mt-0.5" />
                <FieldContent>
                  <FieldLabel>{option.label}</FieldLabel>
                  <FieldDescription>{option.description}</FieldDescription>
                </FieldContent>
              </FieldItem>
            ))}
          </RadioGroup>
        </Field>
      </SettingsGroup>
    </>
  )
}

function AccountSection({
  settings,
  update,
  container,
  onDelete,
}: SectionProps & {
  /** Where the confirmation portals to. Defaults to the body. */
  container?: HTMLElement | null
  onDelete: () => void
}) {
  return (
    <>
      <SettingsGroup
        title="Account"
        description="Where we reach you, and the language you read in."
      >
        <FieldGroup>
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              value={settings.email}
              onChange={(event) => update("email", event.target.value)}
              autoComplete="email"
            />
          </Field>
          <Field>
            <FieldLabel>Language</FieldLabel>
            <Select
              items={languages}
              value={settings.language}
              onValueChange={(value) => update("language", value as string)}
            >
              <SelectTrigger className="w-full @lg/settings:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((language) => (
                  <SelectItem key={language.value} value={language.value}>
                    {language.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      </SettingsGroup>
      <SettingsGroup
        title="Danger zone"
        description="Changes here can't be undone."
      >
        <div className="flex flex-col gap-4 rounded-xl border border-destructive-ring p-4 @lg/settings:flex-row @lg/settings:items-center">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm font-medium text-foreground">
              Delete account
            </span>
            <span className="text-sm text-muted-foreground">
              Removes your profile and every project you own, for everyone.
            </span>
          </div>
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant="destructive" type="button" />}
            >
              Delete account
            </AlertDialogTrigger>
            <AlertDialogContent container={container}>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your profile and the projects you own are deleted for everyone
                  in the workspace. This can&apos;t be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={onDelete}>
                  Delete account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SettingsGroup>
    </>
  )
}

export { AccountSection, NotificationsSection, ProfileSection }
export type { SectionProps }
