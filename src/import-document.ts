export const documentLimit = 12 * 1024 * 1024
export async function readDocument(file: File): Promise<string> {
  if (file.size > documentLimit)
    throw new Error('Escolha um documento de até 12 MB.')
  const ext = file.name.split('.').at(-1)?.toLowerCase()
  if (ext !== 'pdf' && ext !== 'docx')
    throw new Error('Escolha um arquivo Word (.docx) ou PDF.')
  const mime =
    ext === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (
    file.type &&
    file.type !== mime &&
    file.type !== 'application/octet-stream'
  )
    throw new Error('O tipo do arquivo não corresponde ao formato escolhido.')
  const buffer = await file.arrayBuffer()
  const sig = new Uint8Array(buffer, 0, Math.min(8, buffer.byteLength))
  if (ext === 'docx') {
    if (sig[0] === 0xd0 && sig[1] === 0xcf)
      throw new Error(
        'Este documento pode estar protegido ou em um formato antigo. Use um DOCX desbloqueado.',
      )
    if (sig[0] !== 80 || sig[1] !== 75)
      throw new Error('Este arquivo não parece ser um documento Word válido.')
    const bytes = new Uint8Array(buffer)
    validateZip(bytes)
    try {
      const { default: JSZip } = await import('jszip')
      const archive = await JSZip.loadAsync(buffer)
      if (
        !archive.file('word/document.xml') ||
        !archive.file('[Content_Types].xml')
      )
        throw new Error()
      const mammoth = await import('mammoth/mammoth.browser')
      const text = (
        await mammoth.extractRawText({ arrayBuffer: buffer })
      ).value.trim()
      if (text) return text.slice(0, 100000)
    } catch {
      throw new Error(
        'Não foi possível ler o conteúdo deste Word. Tente salvar o arquivo novamente como DOCX.',
      )
    }
    throw new Error('Nenhum texto foi encontrado neste documento Word.')
  }
  if (new TextDecoder().decode(sig.slice(0, 5)) !== '%PDF-')
    throw new Error('Este arquivo não parece ser um PDF válido.')
  const [{ getDocument, GlobalWorkerOptions }, { default: worker }] =
    await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ])
  GlobalWorkerOptions.workerSrc = worker
  const task = getDocument({
    data: buffer,
    isEvalSupported: false,
    disableFontFace: true,
    enableXfa: false,
  })
  let text = ''
  try {
    const pdf = await task.promise
    if (pdf.numPages > 60) throw new Error('page-limit')
    for (let i = 1; i <= pdf.numPages && text.length < 100000; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      text +=
        content.items
          .map((item) =>
            'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '',
          )
          .join('') + '\n\n'
      page.cleanup()
    }
  } catch (e) {
    if (e instanceof Error && e.name === 'PasswordException')
      throw new Error(
        'Este PDF está protegido. Escolha uma cópia desbloqueada.',
      )
    if (e instanceof Error && e.message === 'page-limit')
      throw new Error('Escolha um PDF de até 60 páginas.')
    throw new Error('Não foi possível ler este PDF. Tente abrir outra cópia.')
  } finally {
    await task.destroy()
  }
  if (!text.trim())
    throw new Error(
      'Este PDF não tem texto selecionável. Pode ser um documento digitalizado.',
    )
  return text.trim().slice(0, 100000)
}
function validateZip(bytes: Uint8Array) {
  const invalid = () =>
    new Error(
      'Este Word não pôde ser aberto dentro dos limites de processamento.',
    )
  if (bytes.length < 22) throw invalid()
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let end = bytes.length - 22
  while (
    end >= Math.max(0, bytes.length - 65557) &&
    view.getUint32(end, true) !== 0x06054b50
  )
    end--
  if (
    end < Math.max(0, bytes.length - 65557) ||
    view.getUint16(end + 4, true) !== 0 ||
    view.getUint16(end + 6, true) !== 0
  )
    throw invalid()
  const count = view.getUint16(end + 10, true)
  let offset = view.getUint32(end + 16, true)
  if (count > 1000 || offset + view.getUint32(end + 12, true) > end)
    throw invalid()
  let size = 0
  for (let i = 0; i < count; i++) {
    if (
      offset + 46 > end ||
      view.getUint32(offset, true) !== 0x02014b50 ||
      (view.getUint16(offset + 8, true) & 1) !== 0
    )
      throw invalid()
    size += view.getUint32(offset + 24, true)
    if (size > 40 * 1024 * 1024) throw invalid()
    offset +=
      46 +
      view.getUint16(offset + 28, true) +
      view.getUint16(offset + 30, true) +
      view.getUint16(offset + 32, true)
    if (offset > end) throw invalid()
  }
}
