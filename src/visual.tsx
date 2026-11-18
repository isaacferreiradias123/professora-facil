import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { catalog, tools } from './catalog'
import {
  blobOf,
  drawArt,
  formats,
  imageFromFile,
  photoLimit,
  tiles,
  type ArtOptions,
  type Photo,
  type PhotoOptions,
} from './media'
import { dateLabel } from './model'
import { newId, type Values } from './store'
import { useEasy } from './pages'
import {
  download,
  filename,
  printBlob,
  useWorkflow,
  type EditorProps,
} from './workflow'

type Flow = ReturnType<typeof useWorkflow>
const palettes = [
  ['#e3ece3', '#284631'],
  ['#f7e1d7', '#633528'],
  ['#eee8f5', '#413254'],
  ['#faf7f0', '#252e29'],
]
const formatNames = Object.keys(formats) as (keyof typeof formats)[]
const fontOptions = ['Georgia', 'Verdana', 'Trebuchet MS']
const photoDefaults = {
  title: 'Fotos da turma',
  orientation: 'vertical',
  perPage: '4',
  margin: '10',
  crop: 'no',
  quality: 'standard',
}
function artDefaults(props: EditorProps, index: number): Values {
  const options = catalog[props.tool],
    name = options[index] ?? options[0]
  const [background, foreground] = palettes[index % palettes.length]
  const panel = props.tool === 'painel'
  const artBody = [
    'Esperamos sua presença na nossa mostra de experiências.',
    'Confira os próximos combinados da turma.',
    'Uma mensagem para as famílias da nossa turma.',
    'Vamos celebrar juntos este dia especial.',
    'Com carinho, da nossa comunidade escolar.',
    'Agradecemos por fazer parte desta experiência.',
    'Venha acompanhar as descobertas da turma.',
    'Compartilhando um momento de aprendizagem.',
    'Uma mensagem da nossa escola para você.',
  ]
  const panelBody = [
    'É uma alegria ter você aqui!',
    'Celebramos quem faz aniversário neste mês!',
    'A  B  C  D  E  F  G  H  I\nJ  K  L  M  N  O  P  Q  R\nS  T  U  V  W  X  Y  Z',
    '1   2   3   4   5\n6   7   8   9   10',
    'Primavera · Verão\nOutono · Inverno',
    'Veja o que descobrimos juntos.',
    'Uma celebração da nossa comunidade escolar.',
  ]
  return {
    title: name,
    model: String(index),
    body: (panel ? panelBody : artBody)[index],
    date: '',
    background,
    foreground,
    font: fontOptions[0],
    format: formatNames[0],
    grid: '2',
  }
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
  const easy = useEasy()
  return (
    <>
      <button className="secondary" onClick={flow.exit}>
        Voltar às ferramentas
      </button>
      <h1>{tools[tool].name}</h1>
      <div className="card editor-card">
        {easy && (
          <details>
            <summary>Ajuda nesta ferramenta</summary>
            <p>{tools[tool].description} Confira a prévia antes de baixar.</p>
          </details>
        )}
        <p role="status">{busy || flow.message}</p>
        {flow.error && (
          <p role="alert" className="error">
            {flow.error}
          </p>
        )}
        {children}
      </div>
    </>
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
          value={flow.values[id] || ''}
          maxLength={450}
          onChange={(e) => flow.set(id, e.target.value)}
        />
      ) : (
        <input
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
        value={flow.values[id]}
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
  const flow = useWorkflow(props, () => photoDefaults)
  const easy = useEasy()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [busy, setBusy] = useState('')
  const [step, setStep] = useState(0)
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
  const { values, save, setDirty, setError, setMessage } = flow
  const options: PhotoOptions = {
    orientation:
      values.orientation === 'horizontal' ? 'horizontal' : 'vertical',
    perPage: Number(values.perPage) as PhotoOptions['perPage'],
    margin: Number(values.margin),
    crop: values.crop === 'yes',
    quality: values.quality === 'high' ? 'high' : 'standard',
  }
  const cols =
    options.perPage === 4 ||
    (options.perPage === 2 && options.orientation === 'horizontal')
      ? 2
      : 1
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
        next.push({ id: newId(), url, blob, caption: '' })
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
  function remove(photo: Photo) {
    URL.revokeObjectURL(photo.url)
    urls.current.delete(photo.url)
    setPhotos((items) => items.filter((p) => p.id !== photo.id))
    setDirty(true)
  }
  function go(next: number) {
    setStep(next)
    requestAnimationFrame(() => document.getElementById('visual-step')?.focus())
  }
  async function output(print: boolean) {
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
  if (flow.loading) return <p role="status">Abrindo rascunho…</p>
  if (flow.unavailable) return <p role="alert">{flow.error}</p>
  return (
    <Frame tool={props.tool} flow={flow} busy={busy}>
      <p className="progress">Etapa {step + 1} de 3</p>
      <h2 id="visual-step" tabIndex={-1}>
        {['Escolher fotos', 'Organizar as folhas', 'Conferir PDF'][step]}
      </h2>
      {step === 0 && (
        <>
          <label>
            Selecionar fotos
            <input
              multiple
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              disabled={Boolean(busy)}
              onChange={(e) => {
                void add(Array.from(e.target.files ?? []))
                e.target.value = ''
              }}
            />
          </label>
          <p>
            {photos.length} de {photoLimit} fotos selecionadas. Use JPG, PNG ou
            WebP.
          </p>
          <div className="thumbs">
            {photos.map((p, i) => (
              <article className="card" key={p.id}>
                <img src={p.url} alt={'Foto ' + (i + 1)} loading="lazy" />
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
                    aria-label={'Excluir foto ' + (i + 1)}
                    disabled={Boolean(busy)}
                    onClick={() => remove(p)}
                  >
                    Excluir foto
                  </button>
                </div>
                <label>
                  Legenda da foto {i + 1}
                  <input
                    maxLength={100}
                    value={p.caption}
                    onChange={(e) => {
                      const caption = e.target.value
                      setPhotos((items) =>
                        items.map((item) =>
                          item.id === p.id ? { ...item, caption } : item,
                        ),
                      )
                      setDirty(true)
                    }}
                  />
                </label>
              </article>
            ))}
          </div>
        </>
      )}
      {step === 1 && (
        <div className="form-grid">
          <TextField flow={flow} label="Nome do arquivo" id="title" />
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
            options={pairs(['1', '2', '4'])}
          />
          {easy ? (
            <details className="wide">
              <summary>Margens, encaixe e qualidade</summary>
              <div className="form-grid">
                <PhotoAdvanced flow={flow} />
              </div>
            </details>
          ) : (
            <PhotoAdvanced flow={flow} />
          )}
        </div>
      )}
      {step === 2 && (
        <>
          <p>
            {Math.ceil(photos.length / options.perPage)} folhas A4 ·{' '}
            {options.crop
              ? 'Preenchimento com recorte central'
              : 'Encaixe sem recorte'}
          </p>
          <div className="sheets">
            {Array.from(
              { length: Math.ceil(photos.length / options.perPage) },
              (_, i) => (
                <div key={i}>
                  <p>Folha {i + 1}</p>
                  <div
                    className="photo-sheet"
                    style={{
                      aspectRatio:
                        options.orientation === 'vertical'
                          ? '210/297'
                          : '297/210',
                      gridTemplateColumns: 'repeat(' + cols + ',minmax(0,1fr))',
                      gridTemplateRows:
                        'repeat(' + options.perPage / cols + ',minmax(0,1fr))',
                      padding:
                        (100 * options.margin) /
                          (options.orientation === 'vertical' ? 210 : 297) +
                        '%',
                      gap:
                        (100 * 4.23) /
                          (options.orientation === 'vertical' ? 210 : 297) +
                        '%',
                    }}
                  >
                    {photos
                      .slice(i * options.perPage, (i + 1) * options.perPage)
                      .map((p, j) => (
                        <figure key={p.id}>
                          <img
                            src={p.url}
                            alt={'Foto ' + (i * options.perPage + j + 1)}
                            style={{
                              objectFit: options.crop ? 'cover' : 'contain',
                            }}
                          />
                          {p.caption && <figcaption>{p.caption}</figcaption>}
                        </figure>
                      ))}
                  </div>
                </div>
              ),
            )}
          </div>
        </>
      )}
      <div className="actions">
        {step > 0 && (
          <button
            className="secondary"
            disabled={Boolean(busy)}
            onClick={() => go(step - 1)}
          >
            Voltar
          </button>
        )}
        {step < 2 ? (
          <button
            disabled={!photos.length || Boolean(busy)}
            onClick={() => go(step + 1)}
          >
            {step === 0 ? 'Organizar folhas' : 'Conferir PDF'}
          </button>
        ) : (
          <>
            <button disabled={Boolean(busy)} onClick={() => void output(false)}>
              Baixar PDF
            </button>
            <button
              className="secondary"
              disabled={Boolean(busy)}
              onClick={() => void output(true)}
            >
              Imprimir
            </button>
          </>
        )}
        <button
          className="secondary"
          disabled={Boolean(busy)}
          onClick={() => void save(true)}
        >
          Salvar rascunho
        </button>
      </div>
      {step === 1 && options.crop && (
        <p className="notice">
          O recorte é central. Confira se todos os rostos e detalhes importantes
          aparecem na prévia.
        </p>
      )}
    </Frame>
  )
}
function PhotoAdvanced({ flow }: { flow: Flow }) {
  return (
    <>
      <Choice
        flow={flow}
        label="Margens"
        id="margin"
        options={['5', '10', '15', '20'].map((v) => [v, v + ' mm'])}
      />
      <Choice
        flow={flow}
        label="Encaixe das fotos"
        id="crop"
        options={[
          ['no', 'Mostrar foto inteira'],
          ['yes', 'Preencher com recorte central'],
        ]}
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
    </>
  )
}
function Art(props: EditorProps) {
  const models = catalog[props.tool]
  const model =
    Number.isInteger(props.model) &&
    props.model >= 0 &&
    props.model < models.length
      ? props.model
      : 0
  const flow = useWorkflow(props, () => artDefaults(props, model))
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null)
  const ref = useRef<HTMLCanvasElement | null>(null)
  const tileRefs = useRef<(HTMLCanvasElement | null)[]>([])
  const panel = props.tool === 'painel'
  const easy = useEasy()
  const { values, replace, setDirty, setError, setMessage } = flow
  const grid = Number(values.grid) === 3 ? 3 : 2
  const geometry = tiles(grid)
  const dimensions =
    formats[values.format as keyof typeof formats] ?? formats['Quadrado 1:1']
  const settings: ArtOptions = {
    title: values.title,
    body: values.body,
    date: dateLabel(values.date),
    background: values.background,
    foreground: values.foreground,
    font: values.font,
    model: Number(values.model) || 0,
  }
  useEffect(() => {
    if (!ref.current) return
    const target = ref.current
    const width = panel ? geometry.width : dimensions[0],
      height = panel ? geometry.height : dimensions[1]
    target.width = width
    target.height = height
    drawArt(
      target,
      {
        title: values.title,
        body: values.body,
        date: dateLabel(values.date),
        background: values.background,
        foreground: values.foreground,
        font: values.font,
        model: Number(values.model) || 0,
      },
      photo,
      panel,
    )
    if (panel)
      tiles(grid).positions.forEach((position, index) => {
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
  }, [
    step,
    values,
    photo,
    panel,
    geometry.width,
    geometry.height,
    geometry.size.width,
    geometry.size.height,
    dimensions,
    grid,
  ])
  useEffect(
    () => () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl)
    },
    [photoUrl],
  )
  function go(next: number) {
    setStep(next)
    setError('')
    requestAnimationFrame(() => document.getElementById('visual-step')?.focus())
  }
  async function readFile(file?: File) {
    if (!file) return
    setBusy('Abrindo imagem…')
    setError('')
    let url = ''
    try {
      url = URL.createObjectURL(await imageFromFile(file, 1500))
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
        ? await (await import('./visual-pdf')).panelPdf(target, grid)
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
    const text = [values.title, settings.date, values.body]
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
  const style = (
    <>
      <TextField
        flow={flow}
        label="Cor de fundo"
        id="background"
        type="color"
      />
      <TextField
        flow={flow}
        label="Cor do texto"
        id="foreground"
        type="color"
      />
      <Choice
        flow={flow}
        label="Fonte"
        id="font"
        options={pairs(fontOptions)}
      />
    </>
  )
  return (
    <Frame tool={props.tool} flow={flow} busy={busy}>
      <p className="progress">Etapa {step + 1} de 3</p>
      <h2 id="visual-step" tabIndex={-1}>
        {['Escolher', 'Personalizar', 'Conferir'][step]}
      </h2>
      {step === 0 && (
        <div className="form-grid">
          <label>
            Modelo
            <select
              value={values.model}
              onChange={(e) =>
                replace({
                  ...values,
                  ...artDefaults(props, Number(e.target.value)),
                })
              }
            >
              {models.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          {panel ? (
            <Choice
              flow={flow}
              label="Grade de impressão"
              id="grid"
              options={[
                ['2', '2 × 2 · 4 folhas'],
                ['3', '3 × 3 · 9 folhas'],
              ]}
            />
          ) : (
            <Choice
              flow={flow}
              label="Formato"
              id="format"
              options={pairs(formatNames)}
            />
          )}
        </div>
      )}
      {step === 1 && (
        <>
          <div className="form-grid">
            <TextField flow={flow} label="Título" id="title" />
            <TextField
              flow={flow}
              label="Data (opcional)"
              id="date"
              type="date"
            />
            <TextField
              flow={flow}
              label={panel ? 'Texto do painel' : 'Legenda'}
              id="body"
              type="textarea"
            />
            {!panel && (
              <label>
                Adicionar imagem (opcional)
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  disabled={Boolean(busy)}
                  onChange={(e) => {
                    void readFile(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
              </label>
            )}
            {photo && (
              <button
                className="secondary"
                onClick={() => {
                  setPhoto(null)
                  setPhotoUrl('')
                  setDirty(true)
                }}
              >
                Remover imagem
              </button>
            )}
            {easy ? (
              <details className="wide">
                <summary>Cores e fonte</summary>
                <div className="form-grid">{style}</div>
              </details>
            ) : (
              style
            )}
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <canvas
            ref={ref}
            className="art-preview"
            aria-label={'Prévia de ' + values.title}
            role="img"
          />
          {panel ? (
            <>
              <p>
                Monte da esquerda para a direita, de cima para baixo. Use as
                marcas de corte e alinhe a pequena faixa de sobreposição.
              </p>
              <div className="sheets">
                {geometry.positions.map((p, i) => (
                  <div key={i}>
                    <p>
                      Folha {i + 1} · Linha {Math.floor(i / grid) + 1}, coluna{' '}
                      {(i % grid) + 1}
                    </p>
                    <canvas
                      className="tile"
                      aria-label={'Prévia da folha ' + (i + 1)}
                      role="img"
                      width={216}
                      height={305}
                      ref={(target) => {
                        tileRefs.current[i] = target
                      }}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <details>
              <summary>Legenda para compartilhar</summary>
              <label>
                Texto da legenda
                <textarea
                  id="caption-copy"
                  readOnly
                  value={[values.title, settings.date, values.body]
                    .filter(Boolean)
                    .join('\n')}
                />
              </label>
            </details>
          )}
        </>
      )}
      <div className="actions">
        {step > 0 && (
          <button
            className="secondary"
            disabled={Boolean(busy)}
            onClick={() => go(step - 1)}
          >
            Voltar
          </button>
        )}
        {step < 2 ? (
          <button
            disabled={Boolean(busy) || (step === 1 && !values.title.trim())}
            onClick={() => go(step + 1)}
          >
            {step === 0 ? 'Personalizar' : 'Conferir arte'}
          </button>
        ) : (
          <>
            <button disabled={Boolean(busy)} onClick={() => void output()}>
              Baixar {panel ? 'PDF' : 'PNG'}
            </button>
            {panel ? (
              <button
                className="secondary"
                disabled={Boolean(busy)}
                onClick={() => void output(true)}
              >
                Imprimir
              </button>
            ) : (
              <button className="secondary" onClick={() => void copy()}>
                Copiar legenda
              </button>
            )}
          </>
        )}
        <button
          className="secondary"
          disabled={Boolean(busy)}
          onClick={() => void flow.save(Boolean(photo))}
        >
          Salvar rascunho
        </button>
      </div>
      {!panel && (
        <Link to="/app/em-breve/ia">Criar imagens com IA · Em breve</Link>
      )}
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
