import { useEffect, useMemo, useState } from 'react'
import {
  Link,
  Navigate,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  FileText,
  Maximize2,
  PenLine,
  Printer,
  Scissors,
  Shuffle,
  X,
} from 'lucide-react'
import { fields, observationHints, rights } from './catalog'
import {
  ageBands,
  ageGuides,
  findClassroomItem,
  type AgeBand,
  type ClassroomItem,
  type TraceTrack,
} from './classroom-catalog'
import {
  activityCommand,
  activityGroups,
  assetUrl,
  buildSheets,
  initialValues,
  mosaicGeometry,
  noticeFits,
  panelArtwork,
  panelPieces,
  parseCustomItems,
  planMinutes,
  planMoments,
  printThemes,
  traceTracks,
  worksheetGroups,
  worksheetQuantity,
  type CustomWorksheetData,
  type PlanMoment,
} from './classroom-layout'
import { Paper } from './classroom'
import { AdjustLayout } from './editor-ui'
import { loadSchoolProfile } from './school-profile'
import { TaskBuilderView } from './task-builder-view'
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
  const [modalOpen, setModalOpen] = useState(false)
  const active = Math.min(sheets.length - 1, selected)
  const assembledPreview = active < 0
  const title = assembledPreview ? 'Como fica montado' : sheets[active].name

  useEffect(() => {
    if (!modalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen])

  const renderPaper = () =>
    assembledPreview ? (
      <Paper
        marks={panelArtwork(values, item)}
        width={mosaicGeometry(item).assembled.width}
        height={mosaicGeometry(item).assembled.height}
        font={values.sheetFont === 'andika' ? 'andika' : 'noto'}
      />
    ) : (
      <Paper
        marks={sheets[active].marks}
        width={sheets[active].size?.width}
        height={sheets[active].size?.height}
        font={sheets[active]?.font}
      />
    )

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
          aria-pressed={modalOpen}
          onClick={() => setModalOpen(true)}
        >
          <Maximize2 size={15} aria-hidden="true" /> Ampliar folha
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
      <div className="school-paper-stage">{renderPaper()}</div>
      <p className="school-page-note">
        {item.tool === 'painel'
          ? (
              active < 0
                ? mosaicGeometry(item).paper.width === 297
                : sheets[active]?.size?.width === 297
            )
            ? 'A4 paisagem · imprima a 100%'
            : 'A4 retrato · imprima a 100%'
          : sheets[active]?.size?.width === 297
            ? 'A4 paisagem'
            : 'A4 retrato'}{' '}
        · {sheets.length} {sheets.length === 1 ? 'folha' : 'folhas'}
      </p>

      {modalOpen && (
        <div
          className="sheet-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={'Visualização ampliada: ' + title}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false)
          }}
        >
          <div className="sheet-modal">
            <div className="sheet-modal-head">
              <div>
                <strong>{title}</strong>
                <span>
                  {' · '}Folha {Math.max(1, active + 1)} de {sheets.length}
                </span>
              </div>
              <button
                type="button"
                className="secondary"
                onClick={() => setModalOpen(false)}
              >
                <X size={16} aria-hidden="true" /> Fechar visualização
              </button>
            </div>
            {sheets.length > 1 && (
              <div className="school-page-picker" aria-label="Folhas na visualização ampliada">
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
                {sheets.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="secondary"
                    aria-pressed={idx === active}
                    onClick={() => setSelected(idx)}
                  >
                    Folha {idx + 1} · {s.name}
                  </button>
                ))}
              </div>
            )}
            <div className="sheet-modal-body">{renderPaper()}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function CatalogBack({ archive = false }: { archive?: boolean }) {
  const { state } = useLocation()
  const origin =
    typeof state?.catalogUrl === 'string' &&
    state.catalogUrl.startsWith('/app/colecao')
      ? state.catalogUrl
      : archive ? '/app/colecao?acervo=pt-br' : '/app/colecao'
  return (
    <Link className="school-back" to={origin}>
      <ArrowLeft size={18} aria-hidden="true" /> Escolher outro modelo
    </Link>
  )
}

function ReadyMaterial({
  item,
}: {
  item: ClassroomItem & { ready: NonNullable<ClassroomItem['ready']> }
}) {
  const saved = loadSchoolProfile()
  const [school, setSchool] = useState(saved.school)
  const [teacher, setTeacher] = useState(saved.teacher)
  const [classroom, setClassroom] = useState(saved.classroom)
  const [date, setDate] = useState('')
  const [studentLine, setStudentLine] = useState(true)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  async function downloadStamped() {
    if (busy) return
    setBusy(true)
    setError('')
    setStatus('Adicionando seu cabeçalho ao PDF…')
    try {
      const { stampHeaderOnPdf } = await import('./classroom-export')
      const blob = await stampHeaderOnPdf(item.ready.file, {
        school,
        teacher,
        classroom,
        date,
        studentLine,
      })
      download(blob, filename(item.title + '-personalizado') + '.pdf')
      setStatus('PDF personalizado preparado para baixar.')
    } catch {
      setError('Não foi possível personalizar este PDF. Tente baixar o original.')
      setStatus('')
    } finally {
      setBusy(false)
    }
  }

  async function printDirect() {
    if (busy) return
    setBusy(true)
    setError('')
    setStatus('Preparando folha para impressão…')
    try {
      const { stampHeaderOnPdf } = await import('./classroom-export')
      const hasCustom = Boolean(school.trim() || teacher.trim() || classroom.trim() || date.trim())
      const blob = hasCustom
        ? await stampHeaderOnPdf(item.ready.file, {
            school,
            teacher,
            classroom,
            date,
            studentLine,
          })
        : await (await fetch(assetUrl(item.ready.file))).blob()
      printBlob(blob)
      setStatus('Folha enviada para impressão.')
    } catch {
      setError('Não foi possível abrir a impressão direta.')
      setStatus('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="school-editor school-ready">
      <CatalogBack archive={Boolean(item.archiveType)} />
      <h1>{item.title}</h1>
      {item.age && (
        <p>{ageGuides[item.age]} · {item.ready.presentation ? 'PowerPoint e PDF A4' : 'PDF A4'}</p>
      )}
      <p>{item.description}</p>
      <img src={assetUrl(item.ready.image)} alt={item.title} />
      <p>
        <a href={item.ready.source}>{item.ready.author}</a>
        {item.ready.originalPage && (
          <> · {item.ready.presentation ? '11 páginas no material de origem' : item.ready.originalPage.replace(/^.*?, p\. /, 'Página original: ')}</>
        )}
      </p>
      <div className="actions">
        {item.ready.presentation ? (
          <>
            <a className="button" href={assetUrl(item.ready.presentation)} download>
              <Download size={18} aria-hidden="true" /> Baixar PowerPoint editável
            </a>
            <a className="button secondary" href={assetUrl(item.ready.file)} target="_blank" rel="noreferrer">
              Ver PDF
            </a>
          </>
        ) : (
          <a className="button" href={assetUrl(item.ready.file)} download>
            <Download size={18} aria-hidden="true" /> Baixar PDF
          </a>
        )}
        <button
          type="button"
          className="secondary"
          disabled={busy}
          onClick={() => void printDirect()}
        >
          <Printer size={18} aria-hidden="true" /> Imprimir agora
        </button>
        <Link
          className="button secondary"
          to={'/app/responder?tipo=pdf&acervo=' + item.id}
        >
          <PenLine size={18} aria-hidden="true" /> Escrever por cima no PDF
        </Link>
        {item.ready.figure && (
          <a className="button secondary" href={assetUrl(item.ready.figure)} download>
            Baixar figura PNG
          </a>
        )}
      </div>

      <details className="card stamp-header-box">
        <summary>Personalizar cabeçalho neste PDF</summary>
        <p>
          Adiciona escola, professora, turma, data e espaço para o nome do aluno
          no topo da primeira folha deste PDF.
        </p>
        <div className="actions">
          <button
            type="button"
            className="secondary"
            onClick={() => {
              const p = loadSchoolProfile()
              setSchool(p.school)
              setTeacher(p.teacher)
              setClassroom(p.classroom)
              setStatus(
                p.school || p.teacher || p.classroom
                  ? 'Dados da escola preenchidos.'
                  : 'Salve seus dados na tela Início para usar este atalho.',
              )
            }}
          >
            Preencher com minha escola
          </button>
        </div>
        <div className="school-form-grid">
          <label>
            Escola
            <input
              type="text"
              maxLength={70}
              value={school}
              onChange={(e) => setSchool(e.target.value)}
            />
          </label>
          <label>
            Professora
            <input
              type="text"
              maxLength={60}
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
            />
          </label>
          <label>
            Turma
            <input
              type="text"
              maxLength={40}
              value={classroom}
              onChange={(e) => setClassroom(e.target.value)}
            />
          </label>
          <label>
            Data
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={studentLine}
            onChange={(e) => setStudentLine(e.target.checked)}
          />
          Incluir linha de Aluno(a) e Data
        </label>
        <div className="actions">
          <button type="button" disabled={busy} onClick={() => void downloadStamped()}>
            <Download size={17} aria-hidden="true" /> Baixar PDF com meu cabeçalho
          </button>
        </div>
      </details>

      {status && <p role="status">{status}</p>}
      {error && <p role="alert" className="error">{error}</p>}
    </div>
  )
}

function togglePipe(current: string | undefined, item: string) {
  const list = (current ?? '').split('|').filter(Boolean)
  return (
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
  ).join('|')
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
  const [hintBand, setHintBand] = useState<AgeBand>(item.age ?? 'Pré I')
  const { values, set } = flow
  const { state } = useLocation()

  function updateMoments(next: PlanMoment[]) {
    set('planSteps', JSON.stringify(next))
  }
  function changeMoment(index: number, patch: Partial<PlanMoment>) {
    if (!values.planSteps) {
      if (patch.label !== undefined) set('label' + index, patch.label)
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
  const isTaskSheet = Boolean(item.taskSheet || item.id === 'criar-tarefa')
  const isWorksheet = Boolean(
    !isTaskSheet &&
      item.task &&
      item.task.mode !== 'experience' &&
      item.task.mode !== 'cards',
  )
  const isCards = !isTaskSheet && item.task?.mode === 'cards'
  const isExperience = !isTaskSheet && item.task?.mode === 'experience'
  const isPlan = item.tool === 'plano-de-aula'
  const isWeeklyPlan = isPlan && item.planLayout === 'weekly'
  const isReport = item.tool === 'relatorio'
  const isNotice = item.category === 'Recados'
  const isPanel = item.category === 'Painéis'
  const fits = !isNotice || noticeFits(item, values)

  const reportLongFields = (item.fields ?? []).filter((f) => f.type === 'long')
  const reportTargetKey =
    (item.fields ?? []).find((f) =>
      ['languages', 'observation', 'evidence', 'entry1', 'routine', 'context'].includes(
        f.key,
      ),
    )?.key ?? reportLongFields[0]?.key ?? 'context'
  const [hintTarget, setHintTarget] = useState(reportTargetKey)

  function updateCustomItems(patch: Partial<CustomWorksheetData>) {
    const existing = parseCustomItems(values) ?? {}
    set('customItems', JSON.stringify({ ...existing, ...patch }))
  }

  function shufflePairs() {
    const count = worksheetGroups(item, values).length
    const base = Array.from({ length: count }, (_, i) => i)
    const current = values.shuffleOrder ?? '2,0,3,1'
    let candidate = current
    for (let t = 0; t < 5 && candidate === current; t++) {
      const next = [...base]
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[next[i], next[j]] = [next[j], next[i]]
      }
      if (next.every((val, idx) => val === idx)) next.push(next.shift()!)
      candidate = next.join(',')
    }
    set('shuffleOrder', candidate)
  }

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
        'Não foi possível preparar o arquivo. Tente novamente.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (flow.loading) return <p role="status">Carregando rascunho…</p>
  if (flow.unavailable) return <p role="alert">{flow.error}</p>

  const activeTheme = values.printTheme || item.defaultTheme || 'jardim'

  const printStyleBox = (
    <details className="print-style">
      <summary>Estilo de impressão</summary>
      <div className="theme-swatches">
        {Object.entries(printThemes).map(([id, theme]) => (
          <button
            key={id}
            type="button"
            className="secondary theme-chip"
            aria-pressed={activeTheme === id}
            onClick={() => set('printTheme', id)}
          >
            <span
              className="theme-dot"
              style={{ backgroundColor: theme.swatch }}
              aria-hidden="true"
            />
            {theme.label}
          </button>
        ))}
      </div>
      {!isTaskSheet && (
        <div className="task-toggles">
          <label className="check">
            <input
              type="checkbox"
              checked={values.sheetFont === 'andika'}
              onChange={(e) =>
                set('sheetFont', e.target.checked ? 'andika' : 'noto')
              }
            />
            Usar letra de alfabetização (Andika)
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={values.uppercase === 'yes'}
              onChange={(e) =>
                set('uppercase', e.target.checked ? 'yes' : 'no')
              }
            />
            TUDO EM CAIXA ALTA
          </label>
        </div>
      )}
    </details>
  )

  const form = isTaskSheet ? (
    <div className="school-form">
      <h2>Personalizar material</h2>
      <TaskBuilderView
        item={item}
        values={values}
        set={set}
        replace={flow.replace}
        onNotify={flow.setMessage}
      />
      {printStyleBox}
    </div>
  ) : (
    <div className="school-form">
      <h2>Personalizar material</h2>

      <div className="task-quick-actions">
        <button
          type="button"
          className="secondary"
          onClick={() => {
            const profile = loadSchoolProfile()
            if (!profile.school && !profile.teacher && !profile.classroom) {
              flow.setMessage(
                'Salve os dados da sua escola na tela Início para preencher em 1 clique.',
              )
              return
            }
            flow.replace({
              ...values,
              school: profile.school || values.school,
              classroom: profile.classroom || values.classroom,
              teacher: profile.teacher || values.teacher,
            })
            flow.setMessage('Dados da escola aplicados ao material.')
          }}
        >
          Preencher com minha escola
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            flow.replace(initialValues(item))
            flow.setMessage('Modelo restaurado para o original.')
          }}
        >
          Restaurar modelo original
        </button>
      </div>

      {isNotice && (
        <>
          <div className="school-form-grid">
            {(item.fields ?? []).map((field) =>
              input(field.key, field.label, field.type, 30),
            )}
          </div>
          {input('recipient', 'Destinatário')}
          <div className="school-form-grid">
            <label>
              Distribuição na folha
              <select
                value={values.copies}
                onChange={(event) => set('copies', event.target.value)}
              >
                <option value="2">2 vias para recortar</option>
                <option value="4">4 bilhetes por folha A4 (agenda)</option>
                <option value="1">Comunicado A4 inteiro</option>
              </select>
            </label>
            <label>
              Ilustração do cabeçalho
              <select
                value={values.noticeArt ?? item.noticeArt ?? 'reuniao'}
                onChange={(event) => set('noticeArt', event.target.value)}
              >
                <option value="reuniao">Reunião e famílias</option>
                <option value="passeio">Passeio escolar</option>
                <option value="materiais">Materiais e artes</option>
                <option value="evento">Mostra e evento</option>
                <option value="none">Sem ilustração</option>
              </select>
            </label>
          </div>
          {values.copies !== '4' && (
            <label className="check">
              <input
                type="checkbox"
                checked={values.detachable === 'yes'}
                onChange={(event) =>
                  set('detachable', event.target.checked ? 'yes' : 'no')
                }
              />
              Incluir canhoto destacável de autorização/confirmação
            </label>
          )}
        </>
      )}

      {input('title', 'Título')}
      {item.id === 'boas-vindas' && input('subtitle', 'Subtítulo do painel', 'text', 75)}
      <div className="school-form-grid">
        {input('school', 'Escola')}
        {input('classroom', 'Turma')}
      </div>
      {!isNotice && !isPanel && input('date', 'Data', 'date')}
      {isNotice && input('signature', 'Assinatura')}

      {isReport && (
        <details className="hints-box">
          <summary>Ideias do que observar ({hintBand})</summary>
          <div className="hints-controls">
            <div className="school-form-grid">
              <label>
                Faixa etária de referência
                <select
                  value={hintBand}
                  onChange={(e) => setHintBand(e.target.value as AgeBand)}
                >
                  {ageBands.map((band) => (
                    <option key={band} value={band}>
                      {band}
                    </option>
                  ))}
                </select>
              </label>
              {reportLongFields.length > 1 && (
                <label>
                  Campo de destino
                  <select
                    value={hintTarget}
                    onChange={(e) => setHintTarget(e.target.value)}
                  >
                    {reportLongFields.map((field) => (
                      <option key={field.key} value={field.key}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <ul className="hints-list">
              {observationHints[hintBand].map((hint) => (
                <li key={hint}>
                  <button
                    type="button"
                    className="secondary hint-btn"
                    onClick={() => {
                      const prev = values[hintTarget]?.trim()
                      set(hintTarget, prev ? prev + '\n' + hint : hint)
                    }}
                  >
                    + {hint}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}

      {isPlan && (
        <details className="bncc-box">
          <summary>Selos da BNCC (Campos e Direitos)</summary>
          <div className="bncc-group">
            <strong>Campos de experiências</strong>
            <div className="chip-grid">
              {fields.map((field) => {
                const active = (values.bnccFields ?? '')
                  .split('|')
                  .includes(field)
                return (
                  <button
                    key={field}
                    type="button"
                    className="secondary bncc-chip"
                    aria-pressed={active}
                    onClick={() =>
                      set('bnccFields', togglePipe(values.bnccFields, field))
                    }
                  >
                    {field}
                  </button>
                )
              })}
            </div>
            <strong>Direitos de aprendizagem</strong>
            <div className="chip-grid">
              {rights.map((right) => {
                const active = (values.bnccRights ?? '')
                  .split('|')
                  .includes(right)
                return (
                  <button
                    key={right}
                    type="button"
                    className="secondary bncc-chip"
                    aria-pressed={active}
                    onClick={() =>
                      set('bnccRights', togglePipe(values.bnccRights, right))
                    }
                  >
                    {right}
                  </button>
                )
              })}
            </div>
          </div>
        </details>
      )}

      {item.form === 'declaracao' && (
        <p className="school-materials">
          Preencha os dados do comparecimento. A declaração já inclui campo de
          assinatura da escola.
        </p>
      )}

      {!item.task &&
        !isNotice &&
        !isPanel &&
        item.fields
          ?.filter((field) => !isPlan || isWeeklyPlan || field.key !== 'conduct')
          .map((field) =>
            field.type === 'long' ? (
              <label key={field.key}>
                {field.label}
                <textarea
                  value={values[field.key] ?? ''}
                  maxLength={1500}
                  rows={field.key === 'items' ? 6 : 4}
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
            maxLength={3000}
            rows={6}
            onChange={(event) => set('body', event.target.value)}
          />
        </label>
      )}

      {!fits && (
        <p role="alert" className="school-warning">
          O texto passou do espaço da folha. Encurte a mensagem ou escolha uma
          distribuição maior (2 vias ou A4 inteiro).
        </p>
      )}

      {isPlan && !isWeeklyPlan && (
        <fieldset className="school-moments">
          <legend>Momentos da aula</legend>
          {!values.planSteps && (
            <label className="check">
              <input
                type="checkbox"
                checked={values.extended === 'yes'}
                onChange={(event) =>
                  set('extended', event.target.checked ? 'yes' : 'no')
                }
              />
              Incluir extensão ou adaptação
            </label>
          )}
          <p>
            Duração total: <strong>{planMinutes(values)} min</strong>
          </p>
          {planMoments(values).map((moment, index) => (
            <div className="school-moment" key={index}>
              <div className="school-form-grid">
                <label>
                  Nome da etapa
                  <input
                    type="text"
                    maxLength={85}
                    value={moment.label}
                    onChange={(event) =>
                      changeMoment(index, { label: event.target.value })
                    }
                  />
                </label>
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
              </div>
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
              maxLength={120}
              value={values.command ?? activityCommand(item, values)}
              onChange={(event) => set('command', event.target.value)}
            />
          </label>
          {['criar-contagem', 'criar-pares', 'criar-tracado'].includes(
            item.id,
          ) && (
            <label>
              Conjunto de figuras
              <select
                value={values.group ?? 'fruit'}
                onChange={(event) => set('group', event.target.value)}
              >
                {activityGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {item.id === 'criar-tracado' && (
            <label>
              Quantidade de caminhos
              <select
                value={values.traceCount ?? '4'}
                onChange={(event) => set('traceCount', event.target.value)}
              >
                <option value="3">3 caminhos largos</option>
                <option value="4">4 caminhos variados</option>
              </select>
            </label>
          )}
          {item.task?.mode === 'match' && (
            <div>
              <button
                type="button"
                className="secondary"
                onClick={shufflePairs}
              >
                <Shuffle size={16} aria-hidden="true" /> Embaralhar coluna direita
              </button>
            </div>
          )}
          {(item.task?.mode === 'table' || item.task?.mode === 'count') && (
            <>
              <fieldset className="school-moments">
                <legend>Quantidade de figuras (1 a 6)</legend>
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
                        {[1, 2, 3, 4, 5, 6].map((number) => (
                          <option key={number}>{number}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label>
                Pergunta final da folha
                <input
                  type="text"
                  maxLength={95}
                  value={
                    values.footerQuestion ??
                    'Qual grupo tem mais figuras? Circule ou escreva como descobriu:'
                  }
                  onChange={(event) =>
                    set('footerQuestion', event.target.value)
                  }
                />
              </label>
            </>
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
          <details className="hints-box">
            <summary>Editar itens, textos e elementos desta ficha</summary>
            <div className="hints-controls">
              {(item.task?.mode === 'count' || item.task?.mode === 'table') && (() => {
                const groups = worksheetGroups(item, values)
                const rows = groups.map((label, idx) => ({
                  label,
                  qty: worksheetQuantity(values, idx),
                }))
                return (
                  <div className="task-sublist">
                    {rows.map((row, idx) => (
                      <div className="task-sublist-row" key={idx}>
                        <input
                          type="text"
                          aria-label={'Nome do item ' + (idx + 1)}
                          maxLength={40}
                          value={row.label}
                          onChange={(e) => {
                            const next = [...rows]
                            next[idx] = { ...next[idx], label: e.target.value }
                            updateCustomItems({ rows: next })
                          }}
                        />
                        {rows.length > 2 && (
                          <button
                            type="button"
                            className="secondary"
                            onClick={() =>
                              updateCustomItems({
                                rows: rows.filter((_, i) => i !== idx),
                              })
                            }
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    ))}
                    {rows.length < 4 && (
                      <button
                        type="button"
                        className="secondary"
                        onClick={() =>
                          updateCustomItems({
                            rows: [...rows, { label: 'Flores', qty: 3 }],
                          })
                        }
                      >
                        + Adicionar linha na tabela
                      </button>
                    )}
                  </div>
                )
              })()}

              {item.task?.mode === 'trace' && (() => {
                const tracks = traceTracks(item, values)
                return (
                  <div className="task-sublist">
                    {tracks.map((track, idx) => (
                      <div className="task-pair-row" key={idx}>
                        <input
                          type="text"
                          aria-label={'Início do caminho ' + (idx + 1)}
                          maxLength={35}
                          value={track.from}
                          onChange={(e) => {
                            const next = [...tracks]
                            next[idx] = { ...next[idx], from: e.target.value }
                            updateCustomItems({ tracks: next })
                          }}
                        />
                        <select
                          aria-label={'Tipo do caminho ' + (idx + 1)}
                          value={track.kind}
                          onChange={(e) => {
                            const next = [...tracks]
                            next[idx] = {
                              ...next[idx],
                              kind: e.target.value as TraceTrack['kind'],
                            }
                            updateCustomItems({ tracks: next })
                          }}
                        >
                          <option value="straight">Reto</option>
                          <option value="wave">Ondulado</option>
                          <option value="zigzag">Zigue-zague</option>
                          <option value="arc">Arco</option>
                        </select>
                        <input
                          type="text"
                          aria-label={'Fim do caminho ' + (idx + 1)}
                          maxLength={35}
                          value={track.to}
                          onChange={(e) => {
                            const next = [...tracks]
                            next[idx] = { ...next[idx], to: e.target.value }
                            updateCustomItems({ tracks: next })
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )
              })()}

              {item.task?.mode === 'draw-frame' && (
                <label>
                  Legenda abaixo do quadro de desenho
                  <input
                    type="text"
                    maxLength={90}
                    value={
                      parseCustomItems(values)?.prompt ??
                      worksheetGroups(item, values)[0] ??
                      ''
                    }
                    onChange={(e) =>
                      updateCustomItems({ prompt: e.target.value })
                    }
                  />
                </label>
              )}

              {['match', 'story', 'sort', 'names', 'pattern'].includes(
                item.task?.mode ?? '',
              ) && (() => {
                const list = worksheetGroups(item, values)
                const custom = parseCustomItems(values)
                return (
                  <div className="task-sublist">
                    {item.task?.mode === 'pattern' ? (
                      <p>
                        Edite os nomes das figuras (Maçã, Banana, Pera, Morango,
                        Sol, Flor, Bola, Livro) separados por vírgula:
                      </p>
                    ) : (
                      list.map((label, idx) => (
                        <div className="task-sublist-row" key={idx}>
                          <input
                            type="text"
                            aria-label={'Elemento ' + (idx + 1)}
                            maxLength={50}
                            value={label}
                            onChange={(e) => {
                              const next = [...list]
                              next[idx] = e.target.value
                              updateCustomItems({ prompts: next })
                            }}
                          />
                        </div>
                      ))
                    )}
                    {item.task?.mode === 'sort' && (
                      <div className="school-form-grid">
                        <label>
                          Caixa da esquerda
                          <input
                            type="text"
                            maxLength={40}
                            value={
                              custom?.sortLabels?.[0] ??
                              item.task.sortLabels?.[0] ??
                              'Grupo 1'
                            }
                            onChange={(e) =>
                              updateCustomItems({
                                sortLabels: [
                                  e.target.value,
                                  custom?.sortLabels?.[1] ??
                                    item.task?.sortLabels?.[1] ??
                                    'Grupo 2',
                                ],
                              })
                            }
                          />
                        </label>
                        <label>
                          Caixa da direita
                          <input
                            type="text"
                            maxLength={40}
                            value={
                              custom?.sortLabels?.[1] ??
                              item.task.sortLabels?.[1] ??
                              'Grupo 2'
                            }
                            onChange={(e) =>
                              updateCustomItems({
                                sortLabels: [
                                  custom?.sortLabels?.[0] ??
                                    item.task?.sortLabels?.[0] ??
                                    'Grupo 1',
                                  e.target.value,
                                ],
                              })
                            }
                          />
                        </label>
                      </div>
                    )}
                    {item.task?.mode === 'pattern' && (
                      <>
                        <label>
                          Fileira 1
                          <input
                            type="text"
                            value={(
                              custom?.patternRows?.[0] ?? [
                                'Maçã',
                                'Banana',
                                'Maçã',
                                'Banana',
                                'Maçã',
                              ]
                            ).join(', ')}
                            onChange={(e) => {
                              const row1 = e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean)
                                .slice(0, 6)
                              updateCustomItems({
                                patternRows: [
                                  row1,
                                  custom?.patternRows?.[1] ?? [
                                    'Pera',
                                    'Pera',
                                    'Maçã',
                                    'Pera',
                                    'Pera',
                                  ],
                                  [],
                                ],
                              })
                            }}
                          />
                        </label>
                        <label>
                          Fileira 2
                          <input
                            type="text"
                            value={(
                              custom?.patternRows?.[1] ?? [
                                'Pera',
                                'Pera',
                                'Maçã',
                                'Pera',
                                'Pera',
                              ]
                            ).join(', ')}
                            onChange={(e) => {
                              const row2 = e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean)
                                .slice(0, 6)
                              updateCustomItems({
                                patternRows: [
                                  custom?.patternRows?.[0] ?? [
                                    'Maçã',
                                    'Banana',
                                    'Maçã',
                                    'Banana',
                                    'Maçã',
                                  ],
                                  row2,
                                  [],
                                ],
                              })
                            }}
                          />
                        </label>
                      </>
                    )}
                  </div>
                )
              })()}
            </div>
          </details>
        </>
      )}

      {isCards && (
        <>
          <label className="check">
            <input
              type="checkbox"
              checked={values.memoryMode === 'yes'}
              onChange={(event) =>
                set('memoryMode', event.target.checked ? 'yes' : 'no')
              }
            />
            Duplicar cartões para Jogo da Memória (2 folhas de pares)
          </label>
          <details className="hints-box">
            <summary>Editar palavras dos cartões</summary>
            <div className="hints-controls">
              {worksheetGroups(item, values).map((label, idx, list) => (
                <input
                  key={idx}
                  type="text"
                  aria-label={'Cartão ' + (idx + 1)}
                  maxLength={50}
                  value={label}
                  onChange={(e) => {
                    const next = [...list]
                    next[idx] = e.target.value
                    updateCustomItems({ prompts: next })
                  }}
                />
              ))}
            </div>
          </details>
          <div className="school-materials">
            <h3>O que preparar</h3>
            <p>{item.task!.supplies}</p>
            <p>{item.task!.adaptation}</p>
          </div>
        </>
      )}

      {isExperience && (
        <>
          <label>
            O que preparar
            <textarea
              rows={2}
              maxLength={400}
              value={values.supplies ?? item.task!.supplies}
              onChange={(e) => set('supplies', e.target.value)}
            />
          </label>
          <label>
            Passos da vivência (um por linha)
            <textarea
              rows={4}
              maxLength={800}
              value={values.stepsText ?? item.task!.steps.join('\n')}
              onChange={(e) => set('stepsText', e.target.value)}
            />
          </label>
          <label>
            Como adaptar e incluir
            <textarea
              rows={2}
              maxLength={400}
              value={values.adaptation ?? item.task!.adaptation}
              onChange={(e) => set('adaptation', e.target.value)}
            />
          </label>
          <label>
            O que observar
            <textarea
              rows={2}
              maxLength={400}
              value={values.guide ?? item.task!.guide ?? ''}
              onChange={(e) => set('guide', e.target.value)}
            />
          </label>
        </>
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
              ? 'Recorte os cartões e siga o mapa do guia. Cabeçalho de 18,2 × 4,2 cm e peças organizadas para recorte limpo.'
              : 'Folhas A4 com sobreposição de 5 mm e mapa de alinhamento incluído na 1ª página.'}
          </p>
        </div>
      )}
      {printStyleBox}
    </div>
  )

  return (
    <div className="school-editor">
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
        catalogUrl={
          typeof state?.catalogUrl === 'string' && state.catalogUrl.startsWith('/app/colecao')
            ? state.catalogUrl
            : '/app/colecao?ferramenta=' + item.tool
        }
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

export default function ClassroomRoute() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const item = findClassroomItem(id)
  if (!item)
    return (
      <>
        <h1>Material não encontrado</h1>
        <Link to="/app/colecao">Voltar aos modelos</Link>
      </>
    )
  if (item.ready)
    return <ReadyMaterial key={item.id} item={{ ...item, ready: item.ready }} />
  if (item.visual) {
    const editor = new URLSearchParams({ colecao: item.id })
    if (params.has('rascunho')) editor.set('rascunho', params.get('rascunho')!)
    return <Navigate replace to={'/app/criar/' + item.tool + '?' + editor} />
  }
  return (
    <SchoolEditor
      key={item.id + ':' + (params.get('rascunho') ?? '')}
      item={item}
      draftId={params.get('rascunho')}
    />
  )
}
