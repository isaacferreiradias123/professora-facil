import { useEffect, useRef, useState } from 'react'
import { Link, useBlocker, useSearchParams } from 'react-router-dom'
import { FileDrop } from './editor-ui'
import { download, filename } from './workflow'
import {
  openResponse,
  checkPdfAnswer,
  respondedPdf,
  respondedWord,
  type Answer,
  type Position,
  type ResponseDocument,
} from './document-response'

type PdfSource = Extract<ResponseDocument, { kind: 'pdf' }>
function PdfAnswerSheet({
  source,
  page,
  point,
  zoom,
  answers,
  select,
  onError,
}: {
  source: PdfSource
  page: number
  point: Position | null
  zoom: number
  answers: Answer[]
  select: (point: Position) => void
  onError: (message: string) => void
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [layout, setLayout] = useState({ width: 595, height: 842 })
  useEffect(() => {
    let active = true
    let cancel: (() => void) | undefined
    void source.document
      .getPage(page)
      .then((original) => {
        if (!active || !canvas.current) return
        const viewport = original.getViewport({ scale: 1 })
        const raster = original.getViewport({
          scale: Math.min(2, 1500 / Math.max(viewport.width, viewport.height)),
        })
        const target = canvas.current
        setLayout({ width: viewport.width, height: viewport.height })
        target.width = Math.ceil(raster.width)
        target.height = Math.ceil(raster.height)
        const render = original.render({ canvas: target, viewport: raster })
        cancel = () => render.cancel()
        return render.promise
      })
      .catch(() => {
        if (active) onError('Não foi possível visualizar esta página.')
      })
    return () => {
      active = false
      cancel?.()
    }
  }, [source, page, onError])
  const positions = answers.filter((answer) => answer.page === page)
  return (
    <div
      className="answer-pdf-scroll"
      tabIndex={zoom > 100 ? 0 : undefined}
      aria-label={zoom > 100 ? 'Página ampliada' : ''}
    >
      <div
        className="answer-pdf-sheet"
        style={{
          aspectRatio: layout.width + '/' + layout.height,
          width: zoom + '%',
          maxWidth: zoom === 100 ? undefined : 'none',
        }}
      >
        <canvas
          ref={canvas}
          aria-label={'Imagem da folha ' + page}
          role="img"
        />
        <button
          className="answer-pick-page"
          type="button"
          aria-label={'Escolher posição na folha ' + page}
          onClick={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect()
            select({
              page,
              x: event.detail
                ? (event.clientX - bounds.left) / bounds.width
                : 0.12,
              y: event.detail
                ? (event.clientY - bounds.top) / bounds.height
                : 0.25,
            })
          }}
        />
        {positions.map((answer, index) => (
          <button
            className="answer-pdf-text"
            key={index}
            type="button"
            style={{
              left: answer.x * 100 + '%',
              top: answer.y * 100 + '%',
              width:
                Math.min(
                  (answer.width ?? 1) * 100,
                  100 - answer.x * 100 - 1200 / layout.width,
                ) + '%',
              fontSize: 1100 / layout.width + 'cqw',
            }}
            aria-label={'Selecionar resposta: ' + answer.text}
            onClick={() => select(answer)}
          >
            {answer.text}
          </button>
        ))}
        {point?.page === page && (
          <span
            className="answer-marker"
            aria-hidden="true"
            style={{
              left: point.x * 100 + '%',
              top: point.y * 100 + '%',
              width:
                Math.min(
                  (point.width ?? 1) * 100,
                  100 - point.x * 100 - 1200 / layout.width,
                ) + '%',
            }}
          />
        )}
      </div>
    </div>
  )
}

export default function DocumentResponse() {
  const [params] = useSearchParams()
  const pdfOnly = params.get('tipo') === 'pdf'
  const [source, setSource] = useState<ResponseDocument | null>(null)
  const [fileName, setFileName] = useState('')
  const [page, setPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [point, setPoint] = useState<Position | null>(null)
  const [anchor, setAnchor] = useState<Position | null>(null)
  const [dirty, setDirty] = useState(false)
  const blocker = useBlocker(dirty)
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    if (window.confirm('Sair sem baixar as respostas desta sessão?'))
      blocker.proceed()
    else blocker.reset()
  }, [blocker])
  const [paragraph, setParagraph] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [pdfAnswers, setPdfAnswers] = useState<Answer[]>([])
  const [wordAnswers, setWordAnswers] = useState<Record<number, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const response = useRef<HTMLTextAreaElement>(null)
  useEffect(
    () => () => {
      if (source?.kind === 'pdf') void source.document.destroy()
    },
    [source],
  )
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  function selectPoint(next: Position) {
    if (
      pending &&
      !window.confirm(
        'Trocar a posição e descartar o texto ainda não inserido?',
      )
    )
      return
    setAnchor(
      pdfAnswers.some((answer) => samePoint(answer, next)) ? next : null,
    )
    setPoint({
      ...next,
      x: Math.max(0.02, Math.min(0.87, next.x)),
      y: Math.max(0.02, Math.min(0.93, next.y)),
    })
    setText(pdfAnswers.find((answer) => samePoint(answer, next))?.text ?? '')
    setStatus('Posição selecionada na folha ' + next.page + '.')
  }
  async function read(file?: File) {
    if (!file || busy) return
    if (pdfOnly && !/\.pdf$/i.test(file.name)) {
      setError('Escolha um arquivo PDF para responder na página.')
      return
    }
    if (
      dirty &&
      !window.confirm(
        'Abrir outro arquivo e descartar as respostas desta sessão?',
      )
    )
      return
    setBusy(true)
    setError('')
    setStatus('Abrindo documento…')
    try {
      const next = await openResponse(file)
      setSource(next)
      setFileName(file.name)
      setPage(1)
      setPoint(null)
      setParagraph(null)
      setText('')
      setPdfAnswers([])
      setWordAnswers({})
      setAnchor(null)
      setDirty(false)
      setStatus('Documento pronto para responder.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível abrir o documento.',
      )
      setStatus('')
    } finally {
      setBusy(false)
    }
  }
  async function apply() {
    setError('')
    if (!text.trim()) return
    if (source?.kind === 'word' && paragraph !== null)
      setWordAnswers({ ...wordAnswers, [paragraph]: text.trim() })
    else if (point && source?.kind === 'pdf') {
      setBusy(true)
      try {
        await checkPdfAnswer(source.document, { ...point, text })
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Não foi possível medir a resposta.',
        )
        return
      } finally {
        setBusy(false)
      }
      setPdfAnswers([
        ...pdfAnswers.filter((answer) => !samePoint(answer, anchor ?? point)),
        { ...point, text: text.trim() },
      ])
      setAnchor(point)
    }
    setDirty(true)
    setStatus('Resposta inserida na prévia.')
  }
  function remove() {
    if (source?.kind === 'word' && paragraph !== null) {
      const next = { ...wordAnswers }
      delete next[paragraph]
      setWordAnswers(next)
    } else if (point)
      setPdfAnswers(
        pdfAnswers.filter((answer) => !samePoint(answer, anchor ?? point)),
      )
    setAnchor(null)
    setText('')
    setDirty(true)
    setStatus('Resposta removida.')
  }
  const saved =
    source?.kind === 'pdf' ? pdfAnswers.length : Object.keys(wordAnswers).length
  const current =
    source?.kind === 'pdf'
      ? point &&
        pdfAnswers.find((answer) => samePoint(answer, anchor ?? point))?.text
      : paragraph === null
        ? ''
        : wordAnswers[paragraph]
  const pending =
    (source?.kind === 'pdf' ? Boolean(point) : paragraph !== null) &&
    (text.trim() !== (current ?? '') ||
      Boolean(
        anchor &&
        point &&
        (!samePoint(anchor, point) || anchor.width !== point.width),
      )) &&
    Boolean(text.trim())
  async function save() {
    if (!source || !saved || pending || busy) return
    setError('')
    setBusy(true)
    try {
      const output =
        source.kind === 'pdf'
          ? await respondedPdf(source.data, source.document, pdfAnswers)
          : await respondedWord(source, wordAnswers)
      download(
        output,
        filename(fileName.replace(/\.[^.]+$/, '')) +
          '-respondido.' +
          (source.kind === 'pdf' ? 'pdf' : 'docx'),
      )
      setDirty(false)
      setStatus('Cópia respondida preparada para baixar.')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível baixar a cópia.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="response-editor">
      <Link to="/app/colecao?ferramenta=documento">Voltar aos documentos</Link>
      <h1>{pdfOnly ? 'Responder no PDF' : 'Responder no documento'}</h1>
      <p>
        {pdfOnly
          ? 'Abra um PDF e marque o ponto da página onde cada resposta começa.'
          : 'Abra um PDF ou Word para inserir respostas em uma cópia.'}
      </p>
      <FileDrop
        label="Selecionar arquivo para responder"
        instructions={
          (pdfOnly ? 'PDF' : 'PDF ou DOCX') +
          ' desbloqueado, até 12 MB. O arquivo fica no navegador.'
        }
        accept={pdfOnly ? '.pdf' : '.pdf,.docx'}
        disabled={busy}
        onFiles={([file]) => void read(file)}
      />
      <p role="status">{status}</p>
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      {source && (
        <div className="response-columns">
          <section aria-label="Documento para responder">
            <h2>{fileName}</h2>
            {source.kind === 'pdf' ? (
              <>
                <p>
                  Toque no espaço da pergunta para marcar onde a resposta
                  começa.
                </p>
                <label>
                  Folha do PDF{' '}
                  <select
                    value={page}
                    onChange={(event) => {
                      if (
                        pending &&
                        !window.confirm(
                          'Trocar de folha e descartar o texto ainda não inserido?',
                        )
                      )
                        return
                      setPage(Number(event.target.value))
                      setPoint(null)
                      setAnchor(null)
                      setText('')
                    }}
                  >
                    {Array.from(
                      { length: source.document.numPages },
                      (_, index) => (
                        <option key={index} value={index + 1}>
                          {index + 1}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label>
                  Zoom da página
                  <select
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                  >
                    <option value="100">Ajustar à tela</option>
                    <option value="150">150%</option>
                    <option value="200">200%</option>
                  </select>
                </label>
                <PdfAnswerSheet
                  zoom={zoom}
                  source={source}
                  page={page}
                  point={point}
                  answers={pdfAnswers}
                  select={selectPoint}
                  onError={setError}
                />
              </>
            ) : (
              <>
                <p>
                  Escolha o parágrafo da pergunta. A resposta entra logo abaixo.
                  Esta leitura simplificada mostra a ordem dos textos.
                </p>
                <div className="answer-word-page">
                  {source.paragraphs.map((item, index) => (
                    <div key={index}>
                      <button
                        className="secondary"
                        type="button"
                        aria-pressed={paragraph === index}
                        onClick={() => {
                          if (
                            pending &&
                            !window.confirm(
                              'Trocar de parágrafo e descartar o texto ainda não inserido?',
                            )
                          )
                            return
                          setParagraph(index)
                          setText(wordAnswers[index] ?? '')
                          response.current?.focus()
                        }}
                      >
                        {item.text}
                      </button>
                      {wordAnswers[index] && (
                        <p className="answer-word-text">{wordAnswers[index]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
          <section
            className="card response-form"
            aria-label="Editor da resposta"
          >
            <h2>Sua resposta</h2>
            {source.kind === 'pdf' && point && (
              <div className="response-position">
                {(['x', 'y'] as const).map((axis) => (
                  <label key={axis}>
                    {axis === 'x'
                      ? 'Posição horizontal (%)'
                      : 'Posição vertical (%)'}
                    <input
                      type="number"
                      min="2"
                      max={axis === 'x' ? 87 : 93}
                      value={Math.round(point[axis] * 100)}
                      onChange={(event) =>
                        setPoint({
                          ...point,
                          [axis]: Math.max(
                            0.02,
                            Math.min(
                              axis === 'x' ? 0.87 : 0.93,
                              Number(event.target.value) / 100,
                            ),
                          ),
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            )}
            {source.kind === 'pdf' && point && (
              <label>
                Largura da resposta (% da folha)
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={Math.round((point.width ?? 1) * 100)}
                  onChange={(event) =>
                    setPoint({
                      ...point,
                      width: Math.max(
                        0.1,
                        Math.min(1, Number(event.target.value) / 100),
                      ),
                    })
                  }
                />
              </label>
            )}
            <label>
              Texto da resposta
              <textarea
                ref={response}
                rows={5}
                maxLength={1500}
                value={text}
                onChange={(event) => {
                  setText(event.target.value)
                  setDirty(true)
                }}
                disabled={source.kind === 'pdf' ? !point : paragraph === null}
              />
            </label>
            <div className="actions">
              <button
                type="button"
                disabled={!pending || busy}
                onClick={() => void apply()}
              >
                Inserir resposta
              </button>
              {current && (
                <button type="button" className="secondary" onClick={remove}>
                  Remover resposta
                </button>
              )}
            </div>
            <p>
              {saved}{' '}
              {saved === 1 ? 'resposta inserida' : 'respostas inseridas'}
            </p>
            <button
              type="button"
              disabled={!saved || pending || busy}
              onClick={() => void save()}
            >
              Baixar cópia respondida
            </button>
          </section>
        </div>
      )}
    </div>
  )
}

function samePoint(a: Position, b: Position) {
  return a.page === b.page && a.x === b.x && a.y === b.y
}
