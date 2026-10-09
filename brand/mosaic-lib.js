// fibo mosaic: a sprite scaled up, softened, and sampled into a grid of
// glyph cells. Density picks the glyph; the ground under a cell picks its
// color. Everything is one pass on a canvas.
;(function () {
  const rand = (() => {
    let s = 1618033
    return () => (s = (s * 16807) % 2147483647) / 2147483647
  })()

  // Coverage per cell: lines count fully, fills a little, outside nothing.
  window.coverage = function (
    rows,
    k,
    { line = 1, fill = 0.2, blur = 1, passes = 1 } = {}
  ) {
    const H = rows.length * k,
      W = rows[0].length * k
    let a = Array.from({ length: H }, (_, y) =>
      Array.from({ length: W }, (_, x) => {
        const c = rows[Math.floor(y / k)][Math.floor(x / k)]
        return c === "1" ? line : c === "2" ? fill : 0
      })
    )
    for (let p = 0; p < passes; p++) {
      const b = a.map((r) => r.slice())
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          let s = 0,
            n = 0
          for (let dy = -blur; dy <= blur; dy++)
            for (let dx = -blur; dx <= blur; dx++) {
              const v = a[y + dy]?.[x + dx]
              if (v !== undefined) {
                s += v
                n++
              } else n++
            }
          b[y][x] = s / n
        }
      a = b
    }
    return { a, W, H }
  }

  // Glyphs by density, with a little jitter so edges break up.
  window.glyph = function (ctx, x, y, c, v, jitter = 0.06) {
    v += (rand() - 0.5) * jitter * 2
    if (v > 0.74) {
      const m = Math.round(c * 0.07)
      ctx.fillRect(x + m, y + m, c - 2 * m, c - 2 * m)
    } else if (v > 0.5) {
      const m = Math.round(c * 0.1),
        t = Math.max(2, Math.round(c * 0.2))
      ctx.fillRect(x + m, y + m, c - 2 * m, t)
      ctx.fillRect(x + m, y + c - m - t, c - 2 * m, t)
      ctx.fillRect(x + m, y + m, t, c - 2 * m)
      ctx.fillRect(x + c - m - t, y + m, t, c - 2 * m)
      if (v > 0.64) {
        const d = Math.round(c * 0.2)
        ctx.fillRect(x + (c - d) / 2, y + (c - d) / 2, d, d)
      }
    } else if (v > 0.3) {
      const d = Math.round(c * 0.42)
      ctx.fillRect(
        x + Math.round((c - d) / 2),
        y + Math.round((c - d) / 2),
        d,
        d
      )
    } else if (v > 0.12) {
      const d = Math.max(2, Math.round(c * 0.22))
      ctx.fillRect(
        x + Math.round((c - d) / 2),
        y + Math.round((c - d) / 2),
        d,
        d
      )
    } else if (v > 0.03 && rand() < 0.45) {
      const d = Math.max(2, Math.round(c * 0.14))
      ctx.fillRect(
        x + Math.round((c - d) / 2),
        y + Math.round((c - d) / 2),
        d,
        d
      )
    }
  }

  // Draw a mosaic at (ox, oy). `color(px, py, v)` returns a fill for each cell.
  window.mosaic = function (
    ctx,
    rows,
    { ox, oy, cell, k = 3, color, ...opts }
  ) {
    const { a, W, H } = coverage(rows, k, opts)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const v = a[y][x]
        if (v < 0.03) continue
        const px = ox + x * cell,
          py = oy + y * cell
        const col = color(px + cell / 2, py + cell / 2, v)
        if (typeof col === "object") {
          // Cut out of a photo: a paper tile with the glyph printed on it, so
          // the photo only shows between tiles and at the thinning edges.
          if (v >= 0.3) {
            ctx.fillStyle = col.bg
            ctx.fillRect(px + 1, py + 1, cell - 1, cell - 1)
            ctx.fillStyle = col.fg
          } else ctx.fillStyle = col.bg
        } else ctx.fillStyle = col
        glyph(ctx, px, py, cell, v)
      }
    return { w: W * cell, h: H * cell }
  }

  // Photo helpers: cover-fit into a rect, and sample colors from it.
  window.photoLayer = function (img, rect) {
    const c = document.createElement("canvas")
    c.width = rect.w
    c.height = rect.h
    const g = c.getContext("2d")
    if (rect.scale) {
      // Placed by hand: the image at a fixed scale with its origin at (imgX, imgY) on the page.
      g.drawImage(
        img,
        rect.imgX - rect.x,
        rect.imgY - rect.y,
        img.width * rect.scale,
        img.height * rect.scale
      )
    } else {
      const s =
        Math.max(rect.w / img.width, rect.h / img.height) * (rect.zoom || 1)
      const w = img.width * s,
        h = img.height * s
      g.drawImage(
        img,
        (rect.w - w) * (rect.fx ?? 0.5),
        (rect.h - h) * (rect.fy ?? 0.5),
        w,
        h
      )
    }
    const d = g.getImageData(0, 0, rect.w, rect.h).data
    // A heavily blurred copy for choosing ink or paper, so the choice holds
    // across a region instead of flickering cell to cell.
    const sw = Math.ceil(rect.w / 16),
      sh = Math.ceil(rect.h / 16)
    const sc = document.createElement("canvas")
    sc.width = sw
    sc.height = sh
    const sg = sc.getContext("2d")
    sg.filter = "blur(3px)"
    sg.drawImage(c, 0, 0, sw, sh)
    const sd = sg.getImageData(0, 0, sw, sh).data
    return {
      canvas: c,
      tone(x, y) {
        const lx = Math.floor((x - rect.x) / 16),
          ly = Math.floor((y - rect.y) / 16)
        if (lx < 0 || ly < 0 || lx >= sw || ly >= sh) return null
        const i = (ly * sw + lx) * 4
        return (0.2126 * sd[i] + 0.7152 * sd[i + 1] + 0.0722 * sd[i + 2]) / 255
      },
      at(x, y) {
        const lx = Math.round(x - rect.x),
          ly = Math.round(y - rect.y)
        if (lx < 0 || ly < 0 || lx >= rect.w || ly >= rect.h) return null
        const i = (ly * rect.w + lx) * 4
        return [d[i], d[i + 1], d[i + 2]]
      },
    }
  }
  window.lum = ([r, g, b]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255

  // Film grain over everything.
  window.grain = function (ctx, w, h, amount = 22, alpha = 0.5) {
    const n = ctx.createImageData(w, h)
    for (let i = 0; i < n.data.length; i += 4) {
      const v = 128 + (rand() - 0.5) * 2 * amount
      n.data[i] = n.data[i + 1] = n.data[i + 2] = v
      n.data[i + 3] = 255
    }
    const c = document.createElement("canvas")
    c.width = w
    c.height = h
    c.getContext("2d").putImageData(n, 0, 0)
    ctx.save()
    ctx.globalCompositeOperation = "overlay"
    ctx.globalAlpha = alpha
    ctx.drawImage(c, 0, 0)
    ctx.restore()
  }

  window.loadImage = (src) =>
    new Promise((ok, no) => {
      const i = new Image()
      i.onload = () => ok(i)
      i.onerror = no
      i.src = src
    })
})()
