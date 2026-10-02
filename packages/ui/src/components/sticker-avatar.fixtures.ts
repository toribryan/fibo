/*
 * Images for the Sticker avatar stories, tests and docs, drawn on a canvas so
 * they render the same in every browser and need no network. Kept out of
 * sticker-avatar.tsx so the registry never ships them.
 */

// fibo, the pixel rabbit, from brand/rabbit.js. 1 is line, 2 is fill.
const RABBIT = [
  "01110001110000000000",
  "12221012221000000000",
  "12121012121000000000",
  "12121012121000000000",
  "01221012121000000000",
  "01221112210000000000",
  "00122222221000000000",
  "01222222222100000000",
  "12222222222100000000",
  "12122221222100000000",
  "12122221222111100000",
  "12221122221222210000",
  "01122222112222221000",
  "00122222222212222100",
  "00122222222122222111",
  "00122212221222222121",
  "00122212212222222121",
  "00122212212222222110",
  "01122112112222221000",
  "01111111111111111000",
]

function draw(
  width: number,
  height: number,
  paint: (ctx: CanvasRenderingContext2D) => void
) {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  paint(canvas.getContext("2d")!)
  return canvas.toDataURL("image/png")
}

function memo(make: () => string) {
  let url: string | undefined
  return () => (url ??= make())
}

/** fibo as a transparent cut-out. Draw it with `pixelated`. */
const rabbitSrc = memo(() =>
  draw(20, 20, (ctx) => {
    // Mirrored, so he faces into the page.
    ctx.translate(20, 0)
    ctx.scale(-1, 1)
    RABBIT.forEach((row, y) =>
      [...row].forEach((cell, x) => {
        if (cell === "0") return
        ctx.fillStyle = cell === "1" ? "#171717" : "#f5f5f5"
        ctx.fillRect(x, y, 1, 1)
      })
    )
  })
)

/** A round-shouldered ghost, as a transparent cut-out with padding round it. */
const ghostSrc = memo(() =>
  draw(256, 256, (ctx) => {
    ctx.fillStyle = "#e5e5e5"
    ctx.strokeStyle = "#171717"
    ctx.lineWidth = 10
    ctx.beginPath()
    ctx.moveTo(40, 230)
    ctx.lineTo(40, 120)
    ctx.bezierCurveTo(40, 50, 216, 50, 216, 120)
    ctx.lineTo(216, 230)
    for (let i = 0; i < 4; i++) {
      const x = 216 - i * 44
      ctx.quadraticCurveTo(x - 11, 196, x - 22, 230)
      ctx.quadraticCurveTo(x - 33, 196, x - 44, 230)
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    for (const x of [96, 160]) {
      ctx.fillStyle = "#ffffff"
      ctx.beginPath()
      ctx.ellipse(x, 120, 20, 26, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = "#171717"
      ctx.beginPath()
      ctx.arc(x + 6, 126, 10, 0, Math.PI * 2)
      ctx.fill()
    }
  })
)

/** A photo with its background still on, which becomes a round sticker. */
const photoSrc = memo(() =>
  draw(256, 256, (ctx) => {
    const sky = ctx.createLinearGradient(0, 0, 0, 256)
    sky.addColorStop(0, "#a3a3a3")
    sky.addColorStop(1, "#404040")
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = "#e5e5e5"
    ctx.beginPath()
    ctx.arc(128, 108, 48, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(128, 256, 92, 80, 0, Math.PI, 0)
    ctx.fill()
  })
)

export { rabbitSrc, ghostSrc, photoSrc }
