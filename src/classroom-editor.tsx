import { useMemo, useState } from 'react'
import {
  Link,
  Navigate,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { ArrowLeft, Download, FileText, Printer, Scissors } from 'lucide-react'
import {
  ageGuides,
  findClassroomItem,
  type ClassroomItem,
} from './classroom-catalog'
import {
  activityCommand,
  assetUrl,
  buildSheets,
  initialValues,
  mosaicGeometry,
  noticeFits,
  panelArtwork,
  panelPieces,
  planMinutes,
  planMoments,
  worksheetGroups,
  worksheetQuantity,
  type PlanMoment,
} from './classroom-layout'
import { activityUse, Paper, PreviewThumb } from './classroom'
import { AdjustLayout } from './editor-ui'
import { download, filename, printBlob, useWorkflow } from './workflow'
import type { Values } from './store'
import { panelLabelLimit } from './panel-geometry'

function PagePreview({
  item,
  values,
  sheets,
}: {
  item: ClassroomItem
  values: Values
  sheets: ReturnType<typeof buildSheets>
}) {
  const [selected, setSelected] = useState(
    item.id === 'boas-vindas' || Boolean(item.mosaicLabels) ? -1 : 0,
  )
  const [wide, setWide] = useState(false)
  const active = Math.min(sheets.length - 1, selected)
  const assembledPreview = active < 0
  const title = assembledPreview ? 'Como fica montado' : sheets[active].name
  return (
    <div className="school-preview">
      <div className="school-preview-heading">
        <div>
          <h2>{title}</h2>
          <p>
            {assembledPreview
              ? (item.panel?.landscape
                  ? 'Painel horizontal'
                  : 'Painel vertical') +
                ' · ' +
                mosaicGeometry(item).tiles.length +
                ' folhas de arte'
              : 'Folha ' + (active + 1) + ' de ' + sheets.length}
          </p>
        </div>
        <button
          type="button"
          className="secondary"
          aria-pressed={wide}
          onClick={() => setWide(!wide)}
        >
          {wide ? 'Ajustar à tela' : 'Ampliar folha'}
        </button>
      </div>
      <div className="school-page-picker" aria-label="Páginas da prévia">
        {(item.id === 'boas-vindas' || Boolean(item.mosaicLabels)) && (
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
      <div
        className={'school-paper-stage' + (wide ? ' school-paper-zoom' : '')}
        tabIndex={wide ? 0 : undefined}
        aria-label={
          wide ? 'Prévia ampliada, role para ver a folha inteira' : undefined
        }
      >
        {assembledPreview ? (
          <Paper
            marks={panelArtwork(values, item)}
            width={mosaicGeometry(item).assembled.width}
            height={mosaicGeometry(item).assembled.height}
          />
        ) : (
          <Paper
            marks={sheets[active].marks}
            width={sheets[active].size?.width}
            height={sheets[active].size?.height}
          />
        )}
      </div>
      <p className="school-page-note">
        {item.tool === 'painel'
          ? (
              active < 0
                ? mosaicGeometry(item).paper.width === 297
                : sheets[active]?.size?.width === 297
            )
            ? 'A4 paisagem · imprima a 100%'
            : 'A4 retrato · imprima a 100%'
          : 'A4 retrato'}{' '}
        · {sheets.length} {sheets.length === 1 ? 'folha' : 'folhas'}
      </p>
    </div>
  )
}

function CatalogBack() {
  const { state } = useLocation()
  const origin =
    typeof state?.catalogUrl === 'string' &&
    state.catalogUrl.startsWith('/app/colecao')
      ? state.catalogUrl
      : '/app/colecao'
  return (
    <Link className="school-back" to={origin}>
      <ArrowLeft size={18} aria-hidden="true" /> Coleção
    </Link>
  )
}

function ReadyMaterial({
  item,
}: {
  item: ClassroomItem & { ready: NonNullable<ClassroomItem['ready']> }
}) {
  return (
    <div className="school-editor school-ready">
      <CatalogBack />
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
  const { state } = useLocation()
  const [stage, setStage] = useState(1)
  function updateMoments(next: PlanMoment[]) {
    set('planSteps', JSON.stringify(next))
  }
  function changeMoment(index: number, patch: Partial<PlanMoment>) {
    if (!values.planSteps) {
      if (patch.minutes !== undefined)
        set('minute' + index, String(patch.minutes))
      if (patch.action !== undefined) set('moment' + index, patch.action)
      return
    }
    updateMoments(
      planMoments(values).map((moment, i) =>
        index === i ? { ...moment, ...patch } : moment,
      ),
    )
  }
  function moveMoment(index: number, direction: number) {
    const moments = planMoments(values)
    const [selected] = moments.splice(index, 1)
    moments.splice(index + direction, 0, selected)
    updateMoments(moments)
  }
  const sheets = useMemo(() => buildSheets(item, values), [item, values])
  const isWorksheet = Boolean(
    item.task && item.task.mode !== 'experience' && item.task.mode !== 'cards',
  )
  const isPlan = item.tool === 'plano-de-aula'
  const isReport = item.tool === 'relatorio'
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
      {isReport && (
        <p className="school-materials">
          Descreva uma brincadeira, fala ou ação que você observou. Use exemplos
          da turma e indique como pretende retomar a proposta.
        </p>
      )}
      {item.form === 'declaracao' && (
        <p className="school-materials">
          Preencha os dados do comparecimento. A declaração inclui um campo de
          assinatura da escola.
        </p>
      )}
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
              input(field.key, field.label, field.type)
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
          {!values.planSteps && (
            <label>
              <input
                type="checkbox"
                checked={values.extended === 'yes'}
                onChange={(event) =>
                  set('extended', event.target.checked ? 'yes' : 'no')
                }
              />{' '}
              Incluir extensão ou adaptação
            </label>
          )}
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
                    changeMoment(index, {
                      minutes: Math.min(
                        180,
                        Math.max(
                          0,
                          Math.trunc(Number(event.target.value)) || 0,
                        ),
                      ),
                    })
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
                    changeMoment(index, { action: event.target.value })
                  }
                />
              </label>
              <div className="actions">
                <button
                  type="button"
                  className="secondary"
                  aria-label={'Subir momento ' + (index + 1)}
                  disabled={index === 0}
                  onClick={() => moveMoment(index, -1)}
                >
                  Subir
                </button>
                <button
                  type="button"
                  className="secondary"
                  aria-label={'Descer momento ' + (index + 1)}
                  disabled={index === planMoments(values).length - 1}
                  onClick={() => moveMoment(index, 1)}
                >
                  Descer
                </button>
                <button
                  type="button"
                  className="secondary"
                  aria-label={'Remover momento ' + (index + 1)}
                  disabled={planMoments(values).length <= 1}
                  onClick={() =>
                    updateMoments(
                      planMoments(values).filter((_, i) => i !== index),
                    )
                  }
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="secondary"
            disabled={planMoments(values).length >= 10}
            onClick={() =>
              updateMoments([
                ...planMoments(values),
                { label: 'Momento adicional', action: '', minutes: 5 },
              ])
            }
          >
            Adicionar momento
          </button>
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
          {['criar-contagem', 'criar-pares'].includes(item.id) && (
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
      {(item.poster || item.panel) && (
        <label>
          Texto dos cartões, um por linha
          <textarea
            rows={6}
            maxLength={1200}
            value={
              values.panelPieces ??
              (item.poster ?? item.mosaicLabels ?? []).join('\n')
            }
            onChange={(event) => set('panelPieces', event.target.value)}
          />
          <small>
            {item.panel
              ? 'Até ' +
                panelLabelLimit(item.panel) +
                ' rótulos com 40 caracteres.'
              : panelPieces(item, values).length +
                ' cartões · até 28 peças e 40 caracteres por peça'}
          </small>
        </label>
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
      <Link
        className="school-back"
        to={
          typeof state?.catalogUrl === 'string' &&
          state.catalogUrl.startsWith('/app/colecao')
            ? state.catalogUrl
            : '/app/colecao?ferramenta=' +
              item.tool +
              (item.task ? '&uso=' + activityUse(item) : '')
        }
      >
        <ArrowLeft size={18} /> Escolher outro modelo
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
      <nav className="school-flow" aria-label="Etapas do material">
        <Link
          to={
            typeof state?.catalogUrl === 'string' &&
            state.catalogUrl.startsWith('/app/colecao')
              ? state.catalogUrl
              : '/app/colecao?ferramenta=' + item.tool
          }
        >
          1. Escolher
        </Link>
        <button
          type="button"
          className="secondary"
          aria-current={stage === 1 ? 'step' : undefined}
          onClick={() => setStage(1)}
        >
          2. Ajustar
        </button>
        <button
          type="button"
          className="secondary"
          aria-current={stage === 2 ? 'step' : undefined}
          onClick={() => setStage(2)}
        >
          3. Baixar
        </button>
      </nav>
      <details className="school-template-reference">
        <summary>Ver o modelo original</summary>
        <p>Compare com a prévia atual antes de baixar.</p>
        <PreviewThumb item={item} />
      </details>
      {stage === 1 ? (
        <AdjustLayout
          form={form}
          preview={<PagePreview item={item} values={values} sheets={sheets} />}
        />
      ) : (
        <PagePreview item={item} values={values} sheets={sheets} />
      )}
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
        <details
          className="school-export-menu"
          onClick={(event) => {
            if (
              event.target instanceof Element &&
              event.target.closest('button')
            )
              event.currentTarget.open = false
          }}
        >
          <summary className="button secondary">Mais ações</summary>
          <div className="school-export-menu-body">
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
        </details>
      </div>
    </div>
  )
}

export default function ClassroomRoute() {
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
        <CatalogBack />
        <h1>{item.title}</h1>
        <p>{item.description}</p>
        <div className="school-selected-model">
          <PreviewThumb item={item} />
        </div>
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
