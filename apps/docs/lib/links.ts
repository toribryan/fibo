// Until the cutover in plans/016-docs-site.md, Storybook stays at the root.
export const STORYBOOK = "https://fibo.toribryan.com"
export const GITHUB = "https://github.com/toribryan/fibo"

export function storybookDocs(id: string) {
  return `${STORYBOOK}/?path=/docs/${id}--docs`
}
