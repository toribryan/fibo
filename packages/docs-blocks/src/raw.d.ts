// `?raw` imports a file's text as a string: Vite natively, and Next through
// the turbopack rule in apps/docs/next.config.mjs.
declare module "*?raw" {
  const content: string
  export default content
}
