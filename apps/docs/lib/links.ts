export const STORYBOOK = "https://fibo.toribryan.com/storybook"
export const GITHUB = "https://github.com/toribryan/fibo"

export function storybookDocs(id: string) {
  return `${STORYBOOK}/?path=/docs/${id}--docs`
}

export function storybookStory(id: string, theme: "light" | "dark") {
  return `${STORYBOOK}/iframe.html?id=${id}&viewMode=story&theme=${theme}`
}
