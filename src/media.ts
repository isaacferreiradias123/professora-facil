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
  perPage: 1 | 2 | 3 | 4
  margin: number
  crop: boolean
  quality: 'standard' | 'high'
  header?: string
  subtitle?: string
  numbering?: boolean
  polaroid?: boolean
  headerColor?: string
}

export function photoCount(value?: string): PhotoOptions['perPage'] {
  if (value === '1') return 1
  if (value === '2') return 2
  if (value === '3') return 3
  return 4
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
  const width = sw * scale
  const height = sh * scale
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
  align?: 'left' | 'center'
  title: string
  body: string
  date: string
  background: string
  foreground: string
  font: string
  model?: number
}

function isDarkHex(hex: string) {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return false
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return Number.isFinite(r + g + b) && (r * 299 + g * 587 + b * 114) / 1000 < 130
}

export const postPalettes = [
  { id: 'jardim', label: 'Jardim', background: '#E8F2EC', foreground: '#1E5643' },
  { id: 'sol', label: 'Sol & Mel', background: '#FFF7DF', foreground: '#5C3C0A' },
  { id: 'pessego', label: 'Pêssego', background: '#FCECE5', foreground: '#743628' },
  { id: 'lavanda', label: 'Lavanda', background: '#EFE8F8', foreground: '#3F2D59' },
  { id: 'ceu', label: 'Céu Claro', background: '#E5F0F6', foreground: '#1B435E' },
  { id: 'lousa', label: 'Lousa', background: '#1B3A30', foreground: '#FAF7EF' },
] as const

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

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function drawPennants(
  ctx: CanvasRenderingContext2D,
  w: number,
  pad: number,
  unit: number,
  accent: string,
) {
  const colors = ['#E67B61', '#F2C14E', '#3E8266', '#9B82C2', '#5A9BC0']
  const count = 7
  const span = w - pad * 0.6
  const step = span / count
  const startX = pad * 0.3
  const topY = unit * 0.03
  ctx.save()
  ctx.strokeStyle = accent
  ctx.globalAlpha = 0.55
  ctx.lineWidth = unit * 0.005
  ctx.beginPath()
  ctx.moveTo(startX, topY)
  ctx.quadraticCurveTo(w / 2, topY + unit * 0.055, startX + span, topY)
  ctx.stroke()
  ctx.globalAlpha = 0.9
  for (let i = 0; i < count; i++) {
    const cx = startX + step * (i + 0.5)
    const t = (i + 0.5) / count
    const sag = 4 * t * (1 - t) * unit * 0.04
    const y0 = topY + sag
    const pw = step * 0.66
    const ph = unit * 0.055
    ctx.fillStyle = colors[i % colors.length]
    ctx.beginPath()
    ctx.moveTo(cx - pw / 2, y0)
    ctx.lineTo(cx + pw / 2, y0)
    ctx.lineTo(cx, y0 + ph)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

export function drawArt(
  element: HTMLCanvasElement,
  options: ArtOptions,
  image?: HTMLImageElement | null,
  panel = false,
  ornament?: HTMLImageElement,
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
    return null
  }

  const comp = options.composition || 'caderno'
  const isNotice = comp === 'aviso'
  const isInvite = comp === 'convite'
  const isMemory = comp === 'memoria'
  const isIllustrated = comp === 'ilustrado'
  const isEditorial = comp === 'editorial'
  const isCard = comp === 'caderno'
  const dark = isDarkHex(options.background)
  const figure = image && !isNotice ? undefined : ornament
  const contentPad = isEditorial ? pad * 1.15 : pad

  if (isInvite) {
    drawPennants(ctx, w, pad, unit, options.foreground)
    ctx.save()
    ctx.fillStyle = dark ? '#244A3D' : '#FFFFFF'
    ctx.globalAlpha = dark ? 0.86 : 0.72
    roundRectPath(ctx, pad * 0.65, pad * 1.15, w - pad * 1.3, h - pad * 1.8, unit * 0.035)
    ctx.fill()
    ctx.restore()
  } else if (isCard) {
    ctx.save()
    ctx.fillStyle = dark ? '#224539' : '#FFFDF8'
    roundRectPath(ctx, pad * 0.55, pad * 0.55, w - pad * 1.1, h - pad * 1.1, unit * 0.04)
    ctx.fill()
    ctx.strokeStyle = options.foreground
    ctx.globalAlpha = 0.25
    ctx.lineWidth = Math.max(2, unit * 0.004)
    roundRectPath(ctx, pad * 0.72, pad * 0.72, w - pad * 1.44, h - pad * 1.44, unit * 0.03)
    ctx.stroke()
    ctx.restore()
  } else if (isNotice) {
    ctx.save()
    ctx.fillStyle = dark ? '#132B23' : options.foreground
    ctx.fillRect(0, 0, w, h * 0.28)
    ctx.fillStyle = dark ? '#23493C' : '#FFFFFF'
    roundRectPath(ctx, pad * 0.6, h * 0.22, w - pad * 1.2, h * 0.71, unit * 0.03)
    ctx.fill()
    ctx.restore()
  } else if (isEditorial) {
    ctx.save()
    ctx.fillStyle = options.foreground
    ctx.fillRect(0, 0, pad * 0.42, h)
    ctx.globalAlpha = 0.14
    ctx.fillRect(pad * 0.42, 0, pad * 0.14, h)
    ctx.restore()
  } else if (isIllustrated) {
    ctx.save()
    ctx.fillStyle = dark ? '#244A3D' : '#FFFFFF'
    ctx.globalAlpha = dark ? 0.86 : 0.78
    roundRectPath(ctx, pad * 0.6, pad * 0.6, w - pad * 1.2, h - pad * 1.2, unit * 0.035)
    ctx.fill()
    ctx.restore()
  } else if (isMemory) {
    ctx.save()
    ctx.fillStyle = dark ? '#244A3D' : '#FFFFFF'
    ctx.globalAlpha = dark ? 0.8 : 0.55
    roundRectPath(ctx, pad * 0.55, pad * 0.55, w - pad * 1.1, h - pad * 1.1, unit * 0.03)
    ctx.fill()
    ctx.restore()
  }

  let figureConsumedHeight = 0
  if (figure) {
    if (isIllustrated && !image) {
      const side = unit * 0.22
      const cx = w / 2
      const cy = pad * 0.9 + side / 2
      ctx.save()
      ctx.fillStyle = dark ? '#2E5B4C' : options.background
      ctx.beginPath()
      ctx.arc(cx, cy, side * 0.62, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      const fit = fitted(
        figure.naturalWidth || 1,
        figure.naturalHeight || 1,
        side,
        side,
        false,
      )
      ctx.drawImage(
        figure,
        cx - side / 2 + fit.x,
        cy - side / 2 + fit.y,
        fit.width,
        fit.height,
      )
      figureConsumedHeight = side + pad * 0.5
    } else if (!isNotice) {
      const side = unit * 0.15
      const fit = fitted(
        figure.naturalWidth || 1,
        figure.naturalHeight || 1,
        side,
        side,
        false,
      )
      const fy = isInvite ? pad * 1.3 : pad * 0.85
      ctx.drawImage(
        figure,
        w - pad - side + fit.x,
        fy + fit.y,
        fit.width,
        fit.height,
      )
    }
  }

  const textWidth = w - contentPad - pad
  const centerAll =
    options.align === 'center' || (!options.align && isIllustrated && !image)
  const fontStack =
    options.font === 'Bricolage Grotesque'
      ? "'Bricolage Grotesque', 'Noto Sans', sans-serif"
      : options.font === 'Noto Sans'
        ? "'Noto Sans', sans-serif"
        : options.font

  function fit(text: string, size: number, maxHeight: number, bold = false, width = textWidth) {
    const minimum = Math.min(size, Math.max(12, Math.ceil(unit * 0.019)))
    while (true) {
      ctx.font = (bold ? '700 ' : '') + size + 'px ' + fontStack
      const lines = wrap(ctx, text, width)
      const overflow = Boolean(text && lines.length * size * 1.24 > maxHeight)
      if (!overflow || size === minimum) return { lines, size, font: ctx.font, overflow }
      size = Math.max(minimum, Math.floor(size * 0.91))
    }
  }

  const headLimit = isNotice ? h * 0.15 : image ? h * 0.19 : h * 0.3
  const figureSide = unit * (isNotice ? 0.14 : 0.15)
  const headingWidth = figure && !isIllustrated ? textWidth - figureSide - unit * 0.035 : textWidth
  const title = fit(
    options.title || 'Seu título',
    Math.floor(unit * (panel ? 0.095 : 0.082)),
    headLimit,
    true,
    headingWidth,
  )
  const date = fit(options.date, Math.floor(unit * 0.032), h * 0.065, true)
  const body = fit(
    options.body,
    Math.floor(unit * 0.042),
    image ? h * 0.18 : h * 0.32,
  )
  const gap = unit * 0.024
  const callout = !panel ? (options.callout?.trim() ?? '') : ''
  const footer = fit(callout, Math.floor(unit * 0.031), h * 0.075, true, textWidth - unit * 0.04)
  const imageH = image ? h * (isMemory ? 0.34 : 0.25) : 0

  const overflow =
    title.overflow ? 'title' : date.overflow ? 'date' : body.overflow ? 'body' : footer.overflow ? 'callout' : null
  const bottomField = callout ? 'callout' : options.body ? 'body' : options.date ? 'date' : 'title'

  if (isNotice) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(pad, h * 0.045, headingWidth, headLimit + h * 0.012)
    ctx.clip()
    ctx.fillStyle = '#FFFFFF'
    ctx.textBaseline = 'top'
    ctx.font = title.font
    let ty = h * 0.055
    for (const line of title.lines) {
      ctx.fillText(line, pad, ty)
      ty += title.size * 1.24
    }
    ctx.restore()
    if (figure) {
      const side = figureSide
      const fitFig = fitted(
        figure.naturalWidth || 1,
        figure.naturalHeight || 1,
        side,
        side,
        false,
      )
      ctx.drawImage(
        figure,
        w - pad - side + fitFig.x,
        h * 0.045 + fitFig.y,
        fitFig.width,
        fitFig.height,
      )
    }
    let y = h * 0.265
    ctx.fillStyle = options.foreground
    if (options.date) {
      ctx.font = date.font
      for (const line of date.lines) {
        ctx.fillText(line, pad, y)
        y += date.size * 1.24
      }
      y += gap
    }
    if (image) {
      const rect = fitted(
        image.naturalWidth,
        image.naturalHeight,
        textWidth,
        imageH,
        Boolean(options.crop),
      )
      ctx.save()
      roundRectPath(ctx, pad, y, textWidth, imageH, unit * 0.02)
      ctx.clip()
      ctx.drawImage(image, pad + rect.x, y + rect.y, rect.width, rect.height)
      ctx.restore()
      y += imageH + gap
    }
    if (options.body) {
      ctx.font = body.font
      for (const line of body.lines) {
        ctx.fillText(line, pad, y)
        y += body.size * 1.24
      }
    }
    if (callout) {
      y += gap * 1.4
      ctx.font = footer.font
      const pillPadX = unit * 0.025
      const maxFooterW = footer.lines.reduce(
        (max, l) => Math.max(max, ctx.measureText(l).width),
        0,
      )
      const pillW = Math.min(textWidth, maxFooterW + pillPadX * 2)
      const pillX = centerAll ? w / 2 - pillW / 2 : contentPad
      ctx.save()
      ctx.fillStyle = dark ? '#132B23' : options.background
      roundRectPath(
        ctx,
        pillX,
        y - gap * 0.35,
        pillW,
        footer.lines.length * footer.size * 1.24 + gap * 0.7,
        unit * 0.02,
      )
      ctx.fill()
      ctx.restore()
      ctx.fillStyle = options.foreground
      ctx.font = footer.font
      for (const line of footer.lines) {
        const lx = centerAll
          ? w / 2 - ctx.measureText(line).width / 2
          : pillX + pillPadX
        ctx.fillText(line, lx, y)
        y += footer.size * 1.24
      }
    }
    return overflow ?? (y > h * 0.91 ? bottomField : null)
  }

  const total =
    figureConsumedHeight +
    title.lines.length * title.size * 1.24 +
    (options.body ? body.lines.length * body.size * 1.24 + gap : 0) +
    (options.date ? date.lines.length * date.size * 1.24 + gap : 0) +
    (image ? imageH + gap : 0) +
    (callout ? footer.lines.length * footer.size * 1.24 + gap * 2 : 0)

  let y = Math.max(
    (isInvite ? pad * 1.45 : pad * 0.95) + figureConsumedHeight,
    (h - total) / 2 + figureConsumedHeight,
  )
  ctx.textBaseline = 'top'
  ctx.fillStyle = options.foreground

  function drawBlock(block: typeof title, centered = false) {
    ctx.font = block.font
    for (const line of block.lines) {
      const lx = centered ? w / 2 - ctx.measureText(line).width / 2 : contentPad
      ctx.fillText(line, lx, y)
      y += block.size * 1.24
    }
  }

  function drawPhoto() {
    if (!image) return
    if (isMemory) {
      const framePad = unit * 0.022
      const fw = textWidth
      const fh = imageH + framePad * 2.1
      ctx.save()
      ctx.fillStyle = dark ? '#2E5B4C' : '#FFFFFF'
      ctx.shadowColor = 'rgba(27, 42, 36, 0.14)'
      ctx.shadowBlur = unit * 0.03
      ctx.shadowOffsetY = unit * 0.012
      ctx.fillRect(contentPad, y, fw, fh)
      ctx.restore()
      ctx.save()
      ctx.fillStyle = '#F2C14E'
      ctx.globalAlpha = 0.65
      ctx.fillRect(w / 2 - unit * 0.09, y - unit * 0.016, unit * 0.18, unit * 0.032)
      ctx.restore()

      const iw = fw - framePad * 2
      const ih = imageH - framePad * 0.4
      const rect = fitted(
        image.naturalWidth,
        image.naturalHeight,
        iw,
        ih,
        Boolean(options.crop),
      )
      ctx.save()
      ctx.beginPath()
      ctx.rect(contentPad + framePad, y + framePad, iw, ih)
      ctx.clip()
      ctx.drawImage(
        image,
        contentPad + framePad + rect.x,
        y + framePad + rect.y,
        rect.width,
        rect.height,
      )
      ctx.restore()
      y += fh + gap
      return
    }
    const rect = fitted(
      image.naturalWidth,
      image.naturalHeight,
      textWidth,
      imageH,
      Boolean(options.crop),
    )
    ctx.save()
    roundRectPath(ctx, contentPad, y, textWidth, imageH, unit * 0.022)
    ctx.clip()
    ctx.drawImage(image, contentPad + rect.x, y + rect.y, rect.width, rect.height)
    ctx.restore()
    y += imageH + gap
  }

  if (isMemory) drawPhoto()
  drawBlock(title, centerAll)
  if (options.date) {
    y += gap * 0.8
    drawBlock(date, centerAll)
  }
  if (!isMemory && image) {
    y += gap
    drawPhoto()
  }
  if (options.body) {
    y += gap
    drawBlock(body, centerAll)
  }
  if (callout) {
    y += gap * 1.5
    ctx.font = footer.font
    const pillPadX = unit * 0.028
    const maxFooterW = footer.lines.reduce(
      (max, l) => Math.max(max, ctx.measureText(l).width),
      0,
    )
    const pillW = Math.min(textWidth, maxFooterW + pillPadX * 2)
    const pillX = centerAll ? w / 2 - pillW / 2 : contentPad
    ctx.save()
    ctx.fillStyle = options.foreground
    ctx.globalAlpha = dark ? 0.2 : 0.14
    roundRectPath(
      ctx,
      pillX,
      y - gap * 0.4,
      pillW,
      footer.lines.length * footer.size * 1.24 + gap * 0.7,
      unit * 0.018,
    )
    ctx.fill()
    ctx.restore()
    for (const line of footer.lines) {
      const lx = centerAll
        ? w / 2 - ctx.measureText(line).width / 2
        : pillX + pillPadX
      ctx.fillText(line, lx, y)
      y += footer.size * 1.24
    }
  }
  return overflow ?? (y > h - pad * 0.8 ? bottomField : null)
}

export function tiles(grid: number, rows = grid) {
  const size = { width: 720, height: 1018 }
  const overlap = 16
  const stepX = size.width - overlap
  const stepY = size.height - overlap
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
