// Pixel texture and dither, sampled from a photo's own light. Both read the
// photo through a tone curve stretched to the region's own range, so a dim
// photo and a bright one both give a full spread of marks.
;(function () {
  const BAYER = [
    [0, 32, 8, 40, 2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21],
  ]

  function range(ph, r, step) {
    const ls = []
    for (let y = r.y; y < r.y + r.h; y += step)
      for (let x = r.x; x < r.x + r.w; x += step) {
        const c = ph.at(x, y)
        if (c) ls.push(lum(c))
      }
    ls.sort((a, b) => a - b)
    return [
      ls[Math.floor(ls.length * 0.04)] ?? 0,
      ls[Math.floor(ls.length * 0.96)] ?? 1,
    ]
  }
  const density = (ph, x, y, lo, hi) => {
    const c = ph.at(x, y)
    if (!c) return 0
    return Math.max(0, Math.min(1, (hi - lum(c)) / Math.max(0.05, hi - lo)))
  }

  // Glyph cells on paper: darker light, denser glyph.
  window.pixelTexture = function (
    ctx,
    ph,
    r,
    { cell = 13, ink = "#0a0a0a", paper = "#f3f3f1", keep = () => true } = {}
  ) {
    const [lo, hi] = range(ph, r, cell)
    for (let y = r.y; y < r.y + r.h - cell + 1; y += cell)
      for (let x = r.x; x < r.x + r.w - cell + 1; x += cell) {
        if (!keep(x + cell / 2, y + cell / 2)) continue
        ctx.fillStyle = paper
        ctx.fillRect(x, y, cell, cell)
        ctx.fillStyle = ink
        glyph(
          ctx,
          x,
          y,
          cell,
          density(ph, x + cell / 2, y + cell / 2, lo, hi) * 0.95
        )
      }
  }
  // 1-bit ordered dither on paper.
  window.dither = function (
    ctx,
    ph,
    r,
    { cell = 4, ink = "#0a0a0a", paper = "#f3f3f1", keep = () => true } = {}
  ) {
    const [lo, hi] = range(ph, r, cell * 2)
    for (let y = r.y; y < r.y + r.h; y += cell)
      for (let x = r.x; x < r.x + r.w; x += cell) {
        if (!keep(x + cell / 2, y + cell / 2)) continue
        ctx.fillStyle = paper
        ctx.fillRect(x, y, cell, cell)
        const t =
          (BAYER[(((y - r.y) / cell) % 8) | 0][(((x - r.x) / cell) % 8) | 0] +
            0.5) /
          64
        if (density(ph, x + cell / 2, y + cell / 2, lo, hi) > t) {
          ctx.fillStyle = ink
          ctx.fillRect(x, y, cell - 1, cell - 1)
        }
      }
  }
  // Draw a photo layer with a dreamy grade: softer, paler, a little bloom.
  window.dreamy = function (ctx, ph, r) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(r.x, r.y, r.w, r.h)
    ctx.clip()
    ctx.filter = "saturate(0.72) contrast(0.86) brightness(1.06) sepia(0.12)"
    ctx.drawImage(ph.canvas, r.x, r.y)
    ctx.globalAlpha = 0.28
    ctx.globalCompositeOperation = "screen"
    ctx.filter = "blur(14px) brightness(1.1)"
    ctx.drawImage(ph.canvas, r.x, r.y)
    ctx.restore()
  }
  // The graded photo as its own canvas, so blocks can take its color.
  window.graded = function (ph, r) {
    const c = document.createElement("canvas")
    c.width = r.w
    c.height = r.h
    const g = c.getContext("2d")
    g.filter = "saturate(0.72) contrast(0.86) brightness(1.06) sepia(0.12)"
    g.drawImage(ph.canvas, 0, 0)
    return c
  }
  // Average color per s×s block, from a smoothed downscale.
  window.blockMap = function (src, s) {
    const w = Math.ceil(src.width / s),
      h = Math.ceil(src.height / s)
    const c = document.createElement("canvas")
    c.width = w
    c.height = h
    const g = c.getContext("2d")
    g.imageSmoothingQuality = "high"
    g.drawImage(src, 0, 0, w, h)
    const d = g.getImageData(0, 0, w, h).data
    return (bx, by) => {
      const i = (Math.min(h - 1, by) * w + Math.min(w - 1, bx)) * 4
      return [d[i], d[i + 1], d[i + 2]]
    }
  }
  // A sprite drawn plainly, pixel for pixel: 1 ink, 2 paper.
  window.sprite = function (
    ctx,
    rows,
    x,
    y,
    s,
    ink = "#0a0a0a",
    paper = "#f3f3f1"
  ) {
    rows.forEach((r, j) =>
      [...r].forEach((c, i) => {
        if (c === "0") return
        ctx.fillStyle = c === "1" ? ink : paper
        ctx.fillRect(x + i * s, y + j * s, s, s)
      })
    )
  }
})()
