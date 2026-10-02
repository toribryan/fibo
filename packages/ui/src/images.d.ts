// Vite turns an imported image into the URL it is served from.
declare module "*.webp" {
  const src: string
  export default src
}
