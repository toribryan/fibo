/*
 * The skills live in their own repo and change on their own schedule, so the
 * pages read them from GitHub in the browser instead of copying them in. The
 * site stays static: one tree request per session, one raw request per file,
 * shared by every page that reads the collection.
 */
const REPO = "toribryan/toribryan"
const BRANCH = "main"
const ROOT = "design-skills"
const TREE_URL = `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`
const RAW_URL = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`
const CACHE_KEY = `fibo-skills-tree:${REPO}@${BRANCH}`

type GitTree = { tree: { path: string; type: string }[] }

let pathsRequest: Promise<string[]> | undefined
const fileRequests = new Map<string, Promise<string>>()

// The unauthenticated GitHub API allows 60 requests an hour, so the listing
// is kept for the session rather than refetched on every visit to the page.
function loadPaths() {
  pathsRequest ??= (async () => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) return JSON.parse(cached) as string[]
    } catch {
      // Storage can be blocked; the network is the fallback.
    }
    const response = await fetch(TREE_URL)
    if (!response.ok) throw new Error(`GitHub answered ${response.status}`)
    const { tree } = (await response.json()) as GitTree
    const paths = tree
      .filter(
        (item) => item.type === "blob" && item.path.startsWith(`${ROOT}/`)
      )
      .map((item) => item.path.slice(ROOT.length + 1))
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(paths))
    } catch {
      // Not caching only costs a request next time.
    }
    return paths
  })()
  pathsRequest.catch(() => {
    pathsRequest = undefined
  })
  return pathsRequest
}

function loadFile(path: string) {
  let request = fileRequests.get(path)
  if (!request) {
    request = fetch(`${RAW_URL}/${ROOT}/${path}`).then((response) => {
      if (!response.ok) throw new Error(`GitHub answered ${response.status}`)
      return response.text()
    })
    request.catch(() => fileRequests.delete(path))
    fileRequests.set(path, request)
  }
  return request
}

function githubUrl(path: string) {
  return `https://github.com/${REPO}/blob/${BRANCH}/${ROOT}/${path}`
}

type Frontmatter = Record<string, string>

// Skills and agents open with a small YAML block: plain `key: value` lines,
// or a folded `key: >-` value on the indented lines below it.
function splitFrontmatter(source: string): {
  meta: Frontmatter
  body: string
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source)
  if (!match) return { meta: {}, body: source }
  const meta: Frontmatter = {}
  let key: string | undefined
  for (const line of match[1]!.split(/\r?\n/)) {
    const field = /^([\w-]+):\s*(.*)$/.exec(line)
    if (field) {
      key = field[1]!
      const value = field[2]!
      meta[key] = /^[>|]-?$/.test(value)
        ? ""
        : value.replace(/^["']|["']$/g, "")
    } else if (key && line.trim()) {
      meta[key] = `${meta[key]} ${line.trim()}`.trim()
    }
  }
  return { meta, body: source.slice(match[0].length) }
}

function resolvePath(from: string, href: string) {
  const parts = from.split("/").slice(0, -1)
  for (const segment of href.split("/")) {
    if (segment === "..") parts.pop()
    else if (segment && segment !== ".") parts.push(segment)
  }
  return parts.join("/")
}

export {
  BRANCH,
  RAW_URL,
  REPO,
  ROOT,
  githubUrl,
  loadFile,
  loadPaths,
  resolvePath,
  splitFrontmatter,
}
export type { Frontmatter }
