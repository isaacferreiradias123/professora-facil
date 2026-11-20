import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from 'lucide-react'
import { figures } from './art-figures'
import type {
  ClassroomItem,
  TaskHeaderStyle,
  TaskQuestion,
  TaskQuestionKind,
} from './classroom-catalog'
import { initialValues } from './classroom-layout'
import { openImage, validateImage } from './media'
import { loadSchoolProfile } from './school-profile'
import type { Values } from './store'
import {
  defaultTaskQuestion,
  parseTaskQuestions,
  serializeTaskQuestions,
  taskHeaderSettings,
} from './task-builder'

const kindLabels: Record<TaskQuestionKind, string> = {
  lines: 'Resposta em linhas',
  space: 'Espaço de desenho / cálculo',
  choice: 'Múltipla escolha',
  tf: 'Verdadeiro ou Falso',
  match: 'Ligue as colunas',
  section: 'Texto de apoio',
}

async function fileToCompactPngDataUrl(file: File, maxSide = 420): Promise<string> {
  await validateImage(file)
  const blobUrl = URL.createObjectURL(file)
  try {
    const img = await openImage(blobUrl)
    const ratio = Math.min(1, maxSide / Math.max(img.naturalWidth || 1, img.naturalHeight || 1))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round((img.naturalWidth || maxSide) * ratio))
    canvas.height = Math.max(1, Math.round((img.naturalHeight || maxSide) * ratio))
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    const result = canvas.toDataURL('image/png')
    canvas.width = 0
    return result
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
}

export function TaskBuilderView({
  item,
  values,
  set,
  replace,
  onNotify,
}: {
  item: ClassroomItem
  values: Values
  set: (key: string, value: string) => void
  replace: (next: Values) => void
  onNotify: (message: string) => void
}) {
  const cfg = taskHeaderSettings(item, values)
  const questions = parseTaskQuestions(item, values)

  function updateQuestions(next: TaskQuestion[]) {
    set('questions', serializeTaskQuestions(next))
  }

  function patchQuestion(index: number, patch: Partial<TaskQuestion>) {
    const next = [...questions]
    next[index] = { ...next[index], ...patch }
    updateQuestions(next)
  }

  function addQuestion(kind: TaskQuestionKind) {
    const questionCount = questions.filter((q) => q.kind !== 'section').length
    updateQuestions([...questions, defaultTaskQuestion(kind, questionCount + 1)])
  }

  function moveQuestion(index: number, delta: -1 | 1) {
    const target = index + delta
    if (target < 0 || target >= questions.length) return
    const next = [...questions]
    ;[next[index], next[target]] = [next[target], next[index]]
    updateQuestions(next)
  }

  function duplicateQuestion(index: number) {
    const source = questions[index]
    const copy: TaskQuestion = {
      ...source,
      id: 'q' + Math.random().toString(36).slice(2, 8),
      options: source.options ? [...source.options] : undefined,
      pairs: source.pairs ? source.pairs.map(([a, b]) => [a, b] as [string, string]) : undefined,
    }
    const next = [...questions]
    next.splice(index + 1, 0, copy)
    updateQuestions(next)
  }

  function removeQuestion(index: number) {
    if (questions.length <= 1) return
    updateQuestions(questions.filter((_, i) => i !== index))
  }

  function applySchoolProfile() {
    const profile = loadSchoolProfile()
    if (!profile.school && !profile.teacher && !profile.classroom) {
      onNotify('Salve os dados da sua escola na tela Início para preencher em 1 clique.')
      return
    }
    replace({
      ...values,
      school: profile.school || values.school,
      teacher: profile.teacher || values.teacher,
      classroom: profile.classroom || values.classroom,
    })
    onNotify('Dados da escola preenchidos no cabeçalho.')
  }

  async function handleLogoUpload(file?: File) {
    if (!file) return
    try {
      const dataUrl = await fileToCompactPngDataUrl(file, 260)
      set('logoDataUrl', dataUrl)
      onNotify('Logotipo da escola adicionado ao cabeçalho.')
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Não foi possível carregar a imagem.')
    }
  }

  async function handleQuestionImage(index: number, file?: File) {
    if (!file) return
    try {
      const dataUrl = await fileToCompactPngDataUrl(file, 420)
      patchQuestion(index, { imageDataUrl: dataUrl })
      onNotify('Imagem adicionada à questão.')
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Não foi possível carregar a imagem.')
    }
  }

  let runningNumber = 0

  return (
    <div className="school-form task-builder">
      <div className="task-quick-actions">
        <button type="button" className="secondary" onClick={applySchoolProfile}>
          Preencher com minha escola
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            replace(initialValues(item))
            onNotify('Modelo restaurado para o original.')
          }}
        >
          Restaurar modelo original
        </button>
      </div>

      <fieldset className="task-section-box">
        <legend>1. Cabeçalho e estilo da folha</legend>

        <div className="task-header-styles" role="group" aria-label="Estilo do cabeçalho">
          {(
            [
              ['padrao', 'Padrão escolar', 'Quadro completo com escola, professora, turma, aluno e data'],
              ['ludico', 'Lúdico infantil', 'Moldura acolhedora com figura e nome em destaque'],
              ['compacto', 'Compacto', 'Economiza espaço na folha para caberem mais questões'],
            ] as [TaskHeaderStyle, string, string][]
          ).map(([id, label, hint]) => (
            <button
              key={id}
              type="button"
              className="secondary task-style-card"
              aria-pressed={cfg.headerStyle === id}
              onClick={() => set('headerStyle', id)}
            >
              <strong>{label}</strong>
              <small>{hint}</small>
            </button>
          ))}
        </div>

        <label>
          Título da tarefa ou avaliação
          <input
            type="text"
            maxLength={90}
            value={values.title ?? ''}
            onChange={(e) => set('title', e.target.value)}
          />
        </label>

        <div className="school-form-grid">
          <label>
            Escola
            <input
              type="text"
              maxLength={70}
              placeholder="Ex.: E.M. Monteiro Lobato"
              value={values.school ?? ''}
              onChange={(e) => set('school', e.target.value)}
            />
          </label>
          <label>
            Professora
            <input
              type="text"
              maxLength={60}
              placeholder="Seu nome"
              value={values.teacher ?? ''}
              onChange={(e) => set('teacher', e.target.value)}
            />
          </label>
          <label>
            Turma / Ano
            <input
              type="text"
              maxLength={40}
              placeholder="Ex.: 2º ano A ou Pré II"
              value={values.classroom ?? ''}
              onChange={(e) => set('classroom', e.target.value)}
            />
          </label>
          <label>
            Matéria / Disciplina
            <input
              type="text"
              maxLength={45}
              placeholder="Ex.: Língua Portuguesa"
              value={values.subject ?? ''}
              onChange={(e) => set('subject', e.target.value)}
            />
          </label>
          <label>
            Data
            <input
              type="date"
              value={values.date ?? ''}
              onChange={(e) => set('date', e.target.value)}
            />
          </label>
        </div>

        <div className="task-toggles">
          <label className="check">
            <input
              type="checkbox"
              checked={cfg.showGrade}
              onChange={(e) => set('showGrade', e.target.checked ? 'yes' : 'no')}
            />
            Mostrar quadro de Nota / Valor no cabeçalho
          </label>
          {cfg.showGrade && (
            <label className="task-inline-input">
              Valor total
              <input
                type="text"
                maxLength={12}
                value={cfg.totalValue}
                onChange={(e) => set('totalValue', e.target.value)}
              />
            </label>
          )}
          <label className="check">
            <input
              type="checkbox"
              checked={cfg.sheetFont === 'andika'}
              onChange={(e) => set('sheetFont', e.target.checked ? 'andika' : 'noto')}
            />
            Usar letra de alfabetização (Andika)
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={cfg.uppercase}
              onChange={(e) => set('uppercase', e.target.checked ? 'yes' : 'no')}
            />
            TUDO EM CAIXA ALTA (letra bastão)
          </label>
        </div>

        <details className="hints-box">
          <summary>Logotipo da escola ou figura no cabeçalho</summary>
          <div className="hints-controls">
            <label>
              Figura decorativa pronta
              <select
                value={cfg.headerFigure}
                onChange={(e) => set('headerFigure', e.target.value)}
              >
                <option value="">Padrão do modelo</option>
                <option value="none">Sem figura</option>
                {figures.map((fig) => (
                  <option key={fig.id} value={fig.id}>
                    {fig.group} · {fig.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Ou envie o logotipo da escola (PNG ou JPG)
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={(e) => {
                  void handleLogoUpload(e.currentTarget.files?.[0])
                  e.currentTarget.value = ''
                }}
              />
            </label>
            {values.logoDataUrl && (
              <button
                type="button"
                className="secondary"
                onClick={() => set('logoDataUrl', '')}
              >
                Remover logotipo enviado
              </button>
            )}
          </div>
        </details>
      </fieldset>

      <fieldset className="task-section-box">
        <legend>2. Questões e espaço para o aluno responder</legend>

        <div className="task-question-list">
          {questions.map((q, index) => {
            if (q.kind !== 'section') runningNumber += 1
            const qTitle =
              q.kind === 'section'
                ? 'Texto de apoio / orientação'
                : `Questão ${runningNumber} · ${kindLabels[q.kind]}`

            return (
              <article className="task-q-card" key={q.id}>
                <div className="task-q-head">
                  <strong>{qTitle}</strong>
                  <div className="task-q-actions">
                    <button
                      type="button"
                      className="secondary"
                      aria-label={`Subir ${qTitle}`}
                      disabled={index === 0}
                      onClick={() => moveQuestion(index, -1)}
                    >
                      <ArrowUp size={15} aria-hidden="true" /> Subir
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      aria-label={`Descer ${qTitle}`}
                      disabled={index === questions.length - 1}
                      onClick={() => moveQuestion(index, 1)}
                    >
                      <ArrowDown size={15} aria-hidden="true" /> Descer
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      aria-label={`Duplicar ${qTitle}`}
                      onClick={() => duplicateQuestion(index)}
                    >
                      <Copy size={15} aria-hidden="true" /> Duplicar
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      aria-label={`Remover ${qTitle}`}
                      disabled={questions.length <= 1}
                      onClick={() => removeQuestion(index)}
                    >
                      <Trash2 size={15} aria-hidden="true" /> Remover
                    </button>
                  </div>
                </div>

                <label>
                  {q.kind === 'section' ? 'Texto ou orientação' : 'Enunciado da questão'}
                  <textarea
                    rows={q.kind === 'section' ? 3 : 2}
                    maxLength={450}
                    value={q.prompt}
                    onChange={(e) => patchQuestion(index, { prompt: e.target.value })}
                  />
                </label>

                {q.kind !== 'section' && cfg.showGrade && (
                  <label className="task-inline-input">
                    Valor desta questão (opcional)
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="Ex.: 2,0 pts"
                      value={q.points ?? ''}
                      onChange={(e) => patchQuestion(index, { points: e.target.value })}
                    />
                  </label>
                )}

                {q.kind === 'lines' && (
                  <div className="school-form-grid">
                    <label>
                      Quantidade de linhas
                      <select
                        value={q.lines ?? 4}
                        onChange={(e) =>
                          patchQuestion(index, { lines: Number(e.target.value) })
                        }
                      >
                        {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? 'linha' : 'linhas'}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Estilo das linhas
                      <select
                        value={q.lineStyle ?? 'simples'}
                        onChange={(e) =>
                          patchQuestion(index, {
                            lineStyle: e.target.value === 'caligrafia' ? 'caligrafia' : 'simples',
                          })
                        }
                      >
                        <option value="simples">Linha simples (pautada)</option>
                        <option value="caligrafia">Pauta caligráfica (3 linhas)</option>
                      </select>
                    </label>
                  </div>
                )}

                {q.kind === 'space' && (
                  <div className="school-form-grid">
                    <label>
                      Tamanho do espaço livre
                      <select
                        value={q.spaceSize ?? 'medio'}
                        onChange={(e) =>
                          patchQuestion(index, {
                            spaceSize: e.target.value as 'pequeno' | 'medio' | 'grande',
                          })
                        }
                      >
                        <option value="pequeno">Pequeno (cálculo curto)</option>
                        <option value="medio">Médio (desenho ou conta)</option>
                        <option value="grande">Grande (ilustração livre)</option>
                      </select>
                    </label>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={q.framed !== false}
                        onChange={(e) => patchQuestion(index, { framed: e.target.checked })}
                      />
                      Desenhar moldura pontilhada ao redor
                    </label>
                  </div>
                )}

                {(q.kind === 'choice' || q.kind === 'tf') && (
                  <div className="task-sublist">
                    <p className="task-sublist-label">
                      {q.kind === 'choice' ? 'Alternativas:' : 'Afirmações (V ou F):'}
                    </p>
                    {(q.options ?? []).map((opt, optIdx) => (
                      <div className="task-sublist-row" key={optIdx}>
                        <input
                          type="text"
                          aria-label={
                            q.kind === 'choice'
                              ? `Alternativa ${optIdx + 1}`
                              : `Afirmação ${optIdx + 1}`
                          }
                          maxLength={140}
                          value={opt}
                          onChange={(e) => {
                            const nextOpts = [...(q.options ?? [])]
                            nextOpts[optIdx] = e.target.value
                            patchQuestion(index, { options: nextOpts })
                          }}
                        />
                        <button
                          type="button"
                          className="secondary"
                          aria-label="Remover opção"
                          disabled={(q.options ?? []).length <= 2}
                          onClick={() =>
                            patchQuestion(index, {
                              options: (q.options ?? []).filter((_, j) => j !== optIdx),
                            })
                          }
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="secondary"
                      disabled={(q.options ?? []).length >= 8}
                      onClick={() =>
                        patchQuestion(index, {
                          options: [
                            ...(q.options ?? []),
                            q.kind === 'choice' ? 'Nova alternativa' : 'Nova afirmação.',
                          ],
                        })
                      }
                    >
                      <Plus size={15} aria-hidden="true" />{' '}
                      {q.kind === 'choice' ? 'Adicionar alternativa' : 'Adicionar afirmação'}
                    </button>
                  </div>
                )}

                {q.kind === 'match' && (
                  <div className="task-sublist">
                    <p className="task-sublist-label">Pares das colunas:</p>
                    {(q.pairs ?? []).map(([left, right], pairIdx) => (
                      <div className="task-pair-row" key={pairIdx}>
                        <input
                          type="text"
                          aria-label={`Coluna A par ${pairIdx + 1}`}
                          maxLength={60}
                          value={left}
                          onChange={(e) => {
                            const nextPairs = [...(q.pairs ?? [])]
                            nextPairs[pairIdx] = [e.target.value, right]
                            patchQuestion(index, { pairs: nextPairs })
                          }}
                        />
                        <span aria-hidden="true">↔</span>
                        <input
                          type="text"
                          aria-label={`Coluna B par ${pairIdx + 1}`}
                          maxLength={60}
                          value={right}
                          onChange={(e) => {
                            const nextPairs = [...(q.pairs ?? [])]
                            nextPairs[pairIdx] = [left, e.target.value]
                            patchQuestion(index, { pairs: nextPairs })
                          }}
                        />
                        <button
                          type="button"
                          className="secondary"
                          aria-label="Remover par"
                          disabled={(q.pairs ?? []).length <= 2}
                          onClick={() =>
                            patchQuestion(index, {
                              pairs: (q.pairs ?? []).filter((_, j) => j !== pairIdx),
                            })
                          }
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="secondary"
                      disabled={(q.pairs ?? []).length >= 6}
                      onClick={() =>
                        patchQuestion(index, {
                          pairs: [...(q.pairs ?? []), ['Novo item', 'Correspondente']],
                        })
                      }
                    >
                      <Plus size={15} aria-hidden="true" /> Adicionar par
                    </button>
                  </div>
                )}

                <details className="hints-box">
                  <summary>Figura ou imagem nesta questão (opcional)</summary>
                  <div className="hints-controls">
                    <label>
                      Figura da biblioteca
                      <select
                        value={q.figure ?? ''}
                        onChange={(e) =>
                          patchQuestion(index, { figure: e.target.value || undefined })
                        }
                      >
                        <option value="">Nenhuma</option>
                        {figures.map((fig) => (
                          <option key={fig.id} value={fig.id}>
                            {fig.group} · {fig.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Ou enviar imagem do aparelho
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp"
                        onChange={(e) => {
                          void handleQuestionImage(index, e.currentTarget.files?.[0])
                          e.currentTarget.value = ''
                        }}
                      />
                    </label>
                    {(q.figure || q.imageDataUrl) && (
                      <button
                        type="button"
                        className="secondary"
                        onClick={() =>
                          patchQuestion(index, { figure: undefined, imageDataUrl: undefined })
                        }
                      >
                        Remover figura da questão
                      </button>
                    )}
                  </div>
                </details>
              </article>
            )
          })}
        </div>

        <div className="task-add-bar" role="group" aria-label="Adicionar nova questão">
          {(
            [
              ['lines', '+ Com linhas'],
              ['space', '+ Espaço desenho/cálculo'],
              ['choice', '+ Múltipla escolha'],
              ['tf', '+ Verdadeiro / Falso'],
              ['match', '+ Ligue as colunas'],
              ['section', '+ Texto de apoio'],
            ] as [TaskQuestionKind, string][]
          ).map(([kind, label]) => (
            <button
              key={kind}
              type="button"
              className="secondary"
              disabled={questions.length >= 30}
              onClick={() => addQuestion(kind)}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
