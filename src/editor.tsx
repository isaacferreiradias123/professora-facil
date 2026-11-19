import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { bncc, catalog, tools } from './catalog'
import {
  chooseFields,
  details,
  material,
  seed,
  type Field,
  type Material,
} from './model'
import { useEasy } from './pages'
import {
  download,
  filename,
  printBlob,
  useWorkflow,
  type EditorProps,
} from './workflow'

import { groups } from './catalog'
import { LessonMoments } from './lesson-moments'

import { AdjustLayout, FileDrop, PreviewFeedback, Stages } from './editor-ui'
import { presetValues, worksheetUrl, type PackTemplate } from './template-pack'
import { PackPicker } from './template-controls'
import { withWorksheet } from './worksheet-export'

function Input({
  field,
  value,
  set,
}: {
  field: Field
  value: string
  set: (v: string) => void
}) {
  const { key, label, kind, options, optional } = field
  if (kind === 'checks')
    return (
      <fieldset className="wide">
        <legend>{label}</legend>
        {options?.map((option) => (
          <label key={option} className="check">
            <input
              type="checkbox"
              checked={value.split('|').includes(option)}
              onChange={(e) => {
                const chosen = value.split('|').filter((x) => x && x !== option)
                set((e.target.checked ? [...chosen, option] : chosen).join('|'))
              }}
            />
            {option}
          </label>
        ))}
      </fieldset>
    )
  return (
    <label className={kind === 'long' ? 'wide' : undefined}>
      {label}
      {optional ? ' (opcional)' : ''}
      {kind === 'select' ? (
        <select value={value} onChange={(e) => set(e.target.value)}>
          {options?.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : kind === 'long' ? (
        <textarea
          maxLength={8000}
          value={value}
          onChange={(e) => set(e.target.value)}
        />
      ) : (
        <input
          value={value}
          type={kind === 'date' || kind === 'number' ? kind : 'text'}
          min={kind === 'number' ? 1 : undefined}
          max={kind === 'number' ? 12 : undefined}
          maxLength={120}
          required={key === 'title' || kind === 'number'}
          onChange={(e) => set(e.target.value)}
        />
      )}
    </label>
  )
}
function Preview({ data }: { data: Material }) {
  return (
    <article className="preview-doc" data-accent={data.accent}>
      <h2>{data.title}</h2>
      {data.metadata.length > 0 && <p>{data.metadata.join(' · ')}</p>}
      {data.sections.map((section, i) => (
        <section key={i}>
          {section.title && <h3>{section.title}</h3>}
          {section.blocks.map((b, j) => {
            if (b.kind === 'text') return <p key={j}>{b.text}</p>
            if (b.kind === 'list') {
              const List = b.numbered ? 'ol' : 'ul'
              return (
                <List key={j}>
                  {b.items.map((item, k) => (
                    <li key={k}>{item}</li>
                  ))}
                </List>
              )
            }
            if (b.kind === 'table')
              return (
                <table key={j}>
                  <tbody>
                    {b.rows.map((row, k) => (
                      <tr key={k}>
                        {row.map((cell, l) => (
                          <td key={l}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            return <ImageBlock key={j} block={b} />
          })}
        </section>
      ))}
    </article>
  )
}
function ImageBlock({
  block,
}: {
  block: Extract<
    Material['sections'][number]['blocks'][number],
    { kind: 'image' }
  >
}) {
  const data = Array.from(block.bytes, (byte) =>
    String.fromCharCode(byte),
  ).join('')
  return (
    <img src={'data:' + block.mime + ';base64,' + btoa(data)} alt={block.alt} />
  )
}
export default function Editor(props: EditorProps) {
  const { tool, model, age, preset } = props
  const models = catalog[tool]
  const initial =
    Number.isInteger(model) && model >= 0 && model < models.length ? model : 0
  const flow = useWorkflow(props, () => ({
    ...(preset
      ? presetValues(seed(tool, initial), preset)
      : seed(tool, initial)),
    ...(age !== undefined ? { group: groups[age] } : {}),
  }))
  const [step, setStep] = useState(0)
  const [reached, setReached] = useState(0)
  const [imported, setImported] = useState('')
  const [importMode, setImportMode] = useState(false)
  const [busy, setBusy] = useState(false)
  const easy = useEasy()
  const { values, set, replace, error, message, setError, setMessage } = flow
  const data = useMemo(() => material(tool, values), [tool, values])
  const sheet =
    tool === 'atividade' && values.group === groups[2]
      ? worksheetUrl(values.asset)
      : undefined
  const detail = [
    ...(details[tool] ?? []),
    ...(tool === 'atividade' && values.templateId
      ? ([
          { key: 'goal', label: 'Objetivo', kind: 'long' },
          { key: 'materials', label: 'Materiais', kind: 'long' },
          { key: 'steps', label: 'Passo a passo', kind: 'long' },
          { key: 'adaptation', label: 'Adaptações', kind: 'long' },
          { key: 'assessment', label: 'Registro', kind: 'long' },
        ] as Field[])
      : []),
  ]
  const preview = (
    <>
      <Preview data={data} />
      {sheet && (
        <figure className="worksheet-preview">
          <img src={sheet} alt={'Ficha A4 de ' + data.title} />
          <figcaption>
            <a href={sheet} download>
              Baixar ficha SVG
            </a>{' '}
            ·{' '}
            <a href={sheet} target="_blank" rel="noreferrer">
              Abrir ficha A4
            </a>
          </figcaption>
        </figure>
      )}
    </>
  )
  function selectPreset(template: PackTemplate) {
    replace({
      ...presetValues(seed(tool, 0), template),
      ...Object.fromEntries(
        ['school', 'teacher', 'class', 'date']
          .filter((key) => values[key])
          .map((key) => [key, values[key]]),
      ),
    })
    setImported('')
  }
  function choose(index: number) {
    const next = seed(tool, index)
    for (const field of ['school', 'teacher', 'class', 'date', 'group'])
      if (values[field]) next[field] = values[field]
    replace(next)
    setImported('')
    setError('')
  }
  function changeStep(n: number) {
    setError('')
    setReached((current) => Math.max(current, n))
    setStep(n)
    requestAnimationFrame(() => document.getElementById('editor-step')?.focus())
  }
  function next(e: FormEvent) {
    e.preventDefault()
    changeStep(step + 1)
  }
  async function read(file?: File) {
    if (!file) return
    setBusy(true)
    setError('')
    setImported('')
    try {
      const { readDocument } = await import('./import-document')
      const text = await readDocument(file)
      setImported(text)
      replace({
        ...values,
        title: 'Resposta ao documento',
        body: '',
        recipient: '',
        importMode: 'yes',
      })
      changeStep(1)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Não foi possível ler este documento.',
      )
    } finally {
      setBusy(false)
    }
  }
  async function output(type: 'pdf' | 'docx' | 'print') {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const exportData = sheet ? await withWorksheet(data, sheet) : data
      const blob =
        type === 'docx'
          ? await (await import('./word')).word(exportData)
          : await (await import('./pdf')).pdf(exportData)
      if (type === 'print') printBlob(blob)
      else download(blob, filename(data.title) + '.' + type)
      setMessage(
        type === 'print'
          ? 'Documento preparado. Use a opção de impressão do navegador.'
          : 'Material pronto. Confira a pasta de downloads.',
      )
    } catch {
      setError(
        'Não foi possível gerar o arquivo. Confira o conteúdo e tente novamente.',
      )
    } finally {
      setBusy(false)
    }
  }
  const field = (f: Field) => (
    <Input
      key={f.key}
      field={f}
      value={values[f.key] ?? ''}
      set={(v) => set(f.key, v)}
    />
  )
  const editForm = (
    <form id="material-editor-form" onSubmit={next}>
      {step === 0 ? (
        <>
          {tool === 'documento' && (
            <div className="actions">
              <button
                type="button"
                className={importMode ? 'secondary' : ''}
                onClick={() => setImportMode(false)}
              >
                Criar documento
              </button>
              <button
                type="button"
                className={importMode ? '' : 'secondary'}
                onClick={() => setImportMode(true)}
              >
                Abrir Word ou PDF
              </button>
            </div>
          )}
          {tool === 'documento' && importMode ? (
            <>
              <p>
                O arquivo é lido neste dispositivo. Você poderá consultar o
                texto e criar um novo documento a partir dele.
              </p>
              <FileDrop
                label="Selecionar documento"
                instructions="DOCX ou PDF de até 12 MB. O arquivo fica no navegador."
                accept=".docx,.pdf"
                disabled={busy}
                onFiles={([file]) => void read(file)}
              />
            </>
          ) : (
            <>
              <div className="form-grid">
                <label>
                  {tool === 'atividade' ? 'Tipo de atividade' : 'Modelo'}
                  <select
                    value={values.templateId ? '' : values.model}
                    onChange={(e) => choose(Number(e.target.value))}
                  >
                    {values.templateId && (
                      <option value="" disabled>
                        Modelo da coleção selecionado
                      </option>
                    )}
                    {models.map((m, i) => (
                      <option key={m} value={i}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>
                {chooseFields[tool]?.map(field)}
                <PackPicker
                  tool={tool}
                  selected={values.templateId}
                  onSelect={selectPreset}
                />
              </div>
              {(tool === 'atividade' || tool === 'plano-de-aula') && (
                <p>
                  <a href={bncc}>Consultar a BNCC do MEC</a>. Os objetivos
                  editáveis são sugestões pedagógicas. Confira eventuais códigos
                  na fonte oficial.
                </p>
              )}
            </>
          )}
        </>
      ) : (
        <>
          {values.importMode === 'yes' && (
            <details open={Boolean(imported)}>
              <summary>Texto do documento original</summary>
              {imported ? (
                <div className="file-text">{imported}</div>
              ) : (
                <p>
                  Para consultar o original novamente, volte à etapa anterior e
                  abra o arquivo.
                </p>
              )}
            </details>
          )}
          <div className="form-grid">
            {detail.filter((f) => !easy || !f.optional).map(field)}
            {easy && detail.some((f) => f.optional) && (
              <details className="wide">
                <summary>Informações opcionais</summary>
                <div className="form-grid">
                  {detail.filter((f) => f.optional).map(field)}
                </div>
              </details>
            )}
          </div>
          {tool === 'plano-de-aula' && (
            <LessonMoments
              value={values.moments}
              duration={values.duration}
              onChange={(value) => set('moments', value)}
            />
          )}
        </>
      )}
    </form>
  )
  const nextActions = (
    <div className="actions pinned-action">
      {step > 0 && (
        <button
          type="button"
          className="secondary"
          onClick={() => changeStep(step - 1)}
        >
          Voltar
        </button>
      )}
      {!(step === 0 && tool === 'documento' && importMode) && (
        <button type="submit" form="material-editor-form" disabled={busy}>
          {step === 0 ? 'Personalizar' : 'Conferir material'}
        </button>
      )}
    </div>
  )
  if (flow.loading) return <p role="status">Abrindo rascunho…</p>
  if (flow.unavailable)
    return (
      <>
        <p role="alert">{error}</p>
        <Link to="/app/materiais">Voltar aos materiais</Link>
      </>
    )
  return (
    <>
      <button className="secondary" onClick={flow.exit}>
        Voltar às ferramentas
      </button>
      <h1>{tools[tool].name}</h1>
      <div className="card editor-card">
        <Stages
          step={step}
          reached={reached}
          disabled={busy}
          change={(next) => {
            if (next !== 2 || values.title?.trim()) changeStep(next)
          }}
        />
        <h2 id="editor-step" tabIndex={-1}>
          {['Escolher', 'Personalizar', 'Conferir'][step]}
        </h2>
        {easy && (
          <details>
            <summary>Ajuda nesta etapa</summary>
            <p>
              {
                [
                  'Escolha um modelo para começar.',
                  'Altere os textos e informações para sua turma.',
                  'Confira o material e escolha como quer usá-lo.',
                ][step]
              }
            </p>
          </details>
        )}
        <p role="status">{busy ? 'Preparando…' : message}</p>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {step < 2 ? (
          <>
            {step === 1 ? (
              <AdjustLayout
                form={editForm}
                preview={
                  <>
                    <PreviewFeedback revision={JSON.stringify(values)} />
                    {preview}
                  </>
                }
              />
            ) : (
              <div data-editor-step>{editForm}</div>
            )}
            {nextActions}
          </>
        ) : (
          <>
            {preview}
            <div className="actions pinned-action">
              <button className="secondary" onClick={() => changeStep(1)}>
                Editar
              </button>
              <button disabled={busy} onClick={() => void output('pdf')}>
                Baixar PDF
              </button>
              <button disabled={busy} onClick={() => void output('docx')}>
                Baixar Word
              </button>
              <button
                disabled={busy}
                className="secondary"
                onClick={() => void output('print')}
              >
                Imprimir
              </button>
              <button
                disabled={busy}
                className="secondary"
                onClick={() => void flow.save(values.importMode === 'yes')}
              >
                Salvar rascunho
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
