import { Upload } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useEffect, useId, useState, type ReactNode } from 'react'

export function Stages({
  step,
  reached,
  change,
  disabled,
}: {
  step: number
  reached: number
  change: (step: number) => void
  disabled?: boolean
}) {
  return (
    <ol className="editor-stages" aria-label="Etapas do material">
      {['Escolher', 'Editar', 'Baixar'].map((label, index) => (
        <li key={label} aria-current={step === index ? 'step' : undefined}>
          <button
            type="button"
            disabled={disabled || index > reached || index === step}
            onClick={() => change(index)}
          >
            {index + 1}. {label}
          </button>
        </li>
      ))}
    </ol>
  )
}

export function FileDrop({
  label,
  instructions,
  accept,
  multiple,
  disabled,
  onFiles,
}: {
  label: string
  instructions: string
  accept: string
  multiple?: boolean
  disabled?: boolean
  onFiles: (files: File[]) => void
}) {
  const id = useId()
  const [over, setOver] = useState(false)
  return (
    <label
      className={'file-drop' + (over ? ' is-over' : '')}
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault()
        setOver(false)
        if (!disabled)
          onFiles(
            Array.from(event.dataTransfer.files).slice(
              0,
              multiple ? undefined : 1,
            ),
          )
      }}
    >
      <input
        type="file"
        aria-label={label}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        aria-describedby={id}
        onChange={(event) => {
          onFiles(Array.from(event.currentTarget.files ?? []))
          event.currentTarget.value = ''
        }}
      />
      <span className="drop-label">
        <Upload size={21} aria-hidden="true" />
        {label}
      </span>
      <span id={id}>{instructions}</span>
    </label>
  )
}

export function AdjustLayout({
  form,
  preview,
  catalogUrl,
}: {
  form: ReactNode
  preview: ReactNode
  catalogUrl: string
}) {
  const id = useId()
  const [view, setView] = useState<'edit' | 'preview'>('edit')
  const [step, setStep] = useState<'adjust' | 'download'>('adjust')
  const { state } = useLocation()
  const origin = typeof state?.catalogUrl === 'string' && state.catalogUrl.startsWith('/app/colecao')
    ? state.catalogUrl
    : catalogUrl
  return (
    <div className="adjust-layout" data-view={view} data-editor-step>
      <nav className="editor-steps-guide" aria-label="Etapas do material">
        <Link to={origin} aria-label="Escolher outro modelo">1. Escolher</Link>
        <button
          type="button"
          className="secondary"
          aria-current={step === 'adjust' ? 'step' : undefined}
          onClick={(event) => {
            const form = event.currentTarget.closest('.adjust-layout')
            setView('edit')
            setStep('adjust')
            requestAnimationFrame(() => form?.querySelector<HTMLElement>('.adjust-form input:not([type="hidden"]), .adjust-form textarea, .adjust-form select')?.focus())
          }}
        >
          2. Ajustar
        </button>
        <button
          type="button"
          className="secondary"
          aria-current={step === 'download' ? 'step' : undefined}
          onClick={(event) => {
            const action = event.currentTarget.closest('.school-editor')
              ?.querySelector<HTMLButtonElement>('.pinned-action button')
            setView('preview')
            setStep('download')
            if (!action?.disabled) action?.focus()
          }}
        >
          3. Baixar
        </button>
      </nav>
      <div
        className="preview-switch"
        role="group"
        aria-label="Visualização do editor"
      >
        <button
          type="button"
          aria-pressed={view === 'edit'}
          aria-controls={id + '-edit'}
          onClick={() => { setView('edit'); setStep('adjust') }}
        >
          Editar
        </button>
        <button
          type="button"
          aria-pressed={view === 'preview'}
          aria-controls={id + '-preview'}
          onClick={() => setView('preview')}
        >
          Ver prévia
        </button>
      </div>
      <div className="adjust-form" id={id + '-edit'}>
        {form}
      </div>
      <section
        className="adjust-preview"
        id={id + '-preview'}
        aria-label="Prévia do material"
      >
        {preview}
      </section>
    </div>
  )
}

export function PreviewFeedback({ revision }: { revision: string }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 220)
    const hide = setTimeout(() => setVisible(false), 1450)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
      setVisible(false)
    }
  }, [revision])
  return (
    <span
      className="preview-feedback"
      data-visible={visible}
      aria-hidden="true"
    >
      Prévia atualizada
    </span>
  )
}
