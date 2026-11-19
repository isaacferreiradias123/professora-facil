import type { PDFDocumentProxy } from 'pdfjs-dist'
import { documentLimit, validateZip } from './import-document'

export type AnswerColor = 'ink' | 'blue' | 'green'
export type Position = {
  page: number
  x: number
  y: number
  width?: number
  size?: number
  color?: AnswerColor
}
export type Answer = Position & { text: string }

const wordNs = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

export async function openResponse(file: File) {
  if (file.size > documentLimit) throw Error('Escolha um arquivo de até 12 MB.')
  const data = new Uint8Array(await file.arrayBuffer())
  if (/\.docx$/i.test(file.name) && data[0] === 80 && data[1] === 75) {
    validateZip(data)
    const { default: JSZip } = await import('jszip')
    const archive = await JSZip.loadAsync(data)
    const xml = await archive.file('word/document.xml')?.async('string')
    if (!xml || !archive.file('[Content_Types].xml'))
      throw Error('DOCX inválido.')
    const document = new DOMParser().parseFromString(xml, 'application/xml')
    if (document.querySelector('parsererror'))
      throw Error('Não foi possível ler o Word.')
    const paragraphs = Array.from(
      document.getElementsByTagNameNS(wordNs, 'p'),
    ).flatMap((node) => {
      const text = Array.from(node.getElementsByTagNameNS(wordNs, 't'))
        .map((child) => child.textContent ?? '')
        .join('')
        .trim()
      return text ? [{ node, text }] : []
    })
    if (!paragraphs.length)
      throw Error('Nenhum parágrafo de texto foi encontrado.')
    return { kind: 'word' as const, archive, document, paragraphs }
  }
  if (
    !/\.pdf$/i.test(file.name) ||
    new TextDecoder().decode(data.slice(0, 5)) !== '%PDF-'
  )
    throw Error('Escolha um PDF ou DOCX válido e desbloqueado.')
  const [{ getDocument, GlobalWorkerOptions }, { default: worker }] =
    await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ])
  GlobalWorkerOptions.workerSrc = worker
  const task = getDocument({
    data: data.slice(),
    isEvalSupported: false,
    enableXfa: false,
  })
  try {
    const document = await task.promise
    if (document.numPages > 60) throw Error('Escolha um PDF de até 60 páginas.')
    return { kind: 'pdf' as const, data, document }
  } catch (error) {
    await task.destroy()
    if (error instanceof Error && error.name === 'PasswordException')
      throw Error('Escolha um PDF desbloqueado.')
    throw error
  }
}

export type ResponseDocument = Awaited<ReturnType<typeof openResponse>>

export async function respondedWord(
  source: Extract<ResponseDocument, { kind: 'word' }>,
  answers: Record<number, string>,
) {
  const copy = source.document.cloneNode(true) as Document
  const paragraphs = Array.from(
    copy.getElementsByTagNameNS(wordNs, 'p'),
  ).filter((node) =>
    Array.from(node.getElementsByTagNameNS(wordNs, 't')).some((child) =>
      child.textContent?.trim(),
    ),
  )
  for (const [index, answer] of Object.entries(answers)) {
    if (!answer.trim()) continue
    const anchor = paragraphs[Number(index)]
    if (!anchor) continue
    let last = anchor
    for (const line of answer.trim().split(/\r?\n/)) {
      const paragraph = copy.createElementNS(wordNs, 'w:p')
      const run = copy.createElementNS(wordNs, 'w:r')
      const text = copy.createElementNS(wordNs, 'w:t')
      text.setAttributeNS(
        'http://www.w3.org/XML/1998/namespace',
        'xml:space',
        'preserve',
      )
      text.textContent = line
      run.append(text)
      paragraph.append(run)
      last.after(paragraph)
      last = paragraph
    }
  }
  source.archive.file(
    'word/document.xml',
    new XMLSerializer().serializeToString(copy),
  )
  return source.archive.generateAsync({
    type: 'blob',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  })
}

export async function respondedPdf(
  data: Uint8Array,
  source: PDFDocumentProxy,
  answers: Answer[],
) {
  const [{ PDFDocument, degrees, rgb }, { fonts, printable, wrapText }] =
    await Promise.all([import('pdf-lib'), import('./pdf-core')])
  const document = await PDFDocument.load(data)
  const { regular } = await fonts(document)
  const palette: Record<AnswerColor, ReturnType<typeof rgb>> = {
    ink: rgb(0.11, 0.16, 0.14),
    blue: rgb(0.1, 0.25, 0.56),
    green: rgb(0.12, 0.34, 0.26),
  }
  for (const answer of answers) {
    const original = await source.getPage(answer.page)
    const viewport = original.getViewport({ scale: 1 })
    const left = viewport.width * answer.x
    const top = viewport.height * answer.y
    const max = Math.min(
      viewport.width - left - 12,
      viewport.width * (answer.width ?? 1),
    )
    const size = answer.size ?? 11
    const lineStep = Math.round(size * 1.28)
    if (max < 45)
      throw Error('Escolha um ponto mais à esquerda para a resposta.')
    const lines = wrapText(
      printable(answer.text.trim(), regular),
      max,
      (value) => regular.widthOfTextAtSize(value, size),
    )
    if (top + lines.length * lineStep + 10 > viewport.height)
      throw Error(
        'Falta espaço abaixo de uma resposta. Mova o marcador para cima ou encurte o texto.',
      )
    const color = palette[answer.color ?? 'ink']
    for (const [index, line] of lines.entries()) {
      const [x, y] = viewport.convertToPdfPoint(
        left,
        top + size + index * lineStep,
      )
      document.getPage(answer.page - 1).drawText(line, {
        x,
        y,
        font: regular,
        size,
        rotate: degrees(viewport.rotation),
        color,
      })
    }
  }
  return new Blob([new Uint8Array(await document.save())], {
    type: 'application/pdf',
  })
}

let answerMetrics:
  | Promise<(text: string, width: number, size: number) => string[]>
  | undefined

export async function checkPdfAnswer(source: PDFDocumentProxy, answer: Answer) {
  answerMetrics ??= Promise.all([import('pdf-lib'), import('./pdf-core')])
    .then(async ([{ PDFDocument }, { fonts, printable, wrapText }]) => {
      const { regular } = await fonts(await PDFDocument.create())
      return (text: string, width: number, size: number) =>
        wrapText(printable(text.trim(), regular), width, (line) =>
          regular.widthOfTextAtSize(line, size),
        )
    })
    .catch((error) => {
      answerMetrics = undefined
      throw error
    })
  const viewport = (await source.getPage(answer.page)).getViewport({ scale: 1 })
  const size = answer.size ?? 11
  const lineStep = Math.round(size * 1.28)
  const width = Math.min(
    viewport.width * (1 - answer.x) - 12,
    viewport.width * (answer.width ?? 1),
  )
  if (width < 45)
    throw Error('Mova a resposta para a esquerda ou aumente a largura.')
  const lines = (await answerMetrics)(answer.text, width, size)
  if (
    viewport.height * answer.y + lines.length * lineStep + 10 >
    viewport.height
  )
    throw Error(
      'A resposta não cabe nesse espaço. Mova para cima, aumente a largura ou encurte o texto.',
    )
}
