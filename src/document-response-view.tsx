import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useBlocker, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Move } from 'lucide-react'
import { findClassroomItem } from './classroom-catalog'
import { FileDrop } from './editor-ui'
import { assetUrl } from './sheet-core'
import { download, filename } from './workflow'
import {
  checkPdfAnswer,
  openResponse,
  respondedPdf,
  respondedWord,
  type Answer,
  type AnswerColor,
  type Position,
  type ResponseDocument,
} from './document-response'

const colorCss: Record<AnswerColor, string> = {
  ink: '#1B2A24',
  blue: '#19408F',
  green: '#1E5643',
  red: '#AD2424',
}

type PdfSource = Extract<ResponseDocument, { kind: 'pdf' }>

function PdfAnswerSheet({
  source,
  page,
  point,
  draftText,
  zoom,
  answers,
  select,
  onError,
}: {
  source: PdfSource
  page: number
  point: Position | null
  draftText: string
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
              fontSize: ((answer.size ?? 11) * 100) / layout.width + 'cqw',
              color: colorCss[answer.color ?? 'ink'],
            }}
            aria-label={'Selecionar resposta: ' + answer.text}
            onClick={() => select(answer)}
          >
            {answer.text}
          </button>
        ))}
        {point?.page === page && (
          <>
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
            {draftText.trim() && (
              <span
                className="answer-pdf-text answer-pdf-draft"
                aria-hidden="true"
                style={{
                  left: point.x * 100 + '%',
                  top: point.y * 100 + '%',
                  width:
                    Math.min(
                      (point.width ?? 1) * 100,
                      100 - point.x * 100 - 1200 / layout.width,
                    ) + '%',
                  fontSize: ((point.size ?? 11) * 100) / layout.width + 'cqw',
                  color: colorCss[point.color ?? 'ink'],
                }}
              >
                {draftText}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function DocumentResponse() {
  const [params] = useSearchParams()
  const pdfOnly = params.get('tipo') === 'pdf'
  const acervoId = params.get('acervo') ?? ''
  const [source, setSource] = useState<ResponseDocument | null>(null)
  const [fileName, setFileName] = useState('')
  const [page, setPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [point, setPoint] = useState<Position | null>(null)
  const [anchor, setAnchor] = useState<Position | null>(null)
  const [movingAnchor, setMovingAnchor] = useState<Position | null>(null)
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
  const loadedAcervo = useRef('')

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
    const clamped: Position = {
      ...next,
      x: Math.max(0.02, Math.min(0.87, next.x)),
      y: Math.max(0.02, Math.min(0.93, next.y)),
      width: point?.width,
      size: point?.size ?? 11,
      color: point?.color ?? 'ink',
    }
    if (movingAnchor) {
      const origin = pdfAnswers.find((answer) => samePoint(answer, movingAnchor))
      if (origin) {
        const updated: Answer = {
          ...clamped,
          text: text.trim() || origin.text,
        }
        setPdfAnswers([
          ...pdfAnswers.filter((answer) => !samePoint(answer, movingAnchor)),
          updated,
        ])
        setAnchor(clamped)
        setPoint(clamped)
        setMovingAnchor(null)
        setDirty(true)
        setStatus('Resposta movida na folha ' + clamped.page + '.')
        return
      }
      setMovingAnchor(null)
    }
    if (
      pending &&
      !window.confirm(
        'Trocar a posição e descartar o texto ainda não inserido?',
      )
    )
      return
    const existing = pdfAnswers.find((answer) => samePoint(answer, next))
    setAnchor(existing ? next : null)
    setPoint({
      ...clamped,
      size: existing?.size ?? point?.size ?? 11,
      color: existing?.color ?? point?.color ?? 'ink',
      width: existing?.width ?? point?.width,
    })
    setText(existing?.text ?? '')
    setStatus('Posição selecionada na folha ' + next.page + '.')
  }

  const read = useCallback(
    async (file?: File) => {
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
        setMovingAnchor(null)
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
    },
    [busy, dirty, pdfOnly],
  )

  useEffect(() => {
    if (!acervoId || loadedAcervo.current === acervoId) return
    const item = findClassroomItem(acervoId)
    if (!item?.ready?.file) return
    loadedAcervo.current = acervoId
    let active = true
    setStatus('Carregando folha pronta para escrever por cima…')
    void fetch(assetUrl(item.ready.file))
      .then((res) => {
        if (!res.ok) throw new Error('Não foi possível abrir o PDF pronto.')
        return res.blob()
      })
      .then((blob) => {
        if (!active) return
        const file = new File([blob], filename(item.title) + '.pdf', {
          type: 'application/pdf',
        })
        return read(file)
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível carregar este PDF.',
        )
      })
    return () => {
      active = false
    }
  }, [acervoId, read])

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
  const currentAnswer =
    source?.kind === 'pdf'
      ? point &&
        pdfAnswers.find((answer) => samePoint(answer, anchor ?? point))
      : undefined
  const current =
    source?.kind === 'pdf'
      ? currentAnswer?.text
      : paragraph === null
        ? ''
        : wordAnswers[paragraph]
  const pending =
    (source?.kind === 'pdf' ? Boolean(point) : paragraph !== null) &&
    (text.trim() !== (current ?? '') ||
      Boolean(
        anchor &&
        point &&
        (!samePoint(anchor, point) ||
          anchor.width !== point.width ||
          anchor.size !== point.size ||
          anchor.color !== point.color),
      )) &&
    Boolean(text.trim())

  const [spacingWarning, setSpacingWarning] = useState('')
  useEffect(() => {
    if (source?.kind !== 'pdf' || !point || !text.trim()) return
    let current = true
    const timer = window.setTimeout(() => {
      void checkPdfAnswer(source.document, { ...point, text }).then(
        () => { if (current) setSpacingWarning('') },
        (error: unknown) => {
          if (current) setSpacingWarning(error instanceof Error ? error.message : '')
        },
      )
    }, 220)
    return () => {
      current = false
      window.clearTimeout(timer)
      setSpacingWarning('')
    }
  }, [source, point, text])

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
      <Link className="school-back" to="/app/colecao?ferramenta=documento">
        <ArrowLeft size={18} aria-hidden="true" /> Voltar aos documentos
      </Link>
      <h1>{pdfOnly ? 'Responder no PDF' : 'Responder no documento'}</h1>
      <p>
        {pdfOnly
          ? 'Abra um PDF e marque o ponto da página onde cada resposta começa.'
          : 'Abra um PDF ou Word para inserir respostas em uma cópia.'}
      </p>
      <FileDrop
        label="Selecionar arquivo para responder"
        instructions={
          (pdfOnly ? 'PDF' : 'PDF ou Word') +
          ' desbloqueado, até 12 MB. O arquivo fica no navegador.'
        }
        accept={pdfOnly ? '.pdf' : '.pdf,.docx'}
        disabled={busy}
        onFiles={([file]) => void read(file)}
      />
      <p role="status">{status}</p>
      {error && (
        <p role="alert" className="school-warning">
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
                  Toque na folha onde a resposta deve começar. Para mudar a posição, selecione a resposta e toque em outro ponto.
                </p>
                <div className="school-form-grid">
                  <label>
                    Folha do PDF
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
                </div>
                <PdfAnswerSheet
                  zoom={zoom}
                  source={source}
                  page={page}
                  point={point}
                  draftText={pending ? text : ''}
                  answers={pdfAnswers}
                  select={selectPoint}
                  onError={setError}
                />
              </>
            ) : (
              <>
                <p>
                  Escolha o parágrafo da pergunta. A resposta entra logo abaixo.
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
              <>
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
                <div className="response-position">
                  <label>
                    Tamanho da letra
                    <select
                      value={point.size ?? 11}
                      onChange={(event) =>
                        setPoint({
                          ...point,
                          size: Number(event.target.value),
                        })
                      }
                    >
                      <option value="10">10 pt (compacta)</option>
                      <option value="11">11 pt (padrão)</option>
                      <option value="13">13 pt (grande)</option>
                    </select>
                  </label>
                  <label>
                    Cor da escrita
                    <select
                      value={point.color ?? 'ink'}
                      onChange={(event) =>
                        setPoint({
                          ...point,
                          color: event.target.value as AnswerColor,
                        })
                      }
                    >
                      <option value="ink">Tinta escura</option>
                      <option value="blue">Azul caneta</option>
                      <option value="green">Verde escola</option>
                      <option value="red">Vermelho correção</option>
                    </select>
                  </label>
                </div>
                <div className="response-quick-controls">
                  <div className="actions" role="group" aria-label="Atalhos de tamanho da letra">
                    {(
                      [
                        ['P', 10],
                        ['M', 11],
                        ['G', 13],
                      ] as const
                    ).map(([label, sz]) => (
                      <button
                        key={label}
                        type="button"
                        className="secondary"
                        aria-pressed={(point.size ?? 11) === sz}
                        onClick={() => setPoint({ ...point, size: sz })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="actions" role="group" aria-label="Ajuste fino da posição">
                    <button
                      type="button"
                      className="secondary"
                      aria-label="Mover resposta para a esquerda"
                      onClick={() =>
                        setPoint({ ...point, x: Math.max(0.02, point.x - 0.02) })
                      }
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      aria-label="Mover resposta para cima"
                      onClick={() =>
                        setPoint({ ...point, y: Math.max(0.02, point.y - 0.02) })
                      }
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      aria-label="Mover resposta para baixo"
                      onClick={() =>
                        setPoint({ ...point, y: Math.min(0.93, point.y + 0.02) })
                      }
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      aria-label="Mover resposta para a direita"
                      onClick={() =>
                        setPoint({ ...point, x: Math.min(0.87, point.x + 0.02) })
                      }
                    >
                      →
                    </button>
                  </div>
                </div>
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
              </>
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
            {pending && spacingWarning && <p role="status" className="school-warning">{spacingWarning}</p>}
            <div className="actions">
              <button
                type="button"
                disabled={!pending || busy}
                onClick={() => void apply()}
              >
                Inserir resposta
              </button>
              {source.kind === 'pdf' && anchor && current && (
                <button
                  type="button"
                  className="secondary"
                  aria-pressed={Boolean(movingAnchor)}
                  onClick={() => {
                    if (movingAnchor) {
                      setMovingAnchor(null)
                      setStatus('Movimento cancelado.')
                    } else {
                      setMovingAnchor(anchor)
                      setStatus('Agora toque no novo ponto da folha para mover esta resposta.')
                    }
                  }}
                >
                  <Move size={15} aria-hidden="true" />{' '}
                  {movingAnchor ? 'Cancelar movimento' : 'Mover esta resposta'}
                </button>
              )}
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
