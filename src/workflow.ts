import { useEffect, useState } from 'react'
import { useBeforeUnload, useBlocker, useNavigate } from 'react-router-dom'
import { drafts, newId, type Values } from './store'
import type { Tool } from './catalog'
import type { PackTemplate } from './template-pack'
import { clearRecovery, recover, recoveryPrefix } from './draft-transfer'

export interface EditorProps {
  tool: Tool
  model: number
  draftId: string | null
  recoveryId?: string
  age?: number
  preset?: PackTemplate
}
export function useWorkflow(
  { tool, draftId, model, age, preset, recoveryId }: EditorProps,
  initial: () => Values,
) {
  const recoveryKey =
    recoveryPrefix +
    tool +
    ':' +
    (draftId ?? recoveryId ?? preset?.id ?? model + ':' + (age ?? ''))
  const [recovered] = useState(() => recover(recoveryKey))
  const [values, setValues] = useState(() => ({ ...initial(), ...recovered }))
  const [id, setId] = useState(draftId)
  const [name, setName] = useState('')
  const [dirty, setDirty] = useState(Boolean(recovered))
  const [loading, setLoading] = useState(Boolean(draftId))
  const [unavailable, setUnavailable] = useState(false)
  const [message, setMessage] = useState(
    recovered
      ? 'Edição recuperada neste navegador. Os anexos precisam ser selecionados novamente.'
      : '',
  )
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const set = (key: string, value: string) => {
    setValues((v) => ({ ...v, [key]: value }))
    setDirty(true)
  }
  const replace = (next: Values) => {
    setValues(next)
    setDirty(true)
  }
  useEffect(() => {
    if (!draftId) return
    let active = true
    void drafts
      .get(draftId)
      .then((d) => {
        if (!active) return
        if (!d || d.tool !== tool) throw new Error()
        setValues((defaults) => ({ ...defaults, ...d.values, ...recovered }))
        setName(d.name)
        if (d.needsFiles)
          setMessage(
            'Selecione os anexos novamente para incluí-los na próxima exportação.',
          )
      })
      .catch(() => {
        if (active) {
          setError('Este rascunho não pôde ser aberto.')
          setUnavailable(true)
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [draftId, tool, recovered])
  useEffect(() => {
    if (!dirty || loading || unavailable) return
    try {
      localStorage.setItem(recoveryKey, JSON.stringify(values))
    } catch {
      /* manual saving remains available */
    }
  }, [dirty, loading, unavailable, recoveryKey, values])
  useBeforeUnload((e) => {
    if (dirty) {
      e.preventDefault()
      e.returnValue = ''
    }
  })
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search),
  )
  useEffect(() => {
    if (blocker.state === 'blocked') {
      if (window.confirm('Sair sem salvar as alterações?')) {
        clearRecovery(recoveryKey)
        blocker.proceed()
      } else blocker.reset()
    }
  }, [blocker, recoveryKey])
  async function save(needsFiles = false) {
    setError('')
    setMessage('')
    try {
      const next = id ?? newId()
      await drafts.put({
        id: next,
        version: 1,
        tool,
        name: name || values.title || 'Material sem título',
        values,
        updated: Date.now(),
        needsFiles,
      })
      setId(next)
      setDirty(false)
      clearRecovery(recoveryKey)
      setMessage(
        needsFiles
          ? 'Rascunho salvo. Selecione os anexos novamente quando voltar.'
          : 'Rascunho salvo em Meus materiais.',
      )
    } catch {
      setError(
        'Não foi possível salvar. Verifique o espaço disponível no navegador.',
      )
    }
  }
  return {
    values,
    set,
    replace,
    setDirty,
    message,
    setMessage,
    error,
    setError,
    loading,
    unavailable,
    save,
    exit: () => navigate('/app/criar'),
  }
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30000)
}
export function filename(title: string) {
  return (
    title
      .normalize('NFC')
      .replace(/[^\p{L}\p{N} _-]/gu, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 90) || 'material'
  )
}
export function printBlob(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const frame = document.createElement('iframe')
  frame.title = 'Documento para impressão'
  frame.style.position = 'fixed'
  frame.style.width = '1px'
  frame.style.height = '1px'
  frame.style.opacity = '0'
  frame.style.pointerEvents = 'none'
  frame.onload = () => {
    frame.contentWindow?.focus()
    frame.contentWindow?.print()
  }
  frame.src = url
  document.body.append(frame)
  setTimeout(() => {
    frame.remove()
    URL.revokeObjectURL(url)
  }, 120000)
}
