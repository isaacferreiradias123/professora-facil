import { useState } from 'react'
import type { Tool } from './catalog'
import { loadPack, type PackTemplate } from './template-pack'

export function PackPicker({
  tool,
  selected,
  onSelect,
}: {
  tool: Tool
  selected?: string
  onSelect: (value: PackTemplate) => void
}) {
  const [items, setItems] = useState<PackTemplate[] | null>(null)
  const [state, setState] = useState('')
  async function open() {
    setState('Carregando…')
    try {
      setItems(await loadPack(tool))
      setState('')
    } catch {
      setState('Não foi possível carregar os modelos. Tente novamente.')
    }
  }
  return (
    <div className="pack-picker">
      {items ? (
        <label>
          Modelos da coleção
          <select
            value={selected ?? ''}
            onChange={(event) => {
              const item = items.find(
                (entry) => entry.id === event.target.value,
              )
              if (item) onSelect(item)
            }}
          >
            <option value="">Escolha um modelo</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <button type="button" className="secondary" onClick={() => void open()}>
          Ver modelos da coleção
        </button>
      )}
      {state && <p role="status">{state}</p>}
    </div>
  )
}
