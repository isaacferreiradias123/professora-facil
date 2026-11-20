import { documentLimit, validateZip } from './import-document'
export const w = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
const xml = 'http://www.w3.org/XML/1998/namespace'
const rel =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
export function parseWord(input: string) {
  if (/<!DOCTYPE/i.test(input))
    throw Error('Este Word contém uma definição XML incompatível.')
  const doc = new DOMParser().parseFromString(input, 'application/xml')
  if (doc.querySelector('parsererror'))
    throw Error('O XML deste documento não pôde ser lido.')
  return doc
}
export const children = (node: Element, kind: string) =>
  Array.from(node.children).filter(
    (child) => child.namespaceURI === w && child.localName === kind,
  )
export const descendants = (node: Document | Element, kind: string) => [
  ...node.getElementsByTagNameNS(w, kind),
]
export const property = (node: Element | undefined, name = 'val') =>
  node?.getAttributeNS(w, name) ?? ''
export const paragraphText = (node: Element) =>
  descendants(node, 't')
    .map((t) => t.textContent ?? '')
    .join('')
export function inlineEditAllowed(node: Element) {
  return Array.from(node.children).every(
    (child) =>
      child.namespaceURI === w &&
      (['pPr', 'bookmarkStart', 'bookmarkEnd', 'proofErr', 'noProof'].includes(
        child.localName,
      ) ||
        (child.localName === 'r' &&
          Array.from(child.children).every(
            (part) =>
              part.namespaceURI === w &&
              ['rPr', 't', 'br', 'tab', 'noBreakHyphen', 'lastRenderedPageBreak'].includes(
                part.localName,
              ),
          ))),
  )
}
export function replaceParagraphText(node: Element, next: string) {
  const previous = paragraphText(node)
  if (previous === next || !inlineEditAllowed(node)) return
  const pieces = descendants(node, 't')
  if (!pieces.length) {
    insertText(node, next)
    return
  }
  let first = 0
  while (
    first < Math.min(previous.length, next.length) &&
    previous[first] === next[first]
  )
    first++
  let tail = 0
  while (
    tail < Math.min(previous.length, next.length) - first &&
    previous[previous.length - 1 - tail] === next[next.length - 1 - tail]
  )
    tail++
  const end = previous.length - tail
  const added = next.slice(first, next.length - tail)
  let offset = 0
  let written = false
  pieces.forEach((piece, index) => {
    const value = piece.textContent ?? ''
    const limit = offset + value.length
    const insertion = !written && (first < limit || index === pieces.length - 1)
    if (insertion || (first < limit && end > offset)) {
      piece.textContent =
        value.slice(0, Math.max(0, first - offset)) +
        (insertion ? added : '') +
        value.slice(Math.max(0, end - offset))
      piece.setAttributeNS(xml, 'xml:space', 'preserve')
      if (insertion) written = true
    }
    offset = limit
  })
}
function insertText(node: Element, text: string) {
  const run = node.ownerDocument.createElementNS(w, 'w:r')
  const part = node.ownerDocument.createElementNS(w, 'w:t')
  part.setAttributeNS(xml, 'xml:space', 'preserve')
  part.textContent = text
  run.append(part)
  node.append(run)
}
export function insertParagraph(anchor: Element, text = '') {
  const next = anchor.ownerDocument.createElementNS(w, 'w:p')
  insertText(next, text)
  anchor.after(next)
}
export function appendParagraphAtEnd(doc: Document, text = '') {
  const body = descendants(doc, 'body')[0]
  if (!body) return
  const next = doc.createElementNS(w, 'w:p')
  insertText(next, text)
  const sect = children(body, 'sectPr')[0]
  if (sect) sect.before(next)
  else body.append(next)
}
export function insertSchoolHeader(
  doc: Document,
  info: { school?: string; teacher?: string; classroom?: string; date?: string },
) {
  const body = descendants(doc, 'body')[0]
  if (!body) return
  const lines = [
    [info.school?.trim() || 'Atividade Escolar', info.classroom?.trim(), info.date?.trim()]
      .filter(Boolean)
      .join(' · '),
    [
      info.teacher?.trim() ? 'Professora: ' + info.teacher.trim() : '',
      'Aluno(a): ____________________________________',
    ]
      .filter(Boolean)
      .join('   '),
  ]
  const firstNode = body.firstElementChild
  for (const line of lines.reverse()) {
    const p = doc.createElementNS(w, 'w:p')
    const run = doc.createElementNS(w, 'w:r')
    const rPr = doc.createElementNS(w, 'w:rPr')
    const bold = doc.createElementNS(w, 'w:b')
    rPr.append(bold)
    const t = doc.createElementNS(w, 'w:t')
    t.setAttributeNS(xml, 'xml:space', 'preserve')
    t.textContent = line
    run.append(rPr, t)
    p.append(run)
    if (firstNode) firstNode.before(p)
    else body.append(p)
  }
}
export async function openWord(file: File) {
  if (!/\.docx$/i.test(file.name) || file.size > documentLimit)
    throw Error('Escolha um DOCX desbloqueado de até 12 MB.')
  const data = new Uint8Array(await file.arrayBuffer())
  if (data[0] === 0xd0 && data[1] === 0xcf)
    throw Error('O Word está protegido ou usa um formato antigo.')
  validateZip(data)
  const { default: JSZip } = await import('jszip')
  const archive = await JSZip.loadAsync(data)
  const body = await archive.file('word/document.xml')?.async('string')
  if (
    !body ||
    !archive.file('[Content_Types].xml') ||
    archive.file('word/vbaProject.bin')
  )
    throw Error('Escolha um DOCX comum, sem macros.')
  const document = parseWord(body)
  if (!descendants(document, 'body').length)
    throw Error('Corpo do documento incompatível.')
  const settings = await archive.file('word/settings.xml')?.async('string')
  if (
    settings &&
    descendants(parseWord(settings), 'documentProtection').some((node) =>
      ['1', 'true', 'on'].includes(property(node, 'enforcement')),
    )
  )
    throw Error('O documento tem restrições de edição.')
  const styles = await archive.file('word/styles.xml')?.async('string')
  const relations = await archive
    .file('word/_rels/document.xml.rels')
    ?.async('string')
  const relationDocument = relations ? parseWord(relations) : undefined
  const parts: Record<string, string> = {}
  for (const relationship of Array.from(
    relationDocument?.documentElement.children ?? [],
  )) {
    const target = relationship.getAttribute('Target') ?? ''
    const type = relationship.getAttribute('Type') ?? ''
    if (
      !/^(header|footer)[\w.-]*\.xml$/.test(target) ||
      !/\/(header|footer)$/.test(type) ||
      relationship.getAttribute('TargetMode') === 'External'
    )
      continue
    const content = await archive.file('word/' + target)?.async('string')
    if (content) parts[target] = content
  }
  return {
    archive,
    data,
    body,
    parts,
    styles: styles ? parseWord(styles) : undefined,
    relations: relationDocument,
  }
}
export type WordSource = Awaited<ReturnType<typeof openWord>>
export async function embeddedPictures(source: WordSource) {
  const urls: Record<string, string> = {}
  try {
    for (const item of Array.from(
      source.relations?.documentElement.children ?? [],
    )) {
      const target = item.getAttribute('Target') ?? ''
      const id = item.getAttribute('Id')
      const type = /^media\/[^/\\]+\.(png|jpe?g|gif|webp)$/i
        .exec(target)?.[1]
        ?.toLowerCase()
      if (!id || !type || item.getAttribute('TargetMode') === 'External')
        continue
      const image = source.archive.file('word/' + target)
      if (image)
        urls[id] = URL.createObjectURL(
          new Blob([await image.async('arraybuffer')], {
            type: 'image/' + (type === 'jpg' ? 'jpeg' : type),
          }),
        )
    }
    return urls
  } catch (error) {
    Object.values(urls).forEach((url) => URL.revokeObjectURL(url))
    throw error
  }
}
export const pictureId = (node: Element) =>
  node.getAttributeNS(rel, 'embed') ?? ''
export function resizeInlinePicture(drawing: Element, percentage: number) {
  const wordDrawing =
    'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'
  const shape = 'http://schemas.openxmlformats.org/drawingml/2006/main'
  const inline = drawing.getElementsByTagNameNS(wordDrawing, 'inline')
  const outer = drawing.getElementsByTagNameNS(wordDrawing, 'extent')
  const inner = Array.from(drawing.getElementsByTagNameNS(shape, 'ext')).filter(
    (node) => node.parentElement?.localName === 'xfrm',
  )
  if (inline.length !== 1 || outer.length !== 1 || inner.length !== 1)
    return false
  if (percentage === 100) return true
  for (const element of [outer[0], inner[0]]) {
    for (const dimension of ['cx', 'cy']) {
      const size = Number(element.getAttribute(dimension))
      if (size > 0)
        element.setAttribute(
          dimension,
          String(Math.max(1, Math.round((size * percentage) / 100))),
        )
    }
  }
  return true
}
export function simpleRows(table: Element) {
  const rows = children(table, 'tr')
  const count = rows[0] ? children(rows[0], 'tc').length : 0
  return (
    count > 0 &&
    ![
      'gridSpan',
      'vMerge',
      'hMerge',
      'tbl',
      'drawing',
      'fldSimple',
      'fldChar',
      'sdt',
      'bookmarkStart',
      'commentRangeStart',
      'ins',
      'del',
    ].some((kind) => descendants(table, kind).length) &&
    rows.every(
      (row) =>
        children(row, 'tc').length === count &&
        children(row, 'tc').every((cell) =>
          Array.from(cell.children).every(
            (child) =>
              child.localName === 'tcPr' ||
              (child.localName === 'p' && inlineEditAllowed(child)),
          ),
        ),
    )
  )
}
export function changeWordRow(table: Element, rowIndex: number, add: boolean) {
  if (!simpleRows(table)) return
  const rows = children(table, 'tr')
  const row = rows[rowIndex]
  if (!row) return
  if (!add) {
    if (rows.length > 1) row.remove()
    return
  }
  const copy = row.cloneNode(true) as Element
  for (const header of descendants(copy, 'tblHeader')) header.remove()
  for (const paragraph of descendants(copy, 'p'))
    replaceParagraphText(paragraph, '')
  row.after(copy)
}
export async function saveWord(
  source: WordSource,
  body: string,
  parts: Record<string, string>,
) {
  const { default: JSZip } = await import('jszip')
  const archive = await JSZip.loadAsync(source.data)
  if (body !== source.body) archive.file('word/document.xml', body)
  for (const [name, data] of Object.entries(parts))
    if (data !== source.parts[name]) archive.file('word/' + name, data)
  return archive.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}
