import type { ComponentProps } from "react"

// lucide-react 1.x dropped brand marks, so the ones the docs use live here.
// The React and Tailwind CSS marks are from ncdai's hero-01 icons.

function GithubIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  )
}

function FigmaIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5Z" />
      <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2Z" />
      <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0Z" />
      <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 1 1-7 0Z" />
      <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5Z" />
    </svg>
  )
}

function ShadcnIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 256 256"
      fill="none"
      stroke="currentColor"
      strokeWidth={25}
      strokeLinecap="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M208 128l-80 80M192 40L40 192" />
    </svg>
  )
}

function BaseUIIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M4 4h7v16H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <path d="M15.5 4A5.5 5.5 0 0 1 21 9.5v0A5.5 5.5 0 0 1 15.5 15H13V4h2.5Z" />
    </svg>
  )
}

function ReactIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" {...props}>
      <path
        d="M50 58.8C54.87 58.8 58.74 54.9 58.74 50C58.74 45.1 54.87 41.2 50 41.2C45.13 41.2 41.26 45.1 41.26 50C41.26 54.9 45.13 58.8 50 58.8Z"
        fill="currentColor"
      />
      <path
        d="M50 68.1C75.93 68.1 97 60 97 50C97 40 75.93 31.9 50 31.9C24.07 31.9 3 40 3 50C3 60 24.07 68.1 50 68.1Z"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M34.5 59C47.42 81.7 64.9 96 73.55 91C82.1 86 78.62 63.6 65.6 41C52.58 18.3 35.1 4 26.55 9C17.9 14 21.48 36.4 34.5 59Z"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        d="M34.5 41C21.48 63.6 18 86 26.55 91C35.1 96 52.58 81.7 65.5 59C78.52 36.4 82.1 14 73.55 9C64.9 4 47.42 18.3 34.5 41Z"
        stroke="currentColor"
        strokeWidth="4"
      />
    </svg>
  )
}

function TailwindIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" {...props}>
      <path
        d="M50 20C36.7 20 28.3 26.7 25 40C30 33.3 35.8 30.8 42.5 32.5C46.3 33.5 49 36.2 52 39.3C56.9 44.3 62.6 50 75 50C88.3 50 96.7 43.3 100 30C95 36.7 89.2 39.2 82.5 37.5C78.7 36.5 76 33.8 73 30.7C68.1 25.8 62.4 20 50 20ZM25 50C11.7 50 3.3 56.7 0 70C5 63.3 10.8 60.8 17.5 62.5C21.3 63.5 24 66.2 27 69.3C31.9 74.3 37.6 80 50 80C63.3 80 71.7 73.3 75 60C70 66.7 64.2 69.2 57.5 67.5C53.7 66.6 51 63.8 48 60.7C43.1 55.8 37.4 50 25 50Z"
        fill="currentColor"
      />
    </svg>
  )
}

function StorybookIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M5 3.5 18.5 2.8a.6.6 0 0 1 .6.6v17.2a.6.6 0 0 1-.6.6L5.2 20.5a.6.6 0 0 1-.6-.6L4.4 4.1a.6.6 0 0 1 .6-.6Z" />
      <path d="M15.5 3v3.4l-1.2-.9-1.2.9V3.1" />
      <path d="M14.3 9.2c-.4-.6-1.2-.9-2.3-.9-1.5 0-2.4.7-2.4 1.8 0 2.3 4.9 1.5 4.9 4 0 1.2-1 1.9-2.6 1.9-1.1 0-2-.4-2.5-1.1" />
    </svg>
  )
}

export {
  GithubIcon,
  FigmaIcon,
  ShadcnIcon,
  BaseUIIcon,
  ReactIcon,
  TailwindIcon,
  StorybookIcon,
}
