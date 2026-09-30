// The fibo logo: the pixel rabbit standing on the baseline of the wordmark,
// set in Geist Medium at its own spacing.
// The wordmark in Geist. Its ascender (the top of f and b) is the rabbit's
// height divided by 1.618; the size is found by measuring the letters.
window.geistMark = function (
  ctx,
  x,
  y,
  h,
  weight = 500,
  ink = "#0a0a0a",
  track = 0
) {
  ctx.save()
  ctx.font = `${weight} 100px Geist`
  const m = ctx.measureText("fb")
  const size = (h / m.actualBoundingBoxAscent) * 100
  ctx.font = `${weight} ${size}px Geist`
  ctx.textBaseline = "alphabetic"
  ctx.fillStyle = ink
  ctx.letterSpacing = `${track * size}px`
  ctx.fillText("fibo", x, y)
  const w = ctx.measureText("fibo").width
  ctx.restore()
  return w
}
window.geistLockup = function (
  ctx,
  x,
  y,
  s,
  weight = 500,
  ink = "#0a0a0a",
  paper = "#f3f3f1"
) {
  const rows = RABBIT
  rows.forEach((r, j) =>
    [...r].forEach((c, i) => {
      if (c === "0") return
      ctx.fillStyle = c === "1" ? ink : paper
      ctx.fillRect(x + i * s, y - (rows.length - j) * s, s, s)
    })
  )
  const h = (rows.length * s) / 1.618
  return (
    rows[0].length * s +
    5 * s +
    geistMark(ctx, x + (rows[0].length + 5) * s, y, h, weight, ink)
  )
}
