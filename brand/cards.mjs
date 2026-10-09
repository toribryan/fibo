import { fibo, toSvg, invert } from "./rabbit.mjs"

// The bundled Geist, by absolute URL, since the cards render from brand/out.
const FONT_CSS = new URL("./fonts/fonts.css", import.meta.url).href

// Dark cards use the inverse: a light silhouette with dark inner lines.
let DARK = false
const draw = (g, o = {}) =>
  DARK
    ? toSvg(invert(g), {
        ...o,
        inkColor: "var(--paper)",
        paperColor: "var(--ink)",
      })
    : toSvg(g, o)

/*
 * Every size on a card is a Fibonacci number: type at 21, 34, 55, 89, 144
 * and 233, gaps at 8 to 89, pixel scales at 3, 5, 8 and 21. Each step is
 * about 1.618 times the last, so the scale is the golden ratio in whole
 * pixels.
 */

// The hero's golden-rectangle construction (apps/storybook/src/blocks/hero.tsx).
const WIDE = {
  viewBox: "0 0 340 210",
  lines: ["M260 0.5V80", "M339.5 80.5H210", "M210 210V0.5"],
  rects: [
    [210, 50.5, 30, 30],
    [240, 60.5, 20, 20],
    [240, 50.5, 20, 10],
  ],
  diagonals: [
    "M105.1 -170.853L464.633 411.625",
    "M-267.831 375.247L600.141 -159.777",
  ],
  spiral:
    "M239.897 60.3571C239.897 54.894 244.414 50.381 249.882 50.381C255.35 50.381 259.868 54.894 259.868 60.3571C259.868 71.2835 250.833 80.3095 239.897 80.3095C223.493 80.3095 209.941 66.7704 209.941 50.381C209.941 23.0652 232.527 0.499999 259.868 0.5C303.613 0.499995 339.75 36.6043 339.75 80.3095C339.75 151.33 281.027 210 209.941 210C95.1103 210 0.25 115.226 0.25 0.5",
  pole: [246.5, 58.2],
}
const TALL = {
  viewBox: "0 0 210 340",
  lines: [
    "M209.5 260L130 260",
    "M129.5 339.5L129.5 210",
    "M159.5 260L159.5 210",
    "M0 210L209.5 210",
    "M160 240L130.133 240",
    "M149.5 240L149.5 260",
  ],
  rects: [],
  diagonals: [
    "M380.853 105.099L-201.625 464.632",
    "M-165.247 -267.831L369.777 600.141",
  ],
  spiral:
    "M149.643 239.897C155.106 239.897 159.619 244.414 159.619 249.882C159.619 255.35 155.106 259.868 149.643 259.868C138.717 259.868 129.69 250.833 129.69 239.897C129.69 223.493 143.23 209.941 159.619 209.941C186.935 209.941 209.5 232.527 209.5 259.868C209.5 303.613 173.396 339.75 129.69 339.75C58.6695 339.75 0 281.027 0 209.941C0 95.1103 94.7738 0.24998 209.5 0.249985",
  pole: [153.8, 246.5],
}

function construction(g, style = "") {
  const r = g.rects
    .map(
      ([x, y, w, h]) =>
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" vector-effect="non-scaling-stroke"/>`
    )
    .join("")
  return `<svg class="construct" viewBox="${g.viewBox}" style="${style}" fill="none" aria-hidden="true">
    <g stroke="var(--line)">
      ${g.diagonals.map((d) => `<path d="${d}" stroke-dasharray="5 3" vector-effect="non-scaling-stroke"/>`).join("")}
      ${g.lines.map((d) => `<path d="${d}" vector-effect="non-scaling-stroke"/>`).join("")}
      ${r}
      <circle cx="${g.pole[0]}" cy="${g.pole[1]}" r="2" vector-effect="non-scaling-stroke"/>
    </g>
  </svg>`
}

const CSS = `
* { box-sizing: border-box; margin: 0; }
.light { --paper: #fafafa; --ink: #0a0a0a; --soft: #737373; --line: #d4d4d4; --dot: #d4d4d4; --spiral: #c7c7c7; --card: #ffffff; --border: #e5e5e5; }
.dark  { --paper: #0a0a0a; --ink: #fafafa; --soft: #a3a3a3; --line: #262626; --dot: #333333; --spiral: #525252; --card: #171717; --border: #262626; }
body { width: var(--w); height: var(--h); overflow: hidden; background: var(--paper); color: var(--ink);
  font-family: Geist, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
.stage { position: relative; width: 100%; height: 100%; overflow: hidden;
  background-image: radial-gradient(circle, var(--dot) 2px, transparent 2.2px); background-size: 34px 34px; background-position: 17px 17px; }
.construct { position: absolute; overflow: visible; }
.hand { font-family: Geist, sans-serif; font-weight: 400; color: var(--soft); font-size: 21px; white-space: nowrap; }
.mono { font-family: "Geist Mono", ui-monospace, monospace; }
.pad { position: absolute; top: 89px; left: 89px; right: 89px; display: flex; flex-direction: column; }
.foot { position: absolute; left: 89px; right: 89px; bottom: 55px; display: flex; align-items: center; justify-content: space-between;
  font: 500 21px/1 "Geist Mono", monospace; color: var(--soft); }
.foot .brand { display: flex; align-items: flex-end; gap: 13px; color: var(--ink); font: 500 44px/0.74 Geist, sans-serif; }
.foot .brand svg { width: 55px; display: block; }
.eyebrow { font: 500 21px/1 "Geist Mono", monospace; letter-spacing: 0.08em; text-transform: uppercase; color: var(--soft); }
.eyebrow + h1 { margin-top: 55px; }
h1 { font-weight: 700; letter-spacing: -0.045em; line-height: 0.95; text-wrap: balance; }
.mark { font-weight: 500; letter-spacing: 0; }
.t89 { font-size: 89px; } .t144 { font-size: 144px; } .t233 { font-size: 233px; }
p.lede { color: var(--soft); text-wrap: pretty; font-size: 34px; line-height: 1.35; margin-top: 34px; }
p.lede b { color: var(--ink); font-weight: 500; }
.bubble { position: absolute; padding: 21px 34px; border: 2px solid var(--border); background: var(--card); font: 500 34px/1.3 "Geist Mono", monospace; }
.abs { position: absolute; }
`

// Posts are numbered along the sequence, as the welcome page's principles are.
const foot = (n) =>
  `<div class="foot"><span class="brand">${draw(fibo())}fibo</span><span>No. ${n} &nbsp;·&nbsp; fibo.toribryan.com</span></div>`

const page = (w, h, theme, body) =>
  `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${FONT_CSS}"><style>:root{--w:${w}px;--h:${h}px}${CSS}</style></head><body class="${theme}"><div class="stage">${body}</div></body></html>`

const sprite = (g, size) => draw(g, { size })

// The Fibonacci tiling in a 13 × 8 rectangle: squares of 8, 5, 3, 2, 1 and 1.
const TILES = [
  { s: 8, x: 0, y: 0 },
  { s: 5, x: 8, y: 0 },
  { s: 3, x: 10, y: 5 },
  { s: 2, x: 8, y: 6 },
  { s: 1, x: 8, y: 5 },
  { s: 1, x: 9, y: 5 },
]
const TILING_SPIRAL =
  "M0 8A8 8 0 0 1 8 0A5 5 0 0 1 13 5A3 3 0 0 1 10 8A2 2 0 0 1 8 6A1 1 0 0 1 9 5A1 1 0 0 1 10 6"

function phyllotaxis({ n, c, cx, cy, dot }) {
  const GA = Math.PI * (3 - Math.sqrt(5))
  let rects = ""
  for (let i = 1; i <= n; i++) {
    const r = c * Math.sqrt(i),
      a = i * GA
    const x = Math.round((cx + r * Math.cos(a)) / dot) * dot,
      y = Math.round((cy + r * Math.sin(a)) / dot) * dot
    rects += `<rect x="${x}" y="${y}" width="${dot}" height="${dot}"/>`
  }
  return rects
}

export const CARDS = [
  {
    id: "01-launch",
    w: 1080,
    h: 1350,
    theme: "light",
    html: () => `
      ${construction(TALL, "right:-144px; bottom:-55px; height:1500px;")}
      <div class="pad">
        <span class="eyebrow">v0.1.0 · first public release</span>
        <h1 class="t233 mark">fibo</h1>
        <span class="mono" style="font-size:34px; color:var(--soft); margin-top:21px;">FEE-boh</span>
        <p class="lede" style="max-width:700px; margin-top:55px;">A library of parts for <b>experimental projects</b> and <b>special components</b> that anyone can use.</p>
      </div>
      <div class="abs" style="left:89px; top:900px;">${draw(fibo(), { size: 13 })}</div>
      <span class="hand abs" style="right:89px; top:521px; transform:rotate(-90deg); transform-origin:right top;">φ = 1.618 · golden ratio</span>
      ${foot(1)}`,
  },
  {
    id: "02-meet-fibo",
    w: 1080,
    h: 1350,
    theme: "dark",
    html: () => `
      <div class="pad">
        <span class="eyebrow">Meet the mascot</span>
        <h1 class="t144">This is fibo.</h1>
        <p class="lede" style="max-width:860px;">A pixel rabbit from a puzzle written in 1202. <b>The sequence started with rabbits</b>, so fibo is one.</p>
      </div>
      <div class="bubble" style="right:89px; top:480px; border-radius:21px 21px 3px 21px;">there were two of us<br>in 1202. it got<br>out of hand.</div>
      <div class="abs" style="left:130px; top:720px;">${draw(fibo(), { size: 21 })}</div>
      ${foot(2)}`,
  },
  {
    id: "03-no-brand-hue",
    w: 1080,
    h: 1350,
    theme: "light",
    html: () => {
      const ramp = [
        ["50", "#fafafa"],
        ["100", "#f5f5f5"],
        ["200", "#e5e5e5"],
        ["300", "#d4d4d4"],
        ["400", "#a3a3a3"],
        ["500", "#737373"],
        ["600", "#525252"],
        ["700", "#404040"],
        ["800", "#262626"],
        ["900", "#171717"],
        ["950", "#0a0a0a"],
      ]
      const status = [
        ["destructive", "#b91c1c"],
        ["success", "#15803d"],
        ["warning", "#b45309"],
        ["info", "#1d4ed8"],
      ]
      return `
      <div class="pad">
        <span class="eyebrow">Principle · achromatic by default</span>
        <h1 class="t144">There is no brand hue.</h1>
        <p class="lede"><b>Primary is a neutral.</b> Color only shows up when it means something.</p>
        <div style="display:grid; grid-template-columns:repeat(11,1fr); margin-top:55px; border:2px solid var(--border); border-radius:21px; overflow:hidden; height:233px;">
          ${ramp.map(([n, c]) => `<div style="background:${c}; display:flex; align-items:flex-end; justify-content:center; padding-bottom:13px; font:500 21px/1 'Geist Mono'; color:${+n >= 500 ? "#fafafa" : "#525252"};">${n}</div>`).join("")}
        </div>
        <div style="display:flex; gap:13px; flex-wrap:wrap; margin-top:34px;">
          ${status.map(([n, c]) => `<span style="display:inline-flex; align-items:center; gap:13px; padding:13px 21px; border:2px solid var(--border); border-radius:89px; background:var(--card); font:500 21px/1 'Geist Mono';"><i style="width:21px; height:21px; border-radius:50%; background:${c};"></i>${n}</span>`).join("")}
        </div>
        <span class="hand" style="margin-top:34px;">the only four colors, and each one means something</span>
      </div>
      ${foot(3)}`
    },
  },
  {
    id: "04-one-name",
    w: 1080,
    h: 1350,
    theme: "light",
    html: () => `
      <div class="pad">
        <span class="eyebrow">Principle · one name on both sides</span>
        <h1 class="t89">Figma and code use the same name.</h1>
        <p class="lede">Figma can't bind opacity to a variable, so <b>the tints get names</b>.</p>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:21px; margin-top:55px;">
          <div style="border:2px solid var(--border); border-radius:21px; background:var(--card); padding:34px;">
            <span class="eyebrow">Figma variable</span>
            <div style="display:flex; align-items:center; gap:13px; margin-top:34px; font:500 34px/1 Geist;"><i style="width:34px; height:34px; border-radius:8px; background:#fde8e8; border:2px solid #f4c7c7;"></i>destructive-subtle</div>
          </div>
          <div style="border-radius:21px; background:var(--ink); color:var(--paper); padding:34px;">
            <span class="eyebrow" style="color:#a3a3a3;">globals.css</span>
            <div class="mono" style="margin-top:34px; font-size:34px; line-height:1;">destructive-subtle</div>
          </div>
        </div>
        <div class="mono" style="margin-top:34px; font-size:21px; color:var(--soft); display:flex; align-items:center; gap:21px;"><s>bg-destructive/10</s><span class="hand">← not this</span></div>
        <div style="margin-top:55px; border-top:2px solid var(--border);">
          ${[
            ["-subtle", "a tinted fill"],
            ["-hover", "the pointer step"],
            ["-ring", "the focus ring"],
          ]
            .map(
              ([n, d]) =>
                `<div style="display:grid; grid-template-columns:233px 1fr; padding:21px 0; border-bottom:2px solid var(--border); font-size:34px;"><span class="mono">${n}</span><span style="color:var(--soft)">${d}</span></div>`
            )
            .join("")}
        </div>
      </div>
      ${foot(5)}`,
  },
  {
    id: "05-install",
    w: 1600,
    h: 900,
    theme: "dark",
    html: () => `
      ${construction(WIDE, "right:-144px; top:-89px; height:1100px;")}
      <div class="pad" style="right:auto; width:987px;">
        <span class="eyebrow">Getting started</span>
        <h1 class="t89">Copy it in. It's yours.</h1>
        <div style="margin-top:55px; border:2px solid var(--border); background:var(--card); border-radius:21px; overflow:hidden;">
          <div style="display:flex; gap:8px; padding:21px; border-bottom:2px solid var(--border);"><i style="width:13px;height:13px;border-radius:50%;background:#404040"></i><i style="width:13px;height:13px;border-radius:50%;background:#404040"></i><i style="width:13px;height:13px;border-radius:50%;background:#404040"></i></div>
          <pre class="mono" style="padding:34px; font-size:34px; line-height:1.6; color:var(--ink); white-space:pre;"><span style="color:var(--soft)">$</span> pnpm dlx shadcn@latest add @fibo/button
<span style="color:var(--soft)">✔ Created components/ui/button.tsx</span></pre>
        </div>
        <p class="lede">Source lands in your project and uses <b>your tokens</b>.</p>
      </div>
      <div class="abs" style="right:144px; bottom:144px;">${draw(fibo(), { size: 13 })}</div>
      ${foot(8)}`,
  },
  {
    id: "06-bruise",
    w: 1080,
    h: 1350,
    theme: "light",
    html: () => `
      ${construction(WIDE, "left:-610px; top:-144px; height:900px; opacity:.8;")}
      <div class="bubble" style="left:144px; top:233px; border:3px solid var(--ink); border-radius:34px 34px 34px 5px; font-size:55px; padding:34px 55px;">careful, i bruise<br>in 8-bit.</div>
      <div class="abs" style="left:320px; top:540px;">${draw(fibo(), { size: 21 })}</div>
      <span class="hand abs" style="right:89px; top:1030px;">← don't poke the rabbit</span>
      <p class="lede abs" style="left:89px; right:89px; top:1110px;">He has a line for every poke, and <b>none of them are polite</b>.</p>
      ${foot(13)}`,
  },
  {
    id: "08-rabbits",
    w: 1080,
    h: 1350,
    theme: "light",
    html: () => {
      const F = [1, 1, 2, 3, 5, 8]
      const rows = F.map((n, i) => {
        const old = i === 0 ? 0 : F[i - 1]
        const bunnies = Array.from({ length: n }, (_, k) =>
          sprite(fibo({ flip: i > 0 && k >= old }), 3)
        ).join("")
        return `<div style="display:grid; grid-template-columns:144px 1fr 55px; align-items:end; gap:21px; height:89px; border-bottom:2px solid var(--border); padding-bottom:8px;">
          <span class="mono" style="font-size:21px; color:var(--soft);">month ${i + 1}</span>
          <span style="display:flex; gap:8px;">${bunnies}</span>
          <span class="mono" style="font-size:34px; text-align:right;">${n}</span>
        </div>`
      }).join("")
      return `
      <div class="pad">
        <span class="eyebrow">Where the sequence came from</span>
        <h1 class="t89">It started with rabbits.</h1>
        <p class="lede">In 1202, Leonardo of Pisa asked how many pairs of rabbits you'd have if <b>every grown pair had a new pair each month</b>. Count them and you get the sequence.</p>
        <div style="margin-top:55px; border-top:2px solid var(--border);">${rows}</div>
        <span class="hand" style="margin-top:21px; align-self:flex-end;">one rabbit = one pair · newborns face left</span>
      </div>
      ${foot(34)}`
    },
  },
  {
    id: "09-golden-angle",
    w: 1080,
    h: 1350,
    theme: "dark",
    html: () => `
      <svg class="abs" style="left:0; top:0;" width="1080" height="1350" aria-hidden="true"><g fill="var(--ink)">${phyllotaxis({ n: 233, c: 18, cx: 740, cy: 920, dot: 8 })}</g></svg>
      <div class="pad">
        <span class="eyebrow">The golden angle</span>
        <h1 class="t233">137.5°</h1>
        <p class="lede" style="max-width:760px;">A sunflower turns each new seed 137.5° from the last. <b>No two seeds ever line up</b>, so the head fills without gaps.</p>
      </div>
      ${foot(55)}`,
  },
  {
    id: "10-scale",
    w: 1080,
    h: 1350,
    theme: "light",
    html: () => {
      const sizes = [13, 21, 34, 55, 89, 144]
      return `
      <div class="pad">
        <span class="eyebrow">Behind the posts</span>
        <h1 class="t89">Every size is on the sequence.</h1>
        <p class="lede">Type, gaps and pixels on these cards are all Fibonacci numbers. <b>Each step is about 1.618 times the last.</b></p>
        <div style="margin-top:55px; display:flex; flex-direction:column; gap:13px;">
          ${sizes.map((s) => `<div style="display:grid; grid-template-columns:89px 1fr; align-items:baseline; gap:21px;"><span class="mono" style="font-size:21px; color:var(--soft);">${s}</span><span style="font-size:${s}px; font-weight:500; letter-spacing:0; line-height:1;">fibo</span></div>`).join("")}
        </div>
        <div style="margin-top:55px; display:flex; align-items:flex-end; gap:21px;">
          ${[8, 13, 21, 34, 55, 89].map((s) => `<div style="display:flex; flex-direction:column; gap:8px; align-items:flex-start;"><i style="display:block; width:${s}px; height:${s}px; background:var(--ink);"></i><span class="mono" style="font-size:21px; color:var(--soft);">${s}</span></div>`).join("")}
          <span class="hand" style="margin-left:21px; align-self:center;">gaps</span>
        </div>
      </div>
      ${foot(89)}`
    },
  },
  {
    id: "avatar",
    w: 800,
    h: 800,
    theme: "light",
    html: () =>
      `<div class="abs" style="inset:0; display:grid; place-items:center;"><div style="width:377px;">${draw(fibo())}</div></div>`,
  },
  {
    id: "banner",
    w: 1500,
    h: 500,
    theme: "light",
    html: () => `
      ${construction(WIDE, "right:-34px; top:-8px; height:520px;")}
      <div class="abs" style="left:89px; top:89px;">
        <h1 class="t144 mark">fibo</h1>
        <p class="lede" style="max-width:610px;">Parts for <b>experimental projects</b> and <b>special components</b>.</p>
      </div>
      <div class="abs" style="left:1060px; top:230px; display:flex; gap:21px; align-items:flex-end;">${draw(fibo(), { size: 7 })}</div>
      <span class="mono abs" style="left:89px; bottom:34px; font-size:21px; color:var(--soft);">fibo.toribryan.com</span>`,
  },
  {
    // The link preview for fibo.toribryan.com, copied to apps/storybook/public/og.png.
    id: "og",
    w: 1200,
    h: 630,
    theme: "light",
    html: () => `
      ${construction(WIDE, "right:-55px; top:-21px; height:672px;")}
      <div class="abs" style="left:89px; top:89px; width:610px;">
        <span class="eyebrow" style="font-family:Geist, sans-serif;">Open source design system</span>
        <h1 class="t144 mark">fibo</h1>
        <p class="lede">Parts for <b>experimental projects</b> and <b>special components</b>, installed as source with one shadcn command.</p>
      </div>
      <div class="abs" style="left:853px; top:233px;">${draw(fibo(), { size: 13 })}</div>
      <span class="abs" style="left:89px; bottom:55px; font-size:21px; color:var(--soft);">fibo.toribryan.com</span>`,
  },
]

export function render(card) {
  DARK = card.theme === "dark"
  return page(card.w, card.h, card.theme, card.html())
}
