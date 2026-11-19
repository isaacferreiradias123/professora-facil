import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  Link,
  useLocation,
  useNavigationType,
  useSearchParams,
} from 'react-router-dom'
import { Search } from 'lucide-react'
import { archiveAdditions } from './archive-additions'
import { archiveItems } from './archive-items'

import {
  ageBands,
  classroom,
  fallbackClassroomId,
  findClassroomItem,
  type ClassroomItem,
} from './classroom-catalog'
import {
  assetUrl,
  buildSheets,
  initialValues,
  kitSheetCount,
  mosaicGeometry,
  panelArtwork,
  paper,
  type Mark,
} from './classroom-layout'
import { figureUrl } from './art-figures'
import { drawArt, formats, openImage, photoCount, photoLayout } from './media'
import { tools, type Tool } from './catalog'
import type { Draft, Values } from './store'
import { collectionSections, sectionFor } from './catalog-sections'
import './classroom.css'

const archivePageSize = 24
const addedArchiveIds = new Set<string>(archiveAdditions.map(({ id }) => id))
const sortedArchive = [...archiveItems].sort((a, b) => a.id.localeCompare(b.id))
const archiveTypes = [...new Set(archiveItems.map((item) => item.archiveType ?? item.category))]
  .sort((a, b) => a.localeCompare(b, 'pt-BR'))

export function draftLink(item: Draft) {
  const id = item.values.collectionId
  if (id && findClassroomItem(id)?.tool === item.tool)
    return '/app/colecao/' + id + '?rascunho=' + item.id
  if (['postagem', 'painel', 'fotos-em-pdf'].includes(item.tool))
    return '/app/criar/' + item.tool + '?rascunho=' + item.id
  return '/app/colecao/' + fallbackClassroomId(item.tool) + '?rascunho=' + item.id
}

export function Paper({
  marks,
  width = paper.width,
  height = paper.height,
}: {
  marks: Mark[]
  width?: number
  height?: number
}) {
  function place(mark: Exclude<Mark, { kind: 'path' }>): CSSProperties {
    return {
      left: (100 * mark.x) / width + '%',
      top: (100 * mark.y) / height + '%',
      width: (100 * mark.width) / width + '%',
    }
  }
  const paths = marks.filter(
    (mark): mark is Extract<Mark, { kind: 'path' }> => mark.kind === 'path',
  )
  return (
    <div
      className="print-paper"
      style={{ aspectRatio: width + ' / ' + height }}
    >
      {marks.map((mark, index) => {
        if (mark.kind === 'path') return null
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
                textAlign: mark.align,
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
              borderRadius: mark.radius ? mark.radius + 'px' : undefined,
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
      {paths.length > 0 && (
        <svg
          className="paper-svg"
          viewBox={`0 0 ${width} ${height}`}
          aria-hidden="true"
        >
          {paths.map((mark, index) => (
            <polyline
              key={index}
              fill="none"
              stroke={mark.color}
              strokeWidth={mark.strokeWidth}
              strokeDasharray={mark.dashed ? '2.4 2' : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
              points={mark.points.map((p) => `${p.x},${p.y}`).join(' ')}
            />
          ))}
        </svg>
      )}
    </div>
  )
}

export function ClassroomTabs({
  selected,
  choose,
}: {
  selected?: string
  choose?: (tool: string) => void
}) {
  const entries = Object.entries(tools) as [Tool, (typeof tools)[Tool]][]
  return (
    <div className="school-tabs" aria-label="Ferramentas da coleção">
      {choose && (
        <button
          type="button"
          className="school-tab"
          aria-pressed={!selected}
          onClick={() => choose('')}
        >
          <span>Todas ({classroom.length})</span>
        </button>
      )}
      {entries.map(([key, info]) => {
        const content = (
          <>
            <img
              src={assetUrl(info.image)}
              alt=""
              width="42"
              height="42"
              loading="lazy"
            />
            <span>{info.shortName}</span>
          </>
        )
        return choose ? (
          <button
            type="button"
            className="school-tab"
            aria-pressed={selected === key}
            key={key}
            onClick={() => choose(selected === key ? '' : key)}
          >
            {content}
          </button>
        ) : (
          <Link
            className="school-tab"
            key={key}
            to={'/app/colecao?ferramenta=' + key}
          >
            {content}
          </Link>
        )
      })}
    </div>
  )
}

const picked = ['tabela-de-frutas', 'reuniao', 'arte-mostra', 'boas-vindas']
const featured = picked
  .map((id) => classroom.find((item) => item.id === id)!)
  .filter(Boolean)

export function PreviewThumb({ item }: { item: ClassroomItem }) {
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
  if (item.id === 'boas-vindas' || Boolean(item.mosaicLabels))
    return (
      <Paper
        marks={panelArtwork(values, item)}
        width={mosaicGeometry(item).assembled.width}
        height={mosaicGeometry(item).assembled.height}
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
  return (
    <Paper
      marks={sheets[0].marks}
      width={sheets[0].size?.width}
      height={sheets[0].size?.height}
    />
  )
}

function ArtworkThumb({ title, options }: { title: string; options: Values }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const dimensions =
    formats[options.format as keyof typeof formats] ?? formats['Quadrado 1:1']
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
          title: options.title || title,
          body: options.body,
          date: '',
          background: options.background,
          foreground: options.foreground,
          font: options.font,
          composition: options.composition,
          callout: options.callout,
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
  const perPage = photoCount(options.perPage)
  const polaroid = options.polaroid === 'yes'
  const layout = photoLayout({
    orientation:
      options.orientation === 'horizontal' ? 'horizontal' : 'vertical',
    perPage,
    margin: Number(options.margin),
    crop: false,
    quality: 'standard',
    header: options.printedHeader === 'yes' ? options.title : undefined,
    numbering: options.printedNumbering === 'yes',
    polaroid,
  })
  return (
    <div
      className="school-album-thumb"
      style={{ aspectRatio: layout.pageWidth + '/' + layout.pageHeight }}
      role="img"
      aria-label="Exemplo de distribuição das fotografias"
    >
      {options.printedHeader === 'yes' && (
        <strong className="album-example-title">{options.title}</strong>
      )}
      {options.printedNumbering === 'yes' && (
        <small className="album-example-page">Folha 1</small>
      )}
      {Array.from({ length: perPage }, (_, index) => (
        <div
          key={index}
          className={polaroid ? 'polaroid-cell' : undefined}
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

const catalogPositions = new Map<string, { card: string; top: number }>()

function ClassroomCard({
  item,
  catalogUrl,
}: {
  item: ClassroomItem
  catalogUrl?: string
}) {
  const previewFrame = useRef<HTMLDivElement>(null)
  const [showThumb, setShowThumb] = useState(!catalogUrl)
  useEffect(() => {
    const frame = previewFrame.current
    if (!frame || showThumb) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setShowThumb(true)
        observer.disconnect()
      },
      { rootMargin: '180px' },
    )
    observer.observe(frame)
    return () => observer.disconnect()
  }, [showThumb])

  const count = item.ready
    ? (item.ready.pages ?? 1)
    : item.visual
      ? undefined
      : item.tool === 'painel'
        ? item.poster
          ? kitSheetCount(item, initialValues(item))
          : mosaicGeometry(item).tiles.length + 1
        : item.task
          ? item.task.mode === 'cards'
            ? 2
            : 1
          : undefined

  const targetUrl = item.visual
    ? '/app/criar/' + item.tool + '?colecao=' + item.id
    : '/app/colecao/' + item.id

  return (
    <article className="school-card">
      <Link
        id={'modelo-' + item.id}
        to={targetUrl}
        className="school-card-link catalog-restore"
        state={catalogUrl ? { catalogUrl } : undefined}
        onClick={(event) => {
          if (
            catalogUrl &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.shiftKey &&
            !event.altKey
          )
            catalogPositions.set(catalogUrl, {
              card: 'modelo-' + item.id,
              top: window.scrollY,
            })
        }}
      >
        <div
          className={
            'school-thumb' +
            (item.tool === 'painel' || item.planLayout === 'weekly'
              ? ' school-thumb-panel'
              : '')
          }
          aria-hidden="true"
          ref={previewFrame}
        >
          {showThumb && <PreviewThumb item={item} />}
        </div>
        <div className="school-card-body">
          <p className="school-card-meta">
            {item.age ?? tools[item.tool].shortName}
            {item.task
              ? activityUse(item) === 'guided'
                ? ' · Vivência guiada'
                : ' · Folha do aluno'
              : ''}
            {item.panel
              ? ' · ' + (item.panel.landscape ? 'Horizontal' : 'Vertical')
              : ''}
            {item.ready?.presentation ? ' · PPTX e PDF' : item.tool === 'postagem' ? ' · PNG' : ' · PDF'}
            {count ? ' · ' + count + (count === 1 ? ' folha' : ' folhas') : ''}
          </p>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
          <span className="school-card-action">
            {item.ready ? 'Pronto para imprimir' : 'Abrir e personalizar'}
          </span>
        </div>
      </Link>
    </article>
  )
}

export function CollectionShowcase() {
  return (
    <div className="school-showcase school-showcase-home">
      {featured.map((item) => (
        <ClassroomCard key={item.id} item={item} />
      ))}
    </div>
  )
}

export function activityUse(item: ClassroomItem) {
  return item.task?.mode === 'cards' || item.task?.mode === 'experience'
    ? 'guided'
    : 'student'
}

const normalized = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

export function ClassroomLibrary() {
  const [params, setParams] = useSearchParams()
  const archive = params.get('acervo') === 'pt-br'
  const kind = params.get('tipo') ?? ''
  const requestedTool = archive ? null : params.get('ferramenta')
  const tool =
    requestedTool && Object.hasOwn(tools, requestedTool)
      ? (requestedTool as Tool)
      : null
  const activityLibrary = tool === 'atividade'
  const purpose = params.get('uso') ?? ''
  const selectedSection = params.get('secao') ?? ''
  const choices = collectionSections.filter((section) => section.tool === tool)
  const location = useLocation()
  const navigation = useNavigationType()
  const pendingFilters = useRef(params)

  useEffect(() => {
    if (navigation === 'POP' || !location.state?.catalogFilter)
      pendingFilters.current = params
  }, [location.state, navigation, params])

  function setFilters(next: URLSearchParams, replace = false) {
    pendingFilters.current = next
    setParams(next, { replace, state: { catalogFilter: true } })
  }

  const catalogUrl = location.pathname + location.search
  const age = params.get('turma') ?? ''
  const mode = params.get('formato') ?? ''
  const query = params.get('q') ?? ''
  const orientation = params.get('orientacao') ?? ''
  const searchInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchInput.current && document.activeElement !== searchInput.current)
      searchInput.current.value = query
  }, [query])

  function filter(name: string, value: string, replace = false) {
    const next = new URLSearchParams(pendingFilters.current)
    if (name !== 'pagina') next.delete('pagina')
    if (value) next.set(name, value)
    else next.delete(name)
    setFilters(next, replace)
  }

  function selectTool(nextTool: string) {
    const next = new URLSearchParams(pendingFilters.current)
    next.delete('secao')
    next.delete('uso')
    next.delete('orientacao')
    if (nextTool) next.set('ferramenta', nextTool)
    else next.delete('ferramenta')
    setFilters(next)
  }

  useEffect(() => {
    const saved = catalogPositions.get(catalogUrl)
    if (!saved) return
    const frame = requestAnimationFrame(() => {
      catalogPositions.delete(catalogUrl)
      document.getElementById(saved.card)?.focus({ preventScroll: true })
      window.scrollTo(0, saved.top)
    })
    return () => cancelAnimationFrame(frame)
  }, [catalogUrl])

  const search = normalized(query.trim())
  const results = (archive ? sortedArchive : classroom).filter(
    (item) =>
      (archive ? !kind || (item.archiveType ?? item.category) === kind : !addedArchiveIds.has(item.id)) &&
      (!tool || item.tool === tool) &&
      (!tool ||
        !choices.some((section) => section.id === selectedSection) ||
        sectionFor(item) === selectedSection) &&
      (!activityLibrary || !purpose || activityUse(item) === purpose) &&
      (!age || item.age === age || (!item.age && item.tool !== 'atividade')) &&
      (!mode || (mode === 'pronto' ? !!item.ready : !item.ready)) &&
      (!orientation ||
        (item.tool === 'painel' &&
          !item.poster &&
          (item.panel?.landscape ? 'horizontal' : 'vertical') ===
            orientation)) &&
      normalized(
        [
          item.title,
          item.category,
          item.archiveType,
          tools[item.tool].name,
          item.age,
          item.description,
        ]
          .filter(Boolean)
          .join(' '),
      ).includes(search),
  )

  const totalPages = Math.max(1, Math.ceil(results.length / archivePageSize))
  const requestedPage = Number(params.get('pagina'))
  const currentPage =
    Number.isInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, totalPages)
      : 1
  const listedItems = archive
    ? results.slice((currentPage - 1) * archivePageSize, currentPage * archivePageSize)
    : results

  return (
    <div className="school-library">
      <div className="school-section-head">
        <div>
          <h1>{archive ? 'Acervo em português' : tool ? tools[tool].name : 'Modelos da coleção'}</h1>
          <p>
            {archive
              ? 'Fichas, cartazes e certificados para baixar, do Berçário ao Pré II.'
              : tool
              ? tools[tool].description
              : 'Escolha uma ferramenta abaixo ou filtre pela turma para personalizar e baixar.'}
          </p>
        </div>
      </div>

      {archive ? (
        <Link className="button secondary" to="/app/colecao">Voltar à coleção</Link>
      ) : (
        <>
          <Link className="button secondary" to="/app/colecao?acervo=pt-br">Acervo em português</Link>
          <ClassroomTabs selected={tool ?? ''} choose={selectTool} />
        </>
      )}

      {tool && !activityLibrary && choices.length > 1 && (
        <label className="school-section-filter">
          Seção da ferramenta
          <select
            value={selectedSection}
            onChange={(event) => {
              const next = new URLSearchParams(pendingFilters.current)
              if (event.target.value === 'kits') next.delete('orientacao')
              if (event.target.value) next.set('secao', event.target.value)
              else next.delete('secao')
              setFilters(next)
            }}
          >
            <option value="">Todas as seções</option>
            {choices.map((choice) => (
              <option key={choice.id} value={choice.id}>
                {choice.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {activityLibrary && (
        <div
          className="activity-purpose"
          role="group"
          aria-label="Como a atividade será usada"
        >
          {[
            ['', 'Todas', 'Mostra fichas, traçados e roteiros.'],
            [
              'student',
              'Folhas para os alunos',
              'A criança recebe uma folha com espaço para responder.',
            ],
            [
              'guided',
              'Para fazer com os alunos',
              'A professora conduz a vivência ou usa cartões na roda.',
            ],
          ].map(([id, label, description]) => (
            <button
              type="button"
              key={label}
              className="secondary"
              aria-pressed={purpose === id}
              onClick={() => filter('uso', id)}
            >
              <strong>{label}</strong>
              <span>{description}</span>
            </button>
          ))}
        </div>
      )}

      {tool === 'atividade' && purpose !== 'guided' && (
        <div className="actions">
          <Link className="button" to="/app/colecao/criar-contagem">
            Montar ficha de contagem
          </Link>
          <Link className="button secondary" to="/app/colecao/criar-pares">
            Montar ficha de pareamento
          </Link>
          <Link className="button secondary" to="/app/colecao/criar-tracado">
            Montar ficha de traçado
          </Link>
        </div>
      )}

      {tool === 'documento' && (
        <nav className="actions" aria-label="Ferramentas de documentos">
          <Link className="button" to="/app/editar-word">
            Editar um Word existente (.docx)
          </Link>
          <Link className="button secondary" to="/app/responder?tipo=pdf">
            Responder no PDF
          </Link>
        </nav>
      )}

      {tool && ['postagem', 'painel', 'fotos-em-pdf'].includes(tool) && (
        <div className="actions">
          <Link className="button" to={'/app/criar/' + tool}>
            {tool === 'painel'
              ? 'Dividir minha imagem em folhas A4'
              : tool === 'postagem'
                ? 'Criar arte do zero'
                : 'Abrir montador de fotos agora'}
          </Link>
        </div>
      )}

      <div className="school-filters" id="modelos-da-ferramenta" tabIndex={-1}>
        <label>
          Buscar na coleção
          <span>
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              placeholder="Ex.: traçado, recado, semanal ou polaroid"
              ref={searchInput}
              defaultValue={query}
              onChange={(e) => filter('q', e.target.value, true)}
            />
          </span>
        </label>
        <label>
          Turma
          <select value={age} onChange={(e) => filter('turma', e.target.value)}>
            <option value="">Todas</option>
            {ageBands.map((band) => (
              <option key={band}>{band}</option>
            ))}
          </select>
        </label>
        {archive && (
          <label>
            Tipo de material
            <select value={kind} onChange={(event) => filter('tipo', event.target.value)}>
              <option value="">Todos</option>
              {archiveTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
        )}
        {!archive && <label>
          Formato
          <select
            value={mode}
            onChange={(e) => filter('formato', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="editavel">Personalizável</option>
            <option value="pronto">Pronto para imprimir</option>
          </select>
        </label>}
        {tool === 'painel' && selectedSection !== 'kits' && (
          <label>
            Painel montado
            <select
              value={orientation}
              onChange={(event) => filter('orientacao', event.target.value)}
            >
              <option value="">Todas as orientações</option>
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
            </select>
          </label>
        )}
      </div>

      <p className="school-result" role="status">
        {results.length}{' '}
        {results.length === 1 ? 'material encontrado' : 'materiais encontrados'}
      </p>

      {(archive
        ? ageBands.map((band) => [band, band])
        : activityLibrary
        ? [
            ['student', 'Folhas para os alunos'],
            ['guided', 'Para fazer com os alunos'],
          ]
        : [['', '']]
      ).map(([kind, label]) => {
        const items = archive
          ? listedItems.filter((item) => item.age === kind)
          : kind
          ? listedItems.filter((item) => activityUse(item) === kind)
          : listedItems
        if (!items.length) return null
        return (
          <section className="school-results-group" key={kind}>
            {label && <h2>{label}</h2>}
            <div className="school-showcase">
              {items.map((item) => (
                <ClassroomCard
                  key={item.id}
                  item={item}
                  catalogUrl={catalogUrl}
                />
              ))}
            </div>
          </section>
        )
      })}

      {archive && totalPages > 1 && (
        <nav className="actions" aria-label="Páginas do acervo">
          <button type="button" className="secondary" disabled={currentPage === 1}
            onClick={() => filter('pagina', String(currentPage - 1))}>
            Anterior
          </button>
          <span role="status">Página {currentPage} de {totalPages}</span>
          <button type="button" className="secondary" disabled={currentPage === totalPages}
            onClick={() => filter('pagina', String(currentPage + 1))}>
            Próxima
          </button>
        </nav>
      )}
      {!results.length && (
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setFilters(new URLSearchParams(archive ? { acervo: 'pt-br' } : tool ? { ferramenta: tool } : {}))
          }}
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}
