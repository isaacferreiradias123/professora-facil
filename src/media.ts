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
  thumb?: string
  breakBefore?: boolean
  cropX?: number
  cropY?: number
}
export interface PhotoOptions {
  orientation: 'vertical' | 'horizontal'
  perPage: 1 | 2 | 4
  margin: number
  crop: boolean
  quality: 'standard' | 'high'
  header?: string
  subtitle?: string
  numbering?: boolean
}
export function photoPages(items: Photo[], perPage: number) {
  const pages: Photo[][] = []
  for (const item of items) {
    const last = pages.at(-1)
    if (!last || last.length === perPage || item.breakBefore) pages.push([item])
    else last.push(item)
  }
  return pages
}

export function photoColumns(options: PhotoOptions) {
  return options.perPage === 4 ||
    (options.perPage === 2 && options.orientation === 'horizontal')
    ? 2
    : 1
}

export const a4Points = [595.28, 841.89] as const
export const panelMargin = 23

export function photoLayout(options: PhotoOptions) {
  const [pageWidth, pageHeight] =
    options.orientation === 'vertical' ? a4Points : [a4Points[1], a4Points[0]]
  const cols = photoColumns(options)
  const rows = options.perPage / cols
  const margin = (options.margin * 72) / 25.4
  const gap = 12
  const top = margin + (options.header?.trim() ? 46 : 0)
  const bottom = margin + (options.numbering ? 18 : 0)
  const width = (pageWidth - 2 * margin - (cols - 1) * gap) / cols
  const height = (pageHeight - top - bottom - (rows - 1) * gap) / rows
  return {
    pageWidth,
    pageHeight,
    margin,
    top,
    bottom,
    width,
    height,
    x: (index: number) => margin + (index % cols) * (width + gap),
    y: (index: number) => top + Math.floor(index / cols) * (height + gap),
  }
}

export async function rotatePhoto(url: string) {
  const source = await openImage(url)
  const target = canvas(source.naturalHeight, source.naturalWidth)
  const context = target.getContext('2d')!
  context.translate(target.width, 0)
  context.rotate(Math.PI / 2)
  context.drawImage(source, 0, 0)
  try {
    return await blobOf(target, 'image/jpeg', 0.92)
  } finally {
    target.width = 0
  }
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
export function openImage(url: string) {
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
export async function photoThumbnail(url: string) {
  const image = await openImage(url)
  const scale = Math.min(
    1,
    480 / Math.max(image.naturalWidth, image.naturalHeight),
  )
  const target = canvas(
    Math.max(1, Math.round(image.naturalWidth * scale)),
    Math.max(1, Math.round(image.naturalHeight * scale)),
  )
  try {
    target.getContext('2d')!.drawImage(image, 0, 0, target.width, target.height)
    return await blobOf(target, 'image/jpeg', 0.8)
  } finally {
    target.width = 0
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
  const x = options.crop
    ? ((target.width - fit.width) * (photo.cropX ?? 50)) / 100
    : fit.x
  const y = options.crop
    ? ((target.height - fit.height) * (photo.cropY ?? 50)) / 100
    : fit.y
  ctx.drawImage(img, x, y, fit.width, fit.height)
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
  crop?: boolean
  composition?: string
  callout?: string
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
  figure?: HTMLImageElement,
) {
  const ctx = element.getContext('2d')!
  const { width: w, height: h } = element
  const unit = Math.min(w, h)
  const pad = unit * 0.095
  ctx.fillStyle = options.background
  ctx.fillRect(0, 0, w, h)
  const imageOnly = panel && options.composition === 'imagem'
  if (imageOnly) {
    if (image) {
      const rect = fitted(
        image.naturalWidth,
        image.naturalHeight,
        w,
        h,
        Boolean(options.crop),
      )
      ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height)
    }
    return false
  }
  const memory = !panel && options.composition === 'memoria' && Boolean(image)
  const invite = !panel && options.composition === 'convite'
  const notice = !panel && options.composition === 'aviso'
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
  if (figure) {
    const side = unit * 0.125
    const fit = fitted(
      figure.naturalWidth || 1,
      figure.naturalHeight || 1,
      side,
      side,
      false,
    )
    ctx.drawImage(
      figure,
      w - pad - side + fit.x,
      pad * 0.55 + fit.y,
      fit.width,
      fit.height,
    )
  }
  ctx.fillStyle = options.foreground
  const headLimit = image ? h * 0.22 : h * 0.36
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
    image ? h * 0.18 : h * 0.3,
  )
  const gap = unit * 0.025
  const callout = !panel ? (options.callout?.trim() ?? '') : ''
  const footer = fit(callout, Math.floor(unit * 0.03), h * 0.08, true)
  const imageH = image ? h * (memory ? 0.33 : 0.27) : 0
  const total =
    title.lines.length * title.size * 1.24 +
    (options.body ? body.lines.length * body.size * 1.24 + gap : 0) +
    (options.date ? date.lines.length * date.size * 1.24 + gap : 0) +
    (image ? imageH + gap : 0) +
    (callout ? footer.lines.length * footer.size * 1.24 + gap * 2 : 0)
  let y = Math.max(invite || notice ? pad * 1.12 : pad * 0.75, (h - total) / 2)
  ctx.textBaseline = 'top'
  function draw(block: typeof title) {
    ctx.font = block.font
    for (const line of block.lines) {
      ctx.fillText(line, pad, y)
      y += block.size * 1.24
    }
  }
  function drawPhoto() {
    if (!image) return
    const rect = fitted(
      image.naturalWidth,
      image.naturalHeight,
      w - 2 * pad,
      imageH,
      Boolean(options.crop),
    )
    ctx.save()
    ctx.beginPath()
    ctx.rect(pad, y, w - 2 * pad, imageH)
    ctx.clip()
    ctx.drawImage(image, pad + rect.x, y + rect.y, rect.width, rect.height)
    ctx.restore()
    y += imageH + gap
  }
  if (memory) drawPhoto()
  if (invite || notice) {
    ctx.save()
    ctx.globalAlpha = 0.15
    ctx.fillRect(pad, y - gap * 0.7, w - 2 * pad, gap * 0.24)
    ctx.restore()
  }
  draw(title)
  if (options.date) {
    y += gap
    draw(date)
  }
  if (!memory && image) {
    y += gap
    drawPhoto()
  }
  if (options.body) {
    y += gap
    draw(body)
  }
  if (callout) {
    y += gap * 1.8
    ctx.save()
    ctx.globalAlpha = 0.18
    ctx.fillRect(
      pad,
      y - gap * 0.45,
      w - 2 * pad,
      footer.lines.length * footer.size * 1.24 + gap * 0.65,
    )
    ctx.restore()
    draw(footer)
  }
  return (
    y > h - pad * 0.3 ||
    title.size < unit * 0.033 ||
    Boolean(options.body && body.size < unit * 0.022)
  )
}
export function tiles(grid: number, rows = grid) {
  const size = { width: 720, height: 1018 },
    overlap = 16
  const stepX = size.width - overlap,
    stepY = size.height - overlap
  return {
    size,
    width: stepX * (grid - 1) + size.width,
    height: stepY * (rows - 1) + size.height,
    positions: Array.from({ length: grid * rows }, (_, index) => ({
      x: (index % grid) * stepX,
      y: Math.floor(index / grid) * stepY,
    })),
  }
}
