import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Download,
  FileText,
  Printer,
  Search,
  Scissors,
} from 'lucide-react'
import {
  ageBands,
  ageGuides,
  categories,
  categoryArt,
  classroom,
  findClassroomItem,
  type ClassroomItem,
} from './classroom-catalog'
import {
  activityCommand,
  assembled,
  assetUrl,
  buildSheets,
  initialValues,
  noticeFits,
  planMinutes,
  planMoments,
  worksheetQuantity,
  worksheetGroups,
  panelArtwork,
  paper,
  type Mark,
} from './classroom-layout'
import { figureUrl } from './art-figures'
import { drawArt, formats, openImage, photoLayout } from './media'
import { AdjustLayout } from './editor-ui'
import { download, filename, printBlob, useWorkflow } from './workflow'
import type { Draft, Values } from './store'
import './classroom.css'

export function draftLink(item: Draft) {
  const id = item.values.collectionId
  if (id && findClassroomItem(id)?.tool === item.tool)
    return '/app/colecao/' + id + '?rascunho=' + item.id
  return '/app/criar/' + item.tool + '?rascunho=' + item.id
}

function Paper({
  marks,
  width = paper.width,
  height = paper.height,
}: {
  marks: Mark[]
  width?: number
  height?: number
}) {
  function place(mark: Mark): CSSProperties {
    return {
      left: (100 * mark.x) / width + '%',
      top: (100 * mark.y) / height + '%',
      width: (100 * mark.width) / width + '%',
    }
  }
  return (
    <div
      className="print-paper"
      style={{ aspectRatio: width + ' / ' + height }}
    >
      {marks.map((mark, index) => {
        const style = place(mark)
        if (mark.kind === 'text') {
          const text = mark.text.trim()
          if (!text || mark.width <= 0) return null
          const approximate = text.length * mark.size * 0.52
          const size =
            approximate > mark.width
              ? (mark.size * mark.width) / approximate
              : mark.size
          return (
            <div
              className="paper-text"
              key={index}
              style={{
                ...style,
                color: mark.color,
                fontSize: (100 * size) / width + 'cqw',
                fontWeight: mark.bold ? 700 : 400,
              }}
            >
              {text}
            </div>
          )
        }
        if (mark.kind === 'image')
          return (
            <img
              key={index}
              src={assetUrl(mark.asset)}
              alt={mark.alt}
              style={{ ...style, height: (100 * mark.height) / height + '%' }}
              loading="lazy"
            />
          )
        if (mark.kind === 'line')
          return (
            <div
              aria-hidden="true"
              key={index}
              style={{
                ...style,
                borderTop:
                  '1px ' +
                  (mark.dashed ? 'dashed' : 'solid') +
                  ' ' +
                  mark.color,
              }}
            />
          )
        return (
          <div
            aria-hidden="true"
            key={index}
            style={{
              ...style,
              height: (100 * mark.height) / height + '%',
              background: mark.fill,
              border: mark.stroke
                ? '1px ' +
                  (mark.dashed ? 'dashed' : 'solid') +
                  ' ' +
                  mark.stroke
                : undefined,
            }}
          />
        )
      })}
    </div>
  )
}

export function ClassroomTabs({
  selected,
  choose,
}: {
  selected?: string
  choose?: (category: string) => void
}) {
  return (
    <div className="school-tabs" aria-label="Categorias da coleção">
      {categories.map((category) => {
        const content = (
          <>
            <img
              src={assetUrl(categoryArt[category])}
              alt=""
              width="62"
              height="56"
            />
            <span>{category}</span>
          </>
        )
        return choose ? (
          <button
            type="button"
            className="school-tab"
            aria-pressed={selected === category}
            key={category}
            onClick={() => choose(selected === category ? '' : category)}
          >
            {content}
          </button>
        ) : (
          <Link
            className="school-tab"
            key={category}
            to={'/app/colecao?categoria=' + encodeURIComponent(category)}
          >
            {content}
          </Link>
        )
      })}
    </div>
  )
}

const picked = ['tabela-de-frutas', 'reuniao', 'boas-vindas']
const featured = picked.map((id) => classroom.find((item) => item.id === id)!)

function PreviewThumb({ item }: { item: ClassroomItem }) {
  if (item.ready)
    return (
      <img
        className="ready-preview"
        src={assetUrl(item.ready.image)}
        alt=""
        loading="lazy"
      />
    )
  const values = initialValues(item)
  if (item.id === 'boas-vindas')
    return (
      <Paper
        marks={panelArtwork(values)}
        width={assembled.width}
        height={assembled.height}
      />
    )
  if (item.visual) {
    return item.tool === 'postagem' ? (
      <ArtworkThumb title={item.title} options={item.visual} />
    ) : (
      <AlbumThumb options={item.visual} />
    )
  }
  const sheets = buildSheets(item, values)
  return <Paper marks={sheets[0].marks} />
}

function ArtworkThumb({ title, options }: { title: string; options: Values }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const dimensions = formats[options.format as keyof typeof formats]
  const width = 352
  const height = Math.round((width * dimensions[1]) / dimensions[0])
  useEffect(() => {
    const target = canvas.current
    if (!target) return
    let active = true
    function render(figure?: HTMLImageElement) {
      if (!active || !target) return
      drawArt(
        target,
        {
          title,
          body: options.body,
          date: '',
          background: options.background,
          foreground: options.foreground,
          font: options.font,
          model: Number(options.model),
        },
        null,
        false,
        figure,
      )
    }
    render()
    const url = figureUrl(options.figure)
    if (url)
      void openImage(url)
        .then(render)
        .catch(() => {})
    return () => {
      active = false
    }
  }, [title, options])
  return (
    <canvas
      ref={canvas}
      width={width}
      height={height}
      className="school-art-thumb"
      role="img"
      aria-label={title}
    />
  )
}

function AlbumThumb({ options }: { options: Values }) {
  const perPage = options.perPage === '1' ? 1 : options.perPage === '2' ? 2 : 4
  const layout = photoLayout({
    orientation:
      options.orientation === 'horizontal' ? 'horizontal' : 'vertical',
    perPage,
    margin: Number(options.margin),
    crop: false,
    quality: 'standard',
  })
  return (
    <div
      className="school-album-thumb"
      style={{ aspectRatio: layout.pageWidth + '/' + layout.pageHeight }}
      role="img"
      aria-label="Exemplo de distribuição das fotografias"
    >
      {Array.from({ length: perPage }, (_, index) => (
        <div
          key={index}
          style={{
            left: (100 * layout.x(index)) / layout.pageWidth + '%',
            top: (100 * layout.y(index)) / layout.pageHeight + '%',
            width: (100 * layout.width) / layout.pageWidth + '%',
            height: (100 * layout.height) / layout.pageHeight + '%',
          }}
        >
          <img
            alt=""
            loading="lazy"
            src={assetUrl(
              [
                'atividades.webp',
                'organizacao.webp',
                'paineis.webp',
                'recados.webp',
              ][index],
            )}
          />
          <span />
        </div>
      ))}
    </div>
  )
}

function ClassroomCard({ item }: { item: ClassroomItem }) {
  const values = initialValues(item)
  const count = item.ready
    ? 1
    : item.visual
      ? undefined
      : buildSheets(item, values).length
  return (
    <article className="school-card">
      <Link to={'/app/colecao/' + item.id} className="school-card-link">
        <div
          className={
            'school-thumb' +
            (item.tool === 'painel' ? ' school-thumb-panel' : '')
          }
          aria-hidden="true"
        >
          <PreviewThumb item={item} />
        </div>
        <div className="school-card-body">
          <p className="school-card-meta">
            {item.age ?? item.category}
            {count ? ' · ' + count + (count === 1 ? ' folha' : ' folhas') : ''}
          </p>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
          <span className="school-card-action">
            {item.ready ? 'Pronto para imprimir' : 'Personalizar'}{' '}
            <ArrowRight size={17} aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  )
}

export function CollectionShowcase() {
  return (
    <div className="school-showcase">
      {featured.map((item) => (
        <ClassroomCard key={item.id} item={item} />
      ))}
    </div>
  )
}

const normalized = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
export function ClassroomLibrary() {
  const [params, setParams] = useSearchParams()
  const category = params.get('categoria') ?? ''
  const tool = params.get('ferramenta')
  const creating = tool === 'atividade' || tool === 'plano-de-aula'
  const [age, setAge] = useState('')
  const [mode, setMode] = useState('')
  const [query, setQuery] = useState('')
  const search = normalized(query.trim())
  const results = classroom.filter(
    (item) =>
      (!creating || (item.tool === tool && !item.ready)) &&
      (!category || item.category === category) &&
      (!age || item.age === age || (!item.age && item.tool !== 'atividade')) &&
      (!mode || (mode === 'pronto' ? !!item.ready : !item.ready)) &&
      normalized(
        [item.title, item.category, item.age, item.description]
          .filter(Boolean)
          .join(' '),
      ).includes(search),
  )
  function setCategory(next: string) {
    setParams(next ? { categoria: next } : {})
  }
  return (
    <div className="school-library">
      <div className="school-section-head">
        <div>
          <h1>
            {tool === 'atividade'
              ? 'Criar atividade'
              : tool === 'plano-de-aula'
                ? 'Criar plano de aula'
                : 'Coleção de sala de aula'}
          </h1>
          <p>
            {tool === 'atividade'
              ? 'Escolha a turma e abra uma folha ilustrada ou uma proposta para conduzir com as crianças.'
              : tool === 'plano-de-aula'
                ? 'Escolha a turma e abra um plano para ajustar os momentos e a duração.'
                : 'Veja o material antes de personalizar ou imprimir.'}
          </p>
        </div>
        <Link to="/app/modelos">Modelos anteriores</Link>
      </div>
      {tool === 'atividade' && (
        <Link className="button" to="/app/colecao/criar-contagem">
          Montar ficha de contagem
        </Link>
      )}
      {!creating && <ClassroomTabs selected={category} choose={setCategory} />}
      <div className="school-filters">
        <label>
          Buscar na coleção
          <span>
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              placeholder="Ex.: Pré II, recado ou chamadinha"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </span>
        </label>
        <label>
          Turma
          <select value={age} onChange={(e) => setAge(e.target.value)}>
            <option value="">Todas</option>
            {ageBands.map((band) => (
              <option key={band}>{band}</option>
            ))}
          </select>
        </label>
        <label>
          Formato
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="">Todos</option>
            <option value="pronto">Pronto para imprimir</option>
            <option value="editavel">Personalizável</option>
          </select>
        </label>
      </div>
      <p className="school-result" role="status">
        {results.length}{' '}
        {results.length === 1 ? 'material encontrado' : 'materiais encontrados'}
      </p>
      <div className="school-showcase">
        {results.map((item) => (
          <ClassroomCard key={item.id} item={item} />
        ))}
      </div>
      {!results.length && (
        <button
          className="secondary"
          onClick={() => {
            setCategory('')
            setAge('')
            setMode('')
            setQuery('')
          }}
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}

function PagePreview({
  item,
  values,
  sheets,
}: {
  item: ClassroomItem
  values: Values
  sheets: ReturnType<typeof buildSheets>
}) {
  const [selected, setSelected] = useState(item.id === 'boas-vindas' ? -1 : 0)
  const active = Math.min(sheets.length - 1, selected)
  const assembledPreview = active < 0
  const title = assembledPreview ? 'Como fica montado' : sheets[active].name
  return (
    <div className="school-preview">
      <h2>{title}</h2>
      <div className="school-page-picker" aria-label="Páginas da prévia">
        {item.id === 'boas-vindas' && (
          <button
            type="button"
            className="secondary"
            aria-pressed={assembledPreview}
            onClick={() => setSelected(-1)}
          >
            Montado
          </button>
        )}
        {sheets.map((sheet, index) => (
          <button
            type="button"
            key={index}
            aria-label={'Folha ' + (index + 1) + ' · ' + sheet.name}
            className="secondary"
            aria-pressed={index === active}
            onClick={() => setSelected(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>
      {assembledPreview ? (
        <Paper
          marks={panelArtwork(values)}
          width={assembled.width}
          height={assembled.height}
        />
      ) : (
        <Paper marks={sheets[active].marks} />
      )}
      <p className="school-page-note">
        {item.tool === 'painel'
          ? 'A4 retrato · imprima em escala de 100%'
          : 'A4 retrato'}{' '}
        · {sheets.length} {sheets.length === 1 ? 'folha' : 'folhas'}
      </p>
    </div>
  )
}

function ReadyMaterial({
  item,
}: {
  item: ClassroomItem & { ready: NonNullable<ClassroomItem['ready']> }
}) {
  return (
    <div className="school-editor school-ready">
      <Link className="school-back" to="/app/colecao">
        <ArrowLeft size={18} /> Coleção
      </Link>
      <h1>{item.title}</h1>
      <p>{item.description}</p>
      <img src={assetUrl(item.ready.image)} alt={item.title} />
      <p>
        <a href={item.ready.source}>{item.ready.author}</a>
      </p>
      <a className="button" href={assetUrl(item.ready.file)} download>
        <Download size={18} aria-hidden="true" /> Baixar PDF
      </a>
    </div>
  )
}

function SchoolEditor({
  item,
  draftId,
}: {
  item: ClassroomItem
  draftId: string | null
}) {
  const flow = useWorkflow(
    { tool: item.tool, model: 0, recoveryId: 'sala-' + item.id, draftId },
    () => initialValues(item),
  )
  const [busy, setBusy] = useState(false)
  const { values, set } = flow
  const sheets = useMemo(() => buildSheets(item, values), [item, values])
  const isWorksheet = Boolean(
    item.task && item.task.mode !== 'experience' && item.task.mode !== 'cards',
  )
  const isPlan = item.tool === 'plano-de-aula'
  const isNotice = item.category === 'Recados'
  const isPanel = item.category === 'Painéis'
  const fits = !isNotice || noticeFits(item, values)
  function input(key: string, label: string, type?: string, maxLength = 65) {
    return (
      <label key={key}>
        {label}
        <input
          type={type ?? 'text'}
          value={values[key] ?? ''}
          maxLength={maxLength}
          onChange={(event) => set(key, event.target.value)}
        />
      </label>
    )
  }
  async function output(format: 'pdf' | 'docx' | 'print') {
    if (busy || !fits || !values.title.trim()) return
    setBusy(true)
    flow.setMessage('')
    flow.setError('')
    try {
      const file =
        format === 'docx'
          ? await (await import('./classroom-word')).classroomWord(item, values)
          : await (
              await import('./classroom-export')
            ).classroomPdf(values.title, sheets)
      if (format === 'print') printBlob(file)
      else download(file, filename(values.title) + '.' + format)
      flow.setMessage('Arquivo preparado.')
    } catch {
      flow.setError(
        'Não foi possível preparar o arquivo. Confira a conexão e tente novamente.',
      )
    } finally {
      setBusy(false)
    }
  }
  if (flow.loading) return <p role="status">Carregando rascunho…</p>
  if (flow.unavailable) return <p role="alert">{flow.error}</p>
  const form = (
    <div className="school-form">
      <h2>Personalizar material</h2>
      {isNotice && (
        <>
          <div className="school-form-grid">
            {(item.fields ?? []).map((field) =>
              input(field.key, field.label, field.type, 30),
            )}
          </div>
          {input('recipient', 'Destinatário')}
          <label>
            Distribuição
            <select
              value={values.copies}
              onChange={(event) => set('copies', event.target.value)}
            >
              <option value="2">Duas vias para recortar</option>
              <option value="1">Comunicado A4 inteiro</option>
            </select>
          </label>
        </>
      )}
      {input('title', 'Título')}
      <div className="school-form-grid">
        {input('school', 'Escola')}
        {input('classroom', 'Turma')}
      </div>
      {!isNotice && !isPanel && input('date', 'Data', 'date')}
      {isNotice && input('signature', 'Assinatura')}
      {!item.task &&
        !isNotice &&
        !isPanel &&
        item.fields
          ?.filter((field) => !isPlan || field.key !== 'conduct')
          .map((field) =>
            field.type === 'long' ? (
              <label key={field.key}>
                {field.label}
                <textarea
                  value={values[field.key]}
                  maxLength={1500}
                  rows={5}
                  onChange={(event) => set(field.key, event.target.value)}
                />
              </label>
            ) : (
              input(field.key, field.label)
            ),
          )}
      {isNotice && (
        <label>
          Mensagem
          <textarea
            value={values.body}
            maxLength={isNotice ? 3000 : 8000}
            rows={isNotice ? 7 : 15}
            onChange={(event) => set('body', event.target.value)}
          />
        </label>
      )}
      {!fits && (
        <p role="alert" className="school-warning">
          O texto passou do espaço da folha. Encurte a mensagem ou escolha
          Comunicado A4 inteiro.
        </p>
      )}
      {isPlan && (
        <fieldset className="school-moments">
          <legend>Momentos da aula</legend>
          <p>
            Duração total: <strong>{planMinutes(values)} min</strong>
          </p>
          {planMoments(values).map((moment, index) => (
            <div className="school-moment" key={index}>
              <strong>{moment.label}</strong>
              <label>
                Duração em minutos
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={moment.minutes}
                  onChange={(event) =>
                    set('minute' + index, event.target.value)
                  }
                />
              </label>
              <label>
                O que fazer
                <textarea
                  rows={3}
                  maxLength={420}
                  value={moment.action}
                  onChange={(event) =>
                    set('moment' + index, event.target.value)
                  }
                />
              </label>
            </div>
          ))}
        </fieldset>
      )}
      {isWorksheet && (
        <>
          <label>
            Comando para a criança
            <textarea
              rows={2}
              maxLength={95}
              value={values.command ?? activityCommand(item, values)}
              onChange={(event) => set('command', event.target.value)}
            />
          </label>
          {item.id === 'criar-contagem' && (
            <label>
              Figuras
              <select
                value={values.group ?? 'fruit'}
                onChange={(event) => set('group', event.target.value)}
              >
                <option value="fruit">Frutas</option>
                <option value="animals">Animais</option>
                <option value="school">Materiais escolares</option>
              </select>
            </label>
          )}
          {(item.task?.mode === 'table' || item.task?.mode === 'count') && (
            <fieldset className="school-moments">
              <legend>Quantidade de figuras</legend>
              <div className="school-form-grid">
                {worksheetGroups(item, values).map((label, index) => (
                  <label key={label}>
                    {label}
                    <select
                      value={worksheetQuantity(values, index)}
                      onChange={(event) =>
                        set('quantity' + index, event.target.value)
                      }
                    >
                      {[1, 2, 3, 4, 5].map((number) => (
                        <option key={number}>{number}</option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <label>
            Folhas do arquivo
            <select
              value={values.guide ?? 'no'}
              onChange={(event) => set('guide', event.target.value)}
            >
              <option value="yes">Ficha e roteiro da professora</option>
              <option value="no">Só a ficha para a criança</option>
            </select>
          </label>
        </>
      )}
      {item.task && !isWorksheet && (
        <div className="school-materials">
          <h3>O que preparar</h3>
          <p>{item.task.supplies}</p>
          <p>{item.task.adaptation}</p>
        </div>
      )}
      {isPanel && (
        <div className="school-materials">
          <Scissors aria-hidden="true" size={21} />
          <h3>Impressão e montagem</h3>
          <p>
            {item.poster
              ? 'Recorte os cartões e siga o mapa do guia. Cabeçalho de 18,2 × 4,2 cm e cartões de 8,8 × 4,9 cm.'
              : 'Quatro folhas A4, mais um guia. Medida montada de 37,5 × 54,9 cm com sobreposição de 5 mm.'}
          </p>
        </div>
      )}
    </div>
  )
  return (
    <div className="school-editor">
      <Link className="school-back" to="/app/colecao">
        <ArrowLeft size={18} /> Coleção
      </Link>
      <div className="school-section-head">
        <div>
          <p className="school-card-meta">
            {item.age ? ageGuides[item.age] : item.category}
          </p>
          <h1>{item.title}</h1>
          <p>{item.description}</p>
        </div>
      </div>
      <AdjustLayout
        form={form}
        preview={<PagePreview item={item} values={values} sheets={sheets} />}
      />
      <p role="status">{flow.message}</p>
      {flow.error && <p role="alert">{flow.error}</p>}
      <div className="actions pinned-action school-export">
        <button
          type="button"
          disabled={!fits || busy || !values.title.trim()}
          onClick={() => void output('pdf')}
        >
          <Download size={17} aria-hidden="true" /> Baixar PDF
        </button>
        {!isPanel && (
          <button
            type="button"
            className="secondary"
            disabled={!fits || busy || !values.title.trim()}
            onClick={() => void output('docx')}
          >
            <FileText size={17} aria-hidden="true" /> Baixar Word
          </button>
        )}
        <button
          type="button"
          className="secondary"
          disabled={!fits || busy || !values.title.trim()}
          onClick={() => void output('print')}
        >
          <Printer size={17} aria-hidden="true" /> Imprimir
        </button>
        <button
          type="button"
          className="secondary"
          disabled={busy}
          onClick={() => void flow.save()}
        >
          Salvar rascunho
        </button>
      </div>
    </div>
  )
}

export function ClassroomRoute() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const item = findClassroomItem(id)
  if (!item)
    return (
      <>
        <h1>Material não encontrado</h1>
        <Link to="/app/colecao">Voltar à coleção</Link>
      </>
    )
  if (item.ready) return <ReadyMaterial item={{ ...item, ready: item.ready }} />
  if (item.visual && params.has('rascunho')) {
    const editor = new URLSearchParams({
      colecao: item.id,
      rascunho: params.get('rascunho')!,
    })
    return <Navigate replace to={'/app/criar/' + item.tool + '?' + editor} />
  }
  if (item.visual)
    return (
      <>
        <Link className="school-back" to="/app/colecao">
          <ArrowLeft size={18} /> Coleção
        </Link>
        <h1>{item.title}</h1>
        <p>{item.description}</p>
        <PreviewThumb item={item} />
        <Link
          className="button"
          to={'/app/criar/' + item.tool + '?colecao=' + item.id}
        >
          Personalizar
        </Link>
      </>
    )
  return (
    <SchoolEditor
      key={item.id + ':' + (params.get('rascunho') ?? '')}
      item={item}
      draftId={params.get('rascunho')}
    />
  )
}
