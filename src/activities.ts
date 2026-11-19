import type { Block } from './model'

export const firstIllustratedActivity = 10

const drawings = new Map<string, Block>()

export function worksheet(
  kind: number,
  monochrome: boolean,
): Block | undefined {
  if (typeof document === 'undefined') return
  const key = kind + ':' + monochrome
  const cached = drawings.get(key)
  if (cached) return cached
  const sheet = document.createElement('canvas')
  sheet.width = 1000
  sheet.height = 440
  const ctx = sheet.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, 1000, 440)
  ctx.lineWidth = 7
  ctx.strokeStyle = '#263630'
  ctx.lineCap = 'round'
  const shape = (form: number, x: number, y: number) => {
    ctx.fillStyle = monochrome
      ? '#fff'
      : ['#e8a38c', '#a7c5a8', '#f3cf7b'][form]
    ctx.beginPath()
    if (form === 0) ctx.arc(x, y, 44, 0, Math.PI * 2)
    if (form === 1) ctx.rect(x - 40, y - 40, 80, 80)
    if (form === 2) {
      ctx.moveTo(x, y - 49)
      ctx.lineTo(x + 48, y + 38)
      ctx.lineTo(x - 48, y + 38)
      ctx.closePath()
    }
    ctx.fill()
    ctx.stroke()
  }
  const labels = [
    'Círculo, quadrado e triângulo à esquerda. Triângulo, círculo e quadrado à direita.',
    'Círculo, quadrado, círculo, quadrado, círculo e um espaço em branco.',
    'Três caminhos tracejados: reto, ondulado e em zigue-zague.',
  ]
  if (kind === 0) {
    for (let row = 0; row < 3; row++) {
      shape(row, 230, 88 + row * 130)
      shape([2, 0, 1][row], 770, 88 + row * 130)
    }
  } else if (kind === 1) {
    for (let index = 0; index < 5; index++)
      shape(index % 2, 120 + index * 150, 210)
    ctx.setLineDash([10, 12])
    ctx.strokeRect(824, 160, 100, 100)
  } else {
    ctx.setLineDash([12, 17])
    for (let row = 0; row < 3; row++) {
      const y = 93 + row * 120
      ctx.beginPath()
      ctx.moveTo(100, y)
      if (row === 0) ctx.lineTo(900, y)
      if (row === 1)
        for (let x = 100; x < 900; x += 160)
          ctx.quadraticCurveTo(
            x + 80,
            x % 320 === 100 ? y - 70 : y + 70,
            x + 160,
            y,
          )
      if (row === 2)
        for (let x = 180; x <= 900; x += 80)
          ctx.lineTo(x, x === 900 ? y : y + (x % 160 === 20 ? -38 : 38))
      ctx.stroke()
    }
  }
  const bytes = Uint8Array.from(
    atob(sheet.toDataURL('image/png').split(',')[1]),
    (code) => code.charCodeAt(0),
  )
  const result: Block = {
    kind: 'image',
    bytes,
    mime: 'image/png',
    width: sheet.width,
    height: sheet.height,
    alt: labels[kind],
  }
  sheet.width = 0
  drawings.set(key, result)
  return result
}
