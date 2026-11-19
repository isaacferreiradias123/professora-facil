import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useBlocker } from 'react-router-dom'
import { FileDrop } from './editor-ui'
import { download, filename } from './workflow'
import {
  children,
  descendants,
  embeddedPictures,
  inlineEditAllowed,
  insertParagraph,
  openWord,
  paragraphText,
  parseWord,
  pictureId,
  property,
  replaceParagraphText,
  saveWord,
  changeWordRow,
  simpleRows,
  resizeInlinePicture,
  w,
  type WordSource,
} from './word-edit'
import './word-edit.css'

const first = (node: Element, kind: string) => children(node, kind)[0]
type Snapshot = Pick<WordSource, 'body' | 'parts'>
export default function WordEditor() {
  const [source, setSource] = useState<WordSource>()
  const [pictures, setPictures] = useState<Record<string, string>>({})
  const [history, setHistory] = useState<Snapshot[]>([])
  const [index, setIndex] = useState(0)
  const [saved, setSaved] = useState<Snapshot>()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [active, setActive] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const edit = useRef<HTMLTextAreaElement>(null)
  const current = history[index]
  const bodyXml = current?.body ?? ''
  const document = useMemo(
    () => (bodyXml ? parseWord(bodyXml) : undefined),
    [bodyXml],
  )
  const pList = useMemo(
    () => (document ? descendants(document, 'p') : []),
    [document],
  )
  const dirty =
    current !== saved ||
    (active !== null && pList[active] && draft !== paragraphText(pList[active]))
  const blocker = useBlocker(dirty)
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    if (window.confirm('Sair sem baixar as alterações do Word?'))
      blocker.proceed()
    else blocker.reset()
  }, [blocker])
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  useEffect(
    () => () =>
      Object.values(pictures).forEach((url) => URL.revokeObjectURL(url)),
    [pictures],
  )
  useEffect(() => {
    if (active !== null) edit.current?.focus()
  }, [active])
  const body = document ? descendants(document, 'body')[0] : undefined
  const settings = body ? first(body, 'sectPr') : undefined
  const size = settings ? first(settings, 'pgSz') : undefined
  const margins = settings ? first(settings, 'pgMar') : undefined
  const canEditMargins = Boolean(
    margins && document && descendants(document, 'sectPr').length === 1,
  )
  const width = Number(property(size, 'w')) || 11906
  const height = Number(property(size, 'h')) || 16838
  const padding = (side: string) =>
    Math.max(
      0,
      Math.min(48, (Number(property(margins, side) || 1440) * 100) / width),
    ) + '%'
  async function open(file?: File) {
    if (
      !file ||
      busy ||
      (dirty &&
        !window.confirm('Abrir outro Word e descartar as alterações atuais?'))
    )
      return
    setBusy(true)
    setError('')
    try {
      const next = await openWord(file)
      const images = await embeddedPictures(next)
      setSource(next)
      setPictures(images)
      setName(file.name)
      setHistory([next])
      setSaved(next)
      setIndex(0)
      setActive(null)
      setMessage('Documento aberto para edição.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível abrir este Word.',
      )
    } finally {
      setBusy(false)
    }
  }
  function commit(update: (doc: Document) => void, part?: string) {
    if (!current) return
    const input = part ? current.parts[part] : current.body
    const copy = parseWord(input)
    update(copy)
    const next = new XMLSerializer().serializeToString(copy)
    if (next !== input) {
      const snapshot = part
        ? { ...current, parts: { ...current.parts, [part]: next } }
        : { ...current, body: next }
      setHistory([...history.slice(0, index + 1), snapshot])
      setIndex(index + 1)
    }
    setActive(null)
  }
  function saveParagraph() {
    if (active === null) return
    if (paragraphText(pList[active]) !== draft)
      commit((doc) =>
        replaceParagraphText(descendants(doc, 'p')[active], draft),
      )
    else setActive(null)
  }
  async function exportFile() {
    if (!source || !current || busy || active !== null) return
    setBusy(true)
    setError('')
    try {
      download(
        await saveWord(source, current.body, current.parts),
        filename(name.replace(/\.docx$/i, '')) + '-editado.docx',
      )
      setSaved(current)
      setMessage('Cópia editável preparada.')
    } catch {
      setError('Não foi possível baixar a cópia do Word.')
    } finally {
      setBusy(false)
    }
  }
  function render(node: Element, key: number): ReactNode {
    if (node.localName === 'tbl') {
      const id = document ? descendants(document, 'tbl').indexOf(node) : -1
      const rows = children(node, 'tr')
      return (
        <div className="word-table-scroll" key={key}>
          <table>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {children(row, 'tc').map((cell, j) => (
                    <td
                      key={j}
                      colSpan={Math.max(
                        1,
                        Math.min(
                          50,
                          Number(
                            property(
                              first(first(cell, 'tcPr') ?? cell, 'gridSpan'),
                            ),
                          ) || 1,
                        ),
                      )}
                    >
                      {Array.from(cell.children).map(render)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {id >= 0 && active === null && simpleRows(node) && (
            <details className="word-row-tools">
              <summary>Linhas da tabela {id + 1}</summary>
              {rows.map((_, row) => (
                <div key={row} className="actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      commit((doc) =>
                        changeWordRow(descendants(doc, 'tbl')[id], row, true),
                      )
                    }
                  >
                    Inserir abaixo da linha {row + 1}
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    disabled={rows.length <= 1}
                    onClick={() =>
                      commit((doc) =>
                        changeWordRow(descendants(doc, 'tbl')[id], row, false),
                      )
                    }
                  >
                    Excluir linha {row + 1}
                  </button>
                </div>
              ))}
            </details>
          )}
        </div>
      )
    }
    if (node.localName !== 'p') return null
    const id = pList.indexOf(node)
    const pr = first(node, 'pPr')
    const styleId = pr ? property(first(pr, 'pStyle')) : ''
    const style = source?.styles
      ? descendants(source.styles, 'style').find(
          (item) => property(item, 'styleId') === styleId,
        )
      : undefined
    const styleName = style ? property(first(style, 'name')) : ''
    const heading = /heading|título|^title/i.test(styleId + ' ' + styleName)
    const alignment = pr ? property(first(pr, 'jc')) : ''
    const numbered = Boolean(pr && first(pr, 'numPr'))
    const editable = inlineEditAllowed(node)
    const words = children(node, 'r').map((run, position) => {
      const props = first(run, 'rPr')
      const parts = Array.from(run.children).map((piece, i) => {
        if (piece.localName === 't') return piece.textContent
        if (piece.localName === 'tab') return '    '
        if (piece.localName === 'br') return <br key={i} />
        if (piece.localName === 'drawing')
          return Array.from(
            piece.getElementsByTagNameNS(
              'http://schemas.openxmlformats.org/drawingml/2006/main',
              'blip',
            ),
          ).map((image, j) => {
            const url = pictures[pictureId(image)]
            const ext = piece.getElementsByTagNameNS(
              'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
              'extent',
            )[0]
            const width = Number(ext?.getAttribute('cx')) / 9525
            return url ? (
              <img
                key={j}
                src={url}
                alt="Imagem do documento"
                style={{ width: width || undefined }}
              />
            ) : (
              <span key={j}>Imagem disponível no Word</span>
            )
          })
        return null
      })
      const color = props ? property(first(props, 'color')) : ''
      const points = props ? Number(property(first(props, 'sz'))) / 2 : 0
      const has = (kind: string) => {
        const flag = props ? first(props, kind) : undefined
        return flag && !['0', 'false', 'off'].includes(property(flag))
      }
      return (
        <span
          key={position}
          style={{
            fontWeight: has('b') ? 'bold' : undefined,
            fontStyle: has('i') ? 'italic' : undefined,
            textDecoration: has('u') ? 'underline' : undefined,
            color: /^[0-9a-f]{6}$/i.test(color) ? '#' + color : undefined,
            fontSize: points > 0 && points < 100 ? points + 'pt' : undefined,
          }}
        >
          {parts}
        </span>
      )
    })
    return (
      <div
        key={key}
        className={'word-paragraph' + (heading ? ' word-heading' : '')}
        style={{
          textAlign:
            alignment === 'center' || alignment === 'right'
              ? alignment
              : undefined,
        }}
      >
        {active === id ? (
          <div className="word-inline-form">
            <textarea
              ref={edit}
              aria-label="Texto do trecho"
              value={draft}
              rows={Math.min(10, Math.max(2, Math.ceil(draft.length / 55)))}
              onChange={(e) => setDraft(e.target.value.replace(/[\r\n]/g, ' '))}
            />
            <div className="actions">
              <button type="button" onClick={saveParagraph}>
                Aplicar alteração
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setActive(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  commit((doc) => {
                    const target = descendants(doc, 'p')[id]
                    replaceParagraphText(target, draft)
                    insertParagraph(target, 'Resposta: ')
                  })
                }
              >
                Inserir resposta abaixo
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  commit((doc) => {
                    const target = descendants(doc, 'p')[id]
                    replaceParagraphText(target, draft)
                    insertParagraph(target)
                  })
                }
              >
                Novo parágrafo
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  commit((doc) => {
                    const target = descendants(doc, 'p')[id]
                    if (
                      descendants(target, 'sectPr').length > 0 ||
                      (target.parentElement?.localName === 'tc' &&
                        children(target.parentElement, 'p').length === 1)
                    )
                      replaceParagraphText(target, '')
                    else target.remove()
                  })
                }
              >
                Excluir parágrafo
              </button>
            </div>
          </div>
        ) : editable ? (
          <button
            type="button"
            className="word-editable"
            onClick={() => {
              setActive(id)
              setDraft(paragraphText(node))
            }}
          >
            {numbered ? '• ' : ''}
            {paragraphText(node) ? (
              words
            ) : (
              <span className="word-empty">Parágrafo vazio</span>
            )}
          </button>
        ) : (
          <div>{words.length ? words : paragraphText(node)}</div>
        )}
        {active === null &&
          descendants(node, 'drawing').map((drawing) => {
            if (!document || !resizeInlinePicture(drawing, 100)) return null
            const id = descendants(document, 'drawing').indexOf(drawing)
            return (
              <details className="word-row-tools" key={id}>
                <summary>Tamanho da imagem {id + 1}</summary>
                <div className="actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      commit((doc) =>
                        resizeInlinePicture(
                          descendants(doc, 'drawing')[id],
                          90,
                        ),
                      )
                    }
                  >
                    Reduzir 10%
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      commit((doc) =>
                        resizeInlinePicture(
                          descendants(doc, 'drawing')[id],
                          110,
                        ),
                      )
                    }
                  >
                    Ampliar 10%
                  </button>
                </div>
              </details>
            )
          })}
      </div>
    )
  }
  const pages: Element[][] = [[]]
  for (const node of Array.from(body?.children ?? [])) {
    if (node.localName === 'sectPr') continue
    if (
      node.localName === 'p' &&
      first(first(node, 'pPr') ?? node, 'pageBreakBefore')
    )
      pages.push([])
    pages.at(-1)!.push(node)
    if (descendants(node, 'br').some((br) => property(br, 'type') === 'page'))
      pages.push([])
  }
  return (
    <div className="response-editor">
      <Link to="/app/colecao?ferramenta=documento">Voltar aos documentos</Link>
      <h1>Editar um Word existente</h1>
      <p>
        Escolha um trecho na página ou numa tabela. As alterações serão gravadas
        numa cópia DOCX.
      </p>
      <FileDrop
        label="Selecionar Word para editar"
        instructions="DOCX desbloqueado de até 12 MB. O arquivo fica no dispositivo."
        accept=".docx"
        disabled={busy}
        onFiles={([file]) => void open(file)}
      />
      <p role="status">{message}</p>
      {error && <p role="alert">{error}</p>}
      {body && (
        <>
          <h2>{name}</h2>
          <p>
            Prévia aproximada. Elementos complexos, fontes e paginação podem
            aparecer de outra forma no Microsoft Word.
          </p>
          <div className="actions word-toolbar">
            <button
              type="button"
              className="secondary"
              disabled={index === 0 || active !== null}
              onClick={() => setIndex(index - 1)}
            >
              Desfazer
            </button>
            <button
              type="button"
              className="secondary"
              disabled={index >= history.length - 1 || active !== null}
              onClick={() => setIndex(index + 1)}
            >
              Refazer
            </button>
            <button
              type="button"
              disabled={active !== null || busy}
              onClick={() => void exportFile()}
            >
              Baixar Word editado
            </button>
          </div>
          {(canEditMargins || Object.keys(current?.parts ?? {}).length > 0) &&
            active === null && (
              <details className="word-advanced">
                <summary>Ajustar margens, cabeçalhos e rodapés</summary>
                {canEditMargins && (
                  <form
                    className="word-margin-form"
                    key={bodyXml}
                    onSubmit={(event) => {
                      event.preventDefault()
                      const data = new FormData(event.currentTarget)
                      const values = ['top', 'right', 'bottom', 'left'].map(
                        (side) =>
                          [
                            side,
                            (Number(data.get(side)) * 1440) / 25.4,
                          ] as const,
                      )
                      if (
                        values[1][1] + values[3][1] > width - 1440 ||
                        values[0][1] + values[2][1] > height - 1440
                      ) {
                        setError(
                          'As margens precisam deixar pelo menos 25,4 mm de área útil.',
                        )
                        return
                      }
                      setError('')
                      commit((doc) => {
                        const target = descendants(doc, 'pgMar')[0]
                        for (const [side, value] of values)
                          target.setAttributeNS(
                            w,
                            'w:' + side,
                            String(Math.round(value)),
                          )
                      })
                    }}
                  >
                    <fieldset>
                      <legend>Margens da seção em milímetros</legend>
                      {Object.entries({
                        top: 'Superior',
                        right: 'Direita',
                        bottom: 'Inferior',
                        left: 'Esquerda',
                      }).map(([side, label]) => (
                        <label key={side}>
                          {label}
                          <input
                            name={side}
                            type="number"
                            step="0.1"
                            min="0"
                            max="200"
                            required
                            defaultValue={Math.max(
                              0,
                              (Number(property(margins, side)) * 25.4) / 1440,
                            ).toFixed(1)}
                          />
                        </label>
                      ))}
                    </fieldset>
                    <button type="submit" className="secondary">
                      Aplicar margens
                    </button>
                  </form>
                )}
                {Object.entries(current?.parts ?? {}).map(
                  ([part, contents], partIndex) => (
                    <fieldset className="word-part" key={part}>
                      <legend>
                        {part.startsWith('header') ? 'Cabeçalho' : 'Rodapé'} ·{' '}
                        {partIndex + 1}
                      </legend>
                      {children(parseWord(contents).documentElement, 'p').map(
                        (paragraph, id) =>
                          inlineEditAllowed(paragraph) ? (
                            <form
                              key={contents + id}
                              onSubmit={(event) => {
                                event.preventDefault()
                                const value = String(
                                  new FormData(event.currentTarget).get(
                                    'trecho',
                                  ) ?? '',
                                )
                                commit(
                                  (doc) =>
                                    replaceParagraphText(
                                      children(doc.documentElement, 'p')[id],
                                      value,
                                    ),
                                  part,
                                )
                              }}
                            >
                              <label>
                                Parágrafo {id + 1}
                                <input
                                  name="trecho"
                                  defaultValue={paragraphText(paragraph)}
                                />
                              </label>
                              <button type="submit" className="secondary">
                                Aplicar trecho
                              </button>
                            </form>
                          ) : (
                            <p key={id}>
                              Trecho com campos ou objetos preservado no Word.
                            </p>
                          ),
                      )}
                    </fieldset>
                  ),
                )}
              </details>
            )}
          <div className="word-pages">
            {pages
              .filter((nodes) => nodes.length)
              .map((nodes, i) => (
                <section
                  key={i}
                  aria-label={'Página ' + (i + 1)}
                  className="word-page"
                  style={{
                    minHeight: 'min(64rem, ' + (height / width) * 100 + 'vw)',
                    paddingInlineStart: padding('left'),
                    paddingInlineEnd: padding('right'),
                    paddingBlockStart: padding('top'),
                    paddingBlockEnd: padding('bottom'),
                  }}
                >
                  {nodes.map(render)}
                </section>
              ))}
          </div>
        </>
      )}
    </div>
  )
}
