import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Copy, Download, Printer } from 'lucide-react'
import { tools } from './catalog'
import {
  a4Points,
  blobOf,
  drawArt,
  formats,
  imageFromFile,
  openImage,
  panelMargin,
  photoCount,
  photoLayout,
  photoLimit,
  photoPages,
  photoThumbnail,
  postPalettes,
  rotatePhoto,
  tiles,
  type ArtOptions,
  type Photo,
  type PhotoOptions,
} from './media'
import { newId, type Values } from './store'
import {
  download,
  filename,
  printBlob,
  useWorkflow,
  type EditorProps,
} from './workflow'
import { AdjustLayout, FileDrop, PreviewFeedback } from './editor-ui'
import { figures, figureUrl } from './art-figures'
import { loadSchoolProfile } from './school-profile'

type Flow = ReturnType<typeof useWorkflow>

const formatNames = Object.keys(formats) as (keyof typeof formats)[]
const fontOptions = ['Bricolage Grotesque', 'Noto Sans', 'Georgia']

const albumPresets = [
  {
    id: 'album-portifolio',
    label: '1 foto grande',
    values: { orientation: 'vertical', perPage: '1', margin: '15', polaroid: 'no', crop: 'no' },
  },
  {
    id: 'album-passeio',
    label: '2 fotos lado a lado',
    values: { orientation: 'horizontal', perPage: '2', margin: '10', polaroid: 'no', crop: 'no' },
  },
  {
    id: 'album-sequencia',
    label: 'Sequência de 3',
    values: { orientation: 'vertical', perPage: '3', margin: '10', polaroid: 'no', crop: 'no' },
  },
  {
    id: 'album-rotina',
    label: '4 fotos (mural)',
    values: { orientation: 'vertical', perPage: '4', margin: '10', polaroid: 'no', crop: 'no' },
  },
  {
    id: 'album-polaroid',
    label: 'Estilo Polaroid',
    values: { orientation: 'vertical', perPage: '4', margin: '10', polaroid: 'yes', crop: 'yes' },
  },
] as const

const photoDefaults: Values = {
  title: 'Fotos da turma',
  orientation: 'vertical',
  perPage: '4',
  margin: '10',
  crop: 'no',
  quality: 'standard',
  printedHeader: 'yes',
  printedNumbering: 'yes',
  albumSubtitle: '',
  polaroid: 'no',
  headerColor: '#1E5643',
}

function dateLabel(date?: string) {
  const clean = date?.trim() ?? ''
  if (!clean) return ''
  return /^\d{4}-\d\d-\d\d$/.test(clean)
    ? clean.split('-').reverse().join('/')
    : clean
}

function Frame({
  tool,
  flow,
  busy,
  children,
}: {
  tool: EditorProps['tool']
  flow: Flow
  busy: string
  children: ReactNode
}) {
  return (
    <div className="school-editor">
      <div className="school-section-head">
        <div>
          <h1>{tools[tool].name}</h1>
          <p>{tools[tool].description}</p>
        </div>
      </div>
      <div className="card editor-card">
        <p role="status">{busy || flow.message}</p>
        {flow.error && (
          <p role="alert" className="error">
            {flow.error}
          </p>
        )}
        {children}
      </div>
    </div>
  )
}

function TextField({
  flow,
  label,
  id,
  type = 'text',
}: {
  flow: Flow
  label: string
  id: string
  type?: string
}) {
  return (
    <label>
      {label}
      {type === 'textarea' ? (
        <textarea
          data-art-field={id}
          value={flow.values[id] || ''}
          maxLength={450}
          rows={3}
          onChange={(e) => flow.set(id, e.target.value)}
        />
      ) : (
        <input
          data-art-field={id}
          type={type}
          value={flow.values[id] || ''}
          maxLength={120}
          onChange={(e) => flow.set(id, e.target.value)}
        />
      )}
    </label>
  )
}

function Choice({
  flow,
  label,
  id,
  options,
}: {
  flow: Flow
  label: string
  id: string
  options: [string, string][]
}) {
  return (
    <label>
      {label}
      <select
        value={flow.values[id] ?? options[0]?.[0] ?? ''}
        onChange={(e) => flow.set(id, e.target.value)}
      >
        {options.map(([value, name]) => (
          <option key={value} value={value}>
            {name}
          </option>
        ))}
      </select>
    </label>
  )
}

const pairs = (options: readonly string[]): [string, string][] =>
  options.map((v) => [v, v])

function Photos(props: EditorProps) {
  const flow = useWorkflow(props, () => ({
    ...photoDefaults,
    ...(props.preset?.values ?? {}),
  }))
  const [photos, setPhotos] = useState<Photo[]>([])
  const [busy, setBusy] = useState('')
  const urls = useRef(new Set<string>())
  const alive = useRef(true)

  useEffect(() => {
    const current = urls.current
    alive.current = true
    return () => {
      alive.current = false
      current.forEach((url) => URL.revokeObjectURL(url))
      current.clear()
    }
  }, [])

  const { values, replace, save, setDirty, setError, setMessage } = flow
  const options: PhotoOptions = {
    orientation:
      values.orientation === 'horizontal' ? 'horizontal' : 'vertical',
    perPage: photoCount(values.perPage),
    margin: [5, 10, 15, 20].includes(Number(values.margin))
      ? Number(values.margin)
      : 10,
    crop: values.crop === 'yes',
    quality: values.quality === 'high' ? 'high' : 'standard',
    header: values.printedHeader === 'yes' ? values.title : undefined,
    subtitle: values.albumSubtitle,
    numbering: values.printedNumbering === 'yes',
    polaroid: values.polaroid === 'yes',
    headerColor: values.headerColor || '#1E5643',
  }
  const layout = photoLayout(options)
  const sheets = photoPages(photos, options.perPage)

  async function add(files: File[]) {
    if (!files.length || busy) return
    setError('')
    setMessage('')
    setBusy('Abrindo fotos…')
    const room = photoLimit - photos.length
    const next: Photo[] = []
    const failures: string[] = []
    if (files.length > room)
      failures.push('Adicione até ' + photoLimit + ' fotos por material.')
    for (const [i, file] of files.slice(0, room).entries()) {
      setBusy(
        'Abrindo foto ' + (i + 1) + ' de ' + Math.min(room, files.length) + '…',
      )
      try {
        const blob = await imageFromFile(file, 2048)
        if (!alive.current) return
        const url = URL.createObjectURL(blob)
        urls.current.add(url)
        let thumb: string | undefined
        try {
          const small = await photoThumbnail(url)
          if (!alive.current) return
          thumb = URL.createObjectURL(small)
          urls.current.add(thumb)
        } catch {
          /* fallback to resized image */
        }
        next.push({ id: newId(), url, thumb, blob, caption: '' })
      } catch (e) {
        failures.push(
          e instanceof Error
            ? e.message
            : 'Não foi possível abrir uma das fotos.',
        )
      }
    }
    if (next.length) {
      setPhotos((old) => [...old, ...next])
      setDirty(true)
    }
    if (failures.length) setError([...new Set(failures)].join(' '))
    setBusy('')
  }

  function move(index: number, delta: number) {
    setPhotos((items) => {
      const next = [...items]
      ;[next[index], next[index + delta]] = [next[index + delta], next[index]]
      return next
    })
    setDirty(true)
  }

  function updatePhoto(photo: Photo, changes: Partial<Photo>) {
    setPhotos((items) =>
      items.map((item) =>
        item.id === photo.id ? { ...item, ...changes } : item,
      ),
    )
    setDirty(true)
  }

  async function turn(photo: Photo) {
    setBusy('Girando foto…')
    try {
      const blob = await rotatePhoto(photo.url)
      if (!alive.current) return
      const url = URL.createObjectURL(blob)
      urls.current.add(url)
      urls.current.delete(photo.url)
      URL.revokeObjectURL(photo.url)
      if (photo.thumb) {
        urls.current.delete(photo.thumb)
        URL.revokeObjectURL(photo.thumb)
      }
      updatePhoto(photo, { blob, url, thumb: undefined, cropX: 50, cropY: 50 })
    } catch {
      setError('Não foi possível girar esta foto.')
    } finally {
      setBusy('')
    }
  }

  function remove(photo: Photo) {
    if (photo.thumb) {
      urls.current.delete(photo.thumb)
      URL.revokeObjectURL(photo.thumb)
    }
    URL.revokeObjectURL(photo.url)
    urls.current.delete(photo.url)
    setPhotos((items) => items.filter((p) => p.id !== photo.id))
    setDirty(true)
  }

  async function output(print: boolean) {
    if (!photos.length) return
    setError('')
    setMessage('')
    setBusy('Preparando PDF…')
    try {
      const { photosPdf } = await import('./visual-pdf')
      const blob = await photosPdf(photos, options, (done) =>
        setBusy('Preparando foto ' + done + ' de ' + photos.length + '…'),
      )
      if (print) printBlob(blob)
      else download(blob, filename(values.title) + '.pdf')
      setMessage(
        print
          ? 'PDF preparado para impressão.'
          : 'PDF pronto. Confira a pasta de downloads.',
      )
    } catch {
      setError(
        'Não foi possível gerar o PDF. Tente diminuir a qualidade ou usar menos fotos.',
      )
    } finally {
      setBusy('')
    }
  }

  const preview = (
    <div className="school-preview">
      <PreviewFeedback revision={JSON.stringify(values) + photos.length} />
      {photos.length === 0 ? (
        <div className="empty-preview-box">
          <strong>Prévia das folhas A4</strong>
          <p>
            Envie suas fotos na etapa Preencher para ver a distribuição em tempo
            real ({options.perPage} por folha
            {options.polaroid ? ' · estilo Polaroid' : ''}).
          </p>
        </div>
      ) : (
        <>
          <p>
            {sheets.length} {sheets.length === 1 ? 'folha A4' : 'folhas A4'} ·{' '}
            {options.polaroid
              ? 'Moldura Polaroid'
              : options.crop
                ? 'Preenchimento com recorte'
                : 'Foto inteira'}
          </p>
          <div className="sheets">
            {sheets.map((sheet, i) => (
              <div key={i}>
                <p>Folha {i + 1}</p>
                <div
                  className={
                    'photo-sheet' + (options.polaroid ? ' photo-sheet-polaroid' : '')
                  }
                  style={{
                    aspectRatio: layout.pageWidth + '/' + layout.pageHeight,
                  }}
                >
                  {options.header?.trim() && (
                    <div
                      className="photo-print-header"
                      style={{
                        top: (100 * layout.margin) / layout.pageHeight + '%',
                        insetInline: (100 * layout.margin) / layout.pageWidth + '%',
                        color: options.headerColor,
                      }}
                    >
                      <strong>{options.header}</strong>
                      {options.subtitle && <span>{options.subtitle}</span>}
                    </div>
                  )}
                  {options.numbering && (
                    <small
                      className="photo-print-number"
                      style={{
                        bottom: (100 * layout.margin) / layout.pageHeight + '%',
                        right: (100 * layout.margin) / layout.pageWidth + '%',
                        color: options.headerColor,
                      }}
                    >
                      Folha {i + 1} de {sheets.length}
                    </small>
                  )}
                  {sheet.map((p, index) => (
                    <figure
                      key={p.id}
                      className={options.polaroid ? 'polaroid-cell' : undefined}
                      style={{
                        left: (100 * layout.x(index)) / layout.pageWidth + '%',
                        top: (100 * layout.y(index)) / layout.pageHeight + '%',
                        width: (100 * layout.width) / layout.pageWidth + '%',
                        height: (100 * layout.height) / layout.pageHeight + '%',
                      }}
                    >
                      <img
                        src={p.url}
                        alt={'Foto ' + (photos.indexOf(p) + 1)}
                        style={{
                          objectFit: options.crop ? 'cover' : 'contain',
                          objectPosition:
                            (p.cropX ?? 50) + '% ' + (p.cropY ?? 50) + '%',
                        }}
                      />
                      {p.caption && <figcaption>{p.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
                {options.crop && (
                  <details className="photo-position">
                    <summary>Ajustar recorte da folha {i + 1}</summary>
                    {sheet.map((photo) => {
                      const number = photos.indexOf(photo) + 1
                      return (
                        <fieldset key={photo.id}>
                          <legend>Foto {number}</legend>
                          <label>
                            Posição horizontal
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={photo.cropX ?? 50}
                              onChange={(event) =>
                                updatePhoto(photo, {
                                  cropX: Number(event.target.value),
                                })
                              }
                            />
                          </label>
                          <label>
                            Posição vertical
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={photo.cropY ?? 50}
                              onChange={(event) =>
                                updatePhoto(photo, {
                                  cropY: Number(event.target.value),
                                })
                              }
                            />
                          </label>
                        </fieldset>
                      )
                    })}
                  </details>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )

  const form = (
    <div className="school-form">
      <div className="chip-grid" role="group" aria-label="Estilos prontos de álbum">
        {albumPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="secondary bncc-chip"
            aria-pressed={values.collectionId === preset.id}
            onClick={() =>
              replace({
                ...values,
                ...preset.values,
                collectionId: preset.id,
              })
            }
          >
            {preset.label}
          </button>
        ))}
      </div>

      <FileDrop
        label="Selecionar fotos"
        instructions="Arraste fotos JPG, PNG ou WebP ou toque para escolher. Até 24 arquivos."
        accept=".jpg,.jpeg,.png,.webp"
        multiple
        disabled={Boolean(busy)}
        onFiles={(files) => void add(files)}
      />

      <p>
        {photos.length} de {photoLimit} fotos selecionadas.
      </p>

      <div className="actions">
        <button
          type="button"
          className="secondary"
          onClick={() => {
            const p = loadSchoolProfile()
            if (!p.school && !p.classroom) {
              setMessage('Cadastre os dados da escola no painel inicial para preencher aqui.')
              return
            }
            replace({
              ...values,
              title: p.school ? `${p.school} · Fotos` : values.title,
              albumSubtitle: p.classroom || values.albumSubtitle,
            })
            setMessage('Dados da escola aplicados ao álbum.')
          }}
        >
          Preencher com minha escola
        </button>
      </div>

      <div className="form-grid">
        <TextField flow={flow} label="Título do álbum" id="title" />
        <TextField flow={flow} label="Turma ou subtítulo" id="albumSubtitle" />
        <Choice
          flow={flow}
          label="Orientação do A4"
          id="orientation"
          options={[
            ['vertical', 'Vertical'],
            ['horizontal', 'Horizontal'],
          ]}
        />
        <Choice
          flow={flow}
          label="Fotos por folha"
          id="perPage"
          options={pairs(['1', '2', '3', '4'])}
        />
        <Choice
          flow={flow}
          label="Estilo da moldura"
          id="polaroid"
          options={[
            ['no', 'Limpo (sem moldura)'],
            ['yes', 'Polaroid com moldura branca'],
          ]}
        />
        <Choice
          flow={flow}
          label="Encaixe das fotos"
          id="crop"
          options={[
            ['no', 'Mostrar foto inteira'],
            ['yes', 'Preencher e ajustar recorte'],
          ]}
        />
        <details className="wide">
          <summary>Cabeçalho, numeração, margens e qualidade</summary>
          <div className="form-grid">
            <Choice
              flow={flow}
              label="Título na folha"
              id="printedHeader"
              options={[
                ['yes', 'Mostrar em todas as folhas'],
                ['no', 'Ocultar'],
              ]}
            />
            <Choice
              flow={flow}
              label="Numeração das folhas"
              id="printedNumbering"
              options={[
                ['yes', 'Mostrar'],
                ['no', 'Ocultar'],
              ]}
            />
            <TextField
              flow={flow}
              label="Cor do cabeçalho"
              id="headerColor"
              type="color"
            />
            <Choice
              flow={flow}
              label="Margens"
              id="margin"
              options={['5', '10', '15', '20'].map((v) => [v, v + ' mm'])}
            />
            <Choice
              flow={flow}
              label="Qualidade"
              id="quality"
              options={[
                ['standard', 'Padrão'],
                ['high', 'Alta para impressão'],
              ]}
            />
          </div>
        </details>
      </div>

      <div className="thumbs">
        {photos.map((p, i) => (
          <article className="card" key={p.id}>
            <strong>Foto {i + 1}</strong>
            <img
              src={p.thumb ?? p.url}
              alt={'Foto ' + (i + 1)}
              loading="lazy"
            />
            <div className="actions">
              <button
                type="button"
                className="secondary"
                aria-label={'Subir foto ' + (i + 1)}
                disabled={i === 0 || Boolean(busy)}
                onClick={() => move(i, -1)}
              >
                Subir
              </button>
              <button
                type="button"
                className="secondary"
                aria-label={'Descer foto ' + (i + 1)}
                disabled={i === photos.length - 1 || Boolean(busy)}
                onClick={() => move(i, 1)}
              >
                Descer
              </button>
              <button
                type="button"
                className="secondary"
                disabled={Boolean(busy)}
                onClick={() => void turn(p)}
                aria-label={'Girar foto ' + (i + 1)}
              >
                Girar
              </button>
              <button
                type="button"
                className="secondary"
                aria-label={'Excluir foto ' + (i + 1)}
                disabled={Boolean(busy)}
                onClick={() => remove(p)}
              >
                Excluir
              </button>
            </div>
            {i > 0 && (
              <label className="check">
                <input
                  type="checkbox"
                  checked={Boolean(p.breakBefore)}
                  onChange={(event) =>
                    updatePhoto(p, { breakBefore: event.target.checked })
                  }
                />
                Começar nova folha antes da foto {i + 1}
              </label>
            )}
            <label>
              Legenda da foto {i + 1}
              <input
                maxLength={100}
                value={p.caption}
                onChange={(e) => updatePhoto(p, { caption: e.target.value })}
              />
            </label>
          </article>
        ))}
      </div>
    </div>
  )

  if (flow.loading) return <p role="status">Abrindo rascunho…</p>
  if (flow.unavailable) return <p role="alert">{flow.error}</p>

  return (
    <Frame tool={props.tool} flow={flow} busy={busy}>
      <AdjustLayout form={form} preview={preview} catalogUrl="/app/colecao?ferramenta=fotos-em-pdf" />
      <div className="actions pinned-action">
        <button
          type="button"
          disabled={!photos.length || Boolean(busy)}
          onClick={() => void output(false)}
        >
          <Download size={17} aria-hidden="true" /> Baixar PDF
        </button>
        <button
          type="button"
          className="secondary"
          disabled={!photos.length || Boolean(busy)}
          onClick={() => void output(true)}
        >
          <Printer size={17} aria-hidden="true" /> Imprimir
        </button>
        <button
          type="button"
          className="secondary"
          disabled={Boolean(busy)}
          onClick={() => void save(true)}
        >
          Salvar rascunho
        </button>
      </div>
    </Frame>
  )
}

const postDefaults: Values = {
  title: 'Mostra de experiências',
  body: 'Venha conhecer o que as crianças pesquisaram, criaram e prepararam para compartilhar com as famílias.',
  date: '',
  background: '#FFF7DF',
  foreground: '#5C3C0A',
  font: 'Bricolage Grotesque',
  format: 'Vertical 4:5',
  composition: 'convite',
  callout: 'Esperamos sua família!',
  figure: 'oficina-sol',
  artCrop: 'no',
  caption: '',
}

const panelDefaults: Values = {
  title: 'Meu painel em mosaico A4',
  body: 'Arte ampliada para montar com folhas A4.',
  date: '',
  background: '#E8F2EC',
  foreground: '#1E5643',
  font: 'Bricolage Grotesque',
  grid: '2',
  columns: '2',
  rows: '2',
  composition: 'imagem',
  panelGuide: 'yes',
  artCrop: 'no',
}

function Art(props: EditorProps) {
  const panel = props.tool === 'painel'
  const flow = useWorkflow(props, () => ({
    ...(panel ? panelDefaults : postDefaults),
    ...(props.preset?.values ?? {}),
  }))
  const [busy, setBusy] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null)
  const ref = useRef<HTMLCanvasElement | null>(null)
  const tileRefs = useRef<(HTMLCanvasElement | null)[]>([])
  const { values, replace, setDirty, setError, setMessage } = flow
  const [previous, setPrevious] = useState<Values | null>(null)
  const [tightField, setTightField] = useState<'title' | 'date' | 'body' | 'callout' | null>(null)
  const fieldLabels = { title: 'Título', date: 'Data', body: 'Mensagem', callout: 'Destaque' }
  const [showSafeArea, setShowSafeArea] = useState(false)
  const [ornament, setOrnament] = useState<{
    url: string
    image: HTMLImageElement
  }>()
  const ornamentUrl = figureUrl(values.figure ?? '')

  const safeGrid = (value: string) =>
    ['1', '2', '3', '4'].includes(value) ? Number(value) : 2
  const grid = safeGrid(values.grid)
  const columns = values.grid === 'custom' ? safeGrid(values.columns) : grid
  const rows = values.grid === 'custom' ? safeGrid(values.rows) : grid
  const geometry = tiles(columns, rows)
  const paperRatio = (a4Points[0] - panelMargin * 2) / geometry.size.width
  const cm = (pixels: number) =>
    ((pixels * paperRatio * 2.54) / 72).toLocaleString('pt-BR', {
      maximumFractionDigits: 1,
    })

  const chooseArt = (next: Values) => {
    setPrevious(values)
    replace(next)
  }
  const updateArt = (key: string, value: string) =>
    chooseArt({ ...values, [key]: value })
  const artFlow = { ...flow, set: updateArt }

  const dimensions = Object.hasOwn(formats, values.format)
    ? formats[values.format as keyof typeof formats]
    : formats['Quadrado 1:1']

  const panelMissingPhoto = panel && values.composition === 'imagem' && !photo

  const settings: ArtOptions = {
    title: values.title,
    body: values.body,
    date: dateLabel(values.date),
    background: values.background || '#E8F2EC',
    foreground: values.foreground || '#1E5643',
    font: values.font || 'Bricolage Grotesque',
    align: values.align === 'center' ? 'center' : 'left',
  }

  useEffect(() => {
    if (!ornamentUrl) return
    let active = true
    void openImage(ornamentUrl)
      .then((image) => {
        if (active) setOrnament({ url: ornamentUrl, image })
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar a figura.')
      })
    return () => {
      active = false
    }
  }, [ornamentUrl, setError])

  useEffect(() => {
    if (!ref.current) return
    const target = ref.current
    const width = panel ? geometry.width : dimensions[0]
    const height = panel ? geometry.height : dimensions[1]
    target.width = width
    target.height = height
    setTightField(
      drawArt(
        target,
        {
          title: values.title,
          body: values.body,
          date: dateLabel(values.date),
          background: values.background || '#E8F2EC',
          foreground: values.foreground || '#1E5643',
          font: values.font || 'Bricolage Grotesque',
          crop: values.artCrop === 'yes',
          composition: values.composition,
          callout: values.callout,
          align: values.align === 'center' ? 'center' : undefined,
        },
        photo,
        panel,
        ornament && ornamentUrl === ornament.url ? ornament.image : undefined,
      ),
    )
    if (panel) {
      tiles(columns, rows).positions.forEach((position, index) => {
        const tile = tileRefs.current[index]
        tile
          ?.getContext('2d')
          ?.drawImage(
            target,
            position.x,
            position.y,
            geometry.size.width,
            geometry.size.height,
            0,
            0,
            tile.width,
            tile.height,
          )
      })
    }
  }, [
    values,
    photo,
    panel,
    geometry.width,
    geometry.height,
    geometry.size.width,
    geometry.size.height,
    dimensions,
    columns,
    rows,
    ornament,
    ornamentUrl,
  ])

  useEffect(
    () => () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl)
    },
    [photoUrl],
  )

  async function readFile(file?: File) {
    if (!file) return
    setBusy('Abrindo imagem…')
    setError('')
    let url = ''
    try {
      url = URL.createObjectURL(await imageFromFile(file, panel ? 4000 : 1500))
      const img = new Image()
      img.src = url
      await img.decode()
      setPhotoUrl(url)
      setPhoto(img)
      setDirty(true)
    } catch (e) {
      if (url) URL.revokeObjectURL(url)
      setError(
        e instanceof Error ? e.message : 'Não foi possível abrir esta imagem.',
      )
    } finally {
      setBusy('')
    }
  }

  async function output(print = false) {
    if (panel && values.composition === 'imagem' && !photo) {
      setError('Adicione a imagem do painel antes de preparar o PDF.')
      return
    }
    if (tightField) {
      const editor = ref.current?.closest('.school-editor')
      editor?.querySelector<HTMLButtonElement>('.preview-switch button')?.click()
      setError('Encurte o campo ' + fieldLabels[tightField] + ' para baixar o arquivo.')
      requestAnimationFrame(() => editor?.querySelector<HTMLElement>('[data-art-field="' + tightField + '"]')?.focus())
      return
    }
    setBusy('Preparando arquivo…')
    setError('')
    setMessage('')
    const target = ref.current
    if (!target) {
      setBusy('')
      return
    }
    try {
      const blob = panel
        ? await (
            await import('./visual-pdf')
          ).panelPdf(
            target,
            columns,
            rows,
            values.panelGuide === 'yes',
            values.title,
          )
        : await blobOf(target)
      if (print) printBlob(blob)
      else download(blob, filename(values.title) + (panel ? '.pdf' : '.png'))
      setMessage(
        print
          ? 'Painel preparado para impressão.'
          : 'Arquivo pronto. Confira a pasta de downloads.',
      )
    } catch {
      setError('Não foi possível gerar o arquivo. Tente novamente.')
    } finally {
      setBusy('')
    }
  }

  async function copy() {
    const text =
      values.caption ||
      [values.title, settings.date, values.body, values.callout]
        .filter(Boolean)
        .join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setMessage('Legenda copiada.')
    } catch {
      const field = document.querySelector<HTMLTextAreaElement>('#caption-copy')
      if (field) {
        field.closest('details')?.setAttribute('open', '')
        field.focus()
        field.select()
      }
      setError(
        'Use a opção Copiar do seu dispositivo para copiar o texto selecionado.',
      )
    }
  }

  if (flow.loading) return <p role="status">Abrindo rascunho…</p>
  if (flow.unavailable) return <p role="alert">{flow.error}</p>

  const previewArt = (
    <div className="school-preview">
      <PreviewFeedback revision={JSON.stringify(values) + Boolean(photo)} />
      {panelMissingPhoto && (
        <div className="empty-preview-box">
          <strong>Prévia do painel em folhas A4</strong>
          <p>
            Envie uma foto ou arte acima para ver como ela será dividida nas{' '}
            {geometry.positions.length} folhas A4 com marcas de recorte e colagem.
          </p>
        </div>
      )}
      <div className="art-canvas-frame" hidden={panelMissingPhoto}>
        <canvas
          ref={ref}
          className="art-preview"
          aria-label={'Prévia de ' + values.title}
          role="img"
        />
        {!panel && showSafeArea && (
          <span
            className="art-safe-area"
            aria-hidden="true"
            style={{
              inset:
                (9.5 * Math.min(...dimensions)) / dimensions[1] +
                '% ' +
                (9.5 * Math.min(...dimensions)) / dimensions[0] +
                '%',
            }}
          />
        )}
      </div>
      {tightField && (
        <p role="status" className="school-warning">
          O campo {fieldLabels[tightField]} ultrapassa o espaço disponível.
        </p>
      )}
      {!panel && (
        <div className="actions">
          <button
            type="button"
            className="secondary"
            aria-pressed={showSafeArea}
            onClick={() => setShowSafeArea(!showSafeArea)}
          >
            Área segura
          </button>
        </div>
      )}
      {panel && (
        <div className="panel-slice-info">
          <p>
            <strong>{geometry.positions.length} folhas A4</strong> ·{' '}
            {cm(geometry.width)} × {cm(geometry.height)} cm · sobreposição de{' '}
            {cm(16)} cm
          </p>
          <div className="sheets">
            {geometry.positions.map((_, i) => (
              <div key={i}>
                <small>Folha {i + 1}</small>
                <canvas
                  className="tile"
                  aria-label={'Prévia da folha ' + (i + 1)}
                  role="img"
                  width={144}
                  height={203}
                  ref={(target) => {
                    tileRefs.current[i] = target
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const form = (
    <div className="school-form">
      {!panel && (
        <details className="wide art-palettes">
          <summary>Paleta de cores</summary>
          <div className="theme-swatches">
            {postPalettes.map((palette) => (
              <button
                key={palette.id}
                type="button"
                className="secondary theme-chip"
                aria-pressed={
                  values.background === palette.background &&
                  values.foreground === palette.foreground
                }
                onClick={() =>
                  chooseArt({
                    ...values,
                    background: palette.background,
                    foreground: palette.foreground,
                  })
                }
              >
                <span
                  className="theme-dot"
                  style={{
                    backgroundColor: palette.background,
                    borderColor: palette.foreground,
                  }}
                  aria-hidden="true"
                />
                {palette.label}
              </button>
            ))}
          </div>
        </details>
      )}

      <div className="form-grid">
        <TextField flow={artFlow} label="Título" id="title" />

        {panel ? (
          <>
            <Choice
              flow={artFlow}
              label="Grade de folhas A4"
              id="grid"
              options={[
                ['2', '2 × 2 · 4 folhas'],
                ['3', '3 × 3 · 9 folhas'],
                ['custom', 'Escolher colunas e linhas'],
              ]}
            />
            {values.grid === 'custom' && (
              <>
                <Choice
                  flow={artFlow}
                  label="Colunas"
                  id="columns"
                  options={pairs(['1', '2', '3', '4'])}
                />
                <Choice
                  flow={artFlow}
                  label="Linhas"
                  id="rows"
                  options={pairs(['1', '2', '3', '4'])}
                />
              </>
            )}
            <Choice
              flow={artFlow}
              label="Conteúdo do painel"
              id="composition"
              options={[
                ['imagem', 'Minha imagem inteira'],
                ['texto', 'Cartaz com texto e figura'],
              ]}
            />
            <Choice
              flow={artFlow}
              label="Guia de montagem no PDF"
              id="panelGuide"
              options={[
                ['yes', 'Incluir mapa na 1ª página'],
                ['no', 'Somente as folhas do painel'],
              ]}
            />
          </>
        ) : (
          <>
            <Choice
              flow={artFlow}
              label="Formato"
              id="format"
              options={pairs(formatNames)}
            />
            <Choice
              flow={artFlow}
              label="Composição visual"
              id="composition"
              options={[
                ['convite', 'Convite festivo (bandeirinhas)'],
                ['caderno', 'Caderno artesanal'],
                ['aviso', 'Aviso destacado'],
                ['memoria', 'Polaroid com fita'],
                ['ilustrado', 'Cartão ilustrado'],
                ['editorial', 'Editorial com barra'],
              ]}
            />
            <TextField
              flow={artFlow}
              label="Data (opcional)"
              id="date"
              type="date"
            />
          </>
        )}

        {(!panel || values.composition !== 'imagem') && (
          <div className="wide">
            <TextField
              flow={artFlow}
              label={panel ? 'Texto do painel' : 'Texto na arte'}
              id="body"
              type="textarea"
            />
          </div>
        )}

        {!panel && (
          <>
            <TextField
              flow={artFlow}
              label="Destaque final na arte (opcional)"
              id="callout"
            />
            <Choice
              flow={artFlow}
              label="Alinhamento do texto"
              id="align"
              options={[
                ['', 'Automático do estilo'],
                ['left', 'Alinhado à esquerda'],
                ['center', 'Centralizado'],
              ]}
            />
            <div className="wide">
              <TextField
                flow={artFlow}
                label="Legenda para compartilhar (opcional)"
                id="caption"
                type="textarea"
              />
            </div>
          </>
        )}

        {(!panel || values.composition === 'imagem') && (
          <div className="wide">
            <FileDrop
              label={
                panel
                  ? 'Escolher imagem para dividir em A4'
                  : photo ? 'Trocar foto' : 'Adicionar foto (opcional)'
              }
              instructions="Escolha ou arraste uma imagem JPG, PNG ou WebP de até 14 MB."
              accept=".jpg,.jpeg,.png,.webp"
              disabled={Boolean(busy)}
              onFiles={([file]) => void readFile(file)}
            />
          </div>
        )}

        {photo && (
          <>
            <Choice
              flow={artFlow}
              label="Enquadramento da imagem"
              id="artCrop"
              options={[
                ['no', 'Mostrar imagem inteira'],
                ['yes', 'Preencher com recorte central'],
              ]}
            />
            <div>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setPhoto(null)
                  setPhotoUrl('')
                  setDirty(true)
                }}
              >
                Remover imagem
              </button>
            </div>
          </>
        )}

        {(!panel || values.composition !== 'imagem') && (
          <details className="wide">
            <summary>
              Ilustração decorativa{values.figure ? ' · escolhida' : ''}
            </summary>
            <div
              className="figure-picker"
              role="group"
              aria-label="Ilustrações decorativas"
            >
              <button
                type="button"
                className="secondary"
                aria-pressed={!values.figure}
                onClick={() => updateArt('figure', '')}
              >
                Sem ilustração
              </button>
              {figures.map((item) => (
                <button
                  type="button"
                  className="secondary"
                  key={item.id}
                  aria-pressed={values.figure === item.id}
                  onClick={() => updateArt('figure', item.id)}
                >
                  <img
                    src={figureUrl(item.id)}
                    alt=""
                    width="36"
                    height="36"
                    loading="lazy"
                  />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </details>
        )}

        <details className="wide">
          <summary>Cores personalizadas e fonte</summary>
          <div className="form-grid">
            <TextField
              flow={artFlow}
              label="Cor de fundo"
              id="background"
              type="color"
            />
            <TextField
              flow={artFlow}
              label="Cor do texto"
              id="foreground"
              type="color"
            />
            <Choice
              flow={artFlow}
              label="Fonte"
              id="font"
              options={pairs(fontOptions)}
            />
          </div>
        </details>

        {!panel && (
          <details className="wide">
            <summary>Legenda pronta para copiar</summary>
            <label>
              Texto da legenda
              <textarea
                id="caption-copy"
                readOnly
                value={
                  values.caption ||
                  [values.title, settings.date, values.body, values.callout]
                    .filter(Boolean)
                    .join('\n')
                }
              />
            </label>
          </details>
        )}

        {previous && (
          <div>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                replace(previous)
                setPrevious(null)
              }}
            >
              Desfazer última alteração
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <Frame tool={props.tool} flow={flow} busy={busy}>
      <AdjustLayout form={form} preview={previewArt} catalogUrl={'/app/colecao?ferramenta=' + props.tool} />
      <div className="actions pinned-action">
        <button
          type="button"
          disabled={
            Boolean(busy) ||
            panelMissingPhoto ||
            !values.title.trim() ||
            Boolean(ornamentUrl && ornament?.url !== ornamentUrl)
          }
          onClick={() => void output(false)}
        >
          <Download size={17} aria-hidden="true" /> Baixar{' '}
          {panel ? 'PDF' : 'PNG'}
        </button>
        {panel ? (
          <button
            type="button"
            className="secondary"
            disabled={Boolean(busy) || panelMissingPhoto}
            onClick={() => void output(true)}
          >
            <Printer size={17} aria-hidden="true" /> Imprimir
          </button>
        ) : (
          <button type="button" className="secondary" onClick={() => void copy()}>
            <Copy size={17} aria-hidden="true" /> Copiar legenda
          </button>
        )}
        <button
          type="button"
          className="secondary"
          disabled={Boolean(busy)}
          onClick={() => void flow.save(Boolean(photo))}
        >
          Salvar rascunho
        </button>
      </div>
    </Frame>
  )
}

export default function Visual(props: EditorProps) {
  return props.tool === 'fotos-em-pdf' ? (
    <Photos {...props} />
  ) : (
    <Art {...props} />
  )
}
