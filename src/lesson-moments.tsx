import { useId } from 'react'

export interface Moment {
  title: string
  minutes: number
}

export function parseMoments(value?: string): Moment[] {
  if (!value) return []
  try {
    const data: unknown = JSON.parse(value)
    if (!Array.isArray(data)) return []
    return data
      .slice(0, 12)
      .filter(
        (item): item is Moment =>
          item &&
          typeof item.title === 'string' &&
          item.title.length <= 160 &&
          Number.isInteger(item.minutes) &&
          item.minutes >= 0 &&
          item.minutes <= 180,
      )
  } catch {
    return []
  }
}

export function LessonMoments({
  value,
  duration,
  onChange,
}: {
  value?: string
  duration?: string
  onChange: (value: string) => void
}) {
  const id = useId()
  const items = parseMoments(value)
  const total = items.reduce((sum, item) => sum + item.minutes, 0)
  const limit =
    Number(duration?.match(/^\s*(\d+)\s*(?:min(?:uto)?s?)?\s*$/i)?.[1]) || 0
  const update = (items: Moment[]) => onChange(JSON.stringify(items))
  const move = (index: number, delta: number) => {
    const next = items.slice()
    ;[next[index], next[index + delta]] = [next[index + delta], next[index]]
    update(next)
    requestAnimationFrame(() =>
      document.getElementById(id + (index + delta))?.focus(),
    )
  }
  return (
    <fieldset className="lesson-moments">
      <legend>Momentos da aula</legend>
      <p role="status">
        {total} min planejados
        {limit > 0 && total > limit
          ? ' · A duração informada foi excedida.'
          : ''}
      </p>
      {items.map((item, index) => (
        <div className="lesson-moment" key={index}>
          <label>
            Momento {index + 1}
            <input
              id={id + index}
              maxLength={160}
              value={item.title}
              onChange={(event) =>
                update(
                  items.map((row, i) =>
                    i === index ? { ...row, title: event.target.value } : row,
                  ),
                )
              }
            />
          </label>
          <label>
            Minutos do momento {index + 1}
            <input
              type="number"
              min="0"
              max="180"
              value={item.minutes}
              onChange={(event) =>
                update(
                  items.map((row, i) =>
                    i === index
                      ? {
                          ...row,
                          minutes: Math.min(
                            180,
                            Math.max(
                              0,
                              Math.trunc(Number(event.target.value)) || 0,
                            ),
                          ),
                        }
                      : row,
                  ),
                )
              }
            />
          </label>
          <div className="actions">
            <button
              type="button"
              className="secondary"
              disabled={index === 0}
              onClick={() => move(index, -1)}
              aria-label={'Subir momento ' + (index + 1)}
            >
              Subir
            </button>
            <button
              type="button"
              className="secondary"
              disabled={index === items.length - 1}
              onClick={() => move(index, 1)}
              aria-label={'Descer momento ' + (index + 1)}
            >
              Descer
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => update(items.filter((_, i) => i !== index))}
              aria-label={'Remover momento ' + (index + 1)}
            >
              Remover
            </button>
          </div>
        </div>
      ))}
      <div>
        <button
          type="button"
          className="secondary"
          disabled={items.length >= 12}
          onClick={() => {
            update([...items, { title: '', minutes: 0 }])
            requestAnimationFrame(() =>
              document.getElementById(id + items.length)?.focus(),
            )
          }}
        >
          Adicionar momento
        </button>
      </div>
    </fieldset>
  )
}
