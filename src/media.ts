export const photoLimit = 24
const maxBytes = 14 * 1024 * 1024
export async function validateImage(file: File) {
  const ext = file.name.split('.').at(-1)?.toLowerCase()
  const mime =
    ext === 'png'
      ? 'image/png'
      : ext === 'webp'
        ? 'image/webp'
        : ext === 'jpg' || ext === 'jpeg'
          ? 'image/jpeg'
          : null
  if (
    !mime ||
    (file.type &&
      file.type !== mime &&
      file.type !== 'application/octet-stream')
  )
    throw new Error('Escolha imagens JPG, PNG ou WebP.')
  if (file.size > maxBytes) throw new Error('Cada imagem pode ter até 14 MB.')
  const b = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every(
    (byte, i) => b[i] === byte,
  )
  const jpg = b[0] === 255 && b[1] === 216 && b[2] === 255
  const webp =
    new TextDecoder().decode(b.slice(0, 4)) === 'RIFF' &&
    new TextDecoder().decode(b.slice(8, 12)) === 'WEBP'
  if (!(mime === 'image/png' ? png : mime === 'image/jpeg' ? jpg : webp))
    throw new Error(
      'O conteúdo da imagem não corresponde ao formato do arquivo.',
    )
}
export interface Photo {
  id: string
  url: string
  blob: Blob
  caption: string
}
export interface PhotoOptions {
  orientation: 'vertical' | 'horizontal'
  perPage: 1 | 2 | 4
  margin: number
  crop: boolean
  quality: 'standard' | 'high'
}
export function canvas(width: number, height: number) {
  const element = document.createElement('canvas')
  element.width = width
  element.height = height
  return element
}
export function blobOf(
  element: HTMLCanvasElement,
  type = 'image/png',
  quality?: number,
) {
  return new Promise<Blob>((resolve, reject) =>
    element.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error())),
      type,
      quality,
    ),
  )
}
function openImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não foi possível abrir esta imagem.'))
    img.src = url
  })
}
export async function imageFromFile(file: File, limit: number) {
  await validateImage(file)
  const url = URL.createObjectURL(file)
  try {
    const img = await openImage(url)
    if (img.naturalWidth * img.naturalHeight > 48_000_000)
      throw new Error(
        'Esta imagem tem resolução muito alta. Escolha uma versão menor.',
      )
    const ratio = Math.min(
      1,
      limit / Math.max(img.naturalWidth, img.naturalHeight),
    )
    const target = canvas(
      Math.max(1, Math.round(img.naturalWidth * ratio)),
      Math.max(1, Math.round(img.naturalHeight * ratio)),
    )
    const ctx = target.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, target.width, target.height)
    ctx.drawImage(img, 0, 0, target.width, target.height)
    try {
      return await blobOf(target, 'image/jpeg', 0.92)
    } finally {
      target.width = 0
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}
export function fitted(
  sw: number,
  sh: number,
  dw: number,
  dh: number,
  crop: boolean,
) {
  const scale = (crop ? Math.max : Math.min)(dw / sw, dh / sh)
  const width = sw * scale,
    height = sh * scale
  return { x: (dw - width) / 2, y: (dh - height) / 2, width, height }
}
export async function photoCell(
  photo: Photo,
  width: number,
  height: number,
  options: PhotoOptions,
) {
  const img = await openImage(photo.url)
  const scale = options.quality === 'high' ? 2.75 : 1.6
  const target = canvas(
    Math.max(1, Math.round(width * scale)),
    Math.max(1, Math.round(height * scale)),
  )
  const ctx = target.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, target.width, target.height)
  const fit = fitted(
    img.naturalWidth,
    img.naturalHeight,
    target.width,
    target.height,
    options.crop,
  )
  ctx.drawImage(img, fit.x, fit.y, fit.width, fit.height)
  try {
    return new Uint8Array(
      await (
        await blobOf(
          target,
          'image/jpeg',
          options.quality === 'high' ? 0.9 : 0.78,
        )
      ).arrayBuffer(),
    )
  } finally {
    target.width = 0
  }
}
export interface ArtOptions {
  title: string
  body: string
  date: string
  background: string
  foreground: string
  font: string
  model: number
}
export const formats = {
  'Quadrado 1:1': [1080, 1080],
  'Vertical 4:5': [1080, 1350],
  'Stories 9:16': [1080, 1920],
  'Horizontal 16:9': [1920, 1080],
  'A4 para impressão': [1240, 1754],
} as const
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const result: string[] = []
  for (const paragraph of text.split('\n')) {
    let line = ''
    for (const word of paragraph.split(/\s+/)) {
      if (ctx.measureText((line ? line + ' ' : '') + word).width <= width) {
        line += (line ? ' ' : '') + word
        continue
      }
      if (line) result.push(line)
      line = ''
      for (const char of word) {
        if (line && ctx.measureText(line + char).width > width) {
          result.push(line)
          line = ''
        }
        line += char
      }
    }
    result.push(line)
  }
  return result
}
export function drawArt(
  element: HTMLCanvasElement,
  options: ArtOptions,
  image?: HTMLImageElement | null,
  panel = false,
) {
  const ctx = element.getContext('2d')!
  const { width: w, height: h } = element
  const unit = Math.min(w, h)
  const pad = unit * 0.095
  ctx.fillStyle = options.background
  ctx.fillRect(0, 0, w, h)
  ctx.save()
  ctx.globalAlpha = 0.21
  ctx.fillStyle = options.foreground
  const motif = options.model % 3
  if (motif === 0) {
    ctx.beginPath()
    ctx.arc(w - pad, 0, unit * 0.23, 0, 2 * Math.PI)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(pad, h, unit * 0.13, 0, 2 * Math.PI)
    ctx.fill()
  } else if (motif === 1) {
    for (let i = 0; i < 7; i++) {
      ctx.beginPath()
      ctx.arc(
        w - pad - i * unit * 0.045,
        pad * 0.43,
        unit * 0.013,
        0,
        2 * Math.PI,
      )
      ctx.fill()
    }
  } else {
    ctx.fillRect(pad * 0.45, pad * 0.45, w - 2 * pad * 0.45, unit * 0.008)
    ctx.fillRect(pad * 0.45, h - pad * 0.45, w - 2 * pad * 0.45, unit * 0.008)
  }
  ctx.restore()
  ctx.fillStyle = options.foreground
  const headLimit = image ? h * 0.28 : h * 0.39
  function fit(text: string, size: number, maxHeight: number, bold = false) {
    let lines: string[] = []
    for (; size >= 4; size = Math.floor(size * 0.91)) {
      ctx.font = (bold ? '700 ' : '') + size + 'px ' + options.font
      lines = wrap(ctx, text, w - 2 * pad)
      if (lines.length * size * 1.24 <= maxHeight) break
    }
    return { lines, size, font: ctx.font }
  }
  const title = fit(
    options.title || 'Seu título',
    Math.floor(unit * (panel ? 0.105 : 0.093)),
    headLimit,
    true,
  )
  const date = fit(options.date, Math.floor(unit * 0.035), h * 0.075, true)
  const body = fit(
    options.body,
    Math.floor(unit * 0.045),
    image ? h * 0.22 : h * 0.33,
  )
  const gap = unit * 0.025
  const imageH = image ? h * 0.31 : 0
  const total =
    title.lines.length * title.size * 1.24 +
    (options.body ? body.lines.length * body.size * 1.24 + gap : 0) +
    (options.date ? date.lines.length * date.size * 1.24 + gap : 0) +
    (image ? imageH + gap : 0)
  let y = Math.max(pad * 0.5, (h - total) / 2)
  ctx.textBaseline = 'top'
  function draw(block: typeof title) {
    ctx.font = block.font
    for (const line of block.lines) {
      ctx.fillText(line, pad, y)
      y += block.size * 1.24
    }
  }
  draw(title)
  if (options.date) {
    y += gap
    draw(date)
  }
  if (image) {
    y += gap
    const rect = fitted(
      image.naturalWidth,
      image.naturalHeight,
      w - 2 * pad,
      imageH,
      false,
    )
    ctx.drawImage(image, pad + rect.x, y + rect.y, rect.width, rect.height)
    y += imageH
  }
  if (options.body) {
    y += gap
    draw(body)
  }
}
export function tiles(grid: number) {
  const size = { width: 720, height: 1018 },
    overlap = 16
  const stepX = size.width - overlap,
    stepY = size.height - overlap
  return {
    size,
    width: stepX * (grid - 1) + size.width,
    height: stepY * (grid - 1) + size.height,
    positions: Array.from({ length: grid * grid }, (_, index) => ({
      x: (index % grid) * stepX,
      y: Math.floor(index / grid) * stepY,
    })),
  }
}
